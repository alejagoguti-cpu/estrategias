import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PAS, pbr, clamp, crearBriznas, crearArboles, posarEspecies, animarEspecies } from './comun.js';

// Parque de juego natural en un claro del bosque seco: piso de viruta, red de trepar en A con postes de acero,
// torre de madera con red, troncos de equilibrio, pilotes para saltar, túnel, rocas, sendero de concreto y bancas.
const terreno = (x, z) => 0.05 * Math.sin(x * 0.11) * Math.cos(z * 0.09) + Math.max(0, -x - 14) * 0.12;
function caja(w, h, d, mat, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
const en = (m, x, y, z) => { m.position.set(x, y, z); return m; };
function barra(a, b, r, mat, lados = 10) { const d = new THREE.Vector3().subVectors(b, a); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), lados), mat); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; return m; }

export default function escenaParque(ctx) {
  const { escena, tl, sol, nieblaU, uT, vivo, rnd } = ctx;
  const M = {
    viruta: pbr(tl, 'viruta', [1, 1]), madera: pbr(tl, 'madera', [0.5, 2], { color: 0xd8b48a }), tronco: pbr(tl, 'corteza', [1, 1]),
    acero: new THREE.MeshStandardMaterial({ color: 0xaab0b4, metalness: 0.85, roughness: 0.35 }), cuerda: new THREE.MeshStandardMaterial({ color: 0xe8dcb8, roughness: 0.9 }),
    roca: pbr(tl, 'roca', [1, 1]), concreto: pbr(tl, 'concreto', [1, 1], { color: 0xe8e4dc }), tubo: new THREE.MeshStandardMaterial({ color: 0x1c1f21, roughness: 0.6 }),
    negro: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.4 }),
  };
  {
    const g = new THREE.PlaneGeometry(500, 500, 200, 200); g.rotateX(-Math.PI / 2); const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); const z = pa.getZ(i); pa.setY(i, terreno(x, z) + Math.max(0, Math.hypot(x, z) - 150) / 200 * 6); uv.setXY(i, x / 4, z / 4); col.set([0.66, 0.92, 0.5], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pbr(tl, 'cesped', [1, 1], { vertexColors: true })); m.receiveShadow = true; escena.add(m);
  }
  // piso de viruta y sendero
  const piso = new THREE.Mesh(new THREE.CircleGeometry(14, 64), M.viruta); piso.rotation.x = -Math.PI / 2; piso.position.set(0, 0.04, 0); piso.scale.set(1.25, 1, 1); piso.receiveShadow = true;
  { const uv = piso.geometry.attributes.uv; const pa = piso.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pa.getX(i) / 2, pa.getY(i) / 2); } escena.add(piso);
  const sendero = new THREE.CatmullRomCurve3([[20, 30], [17, 14], [15, 2], [17, -12], [22, -26]].map(([x, z]) => new THREE.Vector3(x, 0, z)));
  { const pts = sendero.getSpacedPoints(80); for (let i = 0; i < pts.length - 1; i++) { const a = pts[i]; const b = pts[i + 1]; const d = new THREE.Vector3().subVectors(b, a); const s = caja(2.2, 0.06, d.length() + 0.05, M.concreto, 2); s.position.copy(a).add(b).multiplyScalar(0.5).setY(0.05); s.rotation.y = Math.atan2(d.x, d.z); escena.add(s); } }

  // red de trepar en A
  { const g = new THREE.Group(); const h = 3.2; const base = 1.9; const L = 2.6;
    [-L / 2, L / 2].forEach((z) => { [-1, 1].forEach((s) => { const pata = en(caja(0.16, Math.hypot(h, base), 0.16, M.madera), (s * base) / 2, h / 2, z); pata.rotation.z = -s * Math.atan2(base, h); g.add(pata); }); g.add(en(caja(0.12, 0.12, 0.12, M.madera), 0, h, z)); });
    g.add(barra(new THREE.Vector3(0, h, -L / 2 - 0.1), new THREE.Vector3(0, h, L / 2 + 0.1), 0.07, M.madera)); g.add(en(caja(2.4, 0.12, L + 0.2, M.madera), 0, 0.08, 0));
    for (let k = 1; k < 9; k++) { const t = k / 9; const x = -base * (1 - t); const y = h * t; g.add(barra(new THREE.Vector3(x, y, -L / 2), new THREE.Vector3(x, y, L / 2), 0.015, M.cuerda, 6)); }
    for (let z = -L / 2; z <= L / 2 + 0.01; z += 0.33) g.add(barra(new THREE.Vector3(-base, 0.05, z), new THREE.Vector3(0, h, z), 0.015, M.cuerda, 6));
    [-1.4, 1.4].forEach((z) => g.add(barra(new THREE.Vector3(-2.6, 0, z), new THREE.Vector3(-2.6, 3.6, z), 0.08, M.acero, 16)));
    g.position.set(-2, 0.04, 2); g.rotation.y = 0.4; escena.add(g); }
  // torre con red perimetral
  { const g = new THREE.Group(); const H = 3.4;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(en(caja(0.18, H, 0.18, M.madera), a * 1.2, H / 2, b * 1.2)));
    g.add(en(caja(2.6, 0.1, 2.6, M.madera, 1.5), 0, 1.6, 0));
    for (let k = 0; k < 6; k++) [[0, -1.2], [0, 1.2]].forEach(([, z]) => g.add(barra(new THREE.Vector3(-1.2, 1.75 + k * 0.28, z), new THREE.Vector3(1.2, 1.75 + k * 0.28, z), 0.012, M.cuerda, 6)));
    for (let x = -1.2; x <= 1.21; x += 0.3) [-1.2, 1.2].forEach((z) => g.add(barra(new THREE.Vector3(x, 1.7, z), new THREE.Vector3(x, H, z), 0.012, M.cuerda, 6)));
    [-1.4, 1.4].forEach((x) => g.add(barra(new THREE.Vector3(x, 0, 1.6), new THREE.Vector3(x, H + 0.4, 1.6), 0.07, M.acero, 16)));
    g.position.set(3, 0.04, -5); g.rotation.y = -0.3; escena.add(g); }
  // troncos de equilibrio, pilotes, túnel, rocas
  [[-6, -3, 6, 0.6], [5, 3, 4.5, -0.9], [-1, -9, 5, 0.1]].forEach(([x, z, l, r]) => { const t = barra(new THREE.Vector3(-l / 2, 0, 0), new THREE.Vector3(l / 2, 0, 0), 0.16, M.tronco, 18); const g = new THREE.Group(); g.add(t); g.position.set(x, 0.42, z); g.rotation.y = r; escena.add(g); [-l / 2 + 0.4, l / 2 - 0.4].forEach((d) => { const s = en(caja(0.12, 0.3, 0.4, M.madera), d, -0.27, 0); g.add(s); }); });
  for (let i = 0; i < 7; i++) { const x = 8 + i * 0.75; const z = -2 + Math.sin(i) * 1.2; const h = 0.3 + (i % 3) * 0.15; escena.add(barra(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, h, z), 0.11, M.acero, 16)); escena.add(en(caja(0.38, 0.06, 0.38, M.madera), x, h + 0.03, z)); }
  { const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.4, 32, 1, true), M.tubo); tub.material.side = THREE.DoubleSide; tub.rotation.z = Math.PI / 2; tub.position.set(6.5, 0.6, -6); tub.rotation.y = 0.5; tub.castShadow = true; escena.add(tub); }
  { const g = new THREE.IcosahedronGeometry(1, 3); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const k = 1 + 0.16 * Math.sin(pa.getX(i) * 3 + pa.getY(i) * 2) * Math.cos(pa.getZ(i) * 2.6); pa.setXYZ(i, pa.getX(i) * k * 1.2, pa.getY(i) * k * 0.65, pa.getZ(i) * k); } g.computeVertexNormals();
    const im = new THREE.InstancedMesh(g, M.roca, 30); const o = new THREE.Object3D(); for (let i = 0; i < 30; i++) { const a = -0.6 + (i / 30) * 2.4 + rnd() * 0.1; const r = 15 + rnd() * 3; o.position.set(-Math.cos(a) * r - 2, terreno(-Math.cos(a) * r, Math.sin(a) * r) + 0.1, Math.sin(a) * r * 0.9); o.rotation.set(rnd(), rnd() * 6, rnd()); o.scale.setScalar(0.4 + rnd() * 0.7); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } im.castShadow = true; im.receiveShadow = true; escena.add(im); }
  // bancas en el sendero y tocones
  [[18.6, 6, -0.15], [18.4, -4, 0.1], [17.2, 14, -0.2]].forEach(([x, z, r]) => { const g = new THREE.Group(); g.add(en(caja(1.8, 0.06, 0.45, M.madera), 0, 0.45, 0)); g.add(en(caja(1.8, 0.4, 0.05, M.madera), 0, 0.72, 0.22)); [-0.8, 0.8].forEach((d) => g.add(en(caja(0.06, 0.45, 0.45, M.negro), d, 0.22, 0))); g.position.set(x, 0, z); g.rotation.y = -Math.PI / 2 + r; escena.add(g); });
  new GLTFLoader().load(`${PAS}colegio/tree_stump_01.glb`, (r) => { if (!vivo()) return; for (let i = 0; i < 7; i++) { const m = r.scene.clone(true); m.position.set(-8 + i * 1.1, 0.04, 6 + Math.sin(i * 1.3)); m.scale.set(0.26, 0.5 + (i % 3) * 0.15, 0.26); m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); escena.add(m); } });

  // vegetación: pasto alrededor, bosque denso
  const pasto = []; for (let i = 0; i < 120000; i++) { const x = -40 + rnd() * 80; const z = -40 + rnd() * 80; if ((x / 17.5) ** 2 + (z / 14) ** 2 < 1) continue; if (Math.abs(x - 17.5 + z * 0.08) < 1.4) continue; pasto.push({ x, y: terreno(x, z), z, h: 0.25 + rnd() * 0.5 }); }
  crearBriznas(escena, pasto, { uT, sol, nieblaU, paleta: 'pradera', ancho: 0.01 });
  const arb = []; for (let i = 0; i < 900; i++) { const a = rnd() * 6.283; const r = 22 + Math.pow(rnd(), 0.7) * 170; arb.push({ x: Math.cos(a) * r, y: terreno(Math.cos(a) * r, Math.sin(a) * r) + Math.max(0, r - 150) / 200 * 6, z: Math.sin(a) * r, h: 9 + rnd() * 5 }); }
  [[-12, -10], [11, 9], [-14, 10]].forEach(([x, z]) => arb.push({ x, y: terreno(x, z), z, h: 11 }));
  crearArboles(escena, tl, arb, rnd, [0.88, 0.94, 0.84]);
  const { animales, posar } = posarEspecies(escena, { sol, nieblaU, vivo, rnd });
  posar('monarca', Array.from({ length: 10 }, () => ({ p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: new THREE.Vector3(-10 + rnd() * 20, 1.4, -10 + rnd() * 20), f: rnd() * 6 })));
  posar('colibri', Array.from({ length: 4 }, () => ({ p: new THREE.Vector3(), esc: 0.11, tam: 0.7, tipo: 'mariposa', aleteo: 0.6, base: new THREE.Vector3(-14 + rnd() * 28, 2.4, -12 + rnd() * 24), f: rnd() * 6 })));

  const curva = new THREE.CatmullRomCurve3([[20, 30], [17, 14], [12, 6], [4, 4], [-1, -1], [-5, 1], [-8, 4], [-9, -5], [-3, -10], [5, -9], [10, -4], [15, 2], [17, -12], [22, -26]].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = curva.getLength();
  const marco = (s, lado = 0) => { const u = clamp(s / L, 0, 1); const p = curva.getPointAt(u); const t = curva.getTangentAt(u).setY(0).normalize(); const l = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize(); return { p: p.addScaledVector(l, lado), t, l }; };
  const altura = (s) => { const p = marco(s).p; return terreno(p.x, p.z) + 0.08; };
  return { curva, L, marco, altura, actualizar: (t) => animarEspecies(animales, t) };
}
