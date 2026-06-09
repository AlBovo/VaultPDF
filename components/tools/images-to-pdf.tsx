"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { toast } from "sonner"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { downloadBlob } from "@/lib/pdf-utils"

export function ImagesToPdf() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (files.length === 0) return
    setBusy(true)
    try {
      const doc = await PDFDocument.create()
      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const isPng = file.type.includes("png")
        const img = isPng
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes)
        const page = doc.addPage([img.width, img.height])
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
      }
      const data = await doc.save()
      downloadBlob(data, "vaultpdf-images.pdf")
      toast.success("PDF created from images.")
    } catch (e) {
      console.log("[v0] images-to-pdf error", e)
      toast.error("Only JPG and PNG images are supported.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        accept="image/png,image/jpeg"
        multiple
        files={files}
        onFiles={setFiles}
      />
      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("common.run")}
      </Button>
    </div>
  )
}
