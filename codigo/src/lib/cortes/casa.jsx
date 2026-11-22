import React from 'react';
import { clamp, vaiven } from '../../components/CorteVivo.jsx';

// Corte de la vivienda modular (sección 10): cinco módulos de 3,6 m sobre la meseta (+22 m), zaguán
// abierto al centro, cubiertas inclinadas con ventana alta, celosía de ladrillo, paneles solares y
// captación de lluvia hacia una cisterna que rebosa al humedal. Animados: viento cruzado, efecto
// chimenea, lluvia, escorrentía del techo y nivel de la cisterna.
export const suelo = (x) => 470 + Math.sin(x / 70) * 1.5;
const PISO = 458; const TECHO = 380; const M = 93.6; const X0 = 342; // 1 m ≈ 26 u
const mod = (i) => X0 + i * M;
// cubierta A (sala): alta a la izquierda ; cubierta B (dormitorios): alta hacia el zaguán
const techoA = (x) => 340 + ((x - 310) / (545 - 310)) * 32; // 310→340 ... 545→372
const techoB = (x) => 318 + ((x - 605) / (850 - 605)) * 52; // 605→318 ... 850→370
const verdes = ['#2f5d2a', '#3f6f2c', '#557f34', '#2b4f27', '#6c8f3a', '#46702e'];
const CIS = { x0: 650, x1: 790, y0: 488, y1: 540 };

