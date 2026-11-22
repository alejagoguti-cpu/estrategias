import React from 'react';
import { clamp, vaiven } from '../../components/CorteVivo.jsx';

// Corte de la huerta-vivero (sección 12): invernadero de marco de acero galvanizado con cubierta de
// policarbonato translúcido, mesas de cultivo elevadas con bandejas de plántulas, riego por goteo desde un
// tanque de lluvia, ventilación por la cumbrera; afuera papaya y algodoncillo para fauna y polinizadores.
export const suelo = (x) => 470 + Math.sin(x / 70) * 1.5;
const IZ = 380; const DE = 820; const ALERO = 392; const CUMBRE = 336; const MID = (IZ + DE) / 2;
const techoY = (x) => (x < MID ? ALERO + ((CUMBRE - ALERO) * (x - IZ)) / (MID - IZ) : CUMBRE + ((ALERO - CUMBRE) * (x - MID)) / (DE - MID));
const MESAS = [[420, 500], [560, 640], [700, 780]]; const MESA_Y = 448;
const TANQUE = { x0: 860, x1: 900, y0: 410, y1: 470 };
const verdes = ['#2f5d2a', '#3f6f2c', '#557f34', '#2b4f27', '#6c8f3a', '#46702e'];

function pintarFondo(x) {
  const perfil = new Path2D(); perfil.moveTo(60, suelo(60)); for (let i = 65; i <= 1150; i += 5) perfil.lineTo(i, suelo(i));
  const tierra = new Path2D(perfil); tierra.lineTo(1150, 560); tierra.lineTo(60, 560); tierra.closePath();
  const gr = x.createLinearGradient(0, 460, 0, 560); gr.addColorStop(0, '#8a4e32'); gr.addColorStop(0.4, '#6a3c26'); gr.addColorStop(1, '#2e1c12'); x.fillStyle = gr; x.fill(tierra);
  x.save(); x.clip(tierra); x.fillStyle = '#3a2618'; x.fillRect(IZ, suelo(600) + 2, DE - IZ, 10); x.restore(); // capa de compost
  // papaya y algodoncillo afuera, árboles de fondo
  const copa = (cx, cy, r, cols) => { [[0, -1.55, 0.8], [-0.6, -1.25, 0.62], [0.62, -1.28, 0.66], [-0.25, -2.0, 0.6], [0.35, -1.95, 0.58], [0, -1.2, 0.6]].forEach(([dx, dy, kk], i) => { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(cx + dx * r, cy + dy * r, kk * r, 0, 6.283); x.fill(); }); x.fillStyle = '#5b4330'; x.fillRect(cx - 3, cy - r * 1.2, 6, r * 1.2); };
  copa(110, suelo(110), 80, verdes); copa(1130, suelo(1130), 74, verdes.slice().reverse());
  { const px = 250; const py = suelo(px); x.strokeStyle = '#8c7a58'; x.lineWidth = 4; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 3, py - 120); x.stroke(); for (let k = 0; k < 9; k++) { const a = -Math.PI + (k / 8) * Math.PI; x.strokeStyle = '#4f8a34'; x.lineWidth = 2; x.beginPath(); x.moveTo(px + 3, py - 120); x.quadraticCurveTo(px + 3 + Math.cos(a) * 18, py - 120 + Math.sin(a) * 22 - 8, px + 3 + Math.cos(a) * 36, py - 112 + Math.sin(a) * 12); x.stroke(); x.fillStyle = '#5c9a3c'; x.beginPath(); x.ellipse(px + 3 + Math.cos(a) * 36, py - 112 + Math.sin(a) * 12, 8, 4, a, 0, 6.283); x.fill(); } [[-4, -110], [5, -108], [0, -104], [8, -102], [-6, -102]].forEach(([dx, dy], i) => { x.fillStyle = i % 2 ? '#e0a23a' : '#8fae3a'; x.beginPath(); x.ellipse(px + dx, py + dy, 3.6, 5.4, 0, 0, 6.283); x.fill(); }); }
  { const ax = 990; const ay = suelo(ax); x.strokeStyle = '#7d8f5a'; x.lineWidth = 2; [-8, -3, 3, 8].forEach((d) => { x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(ax + d * 0.6, ay - 14, ax + d, ay - 24); x.stroke(); }); [[-9, -24, 7], [-2, -30, 8], [7, -26, 7], [0, -20, 7], [10, -18, 5], [-10, -16, 5]].forEach(([dx, dy, r2], i) => { x.fillStyle = ['#8fae7a', '#a3be8c', '#7f9f6c'][i % 3]; x.beginPath(); x.ellipse(ax + dx, ay + dy, r2, r2 * 0.6, 0.3, 0, 6.283); x.fill(); }); [[-4, -36], [4, -34], [-11, -30], [10, -31]].forEach(([dx, dy]) => { x.fillStyle = '#d8c4f0'; x.beginPath(); x.arc(ax + dx, ay + dy, 2.6, 0, 6.283); x.fill(); }); }
  // marco de acero galvanizado: columnas, cerchas, tornapuntas y tirante
  x.strokeStyle = '#b8bec2'; x.lineWidth = 3;
  [IZ, DE].forEach((cx0) => { x.beginPath(); x.moveTo(cx0, suelo(cx0)); x.lineTo(cx0, ALERO); x.stroke(); });
  x.beginPath(); x.moveTo(IZ, ALERO); x.lineTo(MID, CUMBRE); x.lineTo(DE, ALERO); x.stroke(); x.beginPath(); x.moveTo(IZ, ALERO); x.lineTo(DE, ALERO); x.stroke();
  x.lineWidth = 2; [[IZ, IZ + 50], [DE, DE - 50]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, ALERO + 20); x.lineTo(b, techoY(b)); x.stroke(); });
  for (let px = IZ + 55; px < DE; px += 55) { x.beginPath(); x.moveTo(px, ALERO); x.lineTo(px, techoY(px)); x.stroke(); }
  // cubierta de policarbonato translúcido con manchas
  for (let px = IZ - 6; px <= DE + 6; px += 3) { x.fillStyle = ['rgba(240,232,210,.75)', 'rgba(226,206,160,.75)', 'rgba(246,240,226,.75)'][(px / 3) % 3 | 0]; x.fillRect(px, techoY(Math.min(DE, Math.max(IZ, px))) - 5, 3, 4); }
  // mesas de cultivo con bandejas y plántulas
  MESAS.forEach(([a, b]) => { x.fillStyle = '#9a7048'; x.fillRect(a, MESA_Y, b - a, 5); x.fillRect(a + 3, MESA_Y, 3, suelo(a) - MESA_Y); x.fillRect(b - 6, MESA_Y, 3, suelo(b) - MESA_Y); x.fillStyle = '#2a2420'; x.fillRect(a, MESA_Y - 5, b - a, 5); x.fillStyle = '#4a3020'; x.fillRect(a + 2, MESA_Y - 4, b - a - 4, 3); });
  // goteo: tanque de lluvia → tubería → mesas
  x.fillStyle = '#8a9aa2'; x.fillRect(TANQUE.x0, TANQUE.y0, TANQUE.x1 - TANQUE.x0, TANQUE.y1 - TANQUE.y0);
  x.strokeStyle = '#1e1e1e'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(TANQUE.x0, 462); x.lineTo(410, 462); x.stroke(); MESAS.forEach(([a]) => { x.beginPath(); x.moveTo(a + 10, 462); x.lineTo(a + 10, MESA_Y - 6); x.stroke(); });
  x.strokeStyle = '#4a5156'; x.lineWidth = 3; x.beginPath(); x.moveTo(DE + 4, ALERO + 2); x.lineTo(880, TANQUE.y0); x.stroke();
  x.strokeStyle = '#f4f1ea'; x.lineWidth = 3.2; x.stroke(perfil);
}
function pintarPasto(x) {
  const junco = (jx, jy, n, h, w, cols, ancho = 2) => { for (let i = 0; i < n; i++) { const dx = (i / (n - 1) - 0.5) * w; const ho = h * (0.6 + 0.4 * Math.sin(i * 2.3 + jx) ** 2); const cur = (i / (n - 1) - 0.5) * 12; x.strokeStyle = cols[i % cols.length]; x.lineWidth = ancho; x.lineCap = 'round'; x.beginPath(); x.moveTo(jx + dx, jy); x.quadraticCurveTo(jx + dx + cur * 0.3, jy - ho * 0.6, jx + dx + cur, jy - ho); x.stroke(); } };
  for (let jx = 66; jx < 360; jx += 11) junco(jx, suelo(jx) - 3, 4, 10 + (jx % 3) * 3, 7, ['#7fae36', '#5e9a2c', '#9cc44a']);
  for (let jx = 920; jx < 1146; jx += 11) junco(jx, suelo(jx) - 3, 4, 10 + (jx % 3) * 3, 7, ['#7fae36', '#5e9a2c', '#9cc44a']);
  // plántulas en las mesas
  MESAS.forEach(([a, b], k) => { for (let px = a + 4; px < b - 3; px += 6) { const h = k === 1 ? 8 + (px % 4) : 16 + (px % 7); x.strokeStyle = '#4f8a34'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(px, MESA_Y - 5); x.lineTo(px, MESA_Y - 5 - h * 0.6); x.stroke(); [-1, 1].forEach((s) => { x.fillStyle = ['#6cae3e', '#8ac64e', '#5a9a34'][(px / 6 + s + 3) % 3 | 0]; x.beginPath(); x.ellipse(px + s * h * 0.22, MESA_Y - 5 - h * 0.6 + s * 1.5, h * 0.24, h * 0.12, s * 0.5, 0, 6.283); x.fill(); }); if (k !== 1) { x.fillStyle = '#7cba48'; x.beginPath(); x.ellipse(px, MESA_Y - 5 - h * 0.85, h * 0.2, h * 0.14, 0, 0, 6.283); x.fill(); } } });
}

