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

export default function escenaColegio(ctx) {
  const { escena, tl, sol, nieblaU, uT, vivo, rnd } = ctx;
  const M = {
    bloque: pbr(tl, 'bloque', [1, 1], { color: 0xf0d8c0 }), adoquin: pbr(tl, 'adoquin', [1, 1]), piedra: pbr(tl, 'roca', [1, 1], { color: 0xb8aa96 }),
    deck: pbr(tl, 'madera', [1, 1], { color: 0xb87a55 }), oscura: pbr(tl, 'madera', [0.5, 3], { color: 0x5c3a26 }),
    lamina: new THREE.MeshStandardMaterial({ color: 0x4d4038, metalness: 0.7, roughness: 0.45, side: THREE.DoubleSide }),
    tanque: new THREE.MeshStandardMaterial({ color: 0xa9b4ba, metalness: 0.8, roughness: 0.35 }), gris: new THREE.MeshStandardMaterial({ color: 0x4a5156, metalness: 0.6, roughness: 0.4 }),
  };

  // suelo: pastizal seco y tierra
  {
    const g = new THREE.PlaneGeometry(600, 600, 240, 240); g.rotateX(-Math.PI / 2); const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); const z = pa.getZ(i); const lejos = Math.max(0, Math.hypot(x - 5, z) - 170) / 200 * 6; pa.setY(i, terreno(x, z) + lejos); uv.setXY(i, x / 4, z / 4); const v = 0.92 + 0.08 * Math.sin(x * 0.13 + z * 0.17); col.set([1.0 * v, 0.86 * v, 0.58 * v], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pbr(tl, 'cesped', [1, 1], { vertexColors: true })); m.receiveShadow = true; escena.add(m);
  }

  // bloque de aulas con galería y cubierta flotante (orientado hacia +z)
  function aulas(x0, x1, z0, z1, conPupitres) {
    const g = new THREE.Group(); const largo = x1 - x0; const prof = z1 - z0;
    g.add(en(caja(largo + 0.6, PISO, prof + 0.6, M.piedra, 1.5), (x0 + x1) / 2, PISO / 2, (z0 + z1) / 2));
    g.add(en(caja(largo + 1, PISO, 4, M.deck, 2), (x0 + x1) / 2, PISO / 2, z1 + 2)); g.add(en(caja(largo + 1, 0.3, 0.7, M.deck, 2), (x0 + x1) / 2, 0.15, z1 + 4.35));
    const ventanas = []; const puertas = [];
    for (let x = x0 + 1.6; x < x1 - 1; x += 3) { const esPuerta = Math.abs(((x - x0 - 1.6) / 3) % 3.3 - 1) < 0.01; if (esPuerta) puertas.push({ x0: x - 0.6, x1: x + 0.6, y0: PISO, y1: PISO + 2.2 }); else ventanas.push({ x0: x - 0.5, x1: x + 0.5, y0: PISO + 0.9, y1: PISO + 2.4 }); }
    g.add(muro(x0, x1, PISO, PISO + HM, z1, 0.3, [...ventanas, ...puertas], M.bloque, 1.2));
    g.add(muro(x0, x1, PISO, PISO + HM, z0, 0.3, ventanas, M.bloque, 1.2));
    [x0, x1].forEach((x) => { const m = muro(z0, z1, PISO, PISO + HM, 0, 0.3, [], M.bloque, 1.2); m.rotation.y = -Math.PI / 2; m.position.x = x; g.add(m); });
    for (let x = x0 + 10; x < x1 - 1; x += 10) { const m = muro(z0, z1, PISO, PISO + HM, 0, 0.2, [], M.bloque, 1.2); m.rotation.y = -Math.PI / 2; m.position.x = x; g.add(m); }
    // marcos y postigos de madera
    [...ventanas.map((v) => [v, z1]), ...ventanas.map((v) => [v, z0])].forEach(([v, z]) => { const s = z === z1 ? 1 : -1; const cx = (v.x0 + v.x1) / 2; const cy = (v.y0 + v.y1) / 2;
      g.add(en(caja(1.12, 0.08, 0.34, M.oscura), cx, v.y0, z)); g.add(en(caja(1.12, 0.08, 0.34, M.oscura), cx, v.y1, z)); g.add(en(caja(0.08, 1.5, 0.34, M.oscura), v.x0, cy, z)); g.add(en(caja(0.08, 1.5, 0.34, M.oscura), v.x1, cy, z));
      const p = caja(0.5, 1.4, 0.04, M.oscura); p.position.set(v.x0 - 0.22, cy, z + s * 0.3); p.rotation.y = s * 1.2; g.add(p); });
    puertas.forEach((v) => { const cx = (v.x0 + v.x1) / 2; g.add(en(caja(1.36, 0.1, 0.34, M.oscura), cx, v.y1, z1)); });
    // cerchas, postes, correas y lámina ondulada
    const yA = PISO + HM + 1.5; const yB = PISO + HM + 2.9; const zA = z0 - 2.5; const zB = z1 + 5.5; const yR = (z) => yA + ((z - zA) / (zB - zA)) * (yB - yA);
    for (let x = x0; x <= x1 + 0.01; x += 5) {
      [z0 - 0.4, z1 + 0.35, z1 + 3.9].forEach((z) => g.add(en(caja(0.22, yR(z), 0.22, M.oscura), x, yR(z) / 2, z)));
      const inf = PISO + HM + 0.75; g.add(barra(new THREE.Vector3(x, yR(zA), zA), new THREE.Vector3(x, yR(zB), zB), 0.16, M.oscura)); g.add(barra(new THREE.Vector3(x, inf, z0 - 0.8), new THREE.Vector3(x, inf, z1 + 4.4), 0.14, M.oscura));
      for (let k = 0; k < 6; k++) { const za = z0 - 0.8 + (k * (z1 + 4.4 - (z0 - 0.8))) / 6; const zb = z0 - 0.8 + ((k + 1) * (z1 + 4.4 - (z0 - 0.8))) / 6; const arriba = k % 2 === 0; g.add(barra(new THREE.Vector3(x, arriba ? inf : yR(za) - 0.08, za), new THREE.Vector3(x, arriba ? yR(zb) - 0.08 : inf, zb), 0.1, M.oscura)); }
    }
    for (let z = zA + 0.4; z < zB; z += 1.1) g.add(en(caja(largo + 3, 0.1, 0.08, M.oscura, 2), (x0 + x1) / 2, yR(z) - 0.09, z));
    { const ancho = largo + 3.2; const lp = Math.hypot(zB - zA, yB - yA); const geo = new THREE.PlaneGeometry(ancho, lp + 0.6, Math.round(ancho / 0.019), 4); const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, 0.022 * Math.sin((pa.getX(i) * 2 * Math.PI) / 0.076)); geo.computeVertexNormals();
      const l = new THREE.Mesh(geo, M.lamina); l.rotation.x = -Math.PI / 2 - Math.atan2(yB - yA, zB - zA); l.position.set((x0 + x1) / 2, (yA + yB) / 2 + 0.02, (zA + zB) / 2); l.castShadow = true; l.receiveShadow = true; g.add(l); }
    if (conPupitres) pupitres(g, x0, z0, z1);
    return g;
  }
  function pupitres(g, x0, z0, z1) {
    const cache = {}; const cargador = new GLTFLoader(); const traer = (n) => cache[n] || (cache[n] = new Promise((ok) => cargador.load(`${PAS}colegio/${n}.glb`, (r) => ok(r.scene), undefined, () => ok(null))));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = x0 + 2.2 + i * 2.6; const z = z0 + 2.0 + j * 1.9;
      traer('WoodenTable_01').then((e) => { if (!e || !vivo()) return; const m = e.clone(true); m.position.set(x, PISO, z); m.rotation.y = Math.PI; m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.add(m); });
      [-0.45, 0.45].forEach((dx) => traer('SchoolChair_01').then((e) => { if (!e || !vivo()) return; const m = e.clone(true); m.position.set(x + dx, PISO, z + 0.55); m.rotation.y = Math.PI; g.add(m); })); }
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
  const pasto = []; for (let i = 0; i < 190000; i++) { const x = -40 + rnd() * 95; const z = -40 + rnd() * 85; if (enObra(x, z)) continue; const cerca = z > 6 && z < 42 ? 1 : 0.55; if (rnd() > cerca) continue; pasto.push({ x, y: terreno(x, z), z, h: 0.55 + rnd() * 0.9 }); }
  crearBriznas(escena, pasto, { uT, sol, nieblaU, paleta: 'seca', ancho: 0.011 });
  const lugares = [{ x: -12, y: 0.06, z: 0, h: 10, tipo: 0 }, { x: -30, y: 0, z: 18, h: 8 }, { x: 40, y: 0, z: -18, h: 9 }, { x: -36, y: 0, z: -22, h: 9 }];
  for (let i = 0; i < 520; i++) { const a = rnd() * 6.283; const r = 60 + rnd() * 200; const x = 5 + Math.cos(a) * r; const z = Math.sin(a) * r; lugares.push({ x, y: terreno(x, z) + Math.max(0, Math.hypot(x - 5, z) - 170) / 200 * 6, z }); }
  crearArboles(escena, tl, lugares, rnd, [0.92, 0.92, 0.84]);

  const { animales, posar } = posarEspecies(escena, { sol, nieblaU, vivo, rnd });
  posar('monarca', Array.from({ length: 10 }, () => ({ p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: new THREE.Vector3(-14 + rnd() * 30, 1.2, 8 + rnd() * 20), f: rnd() * 6 })));
  posar('gaviota_v', Array.from({ length: 5 }, (_, i) => ({ p: new THREE.Vector3(), esc: 0.8, tipo: 'vuelo', aleteo: 0.18, c: new THREE.Vector3(-10 + rnd() * 30, 20 + rnd() * 10, -20 - rnd() * 40), r: 25 + rnd() * 25, v: (0.1 + rnd() * 0.08) * (i % 2 ? 1 : -1), f: rnd() * 6 })));

  const curva = new THREE.CatmullRomCurve3([[-1.8, 38], [-1.8, 14], [-1.8, 6.5], [2.5, 2.2], [14, 2.0], [27, 2.0], [32, 3.5], [35.5, -3], [32, -10.5], [16, -11.5], [2, -11.5], [-4, -8], [-6, -1], [-10, 5.5], [-6, 12]].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = curva.getLength();
  const marco = (s, lado = 0) => { const u = clamp(s / L, 0, 1); const p = curva.getPointAt(u); const t = curva.getTangentAt(u).setY(0).normalize(); const l = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize(); return { p: p.addScaledVector(l, lado), t, l }; };
  const piso = (s) => { const p = marco(s).p; if (p.x > -0.5 && p.x < 30.5 && p.z > 0 && p.z < 4) return PISO; if (p.x > -0.5 && p.x < 30.5 && p.z >= 4 && p.z < 4.7) return 0.3; return terreno(p.x, p.z) + 0.06; };
  const altura = (s) => (piso(s - 0.5) + piso(s) * 2 + piso(s + 0.5)) / 4;
  return { curva, L, marco, altura, actualizar: (t) => animarEspecies(animales, t) };
}
