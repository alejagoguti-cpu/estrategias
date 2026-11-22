import React from 'react';
import CorteVivo from './CorteVivo.jsx';
import PasarelaInmersiva from './PasarelaInmersiva.jsx';

// =============================================================================
// 08 · PAISAJE ADAPTATIVO — ascenso del mar e incertidumbre de sedimentos (Tierra Bomba)
// Composición del referente «10 Adaptive Landscape – Sea level rise and sediment uncertainty»
// (corte con cotas de agua, ecotonos, especies con su nombre científico y tiras de especies) dibujada con la
// estética de puntos del manglar de «Tramas» y con las especies en movimiento (CorteVivo). A la derecha, la
// pasarela elevada en primera persona (PasarelaInmersiva).
// =============================================================================

const BASE = import.meta.env.BASE_URL;
const REC = `${BASE}datos/tramas/m/`;
const INAT = 'https://inaturalist-open-data.s3.amazonaws.com/photos/';
const INAT2 = 'https://static.inaturalist.org/photos/';

// tiras de especies (como la fila inferior del referente)
const TIRAS = [
  { tipo: 'liso', fondo: '#1f6f8b', banda: '#185a72', sci: 'Opisthonema oglinum', es: 'Sardina vivita', recorte: 'sardina', rw: 96, rx: -26, ry: 92, anim: 'nadar' },
  { tipo: 'foto', img: `${INAT}31937008/medium.jpeg`, banda: '#2f8f8a', sci: 'Thalassia testudinum', es: 'Hierba de tortuga' },
  { tipo: 'foto', img: `${INAT}222906733/medium.jpeg`, banda: '#3c7f43', sci: 'Rhizophora mangle', es: 'Mangle rojo', nota: 'También llamado «mangle colorado»' },
  { tipo: 'liso', fondo: '#244d4c', banda: '#1b3d3c', sci: 'Egretta thula', es: 'Garza dedos dorados', recorte: 'garza', rw: 104, rx: -30, ry: 64, anim: 'picar' },
  { tipo: 'foto', img: `${INAT2}48492231/medium.jpg`, banda: '#5c8fd1', sci: 'Coccoloba uvifera', es: 'Uvero de playa' },
  { tipo: 'foto', img: `${INAT2}108453904/medium.jpeg`, banda: '#2f8f8a', sci: 'Cocos nucifera', es: 'Cocotero' },
  { tipo: 'liso', fondo: '#7f9a24', banda: '#6c8519', sci: 'Ardea alba', es: 'Garza blanca', recorte: 'alba', rw: 40, rx: 8, ry: 70, anim: 'mecer' },
  { tipo: 'foto', img: `${INAT}405494364/medium.jpeg`, banda: '#3c7f43', sci: 'Ceiba pentandra', es: 'Ceiba', nota: 'También llamada «bonga»' },
];

function Tira({ t }) {
  return (
    <div className="relative flex h-[200px] shrink-0" title={`${t.es} · ${t.sci}`}>
      {t.tipo === 'foto' ? (
        <div className="h-full w-[54px] overflow-hidden bg-black/40"><img src={t.img} alt={t.es} loading="lazy" className="h-full w-full object-cover opacity-90" /></div>
      ) : (
        <div className="h-full w-[54px]" style={{ background: t.fondo }} />
      )}
      <div className="flex h-full w-[18px] items-end justify-center pb-2" style={{ background: t.banda }}>
        <span className="text-[9px] italic leading-none text-white [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">{t.sci}</span>
      </div>
      {t.recorte && <img src={`${REC}${t.recorte}.webp`} alt="" aria-hidden="true" className={`pointer-events-none absolute drop-shadow-[0_2px_3px_rgba(0,0,0,.5)] anim-${t.anim}`} style={{ width: t.rw, left: t.rx, top: t.ry }} />}
      {t.nota && (
        <span className="absolute -top-9 left-[34px] z-10 w-[78px] rotate-[-58deg] bg-[#f3e600] px-1.5 py-1 text-[9px] font-medium leading-tight text-[#1f2b5b] shadow-sm">{t.nota}</span>
      )}
    </div>
  );
}

