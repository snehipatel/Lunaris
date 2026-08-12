import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Field, Panel, StepTitle } from "@/components/mission-ui";
import { CRATERS, RANKED } from "@/lib/craters";
import { useMission } from "@/lib/mission";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Data Provenance & CPR/DOP Methodology" },
      {
        name: "description",
        content:
          "DFSAR SLI and OHRC acquisitions used per crater, the quad-pol scattering matrix workflow, and the CPR>1 with DOP<0.13 ice-detection criterion.",
      },
      { property: "og:title", content: "Data Provenance & Methodology" },
      {
        property: "og:description",
        content: "Reproducible CPR/DOP derivation from Chandrayaan-2 DFSAR full-polarimetric SLI data.",
      },
    ],
  }),
  component: MethodologyPage,
});

const OBJECTIVES = [
  {
    n: "OBJ 1",
    title: "Ice detection & IPS",
    steps: [
      "SLI quad-pol complex data → scattering matrix [S], 5×5 multilook",
      "σ_SC / σ_OC → CPR; Stokes S1–S4 → DOP",
      "Criterion CPR > 1 ∧ DOP < 0.13 separates ice candidates from rough-rock",
      "Gaussian KDE likelihood ratio → IPS, boosted by spatial coherence",
      "Morphometric cross-check against OHRC-derived DEM",
    ],
    output: "Output → IPS (0–1), flag at IPS > 0.7",
  },
  {
    n: "OBJ 2",
    title: "Landing site selection",
    steps: [
      "Hard constraints: slope ≤ 8°, illumination ≥ 35%, ≤ 15 km from ice",
      "10×10 m candidate cells → non-maximum suppression",
      "Aggregation into 1×1 km safe landing cells",
      "Fuzzy Cognitive Map over distance-to-ice, rocks, slope, illumination, max temp",
    ],
    output: "Output → top-N ranked sites with score breakdown",
  },
  {
    n: "OBJ 3",
    title: "Rover traverse",
    steps: [
      "Phase 1 DIC3D-A*: terrain + distance + illumination + ice-probability cost",
      "Wait-at-rim recharge mechanism in sunlight",
      "Handoff gate: battery ≥ threshold and VFSD < 0.3",
      "Phase 2 PPO-DRL: battery-gated inside the PSR with slip-safety model",
    ],
    output: "Output → two-phase path, battery & slip profile",
  },
  {
    n: "OBJ 4",
    title: "Volume & mass",
    steps: [
      "Retain CPR>1 ∧ DOP<0.13 pixels; σ° calibration, speckle filter, incidence correction",
      "IEM forward simulation across dielectric constants and roughness",
      "ANN ensemble (2D/3D Gaussian & exponential) inverts ε, validated on Apollo 17 / Mini-RF",
      "LLL mixing model → ice volume fraction per pixel",
    ],
    output: "Output → conservative / nominal / optimistic volume ± σ",
  },
] as const;

