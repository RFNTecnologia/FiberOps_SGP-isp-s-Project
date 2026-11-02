import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listCeos, listClientes, listCtos, listOlts, statusLabel, type EquipmentStatus } from "@/lib/network";
import { testRouterConnection } from "@/lib/routeros.server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { Activity, Radio, Users, Waypoints, PackageOpen, Router, Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/monitoramento")({
  head: () => ({
    meta: [
      { title: "Status da Rede — Monitoramento FiberOps" },
      { name: "description", content: "Acompanhe o status em tempo real de OLTs, CTOs e clientes da rede FiberOps com alertas ao vivo." },
      { property: "og:title", content: "Monitoramento em Tempo Real — FiberOps" },
      { property: "og:description", content: "Painel de controle com status atualizado dos equipamentos e clientes da rede." },
    ],
  }),
  component: MonitoringPage,
});

function MonitoringPage() {
  const olts = useQuery({ queryKey: ["olts"], queryFn: listOlts, refetchInterval: 10000 });
  const ceos = useQuery({ queryKey: ["ceos"], queryFn: listCeos, refetchInterval: 10000 });
  const ctos = useQuery({ queryKey: ["ctos"], queryFn: listCtos, refetchInterval: 10000 });
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listClientes, refetchInterval: 10000 });
  const [routerForm, setRouterForm] = useState({ host: "172.16.0.1", user: "", password: "" });
  const [routerTest, setRouterTest] = useState<{ status: "online" | "offline"; message: string; latency?: string } | null>(null);
  const [testingRouter, setTestingRouter] = useState(false);

  const checkRouter = async () => {
    if (!routerForm.host || !routerForm.user) return;
    setTestingRouter(true);
    setRouterTest(null);
    try {
      const result = await testRouterConnection({ data: { ...routerForm, port: 8728 } });
      setRouterTest({ status: "online", latency: result.latency, message: `${result.identity}${result.version ? ` · RouterOS ${result.version}` : ""}` });
    } catch (error) {
      setRouterTest({ status: "offline", message: error instanceof Error ? error.message : "Não foi possível acessar a API RouterOS." });
    } finally {
      setTestingRouter(false);
    }
  };

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(i);
  }, []);

  const all: { kind: string; nome: string; status: EquipmentStatus }[] = [
    ...(olts.data ?? []).map((x) => ({ kind: "OLT", nome: x.nome, status: x.status })),
    ...(ceos.data ?? []).map((x) => ({ kind: "CEO", nome: x.nome, status: x.status })),
    ...(ctos.data ?? []).map((x) => ({ kind: "CTO", nome: x.nome, status: x.status })),
    ...(clientes.data ?? []).map((x) => ({ kind: "Cliente", nome: x.nome, status: x.status })),
  ];
  const byStatus = (s: EquipmentStatus) => all.filter((x) => x.status === s).length;

  const groups = [
    { label: "Online", value: byStatus("online"), color: "oklch(0.72 0.17 155)" },
    { label: "Aviso", value: byStatus("aviso"), color: "oklch(0.78 0.15 75)" },
    { label: "Offline", value: byStatus("offline"), color: "oklch(0.62 0.22 25)" },
    { label: "Manutenção", value: byStatus("manutencao"), color: "oklch(0.65 0.02 220)" },
  ];

  const iconFor = (kind: string) =>
    kind === "OLT" ? Radio : kind === "CEO" ? Waypoints : kind === "CTO" ? PackageOpen : Users;

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <PageHeader
        title="Monitoramento"
        subtitle="Atualização automática a cada 10 segundos"
        actions={
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Ao vivo
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {groups.map((g) => (
          <div key={g.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <span className="status-dot" style={{ background: g.color, boxShadow: `0 0 6px ${g.color}` }} />
              {g.label}
            </div>
            <div className="font-display text-3xl font-semibold mt-2 tabular-nums">{g.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Router className="h-4 w-4 text-primary" />
          <div>
            <div className="font-display font-semibold">RB 750r2</div>
            <div className="text-xs text-muted-foreground">Teste real da API RouterOS na porta 8728</div>
          </div>
          {routerTest && <div className={`ml-auto text-xs font-medium ${routerTest.status === "online" ? "text-green-400" : "text-destructive"}`}>{routerTest.status === "online" ? "CONECTADA" : "OFFLINE"}</div>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <label className="text-xs text-muted-foreground">IP de gerenciamento<input value={routerForm.host} onChange={(event) => setRouterForm((current) => ({ ...current, host: event.target.value }))} className="mt-1 w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground" /></label>
          <label className="text-xs text-muted-foreground">Usuário<input value={routerForm.user} onChange={(event) => setRouterForm((current) => ({ ...current, user: event.target.value }))} className="mt-1 w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground" placeholder="admin" /></label>
          <label className="text-xs text-muted-foreground">Senha<input type="password" value={routerForm.password} onChange={(event) => setRouterForm((current) => ({ ...current, password: event.target.value }))} className="mt-1 w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground" /></label>
          <button onClick={checkRouter} disabled={testingRouter || !routerForm.user} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {testingRouter ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Testar RB
          </button>
        </div>
        {routerTest && <div className={`mt-3 text-xs ${routerTest.status === "online" ? "text-green-400" : "text-destructive"}`}>{routerTest.message}{routerTest.latency ? ` · Latência ${routerTest.latency}` : ""}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <div className="font-display font-semibold">Feed de eventos</div>
            <div className="ml-auto text-xs text-muted-foreground font-mono">tick {tick}</div>
          </div>
          <div className="max-h-[400px] overflow-auto divide-y divide-border">
            {all.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Sem dados. Cadastre equipamentos primeiro.</div>
            ) : (
              all.slice(0, 30).map((x, i) => {
                const Icon = iconFor(x.kind);
                return (
                  <div key={i} className="p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{x.nome}</div>
                      <div className="text-xs text-muted-foreground">{x.kind} · {statusLabel[x.status]}</div>
                    </div>
                    <StatusPill status={x.status} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="font-display font-semibold mb-3">Distribuição por tipo</div>
          {(["OLT", "CEO", "CTO", "Cliente"] as const).map((k) => {
            const total = all.filter((a) => a.kind === k).length;
            const online = all.filter((a) => a.kind === k && a.status === "online").length;
            const pct = total ? (online / total) * 100 : 0;
            return (
              <div key={k} className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span>{k}</span>
                  <span className="text-muted-foreground text-xs font-mono">{online}/{total} online</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
            Nesta versão os status refletem o cadastro manual. Integração com SNMP/Ping para OLTs pode ser adicionada quando você quiser.
          </p>
        </div>
      </div>
    </div>
  );
}
