import React, { useEffect, useRef, useState } from 'react';
import D from '../data/porques.json';

// Árbol de problemas: el problema arriba; al bajar aparecen debajo las cosas que lo provocan
// (causas directas, sus causas de fondo y la raíz). Las líneas llevan pulsos que suben de la causa al problema.
// Al tocar un recuadro se abre lo que lo muestra y su fuente.
const fmt = (n) => Math.round(n).toLocaleString('es-CO');

const PROBLEMA = { t: 'Familias que tienen que dejar su casa y casas en malas condiciones' };
const DIRECTAS = [
  { t: 'El mar se come el borde donde están las casas', d: '891 de 2.600 construcciones en la franja que se pierde en 30 años; la costa retrocede de 0,63 a 3 m por año.', f: 'Modelo de esta presentación; INVEMAR-MADS-Alcaldía-CDKN (2012).' },
  { t: 'No tienen a dónde moverse dentro de la isla', d: `Solo ${fmt(D.p3.enMeseta)} construcciones en la parte alta, que es segura.`, f: 'Polígono de la meseta y archivo de la tesis.' },
  { t: 'Dependen de Cartagena para vivir', d: '614 viajes en un día desde la isla a Bocagrande, por agua, trabajo, salud y estudio (2014).', f: 'Estudio de transporte acuático (2014).' },
];
const FONDO = [
  { t: 'El pueblo creció en la orilla baja, donde están la pesca, las lanchas y el turismo', d: `${fmt(D.p3.bajo5)} construcciones a menos de 5 m sobre el mar.`, f: 'Terrain Tiles; Cartagena Cómo Vamos (2022).' },
  { t: 'La tierra alta no es de la comunidad, ni el suelo del pueblo tiene título', d: 'Unas 1.080 ha de particulares, 261 ha de la Armada y 176 ha de la Nación; las 379 ha del poblado son del Distrito.', f: 'Incoder, Res. 4192 de 2015 (Semana, Dejusticia).' },
  { t: 'En la isla no hay acueducto, salud completa ni empleo', d: 'El agua llega en bongos; 96,7 % de la población en pobreza.', f: 'Alcaldía de Cartagena; Cartagena Cómo Vamos (2019–2020).' },
];
const RAIZ = { t: 'La comunidad no decide sobre su tierra ni sobre sus servicios: todo se decide desde afuera', d: 'El título colectivo depende de que el Distrito done su predio; el acueducto espera aprobación del Ministerio desde 2024.', f: 'Dejusticia; Publimetro (2023); El Universal (2024).' };

// posiciones en % del lienzo (x, y del centro)
const XS = [17, 50, 83];
const Y = { p: 11, d: 40, f: 66, r: 90 };

