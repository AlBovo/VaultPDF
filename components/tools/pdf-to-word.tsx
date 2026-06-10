"use client"

import { useState } from "react"
import { FileType, Download } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, baseName, getPdfjs } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

export function PdfToWord() {
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
      const { Document, Packer, Paragraph, TextRun, PageBreak, AlignmentType } = await import("docx")
      const buf = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise

      const sections: any[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()

        // Group text items into lines by Y proximity
        type TItem = { str: string; y: number; x: number }
        const items: TItem[] = textContent.items
          .filter((item: any) => "str" in item)
          .map((item: any) => ({
            str: item.str as string,
            y: item.transform[5],
            x: item.transform[4],
          }))

        // Sort by Y desc then X asc
        items.sort((a, b) => b.y - a.y || a.x - b.x)

        // Group into lines
        const lines: string[] = []
        let currentLine = ""
        let lastY = items.length > 0 ? items[0].y : 0

        for (const item of items) {
          if (Math.abs(lastY - item.y) > 3) {
            if (currentLine.trim()) lines.push(currentLine.trim())
            currentLine = item.str
            lastY = item.y
          } else {
            currentLine += item.str
          }
        }
        if (currentLine.trim()) lines.push(currentLine.trim())

        // Group lines into paragraphs (larger Y gaps = paragraph break)
        const paragraphs: Paragraph[] = lines.map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line, size: 24 })],
            }),
        )

        // Add page break between pages (except last)
        if (pageNum < pdf.numPages) {
          paragraphs.push(
            new Paragraph({
              children: [new PageBreak()],
            }),
          )
        }

        sections.push(...paragraphs)
        setProgress(10 + Math.round((pageNum / pdf.numPages) * 80))
      }

      const doc = new Document({
        sections: [{ children: sections }],
      })

      const docxBlob = await Packer.toBlob(doc)
      setProgress(100)
      setStatus("done")
      downloadBlob(docxBlob, `${baseName(file.name)}.docx`)
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
            <span>Converting to Word…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status === "done" && (
        <p className="text-sm text-foreground">✓ Word document downloaded!</p>
      )}

      <Button onClick={convert} disabled={files.length === 0 || status === "processing"} className="w-full">
        <FileType className="mr-2 h-4 w-4" />
        Convert to Word
      </Button>
    </div>
  )
}
