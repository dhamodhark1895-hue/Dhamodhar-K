export type RenderMode =
  | 'textured-mesh'
  | 'video-projection'
  | '3d-terrain'
  | 'georeferenced-map'
  | 'gaussian-splats'
  | 'point-cloud'
  | 'elevation-dsm'
  | 'wireframe'
  | 'confidence-map'
  | 'orthomosaic';

export type CameraViewPreset = 'perspective' | 'top-down' | 'oblique-north' | 'oblique-south' | 'drone-eye';

export type MeasurementMode = 'none' | 'distance' | 'height' | 'area' | 'elevation-profile';

export type AiDetectorModel = 'yolov8' | 'faster-rcnn' | 'ensemble' | 'none';

export interface DetectedBoundingBox {
  id: string;
  label: string;
  confidence: number;
  box: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  model: 'yolov8' | 'faster-rcnn';
  isDynamic: boolean;
  classCategory:
    | 'vehicle'
    | 'person'
    | 'infrastructure_defect'
    | 'military_asset'
    | 'archaeological_relic'
    | 'construction_equipment'
    | 'structural_damage';
}

export type OpenSourceSoftwareEngine =
  | 'vyom-3dgs'
  | 'colmap'
  | 'opendronemap'
  | 'openmvg-openmvs'
  | 'cloudcompare'
  | 'qgis-gdal'
  | 'meshroom';

export interface OpenSourceEngineBenchmark {
  id: OpenSourceSoftwareEngine;
  name: string;
  fullName: string;
  category: '3DGS & Radiance Fields' | 'Structure-from-Motion' | 'Drone Photogrammetry' | 'Dense Stereo & Meshing' | 'Point Cloud M3C2' | 'Geospatial GIS';
  license: 'Apache 2.0' | 'GPLv3' | 'MPL 2.0' | 'MIT';
  version: string;
  singlePassSuitability: 'Optimal' | 'High' | 'Good' | 'Specialized';
  fpsOrSpeed: string;
  gpuMemoryMb: number;
  collinearDriftResistance: string;
  keyFeature: string;
  cliCommandSample: string;
}

export type ApplicationDomain =
  | 'border-strategic-mapping'
  | 'disaster-damage-assessment'
  | 'urban-planning-smart-cities'
  | 'infrastructure-inspection'
  | 'construction-progress-monitoring'
  | 'archaeological-documentation'
  | 'digital-twin-generation'
  | 'military-recon-mission-planning';

export type ApplicationCategory =
  | 'Border & Strategic Area Mapping'
  | 'Disaster Damage Assessment'
  | 'Urban Planning & Smart Cities'
  | 'Infrastructure Inspection'
  | 'Construction Progress Monitoring'
  | 'Archaeological Documentation'
  | 'Digital Twin Generation'
  | 'Military Reconnaissance & Mission Planning';

export interface ApplicationDomainKpi {
  label: string;
  value: string;
  unit?: string;
  status: 'optimal' | 'warning' | 'critical' | 'info';
  note: string;
}

export interface ApplicationDomainTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  active: boolean;
  currentValue?: string;
  options?: string[];
}

export interface ApplicationModuleConfig {
  domainId: ApplicationDomain;
  title: string;
  romanNumeral: '(i)' | '(ii)' | '(iii)' | '(iv)' | '(v)' | '(vi)' | '(vii)' | '(viii)';
  category: ApplicationCategory;
  iconName: string;
  summary: string;
  operationalContext: string;
  standards: string[];
  kpis: ApplicationDomainKpi[];
  domainTools: ApplicationDomainTool[];
  exportRecommendations: string[];
}

export interface TelemetryFrame {
  frameIndex: number;
  timeSec: number;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  relativeAltMeters: number;
  speedMps: number;
  headingDeg: number;
  gimbalPitchDeg: number;
  gimbalRollDeg: number;
  gimbalYawDeg: number;
  imuRoll: number;
  imuPitch: number;
  imuYaw: number;
  rtkStatus: 'RTK_FIXED' | 'RTK_FLOAT' | 'STANDALONE';
  satellites: number;
  hdop: number;
  vdop: number;
  detectedFeatures: number;
  blurIndex: number; // 0 (crisp) to 1 (blurry)
  dynamicObjectsMasked: number;
}

export interface GroundControlPoint {
  id: string;
  name: string;
  surveyedX: number; // local meters or UTM
  surveyedY: number;
  surveyedZ: number;
  reconstructedX: number;
  reconstructedY: number;
  reconstructedZ: number;
  lat: number;
  lon: number;
  deltaXCm: number;
  deltaYCm: number;
  deltaZCm: number;
  totalErrorCm: number;
  isCheckPoint: boolean; // Control vs Check
}

export interface ReconstructionPipelineStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  durationSec: number;
  metrics: Record<string, string | number>;
  outputSummary?: string;
}

export interface MissionScenario {
  id: string;
  title: string;
  romanNumeral?: '(i)' | '(ii)' | '(iii)' | '(iv)' | '(v)' | '(vi)' | '(vii)' | '(viii)';
  applicationDomain: ApplicationDomain;
  applicationConfig: ApplicationModuleConfig;
  category: ApplicationCategory | 'Urban Infrastructure' | 'Disaster Emergency' | 'Tactical & Border Recon';
  description: string;
  flightPathType: 'Linear Oblique Single-Pass' | 'Gentle Arc Over Corridor' | 'Highway Low-Alt Pass';
  flightAltitudeMeters: number;
  flightLengthMeters: number;
  flightDurationSec: number;
  cameraModel: string;
  sensorResolution: string;
  focalLengthMm: number;
  estimatedGsdCm: number;
  baseCoordinates: {
    lat: number;
    lon: number;
    utmZone: string;
  };
  keyHighlights: string[];
  telemetryStream: TelemetryFrame[];
  gcps: GroundControlPoint[];
  videoThumbnail: string;
}

export interface AiAnalysisResult {
  feasibilityScore: number;
  predictedGsdCm: number;
  estimatedHorizontalAccuracyCm: number;
  estimatedVerticalAccuracyCm: number;
  reconstructionCompletenessPercent: number;
  bundleAdjustmentStability: 'Optimal' | 'Good' | 'Marginal' | 'High Drift Risk';
  keyObservations: string[];
  occlusionAnalysis: {
    identifiedOccludedZones: string[];
    inpaintingMethodology: string;
    confidenceInterval: string;
  };
  gcpResidualEstimates: {
    gcpId: string;
    deltaXCm: number;
    deltaYCm: number;
    deltaZCm: number;
    status: 'Sub-Centimeter' | 'Acceptable' | 'Outlier Warning';
  }[];
  technicalRecommendations: string[];
  scientificSummary: string;
}

export interface MeasurementRecord {
  id: string;
  type: 'distance' | 'height' | 'area';
  label: string;
  value: number; // meters or square meters
  unit: string;
  points: [number, number, number][];
  color: string;
}
