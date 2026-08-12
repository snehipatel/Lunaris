import { Crater } from '../types/crater';
import { CRATERS as RAW_CRATERS } from '../lib/craters';

export const CRATERS_DATA: Crater[] = RAW_CRATERS.map(c => {
  const cls = c.classification === 'ice-positive' ? 'ICE_POSITIVE' : c.classification === 'ambiguous' ? 'AMBIGUOUS' : 'ICE_NEGATIVE';
  const conf = c.confidence >= 0.8 ? 'HIGH' : c.confidence >= 0.5 ? 'MEDIUM' : 'LOW';

  return {
    id: c.crater_id,
    name: c.name,
    lat: c.lat,
    lon: c.lon,
    area_km2: parseFloat((Math.PI * Math.pow(c.diameter_km / 2, 2)).toFixed(3)),
    perimeter_km: parseFloat((Math.PI * c.diameter_km).toFixed(2)),
    diameter_km: c.diameter_km,
    depth_km: c.depth_km,
    depthToDiameterRatio: c.d_ratio,
    cpr: c.cpr,
    dop: c.dop,
    iceProbability: parseFloat((c.ice_probability * 100).toFixed(1)),
    classification: cls,
    confidence: conf,
    backscatter: {
      sigmaHH: c.sigma0.hh,
      sigmaHV: c.sigma0.hv,
      sigmaVH: c.sigma0.vh,
      sigmaVV: c.sigma0.vv,
    },
    decomposition: {
      entropy: c.entropy,
      alpha: c.alpha,
      anisotropy: 0.25,
      mChi: {
        volumetric: Math.round(c.m_chi * 100),
        surface: Math.round((1 - c.m_chi) * 80),
        doubleBounce: Math.round((1 - c.m_chi) * 20),
      },
    },
    volumeEstimate: {
      iceVolume_m3: c.volume_estimate_m3,
      iceMass_tons: Math.round(c.volume_estimate_m3 * 0.92),
      iceThickness_m: c.ice_layer_depth_m,
      purity_pct: 45,
    },
    morphometry: {
      circularityIndex: c.circularity_index,
      tri: c.roughness_index,
      maxSlope_deg: c.max_slope_deg,
      avgSlope_deg: c.avg_slope_deg,
      rimFreshness: c.rim_freshness.toUpperCase() as any,
      psrStatus: c.psr_status.toUpperCase().replace(/\s+/g, '_') as any,
    },
    landingRecommendation: {
      isRecommended: c.ice_probability > 0.7,
      landingLat: c.lat + 0.1,
      landingLon: c.lon - 0.1,
      landingElevation_m: -1500,
      rimIllumination_pct: 85,
      earthVisibility_pct: 90,
      accessibilityScore: Math.round(c.ice_probability * 100),
      rationale: 'High rim illumination and gentle slopes near shaded basin.',
    },
    roverTraverse: {
      totalDistance_km: 1.8,
      estimatedTime_hours: 2.4,
      maxSlope_deg: c.max_slope_deg,
      avgSlope_deg: c.avg_slope_deg,
      batteryRequired_wh: 450,
      waypoints: [
        { lat: c.lat + 0.1, lon: c.lon - 0.1, elevation_m: -1500, slope_deg: 5, distance_km: 0, illumination_pct: 85 },
        { lat: c.lat + 0.08, lon: c.lon - 0.08, elevation_m: -1600, slope_deg: 12, distance_km: 0.45, illumination_pct: 70 },
        { lat: c.lat + 0.05, lon: c.lon - 0.05, elevation_m: -1800, slope_deg: 18, distance_km: 0.9, illumination_pct: 40 },
        { lat: c.lat + 0.02, lon: c.lon - 0.02, elevation_m: -2000, slope_deg: 22, distance_km: 1.35, illumination_pct: 15 },
        { lat: c.lat, lon: c.lon, elevation_m: -2200, slope_deg: 8, distance_km: 1.8, illumination_pct: 0 },
      ],
    },
    provenance: {
      dfsarFile: c.dfsar_acquisition_id,
      dfsarMode: 'FULL_POLARIMETRIC_L_BAND',
      dfsarOrbit: c.dfsar_orbit,
      dfsarDate: c.dfsar_date,
      ohrcFile: c.ohrc_acquisition_id,
      ohrcRes_m: 0.25,
      pradanPortalUrl: 'https://pradan.issdc.gov.in/ch2',
      coverage_pct: 98,
      dataQualityGrade: 'GRADE_A',
    },
  };
});
