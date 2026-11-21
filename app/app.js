/* Vice Light Cover Studio — offline GTA-style multi-panel cover art maker.
   No network: every pixel is drawn on canvas, every photo stays on this machine. */
'use strict';

/* ---------- deterministic random (seeded, so every render matches) ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- themes: grade overlays, borders, title colours ---------- */
const THEMES = {
  sunset: {
    label: 'Sunset Heist',
    gradeTop: 'rgba(255,122,26,0.16)', gradeBottom: 'rgba(255,45,120,0.22)',
    border: '#fff7ea', bandBg: '#160a24', bandEdge: '#ffb347',
    titleStops: ['#ffd166', '#ff7a3d', '#ff4d8d', '#ff9ff0'],
    subtitle: '#ffe9c9', accent: '#ffd166'
  },
  neon: {
    label: 'Neon Nights',
    gradeTop: 'rgba(255,46,166,0.18)', gradeBottom: 'rgba(34,211,238,0.20)',
    border: '#eafcff', bandBg: '#0a0618', bandEdge: '#22d3ee',
    titleStops: ['#67e8f9', '#22d3ee', '#ff2ea6', '#ff7ad9'],
    subtitle: '#c9f7ff', accent: '#22d3ee'
  },
  dawn: {
    label: 'Rooftop Dawn',
    gradeTop: 'rgba(255,181,158,0.16)', gradeBottom: 'rgba(126,200,247,0.20)',
    border: '#fff4e8', bandBg: '#131022', bandEdge: '#ffb59e',
    titleStops: ['#ffe3b3', '#ffb59e', '#ff8fab', '#a8d8ff'],
    subtitle: '#dcefff', accent: '#ffb59e'
  }
};

const SIZES = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };

/* ---------- procedural sample scenes (no image files anywhere) ---------- */
function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.55, x + s * 0.02, y - s * 0.8);
  ctx.stroke();
  const topX = x + s * 0.02, topY = y - s * 0.8;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + i * 0.14);
    const len = s * (0.42 + (i % 3) * 0.06);
    ctx.beginPath(); ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.6, topY - Math.sin(a) * len * 0.7 - s * 0.06,
      topX + Math.cos(a) * len, topY - Math.sin(a) * len * 0.4 + s * 0.14);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBirds(ctx, w, h, y0, count, color, seed) {
  const rnd = mulberry32(seed);
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, h * 0.004); ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = w * (0.08 + rnd() * 0.84), y = y0 + rnd() * h * 0.16, s = w * (0.012 + rnd() * 0.014);
    ctx.beginPath();
    ctx.moveTo(x - s, y); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y);
    ctx.stroke();
  }
}

function drawSunGlow(ctx, x, y, r, core, halo) {
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.6);
  g.addColorStop(0, halo); g.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

/* Sunset beach boulevard: big striped sun, ocean shimmer, palm silhouettes. */
function drawSampleSunset(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b1055'); sky.addColorStop(0.42, '#c81d6e');
  sky.addColorStop(0.66, '#ff7a3d'); sky.addColorStop(1, '#ffc46b');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  drawSunGlow(ctx, w * 0.62, h * 0.52, h * 0.20, '#ffe9a8', 'rgba(255,170,80,0.55)');
  // retro sun stripes
  ctx.fillStyle = '#ff7a3d';
  for (let i = 0; i < 4; i++) {
    const y = h * (0.52 + 0.05 + i * 0.045);
    ctx.fillRect(w * 0.40, y, w * 0.44, h * (0.008 + i * 0.004));
  }
  // clouds
  ctx.fillStyle = 'rgba(255,190,160,0.5)';
  for (const [cx, cy, cw] of [[0.16, 0.16, 0.22], [0.55, 0.10, 0.16], [0.80, 0.24, 0.18]]) {
    ctx.beginPath(); ctx.ellipse(w * cx, h * cy, w * cw, h * 0.022, 0, 0, Math.PI * 2); ctx.fill();
  }
  drawBirds(ctx, w, h, h * 0.14, 5, 'rgba(43,16,85,0.85)', 11);
  // ocean
  const sea = ctx.createLinearGradient(0, h * 0.66, 0, h * 0.84);
  sea.addColorStop(0, '#ff9a5c'); sea.addColorStop(1, '#7a1e5e');
  ctx.fillStyle = sea; ctx.fillRect(0, h * 0.66, w, h * 0.18);
  ctx.fillStyle = 'rgba(255,233,168,0.55)';
  const rnd = mulberry32(7);
  for (let i = 0; i < 26; i++) {
    const y = h * (0.67 + rnd() * 0.15), len = w * (0.02 + rnd() * 0.07);
    ctx.fillRect(w * (0.45 + rnd() * 0.4), y, len, h * 0.005);
  }
  // boulevard
  ctx.fillStyle = '#1d0b33'; ctx.fillRect(0, h * 0.84, w, h * 0.16);
  ctx.fillStyle = '#ffb347'; ctx.fillRect(0, h * 0.84, w, h * 0.008);
  ctx.fillStyle = 'rgba(255,209,102,0.8)';
  for (let i = 0; i < 9; i++) ctx.fillRect(w * (0.04 + i * 0.11), h * 0.915, w * 0.05, h * 0.008);
  drawPalm(ctx, w * 0.06, h * 0.86, h * 0.42, '#160826');
  drawPalm(ctx, w * 0.94, h * 0.86, h * 0.46, '#160826');
  drawPalm(ctx, w * 0.30, h * 0.85, h * 0.26, '#241040');
}

