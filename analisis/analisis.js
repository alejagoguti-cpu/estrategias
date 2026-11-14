import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (s) => document.querySelector(s);
const fmt = (n, d = 0) => n.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let pausado = reduce;
const DPR = Math.min(devicePixelRatio || 1, 2);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ajustarLienzo = (cv) => { const r = cv.getBoundingClientRect(); const w = Math.max(1, Math.round(r.width * DPR)); const h = Math.max(1, Math.round(r.height * DPR)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } return [w, h]; };
const cargarImg = (src) => new Promise((ok, mal) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = mal; i.src = src; });
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/* ---------- rampas de color (paleta propia, sin amarillo neón) ---------- */
const RAMPAS = {
  relieve: ['#0d2a33', '#2f6f6a', '#8fb39a', '#d9d2b8', '#f4efe6'],
  magma: ['#0b0d1e', '#3b1e5a', '#8c2f6b', '#e05a4f', '#ffb48a'],
  mar: ['#e9fbff', '#8fe3f2', '#49c6e5', '#1f6f9e', '#0b2a4a'],
  riesgo: ['#1b2f2a', '#5c6b3a', '#c98a3a', '#ff6b4a', '#ffd2c4'],
  agua: ['#141b22', '#141b22', '#2d78c8', '#49a6f0', '#9fd4ff'],
  calor: ['#130e10', '#4b1f28', '#a3343a', '#ff6b4a', '#ffd2c4'],
  viridis: ['#160f3b', '#2c3f8a', '#1f8a8a', '#53c08a', '#d8f1a0'],
  verde: ['#0d1a14', '#1d4b31', '#2f8a4f', '#7fcf7a', '#d6f5c6'],
  indice: ['#0b1216', '#1c3c4a', '#2e8aa0', '#ff8a6a', '#fff0e6'],
};
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rampaRGB = Object.fromEntries(Object.entries(RAMPAS).map(([k, v]) => [k, v.map(hexRGB)]));
const colorDe = (rampa, t) => { const st = rampaRGB[rampa]; const x = clamp01(t) * (st.length - 1); const i = Math.min(st.length - 2, Math.floor(x)); const f = x - i; return [0, 1, 2].map((k) => st[i][k] + (st[i + 1][k] - st[i][k]) * f); };
const gradCSS = (rampa) => `linear-gradient(90deg, ${RAMPAS[rampa].join(', ')})`;

/* ---------- datos ---------- */
const D = await (await fetch('capas.json')).json();
const { gw: GW, gh: GH, celdaM } = D.malla;
const N = GW * GH;
const isla = b64(D.isla);
const elev = new Uint16Array(b64(D.elev).buffer);
D.capas.forEach((c, i) => { c.n = String(i + 1).padStart(2, '0'); c.arr = b64(c.v); c.val = (k) => (c.arr[k] === 255 ? -1 : c.arr[k] / 254); });
const capa = Object.fromEntries(D.capas.map((c) => [c.id, c]));
const W = D.win; const S = W.S;
const n15 = 2 ** 15;
const llACelda = (lon, lat) => { const tx = ((lon + 180) / 360) * n15; const ty = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n15; return [((tx - W.mos.x0) * 256 - W.left) / S, ((ty - W.mos.y0) * 256 - W.top) / S]; };

// color satelital por celda
const sat = new Uint8ClampedArray(N * 3).fill(30);
try {
  const img = await cargarImg('../assets/texturas/sat_base.jpg');
  const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.imageSmoothingQuality = 'high';
  cx.drawImage(img, W.left, W.top, W.w, W.h, 0, 0, GW, GH);
  const d = cx.getImageData(0, 0, GW, GH).data;
  for (let k = 0; k < N; k++) { sat[k * 3] = d[k * 4]; sat[k * 3 + 1] = d[k * 4 + 1]; sat[k * 3 + 2] = d[k * 4 + 2]; }
} catch { /* sin imagen: los puntos quedan grises */ }

/* ---------- índices exploratorios (pesos iguales; no son índices validados) ---------- */
const v0 = (c, k) => Math.max(0, c.val(k));
const ou = (...a) => 1 - a.reduce((p, x) => p * (1 - x), 1);
const IND = {
  E: { nombre: 'Exposición costera', formula: 'E = máx(retroceso, zona inundable)', texto: 'Dónde llega primero el mar: la tierra que el retroceso alcanza antes (años invertidos) o la que está en la zona inundable oficial de MIDAS.', usa: ['costa', 'amenaza', 'retroceso', 'inundable'], f: (k) => Math.max(v0(capa.retroceso, k), v0(capa.inundable, k)) },
  H: { nombre: 'Presión habitacional', formula: 'H = √(E · construcciones)', texto: 'Alta solo donde la exposición coincide con muchas construcciones: donde el mar toca casas.', usa: ['construcciones'], de: ['E'], f: (k) => Math.sqrt(IND.E.v[k] * v0(capa.construcciones, k)) },
  R: { nombre: 'Red expuesta', formula: 'R = √(E · media(integración, elección, muelles))', texto: 'Los tramos más usados y mejor conectados de la red peatonal, y el acceso a los muelles, dentro de la franja expuesta.', usa: ['integracion', 'eleccion', 'muelles'], de: ['E'], f: (k) => Math.sqrt(IND.E.v[k] * ((v0(capa.integracion, k) + v0(capa.eleccion, k) + v0(capa.muelles, k)) / 3)) },
  V: { nombre: 'Valor ecológico', formula: 'V = media(cobertura arbórea, registros de especies)', texto: 'Dónde se concentran las copas detectadas y los registros de especies. No es un inventario: depende de dónde se ha mirado.', usa: ['arboles', 'especies'], f: (k) => (v0(capa.arboles, k) + v0(capa.especies, k)) / 2 },
  C: { nombre: 'Convergencia', formula: 'C = H ⊕ R ⊕ √(E · V)', texto: 'Dónde la pérdida de costa toca a la vez gente, caminos y vida. Cualquiera de las tres suma; ninguna resta.', de: ['H', 'R', 'E', 'V'], f: (k) => ou(IND.H.v[k], IND.R.v[k], Math.sqrt(IND.E.v[k] * IND.V.v[k])) },
};
for (const id of ['E', 'H', 'R', 'V', 'C']) { const I = IND[id]; I.id = id; I.v = new Float32Array(N); for (let k = 0; k < N; k++) I.v[k] = isla[k] ? I.f(k) : 0; }

