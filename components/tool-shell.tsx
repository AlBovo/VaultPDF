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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/#tools"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      <div className="mb-6 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Icon className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t(`t.${tool.id}.name`)}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-primary">
              <Lock className="h-3 w-3" />
              {t("common.localBadge")}
            </span>
          </div>
          <p className="mt-1 text-pretty text-muted-foreground">
            {t(`t.${tool.id}.desc`)}
          </p>
        </div>
      </div>

      {children}
    </main>
  )
}