/* Neon night street: skyline, glowing signs, wet road, a lowrider silhouette. */
function drawSampleNeon(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#070313'); sky.addColorStop(0.6, '#160b33'); sky.addColorStop(1, '#2a0f45');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  const rnd = mulberry32(23);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 40; i++) ctx.fillRect(rnd() * w, rnd() * h * 0.4, 2, 2);
  // moon
  drawSunGlow(ctx, w * 0.82, h * 0.16, h * 0.07, '#eafcff', 'rgba(103,232,249,0.35)');
  // skyline
  const towers = [[0.02, 0.34, 0.13, 0.52], [0.17, 0.22, 0.12, 0.64], [0.31, 0.40, 0.14, 0.46], [0.47, 0.26, 0.11, 0.60], [0.60, 0.38, 0.15, 0.48], [0.77, 0.30, 0.12, 0.56], [0.90, 0.42, 0.10, 0.44]];
  for (const [x, y, tw, th] of towers) {
    ctx.fillStyle = '#0d0620'; ctx.fillRect(w * x, h * y, w * tw, h * th);
    for (let i = 0; i < 14; i++) {
      const on = rnd() > 0.45;
      ctx.fillStyle = on ? (rnd() > 0.5 ? '#ffd166' : '#22d3ee') : 'rgba(255,255,255,0.06)';
      ctx.fillRect(w * (x + 0.015 + rnd() * (tw - 0.03)), h * (y + 0.03 + rnd() * (th - 0.06)), w * 0.012, h * 0.016);
    }
  }
  // neon signs
  const signs = [[0.06, 0.44, '#ff2ea6', 0.10], [0.34, 0.48, '#22d3ee', 0.12], [0.63, 0.42, '#ffd166', 0.11], [0.86, 0.50, '#ff2ea6', 0.09]];
  for (const [x, y, c, sw] of signs) {
    ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 18;
    ctx.fillStyle = c; ctx.fillRect(w * x, h * y, w * sw, h * 0.028);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(w * (x + 0.01), h * (y + 0.008), w * (sw - 0.02), h * 0.011);
    ctx.restore();
  }
  // wet street with reflections
  const road = ctx.createLinearGradient(0, h * 0.86, 0, h);
  road.addColorStop(0, '#1a0b33'); road.addColorStop(1, '#05020e');
  ctx.fillStyle = road; ctx.fillRect(0, h * 0.86, w, h * 0.14);
  for (const [x, c] of [[0.10, '#ff2ea6'], [0.38, '#22d3ee'], [0.66, '#ffd166']]) {
    const g = ctx.createLinearGradient(0, h * 0.86, 0, h);
    g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.35; ctx.fillStyle = g;
    ctx.fillRect(w * x, h * 0.86, w * 0.07, h * 0.14); ctx.globalAlpha = 1;
  }
  // lowrider silhouette
  ctx.fillStyle = '#05020e';
  ctx.beginPath();
  ctx.moveTo(w * 0.30, h * 0.86); ctx.lineTo(w * 0.34, h * 0.78); ctx.lineTo(w * 0.48, h * 0.76);
  ctx.lineTo(w * 0.60, h * 0.77); ctx.lineTo(w * 0.68, h * 0.82); ctx.lineTo(w * 0.72, h * 0.86);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(w * 0.28, h * 0.84, w * 0.46, h * 0.03);
  ctx.save(); ctx.shadowColor = '#ffe9a8'; ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.arc(w * 0.68, h * 0.845, h * 0.012, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.32, h * 0.845, h * 0.010, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#0a0518';
  ctx.beginPath(); ctx.arc(w * 0.38, h * 0.875, h * 0.022, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.62, h * 0.875, h * 0.022, 0, Math.PI * 2); ctx.fill();
}

/* Rooftop dawn skyline: soft peach sky, rising sun, towers and a water tower. */
function drawSampleDawn(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#7ec8f7'); sky.addColorStop(0.45, '#ffb59e');
  sky.addColorStop(0.72, '#ffd9a0'); sky.addColorStop(1, '#ffeec2');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  drawSunGlow(ctx, w * 0.5, h * 0.62, h * 0.13, '#fff7dd', 'rgba(255,200,140,0.6)');
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (const [cx, cy, cw] of [[0.2, 0.18, 0.2], [0.62, 0.12, 0.15], [0.85, 0.28, 0.14]]) {
    ctx.beginPath(); ctx.ellipse(w * cx, h * cy, w * cw, h * 0.02, 0, 0, Math.PI * 2); ctx.fill();
  }
  drawBirds(ctx, w, h, h * 0.2, 6, 'rgba(60,40,90,0.7)', 31);
  // far towers
  const rnd = mulberry32(41);
  ctx.fillStyle = '#8d6b9e';
  for (let i = 0; i < 9; i++) {
    const tw = w * (0.06 + rnd() * 0.06), th = h * (0.14 + rnd() * 0.2);
    ctx.fillRect(w * (0.02 + i * 0.11), h * 0.62 - th, tw, th + h * 0.38);
  }
  // near towers
  ctx.fillStyle = '#2c1b3d';
  const near = [[0.04, 0.42, 0.16, 0.58], [0.24, 0.34, 0.14, 0.66], [0.62, 0.38, 0.15, 0.62], [0.80, 0.44, 0.17, 0.56]];
  for (const [x, y, tw, th] of near) ctx.fillRect(w * x, h * y, w * tw, h * th);
  // antenna on the tallest
  ctx.strokeStyle = '#2c1b3d'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w * 0.31, h * 0.34); ctx.lineTo(w * 0.31, h * 0.24); ctx.stroke();
  ctx.fillStyle = '#ff5d73'; ctx.beginPath(); ctx.arc(w * 0.31, h * 0.235, 4, 0, Math.PI * 2); ctx.fill();
  // lit windows
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = rnd() > 0.4 ? '#ffd166' : 'rgba(255,255,255,0.14)';
    ctx.fillRect(w * (0.05 + rnd() * 0.9), h * (0.40 + rnd() * 0.5), w * 0.011, h * 0.014);
  }
  // rooftop foreground + water tower
  ctx.fillStyle = '#1a1028'; ctx.fillRect(0, h * 0.88, w, h * 0.12);
  ctx.fillStyle = '#2c1b3d'; ctx.fillRect(w * 0.42, h * 0.78, w * 0.10, h * 0.10);
  ctx.beginPath(); ctx.moveTo(w * 0.42, h * 0.78); ctx.lineTo(w * 0.47, h * 0.72); ctx.lineTo(w * 0.52, h * 0.78); ctx.fill();
  ctx.strokeStyle = '#2c1b3d'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w * 0.44, h * 0.88); ctx.lineTo(w * 0.44, h * 0.80); ctx.moveTo(w * 0.50, h * 0.88); ctx.lineTo(w * 0.50, h * 0.80); ctx.stroke();
}