/* ---------- lienzos de capas e índices ---------- */
const lienzoDe = (valor, rampa, fondoSat = false) => {
  const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH;
  const cx = cv.getContext('2d'); const im = cx.createImageData(GW, GH);
  for (let k = 0; k < N; k++) {
    if (!isla[k]) continue;
    const t = valor(k); let rgb;
    if (t < 0) rgb = fondoSat ? [sat[k * 3] * 0.35, sat[k * 3 + 1] * 0.35, sat[k * 3 + 2] * 0.35] : [38, 44, 48];
    else rgb = colorDe(rampa, t);
    im.data[k * 4] = rgb[0]; im.data[k * 4 + 1] = rgb[1]; im.data[k * 4 + 2] = rgb[2]; im.data[k * 4 + 3] = 255;
  }
  cx.putImageData(im, 0, 0); return cv;
};
D.capas.forEach((c) => { c.lienzo = lienzoDe((k) => c.val(k), c.rampa); });
Object.values(IND).forEach((I) => { I.lienzo = lienzoDe((k) => I.v[k], 'indice'); });
const satLienzo = (() => { const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; const cx = cv.getContext('2d'); const im = cx.createImageData(GW, GH); for (let k = 0; k < N; k++) if (isla[k]) { im.data.set([sat[k * 3], sat[k * 3 + 1], sat[k * 3 + 2], 255], k * 4); } cx.putImageData(im, 0, 0); return cv; })();

