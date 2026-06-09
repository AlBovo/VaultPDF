"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export type Lang = "en" | "it"

type Dict = Record<string, { en: string; it: string }>

// Central dictionary. Keys are stable; values per language.
export const dict: Dict = {
  // Brand / global
  "brand.tagline": {
    en: "Private PDF tools that never leave your browser",
    it: "Strumenti PDF privati che non lasciano mai il tuo browser",
  },
  "nav.tools": { en: "Tools", it: "Strumenti" },
  "nav.privacy": { en: "Privacy", it: "Privacy" },
  "common.back": { en: "Back to all tools", it: "Torna a tutti gli strumenti" },
  "common.dropTitle": {
    en: "Drop files here or click to browse",
    it: "Trascina i file qui o clicca per sfogliare",
  },
  "common.dropHint": {
    en: "Files are processed locally and never uploaded",
    it: "I file vengono elaborati localmente e mai caricati",
  },
  "common.download": { en: "Download result", it: "Scarica il risultato" },
  "common.processing": { en: "Processing…", it: "Elaborazione…" },
  "common.run": { en: "Run", it: "Esegui" },
  "common.reset": { en: "Reset", it: "Reimposta" },
  "common.selectFile": { en: "Select a file to begin", it: "Seleziona un file per iniziare" },
  "common.pages": { en: "pages", it: "pagine" },
  "common.localBadge": { en: "100% local", it: "100% locale" },

  // Hero
  "hero.title": {
    en: "Your documents never leave this device",
    it: "I tuoi documenti non lasciano mai questo dispositivo",
  },
  "hero.subtitle": {
    en: "VaultPDF runs every operation entirely in your browser. No uploads, no servers, no tracking — just fast, private PDF tools.",
    it: "VaultPDF esegue ogni operazione interamente nel tuo browser. Nessun caricamento, nessun server, nessun tracciamento — solo strumenti PDF veloci e privati.",
  },
  "hero.cta": { en: "Explore the tools", it: "Esplora gli strumenti" },
  "hero.feature1.title": { en: "Zero uploads", it: "Zero caricamenti" },
  "hero.feature1.desc": {
    en: "Files are read and written in memory on your machine.",
    it: "I file vengono letti e scritti in memoria sul tuo dispositivo.",
  },
  "hero.feature2.title": { en: "No account needed", it: "Nessun account richiesto" },
  "hero.feature2.desc": {
    en: "Every tool is free and works without signing in.",
    it: "Ogni strumento è gratuito e funziona senza accedere.",
  },
  "hero.feature3.title": { en: "Open & inspectable", it: "Aperto e ispezionabile" },
  "hero.feature3.desc": {
    en: "Built with audited client-side libraries you can verify.",
    it: "Realizzato con librerie client verificabili.",
  },

  // Categories
  "cat.optimize": { en: "Optimization & Organization", it: "Ottimizzazione e Organizzazione" },
  "cat.security": { en: "Security & Sanitization", it: "Sicurezza e Sanificazione" },
  "cat.edit": { en: "Editing Tools", it: "Strumenti di Modifica" },
  "cat.convert": { en: "Conversion Tools", it: "Strumenti di Conversione" },
  "cat.generate": { en: "Document Generation", it: "Generazione di Documenti" },

  // Tools
  "t.compress-pdf.name": { en: "Compress PDF", it: "Comprimi PDF" },
  "t.compress-pdf.desc": {
    en: "Reduce file size without losing visual quality.",
    it: "Riduci le dimensioni del file senza perdere qualità visiva.",
  },
  "t.compress-ppt.name": { en: "Compress PPT", it: "Comprimi PPT" },
  "t.compress-ppt.desc": {
    en: "Shrink PowerPoint files by compressing their images.",
    it: "Riduci i file PowerPoint comprimendo le immagini interne.",
  },
  "t.merge-pdf.name": { en: "Merge PDF", it: "Unisci PDF" },
  "t.merge-pdf.desc": {
    en: "Combine multiple PDF files into one document.",
    it: "Combina più file PDF in un unico documento.",
  },
  "t.split-pdf.name": { en: "Split PDF", it: "Dividi PDF" },
  "t.split-pdf.desc": {
    en: "Extract specific pages into separate files.",
    it: "Estrai pagine specifiche in file separati.",
  },
  "t.redact-pdf.name": { en: "Redact PDF", it: "Oscura PDF" },
  "t.redact-pdf.desc": {
    en: "Permanently black out sensitive areas of a document.",
    it: "Oscura permanentemente le aree sensibili di un documento.",
  },
  "t.auto-redact.name": { en: "Auto-Redact PII", it: "Auto-Oscuramento PII" },
  "t.auto-redact.desc": {
    en: "Detect and hide personal data like emails and card numbers.",
    it: "Rileva e nasconde dati personali come email e numeri di carta.",
  },
  "t.strip-metadata.name": { en: "Strip Metadata", it: "Rimuovi Metadati" },
  "t.strip-metadata.desc": {
    en: "Destroy embedded metadata and hidden document properties.",
    it: "Distruggi i metadati incorporati e le proprietà nascoste.",
  },
  "t.flatten-pdf.name": { en: "Flatten PDF", it: "Appiattisci PDF" },
  "t.flatten-pdf.desc": {
    en: "Permanently print form fields and layers onto the page.",
    it: "Stampa permanentemente campi modulo e livelli sulla pagina.",
  },
  "t.sanitize-llm.name": { en: "Sanitize for LLMs", it: "Sanifica per LLM" },
  "t.sanitize-llm.desc": {
    en: "Clean PDF text for safe pasting into ChatGPT or Claude.",
    it: "Pulisci il testo del PDF per incollarlo in ChatGPT o Claude.",
  },
  "t.pdf-ocr.name": { en: "PDF OCR", it: "OCR per PDF" },
  "t.pdf-ocr.desc": {
    en: "Make scanned PDFs searchable with optical character recognition.",
    it: "Rendi i PDF scansionati ricercabili con il riconoscimento OCR.",
  },
  "t.edit-pdf.name": { en: "Edit PDF", it: "Modifica PDF" },
  "t.edit-pdf.desc": {
    en: "Add text, draw, insert images and reorder pages.",
    it: "Aggiungi testo, disegna, inserisci immagini e riordina le pagine.",
  },
  "t.watermark.name": { en: "Add Watermark", it: "Aggiungi Filigrana" },
  "t.watermark.desc": {
    en: "Overlay text watermarks onto every page of a PDF.",
    it: "Applica filigrane di testo su ogni pagina del PDF.",
  },
  "t.remove-pages.name": { en: "Remove Pages", it: "Rimuovi Pagine" },
  "t.remove-pages.desc": {
    en: "Delete unwanted pages from a file.",
    it: "Elimina le pagine indesiderate da un file.",
  },
  "t.rotate-pdf.name": { en: "Rotate PDF", it: "Ruota PDF" },
  "t.rotate-pdf.desc": {
    en: "Rotate individual pages or the entire document.",
    it: "Ruota singole pagine o l'intero documento.",
  },
  "t.unlock-pdf.name": { en: "Unlock PDF", it: "Sblocca PDF" },
  "t.unlock-pdf.desc": {
    en: "Remove passwords and printing or editing restrictions.",
    it: "Rimuovi password e restrizioni di stampa o modifica.",
  },
  "t.sign-pdf.name": { en: "Sign PDF", it: "Firma PDF" },
  "t.sign-pdf.desc": {
    en: "Add your signature to any PDF privately.",
    it: "Aggiungi la tua firma a qualsiasi PDF in modo privato.",
  },
  "t.pdf-to-excel.name": { en: "PDF to Excel", it: "Da PDF a Excel" },
  "t.pdf-to-excel.desc": {
    en: "Extract tables from a PDF into a spreadsheet.",
    it: "Estrai le tabelle da un PDF in un foglio di calcolo.",
  },
  "t.pdf-to-word.name": { en: "PDF to Word", it: "Da PDF a Word" },
  "t.pdf-to-word.desc": {
    en: "Convert a PDF into an editable document.",
    it: "Converti un PDF in un documento modificabile.",
  },
  "t.pdf-to-images.name": { en: "PDF to Images", it: "Da PDF a Immagini" },
  "t.pdf-to-images.desc": {
    en: "Export PDF pages as PNG images.",
    it: "Esporta le pagine del PDF come immagini PNG.",
  },
  "t.images-to-pdf.name": { en: "Images to PDF", it: "Da Immagini a PDF" },
  "t.images-to-pdf.desc": {
    en: "Convert JPG or PNG images into a PDF document.",
    it: "Converti immagini JPG o PNG in un documento PDF.",
  },
  "t.csv-to-pdf.name": { en: "CSV to PDF", it: "Da CSV a PDF" },
  "t.csv-to-pdf.desc": {
    en: "Generate a PDF table from raw CSV data.",
    it: "Genera una tabella PDF da dati CSV grezzi.",
  },
  "t.word-to-pdf.name": { en: "Word to PDF", it: "Da Word a PDF" },
  "t.word-to-pdf.desc": {
    en: "Convert Microsoft Word documents to PDF in the browser.",
    it: "Converti documenti Word in PDF nel browser.",
  },
  "t.compare-pdf.name": { en: "Compare PDF", it: "Confronta PDF" },
  "t.compare-pdf.desc": {
    en: "Find and highlight differences between two PDFs.",
    it: "Trova ed evidenzia le differenze tra due PDF.",
  },
  "t.nda-generator.name": { en: "NDA Generator", it: "Generatore di NDA" },
  "t.nda-generator.desc": {
    en: "Fill in and generate a professional NDA privately.",
    it: "Compila e genera un NDA professionale in modo privato.",
  },

  // Shared tool strings
  "common.needFile": { en: "Please add a file first.", it: "Aggiungi prima un file." },
  "common.done": { en: "Done — your file is downloading.", it: "Fatto — il file è in download." },
  "common.error": { en: "Something went wrong with this file.", it: "Qualcosa è andato storto con questo file." },

  // Compress
  "compress.before": { en: "Original size", it: "Dimensione originale" },
  "compress.after": { en: "New size", it: "Nuova dimensione" },
  "compress.saved": { en: "Reduced by {pct}%", it: "Ridotto del {pct}%" },

  // Unlock
  "unlock.note": {
    en: "Removes owner-password restrictions (printing, copying, editing). Files locked with a user open-password cannot be opened without it.",
    it: "Rimuove le restrizioni della password proprietario (stampa, copia, modifica). I file protetti da password di apertura non possono essere aperti senza di essa.",
  },
  "unlock.error": {
    en: "This file needs an open password we can't bypass.",
    it: "Questo file richiede una password di apertura che non possiamo aggirare.",
  },

  // Sanitize for LLMs
  "sanitize.extract": { en: "Extract & sanitize text", it: "Estrai e sanifica il testo" },
  "sanitize.copy": { en: "Copy text", it: "Copia testo" },
  "sanitize.copied": { en: "Copied to clipboard", it: "Copiato negli appunti" },
  "sanitize.downloadTxt": { en: "Download .txt", it: "Scarica .txt" },
  "sanitize.placeholder": {
    en: "Sanitized text will appear here…",
    it: "Il testo sanificato apparirà qui…",
  },
  "sanitize.stripPii": { en: "Mask emails, phones & card numbers", it: "Maschera email, telefoni e numeri di carta" },
  "sanitize.empty": { en: "No extractable text found (the PDF may be scanned images).", it: "Nessun testo estraibile trovato (il PDF potrebbe essere immagini scansionate)." },

  // Sign
  "sign.draw": { en: "Draw your signature below", it: "Disegna la tua firma qui sotto" },
  "sign.clear": { en: "Clear", it: "Cancella" },
  "sign.page": { en: "Page", it: "Pagina" },
  "sign.place": { en: "Click on the page to place your signature", it: "Clicca sulla pagina per posizionare la firma" },
  "sign.needSig": { en: "Draw a signature first.", it: "Disegna prima una firma." },
  "sign.apply": { en: "Apply signature & download", it: "Applica firma e scarica" },

  // CSV to PDF
  "csv.label": { en: "Paste CSV data", it: "Incolla i dati CSV" },
  "csv.placeholder": {
    en: "Name,Email,Role\nJane,jane@acme.com,CEO",
    it: "Nome,Email,Ruolo\nMaria,maria@acme.it,CEO",
  },
  "csv.header": { en: "First row is a header", it: "La prima riga è un'intestazione" },
  "csv.title": { en: "Document title (optional)", it: "Titolo del documento (opzionale)" },
  "csv.empty": { en: "Enter some CSV data first.", it: "Inserisci prima dei dati CSV." },
  "csv.generate": { en: "Generate PDF", it: "Genera PDF" },

  // NDA generator
  "nda.disclosing": { en: "Disclosing party", it: "Parte divulgante" },
  "nda.receiving": { en: "Receiving party", it: "Parte ricevente" },
  "nda.purpose": { en: "Purpose of disclosure", it: "Scopo della divulgazione" },
  "nda.term": { en: "Term (years)", it: "Durata (anni)" },
  "nda.governing": { en: "Governing law / jurisdiction", it: "Legge applicabile / giurisdizione" },
  "nda.generate": { en: "Generate NDA PDF", it: "Genera PDF NDA" },
  "nda.note": {
    en: "This is a general-purpose template, not legal advice. Have a lawyer review before use.",
    it: "Questo è un modello generico, non consulenza legale. Fallo revisionare da un avvocato prima dell'uso.",
  },

  // Coming soon
  "common.comingSoon": { en: "Coming soon", it: "In arrivo" },
  "common.comingSoonDesc": {
    en: "This tool is on the roadmap. It will run fully in your browser like the rest.",
    it: "Questo strumento è in arrivo. Funzionerà interamente nel tuo browser come gli altri.",
  },
}

type I18nContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en")

  useEffect(() => {
    const stored = window.localStorage.getItem("vaultpdf-lang") as Lang | null
    if (stored === "en" || stored === "it") {
      setLangState(stored)
    } else if (navigator.language.toLowerCase().startsWith("it")) {
      setLangState("it")
    }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    window.localStorage.setItem("vaultpdf-lang", l)
  }

  const t = (key: string) => {
    const entry = dict[key]
    if (!entry) return key
    return entry[lang]
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
