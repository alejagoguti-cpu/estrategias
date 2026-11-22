import React from 'react';
import { clamp, vaiven } from '../../components/CorteVivo.jsx';

// Corte del humedal de fitofiltración en la meseta (sección 09): pradera, orilla de juncos, laguna de
// retención sobre lecho de arcilla, puente peatonal y bosque seco. Especies e interacciones de la base
// de la isla (especies/data/interacciones.json).
const sm = (t) => { const u = clamp(t, 0, 1); return u * u * (3 - 2 * u); };
export const suelo = (x) => {
  if (x < 330) return 372 + Math.sin(x / 90) * 3 * clamp((330 - x) / 40, 0, 1);
  if (x < 470) return 372 + 126 * sm((x - 330) / 140);
  if (x < 800) return 498 + 6 * Math.sin(((x - 470) / 330) * Math.PI);
  if (x < 930) return 498 - 118 * sm((x - 800) / 130);
  return 380 - (x - 930) * 0.03;
};
const COTAS = [
  { y: 410, m: '+1,80 m', nombre: 'desborde controlado', col: [120, 210, 196], dens: 0.4 },
  { y: 438, m: '+1,20 m', nombre: 'nivel de lluvias', col: [76, 176, 166], dens: 0.62 },
  { y: 462, m: '+0,70 m', nombre: 'nivel seco (verano)', col: [44, 136, 136], dens: 0.88 },
];
const E1 = 340; const E2 = 910;
const verdes = ['#2f5d2a', '#3f6f2c', '#557f34', '#2b4f27', '#6c8f3a', '#46702e'];

