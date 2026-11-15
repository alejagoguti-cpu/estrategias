// Lectura territorial: secciones de /analisis/ (transformación, capas, relaciones y relieve) dentro de la presentación.
// Sin «Fenómenos del borde» ni la genealogía de la convergencia.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export async function iniciarAnalisis(raiz, BASE) {
const $ = (s) => document.querySelector(s);
const fmt = (n, d = 0) => n.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let pausado = false; // arranca animada siempre; el botón «Pausar movimiento» la detiene
const entrada = {}; // momento en que cada sección se vio por primera vez
const intro = (id, t, dur = 1600) => { if (!entrada[id]) return 0; return clamp01((t - entrada[id]) / dur); };
const suave = (x) => 1 - Math.pow(1 - clamp01(x), 3);

const obsEntrada = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { if (!entrada[e.target.id]) entrada[e.target.id] = performance.now(); e.target.classList.add('visto'); } }), { threshold: 0.12 });
raiz.querySelectorAll('section').forEach((s) => obsEntrada.observe(s));
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
const D = await (await fetch(BASE + 'datos/capas_lectura.json')).json();
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
  const img = await cargarImg(BASE + 'assets/texturas/sat_base.jpg');
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

/* ================= transformación: pérdida de suelo y dónde (al ritmo del scroll) ================= */
const trCv = $('#tr-lienzo'); const trCx = trCv.getContext('2d');
const SECT = { tierra: [-75.57532, 10.38022], punta: [-75.5496, 10.36518], cano: [-75.543611, 10.343889], boca: [-75.58107, 10.32364] };
const NOMBRE_SECT = { tierra: 'Tierra Bomba', punta: 'Punta Arena', cano: 'Caño del Oro', boca: 'Bocachica' };
const sectCelda = Object.fromEntries(Object.entries(SECT).map(([k, ll]) => [k, llACelda(...ll)]));
const sectorDe = new Uint8Array(N); const claves = Object.keys(SECT);
for (let k = 0; k < N; k++) { if (!isla[k]) continue; const i = k % GW; const j = Math.floor(k / GW); let best = 0; let bd = 1e9; claves.forEach((s, q) => { const [a, b] = sectCelda[s]; const d = (a - i) ** 2 + (b - j) ** 2; if (d < bd) { bd = d; best = q; } }); sectorDe[k] = best; }
const haCelda = (celdaM * celdaM) / 1e4;
const aniosDe = (k) => { const v = capa.retroceso.val(k); return v < 0 ? 999 : (1 - v) * 60; };
const porSector = claves.map((s, q) => { let p30 = 0; let inu = 0; let tot = 0; for (let k = 0; k < N; k++) if (isla[k] && sectorDe[k] === q) { tot++; if (aniosDe(k) <= 30) p30++; if (capa.inundable.val(k) > 0.5) inu++; } return { s, ha30: p30 * haCelda, haInu: inu * haCelda, haTot: tot * haCelda }; });
const ESTADOS_TR = [
  { titulo: 'Pérdida de suelo', p: 'Cada tramo retrocede a la tasa de su amenaza por erosión en MIDAS. En cereza, la tierra que el mar alcanza año a año; en arena, la zona inundable oficial.', barras: [['Suelo perdido a 30 años', D.stats.haRetroceso30 / D.stats.haIsla, `${fmt(D.stats.haRetroceso30)} ha · ${fmt((100 * D.stats.haRetroceso30) / D.stats.haIsla, 0)} %`], ['Zona inundable oficial', D.stats.haInundable / D.stats.haIsla, `${fmt(D.stats.haInundable)} ha · ${fmt((100 * D.stats.haInundable) / D.stats.haIsla, 0)} %`], ['Viviendas en la franja a 30 años', 891 / 2600, '891 de 2.600']], nota: 'Malla de 47 m. Viviendas: modelo de la presentación con las 2.600 construcciones del archivo de la tesis.' },
  { titulo: '¿Dónde?', p: 'El retroceso se concentra en los bordes bajos y habitados. Por sector, hectáreas que se pierden en 30 años:', barras: porSector.map((r) => [NOMBRE_SECT[r.s], r.ha30 / Math.max(...porSector.map((x) => x.ha30)), `${fmt(r.ha30)} ha · ${fmt((100 * r.ha30) / r.haTot, 0)} %`]), nota: 'Sector de cada celda: el punto de referencia más cercano del archivo de la tesis. Porcentaje sobre el área del sector.' },
];
let trIdx = -1;
function ponerTr(i) {
  if (i === trIdx) return; trIdx = i; const e = ESTADOS_TR[i];
  raiz.querySelectorAll('[data-tr]').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.tr === i)));
  $('#tr-titulo').textContent = e.titulo; $('#tr-p').textContent = e.p; $('#tr-nota').textContent = e.nota;
  $('#barras').innerHTML = e.barras.map(([t, v, txt], q) => `<div class="barra"><span class="rotulo"><span>${t}</span><span class="dato">${txt}</span></span><i style="--v:0%;--c:${q === 1 && i === 0 ? '#f2cf94' : i === 0 && q === 0 ? '#c8102e' : 'var(--acento)'}"></i></div>`).join('');
  requestAnimationFrame(() => raiz.querySelectorAll('#barras i').forEach((el, q) => { el.style.setProperty('--v', `${Math.max(2, e.barras[q][1] * 100)}%`); }));
}
raiz.querySelectorAll('[data-tr]').forEach((b) => { b.onclick = () => { const s = $('#transformacion'); const top = s.getBoundingClientRect().top + scrollY; scrollTo({ top: top + (+b.dataset.tr + 0.5) / 2 * (s.offsetHeight - innerHeight) }); }; });
function dibujarTr(t) {
  const s = $('#transformacion'); const r = s.getBoundingClientRect();
  const p = clamp01(-r.top / Math.max(1, r.height - innerHeight)); if (r.bottom < 0 || r.top > innerHeight) return;
  const i = Math.min(1, Math.floor(p * 2)); ponerTr(i);
  const anio = i === 0 ? 30 * clamp01(p * 2 * 1.15) : 30;
  const [w, h] = ajustarLienzo(trCv); trCx.fillStyle = '#040607'; trCx.fillRect(0, 0, w, h);
  const [cx0, cy0] = sectCelda.tierra; const z = i < 1 ? 1 : 1 - clamp01((p - 0.5) * 2 * 1.4);
  const vista = { cx: cx0 + (GW / 2 - cx0) * (1 - z), cy: cy0 + (GH / 2 - cy0) * (1 - z) };
  const escCerca = Math.max(w, h) / 70; const escLejos = Math.min(w / (GW * 1.15), h / (GH * 1.08));
  const esc = Math.exp(Math.log(escCerca) * z + Math.log(escLejos) * (1 - z)); const off = [w * (innerWidth < 760 ? 0.5 : 0.56) - vista.cx * esc, h * 0.5 - vista.cy * esc];
  const rad = Math.max(0.6, esc * 0.36);
  for (let k = 0; k < N; k++) {
    if (!isla[k]) continue; const ii = k % GW; const jj = Math.floor(k / GW);
    const x = off[0] + (ii + 0.5) * esc; const y = off[1] + (jj + 0.5) * esc; if (x < -10 || y < -10 || x > w + 10 || y > h + 10) continue;
    const ya = aniosDe(k); const perdido = anio > 0 && ya <= anio; const inu = capa.inundable.val(k) > 0.5;
    let c; if (perdido) c = `rgba(${Math.round(140 + ya * 2.6)},${Math.round(10 + ya * 0.6)},${Math.round(18 + ya * 0.5)},0.95)`; else if (inu) c = 'rgba(242,207,148,0.8)'; else c = `rgb(${sat[k * 3]},${sat[k * 3 + 1]},${sat[k * 3 + 2]})`;
    const resp = pausado ? 1 : 0.82 + 0.18 * Math.sin(t * 0.002 + ii * 0.35 + jj * 0.22);
    trCx.fillStyle = c; trCx.beginPath(); trCx.arc(x, y, (perdido ? rad * 1.25 : rad) * resp, 0, 6.283); trCx.fill();
  }
  const gr = trCx.createLinearGradient(0, h, 0, h * 0.45); gr.addColorStop(0, 'rgba(4,6,7,0.92)'); gr.addColorStop(1, 'rgba(4,6,7,0)'); trCx.fillStyle = gr; trCx.fillRect(0, h * 0.45, w, h * 0.55);
  if (i === 0) { trCx.font = `300 ${Math.round(64 * DPR)}px "Barlow Condensed"`; trCx.fillStyle = 'rgba(229,48,63,0.95)'; trCx.textAlign = 'right'; trCx.fillText(`+${Math.round(anio)} AÑOS`, w - (innerWidth < 760 ? 16 : 40) * DPR, (innerWidth < 760 ? 330 : 150) * DPR); trCx.textAlign = 'left'; }
}

