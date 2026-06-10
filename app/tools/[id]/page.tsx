import { notFound } from "next/navigation"
import { getTool, tools } from "@/lib/tools"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ToolShell } from "@/components/tool-shell"
import { ToolRunner } from "@/components/tools/tool-runner"

export function generateStaticParams() {
  return tools.map((t) => ({ id: t.id }))
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tool = getTool(id)
  if (!tool) notFound()

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <ToolShell toolId={tool.id}>
        <ToolRunner toolId={tool.id} implemented={tool.implemented} />
      </ToolShell>
      <SiteFooter />
    </div>
  )
}
