"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { toast } from "sonner"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n"
import { downloadBlob, baseName, parsePageRanges } from "@/lib/pdf-utils"

export function SplitPdf() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
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
      const indices = ranges.trim()
        ? parsePageRanges(ranges, count)
        : doc.getPageIndices()
      if (indices.length === 0) {
        toast.error("No valid pages in that range.")
        return
      }
      const out = await PDFDocument.create()
      const pages = await out.copyPages(doc, indices)
      pages.forEach((p) => out.addPage(p))
      const data = await out.save()
      downloadBlob(data, `${baseName(file.name)}-extracted.pdf`)
      toast.success(`Extracted ${indices.length} page(s).`)
    } catch (e) {
      console.log("[v0] split error", e)
      toast.error("Could not process this PDF.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone files={files} onFiles={setFiles} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="ranges">
          {"Pages to extract (e.g. 1-3, 5, 8). Leave empty for all."}
        </Label>
        <Input
          id="ranges"
          value={ranges}
          onChange={(e) => setRanges(e.target.value)}
          placeholder="1-3, 5, 8-10"
        />
      </div>
      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("common.run")}
      </Button>
    </div>
  )
}
