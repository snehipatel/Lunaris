/**
 * Mock data layer for the Chandrayaan-2 south-pole ice screening pipeline.
 *
 * The schema mirrors the agreed hand-off contract so real DFSAR/OHRC derived
 * output can be swapped in later without touching the UI:
 *   crater_id, lat, lon, diameter_km, depth_km, cpr, dop, ice_probability,
 *   classification, volume_estimate_m3, dfsar_acquisition_id, ohrc_acquisition_id
 */

export type Classification = "ice-positive" | "ice-negative" | "ambiguous";

export interface Crater {
  crater_id: string;
  name: string;
  lat: number;
  lon: number;
  diameter_km: number;
  depth_km: number;
  d_ratio: number; // depth / diameter
  cpr: number;
  dop: number;
  ice_probability: number;
  confidence: number;
  classification: Classification;
  psr_status: "fully shadowed" | "doubly shadowed" | "partially shadowed";
  rim_freshness: "fresh" | "moderate" | "degraded";
  sigma0: { hh: number; hv: number; vh: number; vv: number };
  entropy: number;
  alpha: number;
  m_chi: number;
  circularity_index: number;
  roughness_index: number;
  avg_slope_deg: number;
  max_slope_deg: number;
  ice_layer_depth_m: number;
  volume_estimate_m3: number;
  volume_sigma_m3: number;
  dfsar_acquisition_id: string;
  dfsar_date: string;
  dfsar_orbit: number;
  dfsar_product_level: string;
  ohrc_acquisition_id: string;
  ohrc_date: string;
  ohrc_orbit: number;
  ohrc_product_level: string;
  accessibility: number;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMED: Array<[string, number, number, number]> = [
  // name, lat, lon, diameter_km
  ["Cabeus", -84.9, -35.5, 98.0],
  ["Shackleton", -89.66, 129.2, 21.0],
  ["Faustini", -87.3, 77.0, 39.0],
  ["Shoemaker", -88.1, 44.9, 50.9],
  ["de Gerlache", -88.5, -87.1, 32.4],
  ["Haworth", -87.4, -5.0, 51.4],
  ["Sverdrup", -88.3, -152.0, 35.0],
  ["Slater", -88.1, 100.0, 21.5],
  ["Amundsen", -84.5, 82.8, 105.0],
  ["Nobile", -85.2, 53.5, 73.0],
  ["Malapert", -84.9, -12.9, 69.0],
  ["Wiechert", -84.5, 165.0, 41.0],
  ["Scott", -82.1, 48.5, 103.0],
  ["Idel'son", -81.5, 110.9, 60.0],
  ["Cabeus B", -82.2, -54.5, 44.0],
  ["Nefed'ev", -81.7, -129.6, 47.0],
  ["Ashbrook", -81.4, -112.5, 156.0],
  ["Drygalski", -79.3, -84.9, 162.0],
  ["Boguslawsky", -72.9, 43.2, 97.0],
  ["Demonax", -77.9, 60.8, 128.0],
];

const SYNTH_ROOTS = [
  "Ridge",
  "Massif",
  "Basin",
  "Terrace",
  "Scarp",
  "Depression",
  "Hollow",
  "Rille",
];

function classify(cpr: number, dop: number): Classification {
  if (cpr > 1 && dop < 0.13) return "ice-positive";
  if (cpr <= 1 && dop >= 0.13) return "ice-negative";
  if (cpr > 1.15 && dop < 0.18) return "ambiguous";
  if (cpr <= 0.9 || dop > 0.22) return "ice-negative";
  return "ambiguous";
}

function build(): Crater[] {
  const rnd = mulberry32(20240815);
  const out: Crater[] = [];

  for (let i = 0; i < 164; i++) {
    const named = NAMED[i];
    const lat = named ? named[1] : -(80 + rnd() * 9.6);
    const lon = named ? named[2] : rnd() * 360 - 180;
    const diameter_km = named ? named[3] : 3 + rnd() * 42;

    // Fresher / deeper craters retain ice better -> drives the joint model.
    // Depth/diameter follows the observed lunar trend: ~0.2 for small simple
    // craters, flattening toward ~0.05 for large complex basins.
    const dRatioBase = +(
      (0.1 + rnd() * 0.11) * Math.pow(Math.min(1, 10 / Math.max(3, diameter_km)), 0.42)
    ).toFixed(3);
    const depth_km = +(diameter_km * dRatioBase).toFixed(3);

    const freshnessScore = rnd();
    const polarWeight = Math.min(1, (Math.abs(lat) - 79) / 11);

    let iceCore = 0.06 + polarWeight * 0.3 + freshnessScore * 0.34 + dRatioBase * 0.85;
    if (named && i < 6) iceCore = 0.92 - i * 0.025 + rnd() * 0.01;
    const ice_probability = +Math.max(0.04, Math.min(0.96, iceCore)).toFixed(2);

    const cpr = +(0.45 + ice_probability * 1.05 + (rnd() - 0.5) * 0.22).toFixed(3);
    const dop = +Math.max(
      0.03,
      0.26 - ice_probability * 0.19 + (rnd() - 0.5) * 0.05,
    ).toFixed(3);

    const classification = classify(cpr, dop);
    const ice_layer_depth_m = 1.5 + Math.round(rnd() * 25) / 10;
    const area = Math.PI * Math.pow((diameter_km * 1000) / 2, 2) * (0.32 + rnd() * 0.25);
    const volume_estimate_m3 = Math.round(area * ice_layer_depth_m * ice_probability);

    const rim_freshness: Crater["rim_freshness"] =
      freshnessScore > 0.68 ? "fresh" : freshnessScore > 0.35 ? "moderate" : "degraded";

    out.push({
      crater_id: `C-${String(i + 1).padStart(3, "0")}`,
      name: named ? named[0] : `SP-${String(i + 1).padStart(3, "0")} ${SYNTH_ROOTS[i % SYNTH_ROOTS.length]}`,
      lat: +lat.toFixed(3),
      lon: +lon.toFixed(3),
      diameter_km: +diameter_km.toFixed(1),
      depth_km,
      d_ratio: +dRatioBase.toFixed(3),
      cpr,
      dop,
      ice_probability,
      confidence: +Math.min(0.99, 0.42 + ice_probability * 0.55 + rnd() * 0.05).toFixed(2),
      classification,
      psr_status:
        ice_probability > 0.55
          ? "doubly shadowed"
          : ice_probability > 0.3
            ? "fully shadowed"
            : "partially shadowed",
      rim_freshness,
      sigma0: {
        hh: +(-8 - rnd() * 8).toFixed(1),
        hv: +(-12 - rnd() * 8).toFixed(1),
        vh: +(-12.5 - rnd() * 8).toFixed(1),
        vv: +(-9 - rnd() * 8).toFixed(1),
      },
      entropy: +(0.5 + rnd() * 0.45).toFixed(2),
      alpha: +(28 + rnd() * 30).toFixed(1),
      m_chi: +(0.3 + rnd() * 0.6).toFixed(2),
      circularity_index: +(0.72 + rnd() * 0.26).toFixed(2),
      roughness_index: +(0.2 + rnd() * 0.7).toFixed(2),
      avg_slope_deg: +(3 + rnd() * 9).toFixed(1),
      max_slope_deg: +(14 + rnd() * 18).toFixed(1),
      ice_layer_depth_m: +ice_layer_depth_m.toFixed(1),
      volume_estimate_m3,
      volume_sigma_m3: Math.round(volume_estimate_m3 * (0.18 + rnd() * 0.12)),
      dfsar_acquisition_id: `ch2_sar_nrs_${20210101 + Math.floor(rnd() * 8000)}_d_img_fp`,
      dfsar_date: `2021-${String(1 + Math.floor(rnd() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rnd() * 27)).padStart(2, "0")}`,
      dfsar_orbit: 20000 + Math.floor(rnd() * 9000),
      dfsar_product_level: "2B (SLI, full-pol)",
      ohrc_acquisition_id: `ch2_ohr_ncp_${20210101 + Math.floor(rnd() * 8000)}_d_img_d18`,
      ohrc_date: `2021-${String(1 + Math.floor(rnd() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rnd() * 27)).padStart(2, "0")}`,
      ohrc_orbit: 20000 + Math.floor(rnd() * 9000),
      ohrc_product_level: "2A",
      accessibility: +(0.25 + rnd() * 0.7).toFixed(2),
    });
  }
  return out;
}

export const CRATERS: Crater[] = build();

export const byId = (id: string) => CRATERS.find((c) => c.crater_id === id);

export const RANKED = [...CRATERS].sort((a, b) => b.ice_probability - a.ice_probability);

export const SUMMARY = {
  total: CRATERS.length,
  positive: CRATERS.filter((c) => c.classification === "ice-positive").length,
  negative: CRATERS.filter((c) => c.classification === "ice-negative").length,
  ambiguous: CRATERS.filter((c) => c.classification === "ambiguous").length,
  highConfidence: CRATERS.filter((c) => c.confidence >= 0.6).length,
};

/** Blue -> green -> yellow -> red ice-probability ramp (hex, for canvas/WebGL). */
export function iceColor(p: number): string {
  const pos = [0, 0.35, 0.6, 0.8, 1];
  const rgb = [
    [37, 99, 235],
    [16, 185, 129],
    [234, 179, 8],
    [249, 115, 22],
    [220, 38, 38],
  ];
  const v = Math.max(0, Math.min(1, p));
  let k = 0;
  while (k < pos.length - 2 && v > (pos[k + 1] as number)) k++;
  const p0 = pos[k] as number;
  const p1 = pos[k + 1] as number;
  const c0 = rgb[k] as number[];
  const c1 = rgb[k + 1] as number[];
  const t = p1 === p0 ? 0 : (v - p0) / (p1 - p0);
  const hex = c0
    .map((ch, i) => Math.round(ch + ((c1[i] as number) - ch) * t))
    .map((ch) => ch.toString(16).padStart(2, "0"))
    .join("");
  return `#${hex}`;
}

export function classColor(c: Classification) {
  return c === "ice-positive"
    ? "text-ice-positive"
    : c === "ice-negative"
      ? "text-ice-negative"
      : "text-ice-ambiguous";
}

export function fmtVolume(m3: number) {
  const km3 = m3 / 1e9;
  return km3 >= 0.01 ? `${km3.toFixed(2)} km³` : `${(m3 / 1e6).toFixed(1)} × 10⁶ m³`;
}

/* ---------------------------------------------------------------------------
 * Geodesy helpers (spherical Moon, R = 1737.4 km)
 * ------------------------------------------------------------------------- */
const R_MOON_KM = 1737.4;
const KM_PER_DEG = (2 * Math.PI * R_MOON_KM) / 360; // ≈ 30.33 km

/** Offset a lat/lon by a local ENU displacement in km. */
function offsetKm(lat: number, lon: number, eastKm: number, northKm: number) {
  const newLat = lat + northKm / KM_PER_DEG;
  const cos = Math.max(0.02, Math.cos((lat * Math.PI) / 180));
  return { lat: newLat, lon: lon + eastKm / (KM_PER_DEG * cos) };
}

export interface LandingCandidate {
  id: string;
  label: string;
  sector: string;
  lat: number;
  lon: number;
  elevation_km: number;
  illumination_pct: number;
  slope_deg: number;
  roughness: number;
  boulder_density: number; // per 100 m²
  rock_distribution: number; // 0 (clear) – 1 (rock rich)
  max_temp_c: number;
  comms_earth_pct: number;
  distance_to_psr_km: number;
  distance_to_ice_km: number;
  ellipse_km: number;
  cells_1km: number;
  /** Fuzzy Cognitive Map component activations (0–1) over the 5 weighted criteria. */
  fcm: {
    distance_to_ice: number;
    rock_distribution: number;
    slope: number;
    illumination: number;
    max_temp: number;
  };
  /** Hard constraints: slope ≤ 8°, illumination ≥ 35%, ≤ 15 km from an ice-positive region. */
  constraints: { slope: boolean; illumination: boolean; ice_proximity: boolean; pass: boolean };
  score: number;
  note: string;
}

/** FCM criterion weights (sum = 1) used to rank landing cells. */
export const FCM_WEIGHTS = {
  distance_to_ice: 0.3,
  rock_distribution: 0.16,
  slope: 0.22,
  illumination: 0.22,
  max_temp: 0.1,
} as const;


const SECTORS: Array<[string, number, string]> = [
  ["N rim terrace", 0, "Broad flat terrace, longest traverse to the PSR floor"],
  ["NE rim shoulder", 45, "Good Earth line-of-sight, moderate boulder density"],
  ["E rim bench", 90, "Highest illumination fraction of the candidate set"],
  ["SE rim saddle", 135, "Short descent, gentle saddle entry into the shadow"],
  ["S rim plateau", 180, "Shortest route to ice zone, lower illumination"],
  ["W rim ramp", 270, "Natural ramp on the wall, low slope throughout"],
];

/**
 * Candidate 1×1 km landing cells on the illuminated rim, ranked by the
 * Fuzzy Cognitive Map over 5 weighted criteria, after the hard constraints
 * (slope ≤ 8°, illumination ≥ 35%, ≤ 15 km from an ice-positive region).
 */
export function landingCandidates(c: Crater): LandingCandidate[] {
  const rnd = mulberry32(Math.round(c.diameter_km * 977) + c.crater_id.length * 31);
  const rimKm = (c.diameter_km / 2) * 1.12;
  return SECTORS.map(([sector, az, note], i) => {
    const a = (az * Math.PI) / 180;
    const p = offsetKm(c.lat, c.lon, Math.sin(a) * rimKm, Math.cos(a) * rimKm);
    const illum = Math.round(58 + rnd() * 36 + (az === 90 ? 6 : 0));
    const slope = +(1.8 + rnd() * 6).toFixed(1);
    const rough = +(0.15 + rnd() * 0.5).toFixed(2);
    const boulders = +(0.4 + rnd() * 5.5).toFixed(1);
    const comms = Math.round(52 + rnd() * 44);
    const dist = +(rimKm * (0.55 + rnd() * 0.7)).toFixed(2);
    const iceDist = +Math.min(14.6, dist * (0.7 + rnd() * 0.35)).toFixed(2);
    const maxTemp = Math.round(-42 + (illum / 100) * 78 + rnd() * 8);
    const rockDist = +Math.min(0.95, boulders / 6.5 + rough * 0.3).toFixed(2);

    // FCM activations: each criterion mapped to a 0–1 desirability.
    const fcm = {
      distance_to_ice: +Math.max(0, 1 - iceDist / 15).toFixed(2),
      rock_distribution: +Math.max(0, 1 - rockDist).toFixed(2),
      slope: +Math.max(0, 1 - slope / 8).toFixed(2),
      illumination: +Math.min(1, (illum - 35) / 60).toFixed(2),
      max_temp: +Math.max(0, Math.min(1, (maxTemp + 60) / 110)).toFixed(2),
    };
    const constraints = {
      slope: slope <= 8,
      illumination: illum >= 35,
      ice_proximity: iceDist <= 15,
    };
    const score = +Math.min(
      0.99,
      (fcm.distance_to_ice * FCM_WEIGHTS.distance_to_ice +
        fcm.rock_distribution * FCM_WEIGHTS.rock_distribution +
        fcm.slope * FCM_WEIGHTS.slope +
        fcm.illumination * FCM_WEIGHTS.illumination +
        fcm.max_temp * FCM_WEIGHTS.max_temp) *
        (0.82 + c.ice_probability * 0.2),
    ).toFixed(2);
    return {
      id: `${c.crater_id}-L${i + 1}`,
      label: `Site ${String.fromCharCode(65 + i)}`,
      sector,
      lat: +p.lat.toFixed(3),
      lon: +((((p.lon + 540) % 360) - 180)).toFixed(3),
      elevation_km: +(-0.8 - rnd() * 3).toFixed(2),
      illumination_pct: Math.min(97, illum),
      slope_deg: slope,
      roughness: rough,
      boulder_density: boulders,
      rock_distribution: rockDist,
      max_temp_c: maxTemp,
      comms_earth_pct: comms,
      distance_to_psr_km: dist,
      distance_to_ice_km: iceDist,
      ellipse_km: +(0.9 + rnd() * 1.8).toFixed(1),
      cells_1km: 3 + Math.floor(rnd() * 22),
      fcm,
      constraints: {
        ...constraints,
        pass: constraints.slope && constraints.illumination && constraints.ice_proximity,
      },
      score,
      note,
    };
  }).sort((a, b) => Number(b.constraints.pass) - Number(a.constraints.pass) || b.score - a.score);
}


/** Best landing point for a crater (kept for the single-site readout). */
export function landingSite(c: Crater) {
  const best = landingCandidates(c)[0]!;
  return {
    lat: best.lat,
    lon: best.lon,
    elevation_km: best.elevation_km,
    illumination_pct: best.illumination_pct,
    slope_deg: best.slope_deg,
    score: best.score,
  };
}

export interface TraversePoint {
  i: number;
  dist: number;
  elev: number;
  slope: number;
  lat: number;
  lon: number;
  illumination: number;
  temp_c: number;
  cumulative_wh: number;
  /** 1 = DIC3D-A* (landing site → rim), 2 = PPO-DRL (rim → shadowed sampling zone). */
  phase: 1 | 2;
  battery_pct: number;
  slip_pct: number;
  /** Elevation series split by phase so the profile can be drawn in two colours. */
  elev_p1: number | null;
  elev_p2: number | null;
}

export interface TraversePhaseStats {
  phase: 1 | 2;
  planner: string;
  label: string;
  km: number;
  avg_slope: number;
  max_slope: number;
  drive_hours: number;
  duration: string;
  energy_wh: number;
  sunlit_pct: number;
  min_temp_c: number;
  battery_start_pct: number;
  battery_end_pct: number;
  note: string;
}

export interface TraverseRoute {
  id: string;
  name: string;
  strategy: string;
  points: TraversePoint[];
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  rim: { lat: number; lon: number };
  total_km: number;
  avg_slope: number;
  max_slope: number;
  duration: string;
  drive_hours: number;
  sols: number;
  energy_wh: number;
  energy_margin_pct: number;
  sunlit_pct: number;
  shadow_km: number;
  comms_pct: number;
  min_temp_c: number;
  regolith_bearing_kpa: number;
  slip_risk_pct: number;
  hazard_count: number;
  risk_score: number; // 0 (safe) – 1 (severe)
  verdict: "recommended" | "viable" | "contingency";
  hazards: Array<{ label: string; count: number; km: number }>;
  phases: [TraversePhaseStats, TraversePhaseStats];
  /** Phase handoff gate evaluated at the crater rim. */
  handoff: {
    dist_km: number;
    battery_pct: number;
    battery_threshold_pct: number;
    recharge_wait_h: number;
    battery_after_wait_pct: number;
    vfsd: number;
    vfsd_limit: number;
    pass: boolean;
  };
  battery_end_pct: number;
}

const ROUTE_DEFS: Array<[string, string, string, number, number]> = [
  // id, name, strategy, azimuth of start rim point, path-length factor
  ["R1", "Route α — SE saddle descent", "Shortest descent through the SE saddle; steepest mid-section.", 135, 1.0],
  ["R2", "Route β — W wall ramp", "Follows the natural wall ramp; longer but consistently gentle.", 270, 1.45],
  ["R3", "Route γ — N terrace switchback", "Switchbacks across the N terraces, maximum sunlit fraction.", 0, 1.8],
];

function fmtDuration(h: number) {
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
}

/**
 * Two-phase rover traverse options:
 *   Phase 1 — DIC3D-A* from the illuminated landing site up to the crater rim
 *             (terrain + distance + illumination + ice-probability cost, solar recharge available)
 *   Phase 2 — PPO-DRL, battery-gated, from the rim down into the shadowed sampling zone
 *             (no recharge inside the PSR, slip-safety model active)
 */
export function traverseRoutes(c: Crater): TraverseRoute[] {
  const rimKm = (c.diameter_km / 2) * 1.12;
  const floorDepthKm = c.depth_km;
  const HANDOFF_F = 0.36; // fraction of total path length reached at the rim
  const BATT_THRESHOLD = 65;

  return ROUTE_DEFS.map(([id, name, strategy, az, lenFactor], ri) => {
    const rnd = mulberry32(Math.round(c.diameter_km * 131) + ri * 7919 + c.crater_id.length);
    const a = (az * Math.PI) / 180;
    const startKm = rimKm * 1.52; // landing site out on the illuminated terrain
    const endKm = rimKm * 0.12; // shadowed sampling zone near the floor centre
    const start = offsetKm(c.lat, c.lon, Math.sin(a) * startKm, Math.cos(a) * startKm);
    const rimPt = offsetKm(c.lat, c.lon, Math.sin(a) * rimKm, Math.cos(a) * rimKm);
    const target = offsetKm(c.lat, c.lon, Math.sin(a) * endKm, Math.cos(a) * endKm);

    const n = 60;
    const total = +((startKm - endKm) * lenFactor).toFixed(2);
    const points: TraversePoint[] = [];
    let energy = 0;
    let battery = 100;
    const capacityWh = 2600;

    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const phase: 1 | 2 = f < HANDOFF_F ? 1 : 2;
      // radial distance from the crater centre, rim reached exactly at HANDOFF_F
      const radial =
        phase === 1
          ? startKm + ((rimKm - startKm) * f) / HANDOFF_F
          : rimKm + ((endKm - rimKm) * (f - HANDOFF_F)) / (1 - HANDOFF_F);
      // Lateral switchback amplitude grows with the length factor.
      const sway = Math.sin(f * Math.PI * (1 + ri)) * (lenFactor - 1) * rimKm * 0.22;
      const eastKm = Math.sin(a) * radial + Math.cos(a) * sway;
      const northKm = Math.cos(a) * radial - Math.sin(a) * sway;
      const p = offsetKm(c.lat, c.lon, eastKm, northKm);

      // Phase 1 climbs gently to the rim crest, phase 2 descends to the floor.
      const rimCrest = 0.35 + floorDepthKm * 0.06;
      const elev = +(
        (phase === 1
          ? -0.1 + (f / HANDOFF_F) * rimCrest
          : rimCrest -
            Math.sin(((f - HANDOFF_F) / (1 - HANDOFF_F)) * Math.PI * 0.5) *
              (rimCrest + floorDepthKm * 0.92)) +
        (rnd() - 0.5) * 0.04
      ).toFixed(3);

      const slope = +(
        2 +
        (phase === 1 ? 0.45 : 1) * Math.sin(f * Math.PI) * (c.avg_slope_deg / lenFactor) +
        rnd() * 3
      ).toFixed(1);

      const illumination =
        phase === 1
          ? +Math.max(
              22,
              (62 + 26 * (lenFactor - 1)) * (1 - (f / HANDOFF_F) * 0.35) - rnd() * 6,
            ).toFixed(0)
          : +Math.max(0, 30 * (1 - (f - HANDOFF_F) / (1 - HANDOFF_F)) ** 2 - rnd() * 4).toFixed(0);
      const temp_c = Math.round(-40 - (1 - illumination / 100) * 175 - rnd() * 8);
      const segKm = total / n;
      const draw = segKm * (46 + slope * 5.2 + (1 - illumination / 100) * 22);
      energy += draw;
      // Phase 1 recharges from sunlight; phase 2 has no solar input at all.
      const solar = phase === 1 ? segKm * (illumination / 100) * 58 : 0;
      battery = Math.max(4, Math.min(100, battery - ((draw - solar) / capacityWh) * 100));
      const slip_pct = +Math.min(46, 4 + slope * 1.5 + c.roughness_index * 9 + rnd() * 4).toFixed(1);

      points.push({
        i,
        dist: +(f * total).toFixed(3),
        elev,
        slope,
        lat: +p.lat.toFixed(4),
        lon: +((((p.lon + 540) % 360) - 180)).toFixed(4),
        illumination,
        temp_c,
        cumulative_wh: Math.round(energy),
        phase,
        battery_pct: +battery.toFixed(1),
        slip_pct,
        elev_p1: phase === 1 ? elev : null,
        elev_p2: phase === 2 ? elev : null,
      });
    }

    // Rim handoff: top up the battery in sunlight before committing to the PSR.
    const handoffIdx = points.findIndex((p) => p.phase === 2);
    const handoffPt = points[Math.max(0, handoffIdx - 1)]!;
    const rechargeWait = +Math.max(0, ((100 - handoffPt.battery_pct) / 100) * 14 + 1.5).toFixed(1);
    const vfsd = +Math.min(
      0.62,
      c.roughness_index * 0.22 + (c.avg_slope_deg / 40) * 0.3 + rnd() * 0.08,
    ).toFixed(2);
    // Phase 2 restarts from the topped-up battery.
    const p2Start = 100;
    const p2Points = points.filter((p) => p.phase === 2);
    const p1Points = points.filter((p) => p.phase === 1);
    let b2 = p2Start;
    p2Points.forEach((p, k) => {
      const prev = k === 0 ? handoffPt.cumulative_wh : p2Points[k - 1]!.cumulative_wh;
      b2 = Math.max(3, b2 - ((p.cumulative_wh - prev) / capacityWh) * 100);
      p.battery_pct = +b2.toFixed(1);
    });

    const stat = (
      arr: TraversePoint[],
      phase: 1 | 2,
      planner: string,
      label: string,
      note: string,
      battStart: number,
    ): TraversePhaseStats => {
      const km = +(arr[arr.length - 1]!.dist - arr[0]!.dist).toFixed(2);
      const av = +(arr.reduce((s, p) => s + p.slope, 0) / arr.length).toFixed(1);
      const wh = Math.round(arr[arr.length - 1]!.cumulative_wh - arr[0]!.cumulative_wh);
      const hrs = +(km / (0.06 + 0.02 * (1 - av / 25))).toFixed(1);
      return {
        phase,
        planner,
        label,
        km,
        avg_slope: av,
        max_slope: +Math.max(...arr.map((p) => p.slope)).toFixed(1),
        drive_hours: hrs,
        duration: fmtDuration(hrs),
        energy_wh: wh,
        sunlit_pct: Math.round((arr.filter((p) => p.illumination > 15).length / arr.length) * 100),
        min_temp_c: Math.min(...arr.map((p) => p.temp_c)),
        battery_start_pct: battStart,
        battery_end_pct: arr[arr.length - 1]!.battery_pct,
        note,
      };
    };

    const avg = +(points.reduce((s, p) => s + p.slope, 0) / points.length).toFixed(1);
    const max = +Math.max(...points.map((p) => p.slope)).toFixed(1);
    const sunlit = points.filter((p) => p.illumination > 15).length / points.length;
    const speed = 0.06 + 0.02 * (1 - avg / 25); // km/h, slope-derated
    const driveHours = +(total / speed).toFixed(1);
    const energy_wh = Math.round(energy);
    const hazards = [
      { label: "Steep slope (> 20°)", count: 1 + Math.floor(rnd() * 3), km: +(total * (0.2 + rnd() * 0.5)).toFixed(2) },
      { label: "Boulder field", count: 1 + Math.floor(rnd() * 4), km: +(total * (0.1 + rnd() * 0.7)).toFixed(2) },
      { label: "Slip-risk zone (> 25% slip)", count: 1 + Math.floor(rnd() * 3), km: +(total * (0.45 + rnd() * 0.5)).toFixed(2) },
      { label: "Secondary craters", count: 2 + Math.floor(rnd() * 5), km: +(total * (0.15 + rnd() * 0.6)).toFixed(2) },
    ];
    const hazard_count = hazards.reduce((s, h) => s + h.count, 0);
    const slip = +Math.max(...points.map((p) => p.slip_pct)).toFixed(1);
    const risk = +Math.min(
      0.97,
      (max / 30) * 0.34 + (hazard_count / 20) * 0.26 + (1 - sunlit) * 0.22 + (slip / 100) * 0.18,
    ).toFixed(2);
    const battery_end_pct = points[points.length - 1]!.battery_pct;

    return {
      id: `${c.crater_id}-${id}`,
      name,
      strategy,
      points,
      from: { lat: +start.lat.toFixed(3), lon: +((((start.lon + 540) % 360) - 180)).toFixed(3) },
      rim: { lat: +rimPt.lat.toFixed(3), lon: +((((rimPt.lon + 540) % 360) - 180)).toFixed(3) },
      to: { lat: +target.lat.toFixed(3), lon: +((((target.lon + 540) % 360) - 180)).toFixed(3) },
      total_km: total,
      avg_slope: avg,
      max_slope: max,
      duration: fmtDuration(driveHours),
      drive_hours: driveHours,
      sols: +Math.max(1, driveHours / 12).toFixed(1),
      energy_wh,
      energy_margin_pct: Math.round(Math.max(2, 100 - (energy_wh / capacityWh) * 100)),
      sunlit_pct: Math.round(sunlit * 100),
      shadow_km: +(total * (1 - sunlit)).toFixed(2),
      comms_pct: Math.round(48 + sunlit * 44 - rnd() * 8),
      min_temp_c: Math.min(...points.map((p) => p.temp_c)),
      regolith_bearing_kpa: +(18 + rnd() * 26).toFixed(1),
      slip_risk_pct: slip,
      hazard_count,
      risk_score: risk,
      verdict: risk < 0.4 ? "recommended" : risk < 0.6 ? "viable" : "contingency",
      hazards,
      phases: [
        stat(
          p1Points,
          1,
          "DIC3D-A*",
          "Landing site → crater rim",
          "Illumination-constrained spatio-temporal A*: cost = terrain + distance + illumination + ice-probability; solar recharge available throughout.",
          100,
        ),
        stat(
          p2Points,
          2,
          "PPO-DRL (battery-gated)",
          "Crater rim → shadowed sampling zone",
          "Battery-gated PPO policy inside the PSR: no solar input, slip-safety model derates speed on rough, steep regolith.",
          p2Start,
        ),
      ],
      handoff: {
        dist_km: handoffPt.dist,
        battery_pct: handoffPt.battery_pct,
        battery_threshold_pct: BATT_THRESHOLD,
        recharge_wait_h: rechargeWait,
        battery_after_wait_pct: p2Start,
        vfsd,
        vfsd_limit: 0.3,
        pass: p2Start >= BATT_THRESHOLD && vfsd < 0.3,
      },
      battery_end_pct,
    };
  });
}

