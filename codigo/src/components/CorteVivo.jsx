import React, { useEffect, useRef } from 'react';

// Corte del paisaje adaptativo dibujado con puntos (la estética del manglar de «Tramas»):
// terreno, agua por cotas, vegetación y especies se muestrean en puntos de color sobre fondo oscuro.
// El agua ondula, el pasto se mece y los animales se mueven: aves que vuelan y aletean, garzas que
// caminan y picotean, sardinas y tortuga que nadan, cangrejo, iguana y mariposa monarca.
const BASE = import.meta.env.BASE_URL;
const REC = `${BASE}datos/tramas/m/`;
export const VB = { x: 0, y: 30, w: 1200, h: 530 };
export const suelo = (x) => { const t = Math.max(0, Math.min(1, (x - 150) / 1000)); return 520 - 215 * Math.pow(t, 1.3); };
export const corteX = (y) => { const s = (520 - y) / 215; return 150 + 1000 * Math.pow(Math.max(0, s), 1 / 1.3); };
export const COTAS = [
  { y: 392, m: '+2,40 m', nombre: 'inundación 100 años', col: [125, 215, 240], dens: 0.42 },
  { y: 425, m: '+1,80 m', nombre: 'inundación 50 años', col: [88, 192, 232], dens: 0.6 },
  { y: 462, m: '+0,40 m', nombre: 'pleamar', col: [56, 162, 218], dens: 0.8 },
  { y: 478, m: '−0,15 m', nombre: 'bajamar', col: [40, 128, 196], dens: 0.95 },
];
export const E1 = 470; export const E2 = 785;

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const vaiven = (t, a, b, v, f = 0) => { const L = b - a; const u = ((t * v + f) % (2 * L) + 2 * L) % (2 * L); return u < L ? { x: a + u, dir: 1 } : { x: b - (u - L), dir: -1 }; };
const cargar = (src) => new Promise((ok, mal) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = mal; i.src = src; });

// muestrea en puntos lo que dibuja `pintar` en un lienzo de w×h unidades lógicas
function muestrear(w, h, paso, pintar, { realce = true, saltar = () => 0 } = {}) {
  const k = 2; const c = document.createElement('canvas'); c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
  const x = c.getContext('2d', { willReadFrequently: true }); x.scale(k, k); pintar(x);
  const d = x.getImageData(0, 0, c.width, c.height).data; const pts = [];
  for (let j = 0; j < h; j += paso) for (let i = 0; i < w; i += paso) {
    const px = i + (Math.random() - 0.5) * paso * 0.9; const py = j + (Math.random() - 0.5) * paso * 0.9;
    const qx = Math.round(clamp(px, 0, w - 0.5) * k); const qy = Math.round(clamp(py, 0, h - 0.5) * k); const o = (qy * c.width + qx) * 4;
    if (d[o + 3] < 110) continue; if (Math.random() < saltar(px, py)) continue;
    let r = d[o]; let g = d[o + 1]; let b = d[o + 2];
    if (realce) { const l = (r + g + b) / 765; if (l < 0.28) { const m = (0.28 - l) * 1.9; r += (96 - r) * m; g += (112 - g) * m; b += (128 - b) * m; } r = Math.min(255, r * 1.08 + 8); g = Math.min(255, g * 1.08 + 8); b = Math.min(255, b * 1.08 + 8); }
    const v = 0.88 + Math.random() * 0.24;
    pts.push({ x: px, y: py, c: `rgb(${Math.min(255, r * v) | 0},${Math.min(255, g * v) | 0},${Math.min(255, b * v) | 0})`, r: 0.75 + Math.random() * 0.5, f: Math.random() * 6.283 });
  }
  return pts;
}