/* Coastal cruise at dusk: convertible on the coast road, palms, ocean. */
function drawSampleCruise(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#3b1d6e'); sky.addColorStop(0.5, '#e0407c'); sky.addColorStop(0.75, '#ff9a3d');
  sky.addColorStop(1, '#ffd166');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  drawSunGlow(ctx, w * 0.28, h * 0.55, h * 0.15, '#fff3c4', 'rgba(255,160,90,0.5)');
  ctx.fillStyle = 'rgba(255,200,170,0.45)';
  for (const [cx, cy, cw] of [[0.5, 0.14, 0.2], [0.78, 0.22, 0.16]]) {
    ctx.beginPath(); ctx.ellipse(w * cx, h * cy, w * cw, h * 0.02, 0, 0, Math.PI * 2); ctx.fill();
  }
  drawBirds(ctx, w, h, h * 0.18, 4, 'rgba(59,29,110,0.8)', 53);
  // ocean band
  ctx.fillStyle = '#5e2a72'; ctx.fillRect(0, h * 0.62, w, h * 0.12);
  ctx.fillStyle = 'rgba(255,220,150,0.5)';
  const rnd = mulberry32(59);
  for (let i = 0; i < 18; i++) ctx.fillRect(w * (0.1 + rnd() * 0.5), h * (0.63 + rnd() * 0.09), w * (0.02 + rnd() * 0.05), h * 0.005);
  // coast road
  ctx.fillStyle = '#1d0b33'; ctx.fillRect(0, h * 0.74, w, h * 0.26);
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < 8; i++) ctx.fillRect(w * (0.03 + i * 0.125), h * 0.865, w * 0.055, h * 0.009);
  // convertible
  ctx.fillStyle = '#ff2e63';
  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.82); ctx.lineTo(w * 0.38, h * 0.74); ctx.lineTo(w * 0.44, h * 0.73);
  ctx.lineTo(w * 0.52, h * 0.74); ctx.lineTo(w * 0.60, h * 0.75); ctx.lineTo(w * 0.66, h * 0.82);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(w * 0.32, h * 0.80, w * 0.36, h * 0.035);
  ctx.fillStyle = '#0a0518';
  ctx.beginPath(); ctx.arc(w * 0.40, h * 0.835, h * 0.026, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.60, h * 0.835, h * 0.026, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(w * 0.40, h * 0.835, h * 0.010, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.60, h * 0.835, h * 0.010, 0, Math.PI * 2); ctx.fill();
  drawPalm(ctx, w * 0.10, h * 0.78, h * 0.38, '#160826');
  drawPalm(ctx, w * 0.90, h * 0.78, h * 0.42, '#160826');
  drawPalm(ctx, w * 0.76, h * 0.76, h * 0.26, '#241040');
}

