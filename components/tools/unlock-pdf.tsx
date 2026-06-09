"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { toast } from "sonner"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { downloadBlob, baseName } from "@/lib/pdf-utils"

export function UnlockPdf() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (files.length === 0) {
      toast.error(t("common.needFile"))
      return
    }
    setBusy(true)
    try {
      const file = files[0]
      const bytes = await file.arrayBuffer()
      // ignoreEncryption lets pdf-lib open files protected only by an owner
      // password (permission restrictions). Re-saving drops the encryption.
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const out = await doc.save()
      downloadBlob(out, `${baseName(file.name)}-unlocked.pdf`)
      toast.success(t("common.done"))
    } catch (e) {
      console.log("[v0] unlock error", e)
      toast.error(t("unlock.error"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone files={files} onFiles={setFiles} />
      <p className="text-sm text-muted-foreground text-pretty">{t("unlock.note")}</p>
      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("common.run")}
      </Button>
    </div>
  )
}
