"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { toast } from "sonner"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { downloadBlob, baseName } from "@/lib/pdf-utils"

export function StripMetadata() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)

  const run = async () => {
    const file = files[0]
    if (!file) return
    setBusy(true)
    try {
      const bytes = await file.arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      doc.setTitle("")
      doc.setAuthor("")
      doc.setSubject("")
      doc.setKeywords([])
      doc.setProducer("")
      doc.setCreator("")
      const epoch = new Date(0)
      doc.setCreationDate(epoch)
      doc.setModificationDate(epoch)
      const data = await doc.save()
      downloadBlob(data, `${baseName(file.name)}-clean.pdf`)
      toast.success("Metadata stripped.")
    } catch (e) {
      console.log("[v0] strip metadata error", e)
      toast.error("Could not process this PDF.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone files={files} onFiles={setFiles} />
      <p className="text-sm text-muted-foreground text-pretty">
        {"Removes author, title, subject, keywords, creator, producer and timestamps."}
      </p>
      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("common.run")}
      </Button>
    </div>
  )
}
