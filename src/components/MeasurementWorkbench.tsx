import React from 'react';
import { MeasurementMode, MeasurementRecord } from '../types/reconstruction';
import {
  Ruler,
  ArrowUpDown,
  Square,
  Box,
  TrendingUp,
  Trash2,
  Download,
  AlertCircle,
} from 'lucide-react';

interface MeasurementWorkbenchProps {
  measurementMode: MeasurementMode;
  onSetMeasurementMode: (mode: MeasurementMode) => void;
  measurements: MeasurementRecord[];
  onRemoveMeasurement: (id: string) => void;
  onClearAll: () => void;
  elevationProfileData: { distance: number; elevation: number }[] | null;
}

export const MeasurementWorkbench: React.FC<MeasurementWorkbenchProps> = ({
  measurementMode,
  onSetMeasurementMode,
  measurements,
  onRemoveMeasurement,
  onClearAll,
  elevationProfileData,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 font-mono">
            3D METRIC MEASUREMENT
          </h2>
        </div>
        {measurements.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Tool Selectors */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-semibold text-slate-300">
            SELECT ACTIVE 3D TOOL
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                onSetMeasurementMode(measurementMode === 'distance' ? 'none' : 'distance')
              }
              className={`p-2.5 rounded-lg border font-mono text-xs flex items-center gap-2 transition-all ${
                measurementMode === 'distance'
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Ruler className="w-4 h-4 text-cyan-400" />
              <div className="text-left">
                <div className="font-semibold">3D Distance</div>
                <div className="text-[10px] text-slate-500">2-point ruler</div>
              </div>
            </button>

            <button
              onClick={() =>
                onSetMeasurementMode(measurementMode === 'height' ? 'none' : 'height')
              }
              className={`p-2.5 rounded-lg border font-mono text-xs flex items-center gap-2 transition-all ${
                measurementMode === 'height'
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-950/50'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <ArrowUpDown className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="font-semibold">Vertical Height</div>
                <div className="text-[10px] text-slate-500">Plumb line</div>
              </div>
            </button>

            <button
              onClick={() =>
                onSetMeasurementMode(
                  measurementMode === 'elevation-profile' ? 'none' : 'elevation-profile'
                )
              }
              className={`col-span-2 p-2.5 rounded-lg border font-mono text-xs flex items-center gap-2 transition-all ${
                measurementMode === 'elevation-profile'
                  ? 'bg-indigo-950 border-indigo-400 text-indigo-300 shadow-md shadow-indigo-950/50'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <div className="text-left">
                <div className="font-semibold">Terrain Elevation Profile</div>
                <div className="text-[10px] text-slate-500">
                  Click 2 points across terrain to draw cross-section slice
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Elevation Profile Slice Visualizer */}
        {elevationProfileData && elevationProfileData.length > 0 && (
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-mono font-semibold text-indigo-300">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Cross-Section Elevation Slice
              </span>
              <span className="text-[10px] text-slate-400">
                Length: {elevationProfileData[elevationProfileData.length - 1].distance} m
              </span>
            </div>

            {/* SVG Profile Chart */}
            <div className="h-28 w-full bg-slate-900/80 rounded border border-slate-800/80 p-2 flex items-end">
              <svg className="w-full h-full overflow-visible">
                {(() => {
                  const maxElev = Math.max(...elevationProfileData.map((d) => d.elevation), 20);
                  const minElev = Math.min(...elevationProfileData.map((d) => d.elevation), -5);
                  const range = maxElev - minElev || 1;
                  const pts = elevationProfileData
                    .map((d, i) => {
                      const x = (i / (elevationProfileData.length - 1)) * 280;
                      const y = 80 - ((d.elevation - minElev) / range) * 70;
                      return `${x},${y}`;
                    })
                    .join(' ');

                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2.5"
                        points={pts}
                      />
                      {elevationProfileData.map((d, i) => {
                        const x = (i / (elevationProfileData.length - 1)) * 280;
                        const y = 80 - ((d.elevation - minElev) / range) * 70;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r={i === 0 || i === elevationProfileData.length - 1 ? 3.5 : 1.5}
                            fill="#38bdf8"
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Start (0.0 m)</span>
              <span>Midpoint</span>
              <span>End ({elevationProfileData[elevationProfileData.length - 1].distance} m)</span>
            </div>
          </div>
        )}

        {/* Saved Measurements List */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-semibold text-slate-300">
            RECORDED MEASUREMENTS ({measurements.length})
          </span>

          {measurements.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-500 font-mono text-xs">
              No measurements recorded yet. Select a tool above and click on the 3D viewport.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {measurements.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <div>
                      <div className="font-mono text-xs font-semibold text-slate-200">
                        {m.label}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 capitalize">
                        {m.type} measurement
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveMeasurement(m.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