/* ================= 4. pila de capas en 3D: cada ráster con altura donde su valor es mayor ================= */
const orden = [...D.capas].reverse(); // la capa 12 arriba
$('#pila-lista').innerHTML = orden.map((c) => `<li><button data-capa="${c.id}"><em>${c.n}</em>${c.nombre}</button></li>`).join('');
let pHover = null;
raiz.querySelectorAll('[data-capa]').forEach((b) => { b.onmouseenter = () => { pHover = b.dataset.capa; }; b.onmouseleave = () => { pHover = null; }; b.onclick = () => abrirFicha(capa[b.dataset.capa]); });
const pCont = $('#pila-3d');
const pRen = new THREE.WebGLRenderer({ antialias: true, alpha: true }); pRen.setPixelRatio(DPR); pCont.append(pRen.domElement);
const pEsc = new THREE.Scene();
pEsc.add(new THREE.AmbientLight(0xffffff, 1.15)); const pSol = new THREE.DirectionalLight(0xffffff, 1.1); pSol.position.set(-60, 120, -40); pEsc.add(pSol);
const pCam = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);
// recorte a la caja de la isla (con margen), para que la isla llene cada capa
let bx0 = GW, bx1 = 0, by0 = GH, by1 = 0; for (let k = 0; k < N; k++) if (isla[k]) { const i = k % GW; const j = Math.floor(k / GW); bx0 = Math.min(bx0, i); bx1 = Math.max(bx1, i); by0 = Math.min(by0, j); by1 = Math.max(by1, j); }
bx0 = Math.max(0, bx0 - 4); by0 = Math.max(0, by0 - 4); bx1 = Math.min(GW - 1, bx1 + 4); by1 = Math.min(GH - 1, by1 + 4);
const BW = bx1 - bx0 + 1; const BH = by1 - by0 + 1;
const PASO = 1; const SX = Math.ceil(BW / PASO); const SY = Math.ceil(BH / PASO);
const ALT_BASE = 12; const ALT_HOVER = 40; // altura del valor máximo: en reposo y levantada
const ELEV = (38 * Math.PI) / 180; // la cámara mira la pila de lado, poco inclinada: ninguna capa tapa a otra
const DIAG = Math.hypot(BW, BH); // la pila se puede girar: la separación alcanza para cualquier ángulo
const ESCALA_PILA = 0.4; // fracción del ancho de la columna que ocupa la isla
let giroPila = 0; // giro (radianes) que se cambia arrastrando
const SEP = (DIAG * 0.82 * Math.sin(ELEV) + ALT_HOVER * Math.cos(ELEV) * 0.55) / Math.cos(ELEV) + 6; // separación entre capas: un poco más que lo que ocupa cada una en pantalla
const MAR = [0.02, 0.028, 0.034];
const islaSuave = (k) => { const i = k % GW; const j = Math.floor(k / GW); let s = 0; let n = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di; const jj = j + dj; if (ii < 0 || jj < 0 || ii >= GW || jj >= GH) continue; const w = di && dj ? 0.6 : 1; s += isla[jj * GW + ii] * w; n += w; } return s / n; };
const vecinoIsla = (k) => { const i = k % GW; const j = Math.floor(k / GW); for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di; const jj = j + dj; if (ii < 0 || jj < 0 || ii >= GW || jj >= GH) continue; const k2 = jj * GW + ii; if (isla[k2]) return k2; } return -1; };
const capas3d = orden.map((c, i) => {
  const geo = new THREE.PlaneGeometry(BW, BH, SX - 1, SY - 1); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position; const n = pos.count; const val = new Float32Array(n); const col = new Float32Array(n * 4);
  for (let v = 0; v < n; v++) {
    const ix = v % SX; const iy = Math.floor(v / SX); const k = Math.min(by1, by0 + iy * PASO) * GW + Math.min(bx1, bx0 + ix * PASO);
    let rgb; if (!isla[k]) { const k2 = vecinoIsla(k); const t2 = k2 >= 0 ? c.val(k2) : -1; rgb = k2 < 0 ? MAR.map((x) => x * 255) : t2 < 0 ? [58, 66, 72] : colorDe(c.rampa, Math.max(0.12, t2)); val[v] = 0; } else { const t = c.val(k); val[v] = Math.max(0, t); rgb = t < 0 ? [58, 66, 72] : colorDe(c.rampa, Math.max(0.12, t)); }
    col[v * 4] = rgb[0] / 255; col[v * 4 + 1] = rgb[1] / 255; col[v * 4 + 2] = rgb[2] / 255; col[v * 4 + 3] = islaSuave(k);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4));
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 });
  const malla = new THREE.Mesh(geo, mat);
  const borde = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(BW, BH).rotateX(-Math.PI / 2)), new THREE.LineBasicMaterial({ color: 0xd6e6ec, transparent: true, opacity: 0.5 }));
  borde.visible = false; // sin el cuadrado: solo la forma de la isla
  const grupo = new THREE.Group(); grupo.add(malla, borde); grupo.userData = { c, i, val, alt: ALT_BASE }; malla.userData.id = c.id;
  pEsc.add(grupo); return grupo;
});
// retícula bajo la pila, como en un plano de trabajo
// sin retícula debajo de la pila
const aplicarAltura = (g, alt) => { const pos = g.children[0].geometry.attributes.position; const val = g.userData.val; for (let v = 0; v < pos.count; v++) pos.setY(v, val[v] * alt); pos.needsUpdate = true; g.children[0].geometry.computeVertexNormals(); };
capas3d.forEach((g) => aplicarAltura(g, ALT_BASE));
const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
pRen.domElement.addEventListener('pointermove', (e) => { const r = pRen.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, pCam); const hit = ray.intersectObjects(capas3d.map((g) => g.children[0]))[0]; pHover = hit ? hit.object.userData.id : null; pRen.domElement.style.cursor = pHover ? 'pointer' : 'default'; });
pRen.domElement.addEventListener('pointerleave', () => { pHover = null; });
let arrastre = null; let movido = 0;
pRen.domElement.style.touchAction = 'pan-y'; pRen.domElement.style.cursor = 'grab';
pRen.domElement.addEventListener('pointerdown', (e) => { arrastre = e.clientX; movido = 0; pRen.domElement.setPointerCapture(e.pointerId); pRen.domElement.style.cursor = 'grabbing'; });
pRen.domElement.addEventListener('pointermove', (e) => { if (arrastre === null) return; const dx = e.clientX - arrastre; arrastre = e.clientX; movido += Math.abs(dx); giroPila += dx * 0.009; });
const soltar = () => { arrastre = null; pRen.domElement.style.cursor = 'grab'; };
pRen.domElement.addEventListener('pointerup', soltar); pRen.domElement.addEventListener('pointercancel', soltar);
pRen.domElement.addEventListener('click', () => { if (pHover && movido < 5) abrirFicha(capa[pHover]); });
function dibujarPila() {
  const r = pCont.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  // el lienzo mide lo que la pantalla (queda fijo mientras se baja) y dibuja solo la parte visible de la pila:
  // un lienzo del alto de toda la pila pasaba el tamaño máximo de la tarjeta gráfica y no se dibujaba nada
  const w = Math.max(1, r.width); const h = Math.max(1, r.height); const vh = Math.max(1, Math.min(innerHeight, h));
  if (pRen.domElement.width !== Math.round(w * DPR) || pRen.domElement.height !== Math.round(vh * DPR)) pRen.setSize(w, vh, false);
  // cámara isométrica; la pila completa cabe en el cuadro
  const alto = (orden.length - 1) * SEP * Math.cos(ELEV) + BW * Math.sin(ELEV) + ALT_HOVER + 40;
  // la pila llena el ancho de su columna; el bloque se alarga lo necesario para que quepan todas las capas
  const altoPx = Math.round(w * ESCALA_PILA * alto / (DIAG * 1.04));
  if (Math.abs(pCont.offsetHeight - altoPx) > 2) pCont.style.height = `${altoPx}px`;
  const mitadH = Math.max(alto * 0.5, (DIAG * 0.52 / ESCALA_PILA) / (w / h));
  pCam.left = -mitadH * (w / h); pCam.right = mitadH * (w / h); pCam.top = mitadH; pCam.bottom = -mitadH;
  const offY = Math.max(0, Math.min(h - vh, -r.top)); pCam.setViewOffset(w, h, 0, offY, w, vh);
  
  const d = 900; const cy = -((orden.length - 1) * SEP) / 2 + 20; pCam.position.set(Math.cos(ELEV) * Math.cos(giroPila) * d, cy + Math.sin(ELEV) * d, Math.cos(ELEV) * Math.sin(giroPila) * d); pCam.lookAt(0, cy, 0);
  raiz.querySelectorAll('[data-capa]').forEach((b) => (b.dataset.capa === pHover ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
  const ahora = performance.now(); const ia = intro('capas', ahora, 2600);
  capas3d.forEach((g) => {
    const { c, i } = g.userData; const sel = c.id === pHover;
    const ola = pausado || pHover ? 0 : Math.max(0, Math.sin(ahora * 0.0011 - i * 0.55)) ** 6; const meta = sel ? ALT_HOVER : ALT_BASE + ola * 22; const nueva = g.userData.alt + (meta - g.userData.alt) * 0.14;
    if (Math.abs(nueva - g.userData.alt) > 0.02) { g.userData.alt = nueva; aplicarAltura(g, nueva); }
    const ic = suave((ia - (orden.length - 1 - i) * 0.06) / 0.4);
    const flota = pausado ? 0 : Math.sin(ahora * 0.0012 + i * 0.6) * 3.2 + ola * 10;
    const iSel = pHover ? orden.findIndex((o) => o.id === pHover) : -1; const sube = iSel >= 0 && i < iSel ? 26 : sel ? 6 : 0; /* las capas de encima se abren como un cajón */ g.userData.sube = (g.userData.sube || 0) + (sube - (g.userData.sube || 0)) * 0.14;
    g.position.y = -i * SEP + flota + g.userData.sube + (1 - ic) * 260;
    g.visible = ic > 0.01; g.children[0].material.color.setScalar(pHover && !sel ? 0.4 : 1);
    g.children[1].material.color.set(sel ? 0xff6b4a : 0xd6e6ec); g.children[1].material.opacity = ic * (sel ? 0.95 : 0.45 + 0.4 * ola);
  });
  pRen.render(pEsc, pCam);
}
function abrirFicha(c) {
  const f = $('#ficha-capa');
  f.innerHTML = `<button class="cerrar" aria-label="Cerrar">✕</button><p class="rotulo">Capa ${c.n}</p><h3>${c.nombre}</h3><dl><dt>Unidad</dt><dd>${c.unidad}</dd><dt>Rango</dt><dd class="dato">${c.rango.join(' – ')}</dd><dt>Normalización</dt><dd>${c.metodo}</dd><dt>Fuente</dt><dd>${c.fuente}</dd></dl>`;
  const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; cv.getContext('2d').drawImage(c.lienzo, 0, 0); cv.style.maxHeight = '40vh'; cv.style.width = 'auto'; f.append(cv);
  const rb = document.createElement('div'); rb.className = 'rampa'; rb.style.cssText = 'position:static;width:100%;margin-top:8px'; rb.innerHTML = `<i style="background:${gradCSS(c.rampa)}"></i><div><span>bajo</span><span>alto</span></div>`; f.append(rb);
  f.classList.add('on'); f.querySelector('.cerrar').onclick = () => f.classList.remove('on');
}
const alEsc = (e) => { if (e.key === 'Escape') $('#ficha-capa').classList.remove('on'); }; addEventListener('keydown', alEsc);
/* ================= 5. relaciones ================= */
const TEXTOS_REL = {
  '': `${D.capas.length} lecturas del mismo encuadre, sobre la misma malla de 47 m. Hasta aquí cada una se lee sola; desde aquí empiezan a relacionarse.`,
  'modo-norm': 'Cada variable llega en su propia unidad: metros, años, clases, conteos. Para hablar un lenguaje comparable se lleva a 0–1 con el método que le corresponde; no hay una sola normalización.',
  'modo-media': 'Varias capas del mismo proceso comparten un peso: la cobertura arbórea y los registros de especies se promedian en el valor ecológico, con pesos iguales.',
  'modo-op': 'Las capas que describen el mar (distancia a la costa, amenaza, retroceso y zona inundable) se unen en la exposición; desde ella se cruzan con la gente, la red y la vida.',
};
const ENMEDIA = new Set(['arboles', 'especies']); const ENOP = new Set(['costa', 'amenaza', 'retroceso', 'inundable']);
$('#rejilla').innerHTML = D.capas.map((c) => `<div class="mini ${ENMEDIA.has(c.id) ? 'peso' : ''} ${ENOP.has(c.id) ? 'op' : ''}" data-mini="${c.id}"><b>${c.n}</b><span>${c.nombre}</span><div class="metodo">${c.metodo}</div></div>`).join('');
raiz.querySelectorAll('[data-mini]').forEach((el) => { const c = capa[el.dataset.mini]; const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; const cx = cv.getContext('2d'); cx.fillStyle = '#000'; cx.fillRect(0, 0, GW, GH); cx.imageSmoothingEnabled = false; cx.drawImage(c.lienzo, 0, 0); el.prepend(cv); el.onclick = () => abrirFicha(c); el.style.cursor = 'pointer'; });
function modoRel(m) { $('#rejilla').className = `rejilla ${m}`; $('#rel-texto').textContent = TEXTOS_REL[m]; raiz.querySelectorAll('#rel-pestanas button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.modo === m))); }
raiz.querySelectorAll('#rel-pestanas button').forEach((b) => { b.onclick = () => modoRel(b.dataset.modo); }); modoRel('');
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
const ctrl3d = new OrbitControls(cam, renderer.domElement); ctrl3d.enableDamping = true; ctrl3d.autoRotate = !pausado; ctrl3d.autoRotateSpeed = 0.9; ctrl3d.maxPolarAngle = Math.PI * 0.48; ctrl3d.minDistance = 1500; ctrl3d.maxDistance = 16000;
cam.position.set(2600, 6200, 7600); ctrl3d.target.set(0, 0, 0);
const MODOS = [['relieve', 'Solo relieve'], ['E', 'Exposición'], ['H', 'Presión habitacional'], ['R', 'Red expuesta'], ['V', 'Valor ecológico'], ['inundable', 'Zona inundable'], ['economia', 'Economía y turismo'], ['sintesis', 'Síntesis de picos'], ['drenaje', 'Drenaje y escorrentía'], ['retroceso', 'Años hasta el retroceso']];
const TEXTO_REL = 'El terreno real de la isla, de 0 a {max} m, como una superficie de líneas y puntos. Elija una capa para vestir la topografía con sus valores; arrastre para girarla.';
$('#relieve-texto').textContent = TEXTO_REL.replace('{max}', fmt(D.stats.elevMax));
const colsBase = new Float32Array(nv * 3); let modoActual = 'relieve';
const zMin = -GH / 2 * celdaM; const zRango = GH * celdaM;
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
  geo.attributes.color.needsUpdate = true; colsBase.set(cols); modoActual = modo;
  $('#rampa').innerHTML = rampa ? `<i style="background:${gradCSS(rampa)}"></i><div><span>bajo</span><span>${MODOS.find((m) => m[0] === modo)[1]}</span><span>alto</span></div>` : '';
  raiz.querySelectorAll('[data-modo3d]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo3d === modo)));
}
$('#chips').innerHTML = MODOS.map(([m, t]) => `<button class="chip" data-modo3d="${m}" aria-pressed="false">${IND[m] ? `<b>${m}</b>` : ''}${t}</button>`).join('');
raiz.querySelectorAll('[data-modo3d]').forEach((b) => { b.onclick = () => pintar(b.dataset.modo3d); });
pintar('relieve');
function dibujar3d(t) { const r = cont.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  // el relieve se levanta al entrar y un barrido de luz lo recorre de norte a sur
  const sube = suave(intro('relieve', t, 2400)); lineas.scale.y = puntos.scale.y = Math.max(0.001, sube);
  if (!pausado) { const zb = zMin + (((t * 0.00011) % 1.3) - 0.15) * zRango; const ancho = zRango * 0.05; for (let v = 0; v < nv; v++) { const dz = Math.abs(pos[v * 3 + 2] - zb); const k = dz < ancho ? 1 - dz / ancho : 0; const kk = k * k; cols[v * 3] = Math.min(1, colsBase[v * 3] + kk * 0.9); cols[v * 3 + 1] = Math.min(1, colsBase[v * 3 + 1] + kk * 0.45); cols[v * 3 + 2] = Math.min(1, colsBase[v * 3 + 2] + kk * 0.3); } geo.attributes.color.needsUpdate = true; } const w = Math.max(1, r.width); const h = Math.max(1, r.height); if (renderer.domElement.width !== Math.round(w * DPR)) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } ctrl3d.update(); renderer.render(escena, cam); }

/* ---------- bucle ---------- */
let vivo = true;
(function bucle(t) { if (!vivo) return; requestAnimationFrame(bucle); if (document.hidden) return; dibujarTr(t); dibujarPila(); dibujar3d(t); })(performance.now());
/* ---------- entrada del texto de cada sección ---------- */
raiz.querySelectorAll('section').forEach((s) => { s.querySelectorAll(':scope h2, :scope .capas-cab p, :scope .rel-cuerpo p, :scope .rel-izq > p, :scope .chips, :scope .mini, :scope .pila li').forEach((e, q) => { e.classList.add('rv'); e.style.transitionDelay = `${Math.min(q, 14) * 0.06}s`; }); });
return () => { vivo = false; obsEntrada.disconnect(); removeEventListener('keydown', alEsc); ctrl3d.dispose(); pRen.dispose(); renderer.dispose(); pRen.domElement.remove(); renderer.domElement.remove(); };

}
