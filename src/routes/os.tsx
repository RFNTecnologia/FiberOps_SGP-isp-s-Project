import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, X, Search, FileDown, Upload, MapPin, Image as ImageIcon, Video, Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  listOS, listClientes, listOlts, listCeos, listCtos,
  osStatusLabel, osStatusColor, osTipoLabel, osPrioridadeLabel,
  type OrdemServico, type OSStatus, type OSTipo, type OSPrioridade, type OSNota, type OSEvidencia,
  type NodeType,
} from "@/lib/network";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, SelectField } from "./equipamentos";
import { useAuth } from "@/hooks/use-auth";
import { exportOSAsPDF } from "@/lib/osPdf";

export const Route = createFileRoute("/os")({
  head: () => ({
    meta: [
      { title: "Gestão de Ordens de Serviço — FiberOps" },
      { name: "description", content: "Gerencie chamados técnicos para instalação, reparo e manutenção. Inclui geolocalização, evidências fotográficas e exportação de PDF para técnicos em campo." },
      { property: "og:title", content: "Ordens de Serviço — FiberOps" },
      { property: "og:description", content: "Gerenciamento completo de chamados técnicos e manutenção de rede FTTH." },
    ],
  }),
  component: OSPage,
});

const STATUSES: OSStatus[] = ["aberta", "em_andamento", "concluida", "cancelada"];
const TIPOS: OSTipo[] = ["instalacao", "reparo", "manutencao", "visita"];
const PRIORIDADES: OSPrioridade[] = ["baixa", "media", "alta", "urgente"];

function OSPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OSStatus | "todas">("todas");
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const { user } = useAuth();

  const os = useQuery({ queryKey: ["os"], queryFn: listOS });
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listClientes });
  const clientesById = useMemo(
    () => new Map((clientes.data ?? []).map((c) => [c.id, c])),
    [clientes.data],
  );

  const filtered = (os.data ?? []).filter((o) => {
    if (status !== "todas" && o.status !== status) return false;
    if (!q) return true;
    const ql = q.toLowerCase();
    const cliente = o.cliente_id ? clientesById.get(o.cliente_id)?.nome ?? "" : "";
    return (
      String(o.numero).includes(ql) ||
      (o.tecnico ?? "").toLowerCase().includes(ql) ||
      cliente.toLowerCase().includes(ql) ||
      (o.descricao ?? "").toLowerCase().includes(ql)
    );
  });

  const opened = openId ? (os.data ?? []).find((o) => o.id === openId) ?? null : null;

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Chamados técnicos com histórico, evidências e exportação em PDF."
        actions={
          user ? (
            <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Nova OS
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Entre para criar OS</span>
          )
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por número, cliente, técnico…"
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["todas", ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1.5 text-xs border transition ${status === s ? "bg-primary/15 border-primary text-primary" : "border-border bg-card hover:bg-accent"}`}>
              {s === "todas" ? "Todas" : osStatusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma OS {q || status !== "todas" ? "encontrada" : "cadastrada"}.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["Nº", "Tipo", "Cliente", "Técnico", "Prioridade", "Agendada", "Status", ""].map((h) => (
                    <th key={h} className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const cliente = o.cliente_id ? clientesById.get(o.cliente_id) : null;
                  return (
                    <tr key={o.id} className="hover:bg-accent/40 cursor-pointer" onClick={() => setOpenId(o.id)}>
                      <td className="px-4 py-3 border-b border-border font-mono text-primary">#{String(o.numero).padStart(5, "0")}</td>
                      <td className="px-4 py-3 border-b border-border">{osTipoLabel[o.tipo]}</td>
                      <td className="px-4 py-3 border-b border-border">{cliente?.nome ?? <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3 border-b border-border">{o.tecnico || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3 border-b border-border">
                        <PrioridadePill p={o.prioridade} />
                      </td>
                      <td className="px-4 py-3 border-b border-border text-muted-foreground">
                        {o.data_agendada ? new Date(o.data_agendada).toLocaleString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-3 border-b border-border"><OSStatusPill s={o.status} /></td>
                      <td className="px-4 py-3 border-b border-border text-right">
                        <button onClick={(e) => { e.stopPropagation(); exportOSAsPDF(o, cliente?.nome); }}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-accent" title="Exportar PDF">
                          <FileDown className="h-3.5 w-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {creating && <OSFormDialog onClose={() => setCreating(false)} />}
      {opened && <OSDetailDialog os={opened} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function OSStatusPill({ s }: { s: OSStatus }) {
  const c = osStatusColor[s];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium">
      <span className="h-2 w-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
      {osStatusLabel[s]}
    </span>
  );
}

function PrioridadePill({ p }: { p: OSPrioridade }) {
  const map: Record<OSPrioridade, string> = {
    baixa: "text-muted-foreground border-border",
    media: "text-foreground border-border",
    alta: "text-warning border-warning/50",
    urgente: "text-destructive border-destructive/50",
  };
  return (
    <span className={`inline-flex items-center rounded-full border bg-card px-2 py-0.5 text-[11px] font-medium ${map[p]}`}>
      {osPrioridadeLabel[p]}
    </span>
  );
}

// -------- Form (create/edit) --------

type FormState = {
  tipo: OSTipo;
  prioridade: OSPrioridade;
  status: OSStatus;
  tecnico: string;
  data_agendada: string;
  cliente_id: string;
  descricao: string;
  endereco: string;
  latitude: string;
  longitude: string;
  equipamento_tipo: "" | NodeType;
  equipamento_id: string;
};

function emptyForm(): FormState {
  return {
    tipo: "instalacao", prioridade: "media", status: "aberta",
    tecnico: "", data_agendada: "", cliente_id: "", descricao: "",
    endereco: "", latitude: "", longitude: "",
    equipamento_tipo: "", equipamento_id: "",
  };
}

function OSFormDialog({ onClose, initial }: { onClose: () => void; initial?: OrdemServico }) {
  const qc = useQueryClient();
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listClientes });
  const olts = useQuery({ queryKey: ["olts"], queryFn: listOlts });
  const ceos = useQuery({ queryKey: ["ceos"], queryFn: listCeos });
  const ctos = useQuery({ queryKey: ["ctos"], queryFn: listCtos });

  const [f, setF] = useState<FormState>(() =>
    initial
      ? {
          tipo: initial.tipo, prioridade: initial.prioridade, status: initial.status,
          tecnico: initial.tecnico ?? "",
          data_agendada: initial.data_agendada ? initial.data_agendada.slice(0, 16) : "",
          cliente_id: initial.cliente_id ?? "",
          descricao: initial.descricao ?? "",
          endereco: initial.endereco ?? "",
          latitude: initial.latitude?.toString() ?? "",
          longitude: initial.longitude?.toString() ?? "",
          equipamento_tipo: (initial.equipamento_tipo as any) ?? "",
          equipamento_id: initial.equipamento_id ?? "",
        }
      : emptyForm(),
  );

  const equipList =
    f.equipamento_tipo === "olt" ? olts.data :
    f.equipamento_tipo === "ceo" ? ceos.data :
    f.equipamento_tipo === "cto" ? ctos.data : undefined;

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        tipo: f.tipo, prioridade: f.prioridade, status: f.status,
        tecnico: f.tecnico || null,
        data_agendada: f.data_agendada ? new Date(f.data_agendada).toISOString() : null,
        cliente_id: f.cliente_id || null,
        descricao: f.descricao || null,
        endereco: f.endereco || null,
        latitude: f.latitude ? Number(f.latitude) : null,
        longitude: f.longitude ? Number(f.longitude) : null,
        equipamento_tipo: f.equipamento_tipo || null,
        equipamento_id: f.equipamento_id || null,
      };
      if (initial) {
        const { error } = await supabase.from("ordens_servico").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ordens_servico").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(initial ? "OS atualizada" : "OS criada");
      qc.invalidateQueries({ queryKey: ["os"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  function useMinhaLocalizacao() {
    if (!navigator.geolocation) { toast.error("Geolocalização indisponível"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setF({ ...f, latitude: p.coords.latitude.toFixed(6), longitude: p.coords.longitude.toFixed(6) }),
      () => toast.error("Não foi possível obter localização"),
    );
  }

  function inheritEquipLocation() {
    const item: any = (equipList ?? []).find((x: any) => x.id === f.equipamento_id);
    if (!item) return;
    setF({ ...f, latitude: item.latitude?.toString() ?? "", longitude: item.longitude?.toString() ?? "" });
  }

  return (
    <Modal title={initial ? `Editar OS #${String(initial.numero).padStart(5, "0")}` : "Nova Ordem de Serviço"} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SelectField label="Tipo" value={f.tipo} onChange={(e: any) => setF({ ...f, tipo: e.target.value })}>
            {TIPOS.map((t) => <option key={t} value={t}>{osTipoLabel[t]}</option>)}
          </SelectField>
          <SelectField label="Prioridade" value={f.prioridade} onChange={(e: any) => setF({ ...f, prioridade: e.target.value })}>
            {PRIORIDADES.map((p) => <option key={p} value={p}>{osPrioridadeLabel[p]}</option>)}
          </SelectField>
          <SelectField label="Status" value={f.status} onChange={(e: any) => setF({ ...f, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{osStatusLabel[s]}</option>)}
          </SelectField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Técnico responsável" value={f.tecnico} onChange={(e: any) => setF({ ...f, tecnico: e.target.value })} placeholder="Nome do técnico" />
          <Field label="Data agendada" type="datetime-local" value={f.data_agendada} onChange={(e: any) => setF({ ...f, data_agendada: e.target.value })} />
        </div>

        <SelectField label="Cliente vinculado" value={f.cliente_id} onChange={(e: any) => setF({ ...f, cliente_id: e.target.value })}>
          <option value="">— Sem cliente —</option>
          {(clientes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </SelectField>

        <Field label="Descrição do serviço" as="textarea" value={f.descricao} onChange={(e: any) => setF({ ...f, descricao: e.target.value })}
          placeholder="Ex.: cliente sem sinal, verificar CTO-03 porta 5" />

        <div className="rounded-md border border-border p-3 space-y-3">
          <div className="text-xs font-medium text-muted-foreground">Localização</div>
          <Field label="Endereço" value={f.endereco} onChange={(e: any) => setF({ ...f, endereco: e.target.value })} placeholder="Rua, número, bairro" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SelectField label="Equipamento vinculado" value={f.equipamento_tipo}
              onChange={(e: any) => setF({ ...f, equipamento_tipo: e.target.value, equipamento_id: "" })}>
              <option value="">— Nenhum —</option>
              <option value="olt">OLT</option>
              <option value="ceo">Caixa de emenda</option>
              <option value="cto">CTO</option>
            </SelectField>
            <SelectField label="Item" value={f.equipamento_id}
              onChange={(e: any) => setF({ ...f, equipamento_id: e.target.value })} disabled={!f.equipamento_tipo}>
              <option value="">—</option>
              {(equipList ?? []).map((x: any) => <option key={x.id} value={x.id}>{x.nome}</option>)}
            </SelectField>
            <button type="button" onClick={inheritEquipLocation} disabled={!f.equipamento_id}
              className="self-end rounded-md border border-border bg-card px-3 py-2 text-xs hover:bg-accent disabled:opacity-40">
              Usar localização do equipamento
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Latitude" value={f.latitude} onChange={(e: any) => setF({ ...f, latitude: e.target.value })} />
            <Field label="Longitude" value={f.longitude} onChange={(e: any) => setF({ ...f, longitude: e.target.value })} />
            <button type="button" onClick={useMinhaLocalizacao}
              className="self-end inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs hover:bg-accent">
              <MapPin className="h-3.5 w-3.5" /> Usar minha localização
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">Cancelar</button>
          <button type="submit" disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Save className="h-4 w-4" /> {save.isPending ? "Salvando..." : "Salvar OS"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// -------- Detail (view/edit/status/notes/evidence) --------

function OSDetailDialog({ os, onClose }: { os: OrdemServico; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [novaNota, setNovaNota] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listClientes });
  const cliente = os.cliente_id ? (clientes.data ?? []).find((c) => c.id === os.cliente_id) : null;

  const updateStatus = useMutation({
    mutationFn: async (s: OSStatus) => {
      const { error } = await supabase.from("ordens_servico").update({ status: s }).eq("id", os.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status atualizado"); qc.invalidateQueries({ queryKey: ["os"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const addNota = useMutation({
    mutationFn: async () => {
      const nota: OSNota = { ts: new Date().toISOString(), texto: novaNota.trim(), autor: user?.email ?? null };
      const notas = [...(os.notas ?? []), nota];
      const { error } = await supabase.from("ordens_servico").update({ notas }).eq("id", os.id);
      if (error) throw error;
    },
    onSuccess: () => { setNovaNota(""); toast.success("Anotação adicionada"); qc.invalidateQueries({ queryKey: ["os"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeNota = useMutation({
    mutationFn: async (idx: number) => {
      const notas = (os.notas ?? []).filter((_, i) => i !== idx);
      const { error } = await supabase.from("ordens_servico").update({ notas }).eq("id", os.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["os"] }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ordens_servico").delete().eq("id", os.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("OS removida"); qc.invalidateQueries({ queryKey: ["os"] }); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  async function uploadEvidencia(files: FileList | null) {
    if (!files?.length) return;
    if (!user) { toast.error("Entre para enviar evidências"); return; }
    const novos: OSEvidencia[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${os.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("os-evidencias").upload(path, file, { upsert: false });
      if (upErr) { toast.error(`Falha no upload: ${upErr.message}`); continue; }
      const { data } = supabase.storage.from("os-evidencias").getPublicUrl(path);
      novos.push({
        url: data.publicUrl, path,
        tipo: file.type.startsWith("video") ? "video" : "foto",
        nome: file.name, ts: new Date().toISOString(),
      });
    }
    if (!novos.length) return;
    const evidencias = [...(os.evidencias ?? []), ...novos];
    const { error } = await supabase.from("ordens_servico").update({ evidencias }).eq("id", os.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${novos.length} arquivo(s) enviados`);
    qc.invalidateQueries({ queryKey: ["os"] });
  }

  async function removeEvidencia(e: OSEvidencia) {
    if (!confirm("Remover esta evidência?")) return;
    await supabase.storage.from("os-evidencias").remove([e.path]).catch(() => {});
    const evidencias = (os.evidencias ?? []).filter((x) => x.path !== e.path);
    const { error } = await supabase.from("ordens_servico").update({ evidencias }).eq("id", os.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["os"] });
  }

  if (editing) return <OSFormDialog onClose={() => setEditing(false)} initial={os} />;

  return (
    <Modal
      title={<span className="font-mono">OS #{String(os.numero).padStart(5, "0")} — {osTipoLabel[os.tipo]}</span>}
      onClose={onClose}
      wide
    >
      <div className="space-y-5">
        {/* Status quick-change */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          {STATUSES.map((s) => (
            <button key={s} disabled={!user || updateStatus.isPending} onClick={() => updateStatus.mutate(s)}
              className={`rounded-md px-2.5 py-1 text-xs border transition disabled:opacity-40 ${
                os.status === s
                  ? "bg-primary/15 border-primary text-primary"
                  : "border-border bg-card hover:bg-accent"
              }`}>
              {osStatusLabel[s]}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={() => exportOSAsPDF(os, cliente?.nome)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent">
              <FileDown className="h-3.5 w-3.5" /> Exportar PDF
            </button>
            {user && (
              <>
                <button onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button onClick={() => { if (confirm("Remover esta OS?")) remove.mutate(); }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-destructive/50 text-destructive px-3 py-1.5 text-xs hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Info label="Cliente" value={cliente?.nome ?? "—"} />
          <Info label="Técnico" value={os.tecnico || "—"} />
          <Info label="Prioridade" value={<PrioridadePill p={os.prioridade} />} />
          <Info label="Data agendada" value={os.data_agendada ? new Date(os.data_agendada).toLocaleString("pt-BR") : "—"} />
          <Info label="Endereço" value={os.endereco || "—"} />
          <Info label="Localização" value={
            os.latitude != null && os.longitude != null ? (
              <a href={`https://www.google.com/maps?q=${os.latitude},${os.longitude}`} target="_blank" rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {os.latitude.toFixed(5)}, {os.longitude.toFixed(5)}
              </a>
            ) : "—"
          } />
        </div>

        {os.descricao && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Descrição</div>
            <div className="rounded-md border border-border bg-card p-3 text-sm whitespace-pre-wrap">{os.descricao}</div>
          </div>
        )}

        {/* Evidências */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Evidências ({os.evidencias?.length ?? 0})</div>
            {user && (
              <>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden"
                  onChange={(e) => uploadEvidencia(e.target.files)} />
                <button onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent">
                  <Upload className="h-3.5 w-3.5" /> Enviar fotos/vídeos
                </button>
              </>
            )}
          </div>
          {(os.evidencias?.length ?? 0) === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Sem evidências ainda.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {os.evidencias.map((e) => (
                <div key={e.path} className="relative group rounded-md overflow-hidden border border-border bg-card">
                  {e.tipo === "foto" ? (
                    <a href={e.url} target="_blank" rel="noreferrer">
                      <img src={e.url} alt={e.nome} className="w-full h-32 object-cover" />
                    </a>
                  ) : (
                    <video src={e.url} className="w-full h-32 object-cover" controls />
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-white flex items-center gap-1 truncate">
                    {e.tipo === "foto" ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                    <span className="truncate">{e.nome}</span>
                  </div>
                  {user && (
                    <button onClick={() => removeEvidencia(e)}
                      className="absolute top-1 right-1 rounded-full bg-black/70 p-1 opacity-0 group-hover:opacity-100 transition">
                      <X className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <div className="text-sm font-medium mb-2">Histórico / Anotações</div>
          {user && (
            <div className="flex gap-2 mb-3">
              <input value={novaNota} onChange={(e) => setNovaNota(e.target.value)}
                placeholder="Adicionar anotação…"
                className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary" />
              <button disabled={!novaNota.trim() || addNota.isPending} onClick={() => addNota.mutate()}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                Adicionar
              </button>
            </div>
          )}
          {(os.notas?.length ?? 0) === 0 ? (
            <div className="text-xs text-muted-foreground">Sem anotações.</div>
          ) : (
            <ol className="space-y-2">
              {os.notas.map((n, i) => (
                <li key={i} className="rounded-md border border-border bg-card p-3 text-sm">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span>{new Date(n.ts).toLocaleString("pt-BR")} {n.autor ? `· ${n.autor}` : ""}</span>
                    {user && (
                      <button onClick={() => removeNota.mutate(i)} className="hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">{n.texto}</div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}

function Modal({ title, children, onClose, wide }: { title: React.ReactNode; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className={`w-full ${wide ? "max-w-4xl" : "max-w-2xl"} rounded-lg border border-border bg-card shadow-xl my-8`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="font-display font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
