import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));

// Shared Gemini Client with required aistudio-build header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Deep Photogrammetry & Single-Pass 3D Reconstruction Reasoning using gemini-3.1-pro-preview with HIGH thinking
app.post('/api/reconstruction/analyze', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in server environment.',
      });
    }

    const {
      flightScenario,
      videoMetadata,
      telemetrySample,
      gcpData,
      reconstructionSettings,
      userNotes,
    } = req.body;

    const systemInstruction = `You are a Principal Photogrammetry Scientist and Computer Vision Lead specializing in single-pass UAV (unmanned aerial vehicle) aerial 3D reconstruction, Neural Radiance Fields / 3D Gaussian Splatting, and georeferenced spatial digital twins.

Your task is to conduct an authoritative, rigorous photogrammetric analysis for generating metrically accurate (target: <= 10 cm RMSE) 3D textured models and point clouds from a SINGLE drone flight pass across 8 operational application domains:
(i) Border and strategic area mapping (demarcation buffers, patrol roads, watchtowers, sensor barrier trenches, line-of-sight analysis)
(ii) Disaster damage assessment (structural collapse triage, riverbed debris volumetrics, fracture gaps, emergency access clearance)
(iii) Urban planning and smart cities (high-rise facade corridors, microclimate solar shadow studies, right-of-way easements, dynamic traffic removal)
(iv) Infrastructure inspection (bridge viaduct spans, concrete spalling/cracks, high-voltage pylon catenary sag clearance)
(v) Construction progress monitoring (foundation excavation pits, earthworks cut/fill stockpile calculation, 4D BIM vs As-Built tolerances)
(vi) Archaeological documentation (non-contact heritage recording, classical temple colonnade preservation, excavation trench stratigraphy grids)
(vii) Digital twin generation (smart cyber-physical campuses, LOD1-LOD3 semantic geometry, live IoT sensor node integration)
(viii) Military reconnaissance and mission planning (tactical ridge ingress, threat dome intervisibility, helicopter LZ slope verification < 7°)

In single-pass drone videogrammetry, the flight path is unidirectional (linear or slight arc), meaning:
1. Baselines between adjacent frames are narrow and collinear.
2. Viewing angle diversity is limited compared to cross-hatch or orbital flights.
3. Occlusions occur behind building facades and steep terrain.
4. Scale drift and bowling / dishing deformation can occur without Ground Control Points (GCPs) or RTK-GNSS priors.
5. Rolling shutter distortions and motion blur degrade feature matching.

Provide an exhaustive analysis tailored to the active application domain with:
1. Executive Feasibility & Quality Rating (0-100 score).
2. Metric Accuracy & GCP Residual Analysis (estimated X, Y, Z RMSE in cm, baseline confidence).
3. Occlusion Resolution & Neural Prior Inpainting Strategy for hidden facades/shadow zones.
4. Scale Drift Prevention & Bundle Adjustment constraints.
5. Dynamic Object & Motion Artifact Suppression (filtering vehicles/pedestrians).
6. Operational Flight Recommendations for future single-pass captures in this domain.

Return your response in clean JSON format adhering strictly to this schema:
{
  "feasibilityScore": number (0-100),
  "predictedGsdCm": number,
  "estimatedHorizontalAccuracyCm": number,
  "estimatedVerticalAccuracyCm": number,
  "reconstructionCompletenessPercent": number,
  "bundleAdjustmentStability": "Optimal" | "Good" | "Marginal" | "High Drift Risk",
  "keyObservations": string[],
  "occlusionAnalysis": {
    "identifiedOccludedZones": string[],
    "inpaintingMethodology": string,
    "confidenceInterval": string
  },
  "gcpResidualEstimates": [
    { "gcpId": string, "deltaXCm": number, "deltaYCm": number, "deltaZCm": number, "status": "Sub-Centimeter" | "Acceptable" | "Outlier Warning" }
  ],
  "technicalRecommendations": string[],
  "scientificSummary": string
}`;

    const prompt = `Analyze this Single-Pass Drone Reconstruction dataset:
Scenario: ${flightScenario || 'Urban/Infrastructure Rapid Survey'}
Video Specs: ${JSON.stringify(videoMetadata || {})}
Flight Telemetry: ${JSON.stringify(telemetrySample || {})}
GCP Measurements: ${JSON.stringify(gcpData || [])}
Reconstruction Engine Config: ${JSON.stringify(reconstructionSettings || {})}
Mission Objectives & Notes: ${userNotes || 'Standard emergency rapid response single-pass mapping'}`;

    // Per instruction: MUST use gemini-3.1-pro-preview with thinkingLevel HIGH and no maxOutputTokens
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Clean up markdown fences if any
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Reconstruction analysis error:', err);
    return res.status(500).json({
      error: err.message || 'Internal photogrammetric analysis error',
    });
  }
});

// Interactive Flight Copilot Chat with High Thinking
app.post('/api/reconstruction/copilot', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in server environment.',
      });
    }

    const { message, history, context } = req.body;

    const systemInstruction = `You are Vyom3DGS Copilot, an elite AI photogrammetric and geodetic advisor for single-pass drone 3D Gaussian Splatting (3DGS) and photogrammetric reconstruction. You assist UAV pilots, GIS engineers, surveyors, and tactical reconnaissance teams.
You have deep expertise in:
- 3D Gaussian Splatting (3DGS) and neural radiance field rasterization under degenerate linear camera motions.
- YOLOv8 real-time aerial object detection and dynamic transient masking (vehicles, pedestrians) to prevent 3DGS ghosting.
- Faster R-CNN two-stage Region Proposal Network (RPN) for sub-millimeter geospatial defect detection and tactical asset mensuration.
- Open-source photogrammetry and geospatial software suites: COLMAP, OpenDroneMap (ODM), CloudCompare (M3C2), OpenMVG/OpenMVS, AliceVision Meshroom, QGIS, GDAL, and PDAL.
- Dual-frequency RTK/PPK GNSS integration and Ground Control Point (GCP) distribution.
- Metric measurement validation (distance, heights, volumes, DSM/DTM elevation profiles).
- Camera sensor mechanics (Global vs. Rolling shutter, GSD calculation, focal length calibration).
- Format exports (ASPRS LAS/LAZ, 3DGS PLY splats, textured OBJ/GLTF meshes, GeoTIFF elevation rasters, GeoJSON).

Provide precise, mathematically grounded, and actionable answers. Use clear formatting with bolding and bullet points when explaining technical concepts.`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text }],
        });
      }
    }

    const promptContext = context ? `\n[Current Project Context: ${JSON.stringify(context)}]` : '';
    contents.push({
      role: 'user',
      parts: [{ text: `${message}${promptContext}` }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    return res.json({
      success: true,
      reply: response.text,
    });
  } catch (err: any) {
    console.error('Copilot error:', err);
    return res.status(500).json({
      error: err.message || 'Photogrammetric copilot request failed',
    });
  }
});

// Mount Vite middleware in development or serve static in production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Vyom3DGS server running at http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
