import * as THREE from 'three';

// Generate procedural textures to avoid external network dependencies
export function createBuildingFacadeTexture(floors = 8, bays = 6): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Concrete / stone base
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 1024);

  // Ground floor entrance
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 900, 472, 120);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(60, 920, 100, 90);
  ctx.fillRect(350, 920, 100, 90);

  // Window grid
  const winWidth = 44;
  const winHeight = 65;
  const padX = (512 - bays * winWidth) / (bays + 1);
  const padY = (880 - floors * winHeight) / (floors + 1);

  for (let f = 0; f < floors; f++) {
    const y = 30 + f * (winHeight + padY);
    for (let b = 0; b < bays; b++) {
      const x = padX + b * (winWidth + padX);

      // Glass gradient
      const grad = ctx.createLinearGradient(x, y, x + winWidth, y + winHeight);
      const isLit = (f + b) % 3 === 0;
      grad.addColorStop(0, isLit ? '#38bdf8' : '#0369a1');
      grad.addColorStop(1, isLit ? '#0284c7' : '#075985');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, winWidth, winHeight);

      // Mullions
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, winWidth, winHeight);
    }
  }

  // Spandrel panels
  ctx.fillStyle = '#334155';
  for (let f = 0; f < floors; f++) {
    const y = 30 + f * (winHeight + padY) + winHeight;
    ctx.fillRect(10, y, 492, Math.max(4, padY - 4));
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Asphalt
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  // Road noise
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#334155' : '#0f172a';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  // Center dashed yellow line
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.setLineDash([30, 20]);
  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  // White border lines
  ctx.strokeStyle = '#f8fafc';
  ctx.setLineDash([]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(512, 40);
  ctx.moveTo(0, 472);
  ctx.lineTo(512, 472);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createRoofTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 256, 256);

  // Gravel tar roof texture
  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#475569' : '#1e293b';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  // Grid seams
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createStoneRuinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Weathered travertine / sandstone base
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 512, 512);

  // Ancient stone blocks pattern
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  const rowH = 64;
  for (let r = 0; r < 8; r++) {
    const y = r * rowH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    const colW = 128;
    const offset = (r % 2) * 64;
    for (let c = 0; c < 5; c++) {
      const x = c * colW - offset;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    }
  }

  // Weathering noise & patina
  for (let i = 0; i < 4000; i++) {
    const n = Math.random();
    ctx.fillStyle = n > 0.6 ? '#94a3b8' : n > 0.3 ? '#e2e8f0' : '#475569';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 3 + 1, Math.random() * 3 + 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createConstructionConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Poured architectural concrete
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 512, 512);

  // Formwork seams
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 504, 504);

  // Tie rod holes
  ctx.fillStyle = '#1e293b';
  const tiePositions = [
    [64, 64], [448, 64],
    [64, 448], [448, 448],
    [256, 256],
  ];
  tiePositions.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Concrete aggregate noise
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#64748b' : '#334155';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createSolarGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep blue photovoltaic silicon
  ctx.fillStyle = '#0369a1';
  ctx.fillRect(0, 0, 256, 256);

  // Busbars & silicon cell grid
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
  }

  // Silver conductor lines
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(64, 0); ctx.lineTo(64, 256);
  ctx.moveTo(192, 0); ctx.lineTo(192, 256);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createCamoDesertTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Sandy arid base
  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 0, 512, 512);

  // Arid noise and scrub vegetation patches
  for (let i = 0; i < 5000; i++) {
    const r = Math.random();
    ctx.fillStyle = r > 0.8 ? '#451a03' : r > 0.5 ? '#92400e' : r > 0.3 ? '#b45309' : '#365314';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 4 + 1, Math.random() * 4 + 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Generate elevation color given height Z
export function getHypsometricColor(z: number, minZ = 0, maxZ = 60): THREE.Color {
  const t = Math.max(0, Math.min(1, (z - minZ) / (maxZ - minZ || 1)));
  const color = new THREE.Color();
  if (t < 0.2) {
    color.setRGB(0.1, 0.4 + t * 2, 0.9); // Blue to cyan
  } else if (t < 0.5) {
    color.setRGB(0.1 + (t - 0.2) * 2, 0.8, 0.2); // Cyan to green
  } else if (t < 0.8) {
    color.setRGB(0.9, 0.8 - (t - 0.5) * 1.5, 0.1); // Yellow to orange
  } else {
    color.setRGB(0.95, 0.2 - (t - 0.8) * 0.8, 0.2); // Orange to red
  }
  return color;
}

// Generate high-resolution georeferenced satellite & orthomosaic map texture
export function createGeoreferencedMapTexture(
  scenarioTitle: string,
  utmZone: string,
  domain: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Base imagery style depending on domain
  if (domain === 'border-strategic-mapping' || domain === 'military-recon-mission-planning') {
    // Desert arid aerial satellite base
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 4500; i++) {
      const rx = Math.random() * 1024;
      const ry = Math.random() * 1024;
      const r = Math.random();
      ctx.fillStyle = r > 0.7 ? '#92400e' : r > 0.4 ? '#b45309' : r > 0.2 ? '#451a03' : '#365314';
      ctx.fillRect(rx, ry, Math.random() * 7 + 2, Math.random() * 7 + 2);
    }
  } else if (domain === 'disaster-damage-assessment') {
    // Mountain river canyon aerial base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1024, 1024);
    // River channel through center
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(440, 0, 144, 1024);
    for (let i = 0; i < 3500; i++) {
      const rx = Math.random() * 1024;
      const ry = Math.random() * 1024;
      if (rx < 440 || rx > 584) {
        ctx.fillStyle = Math.random() > 0.5 ? '#334155' : '#475569';
        ctx.fillRect(rx, ry, Math.random() * 6 + 2, Math.random() * 6 + 2);
      }
    }
  } else if (domain === 'urban-planning-smart-cities') {
    // City block aerial orthomosaic
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(350, 0); ctx.lineTo(674, 1024); ctx.lineTo(820, 1024); ctx.lineTo(496, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    for (let bx = 60; bx < 960; bx += 220) {
      for (let by = 60; by < 960; by += 220) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx, by, 160, 160);
        ctx.strokeRect(bx, by, 160, 160);
      }
    }
  } else if (domain === 'infrastructure-inspection') {
    // Green highway corridor
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 470, 1024, 84);
    ctx.fillRect(470, 0, 84, 1024);
  } else if (domain === 'construction-progress-monitoring') {
    // Earthworks / excavated clay soil
    ctx.fillStyle = '#713f12';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(360, 360, 304, 304);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.strokeRect(360, 360, 304, 304);
  } else if (domain === 'archaeological-documentation') {
    // Limestone ruin plateau
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(360, 380, 304, 264);
  } else {
    // Modern campus grounds
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#334155';
    ctx.fillRect(480, 0, 64, 1024);
    ctx.fillRect(0, 480, 1024, 64);
  }

  // 2. High-precision GIS Projected Coordinate Graticule (UTM Grid lines every 128px)
  const gridStep = 128;
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.55)'; // Neon cyan GIS graticule
  ctx.lineWidth = 1.5;
  ctx.font = '10px monospace';
  ctx.fillStyle = '#38bdf8';

  for (let x = 0; x <= 1024; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();

    ctx.fillText(`${x * 0.5}m E`, x + 4, 18);
    ctx.fillText(`${x * 0.5}m E`, x + 4, 1012);
  }

  for (let y = 0; y <= 1024; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();

    ctx.fillText(`${(1024 - y) * 0.5}m N`, 6, y - 4);
    ctx.fillText(`${(1024 - y) * 0.5}m N`, 942, y - 4);
  }

  // Coordinate target reticles '+' at grid intersections
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  for (let x = gridStep; x < 1024; x += gridStep) {
    for (let y = gridStep; y < 1024; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
      ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
      ctx.stroke();
    }
  }

  // 3. Cadastral Property / Survey Parcel Boundary Lines (Dashed Amber lines)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(128, 128, 768, 768);
  ctx.strokeRect(256, 256, 512, 512);
  ctx.setLineDash([]); // reset

  // Parcel Boundary Label
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('SURVEY BOUNDARY & CADASTRAL PARCEL #01', 136, 146);
  ctx.fillText('INNER EXTRACTION GEOFENCE', 264, 274);

  // 4. Geodetic Metadata Banner & Watermark
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(20, 20, 340, 64);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 20, 340, 64);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`GEOREFERENCED 3D ORTHOMOSAIC`, 30, 38);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText(`CRS: WGS84 / ${utmZone} (EPSG Projected)`, 30, 54);
  ctx.fillText(`RESOLUTION: SUB-5CM GSD | ORTHO-RECTIFIED`, 30, 68);

  // 5. True North Arrow & Compass Rose watermark
  ctx.save();
  ctx.translate(950, 70);
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.stroke();

  // North needle
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, -22); ctx.lineTo(6, 4); ctx.lineTo(-6, 4);
  ctx.closePath(); ctx.fill();

  // South needle
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(0, 22); ctx.lineTo(6, 4); ctx.lineTo(-6, 4);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('N', -4, -24);
  ctx.restore();

  // 6. Metric Scale Bar in corner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(800, 936, 204, 52);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(800, 936, 204, 52);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '10px monospace';
  ctx.fillText('METRIC MAP SCALE', 812, 952);

  const sbX = 812; const sbY = 960; const segW = 40;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(sbX, sbY, segW, 8);
  ctx.fillStyle = '#0284c7'; ctx.fillRect(sbX + segW, sbY, segW, 8);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(sbX + segW * 2, sbY, segW, 8);
  ctx.fillStyle = '#0284c7'; ctx.fillRect(sbX + segW * 3, sbY, segW, 8);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px monospace';
  ctx.fillText('0', sbX, sbY + 20);
  ctx.fillText('20m', sbX + segW - 10, sbY + 20);
  ctx.fillText('40m', sbX + segW * 2 - 10, sbY + 20);
  ctx.fillText('80m', sbX + segW * 4 - 15, sbY + 20);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
