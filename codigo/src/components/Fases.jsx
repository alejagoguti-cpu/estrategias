import React, { useEffect, useRef, useState } from 'react';

// Fases de implementación (sección final): cuatro paneles verticales como una lámina de fases. Cada panel muestra
// el recorrido realista de esa etapa, un plano de la isla que se va completando y llamadas con contorno coral.
// Interactivo: línea de tiempo de 0 a 10 años (arrastrable y con reproducción), paneles que se amplían al pasar
// el cursor o al tocar, y un botón para ir al recorrido 3D de cada fase.
const BASE = import.meta.env.BASE_URL;
const FASES = [
  {
    n: 1, anio: 2, titulo: 'Puentes y pasarelas', img: 'puentes', ir: 'paisaje-adaptativo', filtro: 'grayscale(.55) contrast(1.05) brightness(.95)',
    texto: 'Primero se conecta la isla con el agua sin rellenar el borde: pasarelas palafíticas sobre la marisma y puentes peatonales entre poblados. El enrocado permeable empieza a frenar la erosión y el manglar se siembra entre los pilotes.',
    llamadas: [{ x: 50, y: 72, w: 46, h: 16, t: 'Pasarela palafítica +2,10 m' }, { x: 18, y: 50, w: 22, h: 10, t: 'Manglar sembrado' }],
    mapa: ['puentes'],
  },
  {
    n: 2, anio: 4, titulo: 'Humedal de fitofiltración', img: 'humedal', ir: 'humedal', filtro: 'grayscale(.32) saturate(.9)',
    texto: 'Con la isla conectada, en la meseta se excavan las lagunas de retención: guardan la lluvia, la limpian entre juncos y lirios acuáticos y recargan el acuífero. El agua deja de bajar como escorrentía sobre los poblados.',
    llamadas: [{ x: 50, y: 62, w: 52, h: 12, t: 'Puente sobre la laguna' }, { x: 16, y: 74, w: 26, h: 8, t: 'Lirio acuático · juncos' }],
    mapa: ['puentes', 'humedal'],
  },
  {
    n: 3, anio: 6, titulo: 'Viviendas modulares', img: 'viviendas', ir: 'vivienda', filtro: 'grayscale(.12) saturate(1.02)',
    texto: 'Las familias del borde que se pierde se reubican en la meseta segura (+22 m) en viviendas de módulos de 3,6 m que captan lluvia y sol. El mismo módulo se repite en hilera o en L según cada familia.',
    llamadas: [{ x: 46, y: 43, w: 62, h: 14, t: 'Módulos de 3,6 m' }, { x: 30, y: 53, w: 40, h: 6, t: 'Deck +0,45 m' }],
    mapa: ['puentes', 'humedal', 'viviendas'],
  },
  {
    n: 4, anio: 10, titulo: 'Colegio y vida en común', img: 'colegio', ir: 'colegio', filtro: 'saturate(1.12) contrast(1.03)',
    texto: 'A los diez años la meseta ya es un barrio: el colegio de tierra bajo su cubierta de sombra, la huerta comunitaria y el parque en el bosque seco. El borde costero quedó como parque inundable y el ecosistema se reconecta.',
    llamadas: [{ x: 55, y: 36, w: 56, h: 18, t: 'Aulas de tierra' }, { x: 50, y: 70, w: 40, h: 12, t: 'Patio y galería' }],
    mapa: ['puentes', 'humedal', 'viviendas', 'colegio'],
  },
];
// plano esquemático de Tierra Bomba (contorno simplificado) con lo construido en cada fase
const CAPAS = {
  puentes: <g stroke="#f2a65a" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M18,30 C14,44 14,58 20,72" strokeDasharray="2 1.5" /><path d="M62,18 C70,30 74,40 72,52" strokeDasharray="2 1.5" /><path d="M28,84 C38,90 50,92 58,86" strokeDasharray="2 1.5" /></g>,
  humedal: <g fill="#49c6e5" opacity="0.9"><ellipse cx="42" cy="44" rx="5" ry="3.4" /><ellipse cx="36" cy="54" rx="3.6" ry="2.6" /><ellipse cx="48" cy="58" rx="3" ry="2.2" /></g>,
  viviendas: <g fill="#e8eef0">{[[30, 34], [34, 34], [38, 34], [52, 40], [56, 40], [52, 44], [30, 64], [34, 64], [38, 64]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="3" height="3" />)}</g>,
  colegio: <g><rect x="44" y="66" width="10" height="5" fill="#ff6b4a" /><circle cx="58" cy="70" r="3" fill="#7fc04a" /><rect x="40" y="73" width="6" height="4" fill="#c8e05a" /></g>,
};
function Plano({ capas, verde }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <path d="M40,8 C56,6 70,12 74,26 C80,40 76,56 70,70 C64,84 52,94 38,92 C24,90 14,78 14,62 C14,46 20,34 26,22 C30,14 34,9 40,8Z" fill={`rgba(120,200,90,${verde})`} stroke="rgba(255,255,255,.85)" strokeWidth="0.9" />
      {capas.map((c) => <g key={c}>{CAPAS[c]}</g>)}
    </svg>
  );
}

