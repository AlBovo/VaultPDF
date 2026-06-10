"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  SquarePen, Type, ImagePlus, Download, Trash2,
  ChevronLeft, ChevronRight, MousePointer,
} from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { downloadBlob, baseName, getPdfjs } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

type TextAnnotation = {
  page: number
  x: number       // 0-1 relative
  y: number       // 0-1 relative
  text: string
  fontSize: number
  color: string
}

type ImageAnnotation = {
  page: number
  x: number       // 0-1 relative
  y: number       // 0-1 relative
  width: number   // 0-1 relative
  height: number  // 0-1 relative
  dataUrl: string
}

type Mode = "view" | "text" | "image"

export function EditPdf() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "processing" | "done" | "error">("idle")
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [mode, setMode] = useState<Mode>("text")
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([])
  const [imageAnnotations, setImageAnnotations] = useState<ImageAnnotation[]>([])
  const [pendingText, setPendingText] = useState("")
  const [fontSize, setFontSize] = useState(14)
  const [pendingImageData, setPendingImageData] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<any>(null)
  const scaleRef = useRef(1.5)

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfRef.current || !canvasRef.current) return
    const page = await pdfRef.current.getPage(pageNum)
    const scale = scaleRef.current
    const viewport = page.getViewport({ scale })
    const canvas = canvasRef.current
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")!
    await page.render({ canvasContext: ctx, viewport }).promise

    // Draw annotations overlay
    for (const ann of textAnnotations.filter((a) => a.page === pageNum)) {
      ctx.font = `${ann.fontSize * scale}px sans-serif`
      ctx.fillStyle = ann.color
      ctx.fillText(ann.text, ann.x * canvas.width, ann.y * canvas.height)
    }

    for (const ann of imageAnnotations.filter((a) => a.page === pageNum)) {
      const img = new Image()
      img.src = ann.dataUrl
      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.drawImage(
            img,
            ann.x * canvas.width,
            ann.y * canvas.height,
            ann.width * canvas.width,
            ann.height * canvas.height,
          )
          resolve()
        }
        img.onerror = () => resolve()
      })
    }
  }, [textAnnotations, imageAnnotations])

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
    setTextAnnotations([])
    setImageAnnotations([])
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (status !== "ready") return
    const rect = e.currentTarget.getBoundingClientRect()
    const rx = (e.clientX - rect.left) / rect.width
    const ry = (e.clientY - rect.top) / rect.height

    if (mode === "text") {
      const text = pendingText.trim()
      if (!text) return
      setTextAnnotations((prev) => [
        ...prev,
        { page: currentPage, x: rx, y: ry, text, fontSize, color: "#000000" },
      ])
      setPendingText("")
    } else if (mode === "image" && pendingImageData) {
      setImageAnnotations((prev) => [
        ...prev,
        { page: currentPage, x: rx, y: ry, width: 0.2, height: 0.15, dataUrl: pendingImageData },
      ])
      setPendingImageData(null)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPendingImageData(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeTextAnnotation = (idx: number) => {
    setTextAnnotations((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeImageAnnotation = (idx: number) => {
    setImageAnnotations((prev) => prev.filter((_, i) => i !== idx))
  }

  const applyAndDownload = async () => {
    const file = files[0]
    if (!file) return
    setStatus("processing")
    setProgress(10)
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib")
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf)
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pages = doc.getPages()
      setProgress(30)

      // Apply text annotations
      for (const ann of textAnnotations) {
        if (ann.page < 1 || ann.page > pages.length) continue
        const page = pages[ann.page - 1]
        const { width, height } = page.getSize()
        page.drawText(ann.text, {
          x: ann.x * width,
          y: height - ann.y * height,
          size: ann.fontSize,
          font,
          color: rgb(0, 0, 0),
        })
      }
      setProgress(50)

      // Apply image annotations
      for (const ann of imageAnnotations) {
        if (ann.page < 1 || ann.page > pages.length) continue
        const page = pages[ann.page - 1]
        const { width, height } = page.getSize()

        // Convert dataUrl to bytes
        const response = await fetch(ann.dataUrl)
        const imgBytes = new Uint8Array(await response.arrayBuffer())

        let image
        if (ann.dataUrl.includes("image/png")) {
          image = await doc.embedPng(imgBytes)
        } else {
          image = await doc.embedJpg(imgBytes)
        }

        page.drawImage(image, {
          x: ann.x * width,
          y: height - (ann.y + ann.height) * height,
          width: ann.width * width,
          height: ann.height * height,
        })
      }

      setProgress(80)
      const bytes = await doc.save()
      setProgress(100)
      setStatus("done")
      downloadBlob(new Uint8Array(bytes), `edited_${file.name}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to apply edits")
      setStatus("error")
    }
  }

  const totalAnnotations = textAnnotations.length + imageAnnotations.length
  const pageTextAnns = textAnnotations.filter((a) => a.page === currentPage)
  const pageImgAnns = imageAnnotations.filter((a) => a.page === currentPage)

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
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={mode === "view" ? "default" : "outline"} size="sm" onClick={() => setMode("view")}>
              <MousePointer className="mr-1 h-3.5 w-3.5" /> View
            </Button>
            <Button variant={mode === "text" ? "default" : "outline"} size="sm" onClick={() => setMode("text")}>
              <Type className="mr-1 h-3.5 w-3.5" /> Add Text
            </Button>
            <Button variant={mode === "image" ? "default" : "outline"} size="sm" onClick={() => setMode("image")}>
              <ImagePlus className="mr-1 h-3.5 w-3.5" /> Add Image
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">{currentPage}/{pageCount}</span>
              <Button variant="outline" size="icon" disabled={currentPage >= pageCount} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mode-specific inputs */}
          {mode === "text" && (
            <div className="flex gap-2">
              <Input
                placeholder="Type text, then click on the page to place it…"
                value={pendingText}
                onChange={(e) => setPendingText(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min={8}
                max={72}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-20"
                title="Font size"
              />
            </div>
          )}

          {mode === "image" && (
            <div>
              <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} className="text-sm" />
              {pendingImageData && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Image loaded. Click on the page to place it.
                </p>
              )}
            </div>
          )}

          {/* Canvas */}
          <div
            className="overflow-hidden rounded-xl border border-border"
            style={{ cursor: mode === "view" ? "default" : "crosshair" }}
          >
            <canvas ref={canvasRef} className="block w-full" onClick={handleCanvasClick} />
          </div>

          {/* Annotations list */}
          {(pageTextAnns.length > 0 || pageImgAnns.length > 0) && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Annotations on this page
              </p>
              <div className="space-y-1">
                {pageTextAnns.map((ann, i) => {
                  const globalIdx = textAnnotations.indexOf(ann)
                  return (
                    <div key={`t-${i}`} className="flex items-center gap-2 text-sm">
                      <Type className="h-3.5 w-3.5 text-primary" />
                      <span className="flex-1 truncate">{ann.text}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTextAnnotation(globalIdx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
                {pageImgAnns.map((ann, i) => {
                  const globalIdx = imageAnnotations.indexOf(ann)
                  return (
                    <div key={`i-${i}`} className="flex items-center gap-2 text-sm">
                      <ImagePlus className="h-3.5 w-3.5 text-primary" />
                      <span className="flex-1 truncate">Image overlay</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeImageAnnotation(globalIdx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Button onClick={applyAndDownload} disabled={totalAnnotations === 0 || status === "processing"} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Apply {totalAnnotations} edit{totalAnnotations !== 1 ? "s" : ""} & download
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
        <p className="text-sm text-foreground">✓ Edited PDF downloaded!</p>
      )}
    </div>
  )
}
