// Contexto de Cartagena para la vista de muelles: edificios (Catastro Multipropósito AMB Cartagena 2026, del repositorio
// de la tesis) y masas de tierra; y las rutas de lancha trazadas por el agua (A* sobre un ráster de tierra/agua).
const proj4 = require('proj4'); const fs = require('fs'); const zlib = require('zlib'); const path = require('path');
const OUT = process.argv[2];
proj4.defs('EPSG:9377', '+proj=tmerc +lat_0=4 +lon_0=-73 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
const j = JSON.parse(fs.readFileSync(path.join(__dirname, '../tesis/public/data/cartagena_catastro_real.json'), 'utf8'));
const aLL = ([x, y]) => proj4('EPSG:9377', 'EPSG:4326', [x / 0.02 + 4720500, y / 0.02 + 2705500]);
const enIslaTB = (lon, lat) => lat < 10.388 && lon < -75.536 && lon > -75.63; // Tierra Bomba ya tiene sus 2.600 construcciones
// --- edificios: caja orientada (centro, ancho, fondo, ángulo, altura en m)
const ed = [];
for (const b of j.buildings) {
  const pts = b.r.map((p) => [p[0] / 0.02, p[1] / 0.02]); // metros locales
  let cx = 0; let cy = 0; pts.forEach(([x, y]) => { cx += x; cy += y; }); cx /= pts.length; cy /= pts.length;
  const [lon, lat] = aLL([cx * 0.02, cy * 0.02]);
  if (enIslaTB(lon, lat)) continue;
  let sxx = 0; let syy = 0; let sxy = 0; pts.forEach(([x, y]) => { sxx += (x - cx) ** 2; syy += (y - cy) ** 2; sxy += (x - cx) * (y - cy); });
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy); const ca = Math.cos(ang); const sa = Math.sin(ang);
  let a0 = 1e9; let a1 = -1e9; let b0 = 1e9; let b1 = -1e9;
  pts.forEach(([x, y]) => { const a = (x - cx) * ca + (y - cy) * sa; const bb = -(x - cx) * sa + (y - cy) * ca; a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, bb); b1 = Math.max(b1, bb); });
  const w = a1 - a0; const d = b1 - b0; if (w < 2 || d < 2) continue;
  ed.push([+lon.toFixed(6), +lat.toFixed(6), +w.toFixed(1), +d.toFixed(1), +(-ang).toFixed(3), +(b.h * 50).toFixed(1), b.t === 'skyscraper' ? 1 : 0]);
}
// --- masas de tierra (lon/lat, simplificadas)
const dp = (p, e) => { if (p.length < 3) return p; const a = p[0]; const b = p[p.length - 1]; let md = 0; let mi = 0; const dx = b[0] - a[0]; const dy = b[1] - a[1]; const L = Math.hypot(dx, dy); for (let i = 1; i < p.length - 1; i++) { const dd = L < 1e-12 ? Math.hypot(p[i][0] - a[0], p[i][1] - a[1]) : Math.abs(dy * p[i][0] - dx * p[i][1] + b[0] * a[1] - b[1] * a[0]) / L; if (dd > md) { md = dd; mi = i; } } return md > e ? [...dp(p.slice(0, mi + 1), e).slice(0, -1), ...dp(p.slice(mi), e)] : [a, b]; };
// simplificación por distancia mínima entre vértices (~4 m), lineal
const tierras = j.landmasses.map((r) => { const out = []; let px = null; for (const p of r) { const q = aLL(p); if (!px || Math.hypot((q[0] - px[0]) * 109500, (q[1] - px[1]) * 110574) > 4) { out.push([+q[0].toFixed(5), +q[1].toFixed(5)]); px = q; } } return out; }).filter((r) => r.length >= 4);
console.log('edificios', ed.length, 'tierras', tierras.length);

