import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  checkHealth,
  submitSahyogIntake,
  type SahyogIntakeResponse,
  type ApiMode,
  API_BASE_URL,
} from "@/lib/api";

import { SCENARIOS } from "@/data/cases";
import { createInvestigation, useCases } from "@/lib/case-store";
import { startTrace } from "@/lib/live-case";
import {
  Button,
  Chip,
  DisclosureNote,
  Panel,
  PanelHeader,
  SectionLabel,
} from "@/components/ui/primitives";
import { CHAIN_LABEL } from "@/lib/format";
import type { Chain, ScenarioKey } from "@/lib/types";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Case Intake — VASP Attribution Engine" },
      {
        name: "description",
        content:
          "Open a tracked investigation from a suspect wallet address and replay it against a prepared laundering typology in the demonstration console.",
      },
      { property: "og:title", content: "Case Intake — VASP Attribution Engine" },
      {
        property: "og:description",
        content:
          "Open a tracked investigation from a suspect wallet address in the attribution console.",
      },
    ],
  }),
  component: IntakePage,
});

const CHAINS: Chain[] = ["ethereum", "tron", "bitcoin", "bnb", "polygon", "solana"];
const LIVE_CHAINS: Chain[] = ["ethereum", "tron"];

const intakeSchema = z.object({
  fir_number: z
    .string()
    .trim()
    .min(3, "Enter the FIR reference")
    .max(80, "FIR reference is too long"),
  suspect_address: z
    .string()
    .trim()
    .min(20, "Enter a full wallet address")
    .max(120, "Address is too long")
    .regex(/^[a-zA-Z0-9]+$/, "Addresses contain letters and digits only"),
  chain: z.enum(["ethereum", "tron", "bitcoin", "bnb", "polygon", "solana"]),
  complainant_agency: z
    .string()
    .trim()
    .min(3, "Enter the submitting agency")
    .max(120, "Agency name is too long"),
  officer: z.string().trim().min(3, "Enter the investigating officer").max(80, "Name is too long"),
  amount: z
    .string()
    .trim()
    .regex(/^[0-9]{1,12}$/, "Enter the declared amount in rupees, digits only"),
});

type IntakeMode = "replay" | "live";
type HostState = "unset" | "checking" | "up" | "down";

