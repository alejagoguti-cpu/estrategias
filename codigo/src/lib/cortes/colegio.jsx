import React from 'react';
import { clamp, vaiven } from '../../components/CorteVivo.jsx';

// Corte del colegio (sección 11): aulas de bloque de tierra comprimida (BTC) sobre un zócalo, galería de
// madera, cubierta flotante de lámina sobre tornapuntas de madera en V, separada de los muros (el aire caliente sale
// por debajo), tanque de lluvia y patio de adoquín con árbol de sombra y bancas de tronco.
export const suelo = (x) => 470 + Math.sin(x / 70) * 1.5;
const ZOC = 455; const MURO = 372; // zócalo/galería y remate de muros
const AULA = [520, 820]; const GAL = [820, 900];
const techoY = (x) => 340 - ((x - 470) / (960 - 470)) * 40; // alta hacia la galería (x mayor)
const verdes = ['#2f5d2a', '#3f6f2c', '#557f34', '#2b4f27', '#6c8f3a', '#46702e'];
const TANQUE = { x0: 970, x1: 1010, y0: 404, y1: 470 };

function pintarFondo(x) {
  const perfil = new Path2D(); perfil.moveTo(60, suelo(60)); for (let i = 65; i <= 1150; i += 5) perfil.lineTo(i, suelo(i));
  const tierra = new Path2D(perfil); tierra.lineTo(1150, 560); tierra.lineTo(60, 560); tierra.closePath();
  const gr = x.createLinearGradient(0, 460, 0, 560); gr.addColorStop(0, '#9a7a4e'); gr.addColorStop(1, '#3a2a1a'); x.fillStyle = gr; x.fill(tierra);
  x.save(); x.clip(tierra); x.strokeStyle = '#b89a6a'; x.lineWidth = 2; for (let k = 1; k < 4; k++) { x.beginPath(); for (let i = 60; i <= 1150; i += 10) { const y = suelo(i) + 18 + k * 18 + Math.sin(i / 60 + k) * 3; if (i === 60) x.moveTo(i, y); else x.lineTo(i, y); } x.stroke(); } x.restore();
  // árbol de sombra del patio
  { const ax = 250; const ay = suelo(ax); x.strokeStyle = '#5b4330'; x.lineWidth = 7; x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(ax - 6, ay - 60, ax + 4, ay - 92); x.stroke(); x.lineWidth = 4; x.beginPath(); x.moveTo(ax + 2, ay - 70); x.quadraticCurveTo(ax + 30, ay - 90, ax + 52, ay - 110); x.moveTo(ax, ay - 76); x.quadraticCurveTo(ax - 28, ay - 92, ax - 50, ay - 108); x.stroke();
    [[0, -128, 46], [-48, -114, 34], [48, -116, 36], [-22, -150, 32], [26, -148, 30], [-70, -104, 22], [70, -106, 22]].forEach(([a, b, r], i) => { x.fillStyle = ['#5e8f2e', '#6f9d36', '#4f7f28', '#7fae3e'][i % 4]; x.beginPath(); x.ellipse(ax + a, ay + b, r, r * 0.62, 0, 0, 6.283); x.fill(); }); }
  // patio de adoquín, bancas de tronco y banco largo
  for (let px = 120; px < AULA[0] - 10; px += 9) { x.fillStyle = ['#b8653f', '#a8573a', '#c47248'][(px / 9) % 3 | 0]; x.fillRect(px, suelo(px) - 3, 8, 3); }
  [[160, 18], [205, 16], [320, 18], [360, 16]].forEach(([bx, h]) => { x.fillStyle = '#8a6a48'; x.fillRect(bx - 9, suelo(bx) - h, 18, h); x.fillStyle = '#c9a678'; x.fillRect(bx - 9, suelo(bx) - h - 2, 18, 3); });
  x.fillStyle = '#7a5434'; x.fillRect(400, suelo(400) - 14, 70, 12);
  // zócalo de piedra y galería de madera
  x.fillStyle = '#9a8e7c'; x.fillRect(AULA[0] - 6, ZOC, AULA[1] - AULA[0] + 12, suelo(600) - ZOC);
  x.fillStyle = '#7a4a2c'; x.fillRect(GAL[0], ZOC - 2, GAL[1] - GAL[0] + 6, 7); for (let i = 0; i < 4; i++) { x.fillRect(GAL[0] + 6 + i * 24, ZOC + 4, 4, suelo(860) - ZOC - 4); }
  // muros de bloque de tierra (cortados) con ventana
  const bloques = (x0, x1, y0, y1) => { for (let y = y0; y < y1; y += 6.5) for (let bx = x0 + ((Math.round(y) / 6.5) % 2) * 6; bx < x1; bx += 12) { x.fillStyle = ['#c08a5a', '#b37c4e', '#cc9868', '#a87248'][((bx + y) / 6) % 4 | 0]; x.fillRect(bx, y, Math.min(11, x1 - bx), 5.5); } };
  bloques(AULA[0], AULA[0] + 14, MURO, ZOC); bloques(AULA[1] - 14, AULA[1], MURO, ZOC);
  // muro del fondo (visto) con ventanas
  x.globalAlpha = 0.5; bloques(AULA[0] + 14, AULA[1] - 14, MURO, ZOC); x.globalAlpha = 1;
  [[590, 618], [660, 688], [730, 758]].forEach(([a, b]) => { x.fillStyle = '#c7a27a'; x.fillRect(a, 382, b - a, 48); x.strokeStyle = '#7a4a2e'; x.lineWidth = 2.5; x.strokeRect(a, 380, b - a, ZOC - 380); x.beginPath(); x.moveTo(a, 432); x.lineTo(b, 432); x.moveTo(a, 389); x.lineTo(b, 389); x.stroke(); for (let yy = 436; yy < ZOC - 4; yy += 7) for (let xx = a + 3 + ((yy / 7) % 2) * 4; xx < b - 3; xx += 8) { x.fillStyle = '#b37c4e'; x.fillRect(xx, yy, 5, 4); } });
  x.fillStyle = '#9ed4e4'; x.fillRect(AULA[1] - 9, 392, 4, 44);
  // pupitres en corte
  [[560, 0], [640, 0], [720, 0]].forEach(([dx]) => { x.fillStyle = '#8b6440'; x.fillRect(dx, ZOC - 20, 40, 4); x.fillRect(dx + 4, ZOC - 20, 3, 20); x.fillRect(dx + 33, ZOC - 20, 3, 20); x.fillStyle = '#6a4a30'; x.fillRect(dx + 44, ZOC - 14, 14, 3); x.fillRect(dx + 54, ZOC - 28, 3, 28); });
  // pilares embebidos, viga de remate y tornapuntas en V que sostienen la cubierta flotante (sin postes afuera)
  x.fillStyle = '#4a2e1c'; [AULA[0] + 6, AULA[1] - 6].forEach((px) => { x.fillRect(px - 5, MURO - 6, 10, 8); });
  x.strokeStyle = '#4a2e1c'; x.lineWidth = 4;
  [[AULA[0] + 6, -1], [AULA[0] + 6, 1], [AULA[1] - 6, -1], [AULA[1] - 6, 1]].forEach(([px, d]) => { const ex = px + d * 62; x.beginPath(); x.moveTo(px, MURO - 4); x.lineTo(ex, techoY(ex) + 4); x.stroke(); });
  [AULA[0] + 6, AULA[1] - 6].forEach((px) => { x.beginPath(); x.moveTo(px, MURO - 4); x.lineTo(px, techoY(px) + 4); x.stroke(); });
  x.lineWidth = 5; x.beginPath(); x.moveTo(470, techoY(470) + 4); x.lineTo(960, techoY(960) + 4); x.stroke();
  x.fillStyle = '#5a4030'; x.beginPath(); x.moveTo(460, techoY(460) - 2); x.lineTo(970, techoY(970) - 2); x.lineTo(970, techoY(970) - 9); x.lineTo(460, techoY(460) - 9); x.fill();
  for (let px = 462; px < 968; px += 6) { x.fillStyle = (px / 6) % 2 < 1 ? '#7a6a5a' : '#4a3e34'; x.fillRect(px, techoY(px) - 10, 3, 2); }
  // cielo raso claro con luminarias
  x.fillStyle = '#dcc8ac'; x.fillRect(AULA[0] + 14, MURO + 2, AULA[1] - AULA[0] - 28, 4); x.fillStyle = '#fff6e0'; [600, 680, 760].forEach((lx) => x.fillRect(lx, MURO + 6, 24, 3));
  // tanque de lluvia
  x.fillStyle = '#8a9aa2'; x.fillRect(TANQUE.x0, TANQUE.y0, TANQUE.x1 - TANQUE.x0, TANQUE.y1 - TANQUE.y0); for (let y = TANQUE.y0 + 4; y < TANQUE.y1; y += 6) { x.fillStyle = '#6f7f88'; x.fillRect(TANQUE.x0, y, TANQUE.x1 - TANQUE.x0, 2); }
  x.strokeStyle = '#4a5156'; x.lineWidth = 3; x.beginPath(); x.moveTo(966, techoY(966) - 4); x.lineTo(990, TANQUE.y0); x.stroke();
  x.strokeStyle = '#f4f1ea'; x.lineWidth = 3.2; x.stroke(perfil);
}
function pintarPasto(x) {
  const junco = (jx, jy, n, h, w, cols, ancho = 2) => { for (let i = 0; i < n; i++) { const dx = (i / (n - 1) - 0.5) * w; const ho = h * (0.6 + 0.4 * Math.sin(i * 2.3 + jx) ** 2); const cur = (i / (n - 1) - 0.5) * 12; x.strokeStyle = cols[i % cols.length]; x.lineWidth = ancho; x.lineCap = 'round'; x.beginPath(); x.moveTo(jx + dx, jy); x.quadraticCurveTo(jx + dx + cur * 0.3, jy - ho * 0.6, jx + dx + cur, jy - ho); x.stroke(); } };
  // pastizal seco alto a ambos lados
  for (let jx = 66; jx < 118; jx += 7) junco(jx, suelo(jx) - 2, 6, 34 + (jx % 5) * 3, 10, ['#7fae36', '#5e9a2c', '#9cc44a', '#4f8a28']);
  for (let jx = 1020; jx < 1146; jx += 7) junco(jx, suelo(jx) - 2, 6, 34 + (jx % 5) * 3, 10, ['#7fae36', '#5e9a2c', '#9cc44a', '#4f8a28']);
  for (let jx = 905; jx < 965; jx += 9) junco(jx, suelo(jx) - 2, 5, 22, 8, ['#6ca63c', '#8fbf48']);
}

