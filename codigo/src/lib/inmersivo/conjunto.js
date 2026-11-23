import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { BASE, pbr, clamp, crearBriznas, crearArboles, bosquetes, posarEspecies, animarEspecies } from './comun.js';

// Conjunto de vivienda en la meseta (referencia: conjunto de bloques blancos alrededor de un eje de agua):
// dos hileras de bloques de tres y cuatro pisos, escalonados, de piedra coralina y losas blancas, con persianas de madera de piso a
// techo en paneles de lamas (sin vidrio), perfilería fina, balcones con antepecho y baranda de cables, aletas verticales y terrazas con
// pérgola. Eje central: canal de retención de lluvia con borde de piedra, prado y cocoteros.
const H = 3.2;
const terreno = (x, z) => 0.03 * Math.sin(x * 0.1) * Math.cos(z * 0.08) + Math.max(0, Math.hypot(x, z + 30) - 140) / 200 * 6;
function caja(w, h, d, mat, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
const en = (m, x, y, z) => { m.position.set(x, y, z); return m; };


// persianas de madera como la referencia: paneles con marco (largueros, travesaños y travesaño intermedio) y
// lamas horizontales inclinadas. Todo en dos InstancedMesh. L = largo, h = alto, eje = dirección del paño.
function persiana(L, h, eje, mat, anchoPanel = 0.75, semilla = 0) {
  const n = Math.max(1, Math.round(L / anchoPanel)); const wp = L / n; const paso = 0.085; const nl = Math.ceil(h / paso) + 2;
  const geo = new THREE.BoxGeometry(1, 1, 1); const marcos = new THREE.InstancedMesh(geo, mat, n * 5); const lamas = new THREE.InstancedMesh(geo, mat, n * nl);
  const o = new THREE.Object3D(); let im = 0; let il = 0;
  const poner = (mesh, i, t, y, st, sy, sd, giro = 0) => { if (eje === 'x') { o.position.set(t, y, 0); o.scale.set(st, sy, sd); o.rotation.set(giro, 0, 0); } else { o.position.set(0, y, t); o.scale.set(sd, sy, st); o.rotation.set(0, 0, giro); } o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  const yMed = -h / 2 + h * 0.36;
  for (let p = 0; p < n; p++) {
    const c = -L / 2 + (p + 0.5) * wp;
    poner(marcos, im++, c - wp / 2 + 0.035, 0, 0.065, h, 0.07); poner(marcos, im++, c + wp / 2 - 0.035, 0, 0.065, h, 0.07);
    poner(marcos, im++, c, h / 2 - 0.045, wp, 0.09, 0.07); poner(marcos, im++, c, -h / 2 + 0.06, wp, 0.12, 0.07); poner(marcos, im++, c, yMed, wp, 0.08, 0.07);
    const giro = 0.62 + 0.18 * Math.sin((p + semilla) * 2.7); // cada panel con sus lamas un poco distintas
    for (let y = -h / 2 + 0.16; y < h / 2 - 0.09; y += paso) { if (Math.abs(y - yMed) < 0.07) continue; poner(lamas, il++, c, y, wp - 0.12, 0.012, 0.075, giro); }
  }
  marcos.count = im; lamas.count = il; [marcos, lamas].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  const g = new THREE.Group(); g.add(marcos, lamas); return g;
}
// baranda liviana como la referencia: pasamanos de madera, parales y cables de acero
function barandaCable(L, eje, madera, acero) {
  const g = new THREE.Group(); const geo = new THREE.BoxGeometry(1, 1, 1); const o = new THREE.Object3D();
  const np = Math.max(2, Math.round(L / 1.5) + 1); const ac = new THREE.InstancedMesh(geo, acero, np + 5);
  const poner = (mesh, i, t, y, st, sy, sd) => { if (eje === 'x') { o.position.set(t, y, 0); o.scale.set(st, sy, sd); } else { o.position.set(0, y, t); o.scale.set(sd, sy, st); } o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  let i = 0; for (let k = 0; k < np; k++) poner(ac, i++, -L / 2 + (k * L) / (np - 1), 0.5, 0.05, 1.0, 0.05);
  for (let k = 0; k < 5; k++) poner(ac, i++, 0, 0.15 + k * 0.17, L, 0.008, 0.008);
  const pm = new THREE.InstancedMesh(geo, madera, 1); poner(pm, 0, 0, 1.04, L + 0.1, 0.06, 0.12);
  ac.castShadow = pm.castShadow = true; g.add(ac, pm); return g;
}

export default function escenaConjunto(ctx) {
  const { escena, tl, sol, nieblaU, uT, vivo, rnd } = ctx;
  const M = {
    blanco: (() => { const m = pbr(tl, 'revoque', [1, 1], { color: 0xffffff }); m.map = null; m.roughness = 0.85; m.aoMap = null; m.roughnessMap = null; m.metalnessMap = null; return m; })(),
    sombra: new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1 }),
    perfil: new THREE.MeshStandardMaterial({ color: 0x2c2f31, metalness: 0.7, roughness: 0.35 }), madera: pbr(tl, 'madera', [0.5, 2], { color: 0xc4925e }),
    piedra: pbr(tl, 'concreto', [1, 1], { color: 0xf0ebe0 }), borde: pbr(tl, 'roca', [1, 1], { color: 0xece6da }), cojin: new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.9 }),
    coralina: pbr(tl, 'coralina', [1, 1], { color: 0xf6ead4 }), // piedra coralina (Poly Haven coral_stone_wall, CC0)
    interior: new THREE.MeshStandardMaterial({ color: 0xffe4b8, emissive: 0x3a2a14, roughness: 0.9 }),
  };
  {
    const g = new THREE.PlaneGeometry(500, 500, 200, 200); g.rotateX(-Math.PI / 2); const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); const z = pa.getZ(i) - 30; pa.setZ(i, z); pa.setY(i, terreno(x, z)); uv.setXY(i, x / 3, z / 3); col.set([0.64, 0.95, 0.46], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pbr(tl, 'cesped', [1, 1], { vertexColors: true })); m.receiveShadow = true; escena.add(m);
  }
  // canal de retención con borde fino de piedra
  const tAgua = tl.load(`${BASE}datos/water_normals_fine.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
  const agua = new Water(new THREE.PlaneGeometry(5.2, 92), { textureWidth: 512, textureHeight: 512, waterNormals: tAgua, sunDirection: sol.clone(), sunColor: 0xfff2dc, waterColor: 0x1f6c78, distortionScale: 0.5, fog: true });
  agua.rotation.x = -Math.PI / 2; agua.position.set(0, -0.08, -38); agua.material.uniforms.size.value = 7; escena.add(agua); ctx.agua = agua;
  [-2.8, 2.8].forEach((x) => escena.add(en(caja(0.45, 0.14, 92.6, M.borde, 1.2), x, 0.05, -38)));
  [-38 - 46.3, -38 + 46.3].forEach((z) => escena.add(en(caja(6.05, 0.14, 0.45, M.borde, 1.2), 0, 0.05, z)));
  [-1, 1].forEach((s) => { for (let z = 6; z > -84; z -= 1.25) escena.add(en(caja(1.9, 0.06, 1.15, M.piedra, 1.2), s * 4.3, 0.03, z)); });
  [-46, -20, 6].forEach((z) => { escena.add(en(caja(1.8, 0.12, 5.8, M.madera, 1.5), 0, 0.18, z)); });

  // bloque de vivienda: frente hacia el eje (lado = -1 si el eje queda al -x)
  function bloque(cx, cz, w, d, pisos, lado) {
    const g = new THREE.Group(); const fx = cx - lado * (w / 2); const y0 = 0.5;
    g.add(en(caja(w + 0.6, y0, d + 0.6, M.coralina, 2), cx, y0 / 2, cz));
    for (let n = 0; n < pisos; n++) {
      const y = y0 + n * H;
      // losa con borde blanco que vuela 1,6 m sobre el eje (balcón) y antepecho + baranda de cables con pasamanos de madera
      g.add(en(caja(w + 1.6, 0.34, d + 0.4, M.blanco, 2), cx - lado * 0.8, y + H - 0.17, cz));
      if (n < pisos) { const yb = y; g.add(en(caja(0.22, 0.45, d + 0.2, M.blanco, 2), fx - lado * 1.5, yb + 0.25, cz)); g.add(en(barandaCable(d + 0.2, 'z', M.madera, M.perfil), fx - lado * 1.5, yb + 0.45, cz)); }
      // fachada de persianas de madera de piso a techo en paneles de lamas (sin vidrio); interior en penumbra detrás
      const zz0 = cz - d / 2 + 0.4; const zz1 = cz + d / 2 - 0.4; const largo = zz1 - zz0;
      g.add(en(persiana(largo, H - 0.4, 'z', M.madera, 0.75, n * 5 + cz), fx - lado * 0.02, y + (H - 0.34) / 2, cz)); const fondo = caja(0.04, H - 0.4, largo, M.sombra); fondo.castShadow = false; fondo.position.set(fx + lado * 3.2, y + (H - 0.34) / 2, cz); g.add(fondo);
      const vInt = caja(0.05, H - 0.6, largo - 0.6, M.interior); vInt.castShadow = false; vInt.position.set(fx + lado * 2.4, y + (H - 0.34) / 2, cz); g.add(vInt);
      for (let z = zz0; z <= zz1 + 0.01; z += 1.5) g.add(en(caja(0.07, H - 0.34, 0.06, M.perfil), fx, y + (H - 0.34) / 2, z));
      g.add(en(caja(0.07, 0.06, largo, M.perfil), fx, y + 2.3, cz));
      for (let k = 0; k < 3; k++) { const zc = cz - d / 2 + 2.4 + k * (d - 4.8) / 2; if ((k + n) % 2) continue; const cel = persiana(1.5, H - 0.45, 'z', M.madera, 0.75, zc + n); cel.position.set(fx - lado * 0.3, y + (H - 0.34) / 2, zc + 0.75); g.add(cel); }
      // aletas verticales de piedra coralina entre unidades
      [cz - d / 2 + 0.1, cz, cz + d / 2 - 0.1].forEach((z) => g.add(en(caja(1.7, H - 0.34, 0.3, M.coralina, 2), fx - lado * 0.75, y + (H - 0.34) / 2, z)));
      // fachada trasera y testeros de piedra coralina
      g.add(en(caja(0.3, H - 0.34, d, M.coralina, 2), cx + lado * (w / 2 - 0.15), y + (H - 0.34) / 2, cz));
      [cz - d / 2 + 0.15, cz + d / 2 - 0.15].forEach((z) => g.add(en(caja(w - 0.4, H - 0.34, 0.3, M.coralina, 2), cx, y + (H - 0.34) / 2, z)));
      for (let z = cz - d / 2 + 2; z < cz + d / 2 - 1; z += 3.2) { g.add(en(persiana(1.4, 1.6, 'z', M.madera, 0.7, z), cx + lado * (w / 2 + 0.04), y + 1.4, z)); }
    }
    // cubierta: antepecho, volumen de escalera y pérgola blanca sobre la terraza
    const yt = y0 + pisos * H;
    g.add(en(caja(w + 1.6, 0.55, d + 0.4, M.blanco, 2), cx - lado * 0.8, yt + 0.27, cz));
    g.add(en(caja(w * 0.32, 2.6, d * 0.28, M.coralina, 2), cx + lado * w * 0.2, yt + 1.3, cz + d * 0.2));
    const pg = new THREE.Group(); [-1, 1].forEach((sz) => [-1, 1].forEach((sx) => pg.add(en(caja(0.22, 2.5, 0.22, M.blanco), sx * w * 0.2, 1.25, sz * d * 0.22))));
    pg.add(en(caja(w * 0.45, 0.22, d * 0.5, M.blanco), 0, 2.55, 0)); for (let k = -5; k <= 5; k++) pg.add(en(caja(w * 0.42, 0.08, 0.12, M.madera), 0, 2.4, k * d * 0.045));
    pg.position.set(cx - lado * w * 0.15, yt, cz - d * 0.1); g.add(pg);
    return g;
  }
  const bloques = [];
  [-1, 1].forEach((s) => [0, 1, 2, 3].forEach((i) => { const w = 14; const d = 19; const pisos = (i + (s > 0 ? 1 : 0)) % 2 ? 3 : 4; const cz = 2 - i * 22; const cx = s * (11.5 + w / 2 + (i % 2) * 1.8); bloques.push([cx, cz, w, d]); escena.add(bloque(cx, cz, w, d, pisos, s)); }));

  // cocoteros en el eje y en los jardines, árboles de sombra y bosque alrededor
  const arb = [];
  for (let z = 10; z > -86; z -= 6.5) [-1, 1].forEach((s) => { arb.push({ x: s * (7.4 + rnd() * 0.8), y: 0, z: z + rnd() * 1.5, h: 9 + rnd() * 2.5, tipo: 2 }); });
  bloques.forEach(([cx, cz, w, d]) => { for (let k = 0; k < 3; k++) arb.push({ x: cx + Math.sign(cx) * (w / 2 + 2.5 + rnd() * 3), y: 0, z: cz - d / 2 + rnd() * d, h: 8 + rnd() * 3, tipo: 2 }); arb.push({ x: cx, y: 0, z: cz + d / 2 + 1.6, h: 6, tipo: 0 }); });
  for (let i = 0; i < 1300; i++) { const a = rnd() * 6.283; const r = 42 + Math.pow(rnd(), 0.7) * 200; const x = Math.cos(a) * r * 1.2; const z = -30 + Math.sin(a) * r; if (Math.abs(x) < 36 && z > -94 && z < 18) continue; arb.push({ x, y: terreno(x, z) - 0.3, z, h: 7 + rnd() * 6, tipo: rnd() < 0.35 ? 2 : undefined }); }
  crearArboles(escena, tl, arb, rnd, [0.9, 0.95, 0.88]);
  // prado corto y setos bajos al pie de los bloques
  const pasto = []; for (let i = 0; i < 110000; i++) { const x = -36 + rnd() * 72; const z = 18 - rnd() * 112; if (Math.abs(x) < 5.4) continue; if (bloques.some(([cx, cz, w, d]) => Math.abs(x - cx) < w / 2 + 2 && Math.abs(z - cz) < d / 2 + 0.6)) continue; pasto.push({ x, y: terreno(x, z), z, h: 0.08 + rnd() * 0.12 }); }
  crearBriznas(escena, pasto, { uT, sol, nieblaU, paleta: 'pradera', ancho: 0.008 });
  const setos = []; bloques.forEach(([cx, cz, w, d]) => { const fx = cx - Math.sign(cx) * (w / 2 + 2.2); for (let i = 0; i < 2600; i++) setos.push({ x: fx + (rnd() - 0.5) * 0.9, y: 0, z: cz - d / 2 + rnd() * d, h: 0.6 + rnd() * 0.4 }); });
  crearBriznas(escena, setos, { uT, sol, nieblaU, paleta: 'junco', ancho: 0.05 });

  const { animales, posar } = posarEspecies(escena, { sol, nieblaU, vivo, rnd });
  posar('great', [-8, -30, -60].map((z, i) => ({ p: new THREE.Vector3(i % 2 ? 2.0 : -2.0, -0.05, z), esc: 0.95, tipo: 'garza' })));
  posar('monarca', Array.from({ length: 10 }, () => ({ p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: new THREE.Vector3((rnd() > 0.5 ? 1 : -1) * (6 + rnd() * 3), 1.1, -rnd() * 80), f: rnd() * 6 })));
  posar('gaviota_v', Array.from({ length: 6 }, (_, i) => ({ p: new THREE.Vector3(), esc: 0.8, tipo: 'vuelo', aleteo: 0.18, c: new THREE.Vector3(-10 + rnd() * 20, 22 + rnd() * 10, -40 - rnd() * 20), r: 25 + rnd() * 20, v: (0.1 + rnd() * 0.08) * (i % 2 ? 1 : -1), f: rnd() * 6 })));

  const curva = new THREE.CatmullRomCurve3([[0, 36], [0, 22], [-4.3, 14], [-4.3, 0], [-4.3, -18], [0, -20], [4.3, -22], [4.3, -44], [0, -46], [-4.3, -48], [-4.3, -76], [0, -86]].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = curva.getLength();
  const marco = (s, lado = 0) => { const u = clamp(s / L, 0, 1); const p = curva.getPointAt(u); const t = curva.getTangentAt(u).setY(0).normalize(); const l = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize(); return { p: p.addScaledVector(l, lado), t, l }; };
  const altura = (s) => { const p = marco(s).p; return Math.abs(p.x) < 3.0 && p.z < 8 && p.z > -84 ? 0.24 : terreno(p.x, p.z) + 0.06; };
  // bosquetes de arbolitos pegados alrededor (Tierra Bomba tiene matorral y bosque seco denso)
  crearArboles(escena, tl, bosquetes(rnd, { suelo: terreno, camino: curva.getSpacedPoints(240), grupos: 130, cz: -30, rMin: 44, rMax: 130, escalaX: 1.2, libre: (x, z) => !(Math.abs(x) < 38 && z > -96 && z < 20) }), rnd, [0.9, 0.95, 0.88]);
  return { curva, L, marco, altura, actualizar: (t) => { agua.material.uniforms.time.value = t * 0.3; animarEspecies(animales, t); } };
}