function IntakePage() {
  const navigate = useNavigate();
  const cases = useCases();
  const [form, setForm] = useState({
    fir_number: "",
    suspect_address: "",
    chain: "ethereum" as Chain,
    complainant_agency: "",
    officer: "",
    amount: "",
  });
  const [template, setTemplate] = useState<ScenarioKey | null>(null);
  const [mode, setMode] = useState<IntakeMode>("replay");
  const [host, setHost] = useState<HostState>(API_BASE_URL ? "checking" : "unset");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<{
    data: SahyogIntakeResponse;
    mode: ApiMode;
    note?: string;
  } | null>(null);

  useEffect(() => {
    if (!API_BASE_URL) return;
    let cancelled = false;
    void checkHealth().then((r) => {
      if (!cancelled) setHost(r.reachable ? "up" : "down");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const liveAvailable = host === "up";

  /** Selecting a replay fills in that scenario's real wallet address and chain. */
  function selectTemplate(key: ScenarioKey) {
    setTemplate(key);
    const source = cases.find((c) => c.origin !== "intake" && c.scenario === key);
    if (source) {
      setForm((f) => ({ ...f, suspect_address: source.suspectAddress, chain: source.chain }));
      setErrors((e) => {
        const next = { ...e };
        delete next["suspect_address"];
        return next;
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "replay" && !template) {
      setErrors({ template: "Pick a controlled replay to run" });
      return;
    }
    if (mode === "live" && !liveAvailable) {
      setErrors({ template: "No engine host is reachable — a live trace cannot be run" });
      return;
    }
    const parsed = intakeSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    const result = await submitSahyogIntake({
      fir_number: parsed.data.fir_number,
      suspect_address: parsed.data.suspect_address,
      chain: parsed.data.chain,
      complainant_agency: parsed.data.complainant_agency,
    });
    setReceipt(result);

    if (mode === "live") {
      // The engine host accepts the address, but this build has no trace
      // endpoint to return a graph from. Nothing is fabricated here.
      setPending(false);
      return;
    }

    const record = createInvestigation({
      fir_number: parsed.data.fir_number,
      suspect_address: parsed.data.suspect_address,
      chain: parsed.data.chain,
      complainant_agency: parsed.data.complainant_agency,
      officer: parsed.data.officer,
      amountInr: Number(parsed.data.amount),
      template: template!,
      jobId: result.data.job_id,
    });
    startTrace(record, result.data.job_id);
    setPending(false);
    void navigate({ to: "/cases/$caseId", params: { caseId: record.id } });
  }

  const matchedCase = cases.find(
    (c) => c.suspectAddress.toLowerCase() === form.suspect_address.trim().toLowerCase(),
  );


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Case intake</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Submitting a wallet opens a tracked investigation in this console: the case is registered,
          a job ID comes back, and the trace starts running hop by hop on the case workspace.
        </p>
      </div>

      <DisclosureNote title="Controlled demonstration" tone="warning">
        This console runs on prepared case data. An intake submission creates a real, trackable case
        record here, but the hop sequence it resolves is replayed from the laundering typology you
        select below — it is a simulation, not a live chain pull against the address you type.
      </DisclosureNote>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <PanelHeader
            title="Open an investigation"
            subtitle="Fields match the backend SahyogIntakeRequest model"
            right={
              <Chip tone={API_BASE_URL ? "success" : "muted"} mono>
                {API_BASE_URL ? "live host set" : "stub mode"}
              </Chip>
            }
          />
          <form onSubmit={onSubmit} className="space-y-4 p-4">
            <TextField
              label="FIR number"
              value={form.fir_number}
              placeholder="FIR 0114/2026, Cyber PS Bengaluru South"
              error={errors["fir_number"]}
              onChange={(v) => setForm((f) => ({ ...f, fir_number: v }))}
            />
            <TextField
              label="Suspect wallet address"
              value={form.suspect_address}
              placeholder="0x… or T… or bc1…"
              mono
              error={errors["suspect_address"]}
              onChange={(v) => setForm((f) => ({ ...f, suspect_address: v }))}
            />
            <div>
              <SectionLabel>Chain</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {CHAINS.map((c) => {
                  const live = LIVE_CHAINS.includes(c);
                  const active = form.chain === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, chain: c }))}
                      className={
                        active
                          ? "rounded-md border border-primary/50 bg-primary/12 px-3 py-1.5 text-xs font-semibold text-primary"
                          : "rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
                      }
                    >
                      {CHAIN_LABEL[c]}
                      <span className="ml-1.5 font-mono text-[10px] opacity-70">
                        {live ? "adapter live" : "adapter only"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                The Ethereum and Tron adapters are wired to live chain APIs in the engine. The other
                four implement the same normalisation contract but are not wired in this build.
              </p>
            </div>
            <TextField
              label="Complainant agency"
              value={form.complainant_agency}
              placeholder="Karnataka State Police — CID Cyber Crime"
              error={errors["complainant_agency"]}
              onChange={(v) => setForm((f) => ({ ...f, complainant_agency: v }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Investigating officer"
                value={form.officer}
                placeholder="Insp. R. Nagaraj"
                error={errors["officer"]}
                onChange={(v) => setForm((f) => ({ ...f, officer: v }))}
              />
              <TextField
                label="Declared amount (INR)"
                value={form.amount}
                placeholder="2140000"
                mono
                error={errors["amount"]}
                onChange={(v) => setForm((f) => ({ ...f, amount: v.replace(/[^0-9]/g, "") }))}
              />
            </div>

            <div>
              <SectionLabel>Typology to replay</SectionLabel>
              <div className="mt-2 grid gap-2">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setTemplate(s.key)}
                    className={`rounded-md border px-3 py-2 text-left transition-colors ${
                      template === s.key
                        ? "border-primary/50 bg-primary/10"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold">{s.name}</span>
                      <Chip tone={s.tier === 1 ? "success" : "warning"}>Tier {s.tier}</Chip>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {s.blurb}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {matchedCase ? (
              <div className="rounded-md border border-info/40 bg-info/8 px-3 py-2.5">
                <p className="text-[11px] font-bold tracking-[0.1em] text-info uppercase">
                  Cross-case match
                </p>
                <p className="mt-1 text-xs">
                  This address already appears in{" "}
                  <span className="font-mono">{matchedCase.id}</span> — {matchedCase.title}. The new
                  case will be linked to it.
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Registering…" : "Register case and run trace"}
              </Button>
              {matchedCase ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate({ to: "/cases/$caseId", params: { caseId: matchedCase.id } })
                  }
                >
                  Open the existing case
                </Button>
              ) : null}
            </div>
          </form>
        </Panel>

        <div className="space-y-6">
          {receipt ? (
            <Panel>
              <PanelHeader
                title="Intake receipt"
                subtitle="Response from POST /sahyog/intake"
                right={
                  <Chip tone={receipt.mode === "live" ? "success" : "warning"}>{receipt.mode}</Chip>
                }
              />
              <div className="space-y-3 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <SectionLabel>Job ID</SectionLabel>
                    <p className="mt-1 font-mono text-lg font-semibold text-primary">
                      {receipt.data.job_id}
                    </p>
                  </div>
                  <div>
                    <SectionLabel>Status</SectionLabel>
                    <p className="mt-1 font-mono text-sm">{receipt.data.status}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed">{receipt.data.message}</p>
                <DisclosureNote title="Integration stub" tone="warning">
                  {receipt.data.disclaimer}
                  {receipt.note ? (
                    <span className="mt-1 block text-[11px] opacity-80">{receipt.note}</span>
                  ) : null}
                </DisclosureNote>
              </div>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader
              title="Demonstrator cases"
              subtitle="Prepared worked cases — open one directly, no intake needed"
            />
            <ul className="divide-y divide-border">
              {SCENARIOS.map((s) => {
                const record = cases.find((c) => c.origin !== "intake" && c.scenario === s.key);
                return (
                  <li
                    key={s.key}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold">{s.name}</p>
                        <Chip tone={s.tier === 1 ? "success" : "warning"}>Tier {s.tier}</Chip>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {s.blurb}
                      </p>
                    </div>
                    {record ? (
                      <Link
                        to="/cases/$caseId"
                        params={{ caseId: record.id }}
                        className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-semibold hover:bg-accent"
                      >
                        Open case
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <DisclosureNote title="Authorised use only" tone="destructive">
            Intake is restricted to case-scoped investigators. Every submission and every query made
            against an address is written to the audit trail with the submitting officer's identity.
          </DisclosureNote>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={120}
        className={`mt-1.5 w-full rounded-md border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary ${
          error ? "border-destructive" : "border-border-strong"
        } ${mono ? "font-mono text-[12.5px]" : ""}`}
      />
      {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
