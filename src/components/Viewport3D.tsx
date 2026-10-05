import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RenderMode,
  CameraViewPreset,
  MeasurementMode,
  MeasurementRecord,
  GroundControlPoint,
  MissionScenario,
  TelemetryFrame,
} from '../types/reconstruction';
import {
  createBuildingFacadeTexture,
  createRoadTexture,
  createRoofTexture,
  createStoneRuinTexture,
  createConstructionConcreteTexture,
  createSolarGridTexture,
  createCamoDesertTexture,
  getHypsometricColor,
  createGeoreferencedMapTexture,
} from '../utils/sceneGeometry';
import {
  Layers,
  Eye,
  Crosshair,
  Maximize2,
  Minimize2,
  Compass,
  Ruler,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Mountain,
  Globe,
  Map,
  LocateFixed,
  Video,
  Play,
  Pause,
  Upload,
  Sliders,
  Scan,
  Radio,
  Sparkles,
} from 'lucide-react';

interface Viewport3DProps {
  scenario: MissionScenario;
  renderMode: RenderMode;
  cameraPreset: CameraViewPreset;
  measurementMode: MeasurementMode;
  activeTelemetryIndex: number;
  onSelectGcp?: (gcp: GroundControlPoint) => void;
  onAddMeasurement?: (measurement: MeasurementRecord) => void;
  measurements: MeasurementRecord[];
  onElevationProfileSampled?: (profileData: { distance: number; elevation: number }[]) => void;
  showFlightPath: boolean;
  showCameraFrustum: boolean;
  showOcclusionMap: boolean;
  customVideoUrl?: string | null;
  onUploadVideo?: (videoUrl: string) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  scenario,
  renderMode,
  cameraPreset,
  measurementMode,
  activeTelemetryIndex,
  onSelectGcp,
  onAddMeasurement,
  measurements,
  onElevationProfileSampled,
  showFlightPath,
  showCameraFrustum,
  showOcclusionMap,
  customVideoUrl,
  onUploadVideo,
  isPlaying = false,
  onTogglePlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Dynamic Scene Group References
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const pointCloudGroupRef = useRef<THREE.Group | null>(null);
  const splatsGroupRef = useRef<THREE.Group | null>(null);
  const aiDetectionGroupRef = useRef<THREE.Group | null>(null);
  const droneGroupRef = useRef<THREE.Group | null>(null);
  const frustumGroupRef = useRef<THREE.Group | null>(null);
  const flightPathLineRef = useRef<THREE.Line | null>(null);
  const gcpGroupRef = useRef<THREE.Group | null>(null);
  const measurementGroupRef = useRef<THREE.Group | null>(null);
  const georefGroupRef = useRef<THREE.Group | null>(null);
  const videoProjectionGroupRef = useRef<THREE.Group | null>(null);
  const groundQuadMeshRef = useRef<THREE.Mesh | null>(null);
  const projectionRaysRef = useRef<THREE.LineSegments | null>(null);

  // Drone Video 3D Texture & Projection Refs
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drone Video 3D Projection Mode Controls
  const [videoProjectionMode, setVideoProjectionMode] = useState<'ground' | 'surface' | 'pip'>('ground');
  const [videoProjectionOpacity, setVideoProjectionOpacity] = useState<number>(0.85);
  const [showVideoOverlayInModes, setShowVideoOverlayInModes] = useState<boolean>(true);
  const [showProjectionBeams, setShowProjectionBeams] = useState<boolean>(true);
  const [isPipMinimized, setIsPipMinimized] = useState<boolean>(false);
  const [showPipMonitor, setShowPipMonitor] = useState<boolean>(true);

  // AI Detections Viewport Toggle
  const [showAiBboxes, setShowAiBboxes] = useState<boolean>(true);

  // Georeferenced 3D Map Mode Controls
  const [georefMapLayer, setGeorefMapLayer] = useState<'satellite' | 'cadastral' | 'hybrid'>('satellite');
  const [showUtmGrid, setShowUtmGrid] = useState<boolean>(true);
  const [showSurveyBoundary, setShowSurveyBoundary] = useState<boolean>(true);

  // 3D Topographic Terrain Mode Controls
  const [terrainContourInterval, setTerrainContourInterval] = useState<number>(2.5);
  const [showTerrainContours, setShowTerrainContours] = useState<boolean>(true);
  const [showSlopeHeatmap, setShowSlopeHeatmap] = useState<boolean>(false);
  const [showTerrainTin, setShowTerrainTin] = useState<boolean>(false);
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(1.0);

  const terrainUniformsRef = useRef<{
    uMinElev: { value: number };
    uMaxElev: { value: number };
    uContourInterval: { value: number };
    uShowContours: { value: number };
    uSlopeHeatmap: { value: number };
    uVerticalExaggeration: { value: number };
    uSunDirection: { value: THREE.Vector3 };
  }>({
    uMinElev: { value: -12.0 },
    uMaxElev: { value: 65.0 },
    uContourInterval: { value: 2.5 },
    uShowContours: { value: 1.0 },
    uSlopeHeatmap: { value: 0.0 },
    uVerticalExaggeration: { value: 1.0 },
    uSunDirection: { value: new THREE.Vector3(120, 180, 80).normalize() },
  });

