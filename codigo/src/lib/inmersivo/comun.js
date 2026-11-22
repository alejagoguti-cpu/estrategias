import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Piezas comunes de los recorridos inmersivos (marisma y humedal): materiales PBR escaneados,
// pasto con viento, árboles reales (impostores renderizados en Blender), especies 3D en puntos,
// cintas de camino/tablero y el banco solar ondulante.
export const BASE = import.meta.env.BASE_URL;
export const PAS = `${BASE}datos/pasarela/`;
const MOD = `${BASE}datos/tramas/3d/`;
export const arriba = new THREE.Vector3(0, 1, 0);
// factor de densidad de vegetación (1 = completo); lo fija el recorrido según el equipo
let CALIDAD = 1; export const fijarCalidad = (f) => { CALIDAD = f; };
const ralear = (lista) => (CALIDAD >= 1 ? lista : lista.filter((_, i) => (i * 0.6180339) % 1 < CALIDAD));

export const azar = (semilla = 7) => { let s = semilla; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const suave = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

// marco local de una curva a la distancia s: punto, tangente horizontal y lateral
export function hacerMarco(curva) {
  const L = curva.getLength();
  return (s, lado = 0) => { const u = clamp(s / L, 0, 1); const p = curva.getPointAt(u); const t = curva.getTangentAt(u).setY(0).normalize(); const l = new THREE.Vector3().crossVectors(t, arriba).normalize(); return { p: p.addScaledVector(l, lado), t, l }; };
}

// material fotoescaneado (difuso + normal + ARM)
export function pbr(tl, nombre, rep, extra = {}) {
  const t = (suf, srgb) => { const x = tl.load(`${PAS}${nombre}_${suf}.jpg`); x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(rep[0], rep[1]); x.anisotropy = 8; if (srgb) x.colorSpace = THREE.SRGBColorSpace; return x; };
  const arm = t('arm');
  return new THREE.MeshStandardMaterial({ map: t('diff', true), normalMap: t('nor'), aoMap: arm, roughnessMap: arm, metalnessMap: arm, roughness: 1, metalness: 0, ...extra });
}

export function conViento(mat, uT, fuerza = 0.22) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = uT;
    sh.vertexShader = `uniform float uT;\n${sh.vertexShader}`.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 ip = instanceMatrix[3].xyz;
      #else
        vec3 ip = vec3(0.0);
      #endif
      float hh = max(position.y, 0.0);
      float sw = sin(uT * 1.3 + ip.x * 0.12 + ip.z * 0.08) * 0.5 + 0.5;
      float rf = sin(uT * 3.6 + ip.x * 0.9 + ip.z * 0.7) * 0.18;
      transformed.x += (sw * 0.75 + rf) * hh * hh * ${fuerza.toFixed(3)};
      transformed.z += (sw * 0.3 + rf * 0.5) * hh * hh * ${fuerza.toFixed(3)};`);
  };
  return mat;
}

// briznas de pasto instanciadas con viento. puntos: [{x, y, z, h, tinte}] ; paleta: 'marisma' | 'pradera' | 'junco'
const PALETAS = {
  marisma: ['vec3(0.20,0.30,0.07)', 'vec3(0.30,0.42,0.10)', 'vec3(0.42,0.60,0.16)', 'vec3(0.52,0.68,0.20)', 'vec3(0.70,0.78,0.36)', 'vec3(0.82,0.80,0.48)'],
  pradera: ['vec3(0.16,0.27,0.06)', 'vec3(0.24,0.36,0.08)', 'vec3(0.36,0.54,0.14)', 'vec3(0.46,0.62,0.18)', 'vec3(0.62,0.72,0.30)', 'vec3(0.74,0.76,0.40)'],
  seca: ['vec3(0.30,0.24,0.12)', 'vec3(0.38,0.32,0.16)', 'vec3(0.62,0.52,0.30)', 'vec3(0.70,0.60,0.36)', 'vec3(0.86,0.78,0.54)', 'vec3(0.92,0.86,0.64)'],
  junco: ['vec3(0.12,0.20,0.06)', 'vec3(0.18,0.28,0.07)', 'vec3(0.28,0.42,0.12)', 'vec3(0.36,0.50,0.14)', 'vec3(0.50,0.58,0.24)', 'vec3(0.62,0.62,0.32)'],
};
export function crearBriznas(escena, todos, { uT, sol, nieblaU, paleta = 'marisma', ancho = 0.012 }) {
  const puntos = ralear(todos);
  const hoja = new THREE.BufferGeometry(); const vs = []; const segs = 5;
  for (let j = 0; j <= segs; j++) { const t = j / segs; const w = (1 - t * 0.92) * 0.5; if (j < segs) vs.push(-w, t, 0, w, t, 0); else vs.push(0, 1, 0); }
  const idx = []; for (let j = 0; j < segs - 1; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } idx.push((segs - 1) * 2, (segs - 1) * 2 + 1, segs * 2);
  hoja.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3)); hoja.setIndex(idx);
  const ig = new THREE.InstancedBufferGeometry(); ig.index = hoja.index; ig.attributes.position = hoja.attributes.position;
  const pos = new Float32Array(puntos.length * 3); const par = new Float32Array(puntos.length * 4); const r = azar(puntos.length + 3);
  puntos.forEach((p, i) => { pos.set([p.x, p.y, p.z], i * 3); par.set([p.h, r() * 6.283, (r() - 0.5) * 1.1, p.tinte ?? r()], i * 4); });
  ig.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3)); ig.setAttribute('aP', new THREE.InstancedBufferAttribute(par, 4)); ig.instanceCount = puntos.length;
  const [b0, b1, m0, m1, p0, p1] = PALETAS[paleta];
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT, uSol: { value: sol }, uNiebla: nieblaU }, side: THREE.DoubleSide,
    vertexShader: `uniform float uT; attribute vec3 aPos; attribute vec4 aP; varying float vY; varying float vTi; varying float vD; varying vec3 vN;
      void main(){ vec3 p = position; float t = p.y; float h = aP.x; p.y *= h; p.x *= ${ancho.toFixed(4)} + ${(ancho * 0.8).toFixed(4)} * aP.w;
        float c = cos(aP.y), s = sin(aP.y); p = vec3(c*p.x, p.y, s*p.x);
        float viento = sin(uT * 1.3 + aPos.x * 0.12 + aPos.z * 0.08) * 0.5 + 0.5; float rafaga = sin(uT * 3.7 + aPos.x * 0.9 + aPos.z * 0.6) * 0.12;
        vec2 incl = vec2(cos(aP.y * 1.7), sin(aP.y * 1.7)) * aP.z * 0.32 + vec2(0.5, 0.22) * (viento * 0.5 + rafaga);
        p.xz += incl * t * t * h; p.y -= length(incl) * t * t * h * 0.22;
        vec4 mv = modelViewMatrix * vec4(p + aPos, 1.0); gl_Position = projectionMatrix * mv;
        vY = t; vTi = aP.w; vD = -mv.z; vN = normalize(vec3(-s, 0.35, c)); }`,
    fragmentShader: `uniform vec3 uSol; uniform vec4 uNiebla; varying float vY; varying float vTi; varying float vD; varying vec3 vN;
      void main(){ vec3 base = mix(${b0}, ${b1}, vTi); vec3 medio = mix(${m0}, ${m1}, vTi); vec3 punta = mix(${p0}, ${p1}, vTi);
        vec3 col = vY < 0.55 ? mix(base, medio, vY / 0.55) : mix(medio, punta, (vY - 0.55) / 0.45);
        col = pow(col, vec3(2.2));
        float luz = 0.45 + 1.25 * abs(dot(normalize(vN), uSol)) * (0.35 + 0.65 * vY) + 0.25 * vY;
        col *= luz; float f = smoothstep(uNiebla.w * 0.1, uNiebla.w, vD) * 0.8;
        gl_FragColor = vec4(mix(col, uNiebla.rgb, f), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(ig, mat); m.frustumCulled = false; escena.add(m); return m;
}

// pasto 3D escaneado (Poly Haven, Grass Medium 01) repartido en `lugares` [{x,y,z,k}]
export function cargarPasto(escena, todos, { uT, vivo, rnd }) {
  const lugares = ralear(todos);
  new GLTFLoader().load(`${PAS}pasto.glb`, (gltf) => {
    if (!vivo()) return; const tipos = []; gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      if (!o.isMesh || !/tall|mid|small/.test(o.name)) return;
      const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().extractRotation(o.matrixWorld)); g.computeBoundingBox(); const b = g.boundingBox;
      g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); const r = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2;
      const mat = o.material.clone(); mat.alphaTest = 0.4; mat.transparent = false; mat.side = THREE.DoubleSide; mat.color = new THREE.Color(1.05, 1.1, 0.9); conViento(mat, uT, 0.22);
      tipos.push({ g, mat, r, lista: [] });
    });
    if (!tipos.length) return; const o = new THREE.Object3D();
    lugares.forEach((l) => { const t = tipos[Math.floor(rnd() * tipos.length)]; o.position.set(l.x, l.y, l.z); o.rotation.set(0, rnd() * 6.283, 0); const k = ((l.k ?? 0.55) / Math.max(0.2, t.r)) * (0.8 + rnd() * 0.7); o.scale.set(k, k, k); o.updateMatrix(); t.lista.push(o.matrix.clone()); });
    tipos.forEach((t) => { if (!t.lista.length) return; const im = new THREE.InstancedMesh(t.g, t.mat, t.lista.length); t.lista.forEach((mm, i) => im.setMatrixAt(i, mm)); im.receiveShadow = true; escena.add(im); });
  });
}

