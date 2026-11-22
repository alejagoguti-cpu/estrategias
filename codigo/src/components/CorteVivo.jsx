import React, { useEffect, useRef, useState } from 'react';

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
  // algodoncillo gigante (Calotropis procera) con flores lila
  { const ax = 935; const ay = suelo(ax); x.strokeStyle = "#7d8f5a"; x.lineWidth = 2; [-8, -3, 3, 8].forEach((d) => { x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(ax + d * 0.6, ay - 14, ax + d, ay - 24); x.stroke(); }); [[-9, -24, 7], [-2, -30, 8], [7, -26, 7], [0, -20, 7], [10, -18, 5], [-10, -16, 5]].forEach(([dx, dy, r2], i) => { x.fillStyle = ["#8fae7a", "#a3be8c", "#7f9f6c"][i % 3]; x.beginPath(); x.ellipse(ax + dx, ay + dy, r2, r2 * 0.6, 0.3, 0, 6.283); x.fill(); }); [[-4, -36], [4, -34], [-11, -30], [10, -31]].forEach(([dx, dy]) => { x.fillStyle = "#d8c4f0"; x.beginPath(); x.arc(ax + dx, ay + dy, 2.6, 0, 6.283); x.fill(); x.fillStyle = "#8a5fb8"; x.beginPath(); x.arc(ax + dx, ay + dy, 1, 0, 6.283); x.fill(); }); }
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
  [760, suelo(742) + 20, 'Coccoloba uvifera', 'start'], [845, suelo(845) - 66, 'Conocarpus erectus', 'middle'], [1010, suelo(1010) - 86, 'Ceiba pentandra', 'middle'], [935, suelo(935) - 46, 'Calotropis procera', 'middle'],
];

const suave = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const PIE = { garza: (x) => Math.min(suelo(x), 506), alba: (x) => suelo(x) + 2, iguana: (x) => suelo(x) - 2, cangrejo: (x) => suelo(x) - 1 };
const INAT_OBS = 'iNaturalist (observaciones ciudadanas con interacción)';
// interacciones registradas en la base de especies de la isla (especies/data/interacciones.json)
const INTERACCIONES = {
  garza: { a: 'garza', b: 'sardina', modo: 'caza', tipo: 'Depredación', A: ['Garza dedos dorados', 'Egretta thula'], B: ['Sardina vivita de hebra', 'Opisthonema oglinum'], texto: 'La garza camina despacio por el agua baja, se queda quieta y lanza el pico sobre las sardinas que se acercan a la orilla.', fuente: INAT_OBS },
  alba: { a: 'alba', b: 'garza', modo: 'compite', tipo: 'Competencia', A: ['Garza blanca', 'Ardea alba'], B: ['Garza dedos dorados', 'Egretta thula'], texto: 'Las dos pescan en los mismos sitios de agua baja. Cuando llega la garza blanca, más grande, la garza dedos dorados se aparta.', fuente: INAT_OBS },
  pelicano: { a: 'pelicano', b: 'garza', modo: 'compite', tipo: 'Competencia', A: ['Pelícano café', 'Pelecanus occidentalis'], B: ['Garza dedos dorados', 'Egretta thula'], texto: 'El pelícano se posa en el agua donde pesca la garza: los dos buscan los mismos cardúmenes de peces pequeños en la orilla.', fuente: INAT_OBS },
  albaVuelo: { a: 'albaVuelo', b: 'iguana', modo: 'caza', tipo: 'Depredación', A: ['Garza blanca', 'Ardea alba'], B: ['Iguana verde', 'Iguana iguana'], texto: 'La garza blanca también caza en tierra: baja en picada sobre las iguanas jóvenes del talud, que huyen hacia el bosque.', fuente: `${INAT_OBS}; Vlad et al. 2022, iguana en Islas Caimán` },
  martin: { a: 'martin', b: 'iguana', modo: 'acompana', tipo: 'Mutualismo y simbiosis', A: ['Martín pescador de collar', 'Megaceryle torquata'], B: ['Iguana verde', 'Iguana iguana'], texto: 'Asociación registrada entre el martín pescador de collar y la iguana verde en los bordes de agua.', fuente: 'Vlad et al. 2022, iguana en Islas Caimán' },
  tortuga: { a: 'tortuga', b: { x: 250, y: suelo(250) - 12, es: 'Hierba de tortuga', sci: 'Thalassia testudinum' }, modo: 'planta', tipo: 'Herbivoría', A: ['Tortuga verde', 'Chelonia mydas'], B: ['Hierba de tortuga', 'Thalassia testudinum'], texto: 'La tortuga verde pasta las praderas de hierba de tortuga del lecho marino; al recortarlas las mantiene densas y productivas.', fuente: 'SeaLifeBase; GoMexSI, dietas del Golfo de México; Roopnarine y Hertog 2013; Mangal' },
  iguana: { a: 'iguana', b: { x: 532, y: suelo(532) - 30, es: 'Mangle colorado', sci: 'Rhizophora mangle' }, modo: 'planta', tipo: 'Herbivoría', A: ['Iguana verde', 'Iguana iguana'], B: ['Mangle colorado', 'Rhizophora mangle'], texto: 'La iguana baja del talud al manglar y come hojas, brotes y flores del mangle colorado.', fuente: 'Vlad et al. 2022, iguana en Islas Caimán; Poelen 2014, asociaciones extraídas de literatura' },
  monarca: { a: 'monarca', b: { x: 935, y: suelo(935) - 30, es: 'Algodoncillo gigante', sci: 'Calotropis procera' }, modo: 'visita', tipo: 'Planta hospedera', A: ['Mariposa monarca', 'Danaus plexippus'], B: ['Algodoncillo gigante', 'Calotropis procera'], texto: 'La monarca pone sus huevos en el algodoncillo gigante: sus orugas comen sus hojas y los adultos visitan sus flores.', fuente: `${INAT_OBS}; Ferrer-Paris et al. 2013; NHM Interactions Bank; HOSTS (NHM Londres)` },
  fragata: { es: 'Fragata tijereta', sci: 'Fregata magnificens' },
  cangrejo: { es: 'Cangrejo azul', sci: 'Cardisoma guanhumi' },
};

