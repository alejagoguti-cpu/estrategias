// Capas del análisis territorial de Tierra Bomba sobre una misma malla (~47 m), a partir de los datos de la presentación.
// Escribe analisis/capas.json para la página de análisis. Cada capa: valores 0..255 (255 = sin dato / fuera de la isla en «nd»).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { leerPNG } from './_png.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const REPO = process.argv[2]; // carpeta del repo publicado (tiene datos/ y assets/)
const OUT = process.argv[3];
const MOS = { x0: 9502, y0: 15426 };
const WIN = { left: 231, top: 1734, w: 1445, h: 2578 };
const S = 10; // px de la máscara por celda
const GW = Math.ceil(WIN.w / S); const GH = Math.ceil(WIN.h / S);
const n15 = 2 ** 15;
const lonOf = (tx) => (tx / n15) * 360 - 180;
const latOf = (ty) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n15))) * 180) / Math.PI;
const tile = (lon, lat) => [((lon + 180) / 360) * n15, ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n15];
const pxToTile = (px, py) => [MOS.x0 + (WIN.left + px) / 256, MOS.y0 + (WIN.top + py) / 256];
const llToPx = (lon, lat) => { const [tx, ty] = tile(lon, lat); return [(tx - MOS.x0) * 256 - WIN.left, (ty - MOS.y0) * 256 - WIN.top]; };
const mpp = (40075016.686 * Math.cos((10.35 * Math.PI) / 180)) / n15 / 256;
console.log('malla', GW, 'x', GH, 'celda', (S * mpp).toFixed(1), 'm');

