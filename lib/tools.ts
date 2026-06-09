import type { LucideIcon } from "lucide-react"
import {
  Archive,
  Presentation,
  Combine,
  Scissors,
  SquarePen,
  EyeOff,
  ShieldAlert,
  Eraser,
  Layers,
  Sparkles,
  ScanText,
  PenLine,
  Stamp,
  FileMinus,
  RotateCw,
  LockOpen,
  Signature,
  FileSpreadsheet,
  FileType,
  Images,
  FileImage,
  Table,
  FileText,
  GitCompare,
  FileSignature,
} from "lucide-react"

export type CategoryId =
  | "optimize"
  | "security"
  | "edit"
  | "convert"
  | "generate"

export type Tool = {
  id: string
  category: CategoryId
  icon: LucideIcon
  /** whether a working implementation exists (otherwise "coming soon") */
  implemented: boolean
}

export const categories: { id: CategoryId; labelKey: string }[] = [
  { id: "optimize", labelKey: "cat.optimize" },
  { id: "security", labelKey: "cat.security" },
  { id: "edit", labelKey: "cat.edit" },
  { id: "convert", labelKey: "cat.convert" },
  { id: "generate", labelKey: "cat.generate" },
]

export const tools: Tool[] = [
  // Optimization & Organization
  { id: "compress-pdf", category: "optimize", icon: Archive, implemented: true },
  { id: "compress-ppt", category: "optimize", icon: Presentation, implemented: false },
  { id: "merge-pdf", category: "optimize", icon: Combine, implemented: true },
  { id: "split-pdf", category: "optimize", icon: Scissors, implemented: true },

  // Security & Sanitization
  { id: "redact-pdf", category: "security", icon: EyeOff, implemented: false },
  { id: "auto-redact", category: "security", icon: ShieldAlert, implemented: false },
  { id: "strip-metadata", category: "security", icon: Eraser, implemented: true },
  { id: "flatten-pdf", category: "security", icon: Layers, implemented: true },
  { id: "sanitize-llm", category: "security", icon: Sparkles, implemented: true },
  { id: "pdf-ocr", category: "security", icon: ScanText, implemented: false },

  // Editing Tools
  { id: "edit-pdf", category: "edit", icon: SquarePen, implemented: false },
  { id: "watermark", category: "edit", icon: Stamp, implemented: true },
  { id: "remove-pages", category: "edit", icon: FileMinus, implemented: true },
  { id: "rotate-pdf", category: "edit", icon: RotateCw, implemented: true },
  { id: "unlock-pdf", category: "edit", icon: LockOpen, implemented: true },
  { id: "sign-pdf", category: "edit", icon: Signature, implemented: true },

  // Conversion Tools
  { id: "pdf-to-excel", category: "convert", icon: FileSpreadsheet, implemented: false },
  { id: "pdf-to-word", category: "convert", icon: FileType, implemented: false },
  { id: "pdf-to-images", category: "convert", icon: Images, implemented: true },
  { id: "images-to-pdf", category: "convert", icon: FileImage, implemented: true },
  { id: "csv-to-pdf", category: "convert", icon: Table, implemented: true },
  { id: "word-to-pdf", category: "convert", icon: FileText, implemented: false },
  { id: "compare-pdf", category: "convert", icon: GitCompare, implemented: false },

  // Document Generation
  { id: "nda-generator", category: "generate", icon: FileSignature, implemented: true },
]

export function getTool(id: string): Tool | undefined {
  return tools.find((t) => t.id === id)
}

export function toolsByCategory(category: CategoryId): Tool[] {
  return tools.filter((t) => t.category === category)
}
