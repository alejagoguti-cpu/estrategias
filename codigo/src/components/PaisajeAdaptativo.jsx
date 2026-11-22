import React, { useState } from 'react';

// =============================================================================
// PAISAJE ADAPTATIVO: ASCENSO DEL NIVEL DEL MAR, SEDIMENTACIÓN Y BORDES BLANDOS
// Adaptado a la Isla de Tierra Bomba, Cartagena
// Referente: 10 ADAPTIVE LANDSCAPE - SEA LEVEL RISE AND SEDIMENT UNCERTAINTY
// Articula:
//  - Ecotono 01: Zona Intermareal y Praderas Marinas (Bajamar -0.15 m / Pleamar +0.40 m)
//  - Ecotono 02: Marisma Costera, Manglar Disipativo y Pasarela Elevada (Storm Surge 50a +1.80 m)
//  - Ecotono 03: Humedal Dulce de Fitofiltración y Bosque Seco hacia Meseta (+22 m / 100a +2.40 m)
// =============================================================================

export const ESPECIES_PALETA = [
  {
    tid: 4328,
    comun: 'Pelícano café',
    sci: 'Pelecanus occidentalis',
    cat: 'Avifauna Marina',
    zona: 'Zona Intermareal',
    c: '#38bdf8',
    rol: 'Piscívoro costero y bioindicador de calidad de agua en bajamar.',
    img: 'https://inaturalist-open-data.s3.amazonaws.com/photos/55327445/medium.jpg',
  },
  {
    tid: 118509,
    comun: 'Hierba de tortuga',
    sci: 'Thalassia testudinum',
    cat: 'Pradera Marina',
    zona: 'Zona Intermareal',
    c: '#06b6d4',
    rol: 'Fijación de lechos arenosos, reducción de turbidez y sumidero de carbono azul.',
    img: 'https://inaturalist-open-data.s3.amazonaws.com/photos/31937008/medium.jpeg',
  },
  {
    tid: 62850,
    comun: 'Mangle Botoncillo',
    sci: 'Conocarpus erectus',
    cat: 'Manglar de Borde',
    zona: 'Marisma Costera',
    c: '#10b981',
    rol: 'Borde supramareal, alta resistencia a viento y salinidad extrema en costas rocosas.',
    img: 'https://inaturalist-open-data.s3.amazonaws.com/photos/213051740/medium.jpeg',
  },
  {
    tid: 82768,
    comun: 'Mangle Rojo',
    sci: 'Rhizophora mangle',
    cat: 'Manglar Disipativo',
    zona: 'Marisma Costera',
    c: '#059669',
    rol: 'Raíces zancudas que disipan hasta 66% de la energía del oleaje y retienen sedimentos.',
    img: 'https://inaturalist-open-data.s3.amazonaws.com/photos/10197355/medium.jpg',
  },
  {
    tid: 199320,
    comun: 'Uvita de playa',
    sci: 'Coccoloba uvifera',
    cat: 'Flora Litoral',
    zona: 'Marisma Costera',
    c: '#84cc16',
    rol: 'Fijación de dunas y bermas arenosas contra la socavación por viento y marea.',
    img: 'https://inaturalist-open-data.s3.amazonaws.com/photos/33707794/medium.jpeg',
  },
  {
    tid: 62833,
    comun: 'Pasto Vetiver',
    sci: 'Chrysopogon zizanioides',
    cat: 'Bio-Armadura',
    zona: 'Humedal y Talud',
    c: '#22c55e',
    rol: 'Red radicular masiva de 3 m de profundidad que ancla taludes frente al desmoronamiento.',
    img: 'https://inaturalist-open-data.s3.amazonaws.com/photos/8346930/medium.jpeg',
  },
  {
    tid: 35342,
    comun: 'Iguana verde',
    sci: 'Iguana iguana',
    cat: 'Reptiles',
    zona: 'Bosque Seco',
    c: '#eab308',
    rol: 'Herbívoro y dispersor de semillas entre la marisma baja y el dosel de la meseta.',
    img: 'https://inaturalist-open-data.s3.amazonaws.com/photos/264671214/medium.jpeg',
  },
  {
    tid: 184273,
    comun: 'Guayacán / Bosque Seco',
    sci: 'Bursera simaruba / Cedrela',
    cat: 'Dosel Forestal',
    zona: 'Meseta Segura',
    c: '#15803d',
    rol: 'Retención hídrica edáfica en roca calcárea y sombra protectora sobre +22 m.',
    img: 'https://static.inaturalist.org/photos/8263137/medium.jpg',
  },
];

