"use client"

import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"
import { getTool } from "@/lib/tools"
import { useI18n } from "@/lib/i18n"

export function ToolShell({
  toolId,
  children,
}: {
  toolId: string
  children: React.ReactNode
}) {
  const { t } = useI18n()
  const tool = getTool(toolId)
  if (!tool) return null
  const Icon = tool.icon

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/#tools"
        className="mb-8 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("common.back")}
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-medium tracking-tight">
              {t(`t.${tool.id}.name`)}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Lock className="h-2.5 w-2.5" />
              {t("common.localBadge")}
            </span>
          </div>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">
            {t(`t.${tool.id}.desc`)}
          </p>
        </div>
      </div>

      <div className="h-px bg-border mb-8" />

      {children}
    </main>
  )
}