function pintarFondo(x) {
  const perfil = new Path2D(); perfil.moveTo(60, suelo(60)); for (let i = 65; i <= 1150; i += 5) perfil.lineTo(i, suelo(i));
  const tierra = new Path2D(perfil); tierra.lineTo(1150, 560); tierra.lineTo(60, 560); tierra.closePath();
  const gr = x.createLinearGradient(0, 460, 0, 560); gr.addColorStop(0, '#8a7350'); gr.addColorStop(1, '#3a2d1e'); x.fillStyle = gr; x.fill(tierra);
  x.save(); x.clip(tierra); x.strokeStyle = '#b39a6c'; x.lineWidth = 2; for (let k = 1; k < 4; k++) { x.beginPath(); for (let i = 60; i <= 1150; i += 10) { const y = suelo(i) + 18 + k * 18 + Math.sin(i / 60 + k) * 3; if (i === 60) x.moveTo(i, y); else x.lineTo(i, y); } x.stroke(); }
  // cisterna de lluvia enterrada
  x.fillStyle = '#20282c'; x.fillRect(CIS.x0, CIS.y0, CIS.x1 - CIS.x0, CIS.y1 - CIS.y0); x.strokeStyle = '#a9b3b8'; x.lineWidth = 4; x.strokeRect(CIS.x0, CIS.y0, CIS.x1 - CIS.x0, CIS.y1 - CIS.y0); x.restore();
  // árboles: grandes al fondo, mangle botoncillo, papaya y algodoncillo
  const copa = (cx, cy, r, cols) => { [[0, -1.55, 0.8], [-0.6, -1.25, 0.62], [0.62, -1.28, 0.66], [-0.25, -2.0, 0.6], [0.35, -1.95, 0.58], [0, -1.2, 0.6]].forEach(([dx, dy, kk], i) => { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(cx + dx * r, cy + dy * r, kk * r, 0, 6.283); x.fill(); }); x.fillStyle = '#5b4330'; x.fillRect(cx - 3, cy - r * 1.2, 6, r * 1.2); };
  copa(110, suelo(110), 86, verdes); copa(1140, suelo(1140), 80, verdes.slice().reverse());
  { const ax = 220; const ay = suelo(ax) - 2; x.fillStyle = '#6a4a30'; x.fillRect(ax - 2, ay - 60, 4, 60); [[0, -80, 22], [-18, -68, 16], [18, -70, 17], [-8, -96, 15], [10, -94, 15]].forEach(([a, b, r], i) => { x.fillStyle = ['#3c6e2e', '#4f8236', '#2f5a28'][i % 3]; x.beginPath(); x.arc(ax + a, ay + b, r, 0, 6.283); x.fill(); }); }
  { const px = 1000; const py = suelo(px); x.strokeStyle = '#8c7a58'; x.lineWidth = 4; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 3, py - 110); x.stroke(); for (let k = 0; k < 9; k++) { const a = -Math.PI + (k / 8) * Math.PI; x.strokeStyle = '#4f8a34'; x.lineWidth = 2; x.beginPath(); x.moveTo(px + 3, py - 110); x.quadraticCurveTo(px + 3 + Math.cos(a) * 18, py - 110 + Math.sin(a) * 22 - 8, px + 3 + Math.cos(a) * 34, py - 102 + Math.sin(a) * 12); x.stroke(); x.fillStyle = '#5c9a3c'; x.beginPath(); x.ellipse(px + 3 + Math.cos(a) * 34, py - 102 + Math.sin(a) * 12, 7, 4, a, 0, 6.283); x.fill(); } [[-4, -100], [5, -98], [0, -94], [8, -92], [-6, -92]].forEach(([dx, dy], i) => { x.fillStyle = i % 2 ? '#e0a23a' : '#8fae3a'; x.beginPath(); x.ellipse(px + dx, py + dy, 3.4, 5, 0, 0, 6.283); x.fill(); }); }
  { const ax = 1090; const ay = suelo(ax); x.strokeStyle = '#7d8f5a'; x.lineWidth = 2; [-8, -3, 3, 8].forEach((d) => { x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(ax + d * 0.6, ay - 14, ax + d, ay - 24); x.stroke(); }); [[-9, -24, 7], [-2, -30, 8], [7, -26, 7], [0, -20, 7], [10, -18, 5], [-10, -16, 5]].forEach(([dx, dy, r2], i) => { x.fillStyle = ['#8fae7a', '#a3be8c', '#7f9f6c'][i % 3]; x.beginPath(); x.ellipse(ax + dx, ay + dy, r2, r2 * 0.6, 0.3, 0, 6.283); x.fill(); }); [[-4, -36], [4, -34], [-11, -30], [10, -31]].forEach(([dx, dy]) => { x.fillStyle = '#d8c4f0'; x.beginPath(); x.arc(ax + dx, ay + dy, 2.6, 0, 6.283); x.fill(); }); }
  // celosía de ladrillo (fachada de dormitorios, vista más allá del corte)
  for (let j = 0; j < 9; j++) for (let i = 0; i < 18; i++) { const bx = 636 + i * 9.6 + (j % 2) * 4.8; const by = TECHO + 4 + j * 8.6; if (bx > 800) continue; x.fillStyle = ['#b8653f', '#a8573a', '#c47248'][(i + j) % 3]; x.fillRect(bx, by, 6, 4); }
  // deck y piso de madera
  x.fillStyle = '#b8895a'; x.fillRect(250, PISO, 710, suelo(600) - PISO); x.fillStyle = '#d6a66c'; x.fillRect(250, PISO - 2, 710, 3);
  // muebles en corte
  x.fillStyle = '#cfc4b2'; x.fillRect(372, PISO - 18, 46, 18); x.fillRect(372, PISO - 30, 10, 12); // sofá
  x.fillStyle = '#8b6440'; x.fillRect(452, PISO - 22, 52, 4); x.fillRect(456, PISO - 22, 3, 22); x.fillRect(497, PISO - 22, 3, 22); // comedor
  x.fillStyle = '#e6e2da'; x.fillRect(660, PISO - 16, 70, 12); x.fillStyle = '#7a6a58'; x.fillRect(660, PISO - 30, 6, 26); // cama
  x.fillStyle = '#d9c9a8'; x.fillRect(560, PISO - 14, 34, 14); // banca del zaguán
  // muros cortados y vidrios
  x.fillStyle = '#efe6d6'; [[mod(3), 8], [mod(5) - 4, 8]].forEach(([wx, w]) => x.fillRect(wx - w / 2, TECHO, w, PISO - TECHO));
  x.fillStyle = '#9ed4e4'; [mod(0), mod(2)].forEach((gx) => { x.fillRect(gx - 1.5, TECHO, 3, PISO - TECHO); }); x.fillStyle = '#3a332c'; [mod(0), mod(2)].forEach((gx) => { x.fillRect(gx - 3, TECHO, 6, 4); x.fillRect(gx - 3, PISO - 4, 6, 4); });
  // ventana alta (efecto chimenea) y vidrio lateral de dormitorios
  x.fillStyle = '#9ed4e4'; x.fillRect(mod(3) - 1.5, techoB(mod(3)) + 4, 3, TECHO - techoB(mod(3)) - 4); x.fillRect(mod(5) + 6 - 1.5, 396, 3, 40);
  // cielo rasos y cubiertas con canto de madera
  const cubierta = (a, b, f, lam = '#3d3a36') => { x.fillStyle = lam; x.beginPath(); x.moveTo(a, f(a) - 8); x.lineTo(b, f(b) - 8); x.lineTo(b, f(b)); x.lineTo(a, f(a)); x.fill(); x.strokeStyle = '#c9935a'; x.lineWidth = 3; x.beginPath(); x.moveTo(a, f(a) + 1); x.lineTo(b, f(b) + 1); x.stroke(); };
  cubierta(310, 545, techoA); cubierta(605, 850, techoB);
  x.fillStyle = '#efe6d6'; x.beginPath(); x.moveTo(mod(0), techoA(mod(0))); x.lineTo(mod(2), techoA(mod(2))); x.lineTo(mod(2), TECHO); x.lineTo(mod(0), TECHO); x.closePath(); x.globalAlpha = 0.35; x.fill(); x.globalAlpha = 1;
  // pérgola del zaguán
  x.fillStyle = '#c9935a'; x.fillRect(mod(2) - 4, TECHO - 4, M + 8, 6); for (let i = 0; i < 9; i++) { x.fillRect(mod(2) + 4 + i * 10.4, TECHO - 9, 4, 5); }
  // columnas del pórtico
  x.fillStyle = '#efe6d6'; [mod(2) - 2, mod(5) + 22].forEach((cx0) => x.fillRect(cx0 - 5, TECHO - 4, 10, PISO - TECHO + 4));
  // paneles solares sobre la cubierta B
  for (let i = 0; i < 7; i++) { const a = 640 + i * 28; const b = a + 24; x.fillStyle = '#23409a'; x.beginPath(); x.moveTo(a, techoB(a) - 10); x.lineTo(b, techoB(b) - 10); x.lineTo(b, techoB(b) - 15); x.lineTo(a, techoB(a) - 15); x.fill(); }
  // bajante y tubería a la cisterna
  x.strokeStyle = '#4a5156'; x.lineWidth = 4; x.beginPath(); x.moveTo(852, techoB(850) - 2); x.lineTo(856, techoB(850) + 4); x.lineTo(856, 498); x.lineTo(CIS.x1, 498); x.stroke();
  x.beginPath(); x.moveTo(CIS.x0 + 10, CIS.y1); x.lineTo(CIS.x0 + 10, 548); x.lineTo(1150, 548); x.stroke();
  x.strokeStyle = '#f4f1ea'; x.lineWidth = 3.2; x.stroke(perfil);
}
function pintarPasto(x) {
  const junco = (jx, jy, n, h, w, cols, ancho = 2) => { for (let i = 0; i < n; i++) { const dx = (i / (n - 1) - 0.5) * w; const ho = h * (0.6 + 0.4 * Math.sin(i * 2.3 + jx) ** 2); const cur = (i / (n - 1) - 0.5) * 12; x.strokeStyle = cols[i % cols.length]; x.lineWidth = ancho; x.lineCap = 'round'; x.beginPath(); x.moveTo(jx + dx, jy); x.quadraticCurveTo(jx + dx + cur * 0.3, jy - ho * 0.6, jx + dx + cur, jy - ho); x.stroke(); } };
  x.fillStyle = '#7fae36'; [[60, 250], [960, 1150]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, suelo(a) - 5); for (let i = a; i <= b; i += 5) x.lineTo(i, suelo(i) - 6); for (let i = b; i >= a; i -= 5) x.lineTo(i, suelo(i) + 1); x.fill(); });
  for (let jx = 66; jx < 248; jx += 11) junco(jx, suelo(jx) - 5, 4, 9 + (jx % 3) * 3, 7, ['#b5d334', '#8fb33a', '#c9e05a']);
  for (let jx = 966; jx < 1146; jx += 11) junco(jx, suelo(jx) - 5, 4, 9 + (jx % 3) * 3, 7, ['#b5d334', '#8fb33a', '#c9e05a']);
  // jardinera del deck
  junco(895, PISO - 2, 9, 18, 16, ['#4f8a34', '#6ca63c', '#3f7a2c']);
}