// --- ráster tierra/agua para trazar las rutas por el agua (≈ 22 m)
const B = { lon0: -75.64, lon1: -75.47, lat0: 10.28, lat1: 10.48 };
const GW = 820; const GH = Math.round(GW * ((B.lat1 - B.lat0) / (B.lon1 - B.lon0)) / Math.cos(10.38 * Math.PI / 180));
const tierra = new Uint8Array(GW * GH);
const aPx = (lon, lat) => [((lon - B.lon0) / (B.lon1 - B.lon0)) * GW, ((B.lat1 - lat) / (B.lat1 - B.lat0)) * GH];
const llenar = (ring) => { const P = ring.map(([a, b]) => aPx(a, b)); let y0 = Infinity; let y1 = -Infinity; P.forEach(([, y]) => { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }); for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(GH - 1, Math.ceil(y1)); y++) { const xs = []; for (let i = 0, k = P.length - 1; i < P.length; k = i++) { const [xi, yi] = P[i]; const [xk, yk] = P[k]; if ((yi > y + 0.5) !== (yk > y + 0.5)) xs.push(xi + ((y + 0.5 - yi) / (yk - yi)) * (xk - xi)); } xs.sort((a, b) => a - b); for (let q = 0; q + 1 < xs.length; q += 2) for (let x = Math.max(0, Math.ceil(xs[q] - 0.5)); x <= Math.min(GW - 1, Math.floor(xs[q + 1] - 0.5)); x++) tierra[y * GW + x] ^= 1; } };
tierras.forEach(llenar); console.log('raster', GW, GH, 'tierra', tierra.reduce((s, v) => s + v, 0));
// isla de Tierra Bomba: línea de costa OSM de la presentación
const costa = JSON.parse(fs.readFileSync(path.join(__dirname, '../tb_orig/fuente/costa_osm.json'), 'utf8'));
const muro = (a, b) => { const [x0, y0] = aPx(a.lon, a.lat); const [x1, y1] = aPx(b.lon, b.lat); const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1; for (let k = 0; k <= n; k++) { const x = Math.round(x0 + ((x1 - x0) * k) / n); const y = Math.round(y0 + ((y1 - y0) * k) / n); if (x >= 0 && y >= 0 && x < GW && y < GH) tierra[y * GW + x] = 1; } };
costa.elements.forEach((w) => { const g = w.geometry || []; for (let i = 0; i < g.length - 1; i++) muro(g[i], g[i + 1]); });
// relleno de la isla desde un punto interior
{ const [sx, sy] = aPx(-75.565, 10.35).map(Math.round); const s0 = sy * GW + sx; console.log('semilla en tierra?', tierra[s0]); let n = 0; const pila = [s0]; tierra[s0] = 2; while (pila.length) { const c = pila.pop(); n++; const x = c % GW; const y = (c / GW) | 0; for (const v of [x > 0 ? c - 1 : -1, x < GW - 1 ? c + 1 : -1, y > 0 ? c - GW : -1, y < GH - 1 ? c + GW : -1]) if (v >= 0 && !tierra[v]) { tierra[v] = 2; pila.push(v); } } console.log('celdas isla', n, 'de', GW * GH); for (let c = 0; c < GW * GH; c++) if (tierra[c]) tierra[c] = 1; }
// distancia a tierra (en celdas) para que la lancha no roce la costa
const dist = new Float32Array(GW * GH).fill(1e9); const cola = [];
for (let c = 0; c < GW * GH; c++) if (tierra[c]) { dist[c] = 0; cola.push(c); }
for (let h = 0; h < cola.length; h++) { const c = cola[h]; const x = c % GW; const y = (c / GW) | 0; for (const n of [x > 0 ? c - 1 : -1, x < GW - 1 ? c + 1 : -1, y > 0 ? c - GW : -1, y < GH - 1 ? c + GW : -1]) if (n >= 0 && dist[n] > dist[c] + 1) { dist[n] = dist[c] + 1; cola.push(n); } }
const aguaCerca = (lon, lat) => { const [x, y] = aPx(lon, lat).map(Math.round); let best = null; let bd = 1e9; for (let dy = -25; dy <= 25; dy++) for (let dx = -25; dx <= 25; dx++) { const c = (y + dy) * GW + (x + dx); if (!tierra[c] && dist[c] >= 2 && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = c; } } return best; };
const astar = (a, b) => {
  const N = GW * GH; const g = new Float32Array(N).fill(Infinity); const prev = new Int32Array(N).fill(-1); const cerrado = new Uint8Array(N);
  let cap = 1 << 20; let hf = new Float32Array(cap); let hc = new Int32Array(cap); let n = 0;
  const hx = (c) => Math.hypot((c % GW) - (b % GW), ((c / GW) | 0) - ((b / GW) | 0));
  const push = (c, f) => { if (n >= cap) { cap *= 2; const f2 = new Float32Array(cap); f2.set(hf); hf = f2; const c2 = new Int32Array(cap); c2.set(hc); hc = c2; } let i = n++; while (i > 0) { const p = (i - 1) >> 1; if (hf[p] <= f) break; hf[i] = hf[p]; hc[i] = hc[p]; i = p; } hf[i] = f; hc[i] = c; };
  const pop = () => { const top = hc[0]; n--; if (n > 0) { const f = hf[n]; const c = hc[n]; let i = 0; for (;;) { let m = 2 * i + 1; if (m >= n) break; if (m + 1 < n && hf[m + 1] < hf[m]) m++; if (hf[m] >= f) break; hf[i] = hf[m]; hc[i] = hc[m]; i = m; } hf[i] = f; hc[i] = c; } return top; };
  g[a] = 0; push(a, hx(a));
  const V = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let ok = false;
  while (n > 0) {
    const c = pop(); if (cerrado[c]) continue; cerrado[c] = 1; if (c === b) { ok = true; break; }
    const x = c % GW; const y = (c / GW) | 0;
    for (const [dx, dy, w] of V) { const nx = x + dx; const ny = y + dy; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue; const m = ny * GW + nx; if (tierra[m] || cerrado[m]) continue; const pen = dist[m] < 4 ? (4 - dist[m]) * 3 : 0; const ng = g[c] + w + pen; if (ng < g[m]) { g[m] = ng; prev[m] = c; push(m, ng + hx(m)); } }
  }
  if (!ok) return null;
  const camino = []; for (let c = b; c >= 0; c = prev[c]) { camino.push(c); if (c === a) break; } return camino.reverse();
};const aLLc = (c) => [B.lon0 + (((c % GW) + 0.5) / GW) * (B.lon1 - B.lon0), B.lat1 - ((((c / GW) | 0) + 0.5) / GH) * (B.lat1 - B.lat0)];
const suavizar = (pts) => { let p = pts; for (let it = 0; it < 3; it++) { const q = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const [a, b] = [p[i], p[i + 1]]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } q.push(p[p.length - 1]); p = q; } return p; };

