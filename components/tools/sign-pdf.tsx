"use client"

import { useRef, useState } from "react"
import { PDFDocument } from "pdf-lib"
import { toast } from "sonner"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n"
import { downloadBlob, baseName } from "@/lib/pdf-utils"

export function SignPdf() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)
  const [hasDrawn, setHasDrawn] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true
    const ctx = canvasRef.current!.getContext("2d")!
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    const { x, y } = pos(e)
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.strokeStyle = "#0f1b3d"
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }
  const end = () => {
    drawing.current = false
  }
  const clear = () => {
    const c = canvasRef.current!
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height)
    setHasDrawn(false)
  }

  const run = async () => {
    if (files.length === 0) {
      toast.error(t("common.needFile"))
      return
    }
    if (!hasDrawn) {
      toast.error(t("sign.needSig"))
      return
    }
    setBusy(true)
    try {
      const pngUrl = canvasRef.current!.toDataURL("image/png")
      const pngBytes = await fetch(pngUrl).then((r) => r.arrayBuffer())
      const bytes = await files[0].arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const png = await doc.embedPng(pngBytes)
      const pages = doc.getPages()
      const idx = Math.min(Math.max(1, page), pages.length) - 1
      const target = pages[idx]
      const { width } = target.getSize()
      const sigW = Math.min(220, width - 80)
      const sigH = (sigW / png.width) * png.height
      target.drawImage(png, { x: width - sigW - 40, y: 50, width: sigW, height: sigH })
      const out = await doc.save()
      downloadBlob(out, `${baseName(files[0].name)}-signed.pdf`)
      toast.success(t("common.done"))
    } catch (e) {
      console.log("[v0] sign error", e)
      toast.error(t("common.error"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone files={files} onFiles={setFiles} />

      <div className="flex flex-col gap-2">
        <Label>{t("sign.draw")}</Label>
        <canvas
          ref={canvasRef}
          width={500}
          height={180}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="w-full touch-none rounded-lg border border-border bg-card"
        />
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={clear}>
            {t("sign.clear")}
          </Button>
          <div className="flex items-center gap-2">
            <Label htmlFor="page" className="text-sm text-muted-foreground">
              {t("sign.page")}
            </Label>
            <Input
              id="page"
              type="number"
              min={1}
              value={page}
              onChange={(e) => setPage(Number.parseInt(e.target.value, 10) || 1)}
              className="w-20"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("sign.place")}</p>
      </div>

      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("sign.apply")}
      </Button>
    </div>
  )
}
