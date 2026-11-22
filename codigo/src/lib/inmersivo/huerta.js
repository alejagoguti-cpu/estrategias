import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PAS, pbr, clamp, crearBriznas, crearArboles, posarEspecies, animarEspecies } from './comun.js';

// Huerta-vivero comunitaria: invernadero de marco de acero galvanizado (columnas, cerchas, tornapuntas,
// correas) con cubierta a dos aguas de policarbonato ondulado translúcido y manchado, costados abiertos,
// tres líneas de mesas de cultivo de madera con tierra, bandejas negras de alvéolos con plántulas, matas
// y lechugas (modeladas en Blender), riego por goteo y piso de tierra laterítica.
const ALERO = 3.0; const CUMBRE = 4.6; const ANCHO = 10; const LARGO = 28; const MESA = 0.85;
const terreno = (x, z) => 0.04 * Math.sin(x * 0.11) * Math.cos(z * 0.09) + 0.02 * Math.sin(x * 0.5 + z * 0.4);

function caja(w, h, d, mat, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
const en = (m, x, y, z) => { m.position.set(x, y, z); return m; };
function barra(a, b, s, mat) { const d = new THREE.Vector3().subVectors(b, a); const m = caja(s, s, d.length(), mat); m.position.copy(a).addScaledVector(d, 0.5); m.lookAt(b); return m; }
function texPolicarbonato() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024; const x = c.getContext('2d');
  x.fillStyle = '#f3ecdc'; x.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 70; i++) { const px = Math.random() * 512; const w = 6 + Math.random() * 40; const g = x.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, 'rgba(196,150,84,0)'); g.addColorStop(0.5 + Math.random() * 0.4, `rgba(190,140,70,${0.08 + Math.random() * 0.2})`); g.addColorStop(1, 'rgba(160,110,50,0.25)'); x.fillStyle = g; x.fillRect(px, 0, w, 1024); }
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(120,90,50,${Math.random() * 0.12})`; x.fillRect(Math.random() * 512, Math.random() * 1024, 2 + Math.random() * 6, 2 + Math.random() * 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function texBandeja() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#121212'; x.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { const g = x.createRadialGradient(16 + i * 32, 16 + j * 32, 2, 16 + i * 32, 16 + j * 32, 14); g.addColorStop(0, '#3a2618'); g.addColorStop(1, '#1e140c'); x.fillStyle = g; x.fillRect(4 + i * 32, 4 + j * 32, 24, 24); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default function escenaHuerta(ctx) {
  const { escena, tl, sol, nieblaU, uT, vivo, rnd } = ctx;
  const M = {
    acero: new THREE.MeshStandardMaterial({ color: 0xb9bec1, metalness: 0.85, roughness: 0.38 }),
    poli: new THREE.MeshPhysicalMaterial({ map: texPolicarbonato(), transparent: true, opacity: 0.62, roughness: 0.35, metalness: 0, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 0.8 }),
    madera: pbr(tl, 'madera', [0.5, 2], { color: 0xb08a60 }), tierra: pbr(tl, 'cultivo', [1, 1]), laterita: pbr(tl, 'laterita', [1, 1], { color: 0xe0b8a0 }),
    bandeja: new THREE.MeshStandardMaterial({ map: texBandeja(), roughness: 0.6 }), negro: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5 }),
    bloque: pbr(tl, 'ladrillo', [0.36, 0.36], { color: new THREE.Color(1.5, 1.05, 0.72) }), lamina: new THREE.MeshStandardMaterial({ color: 0x6e5644, metalness: 0.55, roughness: 0.55, side: THREE.DoubleSide }),
  };

  // suelo: tierra laterítica alrededor del invernadero y pradera más allá
  {
    const g = new THREE.PlaneGeometry(600, 600, 240, 240); g.rotateX(-Math.PI / 2); const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); const z = pa.getZ(i); const lejos = Math.max(0, Math.hypot(x, z) - 170) / 200 * 6; pa.setY(i, terreno(x, z) + lejos); uv.setXY(i, x / 4, z / 4); const v = 0.92 + 0.08 * Math.sin(x * 0.13 + z * 0.17); col.set([0.72 * v, 0.98 * v, 0.52 * v], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pbr(tl, 'cesped', [1, 1], { vertexColors: true })); m.receiveShadow = true; escena.add(m);
    const pat = caja(ANCHO + 10, 0.04, LARGO + 14, M.laterita, 3); pat.position.set(0, 0.02, 0); escena.add(pat);
  }

  // invernadero: pórticos cada 3,5 m
  const g = new THREE.Group(); escena.add(g); const s = 0.08;
  for (let z = -LARGO / 2; z <= LARGO / 2 + 0.01; z += 3.5) {
    [-1, 1].forEach((l) => { g.add(en(caja(s, ALERO, s, M.acero), l * ANCHO / 2, ALERO / 2, z)); g.add(barra(new THREE.Vector3(l * ANCHO / 2, ALERO, z), new THREE.Vector3(0, CUMBRE, z), s, M.acero)); g.add(barra(new THREE.Vector3(l * ANCHO / 2, ALERO - 0.7, z), new THREE.Vector3(l * (ANCHO / 2 - 1.1), ALERO + 0.33, z), 0.05, M.acero)); });
    g.add(barra(new THREE.Vector3(-ANCHO / 2, ALERO, z), new THREE.Vector3(ANCHO / 2, ALERO, z), 0.05, M.acero));
    [-1, 1].forEach((l) => g.add(barra(new THREE.Vector3(l * 1.6, ALERO, z), new THREE.Vector3(l * 1.6, ALERO + (CUMBRE - ALERO) * (1 - 1.6 / (ANCHO / 2)), z), 0.04, M.acero)));
  }
  for (let k = 0; k <= 4; k++) [-1, 1].forEach((l) => { const x = l * (ANCHO / 2) * (1 - k / 4); const y = ALERO + (CUMBRE - ALERO) * (k / 4); g.add(barra(new THREE.Vector3(x, y - 0.06, -LARGO / 2), new THREE.Vector3(x, y - 0.06, LARGO / 2), 0.06, M.acero)); });
  // cubierta de policarbonato ondulado (dos aguas)
  [-1, 1].forEach((l) => {
    const lp = Math.hypot(ANCHO / 2 + 0.4, CUMBRE - ALERO + 0.13); const geo = new THREE.PlaneGeometry(LARGO + 0.6, lp, Math.round((LARGO + 0.6) / 0.02), 3); const pa = geo.attributes.position;
    for (let i = 0; i < pa.count; i++) pa.setZ(i, 0.018 * Math.sin((pa.getX(i) * 2 * Math.PI) / 0.076)); geo.computeVertexNormals();
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (LARGO / 4), uv.getY(i));
    const m = new THREE.Mesh(geo, M.poli); const u = new THREE.Vector3(0, 0, 1); const v = new THREE.Vector3(-l * ANCHO / 2, CUMBRE - ALERO, 0).normalize(); const n = new THREE.Vector3().crossVectors(u, v);
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, v, n)); m.position.set(l * ANCHO / 4, (ALERO + CUMBRE) / 2 + 0.07, 0); g.add(m);
  });
  // hastiales: marco y policarbonato en la parte alta
  [-LARGO / 2, LARGO / 2].forEach((z) => {
    for (let x = -ANCHO / 2 + 1.25; x < ANCHO / 2; x += 1.25) { const top = ALERO + (CUMBRE - ALERO) * (1 - Math.abs(x) / (ANCHO / 2)); g.add(en(caja(0.05, top - 2.1, 0.05, M.acero), x, 2.1 + (top - 2.1) / 2, z)); }
    g.add(en(caja(ANCHO, 0.05, 0.05, M.acero), 0, 2.1, z));
    const sh = new THREE.Shape(); sh.moveTo(-ANCHO / 2, 2.1); sh.lineTo(ANCHO / 2, 2.1); sh.lineTo(ANCHO / 2, ALERO); sh.lineTo(0, CUMBRE); sh.lineTo(-ANCHO / 2, ALERO); sh.closePath();
    const p = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.poli); p.position.z = z; g.add(p);
  });

  // mesas de cultivo: tres líneas, cada una en tres tramos
  const tramos = [[-12.5, -4.6], [-3.4, 4.0], [5.2, 12.5]]; const lineas = [{ x: -3.5, w: 1.4, tipo: 'mata' }, { x: 0, w: 1.8, tipo: 'bandeja' }, { x: 3.5, w: 1.4, tipo: 'lechuga' }];
  const lugares = { plantula: [], mata: [], lechuga: [] }; const bandejas = [];
  lineas.forEach((ln) => tramos.forEach(([z0, z1], ti) => {
    const L = z1 - z0; const cz = (z0 + z1) / 2;
    for (const dz of [z0 + 0.15, z1 - 0.15]) for (const dx of [-ln.w / 2 + 0.08, ln.w / 2 - 0.08]) g.add(en(caja(0.08, MESA, 0.08, M.madera), ln.x + dx, MESA / 2, dz));
    g.add(en(caja(ln.w, 0.05, L, M.madera, 1.5), ln.x, MESA, cz));
    [-1, 1].forEach((l) => g.add(en(caja(0.05, 0.24, L, M.madera, 1.5), ln.x + l * (ln.w / 2 - 0.025), MESA + 0.14, cz))); [z0, z1].forEach((z) => g.add(en(caja(ln.w, 0.24, 0.05, M.madera, 1.5), ln.x, MESA + 0.14, z)));
    g.add(en(caja(ln.w - 0.1, 0.18, L - 0.1, M.tierra, 1), ln.x, MESA + 0.11, cz));
    { const gotero = en(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, L, 6), M.negro), ln.x - 0.25, MESA + 0.21, cz); gotero.rotation.x = Math.PI / 2; g.add(gotero); }
    if (ln.tipo === 'bandeja') { for (let z = z0 + 0.25; z < z1 - 0.2; z += 0.31) for (const dx of [-0.6, -0.03, 0.54]) { bandejas.push([ln.x + dx, z]); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if (rnd() < 0.92) lugares.plantula.push({ x: ln.x + dx - 0.2 + i * 0.13, y: MESA + 0.26, z: z - 0.07 + j * 0.14, k: 1.6 + rnd() * 0.5 }); } }
    else { const sep = ln.tipo === 'mata' ? 0.42 : 0.34; for (let z = z0 + 0.3; z < z1 - 0.2; z += sep) for (const dx of [-0.32, 0.32]) lugares[ln.tipo].push({ x: ln.x + dx + (rnd() - 0.5) * 0.05, y: MESA + 0.2, z, k: ln.tipo === 'mata' ? 1.6 + rnd() * 0.7 : 1.3 + rnd() * 0.4 }); }
  }));
  { const bg = caja(0.29, 0.06, 0.29, M.negro); const tapa = new THREE.PlaneGeometry(0.28, 0.27); tapa.rotateX(-Math.PI / 2); const ib = new THREE.InstancedMesh(bg.geometry, M.negro, bandejas.length); const it = new THREE.InstancedMesh(tapa, M.bandeja, bandejas.length); const o = new THREE.Object3D();
    bandejas.forEach(([x, z], i) => { o.position.set(x, MESA + 0.23, z); o.scale.set(1.9, 1, 1); o.updateMatrix(); ib.setMatrixAt(i, o.matrix); o.position.y = MESA + 0.262; o.scale.set(1.9, 1, 1); o.updateMatrix(); it.setMatrixAt(i, o.matrix); }); g.add(ib, it); }
  const cargador = new GLTFLoader(); const o = new THREE.Object3D();
  Object.entries(lugares).forEach(([nombre, lista]) => cargador.load(`${PAS}huerta/${nombre}.glb`, (gl) => {
    if (!vivo()) return; let malla = null; gl.scene.traverse((m) => { if (m.isMesh && !malla) malla = m; }); if (!malla) return;
    const geo = malla.geometry; if (geo.attributes.color_1) geo.setAttribute('color', geo.attributes.color_1); const mat = malla.material.clone(); mat.side = THREE.DoubleSide; mat.vertexColors = true;
    const im = new THREE.InstancedMesh(geo, mat, lista.length); lista.forEach((l, i) => { o.position.set(l.x, l.y, l.z); o.rotation.set(0, rnd() * 6.283, 0); o.scale.setScalar(l.k); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.receiveShadow = true; im.castShadow = nombre !== 'plantula'; g.add(im);
  }));

  // construcciones de bloque alrededor (como en la referencia) y tanque de lluvia
  [[-15, -6, 8, 6, 0.1], [15, -2, 9, 6, -0.1], [3, -30, 12, 6, 0]].forEach(([x, z, w, d, r]) => { const b = new THREE.Group(); b.add(en(caja(w, 2.8, d, M.bloque, 1.2), 0, 1.4, 0)); const t = caja(w + 1.2, 0.06, d + 1.4, M.lamina); t.position.y = 3.05; t.rotation.z = 0.1; b.add(t); b.position.set(x, 0, z); b.rotation.y = r; escena.add(b); });
  escena.add(en(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.5, 48), new THREE.MeshStandardMaterial({ color: 0xa9b4ba, metalness: 0.8, roughness: 0.35 })), 7.4, 1.25, 10));

  // pradera, árboles y fauna
  const pasto = []; for (let i = 0; i < 140000; i++) { const x = -45 + rnd() * 90; const z = -45 + rnd() * 90; if (Math.abs(x) < 10 && Math.abs(z) < 21) continue; pasto.push({ x, y: terreno(x, z), z, h: 0.25 + rnd() * 0.45 }); }
  crearBriznas(escena, pasto, { uT, sol, nieblaU, paleta: 'pradera', ancho: 0.01 });
  const arb = [{ x: -12, y: 0, z: 14, h: 7 }, { x: 13, y: 0, z: 16, h: 8 }, { x: -20, y: 0, z: -20, h: 9 }, { x: 22, y: 0, z: -24, h: 9 }];
  for (let i = 0; i < 520; i++) { const a = rnd() * 6.283; const r = 50 + rnd() * 200; const x = Math.cos(a) * r; const z = Math.sin(a) * r; arb.push({ x, y: terreno(x, z) + Math.max(0, Math.hypot(x, z) - 170) / 200 * 6, z }); }
  crearArboles(escena, tl, arb, rnd, [0.92, 0.92, 0.84]);
  const { animales, posar } = posarEspecies(escena, { sol, nieblaU, vivo, rnd });
  posar('monarca', Array.from({ length: 8 }, () => ({ p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: new THREE.Vector3(-4 + rnd() * 8, 1.6, -10 + rnd() * 20), f: rnd() * 6 })));
  posar('colibri', Array.from({ length: 3 }, () => ({ p: new THREE.Vector3(), esc: 0.11, tam: 0.7, tipo: 'mariposa', aleteo: 0.6, base: new THREE.Vector3(-8 + rnd() * 16, 2.0, 16 + rnd() * 4), f: rnd() * 6 })));

  // recorrido: entra por el hastial, recorre un pasillo, cruza entre tramos y sale por el otro pasillo
  const curva = new THREE.CatmullRomCurve3([[1.75, 24], [1.75, 15], [1.75, 6], [1.75, -4], [0, -4.0], [-1.75, -4.0], [-1.75, -10], [-1.75, -16], [-6, -19], [-10, -14], [-9, -4], [-9.5, 6]].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = curva.getLength();
  const marco = (s, lado = 0) => { const u = clamp(s / L, 0, 1); const p = curva.getPointAt(u); const t = curva.getTangentAt(u).setY(0).normalize(); const l = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize(); return { p: p.addScaledVector(l, lado), t, l }; };
  const altura = (s) => { const p = marco(s).p; return terreno(p.x, p.z) + 0.04; };
  return { curva, L, marco, altura, actualizar: (t) => animarEspecies(animales, t) };
}