// --- muelles y rutas documentadas
const M = {
  bodeguita: { nombre: 'Muelle de La Bodeguita', lon: -75.54992, lat: 10.42125, lado: 'cartagena', fuente: 'OpenStreetMap (node 4663495389)' },
  pegasos: { nombre: 'Muelle de Los Pegasos', lon: -75.54858, lat: 10.42199, lado: 'cartagena', fuente: 'OpenStreetMap (way 550932467)' },
  hospital: { nombre: 'Playa del Hospital de Bocagrande (Castillogrande)', lon: -75.5542, lat: 10.3988, lado: 'cartagena', fuente: 'Estudio de transporte acuático 2014; guías de viaje (2025). Punto aproximado en la playa detrás del hospital' },
  laguito: { nombre: 'Playa de El Laguito (Hotel Hilton)', lon: -75.5602, lat: 10.3924, lado: 'cartagena', fuente: 'Estudio de transporte acuático 2014 («sector del Hotel Hilton»); pacartagena.com (2026). Punto aproximado' },
  bazurto: { nombre: 'Embarcadero del mercado de Bazurto', lon: -75.5297, lat: 10.4057, lado: 'cartagena', fuente: 'Estudio de transporte acuático 2014. Punto aproximado en la orilla junto al mercado' },
  tbPueblo: { nombre: 'Playa del pueblo de Tierra Bomba', lon: -75.5747, lat: 10.3826, lado: 'isla', fuente: 'Llegada a la playa del corregimiento (sin muelle mapeado en OpenStreetMap)' },
  playaDorada: { nombre: 'Muelle de Playa Dorada', lon: -75.56606, lat: 10.37143, lado: 'isla', fuente: 'OpenStreetMap (way 636994399)' },
  puntaArena: { nombre: 'Muelle de Punta Arena', lon: -75.55357, lat: 10.36613, lado: 'isla', fuente: 'OpenStreetMap (way 102378052)' },
  puntaArena2: { nombre: 'Muelles de Punta Arena (este)', lon: -75.54657, lat: 10.365, lado: 'isla', fuente: 'OpenStreetMap (ways 103079138, 103079140, 103079144)' },
  bocachica: { nombre: 'Muelle de Bocachica', lon: -75.58045, lat: 10.32057, lado: 'isla', fuente: 'OpenStreetMap (way 101811344)' },
  bocachica2: { nombre: 'Muelle Bocachica (oeste)', lon: -75.58785, lat: 10.32192, lado: 'isla', fuente: 'OpenStreetMap (way 102017667)' },
  sanFernando: { nombre: 'Muelle del Fuerte de San Fernando', lon: -75.57768, lat: 10.31396, lado: 'isla', fuente: 'OpenStreetMap (way 1385237914)' },
  bocachicaN: { nombre: 'Muelle Bocachica (norte)', lon: -75.57699, lat: 10.33558, lado: 'isla', fuente: 'OpenStreetMap (way 102007210)' },
  bocachicaO: { nombre: 'Muelle Bocachica (punta oeste)', lon: -75.59141, lat: 10.32659, lado: 'isla', fuente: 'OpenStreetMap (way 119663254)' },
  punta3: { nombre: 'Muelle de Punta Arena (club)', lon: -75.55629, lat: 10.3658, lado: 'isla', fuente: 'OpenStreetMap (way 636994404)' },
};
const RUTAS = [
  { id: 'hosp-tb', de: 'hospital', a: 'tbPueblo', nombre: 'Hospital de Bocagrande → Tierra Bomba (pueblo)', tipo: 'colectiva', pasajeros: '614 viajes hacia Bocagrande y 407 de vuelta en 13 horas (aforo de mayo de 2014); 1.080 pasajeros/día en el estudio de 2004', fuente: 'Estudio de transporte acuático de Cartagena 2014; Revista Metro (2026) citando el estudio de 2004' },
  { id: 'bod-tb', de: 'bodeguita', a: 'tbPueblo', nombre: 'La Bodeguita → Tierra Bomba (pueblo)', tipo: 'colectiva', pasajeros: 'sin aforo publicado', fuente: 'Estudio de transporte acuático de Cartagena 2014 (destino desde Tierra Bomba)' },
  { id: 'baz-tb', de: 'bazurto', a: 'tbPueblo', nombre: 'Bazurto → Tierra Bomba (pueblo)', tipo: 'colectiva', pasajeros: 'sin aforo publicado', fuente: 'Estudio de transporte acuático de Cartagena 2014 (destino desde Tierra Bomba)' },
  { id: 'lag-tb', de: 'laguito', a: 'tbPueblo', nombre: 'El Laguito (Hotel Hilton) → Tierra Bomba (pueblo)', tipo: 'colectiva', pasajeros: 'sin aforo publicado', fuente: 'Estudio de transporte acuático de Cartagena 2014 («sector del Hotel Hilton»)' },
  { id: 'bod-boca', de: 'bodeguita', a: 'bocachica', nombre: 'La Bodeguita → Bocachica', tipo: 'colectiva', pasajeros: '706 pasajeros/día (estudio de 2004); 2 o 3 paradas, a veces en el muelle del Fuerte de San Fernando', fuente: 'Revista Metro (2026) citando el estudio de 2004; Cartagena Explorer (2025)' },
  { id: 'hosp-pa', de: 'hospital', a: 'puntaArena', nombre: 'Hospital de Bocagrande → Punta Arena', tipo: 'turística', pasajeros: 'lanchas que salen al llenarse; 10 a 15 minutos', fuente: 'Cartagena Explorer (2025); pacartagena.com (2026)' },
  { id: 'hosp-pd', de: 'hospital', a: 'playaDorada', nombre: 'Hospital de Bocagrande → Playa Dorada (Paraíso del Sol, Palmarito)', tipo: 'turística', pasajeros: 'salidas de 8:00 a 12:00; regreso de 2:30 a 4:30 p. m.', fuente: 'pacartagena.com (2026)' },
  { id: 'lag-pa', de: 'laguito', a: 'puntaArena', nombre: 'El Laguito → Punta Arena, Bongo y Playa Linda', tipo: 'turística', pasajeros: 'unos 10 minutos a Punta Arena y 20 a Playa Linda', fuente: 'pacartagena.com (2026)' },
];
const salida = { fuente: 'Edificios: Catastro Multipropósito AMB Cartagena 2026 (repositorio de la tesis, alturas de referencia). Tierras: misma fuente. Muelles: OpenStreetMap. Rutas: ver cada una.', muelles: M, rutas: [], edificios: ed, tierras };
for (const r of RUTAS) {
  const a = aguaCerca(M[r.de].lon, M[r.de].lat); const b = aguaCerca(M[r.a].lon, M[r.a].lat);
  if (a === null || b === null) { console.log('sin agua cerca', r.id); continue; }
  const cam = astar(a, b); if (!cam) { console.log('sin camino por agua', r.id); continue; } const pts = cam.filter((_, i) => i % 4 === 0 || i === cam.length - 1).map(aLLc);
  const todo = suavizar([[M[r.de].lon, M[r.de].lat], ...pts, [M[r.a].lon, M[r.a].lat]]).map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
  let km = 0; for (let i = 1; i < todo.length; i++) km += Math.hypot((todo[i][0] - todo[i - 1][0]) * 109500, (todo[i][1] - todo[i - 1][1]) * 110574) / 1000;
  salida.rutas.push({ ...r, km: +km.toFixed(1), puntos: todo });
  console.log(r.id, 'km', km.toFixed(1), 'puntos', todo.length);
}
fs.writeFileSync(OUT, zlib.gzipSync(JSON.stringify(salida)));
console.log('escrito', (fs.statSync(OUT).size / 1024).toFixed(0), 'KB');
// imagen de control del ráster y las rutas
const { PNG } = (() => { try { return require('pngjs'); } catch { return {}; } })();
fs.writeFileSync(OUT + '.debug.json', JSON.stringify({ GW, GH, B }));
fs.writeFileSync(OUT + '.tierra.bin', Buffer.from(tierra));
