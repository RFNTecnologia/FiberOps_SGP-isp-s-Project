import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { TELCORDIA_COLORS, colorHex } from "@/lib/fiberColors";
import { statusLabel, type CaixaEmenda, type Cliente, type Conexao, type Cto, type Olt } from "@/lib/network";

const BG: [number, number, number] = [11, 15, 20];
const FG: [number, number, number] = [230, 240, 245];
const MUTED: [number, number, number] = [150, 160, 170];
const ACCENT: [number, number, number] = [34, 211, 238];

export type FtthDocData = {
  olts: Olt[];
  ceos: CaixaEmenda[];
  ctos: Cto[];
  clientes: Cliente[];
  conexoes: Conexao[];
};

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}

export async function exportFtthDocumentation(el: HTMLElement | null, data: FtthDocData) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 32;
  const emissao = new Date().toLocaleString("pt-BR");
  let pageNo = 0;

  const newPage = (title: string, first = false) => {
    if (!first) pdf.addPage();
    pageNo += 1;
    pdf.setFillColor(...BG);
    pdf.rect(0, 0, pageW, pageH, "F");
    pdf.setTextColor(...ACCENT);
    pdf.setFontSize(9);
    pdf.text("FIBEROPS · DOCUMENTAÇÃO DA REDE FTTH", margin, margin - 8);
    pdf.setTextColor(...FG);
    pdf.setFontSize(16);
    pdf.text(title, margin, margin + 16);
    pdf.setDrawColor(40, 52, 62);
    pdf.line(margin, margin + 26, pageW - margin, margin + 26);
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    pdf.text(`Emitido em ${emissao}`, margin, pageH - 16);
    pdf.text(`Página ${pageNo}`, pageW - margin, pageH - 16, { align: "right" });
    return margin + 48;
  };

  // ---------- Página 1: capa / contagens ----------
  let y = newPage("Resumo da rede", true);
  const cards: [string, number][] = [
    ["OLTs", data.olts.length],
    ["Caixas de emenda (CEO)", data.ceos.length],
    ["CTOs", data.ctos.length],
    ["Clientes", data.clientes.length],
    ["Fibras (conexões)", data.conexoes.length],
    ["Portas PON totais", data.olts.reduce((s, o) => s + (o.portas_pon ?? 0), 0)],
    ["Portas CTO totais", data.ctos.reduce((s, c) => s + (c.portas_total ?? 0), 0)],
    ["Portas CTO ocupadas", data.clientes.filter((c) => c.cto_id && c.porta_cto).length],
  ];
  const cardW = (pageW - margin * 2 - 18 * 3) / 4;
  const cardH = 62;
  cards.forEach((c, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = margin + col * (cardW + 18);
    const cy = y + row * (cardH + 16);
    pdf.setFillColor(19, 26, 33);
    pdf.setDrawColor(40, 52, 62);
    pdf.roundedRect(x, cy, cardW, cardH, 5, 5, "FD");
    pdf.setTextColor(...MUTED);
    pdf.setFontSize(8);
    pdf.text(c[0].toUpperCase(), x + 12, cy + 18);
    pdf.setTextColor(...FG);
    pdf.setFontSize(22);
    pdf.text(String(c[1]), x + 12, cy + 46);
  });
  y += cardH * 2 + 16 + 30;

  // legenda Telcordia
  pdf.setTextColor(...FG);
  pdf.setFontSize(11);
  pdf.text("Padrão de cores de fibra (Telcordia GR-20 / TIA-598)", margin, y);
  y += 16;
  TELCORDIA_COLORS.forEach((c, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const x = margin + col * 150;
    const cy = y + row * 24;
    const [r, g, b] = hexToRgb(c.hex);
    pdf.setFillColor(r, g, b);
    pdf.setDrawColor(60, 72, 82);
    pdf.roundedRect(x, cy, 14, 14, 3, 3, "FD");
    pdf.setTextColor(...FG);
    pdf.setFontSize(9);
    pdf.text(`${i + 1}. ${c.nome}`, x + 20, cy + 11);
  });

  // ---------- Página 2: diagrama ----------
  if (el) {
    const canvas = await html2canvas(el, { backgroundColor: "#0b0f14", useCORS: true, scale: 2, logging: false });
    y = newPage("Diagrama lógico da rede");
    const availW = pageW - margin * 2;
    const availH = pageH - y - 34;
    const ratio = Math.min(availW / canvas.width, availH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pageW - w) / 2, y, w, h);
  }

  // ---------- Páginas: réguas de portas ----------
  const ctosByOlt = new Map<string, Cto[]>();
  data.ctos.forEach((c) => {
    if (!c.olt_id) return;
    const arr = ctosByOlt.get(c.olt_id) ?? [];
    arr.push(c);
    ctosByOlt.set(c.olt_id, arr);
  });
  const cliByCto = new Map<string, Cliente[]>();
  data.clientes.forEach((cl) => {
    if (!cl.cto_id) return;
    const arr = cliByCto.get(cl.cto_id) ?? [];
    arr.push(cl);
    cliByCto.set(cl.cto_id, arr);
  });

  y = newPage("Mapa de portas — OLTs (PON)");
  const ensureSpace = (need: number, title: string) => {
    if (y + need > pageH - 40) y = newPage(title);
  };

  const drawPortStrip = (
    total: number,
    used: Map<number, string>,
    startY: number,
  ): number => {
    const size = 15;
    const gap = 5;
    const perRow = Math.floor((pageW - margin * 2) / (size + gap));
    const rows = Math.ceil(total / perRow);
    for (let p = 1; p <= total; p++) {
      const idx = p - 1;
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      const x = margin + col * (size + gap);
      const cy = startY + row * (size + gap + 6);
      const occupied = used.has(p);
      const hex = colorHex(TELCORDIA_COLORS[(p - 1) % 12].nome);
      const [r, g, b] = hexToRgb(hex);
      if (occupied) {
        pdf.setFillColor(r, g, b);
        pdf.setDrawColor(r, g, b);
        pdf.roundedRect(x, cy, size, size, 3, 3, "FD");
        pdf.setTextColor(20, 20, 20);
      } else {
        pdf.setFillColor(19, 26, 33);
        pdf.setDrawColor(r, g, b);
        pdf.roundedRect(x, cy, size, size, 3, 3, "FD");
        pdf.setTextColor(...MUTED);
      }
      pdf.setFontSize(6.5);
      pdf.text(String(p), x + size / 2, cy + size / 2 + 2.2, { align: "center" });
    }
    return startY + rows * (size + gap + 6);
  };

  data.olts.forEach((o) => {
    const total = o.portas_pon ?? 0;
    const used = new Map<number, string>();
    (ctosByOlt.get(o.id) ?? []).forEach((c) => { if (c.porta_pon) used.set(c.porta_pon, c.nome); });
    const rowsNeeded = Math.ceil(Math.max(total, 1) / Math.floor((pageW - margin * 2) / 20)) * 26 + 70;
    ensureSpace(rowsNeeded, "Mapa de portas — OLTs (PON)");
    pdf.setTextColor(...FG);
    pdf.setFontSize(11);
    pdf.text(`${o.nome}`, margin, y);
    pdf.setTextColor(...MUTED);
    pdf.setFontSize(8);
    pdf.text(
      `${o.modelo ?? "—"} · ${o.ip_gerencia ?? "sem IP"} · ${statusLabel[o.status]} · ${used.size}/${total} PON em uso`,
      margin,
      y + 12,
    );
    y = total > 0 ? drawPortStrip(total, used, y + 22) + 12 : y + 26;
    if (used.size) {
      pdf.setTextColor(...MUTED);
      pdf.setFontSize(8);
      const list = [...used.entries()].sort((a, b) => a[0] - b[0]).map(([p, n]) => `PON ${p} → ${n}`).join("   |   ");
      pdf.splitTextToSize(list, pageW - margin * 2).forEach((line: string) => {
        pdf.text(line, margin, y);
        y += 11;
      });
    }
    y += 14;
  });

  y = newPage("Mapa de portas — CTOs (assinantes)");
  data.ctos.forEach((c) => {
    const total = c.portas_total ?? 0;
    const used = new Map<number, string>();
    (cliByCto.get(c.id) ?? []).forEach((cl) => { if (cl.porta_cto) used.set(cl.porta_cto, cl.nome); });
    const rowsNeeded = Math.ceil(Math.max(total, 1) / Math.floor((pageW - margin * 2) / 20)) * 26 + 70;
    ensureSpace(rowsNeeded, "Mapa de portas — CTOs (assinantes)");
    const olt = data.olts.find((o) => o.id === c.olt_id);
    pdf.setTextColor(...FG);
    pdf.setFontSize(11);
    pdf.text(`${c.nome}`, margin, y);
    pdf.setTextColor(...MUTED);
    pdf.setFontSize(8);
    pdf.text(
      `${olt ? `${olt.nome} · PON ${c.porta_pon ?? "—"}` : "sem OLT"} · ${statusLabel[c.status]} · ${used.size}/${total} portas ocupadas · ${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`,
      margin,
      y + 12,
    );
    y = total > 0 ? drawPortStrip(total, used, y + 22) + 12 : y + 26;
    if (used.size) {
      pdf.setTextColor(...MUTED);
      pdf.setFontSize(8);
      const list = [...used.entries()].sort((a, b) => a[0] - b[0]).map(([p, n]) => `p${p} → ${n}`).join("   |   ");
      pdf.splitTextToSize(list, pageW - margin * 2).forEach((line: string) => {
        pdf.text(line, margin, y);
        y += 11;
      });
    }
    y += 14;
  });

  // ---------- Página: fibras ----------
  if (data.conexoes.length) {
    y = newPage("Fibras / conexões");
    const nameOf = (tipo: string, id: string) => {
      if (tipo === "olt") return data.olts.find((o) => o.id === id)?.nome ?? id;
      if (tipo === "ceo") return data.ceos.find((o) => o.id === id)?.nome ?? id;
      return data.ctos.find((o) => o.id === id)?.nome ?? id;
    };
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    pdf.text("COR", margin + 22, y);
    pdf.text("ORIGEM", margin + 110, y);
    pdf.text("DESTINO", margin + 320, y);
    pdf.text("COMPRIMENTO", margin + 530, y);
    y += 8;
    pdf.setDrawColor(40, 52, 62);
    pdf.line(margin, y, pageW - margin, y);
    y += 14;
    data.conexoes.forEach((cx) => {
      if (y > pageH - 50) { y = newPage("Fibras / conexões"); y += 4; }
      const [r, g, b] = hexToRgb(colorHex(cx.cor_fibra));
      pdf.setFillColor(r, g, b);
      pdf.roundedRect(margin, y - 8, 12, 10, 2, 2, "F");
      pdf.setTextColor(...FG);
      pdf.setFontSize(9);
      pdf.text(cx.cor_fibra ?? "—", margin + 22, y);
      pdf.text(`${cx.origem_tipo.toUpperCase()} · ${nameOf(cx.origem_tipo, cx.origem_id)}`, margin + 110, y);
      pdf.text(`${cx.destino_tipo.toUpperCase()} · ${nameOf(cx.destino_tipo, cx.destino_id)}`, margin + 320, y);
      pdf.text(cx.comprimento_metros != null ? `${cx.comprimento_metros} m` : "—", margin + 530, y);
      y += 16;
    });
  }

  pdf.save(`documentacao-ftth-${timestamp()}.pdf`);
}
