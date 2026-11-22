import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

// ============================================================================
// CARTOGRAFÍA OPERATIVA MULTICAPA · DESPIECE AXONOMÉTRICO DE TIERRA BOMBA
// «Cartografiar el lugar no es para describirlo, sino para iniciar su transformación» [part_92, part_126]
// «Antes de las estrategias, debes mostrar tu mapa descompuesto en sus vectores y capas activas» [part_10, part_33, part_92]
// ============================================================================

export const CAPAS_AXO = [
  {
    id: 'marina',
    nivel: 0,
    nombre: 'Capa Marina y Flujos',
    subtitulo: 'Mareas altas/bajas, corrientes litorales y frentes de erosión',
    color: '#38bdf8',
    colorHex: '56, 189, 248',
    cita: '[part_92, part_156]',
    icono: '🌊',
    resumen: 'Dinámica hidrodinámica del Caribe y la Bahía de Cartagena en colisión directa con el borde insular.',
    diagnostico:
      'El mar no es un límite pasivo, sino un vector de energía continua. La combinación de marea astronómica (0,20 m), sobreelevación de tormenta (0,20 m) y marea de leva (trepada de ola de +1,3 m) acelera la socavación basal de los acantilados blandos. El borde cede entre 0,63 m y 3,0 m cada año en los frentes expuestos.',
    vectores: [
      {
        id: 'mareas',
        nombre: 'Mareas altas / bajas & Franja Intermareal',
        tipo: 'oscilacion',
        icono: '〰️',
        metrica: '+0,20 m marea +0,20 m tormenta (+1,3 m leva)',
        coords: [-0.62, 0.15],
        detalle:
          'Franja intermareal dinámica que oscila dos veces al día. En mareas vivas y mar de leva el agua penetra por las cotas bajas conectadas, saturando el subsuelo y desestabilizando cimientos.',
        cita: '[part_92, part_156]',
      },
      {
        id: 'corrientes',
        nombre: 'Corrientes Litorales y Deriva N-S',
        tipo: 'flujo',
        icono: '↗️',
        metrica: 'Deriva litoral neta SSE · 0,4–0,8 m/s',
        coords: [-0.75, -0.2],
        detalle:
          'Vectores de transporte de sedimentos generados por los alisios del noreste y el tren de olas del Caribe. Arrastran los sedimentos erosionados hacia el canal de Bocachica sin reabastecer las playas.',
        cita: '[part_92, part_156]',
      },
      {
        id: 'frentes_erosion',
        nombre: 'Frentes Críticos de Erosión Costera',
        tipo: 'impacto',
        icono: '⚡',
        metrica: 'Punta Arena (3,0 m/año) y Borde Oeste (1,8 m/año)',
        coords: [-0.68, 0.45],
        detalle:
          'Áreas de quiebre directo donde el choque mecánico del oleaje ha destruido espolones artesanales y amenaza 891 viviendas en la franja de 30 años (INVEMAR-CDKN 2012).',
        cita: '[part_92, part_156]',
      },
    ],
  },
  {
    id: 'topohidrica',
    nivel: 1,
    nombre: 'Capa Topo-Hídrica',
    subtitulo: 'Cuencas naturales de escorrentía, acuíferos subterráneos y cotas de riesgo',
    color: '#2dd4bf',
    colorHex: '45, 212, 191',
    cita: '[part_160]',
    icono: '💧',
    resumen: 'Morfología del relieve insular, drenajes pluviales y reservas freáticas en roca calcárea.',
    diagnostico:
      'La isla articula un relieve dual: una meseta alta segura (+22 a +30 msnm) de roca calcárea fósil y una franja baja inundable (< +2 msnm). Las lluvias torrenciales generan escorrentías radiales que bajan a gran velocidad, erosionando quebradas y arrastrando suelo hacia el mar por falta de terrazas y aljibes retenedores.',
    vectores: [
      {
        id: 'cuencas',
        nombre: 'Cuencas Naturales de Escorrentía',
        tipo: 'drenaje',
        icono: '🌧️',
        metrica: '6 microcuencas radiales principales',
        coords: [0.05, 0.1],
        detalle:
          'Drenajes naturales que canalizan el agua de lluvia desde el espinazo de la meseta hacia las ensenadas de Caño del Oro y Bocachica, causando cárcavas de erosión laminar.',
        cita: '[part_160]',
      },
      {
        id: 'acuiferos',
        nombre: 'Acuíferos Subterráneos y Aljibes',
        tipo: 'reserva',
        icono: '🪨',
        metrica: 'Lentejas freáticas en roca calcárea · aljibes coloniales',
        coords: [0.15, -0.15],
        detalle:
          'Capas freáticas subterráneas alimentadas por infiltración en la meseta. Históricamente aprovechadas en aljibes y pozos comunitarios, hoy en riesgo de salinización por intrusión marina.',
        cita: '[part_160]',
      },
      {
        id: 'cotas_riesgo',
        nombre: 'Cotas de Riesgo vs. Meseta Segura',
        tipo: 'limite',
        icono: '📐',
        metrica: 'Franja crítica (< +2 m) vs Meseta segura (+22 m)',
        coords: [-0.3, 0.25],
        detalle:
          'Cota +0,61 m marca el ascenso a 30 años (RCP 4.5); cota +2,0 m delimita la zona de contingencia por tormentas; la meseta a +22 m alberga el polígono de reasentamiento seguro de la tesis.',
        cita: '[part_160]',
      },
    ],
  },
  {
    id: 'biotica',
    nivel: 2,
    nombre: 'Capa Biótica',
    subtitulo: 'Vegetación nativa resistente a salinidad y bordes de amortiguamiento',
    color: '#4ade80',
    colorHex: '74, 222, 128',
    cita: '[part_160]',
    icono: '🌿',
    resumen: 'Armadura ecosistémica viva: bosques secos, manglares halófitos y bordes de disipación.',
    diagnostico:
      'La cobertura biótica es la primera defensa bio-mecánica contra la erosión marina y eólica. Los manglares (Rhizophora mangle, Avicennia germinans) estabilizan orillas y disipan hasta el 66% de la fuerza del oleaje en ensenadas, mientras que el bosque seco tropical en la meseta previene el lavado del suelo fértil.',
    vectores: [
      {
        id: 'vegetacion_salina',
        nombre: 'Vegetación Halófita & Bosque Seco Tropical',
        tipo: 'cobertura',
        icono: '🌱',
        metrica: 'Mangle rojo, mangle negro, uvita de playa, trupillo',
        coords: [0.35, -0.3],
        detalle:
          'Especies nativas hiper-resistentes a salinidad extrema, estrés hídrico y vientos marinos. Sus sistemas radiculares aéreos y profundos anclan las partículas de arena y limo.',
        cita: '[part_160]',
      },
      {
        id: 'amortiguamiento_eco',
        nombre: 'Bordes de Amortiguamiento Ecosistémico',
        tipo: 'proteccion',
        icono: '🛡️',
        metrica: 'Franjas de 50 a 150 m en Caño del Oro y Bocachica',
        detalle:
          'Zonas de humedal salino y cordones de manglar que actúan como rompeolas naturales absorbiendo la energía cinética de las marejadas antes de llegar a los poblados.',
        cita: '[part_160]',
      },
      {
        id: 'suelo_degradado',
        nombre: 'Zonas de Desmonte y Salinización Crítica',
        tipo: 'alerta',
        icono: '⚠️',
        metrica: '185 ha con pérdida severa de biomasa',
        coords: [-0.4, 0.4],
        detalle:
          'Sectores desprovistos de vegetación por tala y pastoreo de caprinos; al perder la raíz protectora, el terreno se cuartea y cae en bloques ante las olas.',
        cita: '[part_160]',
      },
    ],
  },
  {
    id: 'antropica',
    nivel: 3,
    nombre: 'Capa Antrópica',
    subtitulo: 'Trayectorias comunitarias, senderos informales y núcleos de pescadores',
    color: '#ff6b4a',
    colorHex: '255, 107, 74',
    cita: '[part_18, part_92]',
    icono: '🏘️',
    resumen: 'Apropiación comunitaria del territorio: asentamientos costeros, rutas acuáticas y caminería viva.',
    diagnostico:
      'Tierra Bomba vive de cara al mar pero bajo su amenaza directa. Sus cuatro asentamientos históricos (Tierra Bomba, Punta Arena, Caño del Oro y Bocachica) agrupan a más de 2.600 construcciones en bordes bajos nacidos de la actividad pesquera y del acceso a muelles hacia Cartagena (614 viajes diarios en lancha).',
    vectores: [
      {
        id: 'trayectorias_com',
        nombre: 'Trayectorias Comunitarias y Conexión Náutica',
        tipo: 'red',
        icono: '🚤',
        metrica: '614 viajes diarios en lancha (estudio 2014) · Bocagrande/Bazurto',
        coords: [0.65, 0.55],
        detalle:
          'Líneas de vida marítimas que unen la isla con los centros de trabajo, salud, abastecimiento y educación en Cartagena; el muelle es el corazón funcional del asentamiento.',
        cita: '[part_18, part_92]',
      },
      {
        id: 'senderos_inf',
        nombre: 'Senderos Informales y Conectores de Moto',
        tipo: 'trama',
        icono: '🚶',
        metrica: '138 km de caminos peatonales y de tierra (OSM)',
        coords: [-0.05, -0.05],
        detalle:
          'Red dendrítica espontánea sin asfalto que cosen barrios, fincas y aljibes sobre el terreno natural, revelando la lógica peatonal genuina de la comunidad.',
        cita: '[part_18, part_92]',
      },
      {
        id: 'nucleos_pesca',
        nombre: 'Núcleos de Pescadores y Asentamientos de Borde',
        tipo: 'habitar',
        icono: '⚓',
        metrica: '4 poblados · 2.600 construcciones · 96,7% pobreza',
        coords: [-0.55, 0.6],
        detalle:
          'Concentraciones habitadas en contacto inmediato con el agua salada. 891 viviendas están en riesgo inminente de desaparición física en los próximos 30 años.',
        cita: '[part_18, part_92]',
      },
    ],
  },
];

