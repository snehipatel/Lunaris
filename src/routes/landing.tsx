import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Download, X } from "lucide-react";
import { Field, Panel, StepTitle } from "@/components/mission-ui";
import { FCM_WEIGHTS, RANKED, landingCandidates } from "@/lib/craters";
import { useMission } from "@/lib/mission";
import ohrc from "@/assets/ohrc-crater.jpg";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Landing Site Recommendation — Illuminated Rim Approach" },
      {
        name: "description",
        content:
          "Top-ranked south polar craters with reasoning, plus six candidate landing points per crater scored on illumination, slope, boulder density, Earth comms and distance to the shadowed ice zone.",
      },
      { property: "og:title", content: "Landing Site Recommendation" },
      {
        property: "og:description",
        content: "Multiple candidate lander coordinates with illumination, slope and access scoring near the target crater.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const REASONS = [
  "High ice prob., accessible rim, gentle approach",
  "High ice prob., good illumination on SW rim",
  "High ice prob., short traverse to PSR",
  "Moderate terrain roughness, wide flat rim",
  "Good access from N rim, low boulder density",
];

function LandingPage() {
  const { landingId, setLandingId, setSelectedId } = useMission();
  const top = RANKED.slice(0, 5);
  const chosen = RANKED.find((c) => c.crater_id === landingId) ?? top[0]!;
  const sites = useMemo(() => landingCandidates(chosen), [chosen]);
  const [siteId, setSiteId] = useState(sites[0]!.id);
  const site = sites.find((s) => s.id === siteId) ?? sites[0]!;

  return (
    <div>
      <StepTitle n="04" title="LANDING SITE RECOMMENDATION" />
      <div className="grid gap-3 p-3 lg:grid-cols-[19rem_1fr]">
        <div className="flex flex-col gap-3">
          <Panel title="Top recommended craters">
            <ol className="space-y-2">
              {top.map((c, i) => {
                const best = landingCandidates(c)[0]!;
                const active = c.crater_id === chosen.crater_id;
                return (
                  <li key={c.crater_id}>
                    <button
                      onClick={() => {
                        setLandingId(c.crater_id);
                        setSelectedId(c.crater_id);
                        setSiteId(landingCandidates(c)[0]!.id);
                      }}
                      className={
                        "w-full rounded-sm border px-2.5 py-2 text-left transition-colors " +
                        (active
                          ? "border-ice-positive/60 bg-ice-positive/10"
                          : "border-border hover:bg-accent/40")
                      }
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="readout text-ice-ambiguous">{i + 1}</span>
                        <span className="font-display text-sm tracking-wide text-primary">
                          {c.name}
                        </span>
                        <span className="readout ml-auto text-[11px]">Score {best.score}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {REASONS[i]}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel title={`Candidate landing points · ${chosen.name} (${sites.length})`}>
            <ul className="space-y-1.5">
              {sites.map((s) => {
                const active = s.id === site.id;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setSiteId(s.id)}
                      className={
                        "w-full rounded-sm border px-2 py-1.5 text-left transition-colors " +
                        (active ? "border-primary/70 bg-primary/15" : "border-border hover:bg-accent/40")
                      }
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-[11px] tracking-wide text-foreground">
                          {s.label} · {s.sector}
                        </span>
                        <span className="readout ml-auto text-[10px] text-ice-positive">
                          {s.score}
                        </span>
                      </div>
                      <div className="readout mt-0.5 text-[10px] text-muted-foreground">
                        {s.lat}°, {s.lon}° · {s.illumination_pct}% sun · {s.slope_deg}° slope ·{" "}
                        {s.distance_to_psr_km} km to PSR
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title={`Recommended landing site — ${site.label} (near ${chosen.name})`}>
            <div className="relative overflow-hidden rounded-sm border border-border">
              <img
                src={ohrc}
                alt={`OHRC view of the illuminated ${site.sector} near ${chosen.name} with the recommended landing ellipse marked`}
                width={1024}
                height={768}
                className="w-full object-cover"
              />
              <div className="absolute left-[34%] top-[58%]">
                <span className="block size-3 rounded-full bg-ice-positive shadow-[0_0_18px_6px_oklch(0.78_0.17_155/0.6)]" />
                <span className="absolute -left-8 -top-8 size-20 rounded-full border border-ice-positive/70" />
              </div>
              <div className="absolute right-3 top-3 w-52 rounded-sm border border-primary/40 bg-card/85 p-2 backdrop-blur">
                <div className="label-xs mb-1 text-[9px]">Landing coordinates</div>
                <Field k="Lat" v={`${site.lat}°`} accent />
                <Field k="Lon" v={`${site.lon}°`} accent />
                <Field k="Elevation" v={`${site.elevation_km} km`} />
                <Field k="Illumination" v={`${site.illumination_pct}%`} />
                <Field k="Local slope" v={`${site.slope_deg}°`} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/traverse"
                className="flex-1 rounded-sm border border-ice-positive/70 bg-ice-positive/15 py-2 text-center font-display text-xs tracking-[0.16em] text-ice-positive hover:bg-ice-positive/25"
              >
                SELECT AS LANDING SITE
              </Link>
              <button
                className="rounded-sm border border-border px-3 py-2 text-muted-foreground hover:text-foreground"
                aria-label="Download site brief"
              >
                <Download className="size-4" />
              </button>
            </div>
          </Panel>

          <Panel title={`Site parameters — ${site.label}`}>
            <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
              <Field k="Sector" v={site.sector} />
              <Field k="FCM score" v={site.score} accent />
              <Field k="Landing ellipse" v={`${site.ellipse_km} km`} />
              <Field k="1×1 km safe cells" v={site.cells_1km} />
              <Field k="Terrain roughness" v={site.roughness} />
              <Field k="Boulder density" v={`${site.boulder_density} / 100 m²`} />
              <Field k="Rock distribution" v={site.rock_distribution} />
              <Field k="Max. temperature" v={`${site.max_temp_c} °C`} />
              <Field k="Earth comms" v={`${site.comms_earth_pct}%`} />
              <Field k="Distance to ice region" v={`${site.distance_to_ice_km} km`} />
              <Field k="Distance to PSR" v={`${site.distance_to_psr_km} km`} />
              <Field k="Crater ice prob. (IPS)" v={chosen.ice_probability} />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{site.note}</p>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="FCM score breakdown (5 weighted criteria)">
              <ul className="space-y-2">
                {(
                  [
                    ["Distance to ice region", site.fcm.distance_to_ice, FCM_WEIGHTS.distance_to_ice],
                    ["Rock distribution", site.fcm.rock_distribution, FCM_WEIGHTS.rock_distribution],
                    ["Slope", site.fcm.slope, FCM_WEIGHTS.slope],
                    ["Illumination intensity", site.fcm.illumination, FCM_WEIGHTS.illumination],
                    ["Max. temperature", site.fcm.max_temp, FCM_WEIGHTS.max_temp],
                  ] as Array<[string, number, number]>
                ).map(([label, act, w]) => (
                  <li key={label}>
                    <div className="flex items-baseline gap-2 text-[11px]">
                      <span className="text-foreground">{label}</span>
                      <span className="readout ml-auto text-[10px] text-muted-foreground">
                        w {w.toFixed(2)}
                      </span>
                      <span className="readout w-8 text-right text-[11px] text-primary">
                        {act.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-sm bg-muted">
                      <span
                        className="block h-full rounded-sm bg-primary"
                        style={{ width: `${Math.round(act * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Hard constraints applied">
              <ul className="space-y-2 text-[11px]">
                {(
                  [
                    ["Slope ≤ 8° (LOLA DEM)", `${site.slope_deg}°`, site.constraints.slope],
                    ["Illumination ≥ 35%", `${site.illumination_pct}%`, site.constraints.illumination],
                    [
                      "Within 15 km of ice-positive region",
                      `${site.distance_to_ice_km} km`,
                      site.constraints.ice_proximity,
                    ],
                  ] as Array<[string, string, boolean]>
                ).map(([label, val, ok]) => (
                  <li key={label} className="flex items-center gap-2">
                    {ok ? (
                      <Check className="size-4 shrink-0 text-ice-positive" aria-hidden />
                    ) : (
                      <X className="size-4 shrink-0 text-destructive" aria-hidden />
                    )}
                    <span className="min-w-0 text-foreground">{label}</span>
                    <span
                      className={
                        "readout ml-auto shrink-0 " +
                        (ok ? "text-ice-positive" : "text-destructive")
                      }
                    >
                      {val}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
                Candidates are generated on a 10×10 m grid, reduced by non-maximum suppression and
                aggregated into 1×1 km safe landing cells before FCM ranking.
              </p>
              <div
                className={
                  "mt-2 rounded-sm border px-2 py-1.5 text-center font-display text-[11px] tracking-[0.12em] " +
                  (site.constraints.pass
                    ? "border-ice-positive/60 bg-ice-positive/10 text-ice-positive"
                    : "border-destructive/60 bg-destructive/10 text-destructive")
                }
              >
                {site.constraints.pass ? "ALL CONSTRAINTS SATISFIED" : "CONSTRAINT VIOLATION"}
              </div>
            </Panel>
          </div>

        </div>
      </div>
    </div>
  );
}