// árboles reales: vistas renderizadas en Blender (Island Tree 02, Tree Small 02) como impostores
export function crearArboles(escena, tl, todos, rnd, tinte = [0.86, 0.86, 0.84]) {
  const lugares = CALIDAD >= 1 ? todos : todos.filter((l, i) => l.h > 8.5 || (i * 0.618) % 1 < 0.6);
  const usaPalma = lugares.some((l) => l.tipo === 2); const vistas = []; (usaPalma ? ['isla', 'seco', 'palma'] : ['isla', 'seco']).forEach((k) => [0, 1, 2, 3].forEach((i) => vistas.push(tl.load(`${PAS}arbol_${k}_${i}.webp`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; }))));
  const mats = vistas.map((t) => new THREE.SpriteMaterial({ map: t, alphaTest: 0.42, color: new THREE.Color(...tinte), fog: true }));
  lugares.forEach((l) => {
    const vi = l.tipo != null ? l.tipo * 4 + Math.floor(rnd() * 4) : Math.floor(rnd() * 8); const esIsla = vi < 4; const esPalma = vi >= 8; const h = (l.h ?? (esIsla ? 5.5 : 8)) * (esPalma ? 0.85 + rnd() * 0.3 : 0.7 + rnd() * 0.7);
    const sp = new THREE.Sprite(mats[vi]); sp.center.set(0.5, 0.02); sp.position.set(l.x, l.y, l.z); const k = h * (esPalma ? 1.06 : esIsla ? 1.28 : 1.04); sp.scale.set(esPalma ? k * 0.8 : k, k, 1); escena.add(sp);
  });
}

