import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy | VaultPDF",
  description: "How VaultPDF protects your files: no uploads, no tracking, no cookies. Everything runs in your browser.",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Link
        href="/"
        className="inline-flex items-center text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        Return home
      </Link>
      <h1 className="text-2xl font-light tracking-tight">Privacy</h1>
      <div className="mt-1 h-px bg-border" />

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground">How it works</h2>
          <p>
            VaultPDF runs entirely in your browser. When you upload a file, it is read into
            your device&apos;s memory using JavaScript. The file is processed locally using
            WebAssembly and browser APIs, and the result is downloaded back to your device.
            <strong className="text-foreground"> At no point does your file leave your computer.</strong>
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground">No server processing</h2>
          <p>
            There is no backend. No API. No queue. VaultPDF is a static website that runs
            on the client side. The server only delivers the HTML, CSS, and JavaScript files
            that make up the application.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground">No analytics or tracking</h2>
          <p>
            VaultPDF does not use Google Analytics, Meta Pixel, or any third-party tracking
            service. There are no cookies, no fingerprinting, and no telemetry.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground">Local storage</h2>
          <p>
            The only data stored on your device is your language preference and theme choice,
            saved in <code className="rounded border border-border px-1 py-0.5 text-xs text-foreground">localStorage</code>.
            No file data, history, or personal information is ever persisted.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground">Open source</h2>
          <p>
            The complete source code is available on{" "}
            <a href="https://github.com/AlBovo/VaultPDF" target="_blank" rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:no-underline">
              GitHub
            </a>.
            You can audit, fork, and self-host VaultPDF at any time.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground">Third-party libraries</h2>
          <p>
            VaultPDF uses open-source libraries for PDF processing:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li><strong className="text-foreground">pdf-lib</strong> — PDF creation and manipulation</li>
            <li><strong className="text-foreground">pdfjs-dist</strong> — PDF rendering and text extraction (Mozilla)</li>
            <li><strong className="text-foreground">Tesseract.js</strong> — Optical character recognition (WASM)</li>
            <li><strong className="text-foreground">SheetJS</strong> — Spreadsheet generation</li>
            <li><strong className="text-foreground">docx</strong> — Word document generation</li>
            <li><strong className="text-foreground">mammoth</strong> — Word document parsing</li>
            <li><strong className="text-foreground">JSZip</strong> — ZIP file manipulation</li>
          </ul>
          <p className="mt-2">
            All of these run locally in your browser. None of them make network requests.
          </p>
        </section>
      </div>
    </main>
  )
}