  // Measurement State
  const [clickPoints, setClickPoints] = useState<THREE.Vector3[]>([]);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; z: number } | null>(null);
  const [hoverGcp, setHoverGcp] = useState<GroundControlPoint | null>(null);

  // Camera Orbit Control State
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const sphericalRef = useRef({ radius: 140, theta: Math.PI / 4, phi: Math.PI / 3 });

  // Update Camera View according to Preset
  const applyCameraPreset = useCallback((preset: CameraViewPreset) => {
    if (!cameraRef.current) return;
    const target = cameraTargetRef.current;

    switch (preset) {
      case 'top-down':
        sphericalRef.current = { radius: 180, theta: 0, phi: 0.05 };
        break;
      case 'oblique-north':
        sphericalRef.current = { radius: 150, theta: 0, phi: Math.PI / 3.2 };
        break;
      case 'oblique-south':
        sphericalRef.current = { radius: 150, theta: Math.PI, phi: Math.PI / 3.2 };
        break;
      case 'perspective':
      default:
        sphericalRef.current = { radius: 140, theta: Math.PI / 4, phi: Math.PI / 3 };
        break;
    }

    const { radius, theta, phi } = sphericalRef.current;
    cameraRef.current.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    cameraRef.current.lookAt(target);
  }, []);

  useEffect(() => {
    if (cameraPreset !== 'drone-eye') {
      applyCameraPreset(cameraPreset);
    }
  }, [cameraPreset, applyCameraPreset]);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUploadVideo?.(url);
    }
  };

  // Set up HTML Video Element & Three.js VideoTexture for 3D Video Projection
  useEffect(() => {
    let video = videoElementRef.current;
    if (!video) {
      video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      videoElementRef.current = video;
    }

    const videoSrc = customVideoUrl || scenario.videoThumbnail || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    video.src = videoSrc;
    video.load();

    if (isPlaying) {
      video.play().catch(() => {});
    }

    if (!videoTextureRef.current) {
      const vTex = new THREE.VideoTexture(video);
      vTex.minFilter = THREE.LinearFilter;
      vTex.magFilter = THREE.LinearFilter;
      vTex.format = THREE.RGBAFormat;
      videoTextureRef.current = vTex;
    } else {
      videoTextureRef.current.image = video;
      videoTextureRef.current.needsUpdate = true;
    }

    // Update ground quad material map if already built
    if (groundQuadMeshRef.current) {
      const mat = groundQuadMeshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.map = videoTextureRef.current;
        mat.needsUpdate = true;
      }
    }
  }, [customVideoUrl, scenario.videoThumbnail]);

  // Sync HTML Video playback with isPlaying
  useEffect(() => {
    if (videoElementRef.current) {
      if (isPlaying) {
        videoElementRef.current.play().catch(() => {});
      } else {
        videoElementRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync Video time when activeTelemetryIndex updates
  useEffect(() => {
    if (videoElementRef.current && videoElementRef.current.duration) {
      const totalFrames = Math.max(1, scenario.telemetryStream.length - 1);
      const targetTime = (activeTelemetryIndex / totalFrames) * videoElementRef.current.duration;
      if (Math.abs(videoElementRef.current.currentTime - targetTime) > 0.6) {
        videoElementRef.current.currentTime = targetTime;
      }
    }
  }, [activeTelemetryIndex, scenario.telemetryStream.length]);

  // Sync opacity of ground quad
  useEffect(() => {
    if (groundQuadMeshRef.current) {
      const mat = groundQuadMeshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = videoProjectionOpacity;
        mat.needsUpdate = true;
      }
    }
  }, [videoProjectionOpacity]);

  // Sync projection rays visibility
  useEffect(() => {
    if (projectionRaysRef.current) {
      projectionRaysRef.current.visible = showProjectionBeams;
    }
  }, [showProjectionBeams]);

  // Construct 3D Scene Geometry for the active scenario
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#030712'); // Dark slate GIS background

    // Atmospheric fog for depth realism
    scene.fog = new THREE.FogExp2('#030712', 0.0018);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    cameraRef.current = camera;
    applyCameraPreset('perspective');

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    // Sun directional light (single-pass drone capture angle)
    const dirLight = new THREE.DirectionalLight(0xfff8e7, 1.4);
    dirLight.position.set(120, 180, 80);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    dirLight.shadow.camera.top = 120;
    dirLight.shadow.camera.bottom = -120;
    scene.add(dirLight);

    // Sky dome / ambient fill
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.45);
    scene.add(hemiLight);

    // Groups
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    const pointCloudGroup = new THREE.Group();
    scene.add(pointCloudGroup);
    pointCloudGroupRef.current = pointCloudGroup;

    const splatsGroup = new THREE.Group();
    splatsGroup.visible = false;
    scene.add(splatsGroup);
    splatsGroupRef.current = splatsGroup;

    const aiDetectionGroup = new THREE.Group();
    scene.add(aiDetectionGroup);
    aiDetectionGroupRef.current = aiDetectionGroup;

    const droneGroup = new THREE.Group();
    scene.add(droneGroup);
    droneGroupRef.current = droneGroup;

    const frustumGroup = new THREE.Group();
    scene.add(frustumGroup);
    frustumGroupRef.current = frustumGroup;

    const gcpGroup = new THREE.Group();
    scene.add(gcpGroup);
    gcpGroupRef.current = gcpGroup;

    const measurementGroup = new THREE.Group();
    scene.add(measurementGroup);
    measurementGroupRef.current = measurementGroup;

    const georefGroup = new THREE.Group();
    georefGroup.visible = false;
    scene.add(georefGroup);
    georefGroupRef.current = georefGroup;

    // Build 3D Georeferenced Overlays (UTM Grids, Boundary Geofence, Corner Benchmarks)
    buildGeoreferencedOverlays(scenario, georefGroup);

    // Build 3D Drone Video Projection Group
    const videoProjectionGroup = new THREE.Group();
    videoProjectionGroup.name = 'videoProjectionGroup';
    videoProjectionGroup.visible = renderMode === 'video-projection' || showVideoOverlayInModes;
    scene.add(videoProjectionGroup);
    videoProjectionGroupRef.current = videoProjectionGroup;

    buildVideoProjectionSystem(
      videoProjectionGroup,
      videoTextureRef,
      groundQuadMeshRef,
      projectionRaysRef,
      videoProjectionOpacity
    );

    // Build Scene Geometry depending on Scenario
    buildScenarioGeometry(scenario, meshGroup, pointCloudGroup, terrainUniformsRef, videoTextureRef);

    // Build 3D Gaussian Splats
    buildGaussianSplats(scenario, splatsGroup);

    // Build 3D AI Bounding Boxes (YOLOv8 & Faster R-CNN)
    updateAiDetectionsIn3D(scenario, activeTelemetryIndex, aiDetectionGroup, showAiBboxes);

    // Build GCP Markers
    buildGcpMarkers(scenario.gcps, gcpGroup);

    // Build Drone Model & Flight Path
    buildDroneAndFlightPath(scenario, scene, droneGroup, frustumGroup);

    // Coordinate Grid at terrain level
    const gridHelper = new THREE.GridHelper(300, 30, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [scenario, applyCameraPreset]);

  // Synchronize Drone Position & Camera Frustum with active Telemetry Index
  useEffect(() => {
    if (!droneGroupRef.current || !frustumGroupRef.current || !scenario.telemetryStream.length) return;
    const frame = scenario.telemetryStream[activeTelemetryIndex] || scenario.telemetryStream[0];

    // Compute local 3D position corresponding to flight path progress
    const t = activeTelemetryIndex / Math.max(1, scenario.telemetryStream.length - 1);
    const flightLength = scenario.flightLengthMeters * 0.45; // scale to 3D scene units

    // Flight direction based on heading
    const rad = ((frame.headingDeg - 90) * Math.PI) / 180;
    const startX = -Math.cos(rad) * (flightLength / 2);
    const startZ = -Math.sin(rad) * (flightLength / 2);
    const curX = startX + Math.cos(rad) * flightLength * t;
    const curZ = startZ + Math.sin(rad) * flightLength * t;
    const curY = frame.altitudeMeters * 0.7; // scaled altitude

    droneGroupRef.current.position.set(curX, curY, curZ);
    droneGroupRef.current.rotation.y = -rad + Math.PI / 2;

    // Pitch drone according to forward movement
    droneGroupRef.current.rotation.z = (frame.imuRoll * Math.PI) / 180;
    droneGroupRef.current.rotation.x = (frame.imuPitch * Math.PI) / 180;

    // Update camera frustum cone
    frustumGroupRef.current.position.set(curX, curY, curZ);
    frustumGroupRef.current.rotation.y = -rad + Math.PI / 2;
    frustumGroupRef.current.rotation.x = ((-frame.gimbalPitchDeg - 90) * Math.PI) / 180;

    // If Drone-Eye preset is chosen, attach camera to drone gimbal
    if (cameraPreset === 'drone-eye' && cameraRef.current) {
      cameraRef.current.position.set(curX, curY, curZ);
      const lookDist = 60;
      const pitchRad = (frame.gimbalPitchDeg * Math.PI) / 180;
      const targetLook = new THREE.Vector3(
        curX + Math.cos(rad) * lookDist * Math.cos(pitchRad),
        curY + lookDist * Math.sin(pitchRad),
        curZ + Math.sin(rad) * lookDist * Math.cos(pitchRad)
      );
      cameraRef.current.lookAt(targetLook);
    }

    // Update Ground Video Projection Footprint and Optical Rays in sync with drone position & gimbal pitch
    const pitchRadVal = (frame.gimbalPitchDeg * Math.PI) / 180;
    const groundLookDist = 55;
    const groundX = curX + Math.cos(rad) * groundLookDist * Math.cos(pitchRadVal);
    const groundZ = curZ + Math.sin(rad) * groundLookDist * Math.cos(pitchRadVal);

    if (groundQuadMeshRef.current) {
      groundQuadMeshRef.current.position.set(groundX, 0.25, groundZ);
      groundQuadMeshRef.current.rotation.y = -rad + Math.PI / 2;
    }

    if (projectionRaysRef.current) {
      const posAttr = projectionRaysRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const hw = 27.5;
      const hd = 18.0;
      const rotY = -rad + Math.PI / 2;
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);

      const localCorners = [
        [-hw, -hd],
        [hw, -hd],
        [hw, hd],
        [-hw, hd],
      ];

      let vIdx = 0;
      localCorners.forEach(([lx, lz]) => {
        const wx = groundX + lx * cosR - lz * sinR;
        const wz = groundZ + lx * sinR + lz * cosR;
        // Origin: drone camera gimbal
        posAttr.setXYZ(vIdx++, curX, curY - 0.9, curZ);
        // Destination: ground footprint corner
        posAttr.setXYZ(vIdx++, wx, 0.25, wz);
      });
      posAttr.needsUpdate = true;
    }
  }, [activeTelemetryIndex, scenario, cameraPreset]);

  // Keep 3D Terrain Shader Uniforms and Wireframe in sync with UI controls
  useEffect(() => {
    if (terrainUniformsRef.current) {
      terrainUniformsRef.current.uContourInterval.value = terrainContourInterval;
      terrainUniformsRef.current.uShowContours.value = showTerrainContours ? 1.0 : 0.0;
      terrainUniformsRef.current.uSlopeHeatmap.value = showSlopeHeatmap ? 1.0 : 0.0;
      terrainUniformsRef.current.uVerticalExaggeration.value = verticalExaggeration;
    }
    if (meshGroupRef.current) {
      meshGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.userData.isTerrain && child.userData.terrainMaterial) {
          const mat = child.userData.terrainMaterial as THREE.ShaderMaterial;
          mat.wireframe = showTerrainTin;
          mat.needsUpdate = true;
        }
      });
    }
  }, [terrainContourInterval, showTerrainContours, showSlopeHeatmap, showTerrainTin, verticalExaggeration]);

  // Toggle Georeferenced Map Grid and Geofence layers
  useEffect(() => {
    if (!georefGroupRef.current) return;
    const utmGrid = georefGroupRef.current.getObjectByName('utmGrid');
    if (utmGrid) utmGrid.visible = showUtmGrid;
    const boundary = georefGroupRef.current.getObjectByName('surveyBoundary');
    if (boundary) boundary.visible = showSurveyBoundary;
  }, [showUtmGrid, showSurveyBoundary]);

  // Update Render Mode (Textured Mesh vs Video Projection vs 3D Terrain vs Georef Map vs Gaussian Splats vs Point Cloud vs Elevation DSM vs Confidence vs Wireframe)
  useEffect(() => {
    if (!meshGroupRef.current || !pointCloudGroupRef.current) return;

    // Toggle 3D Video Projection Group (Ground footprint quad + optical rays)
    const isVideoMode = renderMode === 'video-projection';
    if (videoProjectionGroupRef.current) {
      videoProjectionGroupRef.current.visible = isVideoMode || showVideoOverlayInModes;
    }

    if (renderMode === 'point-cloud') {
      meshGroupRef.current.visible = false;
      pointCloudGroupRef.current.visible = true;
      if (splatsGroupRef.current) splatsGroupRef.current.visible = false;
      if (georefGroupRef.current) georefGroupRef.current.visible = false;
    } else if (renderMode === 'gaussian-splats') {
      meshGroupRef.current.visible = false;
      pointCloudGroupRef.current.visible = false;
      if (splatsGroupRef.current) splatsGroupRef.current.visible = true;
      if (georefGroupRef.current) georefGroupRef.current.visible = false;
    } else {
      pointCloudGroupRef.current.visible = false;
      if (splatsGroupRef.current) splatsGroupRef.current.visible = false;
      meshGroupRef.current.visible = true;
      if (georefGroupRef.current) {
        georefGroupRef.current.visible = renderMode === 'georeferenced-map';
      }

      // Apply shaders / material updates across all meshes in meshGroup
      meshGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          const origMat = m.userData.originalMaterial as THREE.Material;
          const elevationMat = m.userData.elevationMaterial as THREE.Material;
          const wireframeMat = m.userData.wireframeMaterial as THREE.Material;
          const confidenceMat = m.userData.confidenceMaterial as THREE.Material;
          const terrainMat = m.userData.terrainMaterial as THREE.Material;
          const structuralDtmMat = m.userData.structuralDtmMaterial as THREE.Material;
          const georefMat = m.userData.georefMaterial as THREE.Material;
          const cadastralMat = m.userData.cadastralFootprintMaterial as THREE.Material;
          const videoTerrainMat = m.userData.videoTerrainMaterial as THREE.Material;
          const videoStructuralMat = m.userData.videoStructuralMaterial as THREE.Material;

          if (renderMode === 'video-projection') {
            if (m.userData.isTerrain && videoTerrainMat && videoProjectionMode === 'surface') {
              m.material = videoTerrainMat;
            } else if (videoStructuralMat && videoProjectionMode === 'surface') {
              m.material = videoStructuralMat;
            } else if (origMat) {
              m.material = origMat;
            }
          } else if (renderMode === 'georeferenced-map') {
            if (m.userData.isTerrain && georefMat) {
              m.material = georefMat;
            } else if (cadastralMat) {
              m.material = cadastralMat;
            } else if (origMat) {
              m.material = origMat;
            }
          } else if (renderMode === '3d-terrain') {
            if (m.userData.isTerrain && terrainMat) {
              m.material = terrainMat;
            } else if (structuralDtmMat) {
              m.material = structuralDtmMat;
            } else if (origMat) {
              m.material = origMat;
            }
          } else if (renderMode === 'elevation-dsm' && elevationMat) {
            m.material = elevationMat;
          } else if (renderMode === 'wireframe' && wireframeMat) {
            m.material = wireframeMat;
          } else if (renderMode === 'confidence-map' && confidenceMat) {
            m.material = confidenceMat;
          } else if (origMat) {
            m.material = origMat;
          }
        }
      });
    }
  }, [renderMode, showVideoOverlayInModes, videoProjectionMode]);

  // Update 3D AI Bounding Boxes (YOLOv8 & Faster R-CNN)
  useEffect(() => {
    if (aiDetectionGroupRef.current) {
      updateAiDetectionsIn3D(scenario, activeTelemetryIndex, aiDetectionGroupRef.current, showAiBboxes);
    }
  }, [activeTelemetryIndex, scenario, showAiBboxes]);

  // Visibility toggles
  useEffect(() => {
    if (droneGroupRef.current) droneGroupRef.current.visible = showFlightPath;
    if (frustumGroupRef.current) frustumGroupRef.current.visible = showCameraFrustum;
    if (flightPathLineRef.current) flightPathLineRef.current.visible = showFlightPath;
  }, [showFlightPath, showCameraFrustum]);

  // Re-render measurement records into 3D scene
  useEffect(() => {
    if (!measurementGroupRef.current) return;
    const group = measurementGroupRef.current;
    group.clear();

    measurements.forEach((record) => {
      const pts = record.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      if (pts.length < 2) return;

      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: record.color || '#38bdf8',
        linewidth: 3,
        depthTest: false,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.renderOrder = 999;
      group.add(line);

      // Spherical vertex pins
      pts.forEach((pt) => {
        const sphereGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: record.color || '#38bdf8', depthTest: false });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.copy(pt);
        sphere.renderOrder = 1000;
        group.add(sphere);
      });
    });

    // Also draw active in-progress click points
    if (clickPoints.length > 0) {
      clickPoints.forEach((pt) => {
        const sphereGeo = new THREE.SphereGeometry(1.0, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: '#facc15', depthTest: false });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.copy(pt);
        sphere.renderOrder = 1000;
        group.add(sphere);
      });

      if (clickPoints.length > 1) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints(clickPoints);
        const lineMat = new THREE.LineDashedMaterial({
          color: '#facc15',
          dashSize: 2,
          gapSize: 1,
          depthTest: false,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        line.renderOrder = 999;
        group.add(line);
      }
    }
  }, [measurements, clickPoints]);

  // Handle Raycasting and Mouse Interaction (Orbit, Pan, Zoom, Measure)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
    } else if (e.button === 2) {
      isPanningRef.current = true;
    }
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (!containerRef.current || !cameraRef.current) return;

    // Raycast to find 3D point on mesh surface
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    if (sceneRef.current) {
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      const hit = intersects.find((i) => i.object.type === 'Mesh' && i.object.name !== 'frustum');
      if (hit) {
        setHoverCoord({
          x: parseFloat(hit.point.x.toFixed(2)),
          y: parseFloat(hit.point.y.toFixed(2)),
          z: parseFloat(hit.point.z.toFixed(2)),
        });

        // Check if hit a GCP
        if (hit.object.userData.isGcp && hit.object.userData.gcpData) {
          setHoverGcp(hit.object.userData.gcpData);
        } else {
          setHoverGcp(null);
        }
      } else {
        setHoverCoord(null);
        setHoverGcp(null);
      }
    }

    if (isDraggingRef.current && cameraPreset !== 'drone-eye') {
      // Orbit Camera
      sphericalRef.current.theta -= deltaX * 0.006;
      sphericalRef.current.phi = Math.max(0.08, Math.min(Math.PI / 2 - 0.02, sphericalRef.current.phi + deltaY * 0.006));

      const { radius, theta, phi } = sphericalRef.current;
      const target = cameraTargetRef.current;
      cameraRef.current.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      cameraRef.current.lookAt(target);
    } else if (isPanningRef.current && cameraPreset !== 'drone-eye') {
      // Pan Camera target
      const panSpeed = sphericalRef.current.radius * 0.001;
      const right = new THREE.Vector3();
      cameraRef.current.getWorldDirection(new THREE.Vector3());
      right.crossVectors(cameraRef.current.up, cameraRef.current.position.clone().sub(cameraTargetRef.current)).normalize();

      cameraTargetRef.current.addScaledVector(right, -deltaX * panSpeed);
      cameraTargetRef.current.y += deltaY * panSpeed;

      const { radius, theta, phi } = sphericalRef.current;
      const target = cameraTargetRef.current;
      cameraRef.current.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      cameraRef.current.lookAt(target);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    isPanningRef.current = false;

    // Measurement Click Handler (only if slight or zero mouse movement)
    if (measurementMode !== 'none' && containerRef.current && cameraRef.current && sceneRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      const hit = intersects.find((i) => i.object.type === 'Mesh' && i.object.name !== 'frustum');

      if (hit) {
        const pt = hit.point.clone();
        const nextPts = [...clickPoints, pt];

        if (measurementMode === 'distance' && nextPts.length === 2) {
          const d = nextPts[0].distanceTo(nextPts[1]);
          const record: MeasurementRecord = {
            id: `dist-${Date.now()}`,
            type: 'distance',
            label: `Distance: ${d.toFixed(2)} m (ΔZ: ${Math.abs(nextPts[1].y - nextPts[0].y).toFixed(2)} m)`,
            value: parseFloat(d.toFixed(2)),
            unit: 'm',
            points: nextPts.map((p) => [p.x, p.y, p.z]),
            color: '#38bdf8',
          };
          onAddMeasurement?.(record);
          setClickPoints([]);
        } else if (measurementMode === 'height' && nextPts.length === 2) {
          // Pure vertical height plumb line
          const verticalPt = new THREE.Vector3(nextPts[0].x, nextPts[1].y, nextPts[0].z);
          const h = Math.abs(nextPts[1].y - nextPts[0].y);
          const record: MeasurementRecord = {
            id: `height-${Date.now()}`,
            type: 'height',
            label: `Height: ${h.toFixed(2)} m`,
            value: parseFloat(h.toFixed(2)),
            unit: 'm',
            points: [
              [nextPts[0].x, nextPts[0].y, nextPts[0].z],
              [verticalPt.x, verticalPt.y, verticalPt.z],
            ],
            color: '#10b981',
          };
          onAddMeasurement?.(record);
          setClickPoints([]);
        } else if (measurementMode === 'elevation-profile' && nextPts.length === 2) {
          // Generate elevation profile sample points
          const samples: { distance: number; elevation: number }[] = [];
          const numSamples = 24;
          for (let s = 0; s <= numSamples; s++) {
            const alpha = s / numSamples;
            const samplePos = new THREE.Vector3().lerpVectors(nextPts[0], nextPts[1], alpha);
            const dist = nextPts[0].distanceTo(samplePos);
            samples.push({
              distance: parseFloat(dist.toFixed(2)),
              elevation: parseFloat(samplePos.y.toFixed(2)),
            });
          }
          onElevationProfileSampled?.(samples);
          setClickPoints([]);
        } else {
          setClickPoints(nextPts);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (cameraPreset === 'drone-eye' || !cameraRef.current) return;
    e.preventDefault();
    sphericalRef.current.radius = Math.max(15, Math.min(600, sphericalRef.current.radius + e.deltaY * 0.12));
    const { radius, theta, phi } = sphericalRef.current;
    const target = cameraTargetRef.current;
    cameraRef.current.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    cameraRef.current.lookAt(target);
  };

  return (
    <div
      className="relative w-full h-full select-none overflow-hidden bg-slate-950"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Real-time Surface Coordinates & GCP Hover HUD */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5 font-mono text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-slate-300 shadow-xl">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>
            {hoverCoord ? (
              <>
                <span className="text-cyan-400 font-bold">X:</span> {hoverCoord.x}m &nbsp;
                <span className="text-emerald-400 font-bold">Y (Elev):</span> {hoverCoord.y}m &nbsp;
                <span className="text-blue-400 font-bold">Z:</span> {hoverCoord.z}m
              </>
            ) : (
              <span className="text-slate-500">Surface Hover: [Aim at 3D geometry]</span>
            )}
          </span>
          <span className="ml-2 text-slate-500 border-l border-slate-700 pl-2">CRS: WGS84 / {scenario.baseCoordinates.utmZone}</span>
        </div>

        {/* Hovered GCP info */}
        {hoverGcp && (
          <div className="pointer-events-auto p-2.5 rounded-lg bg-slate-900/95 border border-cyan-500/60 shadow-2xl backdrop-blur-md text-xs max-w-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between font-bold text-cyan-400 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                {hoverGcp.name} ({hoverGcp.id})
              </span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {hoverGcp.isCheckPoint ? 'Check Point' : 'Control Point'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-slate-300 font-mono text-[11px]">
              <div>ΔX: <span className="text-emerald-400 font-semibold">{hoverGcp.deltaXCm > 0 ? `+${hoverGcp.deltaXCm}` : hoverGcp.deltaXCm} cm</span></div>
              <div>ΔY: <span className="text-emerald-400 font-semibold">{hoverGcp.deltaYCm > 0 ? `+${hoverGcp.deltaYCm}` : hoverGcp.deltaYCm} cm</span></div>
              <div>ΔZ (Vert): <span className="text-emerald-400 font-semibold">{hoverGcp.deltaZCm > 0 ? `+${hoverGcp.deltaZCm}` : hoverGcp.deltaZCm} cm</span></div>
              <div>3D RMSE: <span className="text-cyan-300 font-bold">{hoverGcp.totalErrorCm} cm</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Measurement Mode Prompt Banner */}
      {measurementMode !== 'none' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-cyan-950/90 border border-cyan-500/80 text-cyan-200 text-xs font-medium backdrop-blur-md shadow-2xl flex items-center gap-2">
          <Ruler className="w-4 h-4 text-cyan-400 animate-bounce" />
          <span>
            {measurementMode === 'distance' && `Click 2 points on the 3D surface to measure Euclidean Distance (${clickPoints.length}/2)`}
            {measurementMode === 'height' && `Click base and peak to measure Vertical Height (${clickPoints.length}/2)`}
            {measurementMode === 'elevation-profile' && `Click start and end points for Terrain Elevation Profile (${clickPoints.length}/2)`}
          </span>
          {clickPoints.length > 0 && (
            <button
              onClick={() => setClickPoints([])}
              className="ml-2 px-2 py-0.5 rounded bg-cyan-800 hover:bg-cyan-700 text-white text-[10px]"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Viewport Overlay Compass & Legend */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 backdrop-blur-md text-[11px] flex items-center gap-2 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>VYOM-3DGS ENGINE: GAUSSIAN SPLATTING & WEBGL2</span>
        </div>

        {/* Toggle AI Detections in 3D */}
        <button
          onClick={() => setShowAiBboxes(!showAiBboxes)}
          className={`pointer-events-auto px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-all shadow-md ${
            showAiBboxes
              ? 'bg-amber-950/90 text-amber-300 border border-amber-500/70'
              : 'bg-slate-900/90 text-slate-400 border border-slate-700 hover:text-white'
          }`}
          title="Toggle YOLOv8 and Faster R-CNN 3D spatial bounding boxes in viewport"
        >
          <span className={`w-2 h-2 rounded-full ${showAiBboxes ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
          <span>3D AI DETECTORS: {showAiBboxes ? 'YOLOv8 + R-CNN ON' : 'OFF'}</span>
        </button>

        {renderMode === 'gaussian-splats' && (
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-500/80 backdrop-blur-md text-xs flex flex-col gap-1.5 shadow-xl max-w-xs pointer-events-auto">
            <span className="font-semibold text-cyan-300 text-[11px] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              3D Gaussian Splats Active
            </span>
            <div className="text-[10px] text-slate-300 font-mono leading-relaxed">
              • 3D Covariance Ellipsoids (σx, σy, σz)<br />
              • Spherical Harmonics Radiance Field<br />
              • Real-time 120+ FPS Rasterization
            </div>
          </div>
        )}

        {/* Toggle Video Projection in Any Render Mode */}
        {renderMode !== 'video-projection' && (
          <button
            onClick={() => setShowVideoOverlayInModes(!showVideoOverlayInModes)}
            className={`pointer-events-auto px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-all shadow-md ${
              showVideoOverlayInModes
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/70'
                : 'bg-slate-900/90 text-slate-400 border border-slate-700 hover:text-white'
            }`}
            title="Toggle Drone Video 3D Projection rays and ground footprint on top of active 3D mode"
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>DRONE VIDEO PROJECTION: {showVideoOverlayInModes ? 'ACTIVE' : 'OFF'}</span>
          </button>
        )}

        {renderMode === 'video-projection' && (
          <div className="p-3 rounded-lg bg-slate-900/95 border border-cyan-500/70 backdrop-blur-md text-xs flex flex-col gap-2.5 shadow-2xl max-w-xs pointer-events-auto font-mono">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] uppercase tracking-wider">
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span>Drone Video 3D Projection</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                {customVideoUrl ? 'USER VIDEO' : 'PROJECTION'}
              </span>
            </div>

            {/* Video Source Info */}
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex flex-col gap-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>STREAM SOURCE:</span>
                <span className="text-emerald-400 font-bold">{customVideoUrl ? 'Custom Video (Active)' : 'Scenario Stream'}</span>
              </div>
              <div className="text-white font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Gimbal {scenario.cameraModel} ({scenario.focalLengthMm}mm)</span>
              </div>
              <div className="text-slate-400 text-[10px]">
                GIMBAL PITCH: <span className="text-cyan-300 font-bold">{(scenario.telemetryStream[activeTelemetryIndex]?.gimbalPitchDeg ?? -45).toFixed(1)}°</span>
              </div>
            </div>

            {/* Projection Mode */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 text-[10px]">Projection Mode:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                {[
                  { id: 'ground', label: 'Ground Quad' },
                  { id: 'surface', label: 'Surface Map' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setVideoProjectionMode(m.id as any)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                      videoProjectionMode === m.id ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Projection Opacity:</span>
                <span className="text-cyan-300 font-bold">{Math.round(videoProjectionOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={videoProjectionOpacity}
                onChange={(e) => setVideoProjectionOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
              <button
                onClick={() => setShowProjectionBeams(!showProjectionBeams)}
                className={`px-2 py-1 rounded text-[10px] border flex items-center justify-center gap-1 transition-colors ${
                  showProjectionBeams
                    ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>Beams: {showProjectionBeams ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowVideoOverlayInModes(!showVideoOverlayInModes)}
                className={`px-2 py-1 rounded text-[10px] border flex items-center justify-center gap-1 transition-colors ${
                  showVideoOverlayInModes
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
                title="Keep video projection visible when switching between 3D Terrain, Georef Map, Point Cloud, etc."
              >
                <span>All Modes: {showVideoOverlayInModes ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Upload or Change Video Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-200 text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3 h-3 text-cyan-400" />
              <span>{customVideoUrl ? 'Change Drone Video' : 'Upload Custom Drone Video'}</span>
            </button>

            {/* Footprint specs */}
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
              <span>FOOTPRINT: 55m × 36m (1,980m²)</span>
              <span className="text-cyan-400 font-semibold">{scenario.estimatedGsdCm} cm/px GSD</span>
            </div>
          </div>
        )}

        {renderMode === 'georeferenced-map' && (
          <div className="p-3 rounded-lg bg-slate-900/95 border border-cyan-500/70 backdrop-blur-md text-xs flex flex-col gap-2.5 shadow-2xl max-w-xs pointer-events-auto font-mono">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Georeferenced 3D Map</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                GIS ACTIVE
              </span>
            </div>

            {/* Coordinate Reference System (CRS) */}
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex flex-col gap-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>DATUM & PROJECTION:</span>
                <span className="text-cyan-400 font-bold">WGS84 / EPSG</span>
              </div>
              <div className="text-white font-bold">{scenario.baseCoordinates.utmZone}</div>
              <div className="text-slate-400 text-[10px]">
                ORIGIN: <span className="text-slate-200">{scenario.baseCoordinates.lat.toFixed(5)}°N, {scenario.baseCoordinates.lon.toFixed(5)}°W</span>
              </div>
            </div>

            {/* Real-Time Cursor Geodetic Coordinates */}
            <div className="flex flex-col gap-1">
              <div className="text-slate-400 text-[10px] flex items-center justify-between">
                <span>CURSOR 3D MENSURATION:</span>
                <span className="text-emerald-400 font-semibold">{scenario.estimatedGsdCm}cm GSD</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] text-slate-300 flex flex-col gap-0.5">
                {hoverCoord ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-cyan-400">LAT / LON:</span>
                      <span className="font-semibold text-white">
                        {(scenario.baseCoordinates.lat + (hoverCoord.z / 111139)).toFixed(6)}°, {(scenario.baseCoordinates.lon + (hoverCoord.x / (111139 * Math.cos(scenario.baseCoordinates.lat * Math.PI / 180)))).toFixed(6)}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400">LOCAL (X / Z):</span>
                      <span className="text-slate-200">{hoverCoord.x > 0 ? `+${hoverCoord.x}` : hoverCoord.x}m E, {hoverCoord.z > 0 ? `+${hoverCoord.z}` : hoverCoord.z}m N</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400">ELEVATION (ASL):</span>
                      <span className="text-emerald-300 font-bold">{(scenario.flightAltitudeMeters * 0.2 + hoverCoord.y).toFixed(2)} m</span>
                    </div>
                  </>
                ) : (
                  <span className="text-slate-500 italic">Hover crosshair over 3D map...</span>
                )}
              </div>
            </div>

            {/* Map Layer Mode Selector */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 text-[10px]">Map Style:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                {(['satellite', 'cadastral', 'hybrid'] as const).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setGeorefMapLayer(layer)}
                    className={`px-1.5 py-0.5 rounded text-[10px] capitalize transition-colors ${
                      georefMapLayer === layer
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>

            {/* GIS Layer Toggles */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
              <button
                onClick={() => setShowUtmGrid(!showUtmGrid)}
                className={`px-2 py-1 rounded text-[10px] border flex items-center justify-center gap-1 transition-colors ${
                  showUtmGrid
                    ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>UTM Grid: {showUtmGrid ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowSurveyBoundary(!showSurveyBoundary)}
                className={`px-2 py-1 rounded text-[10px] border flex items-center justify-center gap-1 transition-colors ${
                  showSurveyBoundary
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>Geofence: {showSurveyBoundary ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Georeferenced Survey Summary footer */}
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
              <span>BBOX: 360m × 260m</span>
              <span className="text-cyan-400 font-semibold">&check; ASPRS CLASS I FIXED</span>
            </div>
          </div>
        )}

        {renderMode === '3d-terrain' && (
          <div className="p-3 rounded-lg bg-slate-900/95 border border-cyan-500/70 backdrop-blur-md text-xs flex flex-col gap-2.5 shadow-2xl max-w-xs pointer-events-auto font-mono">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] uppercase tracking-wider">
                <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Terrain Model (DTM)</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                ACTIVE
              </span>
            </div>

            {/* Hypsometric Elevation Ramp */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Elevation Hypsometry:</span>
                <span className="text-cyan-300 font-semibold">{scenario.estimatedGsdCm}cm GSD</span>
              </div>
              <div className="h-3 w-full rounded bg-gradient-to-r from-blue-600 via-teal-400 via-amber-300 to-orange-500 shadow-inner" />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Depression</span>
                <span>Terrace</span>
                <span>Ridge / Peak</span>
              </div>
            </div>

            {/* Contour Interval Selector */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 text-[10px]">Contour Step:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                {[1.0, 2.5, 5.0, 10.0].map((step) => (
                  <button
                    key={step}
                    onClick={() => setTerrainContourInterval(step)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                      terrainContourInterval === step
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {step}m
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Exaggeration Selector */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 text-[10px]">Vert Exaggeration:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                {[1.0, 1.5, 2.0, 2.5].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setVerticalExaggeration(scale)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                      verticalExaggeration === scale
                        ? 'bg-amber-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
              <button
                onClick={() => setShowTerrainContours(!showTerrainContours)}
                className={`px-2 py-1 rounded text-[10px] border flex items-center justify-center gap-1 transition-colors ${
                  showTerrainContours
                    ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>Isolines: {showTerrainContours ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowSlopeHeatmap(!showSlopeHeatmap)}
                className={`px-2 py-1 rounded text-[10px] border flex items-center justify-center gap-1 transition-colors ${
                  showSlopeHeatmap
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>Slope Heat: {showSlopeHeatmap ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <button
                onClick={() => setShowTerrainTin(!showTerrainTin)}
                className={`w-full px-2 py-1 rounded text-[10px] border flex items-center justify-center gap-1 transition-colors ${
                  showTerrainTin
                    ? 'bg-indigo-950/80 border-indigo-500/80 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>TIN Triangulated Mesh: {showTerrainTin ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        )}

        {renderMode === 'elevation-dsm' && (
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-xs flex flex-col gap-1.5 shadow-xl">
            <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider font-mono">Elevation Hypsometry</span>
            <div className="w-32 h-3 rounded bg-gradient-to-r from-blue-500 via-emerald-400 via-yellow-400 to-red-500" />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 m</span>
              <span>25 m</span>
              <span>50+ m</span>
            </div>
          </div>
        )}

        {renderMode === 'confidence-map' && (
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-xs flex flex-col gap-1.5 shadow-xl">
            <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider font-mono">Single-Pass Confidence</span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Direct Oblique Multiview (High)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Grazing Angle (Moderate)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Single-Pass Occluded (AI Inpainted)</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating In-Viewport Drone Video Monitor HUD / PIP */}
      {showPipMonitor && (
        <div
          className={`absolute bottom-16 right-4 z-20 pointer-events-auto transition-all duration-300 font-mono ${
            isPipMinimized ? 'w-48' : 'w-72 md:w-80'
          } bg-slate-950/95 border border-cyan-500/80 rounded-lg shadow-2xl backdrop-blur-md overflow-hidden flex flex-col`}
        >
          {/* PIP Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-white text-[10px] tracking-wide">DRONE VIDEO STREAM</span>
              {customVideoUrl && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  UPLOADED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPipMinimized(!isPipMinimized)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title={isPipMinimized ? 'Expand Video Monitor' : 'Minimize Video Monitor'}
              >
                {isPipMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Video Player Area */}
          {!isPipMinimized && (
            <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
              {customVideoUrl ? (
                <video
                  src={customVideoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={scenario.videoThumbnail}
                  alt="Drone stream"
                  className="w-full h-full object-cover opacity-90"
                />
              )}

              {/* HUD Gimbal overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 text-[9px] text-cyan-300 bg-gradient-to-t from-black/60 via-transparent to-black/40">
                <div className="flex justify-between font-semibold">
                  <span>ALT: {scenario.flightAltitudeMeters}m</span>
                  <span>GIMBAL: {(scenario.telemetryStream[activeTelemetryIndex]?.gimbalPitchDeg ?? -45).toFixed(0)}°</span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-300">
                  <span className="text-emerald-400 font-bold">PROJECTING TO 3D</span>
                  <span>{scenario.sensorResolution}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick controls bar */}
          <div className="px-2 py-1 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1">
              <button
                onClick={onTogglePlay}
                className="px-1.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <span className="text-slate-400 text-[9px]">
                F#{activeTelemetryIndex + 1}/{scenario.telemetryStream.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowVideoOverlayInModes(!showVideoOverlayInModes)}
                className={`px-1.5 py-0.5 rounded text-[9px] border transition-colors cursor-pointer ${
                  showVideoOverlayInModes
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                    : 'border-slate-800 text-slate-500'
                }`}
                title="Toggle video projection in all render modes"
              >
                3D Beams: {showVideoOverlayInModes ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for uploading drone video */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoFileChange}
      />
    </div>
  );
};

// Procedural Geometry Construction for Scenarios
function buildScenarioGeometry(
  scenario: MissionScenario,
  meshGroup: THREE.Group,
  pointCloudGroup: THREE.Group,
  terrainUniformsRef?: React.MutableRefObject<{
    uMinElev: { value: number };
    uMaxElev: { value: number };
    uContourInterval: { value: number };
    uShowContours: { value: number };
    uSlopeHeatmap: { value: number };
    uVerticalExaggeration: { value: number };
    uSunDirection: { value: THREE.Vector3 };
  }>,
  videoTextureRef?: React.MutableRefObject<THREE.VideoTexture | null>
) {
  // Common Textures
  const facadeTexture = createBuildingFacadeTexture();
  const roadTexture = createRoadTexture();
  const roofTexture = createRoofTexture();

  // Materials
  const buildingMaterial = new THREE.MeshStandardMaterial({
    map: facadeTexture,
    roughness: 0.35,
    metalness: 0.25,
  });

  const roofMaterial = new THREE.MeshStandardMaterial({
    map: roofTexture,
    roughness: 0.8,
    metalness: 0.1,
  });

  const roadMaterial = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 0.85,
    metalness: 0.1,
  });

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.9,
    metalness: 0.05,
  });

  // Alternative materials for DSM and Confidence modes
  const elevationMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.6,
  });

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    wireframe: true,
  });

  // Structural DTM translucent boundary overlay so ground terrain can be inspected under assets
  const structuralDtmMaterial = new THREE.MeshStandardMaterial({
    color: '#334155',
    transparent: true,
    opacity: 0.38,
    roughness: 0.7,
    metalness: 0.2,
  });

  // Georeferenced Aerial / Satellite Orthomosaic Texture & Material
  const georefTexture = createGeoreferencedMapTexture(
    scenario.title,
    scenario.baseCoordinates.utmZone,
    scenario.applicationDomain
  );
  const georefMaterial = new THREE.MeshStandardMaterial({
    map: georefTexture,
    roughness: 0.85,
    metalness: 0.08,
  });

  const cadastralFootprintMaterial = new THREE.MeshStandardMaterial({
    map: facadeTexture,
    color: '#0284c7',
    roughness: 0.45,
    metalness: 0.35,
  });

  // Helper to create ShaderMaterial for Topographic 3D Terrain
  const createTopographicTerrainMaterial = (minElev: number, maxElev: number): THREE.ShaderMaterial => {
    const uMinElev = { value: minElev };
    const uMaxElev = { value: maxElev };
    const uContourInterval = terrainUniformsRef ? terrainUniformsRef.current.uContourInterval : { value: 2.5 };
    const uShowContours = terrainUniformsRef ? terrainUniformsRef.current.uShowContours : { value: 1.0 };
    const uSlopeHeatmap = terrainUniformsRef ? terrainUniformsRef.current.uSlopeHeatmap : { value: 0.0 };
    const uVerticalExaggeration = terrainUniformsRef ? terrainUniformsRef.current.uVerticalExaggeration : { value: 1.0 };
    const uSunDirection = terrainUniformsRef ? terrainUniformsRef.current.uSunDirection : { value: new THREE.Vector3(120, 180, 80).normalize() };

    return new THREE.ShaderMaterial({
      uniforms: {
        uMinElev,
        uMaxElev,
        uContourInterval,
        uShowContours,
        uSlopeHeatmap,
        uVerticalExaggeration,
        uSunDirection,
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vWorldNormal;
        varying vec2 vUv;
        uniform float uVerticalExaggeration;

        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.y = pos.y * uVerticalExaggeration;
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          vNormal = normal;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vWorldNormal;
        varying vec2 vUv;

        uniform float uMinElev;
        uniform float uMaxElev;
        uniform float uContourInterval;
        uniform float uShowContours;
        uniform float uSlopeHeatmap;
        uniform vec3 uSunDirection;

        void main() {
          float elev = vWorldPosition.y;
          float t = clamp((elev - uMinElev) / max(0.1, uMaxElev - uMinElev), 0.0, 1.0);

          // Topographic Hypsometric Relief Color Ramp
          vec3 cDeep = vec3(0.04, 0.42, 0.82);   // Channel/depression deep blue
          vec3 cValley = vec3(0.12, 0.68, 0.46); // Lowland emerald
          vec3 cMid = vec3(0.92, 0.78, 0.22);    // Terraces & slopes ochre
          vec3 cHigh = vec3(0.88, 0.40, 0.16);   // Ridges & crests warm amber
          vec3 cPeak = vec3(0.96, 0.96, 0.98);   // Summits snow white

          vec3 baseColor;
          if (t < 0.25) {
            baseColor = mix(cDeep, cValley, t / 0.25);
          } else if (t < 0.55) {
            baseColor = mix(cValley, cMid, (t - 0.25) / 0.30);
          } else if (t < 0.85) {
            baseColor = mix(cMid, cHigh, (t - 0.55) / 0.30);
          } else {
            baseColor = mix(cHigh, cPeak, (t - 0.85) / 0.15);
          }

          // Hillshade relief lighting
          vec3 norm = normalize(vWorldNormal);
          vec3 lightDir = normalize(uSunDirection);
          float diffuse = max(0.0, dot(norm, lightDir));
          float ambient = 0.38;
          float hillshade = ambient + (1.0 - ambient) * diffuse;

          // Slope gradient computation
          float cosSlope = clamp(dot(norm, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
          float slopeDeg = acos(cosSlope) * 57.2958;

          if (uSlopeHeatmap > 0.5) {
            vec3 cFlat = vec3(0.10, 0.82, 0.35);     // 0-15 deg
            vec3 cModerate = vec3(0.96, 0.82, 0.12); // 15-30 deg
            vec3 cSteep = vec3(0.94, 0.28, 0.12);    // 30-45 deg
            vec3 cCliff = vec3(0.68, 0.08, 0.24);    // > 45 deg

            vec3 slopeColor;
            if (slopeDeg < 15.0) {
              slopeColor = mix(cFlat, cModerate, slopeDeg / 15.0);
            } else if (slopeDeg < 30.0) {
              slopeColor = mix(cModerate, cSteep, (slopeDeg - 15.0) / 15.0);
            } else {
              slopeColor = mix(cSteep, cCliff, clamp((slopeDeg - 30.0) / 25.0, 0.0, 1.0));
            }
            baseColor = mix(baseColor, slopeColor, 0.82);
          }

          vec3 finalColor = baseColor * hillshade;

          // Topographic Isolines / Contour lines calculation with fwidth
          if (uShowContours > 0.5) {
            float interval = max(0.5, uContourInterval);
            float coord = elev / interval;
            float fw = max(0.0008, fwidth(coord));
            float dist = abs(fract(coord - 0.5) - 0.5) / fw;
            float lineFactor = 1.0 - clamp(dist / 1.3, 0.0, 1.0);

            // Major index contours every 5x interval (darker and bolder)
            float majorCoord = elev / (interval * 5.0);
            float fwMajor = max(0.0008, fwidth(majorCoord));
            float distMajor = abs(fract(majorCoord - 0.5) - 0.5) / fwMajor;
            float majorFactor = 1.0 - clamp(distMajor / 1.8, 0.0, 1.0);

            vec3 minorColor = vec3(0.06, 0.12, 0.20);
            vec3 majorColor = vec3(0.0, 0.0, 0.02);

            finalColor = mix(finalColor, minorColor, lineFactor * 0.75);
            finalColor = mix(finalColor, majorColor, majorFactor * 0.95);
          }

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  };

  // Attach materials helper with 3D Terrain support
  const setupMeshMaterials = (
    mesh: THREE.Mesh,
    origMat: THREE.Material,
    occludedRatio = 0.1,
    isTerrain = false,
    minElev = -10,
    maxElev = 50
  ) => {
    mesh.userData.originalMaterial = origMat;
    mesh.userData.elevationMaterial = elevationMaterial;
    mesh.userData.wireframeMaterial = wireframeMaterial;
    mesh.userData.isTerrain = isTerrain;

    if (isTerrain) {
      mesh.userData.terrainMaterial = createTopographicTerrainMaterial(minElev, maxElev);
      mesh.userData.georefMaterial = georefMaterial;
      mesh.userData.videoTerrainMaterial = new THREE.MeshStandardMaterial({
        map: videoTextureRef?.current || (origMat as any).map || null,
        roughness: 0.55,
        metalness: 0.1,
        color: 0xffffff,
      });
    } else {
      mesh.userData.structuralDtmMaterial = structuralDtmMaterial;
      mesh.userData.cadastralFootprintMaterial = cadastralFootprintMaterial;
      mesh.userData.videoStructuralMaterial = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        wireframe: false,
        transparent: true,
        opacity: 0.85,
        roughness: 0.4,
      });
    }

    // Confidence Material (single-pass shows rear face occluded)
    const confColor = occludedRatio > 0.4 ? 0xf43f5e : occludedRatio > 0.2 ? 0xfbbf24 : 0x10b981;
    mesh.userData.confidenceMaterial = new THREE.MeshStandardMaterial({
      color: confColor,
      roughness: 0.5,
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  };

  const domain = scenario.applicationDomain || (scenario.id as any);

  if (domain === 'border-strategic-mapping' || scenario.id === 'tactical-border-strip') {
    // 1. (i) Border & Strategic Area Mapping
    const desertGeo = new THREE.PlaneGeometry(420, 260, 50, 30);
    desertGeo.rotateX(-Math.PI / 2);
    // Add ditch depression
    const dPos = desertGeo.attributes.position;
    for (let i = 0; i < dPos.count; i++) {
      const x = dPos.getX(i);
      const z = dPos.getZ(i);
      // Security ditch parallel to fence at x = -10
      let y = 0;
      if (x > -18 && x < -2) {
        y = -4.2 * Math.sin(((x + 18) / 16) * Math.PI); // 4.2m security ditch
      } else {
        y = Math.sin(z * 0.05) * 1.5;
      }
      dPos.setY(i, y);
    }
    desertGeo.computeVertexNormals();
    applyElevationColors(desertGeo, -5, 10);
    const desertMat = new THREE.MeshStandardMaterial({
      map: createCamoDesertTexture(),
      roughness: 0.95,
      metalness: 0.05,
    });
    const desertMesh = new THREE.Mesh(desertGeo, desertMat);
    setupMeshMaterials(desertMesh, desertMat, 0.05, true, -6, 25);
    meshGroup.add(desertMesh);

    // Double Border Fence Line (Primary & Secondary Razor Mesh)
    const fenceMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', wireframe: true });
    const fence1 = new THREE.Mesh(new THREE.PlaneGeometry(380, 5.5), fenceMat);
    fence1.position.set(0, 2.75, 0);
    meshGroup.add(fence1);

    const fence2 = new THREE.Mesh(new THREE.PlaneGeometry(380, 4.5), fenceMat);
    fence2.position.set(-6, 2.25, 0);
    meshGroup.add(fence2);

    // Fence Posts
    const postMat = new THREE.MeshStandardMaterial({ color: '#475569' });
    for (let z = -180; z <= 180; z += 15) {
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6, 8), postMat);
      p1.position.set(0, 3, z);
      meshGroup.add(p1);

      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 8), postMat);
      p2.position.set(-6, 2.5, z);
      meshGroup.add(p2);
    }

    // Paved Patrol Security Road
    const pRoad = new THREE.Mesh(new THREE.PlaneGeometry(16, 380), roadMaterial);
    pRoad.rotateX(-Math.PI / 2);
    pRoad.position.set(16, 0.05, 0);
    setupMeshMaterials(pRoad, roadMaterial, 0.05);
    meshGroup.add(pRoad);

    // Observation Watchtower 1 & 2
    const buildTower = (x: number, z: number) => {
      const towerPillars = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 24, 6), groundMaterial);
      towerPillars.position.set(x, 12, z);
      meshGroup.add(towerPillars);

      const towerCabin = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 8), buildingMaterial);
      towerCabin.position.set(x, 24, z);
      setupMeshMaterials(towerCabin, buildingMaterial, 0.2);
      meshGroup.add(towerCabin);

      // Searchlight / Radar antenna
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6), postMat);
      mast.position.set(x, 28, z);
      meshGroup.add(mast);
    };
    buildTower(28, -70);
    buildTower(28, 80);

    // Surveillance Sensor Range Cone (semi-transparent cyan LOS cone)
    const coneGeo = new THREE.ConeGeometry(40, 26, 16, 1, true);
    coneGeo.rotateX(Math.PI);
    const coneMat = new THREE.MeshBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.12, wireframe: true });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(28, 13, -70);
    meshGroup.add(coneMesh);

  } else if (domain === 'disaster-damage-assessment' || scenario.id === 'disaster-bridge-collapse') {
    // 2. (ii) Disaster Damage Assessment
    const terrainGeo = new THREE.PlaneGeometry(380, 260, 60, 40);
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distToRiver = Math.abs(x);
      let elev = 0;
      if (distToRiver < 32) {
        elev = -6 + Math.sin(z * 0.1) * 0.5;
      } else if (distToRiver < 75) {
        elev = -6 + ((distToRiver - 32) / 43) * 22;
      } else {
        elev = 16 + Math.sin(x * 0.05 + z * 0.04) * 3;
      }
      pos.setY(i, elev);
    }
    terrainGeo.computeVertexNormals();
    applyElevationColors(terrainGeo, -6, 25);
    const canyonMesh = new THREE.Mesh(terrainGeo, groundMaterial);
    setupMeshMaterials(canyonMesh, groundMaterial, 0.15, true, -7, 28);
    meshGroup.add(canyonMesh);

    // River water plane
    const waterGeo = new THREE.PlaneGeometry(64, 260);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: '#0284c7',
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = -3.5;
    meshGroup.add(waterMesh);

    // Bridge Spans
    const bridgeDeckMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.6 });

    // West Span
    const westSpan = new THREE.Mesh(new THREE.BoxGeometry(60, 4, 14), bridgeDeckMat);
    westSpan.position.set(-65, 15, 0);
    setupMeshMaterials(westSpan, bridgeDeckMat, 0.2);
    meshGroup.add(westSpan);

    // Collapsed Center Span
    const brokenSpan = new THREE.Mesh(new THREE.BoxGeometry(45, 3.5, 13), bridgeDeckMat);
    brokenSpan.position.set(-10, 4, 2);
    brokenSpan.rotation.z = -Math.PI / 6;
    setupMeshMaterials(brokenSpan, bridgeDeckMat, 0.4);
    meshGroup.add(brokenSpan);

    // Debris rubble mounds
    const debrisGeo = new THREE.DodecahedronGeometry(7, 2);
    const debrisMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.9 });
    const debrisMesh1 = new THREE.Mesh(debrisGeo, debrisMat);
    debrisMesh1.position.set(5, -2, 0);
    debrisMesh1.scale.set(1.4, 0.8, 1.2);
    setupMeshMaterials(debrisMesh1, debrisMat, 0.1);
    meshGroup.add(debrisMesh1);

    const debrisMesh2 = new THREE.Mesh(debrisGeo, debrisMat);
    debrisMesh2.position.set(-15, -2, 10);
    debrisMesh2.scale.set(1.0, 0.6, 1.1);
    setupMeshMaterials(debrisMesh2, debrisMat, 0.1);
    meshGroup.add(debrisMesh2);

    // East Span
    const eastSpan = new THREE.Mesh(new THREE.BoxGeometry(60, 4, 14), bridgeDeckMat);
    eastSpan.position.set(65, 15, 0);
    setupMeshMaterials(eastSpan, bridgeDeckMat, 0.2);
    meshGroup.add(eastSpan);

  } else if (domain === 'urban-planning-smart-cities' || scenario.id === 'urban-downtown-corridor') {
    // 3. (iii) Urban Planning & Smart Cities
    const groundGeo = new THREE.PlaneGeometry(360, 360, 48, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const gPos = groundGeo.attributes.position;
    for (let i = 0; i < gPos.count; i++) {
      const x = gPos.getX(i);
      const z = gPos.getZ(i);
      const streetSlope = (z / 180) * 6.5 + Math.sin(x * 0.04) * 2.2;
      gPos.setY(i, streetSlope);
    }
    groundGeo.computeVertexNormals();
    applyElevationColors(groundGeo, 0, 65);
    const groundMesh = new THREE.Mesh(groundGeo, groundMaterial);
    setupMeshMaterials(groundMesh, groundMaterial, 0.05, true, 0, 65);
    meshGroup.add(groundMesh);

    // Central Boulevard
    const roadGeo = new THREE.PlaneGeometry(42, 340);
    roadGeo.rotateX(-Math.PI / 2);
    roadGeo.rotateY(Math.PI / 4.2);
    const roadMesh = new THREE.Mesh(roadGeo, roadMaterial);
    roadMesh.position.y = 0.05;
    setupMeshMaterials(roadMesh, roadMaterial, 0.02);
    meshGroup.add(roadMesh);

    // Commercial High-Rise Towers
    const buildings = [
      { x: -35, z: -60, w: 28, d: 24, h: 48 },
      { x: -45, z: -10, w: 32, d: 26, h: 62 },
      { x: -40, z: 45, w: 26, d: 28, h: 38 },
      { x: -38, z: 95, w: 30, d: 25, h: 54 },
      { x: 35, z: -70, w: 26, d: 28, h: 42 },
      { x: 42, z: -15, w: 34, d: 30, h: 58 },
      { x: 38, z: 40, w: 28, d: 24, h: 46 },
      { x: 40, z: 90, w: 30, d: 26, h: 36 },
    ];

    buildings.forEach((b) => {
      const bGeo = new THREE.BoxGeometry(b.w, b.h, b.d, 4, 8, 4);
      applyElevationColors(bGeo, 0, 65);
      const bMesh = new THREE.Mesh(bGeo, buildingMaterial);
      bMesh.position.set(b.x, b.h / 2, b.z);
      setupMeshMaterials(bMesh, buildingMaterial, 0.35);
      meshGroup.add(bMesh);

      // Rooftop HVAC unit
      const hvacGeo = new THREE.BoxGeometry(b.w * 0.35, 3.5, b.d * 0.35);
      const hvacMesh = new THREE.Mesh(hvacGeo, roofMaterial);
      hvacMesh.position.set(b.x + 2, b.h + 1.75, b.z - 1);
      setupMeshMaterials(hvacMesh, roofMaterial, 0.05);
      meshGroup.add(hvacMesh);
    });

    // Street Trees
    const treeGeo = new THREE.ConeGeometry(3, 8, 6);
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 3);
    const foliageMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.9 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });

    for (let i = -120; i <= 120; i += 30) {
      const tree1 = new THREE.Mesh(treeGeo, foliageMat);
      tree1.position.set(-18 + (i % 6), 5.5, i);
      const trunk1 = new THREE.Mesh(trunkGeo, trunkMat);
      trunk1.position.set(-18 + (i % 6), 1.5, i);
      meshGroup.add(tree1);
      meshGroup.add(trunk1);
    }

    // Semi-transparent Municipal Zoning Height Envelope Wireframe
    const zoningGeo = new THREE.BoxGeometry(140, 65, 240);
    const zoningMat = new THREE.MeshBasicMaterial({ color: '#38bdf8', wireframe: true, transparent: true, opacity: 0.15 });
    const zoningBox = new THREE.Mesh(zoningGeo, zoningMat);
    zoningBox.position.set(0, 32.5, 10);
    meshGroup.add(zoningBox);

  } else if (domain === 'infrastructure-inspection') {
    // 4. (iv) Infrastructure Inspection: Highway Viaduct & Transmission Corridor
    const groundGeo = new THREE.PlaneGeometry(360, 280, 50, 40);
    groundGeo.rotateX(-Math.PI / 2);
    const iPos = groundGeo.attributes.position;
    for (let i = 0; i < iPos.count; i++) {
      const x = iPos.getX(i);
      const z = iPos.getZ(i);
      const valley = Math.sin((x / 180) * Math.PI) * 7.5 + Math.cos(z * 0.03) * 2.5;
      iPos.setY(i, valley);
    }
    groundGeo.computeVertexNormals();
    applyElevationColors(groundGeo, -4, 45);
    const groundMesh = new THREE.Mesh(groundGeo, groundMaterial);
    setupMeshMaterials(groundMesh, groundMaterial, 0.05, true, -5, 45);
    meshGroup.add(groundMesh);

    // Cross-highway below
    const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(32, 280), roadMaterial);
    crossRoad.rotateX(-Math.PI / 2);
    crossRoad.position.set(0, 0.05, 0);
    setupMeshMaterials(crossRoad, roadMaterial, 0.02);
    meshGroup.add(crossRoad);

    // Elevated Highway Viaduct (Z-axis crossing X=0)
    const concreteMat = new THREE.MeshStandardMaterial({
      map: createConstructionConcreteTexture(),
      roughness: 0.7,
      metalness: 0.2,
    });

    const viaductDeck = new THREE.Mesh(new THREE.BoxGeometry(320, 3.5, 22), concreteMat);
    viaductDeck.position.set(0, 16, 0);
    setupMeshMaterials(viaductDeck, concreteMat, 0.1);
    meshGroup.add(viaductDeck);

    // Parapet railings
    const railMat = new THREE.MeshStandardMaterial({ color: '#64748b' });
    const railN = new THREE.Mesh(new THREE.BoxGeometry(320, 1.2, 0.8), railMat);
    railN.position.set(0, 18.3, 10.5);
    meshGroup.add(railN);
    const railS = new THREE.Mesh(new THREE.BoxGeometry(320, 1.2, 0.8), railMat);
    railS.position.set(0, 18.3, -10.5);
    meshGroup.add(railS);

    // Concrete Piers
    [-110, -50, 50, 110].forEach((x, idx) => {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.0, 16, 16), concreteMat);
      pier.position.set(x, 8, 0);
      setupMeshMaterials(pier, concreteMat, 0.1);
      meshGroup.add(pier);

      // Crosshead cap
      const cap = new THREE.Mesh(new THREE.BoxGeometry(10, 2.5, 24), concreteMat);
      cap.position.set(x, 15, 0);
      setupMeshMaterials(cap, concreteMat, 0.05);
      meshGroup.add(cap);

      // Distress anomaly ring on Pier 3 (x=50)
      if (idx === 2) {
        const ringGeo = new THREE.TorusGeometry(3.6, 0.3, 8, 24);
        ringGeo.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(x, 10, 0);
        meshGroup.add(ring);
      }
    });

    // High Voltage Transmission Pylons (Steel Lattice Pyramids)
    const steelMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', wireframe: true });
    const buildPylon = (x: number, z: number) => {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 6, 42, 4), steelMat);
      base.position.set(x, 21, z);
      meshGroup.add(base);

      const crossArm = new THREE.Mesh(new THREE.BoxGeometry(26, 1.5, 2), steelMat);
      crossArm.position.set(x, 38, z);
      meshGroup.add(crossArm);
    };
    buildPylon(-100, 75);
    buildPylon(100, 75);

    // Catenary Suspended Cables (Line segments with sag)
    const cablePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) {
      const alpha = i / 30;
      const x = -100 + alpha * 200;
      const sag = Math.sin(alpha * Math.PI) * 12; // 12m catenary sag
      cablePoints.push(new THREE.Vector3(x, 38 - sag, 75));
    }
    const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
    const cableMat = new THREE.LineBasicMaterial({ color: '#facc15', linewidth: 2 });
    const cable = new THREE.Line(cableGeo, cableMat);
    meshGroup.add(cable);

  } else if (domain === 'construction-progress-monitoring') {
    // 5. (v) Construction Progress Monitoring: Foundation Pit & Tower Crane
    const groundGeo = new THREE.PlaneGeometry(360, 280, 40, 30);
    groundGeo.rotateX(-Math.PI / 2);
    // Excavate deep foundation pit in center
    const cPos = groundGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const x = cPos.getX(i);
      const z = cPos.getZ(i);
      let y = 0;
      if (Math.abs(x) < 55 && Math.abs(z) < 45) {
        y = -10.5; // 10.5m excavation pit
      } else if (Math.abs(x) < 65 && Math.abs(z) < 55) {
        y = -5.0; // Berm bench
      }
      cPos.setY(i, y);
    }
    groundGeo.computeVertexNormals();
    applyElevationColors(groundGeo, -12, 45);
    const cGroundMesh = new THREE.Mesh(groundGeo, groundMaterial);
    setupMeshMaterials(cGroundMesh, groundMaterial, 0.1, true, -12, 48);
    meshGroup.add(cGroundMesh);

    // Concrete core building rising from pit
    const concreteMat = new THREE.MeshStandardMaterial({
      map: createConstructionConcreteTexture(),
      roughness: 0.65,
    });
    const coreGeo = new THREE.BoxGeometry(32, 42, 28);
    const coreMesh = new THREE.Mesh(coreGeo, concreteMat);
    coreMesh.position.set(-10, 10.5, 0); // rising to +31.5m above ground
    setupMeshMaterials(coreMesh, concreteMat, 0.25);
    meshGroup.add(coreMesh);

    // Climbing Formwork / Scaffolding collar at top
    const scaffoldGeo = new THREE.BoxGeometry(35, 4, 31);
    const scaffoldMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.5 });
    const scaffoldMesh = new THREE.Mesh(scaffoldGeo, scaffoldMat);
    scaffoldMesh.position.set(-10, 31.5, 0);
    setupMeshMaterials(scaffoldMesh, scaffoldMat, 0.05);
    meshGroup.add(scaffoldMesh);

    // Yellow Tower Crane
    const craneMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.6, roughness: 0.3 });
    // Mast
    const mastGeo = new THREE.BoxGeometry(2.5, 58, 2.5);
    const mastMesh = new THREE.Mesh(mastGeo, craneMat);
    mastMesh.position.set(22, 18.5, -5);
    meshGroup.add(mastMesh);

    // Jib
    const jibGeo = new THREE.BoxGeometry(50, 1.8, 1.8);
    const jibMesh = new THREE.Mesh(jibGeo, craneMat);
    jibMesh.position.set(10, 48, -5);
    meshGroup.add(jibMesh);

    // Counterweight
    const cwMesh = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 2.5), new THREE.MeshStandardMaterial({ color: '#334155' }));
    cwMesh.position.set(38, 48, -5);
    meshGroup.add(cwMesh);

    // Stockpiles (Earth / Gravel Cut & Fill Mounds)
    const pileGeo = new THREE.ConeGeometry(12, 8, 16);
    const pileMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.95 });
    const pile1 = new THREE.Mesh(pileGeo, pileMat);
    pile1.position.set(95, 4, 30);
    meshGroup.add(pile1);

    const pile2 = new THREE.Mesh(new THREE.ConeGeometry(10, 6, 16), new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.95 }));
    pile2.position.set(80, 3, -40);
    meshGroup.add(pile2);

    // Site Trailers
    const trailerMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 });
    const trailer1 = new THREE.Mesh(new THREE.BoxGeometry(14, 3.5, 6), trailerMat);
    trailer1.position.set(-100, 1.75, 40);
    meshGroup.add(trailer1);

  } else if (domain === 'archaeological-documentation') {
    // 6. (vi) Archaeological Documentation: Acropolis Sanctuary & Excavation Trenches
    const groundGeo = new THREE.PlaneGeometry(320, 260, 50, 40);
    groundGeo.rotateX(-Math.PI / 2);
    const aPos = groundGeo.attributes.position;
    for (let i = 0; i < aPos.count; i++) {
      const x = aPos.getX(i);
      const z = aPos.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);
      const terrace = Math.max(0, 10.0 - (distFromCenter / 140) * 8.5) + Math.sin(x * 0.05) * 1.2;
      aPos.setY(i, terrace);
    }
    groundGeo.computeVertexNormals();
    applyElevationColors(groundGeo, 0, 25);
    const groundMat = new THREE.MeshStandardMaterial({
      map: createCamoDesertTexture(),
      roughness: 0.9,
    });
    const aGround = new THREE.Mesh(groundGeo, groundMat);
    setupMeshMaterials(aGround, groundMat, 0.05, true, 0, 26);
    meshGroup.add(aGround);

    // Weathered Limestone & Marble Material
    const ruinMat = new THREE.MeshStandardMaterial({
      map: createStoneRuinTexture(),
      roughness: 0.85,
      metalness: 0.1,
    });

    // 3-Tiered Ancient Temple Stylobate Platform
    const stylobate1 = new THREE.Mesh(new THREE.BoxGeometry(90, 1.8, 54), ruinMat);
    stylobate1.position.set(0, 0.9, 0);
    setupMeshMaterials(stylobate1, ruinMat, 0.1);
    meshGroup.add(stylobate1);

    const stylobate2 = new THREE.Mesh(new THREE.BoxGeometry(84, 1.8, 48), ruinMat);
    stylobate2.position.set(0, 2.7, 0);
    setupMeshMaterials(stylobate2, ruinMat, 0.1);
    meshGroup.add(stylobate2);

    const stylobate3 = new THREE.Mesh(new THREE.BoxGeometry(78, 1.8, 42), ruinMat);
    stylobate3.position.set(0, 4.5, 0);
    setupMeshMaterials(stylobate3, ruinMat, 0.1);
    meshGroup.add(stylobate3);

    // Standing Fluted Classical Colonnade
    const columnGeo = new THREE.CylinderGeometry(1.4, 1.6, 16, 16);
    const colCoords = [
      [-34, -18], [-20, -18], [-6, -18], [8, -18], [22, -18], [34, -18],
      [-34, 18], [-20, 18], [-6, 18], [8, 18], [22, 18], [34, 18],
    ];

    colCoords.forEach(([x, z], idx) => {
      if (idx !== 3 && idx !== 8) { // Leave a couple open to represent ruins
        const col = new THREE.Mesh(columnGeo, ruinMat);
        col.position.set(x, 13.4, z);
        setupMeshMaterials(col, ruinMat, 0.15);
        meshGroup.add(col);

        // Capital
        const cap = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 3.6), ruinMat);
        cap.position.set(x, 22.0, z);
        meshGroup.add(cap);
      }
    });

    // Toppled column drum segments on ground
    const drumGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
    const toppledDrum1 = new THREE.Mesh(drumGeo, ruinMat);
    toppledDrum1.rotation.z = Math.PI / 2;
    toppledDrum1.position.set(10, 6.0, -16);
    meshGroup.add(toppledDrum1);

    const toppledDrum2 = new THREE.Mesh(drumGeo, ruinMat);
    toppledDrum2.rotation.z = Math.PI / 2.3;
    toppledDrum2.position.set(-22, 6.0, 14);
    meshGroup.add(toppledDrum2);

    // Central Stone Altar
    const altar = new THREE.Mesh(new THREE.BoxGeometry(14, 4, 10), ruinMat);
    altar.position.set(0, 7.4, 0);
    setupMeshMaterials(altar, ruinMat, 0.1);
    meshGroup.add(altar);

    // Archaeological Excavation Dig Trenches (Gridded pits)
    [-80, 80].forEach((tx) => {
      const trenchGeo = new THREE.BoxGeometry(30, 3.6, 30);
      const trenchMat = new THREE.MeshStandardMaterial({ color: '#573010', roughness: 0.95 });
      const trench = new THREE.Mesh(trenchGeo, trenchMat);
      trench.position.set(tx, -1.8, 40);
      meshGroup.add(trench);

      // Grid survey quadrat line
      const gridWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(trenchGeo),
        new THREE.LineBasicMaterial({ color: '#eab308' })
      );
      gridWire.position.set(tx, -1.8, 40);
      meshGroup.add(gridWire);
    });

  } else if (domain === 'digital-twin-generation') {
    // 7. (vii) Digital Twin Generation: Smart Campus & Live IoT Telemetry Nodes
    const campusGeo = new THREE.PlaneGeometry(360, 340, 48, 48);
    campusGeo.rotateX(-Math.PI / 2);
    const cpPos = campusGeo.attributes.position;
    for (let i = 0; i < cpPos.count; i++) {
      const x = cpPos.getX(i);
      const z = cpPos.getZ(i);
      const parkSwell = Math.sin(x * 0.03) * 2.8 + Math.cos(z * 0.03) * 2.2;
      cpPos.setY(i, parkSwell);
    }
    campusGeo.computeVertexNormals();
    applyElevationColors(campusGeo, 0, 40);
    const campusGround = new THREE.Mesh(campusGeo, groundMaterial);
    setupMeshMaterials(campusGround, groundMaterial, 0.02, true, 0, 42);
    meshGroup.add(campusGround);

    // Modern Research Buildings with Glass & Rooftop Solar Arrays
    const solarTexture = createSolarGridTexture();
    const solarMat = new THREE.MeshStandardMaterial({
      map: solarTexture,
      roughness: 0.2,
      metalness: 0.8,
    });

    const campusBuildings = [
      { x: -50, z: -40, w: 45, d: 35, h: 32 },
      { x: -45, z: 45, w: 42, d: 38, h: 28 },
      { x: 50, z: -35, w: 50, d: 32, h: 38 },
      { x: 48, z: 50, w: 46, d: 40, h: 30 },
    ];

    campusBuildings.forEach((b) => {
      const bGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const bMesh = new THREE.Mesh(bGeo, buildingMaterial);
      bMesh.position.set(b.x, b.h / 2, b.z);
      setupMeshMaterials(bMesh, buildingMaterial, 0.2);
      meshGroup.add(bMesh);

      // Rooftop Photovoltaic Solar Arrays
      const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.75, 1.2, b.d * 0.6), solarMat);
      solarPanel.position.set(b.x, b.h + 0.6, b.z);
      meshGroup.add(solarPanel);
    });

    // Glass Atrium Walkways connecting buildings
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.9,
    });
    const bridgeWest = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 50), glassMat);
    bridgeWest.position.set(-48, 16, 2.5);
    meshGroup.add(bridgeWest);

    const bridgeEast = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 55), glassMat);
    bridgeEast.position.set(49, 16, 7.5);
    meshGroup.add(bridgeEast);

    // 5 Live Pulsing IoT Telemetry Sensor Nodes
    const iotNodes = [
      { x: -50, y: 36, z: -40, label: 'HVAC Chiller #1' },
      { x: -45, y: 32, z: 45, label: 'Solar Inverter B' },
      { x: 50, y: 42, z: -35, label: 'Structural Strain S1' },
      { x: 48, y: 34, z: 50, label: 'Indoor Air Quality Node' },
      { x: 0, y: 2, z: 0, label: 'AGV Autonomous Hub' },
    ];

    iotNodes.forEach((node) => {
      // Sensor glowing sphere
      const sGeo = new THREE.SphereGeometry(1.6, 16, 16);
      const sMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(node.x, node.y, node.z);
      meshGroup.add(sMesh);

      // Pulsing Ring
      const ringGeo = new THREE.RingGeometry(2.4, 3.0, 24);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: '#34d399', side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(node.x, node.y, node.z);
      meshGroup.add(ring);
    });

  } else {
    // 8. (viii) Military Reconnaissance & Mission Planning
    const ridgeGeo = new THREE.PlaneGeometry(420, 280, 50, 40);
    ridgeGeo.rotateX(-Math.PI / 2);
    const rPos = ridgeGeo.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const x = rPos.getX(i);
      const z = rPos.getZ(i);
      // Mountain ridge topography
      const ridgeElev = Math.sin(x * 0.03 + z * 0.02) * 14 + Math.cos(x * 0.05) * 8;
      rPos.setY(i, Math.max(0, ridgeElev));
    }
    ridgeGeo.computeVertexNormals();
    applyElevationColors(ridgeGeo, 0, 32);
    const camoMat = new THREE.MeshStandardMaterial({
      map: createCamoDesertTexture(),
      roughness: 0.95,
    });
    const ridgeMesh = new THREE.Mesh(ridgeGeo, camoMat);
    setupMeshMaterials(ridgeMesh, camoMat, 0.1, true, 0, 35);
    meshGroup.add(ridgeMesh);

    // Fortified Forward Operating Base (FOB) Compound
    const hescoMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const hescoWall = new THREE.Mesh(new THREE.BoxGeometry(60, 3.5, 45), hescoMat);
    hescoWall.position.set(20, 18, -10);
    setupMeshMaterials(hescoWall, hescoMat, 0.1);
    meshGroup.add(hescoWall);

    // Hardened Command Bunker
    const bunker = new THREE.Mesh(new THREE.BoxGeometry(24, 6, 18), groundMaterial);
    bunker.position.set(20, 20, -10);
    setupMeshMaterials(bunker, groundMaterial, 0.1);
    meshGroup.add(bunker);

    // Communications Geodesic Radar Dome
    const radomeGeo = new THREE.SphereGeometry(6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const radomeMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 });
    const radome = new THREE.Mesh(radomeGeo, radomeMat);
    radome.position.set(20, 23, -10);
    meshGroup.add(radome);

    // Helicopter Landing Zone (LZ) Pad with White "H"
    const lzPadGeo = new THREE.CircleGeometry(16, 32);
    lzPadGeo.rotateX(-Math.PI / 2);
    const lzPadMat = new THREE.MeshStandardMaterial({ color: '#1e293b' });
    const lzPad = new THREE.Mesh(lzPadGeo, lzPadMat);
    lzPad.position.set(-65, 12.5, 20);
    meshGroup.add(lzPad);

    // Painted White "H" on LZ
    const hBarMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 12), hBarMat);
    h1.position.set(-69, 12.55, 20);
    meshGroup.add(h1);
    const h2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 12), hBarMat);
    h2.position.set(-61, 12.55, 20);
    meshGroup.add(h2);
    const hCross = new THREE.Mesh(new THREE.BoxGeometry(8, 0.05, 1.4), hBarMat);
    hCross.position.set(-65, 12.55, 20);
    meshGroup.add(hCross);

    // Semi-transparent Threat Dome / Weapon Line-of-Sight Cone
    const threatGeo = new THREE.SphereGeometry(45, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const threatMat = new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.12, wireframe: true });
    const threatDome = new THREE.Mesh(threatGeo, threatMat);
    threatDome.position.set(20, 18, -10);
    meshGroup.add(threatDome);
  }

  // Generate Classified Point Cloud (18,000+ photogrammetric points)
  buildClassifiedPointCloud(scenario, pointCloudGroup);
}

// Build 3D Drone Video Projection System (Ground Footprint Quad + Optical Laser Projection Rays + Reticle)
function buildVideoProjectionSystem(
  group: THREE.Group,
  videoTextureRef: React.MutableRefObject<THREE.VideoTexture | null>,
  groundQuadMeshRef: React.MutableRefObject<THREE.Mesh | null>,
  projectionRaysRef: React.MutableRefObject<THREE.LineSegments | null>,
  opacity: number
) {
  group.clear();

  // 1. Ground Video Projection Quad (55m x 36m)
  const quadWidth = 55;
  const quadDepth = 36;
  const quadGeo = new THREE.PlaneGeometry(quadWidth, quadDepth);
  quadGeo.rotateX(-Math.PI / 2);

  const quadMat = new THREE.MeshBasicMaterial({
    map: videoTextureRef.current || null,
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const groundQuad = new THREE.Mesh(quadGeo, quadMat);
  groundQuad.name = 'groundVideoQuad';
  groundQuad.position.set(0, 0.25, 0);
  groundQuadMeshRef.current = groundQuad;
  group.add(groundQuad);

  // 2. High-Tech Holographic Reticle around the Ground Projection
  const cornerMat = new THREE.LineBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0.95 });
  const cornerLen = 6;
  const hw = quadWidth / 2;
  const hd = quadDepth / 2;

  const cornerPairs: [THREE.Vector3, THREE.Vector3][] = [
    // Top-Left corner
    [new THREE.Vector3(-hw, 0.05, -hd), new THREE.Vector3(-hw + cornerLen, 0.05, -hd)],
    [new THREE.Vector3(-hw, 0.05, -hd), new THREE.Vector3(-hw, 0.05, -hd + cornerLen)],
    // Top-Right corner
    [new THREE.Vector3(hw, 0.05, -hd), new THREE.Vector3(hw - cornerLen, 0.05, -hd)],
    [new THREE.Vector3(hw, 0.05, -hd), new THREE.Vector3(hw, 0.05, -hd + cornerLen)],
    // Bottom-Right corner
    [new THREE.Vector3(hw, 0.05, hd), new THREE.Vector3(hw - cornerLen, 0.05, hd)],
    [new THREE.Vector3(hw, 0.05, hd), new THREE.Vector3(hw, 0.05, hd - cornerLen)],
    // Bottom-Left corner
    [new THREE.Vector3(-hw, 0.05, hd), new THREE.Vector3(-hw + cornerLen, 0.05, hd)],
    [new THREE.Vector3(-hw, 0.05, hd), new THREE.Vector3(-hw, 0.05, hd - cornerLen)],
  ];

  const cornerPts: THREE.Vector3[] = [];
  cornerPairs.forEach(([p1, p2]) => {
    cornerPts.push(p1, p2);
  });
  const cornerGeo = new THREE.BufferGeometry().setFromPoints(cornerPts);
  const cornerLines = new THREE.LineSegments(cornerGeo, cornerMat);
  groundQuad.add(cornerLines);

  // Outer border edges
  const borderEdges = new THREE.EdgesGeometry(quadGeo);
  const borderLineMat = new THREE.LineBasicMaterial({ color: '#06b6d4', transparent: true, opacity: 0.7 });
  const borderLines = new THREE.LineSegments(borderEdges, borderLineMat);
  groundQuad.add(borderLines);

  // Center targeting crosshair
  const crossPts = [
    new THREE.Vector3(-4, 0.05, 0),
    new THREE.Vector3(4, 0.05, 0),
    new THREE.Vector3(0, 0.05, -4),
    new THREE.Vector3(0, 0.05, 4),
  ];
  const crossGeo = new THREE.BufferGeometry().setFromPoints(crossPts);
  const crossLines = new THREE.LineSegments(crossGeo, new THREE.LineBasicMaterial({ color: '#38bdf8', opacity: 0.85, transparent: true }));
  groundQuad.add(crossLines);

  // 3. 4 Optical Projection Rays (LineSegments connecting drone gimbal down to quad corners)
  const rayPositions = new Float32Array(4 * 2 * 3);
  const rayGeo = new THREE.BufferGeometry();
  rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));
  const rayMat = new THREE.LineBasicMaterial({
    color: '#06b6d4',
    transparent: true,
    opacity: 0.7,
  });
  const rays = new THREE.LineSegments(rayGeo, rayMat);
  rays.name = 'projectionRays';
  projectionRaysRef.current = rays;
  group.add(rays);
}

// Build 3D Georeferenced Overlays (Projected UTM Grid, Boundary Geofence, Corner Benchmarks, Scale Bar)
function buildGeoreferencedOverlays(scenario: MissionScenario, group: THREE.Group) {
  group.clear();

  // 1. Projected UTM Coordinate Graticule (every 50m over 400m x 300m area)
  const gridGroup = new THREE.Group();
  gridGroup.name = 'utmGrid';

  const gridMat = new THREE.LineBasicMaterial({
    color: '#06b6d4',
    transparent: true,
    opacity: 0.35,
  });

  const axisMat = new THREE.LineBasicMaterial({
    color: '#0ea5e9',
    transparent: true,
    opacity: 0.75,
  });

  // East-West lines
  for (let z = -150; z <= 150; z += 50) {
    const pts = [new THREE.Vector3(-200, 0.25, z), new THREE.Vector3(200, 0.25, z)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, z === 0 ? axisMat : gridMat);
    gridGroup.add(line);
  }

  // North-South lines
  for (let x = -200; x <= 200; x += 50) {
    const pts = [new THREE.Vector3(x, 0.25, -150), new THREE.Vector3(x, 0.25, 150)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, x === 0 ? axisMat : gridMat);
    gridGroup.add(line);
  }

  group.add(gridGroup);

  // 2. Survey Boundary Geofence Polygon (Rectangle at Y=0.35m)
  const boundaryGroup = new THREE.Group();
  boundaryGroup.name = 'surveyBoundary';

  const halfW = 180;
  const halfD = 130;
  const boundCorners = [
    new THREE.Vector3(-halfW, 0.4, -halfD),
    new THREE.Vector3(halfW, 0.4, -halfD),
    new THREE.Vector3(halfW, 0.4, halfD),
    new THREE.Vector3(-halfW, 0.4, halfD),
    new THREE.Vector3(-halfW, 0.4, -halfD),
  ];

  const boundGeo = new THREE.BufferGeometry().setFromPoints(boundCorners);
  const boundMat = new THREE.LineDashedMaterial({
    color: '#f59e0b',
    dashSize: 6,
    gapSize: 4,
  });
  const boundLine = new THREE.Line(boundGeo, boundMat);
  boundLine.computeLineDistances();
  boundaryGroup.add(boundLine);

  // 4 Geodetic Survey Corner Pins with Survey Badges
  const cornersData = [
    { label: 'NW CORNER BENCHMARK', x: -halfW, z: -halfD },
    { label: 'NE CORNER BENCHMARK', x: halfW, z: -halfD },
    { label: 'SE CORNER BENCHMARK', x: halfW, z: halfD },
    { label: 'SW CORNER BENCHMARK', x: -halfW, z: halfD },
  ];

  cornersData.forEach((c) => {
    // Monument pyramid pin
    const pinGeo = new THREE.ConeGeometry(2.0, 5.0, 4);
    pinGeo.rotateX(Math.PI);
    const pinMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.8, roughness: 0.2 });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(c.x, 2.5, c.z);
    boundaryGroup.add(pin);

    // Flashing coordinate pillar
    const postGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    const postMat = new THREE.MeshBasicMaterial({ color: '#facc15' });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(c.x, 4.0, c.z);
    boundaryGroup.add(post);
  });

  group.add(boundaryGroup);

  // 3. True North Indicator Arrow on ground
  const arrowDir = new THREE.Vector3(0, 0, -1);
  const arrowOrigin = new THREE.Vector3(160, 0.5, -110);
  const arrowHelper = new THREE.ArrowHelper(arrowDir, arrowOrigin, 25, 0xef4444, 8, 5);
  group.add(arrowHelper);

  // 4. Physical 100-Meter Ground Scale Ruler
  const scaleStart = new THREE.Vector3(-150, 0.4, 115);
  const scaleEnd = new THREE.Vector3(-50, 0.4, 115);
  const scaleGeo = new THREE.BufferGeometry().setFromPoints([scaleStart, scaleEnd]);
  const scaleLine = new THREE.Line(scaleGeo, new THREE.LineBasicMaterial({ color: '#38bdf8' }));
  group.add(scaleLine);

  [-150, -100, -50].forEach((tx) => {
    const tickGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(tx, 0.4, 111),
      new THREE.Vector3(tx, 0.4, 119),
    ]);
    const tickLine = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: '#38bdf8' }));
    group.add(tickLine);
  });
}

// Build Dense Classified Point Cloud
function buildClassifiedPointCloud(scenario: MissionScenario, pointCloudGroup: THREE.Group) {
  const count = 18000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const domain = scenario.applicationDomain || (scenario.id as any);

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const x = (Math.random() - 0.5) * 260;
    const z = (Math.random() - 0.5) * 260;
    let y = 0;
    let r = 0.5, g = 0.5, b = 0.5;

    if (domain === 'urban-planning-smart-cities' || scenario.id === 'urban-downtown-corridor') {
      const nearRoad = Math.abs(x) < 22;
      const inBuilding = Math.abs(x) > 24 && Math.abs(x) < 65 && Math.random() > 0.3;
      if (inBuilding) {
        y = Math.random() * (40 + Math.random() * 20);
        r = 0.2; g = 0.75; b = 0.95; // Cyan building
      } else if (nearRoad) {
        y = Math.random() * 0.15;
        r = 0.4; g = 0.45; b = 0.55; // Slate road
      } else {
        y = Math.random() > 0.75 ? Math.random() * 8 : Math.random() * 0.2;
        r = y > 1 ? 0.13 : 0.7; g = y > 1 ? 0.77 : 0.35; b = y > 1 ? 0.36 : 0.1;
      }
    } else if (domain === 'infrastructure-inspection') {
      const nearViaduct = Math.abs(z) < 14;
      if (nearViaduct) {
        y = 16 + (Math.random() - 0.5) * 2.5;
        r = 0.45; g = 0.55; b = 0.65; // Slate bridge deck
      } else if (Math.abs(z - 75) < 8) {
        y = 20 + Math.random() * 18;
        r = 0.95; g = 0.8; b = 0.2; // Yellow transmission wire/pylon
      } else {
        y = Math.random() * 0.3;
        r = 0.35; g = 0.65; b = 0.25;
      }
    } else if (domain === 'construction-progress-monitoring') {
      const inPit = Math.abs(x) < 50 && Math.abs(z) < 40;
      if (inPit) {
        if (Math.abs(x + 10) < 18 && Math.abs(z) < 15) {
          y = Math.random() * 42 - 10;
          r = 0.2; g = 0.75; b = 0.95; // Concrete building core
        } else {
          y = -10.5 + Math.random() * 0.8;
          r = 0.7; g = 0.45; b = 0.2; // Excavation pit floor
        }
      } else {
        y = Math.random() * 0.4;
        r = 0.6; g = 0.4; b = 0.25;
      }
    } else if (domain === 'archaeological-documentation') {
      const onPlatform = Math.abs(x) < 45 && Math.abs(z) < 26;
      if (onPlatform) {
        y = 4.5 + Math.random() * 18;
        r = 0.85; g = 0.8; b = 0.7; // Marble / limestone ruins
      } else {
        y = Math.random() * 0.3;
        r = 0.65; g = 0.5; b = 0.3;
      }
    } else if (domain === 'digital-twin-generation') {
      const inCampusBuilding = (Math.abs(x - 50) < 25 || Math.abs(x + 50) < 25) && Math.abs(z) < 55;
      if (inCampusBuilding) {
        y = Math.random() * 34;
        r = 0.15; g = 0.75; b = 0.95; // Smart building
      } else {
        y = Math.random() * 0.25;
        r = 0.2; g = 0.7; b = 0.4; // Green courtyard
      }
    } else if (domain === 'disaster-damage-assessment' || scenario.id === 'disaster-bridge-collapse') {
      const inRiver = Math.abs(x) < 32;
      if (inRiver) {
        y = -5 + Math.random() * 8;
        r = 0.3; g = 0.55; b = 0.75; // River & debris
      } else {
        y = Math.abs(x) > 75 ? 16 + Math.random() * 2 : 2 + Math.random() * 10;
        r = 0.6; g = 0.45; b = 0.3;
      }
    } else {
      // Border or Military Recon
      y = Math.sin(x * 0.04) * 8 + Math.cos(z * 0.03) * 6;
      if (y > 6) {
        r = 0.75; g = 0.5; b = 0.3; // High ridge
      } else {
        r = 0.65; g = 0.45; b = 0.25; // Arid terrain
      }
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;

    colors[idx] = r;
    colors[idx + 1] = g;
    colors[idx + 2] = b;
  }

  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pointGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const pointMat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    sizeAttenuation: true,
  });

  const pCloud = new THREE.Points(pointGeo, pointMat);
  pointCloudGroup.add(pCloud);
}

// Compute elevation coloring for buffer geometry
function applyElevationColors(geo: THREE.BufferGeometry, minZ: number, maxZ: number) {
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const c = getHypsometricColor(y, minZ, maxZ);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

// Build GCP 3D Markers with Survey flags
function buildGcpMarkers(gcps: GroundControlPoint[], group: THREE.Group) {
  group.clear();

  gcps.forEach((gcp) => {
    // 3D Checkerboard base pad
    const padGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.3, 16);
    const padMat = new THREE.MeshBasicMaterial({
      color: gcp.isCheckPoint ? '#38bdf8' : '#f59e0b',
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(gcp.surveyedX * 0.7, gcp.surveyedZ * 0.7 + 0.15, gcp.surveyedY * 0.7);
    pad.userData = { isGcp: true, gcpData: gcp };
    group.add(pad);

    // Vertical survey pole
    const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    const poleMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(gcp.surveyedX * 0.7, gcp.surveyedZ * 0.7 + 2.5, gcp.surveyedY * 0.7);
    pole.userData = { isGcp: true, gcpData: gcp };
    group.add(pole);

    // Survey target diamond / flag
    const flagGeo = new THREE.OctahedronGeometry(1.2);
    const flagMat = new THREE.MeshStandardMaterial({
      color: gcp.isCheckPoint ? '#0284c7' : '#ef4444',
      roughness: 0.2,
      metalness: 0.3,
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(gcp.surveyedX * 0.7, gcp.surveyedZ * 0.7 + 5.5, gcp.surveyedY * 0.7);
    flag.userData = { isGcp: true, gcpData: gcp };
    group.add(flag);
  });
}

// Drone Model & Flight Path Line
function buildDroneAndFlightPath(
  scenario: MissionScenario,
  scene: THREE.Scene,
  droneGroup: THREE.Group,
  frustumGroup: THREE.Group
) {
  droneGroup.clear();
  frustumGroup.clear();

  // Quadcopter Body
  const bodyGeo = new THREE.BoxGeometry(4, 1.2, 4);
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.3, metalness: 0.8 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  droneGroup.add(body);

  // 4 Rotor Arms
  const armMat = new THREE.MeshStandardMaterial({ color: '#334155' });
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8), armMat);
  arm1.rotation.z = Math.PI / 2;
  arm1.rotation.y = Math.PI / 4;
  droneGroup.add(arm1);

  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8), armMat);
  arm2.rotation.z = Math.PI / 2;
  arm2.rotation.y = -Math.PI / 4;
  droneGroup.add(arm2);

  // Drone gimbal camera unit
  const gimbalGeo = new THREE.SphereGeometry(1.1, 16, 16);
  const gimbalMat = new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.9, roughness: 0.1 });
  const gimbal = new THREE.Mesh(gimbalGeo, gimbalMat);
  gimbal.position.y = -0.9;
  droneGroup.add(gimbal);

  // Optical Camera Frustum Cone (visualizes single-pass oblique coverage)
  const frustumHeight = 55;
  const frustumBaseWidth = 50;
  const frustumBaseDepth = 35;
  const frustumGeo = new THREE.ConeGeometry(frustumBaseWidth / 2, frustumHeight, 4, 1, true);
  frustumGeo.rotateY(Math.PI / 4);
  frustumGeo.translate(0, -frustumHeight / 2, 0);

  const frustumMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const frustumMesh = new THREE.Mesh(frustumGeo, frustumMat);
  frustumMesh.name = 'frustum';
  frustumGroup.add(frustumMesh);

  // Frustum bounding edges
  const edges = new THREE.EdgesGeometry(frustumGeo);
  const lineMat = new THREE.LineBasicMaterial({ color: '#0284c7', transparent: true, opacity: 0.55 });
  const wireFrustum = new THREE.LineSegments(edges, lineMat);
  frustumGroup.add(wireFrustum);

  // Flight Path Spline
  const flightLength = scenario.flightLengthMeters * 0.45;
  const rad = ((scenario.telemetryStream[0]?.headingDeg || 45) - 90) * (Math.PI / 180);
  const pStart = new THREE.Vector3(
    -Math.cos(rad) * (flightLength / 2),
    scenario.flightAltitudeMeters * 0.7,
    -Math.sin(rad) * (flightLength / 2)
  );
  const pEnd = new THREE.Vector3(
    Math.cos(rad) * (flightLength / 2),
    scenario.flightAltitudeMeters * 0.7,
    Math.sin(rad) * (flightLength / 2)
  );

  const flightCurve = new THREE.LineCurve3(pStart, pEnd);
  const pathGeo = new THREE.BufferGeometry().setFromPoints(flightCurve.getPoints(30));
  const pathMat = new THREE.LineDashedMaterial({
    color: '#06b6d4',
    dashSize: 3,
    gapSize: 2,
    linewidth: 2,
  });
  const flightLine = new THREE.Line(pathGeo, pathMat);
  flightLine.computeLineDistances();
  scene.add(flightLine);
}

// Build Procedural 3D Gaussian Splats (Radiance Field representation)
function buildGaussianSplats(scenario: MissionScenario, splatsGroup: THREE.Group) {
  splatsGroup.clear();
  const count = 7500;
  const sphereGeo = new THREE.SphereGeometry(1, 8, 6);
  sphereGeo.scale(2.2, 0.45, 1.4);

  const splatMat = new THREE.MeshStandardMaterial({
    roughness: 0.35,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const instancedMesh = new THREE.InstancedMesh(sphereGeo, splatMat, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const domain = scenario.applicationDomain || (scenario.id as any);

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 260;
    const z = (Math.random() - 0.5) * 260;
    let y = 0.2;

    if (domain === 'urban-planning-smart-cities') {
      const nearRoad = Math.abs(x) < 22;
      const inBuilding = Math.abs(x) > 24 && Math.abs(x) < 65;
      if (inBuilding) {
        y = Math.random() * 45;
        color.setHSL(0.55 + Math.random() * 0.08, 0.8, 0.55); // Cyan glass radiance
      } else if (nearRoad) {
        y = Math.random() * 0.2;
        color.setHSL(0.6, 0.1, 0.4); // Dark asphalt
      } else {
        y = Math.random() * 0.2;
        color.setHSL(0.3, 0.4, 0.35); // Vegetation
      }
    } else if (domain === 'infrastructure-inspection') {
      const nearViaduct = Math.abs(z) < 14;
      if (nearViaduct) {
        y = 16 + (Math.random() - 0.5) * 3;
        color.setHSL(0.58, 0.4, 0.65); // Concrete viaduct deck
      } else {
        y = Math.random() * 0.3;
        color.setHSL(0.28, 0.4, 0.3); // Ground
      }
    } else if (domain === 'construction-progress-monitoring') {
      const inPit = Math.abs(x) < 50 && Math.abs(z) < 40;
      if (inPit) {
        if (Math.abs(x + 10) < 18 && Math.abs(z) < 15) {
          y = Math.random() * 40 - 10;
          color.setHSL(0.55, 0.8, 0.5); // Core wall
        } else {
          y = -10 + Math.random() * 1.5;
          color.setHSL(0.08, 0.6, 0.35); // Dirt cut
        }
      } else {
        y = Math.random() * 0.4;
        color.setHSL(0.12, 0.4, 0.3);
      }
    } else if (domain === 'archaeological-documentation') {
      const onPlatform = Math.abs(x) < 45 && Math.abs(z) < 26;
      if (onPlatform) {
        y = 4.5 + Math.random() * 18;
        color.setHSL(0.1, 0.35, 0.75); // Cream/limestone
      } else {
        y = Math.random() * 0.3;
        color.setHSL(0.08, 0.3, 0.35);
      }
    } else if (domain === 'digital-twin-generation') {
      const inCampusBuilding = (Math.abs(x - 50) < 25 || Math.abs(x + 50) < 25) && Math.abs(z) < 55;
      if (inCampusBuilding) {
        y = Math.random() * 32;
        color.setHSL(0.56, 0.85, 0.6); // Tech building
      } else {
        y = Math.random() * 0.25;
        color.setHSL(0.35, 0.6, 0.45); // Campus greens
      }
    } else if (domain === 'disaster-damage-assessment') {
      const inRiver = Math.abs(x) < 32;
      if (inRiver) {
        y = -5 + Math.random() * 8;
        color.setHSL(0.58, 0.6, 0.45); // Water & debris
      } else {
        y = Math.abs(x) > 75 ? 16 + Math.random() * 2 : 2 + Math.random() * 8;
        color.setHSL(0.08, 0.35, 0.35);
      }
    } else {
      // Border or Military Recon
      y = Math.sin(x * 0.04) * 8 + Math.cos(z * 0.03) * 6;
      color.setHSL(0.1, 0.5, y > 5 ? 0.45 : 0.3);
    }

    dummy.position.set(x, y, z);
    dummy.rotation.set(
      (Math.random() - 0.5) * 0.6,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.6
    );
    const scaleFactor = 0.7 + Math.random() * 0.9;
    dummy.scale.set(scaleFactor, scaleFactor * 0.55, scaleFactor * 1.3);
    dummy.updateMatrix();

    instancedMesh.setMatrixAt(i, dummy.matrix);
    instancedMesh.setColorAt(i, color);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
  splatsGroup.add(instancedMesh);
}

// Build 3D AI Bounding Boxes (YOLOv8 & Faster R-CNN) in Viewport
function updateAiDetectionsIn3D(
  scenario: MissionScenario,
  activeTelemetryIndex: number,
  aiGroup: THREE.Group,
  visible: boolean
) {
  aiGroup.clear();
  if (!visible) return;

  const t = activeTelemetryIndex % 8;
  const domain = scenario.applicationDomain;

  interface Target3D {
    id: string;
    label: string;
    model: 'yolov8' | 'faster-rcnn';
    confidence: number;
    pos: [number, number, number];
    size: [number, number, number];
    color: string;
  }

  const targets: Target3D[] = [];

  if (domain === 'border-strategic-mapping') {
    targets.push(
      {
        id: 'patrol-apc',
        label: 'YOLOv8 [95%]: Patrol APC (Dynamic)',
        model: 'yolov8',
        confidence: 0.95,
        pos: [20 + Math.cos(t) * 12, 1.8, -30 + Math.sin(t) * 10],
        size: [7, 3.2, 4],
        color: '#f59e0b',
      },
      {
        id: 'watchtower-asset',
        label: 'Faster R-CNN [98%]: Watchtower Mast',
        model: 'faster-rcnn',
        confidence: 0.98,
        pos: [60, 14, -50],
        size: [6, 26, 6],
        color: '#f43f5e',
      },
      {
        id: 'security-wire',
        label: 'YOLOv8 [92%]: Razor Barrier Line',
        model: 'yolov8',
        confidence: 0.92,
        pos: [0, 1.5, 0],
        size: [120, 2.5, 2],
        color: '#06b6d4',
      }
    );
  } else if (domain === 'disaster-damage-assessment') {
    targets.push(
      {
        id: 'span-fracture',
        label: 'Faster R-CNN [97%]: Girder Fracture Gap',
        model: 'faster-rcnn',
        confidence: 0.97,
        pos: [0, 8.5, 0],
        size: [15, 6, 12],
        color: '#f43f5e',
      },
      {
        id: 'debris-field',
        label: 'YOLOv8 [93%]: Riverbed Rubble Mass',
        model: 'yolov8',
        confidence: 0.93,
        pos: [-10, 1.5, 15],
        size: [28, 5, 20],
        color: '#f59e0b',
      }
    );
  } else if (domain === 'urban-planning-smart-cities') {
    targets.push(
      {
        id: 'facade-roi',
        label: 'Faster R-CNN [96%]: Building Setback Glazing',
        model: 'faster-rcnn',
        confidence: 0.96,
        pos: [-35, 24, -60],
        size: [30, 48, 26],
        color: '#f43f5e',
      },
      {
        id: 'traffic-filter',
        label: 'YOLOv8 [94%]: Moving Traffic (Masked for 3DGS)',
        model: 'yolov8',
        confidence: 0.94,
        pos: [0, 1.2, -15 + Math.sin(t) * 25],
        size: [5, 2.4, 3],
        color: '#06b6d4',
      }
    );
  } else if (domain === 'infrastructure-inspection') {
    targets.push(
      {
        id: 'concrete-spall',
        label: 'Faster R-CNN [98%]: Sub-cm Pier Shear Crack',
        model: 'faster-rcnn',
        confidence: 0.98,
        pos: [0, 14.5, 0],
        size: [6, 4, 6],
        color: '#f43f5e',
      },
      {
        id: 'pylon-catenary',
        label: 'YOLOv8 [95%]: High-Voltage Catenary Cable',
        model: 'yolov8',
        confidence: 0.95,
        pos: [0, 26, 75],
        size: [100, 4, 4],
        color: '#f59e0b',
      }
    );
  } else if (domain === 'construction-progress-monitoring') {
    targets.push(
      {
        id: 'core-wall',
        label: 'Faster R-CNN [97%]: Concrete Core Tolerances',
        model: 'faster-rcnn',
        confidence: 0.97,
        pos: [-10, 18, 0],
        size: [18, 38, 18],
        color: '#f43f5e',
      },
      {
        id: 'tower-crane',
        label: 'YOLOv8 [96%]: Tower Crane Dynamic Slewing',
        model: 'yolov8',
        confidence: 0.96,
        pos: [35, 28, 20],
        size: [10, 48, 10],
        color: '#f59e0b',
      }
    );
  } else if (domain === 'archaeological-documentation') {
    targets.push(
      {
        id: 'temple-capital',
        label: 'Faster R-CNN [98%]: Corinthian Capital Relic',
        model: 'faster-rcnn',
        confidence: 0.98,
        pos: [-28, 14, -18],
        size: [5, 5, 5],
        color: '#f43f5e',
      },
      {
        id: 'trench-grid',
        label: 'YOLOv8 [93%]: Excavation Quadrat Pit',
        model: 'yolov8',
        confidence: 0.93,
        pos: [25, 2, 20],
        size: [28, 4, 22],
        color: '#06b6d4',
      }
    );
  } else if (domain === 'digital-twin-generation') {
    targets.push(
      {
        id: 'hvac-node',
        label: 'Faster R-CNN [96%]: Rooftop HVAC IoT Node',
        model: 'faster-rcnn',
        confidence: 0.96,
        pos: [-40, 26, -30],
        size: [9, 5, 9],
        color: '#f43f5e',
      },
      {
        id: 'solar-field',
        label: 'YOLOv8 [97%]: Photovoltaic Solar Grid Array',
        model: 'yolov8',
        confidence: 0.97,
        pos: [40, 22, -30],
        size: [32, 3, 24],
        color: '#06b6d4',
      }
    );
  } else {
    // Military Recon
    targets.push(
      {
        id: 'bunker-target',
        label: 'Faster R-CNN [99%]: Reinforced Command Bunker',
        model: 'faster-rcnn',
        confidence: 0.99,
        pos: [20, 20, -10],
        size: [26, 8, 20],
        color: '#f43f5e',
      },
      {
        id: 'heli-lz',
        label: 'YOLOv8 [96%]: Helicopter Landing Pad (LZ Alpha)',
        model: 'yolov8',
        confidence: 0.96,
        pos: [-65, 13, 20],
        size: [34, 3, 34],
        color: '#f59e0b',
      }
    );
  }

  targets.forEach((tgt) => {
    // 3D Bounding Box Wireframe
    const boxGeo = new THREE.BoxGeometry(tgt.size[0], tgt.size[1], tgt.size[2]);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: tgt.color,
      linewidth: 2,
      depthTest: false,
    });
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    lineSegments.position.set(tgt.pos[0], tgt.pos[1], tgt.pos[2]);
    lineSegments.renderOrder = 998;
    aiGroup.add(lineSegments);

    // Floating 3D Text Tag via Canvas Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = tgt.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, 368, 80, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(tgt.label, 20, 42);

      ctx.fillStyle = tgt.model === 'yolov8' ? '#fbbf24' : '#fb7185';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(
        tgt.model === 'yolov8' ? 'YOLOv8 Edge Real-Time' : 'Faster R-CNN RoIAlign FPN',
        20,
        70
      );

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(tgt.pos[0], tgt.pos[1] + tgt.size[1] / 2 + 3.5, tgt.pos[2]);
      sprite.scale.set(16, 4, 1);
      sprite.renderOrder = 1000;
      aiGroup.add(sprite);
    }
  });
}
