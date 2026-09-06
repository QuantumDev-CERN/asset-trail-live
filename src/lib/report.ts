// Plain-text investigation report. The certificate hash is computed over
// exactly this text, so what an officer reads is what is stamped.

import type { CaseRecord } from "@/lib/types";
import type { LiveCaseState } from "@/lib/live-case";
import { CHAIN_LABEL, formatDateTime, formatInr, HOP_CLASS_LABEL } from "@/lib/format";

function rule(char = "="): string {
  return char.repeat(78);
}

export function buildReportText(record: CaseRecord, live?: LiveCaseState): string {
  const L: string[] = [];
  L.push(rule());
  L.push("VASP ATTRIBUTION ENGINE — INVESTIGATION REPORT");
  L.push(rule());
  L.push("");
  L.push(`Case ID              : ${record.id}`);
  L.push(`FIR                  : ${record.firNumber}`);
  L.push(`Title                : ${record.title}`);
  L.push(`Investigating officer: ${record.officer}`);
  L.push(`Agency               : ${record.agency}`);
  L.push(`Chain                : ${CHAIN_LABEL[record.chain]}`);
  L.push(`Suspect address      : ${record.suspectAddress}`);
  L.push(`Declared amount      : ${formatInr(record.amountInr)}`);
  L.push(`Opened               : ${formatDateTime(record.openedAt)}`);
  L.push(`Report generated     : ${formatDateTime(record.cert.generatedAt)}`);
  L.push(`Statute              : ${record.cert.statute}`);
  L.push("");
  L.push("1. CASE SUMMARY");
  L.push(rule("-"));
  L.push(record.summary);
  L.push("");
  L.push("2. ATTRIBUTION RESULT");
  L.push(rule("-"));
  L.push(`Confidence score : ${record.confidence.score}/100 (${record.confidence.band})`);
  L.push(`Rationale        : ${record.confidence.reason}`);
  L.push(`Terminus type    : ${record.terminus.kind}`);
  L.push(`Terminus entity  : ${record.terminus.label}`);
  L.push(`Terminus address : ${record.terminus.address}`);
  L.push(record.terminus.statement);
  L.push("");
  L.push("3. CONFIDENCE BREAKDOWN");
  L.push(rule("-"));
  for (const b of record.confidence.breakdown) {
    L.push(`${b.adjustment > 0 ? "+" : ""}${b.adjustment}\t${b.signal}`);
    L.push(`\t${b.note}`);
  }
  L.push("");
  L.push("4. TRACE PATH — CLASSIFIED HOPS");
  L.push(rule("-"));
  record.edges.forEach((e, i) => {
    L.push(`Hop ${i + 1} — ${HOP_CLASS_LABEL[e.classification]} (${e.confidenceDelta > 0 ? "+" : ""}${e.confidenceDelta})`);
    L.push(`  From : ${e.tx.from_address}`);
    L.push(`  To   : ${e.tx.to_address}`);
    L.push(`  Tx   : ${e.tx.tx_hash}`);
    L.push(
      `  Value: ${e.tx.value > 0 ? `${e.tx.value.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${e.tx.token ?? "native"}` : "no linkage asserted"} @ ${formatDateTime(e.tx.timestamp)}`,
    );
    L.push(`  Evidence: ${e.evidence}`);
  });
  L.push("");
  L.push("5. RISK FLAGS");
  L.push(rule("-"));
  for (const f of record.riskFlags) {
    L.push(`[${f.severity.toUpperCase()}] ${f.title} — ${f.detail} (${f.source})`);
  }
  L.push("");
  L.push("6. PARALLEL ACTIONS");
  L.push(rule("-"));
  L.push(record.freezeRecommendation ?? "No stablecoin holdings detected — no issuer-level freeze path applies.");
  if (live?.freeze) {
    const f = live.freeze;
    L.push("");
    L.push(`Freeze reference : ${f.reference}`);
    L.push(`Asset            : ${f.standard} ${f.asset} (${f.issuer})`);
    L.push(`Target address   : ${f.address}`);
    L.push(`Amount           : ${f.amountToken} (declared exposure ${formatInr(f.amountInr)})`);
    L.push(`Requested at     : ${formatDateTime(f.requestedAt)}`);
    L.push(`Status           : ${f.status === "frozen" ? `FROZEN — confirmed ${formatDateTime(f.confirmedAt!)}` : "REQUESTED — awaiting issuer confirmation"}`);
  }
  L.push("");
  L.push("7. DISCLOSURE REQUEST");
  L.push(rule("-"));
  if (record.disclosure) {
    L.push(`VASP           : ${record.disclosure.vasp}`);
    L.push(`Jurisdiction   : ${record.disclosure.jurisdiction}`);
    L.push(`Instrument     : ${record.disclosure.instrument}`);
    L.push(`Travel Rule    : ${record.disclosure.travelRule}`);
    L.push(`FIU-IND        : ${record.disclosure.fiuRegistered ? "Registered reporting entity" : "Foreign — MLAT / Egmont channel"}`);
    L.push(`Contact        : ${record.disclosure.contact}`);
    L.push("");
    L.push(record.disclosure.body);
  } else {
    L.push("No legally-addressable custodial terminus — no disclosure request generated.");
  }
  L.push("");
  L.push("8. CASE TIMELINE");
  L.push(rule("-"));
  const timeline = [...record.timeline, ...(live?.events ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  for (const t of timeline) {
    L.push(`${formatDateTime(t.at)} [${t.phase}] ${t.title}`);
    L.push(`  ${t.detail} — ${t.actor}`);
  }
  L.push("");
  L.push("9. CROSS-CASE LINKS");
  L.push(rule("-"));
  L.push(record.linkedCases.length ? record.linkedCases.join(", ") : "None.");
  L.push("");
  L.push("10. SCOPE AND LIMITATIONS");
  L.push(rule("-"));
  for (const n of record.scopeNotes) L.push(`Tier ${n.tier}: ${n.note}`);
  L.push("");
  L.push(
    "Attribution identifies a custodial entity that can lawfully be asked for records. It does not identify a person, and it is not proof that any account holder committed an offence.",
  );
  L.push("");
  L.push(rule());
  L.push("END OF REPORT BODY — the certificate hash below covers everything above.");
  L.push(rule());
  return L.join("\n");
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildReportJson(record: CaseRecord, live: LiveCaseState | undefined, hash: string) {
  return JSON.stringify(
    {
      case: record,
      liveRun: live ?? null,
      certificate: { ...record.cert, contentHash: hash, algorithm: "SHA-256" },
    },
    null,
    2,
  );
}
