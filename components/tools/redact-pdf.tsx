"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { EyeOff, Download, Undo2, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, baseName, getPdfjs } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

type Rect = {
  page: number
  x: number
  y: number
  w: number
  h: number
}

export function RedactPdf() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "processing" | "done" | "error">("idle")
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [rects, setRects] = useState<Rect[]>([])
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<any>(null)
  const scaleRef = useRef(1)

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfRef.current || !canvasRef.current) return
    const page = await pdfRef.current.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.5 })
    scaleRef.current = 1.5
    const canvas = canvasRef.current
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")!
    await page.render({ canvasContext: ctx, viewport }).promise

    // Draw existing rects for this page
    if (overlayRef.current) {
      const overlay = overlayRef.current
      overlay.width = viewport.width
      overlay.height = viewport.height
      const octx = overlay.getContext("2d")!
      octx.clearRect(0, 0, overlay.width, overlay.height)
      for (const r of rects.filter((r) => r.page === pageNum)) {
        octx.fillStyle = "rgba(0, 0, 0, 0.5)"
        octx.fillRect(
          r.x * viewport.width,
          r.y * viewport.height,
          r.w * viewport.width,
          r.h * viewport.height,
        )
        octx.strokeStyle = "rgba(239, 68, 68, 0.8)"
        octx.lineWidth = 2
        octx.strokeRect(
          r.x * viewport.width,
          r.y * viewport.height,
          r.w * viewport.width,
          r.h * viewport.height,
        )
      }
    }
  }, [rects])

  useEffect(() => {
    if (status === "ready" || status === "done") {
      renderPage(currentPage)
    }
  }, [currentPage, status, renderPage])

  const loadPdf = async (fileList: File[]) => {
    setFiles(fileList)
    if (fileList.length === 0) return
    setStatus("loading")
    setError("")
    setRects([])
    try {
      const pdfjsLib = await getPdfjs()
      const buf = await fileList[0].arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise
      pdfRef.current = pdf
      setPageCount(pdf.numPages)
      setCurrentPage(1)
      setStatus("ready")
    } catch {
      setError("Could not load PDF")
      setStatus("error")
    }
  }

  const getRelativePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getRelativePos(e)
    setDrawing(pos)
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !overlayRef.current) return
    const pos = getRelativePos(e)
    const overlay = overlayRef.current
    const ctx = overlay.getContext("2d")!
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    // Draw existing rects
    for (const r of rects.filter((r) => r.page === currentPage)) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(r.x * overlay.width, r.y * overlay.height, r.w * overlay.width, r.h * overlay.height)
      ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"
      ctx.lineWidth = 2
      ctx.strokeRect(r.x * overlay.width, r.y * overlay.height, r.w * overlay.width, r.h * overlay.height)
    }

    // Draw current selection
    const x = Math.min(drawing.x, pos.x) * overlay.width
    const y = Math.min(drawing.y, pos.y) * overlay.height
    const w = Math.abs(pos.x - drawing.x) * overlay.width
    const h = Math.abs(pos.y - drawing.y) * overlay.height
    ctx.fillStyle = "rgba(239, 68, 68, 0.3)"
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)
  }

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    const pos = getRelativePos(e)
    const w = Math.abs(pos.x - drawing.x)
    const h = Math.abs(pos.y - drawing.y)
    if (w > 0.005 && h > 0.005) {
      setRects((prev) => [
        ...prev,
        {
          page: currentPage,
          x: Math.min(drawing.x, pos.x),
          y: Math.min(drawing.y, pos.y),
          w,
          h,
        },
      ])
    }
    setDrawing(null)
  }

  const undoLast = () => {
    setRects((prev) => {
      const last = [...prev].reverse().findIndex((r) => r.page === currentPage)
      if (last === -1) return prev
      const idx = prev.length - 1 - last
      return prev.filter((_, i) => i !== idx)
    })
  }

  const clearAll = () => setRects((prev) => prev.filter((r) => r.page !== currentPage))

  const applyRedaction = async () => {
    if (rects.length === 0 || !files[0]) return
    setStatus("processing")
    setProgress(10)
    try {
      const { PDFDocument, rgb } = await import("pdf-lib")
      const buf = await files[0].arrayBuffer()
      const doc = await PDFDocument.load(buf)
      const pages = doc.getPages()
      setProgress(30)

      for (const r of rects) {
        if (r.page < 1 || r.page > pages.length) continue
        const page = pages[r.page - 1]
        const { width, height } = page.getSize()
        // Canvas origin top-left → PDF origin bottom-left
        page.drawRectangle({
          x: r.x * width,
          y: height - (r.y + r.h) * height,
          width: r.w * width,
          height: r.h * height,
          color: rgb(0, 0, 0),
        })
      }

      setProgress(80)
      const bytes = await doc.save()
      setProgress(100)
      setStatus("done")
      downloadBlob(new Uint8Array(bytes), `redacted_${files[0].name}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Redaction failed")
      setStatus("error")
    }
  }

  const pageRects = rects.filter((r) => r.page === currentPage)

  return (
    <div className="flex flex-col gap-6">
      {status === "idle" && (
        <Dropzone accept="application/pdf" files={files} onFiles={loadPdf} />
      )}

      {status === "loading" && (
        <p className="text-sm text-muted-foreground">{t("common.processing")}</p>
      )}

      {(status === "ready" || status === "done") && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {currentPage} of {pageCount}
              </span>
              <Button variant="outline" size="icon" disabled={currentPage >= pageCount} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={undoLast} disabled={pageRects.length === 0}>
                <Undo2 className="mr-1 h-3.5 w-3.5" /> Undo
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} disabled={pageRects.length === 0}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Draw rectangles over areas to redact. {rects.length} redaction{rects.length !== 1 ? "s" : ""} total ({pageRects.length} on this page).
          </p>

          <div className="relative cursor-crosshair overflow-hidden rounded-xl border border-border">
            <canvas ref={canvasRef} className="block w-full" />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 block w-full"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={() => setDrawing(null)}
            />
          </div>

          <Button onClick={applyRedaction} disabled={rects.length === 0 || status === "processing"} className="w-full">
            <EyeOff className="mr-2 h-4 w-4" />
            Apply {rects.length} redaction{rects.length !== 1 ? "s" : ""} & download
          </Button>
        </>
      )}

      {status === "processing" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>{t("common.processing")}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status === "done" && (
        <p className="text-sm text-foreground">✓ Redacted PDF downloaded!</p>
      )}
    </div>
  )
}
