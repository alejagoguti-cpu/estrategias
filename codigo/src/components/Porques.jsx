import React, { useEffect, useRef, useState } from 'react';
import D from '../data/porques.json';

// El problema hasta la raíz, como diagrama: el problema arriba, tres ramas que bajan con «¿por qué?»
// y una raíz común abajo. Cada nodo: pocas palabras y una cifra. Al tocarlo se abre una línea y su fuente.
const fmt = (n) => Math.round(n).toLocaleString('es-CO');

const RAMAS = [
  { titulo: 'El borde', nodos: [
    { n: '891', l: 'casas se pierden', d: 'Construcciones en la franja que el mar alcanza en 30 años.', f: 'Modelo de esta presentación (INVEMAR, MIDAS).' },
    { n: '3 m', l: 'por año avanza el mar', d: 'Retroceso medido en la isla: de 0,63 a 3 m por año (1994–2011).', f: 'INVEMAR-MADS-Alcaldía-CDKN (2012).' },
    { n: fmt(D.p3.bajo5), l: 'casas a menos de 5 m', d: 'El pueblo está en la parte más baja, junto al agua.', f: 'Terrain Tiles y archivo de la tesis.' },
    { n: 'Orilla', l: 'de ella se vive', d: 'Pesca, lanchas y turismo de playa: el trabajo está en el borde.', f: 'Cartagena Cómo Vamos (2022).' },
  ] },
  { titulo: 'La tierra', nodos: [
    { n: fmt(D.p3.enMeseta), l: 'casas en la parte alta', d: 'La meseta, sobre +22 m, es segura frente al mar y está casi vacía.', f: 'Polígono de la meseta y archivo de la tesis.' },
    { n: '1.080 ha', l: 'son de particulares', d: 'La parte alta no es de quienes viven en la isla (además, Armada 261 ha y Nación 176 ha).', f: 'Incoder, Res. 4192 de 2015 (Semana, Dejusticia).' },
    { n: '379 ha', l: 'del pueblo, del Distrito', d: 'Ni el suelo donde está el poblado es de la comunidad.', f: 'Res. 4192 de 2015; Dejusticia.' },
    { n: 'Sin título', l: 'colectivo', d: 'El Consejo Comunitario pide 2.039 ha; depende de que el Distrito done su predio, y no lo ha hecho.', f: 'Dejusticia; Publimetro (2023).' },
  ] },
  { titulo: 'Cartagena', nodos: [
    { n: '614', l: 'viajes en un día a Bocagrande', d: 'En 13 horas, desde un solo embarcadero; 407 de vuelta.', f: 'Estudio de transporte acuático (2014).' },
    { n: '0', l: 'acueductos', d: 'El agua llega en bongos; no hay alcantarillado ni ambulancia acuática.', f: 'Alcaldía de Cartagena; El Universal.' },
    { n: '96,7 %', l: 'en pobreza', d: 'Casi no hay empleo ni ingresos en la isla.', f: 'Cartagena Cómo Vamos (2019–2020).' },
    { n: 'Afuera', l: 'se decide', d: 'Agua, muelles y suelo se deciden en Cartagena y Bogotá; el acueducto espera aprobación del Ministerio desde 2024.', f: 'El Universal (2024); POT de Cartagena (2001).' },
  ] },
];

function useVisto(ref, umbral = 0.2) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); io.disconnect(); } }, { threshold: umbral });
    io.observe(el); return () => io.disconnect();
  }, [ref, umbral]);
  return v;
}

function Nodo({ x, i, ri, on, alTocar, visto }) {
  const raiz = i === 3; const ret = 0.6 + i * 0.45 + ri * 0.1;
  return (
    <li className="relative flex flex-col items-center" style={{ opacity: visto ? 1 : 0, transform: `translateY(${visto ? 0 : 20}px)`, transition: `opacity .8s cubic-bezier(.16,1,.3,1) ${ret}s, transform .8s cubic-bezier(.16,1,.3,1) ${ret}s` }}>
      {i > 0 && (
        <div className="relative h-10 w-px" aria-hidden="true">
          <span className="absolute inset-0 origin-top bg-[var(--linea-fuerte)]" style={{ transform: `scaleY(${visto ? 1 : 0})`, transition: `transform .45s ease ${ret - 0.15}s` }} />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[.12em] text-[var(--tinta-3)]">por qué</span>
        </div>
      )}
      <button type="button" onClick={alTocar} aria-expanded={on}
        className={`w-full max-w-[17rem] border px-4 py-3 text-center transition-colors ${raiz ? 'border-arcilla bg-[rgb(255_107_74/.1)]' : on ? 'border-[var(--tinta-2)] bg-[var(--campo-1)]' : 'border-[var(--linea-media)] bg-[rgb(8_11_13/.5)] hover:border-[var(--tinta-2)]'}`}>
        <span className={`cifra block text-[2.3rem] leading-none ${raiz ? 'text-arcilla' : 'text-white'}`}>{x.n}</span>
        <span className="mt-1 block text-[13px] text-[var(--tinta-2)]">{x.l}</span>
        {on && <span className="mt-2 block border-t border-[var(--linea)] pt-2 text-left text-[12px] leading-snug text-white/85">{x.d}<span className="mt-1 block text-[10.5px] text-[var(--tinta-3)]">{x.f}</span></span>}
      </button>
    </li>
  );
}