// ---------- dibujos de referencia (en color) que luego se vuelven puntos ----------
function pintarFondo(x) {
  const perfil = new Path2D(); perfil.moveTo(60, suelo(60)); for (let i = 70; i <= 1150; i += 10) perfil.lineTo(i, suelo(i));
  // terreno en corte: estratos de suelo calcáreo
  const tierra = new Path2D(perfil); tierra.lineTo(1150, 560); tierra.lineTo(60, 560); tierra.closePath();
  const gr = x.createLinearGradient(0, 300, 0, 560); gr.addColorStop(0, '#9a7a4e'); gr.addColorStop(0.45, '#6e5233'); gr.addColorStop(1, '#3a2a1a');
  x.fillStyle = gr; x.fill(tierra);
  x.save(); x.clip(tierra); x.strokeStyle = '#c2a273'; x.lineWidth = 2.2;
  for (let k = 1; k < 5; k++) { x.beginPath(); for (let i = 60; i <= 1150; i += 10) { const y = suelo(i) + k * 14 + Math.sin(i / 70 + k) * 3; if (i === 60) x.moveTo(i, y); else x.lineTo(i, y); } x.stroke(); }
  x.restore();
  // vegetación de fondo: ceibas, bosque seco y palmas
  const copa = (cx, cy, r, cols) => { [[0, -1.55, 0.8], [-0.6, -1.25, 0.62], [0.62, -1.28, 0.66], [-0.25, -2.0, 0.6], [0.35, -1.95, 0.58], [0, -1.2, 0.6]].forEach(([dx, dy, kk], i) => { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(cx + dx * r, cy + dy * r, kk * r, 0, 6.283); x.fill(); }); x.fillStyle = '#5b4330'; x.fillRect(cx - 3, cy - r * 1.2, 6, r * 1.2); };
  const verdes = ['#2f5d2a', '#3f6f2c', '#557f34', '#2b4f27', '#6c8f3a', '#46702e'];
  copa(900, suelo(900), 78, verdes); copa(1060, suelo(1060), 92, verdes.slice().reverse()); copa(1140, suelo(1140), 60, verdes); copa(820, suelo(820), 46, verdes);
  const palma = (px, h, inc) => { const py = suelo(px); const tx = px + inc; const ty = py - h; x.strokeStyle = '#7a6448'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + inc * 0.2, py - h * 0.55, tx, ty); x.stroke();
    [-160, -125, -95, -60, -25, 10, 40].forEach((a, i) => { const r = 48 + (i % 3) * 8; const ar = (a * Math.PI) / 180; x.strokeStyle = verdes[i % 6]; x.lineWidth = 7; x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + Math.cos(ar) * r * 0.5, ty + Math.sin(ar) * r * 0.5 - 14, tx + Math.cos(ar) * r, ty + Math.sin(ar) * r * 0.55 + 16); x.stroke(); }); };
  palma(575, 205, -12); palma(640, 240, 14); palma(700, 175, 6);
  // mangle rojo con raíces zancudas
  const mangle = (mx, s) => { const my = suelo(mx); x.save(); x.translate(mx, my); x.scale(s, s); x.strokeStyle = '#7b4a32'; x.lineWidth = 2; ['M0,-18 Q-10,-10 -16,0', 'M0,-18 Q-4,-8 -6,0', 'M0,-18 Q5,-8 6,0', 'M0,-18 Q12,-10 17,0', 'M0,-18 L0,-28'].forEach((p) => x.stroke(new Path2D(p))); [[0, -36, 17, 11, '#2f6b33'], [-9, -43, 9, 7, '#3f7d3a'], [9, -44, 10, 7, '#4f8a3c']].forEach(([a, b, rx, ry, c]) => { x.fillStyle = c; x.beginPath(); x.ellipse(a, b, rx, ry, 0, 0, 6.283); x.fill(); }); x.restore(); };
  mangle(530, 1.15); mangle(610, 0.9);
  // conocarpus y ceiba en la meseta, uvero en el talud
  const arbol = (ax, s, cols) => { const ay = suelo(ax) - 5; x.save(); x.translate(ax, ay); x.scale(s, s); x.fillStyle = '#6a4a30'; x.fill(new Path2D('M-1.5,0 L-1,-16 L-5,-22 L-0.5,-19 L0,-26 L1.5,-19 L6,-23 L1.5,-15 L1.8,0Z')); [[0, -34, 11], [-10, -27, 8], [10, -28, 8.5], [-4, -43, 8], [6, -41, 8]].forEach(([a, b, r], i) => { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(a, b, r, 0, 6.283); x.fill(); }); x.restore(); };
  arbol(845, 1.05, ['#3c6e2e', '#4f8236', '#2f5a28']); arbol(1010, 1.55, ['#2f5d2a', '#557f34', '#3f6f2c']);
  [0, 1, 2].forEach((i) => { x.fillStyle = ['#4d7a2f', '#5f8c36', '#3f6a29'][i]; x.beginPath(); x.arc(728 + i * 9, suelo(728 + i * 9) - 8 - (i % 2) * 3, 7 + (i % 2) * 2, 0, 6.283); x.fill(); });
  // enrocado permeable
  for (let i = 0; i < 16; i++) { const rx = 700 + i * 5.2; const ry = suelo(rx) - 3 - (i % 3) * 3; const s = 4 + (i % 4); x.fillStyle = ['#c9c4b8', '#b3ada0', '#ddd8cc'][i % 3]; x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx + s, ry - 2); x.lineTo(rx + s + 2, ry + s - 2); x.lineTo(rx + 1, ry + s); x.lineTo(rx - 2, ry + 3); x.fill(); }
  // pasarela de madera sobre pilotes
  x.strokeStyle = '#b98a55'; x.lineWidth = 2.4; for (let i = 0; i < 10; i++) { const px = 500 + i * 30; x.beginPath(); x.moveTo(px, 410); x.lineTo(px, suelo(px)); x.stroke(); }
  x.fillStyle = '#d9a86a'; x.fillRect(494, 407, 284, 5); x.strokeStyle = '#c9ced2'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(494, 396); x.lineTo(778, 396); x.stroke();
  for (let i = 0; i < 15; i++) { x.beginPath(); x.moveTo(496 + i * 20, 396); x.lineTo(496 + i * 20, 407); x.stroke(); }
  // ecotonos (barras)
  [E1, E2].forEach((ex) => { const y0 = suelo(ex) - 150; const y1 = suelo(ex) + 44; x.fillStyle = '#e8eef0'; x.fillRect(ex - 6, y0, 12, y1 - y0); });
  // línea del terreno
  x.strokeStyle = '#f4f1ea'; x.lineWidth = 3.4; x.stroke(perfil);
}
function pintarPasto(x) {
  // pradera sobre el talud y la meseta
  x.fillStyle = '#a8c83a'; x.beginPath(); x.moveTo(690, suelo(690) - 4); for (let i = 700; i <= 1150; i += 10) x.lineTo(i, suelo(i) - (i < E2 ? 4 : 9)); for (let i = 1150; i >= 690; i -= 10) x.lineTo(i, suelo(i) + 1); x.fill();
  const junco = (jx, jy, n, h, w, cols, ancho = 2) => { for (let i = 0; i < n; i++) { const dx = (i / (n - 1) - 0.5) * w; const ho = h * (0.6 + 0.4 * Math.sin(i * 2.3 + jx) ** 2); const cur = (i / (n - 1) - 0.5) * 12; x.strokeStyle = cols[i % cols.length]; x.lineWidth = ancho; x.lineCap = 'round'; x.beginPath(); x.moveTo(jx + dx, jy); x.quadraticCurveTo(jx + dx + cur * 0.3, jy - ho * 0.6, jx + dx + cur, jy - ho); x.stroke(); } };
  for (let i = 0; i < 30; i++) { const jx = 795 + i * 12; junco(jx, suelo(jx) - 7, 4, 10 + (i % 3) * 3, 7, ['#c9e05a', '#9cbc22', '#b5d334']); }
  // praderas de Thalassia bajo el agua y juncos de la marisma
  [150, 200, 250, 300].forEach((jx, i) => junco(jx, suelo(jx), 8, 20 + i * 2, 16, ['#2f9a7a', '#3fae86', '#227a64']));
  [[420, 34, 18], [448, 26, 12], [570, 16, 10], [665, 14, 10], [500, 18, 10], [630, 15, 10]].forEach(([jx, h, w]) => junco(jx, suelo(jx), 8, h, w, ['#5c9a3a', '#7fb544', '#4a8a30']));
}
function pintarTortuga(x) { x.translate(6, 18); x.fillStyle = '#7d8a45'; x.fill(new Path2D('M0,0 C7,-10 27,-10 35,0 C27,8 7,8 0,0Z')); x.fillStyle = '#a3ad62'; x.beginPath(); x.ellipse(17, -2, 9, 4, 0, 0, 6.283); x.fill(); x.fillStyle = '#9aa06a'; x.beginPath(); x.arc(39, -1, 4, 0, 6.283); x.fill(); ['M23,-5 L37,-15 L33,-12 L26,-3Z', 'M24,4 L35,12 L22,6Z', 'M5,-3 L-4,-9 L2,-2Z', 'M5,4 L-3,9 L7,5Z'].forEach((p) => x.fill(new Path2D(p))); }
function pintarCangrejo(x) { x.translate(18, 14); x.fillStyle = '#4c7fe0'; x.strokeStyle = '#6f9cf0'; x.lineWidth = 1.6; x.lineCap = 'round'; x.beginPath(); x.ellipse(0, 0, 8, 5, 0, 0, 6.283); x.fill(); [-1, 1].forEach((l) => [0, 1, 2].forEach((i) => { x.beginPath(); x.moveTo(l * 6, 1 + i); x.lineTo(l * (12 + i * 2), 4 + i * 2); x.lineTo(l * (14 + i * 2), 9 + i); x.stroke(); })); x.fillStyle = '#e0e6f0'; x.beginPath(); x.arc(-11, -6, 3.4, 0, 6.283); x.arc(11, -6, 3.4, 0, 6.283); x.fill(); }
function pintarIguana(x) { x.translate(52, 12); x.fillStyle = '#5f9b3a'; x.fill(new Path2D('M0,0 C6,-6 18,-7 27,-4 L36,-5 C39,-4 39,-1 36,0 L27,1 C18,4 8,4 0,2 C-14,2 -32,4 -50,9 C-32,1 -14,-1 0,0Z')); x.strokeStyle = '#8fc05a'; x.lineWidth = 1.2; x.stroke(new Path2D('M6,-5 l2,-4 l2,4 M12,-6 l2,-4 l2,4 M18,-6 l2,-3 l2,3')); x.strokeStyle = '#4f8530'; x.lineWidth = 2.2; x.lineCap = 'round'; x.stroke(new Path2D('M22,2 L25,8 L28,9 M6,3 L3,9 L0,10 M20,-3 L23,3 M2,1 L-2,7')); }

