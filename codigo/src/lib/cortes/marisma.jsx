import React from 'react';
import { clamp, vaiven } from '../../components/CorteVivo.jsx';

// Corte de la marisma intermareal (sección 08): del lecho marino a la meseta, con cotas de marea e inundación.
export const suelo = (x) => { const t = Math.max(0, Math.min(1, (x - 150) / 1000)); return 520 - 215 * Math.pow(t, 1.3); };
const COTAS = [
  { y: 392, m: '+2,40 m', nombre: 'inundación 100 años', col: [125, 215, 240], dens: 0.42 },
  { y: 425, m: '+1,80 m', nombre: 'inundación 50 años', col: [88, 192, 232], dens: 0.6 },
  { y: 462, m: '+0,40 m', nombre: 'pleamar', col: [56, 162, 218], dens: 0.8 },
  { y: 478, m: '−0,15 m', nombre: 'bajamar', col: [40, 128, 196], dens: 0.95 },
];
const E1 = 470; const E2 = 785;
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
  { id: 'fragata1', src: 'fragata', w: 190, mira: -1, anc: 'centro', sci: 'Fregata magnificens', aleteo: 0.1, mov: (t) => { const x = 1280 - ((t * 26) % 1480); return { x, y: 160 + Math.sin(t * 0.5) * 14, dir: -1, fase: t * 1.6 }; } },
  { id: 'fragata2', src: 'fragata', w: 104, mira: -1, anc: 'centro', aleteo: 0.1, mov: (t) => { const x = 1280 - ((t * 31 + 520) % 1480); return { x, y: 112 + Math.sin(t * 0.7 + 1) * 10, dir: -1, fase: t * 1.9 }; } },
  { id: 'pelicano', src: 'pelicano', w: 196, mira: -1, anc: 'centro', sci: 'Pelecanus occidentalis', aleteo: 0.16, mov: (t) => { const x = -140 + ((t * 30 + 360) % 1500); return { x, y: 282 + Math.sin(t * 0.8) * 8, dir: 1, fase: t * 2.4 }; } },
  { id: 'albaVuelo', src: 'alba_vuelo', w: 156, mira: -1, anc: 'centro', sci: 'Ardea alba', aleteo: 0.3, mov: (t) => { const x = 1300 - ((t * 38 + 900) % 1500); return { x, y: 330 - Math.sin(t * 0.6) * 22, dir: -1, fase: t * 4.2 }; } },
  { id: 'martin', src: 'martin_vuelo', w: 112, mira: -1, anc: 'centro', sci: 'Megaceryle torquata', aleteo: 0.35, mov: (t) => { const v = vaiven(t, 380, 760, 70); return { x: v.x, y: 338 + Math.abs(Math.sin(t * 1.1)) * -26 + Math.sin(t * 7) * 2, dir: v.dir, fase: t * 9 }; } },
  { id: 'garza', src: 'garza', w: 132, mira: 1, anc: 'pie', sci: 'Egretta thula', mov: (t) => { const v = vaiven(t, 120, 300, 7); const picoteo = Math.pow(Math.max(0, Math.sin(t * 0.9)), 14) * 7; return { x: v.x, y: Math.min(suelo(v.x), 506) + picoteo, dir: v.dir, paso: Math.sin(t * 3) * 1.2 }; } },
  { id: 'alba', src: 'alba', w: 40, mira: 1, anc: 'pie', sci: 'Ardea alba', mov: (t) => { const v = vaiven(t, 360, 432, 4, 20); return { x: v.x, y: suelo(v.x) + 2, dir: v.dir, paso: Math.sin(t * 2.6) * 0.8 }; } },
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ id: `sardina${i}`, src: 'sardina', w: 40 + (i % 3) * 9, mira: 1, anc: 'centro', sci: i === 0 ? 'Opisthonema oglinum' : null, rotuloAbajo: true, mov: (t) => { const v = vaiven(t, 100, 330 - (i % 3) * 20, 24 + i * 3, i * 47); return { x: v.x, y: 494 + (i % 4) * 6 + Math.sin(t * 2 + i) * 3, dir: v.dir, nado: t * 8 + i }; } })),
  { id: 'tortuga', pintar: pintarTortuga, cw: 48, ch: 34, w: 72, mira: 1, anc: 'centro', sci: 'Chelonia mydas', rotuloAbajo: true, mov: (t) => { const v = vaiven(t, 120, 300, 9, 140); return { x: v.x, y: 502 + Math.sin(t * 0.9) * 4, dir: v.dir, nado: t * 2.5 }; } },
  { id: 'cangrejo', pintar: pintarCangrejo, cw: 36, ch: 26, w: 48, mira: 1, anc: 'pie', sci: 'Cardisoma guanhumi', sinVoltear: true, mov: (t) => { const v = vaiven(t, 418, 468, 16); const pausa = Math.sin(t * 0.7) > 0.4; const x = pausa ? 443 + Math.sin(t * 0.7) * 25 : v.x; return { x, y: suelo(x) - 1, dir: 1, paso: Math.sin(t * 22) * 0.8 }; } },
  { id: 'iguana', pintar: pintarIguana, cw: 92, ch: 26, w: 112, mira: 1, anc: 'pie', sci: 'Iguana iguana', inclina: true, mov: (t) => { const v = vaiven(t, 860, 990, 6, 30); return { x: v.x, y: suelo(v.x) - 2, dir: v.dir, paso: Math.sin(t * 5) * 0.6 }; } },
  { id: 'monarca', src: 'monarca', w: 44, mira: 1, anc: 'centro', sci: 'Danaus plexippus', mariposa: true, mov: (t) => ({ x: 965 + Math.sin(t * 0.55) * 70 + Math.sin(t * 1.7) * 12, y: 278 + Math.sin(t * 1.3) * 22 + Math.sin(t * 4.1) * 5, dir: Math.cos(t * 0.55) > 0 ? 1 : -1, fase: t * 16 }) },
];
// rótulos fijos (vegetación)
const ROTULOS_FIJOS = [
  [238, suelo(250) - 30, 'Thalassia testudinum', 'middle'], [530, suelo(530) - 56, 'Rhizophora mangle', 'middle'], [655, suelo(665) + 16, 'Sesuvium portulacastrum', 'middle'],
  [760, suelo(742) + 20, 'Coccoloba uvifera', 'start'], [845, suelo(845) - 66, 'Conocarpus erectus', 'middle'], [1010, suelo(1010) - 86, 'Ceiba pentandra', 'middle'], [935, suelo(935) - 46, 'Calotropis procera', 'middle'],
];

