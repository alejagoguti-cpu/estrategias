import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PAS, pbr, clamp, crearBriznas, crearArboles, posarEspecies, animarEspecies } from './comun.js';

// Colegio de Tierra Bomba: aulas de bloque de tierra comprimida sobre zócalo de piedra, galería de madera,
// gran cubierta flotante de lámina ondulada sobre cerchas de madera (separada de los muros para ventilar),
// tanque de lluvia, patio de adoquín con árbol de sombra, bancas de tronco y pastizal seco alto.
const PISO = 0.6; const HM = 3.0;
const terreno = (x, z) => 0.04 * Math.sin(x * 0.11) * Math.cos(z * 0.09) + 0.02 * Math.sin(x * 0.5 + z * 0.4);

function caja(w, h, d, mat, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
const en = (m, x, y, z) => { m.position.set(x, y, z); return m; };
// barra entre dos puntos (cerchas, diagonales)
function barra(a, b, s, mat) { const d = new THREE.Vector3().subVectors(b, a); const m = caja(s, s, d.length(), mat, 1.5); m.position.copy(a).addScaledVector(d, 0.5); m.lookAt(b); return m; }
// muro con vanos: lo parte en celdas y omite las que caen dentro de una ventana o puerta
function muro(x0, x1, y0, y1, z, esp, vanos, mat, tile) {
  const g = new THREE.Group(); const xs = [...new Set([x0, x1, ...vanos.flatMap((v) => [v.x0, v.x1])])].sort((a, b) => a - b); const ys = [...new Set([y0, y1, ...vanos.flatMap((v) => [v.y0, v.y1])])].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const cx = (xs[i] + xs[i + 1]) / 2; const cy = (ys[j] + ys[j + 1]) / 2; if (vanos.some((v) => cx > v.x0 && cx < v.x1 && cy > v.y0 && cy < v.y1)) continue;
    const m = caja(xs[i + 1] - xs[i], ys[j + 1] - ys[j], esp, mat, tile); m.position.set(cx, cy, z);
    const uv = m.geometry.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) + xs[i] / tile, uv.getY(k) + ys[j] / tile); g.add(m);
  }
  return g;
}

