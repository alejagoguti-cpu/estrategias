import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { BASE, pbr, clamp, crearBriznas, crearArboles, posarEspecies, animarEspecies } from './comun.js';

// Conjunto de vivienda en la meseta: dos hileras de bloques blancos de cuatro pisos, escalonados, con losas
// salientes, balcones con baranda de vidrio, quiebrasoles verticales y terrazas en cubierta, alrededor de un eje
// central de agua (canal de retención) y jardín con árboles; bosque alrededor. Se recorre por el eje.
const H = 3.2; const PISOS = 4;
const terreno = (x, z) => 0.04 * Math.sin(x * 0.1) * Math.cos(z * 0.08) + Math.max(0, Math.hypot(x, z + 30) - 140) / 200 * 6;
function caja(w, h, d, mat, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
const en = (m, x, y, z) => { m.position.set(x, y, z); return m; };

export default function escenaConjunto(ctx) {
  const { escena, tl, sol, nieblaU, uT, vivo, rnd } = ctx;
  const blanco = pbr(tl, 'revoque', [1, 1], { color: 0xf4f1ea }); blanco.map = null;
  const M = {
    blanco, gris: (() => { const m = pbr(tl, 'revoque', [1, 1], { color: 0xb8b4ac }); m.map = null; return m; })(),
    vidrioOsc: new THREE.MeshStandardMaterial({ color: 0x1c2a30, metalness: 0.6, roughness: 0.07, envMapIntensity: 1.5 }),
    vidrio: new THREE.MeshPhysicalMaterial({ color: 0xd8e8ec, roughness: 0.04, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }),
    acero: new THREE.MeshStandardMaterial({ color: 0x3a3e42, metalness: 0.8, roughness: 0.35 }), madera: pbr(tl, 'madera', [1, 1], { color: 0xc8996c }),
    piedra: pbr(tl, 'concreto', [1, 1], { color: 0xeae4d8 }), borde: pbr(tl, 'roca', [1, 1], { color: 0xd8d2c4 }),
  };
  {
    const g = new THREE.PlaneGeometry(500, 500, 200, 200); g.rotateX(-Math.PI / 2); const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); const z = pa.getZ(i) - 30; pa.setZ(i, z); pa.setY(i, terreno(x, z)); uv.setXY(i, x / 4, z / 4); col.set([0.66, 0.95, 0.5], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pbr(tl, 'cesped', [1, 1], { vertexColors: true })); m.receiveShadow = true; escena.add(m);
  }
  // eje central: canal de agua con borde de piedra, andenes y jardín
  const tAgua = tl.load(`${BASE}datos/water_normals_fine.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
  const agua = new Water(new THREE.PlaneGeometry(5.6, 92), { textureWidth: 512, textureHeight: 512, waterNormals: tAgua, sunDirection: sol.clone(), sunColor: 0xfff2dc, waterColor: 0x2a6f78, distortionScale: 0.6, fog: true });
  agua.rotation.x = -Math.PI / 2; agua.position.set(0, 0.12, -38); agua.material.uniforms.size.value = 6; escena.add(agua); ctx.agua = agua;
  [-3.1, 3.1].forEach((x) => escena.add(en(caja(0.6, 0.35, 93, M.borde, 1.2), x, 0.17, -38)));
  [-1, 1].forEach((s) => escena.add(en(caja(2.2, 0.06, 96, M.piedra, 2), s * 5.0, 0.03, -38)));
  [-46, -20, 6].forEach((z) => escena.add(en(caja(1.6, 0.08, 5.6, M.madera, 1.5), 0, 0.42, z))); // pasos de madera sobre el canal

  // bloque blanco de 4 pisos (frente hacia el eje: lado = -1 si el eje queda a la izquierda)
  function bloque(cx, cz, w, d, lado) {
    const g = new THREE.Group(); const frente = cx - lado * (w / 2);
    for (let n = 0; n < PISOS; n++) {
      const y = n * H;
      g.add(en(caja(w + 1.6, 0.32, d + 0.8, M.blanco, 2), cx - lado * 0.6, y + H - 0.16, cz));
      g.add(en(caja(w - 1.2, H - 0.32, d - 1.2, M.vidrioOsc, 2), cx, y + (H - 0.32) / 2, cz));
      for (let z = cz - d / 2 + 1.2; z <= cz + d / 2 - 1.2; z += 2.6) [frente + lado * 0.2, cx + lado * (w / 2 - 0.6)].forEach((x) => g.add(en(caja(0.22, H - 0.32, 0.5, M.blanco, 1.5), x, y + (H - 0.32) / 2, z)));
      if (n > 0) { const rail = new THREE.Mesh(new THREE.PlaneGeometry(d + 0.6, 1.0), M.vidrio); rail.rotation.y = Math.PI / 2; rail.position.set(frente - lado * 1.35, y + 0.5, cz); g.add(rail); g.add(en(caja(0.05, 0.05, d + 0.6, M.acero), frente - lado * 1.35, y + 1.0, cz)); }
      [cz - d / 2 + 0.3, cz + d / 2 - 0.3].forEach((z) => g.add(en(caja(w - 0.8, H - 0.32, 0.4, M.blanco, 2), cx, y + (H - 0.32) / 2, z)));
    }
    g.add(en(caja(w * 0.45, 2.4, d * 0.4, M.blanco, 2), cx + lado * w * 0.15, PISOS * H + 1.2, cz));
    for (let k = 0; k < 5; k++) g.add(en(caja(w * 0.5, 0.1, 0.25, M.madera, 1), cx - lado * w * 0.2, PISOS * H + 2.4, cz - 2 + k)); // pérgola en la terraza
    g.add(en(caja(w + 1.6, 0.5, d + 0.8, M.blanco, 2), cx - lado * 0.6, PISOS * H + 0.25, cz));
    // patio de entrada con piscina corta y deck
    g.add(en(caja(4, 0.06, d - 2, M.madera, 1.5), frente - lado * 3.3, 0.03, cz));
    return g;
  }
  const bloques = [];
  [-1, 1].forEach((s) => [0, 1, 2, 3].forEach((i) => { const w = 13; const d = 18; const cz = 2 - i * 22; const cx = s * (12.5 + w / 2 + (i % 2) * 1.6); bloques.push([cx, cz, w, d]); escena.add(bloque(cx, cz, w, d, s)); }));

  // árboles del eje (palmeras/frutales de porte bajo) y bosque alrededor
  const arb = [];
  for (let z = 10; z > -86; z -= 7) [-1, 1].forEach((s) => arb.push({ x: s * (7.6 + rnd() * 1.2), y: 0, z: z + rnd() * 2, h: 5 + rnd() * 2, tipo: 0 }));
  for (let i = 0; i < 1300; i++) { const a = rnd() * 6.283; const r = 40 + Math.pow(rnd(), 0.7) * 200; const x = Math.cos(a) * r * 1.2; const z = -30 + Math.sin(a) * r; if (Math.abs(x) < 34 && z > -92 && z < 16) continue; arb.push({ x, y: terreno(x, z) - 0.3, z, h: 7 + rnd() * 6 }); }
  crearArboles(escena, tl, arb, rnd, [0.84, 0.92, 0.82]);
  const pasto = []; for (let i = 0; i < 100000; i++) { const x = -34 + rnd() * 68; const z = 18 - rnd() * 112; if (Math.abs(x) < 6.2) continue; if (bloques.some(([cx, cz, w, d]) => Math.abs(x - cx) < w / 2 + 1.2 && Math.abs(z - cz) < d / 2 + 0.6)) continue; pasto.push({ x, y: terreno(x, z), z, h: 0.12 + rnd() * 0.2 }); }
  crearBriznas(escena, pasto, { uT, sol, nieblaU, paleta: 'pradera', ancho: 0.01 });
  const { animales, posar } = posarEspecies(escena, { sol, nieblaU, vivo, rnd });
  posar('great', [-8, -30, -60].map((z, i) => ({ p: new THREE.Vector3(i % 2 ? 2.4 : -2.4, 0.12, z), esc: 0.95, tipo: 'garza' })));
  posar('monarca', Array.from({ length: 10 }, () => ({ p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: new THREE.Vector3((rnd() > 0.5 ? 1 : -1) * (6 + rnd() * 3), 1.1, -rnd() * 80), f: rnd() * 6 })));
  posar('gaviota_v', Array.from({ length: 6 }, (_, i) => ({ p: new THREE.Vector3(), esc: 0.8, tipo: 'vuelo', aleteo: 0.18, c: new THREE.Vector3(-10 + rnd() * 20, 22 + rnd() * 10, -40 - rnd() * 20), r: 25 + rnd() * 20, v: (0.1 + rnd() * 0.08) * (i % 2 ? 1 : -1), f: rnd() * 6 })));

  const curva = new THREE.CatmullRomCurve3([[0, 34], [0, 22], [-4.6, 14], [-5, 0], [-5, -20], [0, -20], [5, -22], [5, -46], [0, -46], [-5, -48], [-5, -76], [0, -84]].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = curva.getLength();
  const marco = (s, lado = 0) => { const u = clamp(s / L, 0, 1); const p = curva.getPointAt(u); const t = curva.getTangentAt(u).setY(0).normalize(); const l = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize(); return { p: p.addScaledVector(l, lado), t, l }; };
  const altura = (s) => { const p = marco(s).p; return Math.abs(p.x) < 3.4 && p.z < 8 && p.z > -84 ? 0.46 : terreno(p.x, p.z) + 0.06; };
  return { curva, L, marco, altura, actualizar: (t) => { agua.material.uniforms.time.value = t * 0.3; animarEspecies(animales, t); } };
}
