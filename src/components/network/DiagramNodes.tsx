import { Handle, Position, type NodeProps } from "reactflow";
import { Radio, Boxes, Router, User, Cpu, Smartphone } from "lucide-react";
import { TELCORDIA_COLORS } from "@/lib/fiberColors";

type Common = {
  label: string;
  sub?: string;
  badge?: string;
  status?: string;
  /** total de portas / fusões — desenha a régua de portas estilo documentação FTTH */
  ports?: number;
  /** portas ocupadas (números) */
  usedPorts?: number[];
  code?: string;
};

function statusDot(status?: string) {
  const map: Record<string, string> = {
    online: "#3fd39a",
    offline: "#f04e4e",
    aviso: "#eab13a",
    manutencao: "#8a94a6",
  };
  const c = map[status ?? ""] ?? "#8a94a6";
  return (
    <span
      className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-background"
      style={{ background: c }}
    />
  );
}

/** Régua de portas — bolinhas numeradas coloridas no padrão Telcordia, como em plantas FTTH */
function PortStrip({ ports, used }: { ports: number; used?: number[] }) {
  const n = Math.max(0, Math.min(ports, 24));
  if (!n) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-[3px] border-t border-white/10 pt-1.5">
      {Array.from({ length: n }, (_, i) => {
        const c = TELCORDIA_COLORS[i % TELCORDIA_COLORS.length];
        const occupied = used?.includes(i + 1);
        return (
          <span
            key={i}
            title={`Porta ${i + 1} · ${c.nome}${occupied ? " · ocupada" : " · livre"}`}
            className="h-[11px] w-[11px] rounded-full flex items-center justify-center text-[6px] font-bold leading-none"
            style={{
              background: occupied ? c.hex : "transparent",
              border: `1.5px solid ${c.hex}`,
              color: occupied ? (c.nome === "Branco" || c.nome === "Amarelo" ? "#111" : "#fff") : c.hex,
            }}
          >
            {i + 1}
          </span>
        );
      })}
    </div>
  );
}

const shellBase =
  "relative rounded-lg border shadow-md min-w-[168px] px-3 py-2 font-medium text-[12px]";

const handleStyle = { width: 8, height: 8, borderRadius: 2, border: "none" } as const;

export function OltNode({ data }: NodeProps<Common>) {
  return (
    <div
      className={shellBase}
      style={{
        background: "linear-gradient(135deg, oklch(0.32 0.10 200), oklch(0.24 0.06 200))",
        borderColor: "oklch(0.78 0.15 190 / 0.6)",
        color: "white",
      }}
    >
      {statusDot(data.status)}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-[oklch(0.78_0.15_190_/_0.2)] flex items-center justify-center shrink-0">
          <Radio className="h-4 w-4" style={{ color: "oklch(0.85 0.15 190)" }} />
        </div>
        <div className="leading-tight">
          <div className="text-[9px] uppercase tracking-widest opacity-70">OLT · Headend</div>
          <div className="font-semibold">{data.label}</div>
          {data.sub && <div className="text-[10px] opacity-70 font-mono">{data.sub}</div>}
        </div>
      </div>
      {data.ports ? <PortStrip ports={data.ports} used={data.usedPorts} /> : null}
      {data.ports ? (
        <div className="text-[8px] uppercase tracking-wider opacity-50 pt-0.5">Portas PON</div>
      ) : null}
      <Handle type="source" position={Position.Right} style={{ ...handleStyle, background: "oklch(0.78 0.15 190)" }} />
      <Handle type="target" position={Position.Left} style={{ ...handleStyle, background: "oklch(0.78 0.15 190)" }} />
    </div>
  );
}

export function CeoNode({ data }: NodeProps<Common>) {
  return (
    <div
      className={shellBase}
      style={{
        background: "linear-gradient(135deg, oklch(0.30 0.08 265), oklch(0.22 0.05 265))",
        borderColor: "oklch(0.65 0.15 260 / 0.6)",
        color: "white",
      }}
    >
      {statusDot(data.status)}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-[oklch(0.65_0.15_260_/_0.2)] flex items-center justify-center shrink-0">
          <Boxes className="h-4 w-4" style={{ color: "oklch(0.80 0.14 260)" }} />
        </div>
        <div className="leading-tight">
          <div className="text-[9px] uppercase tracking-widest opacity-70">CEO · Emenda</div>
          <div className="font-semibold">{data.label}</div>
          {data.sub && <div className="text-[10px] opacity-70">{data.sub}</div>}
        </div>
      </div>
      {data.ports ? <PortStrip ports={data.ports} used={data.usedPorts} /> : null}
      {data.ports ? (
        <div className="text-[8px] uppercase tracking-wider opacity-50 pt-0.5">Bandeja de fusões</div>
      ) : null}
      <Handle type="source" position={Position.Right} style={{ ...handleStyle, background: "oklch(0.65 0.15 260)" }} />
      <Handle type="target" position={Position.Left} style={{ ...handleStyle, background: "oklch(0.65 0.15 260)" }} />
    </div>
  );
}

