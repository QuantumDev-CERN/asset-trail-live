import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SCENARIOS } from "@/data/cases";
import { displayStatus, statusTone, useCase, useCases } from "@/lib/case-store";
import { FlowGraph, GraphLegend } from "@/components/FlowGraph";
import { EvidencePanel, type Selection } from "@/components/EvidencePanel";
import { ConfidencePanel } from "@/components/ConfidencePanel";
import {
  Button,
  Chip,
  DisclosureNote,
  Field,
  Panel,
  PanelHeader,
  SectionLabel,
} from "@/components/ui/primitives";
import { bandTone, CHAIN_LABEL, formatDateTime, formatInr, shortAddress } from "@/lib/format";
import type { CaseRecord } from "@/lib/types";
import { mixerCorrelations } from "@/lib/mixer-links";

import type { LiveCaseState } from "@/lib/live-case";
import {
  completeTrace,
  detectStablecoin,
  executeFreeze,
  resetTrace,
  startTrace,
  useLiveCase,
} from "@/lib/live-case";

export const Route = createFileRoute("/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case Workspace — VASP Attribution Engine" },
      {
        name: "description",
        content:
          "Investigation workspace: fund-flow graph, classified hops, confidence attribution, parallel stablecoin freeze and a live case timeline.",
      },
      { property: "og:title", content: "Case Workspace — VASP Attribution Engine" },
      {
        property: "og:description",
        content:
          "Trace a suspect wallet to its nearest legally-addressable VASP with full evidence and timeline.",
      },
    ],
  }),
  component: CaseWorkspace,
});

const SEVERITY_TONE = {
  critical: "destructive",
  high: "warning",
  medium: "info",
  info: "muted",
} as const;

function CaseWorkspace() {
  const { caseId } = Route.useParams();
  const record = useCase(caseId);
  const allCases = useCases();
  const [selection, setSelection] = useState<Selection>(null);
  const live = useLiveCase(caseId);

  if (!record) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-xl font-semibold">Case not in the register</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Intake-created cases live in this browser session only, so a page reload clears them. Open
          a demonstrator case or submit a new intake.
        </p>
        <Link
          to="/cases"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          Back to case register
        </Link>
      </div>
    );
  }

  return (
    <CaseWorkspaceBody
      record={record}
      allCases={allCases}
      selection={selection}
      setSelection={setSelection}
      live={live}
    />
  );
}

