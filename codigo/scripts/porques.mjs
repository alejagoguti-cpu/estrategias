// Medidas de los cinco porqués con los datos de la presentación. Escribe src/data/porques.json
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib';
import { leerPNG } from './_png.mjs';
import { MESETA } from '../src/lib/plan.js';
const ROOT = path.resolve(import.meta.dirname, '..');
const cons = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, 'public/datos/construcciones_tierra_bomba.json.gz'))));
const midas = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/datos/midas_tierrabomba.json'), 'utf8'));
const ctx = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, 'public/datos/cartagena_contexto.json.gz'))));
const KX = 109500; const KY = 110574;
const dm = (a, b) => Math.hypot((a[0] - b[0]) * KX, (a[1] - b[1]) * KY);
const casas = cons.buildings.map(([, , ring]) => { let x = 0; let y = 0; ring.forEach(([lo, la]) => { x += lo; y += la; }); return [x / ring.length, y / ring.length]; });
const N = casas.length;
// distancia punto-segmento en metros
const dSeg = (p, a, b) => { const ax = (a[0] - p[0]) * KX; const ay = (a[1] - p[1]) * KY; const bx = (b[0] - p[0]) * KX; const by = (b[1] - p[1]) * KY; const dx = bx - ax; const dy = by - ay; const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(ax + t * dx, ay + t * dy); };
// P1: viviendas según la amenaza por erosión del tramo de costa más cercano (MIDAS)
const ORDEN = ['Muy Alta', 'Alta', 'Moderada', 'Baja', 'Muy Baja'];
const p1 = Object.fromEntries([...ORDEN, 'Lejos de la costa (>200 m)'].map((k) => [k, 0]));
casas.forEach((c) => { let best = 1e9; let cl = null; midas.erosion.forEach(({ clase, pts }) => { for (let i = 0; i < pts.length - 1; i++) { const d = dSeg(c, pts[i], pts[i + 1]); if (d < best) { best = d; cl = clase; } } }); if (best > 200 || !ORDEN.includes(cl)) p1['Lejos de la costa (>200 m)']++; else p1[cl]++; });
// P2: distancia de cada vivienda al punto de embarque más cercano de la isla
const llegadas = Object.values(ctx.muelles).filter((m) => m.lado === 'isla').map((m) => [m.lon, m.lat]);
const dMu = casas.map((c) => Math.min(...llegadas.map((m) => dm(c, m))));
const BINS = [[0, 250, 'menos de 250 m'], [250, 500, '250 a 500 m'], [500, 1000, '500 m a 1 km'], [1000, 1e9, 'más de 1 km']];
const p2 = BINS.map(([a, b, l]) => ({ l, n: dMu.filter((d) => d >= a && d < b).length }));
const med = [...dMu].sort((a, b) => a - b)[Math.floor(N / 2)];
// P3: altura de cada vivienda (Terrarium z12) frente a la cota +22 m de la meseta; viviendas dentro de la meseta
const dem = {}; for (const f of fs.readdirSync(path.join(ROOT, 'public/datos/elevacion'))) { const [x, y] = f.replace('.png', '').split('_').map(Number); dem[`${x}_${y}`] = leerPNG(path.join(ROOT, 'public/datos/elevacion', f)); }
const elev = ([lon, lat]) => { const n = 4096; const tx = ((lon + 180) / 360) * n; const ty = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n; const t = dem[`${Math.floor(tx)}_${Math.floor(ty)}`]; if (!t) return 0; const o = (Math.min(255, Math.floor((tx % 1) * 256)) + Math.min(255, Math.floor((ty % 1) * 256)) * t.w) * t.canales; return Math.max(0, t.datos[o] * 256 + t.datos[o + 1] + t.datos[o + 2] / 256 - 32768); };
const alturas = casas.map(elev);
const dentro = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i]; const [xj, yj] = poly[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
const p3 = { bajo5: alturas.filter((h) => h < 5).length, de5a22: alturas.filter((h) => h >= 5 && h < 22).length, sobre22: alturas.filter((h) => h >= 22).length, enMeseta: casas.filter((c) => dentro(c, MESETA)).length };
const out = { total: N, p1: Object.entries(p1).map(([l, n]) => ({ l, n })), p2: { bins: p2, mediana: Math.round(med) }, p3 };
fs.mkdirSync(path.join(ROOT, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/data/porques.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
