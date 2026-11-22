import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PAS, pbr, clamp, crearBriznas, cargarPasto, crearArboles, posarEspecies, animarEspecies, texSolar } from './comun.js';

// Vivienda modular y replicable en la meseta de Tierra Bomba: cinco módulos de 3,6 m (sala-comedor, zaguán
// abierto, dos dormitorios), cubiertas inclinadas con cielo raso de madera y ventanas altas, celosía de
// ladrillo, paneles solares, deck con sala hundida y muebles reales (Poly Haven). Otras casas iguales se
// replican en el fondo para mostrar que el módulo se repite.
const PISO = 0.45; const H = 3.0; const TOPE = PISO + H;
const terreno = (x, z) => 0.05 * Math.sin(x * 0.11) * Math.cos(z * 0.09) + 0.03 * Math.sin(x * 0.4 + z * 0.3);
const enPiso = (x, z) => x > -9.6 && x < 13.2 && z > -6 && z < 10.4;
const enFoso = (x, z) => x > 3 && x < 7.2 && z > 4.4 && z < 6.8;

// caja con UV a escala real (repite la textura cada `tile` metros)
function caja(w, h, d, mat, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
const en = (m, x, y, z) => { m.position.set(x, y, z); return m; };

export default function escenaCasa(ctx) {
  const { escena, tl, sol, nieblaU, uT, vivo, rnd } = ctx;
  const M = {
    madera: pbr(tl, 'madera', [1, 1]), maderaPiso: pbr(tl, 'madera', [1, 1], { color: 0xe8d6c0 }), maderaCielo: pbr(tl, 'madera', [1, 1], { color: 0xf0c48e }),
    revoque: (() => { const m = pbr(tl, 'revoque', [1, 1], { color: 0xd8c7ab }); m.map = null; return m; })(), ladrillo: pbr(tl, 'ladrillo', [1, 1], { color: 0xf2c9a8 }),
    lamina: new THREE.MeshStandardMaterial({ color: 0x3b3936, metalness: 0.55, roughness: 0.45 }),
    bronce: new THREE.MeshStandardMaterial({ color: 0x3a332c, metalness: 0.75, roughness: 0.35 }),
    vidrio: new THREE.MeshPhysicalMaterial({ color: 0xd8e6ea, metalness: 0.1, roughness: 0.04, transparent: true, opacity: 0.22, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false }),
    solar: new THREE.MeshPhysicalMaterial({ map: texSolar(), roughness: 0.12, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05 }),
    gris: new THREE.MeshStandardMaterial({ color: 0x4a5156, metalness: 0.6, roughness: 0.4 }),
  };

  // pradera
  {
    const g = new THREE.PlaneGeometry(600, 600, 240, 240); g.rotateX(-Math.PI / 2); const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); const z = pa.getZ(i); const lejos = Math.max(0, Math.hypot(x, z) - 160) / 200 * 6; pa.setY(i, terreno(x, z) + lejos); uv.setXY(i, x / 4, z / 4); const v = 0.9 + 0.1 * Math.sin(x * 0.13 + z * 0.17); col.set([0.72 * v, 0.98 * v, 0.52 * v], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pbr(tl, 'cesped', [1, 1], { vertexColors: true })); m.receiveShadow = true; escena.add(m);
  }

  function vidrioX(x0, x1, z, y0 = PISO, y1 = TOPE, paso = 1.2) { // paño de vidrio a lo largo de x
    const g = new THREE.Group(); const w = x1 - x0; const p = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0), M.vidrio); en(p, (x0 + x1) / 2, (y0 + y1) / 2, z); g.add(p);
    for (let x = x0; x <= x1 + 0.01; x += paso) g.add(en(caja(0.06, y1 - y0, 0.09, M.bronce), Math.min(x, x1), (y0 + y1) / 2, z));
    g.add(en(caja(w, 0.07, 0.1, M.bronce), (x0 + x1) / 2, y0 + 0.035, z)); g.add(en(caja(w, 0.07, 0.1, M.bronce), (x0 + x1) / 2, y1 - 0.035, z)); return g;
  }
  function vidrioZ(z0, z1, x, y0 = PISO, y1 = TOPE, paso = 1.2) { const g = vidrioX(z0, z1, 0, y0, y1, paso); g.rotation.y = -Math.PI / 2; g.position.x = x; return g; }
  function triangulo(xa, ya, xb, yb, yBase, z) { // vidrio del hastial bajo la cubierta inclinada
    const s = new THREE.Shape(); s.moveTo(xa, yBase); s.lineTo(xb, yBase); s.lineTo(xb, yb); s.lineTo(xa, ya); s.closePath();
    const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.ShapeGeometry(s), M.vidrio); m.position.z = z; g.add(m);
    for (let x = xa; x <= xb + 0.01; x += 1.2) { const yt = ya + ((yb - ya) * (x - xa)) / (xb - xa); g.add(en(caja(0.06, yt - yBase, 0.09, M.bronce), Math.min(x, xb), (yt + yBase) / 2, z)); }
    return g;
  }
  function cubierta(x0, x1, yAlto, yBajo, z0, z1, altaIzq = true) {
    const largo = Math.hypot(x1 - x0, yAlto - yBajo); const ang = Math.atan2(yAlto - yBajo, x1 - x0) * (altaIzq ? 1 : -1);
    const g = new THREE.BoxGeometry(largo, 0.26, z1 - z0); const uv = g.attributes.uv; const dims = [[z1 - z0, 0.26], [z1 - z0, 0.26], [largo, z1 - z0], [largo, z1 - z0], [largo, 0.26], [largo, 0.26]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / 2, uv.getY(i) * dims[f][1] / 2); }
    const m = new THREE.Mesh(g, [M.madera, M.madera, M.lamina, M.maderaCielo, M.madera, M.madera]); m.castShadow = true; m.receiveShadow = true;
    m.position.set((x0 + x1) / 2, (yAlto + yBajo) / 2 + 0.13, (z0 + z1) / 2); m.rotation.z = -ang; return m;
  }

  function construirCasa(conMuebles) {
    const c = new THREE.Group();
    // piso interior, deck y sala hundida
    c.add(en(caja(18.8, PISO, 8.0, M.maderaPiso, 2), 0, PISO / 2, -1.8));
    [[-14, 3, 2.2, 9.5], [7.2, 13, 2.2, 9.5], [3, 7.2, 2.2, 4.4], [3, 7.2, 6.8, 9.5]].forEach(([a, b, d, e]) => c.add(en(caja(b - a, PISO, e - d, M.madera, 2), (a + b) / 2, PISO / 2, (d + e) / 2)));
    c.add(en(caja(4.2, 0.05, 2.4, M.madera, 2), 5.1, 0.025, 5.6)); c.add(en(caja(27, 0.22, 0.8, M.madera, 2), -0.5, 0.11, 9.9));
    // ala izquierda: sala-comedor con vidrio de piso a techo
    c.add(en(caja(7.2, H, 0.22, M.revoque, 2), -5.4, PISO + H / 2, -5.4));
    c.add(vidrioX(-9, -1.8, 1.8)); c.add(vidrioZ(-5.3, 1.8, -9)); c.add(vidrioZ(-5.3, 1.8, -1.8));
    [[-9, 1.8], [-1.8, 1.8], [-9, -5.4], [-1.8, -5.4]].forEach(([x, z]) => c.add(en(caja(0.3, H, 0.3, M.revoque, 2), x, PISO + H / 2, z)));
    c.add(cubierta(-10.4, -0.8, 4.7, TOPE + 0.12, -6.8, 3.2, true));
    c.add(triangulo(-9, 4.6, -1.8, TOPE + 0.2, TOPE, 1.8));
    // zaguán abierto con pérgola de madera
    c.add(en(caja(3.6, 0.16, 9.6, M.revoque, 2), 0, TOPE + 0.08, -1.2));
    for (let x = -1.65; x <= 1.66; x += 0.3) c.add(en(caja(0.07, 0.14, 9.4, M.maderaCielo, 2), x, TOPE - 0.07, -1.2));
    // ala derecha: dormitorios tras la celosía de ladrillo
    c.add(en(caja(7.2, H, 0.22, M.revoque, 2), 5.4, PISO + H / 2, -5.4)); c.add(en(caja(0.22, H, 7.2, M.revoque, 2), 1.8, PISO + H / 2, -1.8)); c.add(en(caja(0.22, H, 7.2, M.revoque, 2), 9, PISO + H / 2, -1.8)); c.add(en(caja(0.14, H, 7.2, M.revoque, 2), 5.4, PISO + H / 2, -1.8));
    c.add(vidrioX(1.9, 8.9, 1.8));
    c.add(cubierta(1.0, 10.4, 5.7, TOPE + 0.15, -6.8, 3.2, true));
    c.add(triangulo(1.9, 5.55, 8.9, TOPE + 0.25, TOPE, 1.8)); c.add(triangulo(1.9, 5.55, 8.9, TOPE + 0.25, TOPE, -5.4));
    { const ladr = caja(0.22, 0.07, 0.105, M.ladrillo, 0.5); const n = 26 * 22; const im = new THREE.InstancedMesh(ladr.geometry, M.ladrillo, n); const o = new THREE.Object3D(); let k = 0;
      for (let j = 0; j < 26; j++) for (let i = 0; i < 22; i++) { const x = 2.3 + i * 0.3 + (j % 2) * 0.15; if (x > 8.55) continue; o.position.set(x, PISO + 0.06 + j * 0.11, 2.45); o.rotation.y = (rnd() - 0.5) * 0.02; o.updateMatrix(); im.setMatrixAt(k++, o.matrix); }
      im.count = k; im.castShadow = true; im.receiveShadow = true; c.add(im);
      c.add(en(caja(6.6, 0.12, 0.3, M.revoque), 5.45, PISO + 2.95, 2.45)); }
    // pórtico frontal y columnas
    c.add(en(caja(12.2, 0.38, 0.34, M.revoque, 2), 3.9, TOPE - 0.05, 2.6)); [[-1.95, 2.6], [10, 2.6], [10, -5.4]].forEach(([x, z]) => c.add(en(caja(0.34, H + 0.1, 0.34, M.revoque, 2), x, PISO + H / 2, z)));
    // paneles solares y bajante
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const x = 2.4 + i * 1.25; const y = 5.7 - ((x - 1.0) / 9.4) * (5.7 - TOPE - 0.15) + 0.3; const p = caja(1.1, 0.04, 1.75, M.solar); p.material = [M.gris, M.gris, M.solar, M.gris, M.gris, M.gris]; p.position.set(x, y, -4.6 + j * 1.95); p.rotation.z = -Math.atan2(5.7 - TOPE - 0.15, 9.4); c.add(p); }
    c.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, TOPE + 0.1, 12), M.gris), 10.3, (TOPE + 0.1) / 2, 3.1));
    if (conMuebles) amoblar(c);
    return c;
  }

  // muebles reales (Poly Haven) ubicados en la sala, el comedor, el zaguán, el deck y la sala hundida
  function amoblar(c) {
    const lista = [
      ['sofa_02', -6.0, PISO, -0.6, 0], ['modern_coffee_table_01', -6.0, PISO, 0.7, Math.PI / 2], ['side_table_01', -7.3, PISO, -0.6, 0], ['Ottoman_01', -4.6, PISO, 0.8, 0.3],
      ['modern_arm_chair_01', -8.0, PISO, 0.9, Math.PI / 2], ['dining_table', -4.0, PISO, -3.4, 0],
      ['dining_chair_02', -4.6, PISO, -2.7, Math.PI], ['dining_chair_02', -3.4, PISO, -2.7, Math.PI], ['dining_chair_02', -4.6, PISO, -4.1, 0], ['dining_chair_02', -3.4, PISO, -4.1, 0],
      ['potted_plant_02', -2.4, PISO, 1.2, 0], ['potted_plant_02', -8.5, PISO, -4.8, 1], ['mid_century_lounge_chair', 1.0, PISO, -3.0, -0.6],
      ['modern_arm_chair_01', -11.4, PISO, 5.6, 0.5], ['modern_arm_chair_01', -9.6, PISO, 5.0, -0.3], ['modern_coffee_table_01', -10.6, PISO, 6.6, 0.2],
      ['sofa_03', 5.1, 0.05, 5.3, 0], ['Ottoman_01', 4.2, 0.05, 6.4, 0.2], ['outdoor_table_chair_set_01', 11.2, PISO, 6.2, 0.4],
      ['planter_pot_clay', 8.2, PISO, 4.2, 0], ['potted_plant_04', 8.2, PISO + 0.22, 4.2, 0], ['potted_plant_02', 11.8, PISO, 3.2, 2],
    ];
    const cache = {}; const cargador = new GLTFLoader();
    const traer = (nombre) => cache[nombre] || (cache[nombre] = new Promise((ok) => cargador.load(`${PAS}casa/${nombre}.glb`, (g) => ok(g.scene), undefined, () => ok(null))));
    lista.forEach(([n, x, y, z, r]) => traer(n).then((esc) => { if (!esc || !vivo()) return; const m = esc.clone(true); m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); m.position.set(x, y, z); m.rotation.y = r; c.add(m); }));
  }

  const casa = construirCasa(true); escena.add(casa);
  // réplicas del mismo módulo en la meseta
  [[46, -42, 0.35], [-52, -36, -0.25], [8, -86, 0.1], [92, -14, 0.6]].forEach(([x, z, r]) => { const c = construirCasa(false); c.position.set(x, terreno(x, z), z); c.rotation.y = r; escena.add(c); });

  // pasto, arbustos y árboles
  const blades = [];
  for (let i = 0; i < 150000; i++) { const a = rnd() * 6.283; const d = 2 + Math.pow(rnd(), 0.8) * 40; const x = Math.cos(a) * d * 1.2 - 1; const z = Math.sin(a) * d + 1; if (enPiso(x, z)) continue; blades.push({ x, y: terreno(x, z), z, h: 0.18 + rnd() * 0.32 }); }
  crearBriznas(escena, blades, { uT, sol, nieblaU, paleta: 'pradera', ancho: 0.01 });
  cargarPasto(escena, Array.from({ length: 900 }, () => { const a = rnd() * 6.283; const d = 3 + rnd() * 30; return { x: Math.cos(a) * d * 1.2, y: 0, z: Math.sin(a) * d, k: 0.4 }; }).filter((l) => !enPiso(l.x, l.z)), { uT, vivo, rnd });
  const arb = [[-20, -12, 9], [-24, 4, 10], [22, -14, 9.5], [18, 18, 8], [-26, 22, 9], [6, -22, 8], [-6, -26, 9], [30, 6, 10], [7.8, 3.6, 3.6]];
  const lugares = arb.map(([x, z, h], i) => ({ x, y: i === arb.length - 1 ? PISO : terreno(x, z), z, h, tipo: i % 2 }));
  for (let i = 0; i < 500; i++) { const a = rnd() * 6.283; const r = 60 + rnd() * 200; const x = Math.cos(a) * r; const z = Math.sin(a) * r; if (Math.hypot(x - 46, z + 42) < 16 || Math.hypot(x + 52, z + 36) < 16 || Math.hypot(x - 8, z + 86) < 16 || Math.hypot(x - 92, z + 14) < 16) continue; lugares.push({ x, y: terreno(x, z) + Math.max(0, Math.hypot(x, z) - 160) / 200 * 6, z }); }
  crearArboles(escena, tl, lugares, rnd, [0.9, 0.92, 0.86]);

  // especies 3D
  const { animales, posar } = posarEspecies(escena, { sol, nieblaU, vivo, rnd });
  posar('monarca', Array.from({ length: 10 }, () => { const a = rnd() * 6.283; const d = 6 + rnd() * 12; return { p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: new THREE.Vector3(Math.cos(a) * d * 1.3, 0.9, Math.sin(a) * d), f: rnd() * 6 }; }));
  posar('colibri', Array.from({ length: 4 }, () => ({ p: new THREE.Vector3(), esc: 0.11, tam: 0.7, tipo: 'mariposa', aleteo: 0.6, base: new THREE.Vector3(-14 + rnd() * 28, 2.2, 10 + rnd() * 6), f: rnd() * 6 })));
  posar('gaviota_v', Array.from({ length: 5 }, (_, i) => ({ p: new THREE.Vector3(), esc: 0.8, tipo: 'vuelo', aleteo: 0.18, c: new THREE.Vector3(-10 + rnd() * 20, 18 + rnd() * 10, -20 - rnd() * 40), r: 25 + rnd() * 25, v: (0.1 + rnd() * 0.08) * (i % 2 ? 1 : -1), f: rnd() * 6 })));

  // recorrido: llega por el prado, sube al deck, cruza el zaguán, rodea por detrás y vuelve al frente
  const curva = new THREE.CatmullRomCurve3([[-20, 24], [-13, 13], [-6.5, 7.6], [0, 6.4], [0, 1.5], [0, -3], [0, -8.5], [7, -11], [14.5, -5], [15, 4], [10, 13], [2, 16]].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = curva.getLength();
  const marco = (s, lado = 0) => { const u = clamp(s / L, 0, 1); const p = curva.getPointAt(u); const t = curva.getTangentAt(u).setY(0).normalize(); const l = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize(); return { p: p.addScaledVector(l, lado), t, l }; };
  const piso = (s) => { const p = marco(s).p; if (enPiso(p.x, p.z) && !enFoso(p.x, p.z)) return p.z > 9.5 ? 0.22 : PISO; return terreno(p.x, p.z); };
  const altura = (s) => (piso(s - 0.5) + piso(s) * 2 + piso(s + 0.5)) / 4;
  return { curva, L, marco, altura, actualizar: (t) => animarEspecies(animales, t) };
}
