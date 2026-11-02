import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Activity, Map as MapIcon, Network, Radio, Users, LayoutDashboard, LogIn, LogOut, Wrench } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

function UserBadge({ compact = false }: { compact?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <Link to="/auth" className={compact
        ? "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs bg-primary/15 text-primary whitespace-nowrap hover:bg-primary/25"
        : "flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"}>
        <LogIn className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        Entrar
      </Link>
    );
  }
  const onOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
  };
  if (compact) {
    return (
      <button onClick={onOut} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-sidebar-foreground/80 whitespace-nowrap hover:bg-accent" title={user.email ?? ""}>
        <LogOut className="h-3.5 w-3.5" /> Sair
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <div className="text-[11px] text-muted-foreground truncate" title={user.email ?? ""}>{user.email}</div>
      <button onClick={onOut} className="w-full flex items-center justify-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">
        <LogOut className="h-3.5 w-3.5" /> Sair
      </button>
    </div>
  );
}

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Este endereço não existe no sistema.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Falha ao carregar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente novamente ou volte ao painel.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Tentar novamente
          </button>
          <a href="/" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
            Painel
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Painel — FiberOps" },
      { name: "description", content: "Visão geral da rede FTTH: OLTs, caixas de emenda, CTOs e clientes." },
      { property: "og:title", content: "Painel — FiberOps" },
      { property: "og:description", content: "Visão geral da rede FTTH: OLTs, caixas de emenda, CTOs e clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Painel — FiberOps" },
      { name: "twitter:description", content: "Visão geral da rede FTTH: OLTs, caixas de emenda, CTOs e clientes." },
      { name: "theme-color", content: "#0b1220" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "FiberOps" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/aaf883e4-e5e1-4235-8816-c0f9d0dc884a/id-preview-7cccce7e--4e720b42-509f-4ab9-b4b9-a4e6f3fe539d.lovable.app-1784730208206.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/aaf883e4-e5e1-4235-8816-c0f9d0dc884a/id-preview-7cccce7e--4e720b42-509f-4ab9-b4b9-a4e6f3fe539d.lovable.app-1784730208206.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
      { rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const nav = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/mapa", label: "Mapa", icon: MapIcon },
  { to: "/equipamentos", label: "Equipamentos", icon: Radio },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/diagrama", label: "Diagrama", icon: Network },
  { to: "/os", label: "Ordens de Serviço", icon: Wrench },
  { to: "/monitoramento", label: "Monitoramento", icon: Activity },
] as const;

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex md:w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-md bg-primary/15 flex items-center justify-center glow-primary" aria-hidden="true">
            <span className="font-display text-primary font-bold">Fi</span>
          </div>
          <div>
            <div className="font-display font-semibold leading-none text-foreground">FiberOps</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Rede FTTH</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-accent hover:text-foreground transition"
              activeProps={{ className: "flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-accent text-foreground font-medium" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <UserBadge />
          <div className="text-[11px] text-muted-foreground">v1 · Provedor de Internet</div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-sidebar/95 backdrop-blur">
        <div className="flex items-center gap-3 px-3 py-2 overflow-x-auto">
          <div className="font-display font-bold text-primary">FiberOps</div>
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-sidebar-foreground/80 whitespace-nowrap hover:bg-accent"
              activeProps={{ className: "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs bg-accent text-foreground whitespace-nowrap" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              <n.icon className="h-3.5 w-3.5" />
              {n.label}
            </Link>
          ))}
          <div className="ml-auto"><UserBadge compact /></div>
        </div>
      </div>

      <main className="flex-1 min-w-0 md:pt-0 pt-12">
        {children}
      </main>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster theme="dark" position="top-right" richColors />
    </QueryClientProvider>
  );
}
