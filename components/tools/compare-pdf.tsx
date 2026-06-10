"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { GitCompare, ChevronLeft, ChevronRight } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { getPdfjs } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

type ViewMode = "side-by-side" | "overlay"

export function ComparePdf() {
  const { t } = useI18n()
  const [filesA, setFilesA] = useState<File[]>([])
  const [filesB, setFilesB] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [maxPages, setMaxPages] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side")
  const pdfA = useRef<any>(null)
  const pdfB = useRef<any>(null)
  const canvasARef = useRef<HTMLCanvasElement>(null)
  const canvasBRef = useRef<HTMLCanvasElement>(null)
  const diffCanvasRef = useRef<HTMLCanvasElement>(null)

  const loadBoth = async () => {
    if (filesA.length === 0 || filesB.length === 0) return
    setStatus("loading")
    setError("")
    try {
      const pdfjsLib = await getPdfjs()
      const [bufA, bufB] = await Promise.all([
        filesA[0].arrayBuffer(),
        filesB[0].arrayBuffer(),
      ])
      const [docA, docB] = await Promise.all([
        pdfjsLib.getDocument({ data: bufA }).promise,
        pdfjsLib.getDocument({ data: bufB }).promise,
      ])
      pdfA.current = docA
      pdfB.current = docB
      setMaxPages(Math.max(docA.numPages, docB.numPages))
      setCurrentPage(1)
      setStatus("ready")
    } catch {
      setError("Could not load one or both PDFs")
      setStatus("error")
    }
  }

  const renderPageToCanvas = useCallback(
    async (pdf: any, pageNum: number, canvas: HTMLCanvasElement | null) => {
      if (!pdf || !canvas) return
      if (pageNum > pdf.numPages) {
        canvas.width = 400
        canvas.height = 560
        const ctx = canvas.getContext("2d")!
        ctx.fillStyle = "#1a1a2e"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#666"
        ctx.font = "14px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("No page", canvas.width / 2, canvas.height / 2)
        return
      }
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.2 })
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext("2d")!
      await page.render({ canvasContext: ctx, viewport }).promise
    },
    [],
  )

  const computeDiff = useCallback(() => {
    if (!canvasARef.current || !canvasBRef.current || !diffCanvasRef.current) return
    const cA = canvasARef.current
    const cB = canvasBRef.current
    const diff = diffCanvasRef.current

    const w = Math.max(cA.width, cB.width)
    const h = Math.max(cA.height, cB.height)
    diff.width = w
    diff.height = h

    const ctxA = cA.getContext("2d")!
    const ctxB = cB.getContext("2d")!
    const ctxD = diff.getContext("2d")!

    const dataA = ctxA.getImageData(0, 0, cA.width, cA.height)
    const dataB = ctxB.getImageData(0, 0, cB.width, cB.height)
    const output = ctxD.createImageData(w, h)

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4

        // Get pixel from A
        let rA = 200, gA = 200, bA = 200
        if (x < cA.width && y < cA.height) {
          const iA = (y * cA.width + x) * 4
          rA = dataA.data[iA]
          gA = dataA.data[iA + 1]
          bA = dataA.data[iA + 2]
        }

        // Get pixel from B
        let rB = 200, gB = 200, bB = 200
        if (x < cB.width && y < cB.height) {
          const iB = (y * cB.width + x) * 4
          rB = dataB.data[iB]
          gB = dataB.data[iB + 1]
          bB = dataB.data[iB + 2]
        }

        const diff_val = Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA - bB)
        if (diff_val < 30) {
          // Same — grayscale
          const gray = Math.round((rA + gA + bA) / 3)
          output.data[idx] = gray
          output.data[idx + 1] = gray
          output.data[idx + 2] = gray
        } else {
          // Different — highlight in magenta
          output.data[idx] = 255
          output.data[idx + 1] = 0
          output.data[idx + 2] = 200
        }
        output.data[idx + 3] = 255
      }
    }

    ctxD.putImageData(output, 0, 0)
  }, [])

  const renderCurrentPage = useCallback(async () => {
    await Promise.all([
      renderPageToCanvas(pdfA.current, currentPage, canvasARef.current),
      renderPageToCanvas(pdfB.current, currentPage, canvasBRef.current),
    ])
    if (viewMode === "overlay") {
      computeDiff()
    }
  }, [currentPage, viewMode, renderPageToCanvas, computeDiff])

  useEffect(() => {
    if (status === "ready") {
      renderCurrentPage()
    }
  }, [status, renderCurrentPage])

  const hasBothFiles = filesA.length > 0 && filesB.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium">Original PDF</p>
          <Dropzone accept="application/pdf" files={filesA} onFiles={setFilesA} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Modified PDF</p>
          <Dropzone accept="application/pdf" files={filesB} onFiles={setFilesB} />
        </div>
      </div>

      {status === "idle" && hasBothFiles && (
        <Button onClick={loadBoth} className="w-full">
          <GitCompare className="mr-2 h-4 w-4" />
          Compare PDFs
        </Button>
      )}

      {status === "loading" && (
        <p className="text-sm text-muted-foreground">{t("common.processing")}</p>
      )}

      {status === "ready" && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "side-by-side" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("side-by-side")}
              >
                Side by side
              </Button>
              <Button
                variant={viewMode === "overlay" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("overlay")}
              >
                Overlay diff
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {currentPage} of {maxPages}
              </span>
              <Button variant="outline" size="icon" disabled={currentPage >= maxPages} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === "side-by-side" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-border">
                <p className="bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">Original</p>
                <canvas ref={canvasARef} className="block w-full" />
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <p className="bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">Modified</p>
                <canvas ref={canvasBRef} className="block w-full" />
              </div>
            </div>
          )}

          {viewMode === "overlay" && (
            <div className="overflow-hidden rounded-xl border border-border">
              <p className="bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                Differences highlighted in <span className="font-medium">magenta</span>
              </p>
              <canvas ref={diffCanvasRef} className="block w-full" />
              {/* Hidden render canvases */}
              <canvas ref={canvasARef} className="hidden" />
              <canvas ref={canvasBRef} className="hidden" />
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
