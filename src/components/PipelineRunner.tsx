import React, { useState, useEffect } from 'react';
import { ReconstructionPipelineStep, MissionScenario } from '../types/reconstruction';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCheck,
  Video,
} from 'lucide-react';

interface PipelineRunnerProps {
  scenario: MissionScenario;
  onPipelineCompleted?: () => void;
  customVideoUrl?: string | null;
}

const INITIAL_STEPS: ReconstructionPipelineStep[] = [
  {
    id: 'step-1',
    name: 'OpenCV / FFmpeg Keyframe Blur Filtering',
    description: 'Extracts 60fps I-frames, calculates Laplacian blur variance, and rejects motion-smeared frames.',
    status: 'completed',
    progress: 100,
    durationSec: 18.4,
    metrics: { 'Frames Analyzed': 1920, 'Keyframes Retained': 312, 'Blur Rejection': '14.2%' },
    outputSummary: '312 sharp keyframes extracted with sharpness index > 0.85.',
  },
  {
    id: 'step-2',
    name: 'YOLOv8 & Faster R-CNN Dynamic Object Masking',
    description: 'Applies YOLOv8 (6.4ms) and Faster R-CNN (RPN) to detect and mask out moving vehicles/pedestrians.',
    status: 'completed',
    progress: 100,
    durationSec: 24.1,
    metrics: { 'YOLOv8 Detections': 64, 'Faster R-CNN Defects': 12, 'Masking Confidence': '98.4%' },
    outputSummary: '64 moving vehicles and pedestrians masked to prevent 3DGS ghosting.',
  },
  {
    id: 'step-3',
    name: 'OpenMVG / COLMAP Linear SfM Pose Fusion',
    description: 'Overcomes collinear trajectory degeneracy using OpenMVG Global SfM and RTK-GNSS priors.',
    status: 'completed',
    progress: 100,
    durationSec: 42.6,
    metrics: { 'Reprojection Error': '0.68 px', 'Collinear Rigidity': '99.6%', 'Tie Points': '214,800' },
    outputSummary: 'Camera poses optimized with 0.68 px mean reprojection error.',
  },
  {
    id: 'step-4',
    name: 'VYOM-3DGS 3D Gaussian Splatting Optimization',
    description: 'Optimizes 3D Gaussians with forward-overlap collinear regularization and SH color spherical harmonics.',
    status: 'completed',
    progress: 100,
    durationSec: 58.2,
    metrics: { '3D Gaussians': '1.85M', 'Rasterization Speed': '134 FPS', 'PSNR / SSIM': '32.4 dB / 0.96' },
    outputSummary: 'High-fidelity 3D Gaussian splat field optimized with sub-centimeter fidelity.',
  },
  {
    id: 'step-5',
    name: 'OpenMVS Dense Point Cloud & Poisson Meshing',
    description: 'Computes multi-view stereo dense depth, voxel filtering, and watertight Poisson polygon mesh.',
    status: 'completed',
    progress: 100,
    durationSec: 51.5,
    metrics: { 'Dense Points': '5.2M', 'OpenMVS Triangles': '1.4M', 'Voxel Size': '1.8 cm' },
    outputSummary: '1.4M triangle manifold mesh generated with sharp architectural edges.',
  },
  {
    id: 'step-6',
    name: 'CloudCompare M3C2 Audit & QGIS/GDAL Ortho Atlas',
    description: 'Verifies sub-10cm accuracy with CloudCompare M3C2 against GCPs and bakes 8K QGIS-ready orthomosaic.',
    status: 'completed',
    progress: 100,
    durationSec: 27.2,
    metrics: { 'CloudCompare M3C2 RMSE': '4.1 cm', 'Texture Resolution': '8192 x 8192', 'CRS': 'EPSG:32610' },
    outputSummary: 'Full CloudCompare compliance certificate and georeferenced ortho atlas generated.',
  },
];

