import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CircleDot, Mountain, Waves } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MoonGlobe from "@/components/MoonGlobe";
import { Field, Panel, StepTitle } from "@/components/mission-ui";
import { RANKED, traverseRoutes } from "@/lib/craters";
import { useMission } from "@/lib/mission";

export const Route = createFileRoute("/traverse")({
  head: () => ({
    meta: [
      { title: "Rover Traverse Plan — Landing Site to Shadowed Ice Zone" },
      {
        name: "description",
        content:
          "Three candidate rover routes from the illuminated landing site into the permanently shadowed ice zone, with slope, energy, thermal, comms and hazard parameters for each path.",
      },
      { property: "og:title", content: "Rover Traverse Plan" },
      {
        property: "og:description",
        content: "Slope-coded routes, elevation profile, energy/thermal budget and hazard flags into the PSR ice zone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TraversePage,
});

const ICONS = [AlertTriangle, CircleDot, Mountain, Waves];

const VERDICT_CLS: Record<string, string> = {
  recommended: "border-ice-positive/60 bg-ice-positive/10 text-ice-positive",
  viable: "border-ice-ambiguous/60 bg-ice-ambiguous/10 text-ice-ambiguous",
  contingency: "border-destructive/60 bg-destructive/10 text-destructive",
};

function TraversePage() {
  const { landingId } = useMission();
  const c = RANKED.find((k) => k.crater_id === landingId) ?? RANKED[0]!;
  const routes = useMemo(() => traverseRoutes(c), [c]);
  const [routeId, setRouteId] = useState(routes[0]!.id);
  const plan = routes.find((r) => r.id === routeId) ?? routes[0]!;

  const pathPoints = useMemo(
    () => plan.points.map((p) => ({ lat: p.lat, lon: p.lon, slope: p.slope, phase: p.phase })),
    [plan],
  );

  const craterList = useMemo(() => [c], [c]);

  return (
    <div>
      <StepTitle n="05" title={`ROVER TRAVERSE PLAN · ${c.name.toUpperCase()}`} />
      <div className="grid gap-3 p-3 lg:grid-cols-[15rem_1fr_15rem]">
        <div className="flex flex-col gap-3">
          <Panel title={`Route options (${routes.length})`}>
            <ul className="space-y-2">
              {routes.map((r) => {
                const active = r.id === plan.id;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setRouteId(r.id)}
                      className={
                        "w-full rounded-sm border px-2 py-1.5 text-left transition-colors " +
                        (active
                          ? "border-primary/70 bg-primary/15"
                          : "border-border hover:bg-accent/40")
                      }
                    >
                      <div className="font-display text-[11px] tracking-wide text-foreground">
                        {r.name}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="readout text-[10px] text-muted-foreground">
                          {r.total_km} km · {r.avg_slope}° avg
                        </span>
                        <span
                          className={
                            "readout ml-auto rounded-sm border px-1 text-[9px] uppercase " +
                            (VERDICT_CLS[r.verdict] ?? "")
                          }
                        >
                          {r.verdict}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Route summary">
            <Field k="From (landing site)" v={`${plan.from.lat}°, ${plan.from.lon}°`} accent />
            <Field k="Rim handoff" v={`${plan.rim.lat}°, ${plan.rim.lon}°`} />
            <Field k="To (sampling zone)" v={`${plan.to.lat}°, ${plan.to.lon}°`} accent />
            <Field k="Total distance" v={`${plan.total_km} km`} />
            <Field k="Drive time" v={plan.duration} />
            <Field k="Sols required" v={plan.sols} />
            <Field k="Avg. slope" v={`${plan.avg_slope}°`} />
            <Field k="Max slope" v={`${plan.max_slope}°`} />
            <Field k="Battery at sampling zone" v={`${plan.battery_end_pct}%`} />
          </Panel>

          <Panel title="Phase handoff gate (at crater rim)">
            <Field
              k="Battery on arrival"
              v={`${plan.handoff.battery_pct}%`}
            />
            <Field k="Wait to recharge" v={`${plan.handoff.recharge_wait_h} h`} />
            <Field
              k={`Battery after wait (≥ ${plan.handoff.battery_threshold_pct}%)`}
              v={`${plan.handoff.battery_after_wait_pct}%`}
              accent
            />
            <Field
              k={`VFSD (< ${plan.handoff.vfsd_limit})`}
              v={plan.handoff.vfsd}
            />
            <div
              className={
                "mt-2 rounded-sm border px-2 py-1.5 text-center font-display text-[11px] tracking-[0.12em] " +
                (plan.handoff.pass
                  ? "border-ice-positive/60 bg-ice-positive/10 text-ice-positive"
                  : "border-destructive/60 bg-destructive/10 text-destructive")
              }
            >
              {plan.handoff.pass ? "GATE PASSED → PHASE 2" : "GATE BLOCKED · HOLD AT RIM"}
            </div>
          </Panel>

        </div>

        <div className="flex flex-col gap-3">
          <div className="panel relative h-[24rem] overflow-hidden">
            <MoonGlobe
              craters={craterList}
              selectedId={c.crater_id}
              layers={{ dfsar: false, ohrc: false, psr: true, illumination: true }}
              path={pathPoints}
              frameOnMount
              className="h-full w-full"
            />
            <div className="absolute right-3 top-3 rounded-sm border border-border bg-card/85 p-2 backdrop-blur">
              <div className="label-xs mb-1 text-[9px]">Path phases</div>
              <div className="flex items-center gap-2 py-0.5">
                <span className="h-1 w-6 rounded-sm bg-chart-1" />
                <span className="readout text-[10px]">Phase 1 · DIC3D-A*</span>
              </div>
              <div className="flex items-center gap-2 py-0.5">
                <span className="h-1 w-6 rounded-sm bg-chart-5" />
                <span className="readout text-[10px]">Phase 2 · PPO-DRL</span>
              </div>
              <div className="mt-1 border-t border-border pt-1">
                <div className="flex items-center gap-2 py-0.5">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="readout text-[10px]">Landing site</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <span className="size-2 rounded-full bg-ice-ambiguous" />
                  <span className="readout text-[10px]">Rim handoff</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <span className="size-2 rounded-full bg-chart-5" />
                  <span className="readout text-[10px]">Sampling zone</span>
                </div>
              </div>
            </div>

          </div>

          <Panel title="Two-phase plan">
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.phases.map((ph) => (
                <div
                  key={ph.phase}
                  className={
                    "rounded-sm border p-2 " +
                    (ph.phase === 1
                      ? "border-chart-1/50 bg-chart-1/5"
                      : "border-chart-5/50 bg-chart-5/5")
                  }
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className={
                        "readout rounded-sm border px-1 text-[9px] uppercase " +
                        (ph.phase === 1
                          ? "border-chart-1/60 text-chart-1"
                          : "border-chart-5/60 text-chart-5")
                      }
                    >
                      Phase {ph.phase}
                    </span>
                    <span className="font-display text-[11px] tracking-wide text-foreground">
                      {ph.planner}
                    </span>
                  </div>
                  <div className="readout mt-1 text-[10px] text-muted-foreground">{ph.label}</div>
                  <div className="mt-1.5 space-y-0.5">
                    <Field k="Distance" v={`${ph.km} km`} accent />
                    <Field k="Drive time" v={ph.duration} />
                    <Field k="Avg / max slope" v={`${ph.avg_slope}° / ${ph.max_slope}°`} />
                    <Field k="Energy" v={`${ph.energy_wh} Wh`} />
                    <Field k="Sunlit" v={`${ph.sunlit_pct}%`} />
                    <Field k="Min. temperature" v={`${ph.min_temp_c} °C`} />
                    <Field
                      k="Battery start → end"
                      v={`${ph.battery_start_pct}% → ${ph.battery_end_pct}%`}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{ph.note}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={`Path parameters along ${plan.name}`}>
            <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
              <Field k="Energy required" v={`${plan.energy_wh} Wh`} accent />
              <Field k="Energy margin" v={`${plan.energy_margin_pct}%`} />
              <Field k="Sunlit fraction" v={`${plan.sunlit_pct}%`} />
              <Field k="Shadowed distance" v={`${plan.shadow_km} km`} />
              <Field k="Min. temperature" v={`${plan.min_temp_c} °C`} />
              <Field k="Earth comms window" v={`${plan.comms_pct}%`} />
              <Field k="Regolith bearing" v={`${plan.regolith_bearing_kpa} kPa`} />
              <Field k="Peak wheel slip" v={`${plan.slip_risk_pct}%`} />
              <Field k="Hazards flagged" v={plan.hazard_count} />
              <Field k="Composite risk" v={plan.risk_score} accent />
              <Field k="Drive hours" v={`${plan.drive_hours} h`} />
              <Field k="Avg. speed" v={`${(plan.total_km / plan.drive_hours).toFixed(3)} km/h`} />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              {plan.strategy}
            </p>
          </Panel>

          <Panel title="Elevation (by phase), slope, illumination &amp; battery along path">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={plan.points} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                  <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
                  <XAxis
                    dataKey="dist"
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={(v: number) => v.toFixed(1)}
                    stroke="var(--color-border)"
                    unit=" km"
                  />
                  <YAxis
                    yAxisId="l"
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    stroke="var(--color-border)"
                    unit=" km"
                  />
                  <YAxis
                    yAxisId="r"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    stroke="var(--color-border)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      fontSize: 11,
                    }}
                  />
                  <ReferenceLine
                    yAxisId="l"
                    x={plan.handoff.dist_km}
                    stroke="var(--color-ice-ambiguous)"
                    strokeDasharray="3 3"
                    label={{
                      value: "Rim handoff / PSR entry",
                      fontSize: 10,
                      fill: "var(--color-ice-ambiguous)",
                    }}
                  />
                  <Line
                    yAxisId="l"
                    name="Elevation — Phase 1 (km)"
                    type="monotone"
                    dataKey="elev_p1"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.4}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    yAxisId="l"
                    name="Elevation — Phase 2 (km)"
                    type="monotone"
                    dataKey="elev_p2"
                    stroke="var(--color-chart-5)"
                    strokeWidth={2.4}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    yAxisId="r"
                    name="Battery (%)"
                    type="monotone"
                    dataKey="battery_pct"
                    stroke="var(--color-ice-positive)"
                    strokeWidth={1.8}
                    dot={false}
                  />
                  <Line
                    yAxisId="r"
                    name="Slope (°)"
                    type="monotone"
                    dataKey="slope"
                    stroke="var(--color-chart-4)"
                    strokeWidth={1.2}
                    dot={false}
                  />
                  <Line
                    yAxisId="r"
                    name="Illumination (%)"
                    type="monotone"
                    dataKey="illumination"
                    stroke="var(--color-chart-3)"
                    strokeWidth={1.2}
                    strokeDasharray="4 3"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Route comparison">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="label-xs text-[9px]">
                  <th className="text-left font-normal">Route</th>
                  <th className="text-right font-normal">km</th>
                  <th className="text-right font-normal">Wh</th>
                  <th className="text-right font-normal">Risk</th>
                </tr>
              </thead>
              <tbody className="readout">
                {routes.map((r) => (
                  <tr
                    key={r.id}
                    className={r.id === plan.id ? "text-primary" : "text-muted-foreground"}
                  >
                    <td className="py-0.5 text-left">{r.name.split("—")[0]!.trim()}</td>
                    <td className="text-right">{r.total_km}</td>
                    <td className="text-right">{r.energy_wh}</td>
                    <td className="text-right">{r.risk_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Hazards on this route">
            <ul className="space-y-2">
              {plan.hazards.map((h, i) => {
                const Icon = ICONS[i] ?? AlertTriangle;
                return (
                  <li key={h.label} className="flex items-center gap-2 text-[11px]">
                    <Icon className="size-4 shrink-0 text-destructive" aria-hidden />
                    <span className="min-w-0 truncate">{h.label}</span>
                    <span className="readout ml-auto shrink-0 text-muted-foreground">
                      {h.count} @ {h.km} km
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
              Hazards flagged from OHRC panchromatic frames on the illuminated approach; the shadowed
              segment relies on LOLA slope statistics only.
            </p>
          </Panel>
          <Link
            to="/methodology"
            className="rounded-sm border border-primary/60 bg-primary/15 py-2 text-center font-display text-[11px] tracking-[0.12em] text-primary hover:bg-primary/25"
          >
            DATA PROVENANCE →
          </Link>
        </div>
      </div>
    </div>
  );
}
