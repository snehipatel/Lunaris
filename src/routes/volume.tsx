import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Field, Panel, StepTitle } from "@/components/mission-ui";
import { CraterRaster } from "@/components/CraterRaster";
import {
  CRATERS,
  RANKED,
  RHO_ICE,
  dielectricEnsemble,
  fmtVolume,
  volumeScenarios,
} from "@/lib/craters";
import { useMission } from "@/lib/mission";


export const Route = createFileRoute("/volume")({
  head: () => ({
    meta: [
      { title: "Ice Volume Estimate — Dielectric Mixing Model" },
      {
        name: "description",
        content:
          "Per-crater subsurface ice volume and mass estimates with assumed ice-layer thickness, dielectric mixing model and uncertainty, plus a top-ranked comparison table.",
      },
      { property: "og:title", content: "Ice Volume Estimate" },
      {
        property: "og:description",
        content:
          "Volume, mass and confidence comparison across the top-ranked south polar ice candidates.",
      },
    ],
  }),
  component: VolumePage,
});

function VolumePage() {
  const { selectedId, setSelectedId } = useMission();
  const c = CRATERS.find((k) => k.crater_id === selectedId) ?? RANKED[0]!;
  const scenarios = useMemo(() => volumeScenarios(c), [c]);
  const ens = useMemo(() => dielectricEnsemble(c), [c]);
  const nominal = scenarios[1]!;

  return (
    <div>
      <StepTitle n="03" title="ICE VOLUME & MASS ESTIMATE" />
      <div className="grid gap-3 p-3 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-3">
          <Panel title={`Radar-derived ice body — ${c.name}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <CraterRaster seed={Number(c.crater_id.slice(2)) * 613} ramp="dop" label="Depth (km) — modelled ice layer extent" />
              <div className="space-y-1.5">
                <Field k="Retained pixel mask" v="CPR > 1 ∧ DOP < 0.13" accent />
                <Field k="Retrieved dielectric ε" v={`${ens.epsilon} ± ${ens.epsilon_sigma}`} accent />
                <Field k="Ice volume fraction (LLL)" v={ens.ice_volume_fraction} />
                <Field k="Forward model" v="IEM → ANN inversion" />
                <Field k="Mixing model" v="Looyenga–Landau–Lifshitz" />
                <Field k="Ice density ρ" v={`${RHO_ICE} kg/m³`} />
                <Field k="Geodetic model" v="LOLA LDEM 118 m" />
                <Field k="Validation" v={ens.validation} />
                <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
                  σ°-calibrated, speckle-filtered and incidence-corrected pixels are inverted for the
                  dielectric constant by an ANN trained on IEM-simulated backscatter; LLL mixing then
                  converts ε to a per-pixel ice volume fraction.
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="ANN ensemble — dielectric retrieval sub-models">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="label-xs text-[9px]">
                  {["Sub-model", "Roughness assumption", "ε retrieved", "Weight", "RMSE"].map((h) => (
                    <th key={h} className="border-b border-border px-2 py-1.5 text-left font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ens.models.map((m) => (
                  <tr key={m.name} className="border-b border-border/40">
                    <td className="readout px-2 py-1.5 text-primary">{m.name}</td>
                    <td className="px-2 py-1.5">{m.roughness}</td>
                    <td className="readout px-2 py-1.5">{m.epsilon}</td>
                    <td className="readout px-2 py-1.5">{m.weight}</td>
                    <td className="readout px-2 py-1.5">{m.rmse}</td>
                  </tr>
                ))}
                <tr>
                  <td className="readout px-2 py-1.5 text-ice-positive" colSpan={2}>
                    Weighted ensemble
                  </td>
                  <td className="readout px-2 py-1.5 text-ice-positive">{ens.epsilon}</td>
                  <td className="readout px-2 py-1.5">1.00</td>
                  <td className="readout px-2 py-1.5">± {ens.epsilon_sigma}</td>
                </tr>
              </tbody>
            </table>
          </Panel>

          <Panel title="Volume & mass scenarios (conservative / nominal / optimistic)">
            <div className="grid gap-3 sm:grid-cols-3">
              {scenarios.map((s) => (
                <div
                  key={s.key}
                  className={
                    "rounded-sm border p-2 " +
                    (s.key === "nominal"
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-background/40")
                  }
                >
                  <div className="label-xs text-[10px]">{s.label}</div>
                  <div className="readout mt-1 text-lg text-primary">
                    {(s.volume_m3 / 1e9).toFixed(2)} ± {(s.volume_sigma_m3 / 1e9).toFixed(2)} km³
                  </div>
                  <div className="readout text-[12px] text-foreground">
                    {(s.mass_kg / 1e12).toFixed(2)} ± {(s.mass_sigma_kg / 1e12).toFixed(2)} × 10¹² kg
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <Field k="Ice-layer depth" v={`${s.ice_layer_depth_m} m`} />
                    <Field k="Porosity" v={s.porosity} />
                    <Field k="Ice vol. fraction" v={s.ice_volume_fraction} />
                    <Field k="Volume" v={fmtVolume(s.volume_m3)} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title={`Nominal estimate (${c.name})`}>
            <div className="label-xs text-[10px]">Estimated ice volume</div>
            <div className="readout text-3xl text-primary">
              {(nominal.volume_m3 / 1e9).toFixed(2)} ± {(nominal.volume_sigma_m3 / 1e9).toFixed(2)} km³
            </div>
            <div className="label-xs mt-3 text-[10px]">Estimated ice mass (ρ = {RHO_ICE} kg/m³)</div>
            <div className="readout text-2xl text-foreground">
              {(nominal.mass_kg / 1e12).toFixed(2)} ± {(nominal.mass_sigma_kg / 1e12).toFixed(2)} × 10¹² kg
            </div>
            <div className="mt-3 space-y-1">
              <Field
                k="Conservative"
                v={`${(scenarios[0]!.volume_m3 / 1e9).toFixed(2)} km³`}
              />
              <Field
                k="Optimistic"
                v={`${(scenarios[2]!.volume_m3 / 1e9).toFixed(2)} km³`}
              />
              <Field k="Confidence" v={c.confidence} accent />
              <Field k="Accessibility" v={c.accessibility} />
            </div>
          </Panel>
          <Link
            to="/landing"
            className="rounded-sm border border-primary/60 bg-primary/15 py-2 text-center font-display text-[11px] tracking-[0.12em] text-primary hover:bg-primary/25"
          >
            LANDING SITE RECOMMENDATION →
          </Link>
        </div>
      </div>


      <div className="px-3 pb-6">
        <Panel title="Top 8 craters by estimated ice volume — volume vs accessibility vs confidence">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="label-xs text-[9px]">
                  {["#", "Crater ID", "Name", "Diameter", "Ice prob.", "Volume", "Accessibility", "Confidence"].map(
                    (h) => (
                      <th key={h} className="border-b border-border px-2 py-1.5 text-left font-normal">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {[...CRATERS]
                  .sort((a, b) => b.volume_estimate_m3 - a.volume_estimate_m3)
                  .slice(0, 8)
                  .map((k, i) => (
                    <tr
                      key={k.crater_id}
                      onClick={() => setSelectedId(k.crater_id)}
                      className={
                        "cursor-pointer border-b border-border/40 hover:bg-accent/40 " +
                        (k.crater_id === c.crater_id ? "bg-primary/10 text-primary" : "")
                      }
                    >
                      <td className="readout px-2 py-1.5">{i + 1}</td>
                      <td className="readout px-2 py-1.5">{k.crater_id}</td>
                      <td className="px-2 py-1.5">{k.name}</td>
                      <td className="readout px-2 py-1.5">{k.diameter_km} km</td>
                      <td className="readout px-2 py-1.5">{k.ice_probability}</td>
                      <td className="readout px-2 py-1.5">{fmtVolume(k.volume_estimate_m3)}</td>
                      <td className="readout px-2 py-1.5">{k.accessibility}</td>
                      <td className="readout px-2 py-1.5">{k.confidence}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
