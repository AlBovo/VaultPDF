"use client"

import { useState } from "react"
import { Presentation, Download } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { downloadBlob, baseName } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function compressImage(
  blob: Blob,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (result) => resolve(result ?? blob),
        "image/jpeg",
        quality,
      )
    }
    img.onerror = () => resolve(blob)
    img.src = URL.createObjectURL(blob)
  })
}

export function CompressPpt() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [quality, setQuality] = useState(0.6)
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)

  const compress = async () => {
    const file = files[0]
    if (!file) return
    setStatus("processing")
    setProgress(10)
    setError("")
    setOriginalSize(file.size)

    try {
      const JSZip = (await import("jszip")).default
      const zip = await JSZip.loadAsync(await file.arrayBuffer())
      setProgress(20)

      const mediaFiles = Object.keys(zip.files).filter(
        (name) =>
          name.startsWith("ppt/media/") &&
          /\.(png|jpg|jpeg|gif|bmp)$/i.test(name),
      )

      if (mediaFiles.length === 0) {
        setError("No compressible images found inside this .pptx file.")
        setStatus("error")
        return
      }

      let processed = 0
      for (const path of mediaFiles) {
        const data = await zip.file(path)!.async("blob")
        const compressed = await compressImage(data, quality)
        zip.file(path, compressed)
        processed++
        setProgress(20 + Math.round((processed / mediaFiles.length) * 70))
      }

      const result = await zip.generateAsync({ type: "blob" })
      setCompressedSize(result.size)
      setProgress(100)
      setStatus("done")
      downloadBlob(result, `compressed_${file.name}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Compression failed")
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-accent/30 p-4 text-sm text-muted-foreground">
        <Presentation className="mb-1 inline h-4 w-4 text-primary" />{" "}
        Only <strong>.pptx</strong> files (Office Open XML) are supported. Legacy
        .ppt files cannot be processed client-side.
      </div>

      <Dropzone
        accept="application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx"
        files={files}
        onFiles={setFiles}
      />

      {files.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium">
            Image quality: {Math.round(quality * 100)}%
          </label>
          <Slider
            min={0.1}
            max={1}
            step={0.05}
            value={quality}
            onValueChange={setQuality}
          />
        </div>
      )}

      {status === "processing" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>{t("common.processing")}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">✓ Compression complete!</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatBytes(originalSize)} → {formatBytes(compressedSize)} (
            {Math.round((1 - compressedSize / originalSize) * 100)}% reduction)
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        onClick={compress}
        disabled={files.length === 0 || status === "processing"}
        className="w-full"
      >
        <Download className="mr-2 h-4 w-4" />
        Compress PPTX
      </Button>
    </div>
  )
}
