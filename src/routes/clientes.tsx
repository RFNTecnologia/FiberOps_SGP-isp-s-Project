import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createPppoeSecret } from "@/lib/routeros.server";
import { listClientes, listCtos, type Cliente } from "@/lib/network";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { Field, SelectField } from "./equipamentos";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Gestão de Clientes — FiberOps" },
      { name: "description", content: "Administre o cadastro de clientes, planos de internet e monitore o nível de sinal óptico (RX) individual." },
      { property: "og:title", content: "Gestão de Clientes — FiberOps" },
      { property: "og:description", content: "Painel de administração de assinantes e performance de sinal óptico." },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listClientes });
  const ctos = useQuery({ queryKey: ["ctos"], queryFn: listCtos });
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cliente removido"); qc.invalidateQueries({ queryKey: ["clientes"] }); },
  });

  const filtered = (clientes.data ?? []).filter((c) =>
    !q || c.nome.toLowerCase().includes(q.toLowerCase()) || c.endereco?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <PageHeader
        title="Clientes"
        subtitle="Vincule assinantes às portas de CTO e acompanhe seu sinal óptico."
        actions={
          <button onClick={() => { setEditing(null); setCreating(true); }} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Novo cliente
          </button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou endereço…"
          className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum cliente {q ? "encontrado" : "cadastrado"}.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 border-b border-border">Nome</th>
                  <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 border-b border-border">CTO / Porta</th>
                  <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 border-b border-border">Plano</th>
                  <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 border-b border-border">PPPoE</th>
                  <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 border-b border-border">Sinal RX</th>
                  <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 border-b border-border">Status</th>
                  <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 border-b border-border">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const cto = ctos.data?.find((x) => x.id === c.cto_id);
                  const rx = c.sinal_rx;
                  const rxColor = rx == null ? "text-muted-foreground" :
                    rx > -25 ? "text-[oklch(0.72_0.17_155)]" :
                      rx > -28 ? "text-[oklch(0.78_0.15_75)]" : "text-destructive";
                  return (
                    <tr key={c.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3 border-b border-border/60">
                        <div className="font-medium">{c.nome}</div>
                        {c.endereco && <div className="text-xs text-muted-foreground">{c.endereco}</div>}
                      </td>
                      <td className="px-4 py-3 border-b border-border/60 text-muted-foreground">
                        {cto?.nome ?? "—"} {c.porta_cto ? `· p${c.porta_cto}` : ""}
                      </td>
                      <td className="px-4 py-3 border-b border-border/60">{c.plano ?? "—"}</td>
                      <td className="px-4 py-3 border-b border-border/60 font-mono text-xs">{c.pppoe_usuario ?? "—"}</td>
                      <td className={`px-4 py-3 border-b border-border/60 font-mono text-xs ${rxColor}`}>
                        {rx != null ? `${rx.toFixed(1)} dBm` : "—"}
                      </td>
                      <td className="px-4 py-3 border-b border-border/60"><StatusPill status={c.status} /></td>
                      <td className="px-4 py-3 border-b border-border/60">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditing(c); setCreating(true); }} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { if (confirm("Excluir cliente?")) del.mutate(c.id); }} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {creating && <ClienteForm initial={editing} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}

function ClienteForm({ initial, onClose }: { initial: Cliente | null; onClose: () => void }) {
  const qc = useQueryClient();
  const ctos = useQuery({ queryKey: ["ctos"], queryFn: listCtos });
  const isEdit = !!initial;

  const save = useMutation({
    mutationFn: async ({ payload, router }: { payload: any; router: { host: string; user: string; password: string } }) => {
      if (isEdit) {
        const { error } = await supabase.from("clientes").update(payload).eq("id", initial!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert(payload);
        if (error) throw error;
      }
      if (payload.pppoe_usuario && payload.pppoe_senha && router.user && router.password) {
        await createPppoeSecret({
          data: {
            host: router.host,
            user: router.user,
            password: router.password,
            pppoeUser: payload.pppoe_usuario,
            pppoePassword: payload.pppoe_senha,
            profile: payload.plano || "default",
          },
        });
      }
    },
    onSuccess: () => { toast.success(isEdit ? "Atualizado" : "Cadastrado"); qc.invalidateQueries({ queryKey: ["clientes"] }); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string) || null;
    const num = (k: string) => { const v = fd.get(k); return v ? Number(v) : null; };
    save.mutate({
      payload: {
        nome: get("nome"),
        cto_id: get("cto_id"),
        porta_cto: num("porta_cto"),
        endereco: get("endereco"),
        telefone: get("telefone"),
        plano: get("plano"),
        sinal_rx: num("sinal_rx"),
        status: get("status") ?? "online",
        observacoes: get("observacoes"),
        pppoe_usuario: get("pppoe_usuario"),
        pppoe_senha: get("pppoe_senha"),
      }, router: { host: get("router_host") || "172.16.0.1", user: get("router_user") || "", password: get("router_password") || "" }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-lg border border-border bg-card shadow-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold">{isEdit ? "Editar" : "Novo"} cliente</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Nome" name="nome" defaultValue={initial?.nome} required />
          <Field label="Endereço" name="endereco" defaultValue={initial?.endereco} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone" name="telefone" defaultValue={initial?.telefone} />
            <Field label="Plano" name="plano" defaultValue={initial?.plano} placeholder="100 Mbps, 300 Mbps..." />
          </div>
          <SelectField label="CTO" name="cto_id" defaultValue={initial?.cto_id ?? ""}>
            <option value="">— nenhuma —</option>
            {ctos.data?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Porta na CTO" name="porta_cto" type="number" defaultValue={initial?.porta_cto} />
            <Field label="Sinal RX (dBm)" name="sinal_rx" type="number" step="0.1" defaultValue={initial?.sinal_rx} placeholder="-23.5" />
          </div>
          <div className="border-t border-border pt-3 mt-3 space-y-3">
            <div className="text-sm font-medium">Acesso PPPoE</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Usuário PPPoE" name="pppoe_usuario" defaultValue={initial?.pppoe_usuario} placeholder="cliente001" />
              <Field label="Senha PPPoE" name="pppoe_senha" defaultValue={initial?.pppoe_senha} placeholder="Senha do cliente" />
            </div>
            <div className="text-xs text-muted-foreground">Preencha as credenciais da RB abaixo para criar o usuário automaticamente.</div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="IP da RB" name="router_host" defaultValue="172.16.0.1" />
              <Field label="Usuário RB" name="router_user" placeholder="admin" />
              <Field label="Senha RB" name="router_password" type="password" />
            </div>
          </div>
          <SelectField label="Status" name="status" defaultValue={initial?.status ?? "online"}>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="aviso">Aviso</option>
            <option value="manutencao">Manutenção</option>
          </SelectField>
          <Field label="Observações" name="observacoes" defaultValue={initial?.observacoes} as="textarea" />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-border bg-background/50">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md hover:bg-accent">Cancelar</button>
          <button type="submit" disabled={save.isPending} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50">
            {save.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