function MethodologyPage() {
  const { selectedId } = useMission();
  const c = CRATERS.find((k) => k.crater_id === selectedId) ?? RANKED[0]!;

  return (
    <div>
      <StepTitle n="06" title="DATA PROVENANCE & METHODOLOGY" />
      <div className="grid gap-3 p-3 lg:grid-cols-[16rem_1fr_18rem]">
        <Panel title={`Data used — ${c.name}`}>
          <div className="space-y-3 text-[11px]">
            <div>
              <div className="font-display text-sm tracking-wide text-primary">DFSAR (SLI, FP)</div>
              <Field k="Date" v={c.dfsar_date} />
              <Field k="Orbit" v={c.dfsar_orbit} />
              <Field k="Product level" v={c.dfsar_product_level} />
              <Field k="Band / mode" v="L-band · quad-pol" />
              <Field k="Pixel spacing" v="~25 m (GRI) / full-res SLI" />
            </div>
            <div>
              <div className="font-display text-sm tracking-wide text-primary">OHRC</div>
              <Field k="Date" v={c.ohrc_date} />
              <Field k="Orbit" v={c.ohrc_orbit} />
              <Field k="Product level" v={c.ohrc_product_level} />
            </div>
            <div>
              <div className="font-display text-sm tracking-wide text-primary">LOLA DEM</div>
              <Field k="Resolution" v="118 m/px" />
              <Field k="PSR map" v="LOLA + LRO NAC derived" />
            </div>
            <p className="text-muted-foreground">
              Source: ISRO PRADAN (pradan.issdc.gov.in/ch2) and chmapbrowse.issdc.gov.in.
            </p>
          </div>
        </Panel>

        <Panel title="Methodology: CPR / DOP approach">
          <ol className="space-y-3 text-[11px]">
            <li>
              <div className="label-xs text-[10px]">1. SLI complex data (quad-pol)</div>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {["HH", "HV", "VH", "VV"].map((p) => (
                  <span
                    key={p}
                    className="readout rounded-sm border border-primary/50 bg-primary/10 py-1.5 text-center text-primary"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </li>
            <li className="flex justify-center text-primary">
              <ArrowDown className="size-4" aria-hidden />
            </li>
            <li className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div>
                <div className="label-xs text-[10px]">2. Scattering matrix [S]</div>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {["Shh", "Shv", "Svh", "Svv"].map((s) => (
                    <span
                      key={s}
                      className="readout rounded-sm border border-ice-positive/40 py-1.5 text-center"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight className="mx-auto hidden size-4 text-primary sm:block" aria-hidden />
              <div className="rounded-sm border border-primary/40 bg-primary/5 p-2 text-center">
                <div className="label-xs text-[10px]">4. Ice detection criterion</div>
                <div className="readout mt-1 text-base text-primary">CPR &gt; 1</div>
                <div className="label-xs text-[10px]">and</div>
                <div className="readout text-base text-primary">DOP &lt; 0.13</div>
                <div className="mt-1 text-[10px] text-ice-positive">⇒ ice-positive</div>
              </div>
            </li>
            <li>
              <div className="label-xs text-[10px]">3. Derived parameters</div>
              <div className="readout mt-1 space-y-1 rounded-sm border border-border bg-background/60 p-2 text-[11px]">
                <div>CPR = |S₍sc₎|² / |S₍oc₎|²</div>
                <div>DOP = √(1 − 4·|det[S]| / (|S₍hh₎|² + |S₍hv₎|² + |S₍vv₎|²)²)</div>
              </div>
            </li>
          </ol>
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel title="Notes">
            <ul className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
              <li>
                • CPR &gt; 1 indicates dominance of the same-sense circular return, sensitive to
                volume scattering within a low-loss medium.
              </li>
              <li>
                • DOP &lt; 0.13 indicates low depolarization, consistent with subsurface ice rather
                than a rough-rock surface false positive.
              </li>
              <li>
                • Rough-rock false positives show high CPR but retain higher DOP — the joint
                threshold rejects them.
              </li>
              <li>
                • Threshold validated against the Apollo 17 site and terrestrial ice analogues.
              </li>
              <li>
                • Morphometry cross-check: fresher, deeper craters (higher d/D, high circularity)
                retain ice better.
              </li>
            </ul>
          </Panel>
          <Link
            to="/stats"
            className="rounded-sm border border-primary/60 bg-primary/15 py-2 text-center font-display text-[11px] tracking-[0.12em] text-primary hover:bg-primary/25"
          >
            GLOBAL SUMMARY STATISTICS →
          </Link>
        </div>
      </div>
      <div className="px-3 pb-6">
        <Panel title="Full processing chain — four objectives">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {OBJECTIVES.map((o) => (
              <div key={o.n} className="rounded-sm border border-border bg-background/40 p-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="readout rounded-sm border border-primary/50 bg-primary/10 px-1.5 text-[10px] text-primary">
                    {o.n}
                  </span>
                  <span className="font-display text-[12px] tracking-wide text-foreground">
                    {o.title}
                  </span>
                </div>
                <ol className="mt-2 space-y-1.5 text-[11px] leading-snug text-muted-foreground">
                  {o.steps.map((st) => (
                    <li key={st} className="flex gap-1.5">
                      <span className="text-primary">›</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ol>
                <div className="readout mt-2 border-t border-border pt-1.5 text-[10px] text-ice-positive">
                  {o.output}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">
            References: Sinha et al. (2026) — subsurface ice in doubly shadowed craters from DFSAR;
            Jia et al. (2022) — FCM-based lunar landing site selection; Miao et al. (2026) —
            illumination-constrained spatio-temporal A*; Sharma et al. (2023) — IEM-based dielectric
            retrieval; Campbell et al. (2012) — CPR in radar scattering; Raney et al. (2012) — m-χ
            decomposition. Processing chain: Python / NumPy / SciPy / Rasterio / GDAL / GeoPandas,
            MIDAS + ENVI for polarimetry, scikit-learn &amp; PyTorch for the KDE / ANN / PPO models.
          </div>
        </Panel>
      </div>
    </div>
  );
}
