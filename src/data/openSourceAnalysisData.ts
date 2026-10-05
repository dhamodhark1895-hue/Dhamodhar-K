import { DetectedBoundingBox, OpenSourceEngineBenchmark, ApplicationDomain } from '../types/reconstruction';

// Pre-configured open source software engine benchmarks
export const OPEN_SOURCE_ENGINES: OpenSourceEngineBenchmark[] = [
  {
    id: 'vyom-3dgs',
    name: 'VYOM-3DGS Engine',
    fullName: 'VYOM 3D Gaussian Splatting with Collinear SfM Priors',
    category: '3DGS & Radiance Fields',
    license: 'Apache 2.0',
    version: '2.4.0',
    singlePassSuitability: 'Optimal',
    fpsOrSpeed: '120+ FPS Rasterization',
    gpuMemoryMb: 3200,
    collinearDriftResistance: 'Optimal (EKF-GNSS Anchored)',
    keyFeature: 'Real-time differentiable Gaussian splatting with forward-overlap collinear regularization.',
    cliCommandSample: 'vyom3dgs-train --video input_flight.mp4 --prior-rtk gnss_imu.csv --sh_degree 3 --densify_grad_thresh 0.0002',
  },
  {
    id: 'colmap',
    name: 'COLMAP',
    fullName: 'COLMAP Structure-from-Motion & Multi-View Stereo',
    category: 'Structure-from-Motion',
    license: 'GPLv3',
    version: '3.9-dev',
    singlePassSuitability: 'High',
    fpsOrSpeed: '42s / 100 Keyframes',
    gpuMemoryMb: 5800,
    collinearDriftResistance: 'Good (Sequential Matcher with GPS)',
    keyFeature: 'Gold-standard bundle adjustment, SIFT GPU extraction, and non-linear metric refinement.',
    cliCommandSample: 'colmap feature_extractor --database_path db.db --image_path ./frames && colmap sequential_matcher --database_path db.db',
  },
  {
    id: 'opendronemap',
    name: 'OpenDroneMap (ODM)',
    fullName: 'OpenDroneMap / WebODM Open Source Drone Ecosystem',
    category: 'Drone Photogrammetry',
    license: 'GPLv3',
    version: '3.4.1',
    singlePassSuitability: 'Optimal',
    fpsOrSpeed: '52s / 100 Keyframes',
    gpuMemoryMb: 4800,
    collinearDriftResistance: 'Optimal (with RTK-EXIF / GCP CSV)',
    keyFeature: 'End-to-end aerial pipeline generating georeferenced orthophotos, DEMs, 3D textured OBJ meshes, and ASPRS point clouds.',
    cliCommandSample: 'docker run -ti --rm -v $(pwd)/images:/code/images -v $(pwd)/odm_orthophoto:/code/odm_orthophoto opendronemap/odm --feature-quality high --dsm --orthophoto-resolution 2.5',
  },
  {
    id: 'openmvg-openmvs',
    name: 'OpenMVG + OpenMVS',
    fullName: 'Open Multiple View Geometry & Open Multi-View Stereo',
    category: 'Dense Stereo & Meshing',
    license: 'MPL 2.0',
    version: '2.1 / 2.0',
    singlePassSuitability: 'Optimal',
    fpsOrSpeed: '38s / 100 Keyframes',
    gpuMemoryMb: 4200,
    collinearDriftResistance: 'Optimal (Linear Global SfM)',
    keyFeature: 'Linear Global Structure-from-Motion specifically resilient to unidirectional single-pass tracks.',
    cliCommandSample: 'openMVG_main_SfM --sfm_engine GLOBAL -i ./matches/sfm_data.json -m ./matches -o ./reconstruction',
  },
  {
    id: 'cloudcompare',
    name: 'CloudCompare',
    fullName: 'CloudCompare 3D Point Cloud and Mesh Processing',
    category: 'Point Cloud M3C2',
    license: 'GPLv3',
    version: '2.13.2',
    singlePassSuitability: 'Specialized',
    fpsOrSpeed: 'Instantaneous M3C2 (<2s)',
    gpuMemoryMb: 1800,
    collinearDriftResistance: 'Benchmark Standard (GCP Comparison)',
    keyFeature: 'Multiscale Model to Model Cloud Comparison (M3C2) for sub-centimeter deviation testing.',
    cliCommandSample: 'CloudCompare -SILENT -O reconstructed.las -O surveyed_gcps.las -C2C_DIST -AUTO_SAVE OFF',
  },
  {
    id: 'qgis-gdal',
    name: 'QGIS / GDAL / PDAL',
    fullName: 'Geospatial Data Abstraction Library & Point Data Abstraction',
    category: 'Geospatial GIS',
    license: 'MIT',
    version: 'GDAL 3.9 / PDAL 2.7',
    singlePassSuitability: 'High',
    fpsOrSpeed: 'Streaming Pipeline',
    gpuMemoryMb: 1200,
    collinearDriftResistance: 'Rigid Projection Transformed',
    keyFeature: 'Georeferencing into EPSG/UTM coordinate systems, digital elevation model rasterization, and LAS 1.4 classification.',
    cliCommandSample: 'pdal pipeline -i las_classify_pipeline.json --writers.gdal.resolution=0.02',
  },
  {
    id: 'meshroom',
    name: 'AliceVision Meshroom',
    fullName: 'AliceVision Photogrammetric Computer Vision Framework',
    category: 'Structure-from-Motion',
    license: 'MPL 2.0',
    version: '2023.3.0',
    singlePassSuitability: 'Good',
    fpsOrSpeed: '65s / 100 Keyframes',
    gpuMemoryMb: 6200,
    collinearDriftResistance: 'Moderate (Requires CCTAG / GCPs)',
    keyFeature: 'Node-graph photogrammetry pipeline with nodal inspection of DepthMap and Texturing.',
    cliCommandSample: 'meshroom_batch --input ./keyframes --output ./meshroom_out --pipeline single_pass_corridor.mg',
  },
];

