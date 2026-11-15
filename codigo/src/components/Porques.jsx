import React, { useEffect, useRef, useState } from 'react';
import D from '../data/porques.json';

// Cinco porqués: empieza con el problema central; cada clic revela el siguiente. Al tocar una tarjeta se abre
// cómo se mide, ya calculado con los datos de la presentación (o el dato que falta, dicho como tal).
const fmt = (n) => Math.round(n).toLocaleString('es-CO');
const ARC = '#c86d51'; const MAR = '#5fb3a8'; const CIELO = '#8fd3ee';

function Barras({ datos, total, colores }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 60); return () => clearTimeout(t); }, []);
  const max = Math.max(...datos.map((d) => d.n));
  return (
    <ul className="space-y-2.5">
      {datos.map((d, i) => (
        <li key={d.l} className="grid grid-cols-[9.5rem_1fr_4.5rem] items-center gap-3 text-[13px] sm:grid-cols-[12rem_1fr_5rem]">
          <span className="text-white/80">{d.l}</span>
          <span className="h-3.5 bg-white/8"><span className="block h-full transition-[width] duration-[1100ms] ease-out" style={{ width: v ? `${(d.n / max) * 100}%` : 0, background: colores[i % colores.length], transitionDelay: `${i * 110}ms` }} /></span>
          <span className="num text-right text-white/90">{fmt(d.n)}<span className="ml-1 text-[11px] text-white/45">{Math.round((100 * d.n) / total)} %</span></span>
        </li>
      ))}
    </ul>
  );
}

function Linea({ hitos }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 60); return () => clearTimeout(t); }, []);
  return (
    <ol className="relative ml-2 border-l border-white/20 pl-5">
      {hitos.map(([a, t, f], i) => (
        <li key={t} className="relative pb-3 transition-all duration-700" style={{ opacity: v ? 1 : 0, transform: `translateX(${v ? 0 : -10}px)`, transitionDelay: `${i * 120}ms` }}>
          <i className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: ARC }} />
          <p className="num text-sm font-semibold">{a}</p>
          <p className="text-[13px] leading-snug text-white/80">{t}</p>
          <p className="text-[11px] text-white/40">{f}</p>
        </li>
      ))}
    </ol>
  );
}

