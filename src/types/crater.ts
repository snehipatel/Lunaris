export type ClassificationType = 'ICE_POSITIVE' | 'AMBIGUOUS' | 'ICE_NEGATIVE';
export type ConfidenceType = 'HIGH' | 'MEDIUM' | 'LOW';
export type PSRStatusType = 'DOUBLY_SHADOWED' | 'PERMANENTLY_SHADOWED' | 'PARTIALLY_SHADOWED';
export type RimFreshnessType = 'FRESH' | 'MODERATE' | 'DEGRADED';

export interface PolarimetricDecomposition {
  entropy: number;
  alpha: number;
  anisotropy: number;
  mChi: {
    volumetric: number;
    surface: number;
    doubleBounce: number;
  };
}

export interface BackscatterSigma {
  sigmaHH: number;
  sigmaHV: number;
  sigmaVH: number;
  sigmaVV: number;
}

export interface IceVolumeEstimate {
  iceVolume_m3: number;
  iceMass_tons: number;
  iceThickness_m: number;
  purity_pct: number;
}

export interface Morphometry {
  circularityIndex: number;
  tri: number;
  maxSlope_deg: number;
  avgSlope_deg: number;
  rimFreshness: RimFreshnessType;
  psrStatus: PSRStatusType;
}

export interface TraverseWaypoint {
  lat: number;
  lon: number;
  elevation_m: number;
  slope_deg: number;
  distance_km: number;
  illumination_pct: number;
  hazardType?: 'STEEP_SLOPE' | 'BOULDER_FIELD' | 'THERMAL_COLD_TRAP' | 'COMMS_SHADOW';
  description?: string;
}

export interface RoverTraversePlan {
  totalDistance_km: number;
  estimatedTime_hours: number;
  maxSlope_deg: number;
  avgSlope_deg: number;
  batteryRequired_wh: number;
  waypoints: TraverseWaypoint[];
}

export interface LandingRecommendation {
  isRecommended: boolean;
  rank?: number;
  landingLat: number;
  landingLon: number;
  landingElevation_m: number;
  rimIllumination_pct: number;
  earthVisibility_pct: number;
  accessibilityScore: number;
  rationale: string;
}

export interface DataProvenance {
  dfsarFile: string;
  dfsarMode: string;
  dfsarOrbit: number;
  dfsarDate: string;
  ohrcFile: string;
  ohrcRes_m: number;
  pradanPortalUrl: string;
  coverage_pct: number;
  dataQualityGrade: string;
}

export interface Crater {
  id: string;
  name: string;
  lat: number;
  lon: number;
  area_km2: number;
  perimeter_km: number;
  diameter_km: number;
  depth_km: number;
  depthToDiameterRatio: number;
  cpr: number;
  dop: number;
  iceProbability: number;
  classification: ClassificationType;
  confidence: ConfidenceType;
  backscatter: BackscatterSigma;
  decomposition: PolarimetricDecomposition;
  volumeEstimate: IceVolumeEstimate;
  morphometry: Morphometry;
  landingRecommendation: LandingRecommendation;
  roverTraverse: RoverTraversePlan;
  provenance: DataProvenance;
}