const PIE = { garza: (x) => Math.min(suelo(x), 506), alba: (x) => suelo(x) + 2, iguana: (x) => suelo(x) - 2, cangrejo: (x) => suelo(x) - 1 };
const INAT_OBS = 'iNaturalist (observaciones ciudadanas con interacción)';
// interacciones registradas en la base de especies de la isla (especies/data/interacciones.json)
const INTERACCIONES = {
  garza: { a: 'garza', b: 'sardina', modo: 'cardumen', P0: (A) => clamp(A.x, 150, 285), dx: 52, yB: 497, tipo: 'Depredación', A: ['Garza dedos dorados', 'Egretta thula'], B: ['Sardina vivita de hebra', 'Opisthonema oglinum'], texto: 'La garza camina despacio por el agua baja, se queda quieta y lanza el pico sobre las sardinas que se acercan a la orilla.', fuente: INAT_OBS },
  alba: { a: 'alba', b: 'garza', modo: 'compite', tipo: 'Competencia', A: ['Garza blanca', 'Ardea alba'], B: ['Garza dedos dorados', 'Egretta thula'], texto: 'Las dos pescan en los mismos sitios de agua baja. Cuando llega la garza blanca, más grande, la garza dedos dorados se aparta.', fuente: INAT_OBS },
  pelicano: { a: 'pelicano', b: 'garza', modo: 'compite', yA: 456, sep: 70, tipo: 'Competencia', A: ['Pelícano café', 'Pelecanus occidentalis'], B: ['Garza dedos dorados', 'Egretta thula'], texto: 'El pelícano se posa en el agua donde pesca la garza: los dos buscan los mismos cardúmenes de peces pequeños en la orilla.', fuente: INAT_OBS },
  albaVuelo: { a: 'albaVuelo', b: 'iguana', modo: 'caza', vuela: true, tipo: 'Depredación', A: ['Garza blanca', 'Ardea alba'], B: ['Iguana verde', 'Iguana iguana'], texto: 'La garza blanca también caza en tierra: baja en picada sobre las iguanas jóvenes del talud, que huyen hacia el bosque.', fuente: `${INAT_OBS}; Vlad et al. 2022, iguana en Islas Caimán` },
  martin: { a: 'martin', b: 'iguana', modo: 'acompana', tipo: 'Mutualismo y simbiosis', A: ['Martín pescador de collar', 'Megaceryle torquata'], B: ['Iguana verde', 'Iguana iguana'], texto: 'Asociación registrada entre el martín pescador de collar y la iguana verde en los bordes de agua.', fuente: 'Vlad et al. 2022, iguana en Islas Caimán' },
  tortuga: { a: 'tortuga', b: { x: 250, y: suelo(250) - 12, es: 'Hierba de tortuga', sci: 'Thalassia testudinum' }, modo: 'planta', tipo: 'Herbivoría', A: ['Tortuga verde', 'Chelonia mydas'], B: ['Hierba de tortuga', 'Thalassia testudinum'], texto: 'La tortuga verde pasta las praderas de hierba de tortuga del lecho marino; al recortarlas las mantiene densas y productivas.', fuente: 'SeaLifeBase; GoMexSI, dietas del Golfo de México; Roopnarine y Hertog 2013; Mangal' },
  iguana: { a: 'iguana', b: { x: 532, y: suelo(532) - 30, es: 'Mangle colorado', sci: 'Rhizophora mangle' }, modo: 'planta', tipo: 'Herbivoría', A: ['Iguana verde', 'Iguana iguana'], B: ['Mangle colorado', 'Rhizophora mangle'], texto: 'La iguana baja del talud al manglar y come hojas, brotes y flores del mangle colorado.', fuente: 'Vlad et al. 2022, iguana en Islas Caimán; Poelen 2014, asociaciones extraídas de literatura' },
  monarca: { a: 'monarca', b: { x: 935, y: suelo(935) - 30, es: 'Algodoncillo gigante', sci: 'Calotropis procera' }, modo: 'visita', tipo: 'Planta hospedera', A: ['Mariposa monarca', 'Danaus plexippus'], B: ['Algodoncillo gigante', 'Calotropis procera'], texto: 'La monarca pone sus huevos en el algodoncillo gigante: sus orugas comen sus hojas y los adultos visitan sus flores.', fuente: `${INAT_OBS}; Ferrer-Paris et al. 2013; NHM Interactions Bank; HOSTS (NHM Londres)` },
  fragata: { es: 'Fragata tijereta', sci: 'Fregata magnificens' },
  cangrejo: { es: 'Cangrejo azul', sci: 'Cardisoma guanhumi' },
};


