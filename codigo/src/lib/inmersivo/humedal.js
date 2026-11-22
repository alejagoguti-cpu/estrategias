import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { BASE, PAS, conViento, pbr, hacerMarco, clamp, suave, crearBriznas, cargarPasto, crearArboles, posarEspecies, animarEspecies, cinta, baranda, crearBancoSolar } from './comun.js';

// Humedal de fitofiltración en la meseta de Tierra Bomba: lagunas de retención excavadas en la pradera,
// orillas de juncos (Cyperus), lirio acuático (Pontederia crassipes) flotando, sendero rojo con un puente
// de madera en arco sobre la laguna central, arboledas de bosque seco, faroles y el banco solar.
const NIVEL = -0.42; // lámina de agua
const LAGUNAS = [
  { c: [6, -45], r: [22, 15], rot: 0.3, prof: 1.4 },
  { c: [-24, -118], r: [17, 12], rot: -0.4, prof: 1.2 },
  { c: [24, -190], r: [13, 10], rot: 0.8, prof: 1.1 },
];
const normaLaguna = (x, z, L) => { const dx = x - L.c[0]; const dz = z - L.c[1]; const c = Math.cos(-L.rot); const s = Math.sin(-L.rot); const u = dx * c - dz * s; const v = dx * s + dz * c; return Math.hypot(u / L.r[0], v / L.r[1]); };
const dLaguna = (x, z) => Math.min(...LAGUNAS.map((L) => normaLaguna(x, z, L)));
export const terreno = (x, z) => {
  let h = 0.38 + 0.22 * Math.sin(x * 0.05) * Math.cos(z * 0.04) + 0.12 * Math.sin(x * 0.13 + z * 0.07) + 0.02 * Math.sin(x * 0.7) * Math.sin(z * 0.6);
  const lejos = Math.hypot(x, z + 100); h += Math.max(0, lejos - 210) / 260 * 7;
  for (const L of LAGUNAS) { const d = normaLaguna(x, z, L); if (d < 1.3) h -= L.prof * (1 - suave((d - 0.7) / 0.6)); }
  return h;
};

