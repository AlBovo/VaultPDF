"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n"
import { getPdfjs, downloadBlob, baseName } from "@/lib/pdf-utils"

function sanitize(text: string, maskPii: boolean) {
  // Normalize whitespace and strip zero-width / control characters that can
  // hide prompt-injection payloads when pasted into an LLM.
  let out = text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  if (maskPii) {
    out = out
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
      .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[phone]")
      .replace(/\b(?:\d[ -]*?){13,16}\b/g, "[card]")
  }
  return out
}

export function SanitizeLlm() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [mask, setMask] = useState(true)
  const [text, setText] = useState("")

  const run = async () => {
    if (files.length === 0) {
      toast.error(t("common.needFile"))
      return
    }
    setBusy(true)
    try {
      const pdfjs = await getPdfjs()
      const bytes = await files[0].arrayBuffer()
      const doc = await pdfjs.getDocument({ data: bytes }).promise
      let raw = ""
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        raw += content.items.map((it: any) => it.str).join(" ") + "\n\n"
      }
      const clean = sanitize(raw, mask)
      setText(clean)
      if (!clean) toast.message(t("sanitize.empty"))
      else toast.success(t("common.done"))
    } catch (e) {
      console.log("[v0] sanitize error", e)
      toast.error(t("common.error"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone files={files} onFiles={setFiles} />

      <div className="flex items-center gap-3">
        <Switch id="mask" checked={mask} onCheckedChange={setMask} />
        <Label htmlFor="mask">{t("sanitize.stripPii")}</Label>
      </div>

      <Button onClick={run} disabled={busy || files.length === 0} size="lg">
        {busy ? t("common.processing") : t("sanitize.extract")}
      </Button>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("sanitize.placeholder")}
        className="min-h-64 font-mono text-sm"
      />

      {text && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(text)
              toast.success(t("sanitize.copied"))
            }}
          >
            {t("sanitize.copy")}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadBlob(
                new Blob([text], { type: "text/plain" }),
                `${baseName(files[0]?.name ?? "document")}-sanitized.txt`,
              )
            }
          >
            {t("sanitize.downloadTxt")}
          </Button>
        </div>
      )}
    </div>
  )
}
