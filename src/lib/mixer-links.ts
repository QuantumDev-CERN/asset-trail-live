// Cross-case correlation for mixer / tumbler cases.
//
// Nothing here asserts that a deposit into a mixing pool can be linked to a
// withdrawal. The only claim is much weaker and fully disclosed: two separate
// cases touched the same sanctioned pool, and they share observable
// pre-mix indicators. That is a prioritisation signal for investigators, not
// evidence of a common owner.

import type { CaseRecord, GraphNode } from "@/lib/types";

export interface MixerCorrelation {
  caseId: string;
  title: string;
  firNumber: string;
  known: boolean;
  /** Pool label shared with the case being viewed. */
  pool: string;
  poolAddress: string;
  /** Weak, observable signals both cases have in common. */
  sharedIndicators: string[];
  /** Signals present in the other case only — context, not correlation. */
  otherIndicators: string[];
}

export function mixerNodes(record: CaseRecord): GraphNode[] {
  return record.nodes.filter((n) => n.kind === "mixer");
}

function poolKey(n: GraphNode): string {
  return (n.label ?? n.address).toLowerCase();
}

function indicatorsFor(record: CaseRecord, pool: GraphNode): string[] {
  const out = new Set<string>();
  for (const tag of pool.tags ?? []) out.add(tag);
  for (const n of record.nodes) {
    if (n.id === pool.id) continue;
    for (const tag of n.tags ?? []) {
      if (
        /structuring|denomination|probabilistic|timing|gas-funding|ransomware|multi-fir|investment-fraud/.test(
          tag,
        )
      ) {
        out.add(tag);
      }
    }
  }
  return [...out];
}

/**
 * Other cases in the register that touched the same mixing pool as `record`.
 * Correlation is by pool identity plus shared weak indicators only.
 */
export function mixerCorrelations(record: CaseRecord, all: CaseRecord[]): MixerCorrelation[] {
  const pools = mixerNodes(record);
  if (!pools.length) return [];
  const mine = new Map(pools.map((p) => [poolKey(p), p] as const));
  const myIndicators = new Set(pools.flatMap((p) => indicatorsFor(record, p)));

  const out: MixerCorrelation[] = [];
  for (const other of all) {
    if (other.id === record.id) continue;
    for (const p of mixerNodes(other)) {
      const exact = mine.get(poolKey(p));
      const family = [...mine.values()].find((m) =>
        (m.label ?? "").split(":")[0]!.trim().toLowerCase() ===
        (p.label ?? "").split(":")[0]!.trim().toLowerCase(),
      );
      const matched = exact ?? family;
      if (!matched) continue;
      const theirs = indicatorsFor(other, p);
      out.push({
        caseId: other.id,
        title: other.title,
        firNumber: other.firNumber,
        known: true,
        pool: exact ? (matched.label ?? matched.address) : `${p.label ?? p.address} (same operator)`,
        poolAddress: p.address,
        sharedIndicators: theirs.filter((t) => myIndicators.has(t)),
        otherIndicators: theirs.filter((t) => !myIndicators.has(t)),
      });
      break;
    }
  }
  return out;
}