function pintarFondo(x) {
  const perfil = new Path2D(); perfil.moveTo(60, suelo(60)); for (let i = 65; i <= 1150; i += 5) perfil.lineTo(i, suelo(i));
  const tierra = new Path2D(perfil); tierra.lineTo(1150, 560); tierra.lineTo(60, 560); tierra.closePath();
  const gr = x.createLinearGradient(0, 360, 0, 560); gr.addColorStop(0, '#7a6440'); gr.addColorStop(0.4, '#5c4a30'); gr.addColorStop(1, '#2e2418');
  x.fillStyle = gr; x.fill(tierra);
  x.save(); x.clip(tierra); x.strokeStyle = '#a88f62'; x.lineWidth = 2;
  for (let k = 1; k < 5; k++) { x.beginPath(); for (let i = 60; i <= 1150; i += 10) { const y = suelo(i) + 16 + k * 14 + Math.sin(i / 60 + k) * 3; if (i === 60) x.moveTo(i, y); else x.lineTo(i, y); } x.stroke(); }
  // lecho de arcilla compactada bajo la laguna
  x.strokeStyle = '#8a9ba6'; x.lineWidth = 9; x.beginPath(); for (let i = 350; i <= 905; i += 5) { const y = suelo(i) + 6; if (i === 350) x.moveTo(i, y); else x.lineTo(i, y); } x.stroke();
  x.restore();
  const copa = (cx, cy, r, cols) => { [[0, -1.55, 0.8], [-0.6, -1.25, 0.62], [0.62, -1.28, 0.66], [-0.25, -2.0, 0.6], [0.35, -1.95, 0.58], [0, -1.2, 0.6]].forEach(([dx, dy, kk], i) => { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(cx + dx * r, cy + dy * r, kk * r, 0, 6.283); x.fill(); }); x.fillStyle = '#5b4330'; x.fillRect(cx - 3, cy - r * 1.2, 6, r * 1.2); };
  copa(110, suelo(110), 62, verdes); copa(215, suelo(215), 44, verdes.slice().reverse()); copa(985, suelo(985), 66, verdes); copa(1110, suelo(1110), 88, verdes.slice().reverse());
  // bigotillo (Caesalpinia pulcherrima)
  { const bx = 265; const by = suelo(bx); x.strokeStyle = '#6a5a3a'; x.lineWidth = 2; [-10, -4, 3, 9].forEach((d) => { x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + d * 0.5, by - 16, bx + d, by - 28); x.stroke(); });
    [[-11, -28, 8], [-3, -34, 9], [7, -30, 8], [0, -22, 8], [11, -22, 6], [-12, -18, 6]].forEach(([dx, dy, r], i) => { x.fillStyle = ['#4f7f34', '#5e9040', '#43702c'][i % 3]; x.beginPath(); x.ellipse(bx + dx, by + dy, r, r * 0.65, 0.2, 0, 6.283); x.fill(); });
    [[-8, -38], [2, -42], [10, -36], [-14, -32], [14, -29], [-2, -36]].forEach(([dx, dy], i) => { x.fillStyle = ['#e8481f', '#f39a1c', '#f6c51e'][i % 3]; x.beginPath(); x.arc(bx + dx, by + dy, 3, 0, 6.283); x.fill(); }); }
  // algodoncillo gigante (Calotropis procera)
  { const ax = 1040; const ay = suelo(ax); x.strokeStyle = '#7d8f5a'; x.lineWidth = 2; [-8, -3, 3, 8].forEach((d) => { x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(ax + d * 0.6, ay - 14, ax + d, ay - 24); x.stroke(); });
    [[-9, -24, 7], [-2, -30, 8], [7, -26, 7], [0, -20, 7], [10, -18, 5], [-10, -16, 5]].forEach(([dx, dy, r2], i) => { x.fillStyle = ['#8fae7a', '#a3be8c', '#7f9f6c'][i % 3]; x.beginPath(); x.ellipse(ax + dx, ay + dy, r2, r2 * 0.6, 0.3, 0, 6.283); x.fill(); });
    [[-4, -36], [4, -34], [-11, -30], [10, -31]].forEach(([dx, dy]) => { x.fillStyle = '#d8c4f0'; x.beginPath(); x.arc(ax + dx, ay + dy, 2.6, 0, 6.283); x.fill(); }); }
  // faroles
  [190, 960].forEach((fx) => { const fy = suelo(fx); x.strokeStyle = '#4a5156'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx, fy - 62); x.stroke(); x.fillStyle = '#6b7378'; x.fillRect(fx - 5, fy - 68, 10, 6); x.fillStyle = '#f4e7b0'; x.fillRect(fx - 3, fy - 62, 6, 2); });
  // banco solar ondulante
  { const bx = 150; const by = suelo(bx) - 1; x.strokeStyle = '#f1f2ef'; x.lineWidth = 1.6; for (let i = 0; i < 18; i++) { const u = i / 17; const h = 6 + 10 * Math.exp(-(((u - 0.4) / 0.14) ** 2)) + 3 * Math.exp(-(((u - 0.97) / 0.05) ** 2)); x.beginPath(); x.moveTo(bx - 20 + u * 40, by); x.lineTo(bx - 20 + u * 40, by - h); x.stroke(); }
    x.lineWidth = 1.4; [-19, -13, -7].forEach((dx) => { x.beginPath(); x.moveTo(bx + dx, by); x.lineTo(bx + dx, by - 34); x.stroke(); }); x.fillStyle = '#f1f2ef'; x.fillRect(bx - 22, by - 37, 26, 3); x.fillStyle = '#2b4fb0'; x.fillRect(bx - 21, by - 40, 24, 3); }
  // sendero rojo sobre la pradera
  x.strokeStyle = '#c0573e'; x.lineWidth = 4; x.lineCap = 'round';
  [[60, 330], [915, 1150]].forEach(([a, b]) => { x.beginPath(); for (let i = a; i <= b; i += 5) { const y = suelo(i) - 1.5; if (i === a) x.moveTo(i, y); else x.lineTo(i, y); } x.stroke(); });
  // puente peatonal de madera en arco
  const puente = (px) => 404 - 16 * Math.sin((Math.PI * (px - 500)) / 280);
  x.strokeStyle = '#8c6a44'; x.lineWidth = 2.2; for (let px = 514; px < 780; px += 28) { x.beginPath(); x.moveTo(px, puente(px)); x.lineTo(px, suelo(px)); x.stroke(); }
  x.strokeStyle = '#d9a86a'; x.lineWidth = 5; x.beginPath(); for (let px = 500; px <= 780; px += 4) { if (px === 500) x.moveTo(px, puente(px)); else x.lineTo(px, puente(px)); } x.stroke();
  x.strokeStyle = '#c9ced2'; x.lineWidth = 1.3; x.beginPath(); for (let px = 504; px <= 776; px += 4) { if (px === 504) x.moveTo(px, puente(px) - 12); else x.lineTo(px, puente(px) - 12); } x.stroke();
  for (let px = 506; px <= 776; px += 18) { x.beginPath(); x.moveTo(px, puente(px) - 12); x.lineTo(px, puente(px)); x.stroke(); }
  [E1, E2].forEach((ex) => { const y0 = suelo(ex) - 150; const y1 = suelo(ex) + 44; x.fillStyle = '#e8eef0'; x.fillRect(ex - 6, y0, 12, y1 - y0); });
  x.strokeStyle = '#f4f1ea'; x.lineWidth = 3.4; x.stroke(perfil);
}
function pintarPasto(x) {
  x.fillStyle = '#8fb33a';
  [[60, 336], [904, 1150]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, suelo(a) - 5); for (let i = a; i <= b; i += 5) x.lineTo(i, suelo(i) - 6); for (let i = b; i >= a; i -= 5) x.lineTo(i, suelo(i) + 1); x.fill(); });
  const junco = (jx, jy, n, h, w, cols, ancho = 2) => { for (let i = 0; i < n; i++) { const dx = (i / (n - 1) - 0.5) * w; const ho = h * (0.6 + 0.4 * Math.sin(i * 2.3 + jx) ** 2); const cur = (i / (n - 1) - 0.5) * 12; x.strokeStyle = cols[i % cols.length]; x.lineWidth = ancho; x.lineCap = 'round'; x.beginPath(); x.moveTo(jx + dx, jy); x.quadraticCurveTo(jx + dx + cur * 0.3, jy - ho * 0.6, jx + dx + cur, jy - ho); x.stroke(); } };
  for (let i = 0; i < 22; i++) { const jx = 70 + i * 12; if (Math.abs(jx - 150) < 26 || Math.abs(jx - 265) < 16) continue; junco(jx, suelo(jx) - 5, 4, 9 + (i % 3) * 3, 7, ['#b5d334', '#8fb33a', '#c9e05a']); }
  for (let i = 0; i < 20; i++) { const jx = 920 + i * 12; junco(jx, suelo(jx) - 5, 4, 9 + (i % 3) * 3, 7, ['#b5d334', '#8fb33a', '#c9e05a']); }
  // papiros (Cyperus) con umbelas en las orillas
  const papiro = (px, h) => { const py = suelo(px); const tx = px + (Math.sin(px) * 6); const ty = py - h; x.strokeStyle = '#4f7f2a'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px, py - h * 0.6, tx, ty); x.stroke(); x.strokeStyle = '#86b040'; x.lineWidth = 1; for (let k = 0; k < 14; k++) { const a = -Math.PI + (k / 13) * Math.PI; x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + Math.cos(a) * 9, ty + Math.sin(a) * 9 - 3, tx + Math.cos(a) * 14, ty + Math.sin(a) * 6 + 4); x.stroke(); } };
  for (let px = 352; px < 478; px += 11) papiro(px, 48 + ((px * 7) % 22));
  for (let px = 800; px < 900; px += 11) papiro(px, 46 + ((px * 5) % 20));
  [[365, 22, 14], [440, 18, 12], [830, 20, 12], [885, 22, 14]].forEach(([jx, h, w]) => junco(jx, suelo(jx), 9, h, w, ['#4a7a2c', '#6c9a38', '#3a6a24']));
}
function pintarFlotantes(x) {
  // lirio acuático sudamericano (Pontederia crassipes) en alfombras flotantes
  for (let cx0 = 520; cx0 < 770; cx0 += 26) {
    for (let k = 0; k < 5; k++) { const ex = cx0 + (k - 2) * 5 + Math.sin(cx0 + k) * 3; x.fillStyle = ['#3f7a2c', '#4f8c36', '#5e9a40'][k % 3]; x.beginPath(); x.ellipse(ex, 436 - (k % 2) * 2, 6, 3.4, 0, 0, 6.283); x.fill(); }
    if ((cx0 / 26) % 2 < 1) { x.fillStyle = '#b79ae6'; x.beginPath(); x.ellipse(cx0 + 2, 426, 2.6, 6, 0, 0, 6.283); x.fill(); x.fillStyle = '#f2d04a'; x.beginPath(); x.arc(cx0 + 2, 424, 1.1, 0, 6.283); x.fill(); }
  }
}
function pintarIguana(x) { x.translate(52, 12); x.fillStyle = '#5f9b3a'; x.fill(new Path2D('M0,0 C6,-6 18,-7 27,-4 L36,-5 C39,-4 39,-1 36,0 L27,1 C18,4 8,4 0,2 C-14,2 -32,4 -50,9 C-32,1 -14,-1 0,0Z')); x.strokeStyle = '#8fc05a'; x.lineWidth = 1.2; x.stroke(new Path2D('M6,-5 l2,-4 l2,4 M12,-6 l2,-4 l2,4 M18,-6 l2,-3 l2,3')); x.strokeStyle = '#4f8530'; x.lineWidth = 2.2; x.lineCap = 'round'; x.stroke(new Path2D('M22,2 L25,8 L28,9 M6,3 L3,9 L0,10 M20,-3 L23,3 M2,1 L-2,7')); }
function pintarGarcita(x) { // garcita verde (Butorides virescens)
  x.translate(10, 4); x.fillStyle = '#3e5a58'; x.fill(new Path2D('M8,18 C14,10 30,9 38,15 C42,20 36,27 24,27 C16,27 9,24 8,18Z'));
  x.fillStyle = '#8a4a32'; x.fill(new Path2D('M34,15 C36,8 40,4 44,4 C47,6 46,12 42,16Z')); x.fillStyle = '#233635'; x.beginPath(); x.ellipse(44, 4, 4.5, 3.4, 0, 0, 6.283); x.fill();
  x.strokeStyle = '#2b2b2b'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(47, 4); x.lineTo(56, 5); x.stroke(); x.fillStyle = '#f2d04a'; x.beginPath(); x.arc(45, 3.4, 0.9, 0, 6.283); x.fill();
  x.strokeStyle = '#e0a12a'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(22, 27); x.lineTo(21, 36); x.moveTo(26, 27); x.lineTo(28, 36); x.stroke(); x.fillStyle = '#5b7370'; x.fill(new Path2D('M6,17 L-2,20 L8,21Z'));
}
function pintarSapo(x) { x.translate(4, 4); x.fillStyle = '#8a6a44'; x.beginPath(); x.ellipse(16, 14, 14, 9, 0, 0, 6.283); x.fill(); x.fillStyle = '#a3845a'; x.beginPath(); x.ellipse(24, 9, 7, 5.5, 0, 0, 6.283); x.fill(); x.fillStyle = '#6a4f30'; [[8, 10], [14, 8], [20, 14], [12, 16]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 1.6, 0, 6.283); x.fill(); }); x.fillStyle = '#d9b44a'; x.beginPath(); x.arc(27, 6.5, 1.8, 0, 6.283); x.fill(); x.strokeStyle = '#7a5a36'; x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(6, 18); x.lineTo(0, 22); x.moveTo(26, 18); x.lineTo(31, 22); x.stroke(); }
function pintarBasilisco(x) { // toloque (Basiliscus basiliscus) corriendo erguido
  x.translate(16, 6); x.fillStyle = '#7d6a3e'; x.fill(new Path2D('M14,14 C18,6 30,4 36,8 C40,11 38,16 32,18 C26,20 18,20 14,14Z'));
  x.fillStyle = '#8f7a48'; x.beginPath(); x.ellipse(40, 7, 6, 4, -0.3, 0, 6.283); x.fill(); x.fillStyle = '#6a5830'; x.fill(new Path2D('M38,3 L41,-6 L44,3Z M22,7 L26,0 L30,6Z'));
  x.strokeStyle = '#e8dcae'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(18, 15); x.lineTo(34, 13); x.stroke();
  x.strokeStyle = '#6a5830'; x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(16, 15); x.quadraticCurveTo(0, 18, -14, 24); x.stroke(); x.lineWidth = 2; x.beginPath(); x.moveTo(26, 18); x.lineTo(22, 26); x.lineTo(26, 28); x.moveTo(30, 18); x.lineTo(34, 25); x.lineTo(38, 26); x.stroke();
}
function pintarLibelula(x) { // libélula planeadora amarilla (Pantala flavescens)
  x.translate(4, 10); x.fillStyle = 'rgba(215,232,240,0.9)'; [[14, -5, 12, 3.2, -0.35], [14, 5, 12, 3.2, 0.35], [10, -4, 10, 2.8, -0.6], [10, 4, 10, 2.8, 0.6]].forEach(([a, b, rx, ry, r]) => { x.beginPath(); x.ellipse(a, b, rx, ry, r, 0, 6.283); x.fill(); });
  x.fillStyle = '#d0782a'; x.fillRect(0, -1.4, 34, 2.8); x.fillStyle = '#b8541c'; x.beginPath(); x.ellipse(8, 0, 4.5, 3, 0, 0, 6.283); x.fill(); x.fillStyle = '#e5a040'; x.beginPath(); x.arc(2, 0, 3, 0, 6.283); x.fill();
}