// AI Detector Comparative Specs: YOLOv8 vs. Faster R-CNN
export const AI_DETECTOR_SPECS = {
  yolov8: {
    name: 'YOLOv8 (Ultralytics)',
    architecture: 'Single-Stage Anchor-Free CSPDarknet + C2f with Dual Path PAN-FPN',
    speedMs: '6.4 ms / frame (156 FPS)',
    mAP50_95: '53.9% (COCO / VisDrone Aerial)',
    strengths: 'Real-time dynamic object suppression (vehicles, pedestrians), low latency, edge deployment on drone companion computer.',
    primaryRole: 'Live masking of dynamic objects to prevent ghosting artifacts in 3DGS radiance field optimization.',
  },
  fasterRcnn: {
    name: 'Faster R-CNN (ResNet-50-FPN)',
    architecture: 'Two-Stage Region Proposal Network (RPN) with RoIAlign & Feature Pyramid Networks',
    speedMs: '48.2 ms / frame (21 FPS)',
    mAP50_95: '58.4% (Aerial Mensuration Benchmark)',
    strengths: 'Sub-millimeter bounding box precision, dense small-object detection (cracks, spalls, insulators, small artifacts).',
    primaryRole: 'High-precision defect mensuration and tactical target identification for detailed spatial cataloging.',
  },
};

