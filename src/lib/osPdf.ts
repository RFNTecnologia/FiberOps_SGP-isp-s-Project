import jsPDF from "jspdf";
import type { OrdemServico } from "./network";
import { osPrioridadeLabel, osStatusLabel, osTipoLabel } from "./network";

function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("pt-BR");
}

export async function exportOSAsPDF(os: OrdemServico, clienteNome?: string | null) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 40;
  let y = 40;

  // Header
  pdf.setFillColor(11, 15, 20);
  pdf.rect(0, 0, pageW, 70, "F");
  pdf.setTextColor(34, 211, 238);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("FiberOps", margin, 34);
  pdf.setTextColor(200, 210, 220);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Ordem de Serviço", margin, 52);
  pdf.setFontSize(9);
  pdf.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, pageW - margin, 52, { align: "right" });

  // OS number badge
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(`OS #${String(os.numero).padStart(5, "0")}`, pageW - margin, 34, { align: "right" });

  y = 100;
  pdf.setTextColor(20, 20, 20);
  pdf.setFontSize(11);

  const rows: [string, string][] = [
    ["Tipo", osTipoLabel[os.tipo]],
    ["Status", osStatusLabel[os.status]],
    ["Prioridade", osPrioridadeLabel[os.prioridade]],
    ["Técnico", os.tecnico || "—"],
    ["Data agendada", fmtDate(os.data_agendada)],
    ["Cliente", clienteNome || "—"],
    ["Endereço", os.endereco || "—"],
    ["Localização",
      os.latitude != null && os.longitude != null
        ? `${os.latitude.toFixed(6)}, ${os.longitude.toFixed(6)}`
        : "—"],
  ];

  pdf.setDrawColor(220);
  for (const [k, v] of rows) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(80);
    pdf.text(k, margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(20);
    const lines = pdf.splitTextToSize(v, pageW - margin * 2 - 130);
    pdf.text(lines, margin + 130, y);
    y += Math.max(18, lines.length * 14);
  }

  y += 8;
  pdf.setDrawColor(220);
  pdf.line(margin, y, pageW - margin, y);
  y += 20;

  // Descrição
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(80);
  pdf.text("Descrição do serviço", margin, y);
  y += 16;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(20);
  const desc = pdf.splitTextToSize(os.descricao || "—", pageW - margin * 2);
  pdf.text(desc, margin, y);
  y += desc.length * 14 + 16;

  // Notas
  if (os.notas?.length) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(80);
    pdf.text("Histórico / Anotações", margin, y);
    y += 16;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(20);
    for (const n of os.notas) {
      if (y > pdf.internal.pageSize.getHeight() - 60) { pdf.addPage(); y = 40; }
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text(fmtDate(n.ts), margin, y);
      y += 12;
      pdf.setFontSize(11);
      pdf.setTextColor(20);
      const nl = pdf.splitTextToSize(n.texto, pageW - margin * 2);
      pdf.text(nl, margin, y);
      y += nl.length * 14 + 10;
    }
  }

  // Espaço para assinatura
  if (y > pdf.internal.pageSize.getHeight() - 120) { pdf.addPage(); y = 40; }
  y = pdf.internal.pageSize.getHeight() - 100;
  pdf.setDrawColor(150);
  pdf.line(margin, y, margin + 220, y);
  pdf.line(pageW - margin - 220, y, pageW - margin, y);
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text("Assinatura do técnico", margin, y + 14);
  pdf.text("Assinatura do cliente", pageW - margin - 220, y + 14);

  pdf.save(`OS-${String(os.numero).padStart(5, "0")}.pdf`);
}