/* ---------------------------------------------------------------------------
 * Objective 1 — Ice Probability Score (KDE likelihood ratio + spatial coherence)
 * ------------------------------------------------------------------------- */
export interface IpsBreakdown {
  p_ice: number;
  p_nonice: number;
  likelihood_ratio: number;
  base_ips: number;
  coherence: number;
  ips: number;
  threshold: number;
  pass: boolean;
  ice_pixels: number;
  total_pixels: number;
  multilook: string;
}

export function ipsBreakdown(c: Crater): IpsBreakdown {
  const rnd = mulberry32(Number(c.crater_id.slice(2)) * 3571 + 11);
  const p_ice = +Math.min(0.99, 0.12 + c.ice_probability * 0.85).toFixed(3);
  const p_nonice = +Math.max(0.01, 1 - p_ice - rnd() * 0.06).toFixed(3);
  const lr = +(p_ice / p_nonice).toFixed(2);
  const base = lr / (1 + lr);
  const coherence = +Math.min(0.98, 0.35 + c.ice_probability * 0.55 + rnd() * 0.06).toFixed(2);
  const ips = +Math.min(0.99, base * (0.78 + coherence * 0.28)).toFixed(2);
  const total = 40000 + Math.round(c.diameter_km * 1800);
  return {
    p_ice,
    p_nonice,
    likelihood_ratio: lr,
    base_ips: +base.toFixed(2),
    coherence,
    ips,
    threshold: 0.7,
    pass: ips > 0.7,
    ice_pixels: Math.round(total * c.ice_probability * 0.42),
    total_pixels: total,
    multilook: "5 × 5",
  };
}

