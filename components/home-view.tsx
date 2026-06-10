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
      <section className="flex flex-col items-center gap-6 py-20 text-center md:py-32">
        <div className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t("common.dropHint")}
        </div>
        <h1 className="max-w-3xl text-balance text-4xl font-light tracking-tight md:text-6xl">
          {t("hero.title")}
        </h1>
        <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
          {t("hero.subtitle")}
        </p>
        <a
          href="#tools"
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          {t("hero.cta")}
          <ArrowRight className="h-4 w-4" />
        </a>

        {/* trust features */}
        <div className="mt-14 grid w-full gap-4 sm:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.titleKey}
                className="flex flex-col items-center gap-2.5 rounded-xl border border-border px-6 py-8 text-center"
              >
                <Icon className="h-5 w-5 text-foreground" />
                <h3 className="text-sm font-medium tracking-tight">{t(f.titleKey)}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
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
          <div key={cat.id} className="mb-14">
            <h2 className="mb-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t(cat.labelKey)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
