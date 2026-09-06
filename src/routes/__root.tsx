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

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { API_BASE_URL } from "../lib/api";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-6xl font-bold text-primary">404</p>
        <h1 className="mt-4 text-xl font-semibold">Screen not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That console view doesn't exist. Return to the operations dashboard.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/85"
        >
          Back to console
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
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This view didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something failed while rendering the console. Try again or return to the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/85"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-border-strong px-4 py-2 text-sm font-semibold hover:bg-accent">
            Go to console
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
      { title: "VASP Attribution Engine — Investigative Console" },
      {
        name: "description",
        content:
          "Defensive AML investigation console: trace suspect wallets to the nearest legally-addressable VASP with explainable confidence scoring.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV = [
  { to: "/", label: "Console" },
  { to: "/cases", label: "Cases" },
  { to: "/intake", label: "Intake" },
  { to: "/vasps", label: "VASP directory" },
  { to: "/scope", label: "Scope & limits" },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 lg:px-6">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/50 bg-primary/12">
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4Z" strokeLinejoin="round" />
                  <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold tracking-tight">VASP Attribution Engine</span>
                <span className="block font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  FIU-IND / LEA compliance console
                </span>
              </span>
            </Link>

            <nav className="order-3 flex w-full flex-wrap gap-1 lg:order-none lg:w-auto">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  activeProps={{ className: "bg-primary/12 text-primary hover:bg-primary/12 hover:text-primary" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden items-center gap-1.5 font-mono text-[11px] text-muted-foreground sm:inline-flex">
                <span className="scan-pulse h-1.5 w-1.5 rounded-full bg-success" />
                {API_BASE_URL ? "engine host configured" : "demo corpus"}
              </span>
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-xs font-semibold">Insp. R. Nagaraj</span>
                <span className="block text-[10px] text-muted-foreground">Case-scoped access · audit logged</span>
              </span>
            </div>
          </div>
          <div className="border-t border-border bg-warning/8 px-4 py-1.5 text-center lg:px-6">
            <p className="text-[11px] text-warning">
              Defensive compliance tooling. Outputs are investigative leads with disclosed confidence — never
              standalone proof of ownership.
            </p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 lg:px-6">
          <Outlet />
        </main>

        <footer className="border-t border-border px-4 py-5 lg:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <p>
              Reports are hash-stamped under Bharatiya Sakshya Adhiniyam s.63. Every query in this console is
              recorded in the audit trail.
            </p>
            <p className="font-mono">Demo build · scope disclosures on the Scope &amp; limits page</p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
