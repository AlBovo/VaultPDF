"use client"

import { useState } from "react"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n"
import { downloadBlob } from "@/lib/pdf-utils"

export function NdaGenerator() {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    disclosing: "",
    receiving: "",
    purpose: "",
    term: "2",
    governing: "",
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const run = async () => {
    setBusy(true)
    try {
      const doc = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const bold = await doc.embedFont(StandardFonts.HelveticaBold)
      const page = doc.addPage([595.28, 841.89])
      const { width, height } = page.getSize()
      const margin = 56
      let y = height - margin

      const today = new Date().toLocaleDateString()
      const term = form.term || "2"

      const para = (text: string, f = font, size = 11, gap = 6) => {
        const maxW = width - margin * 2
        const words = text.split(" ")
        let line = ""
        const lines: string[] = []
        for (const w of words) {
          const test = line ? line + " " + w : w
          if (f.widthOfTextAtSize(test, size) > maxW) {
            lines.push(line)
            line = w
          } else line = test
        }
        if (line) lines.push(line)
        for (const l of lines) {
          if (y < margin + 40) return
          page.drawText(l, { x: margin, y, size, font: f, color: rgb(0.13, 0.13, 0.18) })
          y -= size + 5
        }
        y -= gap
      }

      page.drawText("NON-DISCLOSURE AGREEMENT", { x: margin, y, size: 18, font: bold, color: rgb(0.1, 0.12, 0.2) })
      y -= 32

      para(`This Non-Disclosure Agreement ("Agreement") is entered into on ${today} between ${form.disclosing || "[Disclosing Party]"} (the "Disclosing Party") and ${form.receiving || "[Receiving Party]"} (the "Receiving Party").`)
      para("1. Purpose", bold, 12, 2)
      para(`The parties wish to explore ${form.purpose || "[purpose]"} (the "Purpose"), in connection with which the Disclosing Party may share confidential information.`)
      para("2. Confidential Information", bold, 12, 2)
      para('"Confidential Information" means any non-public information disclosed by the Disclosing Party, whether oral, written, or electronic, that is designated confidential or would reasonably be understood to be confidential.')
      para("3. Obligations", bold, 12, 2)
      para("The Receiving Party shall hold the Confidential Information in strict confidence, use it solely for the Purpose, and not disclose it to third parties without prior written consent.")
      para("4. Term", bold, 12, 2)
      para(`This Agreement remains in effect for ${term} year(s) from the date above, and confidentiality obligations survive its termination.`)
      para("5. Governing Law", bold, 12, 2)
      para(`This Agreement is governed by the laws of ${form.governing || "[jurisdiction]"}.`)

      y -= 20
      page.drawText("Disclosing Party: ______________________", { x: margin, y, size: 11, font })
      y -= 28
      page.drawText("Receiving Party: ______________________", { x: margin, y, size: 11, font })

      const out = await doc.save()
      downloadBlob(out, "nda.pdf")
      toast.success(t("common.done"))
    } catch (e) {
      console.log("[v0] nda error", e)
      toast.error(t("common.error"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="disclosing">{t("nda.disclosing")}</Label>
          <Input id="disclosing" value={form.disclosing} onChange={set("disclosing")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="receiving">{t("nda.receiving")}</Label>
          <Input id="receiving" value={form.receiving} onChange={set("receiving")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="purpose">{t("nda.purpose")}</Label>
        <Textarea id="purpose" value={form.purpose} onChange={set("purpose")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="term">{t("nda.term")}</Label>
          <Input id="term" type="number" min={1} value={form.term} onChange={set("term")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="governing">{t("nda.governing")}</Label>
          <Input id="governing" value={form.governing} onChange={set("governing")} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-pretty">{t("nda.note")}</p>

      <Button onClick={run} disabled={busy} size="lg">
        {busy ? t("common.processing") : t("nda.generate")}
      </Button>
    </div>
  )
}
