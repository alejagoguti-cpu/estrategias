import React, { useEffect, useRef, useState } from 'react';
import D from '../data/porques.json';

// Cinco porqués: empieza con el problema central; cada clic revela el siguiente. Al tocar una tarjeta se abre
// cómo se mide, ya calculado con los datos de la presentación (o el dato que falta, dicho como tal).
const fmt = (n) => Math.round(n).toLocaleString('es-CO');
const ARC = '#ff6b4a'; const MAR = '#5fb3a8'; const CIELO = '#8fd3ee';

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
    frase: 'Viviendas deterioradas y modos de habitar distintos',
    sub: 'El estado de las viviendas y la forma de habitarlas cambian según el tramo de costa y la cercanía al muelle.',
    mide: () => (
      <p className="text-[13px] leading-relaxed text-white/75">{fmt(D.total)} construcciones en el archivo de la tesis, repartidas en cuatro sectores. Cada nivel que se despliega es una relación que se prueba con un dato.</p>
    ),
  },
  {
    frase: 'Erosión del tramo de costa',
    sub: 'Las viviendas se deterioran según la erosión del tramo de costa donde están.',
    erosion: true,
    mide: () => (
      <>
        <p className="mb-3 text-[13px] text-white/75">Viviendas según la amenaza por erosión del tramo de costa más cercano (a menos de 200 m):</p>
        <Barras total={D.total} datos={P1} colores={P1.map((x) => ({ 'Muy Alta': '#c8102e', Alta: '#e04a64', Moderada: '#ee8fa0', Baja: '#f5c6cf', 'Muy Baja': '#f9e3e7' }[x.l] || '#6b7680'))} />
        <p className="mt-3 text-[11px] leading-snug text-white/45">Fuente: MIDAS (INVEMAR 2011) y construcciones del archivo de la tesis. Mide exposición por tramo; el estado de deterioro de cada vivienda todavía no está levantado: falta el inventario en campo.</p>
      </>
    ),
  },
  {
    frase: 'Vivienda concentrada en el borde',
    sub: 'Se vive en la orilla porque ahí está el muelle, la puerta de salida hacia Cartagena.',
    mide: () => (
      <>
        <p className="mb-3 text-[13px] text-white/75">Distancia en línea recta de cada vivienda al punto de embarque más cercano. Mediana: <strong className="num text-white">{fmt(D.p2.mediana)} m</strong>.</p>
        <Barras total={D.total} datos={D.p2.bins} colores={[CIELO, MAR, '#4b8fa0', '#3a5c68']} />
        <p className="mt-3 text-[11px] leading-snug text-white/45">Puntos de embarque: muelles de OpenStreetMap y la playa del pueblo, donde llegan las lanchas. Distancia en línea recta, no por la red de caminos.</p>
      </>
    ),
  },
  {
    frase: 'Parte alta sin ocupar',
    sub: 'Subir no ha sido opción: la tenencia del suelo, el acceso y la topografía lo frenan.',
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
    frase: 'Dependencia de Cartagena',
    sub: 'Agua, alimentos, trabajo, educación y salud llegan de afuera, y casi todo pasa por el muelle.',
    mide: () => (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="cifra text-[2.6rem] leading-none" style={{ color: CIELO }}>614</p><p className="text-[12px] text-white/65">viajes de Tierra Bomba a Bocagrande</p></div>
          <div><p className="cifra text-[2.6rem] leading-none" style={{ color: ARC }}>407</p><p className="text-[12px] text-white/65">viajes de vuelta a la isla</p></div>
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
    frase: 'Decisiones del Distrito',
    sub: 'Dónde quedan servicios y muelles lo han definido normas y planes de Cartagena, no la isla.',
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
  const [sel, setSel] = useState(0);
  const completo = vistos >= NIVELES.length;
  const secRef = useRef(null);
  const [auto, setAuto] = useState(0); // al entrar en pantalla, los niveles se despliegan solos
  useEffect(() => {
    const el = secRef.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setAuto((a) => a || 1); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto || vistos >= NIVELES.length) return undefined;
    const t = setTimeout(() => { setSel(vistos); setVistos((v) => v + 1); }, vistos === 1 ? 700 : 1150);
    return () => clearTimeout(t);
  }, [auto, vistos]);
  const n = NIVELES[sel];
  const panelRef = useRef(null);
  const PASO = 12; // % de sangría por escalón (escritorio)

  return (
    <section id="porques" ref={secRef} className="relative text-papel">
      {/* fondo: retícula muy tenue */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-tinta/40" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1640px] px-3 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="rounded-[10px] border border-white/15 px-5 py-10 shadow-[0_24px_60px_-20px_rgba(0,0,0,.55)] sm:px-10 sm:py-12 lg:px-14" style={{ background: 'rgba(8,11,13,0.42)', backdropFilter: 'blur(5px) saturate(1.3)', WebkitBackdropFilter: 'blur(5px) saturate(1.3)' }}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="etiqueta text-arcilla">El problema, desplegado</p>
            <h2 className="mt-4 max-w-4xl text-2xl sm:text-3xl lg:text-4xl">Del problema a lo que hay que medir.</h2>
          </div>
          <p className="etiqueta text-white/45">Entre un nivel y otro: «se relaciona con»</p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(24rem,1fr)] lg:gap-16">
          {/* escalera */}
          <ol className="relative">
            {NIVELES.slice(0, vistos).map((nv, i) => {
              const on = sel === i;
              return (
                <li key={nv.frase} className="porque-entra relative" style={{ '--sangria': `${i * PASO}%` }}>
                  {i > 0 && (
                    <div className="porque-conector relative h-16 sm:h-20" aria-hidden="true">
                      <svg className="absolute inset-y-0 h-full" style={{ left: 'calc(var(--sangria) - 12% + 28px)', width: 'calc(12% + 0px)' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 0 C 0 60, 100 40, 100 100" fill="none" stroke="#ff6b4a" strokeWidth="2" vectorEffect="non-scaling-stroke" pathLength="1" className="porque-trazo" />
                      </svg>
                      <span className="etiqueta absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] text-white/45" style={{ left: 'calc(var(--sangria) + 52px)' }}>se relaciona con</span>
                    </div>
                  )}
                  <button type="button" onClick={() => { setSel(i); if (window.innerWidth < 1024) setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} aria-pressed={on}
                    className="porque-escalon group relative flex w-full items-center gap-5 text-left" style={{ paddingLeft: 'var(--sangria)' }}>
                    <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 font-semibold transition-all duration-300 ${on ? 'scale-110 border-arcilla bg-arcilla text-[#040607]' : i === 0 ? 'border-arcilla text-arcilla' : 'border-white/30 text-white/80 group-hover:border-white'}`}>
                      <span className="num text-base">{i === 0 ? '●' : i}</span>
                      {on && <span className="porque-pulso absolute inset-0 rounded-full border-2 border-arcilla" />}
                    </span>
                    <span className="min-w-0">
                      {i === 0 && <span className="etiqueta block text-arcilla">Problema central</span>}
                      <span className={`block font-semibold leading-[1.05] tracking-tight transition-colors ${i === 0 ? 'text-xl sm:text-2xl' : 'text-base sm:text-xl'} ${on ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{nv.frase}</span>
                      {nv.erosion && <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[#ef7d93]"><i className="inline-block h-1.5 w-1.5 rounded-full bg-[#c8102e]" />erosión costera</span>}
                    </span>
                  </button>
                </li>
              );
            })}
            <li className="porque-escalon mt-10 flex items-center gap-4" style={{ paddingLeft: 'var(--sangria)', '--sangria': `${Math.min(vistos, 5) * PASO}%` }}>
              {completo && <button type="button" onClick={() => { setVistos(1); setSel(0); setAuto((a) => a + 1); }} className="red-boton">Ver de nuevo ↺</button>}
              <span className="etiqueta num text-white/40">{vistos - 1} / 5</span>
            </li>
          </ol>

          {/* panel de medición */}
          <aside ref={panelRef} className="scroll-mt-20 lg:sticky lg:top-24 lg:self-start">
            <div key={sel} className="porque-panel rounded-[8px] border border-white/15 bg-tinta/45 p-6 sm:p-8">
              <p className="etiqueta text-arcilla">{sel === 0 ? 'Problema central' : `Nivel ${sel} · se relaciona con el anterior`}</p>
              <p className="mt-3 text-lg font-semibold leading-tight tracking-tight sm:text-xl">{n.frase}</p>
              {n.sub && <p className="mt-4 border-l-2 border-arcilla pl-4 text-sm leading-snug text-white/85">{n.sub}</p>}
              <p className="etiqueta mb-4 mt-7 text-white/45">Cómo se mide</p>
              {n.mide()}
            </div>

          </aside>
        </div>
        </div>
      </div>
    </section>
  );
}
