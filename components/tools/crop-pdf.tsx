"use client"

import { useState } from "react"
import { Crop, Download } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { downloadBlob } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

export function CropPdf() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [top, setTop] = useState(0)
  const [bottom, setBottom] = useState(0)
  const [left, setLeft] = useState(0)
  const [right, setRight] = useState(0)

  const apply = async () => {
    const file = files[0]
    if (!file) return
    setStatus("processing")
    setProgress(10)
    setError("")
    try {
      const { PDFDocument } = await import("pdf-lib")
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf)
      const pages = doc.getPages()
      setProgress(30)
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const { width, height } = page.getSize()
        page.setCropBox(left, bottom, width - left - right, height - top - bottom)
        setProgress(30 + Math.round(((i + 1) / pages.length) * 60))
      }
      const bytes = await doc.save()
      setProgress(100)
      setStatus("done")
      downloadBlob(new Uint8Array(bytes), `cropped_${file.name}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed")
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />
      {files.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Margins to crop (points, 1 inch = 72pt)</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Top</label>
              <Input type="number" min={0} value={top} onChange={(e) => setTop(Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Bottom</label>
              <Input type="number" min={0} value={bottom} onChange={(e) => setBottom(Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Left</label>
              <Input type="number" min={0} value={left} onChange={(e) => setLeft(Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Right</label>
              <Input type="number" min={0} value={right} onChange={(e) => setRight(Number(e.target.value))} />
            </div>
          </div>
        </div>
      )}
      {status === "processing" && (
        <div className="rounded-xl border border-border p-4">
          <div className="mb-2 flex justify-between text-sm"><span>{t("common.processing")}</span><span>{progress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {status === "done" && <p className="text-sm text-foreground">✓ PDF cropped!</p>}
      <Button onClick={apply} disabled={files.length === 0 || status === "processing" || (top === 0 && bottom === 0 && left === 0 && right === 0)} className="w-full">
        <Crop className="mr-2 h-4 w-4" /> Crop PDF
      </Button>
    </div>
  )
}