// Silueta esquemática del contorno de Tierra Bomba (coordenadas locales normalizadas)
const CONTORNO_ISLA = [
  [-0.6, 0.72], [-0.4, 0.76], [-0.15, 0.7], [0.1, 0.65], [0.45, 0.62], [0.65, 0.45],
  [0.55, 0.25], [0.38, 0.05], [0.42, -0.2], [0.3, -0.45], [0.15, -0.65], [-0.05, -0.8],
  [-0.3, -0.75], [-0.45, -0.55], [-0.52, -0.3], [-0.62, -0.05], [-0.72, 0.25], [-0.75, 0.5],
  [-0.6, 0.72],
];

// Polígono de la Meseta Central (+22m cota de seguridad)
const CONTORNO_MESETA = [
  [-0.2, 0.35], [0.1, 0.3], [0.25, 0.1], [0.18, -0.15], [-0.05, -0.28], [-0.25, -0.1], [-0.28, 0.15], [-0.2, 0.35],
];

// Los 4 poblados en coordenadas locales
const NUCLEOS_POBLADOS = [
  { id: 'tb', nombre: 'Tierra Bomba', x: -0.52, y: 0.62, casas: 770 },
  { id: 'pa', nombre: 'Punta Arena', x: 0.52, y: 0.5, casas: 385 },
  { id: 'co', nombre: 'Caño del Oro', x: 0.32, y: -0.1, casas: 441 },
  { id: 'bc', nombre: 'Bocachica', x: -0.2, y: -0.68, casas: 1004 },
];

