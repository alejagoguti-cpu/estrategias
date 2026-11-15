import React, { useEffect, useRef, useState } from 'react';
import D from '../data/porques.json';

// El problema hasta la raíz: tres ramas (el borde, la tierra, la dependencia de Cartagena).
// Cada rama baja con «¿por qué?» de lo que se ve a su raíz; cada paso trae su dato y su fuente.
// Las tres raíces llegan a una raíz común. Los niveles aparecen al bajar; al tocar un paso se abre su fuente.
const fmt = (n) => Math.round(n).toLocaleString('es-CO');
const muyAlta = (D.p1.find((x) => x.l === 'Muy Alta') || {}).n || 0;

const RAMAS = [
  {
    id: 'borde',
    titulo: 'El mar en el borde',
    pasos: [
      { t: 'Las casas del borde se dañan y se pierden', dato: '891', u: 'de 2.600 construcciones', txt: 'quedan en la franja que el mar alcanza en 30 años, con las tasas de retroceso de cada tramo.', f: 'Modelo de esta presentación: tasas INVEMAR por clase de amenaza de MIDAS y construcciones del archivo de la tesis.' },
      { t: 'porque el mar avanza sobre la costa', dato: '0,63–3', u: 'm por año', txt: 'de retroceso medido en la isla entre 1994 y 2011.', f: 'INVEMAR-MADS-Alcaldía de Cartagena-CDKN (2012), Lineamientos de adaptación, p. 20.' },
      { t: 'y el pueblo está en la parte más baja y expuesta', dato: fmt(D.p3.bajo5), u: 'construcciones', txt: `a menos de 5 m sobre el mar; ${fmt(muyAlta)} están frente a tramos de amenaza muy alta por erosión.`, f: 'Relieve Terrain Tiles (≈30 m) y amenaza por erosión de MIDAS sobre las construcciones del archivo de la tesis.' },
      { t: 'porque la vida de la isla está atada a la orilla', dato: fmt(D.p2.mediana), u: 'm', txt: 'es la distancia mediana de una vivienda al punto de embarque. Se vive de la pesca, las lanchas y el turismo de playa: todo pasa por la orilla.', f: 'Cartagena Cómo Vamos, Informe de Calidad de Vida 2022 (Barú y Tierrabomba); muelles de OpenStreetMap.', raiz: true },
    ],
  },
  {
    id: 'tierra',
    titulo: 'La tierra',
    pasos: [
      { t: 'Nadie sube a la parte alta, que es segura', dato: fmt(D.p3.enMeseta), u: 'construcciones', txt: 'hay hoy en la meseta, sobre la cota +22 m, donde el mar no llega.', f: 'Polígono de la meseta del plan y construcciones del archivo de la tesis.' },
      { t: 'porque esa tierra no es de quienes viven en la isla', dato: '≈1.080', u: 'ha', txt: 'son de particulares; 261 ha de la Armada y 176 ha de la Nación, según la clarificación de la propiedad de 2015.', f: 'Incoder, Resolución 4192 de 2015, citada por Semana y Dejusticia (las cifras varían entre fuentes).' },
      { t: 'y ni siquiera el suelo del pueblo es de la comunidad', dato: '379', u: 'ha', txt: 'donde está asentado el poblado quedaron a nombre del Distrito de Cartagena.', f: 'Resolución 4192 de 2015; Dejusticia, «¿Tierrabomba para quién?»; Publimetro (2023).' },
      { t: 'porque el título colectivo sigue sin resolverse', dato: '2.039', u: 'ha', txt: 'pide en titulación colectiva el Consejo Comunitario. Depende de que el Distrito done su predio: la donación se prometió y el proyecto se retiró del Concejo.', f: 'Ficha del Consejo Comunitario de Tierra Bomba; Dejusticia; Publimetro (2023).', raiz: true },
    ],
  },
  {
    id: 'cartagena',
    titulo: 'La dependencia de Cartagena',
    pasos: [
      { t: 'La isla vive pendiente del muelle', dato: '614', u: 'viajes', txt: 'de la isla a Bocagrande en 13 horas, y 407 de vuelta, en un solo embarcadero.', f: 'Estudio de prefactibilidad de transporte acuático de Cartagena, aforo de mayo de 2014.' },
      { t: 'porque los servicios básicos no están en la isla', dato: '330', u: 't de agua', txt: 'llegan en bongos desde El Bosque para Bocachica: no hay acueducto ni alcantarillado. Tampoco hay ambulancia acuática, y en Punta Arena solo hay hasta primaria.', f: 'Alcaldía de Cartagena (plan de suministro por la sentencia T-012 de 2019); El Universal; SED Cartagena.' },
      { t: 'y en la isla casi no hay empleo ni ingresos', dato: '96,7', u: '%', txt: 'de la población de los corregimientos de Tierra Bomba en pobreza.', f: 'Cartagena Cómo Vamos, Informe de Calidad de Vida 2019-2020, citado por El Universal.' },
      { t: 'porque la isla se planea y se financia desde fuera', dato: '2024', u: '', txt: 'el acueducto (más de 130.000 millones con alcantarillado) se entregó al Ministerio de Vivienda para su evaluación. Agua, muelles y suelo se deciden en Cartagena y en Bogotá.', f: 'El Universal (1 de febrero de 2024); Alcaldía de Cartagena; POT de Cartagena (2001).', raiz: true },
    ],
  },
];

