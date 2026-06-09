"use client"

// Browser-only helpers for working with PDFs and downloads.

export function downloadBlob(data: Uint8Array | Blob, filename: string) {
  const blob =
    data instanceof Blob
      ? data
      : new Blob([data as BlobPart], { type: "application/octet-stream" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function baseName(name: string) {
  return name.replace(/\.[^/.]+$/, "")
}

/**
 * Parse a page-range string like "1-3, 5, 8-10" into a sorted, de-duplicated
 * array of zero-based page indices, bounded by pageCount.
 */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const result = new Set<number>()
  const parts = input.split(",")
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const range = trimmed.split("-").map((s) => s.trim())
    if (range.length === 1) {
      const n = Number.parseInt(range[0], 10)
      if (!Number.isNaN(n) && n >= 1 && n <= pageCount) result.add(n - 1)
    } else if (range.length === 2) {
      let start = Number.parseInt(range[0], 10)
      let end = Number.parseInt(range[1], 10)
      if (Number.isNaN(start) || Number.isNaN(end)) continue
      if (start > end) [start, end] = [end, start]
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= pageCount) result.add(i - 1)
      }
    }
  }
  return Array.from(result).sort((a, b) => a - b)
}

// Lazy-loaded pdf.js with the worker pointed at a same-origin asset so it
// works fully offline inside a container with no external CDN access.
let pdfjsLib: typeof import("pdfjs-dist") | null = null

export async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib
  const lib = await import("pdfjs-dist")
  // Worker file is copied into /public during the build (see scripts/copy step
  // or postinstall). We serve it from the same origin.
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
  pdfjsLib = lib
  return lib
}