export const PipelineRunner: React.FC<PipelineRunnerProps> = ({
  scenario,
  onPipelineCompleted,
  customVideoUrl,
}) => {
  const [steps, setSteps] = useState<ReconstructionPipelineStep[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(5);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Settings
  const [pointDensity, setPointDensity] = useState<'ultra' | 'high' | 'standard'>('high');
  const [neuralInpaintStrength, setNeuralInpaintStrength] = useState<number>(85);
  const [blurThreshold, setBlurThreshold] = useState<number>(0.12);

  // Simulated live execution
  const handleStartPipeline = () => {
    setIsRunning(true);
    setCurrentStepIndex(0);

    const resetSteps = INITIAL_STEPS.map((s, idx) => ({
      ...s,
      status: (idx === 0 ? 'processing' : 'pending') as any,
      progress: 0,
    }));
    setSteps(resetSteps);
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSteps((prevSteps) => {
        const nextSteps = [...prevSteps];
        const step = nextSteps[currentStepIndex];

        if (step && step.status === 'processing') {
          if (step.progress < 100) {
            step.progress = Math.min(100, step.progress + 25);
          } else {
            step.status = 'completed';
            if (currentStepIndex + 1 < nextSteps.length) {
              setCurrentStepIndex(currentStepIndex + 1);
              nextSteps[currentStepIndex + 1].status = 'processing';
            } else {
              setIsRunning(false);
              onPipelineCompleted?.();
            }
          }
        }
        return nextSteps;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isRunning, currentStepIndex, onPipelineCompleted]);

  const totalTimeSec = steps.reduce((acc, s) => acc + s.durationSec, 0);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 font-mono">
            RECONSTRUCTION PIPELINE
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>Config</span>
            {showConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Uploaded Video Input Status */}
      {customVideoUrl && (
        <div className="mx-4 mt-3 p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/70 flex items-center justify-between text-xs font-mono shadow-md">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div>
              <div className="font-bold text-white text-[11px]">ACTIVE SOURCE: USER DRONE VIDEO</div>
              <div className="text-[10px] text-cyan-300">Extracting 4K I-Frames for 3DGS & SfM Mesh</div>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900 text-cyan-200 font-bold border border-cyan-700">
            LOADED
          </span>
        </div>
      )}

      <div className="p-4 flex flex-col gap-4">
        {/* Processing Time Benchmark Card */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-mono text-slate-400">TOTAL PROCESSING DURATION</span>
              <span className="text-base font-bold font-mono text-slate-100">
                {Math.floor(totalTimeSec / 60)}m {Math.round(totalTimeSec % 60)}s
                <span className="text-xs text-emerald-400 font-normal ml-2">
                  (Target: ≤ 5 min - PASSED)
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={handleStartPipeline}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Re-Run Pipeline</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible Config Parameters */}
        {showConfig && (
          <div className="p-3.5 rounded-lg bg-slate-950/90 border border-slate-800 flex flex-col gap-3 animate-in fade-in">
            <span className="text-xs font-mono font-semibold text-cyan-300">
              PHOTOGRAMMETRIC ENGINE PARAMETERS
            </span>

            {/* Point density */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-300">
                <span>Point Cloud Density</span>
                <span className="text-cyan-400 uppercase font-bold">{pointDensity}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['standard', 'high', 'ultra'] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => setPointDensity(density)}
                    className={`py-1 text-[11px] font-mono rounded border capitalize transition-colors ${
                      pointDensity === density
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>

            {/* Neural Inpaint Strength */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-300">
                <span>Occlusion Inpainting Weight</span>
                <span className="text-cyan-400 font-bold">{neuralInpaintStrength}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={neuralInpaintStrength}
                onChange={(e) => setNeuralInpaintStrength(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] text-slate-500">
                Balances monocular geometric priors against sparse multiview stereo points
              </span>
            </div>
          </div>
        )}

        {/* Step-by-Step Execution List */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-mono font-semibold text-slate-300">
            PIPELINE STAGES & TELEMETRY
          </span>

          {steps.map((step, idx) => {
            const isDone = step.status === 'completed';
            const isCur = step.status === 'processing';

            return (
              <div
                key={step.id}
                className={`p-3 rounded-lg border transition-all ${
                  isCur
                    ? 'bg-slate-950 border-cyan-500/80 shadow-lg shadow-cyan-950/40'
                    : isDone
                    ? 'bg-slate-950/60 border-slate-800'
                    : 'bg-slate-950/30 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCur ? (
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{step.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {step.durationSec}s
                  </span>
                </div>

                {/* Progress bar if active */}
                {isCur && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                )}

                {/* Metrics Badges */}
                <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60 font-mono text-[10px]">
                  {Object.entries(step.metrics).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      <span className="text-slate-500">{k}:</span>{' '}
                      <span className="text-cyan-400 font-semibold">{v}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
