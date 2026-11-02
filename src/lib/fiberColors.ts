// Padrão Telcordia GR-20 / TIA-598 — sequência oficial de cores de fibra óptica
export const TELCORDIA_COLORS = [
  { nome: "Azul", hex: "#1976D2" },
  { nome: "Laranja", hex: "#F57C00" },
  { nome: "Verde", hex: "#2E7D32" },
  { nome: "Marrom", hex: "#795548" },
  { nome: "Cinza", hex: "#9E9E9E" },
  { nome: "Branco", hex: "#F5F5F5" },
  { nome: "Vermelho", hex: "#D32F2F" },
  { nome: "Preto", hex: "#212121" },
  { nome: "Amarelo", hex: "#FBC02D" },
  { nome: "Violeta", hex: "#7B1FA2" },
  { nome: "Rosa", hex: "#EC407A" },
  { nome: "Aqua", hex: "#00BCD4" },
] as const;

export type FiberColorName = typeof TELCORDIA_COLORS[number]["nome"];

export function colorHex(name?: string | null): string {
  const found = TELCORDIA_COLORS.find((c) => c.nome === name);
  return found?.hex ?? "#22d3ee";
}

export function nextTelcordiaColor(index: number): FiberColorName {
  return TELCORDIA_COLORS[index % TELCORDIA_COLORS.length].nome;
}
