import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCase } from "@/lib/case-store";
import {
  Button,
  Chip,
  DisclosureNote,
  Panel,
  PanelHeader,
  SectionLabel,
} from "@/components/ui/primitives";
import { bandTone, CHAIN_LABEL, formatDateTime, formatInr, HOP_CLASS_LABEL } from "@/lib/format";
import { useLiveCase } from "@/lib/live-case";
import { buildReportJson, buildReportText, downloadText, sha256Hex } from "@/lib/report";

export const Route = createFileRoute("/reports/$caseId")({
  head: () => ({
    meta: [
      { title: "Investigation Report — VASP Attribution Engine" },
      {
        name: "description",
        content:
          "Investigation-ready attribution report with confidence rationale, trace path and a SHA-256 evidentiary certificate computed over the report body.",
      },
      { property: "og:title", content: "Investigation Report — VASP Attribution Engine" },
      {
        property: "og:description",
        content:
          "Attribution report with confidence rationale and a SHA-256 evidentiary certificate.",
      },
    ],
  }),
  component: ReportView,
});

function ReportView() {
  const { caseId } = Route.useParams();
  const record = useCase(caseId);
  const live = useLiveCase(caseId);
  const [hash, setHash] = useState<string | null>(null);

  const reportText = record ? buildReportText(record, live) : "";

  useEffect(() => {
    let cancelled = false;
    if (!reportText) return;
    setHash(null);
    void sha256Hex(reportText).then((h) => {
      if (!cancelled) setHash(h);
    });
    return () => {
      cancelled = true;
    };
  }, [reportText]);

  if (!record) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-xl font-semibold">Case not in the register</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Intake-created cases live in the browser session only. If you reloaded the page, open a
          demonstrator case or submit a new intake.
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

  const filenameBase = `${record.id}-attribution-report`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionLabel>Investigation-ready report</SectionLabel>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{record.id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{record.firNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => downloadText(`${filenameBase}.txt`, reportText)} disabled={!hash}>
            Download report (.txt)
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadText(
                `${filenameBase}.json`,
                buildReportJson(record, live, hash ?? ""),
                "application/json",
              )
            }
            disabled={!hash}
          >
            Download evidence bundle (.json)
          </Button>
          <Link
            to="/cases/$caseId"
            params={{ caseId: record.id }}
            className="rounded-md border border-border-strong px-4 py-2 text-xs font-semibold hover:bg-accent"
          >
            Back to workspace
          </Link>
        </div>
      </div>

      <DisclosureNote title="Controlled demonstration data" tone="warning">
        This report is generated inside a demonstration console. The trace path, labels and freeze
        confirmation are simulated on prepared case data. The certificate hash below, however, is
        computed for real over the exact report text shown on this page.
      </DisclosureNote>

      <Panel>
        <PanelHeader title="Metadata" subtitle="report_generator.py" />
        <dl className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Item label="Engine" value="VASP Attribution Engine" />
          <Item label="Jurisdiction" value="FIU-IND / LEA Compliance" />
          <Item label="Generated at" value={formatDateTime(record.cert.generatedAt)} />
          <Item label="Case ID" value={record.id} mono />
          <Item label="Suspect address" value={record.suspectAddress} mono />
          <Item label="Chain" value={CHAIN_LABEL[record.chain]} />
          <Item label="Declared amount" value={formatInr(record.amountInr)} />
          <Item label="Officer" value={record.officer} />
        </dl>
      </Panel>

      <Panel>
        <PanelHeader
          title="Attribution result"
          right={<Chip tone={bandTone(record.confidence.band)}>{record.confidence.band}</Chip>}
        />
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <SectionLabel>Confidence score</SectionLabel>
              <p className="mt-1 font-mono text-4xl font-semibold">{record.confidence.score}</p>
            </div>
            <div className="min-w-56 flex-1">
              <SectionLabel>Nearest legally-addressable entity</SectionLabel>
              <p className="mt-1 text-sm font-semibold">{record.terminus.label}</p>
              <p className="font-mono text-[11px] break-all text-muted-foreground">
                {record.terminus.address}
              </p>
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface-raised px-3 py-2.5">
            <SectionLabel>Scoring rationale</SectionLabel>
            <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed">
              {record.confidence.reason}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-foreground/85">{record.terminus.statement}</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Trace path hops" subtitle={`${record.edges.length} classified hops`} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Classification</th>
                <th className="px-4 py-2.5 font-medium">From → To</th>
                <th className="px-4 py-2.5 font-medium">Value</th>
                <th className="px-4 py-2.5 font-medium">Timestamp</th>
                <th className="px-4 py-2.5 font-medium">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {record.edges.map((e, i) => (
                <tr key={e.id} className="align-top">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-primary">
                    {HOP_CLASS_LABEL[e.classification]}
                  </td>
                  <td className="max-w-72 px-4 py-2.5 font-mono text-[10.5px] break-all">
                    {e.tx.from_address}
                    <span className="text-muted-foreground"> → </span>
                    {e.tx.to_address}
                    <span className="mt-1 block text-[10px] break-all text-muted-foreground">
                      {e.tx.tx_hash}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono">
                    {e.tx.value > 0
                      ? `${e.tx.value.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${e.tx.token ?? ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {formatDateTime(e.tx.timestamp)}
                  </td>
                  <td
                    className="px-4 py-2.5 font-mono"
                    style={{
                      color: e.confidenceDelta >= 0 ? "var(--success)" : "var(--destructive)",
                    }}
                  >
                    {e.confidenceDelta > 0 ? "+" : ""}
                    {e.confidenceDelta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Intelligence links" subtitle="Syndicate cross-case matches" />
          <div className="p-4">
            {record.linkedCases.length ? (
              <ul className="space-y-1.5 font-mono text-xs">
                {record.linkedCases.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No cross-case matches.</p>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Parallel actions"
            subtitle="stablecoin issuer freeze"
            right={
              live.freeze ? (
                <Chip tone={live.freeze.status === "frozen" ? "success" : "warning"}>
                  {live.freeze.status === "frozen" ? "funds frozen" : "request sent"}
                </Chip>
              ) : null
            }
          />
          <div className="space-y-3 p-4">
            {record.freezeRecommendation ? (
              <DisclosureNote title="Parallel track, not a replacement">
                {record.freezeRecommendation}
              </DisclosureNote>
            ) : (
              <p className="text-xs text-muted-foreground">
                No stablecoin holdings detected at the terminal address — no issuer-level freeze
                path applies.
              </p>
            )}
            {live.freeze ? (
              <div className="rounded-md border border-success/40 bg-success/8 p-3 text-[11px] leading-relaxed">
                <p className="font-semibold">
                  {live.freeze.standard} {live.freeze.asset} · {live.freeze.amountToken}
                </p>
                <p className="mt-1 font-mono break-all text-muted-foreground">
                  {live.freeze.tx.tx_hash}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Reference {live.freeze.reference} to {live.freeze.issuer} ·{" "}
                  {live.freeze.status === "frozen"
                    ? `funds frozen ${formatDateTime(live.freeze.confirmedAt!)}`
                    : "awaiting issuer confirmation"}
                </p>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      {record.disclosure ? (
        <Panel>
          <PanelHeader
            title="Auto-drafted disclosure request"
            subtitle={`Routed to ${record.disclosure.vasp}`}
            right={
              <Chip tone={record.disclosure.fiuRegistered ? "success" : "warning"}>
                {record.disclosure.fiuRegistered ? "FIU-IND registered" : "Foreign — MLAT / Egmont"}
              </Chip>
            }
          />
          <div className="space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Item label="Jurisdiction" value={record.disclosure.jurisdiction} />
              <Item label="Legal instrument" value={record.disclosure.instrument} />
              <Item label="FATF Travel Rule" value={record.disclosure.travelRule} />
              <Item label="Compliance contact" value={record.disclosure.contact} mono />
            </div>
            <div className="rounded-md border border-border bg-surface-raised px-3 py-3">
              <SectionLabel>Draft body</SectionLabel>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">
                {record.disclosure.body}
              </p>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title="Report contents"
          subtitle="Exactly the bytes the certificate hash covers"
          right={
            <span className="font-mono text-[10px] text-muted-foreground">
              {reportText.length.toLocaleString("en-IN")} chars
            </span>
          }
        />
        <pre className="max-h-[28rem] overflow-auto bg-surface-raised p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/90">
          {reportText}
        </pre>
      </Panel>

      <Panel>
        <PanelHeader
          title="Evidentiary certificate"
          subtitle="cert_hash.py — tamper-evident stamp"
        />
        <div className="space-y-3 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Item label="Algorithm" value="SHA-256" mono />
            <Item label="Generated at" value={formatDateTime(record.cert.generatedAt)} />
            <Item label="Statute" value={record.cert.statute} />
          </div>
          <div className="rounded-md border border-primary/35 bg-primary/8 px-3 py-2.5">
            <SectionLabel className="text-primary">SHA-256 digest of report content</SectionLabel>
            <p className="mt-1.5 font-mono text-[11.5px] break-all text-foreground">
              {hash ?? "computing digest…"}
            </p>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Computed in the browser over the report text shown above. Run the trace or execute a
            freeze and the report body changes — so does this digest, which is the whole point of
            the certificate.
          </p>
        </div>
      </Panel>

      <DisclosureNote title="Read this report as a lead, not a verdict">
        Attribution identifies a custodial entity that can be lawfully asked for records. It does
        not identify a person, and it is not proof that any account holder committed an offence.
        Where a mixer appears on the path, no deterministic unmixing is claimed and nothing
        downstream is asserted as linkage.
      </DisclosureNote>
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <SectionLabel>{label}</SectionLabel>
      <p className={`mt-1 text-xs break-words ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
