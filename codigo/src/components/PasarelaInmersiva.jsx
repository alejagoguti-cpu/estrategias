import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Pasarela palafítica sobre la marisma de Tierra Bomba, en primera persona y con materiales reales:
// cielo HDRI fotográfico con nubes, tablones, lodo y roca fotoescaneados (PBR), pasto 3D escaneado
// con viento, árboles reales renderizados en Blender (impostores) y las especies 3D de «Tramas».
// Recursos CC0 de Poly Haven (ver CREDITOS.txt). Se avanza/retrocede y se mira arrastrando.
const BASE = import.meta.env.BASE_URL;
const MOD = `${BASE}datos/tramas/3d/`;
const PAS = `${BASE}datos/pasarela/`;
const ALTO_TABLERO = 1.25; // m sobre la lámina de agua (pleamar)
const OJO = 1.62;
const ANCHO = 2.4;

const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function trazado() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 30), new THREE.Vector3(0, 0, 0), new THREE.Vector3(-5, 0, -38), new THREE.Vector3(-2, 0, -78),
    new THREE.Vector3(8, 0, -116), new THREE.Vector3(12, 0, -156), new THREE.Vector3(5, 0, -196), new THREE.Vector3(-8, 0, -232),
    new THREE.Vector3(-12, 0, -270),
  ], false, 'centripetal');
}
const orilla = (z) => 30 + 7 * Math.sin(z / 46) + 3 * Math.sin(z / 13); // x del enrocado, a la derecha
const alturaTierra = (x, z) => {
  const d = x - orilla(z); const ruido = Math.sin(x * 0.21 + z * 0.13) * 0.25 + Math.sin(x * 0.05 - z * 0.07) * 0.9;
  if (d < -4) return -0.35; if (d < 4) return -0.35 + (d + 4) * 0.33; if (d < 9) return 2.3 + (d - 4) * 0.08;
  return 2.3 + Math.min(1, (d - 4) / 60) * 9 + ruido * clamp((d - 4) / 30, 0, 1);
};