const SAMPLE_PAINT = { sunset: drawSampleSunset, neon: drawSampleNeon, dawn: drawSampleDawn, cruise: drawSampleCruise };
const SAMPLE_LABEL = { sunset: 'Sunset boulevard', neon: 'Neon street', dawn: 'Dawn skyline', cruise: 'Coastal cruise' };
const sampleCache = new Map();
function makeSampleCanvas(name) {
  if (sampleCache.has(name)) return sampleCache.get(name);
  const c = document.createElement('canvas');
  c.width = 1200; c.height = 800;
  SAMPLE_PAINT[name](c.getContext('2d'), 1200, 800);
  sampleCache.set(name, c);
  return c;
}

/* ---------- state ---------- */
const state = {
  theme: 'sunset',
  layout: 'hero',
  size: '1920x1080',
  title: 'SUNSET HEIST',
  subtitle: 'one last score on the pier',
  selected: 0,
  panels: [
    { src: 'sunset', zoom: 1, dx: 0, dy: 0 },
    { src: 'neon', zoom: 1, dx: 0, dy: -0.5 },
    { src: 'dawn', zoom: 1, dx: 0, dy: 0 },
    { src: 'cruise', zoom: 1, dx: 0, dy: -0.55 }
  ]
};
const uploads = new Map(); // id -> HTMLImageElement
let uploadCount = 0;

function photoOf(src) {
  if (uploads.has(src)) return uploads.get(src);
  return makeSampleCanvas(src in SAMPLE_PAINT ? src : 'sunset');
}

