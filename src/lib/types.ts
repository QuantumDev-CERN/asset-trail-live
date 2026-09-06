// Canonical types mirroring the backend pydantic schema (backend/api/schemas.py)
// plus the engine outputs described in phases.md §2 / master reference §4.

export type Chain = "ethereum" | "tron" | "bitcoin" | "bnb" | "polygon" | "solana";

export type TxTypeRaw = "transfer" | "contract_call" | "swap_event" | "bridge_lock" | "unknown";

/** hop_classifier.py edge tags */
export type HopClass =
  | "direct-transfer"
  | "peel"
  | "dex-swap"
  | "bridge-lock"
  | "swap-service"
  | "mixer-deposit"
  | "sweep-candidate";

export type NodeKind =
  | "suspect"
  | "intermediary"
  | "sweep-forwarder"
  | "deposit-address"
  | "mixer"
  | "bridge"
  | "swap-service"
  | "exchange"
  | "otc-hawala"
  | "unresolved";

export type ConfidenceBand = "High" | "Medium" | "Low" | "Flagged-Mixer";

export type ScenarioKey =
  | "exchange-inflow"
  | "mixer-detection"
  | "tumbler-routing"
  | "advanced-typologies"
  | "dead-end";

export type Tier = 1 | 2 | 3;

export interface NormalizedTransaction {
  tx_hash: string;
  chain: Chain;
  from_address: string;
  to_address: string;
  value: number;
  token: string | null;
  token_contract: string | null;
  timestamp: string;
  block_number: number;
  tx_type_raw: TxTypeRaw;
  gas_used: number | null;
}

export interface GraphNode {
  id: string;
  address: string;
  chain: Chain;
  kind: NodeKind;
  /** Registry label from vasp_labels.json / mixer_contracts.json / swap_services.json */
  label?: string;
  labelSource?: string;
  hop: number;
  /** Vertical lane within the hop column, for deterministic layout */
  lane: number;
  riskScore: number;
  balance?: string;
  firstSeen?: string;
  lastSeen?: string;
  txCount?: number;
  fiuRegistered?: boolean;
  jurisdiction?: string;
  travelRule?: string;
  legalInstrument?: string;
  complianceContact?: string;
  notes?: string;
  tags?: string[];
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  classification: HopClass;
  tx: NormalizedTransaction;
  /** confidence_scoring.py adjustment attributable to this hop */
  confidenceDelta: number;
  evidence: string;
  correlation?: "calldata" | "time+amount" | "none";
}

export interface ConfidenceBreakdown {
  signal: string;
  adjustment: number;
  note: string;
}

export interface RiskFlag {
  id: string;
  severity: "critical" | "high" | "medium" | "info";
  title: string;
  detail: string;
  source: string;
}

export interface TimelineEvent {
  at: string;
  actor: string;
  phase: string;
  title: string;
  detail: string;
}

export interface AlertItem {
  id: string;
  caseId: string;
  at: string;
  severity: "critical" | "high" | "medium" | "info";
  address: string;
  chain: Chain;
  title: string;
  detail: string;
  tier: Tier;
}

export interface DisclosureDraft {
  vasp: string;
  jurisdiction: string;
  instrument: string;
  travelRule: string;
  fiuRegistered: boolean;
  contact: string;
  body: string;
}

export interface CaseRecord {
  id: string;
  /** "demonstrator" = prepared demo case; "intake" = created live in the console */
  origin?: "demonstrator" | "intake";
  /** For intake-created cases: which demonstrator typology the trace replays */
  templateScenario?: ScenarioKey;
  templateCaseId?: string;
  jobId?: string;
  firNumber: string;
  title: string;
  scenario: ScenarioKey;
  chain: Chain;
  suspectAddress: string;
  agency: string;
  officer: string;
  status: "open" | "watchlisted" | "attributed" | "escalated" | "unresolved";
  openedAt: string;
  updatedAt: string;
  amountInr: number;
  summary: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  confidence: {
    score: number;
    band: ConfidenceBand;
    reason: string;
    breakdown: ConfidenceBreakdown[];
  };
  terminus: {
    kind: "vasp" | "mixer" | "otc-hawala" | "unresolved";
    label: string;
    address: string;
    statement: string;
  };
  riskFlags: RiskFlag[];
  linkedCases: string[];
  freezeRecommendation: string | null;
  timeline: TimelineEvent[];
  disclosure: DisclosureDraft | null;
  scopeNotes: { tier: Tier; note: string }[];
  cert: { hash: string; algorithm: string; generatedAt: string; statute: string };
}
