import { useState, useEffect } from "react";
import { Search, Loader2, ShieldCheck, Cpu, Radio, Check, X, Wifi, Lock, User, Key } from "lucide-react";
import { scanNetwork, type DiscoveredEquipment } from "@/lib/network";
import { testRouterConnection } from "@/lib/routeros.server";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function AutoDiscovery({ onClose }: { onClose: () => void }) {
  const [scanning, setScanning] = useState(true);
  const [results, setResults] = useState<DiscoveredEquipment[]>([]);
  const [selected, setSelected] = useState<DiscoveredEquipment | null>(null);
  const [configuring, setConfiguring] = useState(false);
  const [credentials, setCredentials] = useState({ user: "", password: "" });
  const [step, setStep] = useState<"list" | "confirm" | "auth">("list");
  const queryClient = useQueryClient();

  const [testing, setTesting] = useState(false);
  const [testDetails, setTestDetails] = useState<{
    status: "success" | "error" | null;
    ip: string;
    responseTime: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    async function runScan() {
      try {
        const found = await scanNetwork();
        setResults(found);
      } catch (e) {
        toast.error("Erro ao escanear rede");
      } finally {
        setScanning(false);
      }
    }
    runScan();
  }, []);

  const handleTestConnection = async () => {
    if (!credentials.user || !credentials.password) {
      toast.error("Insira o usuário e senha para testar");
      return;
    }
    setTesting(true);
    setTestDetails(null);

    const testIp = selected?.ip || "192.168.2.3";
    const startTime = Date.now();

    try {
      const result = await testRouterConnection({
        data: {
          host: testIp,
          user: credentials.user,
          password: credentials.password,
          port: 8728,
        },
      });

      setTestDetails({
        status: "success",
        ip: testIp,
        responseTime: result.latency || `${Date.now() - startTime}ms`,
        message: `Conexão RouterOS estabelecida. Identidade: ${result.identity}${result.version ? ` · RouterOS ${result.version}` : ""}`,
      });

      toast.success("MikroTik Sincronizada!");
      return true;
    } catch (e: any) {
      setTestDetails({
        status: "error",
        ip: testIp,
        responseTime: "Timeout",
        message: e?.message || "Não foi possível conectar à API RouterOS. Verifique IP, porta, usuário, senha e firewall.",
      });
      toast.error("Falha na sincronização");
      return false;
    } finally {
      setTesting(false);
    }
  };

  const handleApprove = async (eq: DiscoveredEquipment) => {
    setConfiguring(true);
    try {
      if (!credentials.user || !credentials.password) {
        toast.error("Por favor, insira o usuário e senha da MikroTik");
        setConfiguring(false);
        return;
      }
      const table = eq.tipo === "olt" ? "olts" : "rbs";
      const payload: any = {
        nome: eq.nome,
        fabricante: eq.fabricante,
        modelo: eq.modelo,
        ip_gerencia: eq.ip,
        status: "online",
        latitude: -23.5505, // Coordenadas padrão para demonstração
        longitude: -46.6333,
      };

      if (eq.tipo === "olt") {
        payload.portas_pon = 8;
      }

      const { error } = await supabase.from(table as any).insert(payload);
      if (error) throw error;

      toast.success(`${eq.fabricante} configurado e adicionado ao inventário!`);
      queryClient.invalidateQueries({ queryKey: [eq.tipo === "olt" ? "olts" : "rbs"] });
      setResults(prev => prev.filter(item => item.id !== eq.id));
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setConfiguring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-border flex items-center justify-between bg-accent/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Wifi className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Auto-Descoberta de Rede</h2>
              <p className="text-sm text-muted-foreground">Identificando equipamentos automaticamente na rede local</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {scanning ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-lg font-medium">Escaneando rede...</p>
                <p className="text-sm text-muted-foreground">Procurando por MikroTiks, OLTs e Switches</p>
              </div>
            </div>
          ) : step === "list" && results.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-primary">Encontramos {results.length} novos equipamentos:</p>
              <div className="grid gap-3">
                {results.map((eq) => (
                  <div
                    key={eq.id}
                    className="p-4 rounded-lg border border-border bg-accent/10 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => {
                      setSelected(eq);
                      setStep("confirm");
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${eq.tipo === "olt" ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"
                          }`}>
                          {eq.tipo === "olt" ? <Radio className="h-6 w-6" /> : <Cpu className="h-6 w-6" />}
                        </div>
                        <div>
                          <div className="font-bold">{eq.nome}</div>
                          <div className="text-sm text-muted-foreground">{eq.fabricante} {eq.modelo} · IP: {eq.ip}</div>
                        </div>
                      </div>
                      <div className="text-xs font-mono px-2 py-1 rounded bg-background border border-border text-primary">DETECTADO</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : step === "confirm" && selected ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className={`h-20 w-20 rounded-2xl flex items-center justify-center ${selected.tipo === "olt" ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"
                }`}>
                {selected.tipo === "olt" ? <Radio className="h-10 w-10" /> : <Cpu className="h-10 w-10" />}
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">{selected.nome}</h3>
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest">Equipamento Detectado</p>
                  <p className="text-xl font-mono text-primary">{selected.ip}</p>
                  <p className="text-sm px-3 py-1 rounded-full bg-accent inline-block mx-auto">
                    Tipo: <span className="font-bold">{selected.tipo === "olt" ? "OLT (Optical Line Terminal)" : "RB (RouterBoard / MikroTik)"}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-4 w-full max-w-sm">
                <button
                  onClick={() => {
                    setSelected(null);
                    setStep("list");
                  }}
                  className="flex-1 px-4 py-3 bg-accent hover:bg-accent/80 rounded-lg font-bold transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep("auth")}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                  Confirmar e Prosseguir
                </button>
              </div>
            </div>
          ) : step === "auth" && selected ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-accent/20 p-4 rounded-lg flex items-center gap-4 border border-primary/20">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-bold text-sm">Autenticação e Sincronização</p>
                  <p className="text-xs text-muted-foreground">Validando acesso ao equipamento {selected.nome} no IP {selected.ip}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" /> Usuário
                  </label>
                  <input
                    type="text"
                    value={credentials.user}
                    onChange={(e) => setCredentials(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="admin"
                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Key className="h-3 w-3" /> Senha
                  </label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {testDetails && (
                <div className={`p-4 rounded-lg border animate-in fade-in slide-in-from-top-2 ${testDetails.status === "success" ? "bg-green-500/10 border-green-500/30" : "bg-destructive/10 border-destructive/30"
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2 w-2 rounded-full ${testDetails.status === "success" ? "bg-green-500" : "bg-destructive"}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">Resultado do Teste</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`ml-2 font-medium ${testDetails.status === "success" ? "text-green-400" : "text-destructive"}`}>
                        {testDetails.status === "success" ? "CONECTADO" : "ERRO"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IP Testado:</span>
                      <span className="ml-2 font-mono">{testDetails.ip}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Latência:</span>
                      <span className="ml-2 font-mono">{testDetails.responseTime}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Mensagem:</span>
                      <p className="mt-1 text-xs italic">{testDetails.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStep("confirm")}
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors text-muted-foreground"
                >
                  Voltar
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing || configuring}
                    className="px-4 py-2 text-sm font-medium border border-primary text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center gap-2 group relative"
                    title="Realizar teste de conexão"
                  >
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                    TESTE DE CONEXÃO
                  </button>

                  <button
                    onClick={() => handleApprove(selected)}
                    disabled={configuring || testing}
                    className={`inline-flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-md transition-all shadow-lg shadow-primary/20 ${testDetails?.status === "success"
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      }`}
                  >
                    {configuring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    AUTENTICAR E CONECTAR
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <Search className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium">Nenhum equipamento novo</p>
                <p className="text-sm text-muted-foreground">Todos os equipamentos visíveis já estão cadastrados.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}