// máscara de la isla
const mk = leerPNG(path.join(ROOT, 'public/datos/isla_mascara_osm.png'));
const land = new Uint8Array(WIN.w * WIN.h);
for (let i = 0; i < WIN.w * WIN.h; i++) land[i] = mk.datos[i * mk.canales] > 127 ? 1 : 0;
// distancia a la costa (transformada exacta, en px)
function edt(width, height, src) {
  const INF = 1e12; const f = new Float64Array(width * height);
  for (let i = 0; i < f.length; i++) f[i] = src[i] ? INF : 0;
  const n = Math.max(width, height); const d = new Float64Array(n); const v = new Int32Array(n); const z = new Float64Array(n + 1); const line = new Float64Array(n);
  const pass = (len, get, set) => {
    for (let i = 0; i < len; i++) line[i] = get(i);
    let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
    for (let q = 1; q < len; q++) {
      let s = ((line[q] + q * q) - (line[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((line[q] + q * q) - (line[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + line[v[k]]; }
    for (let i = 0; i < len; i++) set(i, d[i]);
  };
  for (let x = 0; x < width; x++) pass(height, (y) => f[y * width + x], (y, val) => { f[y * width + x] = val; });
  for (let y = 0; y < height; y++) pass(width, (x) => f[y * width + x], (x, val) => { f[y * width + x] = val; });
  return f;
}
const dist = edt(WIN.w, WIN.h, land);

// relieve (Terrarium z12)
const dem = {};
for (const f of fs.readdirSync(path.join(ROOT, 'public/datos/elevacion'))) { const [x, y] = f.replace('.png', '').split('_').map(Number); dem[`${x}_${y}`] = leerPNG(path.join(ROOT, 'public/datos/elevacion', f)); }
const elevAt = (lon, lat) => {
  const n12 = 2 ** 12; const tx = ((lon + 180) / 360) * n12; const ty = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n12;
  const t = dem[`${Math.floor(tx)}_${Math.floor(ty)}`]; if (!t) return 0;
  const px = Math.min(255, Math.floor((tx % 1) * 256)); const py = Math.min(255, Math.floor((ty % 1) * 256)); const o = (py * t.w + px) * t.canales;
  return t.datos[o] * 256 + t.datos[o + 1] + t.datos[o + 2] / 256 - 32768;
};

const N = GW * GH;
const enIsla = new Uint8Array(N); const lon = new Float64Array(N); const lat = new Float64Array(N);
const elev = new Float32Array(N); const dCosta = new Float32Array(N);
for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
  const c = j * GW + i; const px = Math.min(WIN.w - 1, i * S + S / 2); const py = Math.min(WIN.h - 1, j * S + S / 2);
  const [tx, ty] = pxToTile(px, py); lon[c] = lonOf(tx); lat[c] = latOf(ty);
  enIsla[c] = land[py * WIN.w + px];
  elev[c] = enIsla[c] ? Math.max(0, elevAt(lon[c], lat[c])) : 0;
  dCosta[c] = Math.sqrt(dist[py * WIN.w + px]) * mpp;
}
// pendiente (%)
const celdaM = S * mpp;
const pend = new Float32Array(N);
for (let j = 1; j < GH - 1; j++) for (let i = 1; i < GW - 1; i++) { const c = j * GW + i; if (!enIsla[c]) continue; const dx = (elev[c + 1] - elev[c - 1]) / (2 * celdaM); const dy = (elev[c + GW] - elev[c - GW]) / (2 * celdaM); pend[c] = 100 * Math.hypot(dx, dy); }

// MIDAS: amenaza por erosión por tramo y zona inundable
const midas = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/datos/midas_tierrabomba.json'), 'utf8'));
const TASA = { 'Muy Alta': 3.0, Alta: 1.5, Moderada: 0.63, Baja: 0.3, 'Muy Baja': 0.15, SD: 0.63 };
const NIVEL = { 'Muy Baja': 1, Baja: 2, Moderada: 3, Alta: 4, 'Muy Alta': 5, SD: 0 };
const claseC = new Float32Array(N).fill(0); const tasaC = new Float32Array(N).fill(0.63); const dSeg = new Float32Array(N).fill(1e9);
midas.erosion.forEach(({ clase, pts }) => {
  for (let k = 0; k < pts.length - 1; k++) {
    const [x0, y0] = llToPx(...pts[k]); const [x1, y1] = llToPx(...pts[k + 1]);
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4));
    for (let s = 0; s <= n; s++) {
      const x = x0 + ((x1 - x0) * s) / n; const y = y0 + ((y1 - y0) * s) / n;
      const ci = Math.floor(x / S); const cj = Math.floor(y / S); const R = 5; // ~235 m
      for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
        const ii = ci + di; const jj = cj + dj; if (ii < 0 || jj < 0 || ii >= GW || jj >= GH) continue;
        const c = jj * GW + ii; const d = Math.hypot(ii * S + S / 2 - x, jj * S + S / 2 - y) * mpp;
        if (d < 200 && d < dSeg[c]) { dSeg[c] = d; claseC[c] = NIVEL[clase] ?? 0; tasaC[c] = TASA[clase] ?? 0.63; }
      }
    }
  }
});
const dentro = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i]; const [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const anillos = [...midas.moderada2019, ...midas.fuerte2040];
const bbs = anillos.map((r) => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; r.forEach(([x, y]) => { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); }); return [a, b, c, d]; });
const inund = new Uint8Array(N);
for (let c = 0; c < N; c++) {
  if (!enIsla[c]) continue; let k = 0;
  anillos.forEach((r, q) => { const b = bbs[q]; if (lon[c] < b[0] || lon[c] > b[1] || lat[c] < b[2] || lat[c] > b[3]) return; if (dentro(lon[c], lat[c], r)) k++; });
  inund[c] = k % 2 === 1 || k > 0 ? 1 : 0;
}
// años hasta que el retroceso llega a la celda
const anios = new Float32Array(N); for (let c = 0; c < N; c++) anios[c] = enIsla[c] ? dCosta[c] / tasaC[c] : 0;