const ESPECIES = [
  { id: 'albaVuelo', src: 'alba_vuelo', w: 150, mira: -1, anc: 'centro', sci: 'Ardea alba', aleteo: 0.3, mov: (t) => { const x = 1300 - ((t * 34 + 500) % 1500); return { x, y: 240 - Math.sin(t * 0.6) * 20, dir: -1, fase: t * 4.2 }; } },
  { id: 'martin', src: 'martin_vuelo', w: 104, mira: -1, anc: 'centro', sci: 'Megaceryle torquata', aleteo: 0.35, mov: (t) => { const v = vaiven(t, 480, 780, 60); const zambullida = Math.pow(Math.max(0, Math.sin(t * 0.9)), 24) * 92; return { x: v.x, y: 330 - Math.abs(Math.sin(t * 1.1)) * 22 + zambullida, dir: v.dir, fase: t * 9 }; } },
  { id: 'alba', src: 'alba', w: 40, mira: 1, anc: 'pie', sci: 'Ardea alba', mov: (t) => { const v = vaiven(t, 385, 428, 4, 10); return { x: v.x, y: suelo(v.x) + 2, dir: v.dir, paso: Math.sin(t * 2.6) * 0.8 }; } },
  { id: 'garza', src: 'garza', w: 120, mira: 1, anc: 'pie', sci: 'Egretta thula', mov: (t) => { const v = vaiven(t, 840, 892, 5); const picoteo = Math.pow(Math.max(0, Math.sin(t * 0.9)), 14) * 7; return { x: v.x, y: suelo(v.x) + picoteo, dir: -v.dir, paso: Math.sin(t * 3) * 1.2 }; } },
  { id: 'garcita', pintar: pintarGarcita, cw: 66, ch: 42, w: 62, mira: 1, anc: 'pie', sci: 'Butorides virescens', mov: (t) => { const v = vaiven(t, 292, 345, 5, 8); return { x: v.x, y: suelo(v.x) - 4, dir: v.dir, paso: Math.sin(t * 3) * 0.8 }; } },
  { id: 'sapo', pintar: pintarSapo, cw: 40, ch: 30, w: 34, mira: 1, anc: 'pie', sci: 'Rhinella horribilis', mov: (t) => { const salto = Math.pow(Math.max(0, Math.sin(t * 1.6)), 6) * 10; const v = vaiven(t, 300, 326, 3); return { x: v.x, y: suelo(v.x) - 3 - salto, dir: v.dir }; } },
  { id: 'iguana', pintar: pintarIguana, cw: 92, ch: 26, w: 104, mira: 1, anc: 'pie', sci: 'Iguana iguana', inclina: true, mov: (t) => { const v = vaiven(t, 930, 1075, 6, 30); return { x: v.x, y: suelo(v.x) - 2, dir: v.dir, paso: Math.sin(t * 5) * 0.6 }; } },
  { id: 'basilisco', pintar: pintarBasilisco, cw: 62, ch: 36, w: 64, mira: 1, anc: 'pie', sci: 'Basiliscus basiliscus', mov: (t) => { const v = vaiven(t, 480, 800, 62, 90); return { x: v.x, y: Math.min(suelo(v.x), 437) - 1 - Math.abs(Math.sin(t * 18)) * 2, dir: v.dir, paso: Math.sin(t * 26) * 1.4 }; } },
  { id: 'libelula', pintar: pintarLibelula, cw: 42, ch: 22, w: 48, mira: -1, anc: 'centro', sci: 'Pantala flavescens', aleteo: 0.12, mov: (t) => ({ x: 640 + Math.sin(t * 0.45) * 110 + Math.sin(t * 2.3) * 10, y: 360 + Math.sin(t * 0.8) * 16, dir: Math.cos(t * 0.45) > 0 ? -1 : 1, fase: t * 40 }) },
  { id: 'monarca', src: 'monarca', w: 44, mira: 1, anc: 'centro', sci: 'Danaus plexippus', mariposa: true, mov: (t) => ({ x: 1040 + Math.sin(t * 0.55) * 60 + Math.sin(t * 1.7) * 12, y: 300 + Math.sin(t * 1.3) * 18 + Math.sin(t * 4.1) * 5, dir: Math.cos(t * 0.55) > 0 ? 1 : -1, fase: t * 16 }) },
];
const PIE = { alba: (x) => suelo(x) + 2, garza: (x) => suelo(x), garcita: (x) => suelo(x) - 4, iguana: (x) => suelo(x) - 2, basilisco: (x) => Math.min(suelo(x), 437) - 1, sapo: (x) => suelo(x) - 3 };
const INAT_OBS = 'iNaturalist (observaciones ciudadanas con interacción)';
const LIRIO = { x: 600, y: 430, es: 'Lirio acuático sudamericano', sci: 'Pontederia crassipes' };
const INTERACCIONES = {
  alba: { a: 'alba', b: LIRIO, modo: 'planta', yA: 438, tipo: 'Refugio y hábitat', A: ['Garza blanca', 'Ardea alba'], B: ['Lirio acuático sudamericano', 'Pontederia crassipes'], texto: 'La garza blanca usa las alfombras flotantes de lirio acuático como refugio y plataforma para acechar en la laguna.', fuente: INAT_OBS },
  albaVuelo: { a: 'albaVuelo', b: LIRIO, modo: 'planta', yA: 412, tipo: 'Refugio y hábitat', A: ['Garza blanca', 'Ardea alba'], B: ['Lirio acuático sudamericano', 'Pontederia crassipes'], texto: 'La garza blanca baja a las alfombras flotantes de lirio acuático, que le sirven de refugio y plataforma de pesca.', fuente: INAT_OBS },
  garza: { a: 'albaVuelo', b: 'garza', modo: 'compite', yA: suelo(866) - 44, sep: 56, tipo: 'Competencia', A: ['Garza blanca', 'Ardea alba'], B: ['Garza dedos dorados', 'Egretta thula'], texto: 'Las dos pescan en la misma orilla: cuando baja la garza blanca, más grande, la garza dedos dorados se aparta.', fuente: INAT_OBS },
  garcita: { a: 'alba', b: 'garcita', modo: 'compite', tipo: 'Competencia', A: ['Garza blanca', 'Ardea alba'], B: ['Garcita verde', 'Butorides virescens'], texto: 'La garza blanca y la garcita verde acechan en la misma orilla de juncos; la garcita, más pequeña, cede el lugar.', fuente: INAT_OBS },
  iguana: { a: 'iguana', b: { x: 868, y: suelo(868) - 40, es: 'Papiros y juncos', sci: 'Cyperus' }, modo: 'planta', tipo: 'Herbivoría', A: ['Iguana verde', 'Iguana iguana'], B: ['Papiros y juncos', 'Cyperus'], texto: 'La iguana baja a la orilla y come los tallos y las hojas tiernas de los papiros y juncos.', fuente: 'Poelen 2014, asociaciones extraídas de literatura' },
  basilisco: { a: 'basilisco', b: 'iguana', modo: 'caza', huye: 1, tipo: 'Depredación', A: ['Toloque', 'Basiliscus basiliscus'], B: ['Iguana verde', 'Iguana iguana'], texto: 'El toloque cruza corriendo sobre el agua y caza iguanas recién nacidas en el borde del humedal; la iguana huye hacia la pradera.', fuente: 'Poelen 2014, asociaciones extraídas de literatura' },
  libelula: { a: 'libelula', b: { x: 265, y: suelo(265) - 38, es: 'Bigotillo', sci: 'Caesalpinia pulcherrima' }, modo: 'visita', tipo: 'Visita floral', A: ['Libélula planeadora amarilla', 'Pantala flavescens'], B: ['Bigotillo', 'Caesalpinia pulcherrima'], texto: 'La libélula planeadora amarilla visita las flores del bigotillo junto al sendero.', fuente: INAT_OBS },
  martin: { a: 'martin', b: 'iguana', modo: 'acompana', tipo: 'Mutualismo y simbiosis', A: ['Martín pescador de collar', 'Megaceryle torquata'], B: ['Iguana verde', 'Iguana iguana'], texto: 'Asociación registrada entre el martín pescador de collar y la iguana verde en los bordes de agua.', fuente: 'Vlad et al. 2022, iguana en Islas Caimán' },
  monarca: { a: 'monarca', b: { x: 1040, y: suelo(1040) - 30, es: 'Algodoncillo gigante', sci: 'Calotropis procera' }, modo: 'visita', tipo: 'Planta hospedera', A: ['Mariposa monarca', 'Danaus plexippus'], B: ['Algodoncillo gigante', 'Calotropis procera'], texto: 'La monarca pone sus huevos en el algodoncillo gigante: sus orugas comen sus hojas y los adultos visitan sus flores.', fuente: `${INAT_OBS}; Ferrer-Paris et al. 2013; NHM Interactions Bank; HOSTS (NHM Londres)` },
  sapo: { es: 'Sapo gigante', sci: 'Rhinella horribilis' },
};
const ROTULOS = [
  [410, suelo(410) - 76, 'Cyperus', 'middle'], [640, 456, 'Pontederia crassipes', 'middle'], [265, suelo(265) - 50, 'Caesalpinia pulcherrima', 'middle'],
  [1040, suelo(1040) - 46, 'Calotropis procera', 'middle'], [1110, suelo(1110) - 186, 'Ceiba', 'middle'],
];
function Overlay() {
  return (
    <>
      <text x="640" y="370" textAnchor="middle" fill="#e9c08a" fontSize="12" fontWeight="600" fontFamily="Geist Mono, monospace">PUENTE PEATONAL</text>
      <g fill="#e8eef0" fontFamily="Geist Mono, monospace" fontWeight="500" letterSpacing="0.8">
        <text x="640" y="528" fontSize="12.5" textAnchor="middle">LAGUNA DE RETENCIÓN Y FITOFILTRACIÓN</text>
        <text x="640" y="546" fontSize="11" textAnchor="middle" fillOpacity="0.7">lecho de arcilla compactada</text>
        <text x="200" y={suelo(200) + 20} fontSize="11.5" textAnchor="middle">SENDERO · BANCO SOLAR</text>
        <text x="1030" y={suelo(1030) + 20} fontSize="11.5" textAnchor="middle">PRADERA · BOSQUE SECO</text>
      </g>
    </>
  );
}

export const corteHumedal = {
  id: 'humedal', suelo, cotas: COTAS, pintarFondo, pintarPasto, pintarFlotantes, especies: ESPECIES, pie: PIE, interacciones: INTERACCIONES, rotulos: ROTULOS,
  rangos: { garza: [835, 900], garcita: [285, 352], iguana: [925, 1100] }, superficie: 438,
  ecotonos: [[E1, ['ORILLA DE JUNCOS', 'PAPIRO / CYPERUS']], [E2, ['PRADERA HÚMEDA', 'BOSQUE SECO']]],
  Overlay, aria: 'Corte del humedal de fitofiltración de Tierra Bomba dibujado con puntos: pradera, orilla de juncos, laguna de retención con lirio acuático, puente peatonal y bosque seco, con especies en movimiento',
};
