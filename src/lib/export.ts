import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

async function capture(el: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    backgroundColor: "#0b0f14",
    useCORS: true,
    scale: 2,
    logging: false,
  });
}

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export async function exportElementAsImage(el: HTMLElement, name: string) {
  const canvas = await capture(el);
  const link = document.createElement("a");
  link.download = `${name}-${timestamp()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function exportElementAsPDF(el: HTMLElement, name: string, title: string) {
  const canvas = await capture(el);
  const imgData = canvas.toDataURL("image/png");
  const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const headerH = 40;
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2 - headerH;
  const ratio = Math.min(availW / canvas.width, availH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const x = (pageW - w) / 2;
  const y = margin + headerH;

  pdf.setFillColor(11, 15, 20);
  pdf.rect(0, 0, pageW, pageH, "F");
  pdf.setTextColor(230, 240, 245);
  pdf.setFontSize(14);
  pdf.text(title, margin, margin + 18);
  pdf.setFontSize(9);
  pdf.setTextColor(150, 160, 170);
  pdf.text(`FiberOps · Gerado em ${new Date().toLocaleString("pt-BR")}`, margin, margin + 34);

  pdf.addImage(imgData, "PNG", x, y, w, h);
  pdf.save(`${name}-${timestamp()}.pdf`);
}
