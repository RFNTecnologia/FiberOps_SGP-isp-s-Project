import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, useEdgesState, useNodesState,
  type Connection, type Edge, type Node, type EdgeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { listCeos, listClientes, listConexoes, listCtos, listOlts, type NodeType } from "@/lib/network";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExportButtons } from "@/components/network/ExportButtons";
import { TELCORDIA_COLORS, colorHex, nextTelcordiaColor, type FiberColorName } from "@/lib/fiberColors";
import { nodeTypes } from "@/components/network/DiagramNodes";
import { layoutHierarchical } from "@/lib/diagramLayout";
import { exportFtthDocumentation } from "@/lib/ftthDoc";
import { SchematicView } from "@/components/network/SchematicView";


import { Save, Trash2, Check, Radio, Boxes, Router as RouterIcon, User, LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/diagrama")({
  head: () => ({
    meta: [
      { title: "Diagrama Lógico e Unifilar — FiberOps" },
      { name: "description", content: "Projete e visualize a topologia da rede FTTH (OLT, CEO, CTO) seguindo o padrão Telcordia. Gere esquemas unifilares profissionais para documentação técnica." },
      { property: "og:title", content: "Diagrama da Rede — FiberOps" },
      { property: "og:description", content: "Topologia lógica e esquemas unifilares para documentação de rede de fibra óptica." },
    ],
  }),
  component: DiagramaPage,
});

function DiagramaPage() {
  const captureRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"topologia" | "esquema">("topologia");
  const olts = useQuery({ queryKey: ["olts"], queryFn: listOlts });
  const ceos = useQuery({ queryKey: ["ceos"], queryFn: listCeos });
  const ctos = useQuery({ queryKey: ["ctos"], queryFn: listCtos });
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listClientes });
  const conexoes = useQuery({ queryKey: ["conexoes"], queryFn: listConexoes });

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Diagrama lógico"
          subtitle="Conecte OLTs, caixas de emenda e CTOs. As fibras seguem o padrão Telcordia — clique em uma conexão para trocar a cor."
        />
        <div className="pt-1 flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
            <button
              onClick={() => setView("topologia")}
              className={`px-3 py-1.5 ${view === "topologia" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
            >
              Topologia
            </button>
            <button
              onClick={() => setView("esquema")}
              className={`px-3 py-1.5 border-l border-border ${view === "esquema" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
            >
              Esquemático
            </button>
          </div>
          <ExportButtons
            targetRef={captureRef}
            fileBaseName={view === "esquema" ? "esquema-ftth" : "diagrama-rede"}
            pdfTitle={view === "esquema" ? "Esquema unifilar FTTH" : "Diagrama lógico da rede"}
            onExportDoc={(el) =>
              exportFtthDocumentation(el, {
                olts: olts.data ?? [],
                ceos: ceos.data ?? [],
                ctos: ctos.data ?? [],
                clientes: clientes.data ?? [],
                conexoes: conexoes.data ?? [],
              })
            }
          />
        </div>
      </div>

      <div
        ref={captureRef}
        className="rounded-lg border border-border overflow-hidden h-[calc(100vh-220px)] min-h-[520px] bg-background"
      >
        {view === "topologia" ? (
          <TopologyEditor />
        ) : (
          <SchematicView
            olts={olts.data ?? []}
            ceos={ceos.data ?? []}
            ctos={ctos.data ?? []}
            clientes={clientes.data ?? []}
            conexoes={conexoes.data ?? []}
          />
        )}
      </div>
    </div>
  );
}


function styledEdge(base: Partial<Edge>, colorName: FiberColorName): Edge {
  const hex = colorHex(colorName);
  return {
    ...(base as Edge),
    type: "smoothstep",
    pathOptions: { borderRadius: 4 },
    animated: false,
    label: colorName,
    labelBgPadding: [5, 2],
    labelBgBorderRadius: 2,
    labelBgStyle: { fill: hex, fillOpacity: 0.95 },
    labelStyle: { fill: labelTextColor(hex), fontWeight: 700, fontSize: 9, fontFamily: "JetBrains Mono, monospace" },
    style: { stroke: hex, strokeWidth: 3 },
  };
}


function labelTextColor(hex: string) {
  // simple luminance check for legible label text
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.6 ? "#111" : "#fff";
}

