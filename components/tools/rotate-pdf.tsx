"use client"

import { useState } from "react"
import { PDFDocument, degrees } from "pdf-lib"
import { toast } from "sonner"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n"
import { downloadBlob, baseName, parsePageRanges } from "@/lib/pdf-utils"

export function RotatePdf() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [angle, setAngle] = useState("90")
  const [ranges, setRanges] = useState("")
  const [busy, setBusy] = useState(false)

  const run = async () => {
    const file = files[0]
    if (!file) return
    setBusy(true)
    try {
      const bytes = await file.arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const count = doc.getPageCount()
      const targets = ranges.trim()
        ? new Set(parsePageRanges(ranges, count))
        : new Set(doc.getPageIndices())
      const delta = Number.parseInt(angle, 10)
      doc.getPages().forEach((page, i) => {
        if (!targets.has(i)) return
        const current = page.getRotation().angle
        page.setRotation(degrees((current + delta) % 360))
      })
      const data = await doc.save()
      downloadBlob(data, `${baseName(file.name)}-rotated.pdf`)
      toast.success("Rotation applied.")
    } catch (e) {
      console.log("[v0] rotate error", e)
      toast.error("Could not process this PDF.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone files={files} onFiles={setFiles} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>{"Rotation"}</Label>
          <Select value={angle} onValueChange={setAngle}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90">90° clockwise</SelectItem>
              <SelectItem value="180">180°</SelectItem>
              <SelectItem value="270">90° counter-clockwise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ranges">{"Pages (empty = all)"}</Label>
          <Input
            id="ranges"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="1-2, 5"
          />
        </div>
      </div>
      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("common.run")}
      </Button>
    </div>
  )
}
