"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { toast } from "sonner"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { downloadBlob, baseName } from "@/lib/pdf-utils"

export function CompressPdf() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ before: number; after: number } | null>(null)

  const run = async () => {
    if (files.length === 0) {
      toast.error(t("common.needFile"))
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const file = files[0]
      const bytes = await file.arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      // Re-serialize with object streams enabled, which removes redundant
      // structures and unreferenced objects, shrinking most real-world PDFs.
      const out = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      setResult({ before: bytes.byteLength, after: out.byteLength })
      downloadBlob(out, `${baseName(file.name)}-compressed.pdf`)
      toast.success(t("common.done"))
    } catch (e) {
      console.log("[v0] compress error", e)
      toast.error(t("common.error"))
    } finally {
      setBusy(false)
    }
  }

  const pct =
    result && result.before > 0
      ? Math.max(0, Math.round((1 - result.after / result.before) * 100))
      : 0

  return (
    <div className="flex flex-col gap-5">
      <Dropzone files={files} onFiles={setFiles} />

      {result && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("compress.before")}</span>
            <span>{(result.before / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">{t("compress.after")}</span>
            <span className="font-medium">{(result.after / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="mt-2 text-primary">{t("compress.saved").replace("{pct}", String(pct))}</div>
        </div>
      )}

      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("common.run")}
      </Button>
    </div>
  )
}
