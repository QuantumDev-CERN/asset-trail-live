// Integration layer for the FastAPI backend (QuantumDev-CERN/VASP-Attribution-Engine).
//
// The console runs fully on the bundled demo corpus by default so it is
// demonstrable without the backend running. Point VITE_VASP_API_URL at the
// FastAPI host (e.g. http://localhost:8000) and the same calls hit live
// endpoints instead. Every response shape below mirrors the backend exactly.

export const API_BASE_URL: string =
  (import.meta.env["VITE_VASP_API_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export const API_ENDPOINTS = [
  { method: "GET", path: "/health", purpose: "Liveness probe for the engine host", wired: true },
  { method: "GET", path: "/api/report/demo", purpose: "Compiled investigation report + BSA s.63 evidentiary certificate", wired: true },
  { method: "POST", path: "/sahyog/intake", purpose: "Simulated SAHYOG case intake — returns a job ID", wired: true },
  { method: "POST", path: "/api/trace", purpose: "Trace a suspect address to its nearest VASP (planned)", wired: false },
  { method: "GET", path: "/api/case/{case_id}", purpose: "Persisted case + graph payload (planned)", wired: false },
  { method: "GET", path: "/api/registry/vasps", purpose: "VASP directory with FIU-IND and Travel Rule fields (planned)", wired: false },
] as const;

export interface SahyogIntakeRequest {
  fir_number: string;
  suspect_address: string;
  chain: string;
  complainant_agency: string;
}

export interface SahyogIntakeResponse {
  status: string;
  job_id: string;
  message: string;
  disclaimer: string;
}

export type ApiMode = "live" | "simulated";

export interface ApiResult<T> {
  data: T;
  mode: ApiMode;
  note?: string;
}

async function tryFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE_URL) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function checkHealth(): Promise<{ reachable: boolean; base: string }> {
  const data = await tryFetch<{ status: string }>("/health");
  return { reachable: data?.status === "ok", base: API_BASE_URL };
}

function simulatedJobId(): string {
  const hex = Array.from({ length: 8 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
  return `JOB-${hex}`;
}

export async function submitSahyogIntake(
  payload: SahyogIntakeRequest,
): Promise<ApiResult<SahyogIntakeResponse>> {
  const live = await tryFetch<SahyogIntakeResponse>("/sahyog/intake", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (live) return { data: live, mode: "live" };

  return {
    mode: "simulated",
    note: API_BASE_URL
      ? "Engine host did not respond — showing the simulated intake receipt."
      : "No engine host configured — showing the simulated intake receipt.",
    data: {
      status: "success",
      job_id: simulatedJobId(),
      message: `Case ${payload.fir_number} intake registered for address ${payload.suspect_address}.`,
      disclaimer:
        "INTEGRATION STUB: This is a simulated SAHYOG return receipt. Not a live production connection.",
    },
  };
}
