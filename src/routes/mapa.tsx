import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExportButtons } from "@/components/network/ExportButtons";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Georreferenciamento da Rede — FiberOps" },
      { name: "description", content: "Visualize a infraestrutura da rede FTTH em um mapa georreferenciado interativo. Acompanhe a localização de OLTs, CEOs e CTOs em tempo real." },
      { property: "og:title", content: "Mapa da Rede — FiberOps" },
      { property: "og:description", content: "Localização geográfica e georreferenciamento de infraestrutura de rede óptica." },
    ],
  }),
  component: MapaPage,
});

const MapView = lazy(() => import("@/components/network/MapView"));

function MapaPage() {
  const captureRef = useRef<HTMLDivElement>(null);
  return (
    <div className="p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Mapa da rede"
          subtitle="Visualize seus equipamentos por localização. Clique em um pin para detalhes."
        />
        <div className="pt-1">
          <ExportButtons
            targetRef={captureRef}
            fileBaseName="mapa-rede"
            pdfTitle="Mapa da rede FTTH"
          />
        </div>
      </div>
      <div
        ref={captureRef}
        className="rounded-lg border border-border overflow-hidden h-[calc(100vh-220px)] min-h-[500px]"
      >
        <Suspense fallback={<div className="h-full flex items-center justify-center text-sm text-muted-foreground">Carregando mapa…</div>}>
          <MapView />
        </Suspense>
      </div>
    </div>
  );
}