function TopologyEditor() {
  const qc = useQueryClient();
  const olts = useQuery({ queryKey: ["olts"], queryFn: listOlts });
  const ceos = useQuery({ queryKey: ["ceos"], queryFn: listCeos });
  const ctos = useQuery({ queryKey: ["ctos"], queryFn: listCtos });
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listClientes });
  const conexoes = useQuery({ queryKey: ["conexoes"], queryFn: listConexoes });

  const [savedKey, setSavedKey] = useState(0);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showClients, setShowClients] = useState(true);

  const initial = useMemo(() => {
    const nodes: Node[] = [];
    const oltList = olts.data ?? [];
    const ceoList = ceos.data ?? [];
    const ctoList = ctos.data ?? [];
    const cliList = clientes.data ?? [];
    const ctosByOlt = new Map<string, number[]>();
    ctoList.forEach((c) => {
      if (c.olt_id && c.porta_pon) {
        const arr = ctosByOlt.get(c.olt_id) ?? [];
        arr.push(c.porta_pon);
        ctosByOlt.set(c.olt_id, arr);
      }
    });
    const clientesByCto = new Map<string, number[]>();
    cliList.forEach((cl) => {
      if (cl.cto_id && cl.porta_cto) {
        const arr = clientesByCto.get(cl.cto_id) ?? [];
        arr.push(cl.porta_cto);
        clientesByCto.set(cl.cto_id, arr);
      }
    });
    oltList.forEach((o) => nodes.push({
      id: `olt:${o.id}`, type: "olt", position: { x: 0, y: 0 },
      data: {
        label: o.nome,
        sub: o.ip_gerencia ?? o.modelo ?? undefined,
        status: o.status,
        ports: o.portas_pon ?? undefined,
        usedPorts: ctosByOlt.get(o.id) ?? [],
      },
    }));
    ceoList.forEach((c) => nodes.push({
      id: `ceo:${c.id}`, type: "ceo", position: { x: 0, y: 0 },
      data: {
        label: c.nome,
        sub: c.tipo ?? (c.capacidade_fusoes ? `${c.capacidade_fusoes} fusões` : undefined),
        status: c.status,
        ports: c.capacidade_fusoes ?? undefined,
      },
    }));
    ctoList.forEach((c) => nodes.push({
      id: `cto:${c.id}`, type: "cto", position: { x: 0, y: 0 },
      data: {
        label: c.nome,
        sub: c.porta_pon ? `PON ${c.porta_pon} · ${c.portas_total}p` : `${c.portas_total} portas`,
        status: c.status,
        ports: c.portas_total,
        usedPorts: clientesByCto.get(c.id) ?? [],
      },
    }));

    if (showClients) {
      cliList.forEach((cl) => nodes.push({
        id: `cliente:${cl.id}`, type: "cliente", position: { x: 0, y: 0 },
        data: {
          label: cl.nome,
          sub: cl.sinal_rx != null ? `${cl.sinal_rx} dBm` : cl.plano ?? undefined,
          status: cl.status,
        },
      }));
    }
    const edges: Edge[] = (conexoes.data ?? []).map((c) => {
      const name = (TELCORDIA_COLORS.find((t) => t.nome === c.cor_fibra)?.nome) ?? "Azul";
      return styledEdge({
        id: c.id,
        source: `${c.origem_tipo}:${c.origem_id}`,
        target: `${c.destino_tipo}:${c.destino_id}`,
      }, name);
    });
    if (showClients) {
      cliList.forEach((cl) => {
        if (!cl.cto_id) return;
        edges.push({
          id: `cli-${cl.id}`,
          source: `cto:${cl.cto_id}`,
          target: `cliente:${cl.id}`,
          type: "smoothstep",
          pathOptions: { borderRadius: 4 },
          style: { stroke: "oklch(0.55 0.05 200 / 0.6)", strokeWidth: 1.5, strokeDasharray: "4 3" },

          label: cl.porta_cto ? `p${cl.porta_cto}` : undefined,
          labelBgPadding: [4, 2],
          labelBgBorderRadius: 3,
          labelBgStyle: { fill: "oklch(0.22 0.02 240)", fillOpacity: 0.9 },
          labelStyle: { fill: "oklch(0.85 0.02 240)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" },
        });
      });
    }
    const laidOut = layoutHierarchical(nodes, edges);
    return { nodes: laidOut, edges };
  }, [olts.data, ceos.data, ctos.data, clientes.data, conexoes.data, savedKey, showClients]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  useEffect(() => { setNodes(initial.nodes); setEdges(initial.edges); }, [initial, setNodes, setEdges]);

  const relayout = useCallback(() => {
    setNodes((nds) => layoutHierarchical(nds, edges));
  }, [edges, setNodes]);

  const onConnect = useCallback((conn: Connection) => {
    setEdges((eds) => {
      const nextName = nextTelcordiaColor(eds.length);
      const id = `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const base: Edge = {
        id,
        source: conn.source ?? "",
        target: conn.target ?? "",
        sourceHandle: conn.sourceHandle ?? undefined,
        targetHandle: conn.targetHandle ?? undefined,
      };
      return addEdge(styledEdge(base, nextName), eds);
    });
  }, [setEdges]);

  const onEdgeClick: EdgeMouseHandler = useCallback((_e, edge) => {
    setSelectedEdgeId(edge.id);
  }, []);

  const setEdgeColor = (name: FiberColorName) => {
    if (!selectedEdgeId) return;
    setEdges((eds) => eds.map((e) => e.id === selectedEdgeId ? styledEdge({ ...e }, name) : e));
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error: delErr } = await supabase.from("conexoes").delete().gte("created_at", "1970-01-01");
      if (delErr) throw delErr;

      const rows = edges
        .filter((e) => !String(e.id).startsWith("cli-"))
        .map((e) => {
          const [ot, oid] = String(e.source).split(":");
          const [dt, did] = String(e.target).split(":");
          return {
            origem_tipo: ot as any, origem_id: oid,
            destino_tipo: dt as any, destino_id: did,
            cor_fibra: (e.label as string) ?? null,
          };
        }).filter((r) => r.origem_id && r.destino_id && ["olt", "ceo", "cto"].includes(r.origem_tipo) && ["olt", "ceo", "cto"].includes(r.destino_tipo));

      if (rows.length) {
        const { error } = await supabase.from("conexoes").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Topologia salva");
      qc.invalidateQueries({ queryKey: ["conexoes"] });
      setSavedKey((k) => k + 1);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const clearEdges = () => {
    if (confirm("Remover todas as conexões do diagrama? (não salvo até clicar em Salvar)")) {
      setEdges([]);
      setSelectedEdgeId(null);
    }
  };

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center px-6">
        <div>
          <p className="text-sm text-muted-foreground">Cadastre OLTs, CEOs e CTOs primeiro para desenhar a topologia.</p>
        </div>
      </div>
    );
  }

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);
  const selectedColorName = selectedEdge?.label as FiberColorName | undefined;

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={() => setShowClients((s) => !s)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs ${showClients ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-card hover:bg-accent"}`}
        >
          <User className="h-3.5 w-3.5" /> {showClients ? "Ocultar clientes" : "Mostrar clientes"}
        </button>
        <button onClick={relayout} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent">
          <LayoutGrid className="h-3.5 w-3.5" /> Reorganizar
        </button>
        <button onClick={clearEdges} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent">
          <Trash2 className="h-3.5 w-3.5" /> Limpar conexões
        </button>
        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          <Save className="h-3.5 w-3.5" /> {saveMut.isPending ? "Salvando…" : "Salvar topologia"}
        </button>
      </div>

      {/* Paleta Telcordia */}
      <div className="absolute top-3 left-3 z-10 rounded-md border border-border bg-card/95 backdrop-blur p-2 max-w-[260px]">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 pb-1.5 font-semibold">
          Padrão Telcordia
          {selectedEdge ? (
            <span className="ml-1 normal-case text-primary">· fibra selecionada</span>
          ) : (
            <span className="ml-1 normal-case text-muted-foreground/70">· clique em uma conexão</span>
          )}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {TELCORDIA_COLORS.map((c, i) => {
            const active = selectedColorName === c.nome;
            return (
              <button
                key={c.nome}
                title={`${i + 1}. ${c.nome}`}
                onClick={() => setEdgeColor(c.nome)}
                disabled={!selectedEdge}
                className={`relative h-7 w-7 rounded border transition ${active ? "border-primary ring-2 ring-primary/50" : "border-border/70 hover:border-primary/60"} disabled:opacity-40 disabled:cursor-not-allowed`}
                style={{ background: c.hex }}
              >
                <span className="absolute -top-1 -left-1 text-[8px] bg-background/80 text-foreground rounded-full h-3.5 w-3.5 flex items-center justify-center border border-border">{i + 1}</span>
                {active && <Check className="h-3.5 w-3.5 absolute inset-0 m-auto" style={{ color: labelTextColor(c.hex) }} />}
              </button>
            );
          })}
        </div>
        {selectedEdge && (
          <button
            onClick={deleteSelectedEdge}
            className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded border border-destructive/50 text-destructive text-[11px] py-1 hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" /> Remover fibra selecionada
          </button>
        )}
      </div>

      {/* Legenda FTTH */}
      <div className="absolute bottom-3 left-3 z-10 rounded-md border border-border bg-card/95 backdrop-blur p-2.5 text-[11px] space-y-1.5 max-w-[240px]">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pb-1">Legenda FTTH</div>
        <LegendRow icon={<Radio className="h-3.5 w-3.5" style={{ color: "oklch(0.85 0.15 190)" }} />} label="OLT" desc="Fonte óptica / headend" />
        <LegendRow icon={<Boxes className="h-3.5 w-3.5" style={{ color: "oklch(0.80 0.14 260)" }} />} label="CEO" desc="Caixa de emenda óptica" />
        <LegendRow icon={<RouterIcon className="h-3.5 w-3.5" style={{ color: "oklch(0.82 0.14 155)" }} />} label="CTO" desc="Caixa terminal de assinante" />
        <LegendRow icon={<User className="h-3.5 w-3.5" style={{ color: "oklch(0.85 0.05 200)" }} />} label="Cliente" desc="Ponto de conexão final" />
        <div className="pt-1 mt-1 border-t border-border/60 text-[10px] text-muted-foreground leading-snug">
          Linhas coloridas = fibras (padrão Telcordia). Tracejadas = drop do cliente.
        </div>
      </div>

      {/* Selo de documentação (title block de projeto) */}
      <div className="absolute bottom-3 right-3 z-10 rounded-md border border-border bg-card/95 backdrop-blur text-[10px] font-mono overflow-hidden">
        <div className="px-2.5 py-1 bg-primary/15 text-primary text-[9px] uppercase tracking-widest font-sans font-semibold border-b border-border">
          FiberOps · Documentação da rede FTTH
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-2.5 py-1.5 text-muted-foreground">
          <span>OLTs</span><span className="text-foreground text-right">{(olts.data ?? []).length}</span>
          <span>CEOs</span><span className="text-foreground text-right">{(ceos.data ?? []).length}</span>
          <span>CTOs</span><span className="text-foreground text-right">{(ctos.data ?? []).length}</span>
          <span>Clientes</span><span className="text-foreground text-right">{(clientes.data ?? []).length}</span>
          <span>Fibras</span><span className="text-foreground text-right">{edges.filter((e) => !String(e.id).startsWith("cli-")).length}</span>
          <span>Emissão</span><span className="text-foreground text-right">{new Date().toLocaleDateString("pt-BR")}</span>
        </div>
      </div>



      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onPaneClick={() => setSelectedEdgeId(null)}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="oklch(0.28 0.02 240)" />
        <Controls className="!bg-card !border-border" />
        <MiniMap
          maskColor="oklch(0.16 0.02 240 / 0.7)"
          style={{ background: "oklch(0.20 0.02 240)" }}
          nodeColor={(n) => {
            if (n.type === "olt") return "oklch(0.78 0.15 190)";
            if (n.type === "ceo") return "oklch(0.65 0.15 260)";
            if (n.type === "cto") return "oklch(0.65 0.14 155)";
            return "oklch(0.55 0.05 200)";
          }}
        />
      </ReactFlow>
    </div>
  );
}

function LegendRow({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded-md bg-muted/60 border border-border flex items-center justify-center shrink-0">{icon}</div>
      <div className="leading-tight">
        <div className="font-semibold text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
