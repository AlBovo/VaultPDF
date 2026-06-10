"use client"

import { useState } from "react"
import { ImageDown, Download } from "lucide-react"
import { Dropzone } from "@/components/dropzone"
import { Button } from "@/components/ui/button"
import { getPdfjs } from "@/lib/pdf-utils"
import { useI18n } from "@/lib/i18n"

export function ExtractImages() {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [images, setImages] = useState<{ url: string; page: number; idx: number }[]>([])

  const extract = async () => {
    const file = files[0]
    if (!file) return
    setStatus("processing")
    setProgress(5)
    setError("")
    setImages([])
    try {
      const pdfjsLib = await getPdfjs()
      const buf = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise
      const found: { url: string; page: number; idx: number }[] = []
      let imgCount = 0

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p)
        const ops = await page.getOperatorList()
        for (let i = 0; i < ops.fnArray.length; i++) {
          // OPS.paintImageXObject = 85
          if (ops.fnArray[i] === 85) {
            const imgName = ops.argsArray[i][0]
            try {
              const img = await (page as any).objs.get(imgName)
              if (!img || !img.data) continue
              const canvas = document.createElement("canvas")
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext("2d")!
              const imgData = ctx.createImageData(img.width, img.height)
              // Handle different data formats
              if (img.data.length === img.width * img.height * 4) {
                imgData.data.set(img.data)
              } else if (img.data.length === img.width * img.height * 3) {
                for (let j = 0; j < img.width * img.height; j++) {
                  imgData.data[j * 4] = img.data[j * 3]
                  imgData.data[j * 4 + 1] = img.data[j * 3 + 1]
                  imgData.data[j * 4 + 2] = img.data[j * 3 + 2]
                  imgData.data[j * 4 + 3] = 255
                }
              } else {
                continue
              }
              ctx.putImageData(imgData, 0, 0)
              const url = canvas.toDataURL("image/png")
              imgCount++
              found.push({ url, page: p, idx: imgCount })
            } catch { /* skip unreadable images */ }
          }
        }
        setProgress(5 + Math.round((p / pdf.numPages) * 90))
      }

      setImages(found)
      setProgress(100)
      setStatus("done")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Extraction failed")
      setStatus("error")
    }
  }

  const downloadImage = (url: string, name: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = name
    a.click()
  }

  const downloadAll = () => {
    images.forEach((img) => downloadImage(img.url, `image_p${img.page}_${img.idx}.png`))
  }

  return (
    <div className="flex flex-col gap-6">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />

      {status === "processing" && (
        <div className="rounded-xl border border-border p-4">
          <div className="mb-2 flex justify-between text-sm"><span>Extracting images…</span><span>{progress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {status === "done" && (
        <>
          {images.length === 0 ? (
            <p className="text-sm text-muted-foreground">No embedded images found in this PDF.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm">{images.length} image{images.length !== 1 ? "s" : ""} found</p>
                <Button variant="outline" size="sm" onClick={downloadAll}>
                  <Download className="mr-1 h-3.5 w-3.5" /> Download all
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map((img) => (
                  <button key={img.idx} onClick={() => downloadImage(img.url, `image_p${img.page}_${img.idx}.png`)}
                    className="group overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md">
                    <img src={img.url} alt={`Image ${img.idx}`} className="block w-full" />
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-[10px] text-muted-foreground">p.{img.page}</span>
                      <Download className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {status !== "done" && (
        <Button onClick={extract} disabled={files.length === 0 || status === "processing"} className="w-full">
          <ImageDown className="mr-2 h-4 w-4" /> Extract images
        </Button>
      )}
    </div>
  )
}