const ruta = (pts) => { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], L, d]); L += d; } return { en: (u) => { const s = ((u % 1) + 1) % 1 * L; for (const [a, b, l0, d] of seg) if (s <= l0 + d) { const k = (s - l0) / d; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } return pts[pts.length - 1]; } }; };
const VIENTO = [
  ruta([[70, 430], [500, 428], [600, 414], [700, 414], [880, 420], [1150, 424]]),
  ruta([[560, 440], [620, 400], [680, 372], [740, 360], [860, 340], [980, 330], [1150, 320]]),
  ruta([[70, 380], [470, 366], [700, 362], [960, 352], [1150, 346]]),
];
const AGUA = ruta([[480, techoY(480) - 12], [964, techoY(964) - 12], [990, TANQUE.y0]]);
const GOTAS = Array.from({ length: 170 }, (_, i) => ({ x: 70 + ((i * 97.13) % 1080), f: (i * 0.618) % 1, v: 0.8 + ((i * 7) % 5) * 0.08 }));
const lluvia = (t) => { const c = (t % 18) / 18; return clamp(Math.sin(Math.PI * clamp((c - 0.08) / 0.5, 0, 1)) * 1.4, 0, 1); };
const superficie = (x) => (x > 460 && x < 970 ? techoY(x) - 10 : suelo(x) - 2);
function animar(cx, t, punto) {
  const ll = lluvia(t);
  const nivel = TANQUE.y1 - 6 - (TANQUE.y1 - TANQUE.y0 - 12) * (0.3 + 0.5 * clamp((t % 18) / 12, 0, 1) * (t % 18 < 12 ? 1 : (18 - (t % 18)) / 6));
  cx.fillStyle = '#4fb0c6'; for (let x = TANQUE.x0 + 4; x < TANQUE.x1 - 3; x += 3.2) for (let y = nivel; y < TANQUE.y1 - 3; y += 3.2) { cx.globalAlpha = 0.6; punto(cx, x, y, 0.9); }
  cx.fillStyle = '#ffd9a0'; VIENTO.forEach((r, k) => { for (let i = 0; i < 44; i++) { const u = (t * (0.05 + k * 0.012) + i / 44) % 1; const [px, py] = r.en(u); const cola = Math.sin(u * Math.PI); cx.globalAlpha = 0.15 + 0.45 * cola; punto(cx, px, py + Math.sin(t * 3 + i) * 1.2, 1.1 + cola * 0.6); } });
  if (ll > 0.02) {
    cx.fillStyle = '#bfe6f2'; for (const g of GOTAS) { const y = 40 + ((t * 240 * g.v + g.f * 600) % 600); if (y > superficie(g.x)) continue; cx.globalAlpha = 0.6 * ll; cx.fillRect(g.x, y, 1.1, 6); }
    cx.fillStyle = '#7fd3ea'; for (let i = 0; i < 40; i++) { const [px, py] = AGUA.en((t * 0.16 + i / 40) % 1); cx.globalAlpha = 0.85 * ll; punto(cx, px, py, 1.3); }
  }
  // sombra que arroja la cubierta
  cx.fillStyle = '#000'; cx.globalAlpha = 0.12; cx.fillRect(480, ZOC - 2, 520, 12); cx.globalAlpha = 1;
}

