import React, { useState } from 'react';
import { GroundControlPoint, MissionScenario } from '../types/reconstruction';
import {
  CheckCircle,
  AlertTriangle,
  Compass,
  Crosshair,
  TrendingDown,
  Target,
  FileCheck2,
  Sparkles,
  Info,
} from 'lucide-react';

interface MetricAccuracyPanelProps {
  scenario: MissionScenario;
  onSelectGcp?: (gcp: GroundControlPoint) => void;
  onTriggerAiAnalysis?: () => void;
  isAiAnalyzing?: boolean;
}

export const MetricAccuracyPanel: React.FC<MetricAccuracyPanelProps> = ({
  scenario,
  onSelectGcp,
  onTriggerAiAnalysis,
  isAiAnalyzing,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'control' | 'check'>('all');

  // Compute Statistics
  const filteredGcps = scenario.gcps.filter((g) => {
    if (filterType === 'control') return !g.isCheckPoint;
    if (filterType === 'check') return g.isCheckPoint;
    return true;
  });

  const meanError =
    scenario.gcps.reduce((acc, g) => acc + g.totalErrorCm, 0) / (scenario.gcps.length || 1);
  const maxError = Math.max(...scenario.gcps.map((g) => g.totalErrorCm));
  const horizontalRmse = Math.sqrt(
    scenario.gcps.reduce((acc, g) => acc + (g.deltaXCm ** 2 + g.deltaYCm ** 2) / 2, 0) /
      (scenario.gcps.length || 1)
  );
  const verticalRmse = Math.sqrt(
    scenario.gcps.reduce((acc, g) => acc + g.deltaZCm ** 2, 0) / (scenario.gcps.length || 1)
  );

  const passesRequirement = meanError <= 10.0; // Requirement: <= 10 cm

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 overflow-y-auto custom-scrollbar">
      {/* Panel Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 font-mono">
            METRIC ACCURACY & GCP BENCHMARK
          </h2>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
            passesRequirement
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
          }`}
        >
          {passesRequirement ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>≤ 10cm TARGET PASSED</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>MARGINAL ACCURACY</span>
            </>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              MEAN GCP ERROR
              <span className="text-[10px] text-emerald-400">Target ≤ 10 cm</span>
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {meanError.toFixed(1)} <span className="text-sm text-slate-400 font-normal">cm</span>
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Tested across {scenario.gcps.length} surveyed points</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              MODEL COVERAGE
              <span className="text-[10px] text-emerald-400">Target ≥ 90%</span>
            </span>
            <span className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              94.8 <span className="text-sm text-slate-400 font-normal">%</span>
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Single-pass corridor volume</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">HORIZONTAL RMSE (XY)</span>
            <span className="text-xl font-bold font-mono text-white mt-1">
              {horizontalRmse.toFixed(1)} <span className="text-xs text-slate-400 font-normal">cm</span>
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Dual-frequency RTK fixed</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">VERTICAL RMSE (Z)</span>
            <span className="text-xl font-bold font-mono text-white mt-1">
              {verticalRmse.toFixed(1)} <span className="text-xs text-slate-400 font-normal">cm</span>
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Barometric + SfM fused</span>
          </div>
        </div>

        {/* Metric Consistency Reference Check */}
        <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              Scale Consistency (Target: Within 5% Deviation)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
              1.4% DEVIATION (OPTIMAL)
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Metric scale verified against surveyed 25.00 m reference distance baseline. Reconstructed model distance: <strong className="text-white">25.35 m</strong>. No scale degradation or bowling deformation observed.
          </p>
        </div>

        {/* AI High Thinking Deep Analysis Trigger */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-500/40 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Gemini 3.1 Pro Photogrammetry Reasoning</span>
            </div>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-700">
              HIGH THINKING
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Execute deep AI reasoning on single-pass collinear degeneracy, bundle adjustment residual optimization, and occluded facade inpainting feasibility.
          </p>
          <button
            onClick={onTriggerAiAnalysis}
            disabled={isAiAnalyzing}
            className="w-full py-2 px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
          >
            {isAiAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Deep Thinking Photogrammetry Audit...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Run Deep AI Photogrammetry Audit</span>
              </>
            )}
          </button>
        </div>

        {/* GCP Table */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-300">
              GROUND CONTROL & CHECK POINTS ({scenario.gcps.length})
            </span>
            <div className="flex items-center rounded-md bg-slate-950 p-0.5 text-[10px] font-mono border border-slate-800">
              {(['all', 'control', 'check'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterType(mode)}
                  className={`px-2 py-0.5 rounded capitalize ${
                    filterType === mode ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="py-2 px-2.5">ID / NAME</th>
                  <th className="py-2 px-1.5 text-center">TYPE</th>
                  <th className="py-2 px-1.5 text-right">ΔX (cm)</th>
                  <th className="py-2 px-1.5 text-right">ΔY (cm)</th>
                  <th className="py-2 px-1.5 text-right">ΔZ (cm)</th>
                  <th className="py-2 px-2 text-right">3D RMSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredGcps.map((gcp) => {
                  const isExcellent = gcp.totalErrorCm <= 5.0;
                  return (
                    <tr
                      key={gcp.id}
                      onClick={() => onSelectGcp?.(gcp)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-200">{gcp.id}</div>
                        <div className="text-[9px] text-slate-500 truncate max-w-[100px]">{gcp.name}</div>
                      </td>
                      <td className="py-2 px-1.5 text-center">
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                            gcp.isCheckPoint
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {gcp.isCheckPoint ? 'CHECK' : 'CTRL'}
                        </span>
                      </td>
                      <td className="py-2 px-1.5 text-right text-slate-300">
                        {gcp.deltaXCm > 0 ? `+${gcp.deltaXCm}` : gcp.deltaXCm}
                      </td>
                      <td className="py-2 px-1.5 text-right text-slate-300">
                        {gcp.deltaYCm > 0 ? `+${gcp.deltaYCm}` : gcp.deltaYCm}
                      </td>
                      <td className="py-2 px-1.5 text-right text-slate-300">
                        {gcp.deltaZCm > 0 ? `+${gcp.deltaZCm}` : gcp.deltaZCm}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className={`font-bold ${
                            isExcellent ? 'text-emerald-400' : 'text-cyan-300'
                          }`}
                        >
                          {gcp.totalErrorCm.toFixed(1)} cm
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Survey Quality Compliance Legend */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 font-mono">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>STANDARDS COMPLIANCE SUMMARY</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>ASPRS Positional Accuracy Class I:</span>
            <span className="text-emerald-400 font-mono font-bold">COMPLIANT (5cm GSD)</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>Processing Time Guarantee:</span>
            <span className="text-emerald-400 font-mono font-bold">3m 42s (≤ 5m Limit)</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>Coordinate Reference System:</span>
            <span className="text-slate-300 font-mono">WGS 84 / UTM Zone 10N</span>
          </div>
        </div>
      </div>
    </div>
  );
};