// construcciones (centroides por celda)
const cons = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(REPO, 'datos/construcciones_tierra_bomba.json.gz'))));
const nCons = new Float32Array(N);
cons.buildings.forEach(([, , ring]) => { let x = 0; let y = 0; ring.forEach(([lo, la]) => { x += lo; y += la; }); const [px, py] = llToPx(x / ring.length, y / ring.length); const i = Math.floor(px / S); const j = Math.floor(py / S); if (i >= 0 && j >= 0 && i < GW && j < GH) nCons[j * GW + i]++; });
// sintaxis espacial: integración y elección (radio n) y distancia a muelles, máximo por celda
const sin = JSON.parse(fs.readFileSync(path.join(REPO, 'datos/sintaxis.json'), 'utf8'));
const nain = new Float32Array(N).fill(-1); const nach = new Float32Array(N).fill(-1); const muelle = new Float32Array(N).fill(-1);
const P = sin.peatonal; const md = sin.muelles.dist_m || [];
P.coords.forEach(([a, b, cc, d], s) => {
  const [x0, y0] = llToPx(a, b); const [x1, y1] = llToPx(cc, d); const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
  for (let k = 0; k <= n; k++) {
    const i = Math.floor((x0 + ((x1 - x0) * k) / n) / S); const j = Math.floor((y0 + ((y1 - y0) * k) / n) / S); if (i < 0 || j < 0 || i >= GW || j >= GH) continue; const c = j * GW + i;
    nain[c] = Math.max(nain[c], P.medidas.n.nain[s]); nach[c] = Math.max(nach[c], P.medidas.n.nach[s]);
    if (md[s] >= 0) muelle[c] = muelle[c] < 0 ? md[s] : Math.min(muelle[c], md[s]);
  }
});
// árboles detectados (coordenadas del modelo de la tesis -> lon/lat con georef)
const geo = JSON.parse(fs.readFileSync(path.join(REPO, 'assets/data/georef.json'), 'utf8'));
const cr = Math.cos(geo.rot); const sr = Math.sin(geo.rot);
const modelToLL = (x, y) => { const px = (x - geo.tx) / geo.sc; const py = (y - geo.ty) / geo.sc; return [geo.lon0 + (px * cr + py * sr) / geo.kx, geo.lat0 + (-px * sr + py * cr) / geo.ky]; };
const veg = JSON.parse(fs.readFileSync(path.join(REPO, 'assets/data/vegetacion.json'), 'utf8'));
const nArb = new Float32Array(N);
veg.arboles.forEach(([x, y]) => { const [lo, la] = modelToLL(x, y); const [px, py] = llToPx(lo, la); const i = Math.floor(px / S); const j = Math.floor(py / S); if (i >= 0 && j >= 0 && i < GW && j < GH) nArb[j * GW + i]++; });
// registros de especies (iNaturalist y otras bases), suavizados con un radio de 2 celdas
const esp = JSON.parse(fs.readFileSync(path.join(REPO, 'assets/data/especies.json'), 'utf8'));
const nEsp = new Float32Array(N);
esp.obs.forEach(([, x, z]) => { const [px, py] = llToPx(geo.lon0 + x / geo.kx, geo.lat0 - z / geo.ky); const ci = Math.floor(px / S); const cj = Math.floor(py / S); for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const i = ci + di; const j = cj + dj; if (i >= 0 && j >= 0 && i < GW && j < GH) nEsp[j * GW + i] += Math.exp(-(di * di + dj * dj) / 3); } });
const suav = (a, r = 1) => { const o = new Float32Array(N); for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { let s = 0; let w = 0; for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const ii = i + di; const jj = j + dj; if (ii < 0 || jj < 0 || ii >= GW || jj >= GH) continue; s += a[jj * GW + ii]; w++; } o[j * GW + i] = s / w; } return o; };
const consS = suav(nCons, 1); const arbS = suav(nArb, 1);