// animaciones propias: viento cruzado, efecto chimenea, lluvia, escorrentía y cisterna
const ruta = (pts) => { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], L, d]); L += d; } return { seg, L, en: (u) => { const s = ((u % 1) + 1) % 1 * L; for (const [a, b, l0, d] of seg) if (s <= l0 + d) { const k = (s - l0) / d; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } return pts[pts.length - 1]; } }; };
const VIENTO = [
  ruta([[70, 430], [mod(0) + 10, 430], [mod(2) + 40, 420], [mod(4), 418], [mod(5) + 10, 416], [1150, 412]]),
  ruta([[70, 408], [mod(2) + 10, 402], [mod(3) - 20, 400], [mod(3) + 60, 404], [mod(4) + 20, 392], [mod(3) + 20, 356], [mod(3) - 10, 330], [560, 280], [480, 220]]),
  ruta([[70, 444], [mod(1), 446], [mod(2) + 20, 440], [mod(4) + 40, 440], [1150, 436]]),
];
const AGUA_TECHO = ruta([[612, techoB(612) - 13], [848, techoB(848) - 12], [856, techoB(850) + 6], [856, 498], [CIS.x1 - 4, 498]]);
const GOTAS = Array.from({ length: 180 }, (_, i) => ({ x: 70 + ((i * 97.13) % 1080), f: (i * 0.618) % 1, v: 0.8 + ((i * 7) % 5) * 0.08 }));
const lluvia = (t) => { const c = (t % 18) / 18; return clamp(Math.sin(Math.PI * clamp((c - 0.08) / 0.5, 0, 1)) * 1.4, 0, 1); };
const superficie = (x) => { if (x > 310 && x < 545) return techoA(x) - 8; if (x > 605 && x < 850) return techoB(x) - 15; if (x > mod(2) - 4 && x < mod(3) + 4) return TECHO - 9; return suelo(x) - 2; };
function animar(cx, t, punto) {
  const ll = lluvia(t);
  // cisterna: el nivel sube con la lluvia
  const nivel = CIS.y1 - 10 - (CIS.y1 - CIS.y0 - 18) * (0.35 + 0.45 * clamp((t % 18) / 12, 0, 1) * (t % 18 < 12 ? 1 : (18 - (t % 18)) / 6));
  cx.fillStyle = '#4fb0c6';
  for (let x = CIS.x0 + 4; x < CIS.x1 - 2; x += 3.2) for (let y = nivel; y < CIS.y1 - 3; y += 3.2) { cx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 2 + x * 0.3 + y); punto(cx, x, y + Math.sin(x * 0.08 + t * 2) * (y - nivel < 4 ? 1.2 : 0), 0.95); }
  // viento
  cx.fillStyle = '#e8f4f8';
  VIENTO.forEach((r, k) => { for (let i = 0; i < 46; i++) { const u = (t * (0.055 + k * 0.01) + i / 46) % 1; const [px, py] = r.en(u); const cola = Math.sin(u * Math.PI); cx.globalAlpha = 0.18 + 0.5 * cola; punto(cx, px, py + Math.sin(t * 3 + i) * 1.2, 1.1 + cola * 0.6); } });
  // lluvia y escorrentía del techo hacia la cisterna
  if (ll > 0.02) {
    cx.fillStyle = '#bfe6f2';
    for (const g of GOTAS) { const caida = ((t * 240 * g.v + g.f * 600) % 600); const y = 40 + caida; const tope = superficie(g.x); if (y > tope) continue; cx.globalAlpha = 0.6 * ll; cx.fillRect(g.x, y, 1.1, 6); }
    cx.fillStyle = '#7fd3ea'; for (let i = 0; i < 40; i++) { const [px, py] = AGUA_TECHO.en((t * 0.18 + i / 40) % 1); cx.globalAlpha = 0.85 * ll; punto(cx, px, py, 1.3); }
  }
  // brillos del sol en los paneles
  cx.fillStyle = '#ffffff'; for (let i = 0; i < 7; i++) { const a = 640 + i * 28 + 12; const b = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 1.7); if (b < 0.85) continue; cx.globalAlpha = (b - 0.85) * 6; punto(cx, a, techoB(a) - 13, 2); }
  cx.globalAlpha = 1;
}

