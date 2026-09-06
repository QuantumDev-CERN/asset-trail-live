import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { caseById } from "@/data/cases";
import { Chip, DisclosureNote, Panel, PanelHeader, SectionLabel } from "@/components/ui/primitives";
import { bandTone, CHAIN_LABEL, formatDateTime, formatInr, HOP_CLASS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/reports/$caseId")({
  loader: ({ params }) => {
    const record = caseById(params.caseId);
    if (!record) throw notFound();
    return { record };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Report unavailable — VASP Attribution Engine" }, { name: "robots", content: "noindex" }] };
    }
    const t = `Investigation report ${loaderData.record.id}`;
    return {
      meta: [
        { title: `${t} | VASP Attribution Engine` },
        {
          name: "description",
          content: `Investigation-ready attribution report for ${loaderData.record.id} with confidence rationale and a hash-stamped evidentiary certificate.`,
        },
        { property: "og:title", content: t },
        {
          property: "og:description",
          content: "Investigation-ready attribution report with confidence rationale and evidentiary certificate.",
        },
      ],
    };
  },
  component: ReportView,
});

function ReportView() {
  const { record } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionLabel>Investigation-ready report</SectionLabel>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{record.id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{record.firNumber}</p>
        </div>
        <Link
          to="/cases/$caseId"
          params={{ caseId: record.id }}
          className="rounded-md border border-border-strong px-4 py-2 text-xs font-semibold hover:bg-accent"
        >
          Back to workspace
        </Link>
      </div>

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
              <p className="font-mono text-[11px] break-all text-muted-foreground">{record.terminus.address}</p>
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface-raised px-3 py-2.5">
            <SectionLabel>Scoring rationale</SectionLabel>
            <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed">{record.confidence.reason}</p>
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
                  <td className="px-4 py-2.5 font-mono text-primary">{HOP_CLASS_LABEL[e.classification]}</td>
                  <td className="max-w-72 px-4 py-2.5 font-mono text-[10.5px] break-all">
                    {e.tx.from_address}
                    <span className="text-muted-foreground"> → </span>
                    {e.tx.to_address}
                    <span className="mt-1 block text-[10px] break-all text-muted-foreground">{e.tx.tx_hash}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono">
                    {e.tx.value > 0 ? `${e.tx.value.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${e.tx.token ?? ""}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDateTime(e.tx.timestamp)}</td>
                  <td
                    className="px-4 py-2.5 font-mono"
                    style={{ color: e.confidenceDelta >= 0 ? "var(--success)" : "var(--destructive)" }}
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
          <PanelHeader title="Parallel actions" subtitle="stablecoin issuer freeze" />
          <div className="p-4">
            {record.freezeRecommendation ? (
              <DisclosureNote title="Parallel track, not a replacement">{record.freezeRecommendation}</DisclosureNote>
            ) : (
              <p className="text-xs text-muted-foreground">
                No stablecoin holdings detected at the terminal address — no issuer-level freeze path applies.
              </p>
            )}
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
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">{record.disclosure.body}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Draft only. It requires officer sign-off before it leaves the console, and the audit trail records who
              sent it.
            </p>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title="Evidentiary certificate" subtitle="cert_hash.py — tamper-evident stamp" />
        <div className="space-y-3 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Item label="Algorithm" value={record.cert.algorithm} mono />
            <Item label="Generated at" value={formatDateTime(record.cert.generatedAt)} />
            <Item label="Statute" value={record.cert.statute} />
          </div>
          <div className="rounded-md border border-primary/35 bg-primary/8 px-3 py-2.5">
            <SectionLabel className="text-primary">SHA-256 digest of report content</SectionLabel>
            <p className="mt-1.5 font-mono text-[11.5px] break-all text-foreground">{record.cert.hash}</p>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Any change to the report content changes this digest, which is what makes the certificate meaningful.
            The hash covers the report body above, not this rendering.
          </p>
        </div>
      </Panel>

      <DisclosureNote title="Read this report as a lead, not a verdict">
        Attribution identifies a custodial entity that can be lawfully asked for records. It does not identify a
        person, and it is not proof that any account holder committed an offence.
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