export default function Fases() {
  const [anio, setAnio] = useState(0);
  const [foco, setFoco] = useState(null);
  const [play, setPlay] = useState(false);
  const caja = useRef(null);
  const activa = FASES.filter((f) => f.anio <= anio).length - 1; // índice de la última fase alcanzada
  // al entrar en pantalla la línea de tiempo avanza sola una vez
  useEffect(() => { const el = caja.current; if (!el) return undefined; const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPlay(true); io.disconnect(); } }, { threshold: 0.35 }); io.observe(el); return () => io.disconnect(); }, []);
  useEffect(() => { if (!play) return undefined; const id = setInterval(() => setAnio((a) => { if (a >= 10) { setPlay(false); return 10; } return Math.round((a + 0.1) * 10) / 10; }), 120); return () => clearInterval(id); }, [play]);
  const ir = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="fases" ref={caja} className="relative bg-tinta px-4 pb-16 pt-24 text-papel sm:px-8 lg:px-10" aria-label="Fases de implementación del plan en Tierra Bomba">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etiqueta text-arcilla">14 · Fases</p>
          <h2 className="mt-3 text-3xl leading-[1.02] sm:text-4xl">Diez años para transformar la isla</h2>
        </div>
        <p className="max-w-md text-[13px] leading-snug text-white/65">Cada fase prepara la siguiente: primero el agua y la conexión, luego el suelo seguro y, al final, la vida en común. Pase el cursor o toque un panel; mueva la línea de tiempo.</p>
      </div>

      {/* línea de tiempo */}
      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={() => { if (anio >= 10) setAnio(0); setPlay((p) => !p); }} className="h-9 shrink-0 rounded-full bg-white/10 px-4 text-[12px] hover:bg-white/20">{play ? '❚❚ Pausa' : '▶ Reproducir'}</button>
        <div className="relative flex-1">
          <input type="range" min="0" max="10" step="0.1" value={anio} onChange={(e) => { setPlay(false); setAnio(+e.target.value); }} className="w-full accent-[#ff6b4a]" aria-label="Año del plan" />
          <div className="pointer-events-none relative mt-1 h-5 font-mono text-[10.5px] text-white/60">
            {FASES.map((f) => <span key={f.n} className={`absolute -translate-x-1/2 whitespace-nowrap ${anio >= f.anio ? 'text-arcilla' : ''}`} style={{ left: `${Math.min(f.anio * 10, 97)}%` }}>año {f.anio}</span>)}
          </div>
        </div>
        <span className="w-20 shrink-0 text-right font-mono text-[13px] text-arcilla">año {anio.toFixed(anio % 1 ? 1 : 0)}</span>
      </div>

      {/* paneles */}
      <div className="mt-5 flex h-[78svh] min-h-[560px] gap-2 overflow-x-auto lg:overflow-visible">
        {FASES.map((f, i) => {
          const hecha = i <= activa; const ancho = foco === i ? 2.1 : foco == null && i === activa ? 1.5 : 1;
          return (
            <article key={f.n} onMouseEnter={() => setFoco(i)} onMouseLeave={() => setFoco(null)} onClick={() => { setFoco(i); setPlay(false); setAnio(f.anio); }}
              className="group relative min-w-[260px] cursor-pointer overflow-hidden transition-[flex-grow] duration-500 ease-out" style={{ flexGrow: ancho, flexBasis: 0 }}>
              <img src={`${BASE}datos/fases/${f.img}.webp`} alt={`Fase ${f.n}: ${f.titulo}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 group-hover:scale-[1.03]" style={{ filter: hecha ? f.filtro : 'grayscale(1) brightness(.45)' }} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/40" />
              {/* cabecera */}
              <div className="absolute inset-x-0 top-0 p-4 pr-[34%]">
                <h3 className="font-['Barlow_Condensed'] text-[1.75rem] font-light uppercase leading-none tracking-tight">Fase {f.n} : año {f.anio}</h3>
                <p className="mt-1 text-[13px] font-medium text-arcilla">{f.titulo}</p>
                <p className={`mt-2 text-[12px] leading-snug text-white/85 transition-opacity duration-500 ${hecha ? 'opacity-100' : 'opacity-40'}`}>{f.texto}</p>
              </div>
              {/* plano de la isla */}
              <div className="absolute right-3 top-3 aspect-square w-[30%] max-w-[120px] rounded-sm bg-black/30 p-1 ring-1 ring-white/25 backdrop-blur-[2px]" style={{ transform: 'perspective(300px) rotateX(28deg) rotateZ(-8deg)' }}>
                <Plano capas={hecha ? f.mapa : f.mapa.slice(0, -1)} verde={hecha ? 0.15 + i * 0.12 : 0.05} />
              </div>
              {/* llamadas con contorno coral */}
              {hecha && f.llamadas.map((l, k) => (
                <div key={k} className="entra pointer-events-none absolute" style={{ left: `${l.x - l.w / 2}%`, top: `${l.y - l.h / 2}%`, width: `${l.w}%`, height: `${l.h}%` }}>
                  <div className="h-full w-full rounded-[40%] border-[1.6px] border-dashed border-[#ff6b4a]/90 shadow-[0_0_14px_rgba(255,107,74,.35)]" />
                  <span className="absolute -top-5 left-1 whitespace-nowrap text-[11px] font-medium text-white [text-shadow:0_1px_4px_rgba(0,0,0,.8)]">{l.t}</span>
                </div>
              ))}
              {!hecha && <div className="absolute inset-0 grid place-items-center"><span className="rounded-full border border-white/30 bg-black/40 px-3 py-1 font-mono text-[11px] text-white/80">desde el año {f.anio}</span></div>}
              <button type="button" onClick={(e) => { e.stopPropagation(); ir(f.ir); }} className="absolute bottom-4 left-4 rounded-full bg-black/55 px-4 py-2 text-[12px] text-white backdrop-blur transition hover:bg-arcilla">Recorrer en 3D ↑</button>
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-white/40">Imágenes: los recorridos realistas de cada sección. Plano de la isla esquemático; los plazos son los propuestos para cada fase.</p>
    </section>
  );
}
