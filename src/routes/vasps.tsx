import { createFileRoute } from "@tanstack/react-router";
import {
  MIXER_CONTRACTS,
  OTC_HAWALA_REGISTRY,
  SWAP_SERVICES,
  VASP_DIRECTORY,
} from "@/lib/registry";
import { Chip, DisclosureNote, Panel, PanelHeader } from "@/components/ui/primitives";

export const Route = createFileRoute("/vasps")({
  head: () => ({
    meta: [
      { title: "VASP Directory & Registries — VASP Attribution Engine" },
      {
        name: "description",
        content:
          "FIU-IND registration status, FATF Travel Rule participation and applicable legal instrument for each custodial entity, plus mixer and OTC registries.",
      },
      { property: "og:title", content: "VASP Directory & Registries — VASP Attribution Engine" },
      {
        property: "og:description",
        content:
          "Routing directory of custodial entities with jurisdiction, Travel Rule status and legal instrument.",
      },
    ],
  }),
  component: VaspDirectoryPage,
});

const COOP_TONE = {
  confirmed: "success",
  responsive: "info",
  slow: "warning",
  untested: "muted",
} as const;

function VaspDirectoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">VASP directory &amp; registries</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Which legal channel applies depends on where a VASP is registered and whether it
          participates in a Travel Rule network. The routing engine reads these fields to pick the
          instrument for each disclosure request.
        </p>
      </div>

      <Panel>
        <PanelHeader
          title="Custodial entities"
          subtitle={`${VASP_DIRECTORY.length} entities across Ethereum and Tron`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Entity</th>
                <th className="px-4 py-2.5 font-medium">Jurisdiction</th>
                <th className="px-4 py-2.5 font-medium">FIU-IND</th>
                <th className="px-4 py-2.5 font-medium">Travel Rule</th>
                <th className="px-4 py-2.5 font-medium">Instrument</th>
                <th className="px-4 py-2.5 font-medium">SLA</th>
                <th className="px-4 py-2.5 font-medium">Cooperation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {VASP_DIRECTORY.map((v) => (
                <tr key={v.name} className="align-top">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold">{v.name}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {v.chains.join(" · ")}
                    </p>
                    <p className="mt-1 font-mono text-[10px] break-all text-muted-foreground">
                      {v.addresses[0]}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.jurisdiction}</td>
                  <td className="px-4 py-3">
                    <Chip tone={v.fiuRegistered ? "success" : "warning"}>
                      {v.fiuRegistered ? "Registered" : "Not registered"}
                    </Chip>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.travelRule}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.instrument}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{v.responseSla}</td>
                  <td className="px-4 py-3">
                    <Chip tone={COOP_TONE[v.cooperation]}>{v.cooperation}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel>
          <PanelHeader title="Mixer contracts" subtitle="Static list — proximity flagging only" />
          <ul className="divide-y divide-border">
            {MIXER_CONTRACTS.map((m) => (
              <li key={m.address} className="px-4 py-3">
                <p className="text-xs font-semibold">{m.name}</p>
                <p className="mt-1 font-mono text-[10.5px] break-all text-muted-foreground">
                  {m.address}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Non-KYC swap services" subtitle="Correlation by time + amount only" />
          <ul className="divide-y divide-border">
            {SWAP_SERVICES.map((s) => (
              <li key={s.address} className="px-4 py-3">
                <p className="text-xs font-semibold">{s.name}</p>
                <p className="mt-1 font-mono text-[10.5px] break-all text-muted-foreground">
                  {s.address}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader
            title="OTC / hawala registry"
            subtitle="Grows with every confirmed terminus"
          />
          <ul className="divide-y divide-border">
            {OTC_HAWALA_REGISTRY.map((o) => (
              <li key={o.address} className="px-4 py-3">
                <p className="font-mono text-[10.5px] break-all">{o.address}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{o.note}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  Confirmed in {o.confirmedCase}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <DisclosureNote title="Registry labels are attributions, not certainties">
        Public explorer tags and community datasets can be wrong or stale. A registry hit is
        corroborating evidence for a lead; it is not, on its own, a finding of fact about any entity
        named here.
      </DisclosureNote>
    </div>
  );
}
