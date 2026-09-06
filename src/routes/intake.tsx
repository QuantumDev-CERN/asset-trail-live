import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { submitSahyogIntake, type SahyogIntakeResponse, type ApiMode, API_BASE_URL } from "@/lib/api";
import { CASES, SCENARIOS } from "@/data/cases";
import { Button, Chip, DisclosureNote, Panel, PanelHeader, SectionLabel } from "@/components/ui/primitives";
import { CHAIN_LABEL } from "@/lib/format";
import type { Chain, ScenarioKey } from "@/lib/types";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Case Intake & SAHYOG Stub — VASP Attribution Engine" },
      {
        name: "description",
        content:
          "Submit a suspect wallet for tracing and receive a simulated SAHYOG job receipt, or load one of five prepared forensic simulation flows.",
      },
      { property: "og:title", content: "Case Intake & SAHYOG Stub — VASP Attribution Engine" },
      {
        property: "og:description",
        content: "Submit a suspect wallet for attribution tracing through the simulated SAHYOG intake channel.",
      },
    ],
  }),
  component: IntakePage,
});

const CHAINS: Chain[] = ["ethereum", "tron", "bitcoin", "bnb", "polygon", "solana"];
const LIVE_CHAINS: Chain[] = ["ethereum", "tron"];

const intakeSchema = z.object({
  fir_number: z.string().trim().min(3, "Enter the FIR reference").max(80, "FIR reference is too long"),
  suspect_address: z
    .string()
    .trim()
    .min(20, "Enter a full wallet address")
    .max(120, "Address is too long")
    .regex(/^[a-zA-Z0-9]+$/, "Addresses contain letters and digits only"),
  chain: z.enum(["ethereum", "tron", "bitcoin", "bnb", "polygon", "solana"]),
  complainant_agency: z.string().trim().min(3, "Enter the submitting agency").max(120, "Agency name is too long"),
});

function IntakePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fir_number: "",
    suspect_address: "",
    chain: "ethereum" as Chain,
    complainant_agency: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<{ data: SahyogIntakeResponse; mode: ApiMode; note?: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = intakeSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    const result = await submitSahyogIntake(parsed.data);
    setReceipt(result);
    setPending(false);
  }

  function loadScenario(key: ScenarioKey) {
    const record = CASES.find((c) => c.scenario === key);
    if (!record) return;
    setForm({
      fir_number: record.id,
      suspect_address: record.suspectAddress,
      chain: record.chain,
      complainant_agency: record.agency,
    });
    setErrors({});
    setReceipt(null);
  }

  const matchedCase = CASES.find((c) => c.suspectAddress.toLowerCase() === form.suspect_address.trim().toLowerCase());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Case intake</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Submissions follow an async job model: the case is registered, a job ID comes back immediately, and results
          are pushed as the trace resolves — answers on a watchlisted wallet can arrive days later.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <PanelHeader
            title="Submit a suspect wallet"
            subtitle="Fields match the backend SahyogIntakeRequest model"
            right={<Chip tone={API_BASE_URL ? "success" : "muted"} mono>{API_BASE_URL ? "live host set" : "stub mode"}</Chip>}
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
                      <span className="ml-1.5 font-mono text-[10px] opacity-70">{live ? "live" : "adapter only"}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Ethereum and Tron pull live chain data. The other four implement the same normalisation contract but
                are not wired to live APIs in this build.
              </p>
            </div>
            <TextField
              label="Complainant agency"
              value={form.complainant_agency}
              placeholder="Karnataka State Police — CID Cyber Crime"
              error={errors["complainant_agency"]}
              onChange={(v) => setForm((f) => ({ ...f, complainant_agency: v }))}
            />

            {matchedCase ? (
              <div className="rounded-md border border-info/40 bg-info/8 px-3 py-2.5">
                <p className="text-[11px] font-bold tracking-[0.1em] text-info uppercase">Cross-case match</p>
                <p className="mt-1 text-xs">
                  This address already appears in <span className="font-mono">{matchedCase.id}</span> — {matchedCase.title}.
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Registering…" : "Submit to SAHYOG intake"}
              </Button>
              {matchedCase ? (
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/cases/$caseId", params: { caseId: matchedCase.id } })}
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
                right={<Chip tone={receipt.mode === "live" ? "success" : "warning"}>{receipt.mode}</Chip>}
              />
              <div className="space-y-3 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <SectionLabel>Job ID</SectionLabel>
                    <p className="mt-1 font-mono text-lg font-semibold text-primary">{receipt.data.job_id}</p>
                  </div>
                  <div>
                    <SectionLabel>Status</SectionLabel>
                    <p className="mt-1 font-mono text-sm">{receipt.data.status}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed">{receipt.data.message}</p>
                <DisclosureNote title="Integration stub" tone="warning">
                  {receipt.data.disclaimer}
                  {receipt.note ? <span className="mt-1 block text-[11px] opacity-80">{receipt.note}</span> : null}
                </DisclosureNote>
              </div>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader
              title="Forensic simulation flows"
              subtitle="Load a prepared case straight into the form"
            />
            <ul className="divide-y divide-border">
              {SCENARIOS.map((s) => (
                <li key={s.key} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold">{s.name}</p>
                      <Chip tone={s.tier === 1 ? "success" : "warning"}>Tier {s.tier}</Chip>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{s.blurb}</p>
                  </div>
                  <Button variant="outline" onClick={() => loadScenario(s.key)}>
                    Load
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>

          <DisclosureNote title="Authorised use only" tone="destructive">
            Intake is restricted to case-scoped investigators. Every submission and every query made against an
            address is written to the audit trail with the submitting officer's identity.
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
  error?: string;
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
