import React, { useState } from 'react';
import { MissionScenario } from '../types/reconstruction';
import { getSectorIcon } from './ApplicationSectorPanel';
import {
  X,
  Shield,
  AlertTriangle,
  Building2,
  Compass,
  HardHat,
  Landmark,
  Layers,
  Crosshair,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Target,
  Plane,
  Camera,
  Ruler,
} from 'lucide-react';

interface ApplicationDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: MissionScenario[];
  activeScenarioIndex: number;
  onSelectScenario: (index: number) => void;
}

export const ApplicationDossierModal: React.FC<ApplicationDossierModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  activeScenarioIndex,
  onSelectScenario,
}) => {
  const [selectedTab, setSelectedTab] = useState<number>(activeScenarioIndex);

  if (!isOpen) return null;

  const currentScenario = scenarios[selectedTab] || scenarios[0];
  const config = currentScenario.applicationConfig;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 text-white shadow-lg shadow-cyan-600/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                  OPERATIONAL APPLICATIONS DOSSIER
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-semibold">
                  8 INDUSTRY DOMAINS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Single-pass UAV video-to-3D photogrammetric engineering specifications & compliance standards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8-Application Tab Strip */}
        <div className="flex overflow-x-auto bg-slate-950/90 border-b border-slate-800 p-1.5 gap-1 shrink-0 custom-scrollbar">
          {scenarios.map((s, idx) => {
            const isTabActive = selectedTab === idx;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedTab(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                  isTabActive
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="font-bold opacity-90">{s.applicationConfig.romanNumeral}</span>
                <span className="hidden md:inline">{s.applicationConfig.title}</span>
                <span className="md:hidden truncate max-w-[120px]">{s.applicationConfig.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-6">
          {/* Hero Banner for Selected Domain */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/60 text-cyan-400 shrink-0">
                {getSectorIcon(config.iconName, 'w-6 h-6')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                    APPLICATION {config.romanNumeral}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{config.category}</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1 font-mono">{config.title}</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {config.summary}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectScenario(selectedTab);
                onClose();
              }}
              className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all shrink-0"
            >
              <span>Load 3D Scenario</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3-Column Technical Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Operational Need & Flight Protocol */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-400">
                <Plane className="w-4 h-4 text-cyan-400" />
                <span>OPERATIONAL FLIGHT MANDATE</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {config.operationalContext}
              </p>

              <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Flight Trajectory:</span>
                  <span className="text-slate-200">{currentScenario.flightPathType}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Corridor Altitude:</span>
                  <span className="text-cyan-400 font-semibold">{currentScenario.flightAltitudeMeters} m</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ground Sampling Dist:</span>
                  <span className="text-emerald-400 font-bold">{currentScenario.estimatedGsdCm} cm/px</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Single-Pass Duration:</span>
                  <span className="text-slate-200">{currentScenario.flightDurationSec} seconds</span>
                </div>
              </div>
            </div>

            {/* 2. Sensor & Payload Calibration */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-indigo-400">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>SENSOR & METRIC PAYLOAD</span>
              </div>
              <div className="flex flex-col gap-2 font-mono text-xs">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">METRIC CAMERA MODEL</span>
                  <span className="text-slate-200 font-semibold">{currentScenario.cameraModel}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">VIDEO FORMAT</span>
                  <span className="text-slate-200">{currentScenario.sensorResolution}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">FOCAL LENGTH & SHUTTER</span>
                  <span className="text-slate-200">{currentScenario.focalLengthMm}mm Metric Lens / Mechanical Global</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block mb-1.5 font-semibold">
                  GOVERNING STANDARDS:
                </span>
                <div className="flex flex-wrap gap-1">
                  {config.standards.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Export Formats & Field Deliverables */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>DELIVERABLES & EXPORTS</span>
              </div>
              <p className="text-xs text-slate-400">
                Tailored CAD, GIS, BIM, and military interoperability exports formatted for immediate ingestion:
              </p>

              <div className="flex flex-col gap-1.5 font-mono text-xs">
                {config.exportRecommendations.map((exp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded bg-slate-900/90 border border-slate-800 text-slate-200 text-[11px]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{exp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Analytical Benchmarks & Tools for this Domain */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Specialized Single-Pass Photogrammetric Solvers for {config.title}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {config.domainTools.map((t) => (
                <div key={t.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-cyan-300">{t.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {t.currentValue}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>Target Spatial Accuracy: ≤ 10.0 cm RMSE (Achieved: {currentScenario.gcps.length > 0 ? (currentScenario.gcps.reduce((a, b) => a + b.totalErrorCm, 0) / currentScenario.gcps.length).toFixed(1) : 4.5} cm)</span>
          </div>

          <button
            onClick={() => {
              onSelectScenario(selectedTab);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md shadow-cyan-600/20"
          >
            Open in Studio
          </button>
        </div>
      </div>
    </div>
  );
};
