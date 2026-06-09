"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n"
import { downloadBlob, baseName, getPdfjs } from "@/lib/pdf-utils"

export function PdfToImages() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [scale, setScale] = useState([2])
  const [busy, setBusy] = useState(false)

  const run = async () => {
    const file = files[0]
    if (!file) return
    setBusy(true)
    try {
      const pdfjs = await getPdfjs()
      const data = new Uint8Array(await file.arrayBuffer())
      const pdf = await pdfjs.getDocument({ data }).promise
      const name = baseName(file.name)
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: scale[0] })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")!
        await page.render({ canvas, canvasContext: ctx, viewport }).promise
        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png"),
        )
        downloadBlob(blob, `${name}-page-${i}.png`)
        // small delay so the browser queues each download
        await new Promise((r) => setTimeout(r, 150))
      }
      toast.success(`Exported ${pdf.numPages} image(s).`)
    } catch (e) {
      console.log("[v0] pdf-to-images error", e)
      toast.error("Could not render this PDF.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone files={files} onFiles={setFiles} />
      <div className="flex flex-col gap-2">
        <Label>{`Resolution scale: ${scale[0]}x`}</Label>
        <Slider value={scale} onValueChange={setScale} min={1} max={4} step={0.5} />
      </div>
      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("common.run")}
      </Button>
      <p className="text-xs text-muted-foreground">
        {"Each page downloads as a separate PNG file."}
      </p>
    </div>
  )
}
