import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  listOlts, listCeos, listCtos, listRbs, listOnus,
  type Olt, type CaixaEmenda, type Cto, type Rb, type Onu, type EquipmentStatus,
} from "@/lib/network";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { AutoDiscovery } from "@/components/network/AutoDiscovery";

export const Route = createFileRoute("/equipamentos")({
  head: () => ({
    meta: [
      { title: "Inventário de Equipamentos — FiberOps" },
      { name: "description", content: "Gestão completa de OLTs, Caixas de Emenda (CEO) e Caixas Terminais (CTO). Controle IP de gerência, capacidade de fusões e ocupação de portas PON." },
      { property: "og:title", content: "Inventário de Equipamentos — FiberOps" },
      { property: "og:description", content: "Administração de infraestrutura física e inventário de rede FTTH." },
    ],
  }),
  component: EquipmentPage,
});

type Tab = "olt" | "rb" | "ceo" | "cto" | "onu";

function EquipmentPage() {
  const [tab, setTab] = useState<Tab>("olt");
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [scanning, setScanning] = useState(false);

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <PageHeader
        title="Equipamentos"
        subtitle="Cadastre suas OLTs, RBs (MIKROTIKs, CISCOs, HUAWEIs e OUTROs), CEOs, ONUs/ONTs e CTOs."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setScanning(true)}
              className="inline-flex items-center gap-2 rounded-md bg-accent border border-border px-3 py-2 text-sm font-medium hover:bg-accent/80 transition-colors"
            >
              <Search className="h-4 w-4" /> Buscar na Rede
            </button>
            <button
              onClick={() => { setEditing(null); setCreating(true); }}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Novo {tab.toUpperCase()}
            </button>
          </div>
        }
      />

      <div className="flex gap-1 rounded-lg bg-card border border-border p-1 w-fit mb-4">
        {(["olt", "rb", "ceo", "cto", "onu"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "olt" ? "OLTs" : t === "rb" ? "RBs" : t === "ceo" ? "Caixas de Emenda" : t === "cto" ? "CTOs" : "ONUs/ONTs"}
          </button>
        ))}
      </div>

      {tab === "olt" && <OltTable onEdit={(x) => { setEditing(x); setCreating(true); }} />}
      {tab === "rb" && <RbTable onEdit={(x) => { setEditing(x); setCreating(true); }} />}
      {tab === "ceo" && <CeoTable onEdit={(x) => { setEditing(x); setCreating(true); }} />}
      {tab === "cto" && <CtoTable onEdit={(x) => { setEditing(x); setCreating(true); }} />}
      {tab === "onu" && <OnuTable onEdit={(x) => { setEditing(x); setCreating(true); }} />}

      {creating && (
        <FormDialog
          kind={tab}
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {scanning && <AutoDiscovery onClose={() => setScanning(false)} />}
    </div>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 border-b border-border">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 border-b border-border/60 ${className}`}>{children}</td>;
}

function OltTable({ onEdit }: { onEdit: (x: Olt) => void }) {
  const q = useQuery({ queryKey: ["olts"], queryFn: listOlts });
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("olts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("OLT removida"); qc.invalidateQueries({ queryKey: ["olts"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!q.data?.length) return <EmptyState label="Nenhuma OLT cadastrada" />;
  return (
    <Table>
      <thead><tr><Th>Nome</Th><Th>Modelo</Th><Th>IP gerência</Th><Th>Portas PON</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
      <tbody>
        {q.data.map((o) => (
          <tr key={o.id} className="hover:bg-accent/40">
            <Td className="font-medium">{o.nome}</Td>
            <Td className="text-muted-foreground">{o.fabricante} {o.modelo}</Td>
            <Td className="font-mono text-xs">{o.ip_gerencia ?? "—"}</Td>
            <Td>{o.portas_pon ?? "—"}</Td>
            <Td><StatusPill status={o.status} /></Td>
            <Td><RowActions onEdit={() => onEdit(o)} onDelete={() => del.mutate(o.id)} /></Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function RbTable({ onEdit }: { onEdit: (x: Rb) => void }) {
  const q = useQuery({ queryKey: ["rbs"], queryFn: listRbs });
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rbs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("RB removida"); qc.invalidateQueries({ queryKey: ["rbs"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!q.data?.length) return <EmptyState label="Nenhuma RB cadastrada" />;
  return (
    <Table>
      <thead><tr><Th>Nome</Th><Th>Modelo</Th><Th>IP gerência</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
      <tbody>
        {q.data.map((o) => (
          <tr key={o.id} className="hover:bg-accent/40">
            <Td className="font-medium">{o.nome}</Td>
            <Td className="text-muted-foreground">{o.fabricante} {o.modelo}</Td>
            <Td className="font-mono text-xs">{o.ip_gerencia ?? "—"}</Td>
            <Td><StatusPill status={o.status} /></Td>
            <Td><RowActions onEdit={() => onEdit(o)} onDelete={() => del.mutate(o.id)} /></Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}


function CeoTable({ onEdit }: { onEdit: (x: CaixaEmenda) => void }) {
  const q = useQuery({ queryKey: ["ceos"], queryFn: listCeos });
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("caixas_emenda").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Caixa removida"); qc.invalidateQueries({ queryKey: ["ceos"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!q.data?.length) return <EmptyState label="Nenhuma caixa de emenda cadastrada" />;
  return (
    <Table>
      <thead><tr><Th>Nome</Th><Th>Tipo</Th><Th>Fusões</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
      <tbody>
        {q.data.map((o) => (
          <tr key={o.id} className="hover:bg-accent/40">
            <Td className="font-medium">{o.nome}</Td>
            <Td className="text-muted-foreground">{o.tipo ?? "—"}</Td>
            <Td>{o.capacidade_fusoes ?? "—"}</Td>
            <Td><StatusPill status={o.status} /></Td>
            <Td><RowActions onEdit={() => onEdit(o)} onDelete={() => del.mutate(o.id)} /></Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function CtoTable({ onEdit }: { onEdit: (x: Cto) => void }) {
  const q = useQuery({ queryKey: ["ctos"], queryFn: listCtos });
  const olts = useQuery({ queryKey: ["olts"], queryFn: listOlts });
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ctos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("CTO removida"); qc.invalidateQueries({ queryKey: ["ctos"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!q.data?.length) return <EmptyState label="Nenhuma CTO cadastrada" />;
  return (
    <Table>
      <thead><tr><Th>Nome</Th><Th>OLT</Th><Th>PON</Th><Th>Portas</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
      <tbody>
        {q.data.map((o) => {
          const olt = olts.data?.find((x) => x.id === o.olt_id);
          return (
            <tr key={o.id} className="hover:bg-accent/40">
              <Td className="font-medium">{o.nome}</Td>
              <Td className="text-muted-foreground">{olt?.nome ?? "—"}</Td>
              <Td>{o.porta_pon ?? "—"}</Td>
              <Td>{o.portas_total}</Td>
              <Td><StatusPill status={o.status} /></Td>
              <Td><RowActions onEdit={() => onEdit(o)} onDelete={() => del.mutate(o.id)} /></Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function OnuTable({ onEdit }: { onEdit: (x: Onu) => void }) {
  const q = useQuery({ queryKey: ["onus"], queryFn: listOnus });
  const ctos = useQuery({ queryKey: ["ctos"], queryFn: listCtos });
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("onus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("ONU removida"); qc.invalidateQueries({ queryKey: ["onus"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!q.data?.length) return <EmptyState label="Nenhuma ONU cadastrada" />;
  return (
    <Table>
      <thead><tr><Th>Nome</Th><Th>CTO</Th><Th>Porta</Th><Th>MAC/SN</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
      <tbody>
        {q.data.map((o) => {
          const cto = ctos.data?.find((x) => x.id === o.cto_id);
          return (
            <tr key={o.id} className="hover:bg-accent/40">
              <Td className="font-medium">{o.nome}</Td>
              <Td className="text-muted-foreground">{cto?.nome ?? "—"}</Td>
              <Td>{o.porta_cto ?? "—"}</Td>
              <Td className="font-mono text-xs">{o.mac || o.sn || "—"}</Td>
              <Td><StatusPill status={o.status} /></Td>
              <Td><RowActions onEdit={() => onEdit(o)} onDelete={() => del.mutate(o.id)} /></Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}


function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <button onClick={onEdit} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
      <button onClick={() => { if (confirm("Excluir este item?")) onDelete(); }} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 p-12 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">Clique em "Novo" para adicionar o primeiro.</p>
    </div>
  );
}

function FormDialog({ kind, initial, onClose }: { kind: Tab; initial: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!initial;
  const olts = useQuery({ queryKey: ["olts"], queryFn: listOlts, enabled: kind === "cto" });
  const ceos = useQuery({ queryKey: ["ceos"], queryFn: listCeos, enabled: kind === "cto" });
  const ctos = useQuery({ queryKey: ["ctos"], queryFn: listCtos, enabled: kind === "onu" });

  const table = kind === "olt" ? "olts" : kind === "rb" ? "rbs" : kind === "ceo" ? "caixas_emenda" : kind === "cto" ? "ctos" : "onus";
  const qkey = kind === "olt" ? "olts" : kind === "rb" ? "rbs" : kind === "ceo" ? "ceos" : kind === "cto" ? "ctos" : "onus";

  const save = useMutation({
    mutationFn: async (payload: any) => {
      if (isEdit) {
        const { error } = await supabase.from(table as any).update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Atualizado" : "Cadastrado");
      qc.invalidateQueries({ queryKey: [qkey] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string) || null;
    const num = (k: string) => { const v = fd.get(k); return v ? Number(v) : null; };

    const base: any = {
      nome: get("nome"),
      latitude: Number(fd.get("latitude")),
      longitude: Number(fd.get("longitude")),
      status: get("status") ?? "online",
      observacoes: get("observacoes"),
    };
    if (kind === "olt" || kind === "rb") {
      Object.assign(base, { fabricante: get("fabricante"), modelo: get("modelo"), ip_gerencia: get("ip_gerencia") });
      if (kind === "olt") Object.assign(base, { portas_pon: num("portas_pon") ?? 8 });
    } else if (kind === "ceo") {
      Object.assign(base, { tipo: get("tipo"), capacidade_fusoes: num("capacidade_fusoes") });
    } else if (kind === "cto") {
      Object.assign(base, {
        olt_id: get("olt_id"),
        caixa_emenda_id: get("caixa_emenda_id"),
        porta_pon: num("porta_pon"),
        portas_total: num("portas_total") ?? 16,
      });
    } else if (kind === "onu") {
      Object.assign(base, {
        cto_id: get("cto_id"),
        porta_cto: num("porta_cto"),
        mac: get("mac"),
        sn: get("sn"),
      });
    }

    save.mutate(base);
  };

  const title = kind === "olt" ? "OLT" : kind === "rb" ? "RB" : kind === "ceo" ? "Caixa de Emenda" : kind === "cto" ? "CTO" : "ONU/ONT";

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-lg border border-border bg-card shadow-2xl max-h-[90vh] overflow-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold">{isEdit ? "Editar" : "Nova"} {title}</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Nome / identificador" name="nome" defaultValue={initial?.nome} required />

          {(kind === "olt" || kind === "rb") && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fabricante" name="fabricante" defaultValue={initial?.fabricante} placeholder="Huawei, ZTE, MikroTik..." />
                <Field label="Modelo" name="modelo" defaultValue={initial?.modelo} placeholder="MA5800-X7, CCR1036..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="IP de gerência" name="ip_gerencia" defaultValue={initial?.ip_gerencia} placeholder="10.0.0.1" />
                {kind === "olt" && <Field label="Portas PON" name="portas_pon" type="number" defaultValue={initial?.portas_pon ?? 8} />}
              </div>
            </>
          )}

          {kind === "onu" && (
            <>
              <SelectField label="CTO vinculada" name="cto_id" defaultValue={initial?.cto_id ?? ""}>
                <option value="">— nenhuma —</option>
                {ctos.data?.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </SelectField>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Porta na CTO" name="porta_cto" type="number" defaultValue={initial?.porta_cto} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="MAC Address" name="mac" defaultValue={initial?.mac} placeholder="00:11:22..." />
                <Field label="Serial Number (SN)" name="sn" defaultValue={initial?.sn} placeholder="SN123456" />
              </div>
            </>
          )}



          {kind === "ceo" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo" name="tipo" defaultValue={initial?.tipo} placeholder="Aérea, subterrânea..." />
              <Field label="Capacidade de fusões" name="capacidade_fusoes" type="number" defaultValue={initial?.capacidade_fusoes} />
            </div>
          )}

          {kind === "cto" && (
            <>
              <SelectField label="OLT vinculada" name="olt_id" defaultValue={initial?.olt_id ?? ""}>
                <option value="">— nenhuma —</option>
                {olts.data?.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </SelectField>
              <SelectField label="Caixa de emenda (opcional)" name="caixa_emenda_id" defaultValue={initial?.caixa_emenda_id ?? ""}>
                <option value="">— nenhuma —</option>
                {ceos.data?.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </SelectField>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Porta PON na OLT" name="porta_pon" type="number" defaultValue={initial?.porta_pon} />
                <Field label="Portas totais" name="portas_total" type="number" defaultValue={initial?.portas_total ?? 16} />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" name="latitude" type="number" step="any" defaultValue={initial?.latitude} required placeholder="-23.5505" />
            <Field label="Longitude" name="longitude" type="number" step="any" defaultValue={initial?.longitude} required placeholder="-46.6333" />
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

export function Field({ label, as, ...props }: any) {
  const cls = "w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {as === "textarea" ? <textarea className={cls} rows={2} {...props} /> : <input className={cls} {...props} />}
    </label>
  );
}
export function SelectField({ label, children, ...props }: any) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <select className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" {...props}>
        {children}
      </select>
    </label>
  );
}

function _statusUsed(_: EquipmentStatus) {} // keep type import used
void _statusUsed;
