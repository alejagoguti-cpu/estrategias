import * as THREE from 'three';
import { pbr, clamp, crearBriznas, crearArboles, posarEspecies, animarEspecies, texSolar } from './comun.js';

// Colegio en la ladera del bosque: dos barras largas escalonadas, de dos pisos sobre pilotes de acero, con
// fachada de listones de madera, bandas de vidrio, balcones corridos con baranda, cubiertas flotantes de vidrio y
// paneles solares, y escaleras exteriores entre niveles. El recorrido sube del sendero a los balcones.
const PISO = 3.4;
const terreno = (x, z) => clamp((-z - 6) * 0.32, 0, 24) + 0.25 * Math.sin(x * 0.09) * Math.cos(z * 0.07);
function caja(w, h, d, mat, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
const en = (m, x, y, z) => { m.position.set(x, y, z); return m; };

export default function escenaLadera(ctx) {
  const { escena, tl, sol, nieblaU, uT, vivo, rnd } = ctx;
  const M = {
    listones: pbr(tl, 'madera', [0.25, 1.4], { color: 0xd9a978 }), madera: pbr(tl, 'madera', [1, 1], { color: 0xc8996c }),
    losa: (() => { const m = pbr(tl, 'concreto', [1, 1], { color: 0xd8d4cc }); return m; })(),
    acero: new THREE.MeshStandardMaterial({ color: 0x3a3e42, metalness: 0.8, roughness: 0.38 }), aceroClaro: new THREE.MeshStandardMaterial({ color: 0xa9b0b4, metalness: 0.85, roughness: 0.3 }),
    vidrio: new THREE.MeshPhysicalMaterial({ color: 0xcfe0e4, metalness: 0.1, roughness: 0.04, transparent: true, opacity: 0.28, envMapIntensity: 1.5, side: THREE.DoubleSide, depthWrite: false }),
    interior: new THREE.MeshStandardMaterial({ color: 0xe6dccb, roughness: 0.9 }), solar: new THREE.MeshPhysicalMaterial({ map: texSolar(), roughness: 0.12, metalness: 0.35, clearcoat: 1 }),
    techoVidrio: new THREE.MeshPhysicalMaterial({ color: 0xe4eef0, roughness: 0.1, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
  };
  // ladera con bosque y cerros con bruma al fondo
  {
    const g = new THREE.PlaneGeometry(400, 400, 200, 200); g.rotateX(-Math.PI / 2); const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); const z = pa.getZ(i); pa.setY(i, terreno(x, z)); uv.setXY(i, x / 4, z / 4); col.set([0.6, 0.85, 0.45], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pbr(tl, 'cesped', [1, 1], { vertexColors: true })); m.receiveShadow = true; escena.add(m);
    const cerro = new THREE.MeshStandardMaterial({ color: 0x5f7a66, roughness: 1, fog: true });
    [[-120, -420, 260, 120], [160, -460, 300, 150], [20, -560, 360, 190]].forEach(([x, z, r, h]) => { const c = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), cerro); c.position.set(x, 18, z); c.scale.set(r, h, r * 0.5); escena.add(c); });
  }

  function baranda(x0, x1, y, z) { // baranda de acero y vidrio a lo largo de x
    const g = new THREE.Group(); const L = x1 - x0;
    g.add(en(caja(L, 0.05, 0.06, M.aceroClaro), (x0 + x1) / 2, y + 1.05, z)); g.add(en(caja(L, 0.03, 0.03, M.aceroClaro), (x0 + x1) / 2, y + 0.1, z));
    for (let x = x0; x <= x1 + 0.01; x += 1.5) g.add(en(caja(0.04, 1.05, 0.04, M.aceroClaro), x, y + 0.53, z));
    const v = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.9), M.vidrio); v.position.set((x0 + x1) / 2, y + 0.55, z); g.add(v); return g;
  }
  function barra(zFrente, x0, x1) {
    const g = new THREE.Group(); const prof = 9; const zAtras = zFrente - prof; const yB = terreno(0, zAtras) + 0.6; const L = x1 - x0; const cx = (x0 + x1) / 2;
    for (let n = 0; n < 2; n++) {
      const y = yB + n * PISO;
      g.add(en(caja(L + 3, 0.3, prof + 2.2, M.losa, 2), cx - 1.5, y - 0.15, zAtras + (prof + 2.2) / 2));
      g.add(en(caja(L, PISO - 0.3, 0.2, M.interior, 2), cx, y + (PISO - 0.3) / 2, zAtras + 0.1));
      // banda de vidrio retranqueada con marcos
      const v = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.4, PISO - 0.4), M.vidrio); v.position.set(cx, y + (PISO - 0.3) / 2, zFrente - 0.15); g.add(v);
      for (let x = x0; x <= x1 + 0.01; x += 2.4) g.add(en(caja(0.06, PISO - 0.3, 0.08, M.acero), x, y + (PISO - 0.3) / 2, zFrente - 0.15));
      // celosías corredizas de listones de madera en algunos paños
      for (let x = x0 + 1.2; x < x1; x += 2.4) if (((x - x0) / 2.4 + n) % 3 < 1.2) { const p = new THREE.Group(); for (let k = 0; k < 14; k++) p.add(en(caja(0.07, PISO - 0.5, 0.04, M.listones, 0.8), -1.1 + k * 0.17, 0, 0)); p.position.set(x, y + (PISO - 0.3) / 2, zFrente + 0.05); g.add(p); }
      g.add(baranda(x0 - 3, x1, y, zFrente + 2.0));
    }
    // cajas cerradas de listones en los extremos
    [x0 + 3, x1 - 3].forEach((xc) => { const b = new THREE.Group(); for (let k = 0; k < 34; k++) b.add(en(caja(0.08, PISO * 2 - 0.3, 0.06, M.listones, 0.8), -2.9 + k * 0.175, 0, 0)); b.position.set(xc, yB + PISO - 0.15, zFrente + 0.12); g.add(b); g.add(en(caja(6, PISO * 2 - 0.3, prof - 0.4, M.madera, 1.5), xc, yB + PISO - 0.15, zAtras + prof / 2 - 0.1)); });
    // pilotes de acero hasta el terreno
    for (let x = x0; x <= x1 + 0.01; x += 6) [zFrente + 2, zFrente - 2, zAtras + 1].forEach((z) => { const h = yB - terreno(x, z); if (h > 0.2) g.add(en(caja(0.24, h, 0.24, M.acero), x, terreno(x, z) + h / 2, z)); });
    // cubierta flotante: vigas inclinadas, franjas alternas de paneles solares y vidrio
    const yT = yB + PISO * 2; const yA = yT + 1.5; const yF = yT + 0.5; const zA = zAtras - 0.5; const zF = zFrente + 4.2; const yR = (z) => yA + ((z - zA) / (zF - zA)) * (yF - yA);
    for (let x = x0 - 3; x <= x1 + 0.01; x += 6) { g.add(en(caja(0.2, yA - yT, 0.2, M.acero), x, yT + (yA - yT) / 2, zA + 0.4)); const vg = caja(0.16, 0.3, Math.hypot(zF - zA, yA - yF), M.acero); vg.position.set(x, (yA + yF) / 2, (zA + zF) / 2); vg.rotation.x = Math.atan2(yA - yF, zF - zA); g.add(vg); }
    const ang = Math.atan2(yA - yF, zF - zA); const largoT = Math.hypot(zF - zA, yA - yF);
    for (let x = x0 - 3; x < x1; x += 1.5) { const solar = Math.round((x - x0) / 1.5) % 2 === 0; const p = caja(1.35, 0.04, largoT, solar ? M.solar : M.techoVidrio); if (solar) p.material = [M.acero, M.acero, M.solar, M.acero, M.acero, M.acero]; p.position.set(x + 0.75, (yA + yF) / 2 + 0.2, (zA + zF) / 2); p.rotation.x = ang; g.add(p); }
    return { g, yB };
  }
  const baja = barra(-14, -24, 24); escena.add(baja.g); const alta = barra(-30, -24, 24); escena.add(alta.g);

  // escaleras exteriores
  function escalera(a, b, ancho, dir) { // a, b: Vector3 (inicio y fin del eje); dir: 'x' | 'z'
    const g = new THREE.Group(); const n = Math.max(2, Math.round((b.y - a.y) / 0.17)); const huella = new THREE.Vector3().subVectors(b, a).setY(0).length() / n;
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; const p = new THREE.Vector3().lerpVectors(a, b, t); const s = caja(dir === 'x' ? huella + 0.02 : ancho, 0.05, dir === 'x' ? ancho : huella + 0.02, M.madera, 1); s.position.set(p.x, a.y + (i + 1) * ((b.y - a.y) / n) - 0.025, p.z); g.add(s); }
    [-1, 1].forEach((sd) => { const off = dir === 'x' ? new THREE.Vector3(0, 0, sd * ancho / 2) : new THREE.Vector3(sd * ancho / 2, 0, 0); const d = new THREE.Vector3().subVectors(b, a); const lz = caja(0.06, 0.3, d.length(), M.acero); lz.position.copy(a).add(b).multiplyScalar(0.5).add(off); lz.lookAt(lz.position.clone().add(d)); g.add(lz);
      const pas = caja(0.05, 0.05, d.length(), M.aceroClaro); pas.position.copy(lz.position).add(new THREE.Vector3(0, 1.0, 0)); pas.lookAt(pas.position.clone().add(d)); g.add(pas); });
    for (let t = 0.15; t < 1; t += 0.3) { const p = new THREE.Vector3().lerpVectors(a, b, t); const h = p.y - terreno(p.x, p.z); if (h > 0.3) g.add(en(caja(0.16, h, 0.16, M.acero), p.x, p.y - h / 2, p.z)); }
    return g;
  }
  const y1 = baja.yB; const y2 = alta.yB;
  escena.add(escalera(new THREE.Vector3(5, terreno(5, -10.4), -10.4), new THREE.Vector3(15.5, y1, -10.4), 1.6, 'x'));
  escena.add(en(caja(2.2, 0.3, 3.4, M.losa), 16.6, y1 - 0.15, -11.0));
  escena.add(escalera(new THREE.Vector3(-28.6, y1, -13.6), new THREE.Vector3(-28.6, y2, -27.4), 1.8, 'z'));
  escena.add(en(caja(3.2, 0.3, 2.6, M.losa), -28.2, y1 - 0.15, -12.9));
  escena.add(en(caja(3.4, 0.3, 2.6, M.losa), -28.4, y2 - 0.15, -28.7));
  // sendero de grava desde abajo
  { const gr = pbr(tl, 'grava', [1, 1], { color: 0xe8e2d6 }); [[0, 8, 2.4, 14], [2.6, -6, 2.4, 10]].forEach(([x, z, w, d]) => { const p = caja(w, 0.08, d, gr, 1.5); p.position.set(x, terreno(x, z) + 0.04, z); escena.add(p); }); }

  const pasto = []; for (let i = 0; i < 90000; i++) { const x = -40 + rnd() * 80; const z = 25 - rnd() * 60; if (Math.abs(x - 1.3) < 2.2 && z > -11) continue; pasto.push({ x, y: terreno(x, z), z, h: 0.3 + rnd() * 0.6 }); }
  crearBriznas(escena, pasto, { uT, sol, nieblaU, paleta: 'pradera', ancho: 0.011 });
  const { animales, posar } = posarEspecies(escena, { sol, nieblaU, vivo, rnd });
  posar('gaviota_v', Array.from({ length: 6 }, (_, i) => ({ p: new THREE.Vector3(), esc: 0.8, tipo: 'vuelo', aleteo: 0.18, c: new THREE.Vector3(-10 + rnd() * 20, 28 + rnd() * 10, -30 - rnd() * 30), r: 25 + rnd() * 20, v: (0.1 + rnd() * 0.08) * (i % 2 ? 1 : -1), f: rnd() * 6 })));
  posar('monarca', Array.from({ length: 8 }, () => ({ p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: new THREE.Vector3(-20 + rnd() * 40, y1 + 1.2, -11 + rnd() * 2), f: rnd() * 6 })));

  // recorrido: sube por el sendero, toma la escalera al balcón bajo, lo recorre, sube al balcón alto y lo recorre
  const P = [[0, 0.1, 16], [0, 0.1, 6], [1.6, terreno(2, -6) + 0.1, -6.5], [4.2, terreno(5, -10.4) + 0.1, -10.4], [10.2, (terreno(5, -10.4) + y1) / 2, -10.4], [15.5, y1, -10.4], [16.6, y1, -12.4], [12, y1, -12.6], [0, y1, -12.6], [-14, y1, -12.6], [-26.6, y1, -12.8], [-28.6, y1, -13.6], [-28.6, (y1 + y2) / 2, -20.5], [-28.6, y2, -27.4], [-26.6, y2, -28.6], [-12, y2, -28.6], [6, y2, -28.6], [22, y2, -28.6]];
  const curva = new THREE.CatmullRomCurve3(P.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'catmullrom', 0.1);
  const L = curva.getLength();
  const muestras = curva.getSpacedPoints(400);
  const libre = (x, z) => !muestras.some((q) => Math.hypot(q.x - x, q.z - z) < 3.2) && !(x > -31 && x < 26 && z < -11 && z > -41);
  // bosque denso en la ladera, bajo y entre las barras
  const arb = [];
  for (let i = 0; i < 1400; i++) { const x = -90 + rnd() * 180; const z = 30 - rnd() * 160; if (!libre(x, z)) continue; arb.push({ x, y: terreno(x, z) - 0.3, z, h: 7 + rnd() * 6 }); }
  crearArboles(escena, tl, arb, rnd, [0.82, 0.9, 0.8]);

  const marco = (s, lado = 0) => { const u = clamp(s / L, 0, 1); const p = curva.getPointAt(u); const t = curva.getTangentAt(u).setY(0).normalize(); const l = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize(); return { p: p.addScaledVector(l, lado), t, l }; };
  const altura = (s) => curva.getPointAt(clamp(s / L, 0, 1)).y;
  return { curva, L, marco, altura, actualizar: (t) => animarEspecies(animales, t) };
}
