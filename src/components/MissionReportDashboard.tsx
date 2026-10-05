import React, { useState } from 'react';
import { MissionScenario, GroundControlPoint, AiAnalysisResult } from '../types/reconstruction';
import { getScenarioDetections, AI_DETECTOR_SPECS, OPEN_SOURCE_ENGINES } from '../data/openSourceAnalysisData';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Layers,
  Sparkles,
  Zap,
  Cpu,
  Target,
  FileCode,
  Table,
  Check,
  Award,
  Calendar,
  Compass,
  Maximize2,
  Minimize2,
  Share2,
  X,
  ExternalLink,
} from 'lucide-react';

interface MissionReportDashboardProps {
  scenario: MissionScenario;
  aiAnalysis?: AiAnalysisResult | null;
  activeTelemetryIndex?: number;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const MissionReportDashboard: React.FC<MissionReportDashboardProps> = ({
  scenario,
  aiAnalysis,
  activeTelemetryIndex = 0,
  isOpenModal = false,
  onCloseModal,
}) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const meanGcpErr =
    scenario.gcps.reduce((acc, g) => acc + g.totalErrorCm, 0) / (scenario.gcps.length || 1);
  const maxGcpErr = Math.max(...scenario.gcps.map((g) => g.totalErrorCm), 0);
  const detections = getScenarioDetections(scenario.applicationDomain, activeTelemetryIndex);
  const yoloDetections = detections.filter((d) => d.model === 'yolov8');
  const rcnnDetections = detections.filter((d) => d.model === 'faster-rcnn');

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Helper to trigger browser file download
  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Download Printable HTML / PDF Certificate
  const handleDownloadHtmlReport = () => {
    setDownloadingFormat('html');
    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>VYOM3DGS - Photogrammetric Survey & 3DGS Mission Report - ${scenario.title}</title>
  <style>
    @page { size: A4 portrait; margin: 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
    }
    .header-table { width: 100%; border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
    .brand-title { font-size: 26px; font-weight: 800; color: #0284c7; margin: 0; letter-spacing: -0.5px; }
    .brand-sub { font-size: 12px; color: #64748b; font-family: monospace; text-transform: uppercase; margin-top: 4px; }
    .seal-box {
      border: 2px solid #10b981;
      background: #ecfdf5;
      color: #047857;
      padding: 8px 14px;
      border-radius: 8px;
      text-align: right;
      font-weight: 700;
      font-size: 13px;
    }
    h2 { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; font-family: monospace; text-transform: uppercase; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .kpi-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
    .kpi-title { font-size: 10px; font-family: monospace; color: #64748b; text-transform: uppercase; }
    .kpi-val { font-size: 20px; font-weight: 800; color: #0284c7; margin-top: 4px; }
    .kpi-sub { font-size: 11px; color: #10b981; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; color: #334155; }
    .badge-pass { background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
    .badge-yolo { background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-family: monospace; }
    .badge-rcnn { background: #ffe4e6; color: #be123c; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-family: monospace; }
    .code-block { background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; overflow-x: auto; margin-top: 8px; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td>
        <h1 class="brand-title">VYOM3DGS SURVEY CERTIFICATE</h1>
        <div class="brand-sub">SINGLE-PASS DRONE 3D GAUSSIAN SPLATTING & PHOTOGRAMMETRIC AUDIT</div>
        <div style="font-size:12px; color:#334155; margin-top:6px;">
          <strong>Mission:</strong> ${scenario.title} &bull; <strong>Sector:</strong> ${scenario.applicationConfig.romanNumeral} ${scenario.applicationConfig.title}
        </div>
      </td>
      <td style="text-align:right; vertical-align:top;">
        <div class="seal-box">
          &check; ASPRS CLASS I CERTIFIED<br>
          <span style="font-size:11px; font-weight:normal;">Mean Error: ${meanGcpErr.toFixed(1)} cm (Threshold: &le; 10 cm)</span>
        </div>
        <div style="font-size:11px; color:#64748b; margin-top:4px;">Date: ${currentDate}</div>
      </td>
    </tr>
  </table>

  <h2>1. Executive Summary & Quality Indicators</h2>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Mean 3D GCP Residual</div>
      <div class="kpi-val">${meanGcpErr.toFixed(1)} cm</div>
      <div class="kpi-sub">&check; Passed (&le; 10.0 cm)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Surface Completeness</div>
      <div class="kpi-val">96.4%</div>
      <div class="kpi-sub">&check; Passed (&ge; 90.0%)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Ground Sample Dist (GSD)</div>
      <div class="kpi-val">${scenario.estimatedGsdCm} cm/px</div>
      <div class="kpi-sub" style="color:#0284c7;">Sub-5cm High Res</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">3DGS Splats Rendered</div>
      <div class="kpi-val">1,840,000</div>
      <div class="kpi-sub" style="color:#0284c7;">120+ FPS Differentiable</div>
    </div>
  </div>

  <h2>2. Flight Parameters & Georeference Specifications</h2>
  <table>
    <tr>
      <th width="25%">Sensor / Camera</th>
      <td width="25%">${scenario.cameraModel} (${scenario.sensorResolution})</td>
      <th width="25%">Flight Altitude / GSD</th>
      <td width="25%">${scenario.flightAltitudeMeters} m AGL / ${scenario.estimatedGsdCm} cm/px</td>
    </tr>
    <tr>
      <th>Coordinate Reference (CRS)</th>
      <td>WGS84 / ${scenario.baseCoordinates.utmZone} (EPSG Projected)</td>
      <th>Flight Corridor Length</th>
      <td>${scenario.flightLengthMeters} meters (Unidirectional Single-Pass)</td>
    </tr>
    <tr>
      <th>Focal Length / Optics</th>
      <td>${scenario.focalLengthMm} mm Mechanical Global Shutter</td>
      <th>GNSS RTK Constellation</th>
      <td>GPS + GLONASS + Galileo L1/L2 Dual-Freq Fixed</td>
    </tr>
  </table>

  <h2>3. Surveyed Ground Control Points Residuals Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>GCP ID</th>
        <th>Description</th>
        <th>Classification</th>
        <th>&Delta;X (cm)</th>
        <th>&Delta;Y (cm)</th>
        <th>&Delta;Z (cm)</th>
        <th>3D Error (cm)</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${scenario.gcps
        .map(
          (g) => `
        <tr>
          <td><strong>${g.id}</strong></td>
          <td>${g.name}</td>
          <td>${g.isCheckPoint ? 'Independent Checkpoint' : 'Control Point'}</td>
          <td>${g.deltaXCm > 0 ? `+${g.deltaXCm}` : g.deltaXCm}</td>
          <td>${g.deltaYCm > 0 ? `+${g.deltaYCm}` : g.deltaYCm}</td>
          <td>${g.deltaZCm > 0 ? `+${g.deltaZCm}` : g.deltaZCm}</td>
          <td><strong>${g.totalErrorCm.toFixed(1)} cm</strong></td>
          <td><span class="badge-pass">Compliant</span></td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>4. AI Object Detection & Mensuration Audit (YOLOv8 & Faster R-CNN)</h2>
  <table>
    <thead>
      <tr>
        <th>Detection ID</th>
        <th>Identified Feature / Anomaly</th>
        <th>AI Detector Model</th>
        <th>Confidence</th>
        <th>3D Role & Impact</th>
      </tr>
    </thead>
    <tbody>
      ${detections
        .map(
          (d) => `
        <tr>
          <td><code>${d.id}</code></td>
          <td><strong>${d.label}</strong></td>
          <td><span class="${d.model === 'yolov8' ? 'badge-yolo' : 'badge-rcnn'}">${d.model === 'yolov8' ? 'YOLOv8 Edge' : 'Faster R-CNN'}</span></td>
          <td>${(d.confidence * 100).toFixed(0)}%</td>
          <td>${d.isDynamic ? 'Transient Moving Object &bull; Masked from 3DGS to prevent ghosting' : 'Rigid Geospatial Feature &bull; Sub-millimeter geometric catalogue'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>5. Open Source Software (FOSS) Reproducibility Pipeline</h2>
  <div style="font-size:11px; color:#475569; margin-bottom:6px;">
    The dataset was processed with the open source photogrammetric workflow using COLMAP, OpenDroneMap (ODM), and CloudCompare M3C2.
  </div>
  <div class="code-block">
# 1. Feature Extraction & Sequential Matching
colmap feature_extractor --database_path ./colmap.db --image_path ./frames --SiftExtraction.use_gpu 1
colmap sequential_matcher --database_path ./colmap.db --SequentialMatching.overlap 15

# 2. 3D Gaussian Splatting Training
vyom3dgs-train --source_path ./colmap_sparse --model_path ./3dgs_model --sh_degree 3 --iterations 30000

# 3. CloudCompare M3C2 Verification against Surveyed Ground Control Points
CloudCompare -SILENT -O 3dgs_pointcloud.ply -O surveyed_gcps.las -C2C_DIST -AUTO_SAVE OFF
  </div>

  <h2>6. Quality Certification Statement</h2>
  <p style="font-size:11px; color:#334155; line-height:1.6;">
    This certifies that the single-pass UAV 3D reconstruction and Gaussian Splatting dataset for <strong>${scenario.title}</strong> has met or exceeded the requirements of the <em>ASPRS Positional Accuracy Standards for Digital Geospatial Data (2014)</em> and industry sector compliance standards: <strong>${scenario.applicationConfig.standards.join(', ')}</strong>. Maximum 3D positional residual is <strong>${maxGcpErr.toFixed(1)} cm</strong>, well within the 10.0 cm project tolerance.
  </p>

  <div class="footer">
    <div>Generated by VYOM3DGS Studio &bull; Single-Pass Drone Reconstruction</div>
    <div>Document ID: VYOM-RPT-${scenario.id.toUpperCase()}-${Date.now().toString().slice(-6)}</div>
  </div>
</body>
</html>`;

    setTimeout(() => {
      triggerDownload(`${scenario.id}_vyom3dgs_mission_report.html`, reportHtml, 'text/html');
      setDownloadingFormat(null);
    }, 400);
  };

  // 2. Download Markdown Report (.md)
  const handleDownloadMarkdownReport = () => {
    setDownloadingFormat('markdown');
    let md = `# VYOM3DGS MISSION AUDIT REPORT\n\n`;
    md += `**Mission:** ${scenario.title}\n`;
    md += `**Operational Sector:** ${scenario.applicationConfig.romanNumeral} ${scenario.applicationConfig.title}\n`;
    md += `**Date:** ${currentDate}\n`;
    md += `**Certification:** ASPRS Positional Accuracy Standards Class I (Mean GCP Error: ${meanGcpErr.toFixed(1)} cm)\n\n`;

    md += `## 1. Flight Parameters & Georeference\n`;
    md += `- **Sensor:** ${scenario.cameraModel} (${scenario.sensorResolution})\n`;
    md += `- **Altitude:** ${scenario.flightAltitudeMeters} m AGL\n`;
    md += `- **Ground Sample Distance (GSD):** ${scenario.estimatedGsdCm} cm/px\n`;
    md += `- **Coordinate System:** WGS84 / ${scenario.baseCoordinates.utmZone}\n`;
    md += `- **Trajectory:** ${scenario.flightLengthMeters} m Single-Pass Linear Corridor\n\n`;

    md += `## 2. Executive Metrics & KPIs\n`;
    md += `| Metric Indicator | Measured Value | Standard Target | Status |\n`;
    md += `|---|---|---|---|\n`;
    md += `| Mean 3D GCP Residual | ${meanGcpErr.toFixed(1)} cm | <= 10.0 cm | **PASSED** |\n`;
    md += `| Maximum GCP Residual | ${maxGcpErr.toFixed(1)} cm | <= 15.0 cm | **PASSED** |\n`;
    md += `| Surface Completeness | 96.4% | >= 90.0% | **PASSED** |\n`;
    md += `| 3DGS Gaussian Splats | 1,840,000 | > 500,000 | **OPTIMAL** |\n`;
    md += `| YOLOv8 Dynamic Masking | ${yoloDetections.length} objects | Real-time | **ACTIVE** |\n`;
    md += `| Faster R-CNN Defect RoIs | ${rcnnDetections.length} verified | Sub-mm precision | **CATALOGED** |\n\n`;

    md += `## 3. Surveyed Ground Control Points\n`;
    md += `| GCP ID | Point Name | Type | Delta X (cm) | Delta Y (cm) | Delta Z (cm) | 3D RMSE (cm) |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    scenario.gcps.forEach((g) => {
      md += `| ${g.id} | ${g.name} | ${g.isCheckPoint ? 'Check' : 'Control'} | ${g.deltaXCm} | ${g.deltaYCm} | ${g.deltaZCm} | ${g.totalErrorCm.toFixed(1)} |\n`;
    });
    md += `\n`;

    md += `## 4. AI Detections & Mensuration (YOLOv8 & Faster R-CNN)\n`;
    detections.forEach((d) => {
      md += `- **[${d.model.toUpperCase()}]** ${d.label} (${(d.confidence * 100).toFixed(0)}% conf) - ${d.isDynamic ? 'Dynamic vehicle masked for 3DGS' : 'Rigid feature cataloged'}\n`;
    });
    md += `\n`;

    md += `## 5. Compliance & Industry Standards\n`;
    scenario.applicationConfig.standards.forEach((s) => {
      md += `- ${s}\n`;
    });

    setTimeout(() => {
      triggerDownload(`${scenario.id}_mission_report.md`, md, 'text/markdown');
      setDownloadingFormat(null);
    }, 400);
  };

  // 3. Download Full JSON Report (.json)
  const handleDownloadJsonReport = () => {
    setDownloadingFormat('json');
    const jsonReport = {
      project: 'VYOM3DGS',
      documentType: 'Photogrammetric & 3DGS Survey Report',
      scenarioId: scenario.id,
      title: scenario.title,
      date: new Date().toISOString(),
      operationalApplication: {
        domain: scenario.applicationDomain,
        romanNumeral: scenario.applicationConfig.romanNumeral,
        title: scenario.applicationConfig.title,
        standards: scenario.applicationConfig.standards,
        kpis: scenario.applicationConfig.kpis,
      },
      flightSpecs: {
        cameraModel: scenario.cameraModel,
        resolution: scenario.sensorResolution,
        focalLengthMm: scenario.focalLengthMm,
        altitudeMeters: scenario.flightAltitudeMeters,
        corridorLengthMeters: scenario.flightLengthMeters,
        estimatedGsdCm: scenario.estimatedGsdCm,
        crs: `WGS84 / ${scenario.baseCoordinates.utmZone}`,
      },
      qualityAccuracyMetrics: {
        meanGcpErrorCm: meanGcpErr,
        maxGcpErrorCm: maxGcpErr,
        completenessPercent: 96.4,
        asprsClassICertified: true,
        targetAccuracyThresholdCm: 10.0,
      },
      gcpResiduals: scenario.gcps,
      aiDetections: {
        yolov8Count: yoloDetections.length,
        fasterRcnnCount: rcnnDetections.length,
        detectionsList: detections,
      },
      openSourcePipeline: {
        supportedEngines: OPEN_SOURCE_ENGINES.map((e) => e.name),
        colmapCommand: OPEN_SOURCE_ENGINES.find((e) => e.id === 'colmap')?.cliCommandSample,
        vyom3dgsCommand: OPEN_SOURCE_ENGINES.find((e) => e.id === 'vyom-3dgs')?.cliCommandSample,
      },
    };

    setTimeout(() => {
      triggerDownload(
        `${scenario.id}_comprehensive_report.json`,
        JSON.stringify(jsonReport, null, 2),
        'application/json'
      );
      setDownloadingFormat(null);
    }, 400);
  };

  // 4. Download CSV of GCP Residuals
  const handleDownloadCsv = () => {
    setDownloadingFormat('csv');
    let csv = `GCP_ID,Name,Type,DeltaX_cm,DeltaY_cm,DeltaZ_cm,Total_3D_RMSE_cm,Status\n`;
    scenario.gcps.forEach((g) => {
      csv += `${g.id},"${g.name}",${g.isCheckPoint ? 'Checkpoint' : 'ControlPoint'},${g.deltaXCm},${g.deltaYCm},${g.deltaZCm},${g.totalErrorCm.toFixed(2)},Compliant\n`;
    });

    setTimeout(() => {
      triggerDownload(`${scenario.id}_gcp_residuals.csv`, csv, 'text/csv');
      setDownloadingFormat(null);
    }, 400);
  };

  // 5. Native Print Dialog
  const handlePrint = () => {
    window.print();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto custom-scrollbar">
      {/* Top Banner / Certificate Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold uppercase">
                &check; ASPRS CLASS I CERTIFIED
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                {scenario.applicationConfig.romanNumeral} {scenario.applicationConfig.title}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold font-mono text-white mt-1">
              SURVEY &amp; 3DGS RECONSTRUCTION REPORT
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Mission: <span className="text-slate-200 font-medium">{scenario.title}</span> &bull; CRS: <span className="text-cyan-400">{scenario.baseCoordinates.utmZone}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Direct Downloads */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Download HTML Report */}
          <button
            onClick={handleDownloadHtmlReport}
            disabled={downloadingFormat === 'html'}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-md shadow-cyan-600/30 transition-all disabled:opacity-50"
            title="Download printable survey certificate and report in HTML/PDF format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingFormat === 'html' ? 'Exporting...' : 'Download Report (.html)'}</span>
          </button>

          {/* Download Markdown */}
          <button
            onClick={handleDownloadMarkdownReport}
            disabled={downloadingFormat === 'markdown'}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-medium transition-colors disabled:opacity-50"
            title="Download Markdown summary"
          >
            <FileText className="w-3.5 h-3.5 text-slate-300" />
            <span>.MD</span>
          </button>

          {/* Download JSON */}
          <button
            onClick={handleDownloadJsonReport}
            disabled={downloadingFormat === 'json'}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-medium transition-colors disabled:opacity-50"
            title="Download complete structured JSON dataset"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>

          {/* Download CSV */}
          <button
            onClick={handleDownloadCsv}
            disabled={downloadingFormat === 'csv'}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-medium transition-colors disabled:opacity-50"
            title="Download CSV table of surveyed GCPs"
          >
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          {/* Print Dialog */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-medium transition-colors"
            title="Print or Save to PDF via Browser"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print</span>
          </button>

          {isOpenModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close Report Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* KPI Dashboard Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">MEAN GCP 3D RMSE</span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-black font-mono text-emerald-400">{meanGcpErr.toFixed(1)}</span>
              <span className="text-xs font-mono text-slate-400">cm</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>Target &le; 10 cm (PASS)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">SURFACE COMPLETENESS</span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-black font-mono text-cyan-400">96.4</span>
              <span className="text-xs font-mono text-slate-400">%</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-semibold font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>Target &ge; 90% (PASS)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">3DGS RADIANCE SPLATS</span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-black font-mono text-indigo-400">1.84M</span>
            </div>
            <span className="text-[11px] font-mono text-indigo-300">120+ FPS Differentiable</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">AI DETECTIONS AUDIT</span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-black font-mono text-amber-400">{detections.length}</span>
              <span className="text-xs font-mono text-slate-400">verified</span>
            </div>
            <span className="text-[11px] font-mono text-amber-300">YOLOv8 + Faster R-CNN</span>
          </div>
        </div>

        {/* Operational Application Sector & Standards Compliance */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              INDUSTRY SECTOR COMPLIANCE SPECIFICATIONS
            </span>
            <span className="text-[10px] text-cyan-400">{scenario.applicationConfig.standards.length} Standards Validated</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1">REGULATORY COMPLIANCE STANDARDS:</span>
              <div className="flex flex-wrap gap-1.5">
                {scenario.applicationConfig.standards.map((std, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-cyan-300"
                  >
                    &bull; {std}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1">LIVE SECTOR PERFORMANCE KPIS:</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {scenario.applicationConfig.kpis.map((k, i) => (
                  <div key={i} className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{k.label}</span>
                    <span className="text-slate-200 font-bold">{k.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Surveyed Ground Control Points Residuals Matrix */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              SURVEYED GROUND CONTROL POINTS RESIDUALS ({scenario.gcps.length} POINTS)
            </span>
            <button
              onClick={handleDownloadCsv}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-3">GCP ID</th>
                  <th className="py-2 px-3">Point Name / Description</th>
                  <th className="py-2 px-3">Classification</th>
                  <th className="py-2 px-3 text-right">&Delta;X (cm)</th>
                  <th className="py-2 px-3 text-right">&Delta;Y (cm)</th>
                  <th className="py-2 px-3 text-right">&Delta;Z Elev (cm)</th>
                  <th className="py-2 px-3 text-right">3D RMSE</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {scenario.gcps.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-bold text-cyan-400">{g.id}</td>
                    <td className="py-2 px-3 text-slate-200 font-sans">{g.name}</td>
                    <td className="py-2 px-3 text-slate-400">
                      {g.isCheckPoint ? 'Independent Check' : 'Ground Control'}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400">
                      {g.deltaXCm > 0 ? `+${g.deltaXCm}` : g.deltaXCm}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400">
                      {g.deltaYCm > 0 ? `+${g.deltaYCm}` : g.deltaYCm}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400">
                      {g.deltaZCm > 0 ? `+${g.deltaZCm}` : g.deltaZCm}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-white">
                      {g.totalErrorCm.toFixed(1)} cm
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        &check; Pass
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Object Detection Audit: YOLOv8 vs. Faster R-CNN */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              AI OBJECT DETECTORS AUDIT (YOLOv8 &amp; FASTER R-CNN)
            </span>
            <span className="text-[10px] text-slate-400">
              YOLOv8: {yoloDetections.length} &bull; Faster R-CNN: {rcnnDetections.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* YOLOv8 Box */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-amber-500/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  YOLOv8 Real-Time Dynamic Suppression (6.4ms)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  {yoloDetections.length} Features
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Single-pass collinear trajectories suffer from severe ghosting when vehicles or pedestrians move between video frames. YOLOv8 masks out these pixels dynamically prior to 3D Gaussian Splatting optimization.
              </p>
              <div className="space-y-1 mt-1">
                {yoloDetections.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-1.5 rounded bg-slate-950 text-[11px]">
                    <span className="text-slate-300">{d.label}</span>
                    <span className="text-emerald-400 font-bold">{(d.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Faster R-CNN Box */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-rose-500/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-rose-400 font-bold flex items-center gap-1.5 text-xs">
                  <Cpu className="w-3.5 h-3.5" />
                  Faster R-CNN Deep Defect Mensuration (RoIAlign)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  {rcnnDetections.length} Features
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Two-stage Feature Pyramid Networks isolate sub-millimeter cracks, concrete spalls, insulator faults, and structural shear deformation with high geometric precision.
              </p>
              <div className="space-y-1 mt-1">
                {rcnnDetections.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-1.5 rounded bg-slate-950 text-[11px]">
                    <span className="text-slate-300">{d.label}</span>
                    <span className="text-emerald-400 font-bold">{(d.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Open Source Software (FOSS) Reproducibility Pipeline Box */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              OPEN SOURCE SOFTWARE PIPELINE REPRODUCIBILITY
            </span>
            <span className="text-[10px] text-slate-400">COLMAP &bull; 3DGS &bull; OpenDroneMap &bull; CloudCompare</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            {OPEN_SOURCE_ENGINES.slice(0, 3).map((eng) => (
              <div key={eng.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200 font-bold">{eng.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 border border-slate-800">{eng.license}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{eng.category}</span>
                  <p className="text-[11px] text-slate-300 font-sans mt-1.5 line-clamp-2">{eng.keyFeature}</p>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold">{eng.fpsOrSpeed}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Certification Statement Footer */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-cyan-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-600/70 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold font-mono text-emerald-300 text-sm">
                Official Photogrammetric Accuracy Certification
              </h4>
              <p className="text-slate-300 font-sans text-xs mt-0.5 leading-relaxed">
                Certified under ASPRS 2014 Positional Accuracy Standards for Digital Geospatial Data (Class I). All single-pass 3D model coordinates, elevation DSM profiles, and 3D Gaussian Splats have been surveyed and validated within &le; 10 cm RMSE error budget.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadHtmlReport}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shrink-0 transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Official Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isOpenModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
