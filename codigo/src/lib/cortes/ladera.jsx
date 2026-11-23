import React from 'react';
import { clamp, vaiven } from '../../components/CorteVivo.jsx';

// Corte del colegio en ladera (sección 15): dos barras escalonadas de dos pisos sobre pilotes, balcones corridos,
// cubiertas flotantes con paneles solares, escalera exterior y bosque que pasa por debajo.
export const suelo = (x) => 520 - clamp((x - 120) * 0.2, 0, 200) + Math.sin(x / 50) * 2;
const verdes = ['#2f5d2a', '#3f6f2c', '#557f34', '#2b4f27', '#6c8f3a', '#46702e'];
const BARRAS = [{ x0: 380, x1: 560 }, { x0: 640, x1: 820 }]; const PISO = 46;
const base = (b) => suelo(b.x1) - 14; // losa apoyada atrás, en voladizo adelante sobre pilotes
const techo = (b) => base(b) - PISO * 2;

function pintarFondo(x) {
  const perfil = new Path2D(); perfil.moveTo(60, suelo(60)); for (let i = 65; i <= 1150; i += 5) perfil.lineTo(i, suelo(i));
  const tierra = new Path2D(perfil); tierra.lineTo(1150, 560); tierra.lineTo(60, 560); tierra.closePath();
  const gr = x.createLinearGradient(0, 300, 0, 560); gr.addColorStop(0, '#7a6440'); gr.addColorStop(1, '#2e2418'); x.fillStyle = gr; x.fill(tierra);
  // cerros con bruma
  x.strokeStyle = 'rgba(150,180,160,.7)'; x.lineWidth = 2; x.beginPath(); x.moveTo(60, 200); x.quadraticCurveTo(400, 60, 760, 150); x.quadraticCurveTo(980, 90, 1150, 140); x.stroke();
  const copa = (cx, cy, r, cols) => { [[0, -1.55, 0.8], [-0.6, -1.25, 0.62], [0.62, -1.28, 0.66], [-0.25, -2.0, 0.6], [0.35, -1.95, 0.58], [0, -1.2, 0.6]].forEach(([dx, dy, kk], i) => { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(cx + dx * r, cy + dy * r, kk * r, 0, 6.283); x.fill(); }); x.fillStyle = '#5b4330'; x.fillRect(cx - 3, cy - r * 1.2, 6, r * 1.2); };
  [90, 170, 250, 330, 600, 880, 960, 1040, 1120].forEach((cx0, i) => copa(cx0, suelo(cx0), 40 + (i % 3) * 14, i % 2 ? verdes : verdes.slice().reverse()));
  BARRAS.forEach((b) => {
    const y0 = base(b);
    // pilotes
    x.fillStyle = '#3a3e42'; for (let px = b.x0 + 6; px <= b.x1; px += 30) { const h = suelo(px) - y0; if (h > 2) x.fillRect(px - 2, y0, 4, h); }
    // losas, celosías de listones y baranda
    for (let n = 0; n < 2; n++) { const y = y0 - n * PISO; x.fillStyle = '#d8d4cc'; x.fillRect(b.x0 - 18, y - 3, b.x1 - b.x0 + 18, 5);
      x.fillStyle = '#5a4630'; x.fillRect(b.x0 + 20, y - PISO + 5, b.x1 - b.x0 - 40, PISO - 8); x.fillStyle = '#d9a978'; for (let px = b.x0 + 20; px < b.x1 - 20; px += 3) x.fillRect(px, y - PISO + 5, 2, PISO - 8);
      x.fillStyle = '#d9a978'; for (let px = b.x0; px < b.x0 + 20; px += 3) x.fillRect(px, y - PISO + 4, 2, PISO - 7); for (let px = b.x1 - 20; px < b.x1; px += 3) x.fillRect(px, y - PISO + 4, 2, PISO - 7);
      x.strokeStyle = '#a9b0b4'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(b.x0 - 18, y - 16); x.lineTo(b.x0 + 2, y - 16); x.stroke(); }
    // cubierta flotante inclinada con paneles
    const yt = techo(b); x.strokeStyle = '#3a3e42'; x.lineWidth = 3; x.beginPath(); x.moveTo(b.x0 - 30, yt - 8); x.lineTo(b.x1 + 6, yt - 24); x.stroke();
    for (let px = b.x0 - 28; px < b.x1 + 4; px += 8) { const yy = yt - 8 - ((px - b.x0 + 30) / (b.x1 - b.x0 + 36)) * 16; x.fillStyle = (px / 8) % 2 < 1 ? '#23409a' : '#c8996c'; x.fillRect(px, yy - 4, 7, 3); }
    [b.x0 + 4, b.x1 - 4].forEach((px) => { x.fillRect(px - 1.5, yt - 22, 3, 22); });
  });
  // escalera exterior entre barras
  x.strokeStyle = '#c8996c'; x.lineWidth = 2; const a = [BARRAS[0].x1 + 10, base(BARRAS[0])]; const b2 = [BARRAS[1].x0 - 20, base(BARRAS[1])];
  for (let k = 0; k <= 12; k++) { const t = k / 12; const px = a[0] + (b2[0] - a[0]) * t; const py = a[1] + (b2[1] - a[1]) * t; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (b2[0] - a[0]) / 12, py); x.lineTo(px + (b2[0] - a[0]) / 12, py + (b2[1] - a[1]) / 12); x.stroke(); }
  x.strokeStyle = '#f4f1ea'; x.lineWidth = 3.2; x.stroke(perfil);
}
function pintarPasto(x) {
  const junco = (jx, jy, n, h, w, cols) => { for (let i = 0; i < n; i++) { const dx = (i / (n - 1) - 0.5) * w; const ho = h * (0.6 + 0.4 * Math.sin(i * 2.3 + jx) ** 2); const cur = (i / (n - 1) - 0.5) * 12; x.strokeStyle = cols[i % cols.length]; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(jx + dx, jy); x.quadraticCurveTo(jx + dx + cur * 0.3, jy - ho * 0.6, jx + dx + cur, jy - ho); x.stroke(); } };
  for (let jx = 66; jx < 1146; jx += 10) junco(jx, suelo(jx) - 2, 4, 12 + (jx % 4) * 4, 8, ['#5e9a2c', '#7fae36', '#3f7a24']);
}
const ruta = (pts) => { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], L, d]); L += d; } return { en: (u) => { const s = ((u % 1) + 1) % 1 * L; for (const [a, b, l0, d] of seg) if (s <= l0 + d) { const k = (s - l0) / d; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } return pts[pts.length - 1]; } }; };
const AIRE = BARRAS.map((b) => ruta([[b.x0 - 60, base(b) - 30], [b.x0 + 30, base(b) - 26], [b.x1 - 30, base(b) - 30], [b.x1 + 10, techo(b) - 4], [b.x1 + 80, techo(b) - 40]]));
function animar(cx, t, punto) {
  cx.fillStyle = '#ffd9a0'; AIRE.forEach((r, k) => { for (let i = 0; i < 40; i++) { const u = (t * (0.05 + k * 0.01) + i / 40) % 1; const [px, py] = r.en(u); const c = Math.sin(u * Math.PI); cx.globalAlpha = 0.15 + 0.45 * c; punto(cx, px, py, 1.1 + c * 0.6); } });
  cx.fillStyle = '#ffffff'; BARRAS.forEach((b) => { for (let px = b.x0 - 24; px < b.x1; px += 16) { const v = 0.5 + 0.5 * Math.sin(t * 1.4 + px * 0.05); if (v < 0.88) continue; cx.globalAlpha = (v - 0.88) * 7; punto(cx, px, techo(b) - 12 - ((px - b.x0 + 30) / (b.x1 - b.x0 + 36)) * 16, 2); } });
  // niebla que sube por la ladera
  cx.fillStyle = '#eef4f2'; for (let i = 0; i < 60; i++) { const u = (t * 0.02 + i / 60) % 1; cx.globalAlpha = 0.07 * Math.sin(u * Math.PI); punto(cx, 60 + u * 1090, 180 + Math.sin(i * 7 + t * 0.3) * 30, 5); }
  cx.globalAlpha = 1;
}
const ESPECIES = [
  { id: 'albaVuelo', src: 'alba_vuelo', w: 140, mira: -1, anc: 'centro', sci: 'Ardea alba', aleteo: 0.3, mov: (t) => { const x = 1300 - ((t * 32 + 300) % 1500); return { x, y: 140 - Math.sin(t * 0.6) * 20, dir: -1, fase: t * 4.2 }; } },
  { id: 'tirano', url: 'datos/tramas/16798.png', w: 46, mira: -1, anc: 'centro', sci: 'Tyrannus dominicensis', aleteo: 0.25, mov: (t) => { const s = Math.max(0, Math.sin(t * 0.5)); return { x: 960 + Math.sin(t * 0.9) * 60 * s, y: suelo(960) - 110 - s * 40, dir: Math.cos(t * 0.9) > 0 ? 1 : -1, fase: t * (s > 0.2 ? 14 : 2) }; } },
  { id: 'iguana', pintar: (x) => { x.translate(52, 12); x.fillStyle = '#5f9b3a'; x.fill(new Path2D('M0,0 C6,-6 18,-7 27,-4 L36,-5 C39,-4 39,-1 36,0 L27,1 C18,4 8,4 0,2 C-14,2 -32,4 -50,9 C-32,1 -14,-1 0,0Z')); x.strokeStyle = '#4f8530'; x.lineWidth = 2.2; x.lineCap = 'round'; x.stroke(new Path2D('M22,2 L25,8 L28,9 M6,3 L3,9 L0,10 M20,-3 L23,3 M2,1 L-2,7')); }, cw: 92, ch: 26, w: 96, mira: 1, anc: 'pie', sci: 'Iguana iguana', inclina: true, mov: (t) => { const v = vaiven(t, 900, 1060, 6, 30); return { x: v.x, y: suelo(v.x) - 2, dir: v.dir, paso: Math.sin(t * 5) * 0.6 }; } },
  { id: 'monarca', src: 'monarca', w: 42, mira: 1, anc: 'centro', sci: 'Danaus plexippus', mariposa: true, mov: (t) => ({ x: 230 + Math.sin(t * 0.55) * 90, y: suelo(230) - 80 + Math.sin(t * 1.3) * 18, dir: Math.cos(t * 0.55) > 0 ? 1 : -1, fase: t * 16 }) },
];
const INTERACCIONES = {
  tirano: { a: 'tirano', b: 'iguana', modo: 'acompana', tipo: 'Mutualismo y simbiosis', A: ['Tirano gris', 'Tyrannus dominicensis'], B: ['Iguana verde', 'Iguana iguana'], texto: 'Asociación registrada entre el tirano gris y la iguana verde en el borde del bosque.', fuente: 'Poelen 2014, asociaciones extraídas de literatura' },
  iguana: { a: 'tirano', b: 'iguana', modo: 'acompana', tipo: 'Mutualismo y simbiosis', A: ['Tirano gris', 'Tyrannus dominicensis'], B: ['Iguana verde', 'Iguana iguana'], texto: 'Asociación registrada entre el tirano gris y la iguana verde en el borde del bosque.', fuente: 'Poelen 2014, asociaciones extraídas de literatura' },
  albaVuelo: { a: 'albaVuelo', b: 'iguana', modo: 'caza', vuela: true, tipo: 'Depredación', A: ['Garza blanca', 'Ardea alba'], B: ['Iguana verde', 'Iguana iguana'], texto: 'La garza blanca baja a cazar iguanas jóvenes, que huyen hacia el bosque.', fuente: 'iNaturalist (observaciones ciudadanas con interacción); Vlad et al. 2022' },
  monarca: { es: 'Mariposa monarca', sci: 'Danaus plexippus' },
};
function Overlay() {
  const t = (x, y, s, o = {}) => <text x={x} y={y} fill="#e8eef0" fontSize="11.5" fontFamily="Geist Mono, monospace" letterSpacing="0.6" {...o}>{s}</text>;
  return (
    <>
      {BARRAS.map((b, i) => <g key={i}>{t((b.x0 + b.x1) / 2, techo(b) - 36, 'CUBIERTA SOLAR FLOTANTE', { textAnchor: 'middle', fill: '#9fb7ff', fontSize: '10.5' })}{t((b.x0 + b.x1) / 2, base(b) - PISO / 2, `AULAS · PISO ${i * 2 + 1}-${i * 2 + 2}`, { textAnchor: 'middle' })}</g>)}
      {t(BARRAS[0].x0 - 20, suelo(BARRAS[0].x0) + 18, 'PILOTES: EL BOSQUE PASA POR DEBAJO', { fill: '#9cc44a', fontSize: '10.5' })}{t(600, base(BARRAS[1]) + 40, 'ESCALERA EXTERIOR', { textAnchor: 'middle', fill: '#e9c08a', fontSize: '10.5' })}
      {t(BARRAS[0].x0 - 60, base(BARRAS[0]) - 50, 'BALCÓN CORRIDO →', { fill: '#ffd9a0', fontSize: '10.5' })}{t(600, 120, 'CERROS CON BRUMA', { textAnchor: 'middle', fillOpacity: '0.7', fontSize: '10.5' })}
    </>
  );
}
export const corteLadera = {
  id: 'ladera', suelo, cotas: [], pintarFondo, pintarPasto, animar, especies: ESPECIES, pie: { iguana: (x) => suelo(x) - 2 }, interacciones: INTERACCIONES, rotulos: [],
  rangos: { iguana: [890, 1080] }, superficie: 9999, ecotonos: [],
  Overlay, aria: 'Corte del colegio en ladera dibujado con puntos: barras escalonadas sobre pilotes, balcones, cubiertas solares, escalera exterior y bosque, con viento, niebla y especies en movimiento',
};
