import type { CaseRecord } from "@/lib/types";
import { bandTone } from "@/lib/format";
import { Chip, DisclosureNote, SectionLabel } from "@/components/ui/primitives";

export function ConfidencePanel({ record }: { record: CaseRecord }) {
  const { confidence } = record;
  const tone = bandTone(confidence.band);
  const capped = confidence.band === "Flagged-Mixer";
  const barColor =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "destructive"
          ? "var(--destructive)"
          : "var(--muted-foreground)";

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>Attribution confidence</SectionLabel>
          <p
            className="mt-1 font-mono text-4xl leading-none font-semibold"
            style={{ color: barColor }}
          >
            {confidence.score}
            <span className="text-base text-muted-foreground">/100</span>
          </p>
        </div>
        <Chip tone={tone}>{confidence.band}</Chip>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(confidence.score, 2)}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>Low &lt;40</span>
        <span>Medium 40–69</span>
        <span>High ≥70</span>
      </div>

      <div className="rounded-md border border-border bg-surface-raised px-3 py-2.5">
        <SectionLabel>Reason string</SectionLabel>
        <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed text-foreground/90">
          {confidence.reason}
        </p>
      </div>

      <div>
        <SectionLabel>Signal breakdown</SectionLabel>
        <ul className="mt-2 divide-y divide-border overflow-hidden rounded-md border border-border">
          {confidence.breakdown.map((b) => (
            <li key={b.signal} className="flex items-start gap-3 bg-surface-raised px-3 py-2.5">
              <span
                className="mt-0.5 shrink-0 font-mono text-xs font-semibold"
                style={{
                  color:
                    b.adjustment > 0
                      ? "var(--success)"
                      : b.adjustment < 0
                        ? "var(--destructive)"
                        : "var(--muted-foreground)",
                }}
              >
                {b.adjustment > 0 ? "+" : ""}
                {b.adjustment}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-foreground">{b.signal}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                  {b.note}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {capped ? (
        <DisclosureNote title="Band hard-capped" tone="destructive">
          A known mixer contract sits on this path. Per the scoring model the band is reported
          separately as Flagged-Mixer and is never blended into a High or Medium attribution claim,
          whatever the numeric score.
        </DisclosureNote>
      ) : null}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Scoring is rule-based and explainable by design — not machine-learned — because this output
        is intended to be defensible as evidence.
      </p>
    </div>
  );
}