/* ---------------------------------------------------------------------------
 * Objective 4 — dielectric retrieval (IEM → ANN ensemble → LLL mixing)
 * ------------------------------------------------------------------------- */
export interface DielectricSubModel {
  name: string;
  roughness: string;
  epsilon: number;
  weight: number;
  rmse: number;
}

export interface VolumeScenario {
  key: "conservative" | "nominal" | "optimistic";
  label: string;
  ice_layer_depth_m: number;
  porosity: number;
  ice_volume_fraction: number;
  volume_m3: number;
  volume_sigma_m3: number;
  mass_kg: number;
  mass_sigma_kg: number;
}

export const RHO_ICE = 917; // kg/m³

export function dielectricEnsemble(c: Crater): {
  models: DielectricSubModel[];
  epsilon: number;
  epsilon_sigma: number;
  ice_volume_fraction: number;
  validation: string;
} {
  const rnd = mulberry32(Number(c.crater_id.slice(2)) * 8191 + 5);
  const base = 2.6 + c.ice_probability * 0.9;
  const defs: Array<[string, string]> = [
    ["ANN-2D-G", "2D Gaussian"],
    ["ANN-3D-G", "3D Gaussian"],
    ["ANN-2D-E", "2D Exponential"],
    ["ANN-3D-E", "3D Exponential"],
  ];
  const raw = defs.map(([name, roughness]) => ({
    name,
    roughness,
    epsilon: +(base + (rnd() - 0.5) * 0.5).toFixed(2),
    weight: +(0.15 + rnd() * 0.2).toFixed(2),
    rmse: +(0.06 + rnd() * 0.09).toFixed(3),
  }));
  const wsum = raw.reduce((s, m) => s + m.weight, 0);
  const models = raw.map((m) => ({ ...m, weight: +(m.weight / wsum).toFixed(2) }));
  const epsilon = +models.reduce((s, m) => s + m.epsilon * m.weight, 0).toFixed(2);
  const spread = Math.max(...models.map((m) => m.epsilon)) - Math.min(...models.map((m) => m.epsilon));
  // LLL (Looyenga–Landau–Lifshitz) inversion for the ice volume fraction.
  const eps_ice = 3.15;
  const eps_reg = 2.3;
  const f = (Math.cbrt(epsilon) - Math.cbrt(eps_reg)) / (Math.cbrt(eps_ice) - Math.cbrt(eps_reg));
  return {
    models,
    epsilon,
    epsilon_sigma: +(spread / 2).toFixed(2),
    ice_volume_fraction: +Math.max(0.02, Math.min(0.92, f)).toFixed(3),
    validation: "Apollo 17 ALSE / LRO Mini-RF proxies",
  };
}

