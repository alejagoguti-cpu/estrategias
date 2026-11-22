import React from 'react';
import { vaiven } from '../../components/CorteVivo.jsx';

// Corte del parque de juego natural (sección 13): claro de bosque seco con piso de viruta, red de trepar en
// A, torre de madera, troncos de equilibrio, pilotes para saltar, túnel, rocas, sendero y bancas a la sombra.
export const suelo = (x) => 470 + Math.sin(x / 70) * 1.5 - (x < 230 ? (230 - x) * 0.12 : 0);
const verdes = ['#2f5d2a', '#3f6f2c', '#557f34', '#2b4f27', '#6c8f3a', '#46702e'];

function pintarFondo(x) {
  const perfil = new Path2D(); perfil.moveTo(60, suelo(60)); for (let i = 65; i <= 1150; i += 5) perfil.lineTo(i, suelo(i));
  const tierra = new Path2D(perfil); tierra.lineTo(1150, 560); tierra.lineTo(60, 560); tierra.closePath();
  const gr = x.createLinearGradient(0, 440, 0, 560); gr.addColorStop(0, '#7a5a3a'); gr.addColorStop(1, '#2e2216'); x.fillStyle = gr; x.fill(tierra);
  // capa de viruta (30 cm) bajo los juegos
  for (let px = 330; px < 880; px += 3) for (let k = 0; k < 4; k++) { x.fillStyle = ['#c08a58', '#a87444', '#d49e68', '#8e6038'][(px + k) % 4]; x.fillRect(px, suelo(px) + k * 3, 3, 3); }
  // bosque de fondo y árboles de sombra
  const copa = (cx, cy, r, cols) => { [[0, -1.55, 0.8], [-0.6, -1.25, 0.62], [0.62, -1.28, 0.66], [-0.25, -2.0, 0.6], [0.35, -1.95, 0.58], [0, -1.2, 0.6]].forEach(([dx, dy, kk], i) => { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(cx + dx * r, cy + dy * r, kk * r, 0, 6.283); x.fill(); }); x.fillStyle = '#5b4330'; x.fillRect(cx - 4, cy - r * 1.2, 8, r * 1.2); };
  copa(120, suelo(120), 96, verdes); copa(260, suelo(260), 70, verdes.slice().reverse()); copa(960, suelo(960), 84, verdes); copa(1100, suelo(1100), 100, verdes.slice().reverse());
  // rocas del talud
  [[170, 14], [205, 10], [235, 12], [290, 9]].forEach(([rx, r]) => { x.fillStyle = '#b8b0a2'; x.beginPath(); x.ellipse(rx, suelo(rx) - r * 0.5, r * 1.3, r * 0.8, 0, 0, 6.283); x.fill(); });
  // torre de madera con red
  x.strokeStyle = '#a77b4e'; x.lineWidth = 5; [520, 600].forEach((tx) => { x.beginPath(); x.moveTo(tx, suelo(tx)); x.lineTo(tx, 340); x.stroke(); }); x.fillStyle = '#c99a64'; x.fillRect(516, 392, 88, 6);
  x.strokeStyle = '#d8c79a'; x.lineWidth = 1.2; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(520 + i * 16, 342); x.lineTo(520 + i * 16, 392); x.stroke(); x.beginPath(); x.moveTo(520, 346 + i * 9); x.lineTo(600, 346 + i * 9); x.stroke(); }
  // red de trepar en A con postes de acero
  x.strokeStyle = '#b98a58'; x.lineWidth = 6; x.beginPath(); x.moveTo(400, suelo(400)); x.lineTo(450, 360); x.lineTo(500, suelo(500)); x.stroke();
  x.strokeStyle = '#8e969a'; x.lineWidth = 5; x.beginPath(); x.moveTo(380, suelo(380)); x.lineTo(380, 350); x.stroke();
  x.strokeStyle = '#e2d2a6'; x.lineWidth = 1.1; for (let k = 1; k < 9; k++) { const t = k / 9; x.beginPath(); x.moveTo(400 + 50 * t, suelo(400) - (suelo(400) - 360) * t); x.lineTo(380, suelo(380) - (suelo(380) - 350) * t); x.stroke(); }
  // tronco de equilibrio, pilotes para saltar y túnel
  x.fillStyle = '#9a7048'; x.save(); x.translate(640, suelo(640) - 16); x.rotate(-0.12); x.fillRect(0, -6, 130, 12); x.restore();
  [800, 828, 856, 884].forEach((px, i) => { const h = 14 + (i % 2) * 8; x.fillStyle = '#a77b4e'; x.fillRect(px - 9, suelo(px) - h, 18, h); x.fillStyle = '#c99a64'; x.fillRect(px - 11, suelo(px) - h - 3, 22, 4); });
  x.fillStyle = '#1e2224'; x.beginPath(); x.ellipse(720, suelo(720) - 16, 18, 16, 0, 0, 6.283); x.fill(); x.fillStyle = '#3a4246'; x.beginPath(); x.ellipse(720, suelo(720) - 16, 11, 10, 0, 0, 6.283); x.fill();
  // sendero de concreto y banca
  x.fillStyle = '#d6d2c8'; x.fillRect(900, suelo(900) - 3, 250, 4);
  x.fillStyle = '#5a3e28'; x.fillRect(1000, suelo(1000) - 18, 46, 5); x.fillStyle = '#2a2a2a'; x.fillRect(1004, suelo(1000) - 14, 3, 14); x.fillRect(1039, suelo(1000) - 14, 3, 14); x.fillRect(1004, suelo(1000) - 34, 3, 20); x.fillStyle = '#5a3e28'; x.fillRect(1004, suelo(1000) - 32, 42, 4);
  x.strokeStyle = '#f4f1ea'; x.lineWidth = 3.2; x.stroke(perfil);
}
function pintarPasto(x) {
  const junco = (jx, jy, n, h, w, cols) => { for (let i = 0; i < n; i++) { const dx = (i / (n - 1) - 0.5) * w; const ho = h * (0.6 + 0.4 * Math.sin(i * 2.3 + jx) ** 2); const cur = (i / (n - 1) - 0.5) * 12; x.strokeStyle = cols[i % cols.length]; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(jx + dx, jy); x.quadraticCurveTo(jx + dx + cur * 0.3, jy - ho * 0.6, jx + dx + cur, jy - ho); x.stroke(); } };
  for (let jx = 66; jx < 330; jx += 9) junco(jx, suelo(jx) - 2, 5, 14 + (jx % 4) * 4, 9, ['#5e9a2c', '#7fae36', '#3f7a24']);
  for (let jx = 890; jx < 1146; jx += 11) junco(jx, suelo(jx) - 3, 4, 10, 7, ['#7fae36', '#5e9a2c', '#9cc44a']);
}
function animar(cx, t, punto) {
  // hojas que caen de los árboles de sombra
  cx.fillStyle = '#8fb43a'; for (let i = 0; i < 40; i++) { const u = (t * 0.06 + i / 40) % 1; const x0 = [120, 260, 960, 1100][i % 4] + ((i * 37) % 120) - 60; const y = 300 + u * 170; cx.globalAlpha = 0.8 * Math.sin(u * Math.PI); punto(cx, x0 + Math.sin(t * 2 + i) * 12, y, 1.6); }
  // niños jugando: puntos que trepan la red, saltan los pilotes y cruzan el tronco
  const nino = (px, py, c) => { cx.globalAlpha = 0.95; cx.fillStyle = c; punto(cx, px, py - 12, 3.2); cx.fillRect(px - 3, py - 9, 6, 9); };
  const tr = (t * 0.25) % 1; nino(400 + 50 * tr, suelo(400) - (suelo(400) - 360) * tr, '#e85a4a');
  const v = vaiven(t, 800, 884, 28); const salto = Math.abs(Math.sin(t * 6)) * 10; nino(v.x, suelo(v.x) - 18 - salto, '#3aa0d8');
  const b = vaiven(t, 645, 765, 14, 30); nino(b.x, suelo(640) - 22 - (b.x - 640) * 0.12, '#f2c23a');
  cx.globalAlpha = 1;
}
const ESPECIES = [
  { id: 'tirano', url: 'datos/tramas/16798.png', w: 46, mira: -1, anc: 'centro', sci: 'Tyrannus dominicensis', aleteo: 0.25, mov: (t) => { const s = Math.max(0, Math.sin(t * 0.5)); return { x: 960 + Math.sin(t * 0.9) * 60 * s, y: suelo(960) - 170 - s * 40, dir: Math.cos(t * 0.9) > 0 ? 1 : -1, fase: t * (s > 0.2 ? 14 : 2) }; } },
  { id: 'tangara', url: 'datos/tramas/10295.png', w: 44, mira: 1, anc: 'centro', sci: 'Thraupis episcopus', aleteo: 0.22, mov: (t) => ({ x: 130 + Math.sin(t * 0.7) * 50, y: suelo(120) - 190 + Math.sin(t * 1.1) * 14, dir: Math.cos(t * 0.7) > 0 ? 1 : -1, fase: t * 12 }) },
  { id: 'iguana', pintar: (x) => { x.translate(52, 12); x.fillStyle = '#5f9b3a'; x.fill(new Path2D('M0,0 C6,-6 18,-7 27,-4 L36,-5 C39,-4 39,-1 36,0 L27,1 C18,4 8,4 0,2 C-14,2 -32,4 -50,9 C-32,1 -14,-1 0,0Z')); x.strokeStyle = '#4f8530'; x.lineWidth = 2.2; x.lineCap = 'round'; x.stroke(new Path2D('M22,2 L25,8 L28,9 M6,3 L3,9 L0,10 M20,-3 L23,3 M2,1 L-2,7')); }, cw: 92, ch: 26, w: 96, mira: 1, anc: 'pie', sci: 'Iguana iguana', inclina: true, mov: (t) => { const v = vaiven(t, 150, 300, 6, 30); return { x: v.x, y: suelo(v.x) - 2, dir: v.dir, paso: Math.sin(t * 5) * 0.6 }; } },
  { id: 'monarca', src: 'monarca', w: 42, mira: 1, anc: 'centro', sci: 'Danaus plexippus', mariposa: true, mov: (t) => ({ x: 600 + Math.sin(t * 0.55) * 120, y: 300 + Math.sin(t * 1.3) * 20, dir: Math.cos(t * 0.55) > 0 ? 1 : -1, fase: t * 16 }) },
];
const INTERACCIONES = {
  tirano: { a: 'tirano', b: 'iguana', modo: 'acompana', tipo: 'Mutualismo y simbiosis', A: ['Tirano gris', 'Tyrannus dominicensis'], B: ['Iguana verde', 'Iguana iguana'], texto: 'Asociación registrada entre el tirano gris y la iguana verde en los claros del bosque seco.', fuente: 'Poelen 2014, asociaciones extraídas de literatura' },
  iguana: { a: 'tirano', b: 'iguana', modo: 'acompana', tipo: 'Mutualismo y simbiosis', A: ['Tirano gris', 'Tyrannus dominicensis'], B: ['Iguana verde', 'Iguana iguana'], texto: 'Asociación registrada entre el tirano gris y la iguana verde en los claros del bosque seco.', fuente: 'Poelen 2014, asociaciones extraídas de literatura' },
  tangara: { es: 'Tangara azulgrís', sci: 'Thraupis episcopus' }, monarca: { es: 'Mariposa monarca', sci: 'Danaus plexippus' },
};
function Overlay() {
  const t = (x, y, s, o = {}) => <text x={x} y={y} fill="#e8eef0" fontSize="11.5" fontFamily="Geist Mono, monospace" letterSpacing="0.6" {...o}>{s}</text>;
  return (
    <>
      {t(440, 330, 'RED DE TREPAR', { textAnchor: 'middle', fill: '#e9c08a' })}{t(560, 326, 'TORRE', { textAnchor: 'middle', fill: '#e9c08a' })}{t(700, 430, 'TRONCO DE EQUILIBRIO', { textAnchor: 'middle', fill: '#e9c08a', fontSize: '10.5' })}
      {t(842, 440, 'PILOTES', { textAnchor: 'middle', fill: '#e9c08a', fontSize: '10.5' })}{t(720, 500, 'TÚNEL', { textAnchor: 'middle', fontSize: '10.5' })}{t(600, 506, 'PISO DE VIRUTA · 30 cm (amortigua caídas)', { textAnchor: 'middle', fontSize: '10.5', fill: '#d4a070' })}
      {t(1020, 500, 'SENDERO · BANCAS A LA SOMBRA', { textAnchor: 'middle', fontSize: '10.5' })}{t(220, 500, 'TALUD CON ROCAS', { textAnchor: 'middle', fontSize: '10.5' })}{t(600, 250, 'CLARO EN EL BOSQUE SECO', { textAnchor: 'middle', fill: '#9cc44a' })}
    </>
  );
}
export const corteParque = {
  id: 'parque', suelo, cotas: [], pintarFondo, pintarPasto, animar, especies: ESPECIES, pie: { iguana: (x) => suelo(x) - 2 }, interacciones: INTERACCIONES, rotulos: [],
  rangos: { iguana: [140, 320] }, superficie: 9999, ecotonos: [],
  Overlay, aria: 'Corte del parque de juego natural de Tierra Bomba dibujado con puntos: piso de viruta, red de trepar, torre, tronco de equilibrio, pilotes, túnel, rocas y bancas en un claro del bosque seco',
};