/* ---------- panel geometry ---------- */
function panelRects(layout, x, y, w, h, gap) {
  if (layout === 'grid') {
    const pw = (w - gap) / 2, ph = (h - gap) / 2;
    return [
      { x, y, w: pw, h: ph }, { x: x + pw + gap, y, w: pw, h: ph },
      { x, y: y + ph + gap, w: pw, h: ph }, { x: x + pw + gap, y: y + ph + gap, w: pw, h: ph }
    ];
  }
  // hero + three: tall hero on the left, three stacked panels on the right
  const heroW = w * 0.60;
  const sideW = w - heroW - gap;
  const sideH = (h - gap * 2) / 3;
  return [
    { x, y, w: heroW, h },
    { x: x + heroW + gap, y, w: sideW, h: sideH },
    { x: x + heroW + gap, y: y + sideH + gap, w: sideW, h: sideH },
    { x: x + heroW + gap, y: y + (sideH + gap) * 2, w: sideW, h: sideH }
  ];
}

/* Draw a photo cover-fitting a rect, with per-panel zoom and pan. */
function drawPhotoCover(ctx, img, rect, zoom, dx, dy) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  const ox = (dw - rect.w) / 2, oy = (dh - rect.h) / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  ctx.drawImage(img, rect.x - ox + dx * ox, rect.y - oy + dy * oy, dw, dh);
  ctx.restore();
}

function applyThemeGrade(ctx, rect, theme) {
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  g.addColorStop(0, theme.gradeTop); g.addColorStop(1, theme.gradeBottom);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

function drawStarBadge(ctx, x, y, r) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd166'; ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.08); ctx.strokeStyle = '#160a24'; ctx.stroke();
  ctx.fillStyle = '#160a24';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r * 0.62 : r * 0.26;
    const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function fitTitleFont(ctx, text, maxW, startPx) {
  let px = startPx;
  const fam = '"Arial Narrow", "Helvetica Neue", Impact, sans-serif';
  while (px > 12) {
    ctx.font = '900 ' + px + 'px ' + fam;
    if (ctx.measureText(text).width <= maxW) return px;
    px -= 2;
  }
  return px;
}

/* The cover renderer: panels, grade, title band, grain, vignette. */
function drawCover(ctx, W, H, st) {
  const theme = THEMES[st.theme];
  ctx.fillStyle = theme.bandBg;
  ctx.fillRect(0, 0, W, H);

  const bandH = Math.round(H * 0.205);
  const panelH = H - bandH;
  const margin = Math.round(W * 0.012);
  const gap = Math.round(W * 0.006);
  const area = { x: margin, y: margin, w: W - margin * 2, h: panelH - margin * 2 };
  const rects = panelRects(st.layout, area.x, area.y, area.w, area.h, gap);
  const borderW = Math.max(2, Math.round(W / 480));

  rects.forEach((r, i) => {
    const p = st.panels[i];
    drawPhotoCover(ctx, photoOf(p.src), r, p.zoom, p.dx, p.dy);
    applyThemeGrade(ctx, r, theme);
    ctx.strokeStyle = theme.border; ctx.lineWidth = borderW;
    ctx.strokeRect(r.x + borderW / 2, r.y + borderW / 2, r.w - borderW, r.h - borderW);
  });

  // star badge over the top-right panel corner
  const badgeR = Math.max(14, Math.round(W * 0.024));
  drawStarBadge(ctx, W - margin - badgeR - Math.round(W * 0.008), margin + badgeR + Math.round(W * 0.008), badgeR);

  // title band: halftone dots + edge rule
  const bandY = panelH;
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, H);
  bandGrad.addColorStop(0, '#1b0f2e'); bandGrad.addColorStop(1, theme.bandBg);
  ctx.fillStyle = bandGrad; ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  const dotStep = Math.max(10, Math.round(W / 110));
  for (let y = bandY + dotStep / 2; y < H; y += dotStep) {
    for (let x = dotStep / 2; x < W; x += dotStep) {
      ctx.beginPath(); ctx.arc(x, y, Math.max(1, dotStep * 0.09), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.fillStyle = theme.bandEdge; ctx.fillRect(0, bandY, W, Math.max(2, Math.round(H * 0.003)));

  // title: gradient condensed lettering, fitted to the width
  const titlePx = fitTitleFont(ctx, st.title.toUpperCase(), W * 0.92, Math.round(bandH * 0.52));
  const titleY = bandY + bandH * 0.52;
  const tg = ctx.createLinearGradient(W * 0.06, 0, W * 0.94, 0);
  theme.titleStops.forEach((c, i) => tg.addColorStop(i / (theme.titleStops.length - 1), c));
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = Math.round(titlePx * 0.12);
  ctx.shadowOffsetY = Math.round(titlePx * 0.04);
  ctx.fillStyle = tg;
  ctx.fillText(st.title.toUpperCase(), W / 2, titleY);
  ctx.restore();

  // subtitle: soft italic serif with a glow
  const subPx = Math.round(bandH * 0.21);
  ctx.save();
  ctx.font = 'italic ' + subPx + 'px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = theme.accent; ctx.shadowBlur = Math.round(subPx * 0.5);
  ctx.fillStyle = theme.subtitle;
  ctx.fillText(st.subtitle, W / 2, bandY + bandH * 0.82);
  ctx.restore();

  // film grain (seeded: identical every render)
  const rnd = mulberry32(20261121);
  const dots = Math.round((W * H) / 900);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < dots; i++) ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let i = 0; i < dots; i++) ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);

  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,4,20,0.34)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  return rects;
}