export default function PaisajeAdaptativo() {
  return (
    <section id="paisaje-adaptativo" className="relative bg-tinta text-papel" aria-label="Paisaje adaptativo: ascenso del mar e incertidumbre de sedimentos en Tierra Bomba">
      <style>{`
        @keyframes nadarTira { 0%,100% { transform: translateX(0) rotate(0deg); } 50% { transform: translateX(14px) rotate(-3deg); } }
        @keyframes picarTira { 0%,70%,100% { transform: rotate(0deg); } 80% { transform: rotate(9deg) translateY(4px); } 88% { transform: rotate(0deg); } }
        @keyframes mecerTira { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        .anim-nadar { animation: nadarTira 3.2s ease-in-out infinite; }
        .anim-picar { animation: picarTira 4.5s ease-in-out infinite; transform-origin: 30% 90%; }
        .anim-mecer { animation: mecerTira 3.8s ease-in-out infinite; transform-origin: 50% 100%; }
        @media (prefers-reduced-motion: reduce) { .anim-nadar, .anim-picar, .anim-mecer { animation: none; } }
      `}</style>
      <div className="grid min-h-[100svh] grid-cols-1 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <div className="relative px-4 pb-10 pt-24 sm:px-8 lg:pl-10 lg:pr-6">
          <p className="etiqueta text-arcilla">08 · Paisaje adaptativo</p>
          <h2 className="mt-3 text-3xl leading-[1.02] sm:text-4xl">Ascenso del mar e incertidumbre de sedimentos</h2>

          <div className="relative mt-5">
            {/* localización */}
            <figure className="absolute left-0 top-0 z-10 w-[21%] min-w-[104px] overflow-hidden ring-1 ring-white/15">
              <div className="relative aspect-square">
                <img src={`${BASE}assets/texturas/cartagena_z14.jpg`} alt="Bahía de Cartagena y la isla de Tierra Bomba" className="h-full w-full object-cover [filter:grayscale(.6)_brightness(.8)_contrast(1.1)]" />
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <circle cx="40" cy="63" r="2.6" fill="#ff6b4a" />
                  <circle cx="40" cy="63" r="5" fill="none" stroke="#ff6b4a" strokeWidth="0.6"><animate attributeName="r" values="3;8;3" dur="2.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite" /></circle>
                  <text x="44" y="62" fontSize="5.4" fill="#ff8a6a" fontWeight="700" fontFamily="Geist Mono, monospace">SITIO</text>
                  <text x="4" y="12" fontSize="4.2" fill="#7fd8ee" fontFamily="Geist Mono, monospace">Mar Caribe</text>
                  <text x="56" y="72" fontSize="4" fill="#e8eef0" fontFamily="Geist Mono, monospace">Bahía de</text><text x="56" y="77" fontSize="4" fill="#e8eef0" fontFamily="Geist Mono, monospace">Cartagena</text>
                  <text x="18" y="72" fontSize="3.8" fill="#c8e05a" fontFamily="Geist Mono, monospace">Tierra Bomba</text>
                </svg>
              </div>
            </figure>
            <CorteVivo />
          </div>

          {/* tiras de especies */}
          <div className="mt-6 flex gap-5 overflow-x-auto overflow-y-visible px-6 pb-2 pt-6 sm:justify-between sm:gap-3">
            {TIRAS.map((t) => <Tira key={t.sci} t={t} />)}
          </div>
          <p className="mt-3 text-[10px] leading-snug text-white/40">Corte dibujado con puntos, como el manglar de «Especies»; perfil esquemático, sin escala vertical. Cotas de marea e inundación según la sección de Cartografía. Fotos y recortes: iNaturalist (CC BY-NC).</p>
        </div>

        <div className="relative h-[82svh] min-h-[520px] lg:sticky lg:top-0 lg:h-[100svh]">
          <PasarelaInmersiva />
        </div>
      </div>
    </section>
  );
}
