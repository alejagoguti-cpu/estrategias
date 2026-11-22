import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { BASE, pbr, hacerMarco, clamp, crearBriznas, cargarPasto, crearArboles, posarEspecies, animarEspecies, cinta, baranda, crearBancoSolar } from './comun.js';

// Marisma intermareal de Tierra Bomba con la pasarela palafítica elevada; al final, un mirador sobre la
// bahía con el banco solar ondulante frente al perfil de Bocagrande (Cartagena).
const ALTO = 1.25; // tablero sobre la pleamar
const ANCHO = 2.4;
const orilla = (z) => 30 + 7 * Math.sin(z / 46) + 3 * Math.sin(z / 13);
const alturaTierra = (x, z) => {
  const d = x - orilla(z); const ruido = Math.sin(x * 0.21 + z * 0.13) * 0.25 + Math.sin(x * 0.05 - z * 0.07) * 0.9;
  if (d < -4) return -0.35; if (d < 4) return -0.35 + (d + 4) * 0.33; if (d < 9) return 2.3 + (d - 4) * 0.08;
  return 2.3 + Math.min(1, (d - 4) / 60) * 9 + ruido * clamp((d - 4) / 30, 0, 1);
};

function texFachada(r) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = r() > 0.5 ? '#e9ecee' : '#cfd8de'; x.fillRect(0, 0, 64, 256);
  for (let j = 0; j < 256; j += 8) { x.fillStyle = `rgba(70,95,120,${0.25 + r() * 0.25})`; x.fillRect(0, j + 3, 64, 3); }
  for (let i = 0; i < 64; i += 16) { x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(i, 0, 2, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export default function escenaMarisma(ctx) {
  const { escena, tl, sol, nieblaU, uT, vivo, rnd } = ctx;
  // agua de la bahía con reflejo del cielo
  const tAgua = tl.load(`${BASE}datos/water_normals_fine.jpg`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
  const agua = new Water(new THREE.PlaneGeometry(9000, 9000), { textureWidth: 1024, textureHeight: 1024, waterNormals: tAgua, sunDirection: sol.clone(), sunColor: 0xfff2dc, waterColor: 0x3f7076, distortionScale: 1.2, fog: true });
  agua.rotation.x = -Math.PI / 2; agua.material.uniforms.size.value = 4.5; escena.add(agua); ctx.agua = agua;

  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 30), new THREE.Vector3(0, 0, 0), new THREE.Vector3(-5, 0, -38), new THREE.Vector3(-2, 0, -78),
    new THREE.Vector3(8, 0, -116), new THREE.Vector3(12, 0, -156), new THREE.Vector3(5, 0, -196), new THREE.Vector3(-8, 0, -232),
    new THREE.Vector3(-12, 0, -270), new THREE.Vector3(-14, 0, -286),
  ], false, 'centripetal');
  const L = curva.getLength(); const marco = hacerMarco(curva);

  const matMadera = pbr(tl, 'madera', [1, 1]);
  const matMaderaOsc = pbr(tl, 'madera', [0.5, 3], { color: 0x9a8270 });
  const matLodo = pbr(tl, 'lodo', [1, 1], { color: 0xb8ad94 });
  const matRoca = pbr(tl, 'roca', [1, 1]);
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9cfd3, metalness: 0.92, roughness: 0.28 });

  // terreno: orilla, talud y meseta
  {
    const g = new THREE.PlaneGeometry(520, 1300, 240, 460); g.rotateX(-Math.PI / 2); g.translate(180, 0, -250);
    const pa = g.attributes.position; const uv = g.attributes.uv; const col = new Float32Array(pa.count * 3); const cc = new THREE.Color();
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i); const z = pa.getZ(i); pa.setY(i, alturaTierra(x, z)); uv.setXY(i, x / 6, z / 6);
      const d = x - orilla(z); if (d < 5) cc.setRGB(0.95, 0.93, 0.9); else cc.setRGB(0.55 + 0.1 * Math.sin(x * 0.3 + z * 0.2), 0.62 + 0.08 * Math.sin(x * 0.11), 0.38);
      col.set([cc.r, cc.g, cc.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pbr(tl, 'lodo', [1, 1], { vertexColors: true })); m.receiveShadow = true; escena.add(m);
  }
  // costas lejanas con bruma
  {
    const mat = new THREE.MeshStandardMaterial({ color: 0x6f8695, roughness: 1, fog: true });
    [[2300, -2800, 1000, 60], [-4200, -900, 1400, 30], [3600, -900, 1200, 40]].forEach(([x, z, r, h]) => {
      const g = new THREE.SphereGeometry(1, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2); const pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) { const k = 1 + 0.12 * Math.sin(pa.getX(i) * 9) * Math.cos(pa.getZ(i) * 7); pa.setY(i, pa.getY(i) * k); }
      g.computeVertexNormals(); const mm = new THREE.Mesh(g, mat); mm.position.set(x, -2, z); mm.scale.set(r, h, r * 0.3); escena.add(mm);
    });
  }
  // perfil de Bocagrande (Cartagena) al otro lado de la bahía, en la dirección del mirador
  {
    const fin = marco(L); const dir = fin.t.clone(); const lat = fin.l.clone(); const centro = fin.p.clone().addScaledVector(dir, 4300);
    const neblina = new THREE.Color(0xb9cfdf); const texs = [texFachada(rnd), texFachada(rnd), texFachada(rnd)];
    const franja = new THREE.Mesh(new THREE.BoxGeometry(5200, 14, 260), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3c5240).lerp(neblina, 0.3), fog: false }));
    franja.position.copy(centro).setY(3); franja.lookAt(centro.clone().add(dir)); escena.add(franja);
    for (let i = 0; i < 170; i++) {
      const off = (rnd() - 0.5) * 2 * 2300 * Math.pow(rnd(), 0.35) * (rnd() > 0.5 ? 1 : -1); const prof = (rnd() - 0.5) * 220;
      const denso = Math.exp(-((off / 1400) ** 2)); const h = 30 + rnd() * (60 + 150 * denso) * (rnd() > 0.85 ? 1.5 : 1); const w = 22 + rnd() * 26;
      const t = texs[i % 3].clone(); t.repeat.set(1, h / 40); t.needsUpdate = true;
      const col = new THREE.Color().setHSL(0.58, 0.05 + rnd() * 0.05, 0.86 + rnd() * 0.12).lerp(neblina, 0.18);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * (0.7 + rnd() * 0.6)), new THREE.MeshBasicMaterial({ map: t, color: col, fog: false }));
      b.position.copy(centro).addScaledVector(lat, off).addScaledVector(dir, prof); b.position.y = h / 2 + 4; b.lookAt(b.position.clone().add(dir)); escena.add(b);
    }
  }

  // enrocado permeable
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
  // árboles reales en el talud y la meseta
  crearArboles(escena, tl, Array.from({ length: 640 }, () => { const z = 60 - rnd() * 600; const d = 6 + Math.pow(rnd(), 1.5) * 170; const x = orilla(z) + d; return { x, y: alturaTierra(x, z) - 0.2, z }; }), rnd);

  // marisma: islotes de lodo y pasto denso con viento
  const matas = [];
  for (let s = -20; s < L + 30; s += 1.9) for (let k = 0; k < 4; k++) {
    const lado = (rnd() > 0.5 ? 1 : -1) * (2.4 + Math.pow(rnd(), 1.4) * 24); const f = marco(clamp(s, 0, L), lado);
    if (f.p.x > orilla(f.p.z) - 5) continue; if (s > L - 14 && Math.abs(lado) < 7) continue;
    matas.push({ x: f.p.x + (rnd() - 0.5) * 3, z: f.p.z + (rnd() - 0.5) * 3, rx: 1.3 + rnd() * 3.4, rz: 1.1 + rnd() * 2.6, a: rnd() * 3, cerca: Math.abs(lado) < 14 });
  }
  for (let i = 0; i < 140; i++) matas.push({ x: -36 - rnd() * 110, z: 30 - rnd() * 340, rx: 2 + rnd() * 5, rz: 1.5 + rnd() * 3, a: rnd() * 3, cerca: false });
  {
    const gl = new THREE.CircleGeometry(1, 40); gl.rotateX(-Math.PI / 2); const pl = gl.attributes.position; const uvl = gl.attributes.uv;
    for (let i = 1; i < pl.count; i++) { const a = Math.atan2(pl.getZ(i), pl.getX(i)); const k = 0.82 + 0.18 * Math.sin(a * 3 + i) + 0.06 * Math.sin(a * 11); pl.setX(i, pl.getX(i) * k); pl.setZ(i, pl.getZ(i) * k); pl.setY(i, -0.05); }
    for (let i = 0; i < pl.count; i++) uvl.setXY(i, pl.getX(i) * 0.8, pl.getZ(i) * 0.8);
    const lodo = new THREE.InstancedMesh(gl, matLodo, matas.length); const o = new THREE.Object3D();
    matas.forEach((m, i) => { o.position.set(m.x, 0.05, m.z); o.rotation.set(0, m.a, 0); o.scale.set(m.rx * 1.2, 1, m.rz * 1.2); o.updateMatrix(); lodo.setMatrixAt(i, o.matrix); });
    lodo.receiveShadow = true; escena.add(lodo);
    const pts = [];
    matas.forEach((m) => { const nb = Math.round(m.rx * m.rz * (m.cerca ? 95 : 40)); const ca = Math.cos(m.a); const sa = Math.sin(m.a); for (let b = 0; b < nb; b++) { const rr = Math.sqrt(rnd()); const a = rnd() * 6.283; const lx = Math.cos(a) * rr * m.rx; const lz = Math.sin(a) * rr * m.rz; pts.push({ x: m.x + lx * ca - lz * sa, y: 0.02, z: m.z + lx * sa + lz * ca, h: 0.45 + (1 - rr * 0.7) * (0.55 + rnd() * 0.75) }); } });
    crearBriznas(escena, pts, { uT, sol, nieblaU, paleta: 'marisma' });
  }
  cargarPasto(escena, Array.from({ length: 2200 }, () => { const z = 40 - rnd() * 540; const x = orilla(z) + 4.5 + rnd() * 40; return { x, y: alturaTierra(x, z) - 0.05, z }; }), { uT, vivo, rnd });

  // pasarela palafítica: tablero escaneado, vigas, pilotes y baranda de acero
  function pasarela(cv0, ancho, conBaranda = true) {
    const mc = hacerMarco(cv0); const Lc = cv0.getLength(); const g = new THREE.Group(); const alt = () => ALTO;
    g.add(cinta(mc, 0, Lc, { ancho, altura: alt, mat: matMadera, uv: 2 }));
    const m4 = new THREE.Matrix4(); const up = new THREE.Vector3(0, 1, 0);
    const nv = Math.floor(Lc); const viga = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.22, 1.02), matMaderaOsc, nv * 2);
    for (let i = 0; i < nv; i++) for (const lado of [-1, 1]) { const f = mc(i + 0.5, lado * (ancho / 2 - 0.15)); f.p.y = ALTO - 0.17; m4.makeBasis(f.l, up, f.t); m4.setPosition(f.p); viga.setMatrixAt(i * 2 + (lado > 0 ? 1 : 0), m4); }
    viga.castShadow = true; g.add(viga);
    const np = Math.floor(Lc / 3); const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.13, 2.4, 16), matMaderaOsc, np * 2);
    for (let i = 0; i < np; i++) for (const lado of [-1, 1]) { const f = mc(i * 3, lado * (ancho / 2 - 0.15)); f.p.y = ALTO - 1.3; m4.makeBasis(f.l, up, f.t); m4.setPosition(f.p); pil.setMatrixAt(i * 2 + (lado > 0 ? 1 : 0), m4); }
    pil.castShadow = true; g.add(pil);
    if (conBaranda) g.add(baranda(mc, 0, Lc, { ancho, altura: alt, metal }));
    return g;
  }
  escena.add(pasarela(curva, ANCHO));
  const muelle = new THREE.CatmullRomCurve3([marco(64, -1.3).p, new THREE.Vector3(-60, 0, -95), new THREE.Vector3(-180, 0, -160), new THREE.Vector3(-330, 0, -215)]);
  escena.add(pasarela(muelle, 2.0));

  // mirador al final: plataforma de madera y banco solar ondulante mirando a Cartagena
  {
    const fin = marco(L - 4); const centro = fin.p.clone().addScaledVector(fin.t, 3.5);
    const plat = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 6.5), pbr(tl, 'madera', [4.5, 3.2]));
    plat.position.copy(centro).setY(ALTO - 0.06); plat.lookAt(plat.position.clone().add(fin.t)); plat.receiveShadow = true; plat.castShadow = true; escena.add(plat);
    const mf = (s, lado) => { const f = { p: centro.clone().addScaledVector(fin.t, s).addScaledVector(fin.l, lado), t: fin.t, l: fin.l }; return f; };
    const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.15, 2.4, 16), matMaderaOsc, 12); const o = new THREE.Object3D(); let k = 0;
    for (const a of [-3, 0, 3]) for (const b of [-4.2, -1.4, 1.4, 4.2]) { o.position.copy(mf(a, b).p).setY(ALTO - 1.3); o.updateMatrix(); pil.setMatrixAt(k++, o.matrix); } escena.add(pil);
    const banco = crearBancoSolar({ largo: 3.0 }); banco.position.copy(mf(1.6, 1.2).p).setY(ALTO); banco.lookAt(banco.position.clone().add(fin.t)); escena.add(banco);
    // baranda del mirador (frente y costados)
    const frente = new THREE.CatmullRomCurve3([mf(-2.8, 4.4).p, mf(3.2, 4.4).p, mf(3.2, -4.4).p, mf(-2.8, -4.4).p].map((p) => p.setY(0)), false, 'catmullrom', 0);
    escena.add(baranda(hacerMarco(frente), 0, frente.getLength(), { ancho: 0.08, altura: () => ALTO, metal, paso: 1.6 }));
  }

  // especies 3D
  const { animales, posar } = posarEspecies(escena, { sol, nieblaU, vivo, rnd });
  const enAgua = (s, lado) => marco(s, lado).p.setY(-0.05);
  posar('snowy', [8, 31, 47, 88, 140, 205, 226].map((s, i) => ({ p: enAgua(s, (i % 2 ? 1 : -1) * (4 + rnd() * 9)), esc: 0.62 + rnd() * 0.1, tipo: 'garza' })));
  posar('great', [22, 70, 118, 172, 250].map((s, i) => ({ p: enAgua(s, (i % 2 ? -1 : 1) * (5 + rnd() * 12)), esc: 0.95 + rnd() * 0.12, tipo: 'garza' })));
  posar('pelicano', [0.12, 0.2, 0.31, 0.45, 0.6].map((u) => { const p = muelle.getPointAt(u); p.y = ALTO + 1.15; return { p, esc: 1.05, tipo: 'quieto' }; }));
  posar('gaviota_v', Array.from({ length: 14 }, (_, i) => ({ p: new THREE.Vector3(), esc: 0.85 + rnd() * 0.3, tipo: 'vuelo', aleteo: 0.18, c: new THREE.Vector3(-30 + rnd() * 60, 9 + rnd() * 18, -20 - rnd() * 220), r: 14 + rnd() * 30, v: (0.12 + rnd() * 0.1) * (i % 2 ? 1 : -1), f: rnd() * 6 })));
  posar('monarca', Array.from({ length: 10 }, () => { const s = rnd() * L; const lado = (rnd() > 0.5 ? 1 : -1) * (2 + rnd() * 3); return { p: new THREE.Vector3(), esc: 0.09, tam: 0.6, tipo: 'mariposa', aleteo: 0.9, base: marco(s, lado).p.setY(ALTO + 0.8), f: rnd() * 6 }; }));

  return {
    curva, L, marco, altura: () => ALTO,
    actualizar: (t) => { agua.material.uniforms.time.value = t * 0.4; animarEspecies(animales, t); },
  };
}