// ---------- especies y su movimiento ----------
// mira: hacia dónde mira la foto (1 derecha, -1 izquierda). anc: 'pie' apoya en el punto, 'centro' vuela.
const ESPECIES = [
  { id: 'fragata1', src: 'fragata', w: 124, mira: -1, anc: 'centro', sci: 'Fregata magnificens', aleteo: 0.1, mov: (t) => { const x = 1280 - ((t * 26) % 1480); return { x, y: 160 + Math.sin(t * 0.5) * 14, dir: -1, fase: t * 1.6 }; } },
  { id: 'fragata2', src: 'fragata', w: 64, mira: -1, anc: 'centro', aleteo: 0.1, mov: (t) => { const x = 1280 - ((t * 31 + 520) % 1480); return { x, y: 112 + Math.sin(t * 0.7 + 1) * 10, dir: -1, fase: t * 1.9 }; } },
  { id: 'pelicano', src: 'pelicano', w: 128, mira: -1, anc: 'centro', sci: 'Pelecanus occidentalis', aleteo: 0.16, mov: (t) => { const x = -140 + ((t * 30 + 360) % 1500); return { x, y: 282 + Math.sin(t * 0.8) * 8, dir: 1, fase: t * 2.4 }; } },
  { id: 'albaVuelo', src: 'alba_vuelo', w: 98, mira: -1, anc: 'centro', sci: 'Ardea alba', aleteo: 0.3, mov: (t) => { const x = 1300 - ((t * 38 + 900) % 1500); return { x, y: 330 - Math.sin(t * 0.6) * 22, dir: -1, fase: t * 4.2 }; } },
  { id: 'martin', src: 'martin_vuelo', w: 72, mira: -1, anc: 'centro', sci: 'Megaceryle torquata', aleteo: 0.35, mov: (t) => { const v = vaiven(t, 380, 760, 70); return { x: v.x, y: 338 + Math.abs(Math.sin(t * 1.1)) * -26 + Math.sin(t * 7) * 2, dir: v.dir, fase: t * 9 }; } },
  { id: 'garza', src: 'garza', w: 86, mira: 1, anc: 'pie', sci: 'Egretta thula', mov: (t) => { const v = vaiven(t, 120, 300, 7); const picoteo = Math.pow(Math.max(0, Math.sin(t * 0.9)), 14) * 7; return { x: v.x, y: Math.min(suelo(v.x), 506) + picoteo, dir: v.dir, paso: Math.sin(t * 3) * 1.2 }; } },
  { id: 'alba', src: 'alba', w: 22, mira: 1, anc: 'pie', sci: 'Ardea alba', mov: (t) => { const v = vaiven(t, 360, 432, 4, 20); return { x: v.x, y: suelo(v.x) + 2, dir: v.dir, paso: Math.sin(t * 2.6) * 0.8 }; } },
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ id: `sardina${i}`, src: 'sardina', w: 26 + (i % 3) * 7, mira: 1, anc: 'centro', sci: i === 0 ? 'Opisthonema oglinum' : null, rotuloAbajo: true, mov: (t) => { const v = vaiven(t, 100, 330 - (i % 3) * 20, 24 + i * 3, i * 47); return { x: v.x, y: 494 + (i % 4) * 6 + Math.sin(t * 2 + i) * 3, dir: v.dir, nado: t * 8 + i }; } })),
  { id: 'tortuga', pintar: pintarTortuga, cw: 48, ch: 34, w: 46, mira: 1, anc: 'centro', sci: 'Chelonia mydas', rotuloAbajo: true, mov: (t) => { const v = vaiven(t, 120, 300, 9, 140); return { x: v.x, y: 502 + Math.sin(t * 0.9) * 4, dir: v.dir, nado: t * 2.5 }; } },
  { id: 'cangrejo', pintar: pintarCangrejo, cw: 36, ch: 26, w: 32, mira: 1, anc: 'pie', sci: 'Cardisoma guanhumi', sinVoltear: true, mov: (t) => { const v = vaiven(t, 418, 468, 16); const pausa = Math.sin(t * 0.7) > 0.4; const x = pausa ? 443 + Math.sin(t * 0.7) * 25 : v.x; return { x, y: suelo(x) - 1, dir: 1, paso: Math.sin(t * 22) * 0.8 }; } },
  { id: 'iguana', pintar: pintarIguana, cw: 92, ch: 26, w: 76, mira: 1, anc: 'pie', sci: 'Iguana iguana', inclina: true, mov: (t) => { const v = vaiven(t, 860, 990, 6, 30); return { x: v.x, y: suelo(v.x) - 2, dir: v.dir, paso: Math.sin(t * 5) * 0.6 }; } },
  { id: 'monarca', src: 'monarca', w: 28, mira: 1, anc: 'centro', sci: 'Danaus plexippus', mariposa: true, mov: (t) => ({ x: 965 + Math.sin(t * 0.55) * 70 + Math.sin(t * 1.7) * 12, y: 278 + Math.sin(t * 1.3) * 22 + Math.sin(t * 4.1) * 5, dir: Math.cos(t * 0.55) > 0 ? 1 : -1, fase: t * 16 }) },
];
// rótulos fijos (vegetación)
export const ROTULOS_FIJOS = [
  [238, suelo(250) - 30, 'Thalassia testudinum', 'middle'], [530, suelo(530) - 56, 'Rhizophora mangle', 'middle'], [655, suelo(665) + 16, 'Sesuvium portulacastrum', 'middle'],
  [760, suelo(742) + 20, 'Coccoloba uvifera', 'start'], [845, suelo(845) - 66, 'Conocarpus erectus', 'middle'], [1010, suelo(1010) - 86, 'Ceiba pentandra', 'middle'],
];