// Scenario-specific AI Detections (YOLOv8 & Faster R-CNN)
export function getScenarioDetections(domain: ApplicationDomain, activeIndex: number): DetectedBoundingBox[] {
  const t = activeIndex % 8;

  switch (domain) {
    case 'border-strategic-mapping':
      return [
        {
          id: `det-b1-${t}`,
          label: 'Patrol Vehicle (APC)',
          confidence: 0.95,
          box: { top: 62 + Math.sin(t) * 2, left: 45 + Math.cos(t) * 3, width: 14, height: 10 },
          model: 'yolov8',
          isDynamic: true,
          classCategory: 'vehicle',
        },
        {
          id: `det-b2-${t}`,
          label: 'Observation Watchtower',
          confidence: 0.98,
          box: { top: 22, left: 68, width: 16, height: 35 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'military_asset',
        },
        {
          id: `det-b3-${t}`,
          label: 'Security Fence Razor Wire',
          confidence: 0.92,
          box: { top: 48, left: 10, width: 78, height: 8 },
          model: 'yolov8',
          isDynamic: false,
          classCategory: 'military_asset',
        },
      ];

    case 'disaster-damage-assessment':
      return [
        {
          id: `det-d1-${t}`,
          label: 'Structural Span Fracture',
          confidence: 0.97,
          box: { top: 38, left: 42, width: 22, height: 26 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'structural_damage',
        },
        {
          id: `det-d2-${t}`,
          label: 'Riverbed Debris Rubble (4,180 m³)',
          confidence: 0.93,
          box: { top: 64, left: 34, width: 32, height: 20 },
          model: 'yolov8',
          isDynamic: false,
          classCategory: 'structural_damage',
        },
        {
          id: `det-d3-${t}`,
          label: 'Eroded Pier Foundation',
          confidence: 0.91,
          box: { top: 44, left: 24, width: 15, height: 18 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'structural_damage',
        },
      ];

    case 'urban-planning-smart-cities':
      return [
        {
          id: `det-u1-${t}`,
          label: 'Moving Transit Bus [Dynamic Masked]',
          confidence: 0.96,
          box: { top: 65, left: 28 + (t * 4) % 40, width: 18, height: 12 },
          model: 'yolov8',
          isDynamic: true,
          classCategory: 'vehicle',
        },
        {
          id: `det-u2-${t}`,
          label: 'Moving Sedan [Dynamic Masked]',
          confidence: 0.94,
          box: { top: 72, left: 52 - (t * 3) % 35, width: 12, height: 9 },
          model: 'yolov8',
          isDynamic: true,
          classCategory: 'vehicle',
        },
        {
          id: `det-u3-${t}`,
          label: 'Rooftop Solar Array',
          confidence: 0.97,
          box: { top: 18, left: 16, width: 25, height: 18 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'infrastructure_defect',
        },
      ];

    case 'infrastructure-inspection':
      return [
        {
          id: `det-i1-${t}`,
          label: 'Concrete Spalling & Micro-Crack',
          confidence: 0.98,
          box: { top: 48, left: 54, width: 12, height: 14 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'infrastructure_defect',
        },
        {
          id: `det-i2-${t}`,
          label: 'High-Voltage Pylon Crossarm',
          confidence: 0.95,
          box: { top: 12, left: 66, width: 26, height: 28 },
          model: 'yolov8',
          isDynamic: false,
          classCategory: 'infrastructure_defect',
        },
        {
          id: `det-i3-${t}`,
          label: 'Catenary Conductor Wire (18.4m Clearance)',
          confidence: 0.91,
          box: { top: 28, left: 5, width: 88, height: 10 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'infrastructure_defect',
        },
      ];

    case 'construction-progress-monitoring':
      return [
        {
          id: `det-c1-${t}`,
          label: 'Tower Crane Jib & Hoist',
          confidence: 0.98,
          box: { top: 10, left: 45, width: 44, height: 35 },
          model: 'yolov8',
          isDynamic: false,
          classCategory: 'construction_equipment',
        },
        {
          id: `det-c2-${t}`,
          label: 'Level 14 Concrete Formwork Core',
          confidence: 0.96,
          box: { top: 28, left: 22, width: 28, height: 32 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'construction_equipment',
        },
        {
          id: `det-c3-${t}`,
          label: 'Stockpile Mound (+1,840 m³)',
          confidence: 0.92,
          box: { top: 62, left: 70, width: 22, height: 18 },
          model: 'yolov8',
          isDynamic: false,
          classCategory: 'construction_equipment',
        },
      ];

    case 'archaeological-documentation':
      return [
        {
          id: `det-a1-${t}`,
          label: 'Standing Fluted Peristyle Column',
          confidence: 0.97,
          box: { top: 24, left: 32, width: 14, height: 36 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'archaeological_relic',
        },
        {
          id: `det-a2-${t}`,
          label: 'Toppled Column Drum (Anastylosis Tag #4)',
          confidence: 0.94,
          box: { top: 62, left: 48, width: 16, height: 12 },
          model: 'yolov8',
          isDynamic: false,
          classCategory: 'archaeological_relic',
        },
        {
          id: `det-a3-${t}`,
          label: 'Stratigraphic Excavation Grid Trench',
          confidence: 0.96,
          box: { top: 58, left: 12, width: 24, height: 22 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'archaeological_relic',
        },
      ];

    case 'digital-twin-generation':
      return [
        {
          id: `det-dt1-${t}`,
          label: 'HVAC Chiller IoT Node (Online)',
          confidence: 0.98,
          box: { top: 22, left: 28, width: 15, height: 16 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'infrastructure_defect',
        },
        {
          id: `det-dt2-${t}`,
          label: 'Rooftop Photovoltaic Solar Array (248 kW)',
          confidence: 0.96,
          box: { top: 16, left: 52, width: 32, height: 22 },
          model: 'yolov8',
          isDynamic: false,
          classCategory: 'infrastructure_defect',
        },
        {
          id: `det-dt3-${t}`,
          label: 'Autonomous Delivery AGV [Tracked]',
          confidence: 0.93,
          box: { top: 74, left: 42 + (t * 3) % 25, width: 10, height: 8 },
          model: 'yolov8',
          isDynamic: true,
          classCategory: 'vehicle',
        },
      ];

    case 'military-recon-mission-planning':
    default:
      return [
        {
          id: `det-m1-${t}`,
          label: 'Communications Geodesic Radar Dome',
          confidence: 0.99,
          box: { top: 20, left: 52, width: 18, height: 18 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'military_asset',
        },
        {
          id: `det-m2-${t}`,
          label: 'Helicopter Landing Zone (LZ Green, Slope 3.8°)',
          confidence: 0.97,
          box: { top: 58, left: 18, width: 28, height: 24 },
          model: 'yolov8',
          isDynamic: false,
          classCategory: 'military_asset',
        },
        {
          id: `det-m3-${t}`,
          label: 'Hardened Command Bunker Revetment',
          confidence: 0.94,
          box: { top: 32, left: 46, width: 28, height: 22 },
          model: 'faster-rcnn',
          isDynamic: false,
          classCategory: 'military_asset',
        },
      ];
  }
}
