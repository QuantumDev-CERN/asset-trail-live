// Client-side demo runtime for a case: the hop-by-hop trace run, the officer's
// parallel freeze action, and the extra timeline entries both of those produce.
//
// This is deliberately in-memory: the console is a controlled demonstration
// environment, so a page reload resets every run to its starting state.

import { useSyncExternalStore } from "react";
import type { CaseRecord, NormalizedTransaction, TimelineEvent } from "@/lib/types";

export type TraceStatus = "idle" | "tracing" | "complete";

export interface FreezeRecord {
  id: string;
  requestedAt: string;
  confirmedAt: string | null;
  asset: string;
  standard: string;
  issuer: string;
  address: string;
  amountToken: string;
  amountInr: number;
  reference: string;
  status: "requested" | "frozen";
  /** The on-chain transfer the freeze is aimed at — shown as the transaction summary */
  tx: NormalizedTransaction;
}

export interface LiveCaseState {
  status: TraceStatus;
  /** number of hops resolved so far */
  revealed: number;
  events: TimelineEvent[];
  freeze: FreezeRecord | null;
  jobId: string | null;
  startedAt: string | null;
}

const IDLE: LiveCaseState = {
  status: "idle",
  revealed: 0,
  events: [],
  freeze: null,
  jobId: null,
  startedAt: null,
};

const store = new Map<string, LiveCaseState>();
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  for (const l of listeners) l();
}

function set(caseId: string, patch: Partial<LiveCaseState>) {
  store.set(caseId, { ...(store.get(caseId) ?? IDLE), ...patch });
  emit();
}

export function getLiveCase(caseId: string): LiveCaseState {
  return store.get(caseId) ?? IDLE;
}

export function useLiveCase(caseId: string): LiveCaseState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => getLiveCase(caseId),
    () => IDLE,
  );
}

let version = 0;
const bump = () => {
  version += 1;
};
listeners.add(bump);

/** Subscribe a list view to every live-run change, then read getLiveCase(id) per row. */
export function useLiveTick(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => 0,
  );
}


