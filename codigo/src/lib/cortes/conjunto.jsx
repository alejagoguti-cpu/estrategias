import React from 'react';
import { vaiven } from '../../components/CorteVivo.jsx';

// Corte transversal del conjunto de vivienda (sección 16): dos bloques de cuatro pisos enfrentados sobre un eje
// central con canal de agua y jardín; terrazas con pérgola, balcones, ventilación cruzada y sombra sobre el eje.
export const suelo = (x) => 470 + Math.sin(x / 70) * 1.2;
const B1 = [250, 470]; const B2 = [730, 950]; const PISO = 44; const NP = 4;
const CANAL = [560, 640];
const verdes = ['#2f5d2a', '#3f6f2c', '#557f34', '#2b4f27', '#6c8f3a', '#46702e'];

function pintarFondo(x) {
  const perfil = new Path2D(); perfil.moveTo(60, suelo(60)); for (let i = 65; i <= 1150; i += 5) perfil.lineTo(i, i > CANAL[0] && i < CANAL[1] ? 488 : suelo(i)); x.save();
  const tierra = new Path2D(perfil); tierra.lineTo(1150, 560); tierra.lineTo(60, 560); tierra.closePath();
  const gr = x.createLinearGradient(0, 460, 0, 560); gr.addColorStop(0, '#8a7350'); gr.addColorStop(1, '#3a2d1e'); x.fillStyle = gr; x.fill(tierra); x.restore();
  const copa = (cx, cy, r, cols) => { [[0, -1.55, 0.8], [-0.6, -1.25, 0.62], [0.62, -1.28, 0.66], [-0.25, -2.0, 0.6], [0.35, -1.95, 0.58], [0, -1.2, 0.6]].forEach(([dx, dy, kk], i) => { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(cx + dx * r, cy + dy * r, kk * r, 0, 6.283); x.fill(); }); x.fillStyle = '#5b4330'; x.fillRect(cx - 3, cy - r * 1.2, 6, r * 1.2); };
  [100, 180, 1030, 1110].forEach((cx0, i) => copa(cx0, suelo(cx0), 56 + (i % 2) * 16, verdes));
  [520, 680].forEach((cx0) => copa(cx0, suelo(cx0), 30, verdes.slice().reverse()));
  [B1, B2].forEach(([a, b], k) => {
    const eje = k === 0 ? b : a; const dir = k === 0 ? 1 : -1;
    for (let n = 0; n < NP; n++) { const y = suelo(600) - n * PISO;
      x.fillStyle = '#f4f1ea'; x.fillRect(a - 8, y - 6, b - a + 16, 6); x.fillRect(eje + dir * 0 - (dir > 0 ? 0 : 22), y - 6, 22, 6);
      x.fillStyle = '#25353b'; x.fillRect(a + 10, y - PISO + 2, b - a - 20, PISO - 8);
      x.fillStyle = '#f4f1ea'; for (let px = a + 10; px < b - 8; px += 26) x.fillRect(px, y - PISO + 2, 5, PISO - 8);
      if (n > 0) { x.strokeStyle = 'rgba(200,225,230,.85)'; x.lineWidth = 1.4; x.strokeRect(eje + (dir > 0 ? 6 : -28), y - 20, 22, 14); } }
    const yt = suelo(600) - NP * PISO; x.fillStyle = '#f4f1ea'; x.fillRect(a - 8, yt - 8, b - a + 16, 8); x.fillRect((a + b) / 2 - 30, yt - 40, 60, 32);
    x.fillStyle = '#c8996c'; for (let px = (k === 0 ? a : b - 70); px < (k === 0 ? a + 70 : b); px += 9) x.fillRect(px, yt - 34, 5, 3);
  });
  // canal de agua con borde de piedra
  x.fillStyle = '#d8d2c4'; x.fillRect(CANAL[0] - 8, 466, 8, 24); x.fillRect(CANAL[1], 466, 8, 24);
  x.fillStyle = '#eae4d8'; x.fillRect(B1[1] + 20, suelo(500) - 2, CANAL[0] - B1[1] - 28, 3); x.fillRect(CANAL[1] + 8, suelo(700) - 2, B2[0] - CANAL[1] - 28, 3);
  x.strokeStyle = '#f4f1ea'; x.lineWidth = 3.2; x.stroke(perfil);
}
function pintarPasto(x) {
  const junco = (jx, jy, n, h, w, cols) => { for (let i = 0; i < n; i++) { const dx = (i / (n - 1) - 0.5) * w; const ho = h * (0.6 + 0.4 * Math.sin(i * 2.3 + jx) ** 2); const cur = (i / (n - 1) - 0.5) * 12; x.strokeStyle = cols[i % cols.length]; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(jx + dx, jy); x.quadraticCurveTo(jx + dx + cur * 0.3, jy - ho * 0.6, jx + dx + cur, jy - ho); x.stroke(); } };
  [[66, 240], [480, 552], [648, 720], [960, 1146]].forEach(([a, b]) => { for (let jx = a; jx < b; jx += 9) junco(jx, suelo(jx) - 2, 4, 8 + (jx % 3) * 2, 6, ['#7fae36', '#5e9a2c', '#9cc44a']); });
  for (let jx = CANAL[0] + 6; jx < CANAL[1] - 4; jx += 12) junco(jx, 486, 5, 16, 6, ['#3f7a2c', '#5a9a34']);
}
const ruta = (pts) => { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], L, d]); L += d; } return { en: (u) => { const s = ((u % 1) + 1) % 1 * L; for (const [a, b, l0, d] of seg) if (s <= l0 + d) { const k = (s - l0) / d; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } return pts[pts.length - 1]; } }; };
const AIRE = [0, 1, 2, 3].map((n) => { const y = suelo(600) - n * PISO - 22; return ruta([[70, y], [B1[0], y], [B1[1], y + 2], [600, y - 8], [B2[0], y + 2], [B2[1], y], [1150, y]]); });
function animar(cx, t, punto) {
  // agua del canal
  for (let px = CANAL[0] + 2; px < CANAL[1] - 2; px += 3) for (let y = 470; y < 488; y += 3) { cx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 2 + px * 0.2 + y); cx.fillStyle = '#3aa6c0'; punto(cx, px, y + Math.sin(px * 0.1 + t * 1.5) * (y < 474 ? 1.2 : 0), 1); }
  cx.fillStyle = '#ffd9a0'; AIRE.forEach((r, k) => { for (let i = 0; i < 34; i++) { const u = (t * (0.045 + k * 0.006) + i / 34) % 1; const [px, py] = r.en(u); const c = Math.sin(u * Math.PI); cx.globalAlpha = 0.12 + 0.4 * c; punto(cx, px, py, 1 + c * 0.6); } });
  cx.globalAlpha = 1;
}
const ESPECIES = [
  { id: 'alba', src: 'alba', w: 40, mira: 1, anc: 'pie', sci: 'Ardea alba', mov: (t) => { const v = vaiven(t, CANAL[0] + 10, CANAL[1] - 10, 4); return { x: v.x, y: 486, dir: v.dir, paso: Math.sin(t * 2.6) * 0.8 }; } },
  { id: 'garza', src: 'garza', w: 84, mira: 1, anc: 'pie', sci: 'Egretta thula', mov: (t) => { const v = vaiven(t, 490, 548, 5, 20); return { x: v.x, y: suelo(v.x) - 1, dir: v.dir, paso: Math.sin(t * 3) * 1.2 }; } },
  { id: 'tirano', url: 'datos/tramas/16798.png', w: 44, mira: -1, anc: 'centro', sci: 'Tyrannus dominicensis', aleteo: 0.25, mov: (t) => { const s = Math.max(0, Math.sin(t * 0.5)); return { x: 680 + Math.sin(t * 0.9) * 50 * s, y: suelo(680) - 70 - s * 40, dir: Math.cos(t * 0.9) > 0 ? 1 : -1, fase: t * (s > 0.2 ? 14 : 2) }; } },
  { id: 'monarca', src: 'monarca', w: 40, mira: 1, anc: 'centro', sci: 'Danaus plexippus', mariposa: true, mov: (t) => ({ x: 1070 + Math.sin(t * 0.55) * 60, y: suelo(1070) - 120 + Math.sin(t * 1.3) * 18, dir: Math.cos(t * 0.55) > 0 ? 1 : -1, fase: t * 16 }) },
];
const INTERACCIONES = {
  alba: { a: 'alba', b: 'garza', modo: 'compite', tipo: 'Competencia', A: ['Garza blanca', 'Ardea alba'], B: ['Garza dedos dorados', 'Egretta thula'], texto: 'En el canal del conjunto las dos garzas buscan los mismos peces pequeños; la garza dedos dorados cede el lugar a la blanca.', fuente: 'iNaturalist (observaciones ciudadanas con interacción)' },
  garza: { a: 'alba', b: 'garza', modo: 'compite', tipo: 'Competencia', A: ['Garza blanca', 'Ardea alba'], B: ['Garza dedos dorados', 'Egretta thula'], texto: 'En el canal del conjunto las dos garzas buscan los mismos peces pequeños; la garza dedos dorados cede el lugar a la blanca.', fuente: 'iNaturalist (observaciones ciudadanas con interacción)' },
  tirano: { es: 'Tirano gris', sci: 'Tyrannus dominicensis' }, monarca: { es: 'Mariposa monarca', sci: 'Danaus plexippus' },
};
function Overlay() {
  const t = (x, y, s, o = {}) => <text x={x} y={y} fill="#e8eef0" fontSize="11.5" fontFamily="Geist Mono, monospace" letterSpacing="0.6" {...o}>{s}</text>;
  return (
    <>
      {t(360, suelo(600) - NP * PISO - 50, 'BLOQUE · 4 PISOS', { textAnchor: 'middle' })}{t(840, suelo(600) - NP * PISO - 50, 'BLOQUE · 4 PISOS', { textAnchor: 'middle' })}
      {t(600, 520, 'CANAL DE AGUA · RETENCIÓN DE LLUVIA', { textAnchor: 'middle', fill: '#7fd8ee', fontSize: '10.5' })}{t(600, 300, 'EJE CENTRAL: JARDÍN Y SOMBRA', { textAnchor: 'middle', fill: '#9cc44a' })}
      {t(80, suelo(600) - 30, 'VENTILACIÓN CRUZADA →', { fill: '#ffd9a0', fontSize: '10.5' })}{t(360, suelo(600) - NP * PISO - 18, 'terraza con pérgola', { textAnchor: 'middle', fill: '#e9c08a', fontSize: '10' })}
    </>
  );
}
export const corteConjunto = {
  id: 'conjunto', suelo, cotas: [], pintarFondo, pintarPasto, animar, especies: ESPECIES, pie: { alba: () => 486, garza: (x) => suelo(x) - 1 }, interacciones: INTERACCIONES, rotulos: [],
  rangos: { garza: [480, 552] }, superficie: 9999, ecotonos: [],
  Overlay, aria: 'Corte del conjunto de vivienda dibujado con puntos: dos bloques de cuatro pisos alrededor de un canal de agua y jardín, con ventilación cruzada y garzas en el canal',
};