const P1 = D.p1.filter((x) => x.n > 0);
const NIVELES = [
  {
    frase: 'Las viviendas y los modos de habitar',
    sub: 'Estado de deterioro y usos distintos según el tramo de costa y la cercanía al muelle.',
    hip: null,
    mide: () => (
      <p className="text-[13px] leading-relaxed text-white/75">{fmt(D.total)} construcciones en el archivo de la tesis, repartidas en cuatro sectores. Cada porqué de abajo es una hipótesis que se prueba con un dato.</p>
    ),
  },
  {
    frase: '¿Por qué se deterioran?',
    hip: 'La erosión del tramo donde están.',
    erosion: true,
    mide: () => (
      <>
        <p className="mb-3 text-[13px] text-white/75">Viviendas según la amenaza por erosión del tramo de costa más cercano (a menos de 200 m):</p>
        <Barras total={D.total} datos={P1} colores={P1.map((x) => ({ 'Muy Alta': '#ff3b3b', Alta: '#ff8c1a', Moderada: '#ffe14d', Baja: '#9be15d', 'Muy Baja': '#2ecc71' }[x.l] || '#6b7680'))} />
        <p className="mt-3 text-[11px] leading-snug text-white/45">Fuente: MIDAS (INVEMAR 2011) y construcciones del archivo de la tesis. Mide exposición por tramo; el estado de deterioro de cada vivienda todavía no está levantado: falta el inventario en campo.</p>
      </>
    ),
  },
  {
    frase: '¿Por qué hay viviendas en el borde?',
    hip: 'El muelle en la orilla es la puerta a Cartagena.',
    mide: () => (
      <>
        <p className="mb-3 text-[13px] text-white/75">Distancia en línea recta de cada vivienda al punto de embarque más cercano. Mediana: <strong className="num text-white">{fmt(D.p2.mediana)} m</strong>.</p>
        <Barras total={D.total} datos={D.p2.bins} colores={[CIELO, MAR, '#4b8fa0', '#3a5c68']} />
        <p className="mt-3 text-[11px] leading-snug text-white/45">Puntos de embarque: muelles de OpenStreetMap y la playa del pueblo, donde llegan las lanchas. Distancia en línea recta, no por la red de caminos.</p>
      </>
    ),
  },
  {
    frase: '¿Por qué no en la parte alta?',
    hip: 'El suelo, el acceso y la topografía.',
    erosion: true,
    mide: () => (
      <>
        <p className="mb-3 text-[13px] text-white/75">Altura del terreno donde está cada vivienda, frente a la cota +22 m de la meseta del plan:</p>
        <Barras total={D.total} datos={[{ l: 'Menos de 5 m', n: D.p3.bajo5 }, { l: 'Entre 5 y 22 m', n: D.p3.de5a22 }, { l: 'Sobre 22 m', n: D.p3.sobre22 }]} colores={[ARC, '#d9a066', MAR]} />
        <p className="mt-3 text-[13px] text-white/75">Dentro del polígono de la meseta hay hoy <strong className="num text-white">{fmt(D.p3.enMeseta)}</strong> construcciones.</p>
        <p className="mt-2 text-[11px] leading-snug text-white/45">Relieve Terrain Tiles (unos 30 m de resolución, varios metros de error vertical). Falta el dato de tenencia del suelo en la meseta (propietarios, predios).</p>
      </>
    ),
  },
  {
    frase: '¿Por qué la isla depende de Cartagena?',
    hip: 'Agua, alimentos, trabajo, educación y salud vienen de afuera.',
    mide: () => (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="num text-3xl font-semibold" style={{ color: CIELO }}>614</p><p className="text-[12px] text-white/65">viajes de Tierra Bomba a Bocagrande</p></div>
          <div><p className="num text-3xl font-semibold" style={{ color: ARC }}>407</p><p className="text-[12px] text-white/65">viajes de vuelta a la isla</p></div>
        </div>
        <p className="mt-2 text-[11px] text-white/45">13 horas en el embarcadero del Hospital de Bocagrande, aforo de mayo de 2014.</p>
        <ul className="mt-4 grid grid-cols-2 gap-2 text-[12.5px] sm:grid-cols-5">
          {[['Agua', 'sin aforo'], ['Alimentos', 'sin aforo'], ['Trabajo', 'sin aforo'], ['Educación', 'docentes en lancha (2017)'], ['Salud', 'viajes a Bocagrande']].map(([f, e]) => (
            <li key={f} className="border border-white/15 p-2"><p className="font-semibold">{f}</p><p className="text-[11px] text-white/50">{e}</p></li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-snug text-white/45">Falta contar cantidades por flujo (carga de agua, alimentos, personas por motivo de viaje).</p>
      </>
    ),
  },
  {
    frase: '¿Qué decidió dónde van servicios y muelles?',
    hip: 'Decisiones y normas del Distrito.',
    mide: () => (
      <Linea hitos={[
        ['2001', 'Plan de Ordenamiento Territorial de Cartagena', 'Capa «POT 2001» en MIDAS'],
        ['2014', 'Capas de cambio climático: inundación y erosión', 'Secretaría de Planeación, INVEMAR y CDKN'],
        ['2014', 'Estudio de prefactibilidad de transporte acuático', 'Propone muelles en Tierra Bomba, Punta Arena, Caño del Oro y Bocachica'],
        ['2021', 'Vía carreteable entre los cuatro poblados (4 de 13 km)', 'Armada Nacional y Gobernación de Bolívar'],
        ['2022', 'Centro de salud renovado (84 → 253 m²)', 'ESE Cartagena de Indias'],
        ['2027', 'Transcaribe acuático, previsto', 'Revista Metro (2026)'],
      ]} />
    ),
  },
];

export default function Porques() {
  const [vistos, setVistos] = useState(1);
  const [abierto, setAbierto] = useState(null);
  const finRef = useRef(null);
  const completo = vistos >= NIVELES.length;
  const siguiente = () => { if (!completo) { setVistos((v) => v + 1); setAbierto(null); } };
  useEffect(() => { if (vistos > 1) finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [vistos]);
  const erosionVisible = vistos >= 2;

  return (
    <section id="porques" className="relative bg-tinta text-papel">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:px-10 sm:py-28">
        <p className="etiqueta text-arcilla">Cinco porqués</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">Del problema a lo que hay que medir.</h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">Entre un porqué y otro no decimos «causa»: decimos «se relaciona con», hasta que el dato lo confirme. Toca una tarjeta para ver cómo se mide.</p>

        <div className="relative mt-14 lg:grid lg:grid-cols-[1fr_15rem] lg:gap-10">
          <ol className="relative">
            {NIVELES.slice(0, vistos).map((n, i) => {
              const ab = abierto === i;
              return (
                <li key={n.frase} className="porque-entra">
                  {i > 0 && (
                    <div className="flex flex-col items-center py-3" aria-hidden="true">
                      <span className="porque-flecha block w-px bg-gradient-to-b from-white/10 to-arcilla" />
                      <span className="etiqueta my-2 rounded-full border border-white/20 px-3 py-1 text-[10px] text-white/60">se relaciona con</span>
                      <span className="porque-flecha block w-px bg-gradient-to-b from-arcilla to-white/10" />
                    </div>
                  )}
                  <button type="button" onClick={() => setAbierto(ab ? null : i)} aria-expanded={ab}
                    className={`group w-full rounded-[6px] border p-6 text-left transition-all duration-300 sm:p-8 ${i === 0 ? 'border-arcilla/70 bg-arcilla/10' : 'border-white/15 bg-white/[0.03] hover:border-white/40'} ${ab ? 'shadow-[0_20px_60px_-25px_rgba(200,109,81,.6)]' : ''}`}>
                    <div className="flex items-start gap-4">
                      <span className="num mt-1 text-sm text-arcilla">{i === 0 ? '·' : String(i).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">{n.frase}</p>
                        {n.sub && <p className="mt-2 text-sm text-white/60">{n.sub}</p>}
                        {n.erosion && <p className="mt-3 inline-flex items-center gap-2 text-[11px] text-[#ff9a7a] lg:hidden"><i className="inline-block h-2 w-2 rounded-full bg-[#ff6b4a]" />se relaciona con la erosión costera</p>}
                      </div>
                      <span className={`etiqueta mt-2 shrink-0 text-white/40 transition-transform duration-300 ${ab ? 'rotate-45 text-arcilla' : ''}`}>+</span>
                    </div>
                    <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${ab ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        {ab && (
                          <div className="mt-6 border-t border-white/15 pt-5">
                            {n.hip && <p className="mb-4 text-[13px] text-white/60">Hipótesis: <span className="text-white/90">{n.hip}</span></p>}
                            <p className="etiqueta mb-3 text-arcilla">Cómo se mide</p>
                            {n.mide()}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* recuadro lateral: la erosión entra en los porqués 1 y 3 */}
          <aside className={`hidden transition-all duration-700 lg:block ${erosionVisible ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!erosionVisible}>
            <div className="sticky top-28 rounded-[6px] border border-dashed border-[#ff6b4a]/60 p-5">
              <p className="etiqueta text-[#ff9a7a]">Erosión costera</p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">La costa que retrocede condiciona qué viviendas se deterioran (porqué 1) y hacia dónde conviene subir (porqué 3).</p>
              <p className="num mt-3 text-[12px] text-white/50">0,63 a 3 m/año · INVEMAR</p>
            </div>
          </aside>
        </div>

        <div ref={finRef} className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="etiqueta num text-white/45">{String(vistos - 1).padStart(2, '0')} / 05 porqués</p>
          {!completo ? (
            <button type="button" onClick={siguiente} className="red-boton">{vistos === 1 ? '¿Por qué? ↓' : 'Siguiente porqué ↓'}</button>
          ) : (
            <button type="button" onClick={() => { setVistos(1); setAbierto(null); }} className="red-boton">Volver a empezar ↺</button>
          )}
        </div>
      </div>
    </section>
  );
}
