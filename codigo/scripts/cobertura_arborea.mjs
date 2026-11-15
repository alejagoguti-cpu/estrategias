import puppeteer from 'puppeteer-core'; import fs from 'node:fs';
const files = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(files[0], 'utf8'));
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' });
const p = await b.newPage(); await p.goto('http://localhost:4175/', { waitUntil: 'domcontentloaded' });
const frac = await p.evaluate(async (W, GW, GH) => {
  const im = new Image(); im.src = 'assets/texturas/sat_base.jpg'; await im.decode();
  const cv = document.createElement('canvas'); cv.width = W.w; cv.height = W.h; const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(im, W.left, W.top, W.w, W.h, 0, 0, W.w, W.h); const d = cx.getImageData(0, 0, W.w, W.h).data;
  const si = new Float32Array(GW * GH); const tot = new Float32Array(GW * GH); const S = W.S;
  for (let y = 0; y < W.h; y++) for (let x = 0; x < W.w; x++) { const o = (y * W.w + x) * 4; const r = d[o], g = d[o + 1], bb = d[o + 2]; const lum = (r + g + bb) / 3; const exg = (2 * g - r - bb) / (r + g + bb + 1); const i = Math.floor(x / S), j = Math.floor(y / S); if (i >= GW || j >= GH) continue; const k = j * GW + i; tot[k]++; if (lum < 125 && exg > 0.04) si[k] += exg * (1.2 - lum / 160); }
  return Array.from(si, (v, k) => (tot[k] ? v / tot[k] : 0));
}, C.win, C.malla.gw, C.malla.gh);
await b.close();
for (const f of files) {
  const D = JSON.parse(fs.readFileSync(f, 'utf8')); const { gw: GW } = D.malla; const N = frac.length; const isla = Buffer.from(D.isla, 'base64');
  const vals = []; for (let k = 0; k < N; k++) if (isla[k]) vals.push(frac[k]); vals.sort((a, c) => a - c); const max = Math.max(0.05, vals[Math.floor(vals.length * 0.98)]);
  const v = Buffer.alloc(N, 255); for (let k = 0; k < N; k++) if (isla[k]) v[k] = Math.round(Math.min(1, frac[k] / max) * 254);
  const c = D.capas.find((x) => x.id === 'arboles');
  c.v = v.toString('base64'); c.unidad = 'índice de verdor de copas (0–1)'; c.rango = [0, +max.toFixed(3)];
  c.fuente = 'Esri World Imagery, toda la isla: índice de verdor de copas (exceso de verde en vegetación oscura), el mismo que usa la detección de copas del modelo 3D';
  c.metodo = `promedio del índice en cada celda de 47 m, lineal hasta el percentil 98 (${max.toFixed(3)})`;
  const fr = [0, 0, 0, 0]; const cnt = [0, 0, 0, 0]; for (let k = 0; k < N; k++) if (isla[k]) { const z = Math.min(3, Math.floor((Math.floor(k / GW) - 27) / 38)); fr[z] += frac[k]; cnt[z]++; }
  fs.writeFileSync(f, JSON.stringify(D));
  console.log(f.split(/[\\/]/).slice(-2).join('/'), 'p98', max.toFixed(3), 'cobertura media por franja norte→sur', fr.map((s, z) => (s / cnt[z] / max).toFixed(2)).join(' / '));
}

