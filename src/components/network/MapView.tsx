import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Crosshair, Navigation } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { listCeos, listCtos, listOlts, statusColor, statusLabel, type EquipmentStatus } from "@/lib/network";

function pinIcon(color: string, label: string) {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='34' height='42' viewBox='0 0 34 42'>
      <defs><filter id='g'><feGaussianBlur stdDeviation='2'/></filter></defs>
      <ellipse cx='17' cy='40' rx='6' ry='2' fill='rgba(0,0,0,0.4)' filter='url(#g)'/>
      <path d='M17 1 C7 1 2 9 2 16 c0 10 15 24 15 24 s15 -14 15 -24 c0 -7 -5 -15 -15 -15 z'
        fill='${color}' stroke='rgba(0,0,0,0.6)' stroke-width='1.5'/>
      <circle cx='17' cy='15' r='8' fill='rgba(0,0,0,0.35)'/>
      <text x='17' y='19' text-anchor='middle' font-family='Space Grotesk,Inter,sans-serif'
        font-size='10' font-weight='700' fill='white'>${label}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36],
  });
}

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const meRef = useRef<L.LayerGroup | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const firstFixRef = useRef(true);
  const [locating, setLocating] = useState(false);
  const [auto, setAuto] = useState(false);
  const [meError, setMeError] = useState<string | null>(null);

  const olts = useQuery({ queryKey: ["olts"], queryFn: listOlts });
  const ceos = useQuery({ queryKey: ["ceos"], queryFn: listCeos });
  const ctos = useQuery({ queryKey: ["ctos"], queryFn: listCtos });


  const items = useMemo(() => {
    const arr: { id: string; nome: string; lat: number; lng: number; kind: "OLT" | "CEO" | "CTO"; status: EquipmentStatus; extra?: string }[] = [];
    (olts.data ?? []).forEach((o) => arr.push({ id: o.id, nome: o.nome, lat: o.latitude, lng: o.longitude, kind: "OLT", status: o.status, extra: o.ip_gerencia ?? undefined }));
    (ceos.data ?? []).forEach((c) => arr.push({ id: c.id, nome: c.nome, lat: c.latitude, lng: c.longitude, kind: "CEO", status: c.status, extra: c.tipo ?? undefined }));
    (ctos.data ?? []).forEach((c) => arr.push({ id: c.id, nome: c.nome, lat: c.latitude, lng: c.longitude, kind: "CTO", status: c.status, extra: `${c.portas_total} portas` }));
    return arr;
  }, [olts.data, ceos.data, ctos.data]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView([-14.235, -51.9253], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);
    mapInstance.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    meRef.current = L.layerGroup().addTo(map);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      map.remove();
      mapInstance.current = null;
      layerRef.current = null;
      meRef.current = null;
    };
  }, []);

  const handlePosition = useCallback((pos: GeolocationPosition, shouldCenter: boolean) => {
    setLocating(false);
    const map = mapInstance.current;
    const me = meRef.current;
    if (!map || !me) return;

    const { latitude, longitude, accuracy } = pos.coords;
    me.clearLayers();
    L.circle([latitude, longitude], {
      radius: Math.max(accuracy, 15),
      color: "#22d3ee",
      fillColor: "#22d3ee",
      fillOpacity: 0.15,
      weight: 1,
    }).addTo(me);
    L.circleMarker([latitude, longitude], {
      radius: 7,
      color: "#0b0f14",
      weight: 2,
      fillColor: "#22d3ee",
      fillOpacity: 1,
    })
      .addTo(me)
      .bindPopup(
        `<div style="font-family:Inter,sans-serif"><b>Você está aqui</b><br/><span style="font-size:10px;font-family:JetBrains Mono,monospace">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</span><br/><span style="font-size:10px;opacity:.7">Precisão ~${Math.round(accuracy)} m</span></div>`,
      );

    if (shouldCenter) {
      map.flyTo([latitude, longitude], 16, { duration: 0.8 });
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setMeError("Geolocalização não suportada neste dispositivo.");
      setAuto(false);
      return;
    }
    setMeError(null);
    setLocating(true);
    firstFixRef.current = true;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const isFirst = firstFixRef.current;
        if (isFirst) firstFixRef.current = false;
        handlePosition(pos, isFirst);
      },
      (err) => {
        setLocating(false);
        setMeError(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada. Libere o acesso no navegador."
            : "Não foi possível obter sua localização.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );

    setAuto(true);
  }, [handlePosition]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setAuto(false);
    setLocating(false);
  }, []);

  const locateMe = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setMeError("Geolocalização não suportada neste dispositivo.");
      return;
    }
    setMeError(null);
    setLocating(true);
    firstFixRef.current = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => handlePosition(pos, true),
      (err) => {
        setLocating(false);
        setMeError(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada. Libere o acesso no navegador."
            : "Não foi possível obter sua localização.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }, [handlePosition]);


  useEffect(() => {
    const map = mapInstance.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (items.length === 0) return;

    items.forEach((it) => {
      const colorCss = getComputedStyle(document.documentElement).getPropertyValue(statusColor[it.status].replace("var(", "").replace(")", "")).trim() || "#4dd";
      const color = colorCss.startsWith("oklch") ? colorCss : colorCss;
      // Fallback to inline hex for reliability
      const hex = it.status === "online" ? "#3fd39a" : it.status === "offline" ? "#f04e4e" : it.status === "aviso" ? "#eab13a" : "#8a94a6";
      const marker = L.marker([it.lat, it.lng], { icon: pinIcon(hex, it.kind) }).addTo(layer);
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:180px">
          <div style="font-weight:600;font-size:13px">${it.nome}</div>
          <div style="font-size:11px;opacity:0.7;margin-top:2px">${it.kind} · ${statusLabel[it.status]}</div>
          ${it.extra ? `<div style="font-size:11px;margin-top:6px;opacity:0.85">${it.extra}</div>` : ""}
          <div style="font-size:10px;margin-top:6px;opacity:0.5;font-family:JetBrains Mono,monospace">${it.lat.toFixed(5)}, ${it.lng.toFixed(5)}</div>
        </div>
      `);
      void color;
    });

    const bounds = L.latLngBounds(items.map((i) => [i.lat, i.lng] as [number, number]));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [items]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1.5">
        <div className="flex flex-col gap-1.5">
          <button
            onClick={locateMe}
            disabled={locating}
            aria-label="Centralizar na minha localização"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card/95 backdrop-blur px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-60"
          >
            <Crosshair className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {locating ? "Localizando…" : "Minha localização"}
          </button>
          <button
            onClick={() => (auto ? stopWatching() : startWatching())}
            aria-label={auto ? "Pausar rastreamento GPS" : "Ativar rastreamento GPS automático"}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors ${
              auto
                ? "border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border bg-card/95 hover:bg-accent"
            }`}
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
            {auto ? "Pausar atualização" : "Atualizar automática"}
          </button>
        </div>
        {auto && (
          <div className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-card/95 px-2.5 py-1 text-[11px] text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Atualizando a cada poucos segundos
          </div>
        )}
        {meError && (
          <div className="max-w-[220px] rounded-md border border-destructive/50 bg-card/95 backdrop-blur px-2.5 py-1.5 text-[11px] text-destructive">
            {meError}
          </div>
        )}
      </div>

      {items.length === 0 && !olts.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm pointer-events-none">
          <div className="text-center max-w-sm px-6">
            <div className="font-display text-lg font-semibold">Nenhum equipamento cadastrado</div>
            <p className="text-sm text-muted-foreground mt-1">Adicione OLTs, CEOs e CTOs em <span className="text-primary">Equipamentos</span> para vê-los aqui.</p>
          </div>
        </div>
      )}
    </div>
  );
}
