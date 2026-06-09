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

export function RemovePages() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [ranges, setRanges] = useState("")
  const [busy, setBusy] = useState(false)

  const run = async () => {
    const file = files[0]
    if (!file) return
    if (!ranges.trim()) {
      toast.error("Specify which pages to remove.")
      return
    }
    setBusy(true)
    try {
      const bytes = await file.arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const count = doc.getPageCount()
      const remove = new Set(parsePageRanges(ranges, count))
      if (remove.size >= count) {
        toast.error("That would remove every page.")
        return
      }
      // remove from the end to keep indices valid
      const sorted = Array.from(remove).sort((a, b) => b - a)
      for (const idx of sorted) doc.removePage(idx)
      const data = await doc.save()
      downloadBlob(data, `${baseName(file.name)}-trimmed.pdf`)
      toast.success(`Removed ${remove.size} page(s).`)
    } catch (e) {
      console.log("[v0] remove pages error", e)
      toast.error("Could not process this PDF.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone files={files} onFiles={setFiles} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="ranges">{"Pages to remove (e.g. 2, 4-6)"}</Label>
        <Input
          id="ranges"
          value={ranges}
          onChange={(e) => setRanges(e.target.value)}
          placeholder="2, 4-6"
        />
      </div>
      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("common.run")}
      </Button>
    </div>
  )
}
