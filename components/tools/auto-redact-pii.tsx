"use client"

import { useState } from "react"
import { ShieldAlert, Download, Search } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { downloadBlob, getPdfjs } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

type PiiItem = {
  type: string
  value: string
  page: number
  // pdf-lib coordinates (bottom-left origin)
  x: number
  y: number
  width: number
  height: number
  enabled: boolean
}

const PII_PATTERNS: { type: string; label: string; regex: RegExp }[] = [
  { type: "email", label: "Email", regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g },
  { type: "phone", label: "Phone", regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g },
  { type: "ssn", label: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "card", label: "Credit Card", regex: /\b(?:\d{4}[- ]?){3}\d{4}\b/g },
]

export function AutoRedactPii() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "scanning" | "review" | "processing" | "done" | "error">("idle")
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [items, setItems] = useState<PiiItem[]>([])

  const scan = async () => {
    const file = files[0]
    if (!file) return
    setStatus("scanning")
    setProgress(10)
    setError("")
    setItems([])

    try {
      const pdfjsLib = await getPdfjs()
      const buf = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise
      const found: PiiItem[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const viewport = page.getViewport({ scale: 1 })

        for (const item of textContent.items) {
          if (!("str" in item) || !item.str) continue
          const text = item.str as string
          const tx = (item as any).transform
          if (!tx) continue

          for (const pattern of PII_PATTERNS) {
            const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
            let match: RegExpExecArray | null
            while ((match = regex.exec(text)) !== null) {
              // Approximate position: use the item's transform
              // tx[4] = x, tx[5] = y (PDF coordinates, bottom-left origin)
              const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1])
              const charWidth = (item as any).width / text.length
              const matchX = tx[4] + match.index * charWidth
              const matchWidth = match[0].length * charWidth

              found.push({
                type: pattern.type,
                value: match[0],
                page: pageNum,
                x: matchX,
                y: tx[5] - 2,
                width: matchWidth + 4,
                height: fontSize + 4,
                enabled: true,
              })
            }
          }
        }

        setProgress(10 + Math.round((pageNum / pdf.numPages) * 80))
      }

      setItems(found)
      setProgress(100)
      setStatus(found.length > 0 ? "review" : "review")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scan failed")
      setStatus("error")
    }
  }

  const toggleItem = (idx: number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, enabled: !item.enabled } : item)))
  }

  const toggleAll = (enabled: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, enabled })))
  }

  const applyRedaction = async () => {
    const file = files[0]
    if (!file) return
    const enabled = items.filter((i) => i.enabled)
    if (enabled.length === 0) return

    setStatus("processing")
    setProgress(10)
    try {
      const { PDFDocument, rgb } = await import("pdf-lib")
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf)
      const pages = doc.getPages()
      setProgress(30)

      for (const item of enabled) {
        if (item.page < 1 || item.page > pages.length) continue
        const page = pages[item.page - 1]
        // Draw white background then black box
        page.drawRectangle({
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          color: rgb(0, 0, 0),
        })
      }

      setProgress(80)
      const bytes = await doc.save()
      setProgress(100)
      setStatus("done")
      downloadBlob(new Uint8Array(bytes), `redacted_pii_${file.name}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Redaction failed")
      setStatus("error")
    }
  }

  const enabledCount = items.filter((i) => i.enabled).length
  const grouped = PII_PATTERNS.map((p) => ({
    ...p,
    items: items.filter((i) => i.type === p.type),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-col gap-6">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />

      {status === "scanning" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>Scanning for personal data…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === "review" && (
        <>
          {items.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-foreground" />
              <p className="font-medium">No PII detected</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No email addresses, phone numbers, SSNs, or credit card numbers were found.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Found {items.length} item{items.length !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>Select all</Button>
                  <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>Deselect all</Button>
                </div>
              </div>

              <div className="max-h-[400px] space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4">
                {grouped.map((group) => (
                  <div key={group.type}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label} ({group.items.length})
                    </h3>
                    <div className="space-y-1.5">
                      {group.items.map((item) => {
                        const idx = items.indexOf(item)
                        return (
                          <label
                            key={idx}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
                          >
                            <Switch checked={item.enabled} onCheckedChange={() => toggleItem(idx)} />
                            <code className="flex-1 truncate text-sm">{item.value}</code>
                            <span className="shrink-0 text-xs text-muted-foreground">p.{item.page}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {status === "processing" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>{t("common.processing")}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status === "done" && (
        <p className="text-sm text-foreground">✓ PII redacted and PDF downloaded!</p>
      )}

      {(status === "idle" || files.length > 0) && status !== "review" && status !== "processing" && status !== "done" && (
        <Button onClick={scan} disabled={files.length === 0 || status === "scanning"} className="w-full">
          <Search className="mr-2 h-4 w-4" />
          Scan for PII
        </Button>
      )}

      {status === "review" && items.length > 0 && (
        <Button onClick={applyRedaction} disabled={enabledCount === 0} className="w-full">
          <ShieldAlert className="mr-2 h-4 w-4" />
          Redact {enabledCount} item{enabledCount !== 1 ? "s" : ""} & download
        </Button>
      )}
    </div>
  )
}
