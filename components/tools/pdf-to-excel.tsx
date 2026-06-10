"use client"

import { useState } from "react"
import { FileSpreadsheet, Download } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, baseName, getPdfjs } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

type TextItem = {
  str: string
  transform: number[]
  width: number
}

function clusterRows(items: TextItem[], tolerance = 5): TextItem[][] {
  if (items.length === 0) return []
  const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5])
  const rows: TextItem[][] = [[sorted[0]]]

  for (let i = 1; i < sorted.length; i++) {
    const lastRow = rows[rows.length - 1]
    const lastY = lastRow[0].transform[5]
    const curY = sorted[i].transform[5]
    if (Math.abs(lastY - curY) < tolerance) {
      lastRow.push(sorted[i])
    } else {
      rows.push([sorted[i]])
    }
  }

  // Sort items in each row by X
  for (const row of rows) {
    row.sort((a, b) => a.transform[4] - b.transform[4])
  }
  return rows
}

export function PdfToExcel() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")

  const convert = async () => {
    const file = files[0]
    if (!file) return
    setStatus("processing")
    setProgress(10)
    setError("")

    try {
      const pdfjsLib = await getPdfjs()
      const XLSX = await import("xlsx")
      const buf = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise
      const wb = XLSX.utils.book_new()

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()

        const items: TextItem[] = textContent.items
          .filter((item: any) => "str" in item && item.str.trim())
          .map((item: any) => ({
            str: item.str,
            transform: item.transform,
            width: item.width,
          }))

        const rows = clusterRows(items)
        const data: string[][] = rows.map((row) => row.map((item) => item.str))

        const ws = XLSX.utils.aoa_to_sheet(data)
        XLSX.utils.book_append_sheet(wb, ws, `Page ${pageNum}`)

        setProgress(10 + Math.round((pageNum / pdf.numPages) * 80))
      }

      const xlsxBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      setProgress(100)
      setStatus("done")
      downloadBlob(
        new Blob([xlsxBuf], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `${baseName(file.name)}.xlsx`,
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Conversion failed")
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />

      {status === "processing" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>Extracting tables…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status === "done" && (
        <p className="text-sm text-foreground">✓ Excel file downloaded!</p>
      )}

      <Button onClick={convert} disabled={files.length === 0 || status === "processing"} className="w-full">
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Convert to Excel
      </Button>
    </div>
  )
}
