import React, { useState } from 'react';
import { MissionScenario, ApplicationModuleConfig, ApplicationDomainTool } from '../types/reconstruction';
import {
  Shield,
  AlertTriangle,
  Building2,
  Compass,
  HardHat,
  Landmark,
  Layers,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Download,
  Info,
  Sliders,
  Eye,
  Box,
  TrendingUp,
  Activity,
  Cpu,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface ApplicationSectorPanelProps {
  scenario: MissionScenario;
  onSelectScenario: (index: number) => void;
  scenarios: MissionScenario[];
  onTriggerAiAnalysis: () => void;
  isAiAnalyzing: boolean;
  onOpenExportModal: () => void;
  onOpenDossierModal: () => void;
  onOpenReportDashboard?: () => void;
}

// Icon helper
export function getSectorIcon(iconName: string, className = 'w-4 h-4') {
  switch (iconName) {
    case 'Shield':
      return <Shield className={className} />;
    case 'AlertTriangle':
      return <AlertTriangle className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'HardHat':
      return <HardHat className={className} />;
    case 'Landmark':
      return <Landmark className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Crosshair':
    default:
      return <Crosshair className={className} />;
  }
}

export const ApplicationSectorPanel: React.FC<ApplicationSectorPanelProps> = ({
  scenario,
  onSelectScenario,
  scenarios,
  onTriggerAiAnalysis,
  isAiAnalyzing,
  onOpenExportModal,
  onOpenDossierModal,
  onOpenReportDashboard,
}) => {
  const config: ApplicationModuleConfig = scenario.applicationConfig;

  // Local state for interactive domain tools
  const [activeTools, setActiveTools] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    config.domainTools.forEach((t) => {
      initial[t.id] = t.active;
    });
    return initial;
  });

  const [toolLogs, setToolLogs] = useState<string | null>(null);

  const toggleTool = (tool: ApplicationDomainTool) => {
    setActiveTools((prev) => {
      const nextState = !prev[tool.id];
      if (nextState) {
        setToolLogs(`[${tool.name}] Activated: ${tool.currentValue || 'Executing real-time spatial calculation on 3D mesh'}`);
      } else {
        setToolLogs(`[${tool.name}] Deactivated overlay.`);
      }
      return { ...prev, [tool.id]: nextState };
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400">
            {getSectorIcon(config.iconName, 'w-4 h-4')}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-cyan-400">{config.romanNumeral}</span>
              <h2 className="text-xs font-semibold tracking-wide text-slate-100 font-mono uppercase truncate max-w-[200px]">
                {config.title}
              </h2>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">OPERATIONAL APPLICATION SUITE</div>
          </div>
        </div>

        <button
          onClick={onOpenDossierModal}
          className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
          title="View comprehensive 8-sector technical dossier"
        >
          <Info className="w-3 h-3 text-cyan-400" />
          <span>Dossier</span>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Operational Context Summary */}
        <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Operational Mission Context
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              Single-Pass Advantage
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {config.operationalContext}
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
            {config.standards.map((std, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono"
              >
                {std}
              </span>
            ))}
          </div>
        </div>

        {/* Live Domain KPIs */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
            <span>SECTOR-SPECIFIC METRIC BENCHMARKS</span>
            <span className="text-[10px] text-emerald-400 font-normal">Real-Time Telemetry</span>
          </span>

          <div className="grid grid-cols-2 gap-2">
            {config.kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="truncate max-w-[120px]">{kpi.label}</span>
                  {kpi.status === 'optimal' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                  {kpi.status === 'warning' && <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />}
                  {kpi.status === 'critical' && <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />}
                  {kpi.status === 'info' && <Info className="w-3 h-3 text-cyan-400 shrink-0" />}
                </div>

                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className={`text-lg font-bold font-mono ${
                      kpi.status === 'optimal'
                        ? 'text-emerald-400'
                        : kpi.status === 'warning'
                        ? 'text-amber-400'
                        : kpi.status === 'critical'
                        ? 'text-rose-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {kpi.value}
                  </span>
                  {kpi.unit && <span className="text-xs text-slate-400 font-mono">{kpi.unit}</span>}
                </div>

                <span className="text-[9px] text-slate-500 font-mono mt-1 leading-tight line-clamp-2">
                  {kpi.note}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Domain Tools */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-semibold text-slate-300">
            APPLICATION TOOLKIT CONTROLLERS
          </span>

          <div className="flex flex-col gap-2">
            {config.domainTools.map((tool) => {
              const isActive = activeTools[tool.id];
              return (
                <div
                  key={tool.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-slate-950 border-cyan-500/80 shadow-md shadow-cyan-950/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded ${
                          isActive
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {getSectorIcon(config.iconName, 'w-3.5 h-3.5')}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-200">{tool.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{tool.currentValue}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleTool(tool)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold border transition-all ${
                        isActive
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isActive ? 'ACTIVE' : 'RUN'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Feedback banner */}
          {toolLogs && (
            <div className="p-2 rounded bg-slate-950 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
              <span className="truncate">{toolLogs}</span>
              <button
                onClick={() => setToolLogs(null)}
                className="text-slate-500 hover:text-slate-300 ml-2"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* AI Sector Audit & Deliverables Trigger */}
        <div className="p-3.5 rounded-lg bg-gradient-to-br from-indigo-950/60 via-slate-950 to-slate-900 border border-indigo-700/40 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Gemini 3.1 Pro Domain Audit
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">High Thinking</span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Run an AI audit optimized for {config.title}. Evaluates collinear baseline drift,
            reprojection residuals, and standards compliance.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onTriggerAiAnalysis}
              disabled={isAiAnalyzing}
              className="flex-1 py-2 rounded-md bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {isAiAnalyzing ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Run {config.romanNumeral} Audit</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenExportModal}
              className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
              title="Export recommended sector deliverables"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export</span>
            </button>

            {onOpenReportDashboard && (
              <button
                onClick={onOpenReportDashboard}
                className="px-3 py-2 rounded-md bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open and download official mission report"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Sector Quick Switcher Grid */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <span className="text-[11px] font-mono font-semibold text-slate-400 flex items-center justify-between">
            <span>SWITCH OPERATIONAL APPLICATION</span>
            <span className="text-[10px] text-cyan-400">8 Sectors Available</span>
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            {scenarios.map((s, idx) => {
              const isSelected = s.id === scenario.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectScenario(idx)}
                  className={`p-2 rounded-md border text-left font-mono text-[10px] transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="text-cyan-400 shrink-0 font-bold">{s.applicationConfig.romanNumeral}</span>
                  <span className="truncate">{s.applicationConfig.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
