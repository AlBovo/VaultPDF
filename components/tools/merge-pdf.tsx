"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { toast } from "sonner"
import { ArrowUp, ArrowDown } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { downloadBlob } from "@/lib/pdf-utils"

export function MergePdf() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= files.length) return
    const next = [...files]
    ;[next[i], next[j]] = [next[j], next[i]]
    setFiles(next)
  }

  const run = async () => {
    if (files.length < 2) {
      toast.error("Add at least two PDFs to merge.")
      return
    }
    setBusy(true)
    try {
      const merged = await PDFDocument.create()
      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
        const pages = await merged.copyPages(doc, doc.getPageIndices())
        pages.forEach((p) => merged.addPage(p))
      }
      const out = await merged.save()
      downloadBlob(out, "vaultpdf-merged.pdf")
      toast.success("Merged PDF ready.")
    } catch (e) {
      console.log("[v0] merge error", e)
      toast.error("Could not merge these files.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone multiple files={files} onFiles={setFiles} />

      {files.length > 1 && (
        <p className="text-sm text-muted-foreground">
          {"Drag to reorder isn't required — use the arrows to set the page order."}
        </p>
      )}
      {files.length > 1 && (
        <ul className="flex flex-col gap-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-xs font-medium text-primary">
                {i + 1}
              </span>
              <span className="flex-1 truncate">{f.name}</span>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === files.length - 1}
                aria-label="Move down"
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={run} disabled={busy || files.length < 2} size="lg">
        {busy ? t("common.processing") : t("common.run")}
      </Button>
    </div>
  )
}