function hex(n: number): string {
  return Array.from({ length: n }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
}

export function newJobId(): string {
  return `JOB-${hex(8)}`;
}

function ev(actor: string, phase: string, title: string, detail: string): TimelineEvent {
  return { at: new Date().toISOString(), actor, phase, title, detail };
}

const HOP_PHASE = [
  "ingest",
  "normalise",
  "classify",
  "label-lookup",
  "score",
  "terminus",
] as const;

/** Runs the trace as a timed sequence so a live audience can watch it resolve. */
export function startTrace(record: CaseRecord, jobId = newJobId(), stepMs = 1100) {
  const existing = timers.get(record.id);
  if (existing) clearTimeout(existing);

  set(record.id, {
    status: "tracing",
    revealed: 0,
    jobId,
    startedAt: new Date().toISOString(),
    freeze: null,
    events: [
      ev(
        "Attribution engine",
        "intake",
        `Trace job ${jobId} accepted`,
        `Suspect address ${record.suspectAddress} queued on ${record.chain}. Adapters selected, hop budget ${record.edges.length}.`,
      ),
    ],
  });

  const step = (i: number) => {
    const edge = record.edges[i];
    const state = getLiveCase(record.id);
    if (!edge) {
      set(record.id, {
        status: "complete",
        revealed: record.edges.length,
        events: [
          ...state.events,
          ev(
            "Attribution engine",
            "terminus",
            `Terminus classified — ${record.terminus.label}`,
            `${record.terminus.statement} Confidence ${record.confidence.score}/100 (${record.confidence.band}).`,
          ),
        ],
      });
      timers.delete(record.id);
      return;
    }

    const to = record.nodes.find((n) => n.id === edge.to);
    set(record.id, {
      revealed: i + 1,
      events: [
        ...state.events,
        ev(
          "Attribution engine",
          HOP_PHASE[Math.min(i, HOP_PHASE.length - 1)]!,
          `Hop ${i + 1} resolved — ${edge.classification}`,
          `${to?.label ?? to?.address ?? edge.to} · ${edge.evidence} (confidence ${edge.confidenceDelta > 0 ? "+" : ""}${edge.confidenceDelta}).`,
        ),
      ],
    });
    timers.set(
      record.id,
      setTimeout(() => step(i + 1), stepMs),
    );
  };

  timers.set(
    record.id,
    setTimeout(() => step(0), stepMs),
  );
}

export function resetTrace(caseId: string) {
  const t = timers.get(caseId);
  if (t) clearTimeout(t);
  timers.delete(caseId);
  store.delete(caseId);
  emit();
}

/** Skip the animation — useful mid-demo when time is short. */
export function completeTrace(record: CaseRecord) {
  const t = timers.get(record.id);
  if (t) clearTimeout(t);
  timers.delete(record.id);
  const state = getLiveCase(record.id);
  set(record.id, {
    status: "complete",
    revealed: record.edges.length,
    jobId: state.jobId ?? newJobId(),
    events: [
      ...state.events,
      ev(
        "Attribution engine",
        "terminus",
        `Terminus classified — ${record.terminus.label}`,
        `${record.terminus.statement} Confidence ${record.confidence.score}/100 (${record.confidence.band}).`,
      ),
    ],
  });
}

/** Stablecoin detected on the trace path — TRC-20 USDT/USDC first, then other chains. */
export function detectStablecoin(record: CaseRecord): {
  asset: "USDT" | "USDC";
  standard: string;
  issuer: string;
  address: string;
  amountToken: string;
  tx: NormalizedTransaction;
} | null {
  const stable = record.edges.filter((e) => /^(usdt|usdc)$/i.test((e.tx.token ?? "").trim()));
  if (!stable.length) return null;
  const edge = stable.find((e) => e.tx.chain === "tron") ?? stable[stable.length - 1]!;
  const asset = /usdc/i.test(edge.tx.token ?? "") ? "USDC" : "USDT";
  const standard =
    edge.tx.chain === "tron" ? "TRC-20" : edge.tx.chain === "ethereum" ? "ERC-20" : "BEP-20";
  return {
    asset,
    standard,
    issuer: asset === "USDC" ? "Circle Internet Financial" : "Tether Operations Limited",
    address: edge.tx.to_address,
    amountToken: `${edge.tx.value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${asset}`,
    tx: edge.tx,
  };
}

/** Officer action: issuer-level freeze, running alongside the VASP disclosure route. */
export function executeFreeze(record: CaseRecord) {
  const detected = detectStablecoin(record);
  if (!detected) return;
  const state = getLiveCase(record.id);
  if (state.freeze) return;

  const reference = `FRZ-${hex(6)}`;
  const requestedAt = new Date().toISOString();

  set(record.id, {
    freeze: {
      id: reference,
      requestedAt,
      confirmedAt: null,
      asset: detected.asset,
      standard: detected.standard,
      issuer: detected.issuer,
      address: detected.address,
      amountToken: detected.amountToken,
      amountInr: record.amountInr,
      reference,
      status: "requested",
      tx: detected.tx,
    },
    events: [
      ...state.events,
      ev(
        `${record.officer} · ${record.agency}`,
        "parallel-action",
        `Immediate freeze requested — ${detected.standard} ${detected.asset} detected`,
          `Issuer-level freeze request ${reference} sent to ${detected.issuer} for ${detected.address} (${detected.amountToken}), on ${detected.standard} transfer ${detected.tx.tx_hash}. Runs alongside, not instead of, the VASP disclosure route.`,
      ),
    ],
  });

  setTimeout(() => {
    const s = getLiveCase(record.id);
    if (!s.freeze) return;
    const confirmedAt = new Date().toISOString();
    set(record.id, {
      freeze: { ...s.freeze, status: "frozen", confirmedAt },
      events: [
        ...s.events,
        ev(
          detected.issuer,
          "parallel-action",
          `Funds frozen — ${detected.amountToken}`,
          `Issuer confirmed the blacklist call against ${detected.address}. Balance is immobilised pending court direction; reference ${reference}.`,
        ),
      ],
    });
  }, 2600);
}
