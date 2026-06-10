"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ArrowUpDown, Download, GripVertical, ChevronLeft, ChevronRight } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, getPdfjs } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

type PageThumb = { index: number; dataUrl: string }

export function ReorderPages() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "processing" | "done" | "error">("idle")
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [thumbs, setThumbs] = useState<PageThumb[]>([])
  const [order, setOrder] = useState<number[]>([])
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  const loadPdf = async (fileList: File[]) => {
    setFiles(fileList)
    if (fileList.length === 0) return
    setStatus("loading")
    setError("")
    try {
      const pdfjsLib = await getPdfjs()
      const buf = await fileList[0].arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise
      const ts: PageThumb[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const vp = page.getViewport({ scale: 0.3 })
        const canvas = document.createElement("canvas")
        canvas.width = vp.width
        canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise
        ts.push({ index: i - 1, dataUrl: canvas.toDataURL("image/jpeg", 0.6) })
      }
      setThumbs(ts)
      setOrder(ts.map((_, i) => i))
      setStatus("ready")
    } catch {
      setError("Could not load PDF")
      setStatus("error")
    }
  }

  const handleDragStart = (idx: number) => { dragItem.current = idx }
  const handleDragEnter = (idx: number) => { dragOver.current = idx }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return
    const newOrder = [...order]
    const dragged = newOrder.splice(dragItem.current, 1)[0]
    newOrder.splice(dragOver.current, 0, dragged)
    setOrder(newOrder)
    dragItem.current = null
    dragOver.current = null
  }

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return
    const newOrder = [...order]
    const item = newOrder.splice(from, 1)[0]
    newOrder.splice(to, 0, item)
    setOrder(newOrder)
  }

  const apply = async () => {
    const file = files[0]
    if (!file) return
    setStatus("processing")
    setProgress(10)
    try {
      const { PDFDocument } = await import("pdf-lib")
      const buf = await file.arrayBuffer()
      const src = await PDFDocument.load(buf)
      const doc = await PDFDocument.create()
      setProgress(30)
      for (let i = 0; i < order.length; i++) {
        const [page] = await doc.copyPages(src, [order[i]])
        doc.addPage(page)
        setProgress(30 + Math.round(((i + 1) / order.length) * 60))
      }
      const bytes = await doc.save()
      setProgress(100)
      setStatus("done")
      downloadBlob(new Uint8Array(bytes), `reordered_${file.name}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed")
      setStatus("error")
    }
  }

  const isChanged = order.some((v, i) => v !== i)

  return (
    <div className="flex flex-col gap-6">
      {status === "idle" && <Dropzone accept="application/pdf" files={files} onFiles={loadPdf} />}
      {status === "loading" && <p className="text-sm text-muted-foreground">{t("common.processing")}</p>}

      {(status === "ready" || status === "done") && (
        <>
          <p className="text-xs text-muted-foreground">Drag pages to reorder, or use the arrows.</p>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {order.map((pageIdx, pos) => {
              const thumb = thumbs[pageIdx]
              return (
                <div
                  key={`${pageIdx}-${pos}`}
                  draggable
                  onDragStart={() => handleDragStart(pos)}
                  onDragEnter={() => handleDragEnter(pos)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="group relative cursor-grab rounded-lg border border-border bg-card p-1 transition-shadow hover:shadow-md active:cursor-grabbing"
                >
                  <img src={thumb.dataUrl} alt={`Page ${pageIdx + 1}`} className="w-full rounded" draggable={false} />
                  <div className="mt-1 flex items-center justify-between px-0.5">
                    <button onClick={() => moveItem(pos, pos - 1)} disabled={pos === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <span className="text-[10px] font-medium text-muted-foreground">{pageIdx + 1}</span>
                    <button onClick={() => moveItem(pos, pos + 1)} disabled={pos === order.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <Button onClick={apply} disabled={!isChanged || status === "processing"} className="w-full">
            <ArrowUpDown className="mr-2 h-4 w-4" /> Apply new order & download
          </Button>
        </>
      )}

      {status === "processing" && (
        <div className="rounded-xl border border-border p-4">
          <div className="mb-2 flex justify-between text-sm"><span>{t("common.processing")}</span><span>{progress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {status === "done" && <p className="text-sm text-foreground">✓ Pages reordered!</p>}
    </div>
  )
}
