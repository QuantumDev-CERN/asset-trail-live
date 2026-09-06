import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CASES, SCENARIOS } from "@/data/cases";
import { bandTone, CHAIN_LABEL, formatDateTime, formatInr, shortAddress } from "@/lib/format";
import { Chip, Panel, PanelHeader, SectionLabel } from "@/components/ui/primitives";
import type { ScenarioKey } from "@/lib/types";

export const Route = createFileRoute("/cases/")({
  head: () => ({
    meta: [
      { title: "Case Register — VASP Attribution Engine" },
      {
        name: "description",
        content:
          "Browse every traced case by laundering typology: exchange inflow, mixer detection, tumbler routing, advanced cross-chain typologies and OTC dead-ends.",
      },
      { property: "og:title", content: "Case Register — VASP Attribution Engine" },
      {
        property: "og:description",
        content: "Every traced wallet case, filterable by forensic simulation flow and confidence band.",
      },
    ],
  }),
  component: CaseRegister,
});

function CaseRegister() {
  const [filter, setFilter] = useState<ScenarioKey | "all">("all");
  const visible = filter === "all" ? CASES : CASES.filter((c) => c.scenario === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Case register</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a forensic simulation flow to load the matching worked case end to end.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          All flows
        </FilterButton>
        {SCENARIOS.map((s) => (
          <FilterButton key={s.key} active={filter === s.key} onClick={() => setFilter(s.key)}>
            {s.name}
          </FilterButton>
        ))}
      </div>

      {filter !== "all" ? (
        <Panel className="p-4">
          {(() => {
            const s = SCENARIOS.find((x) => x.key === filter);
            if (!s) return null;
            return (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <SectionLabel>Simulation flow</SectionLabel>
                  <Chip tone={s.tier === 1 ? "success" : "warning"}>Tier {s.tier}</Chip>
                </div>
                <p className="mt-2 text-sm">{s.blurb}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">Typology: {s.typology}</p>
              </>
            );
          })()}
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title={`${visible.length} case${visible.length === 1 ? "" : "s"}`} subtitle="Click through for the full investigation workspace" />
        <ul className="divide-y divide-border">
          {visible.map((c) => (
            <li key={c.id}>
              <Link
                to="/cases/$caseId"
                params={{ caseId: c.id }}
                className="grid gap-3 px-4 py-4 transition-colors hover:bg-accent/50 lg:grid-cols-[1.6fr_1fr_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-primary">{c.id}</span>
                    <Chip tone="muted" mono>
                      {CHAIN_LABEL[c.chain]}
                    </Chip>
                    <Chip tone={bandTone(c.confidence.band)}>{c.confidence.band}</Chip>
                    <Chip tone="muted">{c.status}</Chip>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold">{c.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.summary}</p>
                </div>
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <p className="font-mono">{shortAddress(c.suspectAddress, 16, 8)}</p>
                  <p>{c.firNumber}</p>
                  <p>Opened {formatDateTime(c.openedAt)}</p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="font-mono text-xl font-semibold">{c.confidence.score}</p>
                  <p className="text-[11px] text-muted-foreground">{formatInr(c.amountInr)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md border border-primary/50 bg-primary/12 px-3 py-1.5 text-xs font-semibold text-primary"
          : "rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