function Caja({ x, y, nodo, tipo, on, visible, abierto, alTocar }) {
  const estilos = {
    p: 'border-arcilla bg-[#2a1712] text-white',
    d: 'border-[var(--linea-fuerte)] bg-[#0b1013] text-white',
    f: 'border-[var(--linea-media)] bg-[#0b1013] text-white/85',
    r: 'border-arcilla bg-arcilla text-[#040607]',
  };
  const ancho = tipo === 'p' ? 'w-[44%]' : tipo === 'r' ? 'w-[52%]' : 'w-[29%]';
  return (
    <button type="button" onClick={alTocar} aria-expanded={abierto} tabIndex={visible ? 0 : -1}
      className={`absolute -translate-x-1/2 -translate-y-1/2 border px-3 py-2.5 text-center transition-[opacity,transform,box-shadow] duration-700 ease-[cubic-bezier(.16,1,.3,1)] sm:px-5 sm:py-3.5 ${ancho} ${estilos[tipo]} ${on ? 'shadow-[0_0_0_4px_rgb(255_107_74/.18)]' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, opacity: visible ? 1 : 0, transform: `translate(-50%, ${visible ? '-50%' : '-30%'}) scale(${visible ? 1 : 0.96})`, zIndex: abierto ? 5 : 2 }}>
      <span className={`block leading-snug ${tipo === 'p' ? 'text-[15px] sm:text-xl lg:text-2xl' : tipo === 'r' ? 'text-[13px] font-medium sm:text-lg' : 'text-[11.5px] sm:text-[15px]'}`} style={tipo === 'p' ? { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 300, textTransform: 'uppercase', letterSpacing: '.01em' } : undefined}>{nodo.t}</span>
      {abierto && nodo.d && (
        <span className={`mt-2 block border-t pt-2 text-left text-[11px] leading-snug sm:text-[12px] ${tipo === 'r' ? 'border-black/20 text-black/80' : 'border-[var(--linea)] text-white/70'}`}>{nodo.d}<span className={`mt-1 block text-[10px] ${tipo === 'r' ? 'text-black/60' : 'text-[var(--tinta-3)]'}`}>{nodo.f}</span></span>
      )}
    </button>
  );
}

function Linea({ d, visible, coral, pulsos }) {
  return (
    <g>
      <path d={d} fill="none" stroke={coral ? '#ff6b4a' : 'rgba(214,230,236,.38)'} strokeWidth="1.3" vectorEffect="non-scaling-stroke" pathLength="1" strokeDasharray="1" strokeDashoffset={visible ? 0 : 1} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.65,0,.35,1)' }} />
      {visible && pulsos && [0, 1].map((k) => (
        <circle key={k} r="3.2" fill={coral ? '#ff6b4a' : '#e8eef0'} vectorEffect="non-scaling-stroke">
          <animateMotion dur="2.8s" begin={`${-k * 1.4}s`} repeatCount="indefinite" path={d} keyPoints="1;0" keyTimes="0;1" calcMode="linear" />
        </circle>
      ))}
    </g>
  );
}

export default function Porques() {
  const ref = useRef(null);
  const [p, setP] = useState(0);
  const [abierto, setAbierto] = useState(null);
  useEffect(() => {
    let raf = 0;
    const calc = () => { raf = 0; const el = ref.current; if (!el) return; const r = el.getBoundingClientRect(); const tot = Math.max(1, r.height - window.innerHeight); setP(Math.max(0, Math.min(1, -r.top / tot))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc(); window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  // etapas: 0 problema · 1 causas directas · 2 causas de fondo · 3 raíz
  const etapa = p < 0.12 ? 0 : p < 0.38 ? 1 : p < 0.64 ? 2 : 3;
  const vis = (k) => etapa >= k;
  const tocar = (id) => setAbierto(abierto === id ? null : id);
  const W = 1000; const H = 1000; const px = (x) => (x / 100) * W; const py = (y) => (y / 100) * H;
  const curva = (x0, y0, x1, y1) => `M${px(x0)} ${py(y0)} C ${px(x0)} ${py((y0 + y1) / 2)}, ${px(x1)} ${py((y0 + y1) / 2)}, ${px(x1)} ${py(y1)}`;
  const ETAPAS = ['El problema', 'Lo provocan', 'Y eso viene de', 'La raíz'];
  return (
    <section id="porques" ref={ref} className="relative text-papel" style={{ height: '360svh' }}>
      <div className="sticky top-0 flex h-[100svh] items-center justify-center px-3 pb-4 pt-20 sm:px-8 sm:pt-24">
        <div className="relative h-full w-full max-w-[1200px] border border-[var(--linea-media)]" style={{ background: 'rgba(8,11,13,0.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}>
          {/* rótulo de la etapa */}
          <div className="absolute left-4 right-4 top-4 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 sm:left-6 sm:top-5">
            {ETAPAS.map((e, k) => (
              <span key={e} className={`font-mono text-[9.5px] uppercase tracking-[.12em] transition-colors sm:text-[11px] ${etapa === k ? 'text-arcilla' : etapa > k ? 'text-[var(--tinta-2)]' : 'text-[var(--tinta-4)]'}`}>{e}{k < 3 && <span className="ml-3 hidden text-[var(--tinta-4)] sm:inline">—</span>}</span>
            ))}
          </div>
          <div className="absolute inset-x-2 bottom-2 top-12 sm:inset-x-6 sm:bottom-4 sm:top-14">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
              {XS.map((x, i) => <Linea key={`d${i}`} d={curva(50, Y.p, x, Y.d)} visible={vis(1)} pulsos />)}
              {XS.map((x, i) => <Linea key={`f${i}`} d={curva(x, Y.d, x, Y.f)} visible={vis(2)} pulsos />)}
              {XS.map((x, i) => <Linea key={`r${i}`} d={curva(x, Y.f, 50, Y.r)} visible={vis(3)} coral pulsos />)}
            </svg>
            <Caja x={50} y={Y.p} nodo={PROBLEMA} tipo="p" visible on={etapa === 0} abierto={false} alTocar={() => {}} />
            {DIRECTAS.map((n, i) => <Caja key={n.t} x={XS[i]} y={Y.d} nodo={n} tipo="d" visible={vis(1)} on={etapa === 1} abierto={abierto === `d${i}`} alTocar={() => tocar(`d${i}`)} />)}
            {FONDO.map((n, i) => <Caja key={n.t} x={XS[i]} y={Y.f} nodo={n} tipo="f" visible={vis(2)} on={etapa === 2} abierto={abierto === `f${i}`} alTocar={() => tocar(`f${i}`)} />)}
            <Caja x={50} y={Y.r} nodo={RAIZ} tipo="r" visible={vis(3)} on={etapa === 3} abierto={abierto === 'r'} alTocar={() => tocar('r')} />
          </div>
          <p className="absolute bottom-2 right-4 z-10 hidden font-mono text-[10px] uppercase tracking-[.1em] text-[var(--tinta-4)] sm:block">{etapa < 3 ? 'Baje para ver qué lo provoca ↓' : 'Toque un recuadro para ver el dato'}</p>
        </div>
      </div>
    </section>
  );
}