export default function CartografiaMulticapa() {
  const canvasRef = useRef(null);
  const animRef = useRef(0);

  // Estados interactivos
  const [separacion, setSeparacion] = useState(1.0); // 0 (colapsado) a 1 (despiece total)
  const [capasVisibles, setCapasVisibles] = useState({
    marina: true,
    topohidrica: true,
    biotica: true,
    antropica: true,
  });
  const [vectorSeleccionado, setVectorSeleccionado] = useState(CAPAS_AXO[0].vectores[2]); // Frente de erosión por defecto
  const [capaActiva, setCapaActiva] = useState(null); // null = todas
  const [anguloRot, setAnguloRot] = useState(32); // grados de inclinación
  const [animando, setAnimando] = useState(true);
  const [vistaModo, setVistaModo] = useState('axo'); // 'axo', 'cenital', 'lateral'

  // Alternar capa visible
  const toggleCapa = (id) => {
    setCapasVisibles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Aislar capa
  const aislarCapa = (id) => {
    if (capaActiva === id) {
      setCapaActiva(null);
      setCapasVisibles({ marina: true, topohidrica: true, biotica: true, antropica: true });
    } else {
      setCapaActiva(id);
      setCapasVisibles({
        marina: id === 'marina',
        topohidrica: id === 'topohidrica',
        biotica: id === 'biotica',
        antropica: id === 'antropica',
      });
      // Seleccionar el primer vector de esa capa
      const c = CAPAS_AXO.find((x) => x.id === id);
      if (c) setVectorSeleccionado(c.vectores[0]);
    }
  };

  // Renderizado gráfico Axonométrico interactivo en Canvas
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    let t0 = performance.now();

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const render = (time) => {
      if (animando) {
        animRef.current = requestAnimationFrame(render);
      }
      const dt = (time - t0) * 0.001;

      const rect = cv.getBoundingClientRect();
      const w = Math.round(rect.width * DPR);
      const h = Math.round(rect.height * DPR);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      // Fondo técnico arquitectónico oscuro con rejilla sutil
      ctx.fillStyle = '#06090c';
      ctx.fillRect(0, 0, w, h);

      // Rejilla de fondo paramétrica
      ctx.strokeStyle = 'rgba(214, 230, 236, 0.04)';
      ctx.lineWidth = 1 * DPR;
      const gridStep = 45 * DPR;
      for (let gx = 0; gx < w; gx += gridStep) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Parámetros de proyección axonométrica
      const angRad = (anguloRot * Math.PI) / 180;
      const cosA = Math.cos(angRad);
      const sinA = Math.sin(angRad);
      const aspectY = vistaModo === 'cenital' ? 1.0 : vistaModo === 'lateral' ? 0.08 : 0.52;

      const escalaBase = Math.min(w * 0.42, h * 0.46);
      const centroX = w * 0.46;
      const centroY = h * (vistaModo === 'cenital' ? 0.5 : 0.62);

      // Distancia vertical entre estratos (separación por despiece axonométrico)
      const pasoZ = (vistaModo === 'cenital' ? 0 : 88 * DPR) * separacion;

      // Función de proyección local 2D (x,y) + estrato (z) -> pantalla (px, py)
      const proyectar = (lx, ly, nivelZ) => {
        const rx = lx * cosA - ly * sinA;
        const ry = lx * sinA + ly * cosA;
        const px = centroX + rx * escalaBase;
        const py = centroY + ry * escalaBase * aspectY - nivelZ * pasoZ;
        return [px, py];
      };

      // 1. Dibujar líneas guía verticales de despiece axonométrico entre esquinas del territorio
      if (separacion > 0.08 && vistaModo !== 'cenital') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1 * DPR;
        ctx.setLineDash([3 * DPR, 4 * DPR]);

        const esquinas = [
          [-0.8, -0.85],
          [0.75, -0.85],
          [0.75, 0.85],
          [-0.8, 0.85],
        ];

        esquinas.forEach(([ex, ey]) => {
          const [p0x, p0y] = proyectar(ex, ey, 0);
          const [p3x, p3y] = proyectar(ex, ey, 3);
          ctx.beginPath();
          ctx.moveTo(p0x, p0y);
          ctx.lineTo(p3x, p3y);
          ctx.stroke();
        });

        // Guías de los núcleos habitados principales
        NUCLEOS_POBLADOS.forEach((np) => {
          const [p0x, p0y] = proyectar(np.x, np.y, 0);
          const [p3x, p3y] = proyectar(np.x, np.y, 3);
          ctx.strokeStyle = 'rgba(255, 107, 74, 0.18)';
          ctx.beginPath();
          ctx.moveTo(p0x, p0y);
          ctx.lineTo(p3x, p3y);
          ctx.stroke();
        });
        ctx.restore();
      }

      // 2. Renderizar cada capa en orden estratigráfico (0: Marina -> 1: Topo-Hídrica -> 2: Biótica -> 3: Antrópica)
      CAPAS_AXO.forEach((capa) => {
        if (!capasVisibles[capa.id]) return;

        const nivel = capa.nivel;
        const esActiva = !capaActiva || capaActiva === capa.id;
        const alfaCapa = esActiva ? 1.0 : 0.22;

        ctx.save();
        ctx.globalAlpha = alfaCapa;

        // Plano base transparente del estrato (plataforma axonométrica)
        const esquinasPlataforma = [
          [-0.82, -0.88],
          [0.78, -0.88],
          [0.78, 0.88],
          [-0.82, 0.88],
        ];
        ctx.beginPath();
        esquinasPlataforma.forEach(([px, py], i) => {
          const [sx, sy] = proyectar(px, py, nivel);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.fillStyle = `rgba(${capa.colorHex}, 0.025)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${capa.colorHex}, 0.22)`;
        ctx.lineWidth = 1 * DPR;
        ctx.stroke();

        // Rótulo del estrato a la izquierda
        const [labelX, labelY] = proyectar(-0.84, 0.88, nivel);
        ctx.fillStyle = capa.color;
        ctx.font = `600 ${10 * DPR}px 'Geist Mono', monospace`;
        ctx.fillText(`ESTRATO ${capa.nivel + 1} // ${capa.nombre.toUpperCase()}`, labelX - 10 * DPR, labelY);

        // A. CAPA 0: MARINA Y FLUJOS
        if (capa.id === 'marina') {
          // Contorno de plataforma batimétrica
          ctx.beginPath();
          CONTORNO_ISLA.forEach(([ix, iy], i) => {
            const [sx, sy] = proyectar(ix * 1.15, iy * 1.15, nivel);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.setLineDash([2 * DPR, 3 * DPR]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Flechas de corrientes litorales animadas (Caribe exterior N->S)
          const numFlechas = 6;
          for (let f = 0; f < numFlechas; f++) {
            const avance = ((dt * 0.25 + f / numFlechas) % 1);
            const fx = -0.76 - f * 0.03;
            const fy = 0.7 - avance * 1.4;
            const [flx, fly] = proyectar(fx, fy, nivel);
            const [flx2, fly2] = proyectar(fx + 0.03, fy - 0.12, nivel);

            ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
            ctx.lineWidth = 1.8 * DPR;
            ctx.beginPath();
            ctx.moveTo(flx, fly);
            ctx.lineTo(flx2, fly2);
            ctx.stroke();

            // Punta de flecha
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(flx2, fly2, 2.5 * DPR, 0, Math.PI * 2);
            ctx.fill();
          }

          // Arcos de erosión crítica pulsantes (Punta Arena y Frente Oeste)
          const frentes = [
            { x: -0.68, y: 0.45, r: 0.14 },
            { x: 0.52, y: 0.52, r: 0.1 },
            { x: -0.65, y: -0.05, r: 0.12 },
          ];
          const pulsoErosion = 0.5 + 0.5 * Math.sin(dt * 3.5);
          frentes.forEach((fr) => {
            const [cx, cy] = proyectar(fr.x, fr.y, nivel);
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + 0.45 * pulsoErosion})`;
            ctx.lineWidth = 2.2 * DPR;
            ctx.beginPath();
            ctx.arc(cx, cy, (14 + pulsoErosion * 8) * DPR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx, cy, 3 * DPR, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        // B. CAPA 1: TOPO-HÍDRICA
        if (capa.id === 'topohidrica') {
          // Isolíneas del relieve insular
          [1.0, 0.75, 0.5].forEach((escalaRel, idx) => {
            ctx.beginPath();
            CONTORNO_ISLA.forEach(([ix, iy], i) => {
              const [sx, sy] = proyectar(ix * escalaRel, iy * escalaRel, nivel);
              if (i === 0) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            });
            ctx.closePath();
            ctx.strokeStyle = idx === 0 ? 'rgba(45, 212, 191, 0.5)' : 'rgba(45, 212, 191, 0.25)';
            ctx.lineWidth = 1 * DPR;
            ctx.stroke();
          });

          // Meseta segura a +22m destacada
          ctx.beginPath();
          CONTORNO_MESETA.forEach(([mx, my], i) => {
            const [msx, msy] = proyectar(mx, my, nivel);
            if (i === 0) ctx.moveTo(msx, msy);
            else ctx.lineTo(msx, msy);
          });
          ctx.closePath();
          ctx.fillStyle = 'rgba(45, 212, 191, 0.18)';
          ctx.fill();
          ctx.strokeStyle = '#2dd4bf';
          ctx.lineWidth = 1.8 * DPR;
          ctx.stroke();

          // Cuencas y líneas de escorrentía hacia las costas
          const lineasDrenaje = [
            [[0.0, 0.15], [-0.4, 0.4]],
            [[0.05, 0.0], [0.35, -0.08]],
            [[-0.05, -0.1], [-0.15, -0.6]],
            [[0.1, 0.2], [0.45, 0.45]],
          ];
          lineasDrenaje.forEach(([pA, pB]) => {
            const [ax, ay] = proyectar(pA[0], pA[1], nivel);
            const [bx, by] = proyectar(pB[0], pB[1], nivel);
            ctx.strokeStyle = 'rgba(45, 212, 191, 0.7)';
            ctx.lineWidth = 1.6 * DPR;
            ctx.setLineDash([4 * DPR, 3 * DPR]);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
            ctx.setLineDash([]);
          });

          // Puntos de aljibes / pozos de agua dulce
          const aljibes = [[0.05, 0.12], [-0.12, 0.02], [0.18, -0.25]];
          aljibes.forEach(([ax, ay]) => {
            const [asx, asy] = proyectar(ax, ay, nivel);
            ctx.fillStyle = '#2dd4bf';
            ctx.beginPath();
            ctx.arc(asx, asy, 3.5 * DPR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(45, 212, 191, 0.6)';
            ctx.lineWidth = 1 * DPR;
            ctx.stroke();
          });
        }

        // C. CAPA 2: BIÓTICA
        if (capa.id === 'biotica') {
          // Silueta de base ecológica
          ctx.beginPath();
          CONTORNO_ISLA.forEach(([ix, iy], i) => {
            const [sx, sy] = proyectar(ix, iy, nivel);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.fillStyle = 'rgba(74, 222, 128, 0.07)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
          ctx.lineWidth = 1.2 * DPR;
          ctx.stroke();

          // Manchas de manglares halófitos (Caño del Oro y ciénagas)
          const manchasManglar = [
            { x: 0.35, y: -0.15, rx: 0.14, ry: 0.1 },
            { x: -0.15, y: -0.65, rx: 0.1, ry: 0.08 },
            { x: 0.45, y: 0.38, rx: 0.08, ry: 0.08 },
          ];
          manchasManglar.forEach((m) => {
            const [mx, my] = proyectar(m.x, m.y, nivel);
            ctx.fillStyle = 'rgba(74, 222, 128, 0.32)';
            ctx.beginPath();
            ctx.ellipse(mx, my, m.rx * escalaBase, m.ry * escalaBase * aspectY, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 1.5 * DPR;
            ctx.stroke();
          });

          // Franjas de amortiguamiento bio-mecánico en la costa
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
          ctx.lineWidth = 2.5 * DPR;
          ctx.setLineDash([5 * DPR, 4 * DPR]);
          ctx.beginPath();
          CONTORNO_ISLA.slice(4, 11).forEach(([ix, iy], i) => {
            const [sx, sy] = proyectar(ix * 0.96, iy * 0.96, nivel);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // D. CAPA 3: ANTRÓPICA
        if (capa.id === 'antropica') {
          // Silueta territorial
          ctx.beginPath();
          CONTORNO_ISLA.forEach(([ix, iy], i) => {
            const [sx, sy] = proyectar(ix, iy, nivel);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 107, 74, 0.06)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 107, 74, 0.45)';
          ctx.lineWidth = 1.2 * DPR;
          ctx.stroke();

          // Red de senderos informales entre poblados
          const senderos = [
            [NUCLEOS_POBLADOS[0], NUCLEOS_POBLADOS[1]],
            [NUCLEOS_POBLADOS[1], NUCLEOS_POBLADOS[2]],
            [NUCLEOS_POBLADOS[2], NUCLEOS_POBLADOS[3]],
            [NUCLEOS_POBLADOS[0], NUCLEOS_POBLADOS[3]],
            [NUCLEOS_POBLADOS[0], { x: 0.0, y: 0.1 }],
            [{ x: 0.0, y: 0.1 }, NUCLEOS_POBLADOS[2]],
          ];
          ctx.strokeStyle = 'rgba(255, 107, 74, 0.55)';
          ctx.lineWidth = 1.4 * DPR;
          senderos.forEach(([p1, p2]) => {
            const [x1, y1] = proyectar(p1.x, p1.y, nivel);
            const [x2, y2] = proyectar(p2.x, p2.y, nivel);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          });

          // Rutas náuticas hacia Cartagena (líneas curvas con pulsos)
          const rutasLanchas = [
            { origen: NUCLEOS_POBLADOS[1], destino: [0.85, 0.8] }, // Punta Arena -> Bocagrande
            { origen: NUCLEOS_POBLADOS[0], destino: [0.82, 0.95] }, // TB -> Bocagrande/Bodeguita
            { origen: NUCLEOS_POBLADOS[3], destino: [0.75, -0.4] }, // Bocachica
          ];
          rutasLanchas.forEach((r, idx) => {
            const [ox, oy] = proyectar(r.origen.x, r.origen.y, nivel);
            const [dx, dy] = proyectar(r.destino[0], r.destino[1], nivel);
            ctx.strokeStyle = 'rgba(255, 180, 150, 0.4)';
            ctx.lineWidth = 1.2 * DPR;
            ctx.setLineDash([4 * DPR, 4 * DPR]);
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.quadraticCurveTo((ox + dx) / 2, oy - 20 * DPR, dx, dy);
            ctx.stroke();
            ctx.setLineDash([]);

            // Barquito / partícula animada de trayectorias
            const posK = ((dt * 0.35 + idx * 0.33) % 1);
            const bx = ox + (dx - ox) * posK;
            const by = oy + (dy - oy) * posK - 10 * Math.sin(posK * Math.PI) * DPR;
            ctx.fillStyle = '#ff6b4a';
            ctx.beginPath();
            ctx.arc(bx, by, 3 * DPR, 0, Math.PI * 2);
            ctx.fill();
          });

          // Núcleos habitados con etiqueta y halo
          NUCLEOS_POBLADOS.forEach((np) => {
            const [px, py] = proyectar(np.x, np.y, nivel);
            const radio = Math.sqrt(np.casas) * 0.65 * DPR;

            ctx.fillStyle = 'rgba(255, 107, 74, 0.25)';
            ctx.beginPath();
            ctx.arc(px, py, radio * 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff6b4a';
            ctx.beginPath();
            ctx.arc(px, py, radio * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e8eef0';
            ctx.font = `600 ${11 * DPR}px 'Geist Mono', monospace`;
            ctx.fillText(np.nombre.toUpperCase(), px + radio + 6 * DPR, py + 4 * DPR);
          });
        }

        // Resaltar vector seleccionado si pertenece a esta capa
        if (vectorSeleccionado) {
          const capaDelVector = CAPAS_AXO.find((c) => c.vectores.some((v) => v.id === vectorSeleccionado.id));
          if (capaDelVector && capaDelVector.id === capa.id) {
            const [vx, vy] = proyectar(vectorSeleccionado.coords[0], vectorSeleccionado.coords[1], nivel);
            const pulso = 0.5 + 0.5 * Math.sin(dt * 4);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 * DPR;
            ctx.beginPath();
            ctx.arc(vx, vy, (12 + pulso * 6) * DPR, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = capa.color;
            ctx.beginPath();
            ctx.arc(vx, vy, 5 * DPR, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      });

      // Brújula / Rosa de los vientos axonométrica técnica en la esquina inferior izquierda
      ctx.save();
      const compX = 45 * DPR;
      const compY = h - 45 * DPR;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2 * DPR;

      const [norteDx, norteDy] = [Math.sin(angRad) * 22 * DPR, -Math.cos(angRad) * 22 * DPR * aspectY];
      ctx.beginPath();
      ctx.moveTo(compX, compY);
      ctx.lineTo(compX + norteDx, compY + norteDy);
      ctx.stroke();

      ctx.fillStyle = '#ff6b4a';
      ctx.font = `700 ${11 * DPR}px 'Geist Mono', monospace`;
      ctx.fillText('N', compX + norteDx + 4 * DPR, compY + norteDy);
      ctx.restore();
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [separacion, capasVisibles, vectorSeleccionado, capaActiva, anguloRot, animando, vistaModo]);

  return (
    <div className="relative w-full bg-[#040607] text-[#e8eef0]">
      {/* 1. Cabecera Arquitectónica y Manifiesto de Cartografía Operativa */}
      <div className="relative border-b border-white/10 px-5 pb-10 pt-16 sm:px-12 lg:px-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-arcilla animate-pulse" />
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arcilla">
              01 · Cartografía Operativa Multicapa
            </p>
          </div>
          <span className="font-mono text-xs text-white/45">
            Marco Metodológico Proyectual [part_92, part_126]
          </span>
        </div>

        <h2 className="mt-4 font-['Barlow_Condensed'] text-4xl font-light uppercase tracking-tight sm:text-6xl lg:text-7xl">
          Despiece Axonométrico del Territorio
        </h2>

        {/* Cita fundacional en bloque tipográfico de alto impacto */}
        <div className="mt-6 border-l-2 border-arcilla bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xl font-medium leading-snug tracking-tight text-white sm:text-2xl lg:text-3xl">
            «Cartografiar el lugar no es para describirlo, sino para iniciar su transformación.»
          </p>
          <p className="mt-2 font-mono text-xs text-white/50">
            [part_92, part_126] · Tesis Planificación y adaptación territorial en Tierra Bomba
          </p>
        </div>

        <p className="mt-5 max-w-4xl text-base leading-relaxed text-white/80 sm:text-lg">
          Antes de formular cualquier estrategia de diseño, el territorio insular debe ser descompuesto en sus
          <strong> vectores y capas activas [part_10, part_33, part_92]</strong>. La vulnerabilidad no es un
          diagnóstico cerrado ni una imagen estática: es el resultado de la colisión permanente entre fluidos marinos,
          geomorfología hídrica, armaduras biológicas y dinámicas antrópicas de subsistencia.
        </p>
      </div>

      {/* 2. Barra de Control de Despiece Axonométrico & Modos de Visualización */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#080b0d]/90 px-5 py-3.5 backdrop-blur-md sm:px-12">
        {/* Controles de Capas (Multicapa Interactiva) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCapaActiva(null);
              setCapasVisibles({ marina: true, topohidrica: true, biotica: true, antropica: true });
            }}
            className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${
              !capaActiva ? 'bg-white text-black border-white' : 'border-white/20 text-white/70 hover:border-white/50'
            }`}
          >
            Ver Todas (4 Estratos)
          </button>

          {CAPAS_AXO.map((capa) => {
            const visible = capasVisibles[capa.id];
            const activa = capaActiva === capa.id;
            return (
              <button
                key={capa.id}
                type="button"
                onClick={() => aislarCapa(capa.id)}
                className="group flex items-center gap-2 font-mono text-xs px-2.5 py-1.5 rounded border transition-all"
                style={{
                  borderColor: visible ? capa.color : 'rgba(255,255,255,0.15)',
                  backgroundColor: activa ? capa.color : visible ? `rgba(${capa.colorHex}, 0.12)` : 'transparent',
                  color: activa ? '#000' : visible ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              >
                <span>{capa.icono}</span>
                <span>{capa.nombre}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCapa(capa.id);
                  }}
                  title={visible ? 'Ocultar capa' : 'Mostrar capa'}
                  className="ml-1 opacity-60 hover:opacity-100"
                >
                  {visible ? '👁️' : '🚫'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controles de Separación Axonométrica (Exploded View) */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-white/60">Despiece:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSeparacion(0)}
              className={`font-mono text-xs px-2.5 py-1 rounded border ${
                separacion === 0 ? 'bg-arcilla text-black border-arcilla' : 'border-white/20 text-white/60'
              }`}
            >
              Plano (0%)
            </button>
            <button
              type="button"
              onClick={() => setSeparacion(0.5)}
              className={`font-mono text-xs px-2.5 py-1 rounded border ${
                separacion === 0.5 ? 'bg-arcilla text-black border-arcilla' : 'border-white/20 text-white/60'
              }`}
            >
              Medio
            </button>
            <button
              type="button"
              onClick={() => setSeparacion(1.0)}
              className={`font-mono text-xs px-2.5 py-1 rounded border ${
                separacion === 1.0 ? 'bg-arcilla text-black border-arcilla' : 'border-white/20 text-white/60'
              }`}
            >
              Axonometría (100%)
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 border-l border-white/15 pl-3">
            <button
              type="button"
              onClick={() => setVistaModo(vistaModo === 'axo' ? 'cenital' : 'axo')}
              className="font-mono text-xs text-white/60 hover:text-white"
            >
              Vista: {vistaModo.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => setAnimando(!animando)}
              className="font-mono text-xs text-white/60 hover:text-white"
              title="Pausar o reanudar animación de vectores"
            >
              {animando ? '⏸️' : '▶️'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Escenario Principal: Visor Axonométrico + Ficha Técnica de Vectores Activos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[78svh]">
        {/* Lienzo Axonométrico 2.5D interactivo */}
        <div className="relative lg:col-span-8 min-h-[56svh] lg:min-h-[78svh] overflow-hidden bg-[#040607]">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />

          {/* Instrucción de uso flotante */}
          <div className="absolute top-4 left-4 pointer-events-none bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded font-mono text-[11px] text-white/60">
            <span>Arrastre vertical / Seleccione capas abajo para aislar estratos</span>
          </div>

          {/* Botones de rotación rápida de la axonometría */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 p-1.5 rounded">
            <span className="font-mono text-[10px] text-white/50 px-1">ÁNGULO:</span>
            {[15, 32, 45, 60].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => setAnguloRot(deg)}
                className={`font-mono text-xs px-2 py-0.5 rounded ${
                  anguloRot === deg ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* Panel Lateral: Ficha Operativa del Vector y Estrato Seleccionado */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#090d10] p-5 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-xs text-arcilla">VECTOR ACTIVO SELECCIONADO</span>
              <span className="font-mono text-xs text-white/40">{vectorSeleccionado?.cita || '[part_92]'}</span>
            </div>

            {vectorSeleccionado ? (
              <div className="mt-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{vectorSeleccionado.icono}</span>
                  <h3 className="text-xl font-semibold text-white leading-snug">
                    {vectorSeleccionado.nombre}
                  </h3>
                </div>

                <div className="mt-3 inline-block rounded bg-white/10 px-2.5 py-1 font-mono text-xs text-white/90">
                  Métrica: {vectorSeleccionado.metrica}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/80">
                  {vectorSeleccionado.detalle}
                </p>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                    Función Proyectual Operativa
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                    Este vector condiciona la implantación de las estrategias: delimita dónde no construir,
                    dónde fijar terrazas bio-mecánicas de retención y cómo preservar los corredores cotidianos de pesca.
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-white/50">Seleccione un vector o estrato para inspeccionar sus datos.</p>
            )}

            {/* Lista de Vectores Disponibles por Capa */}
            <div className="mt-8">
              <p className="font-mono text-[11px] uppercase tracking-wider text-white/50 mb-2.5">
                Desglose de Vectores por Capa
              </p>
              <div className="space-y-3 max-h-[34svh] overflow-y-auto pr-1">
                {CAPAS_AXO.map((capa) => (
                  <div key={capa.id} className="rounded border border-white/10 p-2.5 bg-black/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-semibold" style={{ color: capa.color }}>
                        {capa.icono} {capa.nombre}
                      </span>
                      <span className="font-mono text-[10px] text-white/40">{capa.cita}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {capa.vectores.map((vec) => (
                        <button
                          key={vec.id}
                          type="button"
                          onClick={() => {
                            setVectorSeleccionado(vec);
                            // Asegurar que la capa sea visible
                            if (!capasVisibles[capa.id]) toggleCapa(capa.id);
                          }}
                          className={`text-left text-xs px-2 py-1 rounded transition-colors ${
                            vectorSeleccionado?.id === vec.id
                              ? 'bg-white/20 text-white font-medium'
                              : 'text-white/60 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          • {vec.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-3">
            <p className="font-mono text-[11px] text-white/40">
              «Antes de las estrategias, el territorio se descompone en sus vectores activos para operar sobre ellos.»
            </p>
          </div>
        </div>
      </div>

      {/* 4. Diagnóstico Detallado de las 4 Capas Operativas en Tarjetas Técnicas */}
      <div className="border-t border-white/10 px-5 py-14 sm:px-12 lg:px-20 bg-[#06080a]">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-arcilla">
            Los Cuatro Estratos Territoriales
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl text-white">
            Lectura Operativa de Vulnerabilidades y Oportunidades
          </h3>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAPAS_AXO.map((capa) => (
            <div
              key={capa.id}
              className="rounded-lg border p-5 transition-all flex flex-col justify-between"
              style={{
                borderColor: `rgba(${capa.colorHex}, 0.28)`,
                backgroundColor: `rgba(${capa.colorHex}, 0.03)`,
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{capa.icono}</span>
                  <span className="font-mono text-xs text-white/45">{capa.cita}</span>
                </div>

                <h4 className="mt-3 text-lg font-semibold" style={{ color: capa.color }}>
                  {capa.nombre}
                </h4>
                <p className="font-mono text-[11px] text-white/55 mt-0.5">{capa.subtitulo}</p>

                <p className="mt-3 text-xs leading-relaxed text-white/75">{capa.diagnostico}</p>
              </div>

              <div className="mt-6 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => aislarCapa(capa.id)}
                  className="w-full text-center font-mono text-xs py-1.5 rounded transition-all"
                  style={{
                    backgroundColor: `rgba(${capa.colorHex}, 0.15)`,
                    color: capa.color,
                  }}
                >
                  Aislar en Despiece Axo →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
