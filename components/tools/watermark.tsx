"use client"

import { useState } from "react"
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib"
import { toast } from "sonner"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useI18n } from "@/lib/i18n"
import { downloadBlob, baseName } from "@/lib/pdf-utils"

export function Watermark() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState("CONFIDENTIAL")
  const [opacity, setOpacity] = useState([20])
  const [size, setSize] = useState([48])
  const [busy, setBusy] = useState(false)

  const run = async () => {
    const file = files[0]
    if (!file) return
    if (!text.trim()) {
      toast.error("Enter watermark text.")
      return
    }
    setBusy(true)
    try {
      const bytes = await file.arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const font = await doc.embedFont(StandardFonts.HelveticaBold)
      const fontSize = size[0]
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize()
        const textWidth = font.widthOfTextAtSize(text, fontSize)
        page.drawText(text, {
          x: width / 2 - textWidth / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.3, 0.36, 0.55),
          opacity: opacity[0] / 100,
          rotate: degrees(45),
        })
      }
      const data = await doc.save()
      downloadBlob(data, `${baseName(file.name)}-watermarked.pdf`)
      toast.success("Watermark applied.")
    } catch (e) {
      console.log("[v0] watermark error", e)
      toast.error("Could not process this PDF.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone files={files} onFiles={setFiles} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="wm">{"Watermark text"}</Label>
        <Input id="wm" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>{`Opacity: ${opacity[0]}%`}</Label>
          <Slider value={opacity} onValueChange={setOpacity} min={5} max={100} step={5} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{`Font size: ${size[0]}pt`}</Label>
          <Slider value={size} onValueChange={setSize} min={16} max={120} step={2} />
        </div>
      </div>
      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("common.run")}
      </Button>
    </div>
  )
}
