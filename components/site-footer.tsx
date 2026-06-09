"use client"

import { ShieldCheck, Lock } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function SiteFooter() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <p className="max-w-md text-sm text-muted-foreground text-pretty">
          {t("brand.tagline")}
        </p>
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          <Lock className="h-3.5 w-3.5 text-primary" />
          {t("common.dropHint")}
        </div>
        <p className="text-xs text-muted-foreground">
          {"VaultPDF — developed by Claude & AlBovo"}
        </p>
      </div>
    </footer>
  )
}
