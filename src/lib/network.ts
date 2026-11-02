import { supabase } from "@/integrations/supabase/client";

export type EquipmentStatus = "online" | "offline" | "aviso" | "manutencao";
export type NodeType = "olt" | "ceo" | "cto" | "rb" | "onu";

export type Olt = {
  id: string;
  nome: string;
  modelo: string | null;
  fabricante: string | null;
  ip_gerencia: string | null;
  latitude: number;
  longitude: number;
  portas_pon: number | null;
  status: EquipmentStatus;
  observacoes: string | null;
};

export type CaixaEmenda = {
  id: string;
  nome: string;
  tipo: string | null;
  capacidade_fusoes: number | null;
  latitude: number;
  longitude: number;
  status: EquipmentStatus;
  observacoes: string | null;
};

export type Cto = {
  id: string;
  nome: string;
  olt_id: string | null;
  caixa_emenda_id: string | null;
  porta_pon: number | null;
  portas_total: number;
  latitude: number;
  longitude: number;
  status: EquipmentStatus;
  observacoes: string | null;
};

export type Rb = {
  id: string;
  nome: string;
  fabricante: string | null;
  modelo: string | null;
  ip_gerencia: string | null;
  latitude: number;
  longitude: number;
  status: EquipmentStatus;
  observacoes: string | null;
};

export type Onu = {
  id: string;
  nome: string;
  cto_id: string | null;
  porta_cto: number | null;
  mac: string | null;
  sn: string | null;
  latitude: number;
  longitude: number;
  status: EquipmentStatus;
  observacoes: string | null;
};


export type Cliente = {
  id: string;
  nome: string;
  cto_id: string | null;
  porta_cto: number | null;
  endereco: string | null;
  telefone: string | null;
  plano: string | null;
  sinal_rx: number | null;
  status: EquipmentStatus;
  observacoes: string | null;
  pppoe_usuario: string | null;
  pppoe_senha: string | null;
};

export type Conexao = {
  id: string;
  origem_tipo: NodeType;
  origem_id: string;
  destino_tipo: NodeType;
  destino_id: string;
  cor_fibra: string | null;
  comprimento_metros: number | null;
  observacoes: string | null;
};

export const statusLabel: Record<EquipmentStatus, string> = {
  online: "Online",
  offline: "Offline",
  aviso: "Aviso",
  manutencao: "Manutenção",
};

export const statusColor: Record<EquipmentStatus, string> = {
  online: "var(--color-success)",
  offline: "var(--color-destructive)",
  aviso: "var(--color-warning)",
  manutencao: "var(--color-muted-foreground)",
};

export async function listOlts() {
  const { data, error } = await supabase.from("olts").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Olt[];
}
export async function listCeos() {
  const { data, error } = await supabase.from("caixas_emenda").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as CaixaEmenda[];
}
export async function listCtos() {
  const { data, error } = await supabase.from("ctos").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Cto[];
}
export async function listRbs() {
  const { data, error } = await supabase.from("rbs").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Rb[];
}
export async function listOnus() {
  const { data, error } = await supabase.from("onus").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Onu[];
}

export async function listClientes() {
  const { data, error } = await supabase.from("clientes").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Cliente[];
}
export async function listConexoes() {
  const { data, error } = await supabase.from("conexoes").select("*");
  if (error) throw error;
  return (data ?? []) as Conexao[];
}

export type OSTipo = "instalacao" | "reparo" | "manutencao" | "visita";
export type OSPrioridade = "baixa" | "media" | "alta" | "urgente";
export type OSStatus = "aberta" | "em_andamento" | "concluida" | "cancelada";
export type OSNota = { ts: string; texto: string; autor?: string | null };
export type OSEvidencia = { url: string; path: string; tipo: "foto" | "video"; nome: string; ts: string };

export type OrdemServico = {
  id: string;
  numero: number;
  cliente_id: string | null;
  tipo: OSTipo;
  prioridade: OSPrioridade;
  status: OSStatus;
  tecnico: string | null;
  data_agendada: string | null;
  descricao: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  equipamento_tipo: NodeType | null;
  equipamento_id: string | null;
  notas: OSNota[];
  evidencias: OSEvidencia[];
  created_at: string;
  updated_at: string;
};

export const osTipoLabel: Record<OSTipo, string> = {
  instalacao: "Instalação",
  reparo: "Reparo",
  manutencao: "Manutenção",
  visita: "Visita técnica",
};
export const osPrioridadeLabel: Record<OSPrioridade, string> = {
  baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente",
};
export const osStatusLabel: Record<OSStatus, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};
export const osStatusColor: Record<OSStatus, string> = {
  aberta: "var(--color-warning)",
  em_andamento: "var(--color-primary)",
  concluida: "var(--color-success)",
  cancelada: "var(--color-destructive)",
};

export async function listOS() {
  const { data, error } = await supabase.from("ordens_servico").select("*").order("numero", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrdemServico[];
}

export type DiscoveredEquipment = {
  id: string;
  nome: string;
  tipo: NodeType;
  fabricante: string;
  modelo: string;
  ip: string;
  mac?: string;
  sn?: string;
};

export async function scanNetwork(): Promise<DiscoveredEquipment[]> {
  // Simulação de scan de rede
  await new Promise(resolve => setTimeout(resolve, 3000));

  return [
    {
      id: "disc-1",
      nome: "MikroTik-750r2",
      tipo: "rb",
      fabricante: "MikroTik",
      modelo: "RB750r2 (hEX lite)",
      ip: "172.16.0.1"
    },
    {
      id: "disc-2",
      nome: "OLT-Huawei-MA5800",
      tipo: "olt",
      fabricante: "Huawei",
      modelo: "MA5800-X7",
      ip: "10.0.0.10"
    }
  ];
}
