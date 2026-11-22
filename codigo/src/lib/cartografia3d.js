import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

// =============================================================================
// Cartografía Operativa Multicapa 3D para Tierra Bomba
// Despiece axonométrico del territorio descompuesto en sus 4 capas activas:
//  01 · Marina y Flujos (Mareas, Storm Surge, Deriva SSE, Vientos Alisios, Rutas)
//  03 · Biótica (Geolocalización de especies nativas, Amortiguamiento, Corredores)
//  04 · Antrópica (Autourbanismo, Movilidad real, Nodos relacionales, Terrains Vagues)
// =============================================================================

export function crearCartografia3D({
  scene,
  heightAtXZ,
  distAt,
  llToXZ,
  houses = [],
  lineMats = [],
  baseUrl = './',
}) {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'cartografia_operativa_root';
  rootGroup.visible = false;
  scene.add(rootGroup);

  const marinaGroup = new THREE.Group();
  const bioticaGroup = new THREE.Group();

  marinaGroup.name = 'capa_01_marina';
  bioticaGroup.name = 'capa_03_biotica';

  marinaGroup.visible = false;
  bioticaGroup.visible = false;

  rootGroup.add(marinaGroup, bioticaGroup);

  // --- Helper: Etiqueta 3D mínima y elegante (en escala del mundo, no cubre la pantalla) ---
  function crearEtiqueta3D(texto, x, z, yOffset, colorHex, parent) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 70;
    const ctx = canvas.getContext('2d');

    // Fondo pastilla translúcida oscura
    ctx.fillStyle = 'rgba(6, 10, 16, 0.82)';
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(4, 4, 392, 62, 14);
    ctx.fill();
    ctx.stroke();

    // Punto de color
    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.arc(24, 35, 7, 0, Math.PI * 2);
    ctx.fill();

    // Texto limpio
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 24px "Geist", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, 40, 36);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.92,
      depthTest: false,
      sizeAttenuation: true, // Escala en el mundo 3D
    });

    const sp = new THREE.Sprite(mat);
    const y = Math.max(0, heightAtXZ(x, z)) + yOffset;
    sp.position.set(x, y, z);
    sp.scale.set(220, 38, 1);
    sp.renderOrder = 85;
    parent.add(sp);
    return sp;
  }

  // --- Helper: Trazo de Líneas con LineSegments2 ---
  function crearTrazoLineas(pares, colorHex, ancho, dashed = false, parent = rootGroup) {
    if (!pares.length) return null;
    const pos = [];
    pares.forEach(([p0, p1]) => {
      pos.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]);
    });
    const g = new LineSegmentsGeometry();
    g.setPositions(pos);
    const m = new LineMaterial({
      color: colorHex,
      linewidth: ancho,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      dashed: !!dashed,
      dashScale: 1,
      dashSize: dashed ? 30 : 1,
      gapSize: dashed ? 20 : 0,
    });
    const line = new LineSegments2(g, m);
    line.renderOrder = 32;
    line.frustumCulled = false;
    parent.add(line);
    lineMats.push(m);
    return { line, mat: m };
  }

  // --- Helper: Conectar polilíneas siguiendo el relieve ---
  function conectarPolilineaTerreno(puntosXZ, yOff, pasoMax = 20) {
    const pares = [];
    for (let i = 0; i < puntosXZ.length - 1; i++) {
      const [x0, z0] = puntosXZ[i];
      const [x1, z1] = puntosXZ[i + 1];
      const d = Math.hypot(x1 - x0, z1 - z0);
      const n = Math.max(1, Math.ceil(d / pasoMax));
      for (let j = 0; j < n; j++) {
        const ax = x0 + ((x1 - x0) * j) / n;
        const az = z0 + ((z1 - z0) * j) / n;
        const bx = x0 + ((x1 - x0) * (j + 1)) / n;
        const bz = z0 + ((z1 - z0) * (j + 1)) / n;
        const ay = heightAtXZ(ax, az) + yOff;
        const by = heightAtXZ(bx, bz) + yOff;
        pares.push([[ax, ay, az], [bx, by, bz]]);
      }
    }
    return pares;
  }

  // Coordenadas geográficas clave
  const TB_PUEBLO = llToXZ(-75.5747, 10.3826);
  const PUNTA_ARENA = llToXZ(-75.5536, 10.3661);
  const CANO_ORO = llToXZ(-75.5675, 10.3395);
  const BOCACHICA = llToXZ(-75.5805, 10.3206);
  const LOMA_ALTA = llToXZ(-75.5725, 10.3490);
  const SAN_FERNANDO = llToXZ(-75.5777, 10.3140);
  const MESETA_CENTRO = llToXZ(-75.572, 10.348);

  // ===========================================================================
  // 01 · CAPA MARINA Y FLUJOS
  // ===========================================================================
  // A. Líneas de Oscilación de Mareas (Pleamar +0.40m vs Bajamar -0.15m)
  const pleamarPares = [];
  const bajamarPares = [];
  const intermarealPares = [];
  {
    const nPasos = 180;
    const radioMax = 5800;
    const ptsPlea = [];
    const ptsBaja = [];

    for (let k = 0; k < nPasos; k++) {
      const ang = (k / nPasos) * Math.PI * 2;
      const dx = Math.cos(ang);
      const dz = Math.sin(ang);
      for (let r = 200; r < radioMax; r += 28) {
        const px = MESETA_CENTRO[0] + dx * r;
        const pz = MESETA_CENTRO[1] + dz * r;
        if (distAt(px, pz) <= 0) {
          const yP = Math.max(0.4, heightAtXZ(px, pz) + 0.5);
          const yB = Math.max(0.1, heightAtXZ(px, pz) + 0.1);
          ptsPlea.push([px, yP, pz]);
          ptsBaja.push([px + dx * 30, yB, pz + dz * 30]);
          break;
        }
      }
    }

    for (let i = 0; i < ptsPlea.length; i++) {
      const j = (i + 1) % ptsPlea.length;
      pleamarPares.push([ptsPlea[i], ptsPlea[j]]);
      bajamarPares.push([ptsBaja[i], ptsBaja[j]]);
      if (i % 3 === 0) intermarealPares.push([ptsBaja[i], ptsPlea[i]]);
    }
  }

  const pleamarLine = crearTrazoLineas(pleamarPares, 0x38bdf8, 4.0, false, marinaGroup);
  const bajamarLine = crearTrazoLineas(bajamarPares, 0x0284c7, 3.0, true, marinaGroup);
  const intermLine = crearTrazoLineas(intermarealPares, 0x06b6d4, 1.8, false, marinaGroup);

  // B. Cotas Críticas de Storm Surge (50a: +1.8m y 100a: +2.4m)
  const surgePares50 = [];
  const surgePares100 = [];
  {
    const bahias = [
      { c: PUNTA_ARENA, r50: 160, r100: 240, n: 24 },
      { c: BOCACHICA, r50: 220, r100: 310, n: 28 },
      { c: CANO_ORO, r50: 180, r100: 260, n: 22 },
      { c: TB_PUEBLO, r50: 150, r100: 220, n: 24 },
    ];
    bahias.forEach(({ c, r50, r100, n }) => {
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * Math.PI * 2;
        const a1 = ((k + 1) / n) * Math.PI * 2;
        const x50_0 = c[0] + Math.cos(a0) * r50;
        const z50_0 = c[1] + Math.sin(a0) * r50;
        const x50_1 = c[0] + Math.cos(a1) * r50;
        const z50_1 = c[1] + Math.sin(a1) * r50;
        surgePares50.push([
          [x50_0, Math.max(1.8, heightAtXZ(x50_0, z50_0) + 0.8), z50_0],
          [x50_1, Math.max(1.8, heightAtXZ(x50_1, z50_1) + 0.8), z50_1],
        ]);

        const x100_0 = c[0] + Math.cos(a0) * r100;
        const z100_0 = c[1] + Math.sin(a0) * r100;
        const x100_1 = c[0] + Math.cos(a1) * r100;
        const z100_1 = c[1] + Math.sin(a1) * r100;
        surgePares100.push([
          [x100_0, Math.max(2.4, heightAtXZ(x100_0, z100_0) + 1.0), z100_0],
          [x100_1, Math.max(2.4, heightAtXZ(x100_1, z100_1) + 1.0), z100_1],
        ]);
      }
    });
  }
  const surgeLine50 = crearTrazoLineas(surgePares50, 0xf97316, 3.8, true, marinaGroup);
  const surgeLine100 = crearTrazoLineas(surgePares100, 0xef4444, 4.5, true, marinaGroup);

  // C. Frentes de Erosión Marina Activa (Arcos rojos dentados)
  const erosionPares = [];
  {
    const zonas = [
      { orig: PUNTA_ARENA, dx: 380, dz: -520, n: 12 },
      { orig: TB_PUEBLO, dx: -450, dz: 280, n: 10 },
      { orig: BOCACHICA, dx: -320, dz: -360, n: 10 },
    ];
    zonas.forEach(({ orig, dx, dz, n }) => {
      for (let i = 0; i < n; i++) {
        const t0 = i / n;
        const t1 = (i + 1) / n;
        const x0 = orig[0] + dx * t0;
        const z0 = orig[1] + dz * t0;
        const x1 = orig[0] + dx * t1;
        const z1 = orig[1] + dz * t1;
        const y0 = heightAtXZ(x0, z0) + 2.0;
        const y1 = heightAtXZ(x1, z1) + 2.0;
        erosionPares.push([[x0, y0, z0], [x1, y1, z1]]);
        const nx = -(z1 - z0);
        const nz = (x1 - x0);
        const len = Math.hypot(nx, nz) || 1;
        const tx = x0 + (nx / len) * 32;
        const tz = z0 + (nz / len) * 32;
        erosionPares.push([[x0, y0, z0], [tx, heightAtXZ(tx, tz) + 2.0, tz]]);
      }
    });
  }
  crearTrazoLineas(erosionPares, 0xdc2626, 5.0, false, marinaGroup);

  // D. Vectores de Corrientes Litorales y Trenes de Oleaje del Caribe
  const oleajeMeshes = [];
  {
    const flechaGeo = new THREE.ConeGeometry(24, 65, 5);
    flechaGeo.rotateX(Math.PI / 2);
    const oleajeMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.85 });
    const derivaMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });

    // Trenes de oleaje desde el Noroccidente
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(flechaGeo, oleajeMat);
      const baseX = MESETA_CENTRO[0] - 2400 + (i % 3) * 700;
      const baseZ = MESETA_CENTRO[1] - 1600 + Math.floor(i / 3) * 1400;
      m.position.set(baseX, 3.5, baseZ);
      m.rotation.y = Math.atan2(0.7, -0.7);
      marinaGroup.add(m);
      oleajeMeshes.push({ mesh: m, basePos: new THREE.Vector3(baseX, 3.5, baseZ), dir: new THREE.Vector3(0.7, 0, -0.7), vel: 80 });
    }

    // Deriva litoral hacia el SSE
    for (let j = 0; j < 5; j++) {
      const m = new THREE.Mesh(flechaGeo, derivaMat);
      const baseX = MESETA_CENTRO[0] - 1300 + ((j * 17) % 40);
      const baseZ = MESETA_CENTRO[1] - 1900 + j * 750;
      m.position.set(baseX, 3.5, baseZ);
      m.rotation.y = Math.atan2(0.98, 0.15);
      marinaGroup.add(m);
      oleajeMeshes.push({ mesh: m, basePos: new THREE.Vector3(baseX, 3.5, baseZ), dir: new THREE.Vector3(0.15, 0, 0.98), vel: 110 });
    }
  }

  // E. Vientos Alisios del Noreste
  const alisiosMeshes = [];
  {
    const vientoGeo = new THREE.CylinderGeometry(5, 14, 150, 5);
    vientoGeo.rotateX(Math.PI / 2);
    const vientoMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.8 });
    for (let k = 0; k < 6; k++) {
      const m = new THREE.Mesh(vientoGeo, vientoMat);
      const baseX = TB_PUEBLO[0] + 1400 - (k % 3) * 900;
      const baseZ = TB_PUEBLO[1] - 1200 + Math.floor(k / 3) * 900;
      const y = 90 + (k % 2) * 35;
      m.position.set(baseX, y, baseZ);
      m.rotation.y = Math.atan2(0.65, -0.75);
      marinaGroup.add(m);
      alisiosMeshes.push({ mesh: m, basePos: new THREE.Vector3(baseX, y, baseZ), dir: new THREE.Vector3(-0.75, 0, 0.65), vel: 180 });
    }
  }

  // Etiquetas 3D mínimas para Capa Marina
  crearEtiqueta3D('Pleamar +0.40m · Bajamar -0.15m', MESETA_CENTRO[0] - 1100, MESETA_CENTRO[1] - 500, 45, '#38bdf8', marinaGroup);
  crearEtiqueta3D('Deriva Litoral SSE (0.4-0.8 m/s)', MESETA_CENTRO[0] - 1700, MESETA_CENTRO[1] + 600, 45, '#67e8f9', marinaGroup);
  crearEtiqueta3D('Frente Activo de Erosión', PUNTA_ARENA[0] - 180, PUNTA_ARENA[1] + 280, 45, '#dc2626', marinaGroup);
  crearEtiqueta3D('Storm Surge +1.8m a +2.4m', BOCACHICA[0] - 120, BOCACHICA[1] - 180, 45, '#ef4444', marinaGroup);
  crearEtiqueta3D('Vientos Alisios NE', TB_PUEBLO[0] + 450, TB_PUEBLO[1] - 700, 95, '#bae6fd', marinaGroup);

  // ===========================================================================
  // 03 · CAPA BIÓTICA (RED DE INTERACCIONES BIÓTICAS Y GEOLOCALIZACIÓN REAL)
  // Base científica: 9.688 registros, 438 especies, 923 interacciones ecológicas (GloBI / iNaturalist)
  // ===========================================================================
  const CAT_COLORS = [
    0x38bdf8, // 0: Aves (78 spp)
    0x22c55e, // 1: Flora (112 spp · 36 árboles)
    0xfbbf24, // 2: Insectos (114 spp)
    0x06b6d4, // 3: Peces (50 spp)
    0xa855f7, // 4: Moluscos (33 spp)
    0xec4899, // 5: Arácnidos (17 spp)
    0xf97316, // 6: Mamíferos (15 spp)
    0xeab308, // 7: Reptiles (10 spp)
    0x10b981, // 8: Anfibios (5 spp)
    0xd97706, // 9: Hongos (4 spp)
  ];

  const bioticaLineMats = [];
  const bioticaRings = [];
  const redBioticaSubGroup = new THREE.Group();
  redBioticaSubGroup.name = 'red_biotica_interacciones_real';
  bioticaGroup.add(redBioticaSubGroup);

  // Carga asíncrona de la base de datos real de especies e interacciones
  fetch(`${baseUrl}especies/data/especies.json`)
    .then((r) => r.json())
    .then((espData) => {
      fetch(`${baseUrl}especies/data/interacciones.json`)
        .then((r) => r.json())
        .then((relData) => {
          // 1. Puntos de observaciones reales en el terreno (732 avistamientos geolocalizados)
          if (espData.obs && espData.obs.length) {
            const dotGeo = new THREE.SphereGeometry(7, 6, 4);
            const dotMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.85 });
            const im = new THREE.InstancedMesh(dotGeo, dotMat, espData.obs.length);
            const dummy = new THREE.Object3D();
            const colorTmp = new THREE.Color();

            espData.obs.forEach(([spIdx, ox, oz], i) => {
              const sp = espData.species[spIdx];
              const oy = Math.max(0, heightAtXZ(ox, oz)) + 2.0;
              dummy.position.set(ox, oy, oz);
              dummy.updateMatrix();
              im.setMatrixAt(i, dummy.matrix);
              const hex = CAT_COLORS[sp?.cat ?? 1] || 0x22c55e;
              colorTmp.setHex(hex);
              im.setColorAt(i, colorTmp);
            });
            im.instanceMatrix.needsUpdate = true;
            if (im.instanceColor) im.instanceColor.needsUpdate = true;
            redBioticaSubGroup.add(im);
          }

          // 2. Mapa de especies indexadas por taxon ID (tid)
          const spMap = new Map();
          espData.species.forEach((s) => spMap.set(s.tid, s));

          // 3. Arcos tróficos y de polinización en 3D
          const arcosPares = [];
          const arcosParesPoli = [];
          const arcosParesHerbi = [];

          const validRels = [];
          relData.rel.forEach(([t1, t2, tipos, n]) => {
            const s1 = spMap.get(t1);
            const s2 = spMap.get(t2);
            if (s1 && s2 && s1.x != null && s2.x != null) {
              const d = Math.hypot(s2.x - s1.x, s2.z - s1.z);
              if (d > 20 && d < 4200) {
                validRels.push({ s1, s2, tipo: tipos[0] || 0, d, n });
              }
            }
          });
          validRels.sort((a, b) => b.n - a.n);

          // Trazar las 120 relaciones de mayor peso e impacto como parábolas 3D
          validRels.slice(0, 120).forEach(({ s1, s2, tipo, d }) => {
            const y1 = Math.max(0, heightAtXZ(s1.x, s1.z)) + 3;
            const y2 = Math.max(0, heightAtXZ(s2.x, s2.z)) + 3;
            const archH = Math.min(180, 25 + d * 0.08);

            const nSegs = 8;
            for (let k = 0; k < nSegs; k++) {
              const tA = k / nSegs;
              const tB = (k + 1) / nSegs;
              const xA = s1.x + (s2.x - s1.x) * tA;
              const zA = s1.z + (s2.z - s1.z) * tA;
              const yA = y1 + (y2 - y1) * tA + Math.sin(tA * Math.PI) * archH;

              const xB = s1.x + (s2.x - s1.x) * tB;
              const zB = s1.z + (s2.z - s1.z) * tB;
              const yB = y1 + (y2 - y1) * tB + Math.sin(tB * Math.PI) * archH;

              const par = [[xA, yA, zA], [xB, yB, zB]];
              if (tipo === 2) arcosParesPoli.push(par);
              else if (tipo === 1) arcosParesHerbi.push(par);
              else arcosPares.push(par);
            }
          });

          // Conectar trazos 3D animados
          if (arcosParesPoli.length) {
            const l = crearTrazoLineas(arcosParesPoli, 0xf59e0b, 2.8, true, redBioticaSubGroup);
            if (l) bioticaLineMats.push(l.mat);
          }
          if (arcosParesHerbi.length) {
            const l = crearTrazoLineas(arcosParesHerbi, 0x84cc16, 2.5, true, redBioticaSubGroup);
            if (l) bioticaLineMats.push(l.mat);
          }
          if (arcosPares.length) {
            const l = crearTrazoLineas(arcosPares, 0xef4444, 2.2, true, redBioticaSubGroup);
            if (l) bioticaLineMats.push(l.mat);
          }

          // 4. Balizas y nodos de las especies clave más conectadas en la isla
          const especiesClave = [
            { tid: 47219, n: 'Abeja melífera (62 rel.)', col: '#fbbf24' },
            { tid: 51111, n: 'Abeja carpintera (42 rel.)', col: '#f59e0b' },
            { tid: 62841, n: 'Cordia / Árbol nativo (37 rel.)', col: '#22c55e' },
            { tid: 35342, n: 'Iguana verde (36 rel.)', col: '#84cc16' },
            { tid: 62850, n: 'Mangle botoncillo (Costa)', col: '#10b981' },
            { tid: 4328, n: 'Pelícano café (Litoral)', col: '#38bdf8' },
            { tid: 41005, n: 'Murciélago frutero', col: '#f97316' },
          ];

          especiesClave.forEach(({ tid, n, col }) => {
            const sp = spMap.get(tid);
            if (!sp) return;
            const r = 90;
            const ringGeo = new THREE.RingGeometry(r * 0.7, r, 24);
            ringGeo.rotateX(-Math.PI / 2);
            ringGeo.translate(sp.x, Math.max(0, heightAtXZ(sp.x, sp.z)) + 2.0, sp.z);
            const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).getHex(), transparent: true, opacity: 0.8, side: THREE.DoubleSide });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            redBioticaSubGroup.add(ringMesh);
            bioticaRings.push(ringMesh);
            crearEtiqueta3D(n, sp.x, sp.z, 45, col, redBioticaSubGroup);
          });
        })
        .catch((e) => console.warn('Aviso: interacciones.json diferido:', e));
    })
    .catch((e) => console.warn('Aviso: especies.json diferido:', e));

  // Borde de amortiguamiento bio-mecánico costero continuo (50-150m)
  const bufferPares = [];
  {
    const pts = pleamarPares.map(([p0]) => p0);
    for (let i = 0; i < pts.length; i += 2) {
      const p = pts[i];
      const pInX = p[0] + (MESETA_CENTRO[0] - p[0]) * 0.04;
      const pInZ = p[2] + (MESETA_CENTRO[1] - p[2]) * 0.04;
      bufferPares.push([[p[0], p[1] + 0.8, p[2]], [pInX, heightAtXZ(pInX, pInZ) + 1.5, pInZ]]);
    }
  }
  crearTrazoLineas(bufferPares, 0x10b981, 3.2, false, bioticaGroup);
  crearEtiqueta3D('Borde de Amortiguamiento Bio-Mecánico', CANO_ORO[0] - 240, CANO_ORO[1] - 340, 50, '#10b981', bioticaGroup);

  // ===========================================================================
  // BUCLE DE ACTUALIZACIÓN CON CONTROL ESTRICTO DE VISIBILIDAD POR SCROLL
  // ===========================================================================
  function actualizar(dt, t, cartoCapa) {
    if (cartoCapa === undefined || cartoCapa < 0) {
      if (rootGroup.visible) {
        rootGroup.visible = false;
        marinaGroup.visible = false;
        bioticaGroup.visible = false;
      }
      return;
    }

    rootGroup.visible = true;

    // CONTROL ESTRICTO DE VISIBILIDAD:
    // Al scrollear, la capa actual aparece y la anterior DESAPARECE POR COMPLETO.
    //  0: Despiece Integral (todas visibles con equilibrio)
    //  1: Marina y Flujos (SÓLO marina visible)
    //  3: Biótica (SÓLO biótica visible con su Red interactiva)
    const verMarina = cartoCapa === 0 || cartoCapa === 1;
    const verBiotica = cartoCapa === 0 || cartoCapa === 3;

    marinaGroup.visible = verMarina;
    bioticaGroup.visible = verBiotica;

    // Animación continua de la capa activa
    if (verMarina) {
      oleajeMeshes.forEach((o) => {
        const distAvance = (t * o.vel) % 800;
        o.mesh.position.copy(o.basePos).addScaledVector(o.dir, distAvance);
        o.mesh.position.y = 3.5 + Math.sin(t * 3.0 + o.basePos.x * 0.01) * 1.2;
      });
      alisiosMeshes.forEach((a) => {
        const distAvance = (t * a.vel) % 1500;
        a.mesh.position.copy(a.basePos).addScaledVector(a.dir, distAvance);
      });
      if (bajamarLine?.mat) bajamarLine.mat.dashOffset = -t * 45;
      if (surgeLine50?.mat) surgeLine50.mat.dashOffset = -t * 35;
      if (surgeLine100?.mat) surgeLine100.mat.dashOffset = -t * 30;
      if (intermLine?.mat) intermLine.mat.opacity = 0.5 + 0.3 * Math.sin(t * 3.5);
    }

    if (verBiotica) {
      const pulBio = 1 + 0.05 * Math.sin(t * 2.0);
      bioticaRings.forEach((b) => b.scale.set(pulBio, pulBio, 1));
      bioticaLineMats.forEach((m) => {
        if (m) m.dashOffset = -t * 28;
      });
    }
  }

  return {
    rootGroup,
    marinaGroup,
    bioticaGroup,
    actualizar,
  };
}
