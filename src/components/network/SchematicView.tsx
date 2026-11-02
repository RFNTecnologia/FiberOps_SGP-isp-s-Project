import { useMemo } from "react";
import { colorHex } from "@/lib/fiberColors";
import type { CaixaEmenda, Cliente, Conexao, Cto, Olt } from "@/lib/network";

type Props = {
  olts: Olt[];
  ceos: CaixaEmenda[];
  ctos: Cto[];
  clientes: Cliente[];
  conexoes: Conexao[];
};

/* ---------------- geometry constants ---------------- */
const PAD = 28;
const LANE_GAP = 18;
const CENTRAL_W = 300;
const CLIENTE_W = 220;
const DIST_W = 640;
const WIDTH = PAD * 2 + CENTRAL_W + LANE_GAP + DIST_W + LANE_GAP + CLIENTE_W;

const X_OLT = PAD + 24;
const X_DIO = PAD + 170;
const X_DIST0 = PAD + CENTRAL_W + LANE_GAP;
const X_SPLICE = X_DIST0 + 70;
const X_SPLITTER = X_DIST0 + 210;
const SPLITTER_W = 62;
const X_STUB_END = X_SPLITTER + SPLITTER_W + 120;
const X_CLIENT = PAD + CENTRAL_W + LANE_GAP + DIST_W + LANE_GAP + 24;

const STUB_GAP = 13;
const ROW_MIN = 96;
const ROW_PAD = 62;

/* ---------------- tiny svg primitives ---------------- */
function Connector({ x, y }: { x: number; y: number }) {
  return <rect x={x - 5} y={y - 5} width={10} height={10} rx={1.5} className="fill-[var(--sch-connector)]" />;
}
function Splice({ x, y }: { x: number; y: number }) {
  return (
    <circle cx={x} cy={y} r={5.5} className="fill-[var(--sch-splice)] stroke-[var(--sch-line)]" strokeWidth={1} />
  );
}
/** rolinho de reserva de fibra (dois anéis), como no desenho de referência */
function FiberCoil({ x, y, stroke }: { x: number; y: number; stroke: string }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth={1.6}>
      <circle cx={x - 5} cy={y} r={7.5} />
      <circle cx={x + 5} cy={y} r={7.5} />
    </g>
  );
}