function pintarAbeja(x) { x.translate(4, 6); x.fillStyle = 'rgba(220,232,240,0.85)'; x.beginPath(); x.ellipse(12, -4, 8, 4, -0.4, 0, 6.283); x.fill(); x.fillStyle = '#1e1c22'; x.beginPath(); x.ellipse(12, 4, 11, 6.5, 0, 0, 6.283); x.fill(); x.fillStyle = '#e8c23a'; x.beginPath(); x.ellipse(6, 3, 4.5, 5, 0, 0, 6.283); x.fill(); x.fillStyle = '#2a2830'; x.beginPath(); x.arc(0, 4, 4, 0, 6.283); x.fill(); }
const ESPECIES = [
  { id: 'albaVuelo', src: 'alba_vuelo', w: 140, mira: -1, anc: 'centro', sci: 'Ardea alba', aleteo: 0.3, mov: (t) => { const x = 1300 - ((t * 32 + 300) % 1500); return { x, y: 170 - Math.sin(t * 0.6) * 20, dir: -1, fase: t * 4.2 }; } },
  { id: 'tirano', url: 'datos/tramas/16798.png', w: 46, mira: -1, anc: 'centro', sci: 'Tyrannus dominicensis', aleteo: 0.25, mov: (t) => { const salida = Math.max(0, Math.sin(t * 0.5)); const x = 220 + Math.sin(t * 0.9) * 30 * salida + Math.sin(t * 2.3) * 4; return { x, y: suelo(220) - 104 - salida * 40 + Math.sin(t * 6) * 2 * salida, dir: Math.cos(t * 0.9) > 0 ? 1 : -1, fase: t * (salida > 0.2 ? 14 : 2) }; } },
  { id: 'tangara', url: 'datos/tramas/10295.png', w: 44, mira: 1, anc: 'centro', sci: 'Thraupis episcopus', aleteo: 0.22, mov: (t) => ({ x: 1003 + Math.sin(t * 0.7) * 30 + Math.sin(t * 2.1) * 6, y: suelo(1000) - 124 + Math.sin(t * 1.1) * 12, dir: Math.cos(t * 0.7) > 0 ? 1 : -1, fase: t * 12 }) },
  { id: 'iguana', pintar: (x) => { x.translate(52, 12); x.fillStyle = '#5f9b3a'; x.fill(new Path2D('M0,0 C6,-6 18,-7 27,-4 L36,-5 C39,-4 39,-1 36,0 L27,1 C18,4 8,4 0,2 C-14,2 -32,4 -50,9 C-32,1 -14,-1 0,0Z')); x.strokeStyle = '#8fc05a'; x.lineWidth = 1.2; x.stroke(new Path2D('M6,-5 l2,-4 l2,4 M12,-6 l2,-4 l2,4 M18,-6 l2,-3 l2,3')); x.strokeStyle = '#4f8530'; x.lineWidth = 2.2; x.lineCap = 'round'; x.stroke(new Path2D('M22,2 L25,8 L28,9 M6,3 L3,9 L0,10 M20,-3 L23,3 M2,1 L-2,7')); }, cw: 92, ch: 26, w: 104, mira: 1, anc: 'pie', sci: 'Iguana iguana', inclina: true, mov: (t) => { const v = vaiven(t, 970, 1120, 6, 30); return { x: v.x, y: suelo(v.x) - 2, dir: v.dir, paso: Math.sin(t * 5) * 0.6 }; } },
  { id: 'abeja', pintar: pintarAbeja, cw: 30, ch: 20, w: 28, mira: -1, anc: 'centro', sci: 'Xylocopa', aleteo: 0.15, mov: (t) => ({ x: 1090 + Math.sin(t * 1.3) * 26 + Math.sin(t * 4.7) * 4, y: suelo(1090) - 50 + Math.sin(t * 1.9) * 10, dir: Math.cos(t * 1.3) > 0 ? -1 : 1, fase: t * 40 }) },
  { id: 'monarca', src: 'monarca', w: 42, mira: 1, anc: 'centro', sci: 'Danaus plexippus', mariposa: true, mov: (t) => ({ x: 1060 + Math.sin(t * 0.55) * 60, y: suelo(1060) - 90 + Math.sin(t * 1.3) * 18, dir: Math.cos(t * 0.55) > 0 ? 1 : -1, fase: t * 16 }) },
];
const INAT_OBS = 'iNaturalist (observaciones ciudadanas con interacción)';
const CALO = { x: 1090, y: suelo(1090) - 30, es: 'Algodoncillo gigante', sci: 'Calotropis procera' };
const INTERACCIONES = {
  tirano: { a: 'tirano', b: { x: 220, y: suelo(220) - 92, es: 'Mangle botoncillo', sci: 'Conocarpus erectus' }, modo: 'visita', tipo: 'Refugio y hábitat', A: ['Tirano gris', 'Tyrannus dominicensis'], B: ['Mangle botoncillo', 'Conocarpus erectus'], texto: 'El tirano gris se posa y anida en el mangle botoncillo del jardín; desde sus ramas sale a cazar insectos al vuelo.', fuente: INAT_OBS },
  iguana: { a: 'tirano', b: 'iguana', modo: 'acompana', tipo: 'Mutualismo y simbiosis', A: ['Tirano gris', 'Tyrannus dominicensis'], B: ['Iguana verde', 'Iguana iguana'], texto: 'Asociación registrada entre la iguana verde y el tirano gris: el ave acompaña a la iguana en el prado.', fuente: 'Poelen 2014, asociaciones extraídas de literatura' },
  tangara: { a: 'tangara', b: { x: 1003, y: suelo(1000) - 100, es: 'Papaya', sci: 'Carica papaya' }, modo: 'visita', tipo: 'Frugivoría', A: ['Tangara azulgrís', 'Thraupis episcopus'], B: ['Papaya', 'Carica papaya'], texto: 'La tangara azulgrís come papayas maduras en el patio y dispersa sus semillas.', fuente: 'Bello et al. 2017, frugivoría en la Mata Atlántica' },
  abeja: { a: 'abeja', b: CALO, modo: 'visita', tipo: 'Visita floral', A: ['Abeja carpintera', 'Xylocopa'], B: ['Algodoncillo gigante', 'Calotropis procera'], texto: 'La abeja carpintera visita y poliniza las flores del algodoncillo gigante del jardín.', fuente: `${INAT_OBS}; Ollerton et al. 2019, polinizadores de Apocynaceae` },
  monarca: { a: 'monarca', b: CALO, modo: 'visita', tipo: 'Planta hospedera', A: ['Mariposa monarca', 'Danaus plexippus'], B: ['Algodoncillo gigante', 'Calotropis procera'], texto: 'La monarca pone sus huevos en el algodoncillo gigante: sus orugas comen sus hojas y los adultos visitan sus flores.', fuente: `${INAT_OBS}; Ferrer-Paris et al. 2013; NHM Interactions Bank; HOSTS (NHM Londres)` },
  albaVuelo: { a: 'albaVuelo', b: 'iguana', modo: 'caza', vuela: true, tipo: 'Depredación', A: ['Garza blanca', 'Ardea alba'], B: ['Iguana verde', 'Iguana iguana'], texto: 'La garza blanca baja al prado a cazar iguanas jóvenes, que huyen hacia el algodoncillo.', fuente: `${INAT_OBS}; Vlad et al. 2022, iguana en Islas Caimán` },
};
const ROTULOS = [
  [220, suelo(220) - 124, 'Conocarpus erectus', 'middle'], [1003, suelo(1000) - 150, 'Carica papaya', 'middle'], [1090, suelo(1090) - 46, 'Calotropis procera', 'middle'],
];
function Overlay() {
  const t = (x, y, s, o = {}) => <text x={x} y={y} fill="#e8eef0" fontSize="11.5" fontFamily="Geist Mono, monospace" letterSpacing="0.6" {...o}>{s}</text>;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line x1={mod(i)} y1="292" x2={mod(i)} y2="302" stroke="#ff8a6a" strokeWidth="1.2" />
          <text x={mod(i) + M / 2} y="298" textAnchor="middle" fill="#ff8a6a" fontSize="11" fontFamily="Geist Mono, monospace">M{i + 1} · 3,6 m</text>
        </g>
      ))}
      <line x1={mod(5)} y1="292" x2={mod(5)} y2="302" stroke="#ff8a6a" strokeWidth="1.2" /><line x1={mod(0)} y1="297" x2={mod(5)} y2="297" stroke="#ff8a6a" strokeWidth="0.6" strokeDasharray="3 3" />
      {t(mod(0) + 6, 430, 'SALA · COMEDOR')}{t(mod(2) + M / 2, 448, 'ZAGUÁN', { textAnchor: 'middle', fill: '#e9c08a' })}{t(mod(3) + 10, 430, 'DORMITORIOS')}
      {t(640, 268, 'PANELES SOLARES', { fill: '#9fb7ff' })}{t(470, 250, 'EFECTO CHIMENEA ↖', { fill: '#cfe9f2' })}{t(80, 400, 'VENTILACIÓN CRUZADA →', { fill: '#cfe9f2' })}
      {t(CIS.x0 + 70, CIS.y1 + 16, 'CISTERNA DE LLUVIA', { textAnchor: 'middle', fill: '#7fd8ee' })}{t(1146, 542, 'rebose → humedal (09)', { textAnchor: 'end', fill: '#7fd8ee', fontSize: '10.5' })}
      {t(640, 372, 'CELOSÍA DE LADRILLO', { fill: '#e8a27a', fontSize: '10.5' })}{t(255, 490, 'DECK +0,45 m · MESETA +22 m', { fontSize: '10.5', fillOpacity: '0.8' })}
      {/* replicabilidad: el módulo se repite en hilera o en L */}
      <g transform="translate(905,70)">
        {t(0, 0, 'REPLICABLE', { fill: '#ff8a6a', fontSize: '11' })}
        {[[0, 14, 1], [0, 34, 3], [0, 54, 5]].map(([x0, y0, n]) => <g key={y0}>{Array.from({ length: n }, (_, i) => <rect key={i} x={x0 + i * 14} y={y0} width="12" height="12" fill="none" stroke="#e8eef0" strokeOpacity="0.75" />)}<text x={x0 + n * 14 + 6} y={y0 + 10} fill="#e8eef0" fillOpacity="0.7" fontSize="10" fontFamily="Geist Mono, monospace">{n} mód.</text></g>)}
        <g>{[[90, 14], [104, 14], [118, 14], [90, 28], [90, 42]].map(([a, b], i) => <rect key={i} x={a} y={b} width="12" height="12" fill="none" stroke="#e8eef0" strokeOpacity="0.75" />)}<text x="134" y="24" fill="#e8eef0" fillOpacity="0.7" fontSize="10" fontFamily="Geist Mono, monospace">en L</text></g>
      </g>
    </>
  );
}

export const corteCasa = {
  id: 'casa', suelo, cotas: [], pintarFondo, pintarPasto, animar, especies: ESPECIES, pie: { iguana: (x) => suelo(x) - 2 }, interacciones: INTERACCIONES, rotulos: ROTULOS,
  rangos: { iguana: [960, 1130] }, superficie: 9999, ecotonos: [],
  Overlay, aria: 'Corte de la vivienda modular de Tierra Bomba dibujado con puntos: cinco módulos de 3,6 m, zaguán ventilado, cubiertas con ventana alta, paneles solares y captación de lluvia hacia una cisterna, con viento, lluvia y especies del jardín en movimiento',
};
