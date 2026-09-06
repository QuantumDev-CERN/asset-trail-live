import { createFileRoute, Link } from "@tanstack/react-router";
import { ALERTS, SCENARIOS } from "@/data/cases";
import { bandTone, CHAIN_LABEL, formatInr, relativeTime, shortAddress } from "@/lib/format";
import { Chip, DisclosureNote, Panel, PanelHeader, SectionLabel } from "@/components/ui/primitives";
import { displayStatus, statusTone, useCases } from "@/lib/case-store";
import { getLiveCase, useLiveTick } from "@/lib/live-case";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operations Console — VASP Attribution Engine" },
      {
        name: "description",
        content:
          "Controlled demonstration console for wallet-to-VASP attribution: tracked cases, live trace runs, confidence bands and parallel stablecoin freezes.",
      },
      { property: "og:title", content: "Operations Console — VASP Attribution Engine" },
      {
        property: "og:description",
        content:
          "Track crypto attribution cases, run traces and issue parallel stablecoin freezes in one console.",
      },
    ],
  }),
  component: ConsolePage,
});

const SEVERITY_TONE = {
  critical: "destructive",
  high: "warning",
  medium: "info",
  info: "muted",
} as const;

function ConsolePage() {
  const cases = useCases();
  useLiveTick();

  const runs = cases.filter((c) => getLiveCase(c.id).status !== "idle");
  const frozen = cases.filter((c) => getLiveCase(c.id).freeze?.status === "frozen");
  const intake = cases.filter((c) => c.origin === "intake");
  const totalValue = cases.reduce((sum, c) => sum + c.amountInr, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations console</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Attribution stops at the first legally-addressable custodial entity — not simply the
            fewest hops. Open a demonstrator case to walk a typology end to end, or run an intake to
            track a new investigation.
          </p>
        </div>
        <Link
          to="/intake"
          className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/85"
        >
          New case intake
        </Link>
      </div>

      <DisclosureNote title="Controlled demonstration environment" tone="warning">
        Every case in this register is prepared demonstration data or an intake case replayed
        against one of those typologies. The counters below reflect what has actually happened in
        this session — they are not production throughput figures. Nothing here claims deterministic
        mixer tracing.
      </DisclosureNote>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Cases in register"
          value={String(cases.length)}
          sub={`${intake.length} opened from intake this session`}
        />
        <Stat
          label="Traces run this session"
          value={String(runs.length)}
          sub="Counted from actual trace runs"
          tone="success"
        />
        <Stat
          label="Parallel freezes confirmed"
          value={String(frozen.length)}
          sub="Issuer-level stablecoin freezes"
          tone="destructive"
        />
        <Stat
          label="Value under trace"
          value={formatInr(totalValue)}
          sub="Sum of FIR-declared amounts"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Panel>
          <PanelHeader
            title="Case register"
            subtitle="Sorted by last activity"
            right={
              <Link to="/cases" className="text-xs font-semibold text-primary hover:underline">
                View all
              </Link>
            }
          />
          <ul className="divide-y divide-border">
            {[...cases]
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((c) => {
                const status = displayStatus(c);
                return (
                  <li key={c.id}>
                    <Link
                      to="/cases/$caseId"
                      params={{ caseId: c.id }}
                      className="block px-4 py-3.5 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-primary">{c.id}</span>
                            <Chip tone="muted" mono>
                              {CHAIN_LABEL[c.chain]}
                            </Chip>
                            <Chip tone={bandTone(c.confidence.band)}>{c.confidence.band}</Chip>
                            <Chip tone={statusTone(status)}>{status}</Chip>
                            {c.origin === "intake" ? <Chip tone="info">intake</Chip> : null}
                          </div>
                          <p className="mt-1.5 text-sm font-semibold">{c.title}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {shortAddress(c.suspectAddress, 14, 8)} · {c.agency}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-semibold">{c.confidence.score}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {relativeTime(c.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader
            title="Alerts & risk flags"
            subtitle="Recorded events from the demonstrator cases"
            right={
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="scan-pulse h-1.5 w-1.5 rounded-full bg-destructive" />
                recorded feed
              </span>
            }
          />
          <ul className="divide-y divide-border">
            {ALERTS.map((a) => (
              <li key={a.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <Chip tone={SEVERITY_TONE[a.severity]}>{a.severity}</Chip>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{a.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {a.detail}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                      <Link
                        to="/cases/$caseId"
                        params={{ caseId: a.caseId }}
                        className="text-primary hover:underline"
                      >
                        {a.caseId}
                      </Link>
                      <span>{shortAddress(a.address, 8, 5)}</span>
                      <span>{relativeTime(a.at)}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-border bg-warning/8 px-4 py-2.5">
            <p className="text-[11px] leading-relaxed text-warning">
              These are recorded events from the demonstrator cases, replayed for the walkthrough.
              Live webhook subscription needs persistent infrastructure beyond this build.
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Demonstrator cases"
          subtitle="One complete worked case per documented laundering typology — load and run any of them live"
        />
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {SCENARIOS.map((s) => {
            const record = cases.find((c) => c.origin !== "intake" && c.scenario === s.key);
            if (!record) return null;
            return (
              <Link
                key={s.key}
                to="/cases/$caseId"
                params={{ caseId: record.id }}
                className="group rounded-lg border border-border bg-surface-raised p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel>Tier {s.tier}</SectionLabel>
                  <Chip tone={bandTone(record.confidence.band)}>{record.confidence.band}</Chip>
                </div>
                <p className="mt-2 text-sm font-semibold group-hover:text-primary">{s.name}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.blurb}</p>
                <p className="mt-3 font-mono text-[10px] text-muted-foreground">{s.typology}</p>
              </Link>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "success" | "destructive";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="panel px-4 py-3.5">
      <SectionLabel>{label}</SectionLabel>
      <p className={`mt-1.5 font-mono text-2xl font-semibold ${color}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
