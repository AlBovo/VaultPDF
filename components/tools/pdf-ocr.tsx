"use client"

import { useState } from "react"
import { ScanText, Download, Copy, Check } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { downloadBlob, baseName, getPdfjs } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

export function PdfOcr() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("")
  const [error, setError] = useState("")
  const [text, setText] = useState("")
  const [copied, setCopied] = useState(false)

  const runOCR = async () => {
    const file = files[0]
    if (!file) return
    setStatus("processing")
    setProgress(5)
    setError("")
    setText("")

    try {
      const pdfjsLib = await getPdfjs()
      const buf = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise

      setProgressLabel("Loading OCR engine…")
      setProgress(10)
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("eng")

      let allText = ""
      for (let i = 1; i <= pdf.numPages; i++) {
        setProgressLabel(`OCR page ${i} of ${pdf.numPages}…`)

        // Render page to canvas at 2x scale
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")!
        await page.render({ canvasContext: ctx, viewport }).promise

        // Convert to blob and OCR
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png"),
        )
        const {
          data: { text: pageText },
        } = await worker.recognize(blob)
        allText += `\n--- Page ${i} ---\n${pageText}\n`
        setProgress(10 + Math.round((i / pdf.numPages) * 85))
      }

      await worker.terminate()
      setText(allText.trim())
      setProgress(100)
      setStatus("done")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OCR failed")
      setStatus("error")
    }
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      ta.remove()
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadTxt = () => {
    const blob = new Blob([text], { type: "text/plain" })
    downloadBlob(blob, `${baseName(files[0]?.name || "ocr")}_ocr.txt`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-accent/30 p-4 text-sm text-muted-foreground">
        <ScanText className="mb-1 inline h-4 w-4 text-primary" />{" "}
        OCR uses <strong>Tesseract.js</strong> which downloads a ~15 MB WASM engine on first use.
        All processing stays in your browser.
      </div>

      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />

      {status === "processing" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>{progressLabel}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === "done" && (
        <>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyText}>
              {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy text"}
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTxt}>
              <Download className="mr-1 h-3.5 w-3.5" /> Download .txt
            </Button>
          </div>
          <textarea
            readOnly
            value={text}
            rows={20}
            className="w-full rounded-xl border border-border bg-card p-4 font-mono text-sm text-foreground"
          />
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status !== "done" && (
        <Button onClick={runOCR} disabled={files.length === 0 || status === "processing"} className="w-full">
          <ScanText className="mr-2 h-4 w-4" />
          Run OCR
        </Button>
      )}
    </div>
  )
}
