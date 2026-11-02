export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.5"
    }
    public: {
        Tables: {
            caixas_emenda: {
                Row: {
                    capacidade_fusoes: number | null
                    created_at: string
                    id: string
                    latitude: number
                    longitude: number
                    nome: string
                    observacoes: string | null
                    status: Database["public"]["Enums"]["equipment_status"]
                    tipo: string | null
                    updated_at: string
                }
                Insert: {
                    capacidade_fusoes?: number | null
                    created_at?: string
                    id?: string
                    latitude: number
                    longitude: number
                    nome: string
                    observacoes?: string | null
                    status?: Database["public"]["Enums"]["equipment_status"]
                    tipo?: string | null
                    updated_at?: string
                }
                Update: {
                    capacidade_fusoes?: number | null
                    created_at?: string
                    id?: string
                    latitude?: number
                    longitude?: number
                    nome?: string
                    observacoes?: string | null
                    status?: Database["public"]["Enums"]["equipment_status"]
                    tipo?: string | null
                    updated_at?: string
                }
                Relationships: []
            }
            clientes: {
                Row: {
                    created_at: string
                    cto_id: string | null
                    endereco: string | null
                    id: string
                    nome: string
                    observacoes: string | null
                    pppoe_senha: string | null
                    pppoe_usuario: string | null
                    plano: string | null
                    porta_cto: number | null
                    sinal_rx: number | null
                    status: Database["public"]["Enums"]["equipment_status"]
                    telefone: string | null
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    cto_id?: string | null
                    endereco?: string | null
                    id?: string
                    nome: string
                    observacoes?: string | null
                    pppoe_senha?: string | null
                    pppoe_usuario?: string | null
                    plano?: string | null
                    porta_cto?: number | null
                    sinal_rx?: number | null
                    status?: Database["public"]["Enums"]["equipment_status"]
                    telefone?: string | null
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    cto_id?: string | null
                    endereco?: string | null
                    id?: string
                    nome?: string
                    observacoes?: string | null
                    pppoe_senha?: string | null
                    pppoe_usuario?: string | null
                    plano?: string | null
                    porta_cto?: number | null
                    sinal_rx?: number | null
                    status?: Database["public"]["Enums"]["equipment_status"]
                    telefone?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "clientes_cto_id_fkey"
                        columns: ["cto_id"]
                        isOneToOne: false
                        referencedRelation: "ctos"
                        referencedColumns: ["id"]
                    },
                ]
            }
            conexoes: {
                Row: {
                    comprimento_metros: number | null
                    cor_fibra: string | null
                    created_at: string
                    destino_id: string
                    destino_tipo: Database["public"]["Enums"]["node_type"]
                    id: string
                    observacoes: string | null
                    origem_id: string
                    origem_tipo: Database["public"]["Enums"]["node_type"]
                }
                Insert: {
                    comprimento_metros?: number | null
                    cor_fibra?: string | null
                    created_at?: string
                    destino_id: string
                    destino_tipo: Database["public"]["Enums"]["node_type"]
                    id?: string
                    observacoes?: string | null
                    origem_id: string
                    origem_tipo: Database["public"]["Enums"]["node_type"]
                }
                Update: {
                    comprimento_metros?: number | null
                    cor_fibra?: string | null
                    created_at?: string
                    destino_id?: string
                    destino_tipo?: Database["public"]["Enums"]["node_type"]
                    id?: string
                    observacoes?: string | null
                    origem_id?: string
                    origem_tipo?: Database["public"]["Enums"]["node_type"]
                }
                Relationships: []
            }
            ctos: {
                Row: {
                    caixa_emenda_id: string | null
                    created_at: string
                    id: string
                    latitude: number
                    longitude: number
                    nome: string
                    observacoes: string | null
                    olt_id: string | null
                    porta_pon: number | null
                    portas_total: number
                    status: Database["public"]["Enums"]["equipment_status"]
                    updated_at: string
                }
                Insert: {
                    caixa_emenda_id?: string | null
                    created_at?: string
                    id?: string
                    latitude: number
                    longitude: number
                    nome: string
                    observacoes?: string | null
                    olt_id?: string | null
                    porta_pon?: number | null
                    portas_total?: number
                    status?: Database["public"]["Enums"]["equipment_status"]
                    updated_at?: string
                }
                Update: {
                    caixa_emenda_id?: string | null
                    created_at?: string
                    id?: string
                    latitude?: number
                    longitude?: number
                    nome?: string
                    observacoes?: string | null
                    olt_id?: string | null
                    porta_pon?: number | null
                    portas_total?: number
                    status?: Database["public"]["Enums"]["equipment_status"]
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ctos_caixa_emenda_id_fkey"
                        columns: ["caixa_emenda_id"]
                        isOneToOne: false
                        referencedRelation: "caixas_emenda"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "ctos_olt_id_fkey"
                        columns: ["olt_id"]
                        isOneToOne: false
                        referencedRelation: "olts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            olts: {
                Row: {
                    created_at: string
                    fabricante: string | null
                    id: string
                    ip_gerencia: string | null
                    latitude: number
                    longitude: number
                    modelo: string | null
                    nome: string
                    observacoes: string | null
                    portas_pon: number | null
                    status: Database["public"]["Enums"]["equipment_status"]
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    fabricante?: string | null
                    id?: string
                    ip_gerencia?: string | null
                    latitude: number
                    longitude: number
                    modelo?: string | null
                    nome: string
                    observacoes?: string | null
                    portas_pon?: number | null
                    status?: Database["public"]["Enums"]["equipment_status"]
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    fabricante?: string | null
                    id?: string
                    ip_gerencia?: string | null
                    latitude?: number
                    longitude?: number
                    modelo?: string | null
                    nome?: string
                    observacoes?: string | null
                    portas_pon?: number | null
                    status?: Database["public"]["Enums"]["equipment_status"]
                    updated_at?: string
                }
                Relationships: []
            }
            onus: {
                Row: {
                    created_at: string | null
                    cto_id: string | null
                    id: string
                    latitude: number
                    longitude: number
                    mac: string | null
                    nome: string
                    observacoes: string | null
                    porta_cto: number | null
                    sn: string | null
                    status: Database["public"]["Enums"]["equipment_status"] | null
                }
                Insert: {
                    created_at?: string | null
                    cto_id?: string | null
                    id?: string
                    latitude: number
                    longitude: number
                    mac?: string | null
                    nome: string
                    observacoes?: string | null
                    porta_cto?: number | null
                    sn?: string | null
                    status?: Database["public"]["Enums"]["equipment_status"] | null
                }
                Update: {
                    created_at?: string | null
                    cto_id?: string | null
                    id?: string
                    latitude?: number
                    longitude?: number
                    mac?: string | null
                    nome?: string
                    observacoes?: string | null
                    porta_cto?: number | null
                    sn?: string | null
                    status?: Database["public"]["Enums"]["equipment_status"] | null
                }
                Relationships: [
                    {
                        foreignKeyName: "onus_cto_id_fkey"
                        columns: ["cto_id"]
                        isOneToOne: false
                        referencedRelation: "ctos"
                        referencedColumns: ["id"]
                    },
                ]
            }
            ordens_servico: {
                Row: {
                    cliente_id: string | null
                    created_at: string
                    data_agendada: string | null
                    descricao: string | null
                    endereco: string | null
                    equipamento_id: string | null
                    equipamento_tipo: string | null
                    evidencias: Json
                    id: string
                    latitude: number | null
                    longitude: number | null
                    notas: Json
                    numero: number
                    prioridade: string
                    status: string
                    tecnico: string | null
                    tipo: string
                    updated_at: string
                }
                Insert: {
                    cliente_id?: string | null
                    created_at?: string
                    data_agendada?: string | null
                    descricao?: string | null
                    endereco?: string | null
                    equipamento_id?: string | null
                    equipamento_tipo?: string | null
                    evidencias?: Json
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    notas?: Json
                    numero?: number
                    prioridade?: string
                    status?: string
                    tecnico?: string | null
                    tipo?: string
                    updated_at?: string
                }
                Update: {
                    cliente_id?: string | null
                    created_at?: string
                    data_agendada?: string | null
                    descricao?: string | null
                    endereco?: string | null
                    equipamento_id?: string | null
                    equipamento_tipo?: string | null
                    evidencias?: Json
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    notas?: Json
                    numero?: number
                    prioridade?: string
                    status?: string
                    tecnico?: string | null
                    tipo?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ordens_servico_cliente_id_fkey"
                        columns: ["cliente_id"]
                        isOneToOne: false
                        referencedRelation: "clientes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            rbs: {
                Row: {
                    created_at: string | null
                    fabricante: string | null
                    id: string
                    ip_gerencia: string | null
                    latitude: number
                    longitude: number
                    modelo: string | null
                    nome: string
                    observacoes: string | null
                    status: Database["public"]["Enums"]["equipment_status"] | null
                }
                Insert: {
                    created_at?: string | null
                    fabricante?: string | null
                    id?: string
                    ip_gerencia?: string | null
                    latitude: number
                    longitude: number
                    modelo?: string | null
                    nome: string
                    observacoes?: string | null
                    status?: Database["public"]["Enums"]["equipment_status"] | null
                }
                Update: {
                    created_at?: string | null
                    fabricante?: string | null
                    id?: string
                    ip_gerencia?: string | null
                    latitude?: number
                    longitude?: number
                    modelo?: string | null
                    nome?: string
                    observacoes?: string | null
                    status?: Database["public"]["Enums"]["equipment_status"] | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            equipment_status: "online" | "offline" | "aviso" | "manutencao"
            node_type: "olt" | "ceo" | "cto" | "rb" | "onu"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            equipment_status: ["online", "offline", "aviso", "manutencao"],
            node_type: ["olt", "ceo", "cto", "rb", "onu"],
        },
    },
} as const