export default function CorteVivo() {
  const caja = useRef(null); const lienzo = useRef(null);
  useEffect(() => {
    const el = caja.current; const cv = lienzo.current; if (!el || !cv) return undefined;
    const cx = cv.getContext('2d'); let vivo = true; let raf = 0; let visible = false;
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DPR = Math.min(devicePixelRatio || 1, 2);
    // puntos
    const fondo = muestrear(1200, 560, 3.0, pintarFondo, { saltar: (px, py) => (py > suelo(px) + 4 ? clamp((py - suelo(px)) / 90, 0, 0.82) : 0) });
    const pasto = muestrear(1200, 560, 2.4, pintarPasto).map((p) => ({ ...p, base: suelo(p.x) }));
    const agua = [];
    COTAS.forEach((c, i) => {
      const y0 = c.y; const y1 = COTAS[i + 1]?.y ?? 540;
      for (let y = y0; y < y1; y += 3.1) for (let xx = 90; xx < 1150; xx += 3.1) {
        const px = xx + (Math.random() - 0.5) * 2.6; const py = y + (Math.random() - 0.5) * 2.6;
        if (py >= suelo(px) - 1.5 || Math.random() > c.dens) continue;
        const v = 0.8 + Math.random() * 0.35; agua.push({ x: px, y: py, c: `rgb(${(c.col[0] * v) | 0},${(c.col[1] * v) | 0},${(c.col[2] * v) | 0})`, r: 0.7 + Math.random() * 0.5, f: Math.random() * 6.283, banda: i });
      }
    });
    const espuma = []; COTAS.forEach((c) => { for (let xx = 92; xx < corteX(c.y); xx += 5.5) espuma.push({ x: xx, y: c.y, f: Math.random() * 6.283 }); });
    // especies → puntos
    const especies = ESPECIES.map((e) => ({ ...e, pts: null, alto: 0 }));
    especies.forEach((e) => {
      const listo = (img) => {
        const w = e.w; const h = img ? (w * img.height) / img.width : (w * e.ch) / e.cw; e.alto = h;
        const paso = w < 40 ? 1.5 : w < 80 ? 1.9 : 2.2;
        const pts = muestrear(w, h, paso, (x) => { if (img) x.drawImage(img, 0, 0, w, h); else { x.scale(w / e.cw, w / e.cw); e.pintar(x); } });
        e.pts = pts.map((p) => ({ ...p, x: p.x - w / 2, y: e.anc === 'pie' ? p.y - h : p.y - h / 2 }));
      };
      if (e.src) cargar(`${REC}${e.src}.webp`).then((img) => { if (vivo) listo(img); }).catch(() => {}); else listo(null);
    });

    // capa estática prerenderizada
    const capa = document.createElement('canvas'); const cc = capa.getContext('2d');
    let esc = 1; let W = 0; let H = 0;
    const punto = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); };
    const tam = () => {
      W = Math.round(cv.clientWidth * DPR); H = Math.round(cv.clientHeight * DPR); if (!W || !H) return;
      cv.width = W; cv.height = H; capa.width = W; capa.height = H; esc = W / VB.w;
      cc.setTransform(esc, 0, 0, esc, 0, -VB.y * esc); cc.clearRect(0, VB.y, VB.w, VB.h);
      for (const p of fondo) { cc.fillStyle = p.c; cc.globalAlpha = 0.9; punto(cc, p.x, p.y, 1.15 * p.r); }
      cc.globalAlpha = 1;
    };
    const ro = new ResizeObserver(tam); ro.observe(cv); tam();
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '200px' }); io.observe(el);

    const dibujar = (ms) => {
      if (!vivo) return; raf = requestAnimationFrame(dibujar);
      if (!visible || !W) return;
      const t = quieto ? 4 : ms / 1000;
      cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, W, H); cx.drawImage(capa, 0, 0);
      cx.setTransform(esc, 0, 0, esc, 0, -VB.y * esc);
      // brillo que respira sobre la capa fija
      for (let i = (Math.floor(t * 30) % 7); i < fondo.length; i += 7) { const p = fondo[i]; const a = 0.5 + 0.5 * Math.sin(t * 2.2 + p.f * 3); if (a < 0.75) continue; cx.globalAlpha = (a - 0.75) * 1.6; cx.fillStyle = '#f2f7f2'; punto(cx, p.x, p.y, 0.7); }
      // agua
      for (const p of agua) {
        const prof = clamp((p.y - 392) / 130, 0, 1); const ola = Math.sin(p.x * 0.045 + t * 1.3 + p.banda) * (1.6 - prof) + Math.sin(p.x * 0.11 - t * 2.1) * 0.5;
        cx.globalAlpha = 0.72 + 0.28 * Math.sin(t * 1.7 + p.f * 5); cx.fillStyle = p.c; punto(cx, p.x + Math.sin(t * 0.6 + p.y * 0.1) * 0.8, p.y + ola, 1.05 * p.r);
      }
      cx.fillStyle = '#d8f4fb';
      for (const q of espuma) { cx.globalAlpha = 0.35 + 0.45 * Math.max(0, Math.sin(t * 2 + q.f + q.x * 0.03)); punto(cx, q.x + Math.sin(t + q.f) * 1.5, q.y + Math.sin(q.x * 0.045 + t * 1.3) * 1.6, 0.85); }
      // pasto con viento
      for (const p of pasto) {
        const alto = Math.max(0, p.base - p.y); const sub = p.y > 440 && p.x < 360; const sw = sub ? Math.sin(t * 0.9 + p.x * 0.04) * 0.12 : (Math.sin(t * 1.6 + p.x * 0.05) * 0.09 + Math.sin(t * 3.7 + p.x * 0.2) * 0.03);
        cx.globalAlpha = 0.95; cx.fillStyle = p.c; punto(cx, p.x + alto * sw * (alto / 18), p.y, 1.05 * p.r);
      }
      // especies
      cx.font = 'italic 12.5px Geist, sans-serif'; cx.textAlign = 'center';
      for (const e of especies) {
        if (!e.pts) continue; const m = e.mov(t); const sx = e.sinVoltear ? 1 : m.dir * e.mira;
        let ang = 0; if (e.inclina) { ang = Math.atan2(suelo(m.x + 4) - suelo(m.x - 4), 8); }
        const ca = Math.cos(ang); const sa = Math.sin(ang); const media = e.w / 2;
        for (const p of e.pts) {
          let px = p.x * sx; let py = p.y;
          if (e.aleteo) { const ala = clamp(Math.abs(p.x) / media, 0, 1); py += Math.sin(m.fase) * e.aleteo * e.alto * ala * ala * (p.y < 0 ? 1.4 : 0.6); }
          if (e.mariposa) px *= 0.35 + 0.65 * Math.abs(Math.sin(m.fase));
          if (m.nado != null) py += Math.sin(m.nado + p.x * 0.25) * 0.9;
          if (m.paso != null && py > -e.alto * 0.35) px += m.paso * (p.f > 3.14 ? 1 : -1) * 0.6;
          const rx = px * ca - py * sa; const ry = px * sa + py * ca;
          cx.globalAlpha = 0.95; cx.fillStyle = p.c; punto(cx, m.x + rx, m.y + ry, 1.0 * p.r);
        }
        if (e.sci) { const abajo = e.rotuloAbajo; cx.globalAlpha = 0.72; cx.fillStyle = '#d6ebef'; cx.fillText(e.sci, m.x, abajo ? m.y + e.alto / 2 + 14 : m.y + (e.anc === 'pie' ? -e.alto - 7 : -e.alto / 2 - 7)); }
      }
      cx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(dibujar);
    return () => { vivo = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return (
    <div ref={caja} className="relative w-full" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
      <canvas ref={lienzo} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="pointer-events-none absolute inset-0 h-full w-full" role="img" aria-label="Corte del paisaje adaptativo de Tierra Bomba dibujado con puntos: del lecho marino a la meseta, con cotas de marea e inundación, dos ecotonos, la pasarela elevada y especies en movimiento">
        <defs><marker id="flechaClara" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 L3,5Z" fill="#f4f1ea" /></marker></defs>
        <path d={`M66,${suelo(66)} L60,${suelo(60)}`} stroke="#f4f1ea" strokeWidth="3" markerEnd="url(#flechaClara)" />
        <path d={`M1144,${suelo(1144)} L1150,${suelo(1150)}`} stroke="#f4f1ea" strokeWidth="3" markerEnd="url(#flechaClara)" />
        {COTAS.map((c) => (
          <g key={c.y}>
            <line x1="90" y1={c.y} x2={corteX(c.y)} y2={c.y} stroke="#49c6e5" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 4" />
            <text x={c.y > 470 ? 470 - 0 : 96} y={c.y > 470 ? c.y + 13 : c.y - 4} textAnchor={c.y > 470 ? "end" : "start"} fill="#7fd8ee" fontSize="11.5" fontFamily="Geist Mono, monospace">{c.m} · {c.nombre}</text>
          </g>
        ))}
        {[[E1, ['MARISMA INTERMAREAL', 'PRADERA SALOBRE']], [E2, ['HUMEDAL DULCE', 'PRADERA / BOSQUE SECO']]].map(([x, [a, b]]) => {
          const y0 = suelo(x) - 150; const y1 = suelo(x) + 44;
          return (
            <g key={x}>
              <line x1={x} y1="58" x2={x} y2={y0} stroke="#e8eef0" strokeOpacity="0.7" strokeWidth="1" />
              <text transform={`translate(${x + 4},${y1 - 8}) rotate(-90)`} fill="#040607" fontSize="11" fontWeight="700" letterSpacing="1.5" fontFamily="Geist, sans-serif">ECOTONO</text>
              <text transform={`translate(${x - 4},${y0 - 6}) rotate(-90)`} fill="#e8eef0" fontSize="11.5" fontFamily="Geist Mono, monospace">{a}</text>
              <text transform={`translate(${x + 12},${y0 - 6}) rotate(-90)`} fill="#e8eef0" fillOpacity="0.75" fontSize="11.5" fontFamily="Geist Mono, monospace">{b}</text>
            </g>
          );
        })}
        <text x="600" y="384" textAnchor="middle" fill="#e9c08a" fontSize="12" fontWeight="600" fontFamily="Geist Mono, monospace">PASARELA ELEVADA +2,10 m</text>
        <g fill="#e8eef0" fontFamily="Geist Mono, monospace" fontWeight="500" letterSpacing="0.8">
          <text x="330" y="545" fontSize="13">ZONA INTERMAREAL</text>
          <text x="700" y="448" fontSize="12"><tspan x="700">INUNDACIÓN 50 AÑOS</tspan><tspan x="700" dy="15">+ MAREJADA</tspan></text>
          <text x="985" y="352" fontSize="12"><tspan x="985">INUNDACIÓN 100 AÑOS</tspan><tspan x="985" dy="15">+ MAREJADA</tspan></text>
        </g>
        {ROTULOS_FIJOS.map(([x, y, t, a]) => <text key={t} x={x} y={y} textAnchor={a} fill="#d6ebef" fillOpacity="0.72" fontSize="12.5" fontStyle="italic" fontFamily="Geist, sans-serif">{t}</text>)}
      </svg>
    </div>
  );
}
