import { useState, type RefObject } from "react";
import { Download, FileImage, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { exportElementAsImage, exportElementAsPDF } from "@/lib/export";

type Props = {
  targetRef: RefObject<HTMLElement | null>;
  fileBaseName: string;
  pdfTitle: string;
  beforeExport?: () => Promise<void> | void;
  onExportDoc?: (el: HTMLElement) => Promise<void>;
  docLabel?: string;
};

export function ExportButtons({ targetRef, fileBaseName, pdfTitle, beforeExport, onExportDoc, docLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (kind: "png" | "pdf" | "doc") => {
    const el = targetRef.current;
    if (!el) return;
    setBusy(true);
    setOpen(false);
    try {
      if (beforeExport) await beforeExport();
      // small delay to let tiles/labels settle
      await new Promise((r) => setTimeout(r, 300));
      if (kind === "png") await exportElementAsImage(el, fileBaseName);
      else if (kind === "pdf") await exportElementAsPDF(el, fileBaseName, pdfTitle);
      else await onExportDoc?.(el);
      toast.success(kind === "png" ? "Imagem gerada" : "PDF gerado");
    } catch (e: any) {
      toast.error("Falha ao exportar: " + (e?.message ?? "erro"));
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-label="Abrir menu de exportação"
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        {busy ? "Exportando…" : "Exportar"}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 rounded-md border border-border bg-card shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => run("png")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left"
          >
            <FileImage className="h-3.5 w-3.5" /> Imagem PNG
          </button>
          <button
            onClick={() => run("pdf")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left"
          >
            <FileText className="h-3.5 w-3.5" /> Documento PDF
          </button>
          {onExportDoc && (
            <button
              onClick={() => run("doc")}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left border-t border-border"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" /> {docLabel ?? "Documentação FTTH (PDF)"}
            </button>
          )}

        </div>
      )}
    </div>
  );
}