export default function CorteVivo() {
  const caja = useRef(null); const lienzo = useRef(null);
  const interRef = useRef(null); const alAbrir = useRef(null); const alCerrar = useRef(null);
  const [ficha, setFicha] = useState(null);
  alAbrir.current = (d) => setFicha(d); alCerrar.current = () => setFicha(null);
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
      // especies: movimiento normal y, si hay una interacción activa, el encuentro entre las dos
      const M = {}; for (const e of especies) M[e.id] = e.mov(t);
      const it = interRef.current; let kI = 0; let posA = null; let posB = null; let uI = 0;
      if (it) {
        uI = t - (it.t0 ?? (it.t0 = t)); const D = 11;
        kI = suave(uI / 1.6) * (1 - suave((uI - (D - 1.6)) / 1.6));
        if (uI > D) { interRef.current = null; alCerrar.current?.(); }
        else {
          const d = it.def; const A = M[d.a]; const pie = (id, x) => PIE[id](x);
          const objetivo = {};
          const bAnimal = typeof d.b === 'string';
          if (it.P == null) it.P = d.modo === 'caza' && d.b === 'sardina' ? clamp(A.x, 150, 285) : bAnimal ? M[d.b === 'sardina' ? 'sardina0' : d.b].x : d.b.x;
          const P = it.P;
          if (d.b === 'sardina') {
            const ataque = uI > 2.2 ? Math.pow(Math.max(0, Math.sin(uI * 2.2)), 10) * 10 : 0;
            objetivo[d.a] = { x: P, y: pie(d.a, P) + ataque, dir: 1 };
            for (let i = 0; i < 7; i++) { const sp = Math.sin(uI * 1.6 + i * 0.9); objetivo[`sardina${i}`] = { x: P + 34 + Math.cos(uI * 1.4 + i) * 16 - ataque * 0.8, y: 497 + (i % 4) * 5 + Math.sin(uI * 2 + i) * 3, dir: sp > 0 ? 1 : -1 }; }
          } else if (d.modo === 'compite') {
            const lado = A.x < P ? 1 : -1; const B0 = M[d.b];
            objetivo[d.a] = d.a === 'pelicano' ? { x: P - lado * 46, y: 466, dir: lado, fase: uI * 0.8 } : { x: P - lado * 10, y: pie(d.a, P - lado * 10), dir: lado };
            const xb = clamp(P + lado * 75 * suave((uI - 1.4) / 2), 112, 440); objetivo[d.b] = { x: xb, y: pie(d.b, xb), dir: lado, paso: B0.paso };
          } else if (d.modo === 'caza') { // garza blanca en vuelo sobre la iguana, que huye talud arriba
            const B0 = M[d.b]; const xb = clamp(B0.x + 55 * suave((uI - 1.5) / 2.5), 860, 1040); objetivo[d.b] = { x: xb, y: pie(d.b, xb), dir: 1, paso: B0.paso };
            const picada = uI > 2.6 && uI < 4.4 ? Math.sin(((uI - 2.6) / 1.8) * Math.PI) : 0;
            objetivo[d.a] = { x: xb - 30, y: suelo(xb) - 70 + picada * 48, dir: 1, fase: uI * (picada > 0 ? 1 : 4) };
          } else if (d.modo === 'acompana') { const B0 = M[d.b]; objetivo[d.a] = { x: B0.x + Math.sin(uI * 1.3) * 14, y: B0.y - 40 + Math.sin(uI * 2) * 4, dir: -1, fase: uI * 9 }; }
          else if (d.modo === 'planta') { objetivo[d.a] = { x: d.b.x + Math.sin(uI * 2.5) * 4, y: d.a === 'tortuga' ? d.b.y : pie(d.a, d.b.x), dir: -1, nado: uI * 2.5, paso: Math.sin(uI * 6) * 0.5 }; }
          else if (d.modo === 'visita') { objetivo[d.a] = { x: d.b.x + Math.sin(uI * 1.8) * 14, y: d.b.y + Math.sin(uI * 2.7) * 9, dir: Math.cos(uI * 1.8) > 0 ? 1 : -1, fase: uI * 16 }; }
          for (const [id, o] of Object.entries(objetivo)) { const m0 = M[id]; M[id] = { ...m0, ...o, x: m0.x + (o.x - m0.x) * kI, y: m0.y + (o.y - m0.y) * kI, dir: kI > 0.35 ? o.dir : m0.dir }; }
          posA = M[d.a]; posB = bAnimal ? M[d.b === 'sardina' ? 'sardina0' : d.b] : d.b;
          it.ids = new Set([d.a, ...Object.keys(objetivo)]);
        }
      }
      // línea punteada, recuadro y ondas de la interacción
      if (posA && posB && kI > 0.05) {
        const ya = posA.y - 18; const yb = posB.y - 6; cx.globalAlpha = kI; cx.strokeStyle = 'rgba(255,107,74,.85)'; cx.lineWidth = 1.3; cx.setLineDash([6, 6]); cx.lineDashOffset = -t * 30;
        cx.beginPath(); cx.moveTo(posA.x, ya); cx.lineTo(posB.x, yb); cx.stroke(); cx.setLineDash([]);
        const mx = (posA.x + posB.x) / 2; const my = Math.min(ya, yb) - 46; const L = 74;
        cx.fillStyle = 'rgba(4,6,7,.78)'; cx.fillRect(mx - L / 2, my - L / 4, L, L / 2); cx.fillStyle = 'rgba(255,107,74,.16)'; cx.fillRect(mx - L / 2, my - L / 4, L, L / 2);
        cx.strokeStyle = '#ff6b4a'; cx.strokeRect(mx - L / 2, my - L / 4, L, L / 2);
        cx.font = '600 10px "Geist Mono", monospace'; cx.fillStyle = '#ff8a6a'; cx.textAlign = 'center';
        const pal = interRef.current.def.tipo.toUpperCase().split(' '); const lin = []; let l = ''; pal.forEach((w) => { if ((`${l} ${w}`).trim().length > 12) { lin.push(l.trim()); l = w; } else l += ` ${w}`; }); lin.push(l.trim());
        lin.slice(0, 3).forEach((s, i) => cx.fillText(s, mx, my - (lin.length - 1) * 6 + i * 12 + 3));
        cx.strokeStyle = '#d8f4fb';
        for (const q of [posA, posB]) { if (q.y < 392 || q.x > corteX(q.y)) continue; for (let r = 0; r < 3; r++) { const rr = ((uI * 14 + r * 11) % 33); cx.globalAlpha = kI * (1 - rr / 33) * 0.8; cx.beginPath(); cx.ellipse(q.x, Math.min(q.y, 478) - 2, rr, rr * 0.28, 0, 0, 6.283); cx.stroke(); } }
        cx.globalAlpha = 1;
      }
      cx.font = 'italic 12.5px Geist, sans-serif'; cx.textAlign = 'center';
      for (const e of especies) {
        if (!e.pts) continue; const m = M[e.id]; const sx = e.sinVoltear ? 1 : m.dir * e.mira;
        const atenuado = it && it.ids && kI > 0 && !it.ids.has(e.id) ? 1 - 0.7 * kI : 1;
        e.caja = e.anc === 'pie' ? [m.x - e.w / 2, m.y - e.alto, m.x + e.w / 2, m.y] : [m.x - e.w / 2, m.y - e.alto / 2, m.x + e.w / 2, m.y + e.alto / 2];
        let ang = 0; if (e.inclina) { ang = Math.atan2(suelo(m.x + 4) - suelo(m.x - 4), 8); }
        const ca = Math.cos(ang); const sa = Math.sin(ang); const media = e.w / 2;
        for (const p of e.pts) {
          let px = p.x * sx; let py = p.y;
          if (e.aleteo) { const ala = clamp(Math.abs(p.x) / media, 0, 1); py += Math.sin(m.fase) * e.aleteo * e.alto * ala * ala * (p.y < 0 ? 1.4 : 0.6); }
          if (e.mariposa) px *= 0.35 + 0.65 * Math.abs(Math.sin(m.fase));
          if (m.nado != null) py += Math.sin(m.nado + p.x * 0.25) * 0.9;
          if (m.paso != null && py > -e.alto * 0.35) px += m.paso * (p.f > 3.14 ? 1 : -1) * 0.6;
          const rx = px * ca - py * sa; const ry = px * sa + py * ca;
          cx.globalAlpha = 0.95 * atenuado; cx.fillStyle = p.c; punto(cx, m.x + rx, m.y + ry, 1.0 * p.r);
        }
        if (e.sci) { const abajo = e.rotuloAbajo; cx.globalAlpha = 0.72 * atenuado; cx.fillStyle = '#d6ebef'; cx.fillText(e.sci, m.x, abajo ? m.y + e.alto / 2 + 14 : m.y + (e.anc === 'pie' ? -e.alto - 7 : -e.alto / 2 - 7)); }
      }
      cx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(dibujar);

    // doble clic (o doble toque) sobre un animal → su interacción
    const aLogico = (ev) => { const r = cv.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * VB.w, VB.y + ((ev.clientY - r.top) / r.height) * VB.h]; };
    const tocado = (ev) => { const [x, y] = aLogico(ev); let mejor = null; let dm = 1e9; for (const e of especies) { if (!e.caja) continue; const [x0, y0, x1, y1] = e.caja; if (x < x0 - 10 || x > x1 + 10 || y < y0 - 10 || y > y1 + 10) continue; const d = Math.hypot(x - (x0 + x1) / 2, y - (y0 + y1) / 2); if (d < dm) { dm = d; mejor = e; } } return mejor; };
    const abrir = (ev) => {
      const e = tocado(ev); if (!e) return; ev.preventDefault?.();
      const clave = e.id.startsWith('sardina') ? 'garza' : e.id.startsWith('fragata') ? 'fragata' : e.id;
      const def = INTERACCIONES[clave];
      if (!def || !def.tipo) { interRef.current = null; alAbrir.current?.({ sinRegistro: true, es: def?.es ?? e.sci, sci: def?.sci ?? e.sci }); return; }
      interRef.current = { def, t0: null, P: null }; alAbrir.current?.(def);
    };
    let ultimoToque = 0; let ultimoXY = [0, 0];
    const toque = (ev) => { if (ev.pointerType === 'mouse') return; const ahora = performance.now(); if (ahora - ultimoToque < 330 && Math.hypot(ev.clientX - ultimoXY[0], ev.clientY - ultimoXY[1]) < 30) { abrir(ev); ultimoToque = 0; } else { ultimoToque = ahora; ultimoXY = [ev.clientX, ev.clientY]; } };
    const sobre = (ev) => { cv.style.cursor = tocado(ev) ? 'pointer' : 'default'; };
    cv.addEventListener('dblclick', abrir); cv.addEventListener('pointerup', toque); cv.addEventListener('pointermove', sobre);
    return () => { vivo = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.removeEventListener('dblclick', abrir); cv.removeEventListener('pointerup', toque); cv.removeEventListener('pointermove', sobre); };
  }, []);

  return (
    <div ref={caja} className="relative w-full" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
      <p className="pointer-events-none absolute right-1 top-1 z-10 font-mono text-[10px] uppercase tracking-wider text-white/55">Doble clic sobre un animal: su interacción</p>
      {ficha && (
        <div className="entra absolute left-[23%] top-[1%] z-20 w-[min(21rem,38%)] border border-[#ff6b4a]/50 bg-[#040607]/88 p-2.5 backdrop-blur" role="dialog" aria-live="polite">
          <button type="button" onClick={() => { interRef.current = null; setFicha(null); }} className="absolute right-2 top-1.5 text-[13px] text-white/60 hover:text-white" aria-label="Cerrar">✕</button>
          {ficha.sinRegistro ? (
            <><p className="etiqueta text-arcilla">Sin interacciones registradas</p><p className="mt-2 text-[13px] text-white/85">{ficha.es} <i className="text-white/55">({ficha.sci})</i></p><p className="mt-1.5 text-[11px] leading-snug text-white/55">La base de especies de la isla no registra todavía relaciones de esta especie con las demás del corte.</p></>
          ) : (
            <><p className="etiqueta text-arcilla">{ficha.tipo}</p>
              <p className="mt-1.5 text-[13.5px] leading-tight text-white">{ficha.A[0]}<span className="mx-1.5 text-arcilla">↔</span>{ficha.B[0]}</p>
              <p className="mt-0.5 text-[11px] italic text-white/55">{ficha.A[1]} · {ficha.B[1]}</p>
              <p className="mt-1.5 text-[11.5px] leading-snug text-white/80">{ficha.texto}</p>
              <p className="mt-2 text-[10px] leading-snug text-white/40">Interacción: {ficha.fuente}</p></>
          )}
        </div>
      )}
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
