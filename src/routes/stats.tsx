import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, StepTitle } from "@/components/mission-ui";
import { CRATERS, RANKED, SUMMARY, fmtVolume, iceColor } from "@/lib/craters";
import { useMission } from "@/lib/mission";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Global Summary Statistics — 164 Craters Screened" },
      {
        name: "description",
        content:
          "CPR and DOP distributions, ice-probability breakdown and the full ranked leaderboard across all 164 screened south polar doubly-shadowed craters.",
      },
      { property: "og:title", content: "Global Summary Statistics" },
      {
        property: "og:description",
        content: "Distributions and ranked leaderboard for all screened south polar craters.",
      },
    ],
  }),
  component: StatsPage,
});

function histogram(values: number[], bins: number, min: number, max: number) {
  const w = (max - min) / bins;
  const out = Array.from({ length: bins }, (_, i) => ({
    x: +(min + i * w + w / 2).toFixed(3),
    n: 0,
  }));
  values.forEach((v) => {
    const i = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / w)));
    out[i]!.n += 1;
  });
  return out;
}

export function StatsPage() {
  const { setSelectedId } = useMission();
  const [q, setQ] = useState("");

  const cprHist = useMemo(() => histogram(CRATERS.map((c) => c.cpr), 24, 0, 2.2), []);
  const dopHist = useMemo(() => histogram(CRATERS.map((c) => c.dop), 24, 0, 0.35), []);
  const donut = useMemo(
    () =>
      [
        ["0 – 0.25", 0, 0.25],
        ["0.25 – 0.50", 0.25, 0.5],
        ["0.50 – 0.75", 0.5, 0.75],
        ["0.75 – 1.00", 0.75, 1.01],
      ].map(([label, lo, hi]) => ({
        label: label as string,
        value: CRATERS.filter(
          (c) => c.ice_probability >= (lo as number) && c.ice_probability < (hi as number),
        ).length,
        color: iceColor(((lo as number) + (hi as number)) / 2),
      })),
    [],
  );

  const rows = RANKED.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.crater_id.toLowerCase().includes(q.toLowerCase()),
  );

  const csv = () => {
    const head =
      "crater_id,name,lat,lon,diameter_km,depth_km,cpr,dop,ice_probability,classification,volume_estimate_m3,dfsar_acquisition_id,ohrc_acquisition_id";
    const body = RANKED.map((c) =>
      [
        c.crater_id,
        c.name,
        c.lat,
        c.lon,
        c.diameter_km,
        c.depth_km,
        c.cpr,
        c.dop,
        c.ice_probability,
        c.classification,
        c.volume_estimate_m3,
        c.dfsar_acquisition_id,
        c.ohrc_acquisition_id,
      ].join(","),
    ).join("\n");
    const url = URL.createObjectURL(new Blob([`${head}\n${body}`], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ch2_south_pole_ice_screening.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tip = {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    fontSize: 11,
  };

  return (
    <div>
      <StepTitle n="07" title="GLOBAL SUMMARY STATISTICS" />
      <div className="grid gap-3 p-3 lg:grid-cols-[1fr_26rem]">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat k="Total craters screened" v={SUMMARY.total} />
            <Stat k="Ice-positive" v={SUMMARY.positive} cls="text-ice-positive" pct />
            <Stat k="Ice-negative" v={SUMMARY.negative} cls="text-ice-negative" pct />
            <Stat k="Ambiguous" v={SUMMARY.ambiguous} cls="text-ice-ambiguous" pct />
            <Stat k="High confidence" v={SUMMARY.highConfidence} cls="text-ice-positive" pct />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <Panel title="CPR distribution">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cprHist} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
                    <XAxis dataKey="x" tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }} />
                    <Tooltip contentStyle={tip} />
                    <ReferenceLine
                      x={1.008}
                      stroke="var(--color-destructive)"
                      strokeDasharray="4 3"
                      label={{ value: "CPR = 1", fontSize: 9, fill: "var(--color-destructive)" }}
                    />
                    <Bar dataKey="n" fill="var(--color-chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="DOP distribution">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dopHist} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
                    <XAxis dataKey="x" tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }} />
                    <Tooltip contentStyle={tip} />
                    <ReferenceLine
                      x={0.138}
                      stroke="var(--color-ice-positive)"
                      strokeDasharray="4 3"
                      label={{ value: "DOP = 0.13", fontSize: 9, fill: "var(--color-ice-positive)" }}
                    />
                    <Bar dataKey="n" fill="var(--color-chart-2)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Ice probability distribution">
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donut}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="55%"
                      outerRadius="85%"
                      stroke="var(--color-background)"
                    >
                      {donut.map((d) => (
                        <Cell key={d.label} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="readout text-2xl text-foreground">{SUMMARY.total}</span>
                  <span className="label-xs text-[9px]">total</span>
                </div>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                {donut.map((d) => (
                  <div key={d.label} className="flex items-center gap-1.5 text-[10px]">
                    <span className="size-2 rounded-sm" style={{ backgroundColor: d.color }} />
                    {d.label}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <Panel title={`Ranked leaderboard (${rows.length} craters)`}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name or ID…"
            className="mb-2 w-full rounded-sm border border-border bg-background px-2 py-1 text-[11px]"
          />
          <div className="max-h-[26rem] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-panel">
                <tr className="label-xs text-[9px]">
                  {["Rank", "ID", "Name", "Ice", "CPR", "DOP", "Volume", "Class"].map((h) => (
                    <th key={h} className="border-b border-border px-1.5 py-1.5 text-left font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr
                    key={c.crater_id}
                    onClick={() => setSelectedId(c.crater_id)}
                    className="cursor-pointer border-b border-border/40 hover:bg-accent/40"
                  >
                    <td className="readout px-1.5 py-1">{i + 1}</td>
                    <td className="readout px-1.5 py-1">{c.crater_id}</td>
                    <td className="max-w-[7rem] truncate px-1.5 py-1">{c.name}</td>
                    <td className="readout px-1.5 py-1">{c.ice_probability}</td>
                    <td className="readout px-1.5 py-1">{c.cpr}</td>
                    <td className="readout px-1.5 py-1">{c.dop}</td>
                    <td className="readout px-1.5 py-1">{fmtVolume(c.volume_estimate_m3)}</td>
                    <td
                      className={
                        "readout px-1.5 py-1 " +
                        (c.classification === "ice-positive"
                          ? "text-ice-positive"
                          : c.classification === "ice-negative"
                            ? "text-ice-negative"
                            : "text-ice-ambiguous")
                      }
                    >
                      {c.classification === "ice-positive"
                        ? "Ice+"
                        : c.classification === "ice-negative"
                          ? "Ice−"
                          : "Amb"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={csv}
            className="mt-2 w-full rounded-sm border border-primary/60 bg-primary/15 py-1.5 font-display text-[11px] tracking-[0.14em] text-primary hover:bg-primary/25"
          >
            EXPORT FULL TABLE (CSV)
          </button>
        </Panel>
      </div>
    </div>
  );
}

function Stat({
  k,
  v,
  cls,
  pct,
}: {
  k: string;
  v: number;
  cls?: string;
  pct?: boolean;
}) {
  return (
    <div className="panel px-3 py-2">
      <div className="label-xs text-[9px]">{k}</div>
      <div className={"readout text-2xl leading-tight " + (cls ?? "text-foreground")}>{v}</div>
      {pct && (
        <div className="readout text-[10px] text-muted-foreground">
          ({((v / SUMMARY.total) * 100).toFixed(1)}%)
        </div>
      )}
    </div>
  );
}
