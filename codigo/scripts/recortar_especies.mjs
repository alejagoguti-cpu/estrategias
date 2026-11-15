import puppeteer from 'puppeteer-core'; import fs from 'node:fs';
const info = JSON.parse(fs.readFileSync('fotos_tramas/info.json', 'utf8'));
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new' });
const p = await b.newPage(); await p.setContent('<html><body></body></html>');
const hoja = [];
for (const [id, v] of Object.entries(info)) {
  const b64 = fs.readFileSync('fotos_tramas/' + v.archivo).toString('base64');
  const res = await p.evaluate(async (src) => {
    const S = 256; const im = new Image(); im.src = src; await im.decode();
    const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d', { willReadFrequently: true });
    const m = Math.min(im.width, im.height); x.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, S, S);
    const d = x.getImageData(0, 0, S, S); const px = d.data; const N = S * S;
    const L = new Float32Array(N); for (let k = 0; k < N; k++) L[k] = 0.3 * px[k * 4] + 0.59 * px[k * 4 + 1] + 0.11 * px[k * 4 + 2];
    const G = new Float32Array(N); for (let y = 1; y < S - 1; y++) for (let xx = 1; xx < S - 1; xx++) { const k = y * S + xx; const gx = L[k + 1] - L[k - 1] + 0.5 * (L[k - S + 1] - L[k - S - 1] + L[k + S + 1] - L[k + S - 1]); const gy = L[k + S] - L[k - S] + 0.5 * (L[k + S - 1] - L[k - S - 1] + L[k + S + 1] - L[k - S + 1]); G[k] = Math.hypot(gx, gy); }
    const caja = (A, r) => { const T = new Float32Array(N); const O = new Float32Array(N); for (let y = 0; y < S; y++) { let s = 0; for (let xx = -r; xx < S + r; xx++) { const a = Math.min(S - 1, Math.max(0, xx + r)); const bb = Math.min(S - 1, Math.max(0, xx - r - 1)); s += A[y * S + a] - (xx - r - 1 >= 0 ? A[y * S + bb] : 0); if (xx >= 0 && xx < S) T[y * S + xx] = s / (2 * r + 1); } } for (let xx = 0; xx < S; xx++) { let s = 0; for (let y = -r; y < S + r; y++) { const a = Math.min(S - 1, Math.max(0, y + r)); const bb = Math.min(S - 1, Math.max(0, y - r - 1)); s += T[a * S + xx] - (y - r - 1 >= 0 ? T[bb * S + xx] : 0); if (y >= 0 && y < S) O[y * S + xx] = s / (2 * r + 1); } } return O; };
    const E = caja(G, 7);
    // color del borde
    let br = 0, bg = 0, bb2 = 0, nb = 0; for (let k = 0; k < N; k++) { const y = Math.floor(k / S), xx = k % S; if (y < 10 || y >= S - 10 || xx < 10 || xx >= S - 10) { br += px[k * 4]; bg += px[k * 4 + 1]; bb2 += px[k * 4 + 2]; nb++; } } br /= nb; bg /= nb; bb2 /= nb;
    const D = new Float32Array(N); for (let k = 0; k < N; k++) D[k] = Math.hypot(px[k * 4] - br, px[k * 4 + 1] - bg, px[k * 4 + 2] - bb2);
    const Db = caja(D, 3);
    const norm = (A) => { const s = [...A].sort((a, c) => a - c); const lo = s[Math.floor(N * 0.05)], hi = s[Math.floor(N * 0.98)] || 1; return A.map((v) => Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1)))); };
    const En = norm(E); const Dn = norm(Db);
    const P = new Float32Array(N); for (let k = 0; k < N; k++) { const y = Math.floor(k / S) / S - 0.5, xx = (k % S) / S - 0.5; const cen = Math.exp(-(xx * xx + y * y) / (2 * 0.3 * 0.3)); P[k] = (0.45 * En[k] + 0.55 * Dn[k]) * Math.pow(cen, 0.7); }
    // umbral de Otsu
    const hist = new Array(64).fill(0); P.forEach((v) => hist[Math.min(63, Math.floor(v * 64))]++); let tot = 0; hist.forEach((h, i) => { tot += h * i; }); let sB = 0, wB = 0, best = 0, th = 20; for (let i = 0; i < 64; i++) { wB += hist[i]; if (!wB) continue; const wF = N - wB; if (!wF) break; sB += i * hist[i]; const mB = sB / wB, mF = (tot - sB) / wF; const v = wB * wF * (mB - mF) ** 2; if (v > best) { best = v; th = i; } }
    const thr = (th + 0.5) / 64; const M = new Uint8Array(N); for (let k = 0; k < N; k++) M[k] = P[k] > thr ? 1 : 0;
    // componente que toca el centro (o la mayor)
    const comp = new Int32Array(N).fill(-1); const tam = []; let id = 0;
    for (let k = 0; k < N; k++) { if (!M[k] || comp[k] >= 0) continue; const st = [k]; comp[k] = id; let n = 0; while (st.length) { const q = st.pop(); n++; const y = Math.floor(q / S), xx = q % S; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = xx + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= S || Y >= S) continue; const q2 = Y * S + X; if (M[q2] && comp[q2] < 0) { comp[q2] = id; st.push(q2); } } } tam.push(n); id++; }
    let mejor = -1, puntaje = -1; for (let i = 0; i < tam.length; i++) { let cx2 = 0, cy2 = 0, n = 0; } 
    const centro = new Map(); for (let k = 0; k < N; k++) if (comp[k] >= 0) { const y = Math.floor(k / S) / S - 0.5, xx = (k % S) / S - 0.5; const w = Math.exp(-(xx * xx + y * y) / (2 * 0.2 * 0.2)); centro.set(comp[k], (centro.get(comp[k]) || 0) + w); }
    for (const [cid, v] of centro) if (v > puntaje) { puntaje = v; mejor = cid; }
    const K = new Uint8Array(N); for (let k = 0; k < N; k++) K[k] = comp[k] === mejor ? 1 : 0;
    // cerrar: dilatar 3, rellenar huecos, erosionar 3
    const dil = (A, r) => { const O = new Uint8Array(N); for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) { if (!A[y * S + xx]) continue; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (dx * dx + dy * dy > r * r) continue; const X = xx + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < S && Y < S) O[Y * S + X] = 1; } } return O; };
    const inv = (A) => A.map((v) => 1 - v);
    let C2 = dil(K, 4);
    const fuera = new Uint8Array(N); const st = []; for (let k = 0; k < S; k++) { for (const q of [k, (S - 1) * S + k, k * S, k * S + S - 1]) if (!C2[q] && !fuera[q]) { fuera[q] = 1; st.push(q); } } while (st.length) { const q = st.pop(); const y = Math.floor(q / S), xx = q % S; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = xx + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= S || Y >= S) continue; const q2 = Y * S + X; if (!C2[q2] && !fuera[q2]) { fuera[q2] = 1; st.push(q2); } } }
    C2 = inv(dil(fuera, 4));
    const A = caja(Float32Array.from(C2), 2);
    let area = 0; for (let k = 0; k < N; k++) { px[k * 4 + 3] = Math.round(A[k] * 255); area += A[k]; }
    x.putImageData(d, 0, 0);
    return { png: c.toDataURL('image/png'), area: area / N };
  }, `data:image/jpeg;base64,${b64}`);
  fs.writeFileSync(`recortes/${id}.png`, Buffer.from(res.png.split(',')[1], 'base64'));
  hoja.push([id, v.nombre, res.area]); console.log(id, v.nombre, 'área', (res.area * 100).toFixed(0) + '%');
}
// hoja de contactos sobre negro
const html = `<body style="margin:0;background:#040607;display:grid;grid-template-columns:repeat(4,256px);gap:8px;padding:8px;font:12px monospace;color:#ccc">${hoja.map(([id, n]) => `<div><img src="data:image/png;base64,${fs.readFileSync('recortes/' + id + '.png').toString('base64')}" width=256><br>${id} ${n}</div>`).join('')}</body>`;
await p.setViewport({ width: 1080, height: 1200 }); await p.setContent(html); await p.screenshot({ path: 'recortes/hoja.png', fullPage: true });
await b.close();
