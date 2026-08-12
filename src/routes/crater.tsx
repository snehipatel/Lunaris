import { createFileRoute, Link } from "@tanstack/react-router";
import { CraterRaster } from "@/components/CraterRaster";
import { Field, Panel, StepTitle } from "@/components/mission-ui";
import { CRATERS, RANKED, ipsBreakdown } from "@/lib/craters";
import { useMission } from "@/lib/mission";
import ohrc from "@/assets/ohrc-crater.jpg";

export const Route = createFileRoute("/crater")({
  head: () => ({
    meta: [
      { title: "Crater Detail — CPR/DOP Polarimetry & Morphometry" },
      {
        name: "description",
        content:
          "Per-crater DFSAR polarimetric readout: CPR, DOP, per-polarization backscatter, entropy/alpha/m-chi decomposition, OHRC-derived morphometry and ice classification.",
      },
      { property: "og:title", content: "Crater Detail — CPR/DOP Polarimetry" },
      {
        property: "og:description",
        content: "Radar-derived ice classification and morphometry for a single south polar crater.",
      },
    ],
  }),
  component: CraterDetail,
});

function CraterDetail() {
  const { selectedId, setSelectedId } = useMission();
  const c = CRATERS.find((k) => k.crater_id === selectedId) ?? RANKED[0]!;
  const seed = Number(c.crater_id.slice(2)) * 7919;
  const ips = ipsBreakdown(c);

  const badge =
    c.classification === "ice-positive"
      ? "border-ice-positive/60 bg-ice-positive/15 text-ice-positive"
      : c.classification === "ice-negative"
        ? "border-ice-negative/60 bg-ice-negative/15 text-ice-negative"
        : "border-ice-ambiguous/60 bg-ice-ambiguous/15 text-ice-ambiguous";

  return (
    <div>
      <StepTitle
        n="02"
        title={`CRATER DETAIL VIEW · ${c.name.toUpperCase()}`}
        right={
          <div className="flex items-center gap-3">
            <select
              value={c.crater_id}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-sm border border-border bg-card px-2 py-1 text-[11px]"
            >
              {RANKED.map((k) => (
                <option key={k.crater_id} value={k.crater_id}>
                  {k.crater_id} · {k.name}
                </option>
              ))}
            </select>
            <span className="readout text-[11px] text-muted-foreground">
              ☼ Sun angle {c.avg_slope_deg}°
            </span>
          </div>
        }
      />

      <div className="grid gap-3 p-3 lg:grid-cols-[15rem_1fr_15rem]">
        <div className="flex flex-col gap-3">
          <Panel title="Basic information">
            <Field k="Name" v={c.name} />
            <Field k="Crater ID" v={c.crater_id} />
            <Field k="Latitude" v={`${c.lat}°`} />
            <Field k="Longitude" v={`${c.lon}°`} />
            <Field k="Diameter" v={`${c.diameter_km} km`} />
            <Field k="Depth" v={`${c.depth_km} km`} />
            <Field k="d/D ratio" v={c.d_ratio} />
            <Field k="PSR status" v={c.psr_status} />
            <Field k="Rim freshness" v={c.rim_freshness} />
          </Panel>
          <Panel title="Classification">
            <div className={"mb-2 rounded-sm border px-2 py-1.5 text-center " + badge}>
              <span className="font-display text-sm tracking-[0.12em]">
                {c.classification.toUpperCase()}
              </span>
            </div>
            <Field k="Ice probability (IPS)" v={c.ice_probability} accent />
            <Field k="Confidence" v={c.confidence} accent />
            <Field k="Criterion" v={c.cpr > 1 && c.dop < 0.13 ? "CPR>1 ∧ DOP<0.13 ✓" : "not met"} />
          </Panel>
          <Panel title="Ice Probability Score (KDE likelihood)">
            <Field k="Multilook window" v={ips.multilook} />
            <Field k="P(CPR,DOP | Ice)" v={ips.p_ice} />
            <Field k="P(CPR,DOP | NonIce)" v={ips.p_nonice} />
            <Field k="Likelihood ratio" v={ips.likelihood_ratio} />
            <Field k="Base IPS" v={ips.base_ips} />
            <Field k="Spatial coherence boost" v={ips.coherence} />
            <Field k="Final IPS" v={ips.ips} accent />
            <Field
              k="Ice-candidate pixels"
              v={`${ips.ice_pixels.toLocaleString()} / ${ips.total_pixels.toLocaleString()}`}
            />
            <div
              className={
                "mt-2 rounded-sm border px-2 py-1 text-center font-display text-[10px] tracking-[0.12em] " +
                (ips.pass
                  ? "border-ice-positive/60 bg-ice-positive/10 text-ice-positive"
                  : "border-ice-ambiguous/60 bg-ice-ambiguous/10 text-ice-ambiguous")
              }
            >
              {ips.pass
                ? `IPS > ${ips.threshold} · HIGH PROBABILITY ICE-REGION`
                : `IPS ≤ ${ips.threshold} · NOT FLAGGED`}
            </div>
          </Panel>

          <Link
            to="/volume"
            className="rounded-sm border border-primary/60 bg-primary/15 py-2 text-center font-display text-[11px] tracking-[0.12em] text-primary hover:bg-primary/25"
          >
            ICE VOLUME ESTIMATE →
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric k="CPR" v={c.cpr.toFixed(2)} />
            <Metric k="DOP" v={c.dop.toFixed(3)} />
            <Metric
              k="Backscatter σ⁰ (dB)"
              v={
                <span className="readout text-[11px] leading-tight">
                  HH {c.sigma0.hh} · HV {c.sigma0.hv}
                  <br />
                  VH {c.sigma0.vh} · VV {c.sigma0.vv}
                </span>
              }
            />
            <Metric
              k="Polarimetric decomposition"
              v={
                <span className="readout text-[11px] leading-tight">
                  H {c.entropy} · ᾱ {c.alpha}°
                  <br />
                  m-χ {c.m_chi}
                </span>
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Panel title="CPR map">
              <CraterRaster seed={seed} ramp="cpr" label="Circular polarization ratio" />
            </Panel>
            <Panel title="DOP map">
              <CraterRaster seed={seed + 31} ramp="dop" label="Degree of polarization" />
            </Panel>
            <Panel title="OHRC image (rim)">
              <img
                src={ohrc}
                alt={`OHRC panchromatic view of the illuminated rim and walls of ${c.name}`}
                loading="lazy"
                width={1024}
                height={768}
                className="w-full rounded-sm border border-border object-cover"
              />
              <p className="mt-1.5 readout text-[10px] text-muted-foreground">
                {c.ohrc_acquisition_id}
              </p>
            </Panel>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Morphometry (OHRC-derived DEM)">
              <Field k="Circularity index" v={c.circularity_index} />
              <Field k="Topographic roughness index" v={c.roughness_index} />
              <Field k="Average slope" v={`${c.avg_slope_deg}°`} />
              <Field k="Max slope" v={`${c.max_slope_deg}°`} />
            </Panel>
            <Panel title="Acquisition details">
              <Field k="DFSAR acquisition" v={`${c.dfsar_date} · orbit ${c.dfsar_orbit}`} />
              <Field k="DFSAR product" v={c.dfsar_product_level} />
              <Field k="OHRC acquisition" v={`${c.ohrc_date} · orbit ${c.ohrc_orbit}`} />
              <Field k="OHRC product" v={`Level ${c.ohrc_product_level}`} />
            </Panel>
          </div>
        </div>

        <Panel title="Browse thumbnail" className="self-start">
          <img
            src={ohrc}
            alt={`Browse thumbnail of ${c.name}`}
            loading="lazy"
            width={1024}
            height={768}
            className="w-full rounded-sm border border-border object-cover opacity-90"
          />
          <div className="mt-2 space-y-1">
            <Field k="Pixel scale" v="0.32 m/px" />
            <Field k="LOLA DEM" v="118 m/px" />
            <Field k="Look direction" v={c.lon > 0 ? "right / descending" : "left / ascending"} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Metric({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="panel px-3 py-2">
      <div className="label-xs text-[9px]">{k}</div>
      <div className="readout text-2xl leading-tight text-primary">{v}</div>
    </div>
  );
}