/* ---------- preview + editor UI ---------- */
const preview = document.getElementById('preview');
const pctx = preview.getContext('2d');
let previewRects = [];
let previewScale = 1;

function renderPreview() {
  const [w, h] = SIZES[state.size];
  const maxW = 1280;
  const scale = Math.min(1, maxW / w);
  const cw = Math.round(w * scale), ch = Math.round(h * scale);
  if (preview.width !== cw || preview.height !== ch) { preview.width = cw; preview.height = ch; }
  previewScale = cw / w;
  previewRects = drawCover(pctx, cw, ch, state);
  // selection outline on the active panel
  const r = previewRects[state.selected];
  if (r) {
    pctx.save();
    pctx.strokeStyle = '#ffd166'; pctx.lineWidth = 4; pctx.setLineDash([14, 8]);
    pctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    pctx.restore();
  }
  document.getElementById('zoomSlider').value = state.panels[state.selected].zoom;
  document.getElementById('zoomVal').textContent = state.panels[state.selected].zoom.toFixed(2) + '×';
}

function panelAt(clientX, clientY) {
  const box = preview.getBoundingClientRect();
  const x = (clientX - box.left) * (preview.width / box.width);
  const y = (clientY - box.top) * (preview.height / box.height);
  for (let i = previewRects.length - 1; i >= 0; i--) {
    const r = previewRects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

let drag = null;
preview.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  state.selected = i;
  drag = { i, x: e.clientX, y: e.clientY, dx: state.panels[i].dx, dy: state.panels[i].dy };
  preview.setPointerCapture(e.pointerId);
  renderPreview();
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const box = preview.getBoundingClientRect();
  const r = previewRects[drag.i];
  const ddx = (e.clientX - drag.x) * (preview.width / box.width) / Math.max(1, r.w);
  const ddy = (e.clientY - drag.y) * (preview.height / box.height) / Math.max(1, r.h);
  state.panels[drag.i].dx = Math.max(-1, Math.min(1, drag.dx + ddx * 2));
  state.panels[drag.i].dy = Math.max(-1, Math.min(1, drag.dy + ddy * 2));
  renderPreview();
});
preview.addEventListener('pointerup', () => { drag = null; });

function setActive(rowId, attr, value) {
  document.querySelectorAll('#' + rowId + ' .chip').forEach((c) => {
    c.classList.toggle('active', c.dataset[attr] === value);
  });
}

function syncChips() {
  setActive('layoutRow', 'layout', state.layout);
  setActive('themeRow', 'theme', state.theme);
  setActive('sizeRow', 'size', state.size);
}