const RAIZ_COMUN = {
  t: 'Sin suelo propio ni servicios propios, frente a un mar que avanza',
  txt: 'La comunidad no es dueña de la tierra que habita, depende de Cartagena para el agua, la salud, el estudio y el trabajo, y vive en el borde que el mar se está llevando. Por eso no puede adaptarse por su cuenta: ni subir a la parte alta, ni quedarse segura donde está.',
};

function useVisto(ref, umbral = 0.25) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); io.disconnect(); } }, { threshold: umbral });
    io.observe(el); return () => io.disconnect();
  }, [ref, umbral]);
  return v;
}

function Paso({ p, i, ri, abierto, setAbierto, visto }) {
  const id = `${ri}-${i}`; const on = abierto === id;
  const ret = 0.15 + i * 0.35 + ri * 0.08;
  return (
    <li className="relative" style={{ opacity: visto ? 1 : 0, transform: `translateY(${visto ? 0 : 24}px)`, transition: `opacity .8s cubic-bezier(.16,1,.3,1) ${ret}s, transform .8s cubic-bezier(.16,1,.3,1) ${ret}s` }}>
      {i > 0 && (
        <div className="relative flex h-12 items-center" aria-hidden="true">
          <span className="absolute left-[14px] top-0 h-full w-px origin-top bg-[var(--linea-fuerte)]" style={{ transform: `scaleY(${visto ? 1 : 0})`, transition: `transform .5s ease ${ret - 0.1}s` }} />
          <span className="etiqueta ml-9 text-[10px] text-[var(--tinta-3)]">¿por qué?</span>
        </div>
      )}
      <button type="button" onClick={() => setAbierto(on ? null : id)} aria-expanded={on}
        className={`group block w-full border p-4 text-left transition-colors ${p.raiz ? 'border-arcilla bg-[rgb(255_107_74/.08)]' : on ? 'border-[var(--tinta-2)] bg-[var(--campo-1)]' : 'border-[var(--linea-media)] bg-[rgb(8_11_13/.55)] hover:border-[var(--tinta-2)]'}`}>
        <p className={`etiqueta text-[10px] ${p.raiz ? 'text-arcilla' : 'text-[var(--tinta-3)]'}`}>{p.raiz ? 'Raíz' : i === 0 ? 'Lo que se ve' : `Causa ${i}`}</p>
        <p className="mt-1.5 text-[15px] font-medium leading-snug text-white sm:text-base">{p.t}</p>
        <p className="mt-3 flex items-baseline gap-2">
          <span className={`cifra text-[2.4rem] leading-none ${p.raiz ? 'text-arcilla' : 'text-white'}`}>{p.dato}</span>
          {p.u && <span className="text-[12px] text-[var(--tinta-2)]">{p.u}</span>}
        </p>
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--tinta-2)]">{p.txt}</p>
        <div className={`grid transition-[grid-template-rows] duration-500 ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <p className="overflow-hidden text-[11px] leading-snug text-[var(--tinta-3)]"><span className="mt-3 block border-t border-[var(--linea)] pt-2">Fuente: {p.f}</span></p>
        </div>
        {!on && <span className="etiqueta mt-2 block text-[9.5px] text-[var(--tinta-4)] group-hover:text-[var(--tinta-3)]">Ver fuente +</span>}
      </button>
    </li>
  );
}

export default function Porques() {
  const ref = useRef(null); const visto = useVisto(ref, 0.08);
  const raizRef = useRef(null); const raizVista = useVisto(raizRef, 0.3);
  const [abierto, setAbierto] = useState(null);
  return (
    <section id="porques" className="relative text-papel">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-tinta/40" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1640px] px-3 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="border border-[var(--linea-media)] px-5 py-10 sm:px-10 sm:py-12 lg:px-14" style={{ background: 'rgba(8,11,13,0.62)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="etiqueta text-arcilla">El problema, hasta la raíz</p>
              <h2 className="mt-4 max-w-4xl text-2xl sm:text-3xl lg:text-4xl">De lo que se ve a lo que lo causa.</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[var(--tinta-2)]">Tres ramas bajan desde lo que se ve en la isla, preguntando <span className="text-white">«¿por qué?»</span> hasta llegar a su raíz. Toque un paso para ver de dónde sale el dato.</p>
          </div>

          {/* las tres ramas */}
          <div ref={ref} className="mt-12 grid gap-12 lg:grid-cols-3 lg:gap-8">
            {RAMAS.map((r, ri) => (
              <div key={r.id}>
                <p className="flex items-center gap-3 border-b border-[var(--linea-media)] pb-3" style={{ opacity: visto ? 1 : 0, transition: `opacity .8s ease ${ri * 0.08}s` }}>
                  <span className="cifra text-3xl leading-none text-arcilla">{String(ri + 1).padStart(2, '0')}</span>
                  <span className="text-[13px] uppercase tracking-[.12em] text-white">{r.titulo}</span>
                </p>
                <ol className="mt-5">
                  {r.pasos.map((p, i) => <Paso key={p.t} p={p} i={i} ri={ri} abierto={abierto} setAbierto={setAbierto} visto={visto} />)}
                </ol>
              </div>
            ))}
          </div>

          {/* las raíces convergen en una */}
          <div ref={raizRef} className="mt-4">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="hidden h-24 w-full lg:block" aria-hidden="true">
              {[200, 600, 1000].map((x, k) => (
                <path key={x} d={`M${x} 0 C ${x} 70, 600 50, 600 120`} fill="none" stroke="#ff6b4a" strokeWidth="1.4" vectorEffect="non-scaling-stroke" pathLength="1" strokeDasharray="1" strokeDashoffset={raizVista ? 0 : 1} style={{ transition: `stroke-dashoffset 1.3s cubic-bezier(.65,0,.35,1) ${k * 0.15}s` }} />
              ))}
            </svg>
            <div className="mx-auto mt-8 max-w-3xl border border-arcilla p-6 text-center sm:p-8 lg:mt-0" style={{ background: 'rgb(255 107 74 / .1)', opacity: raizVista ? 1 : 0, transform: `translateY(${raizVista ? 0 : 20}px)`, transition: 'opacity 1s ease .9s, transform 1s cubic-bezier(.16,1,.3,1) .9s' }}>
              <p className="etiqueta text-arcilla">Raíz común</p>
              <p className="mt-3 text-[1.6rem] leading-tight sm:text-3xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 300, textTransform: 'uppercase' }}>{RAIZ_COMUN.t}</p>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--tinta-2)]">{RAIZ_COMUN.txt}</p>
            </div>
          </div>
          <p className="mt-8 text-[11px] leading-snug text-[var(--tinta-3)]">Entre un paso y otro hay una relación sostenida por el dato, no una causa probada. Cifras de años distintos (2011 a 2024). Faltan el inventario del estado de cada vivienda y el estado actual del trámite de titulación y del acueducto.</p>
        </div>
      </div>
    </section>
  );
}
