"use client"

import { useState } from "react"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/lib/i18n"
import { downloadBlob } from "@/lib/pdf-utils"

// Minimal CSV parser that handles quoted fields and escaped quotes.
function parseCsv(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ",") {
      row.push(field)
      field = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else field += c
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

export function CsvToPdf() {
  const { t } = useI18n()
  const [csv, setCsv] = useState("")
  const [title, setTitle] = useState("")
  const [hasHeader, setHasHeader] = useState(true)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    const rows = parseCsv(csv)
    if (rows.length === 0) {
      toast.error(t("csv.empty"))
      return
    }
    setBusy(true)
    try {
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const bold = await doc.embedFont(StandardFonts.HelveticaBold)
      const margin = 40
      const fontSize = 9
      const rowH = 18
      const cols = Math.max(...rows.map((r) => r.length))
      let page = doc.addPage([595.28, 841.89]) // A4 portrait
      let { width, height } = page.getSize()
      let y = height - margin

      if (title) {
        page.drawText(title, { x: margin, y: y - 6, size: 16, font: bold, color: rgb(0.1, 0.1, 0.15) })
        y -= 32
      }

      const colW = (width - margin * 2) / cols

      const drawRow = (cells: string[], isHeader: boolean) => {
        if (y < margin + rowH) {
          page = doc.addPage([595.28, 841.89])
          ;({ width, height } = page.getSize())
          y = height - margin
        }
        if (isHeader) {
          page.drawRectangle({
            x: margin,
            y: y - rowH + 4,
            width: width - margin * 2,
            height: rowH,
            color: rgb(0.93, 0.95, 0.99),
          })
        }
        cells.forEach((cell, ci) => {
          const text = cell.length > 28 ? cell.slice(0, 27) + "…" : cell
          page.drawText(text, {
            x: margin + ci * colW + 4,
            y: y - rowH + 9,
            size: fontSize,
            font: isHeader ? bold : font,
            color: rgb(0.15, 0.15, 0.2),
          })
        })
        page.drawLine({
          start: { x: margin, y: y - rowH + 2 },
          end: { x: width - margin, y: y - rowH + 2 },
          thickness: 0.5,
          color: rgb(0.85, 0.87, 0.9),
        })
        y -= rowH
      }

      rows.forEach((r, idx) => drawRow(r, hasHeader && idx === 0))

      const out = await doc.save()
      downloadBlob(out, `${title ? title.replace(/\s+/g, "-").toLowerCase() : "table"}.pdf`)
      toast.success(t("common.done"))
    } catch (e) {
      console.log("[v0] csv error", e)
      toast.error(t("common.error"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t("csv.title")}</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="csv">{t("csv.label")}</Label>
        <Textarea
          id="csv"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={t("csv.placeholder")}
          className="min-h-48 font-mono text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch id="header" checked={hasHeader} onCheckedChange={setHasHeader} />
        <Label htmlFor="header">{t("csv.header")}</Label>
      </div>

      <Button onClick={run} disabled={busy || !csv.trim()} size="lg">
        {busy ? t("common.processing") : t("csv.generate")}
      </Button>
    </div>
  )
}