export default function escenaHumedal(ctx) {
  const { escena, tl, sol, nieblaU, uT, vivo, rnd } = ctx;
  // lámina de agua de las lagunas (el terreno la tapa fuera de ellas)
  const tAgua = tl.load(`${BASE}datos/water_normals_fine.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
  const agua = new Water(new THREE.PlaneGeometry(900, 900), { textureWidth: 1024, textureHeight: 1024, waterNormals: tAgua, sunDirection: sol.clone(), sunColor: 0xfff2dc, waterColor: 0x26362a, distortionScale: 0.45, fog: true });
  agua.rotation.x = -Math.PI / 2; agua.position.set(0, NIVEL, -100); agua.material.uniforms.size.value = 9; escena.add(agua); ctx.agua = agua;

  // sendero
  const curva = new THREE.CatmullRomCurve3([[0, 26], [2, 6], [18, -14], [34, -38], [36, -62], [24, -84], [2, -100], [-24, -118], [-48, -136], [-50, -160], [-30, -178], [-4, -196], [6, -222], [-6, -250]].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = curva.getLength(); const marco = hacerMarco(curva);
  // máscara del sendero (celdas de 1 m) para rebajar el terreno bajo el camino
  const mascara = new Uint8Array(800 * 800); const celda = (x, z) => (Math.floor(z + 500) * 800 + Math.floor(x + 400));
  for (let s = 0; s <= L; s += 0.4) for (let lado = -1.9; lado <= 1.9; lado += 0.4) { const p = marco(s, lado).p; const k = celda(p.x, p.z); if (k >= 0 && k < mascara.length) mascara[k] = 1; }
  // pradera con textura de césped escaneada; orillas más oscuras y húmedas
  {
    const g = new THREE.PlaneGeometry(760, 760, 380, 380); g.rotateX(-Math.PI / 2); g.translate(0, 0, -100);
    const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i); const z = pa.getZ(i); pa.setY(i, terreno(x, z) - (mascara[celda(x, z)] ? 0.18 : 0)); uv.setXY(i, x / 4, z / 4);
      const d = dLaguna(x, z); const hum = 1 - suave((d - 0.95) / 0.35); const v = 0.9 + 0.12 * Math.sin(x * 0.17 + z * 0.11);
      col.set([0.72 * v * (1 - 0.45 * hum), 0.98 * v * (1 - 0.35 * hum), 0.52 * v * (1 - 0.4 * hum)], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pbr(tl, 'cesped', [1, 1], { vertexColors: true })); m.receiveShadow = true; escena.add(m);
  }

  const suelo = (s) => { let h = -9; for (const lado of [-1.45, -0.7, 0, 0.7, 1.45]) { const p = marco(s, lado).p; h = Math.max(h, terreno(p.x, p.z)); } return h + 0.07; };
  let s0 = null; let s1 = null; for (let s = 0; s < L; s += 0.5) { const p = marco(s).p; if (dLaguna(p.x, p.z) < 1.02) { if (s0 == null) s0 = s; s1 = s; } }
  const pA = s0 != null ? s0 - 7 : -1; const pB = s1 != null ? s1 + 7 : -1;
  const altura = (s) => {
    const h = suelo(s); if (s0 == null || s < pA || s > pB) return h;
    const u = (s - pA) / (pB - pA); const ext = suelo(pA) + (suelo(pB) - suelo(pA)) * u; return Math.max(h, ext + (NIVEL + 1.6 - ext) * Math.pow(Math.sin(Math.PI * u), 0.7));
  };
  const matSendero = pbr(tl, 'sendero', [1, 1], { color: 0xf2d8cc });
  const matMadera = pbr(tl, 'madera', [1, 1]);
  const matMaderaOsc = pbr(tl, 'madera', [0.5, 3], { color: 0x8c735f });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9cfd3, metalness: 0.92, roughness: 0.28 });
  const anchoS = 2.6;
  if (s0 != null) {
    escena.add(cinta(marco, 0, pA, { ancho: anchoS, altura, mat: matSendero, uv: 2.5, espesor: 0.08 }));
    escena.add(cinta(marco, pB, L, { ancho: anchoS, altura, mat: matSendero, uv: 2.5, espesor: 0.08 }));
    // puente de madera en arco
    escena.add(cinta(marco, pA, pB, { ancho: 2.4, altura, mat: matMadera, uv: 2, espesor: 0.1, paso: 0.3 }));
    escena.add(baranda(marco, pA + 0.5, pB - 0.5, { ancho: 2.4, altura, metal, paso: 1.6 }));
    for (const lado of [-1, 1]) { const pts = []; for (let s = pA; s <= pB; s += 0.5) { const f = marco(s, lado * 1.05); pts.push(f.p.setY(altura(s) - 0.22)); } escena.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.11, 10), matMaderaOsc)); }
    const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.14, 3, 16), matMaderaOsc, 12); const o = new THREE.Object3D(); let k = 0;
    for (let i = 0; i < 6; i++) { const s = pA + 3 + ((pB - pA - 6) * i) / 5; for (const lado of [-1, 1]) { const f = marco(s, lado * 1.05); o.position.set(f.p.x, altura(s) - 1.7, f.p.z); o.updateMatrix(); pil.setMatrixAt(k++, o.matrix); } }
    pil.castShadow = true; escena.add(pil);
  } else escena.add(cinta(marco, 0, L, { ancho: anchoS, altura, mat: matSendero, uv: 2.5, espesor: 0.08 }));

  // pradera: briznas densas junto al sendero, pasto escaneado y flores
  const prado = []; const flores = [];
  for (let s = 0; s < L; s += 0.45) for (let k = 0; k < 9; k++) {
    const lado = (rnd() > 0.5 ? 1 : -1) * (anchoS / 2 + 0.25 + Math.pow(rnd(), 1.25) * 22); const f = marco(s, lado);
    const y = terreno(f.p.x, f.p.z); if (y < NIVEL + 0.15 || (s > pA && s < pB && Math.abs(lado) < 4)) continue;
    const den = Math.abs(lado) < 6 ? 34 : 16;
    for (let b = 0; b < den; b++) { const x = f.p.x + (rnd() - 0.5) * 1.2; const z = f.p.z + (rnd() - 0.5) * 1.2; prado.push({ x, y: terreno(x, z), z, h: 0.3 + rnd() * 0.55 }); }
    if (rnd() < 0.18) flores.push({ x: f.p.x + (rnd() - 0.5), y: y + 0.32 + rnd() * 0.2, z: f.p.z + (rnd() - 0.5), c: rnd() });
  }
  crearBriznas(escena, prado, { uT, sol, nieblaU, paleta: 'pradera', ancho: 0.01 });
  // juncos (Cyperus) en el anillo de orilla de cada laguna
  const juncos = [];
  LAGUNAS.forEach((Lg) => { const per = Math.PI * (Lg.r[0] + Lg.r[1]); const n = Math.round(per * 110); for (let i = 0; i < n; i++) { const a = rnd() * 6.283; const d = 0.96 + rnd() * 0.24; const c = Math.cos(Lg.rot); const sn = Math.sin(Lg.rot); const u = Math.cos(a) * Lg.r[0] * d; const v = Math.sin(a) * Lg.r[1] * d; const x = Lg.c[0] + u * c - v * sn; const z = Lg.c[1] + u * sn + v * c; const p = marco(0).p; if (Math.hypot(x - p.x, z - p.z) < 0) continue; juncos.push({ x, y: Math.max(terreno(x, z), NIVEL), z, h: 0.9 + rnd() * 1.3 * (1.2 - Math.abs(d - 1.06) * 3) }); } });
  // aclarar juncos donde pasa el puente
  const juncosLibres = juncos.filter((j) => { if (s0 == null) return true; for (let s = pA; s <= pB; s += 1) { const p = marco(s).p; if (Math.hypot(j.x - p.x, j.z - p.z) < 2.2) return false; } return true; });
  crearBriznas(escena, juncosLibres, { uT, sol, nieblaU, paleta: 'junco', ancho: 0.016 });
  cargarPasto(escena, Array.from({ length: 1600 }, () => { const s = rnd() * L; const lado = (rnd() > 0.5 ? 1 : -1) * (anchoS / 2 + 0.6 + rnd() * 14); const f = marco(s, lado); return { x: f.p.x, y: terreno(f.p.x, f.p.z), z: f.p.z, k: 0.45 }; }).filter((l) => l.y > NIVEL + 0.2), { uT, vivo, rnd });
  {
    const g = new THREE.SphereGeometry(1, 10, 8); const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.7 }), flores.length); const o = new THREE.Object3D(); const c = new THREE.Color();
    flores.forEach((fl, i) => { o.position.set(fl.x, fl.y, fl.z); o.scale.setScalar(0.035 + rnd() * 0.02); o.updateMatrix(); m.setMatrixAt(i, o.matrix); c.set(fl.c < 0.55 ? 0xf2d33a : fl.c < 0.8 ? 0xf5f2ea : 0xd77ac0); m.setColorAt(i, c); });
    escena.add(m);
  }
  // plantas acuáticas modeladas y exportadas desde Blender: papiro y juncia en la orilla, lirio acuático flotando
  {
    const enPuente = (x, z) => { if (s0 == null) return false; for (let s = pA; s <= pB; s += 1) { const p = marco(s).p; if (Math.hypot(x - p.x, z - p.z) < 2.6) return true; } return false; };
    const enOrilla = (Lg, a, d) => { const c = Math.cos(Lg.rot); const sn = Math.sin(Lg.rot); const u = Math.cos(a) * Lg.r[0] * d; const v = Math.sin(a) * Lg.r[1] * d; return [Lg.c[0] + u * c - v * sn, Lg.c[1] + u * sn + v * c]; };
    const lugares = { papiro: [], juncia: [], lirio0: [], lirio1: [], lirio2: [] };
    LAGUNAS.forEach((Lg) => {
      const per = Math.PI * (Lg.r[0] + Lg.r[1]);
      for (let i = 0, n = Math.round(per / 2.0); i < n; i++) { const a = (i / n) * 6.283 + rnd() * 0.08; const [x, z] = enOrilla(Lg, a, 0.97 + rnd() * 0.12); if (!enPuente(x, z)) lugares.papiro.push({ x, z, y: Math.max(terreno(x, z), NIVEL), k: 0.8 + rnd() * 0.45 }); }
      for (let i = 0, n = Math.round(per * 1.4); i < n; i++) { const a = rnd() * 6.283; const [x, z] = enOrilla(Lg, a, 1.0 + rnd() * 0.26); if (!enPuente(x, z)) lugares.juncia.push({ x, z, y: Math.max(terreno(x, z), NIVEL), k: 0.8 + rnd() * 0.5 }); }
      for (let cl = 0; cl < 16; cl++) { const [cx, cz] = enOrilla(Lg, rnd() * 6.283, 0.2 + rnd() * 0.6); const nH = 8 + Math.floor(rnd() * 16); for (let i = 0; i < nH; i++) { const x = cx + (rnd() - 0.5) * 3.4; const z = cz + (rnd() - 0.5) * 3.4; if (dLaguna(x, z) > 0.85 || enPuente(x, z)) continue; lugares[`lirio${Math.floor(rnd() * 3)}`].push({ x, z, y: NIVEL - 0.03, k: 1.4 + rnd() * 0.8 }); } }
    });
    const cargador = new GLTFLoader(); const o = new THREE.Object3D();
    Object.entries(lugares).forEach(([nombre, lista]) => {
      if (!lista.length) return;
      cargador.load(`${PAS}${nombre}.glb`, (gltf) => {
        if (!vivo()) return; let malla = null; gltf.scene.traverse((m) => { if (m.isMesh && !malla) malla = m; }); if (!malla) return;
        const geo = malla.geometry; if (geo.attributes.color_1) geo.setAttribute('color', geo.attributes.color_1);
        const mat = malla.material.clone(); mat.side = THREE.DoubleSide; mat.vertexColors = true; if (nombre !== 'papiro' && nombre !== 'juncia') { mat.roughness = 0.25; } else conViento(mat, uT, 0.05);
        const im = new THREE.InstancedMesh(geo, mat, lista.length);
        lista.forEach((l, i) => { o.position.set(l.x, l.y, l.z); o.rotation.set(0, rnd() * 6.283, 0); o.scale.setScalar(l.k); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
        im.receiveShadow = true; escena.add(im);
      });
    });
  }
  // arboledas: hileras junto al sendero, bosquetes y el bosque seco de la meseta al fondo
  const lugares = [];
  for (let s = 6; s < L; s += 7 + rnd() * 4) for (const lado of [-1, 1]) { if (rnd() < 0.35) continue; const f = marco(s, lado * (5 + rnd() * 3)); const y = terreno(f.p.x, f.p.z); if (y < NIVEL + 0.3) continue; lugares.push({ x: f.p.x, y: y - 0.1, z: f.p.z, tipo: 1, h: 6.5 }); }
  for (let i = 0; i < 260; i++) { const x = (rnd() - 0.5) * 260; const z = 40 - rnd() * 320; const y = terreno(x, z); if (y < NIVEL + 0.3 || dLaguna(x, z) < 1.4) continue; let cerca = false; for (let s = 0; s < L; s += 4) { const p = marco(s).p; if (Math.hypot(p.x - x, p.z - z) < 4) { cerca = true; break; } } if (!cerca) lugares.push({ x, y: y - 0.1, z }); }
  for (let i = 0; i < 700; i++) { const a = rnd() * 6.283; const r = 170 + rnd() * 160; const x = Math.cos(a) * r; const z = -100 + Math.sin(a) * r; lugares.push({ x, y: terreno(x, z) - 0.2, z, h: 7 + rnd() * 3 }); }
  crearArboles(escena, tl, lugares, rnd, [0.9, 0.92, 0.86]);
  // faroles
  {
    const poste = new THREE.MeshStandardMaterial({ color: 0x3b4044, metalness: 0.7, roughness: 0.4 }); const n = Math.floor(L / 24);
    const gP = new THREE.CylinderGeometry(0.045, 0.06, 3.6, 16); gP.translate(0, 1.8, 0); const gC = new THREE.CylinderGeometry(0.16, 0.1, 0.28, 20); gC.translate(0, 3.7, 0);
    const ip = new THREE.InstancedMesh(gP, poste, n); const ic = new THREE.InstancedMesh(gC, poste, n); const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { const s = 12 + i * 24; const f = marco(s, (i % 2 ? 1 : -1) * (anchoS / 2 + 0.7)); o.position.set(f.p.x, terreno(f.p.x, f.p.z), f.p.z); o.updateMatrix(); ip.setMatrixAt(i, o.matrix); ic.setMatrixAt(i, o.matrix); }
    ip.castShadow = true; escena.add(ip, ic);
  }
  // banco solar frente a la primera laguna
  {
    let mejor = 0; let dm = 1e9; for (let s = 0; s < L * 0.4; s += 0.5) { const p = marco(s).p; const d = Math.hypot(p.x - LAGUNAS[0].c[0], p.z - LAGUNAS[0].c[1]); if (d < dm) { dm = d; mejor = s; } }
    const f = marco(mejor); const lado = f.l.clone().dot(new THREE.Vector3(LAGUNAS[0].c[0] - f.p.x, 0, LAGUNAS[0].c[1] - f.p.z)) > 0 ? 1 : -1;
    const pos = marco(mejor, lado * (anchoS / 2 + 1.6)).p; const banco = crearBancoSolar({ largo: 3.0 }); banco.position.set(pos.x, terreno(pos.x, pos.z) + 0.02, pos.z);
    banco.lookAt(banco.position.clone().addScaledVector(f.l, lado)); escena.add(banco);
  }

  // especies 3D: garzas en las orillas, monarcas y colibríes en la pradera
  const { animales, posar } = posarEspecies(escena, { sol, nieblaU, vivo, rnd });
  const orillaP = (Lg, a, d = 0.93) => { const c = Math.cos(Lg.rot); const sn = Math.sin(Lg.rot); const u = Math.cos(a) * Lg.r[0] * d; const v = Math.sin(a) * Lg.r[1] * d; return new THREE.Vector3(Lg.c[0] + u * c - v * sn, NIVEL - 0.02, Lg.c[1] + u * sn + v * c); };
  posar('snowy', [0.4, 2.1, 3.9, 5.2].flatMap((a, i) => [{ p: orillaP(LAGUNAS[i % 3], a), esc: 0.62, tipo: 'garza' }]));
  posar('great', [1.2, 4.4, 2.9].map((a, i) => ({ p: orillaP(LAGUNAS[(i + 1) % 3], a, 0.9), esc: 1.0, tipo: 'garza' })));
  posar('monarca', Array.from({ length: 14 }, () => { const s = rnd() * L; const f = marco(s, (rnd() > 0.5 ? 1 : -1) * (2 + rnd() * 4)); return { p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: f.p.setY(terreno(f.p.x, f.p.z) + 0.8), f: rnd() * 6 }; }));
  posar('colibri', Array.from({ length: 6 }, () => { const s = rnd() * L; const f = marco(s, (rnd() > 0.5 ? 1 : -1) * (4 + rnd() * 3)); return { p: new THREE.Vector3(), esc: 0.11, tam: 0.7, tipo: 'mariposa', aleteo: 0.6, base: f.p.setY(terreno(f.p.x, f.p.z) + 2.2), f: rnd() * 6 }; }));
  posar('gaviota_v', Array.from({ length: 6 }, (_, i) => ({ p: new THREE.Vector3(), esc: 0.8, tipo: 'vuelo', aleteo: 0.18, c: new THREE.Vector3(-20 + rnd() * 40, 14 + rnd() * 12, -40 - rnd() * 180), r: 20 + rnd() * 30, v: (0.1 + rnd() * 0.08) * (i % 2 ? 1 : -1), f: rnd() * 6 })));

  return {
    curva, L, marco, altura,
    actualizar: (t) => { agua.material.uniforms.time.value = t * 0.25; animarEspecies(animales, t); },
  };
}
