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
export default function PaisajeAdaptativo() {
  return (
    <section id="paisaje-adaptativo" className="relative bg-tinta text-papel" aria-label="Paisaje adaptativo: ascenso del mar e incertidumbre de sedimentos en Tierra Bomba">
      <div className="grid min-h-[100svh] grid-cols-1 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <div className="relative flex flex-col justify-center px-4 pb-10 pt-24 sm:px-8 lg:pl-10 lg:pr-6">
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

          <p className="mt-4 text-[10px] leading-snug text-white/40">Corte dibujado con puntos, como el manglar de «Especies»; perfil esquemático, sin escala vertical. Cotas de marea e inundación según la sección de Cartografía. Recortes de especies: iNaturalist (CC BY-NC).</p>
        </div>

        <div className="relative h-[82svh] min-h-[520px] lg:sticky lg:top-0 lg:h-[100svh]">
          <PasarelaInmersiva />
        </div>
      </div>
    </section>
  );
}
