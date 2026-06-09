"use client"

import { ShieldCheck, UserX, Eye, Lock, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { categories, toolsByCategory } from "@/lib/tools"
import { ToolCard } from "@/components/tool-card"

export function HomeView() {
  const { t } = useI18n()

  const features = [
    { icon: Lock, titleKey: "hero.feature1.title", descKey: "hero.feature1.desc" },
    { icon: UserX, titleKey: "hero.feature2.title", descKey: "hero.feature2.desc" },
    { icon: Eye, titleKey: "hero.feature3.title", descKey: "hero.feature3.desc" },
  ]

  return (
    <main className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-16 text-center md:py-24">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {t("common.dropHint")}
        </div>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          {t("hero.title")}
        </h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {t("hero.subtitle")}
        </p>
        <a
          href="#tools"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("hero.cta")}
          <ArrowRight className="h-4 w-4" />
        </a>

        {/* trust features */}
        <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.titleKey}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-medium">{t(f.titleKey)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(f.descKey)}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tools by category */}
      <section id="tools" className="scroll-mt-20 pb-24">
        {categories.map((cat) => (
          <div key={cat.id} className="mb-12">
            <h2 className="mb-5 text-xl font-semibold tracking-tight">
              {t(cat.labelKey)}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {toolsByCategory(cat.id).map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