/* ---------- navegación ---------- */
const enlaces = [...document.querySelectorAll('header nav a')];
const obs = new IntersectionObserver((ents) => { ents.forEach((e) => { if (e.isIntersecting) enlaces.forEach((a) => (a.getAttribute('href') === `#${e.target.id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'))); }); }, { rootMargin: '-45% 0px -50% 0px' });
['inicio', 'transformacion', 'territorio', 'capas', 'relaciones', 'genealogia', 'relieve'].forEach((id) => obs.observe(document.getElementById(id)));
document.querySelectorAll('[data-pausa]').forEach((b) => { b.textContent = pausado ? 'Reanudar movimiento' : 'Pausar movimiento'; b.onclick = () => { pausado = !pausado; document.querySelectorAll('[data-pausa]').forEach((x) => { x.textContent = pausado ? 'Reanudar movimiento' : 'Pausar movimiento'; }); if (ctrl3d) ctrl3d.autoRotate = !pausado; }; });

/* ================= 1. portada: campo de puntos y especies en puntos ================= */
const campo = $('#campo'); const ccx = campo.getContext('2d');
const NP = innerWidth < 760 ? 4500 : 11000;
const pts = Array.from({ length: NP }, () => ({ x: Math.random(), y: Math.random(), r: Math.random(), z: Math.random() }));
// la silueta de la isla, tenue, del lado derecho
const islaPts = []; for (let k = 0; k < N; k += 2) if (isla[k]) islaPts.push([(k % GW) / GW, Math.floor(k / GW) / GH, sat[k * 3], sat[k * 3 + 1], sat[k * 3 + 2]]);
function dibujarCampo(t) {
  const [w, h] = ajustarLienzo(campo);
  ccx.fillStyle = '#040607'; ccx.fillRect(0, 0, w, h);
  // isla de puntos (encuadre de la isla, a la derecha)
  const ih = h * 0.86; const iw = ih * (GW / GH) * (W.w / W.h) / (GW / GH); const ix = w * (innerWidth < 760 ? 0.5 : 0.66) - iw / 2; const iy = h * 0.07;
  for (const [x, y, r, g, b] of islaPts) { ccx.fillStyle = `rgba(${r * 0.7 + 30},${g * 0.8 + 50},${b * 0.8 + 60},0.35)`; ccx.fillRect(ix + x * iw, iy + y * ih, 1.6 * DPR, 1.6 * DPR); }
  for (const p of pts) {
    const ang = Math.sin(p.x * 6 + t * 0.00007) * 2 + Math.cos(p.y * 5 - t * 0.00005) * 2;
    if (!pausado) { p.x += Math.cos(ang) * 0.00006 * (0.4 + p.z); p.y += Math.sin(ang) * 0.00006 * (0.4 + p.z); if (p.x < 0) p.x += 1; if (p.x > 1) p.x -= 1; if (p.y < 0) p.y += 1; if (p.y > 1) p.y -= 1; }
    const cxp = p.x - 0.62; const cyp = p.y - 0.48; const dens = Math.exp(-(cxp * cxp * 3 + cyp * cyp * 4));
    const a = (0.12 + 0.55 * dens) * (0.5 + 0.5 * p.r);
    const c = p.z > 0.82 ? `rgba(220,248,255,${a})` : p.z > 0.4 ? `rgba(73,198,229,${a * 0.85})` : `rgba(46,130,140,${a * 0.7})`;
    ccx.fillStyle = c; const s = (0.8 + p.z * 1.6) * DPR; ccx.fillRect(p.x * w, p.y * h, s, s);
  }
}
// especies dibujadas con puntos (fotos de iNaturalist de la red de especies)
const ESP = await (await fetch('../assets/data/especies.json')).json();
const destacadas = [[1432779, 0.43, 0.16, 300], [120917, 0.79, 0.62, 74], [144541, 0.55, 0.66, 64], [708104, 0.76, 0.24, 52]];
async function fichaPuntos({ tid, x, y, lado, grande }) {
  const sp = ESP.species.find((s) => s.tid === tid); if (!sp) return;
  const div = document.createElement('div'); div.className = 'ficha-esp';
  const cv = document.createElement('canvas'); div.append(cv);
  const lbl = document.createElement('b'); lbl.textContent = String(sp.n).padStart(2, '0'); div.append(lbl);
  if (grande) { const n = document.createElement('span'); n.textContent = sp.es; div.append(n); }
  $('#fichas').append(div);
  const colocar = () => { const L = innerWidth < 760 ? lado * 0.62 : lado; div.style.width = div.style.height = `${L}px`; div.style.left = `${(innerWidth < 760 ? 0.5 : x) * innerWidth - (innerWidth < 760 ? L / 2 : 0)}px`; div.style.top = `${(innerWidth < 760 ? (grande ? 0.16 : y + 0.1) : y) * innerHeight}px`; if (innerWidth < 760 && !grande) div.style.display = 'none'; };
  colocar(); addEventListener('resize', colocar);
  try {
    let img = await cargarImg(`../assets/fotos/${tid}.webp`);
    const tmp = document.createElement('canvas'); const R = grande ? 110 : 40; tmp.width = R; tmp.height = R;
    const tx = tmp.getContext('2d', { willReadFrequently: true }); const m = Math.min(img.width, img.height);
    tx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, R, R);
    let d; try { d = tx.getImageData(0, 0, R, R).data; } catch { img = await cargarImg(`../assets/fotos/${tid}.webp`); tx.drawImage(img, (img.width - Math.min(img.width, img.height)) / 2, (img.height - Math.min(img.width, img.height)) / 2, Math.min(img.width, img.height), Math.min(img.width, img.height), 0, 0, R, R); d = tx.getImageData(0, 0, R, R).data; }
    const [w, h] = ajustarLienzo(cv); const cx = cv.getContext('2d'); cx.fillStyle = '#000'; cx.fillRect(0, 0, w, h);
    const paso = w / R;
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) { const o = (j * R + i) * 4; const lum = (d[o] + d[o + 1] + d[o + 2]) / 765; cx.fillStyle = `rgb(${d[o]},${d[o + 1]},${d[o + 2]})`; const r = paso * (0.18 + 0.32 * lum); cx.beginPath(); cx.arc((i + 0.5) * paso + (Math.random() - 0.5) * paso * 0.3, (j + 0.5) * paso + (Math.random() - 0.5) * paso * 0.3, r, 0, 6.283); cx.fill(); }
  } catch { /* sin foto */ }
}
destacadas.forEach(([tid, x, y, lado], i) => fichaPuntos({ tid, x, y, lado, grande: i === 0 }));

/* ================= 2. transformación (retroceso y zona inundable, al ritmo del scroll) ================= */
const trCv = $('#tr-lienzo'); const trCx = trCv.getContext('2d');
const SECT = ESP && { tierra: [-75.57532, 10.38022], punta: [-75.5496, 10.36518], cano: [-75.543611, 10.343889], boca: [-75.58107, 10.32364] };
const NOMBRE_SECT = { tierra: 'Tierra Bomba', punta: 'Punta Arena', cano: 'Caño del Oro', boca: 'Bocachica' };
const CONS_SECT = { tierra: 770, punta: 385, cano: 441, boca: 1004 };
const sectCelda = Object.fromEntries(Object.entries(SECT).map(([k, ll]) => [k, llACelda(...ll)]));
const sectorDe = new Uint8Array(N); const claves = Object.keys(SECT);
for (let k = 0; k < N; k++) { if (!isla[k]) continue; const i = k % GW; const j = Math.floor(k / GW); let best = 0; let bd = 1e9; claves.forEach((s, q) => { const [a, b] = sectCelda[s]; const d = (a - i) ** 2 + (b - j) ** 2; if (d < bd) { bd = d; best = q; } }); sectorDe[k] = best; }
const haCelda = (celdaM * celdaM) / 1e4;
const aniosDe = (k) => { const v = capa.retroceso.val(k); return v < 0 ? 999 : (1 - v) * 60; }; // capa invertida 0..60 años
const porSector = claves.map((s, q) => { let p30 = 0; let inu = 0; let tot = 0; for (let k = 0; k < N; k++) if (isla[k] && sectorDe[k] === q) { tot++; if (aniosDe(k) <= 30) p30++; if (capa.inundable.val(k) > 0.5) inu++; } return { s, ha30: p30 * haCelda, haInu: inu * haCelda, haTot: tot * haCelda }; });
const ESTADOS_TR = [
  { titulo: 'Fenómenos del borde', p: 'El oleaje, el mar de leva y el ascenso del nivel del mar actúan sobre una costa baja y habitada. La isla pierde suelo por tramos, a ritmos distintos.', barras: [['Retroceso promedio medido', 0.63 / 3, '0,63 m/año'], ['Retroceso máximo medido', 1, '3 m/año'], ['Ascenso del nivel del mar', 0.5, '2 a 5 mm/año']], nota: 'INVEMAR-MADS-Alcaldía de Cartagena-CDKN (2012), pp. 11 y 20: fotografías aéreas 1994–2011. Barras relativas al máximo de cada grupo.' },
  { titulo: 'Pérdida de suelo', p: 'Cada tramo retrocede a la tasa de su amenaza por erosión en MIDAS. En rojo, la tierra que el mar alcanza año a año; en azul, la zona inundable oficial.', barras: [['Suelo perdido a 30 años', D.stats.haRetroceso30 / D.stats.haIsla, `${fmt(D.stats.haRetroceso30)} ha · ${fmt((100 * D.stats.haRetroceso30) / D.stats.haIsla, 0)} %`], ['Zona inundable oficial', D.stats.haInundable / D.stats.haIsla, `${fmt(D.stats.haInundable)} ha · ${fmt((100 * D.stats.haInundable) / D.stats.haIsla, 0)} %`], ['Viviendas en la franja a 30 años', 891 / 2600, '891 de 2.600']], nota: 'Malla de 47 m. Viviendas: modelo de la presentación principal con las 2.600 construcciones del archivo de la tesis.' },
  { titulo: '¿Dónde?', p: 'El retroceso se concentra en los bordes bajos y habitados. Por sector, hectáreas que se pierden en 30 años:', barras: porSector.map((r) => [NOMBRE_SECT[r.s], r.ha30 / Math.max(...porSector.map((x) => x.ha30)), `${fmt(r.ha30)} ha · ${fmt((100 * r.ha30) / r.haTot, 0)} %`]), nota: 'Sector de cada celda: el punto de referencia más cercano del archivo de la tesis. Porcentaje sobre el área del sector.' },
];
let trIdx = -1;
function ponerTr(i) {
  if (i === trIdx) return; trIdx = i; const e = ESTADOS_TR[i];
  document.querySelectorAll('[data-tr]').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.tr === i)));
  $('#tr-titulo').textContent = e.titulo; $('#tr-p').textContent = e.p; $('#tr-nota').textContent = e.nota;
  $('#barras').innerHTML = e.barras.map(([t, v, txt], q) => `<div class="barra"><span class="rotulo"><span>${t}</span><span class="dato">${txt}</span></span><i style="--v:0%;--c:${q === 1 && i === 1 ? 'var(--mar)' : 'var(--acento)'}"></i></div>`).join('');
  requestAnimationFrame(() => document.querySelectorAll('#barras i').forEach((el, q) => { el.style.setProperty('--v', `${Math.max(2, e.barras[q][1] * 100)}%`); }));
}
document.querySelectorAll('[data-tr]').forEach((b) => { b.onclick = () => { const s = $('#transformacion'); scrollTo({ top: s.offsetTop + (+b.dataset.tr + 0.5) / 3 * (s.offsetHeight - innerHeight) }); }; });
function dibujarTr(t) {
  const s = $('#transformacion'); const r = s.getBoundingClientRect();
  const p = clamp01(-r.top / Math.max(1, r.height - innerHeight)); if (r.bottom < 0 || r.top > innerHeight) return;
  const i = Math.min(2, Math.floor(p * 3)); ponerTr(i);
  const anio = i === 0 ? 0 : i === 1 ? 30 * clamp01((p - 1 / 3) * 3 * 1.15) : 30;
  const [w, h] = ajustarLienzo(trCv); trCx.fillStyle = '#040607'; trCx.fillRect(0, 0, w, h);
  // encuadre: de un acercamiento al pueblo de Tierra Bomba a la isla completa
  const [cx0, cy0] = sectCelda.tierra; const z = i < 2 ? 1 : 1 - clamp01((p - 2 / 3) * 3 * 1.4);
  const vista = { cx: cx0 + (GW / 2 - cx0) * (1 - z), cy: cy0 + (GH / 2 - cy0) * (1 - z) };
  const escCerca = Math.max(w, h) / 70; const escLejos = Math.min(w / (GW * 1.15), h / (GH * 1.08));
  const esc = Math.exp(Math.log(escCerca) * z + Math.log(escLejos) * (1 - z)); const off = [w * (innerWidth < 760 ? 0.5 : 0.56) - vista.cx * esc, h * 0.5 - vista.cy * esc];
  const rad = Math.max(0.6, esc * 0.36);
  for (let k = 0; k < N; k++) {
    if (!isla[k]) continue; const ii = k % GW; const jj = Math.floor(k / GW);
    const x = off[0] + (ii + 0.5) * esc; const y = off[1] + (jj + 0.5) * esc; if (x < -10 || y < -10 || x > w + 10 || y > h + 10) continue;
    const ya = aniosDe(k); const perdido = anio > 0 && ya <= anio; const inu = i >= 1 && capa.inundable.val(k) > 0.5;
    let c; if (perdido) c = `rgba(255,${Math.round(70 + ya * 3)},${Math.round(50 + ya * 2)},0.95)`; else if (inu) c = 'rgba(73,166,240,0.85)'; else c = `rgb(${sat[k * 3]},${sat[k * 3 + 1]},${sat[k * 3 + 2]})`;
    trCx.fillStyle = c; trCx.beginPath(); trCx.arc(x, y, perdido ? rad * 1.25 : rad, 0, 6.283); trCx.fill();
  }
  // sombra para que el texto se lea sobre los puntos
  const gr = trCx.createLinearGradient(0, h, 0, h * 0.45); gr.addColorStop(0, 'rgba(4,6,7,0.92)'); gr.addColorStop(1, 'rgba(4,6,7,0)'); trCx.fillStyle = gr; trCx.fillRect(0, h * 0.45, w, h * 0.55);
  if (i === 1) { trCx.font = `300 ${Math.round(64 * DPR)}px "Barlow Condensed"`; trCx.fillStyle = 'rgba(255,107,74,0.95)'; trCx.textAlign = 'right'; trCx.fillText(`+${Math.round(anio)} AÑOS`, w - (innerWidth < 760 ? 16 : 40) * DPR, (innerWidth < 760 ? 330 : 150) * DPR); }
}

/* ================= 3. territorio: la isla y sus sectores ================= */
const tCv = $('#terr-lienzo'); const tCx = tCv.getContext('2d');
const MARCOS = { isla: { cx: GW / 2, cy: GH / 2, ancho: GW * 1.15 } };
claves.forEach((s) => { const [a, b] = sectCelda[s]; MARCOS[s] = { cx: a, cy: b, ancho: 42 }; });
let tObj = 'isla'; const tCam = { ...MARCOS.isla }; let tHover = null;
const textoSector = (s) => { if (s === 'isla') return `${fmt(D.stats.haIsla)} ha de tierra emergida, ${fmt(D.stats.elevMax)} m de altura máxima en el relieve usado y 2.600 construcciones en cuatro sectores. Haga clic en un punto rojo para acercarse.`; const r = porSector[claves.indexOf(s)]; return `${fmt(CONS_SECT[s])} construcciones del archivo de la tesis. ${fmt(r.haTot)} ha de sector; ${fmt(r.ha30)} ha se pierden en 30 años y ${fmt(r.haInu)} ha están en la zona inundable oficial.`; };
function ponerMiga() {
  $('#miga').innerHTML = [['isla', 'La isla'], ...claves.map((s) => [s, NOMBRE_SECT[s]])].map(([k, t], q) => `${q ? '<i></i>' : ''}<button data-ir="${k}" ${k === tObj ? 'aria-current="true"' : ''}>${t}</button>`).join('') + `<button class="zoom" data-ir="${tObj === 'isla' ? 'tierra' : 'isla'}">${tObj === 'isla' ? 'Zoom' : 'Isla'}</button>`;
  document.querySelectorAll('[data-ir]').forEach((b) => { b.onclick = () => irSector(b.dataset.ir); });
  $('#terr-nombre').textContent = tObj === 'isla' ? 'La isla' : NOMBRE_SECT[tObj]; $('#terr-texto').textContent = textoSector(tObj);
}
function irSector(s) { tObj = s; ponerMiga(); }
ponerMiga();
const tGeom = () => { const [w, h] = ajustarLienzo(tCv); const esc = Math.min(w / tCam.ancho, h / (tCam.ancho * GH / GW)); return { w, h, esc, ox: w / 2 - tCam.cx * esc, oy: h / 2 - tCam.cy * esc }; };
tCv.addEventListener('pointermove', (e) => { const g = tGeom(); const r = tCv.getBoundingClientRect(); const mx = (e.clientX - r.left) * DPR; const my = (e.clientY - r.top) * DPR; tHover = claves.find((s) => { const [a, b] = sectCelda[s]; return Math.hypot(g.ox + a * g.esc - mx, g.oy + b * g.esc - my) < 22 * DPR; }) || null; tCv.style.cursor = tHover ? 'pointer' : 'default'; });
tCv.addEventListener('click', () => { if (tHover) irSector(tHover); else if (tObj !== 'isla') irSector('isla'); });
function dibujarTerr(t) {
  const r = tCv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  const M = MARCOS[tObj]; const k = pausado ? 1 : 0.08; tCam.cx += (M.cx - tCam.cx) * k; tCam.cy += (M.cy - tCam.cy) * k; tCam.ancho += (M.ancho - tCam.ancho) * k;
  const g = tGeom(); tCx.fillStyle = '#040607'; tCx.fillRect(0, 0, g.w, g.h);
  const rad = Math.max(0.7, g.esc * 0.34);
  for (let q = 0; q < N; q++) { if (!isla[q]) continue; const x = g.ox + ((q % GW) + 0.5) * g.esc; const y = g.oy + (Math.floor(q / GW) + 0.5) * g.esc; if (x < -5 || y < -5 || x > g.w + 5 || y > g.h + 5) continue; tCx.fillStyle = `rgb(${sat[q * 3] * 0.9 + 20},${sat[q * 3 + 1] * 0.9 + 26},${sat[q * 3 + 2] * 0.9 + 30})`; tCx.beginPath(); tCx.arc(x, y, rad, 0, 6.283); tCx.fill(); }
  claves.forEach((s) => { const [a, b] = sectCelda[s]; const x = g.ox + a * g.esc; const y = g.oy + b * g.esc; const pul = 0.5 + 0.5 * Math.sin(t * 0.004); tCx.strokeStyle = `rgba(255,107,74,${0.4 + 0.4 * pul})`; tCx.lineWidth = 1.5 * DPR; tCx.beginPath(); tCx.arc(x, y, (8 + 8 * pul) * DPR, 0, 6.283); tCx.stroke(); tCx.fillStyle = '#ff6b4a'; tCx.beginPath(); tCx.arc(x, y, 4.5 * DPR, 0, 6.283); tCx.fill(); tCx.font = `500 ${12 * DPR}px "Geist Mono"`; tCx.fillStyle = s === tHover || s === tObj ? '#e8eef0' : '#a7b3b8'; tCx.fillText(NOMBRE_SECT[s].toUpperCase(), x + 12 * DPR, y + 4 * DPR); });
}

/* ================= 4. pila de capas en isométrico ================= */
const pCv = $('#pila-lienzo'); const pCx = pCv.getContext('2d');
const orden = [...D.capas].reverse(); // la capa 12 arriba
$('#pila-lista').innerHTML = orden.map((c) => `<li><button data-capa="${c.id}"><em>${c.n}</em>${c.nombre}</button></li>`).join('');
let pHover = null; const lev = Object.fromEntries(D.capas.map((c) => [c.id, 0]));
document.querySelectorAll('[data-capa]').forEach((b) => { b.onmouseenter = () => { pHover = b.dataset.capa; }; b.onmouseleave = () => { pHover = null; }; b.onclick = () => abrirFicha(capa[b.dataset.capa]); });
const isoGeom = () => {
  const [w, h] = ajustarLienzo(pCv); const ancho = Math.min(w * 0.82, h * 0.95); const ux = [ancho / GW * 0.5 * Math.cos(Math.PI / 6) * 1.3, ancho / GW * 0.5 * 0.5 * 1.3]; const uy = [-ancho / GW * 0.5 * Math.cos(Math.PI / 6) * 1.3 * 0.62, ancho / GW * 0.5 * 0.5 * 1.3 * 0.62];
  const gap = (h * 0.5) / D.capas.length; const top = h * 0.08; return { w, h, ux, uy, gap, x0: w * 0.5 - (ux[0] * GW + uy[0] * GH) / 2, top };
};
const enCapa = (g, idx, mx, my) => { const y0 = g.top + idx * g.gap - lev[orden[idx].id]; const det = g.ux[0] * g.uy[1] - g.uy[0] * g.ux[1]; const dx = mx - g.x0; const dy = my - y0; const a = (dx * g.uy[1] - dy * g.uy[0]) / det; const b = (g.ux[0] * dy - g.ux[1] * dx) / det; return a >= 0 && b >= 0 && a <= GW && b <= GH; };
pCv.addEventListener('pointermove', (e) => { const g = isoGeom(); const r = pCv.getBoundingClientRect(); const mx = (e.clientX - r.left) * DPR; const my = (e.clientY - r.top) * DPR; let hit = null; for (let i = 0; i < orden.length; i++) if (enCapa(g, i, mx, my)) { hit = orden[i].id; break; } pHover = hit; pCv.style.cursor = hit ? 'pointer' : 'default'; });
pCv.addEventListener('pointerleave', () => { pHover = null; });
pCv.addEventListener('click', () => { if (pHover) abrirFicha(capa[pHover]); });
function dibujarPila() {
  const r = pCv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  const g = isoGeom(); pCx.setTransform(1, 0, 0, 1, 0, 0); pCx.clearRect(0, 0, g.w, g.h);
  document.querySelectorAll('[data-capa]').forEach((b) => (b.dataset.capa === pHover ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
  for (let i = orden.length - 1; i >= 0; i--) {
    const c = orden[i]; lev[c.id] += ((c.id === pHover ? g.gap * 2.6 : 0) - lev[c.id]) * 0.18; const y0 = g.top + i * g.gap - lev[c.id];
    pCx.setTransform(g.ux[0], g.ux[1], g.uy[0], g.uy[1], g.x0, y0);
    pCx.imageSmoothingEnabled = false; pCx.globalAlpha = pHover && c.id !== pHover ? 0.55 : 1;
    pCx.drawImage(c.lienzo, 0, 0);
    pCx.globalAlpha = 1; pCx.strokeStyle = c.id === pHover ? 'rgba(255,107,74,.9)' : 'rgba(214,230,236,.22)'; pCx.lineWidth = 1 / Math.hypot(g.ux[0], g.ux[1]); pCx.strokeRect(0, 0, GW, GH);
  }
  pCx.setTransform(1, 0, 0, 1, 0, 0);
}
function abrirFicha(c) {
  const f = $('#ficha-capa');
  f.innerHTML = `<button class="cerrar" aria-label="Cerrar">✕</button><p class="rotulo">Capa ${c.n}</p><h3>${c.nombre}</h3><dl><dt>Unidad</dt><dd>${c.unidad}</dd><dt>Rango</dt><dd class="dato">${c.rango.join(' – ')}</dd><dt>Normalización</dt><dd>${c.metodo}</dd><dt>Fuente</dt><dd>${c.fuente}</dd></dl>`;
  const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; cv.getContext('2d').drawImage(c.lienzo, 0, 0); cv.style.maxHeight = '40vh'; cv.style.width = 'auto'; f.append(cv);
  const rb = document.createElement('div'); rb.className = 'rampa'; rb.style.cssText = 'position:static;width:100%;margin-top:8px'; rb.innerHTML = `<i style="background:${gradCSS(c.rampa)}"></i><div><span>bajo</span><span>alto</span></div>`; f.append(rb);
  f.classList.add('on'); f.querySelector('.cerrar').onclick = () => f.classList.remove('on');
}
addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#ficha-capa').classList.remove('on'); });

/* ================= 5. relaciones ================= */
const TEXTOS_REL = {
  '': '12 lecturas del mismo encuadre, sobre la misma malla de 47 m. Hasta aquí cada una se lee sola; desde aquí empiezan a relacionarse.',
  'modo-norm': 'Cada variable llega en su propia unidad: metros, años, clases, conteos. Para hablar un lenguaje comparable se lleva a 0–1 con el método que le corresponde; no hay una sola normalización.',
  'modo-media': 'Varias capas del mismo proceso comparten un peso: la cobertura arbórea y los registros de especies se promedian en el valor ecológico, con pesos iguales.',
  'modo-op': 'Las capas que describen el mar (distancia a la costa, amenaza, retroceso y zona inundable) se unen en la exposición; desde ella se cruzan con la gente, la red y la vida.',
};
const ENMEDIA = new Set(['arboles', 'especies']); const ENOP = new Set(['costa', 'amenaza', 'retroceso', 'inundable']);
$('#rejilla').innerHTML = D.capas.map((c) => `<div class="mini ${ENMEDIA.has(c.id) ? 'peso' : ''} ${ENOP.has(c.id) ? 'op' : ''}" data-mini="${c.id}"><b>${c.n}</b><span>${c.nombre}</span><div class="metodo">${c.metodo}</div></div>`).join('');
document.querySelectorAll('[data-mini]').forEach((el) => { const c = capa[el.dataset.mini]; const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; const cx = cv.getContext('2d'); cx.fillStyle = '#000'; cx.fillRect(0, 0, GW, GH); cx.imageSmoothingEnabled = false; cx.drawImage(c.lienzo, 0, 0); el.prepend(cv); el.onclick = () => abrirFicha(c); el.style.cursor = 'pointer'; });
function modoRel(m) { $('#rejilla').className = `rejilla ${m}`; $('#rel-texto').textContent = TEXTOS_REL[m]; document.querySelectorAll('#rel-pestanas button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.modo === m))); }
document.querySelectorAll('#rel-pestanas button').forEach((b) => { b.onclick = () => modoRel(b.dataset.modo); }); modoRel('');

/* ================= 6. genealogía ================= */
const svg = $('#gen-svg'); const NS = 'http://www.w3.org/2000/svg';
const yCapa = (i) => 30 + i * 43; const posI = { E: [700, 120], H: [700, 230], R: [700, 340], V: [700, 450], C: [1040, 285] };
const el = (tag, at, padre = svg) => { const e = document.createElementNS(NS, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); padre.append(e); return e; };
const fils = [];
const curva = (x0, y0, x1, y1) => `M${x0} ${y0} C${(x0 + x1) / 2} ${y0}, ${(x0 + x1) / 2} ${y1}, ${x1} ${y1}`;
D.capas.forEach((c, i) => { Object.values(IND).forEach((I) => { if (I.usa?.includes(c.id)) fils.push({ d: curva(250, yCapa(i), posI[I.id][0] - 70, posI[I.id][1]), de: c.id, a: I.id }); }); });
Object.values(IND).forEach((I) => (I.de || []).forEach((src) => { const [x0, y0] = posI[src]; const [x1, y1] = posI[I.id]; fils.push({ d: curva(x0 + 60, y0, x1 - 90, y1), de: src, a: I.id }); }));
const gFil = el('g', {}); fils.forEach((f) => { f.el = el('path', { d: f.d, class: 'filamento' }, gFil); });
const nodosCapa = D.capas.map((c, i) => { const g = el('g', { class: 'gen-nodo', transform: `translate(0 ${yCapa(i)})` }); el('text', { x: 0, y: 4, class: 'cod' }, g).textContent = c.n; el('text', { x: 28, y: 4 }, g).textContent = c.nombre; const usada = fils.some((f) => f.de === c.id); el('circle', { cx: 250, cy: 0, r: 3, fill: usada ? '#ff6b4a' : '#46505a' }, g); g.onclick = () => abrirFicha(c); g.dataset.id = c.id; return g; });
el('text', { x: 0, y: yCapa(12) + 20, class: 'nota', fill: '#6f7c82', 'font-size': 11, 'font-family': 'Geist Mono' }).textContent = 'Elevación y pendiente no entran a los índices: dan forma al relieve.';
const nodosInd = Object.values(IND).map((I) => { const [x, y] = posI[I.id]; const g = el('g', { class: 'gen-nodo gen-indice', transform: `translate(${x} ${y})`, tabindex: 0 }); el('rect', { x: -70, y: -24, width: I.id === 'C' ? 190 : 150, height: 48, fill: '#080b0d', stroke: '#ff6b4a', 'stroke-opacity': 0.45 }, g); el('text', { x: -58, y: 8 }, g).textContent = `${I.id} · ${I.nombre}`; g.dataset.id = I.id; g.onmouseenter = () => resaltar(I.id); g.onfocus = () => resaltar(I.id); g.onmouseleave = () => resaltar(null); g.onclick = () => verFormula(I.id); return g; });
nodosInd.forEach((g) => { const t = g.querySelector('text'); if (t.textContent.length > 20) t.setAttribute('font-size', '18'); });
const fuentesDe = (id, acc = new Set()) => { const I = IND[id]; (I.usa || []).forEach((u) => acc.add(u)); (I.de || []).forEach((d) => { acc.add(d); fuentesDe(d, acc); }); return acc; };
function resaltar(id) {
  const set = id ? fuentesDe(id) : null; if (set) set.add(id);
  fils.forEach((f) => { f.el.classList.toggle('on', !!set && set.has(f.de) && set.has(f.a)); f.el.classList.toggle('off', !!set && !(set.has(f.de) && set.has(f.a))); });
  [...nodosCapa, ...nodosInd].forEach((g) => g.classList.toggle('on', !!set && set.has(g.dataset.id)));
}
function verFormula(id) {
  const I = IND[id]; resaltar(id);
  $('#formula').innerHTML = `<div><p class="rotulo">Índice ${id} · lectura exploratoria</p><h3>${I.nombre}</h3><code>${I.formula}</code><p>${I.texto} Pesos iguales; no es un índice validado ni oficial.</p></div>`;
  const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; cv.getContext('2d').drawImage(I.lienzo, 0, 0); cv.style.maxHeight = '320px'; cv.style.width = 'auto'; const d = document.createElement('div'); d.append(cv); const rb = document.createElement('div'); rb.className = 'rampa'; rb.style.cssText = 'position:static;width:100%;margin-top:6px'; rb.innerHTML = `<i style="background:${gradCSS('indice')}"></i><div><span>0</span><span>1</span></div>`; d.append(rb); $('#formula').append(d);
}
verFormula('C');

/* ================= 7. relieve en 3D ================= */
const cont = $('#relieve-3d');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(DPR); cont.append(renderer.domElement);
const escena = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(36, 1, 1, 50000);
const EXAG = 6; const pos = []; const ind = [];
const P3 = (i, j) => [(i - GW / 2) * celdaM, (elev[j * GW + i] / 10) * EXAG, (j - GH / 2) * celdaM];
const idxV = new Int32Array(N).fill(-1); let nv = 0;
for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const k = j * GW + i; if (!isla[k]) continue; idxV[k] = nv++; pos.push(...P3(i, j)); }
for (let j = 0; j < GH; j++) for (let i = 0; i < GW - 1; i++) { const a = idxV[j * GW + i]; const b = idxV[j * GW + i + 1]; if (a >= 0 && b >= 0) ind.push(a, b); }
const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); const cols = new Float32Array(nv * 3); geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.setIndex(ind);
const lineas = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }));
const puntos = new THREE.Points(geo, new THREE.PointsMaterial({ vertexColors: true, size: 2.2 * DPR, sizeAttenuation: false, transparent: true, opacity: 0.9 }));
escena.add(lineas, puntos);
const ctrl3d = new OrbitControls(cam, renderer.domElement); ctrl3d.enableDamping = true; ctrl3d.autoRotate = !pausado; ctrl3d.autoRotateSpeed = 0.35; ctrl3d.maxPolarAngle = Math.PI * 0.48; ctrl3d.minDistance = 1500; ctrl3d.maxDistance = 16000;
cam.position.set(2600, 6200, 7600); ctrl3d.target.set(0, 0, 0);
const MODOS = [['relieve', 'Solo relieve'], ['E', 'Exposición'], ['H', 'Presión habitacional'], ['R', 'Red expuesta'], ['V', 'Valor ecológico'], ['C', 'Convergencia'], ['inundable', 'Zona inundable'], ['retroceso', 'Años hasta el retroceso']];
const TEXTO_REL = 'El terreno real de la isla, de 0 a {max} m, como una superficie de líneas y puntos. Elija una capa o un índice para vestir la topografía con sus valores; arrastre para girarla.';
$('#relieve-texto').textContent = TEXTO_REL.replace('{max}', fmt(D.stats.elevMax));
function pintar(modo) {
  const lum = new THREE.Vector3(-0.6, 0.7, -0.4).normalize(); let rampa = 'indice';
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const k = j * GW + i; const v = idxV[k]; if (v < 0) continue; let rgb;
    if (modo === 'relieve') {
      const hC = elev[k] / 10; const hx = (elev[j * GW + Math.min(GW - 1, i + 1)] - elev[j * GW + Math.max(0, i - 1)]) / 10 * EXAG / (2 * celdaM); const hz = (elev[Math.min(GH - 1, j + 1) * GW + i] - elev[Math.max(0, j - 1) * GW + i]) / 10 * EXAG / (2 * celdaM);
      const nrm = new THREE.Vector3(-hx, 1, -hz).normalize(); const sh = clamp01(0.35 + 0.75 * nrm.dot(lum)); const alt = clamp01(hC / D.stats.elevMax);
      rgb = [(150 + 105 * sh) * (0.75 + 0.25 * alt), (190 + 65 * sh), 230 + 25 * sh].map((x) => x * (0.45 + 0.55 * sh)); rampa = null;
    } else if (IND[modo]) rgb = colorDe('indice', IND[modo].v[k]);
    else { const c = capa[modo]; rampa = c.rampa; const t = c.val(k); rgb = t < 0 ? [50, 56, 60] : colorDe(c.rampa, t); }
    cols[v * 3] = rgb[0] / 255; cols[v * 3 + 1] = rgb[1] / 255; cols[v * 3 + 2] = rgb[2] / 255;
  }
  geo.attributes.color.needsUpdate = true;
  $('#rampa').innerHTML = rampa ? `<i style="background:${gradCSS(rampa)}"></i><div><span>bajo</span><span>${MODOS.find((m) => m[0] === modo)[1]}</span><span>alto</span></div>` : '';
  document.querySelectorAll('[data-modo3d]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo3d === modo)));
}
$('#chips').innerHTML = MODOS.map(([m, t]) => `<button class="chip" data-modo3d="${m}" aria-pressed="false">${IND[m] ? `<b>${m}</b>` : ''}${t}</button>`).join('');
document.querySelectorAll('[data-modo3d]').forEach((b) => { b.onclick = () => pintar(b.dataset.modo3d); });
pintar('relieve');
function dibujar3d() { const r = cont.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const w = Math.max(1, r.width); const h = Math.max(1, r.height); if (renderer.domElement.width !== Math.round(w * DPR)) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } ctrl3d.update(); renderer.render(escena, cam); }

/* ================= 8. fuentes ================= */
const FUENTES = [
  ['Costa y relieve', [['Línea de costa', '© OpenStreetMap contributors (ODbL)'], ['Terrain Tiles · Terrarium z12', 'Mapzen / AWS Open Data']]],
  ['Riesgo', [['MIDAS · capas de cambio climático', 'Alcaldía de Cartagena; Secretaría de Planeación-INVEMAR-CDKN (2014), consultadas el 2026-11-14'], ['Lineamientos de adaptación al cambio climático para Cartagena', 'INVEMAR-MADS-Alcaldía-CDKN (2012): tasas de retroceso y años de escenario']]],
  ['Ciudad', [['Construcciones', 'Archivo de la tesis (2.600 huellas, alturas de referencia)'], ['Vías y muelles', '© OpenStreetMap contributors (ODbL)'], ['Sintaxis espacial', 'Reimplementación del método angular de depthmapX (UCL Space Group)']]],
  ['Vida', [['Copas de árboles', 'Detección sobre Esri World Imagery (3.840 copas)'], ['Especies e interacciones', 'iNaturalist, GBIF y GloBI, compiladas en la red de especies de la isla']]],
  ['Imagen', [['Esri World Imagery', 'Esri, Maxar, Earthstar Geographics y la comunidad GIS']]],
];
$('#fuentes').innerHTML = FUENTES.map(([t, l]) => `<p class="rotulo" style="margin:0 0 6px">${t} <span class="dato" style="margin-left:8px">${l.length}</span></p>${l.map(([a, b]) => `<div class="fuente"><strong>${a}</strong><span>${b}</span></div>`).join('')}<div style="height:22px"></div>`).join('');

/* ---------- bucle ---------- */
(function bucle(t) { requestAnimationFrame(bucle); if (document.hidden) return; const r = campo.getBoundingClientRect(); if (r.bottom > 0) dibujarCampo(t); dibujarTr(t); dibujarTerr(t); dibujarPila(); dibujar3d(); })(performance.now());
