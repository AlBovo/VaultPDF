"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, FileText, X } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type DropzoneProps = {
  accept?: string
  multiple?: boolean
  files: File[]
  onFiles: (files: File[]) => void
}

export function Dropzone({
  accept = "application/pdf",
  multiple = false,
  files,
  onFiles,
}: DropzoneProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return
      const arr = Array.from(list)
      onFiles(multiple ? [...files, ...arr] : arr.slice(0, 1))
    },
    [files, multiple, onFiles],
  )

  const removeAt = (i: number) => {
    const next = files.filter((_, idx) => idx !== i)
    onFiles(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center transition-all",
          dragging && "border-foreground bg-accent",
        )}
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">{t("common.dropTitle")}</span>
        <span className="text-xs text-muted-foreground">
          {t("common.dropHint")}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </button>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{f.name}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                {(f.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove file"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