function CaseWorkspaceBody({
  record,
  allCases,
  selection,
  setSelection,
  live,
}: {
  record: CaseRecord;
  allCases: CaseRecord[];
  selection: Selection;
  setSelection: (s: Selection) => void;
  live: LiveCaseState;
}) {
  const scenario = SCENARIOS.find((s) => s.key === record.scenario);
  const selectedId = selection?.type === "node" ? selection.node.id : null;
  const status = displayStatus(record, live);
  const stablecoin = detectStablecoin(record);
  const timeline = [...record.timeline, ...live.events].sort((a, b) => a.at.localeCompare(b.at));
  const mixerLinks = mixerCorrelations(record, allCases);

  const progress =
    live.status === "idle"
      ? 0
      : Math.round((live.revealed / Math.max(record.edges.length, 1)) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-primary">{record.id}</span>
            <Chip tone="muted" mono>
              {CHAIN_LABEL[record.chain]}
            </Chip>
            <Chip tone={bandTone(record.confidence.band)}>{record.confidence.band}</Chip>
            <Chip tone={statusTone(status)}>{status}</Chip>
            {scenario ? (
              <Chip tone={scenario.tier === 1 ? "success" : "warning"}>Tier {scenario.tier}</Chip>
            ) : null}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{record.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{record.summary}</p>
        </div>
        <Link
          to="/reports/$caseId"
          params={{ caseId: record.id }}
          className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/85"
        >
          Open investigation report
        </Link>
      </div>

      <DisclosureNote title="Controlled demonstration data" tone="warning">
        {record.origin === "intake"
          ? `Opened from console intake. The hop sequence below is replayed from the "${record.templateScenario}" demonstrator typology against the submitted address — it is a simulation, not a live chain pull.`
          : "Prepared demonstrator case. Chain data, labels and issuer responses are simulated for a repeatable walkthrough; nothing here is a live production feed."}
      </DisclosureNote>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Meta label="Suspect address" value={shortAddress(record.suspectAddress, 14, 8)} mono />
        <Meta label="FIR" value={record.firNumber} />
        <Meta label="Investigating officer" value={`${record.officer} · ${record.agency}`} />
        <Meta label="Declared amount" value={formatInr(record.amountInr)} />
      </div>

      <Panel>
        <PanelHeader
          title="Live trace run"
          subtitle={
            live.jobId
              ? `Job ${live.jobId}`
              : "Run the trace hop by hop, as the engine would on intake"
          }
          right={
            <Chip
              tone={
                live.status === "complete"
                  ? "success"
                  : live.status === "tracing"
                    ? "warning"
                    : "muted"
              }
            >
              {live.status === "complete"
                ? "trace complete"
                : live.status === "tracing"
                  ? "tracing…"
                  : "not started"}
            </Chip>
          }
        />
        <div className="space-y-3 p-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${live.status === "idle" ? 0 : progress}%` }}
            />
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            {live.status === "idle"
              ? `${record.edges.length} hops queued · nothing resolved yet`
              : `${live.revealed}/${record.edges.length} hops resolved${live.status === "complete" ? ` · terminus ${record.terminus.label}` : ""}`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => startTrace(record)} disabled={live.status === "tracing"}>
              {live.status === "idle" ? "Run trace" : "Re-run trace"}
            </Button>
            {live.status === "tracing" ? (
              <Button variant="outline" onClick={() => completeTrace(record)}>
                Skip to result
              </Button>
            ) : null}
            {live.status !== "idle" ? (
              <Button variant="outline" onClick={() => resetTrace(record.id)}>
                Reset
              </Button>
            ) : null}
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Fund-flow graph"
            subtitle={`${record.nodes.length} nodes · ${record.edges.length} classified hops · click any node or hop`}
            right={
              selection ? (
                <button
                  type="button"
                  onClick={() => setSelection(null)}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  Clear selection
                </button>
              ) : null
            }
          />
          <FlowGraph
            record={record}
            selectedId={selectedId}
            onSelectNode={(node) => setSelection({ type: "node", node })}
            onSelectEdge={(edge) => setSelection({ type: "edge", edge })}
            revealedHops={live.status === "idle" ? undefined : live.revealed}
          />
          <div className="border-t border-border px-4 py-3">
            <GraphLegend />
          </div>
        </Panel>

        <Panel as="aside" className="overflow-hidden">
          <PanelHeader title="Evidence" subtitle="Selected node or hop" />
          <EvidencePanel selection={selection} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Confidence attribution"
            subtitle="Rule-based, explainable, per-signal"
          />
          <ConfidencePanel record={record} />
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Terminus classification"
              subtitle="Where this trace legally lands"
            />
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  tone={
                    record.terminus.kind === "vasp"
                      ? "success"
                      : record.terminus.kind === "mixer"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {record.terminus.kind === "vasp"
                    ? "Legally-addressable VASP"
                    : record.terminus.kind === "mixer"
                      ? "Mixer boundary"
                      : record.terminus.kind === "otc-hawala"
                        ? "OTC / hawala terminus"
                        : "Unresolved"}
                </Chip>
                <span className="text-sm font-semibold">{record.terminus.label}</span>
              </div>
              <p className="font-mono text-[11.5px] break-all text-muted-foreground">
                {record.terminus.address}
              </p>
              <p className="text-xs leading-relaxed text-foreground/85">
                {record.terminus.statement}
              </p>
            </div>
          </Panel>

          {record.freezeRecommendation && stablecoin ? (
            <Panel>
              <PanelHeader
                title="Parallel action available"
                subtitle="stablecoin_check.py"
                right={
                  live.freeze ? (
                    <Chip tone={live.freeze.status === "frozen" ? "success" : "warning"}>
                      {live.freeze.status === "frozen" ? "funds frozen" : "request sent"}
                    </Chip>
                  ) : (
                    <Chip tone="destructive">action required</Chip>
                  )
                }
              />
              <div className="space-y-3 p-4">
                <DisclosureNote title="Runs alongside, never instead of, the VASP route">
                  {record.freezeRecommendation}
                </DisclosureNote>

                {live.freeze ? (
                  <div className="space-y-3 rounded-md border border-success/40 bg-success/8 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Freeze reference" value={live.freeze.reference} mono />
                      <Field label="Asset" value={`${live.freeze.standard} ${live.freeze.asset}`} />
                      <Field label="Issuer" value={live.freeze.issuer} />
                      <Field label="Amount immobilised" value={live.freeze.amountToken} mono />
                      <Field
                        label="Target address"
                        value={shortAddress(live.freeze.address, 12, 8)}
                        mono
                      />
                      <Field label="Declared exposure" value={formatInr(live.freeze.amountInr)} />
                    </div>
                    <div className="rounded-md border border-border bg-surface-raised px-3 py-2">
                      <SectionLabel>Transaction summary</SectionLabel>
                      <dl className="mt-1.5 grid gap-2 sm:grid-cols-2">
                        <Field label="Transfer hash" value={live.freeze.tx.tx_hash} mono />
                        <Field
                          label="Token contract"
                          value={live.freeze.tx.token_contract ?? "—"}
                          mono
                        />
                        <Field
                          label="From"
                          value={shortAddress(live.freeze.tx.from_address, 10, 6)}
                          mono
                        />
                        <Field
                          label="To"
                          value={shortAddress(live.freeze.tx.to_address, 10, 6)}
                          mono
                        />
                        <Field
                          label="Value"
                          value={`${live.freeze.tx.value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${live.freeze.asset}`}
                          mono
                        />
                        <Field
                          label="Transfer time"
                          value={formatDateTime(live.freeze.tx.timestamp)}
                        />
                      </dl>
                      <p className="mt-2 text-[11px] leading-relaxed text-foreground/85">
                        {record.edges.length} classified hops from{" "}
                        {shortAddress(record.suspectAddress, 10, 6)} to{" "}
                        {live.freeze.address === record.terminus.address
                          ? record.terminus.label
                          : "the flagged address"}
                        . Requested {formatDateTime(live.freeze.requestedAt)}.{" "}
                        {live.freeze.status === "frozen"
                          ? `Issuer confirmed the blacklist call at ${formatDateTime(live.freeze.confirmedAt!)} — balance immobilised pending court direction.`
                          : "Awaiting issuer confirmation — the timeline updates the moment it lands."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button variant="danger" onClick={() => executeFreeze(record)}>
                    Immediate freeze — {stablecoin.standard} {stablecoin.asset} detected
                  </Button>
                )}
              </div>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader
              title="Risk flags"
              subtitle={`${record.riskFlags.length} signals from the risk scoring engine`}
            />
            <ul className="divide-y divide-border">
              {record.riskFlags.map((f) => (
                <li key={f.id} className="flex items-start gap-3 px-4 py-3">
                  <Chip tone={SEVERITY_TONE[f.severity]}>{f.severity}</Chip>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{f.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {f.detail}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">{f.source}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel>
          <PanelHeader
            title="Case timeline"
            subtitle={`${timeline.length} entries · every engine action and officer decision, audit-logged`}
          />
          <ol className="space-y-0 p-4">
            {timeline.map((t, i) => (
              <li key={t.at + t.title} className="relative flex gap-4 pb-5 last:pb-0">
                {i < timeline.length - 1 ? (
                  <span
                    className="absolute top-4 left-[7px] h-full w-px bg-border"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold">{t.title}</p>
                    <Chip tone="muted" mono>
                      {t.phase}
                    </Chip>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {t.detail}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {formatDateTime(t.at)} · {t.actor}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Cross-case links"
              subtitle="cross_case.py — persistent knowledge graph"
            />
            <div className="p-4">
              {record.linkedCases.length ? (
                <ul className="space-y-2">
                  {record.linkedCases.map((id) => {
                    const known = allCases.some((c) => c.id === id);
                    return (
                      <li
                        key={id}
                        className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-raised px-3 py-2"
                      >
                        <span className="font-mono text-xs">{id}</span>
                        {known ? (
                          <Link
                            to="/cases/$caseId"
                            params={{ caseId: id }}
                            className="text-[11px] font-semibold text-primary hover:underline"
                          >
                            Open case
                          </Link>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Archived FIR</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No prior appearances of these addresses in other cases.
                </p>
              )}
            </div>
          </Panel>

          {mixerLinks.length ? (
            <Panel>
              <PanelHeader
                title="Shared-mixer correlation"
                subtitle="Other cases that touched the same pool — probabilistic, not a linkage claim"
              />
              <div className="space-y-3 p-4">
                <DisclosureNote title="How to read this" tone="warning">
                  These cases deposited into the same sanctioned mixing pool and share the weak
                  pre-mix indicators listed below. No deposit is linked to any withdrawal, and no
                  common ownership is asserted. Treat this as a prioritisation signal only.
                </DisclosureNote>
                <ul className="space-y-2">
                  {mixerLinks.map((m) => (
                    <li
                      key={m.caseId + m.poolAddress}
                      className="rounded-md border border-border bg-surface-raised px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs">{m.caseId}</span>
                        <Link
                          to="/cases/$caseId"
                          params={{ caseId: m.caseId }}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Open case
                        </Link>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {m.title}
                      </p>
                      <p className="mt-1.5 text-[11px]">
                        Shared pool: <span className="font-semibold">{m.pool}</span>
                      </p>
                      <p className="font-mono text-[10px] break-all text-muted-foreground">
                        {m.poolAddress}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.sharedIndicators.length ? (
                          m.sharedIndicators.map((t) => (
                            <Chip key={t} tone="warning" mono>
                              shared: {t}
                            </Chip>
                          ))
                        ) : (
                          <Chip tone="muted">pool proximity only</Chip>
                        )}
                        {m.otherIndicators.slice(0, 3).map((t) => (
                          <Chip key={t} tone="muted" mono>
                            {t}
                          </Chip>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader
              title="Scope disclosures for this case"
              subtitle="Stated in the report, not buried"
            />
            <ul className="divide-y divide-border">
              {record.scopeNotes.map((n) => (
                <li key={n.note} className="flex items-start gap-3 px-4 py-3">
                  <Chip tone={n.tier === 1 ? "success" : n.tier === 2 ? "warning" : "muted"}>
                    Tier {n.tier}
                  </Chip>
                  <p className="text-[11px] leading-relaxed text-foreground/85">{n.note}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="panel px-4 py-3">
      <SectionLabel>{label}</SectionLabel>
      <p className={`mt-1 text-sm break-words ${mono ? "font-mono text-[12.5px]" : ""}`}>{value}</p>
    </div>
  );
}