const ruta = (pts) => { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], L, d]); L += d; } return { en: (u) => { const s = ((u % 1) + 1) % 1 * L; for (const [a, b, l0, d] of seg) if (s <= l0 + d) { const k = (s - l0) / d; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } return pts[pts.length - 1]; } }; };
const AIRE = [ruta([[70, 430], [IZ, 428], [MID - 60, 420], [MID - 10, 380], [MID, 330], [MID + 20, 260], [MID + 60, 200]]), ruta([[70, 410], [IZ, 408], [DE, 412], [1150, 410]])];
const GOTEO = ruta([[TANQUE.x0, 462], [410, 462]]);
function animar(cx, t, punto) {
  // rayos de sol a través del policarbonato
  cx.fillStyle = '#ffe2a0'; for (let i = 0; i < 70; i++) { const u = ((t * 0.08 + i / 70) % 1); const x0 = IZ + 20 + (i * 37) % (DE - IZ - 40); const y = 120 + u * (MESA_Y - 130); const xx = x0 - (y - 120) * 0.35; cx.globalAlpha = 0.25 * Math.sin(u * Math.PI); punto(cx, xx, y, 1.2); }
  cx.fillStyle = '#ffd9a0'; AIRE.forEach((r, k) => { for (let i = 0; i < 40; i++) { const u = (t * (0.05 + k * 0.012) + i / 40) % 1; const [px, py] = r.en(u); const c = Math.sin(u * Math.PI); cx.globalAlpha = 0.15 + 0.45 * c; punto(cx, px, py, 1.1 + c * 0.6); } });
  cx.fillStyle = '#7fd3ea'; for (let i = 0; i < 46; i++) { const [px, py] = GOTEO.en((t * 0.08 + i / 46) % 1); cx.globalAlpha = 0.8; punto(cx, px, py - 2, 1.1); }
  MESAS.forEach(([a], k) => { const u = (t * 0.7 + k * 0.3) % 1; cx.globalAlpha = 0.9 * (1 - u); punto(cx, a + 10, 462 - u * (462 - MESA_Y + 6), 1.4); });
  const nivel = TANQUE.y1 - 8 - (TANQUE.y1 - TANQUE.y0 - 14) * (0.45 + 0.2 * Math.sin(t * 0.2)); cx.fillStyle = '#4fb0c6';
  for (let xx = TANQUE.x0 + 4; xx < TANQUE.x1 - 3; xx += 3.2) for (let y = nivel; y < TANQUE.y1 - 3; y += 3.2) { cx.globalAlpha = 0.6; punto(cx, xx, y, 0.9); }
  cx.globalAlpha = 1;
}

