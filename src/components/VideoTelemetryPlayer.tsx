import React, { useState, useEffect, useRef } from 'react';
import { MissionScenario, TelemetryFrame, AiDetectorModel, DetectedBoundingBox } from '../types/reconstruction';
import { getScenarioDetections, AI_DETECTOR_SPECS } from '../data/openSourceAnalysisData';
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  Gauge,
  Compass,
  Radio,
  Crosshair,
  Layers,
  ChevronRight,
  Maximize,
  Volume2,
  VolumeX,
  Cpu,
  Eye,
  ShieldCheck,
  Zap,
  Filter,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface VideoTelemetryPlayerProps {
  scenario: MissionScenario;
  activeTelemetryIndex: number;
  onSeek: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  customVideoUrl?: string | null;
  onClearCustomVideo?: () => void;
  onCustomVideoUploaded?: (videoUrl: string) => void;
}

export const VideoTelemetryPlayer: React.FC<VideoTelemetryPlayerProps> = ({
  scenario,
  activeTelemetryIndex,
  onSeek,
  isPlaying,
  onTogglePlay,
  customVideoUrl: externalCustomVideoUrl,
  onClearCustomVideo,
  onCustomVideoUploaded,
}) => {
  const currentFrame: TelemetryFrame =
    scenario.telemetryStream[activeTelemetryIndex] || scenario.telemetryStream[0];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [internalCustomVideoUrl, setInternalCustomVideoUrl] = useState<string | null>(null);
  const activeVideoUrl = externalCustomVideoUrl !== undefined ? externalCustomVideoUrl : internalCustomVideoUrl;

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showFeatureOverlay, setShowFeatureOverlay] = useState<boolean>(true);
  const [playerViewMode, setPlayerViewMode] = useState<'hud' | 'clean' | 'keypoints'>('hud');

  // AI Detector States (YOLOv8 & Faster R-CNN)
  const [aiDetectorModel, setAiDetectorModel] = useState<AiDetectorModel>('yolov8');
  const [showDynamicMasking, setShowDynamicMasking] = useState<boolean>(true);

  // Scenario-tailored detections for active frame
  const allDetections = getScenarioDetections(scenario.applicationDomain, activeTelemetryIndex);
  const activeDetections = allDetections.filter((d) => {
    if (aiDetectorModel === 'none') return false;
    if (aiDetectorModel === 'ensemble') return true;
    return d.model === aiDetectorModel;
  });

  // Handle custom drone video upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setInternalCustomVideoUrl(url);
      onCustomVideoUploaded?.(url);
    }
  };

  // Drag and drop video file support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setInternalCustomVideoUrl(url);
      onCustomVideoUploaded?.(url);
    }
  };

  // Sync HTML5 Video playback with isPlaying state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync seek position when scrubbing
  useEffect(() => {
    if (videoRef.current && videoRef.current.duration) {
      const totalFrames = Math.max(1, scenario.telemetryStream.length - 1);
      const targetTime = (activeTelemetryIndex / totalFrames) * videoRef.current.duration;
      if (Math.abs(videoRef.current.currentTime - targetTime) > 0.6) {
        videoRef.current.currentTime = targetTime;
      }
    }
  }, [activeTelemetryIndex, scenario.telemetryStream.length]);

  return (
    <div
      className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100 select-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-semibold text-slate-200">VYOM RECON VIDEO</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-medium">
            {activeVideoUrl ? '4K 60FPS CUSTOM' : scenario.sensorResolution}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {activeVideoUrl && (
            <button
              onClick={() => {
                setInternalCustomVideoUrl(null);
                onClearCustomVideo?.();
              }}
              className="flex items-center gap-1 px-1.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-[10px] text-rose-300 transition-colors"
              title="Clear custom video and reset to scenario feed"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Reset</span>
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/70 text-[11px] text-cyan-200 transition-colors font-semibold"
            title="Upload custom drone video (.mp4/.mov/.webm)"
          >
            <Upload className="w-3 h-3 text-cyan-400" />
            <span>{activeVideoUrl ? 'Change Video' : 'Load Video'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* AI Model & Player View Mode Selector Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] uppercase font-bold text-slate-400">DETECTOR:</span>
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
            <button
              onClick={() => setAiDetectorModel('yolov8')}
              className={`px-2 py-0.5 rounded text-[10px] transition-all font-semibold ${
                aiDetectorModel === 'yolov8'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="YOLOv8: Real-time dynamic masking & moving object tracking @ 6.4ms"
            >
              YOLOv8
            </button>
            <button
              onClick={() => setAiDetectorModel('faster-rcnn')}
              className={`px-2 py-0.5 rounded text-[10px] transition-all font-semibold ${
                aiDetectorModel === 'faster-rcnn'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Faster R-CNN: Two-stage Region Proposal Network (RPN) high-precision mensuration"
            >
              Faster R-CNN
            </button>
            <button
              onClick={() => setAiDetectorModel('ensemble')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-all font-semibold ${
                aiDetectorModel === 'ensemble'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ensemble: Fused dual-stage detections"
            >
              Ensemble
            </button>
            <button
              onClick={() => setAiDetectorModel('none')}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${
                aiDetectorModel === 'none'
                  ? 'bg-slate-700 text-slate-200'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              Off
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Player View Modes */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800 text-[10px]">
            <button
              onClick={() => setPlayerViewMode('hud')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                playerViewMode === 'hud' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Full Telemetry & AI Overlay Mode"
            >
              HUD
            </button>
            <button
              onClick={() => setPlayerViewMode('clean')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                playerViewMode === 'clean' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Clean Unobstructed Drone Camera Mode"
            >
              Clean
            </button>
          </div>

          <button
            onClick={() => setShowDynamicMasking(!showDynamicMasking)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
              showDynamicMasking
                ? 'bg-rose-950/70 border-rose-500/70 text-rose-300'
                : 'border-slate-800 text-slate-500'
            }`}
            title="Toggle Dynamic Object Masking (strips moving vehicles to clean 3DGS radiance field)"
          >
            <Filter className="w-2.5 h-2.5" />
            <span>Mask: {showDynamicMasking ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Uploaded Video Active Status Bar */}
      {activeVideoUrl && (
        <div className="px-3 py-1 bg-cyan-950/90 border-b border-cyan-800/60 flex items-center justify-between text-[10px] font-mono text-cyan-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">CUSTOM DRONE VIDEO LOADED</span>
          </div>
          <span className="text-cyan-400">Streaming to 3D Modes & Projection</span>
        </div>
      )}

      {/* Main Video & HUD Viewport */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {activeVideoUrl ? (
          <video
            ref={videoRef}
            src={activeVideoUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={scenario.videoThumbnail}
              alt="Drone Recon Stream"
              className="w-full h-full object-cover opacity-90 transition-transform duration-500"
              style={{
                transform: `scale(${1 + (activeTelemetryIndex % 10) * 0.008}) translateY(${
                  Math.sin(activeTelemetryIndex * 0.2) * 2
                }px)`,
              }}
            />
            {/* Subtle moving scanline / vignette effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
          </div>
        )}

        {/* Real-time YOLOv8 & Faster R-CNN 2D Bounding Boxes (Hidden in Clean mode) */}
        {playerViewMode === 'hud' && aiDetectorModel !== 'none' && (
          <div className="absolute inset-0 pointer-events-none">
            {activeDetections.map((det) => {
              const isYolo = det.model === 'yolov8';
              const isMasked = det.isDynamic && showDynamicMasking;
              const boxColor = isMasked
                ? 'border-rose-500 bg-rose-500/15'
                : isYolo
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-amber-400 bg-amber-400/10';

              return (
                <div
                  key={det.id}
                  className={`absolute border-2 rounded-xs transition-all duration-200 ${boxColor}`}
                  style={{
                    top: `${det.box.top}%`,
                    left: `${det.box.left}%`,
                    width: `${det.box.width}%`,
                    height: `${det.box.height}%`,
                  }}
                >
                  {/* Label Chip */}
                  <div
                    className={`absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold whitespace-nowrap flex items-center gap-1 shadow-md ${
                      isMasked
                        ? 'bg-rose-950 text-rose-200 border border-rose-500'
                        : isYolo
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-400'
                        : 'bg-amber-950 text-amber-200 border border-amber-400'
                    }`}
                  >
                    <span>{det.label}</span>
                    <span className="opacity-80">{(det.confidence * 100).toFixed(0)}%</span>
                    <span className="text-[8px] opacity-60 uppercase">[{det.model}]</span>
                  </div>

                  {/* Dynamic Masking Crosshatch Pattern */}
                  {isMasked && (
                    <div className="w-full h-full flex items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(244,63,94,0.3)_4px,rgba(244,63,94,0.3)_8px)]">
                      <span className="text-[8px] font-mono text-rose-300 font-bold bg-slate-950/80 px-1 rounded">
                        MASKED OUT
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Feature Tracking & Optical Flow Simulated Reticle */}
        {showFeatureOverlay && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Center Gimbal Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-cyan-400/50 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <div className="absolute w-16 h-px bg-cyan-400/40" />
              <div className="absolute h-16 w-px bg-cyan-400/40" />
            </div>

            {/* Random tracked photogrammetry keypoints (SIFT/SuperPoint simulation) */}
            {[...Array(14)].map((_, i) => {
              const x = 15 + ((i * 37 + activeTelemetryIndex * 7) % 70);
              const y = 20 + ((i * 43 + activeTelemetryIndex * 5) % 60);
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 border border-emerald-400 bg-emerald-400/20 rounded-xs transition-all duration-300"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span className="absolute -top-3 -left-1 text-[8px] font-mono text-emerald-400 font-bold">
                    P{100 + i}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Real-time Telemetry HUD Overlays (Hidden in Clean mode) */}
        {playerViewMode === 'hud' && (
          <>
            {/* Top-Left: GNSS & Coordinate Telemetry */}
            <div className="absolute top-3 left-3 pointer-events-none font-mono text-[11px] bg-slate-950/80 border border-slate-800/80 backdrop-blur-md rounded-md p-2 flex flex-col gap-1 text-slate-300 shadow-xl">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>GNSS RTK: {currentFrame.rtkStatus}</span>
              </div>
              <div>LAT: <span className="text-white font-medium">{currentFrame.latitude.toFixed(6)}°</span></div>
              <div>LON: <span className="text-white font-medium">{currentFrame.longitude.toFixed(6)}°</span></div>
              <div>SATS: <span className="text-emerald-400">{currentFrame.satellites}</span> (HDOP: {currentFrame.hdop})</div>
            </div>

            {/* Top-Right: Flight Dynamics HUD */}
            <div className="absolute top-3 right-3 pointer-events-none font-mono text-[11px] bg-slate-950/80 border border-slate-800/80 backdrop-blur-md rounded-md p-2 flex flex-col gap-1 text-slate-300 shadow-xl items-end">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Gauge className="w-3.5 h-3.5" />
                <span>ALT: {currentFrame.altitudeMeters.toFixed(1)} m ASL</span>
              </div>
              <div>REL ALT: <span className="text-white font-medium">{currentFrame.relativeAltMeters.toFixed(1)} m</span></div>
              <div>SPEED: <span className="text-white font-medium">{currentFrame.speedMps.toFixed(1)} m/s ({Math.round(currentFrame.speedMps * 3.6)} km/h)</span></div>
              <div>HEADING: <span className="text-amber-400 font-medium">{currentFrame.headingDeg.toFixed(1)}°</span></div>
            </div>

            {/* Bottom-Left: Gimbal & AI Inference Stats */}
            <div className="absolute bottom-3 left-3 pointer-events-none font-mono text-[11px] bg-slate-950/80 border border-slate-800/80 backdrop-blur-md rounded-md p-2 flex flex-col gap-1 text-slate-300 shadow-xl">
              <div className="text-xs font-semibold text-cyan-400">CAMERA & AI INFERENCE</div>
              <div>
                AI INFERENCE:{' '}
                <span className={aiDetectorModel === 'yolov8' ? 'text-cyan-300 font-bold' : 'text-amber-300 font-bold'}>
                  {aiDetectorModel === 'yolov8' ? 'YOLOv8 @ 6.4ms' : aiDetectorModel === 'faster-rcnn' ? 'Faster R-CNN @ 48.2ms' : 'Ensemble Fusion'}
                </span>
              </div>
              <div>GIMBAL PITCH: <span className="text-cyan-300 font-bold">{currentFrame.gimbalPitchDeg.toFixed(1)}°</span></div>
              <div>SHUTTER: <span className="text-emerald-400">1/1000s Global (Anti-Blur: OPTIMAL)</span></div>
            </div>

            {/* Bottom-Right: Reconstruction Feature Count */}
            <div className="absolute bottom-3 right-3 pointer-events-none font-mono text-[11px] bg-slate-950/80 border border-slate-800/80 backdrop-blur-md rounded-md p-2 flex flex-col gap-1 text-slate-300 shadow-xl items-end">
              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                <Crosshair className="w-3 h-3" />
                <span>FEATURES: {currentFrame.detectedFeatures.toLocaleString()}</span>
              </div>
              <div>AI DETECTIONS: <span className="text-cyan-300 font-bold">{activeDetections.length} objects</span></div>
              <div>DYNAMIC MASK: <span className="text-rose-400 font-bold">{currentFrame.dynamicObjectsMasked} filtered</span></div>
              <div>EST. GSD: <span className="text-cyan-300 font-bold">{scenario.estimatedGsdCm} cm/px</span></div>
            </div>
          </>
        )}
      </div>

      {/* Synchronized Playback Controls & Timeline Scrubber */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2">
        {/* Timeline Slider with Frame Markers */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-cyan-400 font-medium min-w-[50px]">
            {currentFrame.timeSec.toFixed(1)}s
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={scenario.telemetryStream.length - 1}
              value={activeTelemetryIndex}
              onChange={(e) => onSeek(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
            {/* Visual keyframe tick marks */}
            <div className="absolute inset-x-0 -bottom-1 flex justify-between pointer-events-none px-1">
              {[0, 20, 40, 60, 80, 100].map((pct) => (
                <div key={pct} className="w-0.5 h-1 bg-slate-700" />
              ))}
            </div>
          </div>
          <span className="font-mono text-xs text-slate-400 min-w-[50px] text-right">
            {scenario.flightDurationSec.toFixed(1)}s
          </span>
        </div>

        {/* Buttons Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePlay}
              className="p-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={() => onSeek(0)}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset to beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSeek(Math.min(scenario.telemetryStream.length - 1, activeTelemetryIndex + 1))}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Step forward 1 keyframe"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Overlay toggle */}
            <button
              onClick={() => setShowFeatureOverlay(!showFeatureOverlay)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                showFeatureOverlay
                  ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              Keypoints: {showFeatureOverlay ? 'ON' : 'OFF'}
            </button>

            {/* Playback speed buttons */}
            <div className="flex items-center rounded-md bg-slate-800 p-0.5 text-[10px] font-mono text-slate-300">
              {[0.5, 1, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-1.5 py-0.5 rounded ${
                    playbackSpeed === speed ? 'bg-cyan-600 text-white font-bold' : 'hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