export default function Porques() {
  const ref = useRef(null); const visto = useVisto(ref, 0.12);
  const [abierto, setAbierto] = useState(null);
  return (
    <section id="porques" className="relative text-papel">
      <div className="relative mx-auto max-w-[1400px] px-3 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div ref={ref} className="border border-[var(--linea-media)] px-4 py-10 sm:px-10 sm:py-14" style={{ background: 'rgba(8,11,13,0.62)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          {/* problema */}
          <div className="text-center" style={{ opacity: visto ? 1 : 0, transition: 'opacity .9s ease' }}>
            <p className="etiqueta text-arcilla">El problema</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl sm:text-4xl lg:text-5xl">El mar se lleva el suelo donde vive la gente</h2>
          </div>
          {/* tres ramas que salen del problema (escritorio) */}
          <svg viewBox="0 0 1200 90" preserveAspectRatio="none" className="mt-6 hidden h-20 w-full lg:block" aria-hidden="true">
            {[200, 600, 1000].map((x, k) => (
              <path key={x} d={`M600 0 C 600 50, ${x} 40, ${x} 90`} fill="none" stroke="rgba(214,230,236,.42)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" pathLength="1" strokeDasharray="1" strokeDashoffset={visto ? 0 : 1} style={{ transition: `stroke-dashoffset 1s cubic-bezier(.65,0,.35,1) ${0.3 + k * 0.1}s` }} />
            ))}
          </svg>
          <div className="mt-8 grid gap-14 lg:mt-0 lg:grid-cols-3 lg:gap-6">
            {RAMAS.map((r, ri) => (
              <div key={r.titulo}>
                <p className="text-center font-mono text-[11px] uppercase tracking-[.16em] text-white" style={{ opacity: visto ? 1 : 0, transition: `opacity .8s ease ${0.4 + ri * 0.1}s` }}>{r.titulo}</p>
                <ol className="mt-4">
                  {r.nodos.map((x, i) => {
                    const id = `${ri}-${i}`;
                    return <Nodo key={id} x={x} i={i} ri={ri} visto={visto} on={abierto === id} alTocar={() => setAbierto(abierto === id ? null : id)} />;
                  })}
                </ol>
              </div>
            ))}
          </div>
          {/* las raíces convergen */}
          <svg viewBox="0 0 1200 90" preserveAspectRatio="none" className="hidden h-20 w-full lg:block" aria-hidden="true">
            {[200, 600, 1000].map((x, k) => (
              <path key={x} d={`M${x} 0 C ${x} 50, 600 40, 600 90`} fill="none" stroke="#ff6b4a" strokeWidth="1.4" vectorEffect="non-scaling-stroke" pathLength="1" strokeDasharray="1" strokeDashoffset={visto ? 0 : 1} style={{ transition: `stroke-dashoffset 1.1s cubic-bezier(.65,0,.35,1) ${2.6 + k * 0.1}s` }} />
            ))}
          </svg>
          <div className="mx-auto mt-12 max-w-xl border border-arcilla px-6 py-6 text-center lg:mt-0" style={{ background: 'rgb(255 107 74 / .12)', opacity: visto ? 1 : 0, transform: `translateY(${visto ? 0 : 16}px)`, transition: 'opacity 1s ease 3.1s, transform 1s cubic-bezier(.16,1,.3,1) 3.1s' }}>
            <p className="etiqueta text-arcilla">Raíz</p>
            <p className="mt-2 text-2xl leading-tight sm:text-3xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 300, textTransform: 'uppercase' }}>Sin tierra propia ni servicios propios</p>
          </div>
        </div>
      </div>
    </section>
  );
}
