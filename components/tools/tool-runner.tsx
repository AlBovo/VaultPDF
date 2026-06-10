"use client"

import dynamic from "next/dynamic"
import { Clock } from "lucide-react"
import { useI18n } from "@/lib/i18n"

const loading = () => (
  <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
    Loading…
  </div>
)

// Each implemented tool lives in its own file and is loaded on demand.
const registry: Record<string, ReturnType<typeof dynamic>> = {
  "merge-pdf": dynamic(() => import("./merge-pdf").then((m) => m.MergePdf), { loading }),
  "split-pdf": dynamic(() => import("./split-pdf").then((m) => m.SplitPdf), { loading }),
  "remove-pages": dynamic(() => import("./remove-pages").then((m) => m.RemovePages), { loading }),
  "rotate-pdf": dynamic(() => import("./rotate-pdf").then((m) => m.RotatePdf), { loading }),
  "watermark": dynamic(() => import("./watermark").then((m) => m.Watermark), { loading }),
  "images-to-pdf": dynamic(() => import("./images-to-pdf").then((m) => m.ImagesToPdf), { loading }),
  "pdf-to-images": dynamic(() => import("./pdf-to-images").then((m) => m.PdfToImages), { loading }),
  "strip-metadata": dynamic(() => import("./strip-metadata").then((m) => m.StripMetadata), { loading }),
  "flatten-pdf": dynamic(() => import("./flatten-pdf").then((m) => m.FlattenPdf), { loading }),
  "sanitize-llm": dynamic(() => import("./sanitize-llm").then((m) => m.SanitizeLlm), { loading }),
  "csv-to-pdf": dynamic(() => import("./csv-to-pdf").then((m) => m.CsvToPdf), { loading }),
  "sign-pdf": dynamic(() => import("./sign-pdf").then((m) => m.SignPdf), { loading }),
  "compress-pdf": dynamic(() => import("./compress-pdf").then((m) => m.CompressPdf), { loading }),
  "unlock-pdf": dynamic(() => import("./unlock-pdf").then((m) => m.UnlockPdf), { loading }),
  "nda-generator": dynamic(() => import("./nda-generator").then((m) => m.NdaGenerator), { loading }),
  // Newly implemented tools
  "compress-ppt": dynamic(() => import("./compress-ppt").then((m) => m.CompressPpt), { loading }),
  "redact-pdf": dynamic(() => import("./redact-pdf").then((m) => m.RedactPdf), { loading }),
  "auto-redact": dynamic(() => import("./auto-redact-pii").then((m) => m.AutoRedactPii), { loading }),
  "pdf-ocr": dynamic(() => import("./pdf-ocr").then((m) => m.PdfOcr), { loading }),
  "edit-pdf": dynamic(() => import("./edit-pdf").then((m) => m.EditPdf), { loading }),
  "pdf-to-excel": dynamic(() => import("./pdf-to-excel").then((m) => m.PdfToExcel), { loading }),
  "pdf-to-word": dynamic(() => import("./pdf-to-word").then((m) => m.PdfToWord), { loading }),
  "word-to-pdf": dynamic(() => import("./word-to-pdf").then((m) => m.WordToPdf), { loading }),
  "compare-pdf": dynamic(() => import("./compare-pdf").then((m) => m.ComparePdf), { loading }),
}

export function ToolRunner({
  toolId,
  implemented,
}: {
  toolId: string
  implemented: boolean
}) {
  const { t } = useI18n()
  const Comp = registry[toolId]

  if (!implemented || !Comp) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <Clock className="h-5 w-5 text-muted-foreground" />
        </span>
        <h2 className="text-sm font-medium">{t("common.comingSoon")}</h2>
        <p className="max-w-md text-pretty text-xs text-muted-foreground">
          {t("common.comingSoonDesc")}
        </p>
      </div>
    )
  }

  return <Comp />
}
