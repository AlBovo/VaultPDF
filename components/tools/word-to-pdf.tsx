"use client"

import { useState } from "react"
import { FileText, Download } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, baseName } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

export function WordToPdf() {
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
      const mammoth = await import("mammoth")
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")
      const arrayBuffer = await file.arrayBuffer()

      setProgress(30)
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const html = result.value

      // Strip HTML tags to get plain text, preserving line breaks
      const div = document.createElement("div")
      div.innerHTML = html
      const text = div.innerText || div.textContent || ""

      setProgress(50)

      // Create PDF
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
      const fontSize = 11
      const lineHeight = fontSize * 1.4
      const margin = 50
      const pageWidth = 595.28 // A4
      const pageHeight = 841.89
      const maxWidth = pageWidth - margin * 2
      const maxY = pageHeight - margin
      const minY = margin

      // Split text into lines that fit the page width
      const lines: string[] = []
      const paragraphs = text.split("\n")
      for (const para of paragraphs) {
        if (!para.trim()) {
          lines.push("")
          continue
        }
        const words = para.split(/\s+/)
        let currentLine = ""
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word
          const width = font.widthOfTextAtSize(testLine, fontSize)
          if (width > maxWidth && currentLine) {
            lines.push(currentLine)
            currentLine = word
          } else {
            currentLine = testLine
          }
        }
        if (currentLine) lines.push(currentLine)
      }

      setProgress(70)

      // Render lines to pages
      let page = doc.addPage([pageWidth, pageHeight])
      let y = maxY

      for (const line of lines) {
        if (y < minY) {
          page = doc.addPage([pageWidth, pageHeight])
          y = maxY
        }
        if (line.trim()) {
          page.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
          })
        }
        y -= lineHeight
      }

      setProgress(90)
      const bytes = await doc.save()
      setProgress(100)
      setStatus("done")
      downloadBlob(new Uint8Array(bytes), `${baseName(file.name)}.pdf`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Conversion failed")
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-accent/30 p-4 text-sm text-muted-foreground">
        <FileText className="mb-1 inline h-4 w-4 text-primary" />{" "}
        Only <strong>.docx</strong> files are supported. This conversion preserves text
        content but may not retain complex formatting like images or tables.
      </div>

      <Dropzone
        accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
        files={files}
        onFiles={setFiles}
      />

      {status === "processing" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>Converting to PDF…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status === "done" && (
        <p className="text-sm text-foreground">✓ PDF downloaded!</p>
      )}

      <Button onClick={convert} disabled={files.length === 0 || status === "processing"} className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Convert to PDF
      </Button>
    </div>
  )
}