export function SchematicView({ olts, ceos, ctos, clientes, conexoes }: Props) {
  const model = useMemo(() => {
    const cliByCto = new Map<string, Cliente[]>();
    clientes.forEach((c) => {
      if (!c.cto_id) return;
      const a = cliByCto.get(c.cto_id) ?? [];
      a.push(c);
      cliByCto.set(c.cto_id, a);
    });

    const corDaCto = new Map<string, string>();
    conexoes.forEach((cx) => {
      if (cx.destino_tipo === "cto") corDaCto.set(cx.destino_id, cx.cor_fibra ?? "Azul");
    });

    const groups = olts.map((olt) => {
      const list = ctos
        .filter((c) => c.olt_id === olt.id)
        .sort((a, b) => (a.porta_pon ?? 999) - (b.porta_pon ?? 999));
      const rows = list.map((cto) => {
        const cls = (cliByCto.get(cto.id) ?? []).sort(
          (a, b) => (a.porta_cto ?? 999) - (b.porta_cto ?? 999),
        );
        const stubs = Math.max(2, Math.min(cto.portas_total ?? 8, 16));
        const height = Math.max(ROW_MIN, stubs * STUB_GAP + ROW_PAD);
        return {
          cto,
          clientes: cls,
          ceo: ceos.find((e) => e.id === cto.caixa_emenda_id) ?? null,
          cor: colorHex(corDaCto.get(cto.id) ?? "Azul"),
          stubs,
          height,
        };
      });
      const height = rows.reduce((s, r) => s + r.height, 0) || ROW_MIN;
      return { olt, rows, height };
    });

    const total = groups.reduce((s, g) => s + g.height, 0) + 140;
    return { groups, height: Math.max(360, total) };
  }, [olts, ceos, ctos, clientes, conexoes]);

  if (!olts.length) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Cadastre uma OLT e CTOs para gerar o esquema unifilar da rede.
        </p>
      </div>
    );
  }

  const H = model.height;
  let cursor = 60;

  return (
    <div className="h-full w-full overflow-auto bg-[var(--sch-bg)] p-4">
      <svg
        width={WIDTH}
        height={H}
        viewBox={`0 0 ${WIDTH} ${H}`}
        style={
          {
            "--sch-bg": "oklch(0.16 0.02 235)",
            "--sch-line": "oklch(0.88 0.02 235)",
            "--sch-frame": "oklch(0.45 0.03 235)",
            "--sch-text": "oklch(0.93 0.02 235)",
            "--sch-muted": "oklch(0.70 0.02 235)",
            "--sch-block": "oklch(0.42 0.03 240)",
            "--sch-panel": "oklch(0.30 0.05 230)",
            "--sch-splitter": "oklch(0.32 0.07 240)",
            "--sch-connector": "oklch(0.72 0.10 230)",
            "--sch-splice": "oklch(0.62 0.06 230)",
            "--sch-green": "oklch(0.70 0.16 155)",
            fontFamily: "Inter, system-ui, sans-serif",
          } as React.CSSProperties
        }
      >
        {/* ------- lanes ------- */}
        {[
          { x: PAD, w: CENTRAL_W, label: "Central" },
          { x: X_DIST0, w: DIST_W, label: "Rede óptica de distribuição" },
          { x: X_DIST0 + DIST_W + LANE_GAP, w: CLIENTE_W, label: "Cliente" },
        ].map((lane) => (
          <g key={lane.label}>
            <rect
              x={lane.x}
              y={26}
              width={lane.w}
              height={H - 52}
              rx={16}
              fill="none"
              className="stroke-[var(--sch-frame)]"
              strokeWidth={1.2}
            />
            <rect
              x={lane.x + lane.w / 2 - (lane.label.length * 3.6 + 22)}
              y={12}
              width={lane.label.length * 7.2 + 44}
              height={28}
              rx={14}
              className="fill-[var(--sch-panel)] stroke-[var(--sch-frame)]"
              strokeWidth={1}
            />
            <text
              x={lane.x + lane.w / 2}
              y={31}
              textAnchor="middle"
              fontSize={13}
              className="fill-[var(--sch-text)]"
            >
              {lane.label}
            </text>
          </g>
        ))}

        {/* ------- grupos por OLT ------- */}
        {model.groups.map((g) => {
          const top = cursor;
          cursor += g.height;
          const midY = top + g.height / 2;

          return (
            <g key={g.olt.id}>
              {/* OLT */}
              <rect
                x={X_OLT}
                y={midY - 34}
                width={104}
                height={68}
                rx={3}
                className="fill-[var(--sch-block)] stroke-[var(--sch-frame)]"
                strokeWidth={1}
              />
              <text x={X_OLT + 52} y={midY - 2} textAnchor="middle" fontSize={14} className="fill-[var(--sch-text)]">
                OLT
              </text>
              <text x={X_OLT + 52} y={midY + 15} textAnchor="middle" fontSize={9} className="fill-[var(--sch-muted)]">
                {g.olt.nome.slice(0, 16)}
              </text>

              {/* DIO */}
              <rect
                x={X_DIO}
                y={midY - 44}
                width={86}
                height={88}
                rx={3}
                className="fill-[var(--sch-block)] stroke-[var(--sch-frame)]"
                strokeWidth={1}
              />
              <text x={X_DIO + 56} y={midY - 26} textAnchor="middle" fontSize={12} className="fill-[var(--sch-text)]">
                DIO
              </text>
              {Array.from({ length: 5 }, (_, i) => (
                <Connector key={i} x={X_DIO + 12} y={midY - 32 + i * 17} />
              ))}

              {/* OLT -> DIO */}
              <line
                x1={X_OLT + 104}
                y1={midY}
                x2={X_DIO}
                y2={midY}
                className="stroke-[var(--sch-line)]"
                strokeWidth={2.5}
              />
              <Connector x={X_OLT + 104} y={midY} />
              <rect x={X_DIO - 5} y={midY - 5} width={10} height={10} rx={1.5} className="fill-[var(--sch-green)]" />

              {/* saída do DIO até o barramento vertical */}
              <line
                x1={X_DIO + 86}
                y1={midY}
                x2={X_DIST0 + 26}
                y2={midY}
                className="stroke-[var(--sch-line)]"
                strokeWidth={2.5}
              />
              <text
                x={(X_DIO + 86 + X_DIST0 + 26) / 2}
                y={midY - 10}
                textAnchor="middle"
                fontSize={8.5}
                className="fill-[var(--sch-muted)]"
              >
                cabo alimentação
              </text>

              {/* barramento vertical de distribuição */}
              {g.rows.length > 1 && (
                <line
                  x1={X_DIST0 + 26}
                  y1={top + g.rows[0].height / 2}
                  x2={X_DIST0 + 26}
                  y2={cursor - g.rows[g.rows.length - 1].height / 2}
                  className="stroke-[var(--sch-line)]"
                  strokeWidth={2}
                />
              )}

              {/* ------- linhas (uma por CTO) ------- */}
              {(() => {
                let rowY = top;
                return g.rows.map((r) => {
                  const y = rowY + r.height / 2;
                  rowY += r.height;
                  const triTop = y - (r.stubs * STUB_GAP) / 2;
                  const triH = r.stubs * STUB_GAP;

                  return (
                    <g key={r.cto.id}>
                      {/* tronco -> emenda -> splitter */}
                      <line
                        x1={X_DIST0 + 26}
                        y1={y}
                        x2={X_SPLITTER}
                        y2={y}
                        stroke={r.cor}
                        strokeWidth={2.5}
                      />
                      <FiberCoil x={X_SPLICE - 34} y={y} stroke={r.cor} />
                      <Splice x={X_SPLICE} y={y} />
                      <text
                        x={X_SPLICE}
                        y={y + 20}
                        textAnchor="middle"
                        fontSize={8.5}
                        className="fill-[var(--sch-muted)]"
                      >
                        {r.ceo ? `emenda · ${r.ceo.nome.slice(0, 14)}` : "emenda"}
                      </text>
                      <text
                        x={X_SPLICE + 62}
                        y={y - 9}
                        textAnchor="middle"
                        fontSize={8.5}
                        className="fill-[var(--sch-muted)]"
                      >
                        {r.cto.porta_pon ? `PON ${r.cto.porta_pon}` : "distribuição"}
                      </text>

                      {/* caixa do splitter (CTO) */}
                      <rect
                        x={X_SPLITTER - 16}
                        y={triTop - 16}
                        width={SPLITTER_W + 34}
                        height={triH + 32}
                        rx={8}
                        className="fill-[var(--sch-splitter)] stroke-[var(--sch-frame)]"
                        strokeWidth={1}
                      />
                      <polygon
                        points={`${X_SPLITTER},${y} ${X_SPLITTER + SPLITTER_W},${triTop} ${X_SPLITTER + SPLITTER_W},${triTop + triH}`}
                        className="fill-[var(--sch-block)] stroke-[var(--sch-line)]"
                        strokeWidth={1}
                      />
                      <text
                        x={X_SPLITTER + SPLITTER_W - 28}
                        y={y + 4}
                        textAnchor="middle"
                        fontSize={10}
                        className="fill-[var(--sch-text)]"
                      >
                        1x{r.cto.portas_total ?? r.stubs}
                      </text>
                      <text
                        x={X_SPLITTER + SPLITTER_W / 2}
                        y={triTop - 24}
                        textAnchor="middle"
                        fontSize={9}
                        className="fill-[var(--sch-text)]"
                      >
                        {r.cto.nome}
                      </text>

                      {/* saídas do splitter */}
                      {Array.from({ length: r.stubs }, (_, i) => {
                        const sy = triTop + i * STUB_GAP + STUB_GAP / 2;
                        const cli = r.clientes.find((c) => c.porta_cto === i + 1) ?? null;
                        const busy = !!cli;
                        return (
                          <g key={i}>
                            <line
                              x1={X_SPLITTER + SPLITTER_W}
                              y1={sy}
                              x2={busy ? X_STUB_END : X_SPLITTER + SPLITTER_W + 44}
                              y2={sy}
                              stroke={busy ? r.cor : "var(--sch-muted)"}
                              strokeWidth={busy ? 2 : 1.2}
                              strokeDasharray={busy ? undefined : "3 3"}
                            />
                            <text
                              x={X_SPLITTER + SPLITTER_W + 6}
                              y={sy - 3}
                              fontSize={7}
                              className="fill-[var(--sch-muted)]"
                            >
                              p{i + 1}
                            </text>
                            {busy && (
                              <>
                                <line
                                  x1={X_STUB_END}
                                  y1={sy}
                                  x2={X_CLIENT}
                                  y2={sy}
                                  stroke={r.cor}
                                  strokeWidth={1.6}
                                />
                                <rect
                                  x={X_CLIENT}
                                  y={sy - 8}
                                  width={112}
                                  height={16}
                                  rx={2.5}
                                  className="fill-[var(--sch-block)] stroke-[var(--sch-frame)]"
                                  strokeWidth={0.8}
                                />
                                <rect x={X_CLIENT - 5} y={sy - 4} width={8} height={8} rx={1} className="fill-[var(--sch-connector)]" />
                                <text x={X_CLIENT + 8} y={sy + 3.5} fontSize={7.5} className="fill-[var(--sch-text)]">
                                  ONU · {(cli?.nome ?? "").slice(0, 18)}
                                </text>
                              </>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  );
                });
              })()}
            </g>
          );
        })}

        {/* ------- legenda ------- */}
        <g transform={`translate(${X_DIST0 + 40}, ${H - 34})`}>
          <line x1={0} y1={0} x2={26} y2={0} className="stroke-[var(--sch-line)]" strokeWidth={2.5} />
          <text x={34} y={3.5} fontSize={9} className="fill-[var(--sch-text)]">Fibra</text>
          <circle cx={92} cy={0} r={5.5} className="fill-[var(--sch-splice)] stroke-[var(--sch-line)]" strokeWidth={1} />
          <text x={104} y={3.5} fontSize={9} className="fill-[var(--sch-text)]">Emenda</text>
          <rect x={166} y={-5} width={10} height={10} rx={1.5} className="fill-[var(--sch-connector)]" />
          <text x={182} y={3.5} fontSize={9} className="fill-[var(--sch-text)]">Conector</text>
          <line x1={246} y1={0} x2={272} y2={0} stroke="var(--sch-muted)" strokeWidth={1.2} strokeDasharray="3 3" />
          <text x={280} y={3.5} fontSize={9} className="fill-[var(--sch-text)]">Porta livre</text>
        </g>
      </svg>
    </div>
  );
}