/** Conservative / nominal / optimistic ice volume + mass, each with uncertainty. */
export function volumeScenarios(c: Crater): VolumeScenario[] {
  const ens = dielectricEnsemble(c);
  const areaM2 = (c.volume_estimate_m3 / c.ice_layer_depth_m) * 1.0; // ice-positive floor area
  const defs: Array<[VolumeScenario["key"], string, number, number, number, number]> = [
    // key, label, depth factor, porosity, fraction factor, sigma factor
    ["conservative", "Conservative", 0.55, 0.52, 0.68, 0.3],
    ["nominal", "Nominal", 1.0, 0.42, 1.0, 0.2],
    ["optimistic", "Optimistic", 1.7, 0.32, 1.28, 0.26],
  ];
  return defs.map(([key, label, dF, porosity, fF, sF]) => {
    const depth = +(c.ice_layer_depth_m * dF).toFixed(1);
    const frac = +Math.min(0.95, ens.ice_volume_fraction * fF).toFixed(3);
    const volume = Math.round(areaM2 * depth * frac * (1 - porosity * 0.35));
    const sigma = Math.round(volume * sF);
    return {
      key,
      label,
      ice_layer_depth_m: depth,
      porosity: +porosity.toFixed(2),
      ice_volume_fraction: frac,
      volume_m3: volume,
      volume_sigma_m3: sigma,
      mass_kg: Math.round(volume * RHO_ICE),
      mass_sigma_kg: Math.round(sigma * RHO_ICE),
    };
  });
}


/** Default (lowest-risk) traverse for a crater. */
export function traversePlan(c: Crater) {
  return [...traverseRoutes(c)].sort((a, b) => a.risk_score - b.risk_score)[0]!;
}

