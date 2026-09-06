import { createFileRoute } from "@tanstack/react-router";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { Chip, DisclosureNote, Panel, PanelHeader, SectionLabel } from "@/components/ui/primitives";

export const Route = createFileRoute("/scope")({
  head: () => ({
    meta: [
      { title: "Scope, Limits & Disclosures — VASP Attribution Engine" },
      {
        name: "description",
        content:
          "What this engine claims, what it explicitly does not, and how each capability tier is scoped — including probabilistic mixer disclosures and API integration status.",
      },
      { property: "og:title", content: "Scope, Limits & Disclosures — VASP Attribution Engine" },
      {
        property: "og:description",
        content:
          "Explicit capability tiers, probabilistic disclosures and out-of-scope boundaries for the attribution engine.",
      },
    ],
  }),
  component: ScopePage,
});

const TIERS = [
  {
    tier: 1,
    tone: "success" as const,
    title: "Runs live on real chain data",
    items: [
      "Ethereum adapter against Etherscan — full transaction history normalised into the canonical schema.",
      "Tron adapter against TronGrid — native TRX plus USDT-TRC20 transfer history in the same shape.",
      "Hop classification: direct-transfer, dex-swap (decoded Uniswap/PancakeSwap router logs), mixer-deposit, sweep-candidate.",
      "Sweep detection with retroactive back-labelling of contributing deposit addresses.",
      "Rule-based confidence scoring with a human-readable reason string for every path.",
      "Cross-case knowledge graph lookup across prior FIRs.",
      "Report generation with a SHA-256 hash-stamped evidentiary certificate.",
    ],
  },
  {
    tier: 2,
    tone: "warning" as const,
    title: "Simplified but honestly scoped",
    items: [
      "Bridge and non-KYC swap-service correlation uses a static registry plus time/amount matching. There is no live cross-chain event subscription.",
      "OTC/hawala detection is a heuristic pattern match against a growing registry, not a trained model.",
      "Bitcoin, BNB Chain, Polygon and Solana adapters implement the normalisation contract; they are not wired to live APIs in this build.",
      "Post-mixer correlation is best-effort only and always disclosed as probabilistic.",
    ],
  },
  {
    tier: 3,
    tone: "muted" as const,
    title: "Designed, deliberately not built",
    items: [
      "Full RBAC and audit-logging system — a production requirement, designed against the same privacy criticism raised at Samanvaya.",
      "Real SAHYOG API integration — the contract is defined; the connection here is a labelled stub.",
      "Live watchlisting and webhook alerting — needs persistent infrastructure.",
      "Feedback loop recalibrating confidence weights from confirmed VASP-cooperation outcomes.",
      "Graph database sharding and pruning at billions-of-edges scale. In-memory subgraphs are correct at demo scale.",
      "MLAT / Egmont cross-border routing logic beyond directory-level classification.",
    ],
  },
];

function ScopePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scope, limits &amp; disclosures</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          This is defensive compliance tooling for authorised investigators. Stating the boundaries
          plainly is part of the design: an evidentiary tool that overclaims is worse than one that
          admits what it cannot see.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DisclosureNote title="Not an evasion tool" tone="destructive">
          Nothing in this console is intended to help anyone avoid detection. It exists to shorten
          the path from a suspect wallet to a legally-addressable custodian, under case-scoped
          access and a full audit trail.
        </DisclosureNote>
        <DisclosureNote title="Leads, not proof">
          Every attribution is a probabilistic investigative lead with a disclosed confidence band
          and a human-readable reason string. Address attribution is not proof of ownership or of
          criminal conduct.
        </DisclosureNote>
      </div>

      <Panel>
        <PanelHeader
          title="Out of scope — stated upfront"
          subtitle="These boundaries are permanent, not backlog items"
        />
        <ul className="divide-y divide-border">
          {[
            {
              t: "Privacy coins (Monero, Zcash)",
              d: "Not solvable with certainty by anyone. Excluded from deterministic attribution entirely.",
            },
            {
              t: "Large-anonymity-set mixers",
              d: "Probabilistic best-effort only, always disclosed as such. The engine never claims deterministic unmixing.",
            },
            {
              t: "Foreign VASPs outside the FIU-IND registry",
              d: "Routed to the MLAT or Egmont Group FIU-to-FIU channel, never presented as directly SAHYOG-actionable.",
            },
            {
              t: "Off-chain hawala payout networks",
              d: "Recognised and labelled as a terminus. The on-chain trail genuinely ends there; the investigation continues elsewhere.",
            },
          ].map((i) => (
            <li key={i.t} className="px-4 py-3">
              <p className="text-sm font-semibold">{i.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.d}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-3">
        {TIERS.map((t) => (
          <Panel key={t.tier}>
            <PanelHeader
              title={`Tier ${t.tier}`}
              subtitle={t.title}
              right={<Chip tone={t.tone}>Tier {t.tier}</Chip>}
            />
            <ul className="space-y-2.5 p-4">
              {t.items.map((i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/85">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                  {i}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHeader
          title="Backend integration readiness"
          subtitle="Endpoint map for the FastAPI engine. Set VITE_VASP_API_URL to switch the console from the demo corpus to live calls."
          right={
            <Chip tone={API_BASE_URL ? "success" : "muted"} mono>
              {API_BASE_URL || "no host configured"}
            </Chip>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Method</th>
                <th className="px-4 py-2.5 font-medium">Path</th>
                <th className="px-4 py-2.5 font-medium">Purpose</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {API_ENDPOINTS.map((e) => (
                <tr key={e.path}>
                  <td className="px-4 py-2.5 font-mono text-primary">{e.method}</td>
                  <td className="px-4 py-2.5 font-mono">{e.path}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.purpose}</td>
                  <td className="px-4 py-2.5">
                    <Chip tone={e.wired ? "success" : "muted"}>
                      {e.wired ? "wired" : "planned"}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border p-4">
          <SectionLabel>Canonical transaction schema</SectionLabel>
          <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-surface-raised p-3 font-mono text-[11px] leading-relaxed text-foreground/85">
            {`{
  "tx_hash": "string",
  "chain": "ethereum | tron | bitcoin | bnb | polygon | solana",
  "from_address": "string",
  "to_address": "string",
  "value": "float",
  "token": "native | ERC20-symbol | TRC20-symbol | null",
  "token_contract": "string | null",
  "timestamp": "ISO8601",
  "block_number": "int",
  "tx_type_raw": "transfer | contract_call | swap_event | bridge_lock | unknown",
  "gas_used": "float | null"
}`}
          </pre>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Every chain adapter emits exactly this shape. The graph engine, hop classifier and
            confidence model never see raw chain-specific responses — that is what keeps them
            chain-agnostic.
          </p>
        </div>
      </Panel>
    </div>
  );
}
