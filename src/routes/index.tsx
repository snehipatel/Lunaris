import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import MoonGlobe, { type GlobeLayers } from "@/components/MoonGlobe";
import { Panel, StepTitle } from "@/components/mission-ui";
import { CRATERS, SUMMARY, iceColor, type Crater } from "@/lib/craters";
import { useMission } from "@/lib/mission";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "South Pole Ice Screening — Chandrayaan-2 DFSAR/OHRC" },
      {
        name: "description",
        content:
          "Navigable 3D lunar globe screening 164 doubly-shadowed south polar craters for subsurface water ice using Chandrayaan-2 DFSAR CPR/DOP polarimetry and OHRC morphometry.",
      },
      { property: "og:title", content: "South Pole Ice Screening — Chandrayaan-2" },
      {
        property: "og:description",
        content:
          "Interactive LRO WAC + LOLA 3D globe with CPR/DOP ice classification for 164 south polar craters.",
      },
    ],
  }),
  component: OverviewPage,
});

type SortKey = "ice_probability" | "diameter_km" | "lat" | "d_ratio";

function OverviewPage() {
  const { selectedId, setSelectedId } = useMission();
  const [minIce, setMinIce] = useState(0);
  const [minDia, setMinDia] = useState(0);
  const [maxLat, setMaxLat] = useState(-79);
  const [sort, setSort] = useState<SortKey>("ice_probability");
  const [layers, setLayers] = useState<GlobeLayers>({
    dfsar: true,
    ohrc: false,
    psr: true,
    illumination: false,
  });

  const filtered = useMemo(() => {
    const list = CRATERS.filter(
      (c) => c.ice_probability >= minIce && c.diameter_km >= minDia && c.lat <= maxLat,
    );
    return list.sort((a: Crater, b: Crater) =>
      sort === "lat" ? a.lat - b.lat : (b[sort] as number) - (a[sort] as number),
    );
  }, [minIce, minDia, maxLat, sort]);

  const selected = CRATERS.find((c) => c.crater_id === selectedId);

  return (
    <div className="flex flex-col">
      <StepTitle
        n="01"
        title="SOUTH POLE OVERVIEW"
        right={
          <div className="flex gap-5">
            {[
              ["Craters Screened", SUMMARY.total, "text-foreground"],
              ["Ice-Positive", SUMMARY.positive, "text-ice-positive"],
              ["Ice-Negative", SUMMARY.negative, "text-ice-negative"],
              ["Ambiguous", SUMMARY.ambiguous, "text-ice-ambiguous"],
            ].map(([k, v, cls]) => (
              <div key={k as string} className="text-right">
                <div className={"readout text-xl leading-none " + cls}>{v as number}</div>
                <div className="label-xs text-[9px]">{k as string}</div>
              </div>
            ))}
          </div>
        }
      />
      <p className="px-4 pt-2 text-xs text-muted-foreground">
        Screening &amp; ranking of doubly shadowed craters — DFSAR full-pol L-band + OHRC coverage,
        draped on LRO WAC mosaic over LOLA elevation.
      </p>

      <div className="grid flex-1 gap-3 p-3 lg:grid-cols-[17rem_1fr_14rem]">
        <div className="flex flex-col gap-3">
          <Panel title="Filters">
            <div className="space-y-3">
              <Slider
                label={`Min ice probability — ${minIce.toFixed(2)}`}
                value={minIce}
                min={0}
                max={0.95}
                step={0.05}
                onChange={setMinIce}
              />
              <Slider
                label={`Min diameter — ${minDia.toFixed(0)} km`}
                value={minDia}
                min={0}
                max={100}
                step={5}
                onChange={setMinDia}
              />
              <Slider
                label={`Latitude poleward of — ${maxLat}°`}
                value={maxLat}
                min={-90}
                max={-72}
                step={1}
                onChange={setMaxLat}
              />
              <div>
                <div className="label-xs mb-1 text-[10px]">Sort by</div>
                <div className="grid grid-cols-2 gap-1">
                  {(
                    [
                      ["ice_probability", "Ice prob"],
                      ["diameter_km", "Diameter"],
                      ["lat", "Latitude"],
                      ["d_ratio", "d/D ratio"],
                    ] as Array<[SortKey, string]>
                  ).map(([k, l]) => (
                    <button
                      key={k}
                      onClick={() => setSort(k)}
                      className={
                        "rounded-sm border px-2 py-1 font-display text-[10px] tracking-wider " +
                        (sort === k
                          ? "border-primary/70 bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground")
                      }
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title={`Screened craters (${filtered.length})`} className="flex-1">
            <ul className="max-h-[26rem] space-y-0.5 overflow-y-auto pr-1">
              {filtered.map((c) => (
                <li key={c.crater_id}>
                  <button
                    onClick={() => setSelectedId(c.crater_id)}
                    className={
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-[11px] transition-colors " +
                      (c.crater_id === selectedId
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-accent/50")
                    }
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: iceColor(c.ice_probability) }}
                    />
                    <span className="truncate">{c.name}</span>
                    <span className="readout ml-auto">{c.ice_probability.toFixed(2)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="panel relative h-[34rem] overflow-hidden lg:h-[calc(100vh-11rem)]">
          <MoonGlobe
            craters={filtered}
            selectedId={selectedId}
            onSelect={(c) => setSelectedId(c.crater_id)}
            layers={layers}
            className="h-full w-full"
          />
          <div className="pointer-events-none absolute left-3 top-3 readout text-[10px] text-muted-foreground">
            <div>LAT {selected ? selected.lat.toFixed(3) : "-90.000"}°</div>
            <div>LON {selected ? selected.lon.toFixed(3) : "0.000"}°</div>
            <div>BASEMAP LOLA + LRO WAC</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Layers">
            <div className="space-y-1.5">
              {(
                [
                  ["dfsar", "DFSAR backscatter"],
                  ["ohrc", "OHRC optical mosaic"],
                  ["psr", "PSR boundaries"],
                  ["illumination", "Illumination / shadow"],
                ] as Array<[keyof GlobeLayers, string]>
              ).map(([k, l]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 text-[11px]">
                  <input
                    type="checkbox"
                    checked={layers[k]}
                    onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })}
                    className="size-3.5 accent-primary"
                  />
                  {l}
                </label>
              ))}
            </div>
          </Panel>
          {selected && (
            <Panel title="Selection">
              <div className="space-y-1 text-[11px]">
                <div className="font-display text-base tracking-wide text-primary">
                  {selected.name}
                </div>
                <div className="readout text-muted-foreground">{selected.crater_id}</div>
                <div className="readout">CPR {selected.cpr}</div>
                <div className="readout">DOP {selected.dop}</div>
                <div className="readout">Ø {selected.diameter_km} km</div>
                <div className="readout">p(ice) {selected.ice_probability}</div>
                <Link
                  to="/crater"
                  className="mt-2 block rounded-sm border border-primary/60 bg-primary/15 py-1.5 text-center font-display text-[11px] tracking-[0.12em] text-primary hover:bg-primary/25"
                >
                  OPEN DETAIL VIEW →
                </Link>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="label-xs text-[10px]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-primary"
      />
    </label>
  );
}