export const NIVELES_AGUA = [
  { id: 'baja', label: 'Bajamar (-0.15 m)', cotaM: -0.15, ySvg: 250, desc: 'Franja intermareal expuesta para alimentación de aves limícolas y faena artesanal.' },
  { id: 'plea', label: 'Pleamar (+0.40 m)', cotaM: 0.40, ySvg: 228, desc: 'Cota de marea alta diaria: cubre praderas de Thalassia y base del manglar rojo.' },
  { id: 'storm50', label: 'Storm Surge 50a (+1.80 m)', cotaM: 1.80, ySvg: 168, desc: 'Penetración de tormenta de 50 años: disipada por raíces de mangle y protegida por la pasarela.' },
  { id: 'flood100', label: 'Inundación Crítica 100a (+2.40 m)', cotaM: 2.40, ySvg: 135, desc: 'Límite máximo de inundación centenaria: el enrocado permeable y talud de vetiver salvan la meseta.' },
];

export default function PaisajeAdaptativo() {
  const [nivelActivo, setNivelActivo] = useState(NIVELES_AGUA[2]); // Storm Surge 50a por defecto
  const [especieSel, setEspecieSel] = useState(ESPECIES_PALETA[3]); // Rhizophora mangle

  return (
    <section id="paisaje-adaptativo" className="relative border-t border-white/10 bg-[#040608] py-20 px-4 sm:px-8 lg:px-14 text-white overflow-hidden" aria-label="Paisaje Adaptativo: Ascenso del nivel del mar y corte ecosistémico en Tierra Bomba">
      {/* Marco de fondo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-transparent to-transparent opacity-60" />

      <div className="relative mx-auto max-w-[1720px]">
        {/* Cabecera del corte adaptativo */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 border-b border-white/15 pb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Estrategia Paisajística · Borde Blando y Amortiguamiento
              </p>
            </div>
            <h2 className="mt-2.5 font-['Barlow_Condensed'] text-3xl sm:text-5xl lg:text-6xl font-light uppercase tracking-tight leading-none text-white">
              Paisaje Adaptativo <span className="font-semibold text-arcilla">· Ascenso del Mar e Incertidumbre de Sedimentos</span>
            </h2>
            <p className="mt-3 max-w-4xl text-sm sm:text-base leading-relaxed text-white/75">
              Corte ecosistémico transversal adaptado a Tierra Bomba: articula el gradiente desde la franja marina intermareal hasta el suelo seguro de la meseta calcárea (+22 m). El sistema integra <strong className="text-emerald-300">enrocado permeable (*riprap revetment*)</strong>, <strong className="text-emerald-300">marisma de manglar disipativa</strong> y una <strong className="text-arcilla">pasarela palafítica elevada (*elevated boardwalk*)</strong> que garantiza la movilidad comunitaria y el acceso seguro a lanchas sin obstaculizar la dinámica hidrológica.
            </p>
          </div>

          {/* Selectores de nivel de agua / tormenta */}
          <div className="flex flex-col gap-2 bg-black/60 p-3.5 rounded-xl border border-white/12 backdrop-blur">
            <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider">Simular Cota de Agua y Tormenta:</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Nivel de agua">
              {NIVELES_AGUA.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNivelActivo(n)}
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-all ${
                    nivelActivo.id === n.id
                      ? 'bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/25 scale-[1.02]'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[11px] text-emerald-400/90 mt-1">{nivelActivo.desc}</p>
          </div>
        </div>

        {/* =====================================================================
            CORTE ECOSISTÉMICO TRANSVERSAL INTERACTIVO (SVG + OVERLAYS)
        ===================================================================== */}
        <div className="mt-8 rounded-2xl border border-white/15 bg-gradient-to-b from-[#060b10] to-[#030608] p-4 sm:p-6 shadow-2xl relative">
          {/* Título y leyenda del corte */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-mono text-white/60">CORTE TRANSVERSAL A-A': MAR CARIBE → ENSENADA → MANGLAR → MESETA</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-white/50">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-cyan-400" /> Praderas marinas</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Manglar disipativo</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-500" /> Pasarela de madera</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-lime-500" /> Vetiver y Bosque Seco</span>
            </div>
          </div>

          {/* Gráfico SVG del corte ecosistémico */}
          <div className="relative w-full aspect-[21/9] min-h-[360px] overflow-hidden select-none">
            <svg viewBox="0 0 1000 420" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                {/* Degradados de agua */}
                <linearGradient id="gradAgua" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#0369a1" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.95" />
                </linearGradient>
                {/* Degradado de terreno geológico calcáreo */}
                <linearGradient id="gradTerreno" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#292524" />
                  <stop offset="30%" stopColor="#1c1917" />
                  <stop offset="100%" stopColor="#0c0a09" />
                </linearGradient>
                {/* Sombra de la pasarela */}
                <filter id="glowAgua" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* CIELO / FONDO SUAVE */}
              <rect x="0" y="0" width="1000" height="420" fill="transparent" />

              {/* LÍNEAS DE CUADRÍCULA GUÍA */}
              {[135, 168, 228, 250].map((y) => (
                <line key={y} x1="30" y1={y} x2="970" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              ))}

              {/* PERFIL GEOLÓGICO DEL TERRENO DE TIERRA BOMBA */}
              {/* Comienza en el fondo marino (x:0, y:310), sube por el talud intermareal, plataforma de manglar, talud de vetiver y meseta (+22m) */}
              <path
                d="M 0,320 
                   C 120,315 220,300 320,280 
                   C 390,265 440,240 520,230 
                   C 590,225 650,220 720,195 
                   C 790,170 840,110 930,90 
                   L 1000,85 L 1000,420 L 0,420 Z"
                fill="url(#gradTerreno)"
                stroke="#57534e"
                strokeWidth="2"
              />

              {/* ESTRATOS GEOLÓGICOS INTERIORES */}
              <path d="M 0,360 Q 400,340 720,260 T 1000,160" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              <path d="M 0,390 Q 500,380 800,300 T 1000,220" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />

              {/* ENROCADO PERMEABLE (RIPRAP REVETMENT) */}
              {/* Bloques de roca caliza permeable dispuestos entre x:490 y x:560 */}
              <g id="riprap" fill="#78716c" stroke="#292524" strokeWidth="1.2">
                {[
                  [490, 238, 14], [505, 235, 16], [520, 230, 18], [538, 226, 17], [555, 221, 15],
                  [498, 248, 15], [515, 244, 18], [532, 239, 16], [548, 233, 15],
                  [506, 258, 16], [524, 252, 17], [540, 246, 16],
                ].map(([rx, ry, s], idx) => (
                  <polygon
                    key={idx}
                    points={`${rx},${ry} ${rx + s},${ry - 3} ${rx + s + 3},${ry + s - 2} ${rx + 2},${ry + s} ${rx - 2},${ry + 4}`}
                    opacity="0.9"
                  />
                ))}
              </g>

              {/* RAÍCES DE MANGLAR ROJO (RHIZOPHORA) - ZANCUDAS */}
              <g stroke="#047857" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85">
                {/* Mangle 1 */}
                <path d="M 370,225 Q 355,250 340,285" />
                <path d="M 370,225 Q 375,255 365,283" />
                <path d="M 370,225 Q 390,250 405,280" />
                <circle cx="370" cy="210" r="18" fill="#059669" stroke="#10b981" strokeWidth="1.5" />
                {/* Mangle 2 */}
                <path d="M 430,215 Q 410,240 395,270" />
                <path d="M 430,215 Q 435,245 430,268" />
                <path d="M 430,215 Q 450,240 465,265" />
                <circle cx="430" cy="198" r="22" fill="#047857" stroke="#10b981" strokeWidth="1.5" />
                {/* Neumatóforos de Avicennia */}
                {[440, 448, 455, 462, 470, 478].map((nx) => (
                  <line key={nx} x1={nx} y1="262" x2={nx} y2="242" stroke="#10b981" strokeWidth="2" />
                ))}
              </g>

              {/* PRADERAS SUBMARINAS DE THALASSIA TESTUDINUM */}
              <g stroke="#06b6d4" strokeWidth="1.8" fill="none" opacity="0.75">
                {[120, 140, 160, 185, 210, 240, 265, 290].map((px) => (
                  <path key={px} d={`M ${px},310 Q ${px + 5},290 ${px - 3},272 T ${px + 2},260`} />
                ))}
              </g>

              {/* BIO-ARMADURA DE VETIVER EN EL TALUD MEDIO */}
              <g stroke="#84cc16" strokeWidth="1.5" opacity="0.85">
                {[730, 745, 760, 775, 795, 815].map((vx) => (
                  <g key={vx}>
                    {/* Raíces profundas de 3 m */}
                    <line x1={vx} y1="180" x2={vx - 5} y2="250" stroke="#65a30d" strokeDasharray="2 3" strokeWidth="2" />
                    <line x1={vx} y1="180" x2={vx + 8} y2="245" stroke="#65a30d" strokeDasharray="2 3" strokeWidth="1.8" />
                    {/* Mechón superficial */}
                    <path d={`M ${vx - 4},180 Q ${vx},155 ${vx - 8},140 M ${vx},180 Q ${vx + 2},150 ${vx + 6},138`} fill="none" />
                  </g>
                ))}
              </g>

              {/* BOSQUE SECO TROPICAL EN LA MESETA ALTA (+22 M) */}
              <g id="bosque-seco">
                <circle cx="860" cy="70" r="28" fill="#15803d" opacity="0.9" />
                <line x1="860" y1="95" x2="860" y2="125" stroke="#78350f" strokeWidth="4" />
                <circle cx="910" cy="55" r="34" fill="#166534" opacity="0.9" />
                <line x1="910" y1="88" x2="910" y2="115" stroke="#78350f" strokeWidth="5" />
                <circle cx="965" cy="50" r="32" fill="#14532d" opacity="0.9" />
                <line x1="965" y1="80" x2="965" y2="105" stroke="#78350f" strokeWidth="4.5" />
              </g>

              {/* ===============================================================
                  PASARELA PALAFÍTICA ELEVADA DE MADERA (ELEVATED BOARDWALK)
                  Pasa a cota +2.10 m (y: 155 en SVG), por encima del storm surge de 50 años
              =============================================================== */}
              <g id="boardwalk" filter="url(#glowAgua)">
                {/* Pilotes hincados al terreno */}
                {[330, 410, 485, 560, 630].map((bx) => (
                  <g key={bx}>
                    <line x1={bx} y1="155" x2={bx} y2="265" stroke="#d97706" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1={bx + 3} y1="155" x2={bx + 3} y2="265" stroke="#b45309" strokeWidth="1.5" />
                  </g>
                ))}
                {/* Viga estructural horizontal */}
                <line x1="310" y1="155" x2="650" y2="155" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
                {/* Tablones de cubierta de madera */}
                <line x1="305" y1="150" x2="655" y2="150" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                {/* Barandilla de seguridad ligera */}
                <line x1="308" y1="135" x2="652" y2="135" stroke="#d97706" strokeWidth="1.8" />
                {[330, 370, 410, 450, 485, 525, 560, 595, 630].map((rx) => (
                  <line key={rx} x1={rx} y1="150" x2={rx} y2="135" stroke="#d97706" strokeWidth="1.5" />
                ))}
                {/* Siluetas de personas caminando sobre la pasarela */}
                <g fill="#fef3c7" opacity="0.95">
                  <circle cx="480" cy="116" r="3.2" />
                  <path d="M 478,120 L 482,120 L 484,138 L 476,138 Z" />
                  <circle cx="494" cy="118" r="3.0" />
                  <path d="M 492,122 L 496,122 L 498,138 L 490,138 Z" />
                </g>
                <text x="485" y="105" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  PASARELA ELEVADA (+2.10 m)
                </text>
              </g>

              {/* ===============================================================
                  MASA DE AGUA DINÁMICA CON EL NIVEL SIMULADO
              =============================================================== */}
              <g id="masa-agua" className="transition-all duration-700 ease-out">
                {/* Superficie y cuerpo del agua */}
                <rect
                  x="0"
                  y={nivelActivo.ySvg}
                  width="1000"
                  height={420 - nivelActivo.ySvg}
                  fill="url(#gradAgua)"
                />
                {/* Línea de oleaje superior iluminada */}
                <line
                  x1="0"
                  y1={nivelActivo.ySvg}
                  x2="1000"
                  y2={nivelActivo.ySvg}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="8 4"
                />
                {/* Flecha y cota indicadora */}
                <text
                  x="70"
                  y={nivelActivo.ySvg - 8}
                  fill="#38bdf8"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  ◀ {nivelActivo.label} [{nivelActivo.cotaM > 0 ? `+${nivelActivo.cotaM}` : nivelActivo.cotaM} m]
                </text>
              </g>

              {/* BARRAS VERTICALES DE SEPARACIÓN DE ECOTONOS */}
              {/* Ecotono 01 (x: 320) */}
              <g id="ecotono-1">
                <rect x="315" y="30" width="8" height="340" fill="#000000" stroke="#10b981" strokeWidth="1.5" rx="2" />
                <text x="319" y="200" transform="rotate(-90 319,200)" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
                  ECOTONO 01
                </text>
                <text x="319" y="24" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                  TIDAL MARSH / GRASSLAND
                </text>
              </g>

              {/* Ecotono 02 (x: 690) */}
              <g id="ecotono-2">
                <rect x="685" y="30" width="8" height="340" fill="#000000" stroke="#84cc16" strokeWidth="1.5" rx="2" />
                <text x="689" y="200" transform="rotate(-90 689,200)" textAnchor="middle" fill="#84cc16" fontSize="10" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
                  ECOTONO 02
                </text>
                <text x="689" y="24" textAnchor="middle" fill="#84cc16" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                  FRESHWATER WETLAND / FOREST
                </text>
              </g>

              {/* RÓTULOS DE ZONAS SUPERIORES */}
              <text x="160" y="24" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                TIDAL ZONE / LECHO MARINO
              </text>
              <text x="840" y="24" textAnchor="middle" fill="#22c55e" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                MESETA SEGURA (&gt; +22 M)
              </text>

              {/* SILUETAS DE FAUNA */}
              {/* Pelícano / Aves en vuelo */}
              <g fill="#bae6fd" opacity="0.8">
                <path d="M 180,90 Q 190,82 200,90 Q 210,82 220,90 Q 200,85 180,90 Z" />
                <path d="M 230,110 Q 238,104 246,110 Q 254,104 262,110 Q 246,106 230,110 Z" />
                <path d="M 620,70 Q 628,64 636,70 Q 644,64 652,70 Q 636,66 620,70 Z" />
              </g>
            </svg>
          </div>

          {/* Información del nivel seleccionado */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/10 pt-3 text-xs">
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/8">
              <span className="text-white/50 block font-mono text-[10px]">ECOTONO 01 · INTERMAREAL</span>
              <p className="mt-0.5 font-medium text-cyan-300">Praderas submarinas &amp; oleaje</p>
              <p className="text-white/60 text-[11px] mt-1 leading-snug">Disipación de energía marina basal mediante *Thalassia* y fondos no consolidados.</p>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/8">
              <span className="text-white/50 block font-mono text-[10px]">ECOTONO 02 · BORDE BLANDO</span>
              <p className="mt-0.5 font-medium text-emerald-400">Manglar disipativo &amp; pasarela</p>
              <p className="text-white/60 text-[11px] mt-1 leading-snug">Raíces zancudas amortiguan hasta 66% de fuerza de ola; pasarela peatonal sobre pilotes a +2.10 m.</p>
            </div>
            <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/8">
              <span className="text-white/50 block font-mono text-[10px]">ECOTONO 03 · SUELO SEGURO</span>
              <p className="mt-0.5 font-medium text-lime-400">Bio-armadura Vetiver &amp; Meseta</p>
              <p className="text-white/60 text-[11px] mt-1 leading-snug">Raíces de 3 m frenan cárcavas de escorrentía; Bosque Seco retiene agua dulce sobre cota +22 m.</p>
            </div>
          </div>
        </div>

        {/* =====================================================================
            FILA INFERIOR: PALETA DE ESPECIES (IZQ) Y PERSPECTIVA DEL BORDE BLANDO (DER)
        ===================================================================== */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* PALETA DE ESPECIES NATIVAS Y FUNCIONES ADAPTATIVAS (7 COLUMNAS) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-black/40 p-5 rounded-2xl border border-white/12">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                  Paleta de Especies Adaptativas de Tierra Bomba
                </h3>
                <span className="text-white/45 text-[11px] font-mono">Toca una especie para inspeccionar su rol</span>
              </div>

              {/* Tiras verticales de especies (como en el referente gráfico) */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ESPECIES_PALETA.map((sp) => {
                  const activa = especieSel.tid === sp.tid;
                  return (
                    <button
                      key={sp.tid}
                      type="button"
                      onClick={() => setEspecieSel(sp)}
                      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                        activa
                          ? 'border-emerald-400 ring-2 ring-emerald-400/30 scale-[1.02] bg-white/[0.08]'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/60">
                        <img
                          src={sp.img}
                          alt={sp.comun}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <span
                          className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                          style={{ background: sp.c, color: '#000' }}
                        >
                          {sp.cat}
                        </span>
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-semibold text-xs leading-snug text-white group-hover:text-emerald-300 transition-colors">
                            {sp.comun}
                          </p>
                          <p className="font-mono text-[10px] text-white/50 italic mt-0.5">
                            {sp.sci}
                          </p>
                        </div>
                        <p className="font-mono text-[10px] text-emerald-400 mt-2 block">
                          {sp.zona}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ficha de detalle de la especie seleccionada */}
            {especieSel && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/25 p-4 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={especieSel.img}
                  alt={especieSel.comun}
                  className="h-16 w-16 rounded-lg object-cover border border-emerald-400/40 flex-none"
                />
                <div className="flex-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-white">{especieSel.comun}</span>
                    <span className="font-mono text-emerald-400 italic">({especieSel.sci})</span>
                    <span className="px-2 py-0.5 rounded bg-black/60 font-mono text-[10px] text-white/70 border border-white/10">
                      {especieSel.zona}
                    </span>
                  </div>
                  <p className="mt-1.5 text-white/80 leading-relaxed">
                    <strong>Función ecosistémica adaptativa:</strong> {especieSel.rol}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* VISUALIZACIÓN EN PERSPECTIVA DE LA PASARELA Y BORDE BLANDO (5 COLUMNAS) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-black/40 p-5 rounded-2xl border border-white/12">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="font-mono text-xs uppercase tracking-wider text-arcilla font-semibold">
                  Visualización de Paisaje Adaptativo
                </h3>
                <span className="text-white/45 text-[11px] font-mono">Borde Blando &amp; Pasarela</span>
              </div>

              {/* Render arquitectónico representativo del referente */}
              <div className="mt-4 relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/15 bg-black/60 group">
                <img
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
                  alt="Borde costero adaptativo con pasarela de madera"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-90 saturate-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

                {/* Etiquetas superpuestas tipo proyecto */}
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur px-2.5 py-1 rounded-md border border-white/20 font-mono text-[10px] text-emerald-300">
                  Sector: Punta Arena / Caño del Oro
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-xs leading-relaxed text-white/90">
                  <p className="font-medium text-white text-sm">
                    Pasarela Palafítica Elevada (*Elevated Boardwalk*)
                  </p>
                  <p className="text-white/75 text-[11px] mt-1 leading-snug">
                    Permite a los pescadores y a la comunidad acceder a las embarcaciones y desplazarse por encima de las marejadas de tormenta sin interrumpir el flujo del manglar ni cimentar rellenos duros.
                  </p>
                </div>
              </div>
            </div>

            {/* Texto de manifiesto adaptativo (traducción del referente arquitectónico) */}
            <blockquote className="mt-5 border-l-2 border-arcilla bg-white/[0.04] p-3.5 rounded-r-lg text-xs leading-relaxed text-white/85 italic">
              "El enrocado permeable (*riprap revetment*), la marisma de manglar y la pasarela elevada componen un borde blando de costa con alta capacidad de adaptación al ascenso del nivel del mar y a la incertidumbre sedimentaria futura, reduciendo el impacto en los hábitats litorales para fomentar un entorno ecológicamente próspero en Tierra Bomba."
              <span className="block not-italic font-mono text-[10px] text-white/45 mt-1.5">
                Adaptación de: 10 Adaptive Landscape — Sea Level Rise and Sediment Uncertainty
              </span>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
