import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radio, Waypoints, PackageOpen, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { listCeos, listClientes, listCtos, listOlts, type EquipmentStatus } from "@/lib/network";
import { StatusPill } from "@/components/ui/StatusPill";
import { PageHeader } from "@/components/ui/PageHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Controle — FiberOps" },
      { name: "description", content: "Sistema completo para Provedores de Internet (ISP). Monitore OLTs, CTOs, gerencie ordens de serviço e visualize sua rede FTTH georreferenciada." },
      { property: "og:title", content: "Painel FiberOps — Gestão de Rede FTTH" },
      { property: "og:description", content: "Plataforma de monitoramento, inventário e gestão para provedores de fibra óptica." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const olts = useQuery({ queryKey: ["olts"], queryFn: listOlts });
  const ceos = useQuery({ queryKey: ["ceos"], queryFn: listCeos });
  const ctos = useQuery({ queryKey: ["ctos"], queryFn: listCtos });
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listClientes });

  const all = [
    ...(olts.data ?? []).map((x) => ({ ...x, kind: "OLT" as const })),
    ...(ceos.data ?? []).map((x) => ({ ...x, kind: "CEO" as const })),
    ...(ctos.data ?? []).map((x) => ({ ...x, kind: "CTO" as const })),
    ...(clientes.data ?? []).map((x) => ({ ...x, kind: "Cliente" as const })),
  ];
  const offline = all.filter((x) => x.status === "offline" || x.status === "aviso");

  const cards = [
    { label: "OLTs", value: olts.data?.length ?? 0, icon: Radio, hint: "Concentradores", to: "/equipamentos" },
    { label: "Caixas de emenda", value: ceos.data?.length ?? 0, icon: Waypoints, hint: "CEOs cadastradas", to: "/equipamentos" },
    { label: "CTOs", value: ctos.data?.length ?? 0, icon: PackageOpen, hint: "Terminais de acesso", to: "/equipamentos" },
    { label: "Clientes", value: clientes.data?.length ?? 0, icon: Users, hint: "Assinantes", to: "/clientes" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl">
      <PageHeader
        title="Painel da rede"
        subtitle="Visão geral dos equipamentos e status da sua rede FTTH."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="group rounded-lg border border-border bg-card p-4 hover:border-primary/60 transition"
          >
            <div className="flex items-start justify-between">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                <c.icon className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="mt-4 font-display text-3xl font-semibold tabular-nums">{c.value}</div>
            <div className="text-sm mt-0.5">{c.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.hint}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="font-display font-semibold">Alertas ativos</div>
              <div className="text-xs text-muted-foreground">Equipamentos e clientes com status diferente de online</div>
            </div>
            <AlertTriangle className="h-4 w-4 text-[oklch(0.78_0.15_75)]" />
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-auto">
            {offline.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum alerta no momento. Rede saudável ✓
              </div>
            )}
            {offline.map((x) => (
              <div key={`${x.kind}-${x.id}`} className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{x.nome}</div>
                  <div className="text-xs text-muted-foreground">{x.kind}</div>
                </div>
                <StatusPill status={x.status as EquipmentStatus} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="font-display font-semibold">Como começar</div>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Cadastre suas <Link to="/equipamentos" className="text-primary hover:underline">OLTs, CEOs e CTOs</Link>.</li>
            <li>Adicione os <Link to="/clientes" className="text-primary hover:underline">clientes</Link> e associe-os às portas de CTO.</li>
            <li>Veja tudo no <Link to="/mapa" className="text-primary hover:underline">mapa</Link> georreferenciado.</li>
            <li>Desenhe conexões no <Link to="/diagrama" className="text-primary hover:underline">diagrama lógico</Link>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
