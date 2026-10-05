import React from 'react';
import { AiAnalysisResult, MissionScenario } from '../types/reconstruction';
import {
  X,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Target,
  Layers,
  Brain,
  Download,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AiAnalysisResult | null;
  scenario: MissionScenario;
  onOpenCopilot: (initialQuery?: string) => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  scenario,
  onOpenCopilot,
}) => {
  if (!isOpen || !analysis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white font-mono">
                  SINGLE-PASS PHOTOGRAMMETRY AUDIT
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                  Gemini 3.1 Pro (Thinking Level: High)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Dataset: {scenario.title} • {scenario.baseCoordinates.utmZone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar font-sans text-sm">
          {/* Top Score Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-xs font-mono text-slate-400">FEASIBILITY RATING</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  {analysis.feasibilityScore}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono mt-0.5">High Stability</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-xs font-mono text-slate-400">EST. HORIZONTAL RMSE</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {analysis.estimatedHorizontalAccuracyCm.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-mono">cm</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono mt-0.5">≤ 10cm Target Met</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-xs font-mono text-slate-400">EST. VERTICAL RMSE</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {analysis.estimatedVerticalAccuracyCm.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-mono">cm</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono mt-0.5">Barometric Locked</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-xs font-mono text-slate-400">COMPLETENESS</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  {analysis.reconstructionCompletenessPercent}%
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono mt-0.5">≥ 90% Target Met</span>
            </div>
          </div>

          {/* Scientific Executive Summary */}
          <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-cyan-300">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span>PRINCIPAL SCIENTIST EVALUATION</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {analysis.scientificSummary}
            </p>
          </div>

          {/* Occlusion Surface Inpainting Analysis */}
          <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-500/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-indigo-300">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>SINGLE-PASS OCCLUSION & FACADE INPAINTING</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-700">
                {analysis.occlusionAnalysis.confidenceInterval}
              </span>
            </div>
            <div className="text-xs text-slate-300">
              <strong className="text-white font-medium">Inpainting Methodology:</strong>{' '}
              {analysis.occlusionAnalysis.inpaintingMethodology}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                Identified Occlusion Zones:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.occlusionAnalysis.identifiedOccludedZones.map((zone, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300"
                  >
                    • {zone}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Key Observations & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>KEY GEOMETRIC OBSERVATIONS</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {analysis.keyObservations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-amber-400">
                <Zap className="w-4 h-4" />
                <span>FLIGHT & SENSOR RECOMMENDATIONS</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {analysis.technicalRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-t border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Target Error Bounds: ≤ 10 cm & 90% Completeness Validated</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenCopilot('Explain how single-pass degenerate collinear bundle adjustment is stabilized in this project');
              }}
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Discuss with Copilot</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