export function CtoNode({ data }: NodeProps<Common>) {
  return (
    <div
      className={shellBase}
      style={{
        background: "linear-gradient(135deg, oklch(0.28 0.06 155), oklch(0.20 0.04 155))",
        borderColor: "oklch(0.65 0.14 155 / 0.6)",
        color: "white",
      }}
    >
      {statusDot(data.status)}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-[oklch(0.65_0.14_155_/_0.2)] flex items-center justify-center shrink-0">
          <Router className="h-4 w-4" style={{ color: "oklch(0.82 0.14 155)" }} />
        </div>
        <div className="leading-tight">
          <div className="text-[9px] uppercase tracking-widest opacity-70">CTO · Splitter</div>
          <div className="font-semibold">{data.label}</div>
          {data.sub && <div className="text-[10px] opacity-70 font-mono">{data.sub}</div>}
        </div>
      </div>
      {data.ports ? <PortStrip ports={data.ports} used={data.usedPorts} /> : null}
      {data.ports ? (
        <div className="text-[8px] uppercase tracking-wider opacity-50 pt-0.5">
          Portas de assinante {data.usedPorts?.length ? `· ${data.usedPorts.length}/${data.ports} em uso` : ""}
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} style={{ ...handleStyle, background: "oklch(0.65 0.14 155)" }} />
      <Handle type="target" position={Position.Left} style={{ ...handleStyle, background: "oklch(0.65 0.14 155)" }} />
    </div>
  );
}

export function ClienteNode({ data }: NodeProps<Common>) {
  return (
    <div
      className="relative rounded-md border px-2.5 py-1.5 min-w-[140px] flex items-center gap-2 text-[11px]"
      style={{
        background: "oklch(0.22 0.02 240)",
        borderColor: "oklch(0.45 0.02 240)",
        color: "oklch(0.92 0.02 240)",
      }}
    >
      {statusDot(data.status)}
      <div className="h-6 w-6 rounded-full bg-[oklch(0.42_0.02_240)] flex items-center justify-center shrink-0">
        <User className="h-3.5 w-3.5" style={{ color: "oklch(0.85 0.05 200)" }} />
      </div>
      <div className="leading-tight">
        <div className="font-medium truncate max-w-[110px]">{data.label}</div>
        {data.sub && <div className="text-[9px] opacity-70 font-mono">{data.sub}</div>}
      </div>
      <Handle type="target" position={Position.Left} style={{ ...handleStyle, background: "oklch(0.55 0.05 200)" }} />
    </div>
  );
}

export function RbNode({ data }: NodeProps<Common>) {
  return (
    <div
      className={shellBase}
      style={{
        background: "linear-gradient(135deg, oklch(0.35 0.05 320), oklch(0.25 0.03 320))",
        borderColor: "oklch(0.70 0.10 320 / 0.6)",
        color: "white",
      }}
    >
      {statusDot(data.status)}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-[oklch(0.70_0.10_320_/_0.2)] flex items-center justify-center shrink-0">
          <Cpu className="h-4 w-4" style={{ color: "oklch(0.85 0.10 320)" }} />
        </div>
        <div className="leading-tight">
          <div className="text-[9px] uppercase tracking-widest opacity-70">RB · Roteador</div>
          <div className="font-semibold">{data.label}</div>
          {data.sub && <div className="text-[10px] opacity-70 font-mono">{data.sub}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ ...handleStyle, background: "oklch(0.70 0.10 320)" }} />
      <Handle type="target" position={Position.Left} style={{ ...handleStyle, background: "oklch(0.70 0.10 320)" }} />
    </div>
  );
}

export function OnuNode({ data }: NodeProps<Common>) {
  return (
    <div
      className={shellBase}
      style={{
        background: "linear-gradient(135deg, oklch(0.35 0.05 80), oklch(0.25 0.03 80))",
        borderColor: "oklch(0.70 0.10 80 / 0.6)",
        color: "white",
      }}
    >
      {statusDot(data.status)}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-[oklch(0.70_0.10_80_/_0.2)] flex items-center justify-center shrink-0">
          <Smartphone className="h-4 w-4" style={{ color: "oklch(0.85 0.10 80)" }} />
        </div>
        <div className="leading-tight">
          <div className="text-[9px] uppercase tracking-widest opacity-70">ONU · ONT</div>
          <div className="font-semibold">{data.label}</div>
          {data.sub && <div className="text-[10px] opacity-70 font-mono">{data.sub}</div>}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ ...handleStyle, background: "oklch(0.70 0.10 80)" }} />
    </div>
  );
}

export const nodeTypes = {
  olt: OltNode,
  ceo: CeoNode,
  cto: CtoNode,
  cliente: ClienteNode,
  rb: RbNode,
  onu: OnuNode,
};

