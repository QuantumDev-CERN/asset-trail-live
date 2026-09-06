import type { GraphEdge, GraphNode } from "@/lib/types";
import { CHAIN_LABEL, CHAIN_TICKER, formatDateTime, HOP_CLASS_LABEL, NODE_KIND_LABEL, nodeColorVar } from "@/lib/format";
import { Chip, DisclosureNote, Field, SectionLabel } from "@/components/ui/primitives";

export type Selection =
  | { type: "node"; node: GraphNode }
  | { type: "edge"; edge: GraphEdge }
  | null;

export function EvidencePanel({ selection }: { selection: Selection }) {
  if (!selection) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium text-foreground">No node selected</p>
        <p className="max-w-56 text-xs text-muted-foreground">
          Select any wallet or hop in the fund-flow graph to inspect its evidence record.
        </p>
      </div>
    );
  }

  if (selection.type === "edge") return <EdgeEvidence edge={selection.edge} />;
  return <NodeEvidence node={selection.node} />;
}

function NodeEvidence({ node }: { node: GraphNode }) {
  const color = nodeColorVar(node.kind);
  return (
    <div className="space-y-5 p-4">
      <div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ color, borderColor: color, backgroundColor: "color-mix(in oklab, currentColor 12%, transparent)" }}
        >
          {NODE_KIND_LABEL[node.kind]}
        </span>
        <p className="mt-3 font-mono text-[12.5px] leading-relaxed break-all text-foreground">{node.address}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip tone="muted" mono>
            {CHAIN_LABEL[node.chain]}
          </Chip>
          <Chip tone="muted" mono>
            hop {node.hop}
          </Chip>
          {node.riskScore > 0 ? (
            <Chip tone={node.riskScore >= 80 ? "destructive" : node.riskScore >= 50 ? "warning" : "success"} mono>
              risk {node.riskScore}
            </Chip>
          ) : null}
        </div>
      </div>

      {node.label ? (
        <div className="rounded-md border border-border bg-surface-raised px-3 py-2.5">
          <SectionLabel>Registry label</SectionLabel>
          <p className="mt-1 text-sm font-medium text-foreground">{node.label}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{node.labelSource}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        {node.balance ? <Field label="Balance" value={node.balance} mono /> : null}
        {node.txCount !== undefined ? (
          <Field label="Transactions" value={node.txCount.toLocaleString("en-IN")} mono />
        ) : null}
        {node.firstSeen ? <Field label="First seen" value={formatDateTime(node.firstSeen)} /> : null}
        {node.lastSeen ? <Field label="Last seen" value={formatDateTime(node.lastSeen)} /> : null}
      </div>

      {node.kind === "exchange" ? (
        <div className="space-y-3 rounded-md border border-success/35 bg-success/8 p-3">
          <SectionLabel className="text-success">Legal routing</SectionLabel>
          <div className="grid gap-3">
            <Field label="Jurisdiction" value={node.jurisdiction ?? "—"} />
            <Field
              label="FIU-IND registration"
              value={
                node.fiuRegistered ? (
                  <Chip tone="success">Registered — SAHYOG actionable</Chip>
                ) : (
                  <Chip tone="warning">Not registered — MLAT / Egmont route</Chip>
                )
              }
            />
            <Field label="FATF Travel Rule" value={node.travelRule ?? "Not disclosed"} />
            <Field label="Applicable instrument" value={node.legalInstrument ?? "—"} />
            <Field label="Compliance contact" value={node.complianceContact ?? "—"} mono />
          </div>
        </div>
      ) : null}

      {node.notes ? (
        <div>
          <SectionLabel>Analyst notes</SectionLabel>
          <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">{node.notes}</p>
        </div>
      ) : null}

      {node.tags?.length ? (
        <div>
          <SectionLabel>Tags</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {node.tags.map((t) => (
              <Chip key={t} tone="muted" mono>
                {t}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {node.kind === "mixer" ? (
        <DisclosureNote title="Probabilistic boundary" tone="destructive">
          This engine does not claim deterministic unmixing. Mixer proximity is reported as a standalone risk
          signal; anything downstream is correlation, never linkage.
        </DisclosureNote>
      ) : null}

      {node.kind === "otc-hawala" ? (
        <DisclosureNote title="Terminus, not a failed trace">
          Funds exit the on-chain world here. The address is persisted to the growing OTC/hawala registry so
          future traces short-circuit on sight.
        </DisclosureNote>
      ) : null}
    </div>
  );
}

function EdgeEvidence({ edge }: { edge: GraphEdge }) {
  const { tx } = edge;
  return (
    <div className="space-y-5 p-4">
      <div>
        <Chip tone="primary" mono>
          {HOP_CLASS_LABEL[edge.classification]}
        </Chip>
        <p className="mt-3 font-mono text-[12px] leading-relaxed break-all text-foreground">{tx.tx_hash}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Chain" value={CHAIN_LABEL[tx.chain]} />
        <Field label="Block" value={tx.block_number ? tx.block_number.toLocaleString("en-IN") : "n/a"} mono />
        <Field
          label="Value"
          value={`${tx.value.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${tx.token === "native" ? CHAIN_TICKER[tx.chain] : (tx.token ?? "—")}`}
          mono
        />
        <Field label="Raw type" value={tx.tx_type_raw} mono />
        <Field label="Timestamp" value={formatDateTime(tx.timestamp)} />
        <Field label="Gas used" value={tx.gas_used ? tx.gas_used.toLocaleString("en-IN") : "—"} mono />
      </div>

      {tx.token_contract ? <Field label="Token contract" value={tx.token_contract} mono /> : null}

      <div className="grid gap-4">
        <Field label="From" value={<span className="font-mono text-[11.5px] break-all">{tx.from_address}</span>} />
        <Field label="To" value={<span className="font-mono text-[11.5px] break-all">{tx.to_address}</span>} />
      </div>

      <div className="rounded-md border border-border bg-surface-raised px-3 py-2.5">
        <SectionLabel>Classifier evidence</SectionLabel>
        <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">{edge.evidence}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Chip tone={edge.confidenceDelta >= 0 ? "success" : "destructive"} mono>
            confidence {edge.confidenceDelta >= 0 ? "+" : ""}
            {edge.confidenceDelta}
          </Chip>
          {edge.correlation && edge.correlation !== "none" ? (
            <Chip tone={edge.correlation === "calldata" ? "info" : "warning"} mono>
              {edge.correlation === "calldata" ? "calldata-decoded (strong)" : "time+amount (weak)"}
            </Chip>
          ) : null}
        </div>
      </div>

      {edge.correlation === "time+amount" ? (
        <DisclosureNote title="Weak-signal hop">
          This continuation was inferred from timing and amount correspondence, not from an on-chain link. Any
          disclosure request citing this path must state that on its face.
        </DisclosureNote>
      ) : null}
    </div>
  );
}
