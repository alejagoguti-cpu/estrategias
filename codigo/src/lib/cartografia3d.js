import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

// =============================================================================
// Cartografía Operativa Multicapa 3D para Tierra Bomba
// Despiece axonométrico del territorio descompuesto en sus 4 capas activas:
//  01 · Marina y Flujos (Mareas, Storm Surge, Deriva SSE, Vientos Alisios, Rutas)
//  02 · Topo-Hídrica (Curvas de nivel, Escorrentías, Creeks, Ponds, Acuíferos, Techos)
//  03 · Biótica (Geolocalización de especies nativas, Amortiguamiento, Corredores)
//  04 · Antrópica (Autourbanismo, Movilidad real, Nodos relacionales, Terrains Vagues)
// =============================================================================

export function crearCartografia3D({
  scene,
  heightAtXZ,
  distAt,
  llToXZ,
  houses = [],
  midasJson = {},
  ctxJson = {},
  lineMats = [],
  addClean = () => {},
}) {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'cartografia_operativa_root';
  rootGroup.visible = false;
  scene.add(rootGroup);

  const marinaGroup = new THREE.Group();
  const topoGroup = new THREE.Group();
  const bioticaGroup = new THREE.Group();
  const antropicaGroup = new THREE.Group();

  rootGroup.add(marinaGroup, topoGroup, bioticaGroup, antropicaGroup);

  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  // --- Helper: Crear Badge Técnico (Billboard Sprite) ---
  const badges = [];
  function crearBadge(titulo, subtitulo, x, z, yOffset, colorHex, badgeCode = '', parent = rootGroup) {
    const y = Math.max(0, heightAtXZ(x, z)) + yOffset;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    // Fondo tarjeta de vidrio técnica
    ctx.fillStyle = 'rgba(6, 10, 16, 0.92)';
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(6, 6, 500, 108, 14);
    ctx.fill();
    ctx.stroke();

    // Barra de color lateral
    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.roundRect(6, 6, 12, 108, [14, 0, 0, 14]);
    ctx.fill();

    // Título técnico
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Barlow Condensed", system-ui, sans-serif';
    ctx.fillText(titulo, 28, 46);

    // Subtítulo explicativo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.font = '18px monospace';
    ctx.fillText(subtitulo, 28, 80);

    // Cita bibliográfica
    if (badgeCode) {
      ctx.fillStyle = colorHex;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(badgeCode, 492, 100);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthTest: false,
      sizeAttenuation: false,
    });

    const sp = new THREE.Sprite(mat);
    sp.position.set(x, y, z);
    // Escala constante en pantalla
    sp.scale.set(0.068 * (512 / 120), 0.068, 1);
    sp.renderOrder = 95;
    sp.userData = { baseY: y, mat };
    parent.add(sp);
    badges.push(sp);
    return sp;
  }

  // --- Helper: Crear Trazo de Línea 3D con LineSegments2 ---
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
      opacity: 0,
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

  // --- Helper: Conectar polilíneas sobre el terreno ---
  function conectarPolilineaTerreno(puntosXZ, yOff, pasoMax = 18) {
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

  // Coordenadas geográficas clave de la isla
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
  const marinaAnimables = [];

  // A. Líneas de Oscilación de Mareas (Pleamar +0.40m vs Bajamar -0.15m) y Franja Intermareal
  const pleamarPares = [];
  const bajamarPares = [];
  const intermarealPares = [];
  {
    // Muestreo del perímetro costero a partir de un abanico radial desde el centro
    const nPasos = 240;
    const radioMax = 5800;
    const ptsPlea = [];
    const ptsBaja = [];

    for (let k = 0; k < nPasos; k++) {
      const ang = (k / nPasos) * Math.PI * 2;
      const dx = Math.cos(ang);
      const dz = Math.sin(ang);
      // Rayo desde el centro de la isla hacia afuera para encontrar el borde costero
      let hallado = false;
      for (let r = 200; r < radioMax; r += 25) {
        const px = MESETA_CENTRO[0] + dx * r;
        const pz = MESETA_CENTRO[1] + dz * r;
        const dist = distAt(px, pz);
        if (dist <= 0) {
          // Borde costero
          const yP = Math.max(0.4, heightAtXZ(px, pz) + 0.4);
          const yB = Math.max(0.1, heightAtXZ(px, pz) + 0.05);
          ptsPlea.push([px, yP, pz]);
          ptsBaja.push([px + dx * 28, yB, pz + dz * 28]);
          hallado = true;
          break;
        }
      }
    }

    for (let i = 0; i < ptsPlea.length; i++) {
      const j = (i + 1) % ptsPlea.length;
      pleamarPares.push([ptsPlea[i], ptsPlea[j]]);
      bajamarPares.push([ptsBaja[i], ptsBaja[j]]);
      // Franja intermareal expuesta (costillas transversales cada 3 pasos)
      if (i % 3 === 0) {
        intermarealPares.push([ptsBaja[i], ptsPlea[i]]);
      }
    }
  }

  const pleamarLine = crearTrazoLineas(pleamarPares, 0x38bdf8, 4.5, false, marinaGroup);
  const bajamarLine = crearTrazoLineas(bajamarPares, 0x0284c7, 3.2, true, marinaGroup);
  const intermLine = crearTrazoLineas(intermarealPares, 0x06b6d4, 1.8, false, marinaGroup);

  // B. Cotas Críticas de Inundación y Marejada de Tormenta (Storm Surge Tr=50a y Tr=100a)
  const surgePares50 = [];
  const surgePares100 = [];
  {
    // Trazos que penetran en las bahías y tierras bajas
    const bahias = [
      { c: PUNTA_ARENA, r50: 160, r100: 240, n: 32 },
      { c: BOCACHICA, r50: 220, r100: 310, n: 36 },
      { c: CANO_ORO, r50: 180, r100: 260, n: 28 },
      { c: TB_PUEBLO, r50: 150, r100: 220, n: 30 },
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
          [x50_0, Math.max(1.8, heightAtXZ(x50_0, z50_0) + 0.6), z50_0],
          [x50_1, Math.max(1.8, heightAtXZ(x50_1, z50_1) + 0.6), z50_1],
        ]);

        const x100_0 = c[0] + Math.cos(a0) * r100;
        const z100_0 = c[1] + Math.sin(a0) * r100;
        const x100_1 = c[0] + Math.cos(a1) * r100;
        const z100_1 = c[1] + Math.sin(a1) * r100;
        surgePares100.push([
          [x100_0, Math.max(2.4, heightAtXZ(x100_0, z100_0) + 0.8), z100_0],
          [x100_1, Math.max(2.4, heightAtXZ(x100_1, z100_1) + 0.8), z100_1],
        ]);
      }
    });
  }

  const surgeLine50 = crearTrazoLineas(surgePares50, 0xf97316, 4.0, true, marinaGroup);
  const surgeLine100 = crearTrazoLineas(surgePares100, 0xef4444, 4.8, true, marinaGroup);

  // C. Frentes de Erosión Marina Activa (Arcos y líneas dentadas en Punta Arena y costa occidental)
  const erosionPares = [];
  {
    const zonasErosion = [
      { orig: PUNTA_ARENA, dx: 400, dz: -600, n: 16 },
      { orig: TB_PUEBLO, dx: -500, dz: 300, n: 14 },
      { orig: BOCACHICA, dx: -350, dz: -400, n: 12 },
    ];
    zonasErosion.forEach(({ orig, dx, dz, n }) => {
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
        // Dientes de peligro hacia el interior de tierra
        const nx = -(z1 - z0);
        const nz = (x1 - x0);
        const len = Math.hypot(nx, nz) || 1;
        const tx = x0 + (nx / len) * 35;
        const tz = z0 + (nz / len) * 35;
        const ty = heightAtXZ(tx, tz) + 2.0;
        erosionPares.push([[x0, y0, z0], [tx, ty, tz]]);
      }
    });
  }
  const erosionLine = crearTrazoLineas(erosionPares, 0xdc2626, 5.5, false, marinaGroup);

  // D. Vectores de Corrientes Litorales (Deriva SSE) y Trenes de Oleaje del Caribe
  const oleajeGroup = new THREE.Group();
  marinaGroup.add(oleajeGroup);
  const oleajeMeshes = [];
  {
    // Malla geométrica de flechas de flujo marítimo
    const flechaGeo = new THREE.ConeGeometry(22, 60, 5);
    flechaGeo.rotateX(Math.PI / 2);
    const oleajeMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0 });
    const derivaMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });

    // 1) Trenes de oleaje aproximándose desde el Noroccidente (Caribe)
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(flechaGeo, oleajeMat);
      const baseX = MESETA_CENTRO[0] - 2600 + (i % 3) * 600;
      const baseZ = MESETA_CENTRO[1] - 1800 + Math.floor(i / 3) * 1200;
      m.position.set(baseX, 3.0, baseZ);
      m.rotation.y = Math.atan2(0.7, -0.7); // hacia SE
      oleajeGroup.add(m);
      oleajeMeshes.push({ mesh: m, basePos: new THREE.Vector3(baseX, 3.0, baseZ), dir: new THREE.Vector3(0.7, 0, -0.7), vel: 80, tipo: 'ola' });
    }

    // 2) Corrientes de Deriva Litoral neta hacia el SSE a lo largo de la plataforma oeste
    for (let j = 0; j < 8; j++) {
      const m = new THREE.Mesh(flechaGeo, derivaMat);
      const baseX = MESETA_CENTRO[0] - 1200 + ((j * 17) % 50);
      const baseZ = MESETA_CENTRO[1] - 2200 + j * 600;
      m.position.set(baseX, 3.0, baseZ);
      m.rotation.y = Math.atan2(0.98, 0.15); // hacia SSE
      oleajeGroup.add(m);
      oleajeMeshes.push({ mesh: m, basePos: new THREE.Vector3(baseX, 3.0, baseZ), dir: new THREE.Vector3(0.15, 0, 0.98), vel: 110, tipo: 'deriva' });
    }
  }

  // E. Vientos Predominantes (Alisios del Noreste)
  const alisiosGroup = new THREE.Group();
  marinaGroup.add(alisiosGroup);
  const alisiosMeshes = [];
  {
    const vientoGeo = new THREE.CylinderGeometry(4, 14, 140, 5);
    vientoGeo.rotateX(Math.PI / 2);
    const vientoMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0 });
    for (let k = 0; k < 10; k++) {
      const m = new THREE.Mesh(vientoGeo, vientoMat);
      const baseX = TB_PUEBLO[0] + 1600 - (k % 4) * 800;
      const baseZ = TB_PUEBLO[1] - 1400 + Math.floor(k / 4) * 900;
      const y = 80 + (k % 3) * 35;
      m.position.set(baseX, y, baseZ);
      m.rotation.y = Math.atan2(0.65, -0.75); // del NE al SW
      alisiosGroup.add(m);
      alisiosMeshes.push({ mesh: m, basePos: new THREE.Vector3(baseX, y, baseZ), dir: new THREE.Vector3(-0.75, 0, 0.65), vel: 180 });
    }
  }

  // F. Badges Técnicos de Capa Marina
  crearBadge('LÍNEAS DE OSCILACIÓN DE MAREA', 'Pleamar (+0,40 m) · Bajamar (-0,15 m) · Franja Intermareal', MESETA_CENTRO[0] - 1400, MESETA_CENTRO[1] - 600, 70, '#38bdf8', '[part_58, part_74]', marinaGroup);
  crearBadge('STORM SURGE Y MAREJADA CRÍTICA', 'Cota Inundación Tr=50a (+1,8 m) · Tr=100a (+2,4 m)', PUNTA_ARENA[0] + 80, PUNTA_ARENA[1] - 120, 85, '#ef4444', '[part_57, part_67]', marinaGroup);
  crearBadge('FRENTES ACTIVOS DE EROSIÓN MARINA', 'Socavación del litoral habitado: 0,63 a 3,0 m/año', PUNTA_ARENA[0] - 220, PUNTA_ARENA[1] + 350, 95, '#dc2626', '[part_52, part_59]', marinaGroup);
  crearBadge('DERIVA LITORAL Y TRENES DE OLEAJE', 'Corriente dominante SSE (0,4-0,8 m/s) arrastre litoral', MESETA_CENTRO[0] - 2100, MESETA_CENTRO[1] + 800, 110, '#67e8f9', '[part_50, part_66]', marinaGroup);
  crearBadge('VIENTOS ALISIOS PREDOMINANTES', 'Vectores NE intensificadores de oleaje costero', TB_PUEBLO[0] + 600, TB_PUEBLO[1] - 900, 140, '#bae6fd', '[part_50, part_53]', marinaGroup);
  crearBadge('RUTAS DE EMBARQUE INFORMAL', '614 viajes diarios en lancha · caletas y playas de pescadores', CANO_ORO[0] + 300, CANO_ORO[1] - 200, 90, '#f59e0b', '[part_53, part_64]', marinaGroup);

  // ===========================================================================
  // 02 · CAPA TOPO-HÍDRICA
  // ===========================================================================
  // A. Curvas de Nivel Topográficas (+5m, +10m, +15m, +20m, +25m, +30m, +35m, +40m)
  const curvasPares = [];
  {
    const cotas = [5, 10, 15, 20, 25, 30, 35, 40];
    cotas.forEach((cota) => {
      const nPuntos = 160;
      const pts = [];
      const rAprox = 3200 * (1 - cota / 48);
      for (let i = 0; i < nPuntos; i++) {
        const ang = (i / nPuntos) * Math.PI * 2;
        // Búsqueda radial de la cota
        for (let r = 80; r < 4500; r += 45) {
          const px = MESETA_CENTRO[0] + Math.cos(ang) * r * 0.75;
          const pz = MESETA_CENTRO[1] + Math.sin(ang) * r * 1.25;
          const h = heightAtXZ(px, pz);
          if (Math.abs(h - cota) < 2.5) {
            pts.push([px, h + 1.2, pz]);
            break;
          }
        }
      }
      for (let j = 0; j < pts.length - 1; j++) {
        if (Math.hypot(pts[j + 1][0] - pts[j][0], pts[j + 1][2] - pts[j][2]) < 280) {
          curvasPares.push([pts[j], pts[j + 1]]);
        }
      }
    });
  }
  const curvasLine = crearTrazoLineas(curvasPares, 0xeab308, 2.8, false, topoGroup);

  // B. Microcuencas y Arroyos Naturales (6 Creeks radiales)
  const arroyosDef = [
    { n: 'Arroyo Norte', de: LOMA_ALTA, a: TB_PUEBLO, color: 0x38bdf8 },
    { n: 'Arroyo Noroccidente', de: LOMA_ALTA, a: [TB_PUEBLO[0] - 900, TB_PUEBLO[1] + 200], color: 0x38bdf8 },
    { n: 'Arroyo Punta Arena', de: MESETA_CENTRO, a: PUNTA_ARENA, color: 0x38bdf8 },
    { n: 'Arroyo Caño del Oro', de: MESETA_CENTRO, a: CANO_ORO, color: 0x38bdf8 },
    { n: 'Arroyo Bocachica Norte', de: [MESETA_CENTRO[0], MESETA_CENTRO[1] + 800], a: [BOCACHICA[0], BOCACHICA[1] - 400], color: 0x38bdf8 },
    { n: 'Arroyo San Fernando', de: [BOCACHICA[0] + 400, BOCACHICA[1] - 300], a: SAN_FERNANDO, color: 0x38bdf8 },
  ];

  const arroyosPares = [];
  const runoffAnimables = [];
  arroyosDef.forEach(({ de, a }) => {
    const pts = [];
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      // Trayectoria sinuosa siguiendo cañadas
      const mx = (1 - t) * de[0] + t * a[0] + Math.sin(t * Math.PI * 3) * 60;
      const mz = (1 - t) * de[1] + t * a[1] + Math.cos(t * Math.PI * 2) * 50;
      pts.push([mx, mz]);
    }
    const pares = conectarPolilineaTerreno(pts, 2.2, 15);
    arroyosPares.push(...pares);

    // Gotas/vectores de flujo para animar
    const gotaGeo = new THREE.SphereGeometry(7, 6, 6);
    const gotaMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0 });
    for (let k = 0; k < 4; k++) {
      const gm = new THREE.Mesh(gotaGeo, gotaMat);
      topoGroup.add(gm);
      runoffAnimables.push({ mesh: gm, pts, fase: k / 4, vel: 0.18 });
    }
  });

  const arroyosLine = crearTrazoLineas(arroyosPares, 0x0284c7, 5.2, false, topoGroup);

  // C. Puntos de Depresión y Cuencas Naturales (Ponds / Futuros Lagos y Humedales)
  const pondsDef = [
    { n: 'Depresión Tierrabomba Baja', pos: [TB_PUEBLO[0] + 50, TB_PUEBLO[1] - 180], r: 90 },
    { n: 'Cuenca Retención Punta Arena', pos: [PUNTA_ARENA[0] - 120, PUNTA_ARENA[1] + 160], r: 110 },
    { n: 'Humedal Estuarino Caño del Oro', pos: [CANO_ORO[0] - 80, CANO_ORO[1] + 120], r: 130 },
    { n: 'Laguna de Captación Bocachica', pos: [BOCACHICA[0] + 140, BOCACHICA[1] - 180], r: 120 },
    { n: 'Reservorio Meseta Central', pos: [MESETA_CENTRO[0] + 40, MESETA_CENTRO[1] - 60], r: 95 },
  ];
  const pondRings = [];
  pondsDef.forEach(({ pos, r }) => {
    const ringGeo = new THREE.RingGeometry(r * 0.7, r, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const y = heightAtXZ(pos[0], pos[1]) + 1.2;
    ringGeo.translate(pos[0], y, pos[1]);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    topoGroup.add(ringMesh);
    pondRings.push(ringMesh);
  });

  // D. Acuíferos Subterráneos y Pozos Comunitarios (Aljibes)
  const pozosDef = [
    { n: 'Pozo Comunitario Tierrabomba', pos: [TB_PUEBLO[0] - 120, TB_PUEBLO[1] + 100] },
    { n: 'Aljibe Caño del Oro', pos: [CANO_ORO[0] + 60, CANO_ORO[1] - 80] },
    { n: 'Pozo Ancestral Bocachica', pos: [BOCACHICA[0] - 80, BOCACHICA[1] + 120] },
    { n: 'Lente Freática Meseta Calcárea', pos: [MESETA_CENTRO[0] - 90, MESETA_CENTRO[1] + 140] },
  ];
  pozosDef.forEach(({ n, pos }) => {
    crearBadge(n.toUpperCase(), 'Acuífero Subterráneo / Pozo de Agua Dulce', pos[0], pos[1], 45, '#0ea5e9', '[part_8, part_54]', topoGroup);
  });

  // E. Zonas de Impermeabilización Crítica (Cubiertas de asbesto y suelo sellado)
  const techoMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0 });
  const techosGroup = new THREE.Group();
  topoGroup.add(techosGroup);
  {
    // Cajas sobre los techos de las casas más expuestas para ilustrar impermeabilización
    const bGeo = new THREE.BoxGeometry(16, 6, 16);
    houses.slice(0, 180).forEach((h) => {
      const tm = new THREE.Mesh(bGeo, techoMat);
      tm.position.set(h.x, h.y + h.h + 2, h.z);
      techosGroup.add(tm);
    });
  }

  // Badges Topo-Hídricos
  crearBadge('RELIEVE Y CURVAS DE NIVEL', 'Topografía insular: Cota máxima +44 m · Cota crítica < +2,0 m', LOMA_ALTA[0] + 100, LOMA_ALTA[1] - 220, 95, '#eab308', '[part_10, part_53]', topoGroup);
  crearBadge('VECTORES DE ESCORRENTÍA Y CREEKS', '6 microcuencas radiales que compartimentan el drenaje', MESETA_CENTRO[0] + 320, MESETA_CENTRO[1] + 450, 85, '#38bdf8', '[part_60, part_68]', topoGroup);
  crearBadge('DEPRESIONES Y CUENCAS NATURALES', 'Puntos bajos de empozamiento pluvial (futuros reservorios)', PUNTA_ARENA[0] - 180, PUNTA_ARENA[1] + 120, 75, '#06b6d4', '[part_36, part_54]', topoGroup);
  crearBadge('IMPERMEABILIZACIÓN CRÍTICA', 'Cubiertas de asbesto y suelo sellado que impiden captación limpia', TB_PUEBLO[0] - 160, TB_PUEBLO[1] + 280, 80, '#f43f5e', '[part_54, part_59]', topoGroup);

  // ===========================================================================
  // 03 · CAPA BIÓTICA (RED BIÓTICA Y GEOLOCALIZACIÓN DE ESPECIES)
  // ===========================================================================
  const especiesDef = [
    {
      sp: 'Rhizophora mangle',
      comun: 'Mangle rojo',
      pos: [CANO_ORO[0] + 80, CANO_ORO[1] + 160],
      rol: 'Borde intermareal · Raíces zancudas disipadoras de oleaje',
      color: '#10b981',
      r: 160,
    },
    {
      sp: 'Avicennia germinans',
      comun: 'Mangle negro',
      pos: [CANO_ORO[0] - 180, CANO_ORO[1] + 240],
      rol: 'Franja hipersalina interior · Neumatóforos oxigenadores',
      color: '#059669',
      r: 140,
    },
    {
      sp: 'Coccoloba uvifera',
      comun: 'Uvita de playa',
      pos: [PUNTA_ARENA[0] + 120, PUNTA_ARENA[1] - 80],
      rol: 'Fijación de arenas litorales · Resistencia a viento salino',
      color: '#84cc16',
      r: 120,
    },
    {
      sp: 'Prosopis juliflora',
      comun: 'Trupillo',
      pos: [TB_PUEBLO[0] + 300, TB_PUEBLO[1] + 400],
      rol: 'Laderas semiáridas · Raíz pivotante profunda y nitrógeno',
      color: '#65a30d',
      r: 150,
    },
    {
      sp: 'Bursera simaruba / Guaiacum',
      comun: 'Indio en cueros y Guayacán',
      pos: [MESETA_CENTRO[0] + 120, MESETA_CENTRO[1] - 140],
      rol: 'Núcleo de Bosque Seco Tropical · Retención edáfica en meseta',
      color: '#16a34a',
      r: 220,
    },
    {
      sp: 'Chrysopogon zizanioides',
      comun: 'Pasto Vetiver',
      pos: [PUNTA_ARENA[0] - 260, PUNTA_ARENA[1] + 480],
      rol: 'Bio-armadura de talud · Red radicular de hasta 3 m anti-erosión',
      color: '#22c55e',
      r: 130,
    },
  ];

  const bioticaRings = [];
  especiesDef.forEach(({ sp, comun, pos, rol, color, r }) => {
    // Anillo territorial de cobertura de la especie
    const ringGeo = new THREE.RingGeometry(r * 0.75, r, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const y = heightAtXZ(pos[0], pos[1]) + 1.8;
    ringGeo.translate(pos[0], y, pos[1]);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).getHex(), transparent: true, opacity: 0, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    bioticaGroup.add(ringMesh);
    bioticaRings.push(ringMesh);

    // Badge con clasificación botánica real
    crearBadge(`${sp.toUpperCase()} · «${comun}»`, rol, pos[0], pos[1], 55, color, '[part_160]', bioticaGroup);
  });

  // Borde de amortiguamiento bio-mecánico costero continuo (Franja verde de disipación de oleaje)
  const bufferPares = [];
  {
    const pts = pleamarPares.map(([p0]) => p0);
    for (let i = 0; i < pts.length; i += 2) {
      const p = pts[i];
      // Banda hacia el interior de 60m
      const dist = distAt(p[0], p[2]);
      const pInX = p[0] + (MESETA_CENTRO[0] - p[0]) * 0.04;
      const pInZ = p[2] + (MESETA_CENTRO[1] - p[2]) * 0.04;
      const yIn = heightAtXZ(pInX, pInZ) + 1.5;
      bufferPares.push([[p[0], p[1] + 0.8, p[2]], [pInX, yIn, pInZ]]);
    }
  }
  const bufferLine = crearTrazoLineas(bufferPares, 0x10b981, 3.5, false, bioticaGroup);
  crearBadge('BORDE DE AMORTIGUAMIENTO BIO-MECÁNICO', 'Franja de 50 a 150 m en ensenadas que disipa 66% energía de oleaje', CANO_ORO[0] - 300, CANO_ORO[1] - 400, 100, '#10b981', '[part_160]', bioticaGroup);

  // ===========================================================================
  // 04 · CAPA ANTRÓPICA
  // ===========================================================================
  // A. Morfologías dendríticas de Autourbanismo ("manchas de tinta" en Tierrabomba y Bocachica)
  const manchasDef = [
    { c: TB_PUEBLO, rx: 420, rz: 320, color: 0xf59e0b },
    { c: PUNTA_ARENA, rx: 280, rz: 460, color: 0xf59e0b },
    { c: CANO_ORO, rx: 310, rz: 280, color: 0xf59e0b },
    { c: BOCACHICA, rx: 460, rz: 410, color: 0xf59e0b },
  ];
  const manchasGroup = new THREE.Group();
  antropicaGroup.add(manchasGroup);
  manchasDef.forEach(({ c, rx, rz, color }) => {
    const pts = [];
    const n = 36;
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2;
      const rad = 1 + 0.22 * Math.sin(a * 4) + 0.15 * Math.cos(a * 3);
      pts.push([c[0] + Math.cos(a) * rx * rad, c[1] + Math.sin(a) * rz * rad]);
    }
    const pares = conectarPolilineaTerreno(pts, 2.5, 20);
    crearTrazoLineas(pares, color, 3.8, true, manchasGroup);
  });

  // B. Frentes de Colonización y Borde Informal hacia zonas de riesgo
  const frenteColonizacionPares = [];
  {
    const frentes = [
      { c: TB_PUEBLO, dx: 380, dz: -180 },
      { c: PUNTA_ARENA, dx: -220, dz: 360 },
      { c: BOCACHICA, dx: -280, dz: -320 },
    ];
    frentes.forEach(({ c, dx, dz }) => {
      const p0 = [c[0] - dx, c[1] - dz];
      const p1 = [c[0] + dx, c[1] + dz];
      const pares = conectarPolilineaTerreno([p0, p1], 3.0, 16);
      frenteColonizacionPares.push(...pares);
    });
  }
  const frentesLine = crearTrazoLineas(frenteColonizacionPares, 0xef4444, 4.8, true, antropicaGroup);

  // C. Trazas de Movilidad Real: Senderos y Líneas de Deseo Peatonales
  const deseoSenderos = [
    [TB_PUEBLO, PUNTA_ARENA],
    [PUNTA_ARENA, CANO_ORO],
    [CANO_ORO, BOCACHICA],
    [TB_PUEBLO, MESETA_CENTRO],
    [BOCACHICA, MESETA_CENTRO],
    [BOCACHICA, SAN_FERNANDO],
  ];
  const deseoPares = [];
  deseoSenderos.forEach(([pA, pB]) => {
    const pts = [];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = (1 - t) * pA[0] + t * pB[0] + Math.sin(t * Math.PI * 2) * 80;
      const z = (1 - t) * pA[1] + t * pB[1] + Math.cos(t * Math.PI * 3) * 60;
      pts.push([x, z]);
    }
    const pares = conectarPolilineaTerreno(pts, 2.8, 20);
    deseoPares.push(...pares);
  });
  const deseoLine = crearTrazoLineas(deseoPares, 0xfbbf24, 4.2, true, antropicaGroup);

  // D. Nodos de Intensidad y Espacios Relacionales
  const nodosRelacionales = [
    { n: 'Plaza y Tiendas Esquineras', sub: 'Foco de encuentro colectivo y árbol sombreador', pos: TB_PUEBLO, c: '#f59e0b', code: '[part_6, part_18]' },
    { n: 'Zona de Intercambio y Venta de Pescado', sub: 'Microeconomía pesquera y playa de lanchas', pos: PUNTA_ARENA, c: '#f59e0b', code: '[part_60, part_81]' },
    { n: 'Secado de Redes y Caleta Artesanal', sub: 'Reparación de artes de pesca comunitaria', pos: CANO_ORO, c: '#10b981', code: '[part_19, part_151]' },
    { n: 'Atractor Festivo y Muelle Mayor', sub: 'Encuentro barrial frente a murallas patrimoniales', pos: BOCACHICA, c: '#f59e0b', code: '[part_6, part_130]' },
  ];
  nodosRelacionales.forEach(({ n, sub, pos, c, code }) => {
    crearBadge(n.toUpperCase(), sub, pos[0], pos[1], 65, c, code, antropicaGroup);
  });

  // E. Fondos Vacantes y Terrenos de Oportunidad (Terrains Vagues)
  const vaciosExpectantes = [
    {
      n: 'Vacío Expectante Central',
      sub: 'Reserva conectora y suelo de oportunidad entre TB y Bocachica',
      pos: [MESETA_CENTRO[0] - 200, MESETA_CENTRO[1] + 900],
      c: '#38bdf8',
      code: '[part_113, part_160]',
    },
    {
      n: 'Borde de Fricción Social y Patrimonio',
      sub: 'Tensión entre autoconstrucción, avance del mar y murallas militares',
      pos: [SAN_FERNANDO[0] - 120, SAN_FERNANDO[1] + 160],
      c: '#ef4444',
      code: '[part_29, part_167]',
    },
  ];
  vaciosExpectantes.forEach(({ n, sub, pos, c, code }) => {
    crearBadge(n.toUpperCase(), sub, pos[0], pos[1], 85, c, code, antropicaGroup);
  });

  // Agrupar todos los materiales para control de opacidad suave
  const matsPorCapa = {
    marina: [
      pleamarLine?.mat,
      bajamarLine?.mat,
      intermLine?.mat,
      surgeLine50?.mat,
      surgeLine100?.mat,
      erosionLine?.mat,
      ...oleajeMeshes.map((o) => o.mesh.material),
      ...alisiosMeshes.map((a) => a.mesh.material),
    ].filter(Boolean),
    topo: [
      curvasLine?.mat,
      arroyosLine?.mat,
      ...pondRings.map((p) => p.material),
      ...runoffAnimables.map((r) => r.mesh.material),
      techoMat,
    ].filter(Boolean),
    biotica: [
      bufferLine?.mat,
      ...bioticaRings.map((b) => b.material),
    ].filter(Boolean),
    antropica: [
      frentesLine?.mat,
      deseoLine?.mat,
      ...manchasGroup.children.map((c) => c.material),
    ].filter(Boolean),
  };

  const badgesPorCapa = {
    marina: badges.filter((b) => marinaGroup.children.includes(b)),
    topo: badges.filter((b) => topoGroup.children.includes(b)),
    biotica: badges.filter((b) => bioticaGroup.children.includes(b)),
    antropica: badges.filter((b) => antropicaGroup.children.includes(b)),
  };

  // Estados de opacidad interna
  const opacidades = {
    marina: 0,
    topo: 0,
    biotica: 0,
    antropica: 0,
  };

  // ===========================================================================
  // BUCLE DE ACTUALIZACIÓN ANIMADA (Llamado cada cuadro en tick())
  // ===========================================================================
  function actualizar(dt, t, cartoCapa) {
    if (cartoCapa === undefined || cartoCapa < 0) {
      // Si no estamos en el capítulo de cartografía, apagar todo
      if (rootGroup.visible) {
        rootGroup.visible = false;
        Object.keys(opacidades).forEach((k) => (opacidades[k] = 0));
      }
      return;
    }

    rootGroup.visible = true;

    // Determinar opacidad objetivo según la capa activa:
    //  0: Despiece Integral / Síntesis Multicapa (todas activas con balance)
    //  1: Marina y Flujos
    //  2: Topo-Hídrica
    //  3: Biótica
    //  4: Antrópica
    const objOp = {
      marina: cartoCapa === 0 ? 0.65 : cartoCapa === 1 ? 1.0 : 0.0,
      topo: cartoCapa === 0 ? 0.60 : cartoCapa === 2 ? 1.0 : 0.0,
      biotica: cartoCapa === 0 ? 0.60 : cartoCapa === 3 ? 1.0 : 0.0,
      antropica: cartoCapa === 0 ? 0.65 : cartoCapa === 4 ? 1.0 : 0.0,
    };

    // Interpolación suave de opacidad
    const kOp = 1 - Math.exp(-dt * 5.5);
    ['marina', 'topo', 'biotica', 'antropica'].forEach((capaKey) => {
      opacidades[capaKey] += (objOp[capaKey] - opacidades[capaKey]) * kOp;
      const op = opacidades[capaKey];

      // Actualizar materiales de línea y malla
      matsPorCapa[capaKey].forEach((m) => {
        m.opacity = op * (m.userData?.kMax ?? 0.95);
      });

      // Actualizar badges
      badgesPorCapa[capaKey].forEach((b) => {
        b.material.opacity = op;
        // Leve respiración / flotación vertical
        b.position.y = b.userData.baseY + Math.sin(t * 2.2 + b.position.x * 0.002) * 3.5;
      });
    });

    // 1) Animar trenes de oleaje y corrientes de deriva
    if (opacidades.marina > 0.02) {
      oleajeMeshes.forEach((o) => {
        const distAvance = (t * o.vel) % 800;
        o.mesh.position.copy(o.basePos).addScaledVector(o.dir, distAvance);
        // Oscilación vertical suave
        o.mesh.position.y = 3.0 + Math.sin(t * 3.0 + o.basePos.x * 0.01) * 1.2;
      });

      // Vientos alisios
      alisiosMeshes.forEach((a) => {
        const distAvance = (t * a.vel) % 1600;
        a.mesh.position.copy(a.basePos).addScaledVector(a.dir, distAvance);
      });

      // Desplazamiento de rayas punteadas (dashOffset)
      if (bajamarLine?.mat) bajamarLine.mat.dashOffset = -t * 45;
      if (surgeLine50?.mat) surgeLine50.mat.dashOffset = -t * 35;
      if (surgeLine100?.mat) surgeLine100.mat.dashOffset = -t * 30;
      if (intermLine?.mat) intermLine.mat.opacity = opacidades.marina * (0.6 + 0.3 * Math.sin(t * 3.5));
    }

    // 2) Animar escorrentías pluviales downhill
    if (opacidades.topo > 0.02) {
      runoffAnimables.forEach((r) => {
        const u = (t * r.vel + r.fase) % 1;
        const idx = Math.min(r.pts.length - 2, Math.floor(u * (r.pts.length - 1)));
        const frac = u * (r.pts.length - 1) - idx;
        const p0 = r.pts[idx];
        const p1 = r.pts[idx + 1];
        const x = p0[0] + (p1[0] - p0[0]) * frac;
        const z = p0[1] + (p1[1] - p0[1]) * frac;
        const y = heightAtXZ(x, z) + 3.0;
        r.mesh.position.set(x, y, z);
      });

      // Pulsar anillos de ponds
      const pulPond = 1 + 0.08 * Math.sin(t * 2.8);
      pondRings.forEach((p) => {
        p.scale.set(pulPond, pulPond, 1);
      });
    }

    // 3) Animar anillos bióticos
    if (opacidades.biotica > 0.02) {
      const pulBio = 1 + 0.05 * Math.sin(t * 2.0);
      bioticaRings.forEach((b) => {
        b.scale.set(pulBio, pulBio, 1);
      });
    }

    // 4) Animar líneas de deseo peatonales
    if (opacidades.antropica > 0.02) {
      if (deseoLine?.mat) deseoLine.mat.dashOffset = -t * 50;
      if (frentesLine?.mat) frentesLine.mat.dashOffset = -t * 30;
    }
  }

  return {
    rootGroup,
    marinaGroup,
    topoGroup,
    bioticaGroup,
    antropicaGroup,
    actualizar,
  };
}