function Overlay() {
  return (
    <>
      <text x="600" y="384" textAnchor="middle" fill="#e9c08a" fontSize="12" fontWeight="600" fontFamily="Geist Mono, monospace">PASARELA ELEVADA +2,10 m</text>
      <g fill="#e8eef0" fontFamily="Geist Mono, monospace" fontWeight="500" letterSpacing="0.8">
        <text x="330" y="545" fontSize="13">ZONA INTERMAREAL</text>
        <text x="700" y="448" fontSize="12"><tspan x="700">INUNDACIÓN 50 AÑOS</tspan><tspan x="700" dy="15">+ MAREJADA</tspan></text>
        <text x="985" y="352" fontSize="12"><tspan x="985">INUNDACIÓN 100 AÑOS</tspan><tspan x="985" dy="15">+ MAREJADA</tspan></text>
      </g>
    </>
  );
}

export const corteMarisma = {
  id: 'marisma',
  suelo, cotas: COTAS, pintarFondo, pintarPasto, especies: ESPECIES, pie: PIE, interacciones: INTERACCIONES, rotulos: ROTULOS_FIJOS,
  rangos: { garza: [112, 440], iguana: [860, 1040] }, grupos: { sardina: [0, 1, 2, 3, 4, 5, 6].map((i) => `sardina${i}`) },
  alias: (id) => (id.startsWith('sardina') ? 'garza' : id.startsWith('fragata') ? 'fragata' : id),
  sumergido: (x, y) => y > 440 && x < 360, superficie: 478,
  etiquetaCota: (c, x0) => (c.y > 470 ? { x: 470, y: c.y + 13, a: 'end' } : { x: x0 + 6, y: c.y - 4, a: 'start' }),
  ecotonos: [[E1, ['MARISMA INTERMAREAL', 'PRADERA SALOBRE']], [E2, ['HUMEDAL DULCE', 'PRADERA / BOSQUE SECO']]],
  Overlay, aria: 'Corte del paisaje adaptativo de Tierra Bomba dibujado con puntos: del lecho marino a la meseta, con cotas de marea e inundación, dos ecotonos, la pasarela elevada y especies en movimiento',
};