function pintarAbeja(x) { x.translate(4, 6); x.fillStyle = 'rgba(220,232,240,0.85)'; x.beginPath(); x.ellipse(12, -4, 8, 4, -0.4, 0, 6.283); x.fill(); x.fillStyle = '#1e1c22'; x.beginPath(); x.ellipse(12, 4, 11, 6.5, 0, 0, 6.283); x.fill(); x.fillStyle = '#e8c23a'; x.beginPath(); x.ellipse(6, 3, 4.5, 5, 0, 0, 6.283); x.fill(); }
function pintarMurcielago(x) { x.translate(40, 14); x.fillStyle = '#4a3a30'; x.fill(new Path2D('M0,0 C-8,-10 -22,-14 -38,-8 C-30,-4 -26,2 -28,8 C-20,4 -12,4 -6,8 C-4,4 -2,2 0,2 C2,2 4,4 6,8 C12,4 20,4 28,8 C26,2 30,-4 38,-8 C22,-14 8,-10 0,0Z')); x.fillStyle = '#6a5444'; x.beginPath(); x.ellipse(0, 1, 4, 6, 0, 0, 6.283); x.fill(); x.fill(new Path2D('M-3,-4 L-4,-9 L-1,-5Z M3,-4 L4,-9 L1,-5Z')); }
const ESPECIES = [
  { id: 'tirano', url: 'datos/tramas/16798.png', w: 46, mira: -1, anc: 'centro', sci: 'Tyrannus dominicensis', aleteo: 0.25, mov: (t) => { const salida = Math.max(0, Math.sin(t * 0.5)); return { x: 120 + Math.sin(t * 0.9) * 40 * salida, y: suelo(110) - 150 - salida * 40, dir: Math.cos(t * 0.9) > 0 ? 1 : -1, fase: t * (salida > 0.2 ? 14 : 2) }; } },
  { id: 'tangara', url: 'datos/tramas/10295.png', w: 44, mira: 1, anc: 'centro', sci: 'Thraupis episcopus', aleteo: 0.22, mov: (t) => ({ x: 253 + Math.sin(t * 0.7) * 32, y: suelo(250) - 132 + Math.sin(t * 1.1) * 12, dir: Math.cos(t * 0.7) > 0 ? 1 : -1, fase: t * 12 }) },
  { id: 'murcielago', pintar: pintarMurcielago, cw: 80, ch: 28, w: 70, mira: 1, anc: 'centro', sci: 'Artibeus jamaicensis', aleteo: 0.5, mov: (t) => { const x = 1260 - ((t * 40 + 400) % 1400); return { x, y: 150 + Math.sin(t * 1.3) * 20, dir: -1, fase: t * 10 }; } },
  { id: 'abeja', pintar: pintarAbeja, cw: 30, ch: 20, w: 28, mira: -1, anc: 'centro', sci: 'Xylocopa', aleteo: 0.15, mov: (t) => ({ x: 990 + Math.sin(t * 1.3) * 26, y: suelo(990) - 48 + Math.sin(t * 1.9) * 10, dir: Math.cos(t * 1.3) > 0 ? -1 : 1, fase: t * 40 }) },
  { id: 'monarca', src: 'monarca', w: 42, mira: 1, anc: 'centro', sci: 'Danaus plexippus', mariposa: true, mov: (t) => ({ x: 1010 + Math.sin(t * 0.55) * 60, y: suelo(1000) - 90 + Math.sin(t * 1.3) * 18, dir: Math.cos(t * 0.55) > 0 ? 1 : -1, fase: t * 16 }) },
];
const INAT_OBS = 'iNaturalist (observaciones ciudadanas con interacción)';
const PAPAYA = { x: 253, y: suelo(250) - 108, es: 'Papaya', sci: 'Carica papaya' }; const CALO = { x: 990, y: suelo(990) - 30, es: 'Algodoncillo gigante', sci: 'Calotropis procera' };
const INTERACCIONES = {
  tangara: { a: 'tangara', b: PAPAYA, modo: 'visita', tipo: 'Frugivoría', A: ['Tangara azulgrís', 'Thraupis episcopus'], B: ['Papaya', 'Carica papaya'], texto: 'La tangara azulgrís come papayas maduras del borde de la huerta y dispersa sus semillas.', fuente: 'Bello et al. 2017, frugivoría en la Mata Atlántica' },
  tirano: { a: 'tirano', b: PAPAYA, modo: 'visita', tipo: 'Frugivoría', A: ['Tirano gris', 'Tyrannus dominicensis'], B: ['Papaya', 'Carica papaya'], texto: 'El tirano gris también come frutos de papaya, además de los insectos que caza al vuelo.', fuente: 'Fricke y Svenning 2020, red global planta-frugívoro (Nature)' },
  murcielago: { a: 'murcielago', b: PAPAYA, modo: 'visita', tipo: 'Frugivoría', A: ['Murciélago frutero', 'Artibeus jamaicensis'], B: ['Papaya', 'Carica papaya'], texto: 'De noche, el murciélago frutero visita la papaya y se lleva sus frutos.', fuente: 'Bat Eco-Interactions Database' },
  abeja: { a: 'abeja', b: CALO, modo: 'visita', tipo: 'Visita floral', A: ['Abeja carpintera', 'Xylocopa'], B: ['Algodoncillo gigante', 'Calotropis procera'], texto: 'El algodoncillo sembrado en el borde atrae a la abeja carpintera, que poliniza sus flores.', fuente: `${INAT_OBS}; Ollerton et al. 2019, polinizadores de Apocynaceae` },
  monarca: { a: 'monarca', b: CALO, modo: 'visita', tipo: 'Planta hospedera', A: ['Mariposa monarca', 'Danaus plexippus'], B: ['Algodoncillo gigante', 'Calotropis procera'], texto: 'La monarca pone sus huevos en el algodoncillo del borde: sus orugas comen sus hojas y los adultos visitan sus flores.', fuente: `${INAT_OBS}; Ferrer-Paris et al. 2013; NHM Interactions Bank; HOSTS (NHM Londres)` },
};
const ROTULOS = [[253, suelo(250) - 140, 'Carica papaya', 'middle'], [990, suelo(990) - 46, 'Calotropis procera', 'middle']];
function Overlay() {
  const t = (x, y, s, o = {}) => <text x={x} y={y} fill="#e8eef0" fontSize="11.5" fontFamily="Geist Mono, monospace" letterSpacing="0.6" {...o}>{s}</text>;
  return (
    <>
      {t(MID, 318, 'CUBIERTA DE POLICARBONATO TRANSLÚCIDO', { textAnchor: 'middle', fill: '#f0e2b8', fontSize: '11' })}{t(MID + 70, 260, 'ventilación por la cumbrera ↗', { fill: '#ffd9a0', fontSize: '10.5' })}
      {t(IZ + 8, 404, 'MARCO DE ACERO GALVANIZADO', { fill: '#c8d0d4', fontSize: '10' })}{t(MID, 436, 'MESAS DE CULTIVO · BANDEJAS DE PLÁNTULAS', { textAnchor: 'middle', fontSize: '10.5' })}
      {t(MID, 500, 'TIERRA + COMPOST', { textAnchor: 'middle', fontSize: '10.5', fillOpacity: '0.8' })}{t(880, 402, 'TANQUE DE LLUVIA', { textAnchor: 'middle', fill: '#7fd8ee', fontSize: '10.5' })}{t(640, 478, 'riego por goteo ←', { fill: '#7fd8ee', fontSize: '10' })}
      {t(990, 520, 'CERCA PARA POLINIZADORES', { textAnchor: 'middle', fontSize: '10', fillOpacity: '0.8' })}{t(253, 520, 'FRUTALES', { textAnchor: 'middle', fontSize: '10', fillOpacity: '0.8' })}
    </>
  );
}

export const corteHuerta = {
  id: 'huerta', suelo, cotas: [], pintarFondo, pintarPasto, animar, especies: ESPECIES, pie: {}, interacciones: INTERACCIONES, rotulos: ROTULOS,
  rangos: {}, superficie: 9999, ecotonos: [],
  Overlay, aria: 'Corte de la huerta-vivero de Tierra Bomba dibujado con puntos: invernadero de acero y policarbonato, mesas de cultivo con plántulas, riego por goteo desde un tanque de lluvia, papaya y algodoncillo con su fauna en movimiento',
};
