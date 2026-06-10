"use client"

import { ShieldCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function SiteFooter() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center">
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground text-pretty">
          {t("brand.tagline")}
        </p>
        <div className="h-px w-8 bg-border" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          VaultPDF — Claude & AlBovo
        </p>
      </div>
    </footer>
  )
}