// ---------- especies 3D en puntos ----------
export async function cargarNube(nombre) {
  const buf = await (await fetch(`${MOD}${nombre}.bin`)).arrayBuffer();
  const n = new DataView(buf).getUint32(0, true); const P = (v) => (v + 3) & -4;
  const q = new Int16Array(buf, 4, n * 3); const nn = new Int8Array(buf, 4 + P(n * 6), n * 3); const cc = new Uint8Array(buf, 4 + P(n * 6) + P(n * 3), n * 3);
  const pos = new Float32Array(n * 3); const nor = new Float32Array(n * 3); const col = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) { pos[i] = q[i] / 16000; nor[i] = nn[i] / 127; col[i] = cc[i] / 255; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aN', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
export function matNube(sol, niebla) {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uAleteo: { value: 0 }, uFase: { value: 0 }, uTam: { value: 1 }, uSol: { value: sol }, uNiebla: niebla },
    vertexColors: true,
    vertexShader: `uniform float uT; uniform float uAleteo; uniform float uFase; uniform float uTam; uniform vec3 uSol;
      attribute vec3 aN; varying vec3 vC; varying float vD;
      void main(){ vec3 p = position; float ala = abs(p.x);
        p.y += sin(uT * 9.0 + uFase) * uAleteo * smoothstep(0.08, 0.9, ala) * ala;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; vD = -mv.z;
        float esc = length(modelMatrix[0].xyz);
        gl_PointSize = clamp(uTam * esc * 260.0 / vD, 1.0, 4.0);
        vec3 nw = normalize(mat3(modelMatrix) * aN);
        float dif = max(dot(nw, uSol), 0.0); float cie = 0.5 + 0.5 * nw.y;
        vC = pow(color, vec3(2.2)) * (0.5 + 0.35 * cie + 1.3 * dif); }`,
    fragmentShader: `uniform vec4 uNiebla; varying vec3 vC; varying float vD;
      void main(){ vec2 q = gl_PointCoord - 0.5; if (dot(q, q) > 0.25) discard;
        float f = smoothstep(uNiebla.w * 0.15, uNiebla.w, vD) * 0.7; gl_FragColor = vec4(mix(vC, uNiebla.rgb, f), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
// coloca especies; devuelve la lista animable (se mueve en `animarEspecies`)
export function posarEspecies(escena, { sol, nieblaU, vivo, rnd }) {
  const animales = [];
  const posar = async (nombre, lista) => {
    const geo = await cargarNube(nombre); if (!vivo()) return;
    lista.forEach((a) => { const m = matNube(sol, nieblaU); m.uniforms.uAleteo.value = a.aleteo || 0; m.uniforms.uFase.value = rnd() * 6; m.uniforms.uTam.value = a.tam || 1; const pts = new THREE.Points(geo, m); pts.scale.setScalar(a.esc); pts.position.copy(a.p); pts.rotation.y = a.rot ?? rnd() * 6; pts.frustumCulled = false; escena.add(pts); animales.push({ obj: pts, mat: m, ...a }); });
  };
  return { animales, posar };
}
export function animarEspecies(animales, t) {
  for (const a of animales) {
    a.mat.uniforms.uT.value = t;
    if (a.tipo === 'vuelo') { const ang = a.f + t * a.v; a.obj.position.set(a.c.x + Math.cos(ang) * a.r, a.c.y + Math.sin(t * 0.7 + a.f) * 1.5, a.c.z + Math.sin(ang) * a.r); a.obj.rotation.set(0, -ang + (a.v > 0 ? Math.PI : 0), Math.sign(a.v) * 0.25); }
    else if (a.tipo === 'mariposa') { a.obj.position.set(a.base.x + Math.sin(t * 0.6 + a.f) * 1.4, a.base.y + Math.sin(t * 1.9 + a.f) * 0.35, a.base.z + Math.cos(t * 0.5 + a.f) * 1.4); a.obj.rotation.y = t * 0.6 + a.f; }
    else if (a.tipo === 'garza') { a.obj.rotation.y += Math.sin(t * 0.3 + a.p.x) * 0.0015; }
  }
}

// cinta a lo largo de una curva (tablero o sendero) con altura variable y canto
export function cinta(marco, sA, sB, { ancho, altura, mat, uv = 2, espesor = 0.06, paso = 0.5 }) {
  const n = Math.max(2, Math.ceil((sB - sA) / paso)); const pos = []; const uvs = []; const idx = [];
  const lados = [[-ancho / 2, 0, 0], [ancho / 2, 0, ancho], [ancho / 2, -espesor, ancho + espesor], [-ancho / 2, -espesor, -espesor], [-ancho / 2, 0, 0]];
  for (let i = 0; i <= n; i++) { const s = sA + ((sB - sA) * i) / n; const h = altura(s); lados.forEach(([lx, dy, u]) => { const f = marco(s, lx); pos.push(f.p.x, h + dy, f.p.z); uvs.push(u / uv, s / uv); }); }
  const nl = lados.length; for (let i = 0; i < n; i++) for (let k = 0; k < nl - 1; k++) { const a = i * nl + k; const b = a + nl; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
// baranda de acero con parales y tres cables
export function baranda(marco, sA, sB, { ancho, altura, metal, paso = 2 }) {
  const g = new THREE.Group(); const m4 = new THREE.Matrix4(); const n = Math.floor((sB - sA) / paso) + 1;
  const par = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 12), metal, n * 2);
  for (let i = 0; i < n; i++) for (const lado of [-1, 1]) { const s = sA + i * paso; const f = marco(s, lado * (ancho / 2 - 0.04)); f.p.y = altura(s) + 0.55; m4.makeBasis(f.l, arriba, f.t); m4.setPosition(f.p); par.setMatrixAt(i * 2 + (lado > 0 ? 1 : 0), m4); }
  par.castShadow = true; g.add(par);
  for (const lado of [-1, 1]) {
    const pts = []; for (let s = sA; s <= sB + 0.01; s += 1) { const f = marco(s, lado * (ancho / 2 - 0.04)); pts.push(f.p.setY(altura(s) + 1.1)); }
    if (pts.length < 2) continue;
    const pas = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, 0.026, 12), metal); pas.castShadow = true; g.add(pas);
    for (const h of [0.28, 0.52, 0.76]) { const cp = pts.map((p) => p.clone().setY(p.y - 1.1 + h)); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cp), cp.length * 3, 0.006, 6), metal)); }
  }
  return g;
}

// ---------- banco solar ondulante (costillas blancas con cubierta fotovoltaica) ----------
export function texSolar() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#c9ced6'; x.fillRect(0, 0, 1024, 512);
  const cols = 12; const filas = 6; const g = 6; const cw = (1024 - g * (cols + 1)) / cols; const ch = (512 - g * (filas + 1)) / filas;
  for (let i = 0; i < cols; i++) for (let j = 0; j < filas; j++) {
    const px = g + i * (cw + g); const py = g + j * (ch + g); const gr = x.createLinearGradient(px, py, px + cw, py + ch);
    gr.addColorStop(0, '#1d3f9a'); gr.addColorStop(0.5, '#15307a'); gr.addColorStop(1, '#0f2560'); x.fillStyle = gr; x.fillRect(px, py, cw, ch);
    x.strokeStyle = 'rgba(190,200,225,.55)'; x.lineWidth = 1.2; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(px, py + (ch * k) / 4); x.lineTo(px + cw, py + (ch * k) / 4); x.stroke(); }
    x.strokeStyle = 'rgba(140,160,210,.25)'; for (let k = 1; k < 6; k++) { x.beginPath(); x.moveTo(px + (cw * k) / 6, py); x.lineTo(px + (cw * k) / 6, py + ch); x.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function crearBancoSolar({ largo = 3.0, conCubierta = true } = {}) {
  const g = new THREE.Group();
  const blanco = new THREE.MeshPhysicalMaterial({ color: 0xf1f2ef, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const gris = new THREE.MeshStandardMaterial({ color: 0xd9dcdc, roughness: 0.4, metalness: 0.3 });
  // perfil de la onda: asiento bajo, ola alta al centro, chaise longue y remate redondo
  const perfil = (u) => 0.44 + 0.55 * Math.exp(-(((u - 0.4) / 0.13) ** 2)) + 0.16 * Math.exp(-(((u - 0.97) / 0.035) ** 2)) - 0.05 * Math.exp(-(((u - 0.75) / 0.12) ** 2));
  const n = Math.round(largo / 0.072); const prof = 0.55; const esp = 0.042;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1); const h = perfil(u) - 0.18; const r = 0.05;
    const sh = new THREE.Shape(); sh.moveTo(-prof / 2 + r, 0); sh.lineTo(prof / 2 - r, 0); sh.quadraticCurveTo(prof / 2, 0, prof / 2, r); sh.lineTo(prof / 2, h - r); sh.quadraticCurveTo(prof / 2, h, prof / 2 - r, h); sh.lineTo(-prof / 2 + r, h); sh.quadraticCurveTo(-prof / 2, h, -prof / 2, h - r); sh.lineTo(-prof / 2, r); sh.quadraticCurveTo(-prof / 2, 0, -prof / 2 + r, 0);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: esp, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 8 });
    const m = new THREE.Mesh(geo, blanco); m.rotation.y = Math.PI / 2; m.position.set(-largo / 2 + u * largo, 0.18, 0); m.castShadow = true; m.receiveShadow = true; g.add(m);
  }
  // largueros, remates cilíndricos y patas
  [-0.2, 0.2].forEach((z) => { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, largo, 24), gris); tb.rotation.z = Math.PI / 2; tb.position.set(0, 0.2, z); g.add(tb); });
  [-1, 1].forEach((sx) => { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, prof + 0.04, 40), blanco); cap.rotation.x = Math.PI / 2; cap.position.set(sx * (largo / 2 + 0.02), 0.27, 0); cap.castShadow = true; g.add(cap); });
  [[-largo / 2 + 0.15, -0.18], [-largo / 2 + 0.15, 0.18], [largo / 2 - 0.15, -0.18], [largo / 2 - 0.15, 0.18], [0.3, -0.18], [0.3, 0.18]].forEach(([px, pz]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 16), gris); p.position.set(px, 0.1, pz); g.add(p); });
  if (conCubierta) {
    const xs = [-largo / 2 + 0.12, -largo / 2 + 0.62, -largo / 2 + 1.12]; const alto = 2.25;
    xs.forEach((px) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, alto, 24), blanco); p.position.set(px, alto / 2, -0.32); p.castShadow = true; g.add(p); });
    const cub = new THREE.Group(); cub.position.set(-largo / 2 + 0.75, alto, -0.15);
    const marcoC = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.07, 0.78, 1, 1, 1), blanco); marcoC.castShadow = true; cub.add(marcoC);
    for (let k = 0; k < 22; k++) { const al = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.74), blanco); al.position.set(-0.93 + k * 0.088, -0.07, 0); cub.add(al); }
    [-1, 1].forEach((sx) => { const rr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 24), blanco); rr.rotation.x = Math.PI / 2; rr.position.set(sx * 0.99, -0.01, 0); cub.add(rr); });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.025, 0.7), [gris, gris, new THREE.MeshPhysicalMaterial({ map: texSolar(), roughness: 0.12, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05 }), gris, gris, gris]);
    panel.position.y = 0.048; panel.castShadow = true; cub.add(panel); g.add(cub);
    const caja = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.06), blanco); caja.position.set(xs[2], 1.0, -0.27); g.add(caja);
  }
  return g;
}