document.getElementById('layoutRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-layout]'); if (!b) return;
  state.layout = b.dataset.layout; syncChips(); renderPreview();
});
document.getElementById('themeRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-theme]'); if (!b) return;
  state.theme = b.dataset.theme; syncChips(); renderPreview();
});
document.getElementById('sizeRow').addEventListener('click', (e) => {
  const b = e.target.closest('[data-size]'); if (!b) return;
  state.size = b.dataset.size; syncChips(); renderPreview();
});
document.getElementById('titleInput').addEventListener('input', (e) => {
  state.title = e.target.value || 'UNTITLED'; renderPreview();
});
document.getElementById('subtitleInput').addEventListener('input', (e) => {
  state.subtitle = e.target.value; renderPreview();
});
document.getElementById('zoomSlider').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = parseFloat(e.target.value);
  document.getElementById('zoomVal').textContent = state.panels[state.selected].zoom.toFixed(2) + '×';
  renderPreview();
});
document.getElementById('resetCropBtn').addEventListener('click', () => {
  const p = state.panels[state.selected];
  p.zoom = 1; p.dx = 0; p.dy = 0; renderPreview();
});
document.getElementById('fillAllBtn').addEventListener('click', () => {
  const src = state.panels[state.selected].src;
  state.panels.forEach((p, i) => { p.src = src; p.dx = (i % 2) * 0.5 - 0.25; p.dy = (i < 2 ? -0.3 : 0.3); });
  renderPreview();
});

/* sample scene thumbnails */
const sampleRow = document.getElementById('sampleRow');
for (const name of Object.keys(SAMPLE_PAINT)) {
  const img = document.createElement('img');
  img.className = 'sample-thumb'; img.alt = SAMPLE_LABEL[name]; img.title = SAMPLE_LABEL[name];
  img.src = makeSampleCanvas(name).toDataURL('image/jpeg', 0.8);
  img.addEventListener('click', () => {
    const p = state.panels[state.selected];
    p.src = name; p.zoom = 1; p.dx = 0; p.dy = 0;
    sampleRow.querySelectorAll('.sample-thumb').forEach((t) => t.classList.remove('active'));
    img.classList.add('active');
    renderPreview();
  });
  sampleRow.appendChild(img);
}

/* uploads: file input + drag and drop onto the preview */
function addUploadFiles(files) {
  let placed = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const id = 'upload-' + (++uploadCount);
    const img = new Image();
    img.onload = () => {
      uploads.set(id, img);
      const target = placed === 0 ? state.selected : (state.selected + placed) % state.panels.length;
      const p = state.panels[target];
      p.src = id; p.zoom = 1; p.dx = 0; p.dy = 0;
      placed++;
      renderPreview();
    };
    img.src = URL.createObjectURL(file);
  }
}
document.getElementById('photoInput').addEventListener('change', (e) => {
  addUploadFiles(e.target.files);
  e.target.value = '';
});
const wrap = document.querySelector('.canvas-wrap');
const dropHint = document.getElementById('dropHint');
['dragenter', 'dragover'].forEach((ev) => wrap.addEventListener(ev, (e) => {
  e.preventDefault(); dropHint.hidden = false;
}));
['dragleave', 'drop'].forEach((ev) => wrap.addEventListener(ev, (e) => {
  e.preventDefault(); dropHint.hidden = true;
}));
wrap.addEventListener('drop', (e) => addUploadFiles(e.dataTransfer.files));

/* export: render the cover at full size and download the PNG */
function exportPNG() {
  const [w, h] = SIZES[state.size];
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawCover(c.getContext('2d'), w, h, state);
  c.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vice-light-cover-' + state.size + '.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}
document.getElementById('exportBtn').addEventListener('click', exportPNG);
document.getElementById('exportTopBtn').addEventListener('click', exportPNG);

/* ---------- deterministic screenshot mode (?shot=cover|editor) ---------- */
function applyShotParams() {
  const q = new URLSearchParams(location.search);
  if (q.get('theme') in THEMES) state.theme = q.get('theme');
  if (q.get('layout') === 'hero' || q.get('layout') === 'grid') state.layout = q.get('layout');
  if (q.get('size') in SIZES) state.size = q.get('size');
  if (q.get('title')) { state.title = q.get('title'); document.getElementById('titleInput').value = q.get('title'); }
  if (q.get('subtitle')) { state.subtitle = q.get('subtitle'); document.getElementById('subtitleInput').value = q.get('subtitle'); }
  if (q.get('shot') === 'cover') {
    document.body.classList.add('shot-cover');
    const [w, h] = SIZES[state.size];
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / w, vh / h);
    preview.width = Math.round(w * s); preview.height = Math.round(h * s);
    drawCover(pctx, preview.width, preview.height, state);
    document.title = 'Vice Light Cover — ' + state.title;
    return true;
  }
  return false;
}

syncChips();
if (!applyShotParams()) renderPreview();
