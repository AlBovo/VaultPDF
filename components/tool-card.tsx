"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Tool } from "@/lib/tools"
import { useI18n } from "@/lib/i18n"

export function ToolCard({ tool }: { tool: Tool }) {
  const { t } = useI18n()
  const Icon = tool.icon

  return (
    <Link
      href={`/tools/${tool.id}`}
      className="group relative flex items-start gap-4 rounded-xl border border-border p-5 transition-colors hover:bg-accent"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium leading-tight">{t(`t.${tool.id}.name`)}</h3>
          {!tool.implemented && (
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("common.comingSoon")}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground text-pretty">
          {t(`t.${tool.id}.desc`)}
        </p>
      </div>
      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}
