import React, { useEffect, useRef, useState } from 'react';
import D from '../data/porques.json';

// El problema hasta la raíz: una sola cadena de «¿por qué?» que baja desde el problema hasta su causa de raíz.
// Cada nivel responde al anterior. Al tocar un nivel se abre lo que lo muestra y su fuente.
const fmt = (n) => Math.round(n).toLocaleString('es-CO');

const PROBLEMA = 'Las familias de Tierra Bomba pierden el suelo donde viven y no tienen a dónde moverse dentro de su propia isla';

const CADENA = [
  { q: '¿Por qué pierden el suelo donde viven?', t: 'Porque viven en la franja baja del borde, que el mar está erosionando', d: `${fmt(D.p3.bajo5)} construcciones a menos de 5 m sobre el mar; la costa retrocede de 0,63 a 3 m por año.`, f: 'Terrain Tiles y archivo de la tesis; INVEMAR-MADS-Alcaldía-CDKN (2012).' },
  { q: '¿Por qué viven en el borde?', t: 'Porque de la orilla dependen el trabajo y la salida a Cartagena', d: 'Se vive de la pesca, las lanchas y el turismo de playa, y todo viaje sale del muelle.', f: 'Cartagena Cómo Vamos (2022); estudio de transporte acuático (2014).' },
  { q: '¿Por qué no se mueven a la parte alta, que es segura?', t: 'Porque esa tierra no es de la comunidad', d: `Solo ${fmt(D.p3.enMeseta)} construcciones en la meseta; unas 1.080 ha de la isla son de particulares, 261 ha de la Armada y 176 ha de la Nación.`, f: 'Incoder, Res. 4192 de 2015 (Semana, Dejusticia).' },
  { q: '¿Por qué la tierra no es de la comunidad?', t: 'Porque nunca obtuvo el título de la tierra que ocupa: ni el suelo del pueblo es suyo', d: 'Las 379 ha del poblado quedaron a nombre del Distrito; el título colectivo de 2.039 ha sigue sin resolverse.', f: 'Res. 4192 de 2015; Dejusticia; Publimetro (2023).' },
  { q: '¿Por qué no se ha resuelto?', t: 'Porque las decisiones sobre la isla se toman desde afuera, sin la comunidad', d: 'El título depende de que el Distrito done su predio, y el proyecto se retiró del Concejo; el agua, los muelles y el suelo también se deciden en Cartagena y Bogotá.', f: 'Dejusticia; Publimetro (2023); El Universal (2024).', raiz: true },
];

function useVisto(ref, umbral = 0.15) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); io.disconnect(); } }, { threshold: umbral });
    io.observe(el); return () => io.disconnect();
  }, [ref, umbral]);
  return v;
}

function Nivel({ x, i, on, alTocar }) {
  const ref = useRef(null); const visto = useVisto(ref, 0.5);
  const ancho = 100 - i * 6; // cada nivel un poco más angosto: se va hacia la raíz
  return (
    <li ref={ref} className="flex flex-col items-center">
      <div className="relative h-16 w-px" aria-hidden="true">
        <span className="absolute inset-0 origin-top bg-[var(--linea-fuerte)]" style={{ transform: `scaleY(${visto ? 1 : 0})`, transition: 'transform .6s ease' }} />
      </div>
      <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[.12em] text-[var(--tinta-2)]" style={{ opacity: visto ? 1 : 0, transition: 'opacity .6s ease .25s' }}>{x.q}</p>
      <button type="button" onClick={alTocar} aria-expanded={on}
        className={`border px-5 py-4 text-center transition-colors sm:px-8 sm:py-5 ${x.raiz ? 'border-arcilla bg-[rgb(255_107_74/.12)]' : on ? 'border-[var(--tinta-2)] bg-[var(--campo-1)]' : 'border-[var(--linea-media)] bg-[rgb(8_11_13/.55)] hover:border-[var(--tinta-2)]'}`}
        style={{ width: `min(${ancho}%, 46rem)`, opacity: visto ? 1 : 0, transform: `translateY(${visto ? 0 : 18}px)`, transition: 'opacity .8s cubic-bezier(.16,1,.3,1) .4s, transform .8s cubic-bezier(.16,1,.3,1) .4s, border-color .2s, background-color .2s' }}>
        {x.raiz && <span className="etiqueta mb-2 block text-arcilla">Raíz</span>}
        <span className={`block leading-snug ${x.raiz ? 'text-xl text-white sm:text-2xl' : 'text-base text-white/90 sm:text-lg'}`}>{x.t}</span>
        {on && <span className="mx-auto mt-3 block max-w-xl border-t border-[var(--linea)] pt-3 text-[12.5px] leading-snug text-white/70">{x.d}<span className="mt-1 block text-[10.5px] text-[var(--tinta-3)]">{x.f}</span></span>}
      </button>
    </li>
  );
}

export default function Porques() {
  const ref = useRef(null); const visto = useVisto(ref, 0.3);
  const [abierto, setAbierto] = useState(null);
  return (
    <section id="porques" className="relative text-papel">
      <div className="relative mx-auto max-w-[1200px] px-3 py-16 sm:px-8 sm:py-24">
        <div className="border border-[var(--linea-media)] px-4 py-12 sm:px-10 sm:py-16" style={{ background: 'rgba(8,11,13,0.62)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div ref={ref} className="text-center" style={{ opacity: visto ? 1 : 0, transform: `translateY(${visto ? 0 : 16}px)`, transition: 'opacity .9s ease, transform .9s cubic-bezier(.16,1,.3,1)' }}>
            <p className="etiqueta text-arcilla">El problema</p>
            <h2 className="mx-auto mt-4 max-w-4xl text-3xl sm:text-4xl lg:text-5xl">{PROBLEMA}</h2>
          </div>
          <ol className="mt-4">
            {CADENA.map((x, i) => <Nivel key={x.q} x={x} i={i} on={abierto === i} alTocar={() => setAbierto(abierto === i ? null : i)} />)}
          </ol>
        </div>
      </div>
    </section>
  );
}
