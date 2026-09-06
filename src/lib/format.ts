import type { Chain, ConfidenceBand, HopClass, NodeKind } from "./types";

export function shortAddress(address: string, head = 8, tail = 6): string {
  if (address.length <= head + tail + 3) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function relativeTime(iso: string, now = new Date("2026-09-05T14:00:00Z")): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export const CHAIN_LABEL: Record<Chain, string> = {
  ethereum: "Ethereum",
  tron: "Tron",
  bitcoin: "Bitcoin",
  bnb: "BNB Chain",
  polygon: "Polygon",
  solana: "Solana",
};

export const CHAIN_TICKER: Record<Chain, string> = {
  ethereum: "ETH",
  tron: "TRX",
  bitcoin: "BTC",
  bnb: "BNB",
  polygon: "POL",
  solana: "SOL",
};

export const NODE_KIND_LABEL: Record<NodeKind, string> = {
  suspect: "Suspect wallet",
  intermediary: "Intermediary",
  "sweep-forwarder": "Sweep forwarder",
  "deposit-address": "Deposit address",
  mixer: "Mixer contract",
  bridge: "Bridge contract",
  "swap-service": "Non-KYC swap service",
  exchange: "VASP / exchange",
  "otc-hawala": "OTC / hawala terminus",
  unresolved: "Unresolved",
};

/** Maps a node kind to its design-token colour variable name. */
export function nodeColorVar(kind: NodeKind): string {
  switch (kind) {
    case "suspect":
      return "var(--node-suspect)";
    case "mixer":
      return "var(--node-mixer)";
    case "bridge":
      return "var(--node-bridge)";
    case "exchange":
      return "var(--node-exchange)";
    case "otc-hawala":
      return "var(--node-otc)";
    case "swap-service":
      return "var(--node-otc)";
    case "unresolved":
      return "var(--node-unresolved)";
    default:
      return "var(--node-intermediary)";
  }
}

export const HOP_CLASS_LABEL: Record<HopClass, string> = {
  "direct-transfer": "direct-transfer",
  peel: "peel",
  "dex-swap": "dex-swap",
  "bridge-lock": "bridge-lock",
  "swap-service": "swap-service",
  "mixer-deposit": "mixer-deposit",
  "sweep-candidate": "sweep-candidate",
};

export function bandTone(band: ConfidenceBand): "success" | "warning" | "destructive" | "muted" {
  if (band === "High") return "success";
  if (band === "Medium") return "warning";
  if (band === "Flagged-Mixer") return "destructive";
  return "muted";
}
