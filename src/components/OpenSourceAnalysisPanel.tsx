import React, { useState } from 'react';
import { MissionScenario, OpenSourceSoftwareEngine } from '../types/reconstruction';
import { OPEN_SOURCE_ENGINES, AI_DETECTOR_SPECS, getScenarioDetections } from '../data/openSourceAnalysisData';
import {
  Cpu,
  Layers,
  Zap,
  Code2,
  Copy,
  Check,
  Terminal,
  Activity,
  Filter,
  BarChart3,
  Shield,
  FileCode,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface OpenSourceAnalysisPanelProps {
  scenario: MissionScenario;
  activeTelemetryIndex: number;
}

export const OpenSourceAnalysisPanel: React.FC<OpenSourceAnalysisPanelProps> = ({
  scenario,
  activeTelemetryIndex,
}) => {
  const [selectedEngineId, setSelectedEngineId] = useState<OpenSourceSoftwareEngine>('vyom-3dgs');
  const [activeAiTab, setActiveAiTab] = useState<'yolov8' | 'faster-rcnn'>('yolov8');
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  const selectedEngine =
    OPEN_SOURCE_ENGINES.find((e) => e.id === selectedEngineId) || OPEN_SOURCE_ENGINES[0];

  const detections = getScenarioDetections(scenario.applicationDomain, activeTelemetryIndex);

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-wide text-slate-100 font-mono uppercase">
              OPEN SOURCE ANALYSIS & AI DETECTORS
            </h2>
            <div className="text-[10px] text-slate-400 font-mono">
              YOLOv8 • Faster R-CNN • 3DGS • OpenDroneMap • COLMAP • CloudCompare
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-semibold">
          FOSS & PyTorch
        </span>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Section 1: AI Object Detection (YOLOv8 vs Faster R-CNN) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              AI OBJECT DETECTOR BENCHMARK
            </span>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5 text-[10px] font-mono">
              <button
                onClick={() => setActiveAiTab('yolov8')}
                className={`px-2 py-0.5 rounded transition-all ${
                  activeAiTab === 'yolov8'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                YOLOv8
              </button>
              <button
                onClick={() => setActiveAiTab('faster-rcnn')}
                className={`px-2 py-0.5 rounded transition-all ${
                  activeAiTab === 'faster-rcnn'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Faster R-CNN
              </button>
            </div>
          </div>

          {/* Model Spec Card */}
          {activeAiTab === 'yolov8' ? (
            <div className="p-3.5 rounded-lg bg-slate-950/90 border border-cyan-500/50 flex flex-col gap-2 text-xs font-mono animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-cyan-400 font-bold text-[13px]">{AI_DETECTOR_SPECS.yolov8.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Real-Time Dynamic Suppression
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-500 block text-[10px]">LATENCY:</span>
                  <span className="text-emerald-400 font-bold">{AI_DETECTOR_SPECS.yolov8.speedMs}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">mAP50-95 ACCURACY:</span>
                  <span className="text-cyan-300 font-bold">{AI_DETECTOR_SPECS.yolov8.mAP50_95}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-1 leading-relaxed">
                <strong>Architecture:</strong> {AI_DETECTOR_SPECS.yolov8.architecture}
              </p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/90 text-[10px] text-slate-400">
                <span className="text-cyan-400 font-semibold block mb-0.5">Role in VYOM3DGS:</span>
                {AI_DETECTOR_SPECS.yolov8.primaryRole}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-slate-950/90 border border-amber-500/50 flex flex-col gap-2 text-xs font-mono animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-amber-400 font-bold text-[13px]">{AI_DETECTOR_SPECS.fasterRcnn.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Two-Stage RPN Mensuration
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-500 block text-[10px]">LATENCY:</span>
                  <span className="text-amber-400 font-bold">{AI_DETECTOR_SPECS.fasterRcnn.speedMs}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">mAP50-95 ACCURACY:</span>
                  <span className="text-emerald-400 font-bold">{AI_DETECTOR_SPECS.fasterRcnn.mAP50_95}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-1 leading-relaxed">
                <strong>Architecture:</strong> {AI_DETECTOR_SPECS.fasterRcnn.architecture}
              </p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/90 text-[10px] text-slate-400">
                <span className="text-amber-400 font-semibold block mb-0.5">Role in VYOM3DGS:</span>
                {AI_DETECTOR_SPECS.fasterRcnn.primaryRole}
              </div>
            </div>
          )}

          {/* Active Frame Detections Table */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>LIVE FRAME DETECTIONS ({detections.length})</span>
              <span className="text-cyan-400">Time: {(activeTelemetryIndex * 0.5).toFixed(1)}s</span>
            </span>

            <div className="flex flex-col gap-1.5 font-mono text-xs">
              {detections.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-[11px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        d.model === 'yolov8' ? 'bg-cyan-400' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-slate-200 font-medium truncate">{d.label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-emerald-400 font-bold">{(d.confidence * 100).toFixed(0)}%</span>
                    <span
                      className={`text-[9px] px-1 rounded uppercase font-bold ${
                        d.model === 'yolov8'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {d.model}
                    </span>
                    {d.isDynamic && (
                      <span className="text-[9px] px-1 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        Masked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Open Source Software Photogrammetric Engines */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              OPEN SOURCE ANALYSIS ENGINES
            </span>
            <span className="text-[10px] text-slate-500 font-normal">FOSS Pipeline</span>
          </span>

          {/* Engine Selector Pills */}
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
            {OPEN_SOURCE_ENGINES.map((e) => {
              const isSelected = selectedEngineId === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedEngineId(e.id)}
                  className={`p-2 rounded-md border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 font-bold shadow-md shadow-cyan-950/40'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{e.name}</span>
                  <span className="text-[8px] opacity-60 uppercase">{e.category.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Engine Dossier */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2.5 font-mono text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div>
                <h4 className="text-slate-100 font-bold text-xs">{selectedEngine.fullName}</h4>
                <span className="text-[10px] text-cyan-400">{selectedEngine.category} • v{selectedEngine.version}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                {selectedEngine.license}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">SPEED / LATENCY:</span>
                <span className="text-emerald-400 font-bold">{selectedEngine.fpsOrSpeed}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">VRAM FOOTPRINT:</span>
                <span className="text-slate-200">{selectedEngine.gpuMemoryMb} MB</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px]">COLLINEAR DEGENERACY HANDLING:</span>
                <span className="text-cyan-300">{selectedEngine.collinearDriftResistance}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1 border-t border-slate-800/80">
              {selectedEngine.keyFeature}
            </p>

            {/* CLI Command Sample with Copy Button */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  CLI INVOCATION SCRIPT:
                </span>
                <button
                  onClick={() => handleCopyCommand(selectedEngine.cliCommandSample)}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                </button>
              </span>
              <pre className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 font-mono overflow-x-auto custom-scrollbar">
                <code>{selectedEngine.cliCommandSample}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Section 3: Open Source Pipeline Graph Overview */}
        <div className="p-3.5 rounded-lg bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col gap-2 font-mono text-xs">
          <span className="text-slate-300 font-bold flex items-center gap-1.5 text-[11px]">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            VYOM3DGS END-TO-END FOSS STACK
          </span>
          <div className="flex flex-col gap-1 text-[10px] text-slate-400 font-sans leading-relaxed">
            <div>1. <strong>Video Keyframe Ingestion:</strong> FFmpeg + OpenCV Laplacian Blur Rejection</div>
            <div>2. <strong>Dynamic Masking:</strong> YOLOv8 (6.4ms) + Faster R-CNN (RPN) defect Mensuration</div>
            <div>3. <strong>Pose Estimation:</strong> OpenMVG Linear SfM / COLMAP Sequential Matcher</div>
            <div>4. <strong>3D Radiance Field:</strong> Inria 3D Gaussian Splatting + Collinear Regularization</div>
            <div>5. <strong>Quality Verification:</strong> CloudCompare M3C2 point cloud distance to GCPs</div>
            <div>6. <strong>GIS Ingestion:</strong> QGIS / GDAL / PDAL georeferenced exports</div>
          </div>
        </div>
      </div>
    </div>
  );
};
