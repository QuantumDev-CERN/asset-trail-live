import { useMemo, useState } from "react";
import type { CaseRecord, GraphEdge, GraphNode } from "@/lib/types";
import {
  CHAIN_TICKER,
  HOP_CLASS_LABEL,
  NODE_KIND_LABEL,
  nodeColorVar,
  shortAddress,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const COL = 250;
const ROW = 132;
const NODE_W = 186;
const NODE_H = 74;
const PAD_X = 44;
const PAD_Y = 56;

const DASHED: Record<string, boolean> = {
  "mixer-deposit": true,
  "swap-service": true,
  peel: true,
};

function edgeStroke(e: GraphEdge): string {
  if (e.classification === "mixer-deposit") return "var(--node-mixer)";
  if (e.classification === "bridge-lock") return "var(--node-bridge)";
  if (e.classification === "sweep-candidate") return "var(--node-exchange)";
  if (e.classification === "swap-service") return "var(--node-otc)";
  if (e.classification === "dex-swap") return "var(--node-bridge)";
  if (e.classification === "peel") return "var(--node-unresolved)";
  return "var(--node-intermediary)";
}

export function FlowGraph({
  record,
  selectedId,
  onSelectNode,
  onSelectEdge,
  revealedHops,
}: {
  record: CaseRecord;
  selectedId: string | null;
  onSelectNode: (node: GraphNode) => void;
  onSelectEdge: (edge: GraphEdge) => void;
  /** During a live trace run, only the first N hops are resolved. */
  revealedHops?: number | undefined;
}) {
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const limit = revealedHops ?? record.edges.length;
  const resolvedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of record.nodes.filter((x) => x.hop === 0)) ids.add(n.id);
    record.edges.slice(0, limit).forEach((e) => {
      ids.add(e.from);
      ids.add(e.to);
    });
    return ids;
  }, [record, limit]);

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const n of record.nodes) {
      map.set(n.id, { x: PAD_X + n.hop * COL, y: PAD_Y + n.lane * ROW });
    }
    return map;
  }, [record]);

  const maxHop = Math.max(...record.nodes.map((n) => n.hop));
  const maxLane = Math.max(...record.nodes.map((n) => n.lane));
  const width = PAD_X * 2 + maxHop * COL + NODE_W;
  const height = PAD_Y * 2 + maxLane * ROW + NODE_H;

  return (
    <div className="grid-backdrop relative overflow-x-auto overflow-y-hidden">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block min-w-full"
        role="img"
        aria-label={`Fund-flow graph for case ${record.id}`}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {record.edges.map((e, ei) => {
          const pending = ei >= limit;
          const a = positions.get(e.from);
          const b = positions.get(e.to);
          if (!a || !b) return null;
          const x1 = a.x + NODE_W;
          const y1 = a.y + NODE_H / 2;
          const x2 = b.x;
          const y2 = b.y + NODE_H / 2;
          const mx = (x1 + x2) / 2;
          const active = hoverEdge === e.id;
          const stroke = edgeStroke(e);
          return (
            <g
              key={e.id}
              style={{ color: stroke, opacity: pending ? 0.12 : 1 }}
              className="cursor-pointer transition-opacity duration-500"
              onMouseEnter={() => setHoverEdge(e.id)}
              onMouseLeave={() => setHoverEdge(null)}
              onClick={() => onSelectEdge(e)}
            >
              <path
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 10} ${y2}`}
                fill="none"
                stroke={stroke}
                strokeWidth={active ? 2.6 : 1.6}
                strokeDasharray={DASHED[e.classification] ? "6 5" : undefined}
                markerEnd="url(#arrow)"
                opacity={active ? 1 : 0.75}
              />
              <rect
                x={mx - 62}
                y={(y1 + y2) / 2 - 25}
                width={124}
                height={19}
                rx={9}
                fill="var(--surface-raised)"
                stroke={stroke}
                strokeOpacity={0.5}
              />
              <text
                x={mx}
                y={(y1 + y2) / 2 - 11.5}
                textAnchor="middle"
                fill={stroke}
                className="font-mono"
                fontSize={10}
              >
                {HOP_CLASS_LABEL[e.classification]}
              </text>
              <text
                x={mx}
                y={(y1 + y2) / 2 + 20}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                className="font-mono"
                fontSize={10}
              >
                {e.tx.value > 0
                  ? `${e.tx.value.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${e.tx.token === "native" ? CHAIN_TICKER[e.tx.chain] : (e.tx.token ?? CHAIN_TICKER[e.tx.chain])}`
                  : "no linkage asserted"}
              </text>
            </g>
          );
        })}

        {record.nodes.map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          const color = nodeColorVar(n.kind);
          const selected = selectedId === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${p.x}, ${p.y})`}
              style={{ opacity: resolvedNodeIds.has(n.id) ? 1 : 0.14 }}
              className="cursor-pointer transition-opacity duration-500"
              onClick={() => onSelectNode(n)}
              tabIndex={0}
              role="button"
              aria-label={`${NODE_KIND_LABEL[n.kind]} ${n.address}`}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") onSelectNode(n);
              }}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill="var(--surface-raised)"
                stroke={selected ? color : "var(--border-strong)"}
                strokeWidth={selected ? 2.2 : 1}
              />
              <rect width={4} height={NODE_H} rx={2} fill={color} />
              <text
                x={16}
                y={22}
                fill={color}
                fontSize={10}
                className="font-mono"
                letterSpacing={0.6}
              >
                {NODE_KIND_LABEL[n.kind].toUpperCase()}
              </text>
              <text x={16} y={41} fill="var(--foreground)" fontSize={12} className="font-mono">
                {shortAddress(n.address, 10, 6)}
              </text>
              <text x={16} y={59} fill="var(--muted-foreground)" fontSize={10}>
                {n.label ?? `hop ${n.hop} · ${CHAIN_TICKER[n.chain]}`}
              </text>
              {n.riskScore > 0 ? (
                <>
                  <rect
                    x={NODE_W - 42}
                    y={48}
                    width={30}
                    height={14}
                    rx={7}
                    fill={color}
                    fillOpacity={0.16}
                  />
                  <text
                    x={NODE_W - 27}
                    y={58}
                    textAnchor="middle"
                    fill={color}
                    fontSize={9}
                    className="font-mono"
                  >
                    r{n.riskScore}
                  </text>
                </>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function GraphLegend({ className }: { className?: string }) {
  const items: { label: string; color: string }[] = [
    { label: "Suspect", color: "var(--node-suspect)" },
    { label: "Intermediary", color: "var(--node-intermediary)" },
    { label: "Mixer", color: "var(--node-mixer)" },
    { label: "Bridge / DEX", color: "var(--node-bridge)" },
    { label: "VASP", color: "var(--node-exchange)" },
    { label: "OTC / swap service", color: "var(--node-otc)" },
    { label: "Unresolved", color: "var(--node-unresolved)" },
  ];
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      {items.map((i) => (
        <span
          key={i.label}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <svg width="22" height="6" aria-hidden="true">
          <line
            x1="0"
            y1="3"
            x2="22"
            y2="3"
            stroke="var(--muted-foreground)"
            strokeWidth="1.6"
            strokeDasharray="5 4"
          />
        </svg>
        Probabilistic / weak-signal hop
      </span>
    </div>
  );
}
