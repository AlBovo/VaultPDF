"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Tool } from "@/lib/tools"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function ToolCard({ tool }: { tool: Tool }) {
  const { t } = useI18n()
  const Icon = tool.icon

  return (
    <Link
      href={`/tools/${tool.id}`}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all",
        "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </span>
        {!tool.implemented && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("common.comingSoon")}
          </span>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium leading-tight">{t(`t.${tool.id}.name`)}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
          {t(`t.${tool.id}.desc`)}
        </p>
      </div>
      <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        {t("common.run")}
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}
