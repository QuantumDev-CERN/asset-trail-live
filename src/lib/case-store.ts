// Controlled demo case register.
//
// Seeded with the prepared demonstrator cases, then mutated in-memory by the
// console itself: an intake submission creates a real, trackable investigation
// that appears everywhere a demonstrator case does. Nothing is persisted — a
// page reload returns the register to its seeded state, which is exactly what
// you want for a repeatable live demonstration.

import { useSyncExternalStore } from "react";
import { CASES } from "@/data/cases";
import type { CaseRecord, Chain, ScenarioKey } from "@/lib/types";
import { getLiveCase, type LiveCaseState } from "@/lib/live-case";

let records: CaseRecord[] = CASES.map((c) => ({ ...c, origin: "demonstrator" as const }));
const seeded = records;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useCases(): CaseRecord[] {
  return useSyncExternalStore(
    subscribe,
    () => records,
    () => seeded,
  );
}

export function getCase(id: string): CaseRecord | undefined {
  return records.find((c) => c.id === id);
}

export function useCase(id: string): CaseRecord | undefined {
  const all = useCases();
  return all.find((c) => c.id === id);
}

export function updateCase(id: string, patch: Partial<CaseRecord>) {
  records = records.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
  emit();
}

export function resetRegister() {
  records = seeded;
  emit();
}

function hex(n: number): string {
  return Array.from({ length: n }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
}

export interface IntakeInput {
  fir_number: string;
  suspect_address: string;
  chain: Chain;
  complainant_agency: string;
  officer: string;
  amountInr: number;
  template: ScenarioKey;
  jobId: string;
}

/**
 * Creates a tracked investigation from an intake submission.
 *
 * The trace path is replayed from the selected demonstrator typology with the
 * submitted address substituted at hop 0. This is a controlled simulation, and
 * the returned record is labelled as one everywhere it is displayed.
 */
export function createInvestigation(input: IntakeInput): CaseRecord {
  const template = records.find((c) => c.scenario === input.template && c.origin === "demonstrator") ?? seeded[0]!;
  const now = new Date().toISOString();
  const id = `CASE-${hex(6)}`;
  const suspect = input.suspect_address.trim();

  const nodes = template.nodes.map((n, i) =>
    i === 0 ? { ...n, address: suspect, chain: input.chain, notes: n.notes } : { ...n },
  );
  const edges = template.edges.map((e) => ({
    ...e,
    id: `${id}-${e.id}`,
    tx: {
      ...e.tx,
      from_address: e.tx.from_address === template.suspectAddress ? suspect : e.tx.from_address,
    },
  }));

  const linked = records
    .filter((c) => c.suspectAddress.toLowerCase() === suspect.toLowerCase())
    .map((c) => c.id);

  const record: CaseRecord = {
    ...template,
    id,
    origin: "intake",
    templateScenario: template.scenario,
    templateCaseId: template.id,
    jobId: input.jobId,
    firNumber: input.fir_number,
    title: `${input.fir_number} — intake trace (${template.scenario} pattern)`,
    suspectAddress: suspect,
    chain: input.chain,
    agency: input.complainant_agency,
    officer: input.officer,
    status: "open",
    openedAt: now,
    updatedAt: now,
    amountInr: input.amountInr,
    summary: `Investigation opened from console intake for ${suspect} on ${input.chain}. The trace is replayed against the "${template.scenario}" demonstrator typology so the full attribution path can be shown end to end — it is controlled simulation data, not live chain output for this address.`,
    nodes,
    edges,
    linkedCases: linked,
    timeline: [
      {
        at: now,
        actor: "SAHYOG intake (stub)",
        phase: "Intake",
        title: `Case registered — job ${input.jobId}`,
        detail: `${input.fir_number} submitted by ${input.complainant_agency}. Suspect address ${suspect} queued on ${input.chain}. No trace run yet.`,
      },
    ],
    cert: { ...template.cert, hash: "", generatedAt: now },
    scopeNotes: [
      {
        tier: 2,
        note: "Intake-created case. The hop sequence is replayed from a demonstrator typology against the submitted address — it is a controlled simulation, not a live chain pull.",
      },
      ...template.scopeNotes,
    ],
  };

  records = [record, ...records];
  emit();
  return record;
}

export type DisplayStatus = CaseRecord["status"] | "tracing" | "funds frozen";

/** Case status as the console shows it, folding in whatever the live run has done. */
export function displayStatus(record: CaseRecord, live: LiveCaseState = getLiveCase(record.id)): DisplayStatus {
  if (live.freeze?.status === "frozen") return "funds frozen";
  if (live.status === "tracing") return "tracing";
  if (live.status === "complete") {
    if (record.terminus.kind === "vasp") return "attributed";
    if (record.terminus.kind === "mixer") return "escalated";
    return "unresolved";
  }
  return record.origin === "intake" ? "open" : record.status;
}

export function statusTone(status: DisplayStatus): "success" | "warning" | "destructive" | "info" | "muted" {
  if (status === "funds frozen" || status === "attributed") return "success";
  if (status === "tracing") return "info";
  if (status === "escalated") return "destructive";
  if (status === "unresolved" || status === "watchlisted") return "warning";
  return "muted";
}