function pintarAbeja(x) { x.translate(4, 6); x.fillStyle = 'rgba(220,232,240,0.85)'; x.beginPath(); x.ellipse(12, -4, 8, 4, -0.4, 0, 6.283); x.fill(); x.fillStyle = '#1e1c22'; x.beginPath(); x.ellipse(12, 4, 11, 6.5, 0, 0, 6.283); x.fill(); x.fillStyle = '#e8c23a'; x.beginPath(); x.ellipse(6, 3, 4.5, 5, 0, 0, 6.283); x.fill(); }
const ESPECIES = [
  { id: 'albaVuelo', src: 'alba_vuelo', w: 140, mira: -1, anc: 'centro', sci: 'Ardea alba', aleteo: 0.3, mov: (t) => { const x = 1300 - ((t * 32 + 800) % 1500); return { x, y: 160 - Math.sin(t * 0.6) * 20, dir: -1, fase: t * 4.2 }; } },
  { id: 'tirano', url: 'datos/tramas/16798.png', w: 46, mira: -1, anc: 'centro', sci: 'Tyrannus dominicensis', aleteo: 0.25, mov: (t) => { const salida = Math.max(0, Math.sin(t * 0.5)); return { x: 250 + Math.sin(t * 0.9) * 50 * salida, y: suelo(250) - 160 - salida * 40, dir: Math.cos(t * 0.9) > 0 ? 1 : -1, fase: t * (salida > 0.2 ? 14 : 2) }; } },
  { id: 'tangara', url: 'datos/tramas/10295.png', w: 44, mira: 1, anc: 'centro', sci: 'Thraupis episcopus', aleteo: 0.22, mov: (t) => ({ x: 230 + Math.sin(t * 0.7) * 50, y: suelo(250) - 120 + Math.sin(t * 1.1) * 12, dir: Math.cos(t * 0.7) > 0 ? 1 : -1, fase: t * 12 }) },
  { id: 'iguana', pintar: (x) => { x.translate(52, 12); x.fillStyle = '#5f9b3a'; x.fill(new Path2D('M0,0 C6,-6 18,-7 27,-4 L36,-5 C39,-4 39,-1 36,0 L27,1 C18,4 8,4 0,2 C-14,2 -32,4 -50,9 C-32,1 -14,-1 0,0Z')); x.strokeStyle = '#4f8530'; x.lineWidth = 2.2; x.lineCap = 'round'; x.stroke(new Path2D('M22,2 L25,8 L28,9 M6,3 L3,9 L0,10 M20,-3 L23,3 M2,1 L-2,7')); }, cw: 92, ch: 26, w: 100, mira: 1, anc: 'pie', sci: 'Iguana iguana', mov: (t) => { const v = vaiven(t, 1030, 1130, 6, 30); return { x: v.x, y: suelo(v.x) - 2, dir: v.dir, paso: Math.sin(t * 5) * 0.6 }; } },
  { id: 'abeja', pintar: pintarAbeja, cw: 30, ch: 20, w: 28, mira: -1, anc: 'centro', sci: 'Xylocopa', aleteo: 0.15, mov: (t) => ({ x: 120 + Math.sin(t * 1.3) * 30, y: suelo(120) - 46 + Math.sin(t * 1.9) * 10, dir: Math.cos(t * 1.3) > 0 ? -1 : 1, fase: t * 40 }) },
  { id: 'monarca', src: 'monarca', w: 42, mira: 1, anc: 'centro', sci: 'Danaus plexippus', mariposa: true, mov: (t) => ({ x: 400 + Math.sin(t * 0.55) * 80, y: suelo(400) - 70 + Math.sin(t * 1.3) * 18, dir: Math.cos(t * 0.55) > 0 ? 1 : -1, fase: t * 16 }) },
];
const INAT_OBS = 'iNaturalist (observaciones ciudadanas con interacción)';
const INTERACCIONES = {
  tirano: { a: 'tirano', b: 'iguana', modo: 'acompana', tipo: 'Mutualismo y simbiosis', A: ['Tirano gris', 'Tyrannus dominicensis'], B: ['Iguana verde', 'Iguana iguana'], texto: 'Asociación registrada entre el tirano gris y la iguana verde: el ave acompaña a la iguana en el pastizal del colegio.', fuente: 'Poelen 2014, asociaciones extraídas de literatura' },
  iguana: { a: 'tirano', b: 'iguana', modo: 'acompana', tipo: 'Mutualismo y simbiosis', A: ['Tirano gris', 'Tyrannus dominicensis'], B: ['Iguana verde', 'Iguana iguana'], texto: 'Asociación registrada entre el tirano gris y la iguana verde: el ave acompaña a la iguana en el pastizal del colegio.', fuente: 'Poelen 2014, asociaciones extraídas de literatura' },
  albaVuelo: { a: 'albaVuelo', b: 'iguana', modo: 'caza', vuela: true, tipo: 'Depredación', A: ['Garza blanca', 'Ardea alba'], B: ['Iguana verde', 'Iguana iguana'], texto: 'La garza blanca baja al pastizal a cazar iguanas jóvenes, que huyen entre el pasto seco.', fuente: `${INAT_OBS}; Vlad et al. 2022, iguana en Islas Caimán` },
  tangara: { es: 'Tangara azulgrís', sci: 'Thraupis episcopus' },
  abeja: { es: 'Abeja carpintera', sci: 'Xylocopa' },
  monarca: { es: 'Mariposa monarca', sci: 'Danaus plexippus' },
};
const ROTULOS = [];
function Overlay() {
  const t = (x, y, s, o = {}) => <text x={x} y={y} fill="#e8eef0" fontSize="11.5" fontFamily="Geist Mono, monospace" letterSpacing="0.6" {...o}>{s}</text>;
  return (
    <>
      {t(AULA[0] + 70, 452, 'AULA')}{t(GAL[0] + 4, 448, 'GALERÍA', { fill: '#e9c08a' })}{t(150, 492, 'PATIO DE ADOQUÍN · BANCAS DE TRONCO', { fontSize: '10.5' })}
      {t(520, 290, 'CUBIERTA FLOTANTE SOBRE TORNAPUNTAS DE MADERA EN V', { fill: '#e9c08a', fontSize: '11' })}{t(540, 344, 'el aire caliente sale bajo la cubierta →', { fill: '#ffd9a0', fontSize: '10.5' })}
      {t(AULA[0] + 6, 366, 'MURO DE BLOQUE DE TIERRA COMPRIMIDA (BTC)', { fill: '#e8a27a', fontSize: '10.5' })}{t(990, 398, 'TANQUE DE LLUVIA', { textAnchor: 'middle', fill: '#7fd8ee', fontSize: '10.5' })}
      {t(80, 400, 'VENTILACIÓN CRUZADA →', { fill: '#ffd9a0' })}{t(590, 478, 'celosía baja + ventana alta', { fill: '#e8a27a', fontSize: '10' })}{t(70, 524, 'PRADERA', { fontSize: '10.5', fillOpacity: '0.8' })}{t(250, 300, 'ÁRBOL DE SOMBRA', { textAnchor: 'middle', fontSize: '10.5' })}
    </>
  );
}

export const corteColegio = {
  id: 'colegio', suelo, cotas: [], pintarFondo, pintarPasto, animar, especies: ESPECIES, pie: { iguana: (x) => suelo(x) - 2 }, interacciones: INTERACCIONES, rotulos: ROTULOS,
  rangos: { iguana: [1020, 1140] }, superficie: 9999, ecotonos: [],
  Overlay, aria: 'Corte del colegio de Tierra Bomba dibujado con puntos: aula de bloque de tierra comprimida, galería de madera, cubierta flotante sobre cerchas, tanque de lluvia y patio de adoquín con árbol de sombra, con viento, lluvia y especies en movimiento',
};
