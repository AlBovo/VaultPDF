# 🔒 VaultPDF

**Private, in-browser PDF tools that never leave your device.**

VaultPDF processes every PDF entirely in your browser — no uploads, no servers, no tracking. Built with Next.js, React 19, and battle-tested client-side libraries.

> Developed by **Claude & AlBovo**

---

## ✨ Features

- **100% client-side** — all file processing happens in your browser using WebAssembly and JavaScript
- **Zero uploads** — files are read and written in memory, never sent to any server
- **No account needed** — every tool is free and works without signing in
- **Bilingual** — English and Italian language support
- **Dark mode** — automatic and manual theme switching
- **Dockerized** — ready to self-host with a single command

---

## 🛠️ Tools (23)

### 🗂️ Optimization & Organization
| Tool | Description |
|------|-------------|
| **Compress PDF** | Reduce file size without losing visual quality |
| **Compress PPT** | Shrink .pptx files by compressing their images |
| **Merge PDF** | Combine multiple PDF files into one document |
| **Split PDF** | Extract specific pages into separate files |

### 🛡️ Security & Sanitization
| Tool | Description |
|------|-------------|
| **Redact PDF** | Permanently black out sensitive areas of a document |
| **Auto-Redact PII** | Detect and hide personal data (emails, SSN, cards, phones) |
| **Strip Metadata** | Destroy embedded metadata and hidden document properties |
| **Flatten PDF** | Permanently print form fields and layers onto the page |
| **Sanitize for LLMs** | Clean PDF text for safe pasting into ChatGPT or Claude |
| **PDF OCR** | Extract text from scanned PDFs with optical character recognition |

### ✍️ Editing Tools
| Tool | Description |
|------|-------------|
| **Edit PDF** | Add text, images, and reorder pages |
| **Add Watermark** | Overlay text watermarks onto every page |
| **Remove Pages** | Delete unwanted pages from a file |
| **Rotate PDF** | Rotate individual pages or the entire document |
| **Unlock PDF** | Remove owner-password restrictions (print, copy, edit) |
| **Sign PDF** | Draw and apply your signature to any PDF privately |

### 🔄 Conversion Tools
| Tool | Description |
|------|-------------|
| **PDF to Excel** | Extract tables from a PDF into a spreadsheet (.xlsx) |
| **PDF to Word** | Convert a PDF into an editable Word document (.docx) |
| **PDF to Images** | Export PDF pages as PNG images |
| **Images to PDF** | Convert JPG or PNG images into a PDF document |
| **CSV to PDF** | Generate a PDF table from raw CSV data |
| **Word to PDF** | Convert Microsoft Word documents to PDF |
| **Compare PDF** | Find and highlight visual differences between two PDFs |

### 📝 Document Generation
| Tool | Description |
|------|-------------|
| **NDA Generator** | Fill in and generate a professional NDA privately |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Local Development

```bash
# Clone the repository
git clone https://github.com/AlBovo/VaultPDF.git
cd VaultPDF

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 🐳 Docker

### Quick Start

```bash
docker compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Manual Build

```bash
docker build -t vaultpdf .
docker run -p 3000:80 vaultpdf
```

### Security Headers

The Docker setup includes an Nginx reverse proxy that adds:
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy (no camera, microphone, geolocation)

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui |
| PDF Engine | pdf-lib (manipulation) + pdfjs-dist (rendering) |
| OCR | Tesseract.js (WASM) |
| Word | docx (generation) + mammoth (parsing) |
| Excel | SheetJS / xlsx |
| Icons | Lucide React |
| Fonts | Geist Sans & Mono |
| Deployment | Docker (Nginx + Node.js standalone) |

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.

---

## 👥 Credits

Built with ❤️ by **Claude & AlBovo**.