// satélite (RGB por celda) desde sat_base.jpg no se decodifica aquí (JPEG): la página lo recorta en el navegador.
const q = (arr, p) => { const v = []; for (let c = 0; c < N; c++) if (enIsla[c] && arr[c] >= 0) v.push(arr[c]); v.sort((a, b) => a - b); return v.length ? v[Math.min(v.length - 1, Math.floor(p * (v.length - 1)))] : 1; };
const norm = (arr, lo, hi, inv = false) => { const o = new Uint8Array(N).fill(255); for (let c = 0; c < N; c++) { if (!enIsla[c] || arr[c] < 0) continue; let t = (arr[c] - lo) / (hi - lo || 1); t = Math.max(0, Math.min(1, t)); if (inv) t = 1 - t; o[c] = Math.round(t * 254); } return o; };
const capas = [
  { id: 'elevacion', nombre: 'Elevación', unidad: 'm s.n.m.', rango: [0, Math.round(q(elev, 0.99))], fuente: 'Terrain Tiles (Mapzen/AWS, Terrarium z12, ~30 m)', metodo: 'lineal min–máx', v: norm(elev, 0, q(elev, 0.99)), rampa: 'relieve' },
  { id: 'pendiente', nombre: 'Pendiente', unidad: '%', rango: [0, Math.round(q(pend, 0.98))], fuente: 'Derivada del relieve', metodo: 'lineal min–percentil 98', v: norm(pend, 0, q(pend, 0.98)), rampa: 'magma' },
  { id: 'costa', nombre: 'Distancia a la costa', unidad: 'm', rango: [0, Math.round(q(dCosta, 0.99))], fuente: 'Línea de costa © OpenStreetMap', metodo: 'transformada de distancia', v: norm(dCosta, 0, q(dCosta, 0.99)), rampa: 'mar' },
  { id: 'amenaza', nombre: 'Amenaza por erosión', unidad: 'clase', rango: [1, 5], fuente: 'MIDAS · INVEMAR 2011 (tramos a menos de 200 m)', metodo: 'ordinal muy baja → muy alta', v: (() => { const o = new Uint8Array(N).fill(255); for (let c = 0; c < N; c++) if (enIsla[c] && claseC[c] > 0) o[c] = Math.round(((claseC[c] - 1) / 4) * 254); return o; })(), rampa: 'riesgo' },
  { id: 'retroceso', nombre: 'Años hasta el retroceso', unidad: 'años', rango: [0, 60], fuente: 'INVEMAR 2012 (0,63–3 m/año) por tramo de MIDAS', metodo: 'distancia ÷ tasa del tramo; invertida (antes = más alto)', v: norm(anios, 0, 60, true), rampa: 'riesgo' },
  { id: 'inundable', nombre: 'Zona inundable oficial', unidad: 'sí / no', rango: [0, 1], fuente: 'MIDAS · Secretaría de Planeación-INVEMAR-CDKN (2019 y 2040)', metodo: 'binaria', v: (() => { const o = new Uint8Array(N).fill(255); for (let c = 0; c < N; c++) if (enIsla[c]) o[c] = inund[c] ? 254 : 0; return o; })(), rampa: 'agua' },
  { id: 'construcciones', nombre: 'Densidad de construcciones', unidad: 'por celda', rango: [0, Math.round(q(consS, 0.995))], fuente: 'Archivo de la tesis (2.600 huellas)', metodo: 'conteo suavizado, lineal', v: norm(consS, 0, q(consS, 0.995)), rampa: 'calor' },
  { id: 'integracion', nombre: 'Integración peatonal', unidad: 'NAIN', rango: [+q(nain, 0.02).toFixed(2), +q(nain, 0.98).toFixed(2)], fuente: 'Sintaxis espacial (red OSM, radio n)', metodo: 'percentiles 2–98', v: norm(nain, q(nain, 0.02), q(nain, 0.98)), rampa: 'viridis' },
  { id: 'eleccion', nombre: 'Elección peatonal', unidad: 'NACH', rango: [+q(nach, 0.02).toFixed(2), +q(nach, 0.98).toFixed(2)], fuente: 'Sintaxis espacial (red OSM, radio n)', metodo: 'percentiles 2–98', v: norm(nach, q(nach, 0.02), q(nach, 0.98)), rampa: 'viridis' },
  { id: 'muelles', nombre: 'Acceso a muelles', unidad: 'm por la red', rango: [0, Math.round(q(muelle, 0.98))], fuente: 'Muelles OSM + red peatonal', metodo: 'invertida (cerca = alto)', v: norm(muelle, 0, q(muelle, 0.98), true), rampa: 'mar' },
  { id: 'arboles', nombre: 'Cobertura arbórea', unidad: 'copas por celda', rango: [0, Math.round(q(arbS, 0.99))], fuente: 'Copas detectadas en imagen Esri (3.840)', metodo: 'conteo suavizado, lineal', v: norm(arbS, 0, q(arbS, 0.99)), rampa: 'verde' },
  { id: 'especies', nombre: 'Registros de especies', unidad: 'densidad', rango: [0, +q(nEsp, 0.99).toFixed(1)], fuente: 'iNaturalist y bases abiertas (729 registros)', metodo: 'núcleo gaussiano, lineal', v: norm(nEsp, 0, q(nEsp, 0.99)), rampa: 'verde' },
];
const b64 = (u8) => Buffer.from(u8).toString('base64');
const elevQ = new Uint16Array(N); for (let c = 0; c < N; c++) elevQ[c] = Math.round(elev[c] * 10);
const salida = {
  malla: { gw: GW, gh: GH, celdaM: +celdaM.toFixed(1), lon0: lon[0], lat0: lat[0], lon1: lon[N - 1], lat1: lat[N - 1] },
  win: { ...WIN, mos: MOS, S },
  isla: b64(enIsla), elev: b64(new Uint8Array(elevQ.buffer)),
  stats: {
    haIsla: +((enIsla.reduce((a, b) => a + b, 0) * celdaM * celdaM) / 1e4).toFixed(0),
    elevMax: +q(elev, 1).toFixed(0),
    haInundable: +((inund.reduce((a, b) => a + b, 0) * celdaM * celdaM) / 1e4).toFixed(0),
    haRetroceso30: +(([...anios].filter((y, c) => enIsla[c] && y <= 30).length * celdaM * celdaM) / 1e4).toFixed(0),
  },
  capas: capas.map(({ v, ...r }) => ({ ...r, v: b64(v) })),
};
fs.writeFileSync(OUT, JSON.stringify(salida));
console.log('escrito', (fs.statSync(OUT).size / 1024).toFixed(0), 'KB', JSON.stringify(salida.stats));
