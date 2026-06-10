"use client"

import { useState } from "react"
import { Hash, Download } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { downloadBlob } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

type Position = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left"

export function PageNumbers() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [position, setPosition] = useState<Position>("bottom-center")
  const [fontSize, setFontSize] = useState(10)
  const [startNum, setStartNum] = useState(1)
  const [prefix, setPrefix] = useState("")

  const apply = async () => {
    const file = files[0]
    if (!file) return
    setStatus("processing")
    setProgress(10)
    setError("")
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf)
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pages = doc.getPages()
      setProgress(30)
      const margin = 30
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const { width, height } = page.getSize()
        const label = `${prefix}${startNum + i}`
        const tw = font.widthOfTextAtSize(label, fontSize)
        let x: number, y: number
        switch (position) {
          case "bottom-left": x = margin; y = margin; break
          case "bottom-center": x = (width - tw) / 2; y = margin; break
          case "bottom-right": x = width - tw - margin; y = margin; break
          case "top-left": x = margin; y = height - margin - fontSize; break
          case "top-center": x = (width - tw) / 2; y = height - margin - fontSize; break
          case "top-right": x = width - tw - margin; y = height - margin - fontSize; break
        }
        page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) })
        setProgress(30 + Math.round(((i + 1) / pages.length) * 60))
      }
      const bytes = await doc.save()
      setProgress(100)
      setStatus("done")
      downloadBlob(new Uint8Array(bytes), `numbered_${file.name}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed")
      setStatus("error")
    }
  }

  const positions: { value: Position; label: string }[] = [
    { value: "bottom-center", label: "Bottom center" },
    { value: "bottom-left", label: "Bottom left" },
    { value: "bottom-right", label: "Bottom right" },
    { value: "top-center", label: "Top center" },
    { value: "top-left", label: "Top left" },
    { value: "top-right", label: "Top right" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />
      {files.length > 0 && (
        <div className="space-y-4 rounded-xl border border-border p-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Position</label>
            <div className="flex flex-wrap gap-1.5">
              {positions.map((p) => (
                <button key={p.value} onClick={() => setPosition(p.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${position === p.value ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Font size</label>
              <Input type="number" min={6} max={36} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Start at</label>
              <Input type="number" min={1} value={startNum} onChange={(e) => setStartNum(Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Prefix</label>
              <Input placeholder="Page " value={prefix} onChange={(e) => setPrefix(e.target.value)} />
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
      {status === "done" && <p className="text-sm text-foreground">✓ Page numbers added!</p>}
      <Button onClick={apply} disabled={files.length === 0 || status === "processing"} className="w-full">
        <Hash className="mr-2 h-4 w-4" /> Add page numbers
      </Button>
    </div>
  )
}