// convierte la textura de ladrillo cocido en bloque de tierra comprimida: desatura y tiñe ocre-arena
function aTierra(m, tinte = [1.42, 1.08, 0.74], mezcla = 0.3) {
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
      diffuseColor.rgb = mix(vec3(lum), diffuseColor.rgb, ${mezcla.toFixed(2)}) * vec3(${tinte.map((v) => v.toFixed(2)).join(', ')});`);
  };
  return m;
}

export default function escenaColegio(ctx) {
  const { escena, tl, sol, nieblaU, uT, vivo, rnd } = ctx;
  const M = {
    bloque: aTierra(pbr(tl, 'ladrillo', [0.36, 0.36]), [2.0, 1.28, 0.7], 0.55), adoquin: aTierra(pbr(tl, 'adoquin', [1.6, 1.6]), [1.9, 1.3, 0.85], 0.6), piedra: pbr(tl, 'roca', [1, 1], { color: 0xb8aa96 }),
    deck: pbr(tl, 'madera', [1, 1], { color: 0xb87a55 }), oscura: pbr(tl, 'madera', [0.5, 3], { color: 0x5c3a26 }),
    lamina: new THREE.MeshStandardMaterial({ color: 0x6e5644, metalness: 0.55, roughness: 0.55, side: THREE.DoubleSide }),
    zocalo: aTierra(pbr(tl, 'ladrillo', [0.36, 0.36]), [1.3, 0.9, 0.55], 0.5), marco: pbr(tl, 'madera', [0.5, 2], { color: 0x4a2e1c }),
    vidrio: new THREE.MeshPhysicalMaterial({ color: 0xd8e6ea, metalness: 0.1, roughness: 0.04, transparent: true, opacity: 0.2, envMapIntensity: 1.5, side: THREE.DoubleSide, depthWrite: false }),
    piso: (() => { const m = pbr(tl, 'revoque', [1, 1], { color: 0xcdbca4 }); m.map = null; return m; })(), cielo: new THREE.MeshStandardMaterial({ color: 0xe2d0b2, roughness: 0.92, side: THREE.DoubleSide }),
    lampara: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e8, emissiveIntensity: 2.2 }), tablero: new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.25 }),
    tanque: new THREE.MeshStandardMaterial({ color: 0xa9b4ba, metalness: 0.8, roughness: 0.35 }), gris: new THREE.MeshStandardMaterial({ color: 0x4a5156, metalness: 0.6, roughness: 0.4 }),
  };

  // suelo: pastizal seco y tierra
  {
    const g = new THREE.PlaneGeometry(600, 600, 240, 240); g.rotateX(-Math.PI / 2); const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); const z = pa.getZ(i); const lejos = Math.max(0, Math.hypot(x - 5, z) - 170) / 200 * 6; pa.setY(i, terreno(x, z) + lejos); uv.setXY(i, x / 4, z / 4); const v = 0.92 + 0.08 * Math.sin(x * 0.13 + z * 0.17); col.set([0.72 * v, 0.98 * v, 0.52 * v], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pbr(tl, 'cesped', [1, 1], { vertexColors: true })); m.receiveShadow = true; escena.add(m);
  }

  // bloque de aulas (aulas de 10 m con paños de 2,5 m), orientado con la galería hacia +z.
  // Estructura como en la referencia: pilares de madera embebidos en el muro de bloque, viga de remate,
  // y desde la cabeza de cada pilar tornapuntas en V que sostienen las vigas de la cubierta flotante,
  // que vuela sobre la galería sin postes en el borde.
  function aulas(x0, x1, z0, z1, conInterior) {
    const g = new THREE.Group(); const largo = x1 - x0; const prof = z1 - z0; const yTop = PISO + HM;
    g.add(en(caja(largo + 0.5, PISO, prof + 0.5, M.zocalo, 1.5), (x0 + x1) / 2, PISO / 2, (z0 + z1) / 2));
    g.add(en(caja(largo + 1, PISO - 0.02, 4.2, M.deck, 2), (x0 + x1) / 2, (PISO - 0.02) / 2, z1 + 2.1));
    // paños: puerta (P), ventana con celosía baja (V) o celosía completa (C)
    const tipoFrente = ['P', 'V', 'C', 'P']; const tipoFondo = ['V', 'V', 'C', 'V'];
    const vanos = (tipos) => { const lista = []; for (let a = x0; a < x1 - 0.1; a += 10) for (let k = 0; k < 4; k++) { const cx = a + 1.25 + k * 2.5; const t = tipos[k]; lista.push({ cx, t, x0: cx - 0.55, x1: cx + 0.55, y0: t === 'P' ? PISO : PISO + 0.02, y1: PISO + 2.95 }); } return lista; };
    const frente = vanos(tipoFrente); const fondo = vanos(tipoFondo);
    g.add(muro(x0, x1, PISO, yTop, z1, 0.3, frente, M.bloque, 1.2)); g.add(muro(x0, x1, PISO, yTop, z0, 0.3, fondo, M.bloque, 1.2));
    [x0, x1].forEach((x) => { const m = muro(z0, z1, PISO, yTop, 0, 0.3, [], M.bloque, 1.2); m.rotation.y = -Math.PI / 2; m.position.x = x; g.add(m); });
    for (let x = x0 + 10; x < x1 - 1; x += 10) { const m = muro(z0, z1, PISO, yTop, 0, 0.2, [], M.bloque, 1.2); m.rotation.y = -Math.PI / 2; m.position.x = x; g.add(m); }
    // carpintería de cada paño
    const celosia = (cx, y0, y1, z) => { const fil = Math.floor((y1 - y0) / 0.13); for (let j = 0; j < fil; j++) for (let i = 0; i < 4; i++) { const bx = cx - 0.42 + i * 0.28 + (j % 2) * 0.14; if (bx > cx + 0.46) continue; g.add(en(caja(0.2, 0.09, 0.26, M.bloque, 0.6), bx, y0 + 0.06 + j * 0.13, z)); } };
    [[frente, z1], [fondo, z0]].forEach(([lista, z]) => lista.forEach((v) => {
      const marco = (w, h, x, y) => g.add(en(caja(w, h, 0.32, M.marco), x, y, z));
      marco(0.07, v.y1 - v.y0, v.x0 + 0.035, (v.y0 + v.y1) / 2); marco(0.07, v.y1 - v.y0, v.x1 - 0.035, (v.y0 + v.y1) / 2); marco(1.1, 0.08, v.cx, v.y1 - 0.04);
      if (v.t === 'P') { marco(1.1, 0.07, v.cx, PISO + 2.35); const h = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.5), M.vidrio); h.position.set(v.cx, PISO + 2.65, z); g.add(h); return; }
      if (v.t === 'C') { celosia(v.cx, PISO, v.y1 - 0.08, z); return; }
      celosia(v.cx, PISO, PISO + 0.9, z); marco(1.1, 0.07, v.cx, PISO + 0.93); marco(1.1, 0.06, v.cx, PISO + 2.5);
      g.add(en(caja(1.24, 0.05, 0.18, M.marco), v.cx, PISO + 0.95, z + (z === z1 ? 0.2 : -0.2)));
      const vid = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 1.5), M.vidrio); vid.position.set(v.cx, PISO + 1.72, z); g.add(vid);
      const vid2 = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.36), M.vidrio); vid2.position.set(v.cx, PISO + 2.73, z); g.add(vid2);
    }));
    // pilares embebidos y viga de remate
    for (let x = x0; x <= x1 + 0.01; x += 5) [z0, z1].forEach((z) => g.add(en(caja(0.26, HM, 0.34, M.oscura, 1.5), x, PISO + HM / 2, z)));
    [z0, z1].forEach((z) => g.add(en(caja(largo + 0.3, 0.28, 0.36, M.oscura, 2), (x0 + x1) / 2, yTop + 0.14, z)));
    // cubierta flotante: vigas inclinadas sobre tornapuntas en V, correas, lámina y tapa
    const zA = z0 - 2.0; const zB = z1 + 4.6; const yA = yTop + 1.25; const yB = yTop + 2.35; const yR = (z) => yA + ((z - zA) / (zB - zA)) * (yB - yA);
    for (let x = x0; x <= x1 + 0.01; x += 5) {
      g.add(barra(new THREE.Vector3(x, yR(zA) - 0.2, zA), new THREE.Vector3(x, yR(zB) - 0.2, zB), 0.2, M.oscura));
      [[z1, 2.5], [z1, -2.4], [z0, 1.9], [z0, -1.8]].forEach(([zb, d]) => { const za = zb + (zb === z1 ? 1 : -1) * 0; g.add(barra(new THREE.Vector3(x, yTop + 0.28, za), new THREE.Vector3(x, yR(zb + d) - 0.3, zb + d), 0.13, M.oscura)); });
      g.add(barra(new THREE.Vector3(x, yTop + 0.28, z1), new THREE.Vector3(x, yR(z1) - 0.3, z1), 0.14, M.oscura)); g.add(barra(new THREE.Vector3(x, yTop + 0.28, z0), new THREE.Vector3(x, yR(z0) - 0.3, z0), 0.14, M.oscura));
    }
    for (let z = zA + 0.3; z < zB; z += 0.9) g.add(en(caja(largo + 1.6, 0.09, 0.07, M.oscura, 2), (x0 + x1) / 2, yR(z) - 0.06, z));
    g.add(en(caja(largo + 1.7, 0.22, 0.08, M.oscura, 2), (x0 + x1) / 2, yR(zB) - 0.08, zB));
    { const ancho = largo + 1.8; const lp = Math.hypot(zB - zA, yB - yA); const geo = new THREE.PlaneGeometry(ancho, lp + 0.3, Math.round(ancho / 0.019), 4); const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, 0.022 * Math.sin((pa.getX(i) * 2 * Math.PI) / 0.076)); geo.computeVertexNormals();
      const l = new THREE.Mesh(geo, M.lamina); l.rotation.x = -Math.PI / 2 - Math.atan2(yB - yA, zB - zA); l.position.set((x0 + x1) / 2, (yA + yB) / 2 + 0.03, (zA + zB) / 2); l.castShadow = true; l.receiveShadow = true; g.add(l); }
    // interior: piso de cemento claro, cielo raso con luminarias lineales
    g.add(en(caja(largo - 0.3, 0.02, prof - 0.3, M.piso, 2), (x0 + x1) / 2, PISO + 0.01, (z0 + z1) / 2));
    const cielo = new THREE.Mesh(new THREE.PlaneGeometry(largo - 0.3, prof - 0.3), M.cielo); cielo.rotation.x = Math.PI / 2; cielo.position.set((x0 + x1) / 2, yTop - 0.02, (z0 + z1) / 2); g.add(cielo);
    if (conInterior) interior(g, x0, z0, z1, yTop);
    return g;
  }
  function interior(g, x0, z0, z1, yTop) {
    for (let a = x0; a < x0 + 30; a += 10) {
      for (let k = 0; k < 4; k++) { const lam = caja(0.32, 0.06, 2.2, M.lampara); lam.castShadow = false; lam.position.set(a + 1.6 + k * 2.3, yTop - 0.06, (z0 + z1) / 2); g.add(lam); }
      const luz = new THREE.PointLight(0xfff1dc, 9, 14, 1.6); luz.position.set(a + 5, yTop - 0.5, (z0 + z1) / 2); g.add(luz);
      g.add(en(caja(0.03, 1.2, 2.6, M.tablero), a + 9.86, PISO + 1.55, (z0 + z1) / 2));
    }
    const cache = {}; const cargador = new GLTFLoader(); const traer = (n) => cache[n] || (cache[n] = new Promise((ok) => cargador.load(`${PAS}colegio/${n}.glb`, (r) => ok(r.scene), undefined, () => ok(null))));
    const poner = (n, x, y, z, r) => traer(n).then((e) => { if (!e || !vivo()) return; const m = e.clone(true); m.position.set(x, y, z); m.rotation.y = r; m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.add(m); });
    for (let a = x0; a < x0 + 30; a += 10) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const x = a + 3.0 + i * 2.2; const z = z0 + 2.2 + j * 3.2; poner('WoodenTable_01', x, PISO, z, Math.PI / 2);
      [-0.55, 0.55].forEach((dz) => poner('SchoolChair_01', x - 0.62, PISO, z + dz, Math.PI / 2));
    }
  }
  escena.add(aulas(0, 30, -8, 0, true));
  escena.add(aulas(-20, -8, -24, -17, false));
  // muro de cerramiento de bloque
  { const m = muro(-30, 14, 0, 2.4, 0, 0.35, [], M.bloque, 1.2); m.rotation.y = -Math.PI / 2; m.position.x = -24; escena.add(m); escena.add(en(caja(0.45, 0.08, 44, M.bloque, 1.2), -24, 2.44, -8)); }
  // patio de adoquín, camino y peldaños
  { const p = caja(23, 0.06, 26, M.adoquin, 2.2); p.position.set(-12.2, 0.03, -1); escena.add(p); escena.add(en(caja(2.4, 0.06, 18, M.adoquin, 2.2), -1.8, 0.03, -5));
    for (let z = 5; z < 40; z += 1.45) escena.add(en(caja(2.4, 0.1, 1.05, M.adoquin, 2.2), -1.8, 0.05, z)); }
  // tanque de lluvia
  escena.add(en(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.6, 48, 1), M.tanque), 33, 1.3, -3)); escena.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.5, 10), M.gris), 31.7, 2.75, -1.8));
  // bancas de madera, fogón de piedra y tocones como asientos
  [[-16, 9.5, 0.2], [-9, 10.5, -0.1], [-19, -4, 1.4], [-5, -9, 0]].forEach(([x, z, r]) => { const b = caja(3.6, 0.45, 0.55, M.oscura, 1.5); b.position.set(x, 0.26, z); b.rotation.y = r; escena.add(b); });
  { const g = new THREE.IcosahedronGeometry(1, 2); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const k = 1 + 0.15 * Math.sin(pa.getX(i) * 5 + pa.getY(i) * 3); pa.setXYZ(i, pa.getX(i) * k, pa.getY(i) * k * 0.7, pa.getZ(i) * k); } g.computeVertexNormals();
    const im = new THREE.InstancedMesh(g, M.piedra, 18); const o = new THREE.Object3D(); for (let i = 0; i < 18; i++) { const a = (i / 18) * 6.283; o.position.set(-7 + Math.cos(a) * 0.85, 0.12, 4 + Math.sin(a) * 0.85); o.rotation.set(rnd(), rnd() * 6, rnd()); o.scale.setScalar(0.22 + rnd() * 0.06); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } im.castShadow = true; escena.add(im); }
  new GLTFLoader().load(`${PAS}colegio/tree_stump_01.glb`, (r) => { if (!vivo()) return; for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + 0.3; const m = r.scene.clone(true); m.position.set(-7 + Math.cos(a) * 2.6, 0.03, 4 + Math.sin(a) * 2.6); m.scale.set(0.32, 0.8, 0.32); m.rotation.y = rnd() * 6; m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); escena.add(m); } });

  // pastizal seco alto y árboles
  const enObra = (x, z) => (x > -24.5 && x < 34 && z > -26 && z < 6.5) || (Math.abs(x + 1.8) < 1.9 && z > 4) ;
  const pasto = []; for (let i = 0; i < 190000; i++) { const x = -40 + rnd() * 95; const z = -40 + rnd() * 85; if (enObra(x, z)) continue; const cerca = z > 6 && z < 42 ? 1 : 0.55; if (rnd() > cerca) continue; pasto.push({ x, y: terreno(x, z), z, h: 0.5 + rnd() * 0.75 }); }
  crearBriznas(escena, pasto, { uT, sol, nieblaU, paleta: 'pradera', ancho: 0.011 });
  const lugares = [{ x: -12, y: 0.06, z: 0, h: 10, tipo: 0 }, { x: -30, y: 0, z: 18, h: 8 }, { x: 40, y: 0, z: -18, h: 9 }, { x: -36, y: 0, z: -22, h: 9 }];
  for (let i = 0; i < 520; i++) { const a = rnd() * 6.283; const r = 60 + rnd() * 200; const x = 5 + Math.cos(a) * r; const z = Math.sin(a) * r; lugares.push({ x, y: terreno(x, z) + Math.max(0, Math.hypot(x - 5, z) - 170) / 200 * 6, z }); }
  crearArboles(escena, tl, lugares, rnd, [0.92, 0.92, 0.84]);

  const { animales, posar } = posarEspecies(escena, { sol, nieblaU, vivo, rnd });
  posar('monarca', Array.from({ length: 10 }, () => ({ p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: new THREE.Vector3(-14 + rnd() * 30, 1.2, 8 + rnd() * 20), f: rnd() * 6 })));
  posar('gaviota_v', Array.from({ length: 5 }, (_, i) => ({ p: new THREE.Vector3(), esc: 0.8, tipo: 'vuelo', aleteo: 0.18, c: new THREE.Vector3(-10 + rnd() * 30, 20 + rnd() * 10, -20 - rnd() * 40), r: 25 + rnd() * 25, v: (0.1 + rnd() * 0.08) * (i % 2 ? 1 : -1), f: rnd() * 6 })));

  const curva = new THREE.CatmullRomCurve3([[-1.8, 38], [-1.8, 14], [-1.8, 6.5], [0.2, 2.6], [1.25, 1.2], [1.4, -1.6], [2.2, -4.2], [5.2, -4.2], [8.3, -4.0], [9.0, -2.6], [8.75, -0.6], [9.6, 1.8], [14, 2.2], [27, 2.0], [32, 3.5], [35.5, -3], [32, -10.5], [16, -11.5], [2, -11.5], [-4, -8], [-6, -1], [-10, 5.5], [-6, 12]].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = curva.getLength();
  const marco = (s, lado = 0) => { const u = clamp(s / L, 0, 1); const p = curva.getPointAt(u); const t = curva.getTangentAt(u).setY(0).normalize(); const l = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize(); return { p: p.addScaledVector(l, lado), t, l }; };
  const piso = (s) => { const p = marco(s).p; if (p.x > -0.5 && p.x < 30.5 && p.z > -8 && p.z < 4.2) return PISO; return terreno(p.x, p.z) + 0.06; };
  const altura = (s) => (piso(s - 0.5) + piso(s) * 2 + piso(s + 0.5)) / 4;
  return { curva, L, marco, altura, actualizar: (t) => animarEspecies(animales, t) };
}