// ---------- especies 3D en puntos ----------
async function cargarNube(nombre) {
  const buf = await (await fetch(`${MOD}${nombre}.bin`)).arrayBuffer();
  const n = new DataView(buf).getUint32(0, true); const P = (v) => (v + 3) & -4;
  const q = new Int16Array(buf, 4, n * 3); const nn = new Int8Array(buf, 4 + P(n * 6), n * 3); const cc = new Uint8Array(buf, 4 + P(n * 6) + P(n * 3), n * 3);
  const pos = new Float32Array(n * 3); const nor = new Float32Array(n * 3); const col = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) { pos[i] = q[i] / 16000; nor[i] = nn[i] / 127; col[i] = cc[i] / 255; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aN', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
function matNube(sol, niebla) {
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

// material PBR fotoescaneado (difuso + normal + ARM: oclusión, rugosidad, metal)
function pbr(cargador, nombre, rep, extra = {}) {
  const t = (suf, srgb) => { const x = cargador.load(`${PAS}${nombre}_${suf}.jpg`); x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(rep[0], rep[1]); x.anisotropy = 8; if (srgb) x.colorSpace = THREE.SRGBColorSpace; return x; };
  const arm = t('arm');
  return new THREE.MeshStandardMaterial({ map: t('diff', true), normalMap: t('nor'), aoMap: arm, roughnessMap: arm, metalnessMap: arm, roughness: 1, metalness: 1, ...extra });
}
// viento en mallas instanciadas (pasto real)
function conViento(mat, uT, fuerza = 0.22) {
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

export default function PasarelaInmersiva() {
  const caja = useRef(null); const lienzo = useRef(null);
  const ctl = useRef({ dir: 0, auto: false, yaw: 0, pitch: -0.04, s: 6, salto: null });
  const [listo, setListo] = useState(false);
  const [prog, setProg] = useState(0);
  const [auto, setAuto] = useState(false);
  const [completa, setCompleta] = useState(false);
  const largoRef = useRef(1);

  useEffect(() => {
    const el = caja.current; const cv = lienzo.current; if (!el || !cv) return undefined;
    let vivo = true; let raf = 0; let visible = false; let iniciado = false; let limpiar = () => {};
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !iniciado) { iniciado = true; limpiar = iniciar(); } }, { rootMargin: '300px' });
    io.observe(el);

    function iniciar() {
      const ren = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
      ren.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      ren.toneMapping = THREE.ACESFilmicToneMapping; ren.toneMappingExposure = 0.95;
      ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap;
      const escena = new THREE.Scene();
      const COL_NIEBLA = new THREE.Color(0xb9cfdf);
      escena.fog = new THREE.Fog(COL_NIEBLA, 260, 2600);
      const nieblaU = { value: new THREE.Vector4(COL_NIEBLA.r, COL_NIEBLA.g, COL_NIEBLA.b, 1800) };
      const cam = new THREE.PerspectiveCamera(60, 1, 0.08, 12000);
      const tl = new THREE.TextureLoader();
      const uT = { value: 0 };

      // ---- cielo fotográfico (HDRI) y sol tomado de su píxel más brillante
      const sol = new THREE.Vector3(-0.45, 0.6, -0.65).normalize();
      const luzSol = new THREE.DirectionalLight(0xfff1dc, 3.2); luzSol.castShadow = true; luzSol.shadow.mapSize.set(2048, 2048);
      Object.assign(luzSol.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 180 }); luzSol.shadow.bias = -0.0004; luzSol.shadow.normalBias = 0.03;
      escena.add(luzSol, luzSol.target);
      const pm = new THREE.PMREMGenerator(ren);
      let agua = null;
      new RGBELoader().setDataType(THREE.FloatType).load(`${PAS}cielo_1k.hdr`, (hdr) => {
        if (!vivo) return;
        const { data, width: w, height: h } = hdr.image; let mejor = 0; let bi = 0; let bj = 0;
        for (let j = 0; j < h / 2; j++) for (let i = 0; i < w; i++) { const o = (j * w + i) * 4; const l = data[o] * 0.3 + data[o + 1] * 0.59 + data[o + 2] * 0.11; if (l > mejor) { mejor = l; bi = i; bj = j; } }
        const fi = ((bi + 0.5) / w - 0.5) * Math.PI * 2; const elev = (0.5 - (bj + 0.5) / h) * Math.PI;
        sol.set(Math.cos(fi) * Math.cos(elev), Math.sin(elev), Math.sin(fi) * Math.cos(elev)).normalize();
        if (sol.y < 0.25) { sol.y = 0.25; sol.normalize(); }
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        const env = pm.fromEquirectangular(hdr).texture; escena.environment = env; escena.environmentIntensity = 0.85; hdr.dispose();
        if (agua) agua.material.uniforms.sunDirection.value.copy(sol);
      });
      tl.load(`${PAS}cielo_8k.jpg`, (t) => { if (!vivo) return; t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; escena.background = t; escena.backgroundIntensity = 1.0; });

      // ---- agua con reflejo real del cielo
      const tAgua = tl.load(`${BASE}datos/water_normals_fine.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
      agua = new Water(new THREE.PlaneGeometry(9000, 9000), { textureWidth: 1024, textureHeight: 1024, waterNormals: tAgua, sunDirection: sol.clone(), sunColor: 0xfff2dc, waterColor: 0x3f7076, distortionScale: 1.2, fog: true });
      agua.rotation.x = -Math.PI / 2; agua.material.uniforms.size.value = 4.5; escena.add(agua);

      const curva = trazado(); const L = curva.getLength(); largoRef.current = L;
      const arriba = new THREE.Vector3(0, 1, 0);
      const marco = (s, lado = 0, cv0 = curva, Lc = L) => { const u = clamp(s / Lc, 0, 1); const p = cv0.getPointAt(u); const t = cv0.getTangentAt(u).setY(0).normalize(); const l = new THREE.Vector3().crossVectors(t, arriba).normalize(); return { p: p.addScaledVector(l, lado), t, l }; };

      // ---- materiales escaneados
      const matMadera = pbr(tl, 'madera', [1, 1], { metalness: 0 });
      const matMaderaOsc = pbr(tl, 'madera', [0.5, 3], { metalness: 0, color: 0x9a8270 });
      const matLodo = pbr(tl, 'lodo', [1, 1], { metalness: 0, color: 0xb8ad94 });
      const matRoca = pbr(tl, 'roca', [1, 1], { metalness: 0 });
      const metal = new THREE.MeshStandardMaterial({ color: 0xc9cfd3, metalness: 0.92, roughness: 0.28 });

      // ---- terreno: orilla, talud y meseta
      {
        const g = new THREE.PlaneGeometry(520, 1300, 240, 460); g.rotateX(-Math.PI / 2); g.translate(180, 0, -250);
        const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3); const cc = new THREE.Color();
        for (let i = 0; i < pa.count; i++) {
          const x = pa.getX(i); const z = pa.getZ(i); const y = alturaTierra(x, z); pa.setY(i, y); uv.setXY(i, x / 6, z / 6);
          const d = x - orilla(z);
          if (d < 5) cc.setRGB(0.95, 0.93, 0.9); else cc.setRGB(0.55 + 0.1 * Math.sin(x * 0.3 + z * 0.2), 0.62 + 0.08 * Math.sin(x * 0.11), 0.38);
          col.set([cc.r, cc.g, cc.b], i * 3);
        }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
        const m = new THREE.Mesh(g, pbr(tl, 'lodo', [1, 1], { metalness: 0, vertexColors: true })); m.receiveShadow = true; escena.add(m);
      }
      // ---- costa lejana con bruma (Cartagena, Barú)
      {
        const mat = new THREE.MeshStandardMaterial({ color: 0x6f8695, roughness: 1, fog: true });
        [[-900, -3000, 1100, 45], [600, -3600, 1600, 80], [-2600, -2200, 900, 35], [2300, -2800, 1000, 60], [-4200, -900, 1400, 30]].forEach(([x, z, r, h]) => {
          const g = new THREE.SphereGeometry(1, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2); const pa = g.attributes.position;
          for (let i = 0; i < pa.count; i++) { const k = 1 + 0.12 * Math.sin(pa.getX(i) * 9) * Math.cos(pa.getZ(i) * 7); pa.setY(i, pa.getY(i) * k); }
          g.computeVertexNormals(); const mm = new THREE.Mesh(g, mat); mm.position.set(x, -2, z); mm.scale.set(r, h, r * 0.3); escena.add(mm);
        });
      }

      // ---- enrocado permeable: rocas con textura de roca caliza escaneada
      {
        const n = 2400; const g = new THREE.IcosahedronGeometry(1, 3); const pa = g.attributes.position;
        for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const k = 1 + 0.16 * Math.sin(x * 3.1 + y * 2.3) * Math.cos(z * 2.7 - x) + 0.06 * Math.sin(y * 8 + z * 6) + 0.03 * Math.sin(x * 19 + z * 17); const pl = y > 0.4 ? 0.85 : 1; pa.setXYZ(i, x * k * 1.15, y * k * 0.7 * pl, z * k); }
        g.computeVertexNormals();
        const im = new THREE.InstancedMesh(g, matRoca, n); const o = new THREE.Object3D(); const c = new THREE.Color();
        for (let i = 0; i < n; i++) {
          const z = 40 - rnd() * 540; const d = -3.5 + rnd() * 8.5; const x = orilla(z) + d; const y = -0.35 + (d + 4) * 0.33 - 0.15;
          const s = 0.35 + rnd() * 0.75; o.position.set(x, y, z); o.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); o.scale.set(s * (1 + rnd() * 0.5), s, s * (1 + rnd() * 0.3)); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
          const b = 0.85 + rnd() * 0.3; c.setRGB(b, b * 0.98, b * 0.95); im.setColorAt(i, c);
        }
        im.castShadow = true; im.receiveShadow = true; escena.add(im);
      }

      // ---- árboles reales (impostores renderizados en Blender) en el talud y la meseta
      {
        const vistas = []; ['isla', 'seco'].forEach((k) => [0, 1, 2, 3].forEach((i) => vistas.push({ k, t: tl.load(`${PAS}arbol_${k}_${i}.webp`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; }) })));
        const mats = vistas.map((v) => new THREE.SpriteMaterial({ map: v.t, alphaTest: 0.42, color: new THREE.Color(0.86, 0.86, 0.84), fog: true }));
        for (let i = 0; i < 640; i++) {
          const z = 60 - rnd() * 600; const d = 6 + Math.pow(rnd(), 1.5) * 170; const x = orilla(z) + d; const y = alturaTierra(x, z) - 0.2;
          const vi = Math.floor(rnd() * mats.length); const esIsla = vi < 4; const h = (esIsla ? 5.5 : 8) * (0.7 + rnd() * 0.7);
          const sp = new THREE.Sprite(mats[vi]); sp.center.set(0.5, 0.02); sp.position.set(x, y, z); sp.scale.set(h * (esIsla ? 1.28 : 1.04), h * (esIsla ? 1.28 : 1.04), 1); escena.add(sp);
        }
      }

      // ---- marisma: islotes de lodo + pasto 3D escaneado con viento
      const matas = [];
      for (let s = -20; s < L + 30; s += 1.9) {
        for (let k = 0; k < 4; k++) {
          const lado = (rnd() > 0.5 ? 1 : -1) * (2.4 + Math.pow(rnd(), 1.4) * 24); const f = marco(clamp(s, 0, L), lado);
          if (f.p.x > orilla(f.p.z) - 5) continue;
          matas.push({ x: f.p.x + (rnd() - 0.5) * 3, z: f.p.z + (rnd() - 0.5) * 3, rx: 1.3 + rnd() * 3.4, rz: 1.1 + rnd() * 2.6, a: rnd() * 3, cerca: Math.abs(lado) < 14 });
        }
      }
      for (let i = 0; i < 140; i++) matas.push({ x: -36 - rnd() * 110, z: 30 - rnd() * 340, rx: 2 + rnd() * 5, rz: 1.5 + rnd() * 3, a: rnd() * 3, cerca: false });
      {
        const gl = new THREE.CircleGeometry(1, 40); gl.rotateX(-Math.PI / 2);
        const pl = gl.attributes.position; const uvl = gl.attributes.uv;
        for (let i = 1; i < pl.count; i++) { const a = Math.atan2(pl.getZ(i), pl.getX(i)); const k = 0.82 + 0.18 * Math.sin(a * 3 + i) + 0.06 * Math.sin(a * 11); pl.setX(i, pl.getX(i) * k); pl.setZ(i, pl.getZ(i) * k); pl.setY(i, -0.05); }
        for (let i = 0; i < pl.count; i++) uvl.setXY(i, pl.getX(i) * 0.8, pl.getZ(i) * 0.8);
        const lodo = new THREE.InstancedMesh(gl, matLodo, matas.length); const o = new THREE.Object3D();
        matas.forEach((m, i) => { o.position.set(m.x, 0.05, m.z); o.rotation.set(0, m.a, 0); o.scale.set(m.rx * 1.2, 1, m.rz * 1.2); o.updateMatrix(); lodo.setMatrixAt(i, o.matrix); });
        lodo.receiveShadow = true; escena.add(lodo);
      }
      {
        const hoja = new THREE.BufferGeometry(); const vs = []; const segs = 5;
        for (let j = 0; j <= segs; j++) { const t = j / segs; const w = (1 - t * 0.92) * 0.5; if (j < segs) vs.push(-w, t, 0, w, t, 0); else vs.push(0, 1, 0); }
        const idx = []; for (let j = 0; j < segs - 1; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } idx.push((segs - 1) * 2, (segs - 1) * 2 + 1, segs * 2);
        hoja.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3)); hoja.setIndex(idx);
        const ig = new THREE.InstancedBufferGeometry(); ig.index = hoja.index; ig.attributes.position = hoja.attributes.position;
        const pos = []; const par = [];
        matas.forEach((m) => {
          const nb = Math.round(m.rx * m.rz * (m.cerca ? 95 : 40));
          for (let b = 0; b < nb; b++) {
            const rr = Math.sqrt(rnd()); const a = rnd() * 6.283; const lx = Math.cos(a) * rr * m.rx; const lz = Math.sin(a) * rr * m.rz; const ca = Math.cos(m.a); const sa = Math.sin(m.a);
            pos.push(m.x + lx * ca - lz * sa, 0.02, m.z + lx * sa + lz * ca);
            par.push((0.45 + (1 - rr * 0.7) * (0.55 + rnd() * 0.75)), rnd() * 6.283, (rnd() - 0.5) * 1.1, rnd());
          }
        });
        ig.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(pos), 3));
        ig.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(par), 4));
        ig.instanceCount = pos.length / 3;
        const matB = new THREE.ShaderMaterial({
          uniforms: { uT, uSol: { value: sol }, uNiebla: nieblaU }, side: THREE.DoubleSide,
          vertexShader: `uniform float uT; attribute vec3 aPos; attribute vec4 aP; varying float vY; varying float vTi; varying float vD; varying vec3 vN;
            void main(){ vec3 p = position; float t = p.y; float h = aP.x; p.y *= h; p.x *= 0.012 + 0.01 * aP.w;
              float c = cos(aP.y), s = sin(aP.y); p = vec3(c*p.x, p.y, s*p.x);
              float viento = sin(uT * 1.3 + aPos.x * 0.12 + aPos.z * 0.08) * 0.5 + 0.5; float rafaga = sin(uT * 3.7 + aPos.x * 0.9 + aPos.z * 0.6) * 0.12;
              vec2 incl = vec2(cos(aP.y * 1.7), sin(aP.y * 1.7)) * aP.z * 0.32 + vec2(0.5, 0.22) * (viento * 0.5 + rafaga);
              p.xz += incl * t * t * h; p.y -= length(incl) * t * t * h * 0.22;
              vec4 mv = modelViewMatrix * vec4(p + aPos, 1.0); gl_Position = projectionMatrix * mv;
              vY = t; vTi = aP.w; vD = -mv.z; vN = normalize(vec3(-s, 0.35, c)); }`,
          fragmentShader: `uniform vec3 uSol; uniform vec4 uNiebla; varying float vY; varying float vTi; varying float vD; varying vec3 vN;
            void main(){ vec3 base = mix(vec3(0.20, 0.30, 0.07), vec3(0.30, 0.42, 0.10), vTi);
              vec3 medio = mix(vec3(0.42, 0.60, 0.16), vec3(0.52, 0.68, 0.20), vTi);
              vec3 punta = mix(vec3(0.70, 0.78, 0.36), vec3(0.82, 0.80, 0.48), vTi);
              vec3 col = vY < 0.55 ? mix(base, medio, vY / 0.55) : mix(medio, punta, (vY - 0.55) / 0.45);
              col = pow(col, vec3(2.2));
              float luz = 0.45 + 1.25 * abs(dot(normalize(vN), uSol)) * (0.35 + 0.65 * vY) + 0.25 * vY;
              col *= luz; float f = smoothstep(uNiebla.w * 0.1, uNiebla.w, vD) * 0.8;
              gl_FragColor = vec4(mix(col, uNiebla.rgb, f), 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }`,
        });
        const briznas = new THREE.Mesh(ig, matB); briznas.frustumCulled = false; escena.add(briznas);
      }
      new GLTFLoader().load(`${PAS}pasto.glb`, (gltf) => {
        if (!vivo) return;
        const tipos = [];
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse((o) => {
          if (!o.isMesh || !/tall|mid|small/.test(o.name)) return;
          const g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().extractRotation(o.matrixWorld)); g.computeBoundingBox(); const b = g.boundingBox;
          g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); const r = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2;
          const mat = o.material.clone(); mat.alphaTest = 0.4; mat.transparent = false; mat.side = THREE.DoubleSide; mat.color = new THREE.Color(1.05, 1.1, 0.9);
          conViento(mat, uT, 0.22);
          tipos.push({ g, mat, r, alto: b.max.y - b.min.y, peso: /tall/.test(o.name) ? 3 : /mid/.test(o.name) ? 1.2 : 1, n: 0, lista: [] });
        });
        if (!tipos.length) return;
        const pesoT = tipos.reduce((a, t) => a + t.peso, 0);
        const elegir = () => { let r = rnd() * pesoT; for (const t of tipos) { r -= t.peso; if (r <= 0) return t; } return tipos[0]; };
        const o = new THREE.Object3D();
        if (false) matas.forEach((m) => {
          const nb = Math.round(m.rx * m.rz * (m.cerca ? 2.4 : 0.9));
          for (let b = 0; b < nb; b++) {
            const t = elegir(); const rr = Math.sqrt(rnd()); const a = rnd() * 6.283; const lx = Math.cos(a) * rr * m.rx; const lz = Math.sin(a) * rr * m.rz;
            const ca = Math.cos(m.a); const sa = Math.sin(m.a); const k = (0.55 / Math.max(0.2, t.r)) * (0.8 + rnd() * 0.6); const ky = (1.15 / Math.max(0.1, t.alto)) * (0.7 + (1 - rr) * 0.6 + rnd() * 0.3);
            o.position.set(m.x + lx * ca - lz * sa, 0.0, m.z + lx * sa + lz * ca); o.rotation.set(0, rnd() * 6.283, 0); o.scale.set(k, ky, k); o.updateMatrix();
            t.lista.push(o.matrix.clone());
          }
        });
        // pasto también en el talud, entre el enrocado y los árboles
        tipos.forEach((t) => {
          const n = Math.round(2200 / tipos.length); const im = new THREE.InstancedMesh(t.g, t.mat, n);
          for (let i = 0; i < n; i++) { const z = 40 - rnd() * 540; const d = 4.5 + rnd() * 40; const x = orilla(z) + d; o.position.set(x, alturaTierra(x, z) - 0.05, z); o.rotation.set(0, rnd() * 6, 0); const k = (0.55 / Math.max(0.2, t.r)) * (0.8 + rnd() * 0.7); o.scale.set(k, k, k); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
          im.receiveShadow = true; escena.add(im);
        });
      });

      // ---- pasarela: tablero fotoescaneado, vigas, pilotes, parales y cables de acero
      function construirPasarela(cv0, { ancho = ANCHO, baranda = true } = {}) {
        const g = new THREE.Group(); const Lc = cv0.getLength(); const fr = (s, lado = 0, alto = 0) => { const f = marco(s, lado, cv0, Lc); f.p.setY(alto); return f; };
        // tablero: cinta con tablones a lo ancho (textura repetida cada 2 m) y canto
        const pasos = Math.ceil(Lc / 0.5); const pos = []; const uv = []; const idx = [];
        const lados = [[-ancho / 2, 0, 0], [ancho / 2, 0, ancho / 2], [ancho / 2, -0.06, ancho / 2 + 0.06], [-ancho / 2, -0.06, -0.06], [-ancho / 2, 0, 0]];
        for (let i = 0; i <= pasos; i++) {
          const s = (i / pasos) * Lc;
          lados.forEach(([lx, dy, u]) => { const f = fr(s, lx, ALTO_TABLERO + dy); pos.push(f.p.x, f.p.y, f.p.z); uv.push(u / 2.0, s / 2.0); });
        }
        const nl = lados.length;
        for (let i = 0; i < pasos; i++) for (let k = 0; k < nl - 1; k++) { const a = i * nl + k; const b = a + nl; idx.push(a, b, a + 1, a + 1, b, b + 1); }
        const gt = new THREE.BufferGeometry(); gt.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gt.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gt.setIndex(idx); gt.computeVertexNormals();
        const tablero = new THREE.Mesh(gt, matMadera); tablero.castShadow = true; tablero.receiveShadow = true; g.add(tablero);
        const m4 = new THREE.Matrix4();
        const nv = Math.floor(Lc / 1.0); const viga = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.22, 1.02), matMaderaOsc, nv * 2);
        for (let i = 0; i < nv; i++) for (const lado of [-1, 1]) { const f = fr(i + 0.5, lado * (ancho / 2 - 0.15), ALTO_TABLERO - 0.17); m4.makeBasis(f.l, arriba, f.t); m4.setPosition(f.p); viga.setMatrixAt(i * 2 + (lado > 0 ? 1 : 0), m4); }
        viga.castShadow = true; g.add(viga);
        const np = Math.floor(Lc / 3); const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.13, 2.4, 16), matMaderaOsc, np * 2);
        for (let i = 0; i < np; i++) for (const lado of [-1, 1]) { const f = fr(i * 3, lado * (ancho / 2 - 0.15), ALTO_TABLERO - 1.3); m4.makeBasis(f.l, arriba, f.t); m4.setPosition(f.p); pil.setMatrixAt(i * 2 + (lado > 0 ? 1 : 0), m4); }
        pil.castShadow = true; g.add(pil);
        if (baranda) {
          const npar = Math.floor(Lc / 2.0); const par = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 12), metal, npar * 2);
          for (let i = 0; i < npar; i++) for (const lado of [-1, 1]) { const f = fr(i * 2, lado * (ancho / 2 - 0.04), ALTO_TABLERO + 0.55); m4.makeBasis(f.l, arriba, f.t); m4.setPosition(f.p); par.setMatrixAt(i * 2 + (lado > 0 ? 1 : 0), m4); }
          par.castShadow = true; g.add(par);
          for (const lado of [-1, 1]) {
            const pts = []; for (let s = 0; s <= Lc; s += 1) pts.push(fr(s, lado * (ancho / 2 - 0.04), ALTO_TABLERO + 1.1).p);
            const pas = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, 0.026, 12), metal); pas.castShadow = true; g.add(pas);
            for (const h of [0.28, 0.52, 0.76]) { const cp = pts.map((p) => p.clone().setY(ALTO_TABLERO + h)); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cp), cp.length * 3, 0.006, 6), metal)); }
          }
        }
        return g;
      }
      escena.add(construirPasarela(curva));
      const muelle = new THREE.CatmullRomCurve3([marco(64, -1.3).p, new THREE.Vector3(-60, 0, -95), new THREE.Vector3(-180, 0, -160), new THREE.Vector3(-330, 0, -215)]);
      escena.add(construirPasarela(muelle, { ancho: 2.0 }));

      // ---- especies 3D
      const animales = [];
      const posar = async (nombre, lista) => {
        const geo = await cargarNube(nombre); if (!vivo) return;
        lista.forEach((a) => { const m = matNube(sol, nieblaU); m.uniforms.uAleteo.value = a.aleteo || 0; m.uniforms.uFase.value = rnd() * 6; m.uniforms.uTam.value = a.tam || 1; const pts = new THREE.Points(geo, m); pts.scale.setScalar(a.esc); pts.position.copy(a.p); pts.rotation.y = a.rot ?? rnd() * 6; pts.frustumCulled = false; escena.add(pts); animales.push({ obj: pts, mat: m, ...a }); });
      };
      const enAgua = (s, lado) => marco(s, lado).p.setY(-0.05);
      posar('snowy', [8, 31, 47, 88, 140, 205, 226].map((s, i) => ({ p: enAgua(s, (i % 2 ? 1 : -1) * (4 + rnd() * 9)), esc: 0.62 + rnd() * 0.1, tipo: 'garza' })));
      posar('great', [22, 70, 118, 172, 250].map((s, i) => ({ p: enAgua(s, (i % 2 ? -1 : 1) * (5 + rnd() * 12)), esc: 0.95 + rnd() * 0.12, tipo: 'garza' })));
      posar('pelicano', [0.12, 0.2, 0.31, 0.45, 0.6].map((u) => { const p = muelle.getPointAt(u); p.y = ALTO_TABLERO + 1.15; return { p, esc: 1.05, tipo: 'quieto' }; }));
      posar('gaviota_v', Array.from({ length: 14 }, (_, i) => ({ p: new THREE.Vector3(), esc: 0.85 + rnd() * 0.3, tipo: 'vuelo', aleteo: 0.18, c: new THREE.Vector3(-30 + rnd() * 60, 9 + rnd() * 18, -20 - rnd() * 220), r: 14 + rnd() * 30, v: (0.12 + rnd() * 0.1) * (i % 2 ? 1 : -1), f: rnd() * 6 })));
      posar('monarca', Array.from({ length: 10 }, () => { const s = rnd() * L; const lado = (rnd() > 0.5 ? 1 : -1) * (2 + rnd() * 3); return { p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: marco(s, lado).p.setY(ALTO_TABLERO + 0.8), f: rnd() * 6 }; }));

      // ---- controles
      const k = ctl.current; const v = { s: k.s, yaw: 0, pitch: 0 };
      const teclas = {};
      const onKey = (e, on) => { if (!visible) return; const code = e.code; if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(code)) { const r = el.getBoundingClientRect(); if (r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4) { teclas[code] = on; e.preventDefault(); } } };
      const kd = (e) => onKey(e, true); const ku = (e) => onKey(e, false);
      addEventListener('keydown', kd); addEventListener('keyup', ku);
      let arr = null;
      const pd = (e) => { arr = { x: e.clientX, y: e.clientY, yaw: k.yaw, pitch: k.pitch }; cv.setPointerCapture(e.pointerId); };
      const pmv = (e) => { if (!arr) return; k.yaw = arr.yaw - (e.clientX - arr.x) * 0.0045; k.pitch = clamp(arr.pitch - (e.clientY - arr.y) * 0.0035, -1.0, 0.75); };
      const pu = () => { arr = null; };
      cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pmv); cv.addEventListener('pointerup', pu); cv.addEventListener('pointercancel', pu);
      const rueda = (e) => { if (!document.fullscreenElement) return; e.preventDefault(); k.s = clamp(k.s - e.deltaY * 0.02, 0, L); };
      cv.addEventListener('wheel', rueda, { passive: false });

      const tam = () => { const w = cv.clientWidth; const h = cv.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
      const ro = new ResizeObserver(tam); ro.observe(cv); tam();

      let ult = performance.now(); let pasoBob = 0; let ultProg = -1; let primero = true;
      const vtmp = new THREE.Vector3(); const mira = new THREE.Vector3();
      const ciclo = (ahora) => {
        if (!vivo) return; raf = requestAnimationFrame(ciclo);
        if (!visible && !primero) { ult = ahora; return; }
        const dt = Math.min(0.05, (ahora - ult) / 1000); ult = ahora; const t = ahora / 1000;
        const dirTec = (teclas.KeyW || teclas.ArrowUp ? 1 : 0) - (teclas.KeyS || teclas.ArrowDown ? 1 : 0);
        const dir = clamp(k.dir + dirTec + (k.auto ? 0.55 : 0), -1, 1);
        if (k.salto != null) { v.s = k.salto; k.s = k.salto; k.salto = null; }
        k.s = clamp(k.s + dir * 1.45 * dt, 0, L); if (k.auto && k.s >= L) { k.auto = false; setAuto(false); }
        const antes = v.s; v.s += (k.s - v.s) * Math.min(1, dt * 4); v.yaw += (k.yaw - v.yaw) * Math.min(1, dt * 6); v.pitch += (k.pitch - v.pitch) * Math.min(1, dt * 6);
        const mov = Math.abs(v.s - antes) / Math.max(dt, 1e-3); pasoBob += mov * dt * 1.9;
        const f = marco(v.s, -0.15); const bob = Math.sin(pasoBob * Math.PI) * 0.025 * clamp(mov, 0, 1);
        cam.position.set(f.p.x, ALTO_TABLERO + OJO + bob, f.p.z);
        const fa = marco(Math.min(L, v.s + 6)); vtmp.subVectors(fa.p, f.p).setY(0).normalize(); if (v.s > L - 6.5) vtmp.copy(f.t);
        const yaw = Math.atan2(vtmp.x, -vtmp.z) + v.yaw;
        mira.set(Math.sin(yaw) * Math.cos(v.pitch), Math.sin(v.pitch), -Math.cos(yaw) * Math.cos(v.pitch)).add(cam.position); cam.lookAt(mira);
        luzSol.position.copy(cam.position).addScaledVector(sol, 90); luzSol.target.position.copy(cam.position).addScaledVector(vtmp, 10); luzSol.target.updateMatrixWorld();
        agua.material.uniforms.time.value = t * 0.4; uT.value = t;
        for (const a of animales) {
          a.mat.uniforms.uT.value = t;
          if (a.tipo === 'vuelo') { const ang = a.f + t * a.v; a.obj.position.set(a.c.x + Math.cos(ang) * a.r, a.c.y + Math.sin(t * 0.7 + a.f) * 1.5, a.c.z + Math.sin(ang) * a.r); a.obj.rotation.set(0, -ang + (a.v > 0 ? Math.PI : 0), Math.sign(a.v) * 0.25); }
          else if (a.tipo === 'mariposa') { a.obj.position.set(a.base.x + Math.sin(t * 0.6 + a.f) * 1.4, a.base.y + Math.sin(t * 1.9 + a.f) * 0.35, a.base.z + Math.cos(t * 0.5 + a.f) * 1.4); a.obj.rotation.y = t * 0.6 + a.f; }
          else if (a.tipo === 'garza') { a.obj.rotation.y += Math.sin(t * 0.3 + a.p.x) * 0.0015; }
        }
        ren.render(escena, cam);
        if (primero) { primero = false; setListo(true); }
        const pr = v.s / L; if (Math.abs(pr - ultProg) > 0.002) { ultProg = pr; setProg(pr); }
      };
      raf = requestAnimationFrame(ciclo);

      return () => {
        cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('keydown', kd); removeEventListener('keyup', ku);
        cv.removeEventListener('pointerdown', pd); cv.removeEventListener('pointermove', pmv); cv.removeEventListener('pointerup', pu); cv.removeEventListener('pointercancel', pu); cv.removeEventListener('wheel', rueda);
        escena.traverse((o) => { o.geometry?.dispose?.(); const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (!m) return; ['map', 'normalMap', 'aoMap', 'roughnessMap'].forEach((kk) => m[kk]?.dispose?.()); m.dispose?.(); }); });
        escena.background?.dispose?.(); escena.environment?.dispose?.(); pm.dispose(); ren.dispose();
      };
    }
    return () => { vivo = false; io.disconnect(); limpiar(); };
  }, []);

  useEffect(() => { const f = () => setCompleta(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);

  const mantener = (d) => ({
    onPointerDown: (e) => { e.preventDefault(); ctl.current.dir = d; },
    onPointerUp: () => { ctl.current.dir = 0; }, onPointerLeave: () => { ctl.current.dir = 0; }, onPointerCancel: () => { ctl.current.dir = 0; },
  });
  const metros = Math.round(prog * largoRef.current);
  const boton = 'pointer-events-auto flex h-10 items-center gap-2 rounded-full bg-black/55 px-4 text-[12px] font-medium text-white backdrop-blur transition hover:bg-black/75 select-none';

  return (
    <div ref={caja} className="relative h-full min-h-[460px] w-full overflow-hidden bg-[#b9cfdf]">
      <canvas ref={lienzo} className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing" aria-label="Recorrido en primera persona por la pasarela elevada sobre la marisma" />
      {!listo && <div className="absolute inset-0 grid place-items-center text-[12px] font-mono uppercase tracking-widest text-slate-600">Cargando la marisma…</div>}

      <p className="pointer-events-none absolute bottom-24 left-5 max-w-[19rem] text-[12.5px] leading-snug text-white [text-shadow:0_1px_6px_rgba(0,0,0,.6)] sm:bottom-28">
        El enrocado permeable, la marisma intermareal y la pasarela elevada componen un «borde blando» de costa, muy adaptable al ascenso del mar y a la incertidumbre de sedimentos, con menos impacto sobre los hábitats costeros de Tierra Bomba.
      </p>
      <p className="pointer-events-none absolute left-5 top-20 rounded bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/90 backdrop-blur">Arrastre para mirar · ↑ ↓ o W S para caminar</p>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-2">
        <button type="button" className={boton} {...mantener(-1)} aria-label="Retroceder">◀ Retroceder</button>
        <button type="button" className={boton} {...mantener(1)} aria-label="Avanzar">Avanzar ▶</button>
        <button type="button" className={boton} onClick={() => { ctl.current.auto = !ctl.current.auto; setAuto(ctl.current.auto); }}>{auto ? '❚❚ Pausa' : '▶ Caminar solo'}</button>
        <label className="pointer-events-auto flex min-w-[9rem] flex-1 items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-[11px] text-white/85 backdrop-blur">
          <input type="range" min="0" max="1000" value={Math.round(prog * 1000)} onChange={(e) => { ctl.current.salto = (e.target.value / 1000) * largoRef.current; }} className="w-full accent-[#c8e05a]" aria-label="Posición en la pasarela" />
          <span className="w-14 text-right font-mono">{metros} m</span>
        </label>
        <button type="button" className={boton} onClick={() => { ctl.current.yaw = 0; ctl.current.pitch = -0.04; }}>⟳ Frente</button>
        <button type="button" className={boton} onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); else caja.current?.requestFullscreen?.(); }}>{completa ? '✕ Salir' : '⛶ Pantalla completa'}</button>
      </div>
    </div>
  );
}
