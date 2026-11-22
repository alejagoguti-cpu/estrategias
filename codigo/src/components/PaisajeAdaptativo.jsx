import React from 'react';
import PasarelaInmersiva from './PasarelaInmersiva.jsx';

// =============================================================================
// 08 · PAISAJE ADAPTATIVO — ascenso del mar e incertidumbre de sedimentos (Tierra Bomba)
// Representación gráfica del referente «10 Adaptive Landscape – Sea level rise and sediment uncertainty»:
// corte en blanco con bandas de agua por cota, ecotonos en barras negras, siluetas azul marino con su
// nombre científico, vegetación de fondo lavada, tiras de especies abajo y, a la derecha, la pasarela
// elevada en primera persona (PasarelaInmersiva).
// =============================================================================

const BASE = import.meta.env.BASE_URL;
const REC = `${BASE}datos/tramas/m/`;
const MARINO = '#1f2b5b';
const INAT = 'https://inaturalist-open-data.s3.amazonaws.com/photos/';
const INAT2 = 'https://static.inaturalist.org/photos/';

// perfil del terreno: del lecho marino (izq.) a la meseta (der.)
const W = 1200; const H = 600;
const suelo = (x) => { const t = Math.max(0, Math.min(1, (x - 150) / 1000)); return 520 - 215 * Math.pow(t, 1.3); };
const PERFIL = (() => { let d = ''; for (let x = 60; x <= 1150; x += 10) d += `${x === 60 ? 'M' : 'L'}${x},${suelo(x).toFixed(1)} `; return d; })();
const SOBRE_SUELO = `${PERFIL} L1150,0 L60,0 Z`;

// cotas (m) y su y en el dibujo
const COTAS = [
  { y: 392, m: '+2,40 m', nombre: 'Inundación 100 años', fill: '#e3f4f6' },
  { y: 425, m: '+1,80 m', nombre: 'Inundación 50 años', fill: '#c7e9ee' },
  { y: 462, m: '+0,40 m', nombre: 'Pleamar', fill: '#a6dbe3' },
  { y: 478, m: '−0,15 m', nombre: 'Bajamar', fill: '#86ccd8' },
];
const E1 = 470; const E2 = 785;

function Rotulo({ x, y, t, ancla = 'start', tam = 11.5 }) {
  return <text x={x} y={y} textAnchor={ancla} fill={MARINO} fontSize={tam} fontStyle="italic" fontFamily="Geist, sans-serif">{t}</text>;
}
// recorte fotográfico vuelto silueta azul marino
function Silueta({ src, x, y, w, h, voltear = false }) {
  return <image href={`${REC}${src}.webp`} x={x} y={y} width={w} height={h} filter="url(#marino)" preserveAspectRatio="xMidYMid meet" transform={voltear ? `translate(${2 * x + w},0) scale(-1,1)` : undefined} />;
}

const Tortuga = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill={MARINO}>
    <path d="M0,0 C7,-10 27,-10 35,0 C27,8 7,8 0,0Z" />
    <circle cx="39" cy="-1" r="4" />
    <path d="M23,-5 L37,-15 L33,-12 L26,-3Z" /><path d="M24,4 L35,12 L22,6Z" /><path d="M5,-3 L-4,-9 L2,-2Z" /><path d="M5,4 L-3,9 L7,5Z" />
  </g>
);
const Cangrejo = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill={MARINO} stroke={MARINO} strokeWidth="1.3" strokeLinecap="round">
    <ellipse cx="0" cy="0" rx="8" ry="5" stroke="none" />
    {[-1, 1].map((l) => [0, 1, 2].map((i) => <path key={`${l}${i}`} d={`M${l * 6},${1 + i} L${l * (12 + i * 2)},${4 + i * 2} L${l * (14 + i * 2)},${9 + i}`} fill="none" />))}
    <circle cx="-11" cy="-6" r="3.2" stroke="none" /><circle cx="11" cy="-6" r="3.2" stroke="none" />
    <path d="M-6,-3 L-10,-5 M6,-3 L10,-5" fill="none" />
  </g>
);
const Iguana = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} fill={MARINO} stroke={MARINO} strokeLinecap="round">
    <path d="M0,0 C6,-6 18,-7 27,-4 L36,-5 C39,-4 39,-1 36,0 L27,1 C18,4 8,4 0,2 C-14,2 -32,4 -50,9 C-32,1 -14,-1 0,0Z" stroke="none" />
    <path d="M6,-5 l2,-4 l2,4 M12,-6 l2,-4 l2,4 M18,-6 l2,-3 l2,3" strokeWidth="1" fill="none" />
    <path d="M22,2 L25,8 L28,9 M6,3 L3,9 L0,10 M20,-3 L23,3 M2,1 L-2,7" strokeWidth="2" fill="none" />
  </g>
);
const Juncos = ({ x, y, n = 7, h = 26, color = MARINO, w = 14 }) => (
  <g stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round">
    {Array.from({ length: n }, (_, i) => { const dx = (i / (n - 1) - 0.5) * w; const ho = h * (0.6 + 0.4 * Math.sin(i * 2.3 + x) ** 2); const cur = (i / (n - 1) - 0.5) * 12; return <path key={i} d={`M${x + dx},${y} Q${x + dx + cur * 0.3},${y - ho * 0.6} ${x + dx + cur},${y - ho}`} />; })}
  </g>
);
const ArbolMarino = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill={MARINO}>
    <path d="M-1.5,0 L-1,-16 L-5,-22 L-0.5,-19 L0,-26 L1.5,-19 L6,-23 L1.5,-15 L1.8,0Z" />
    <circle cx="0" cy="-34" r="11" /><circle cx="-10" cy="-27" r="8" /><circle cx="10" cy="-28" r="8.5" /><circle cx="-4" cy="-43" r="8" /><circle cx="6" cy="-41" r="8" />
  </g>
);
const Mangle = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <g stroke={MARINO} strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M0,-18 Q-10,-10 -16,0" /><path d="M0,-18 Q-4,-8 -6,0" /><path d="M0,-18 Q5,-8 6,0" /><path d="M0,-18 Q12,-10 17,0" /><path d="M0,-18 L0,-28" strokeWidth="2.6" />
    </g>
    <g fill={MARINO}><ellipse cx="0" cy="-36" rx="17" ry="11" /><ellipse cx="-9" cy="-43" rx="9" ry="7" /><ellipse cx="9" cy="-44" rx="10" ry="7" /></g>
  </g>
);
const Palma = ({ x, y, h = 170, inc = 8, color = '#d3ebe2' }) => {
  const tx = x + inc; const ty = y - h;
  return (
    <g stroke={color} fill="none" strokeLinecap="round">
      <path d={`M${x},${y} Q${x + inc * 0.2},${y - h * 0.55} ${tx},${ty}`} strokeWidth="6" />
      {[-160, -125, -95, -60, -25, 10, 40].map((a, i) => { const r = 48 + (i % 3) * 8; const ar = (a * Math.PI) / 180; const ex = tx + Math.cos(ar) * r; const ey = ty + Math.sin(ar) * r * 0.55 + 16; return <path key={a} d={`M${tx},${ty} Q${tx + Math.cos(ar) * r * 0.5},${ty + Math.sin(ar) * r * 0.5 - 14} ${ex},${ey}`} strokeWidth="7" />; })}
    </g>
  );
};
const ArbolFondo = ({ x, y, r = 50, color = '#dcefdf' }) => (
  <g fill={color}>
    <rect x={x - 3} y={y - r * 1.2} width="6" height={r * 1.2} />
    {[[0, -1.55, 0.8], [-0.6, -1.25, 0.62], [0.62, -1.28, 0.66], [-0.25, -2.0, 0.6], [0.35, -1.95, 0.58], [0.0, -1.2, 0.6]].map(([dx, dy, k], i) => <circle key={i} cx={x + dx * r} cy={y + dy * r} r={k * r} />)}
  </g>
);

// tiras de especies (como la fila inferior del referente)
const TIRAS = [
  { tipo: 'liso', fondo: '#8fd5df', banda: '#6fc3cf', sci: 'Opisthonema oglinum', es: 'Sardina vivita', recorte: 'sardina', rw: 96, rx: -26, ry: 92 },
  { tipo: 'foto', img: `${INAT}31937008/medium.jpeg`, banda: '#2f8f8a', sci: 'Thalassia testudinum', es: 'Hierba de tortuga' },
  { tipo: 'foto', img: `${INAT}222906733/medium.jpeg`, banda: '#3c7f43', sci: 'Rhizophora mangle', es: 'Mangle rojo', nota: 'También llamado «mangle colorado»' },
  { tipo: 'liso', fondo: '#2f6b6a', banda: '#245857', sci: 'Egretta thula', es: 'Garza dedos dorados', recorte: 'garza', rw: 104, rx: -30, ry: 64 },
  { tipo: 'foto', img: `${INAT2}48492231/medium.jpg`, banda: '#5c8fd1', sci: 'Coccoloba uvifera', es: 'Uvero de playa' },
  { tipo: 'foto', img: `${INAT2}108453904/medium.jpeg`, banda: '#2f8f8a', sci: 'Cocos nucifera', es: 'Cocotero' },
  { tipo: 'liso', fondo: '#bcd63e', banda: '#a6c12c', sci: 'Ardea alba', es: 'Garza blanca', recorte: 'alba', rw: 40, rx: 8, ry: 70 },
  { tipo: 'foto', img: `${INAT}405494364/medium.jpeg`, banda: '#3c7f43', sci: 'Ceiba pentandra', es: 'Ceiba', nota: 'También llamada «bonga»' },
];

function Tira({ t }) {
  return (
    <div className="relative flex h-[200px] shrink-0" title={`${t.es} · ${t.sci}`}>
      {t.tipo === 'foto' ? (
        <div className="h-full w-[54px] overflow-hidden bg-slate-200"><img src={t.img} alt={t.es} loading="lazy" className="h-full w-full object-cover" /></div>
      ) : (
        <div className="h-full w-[54px]" style={{ background: t.fondo }} />
      )}
      <div className="flex h-full w-[18px] items-end justify-center pb-2" style={{ background: t.banda }}>
        <span className="text-[9px] italic leading-none text-white [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">{t.sci}</span>
      </div>
      {t.recorte && <img src={`${REC}${t.recorte}.webp`} alt="" aria-hidden="true" className="pointer-events-none absolute drop-shadow-[0_2px_2px_rgba(0,0,0,.25)]" style={{ width: t.rw, left: t.rx, top: t.ry }} />}
      {t.nota && (
        <span className="absolute -top-9 left-[34px] z-10 w-[78px] rotate-[-58deg] bg-[#f3e600] px-1.5 py-1 text-[9px] font-medium leading-tight text-[#1f2b5b] shadow-sm">{t.nota}</span>
      )}
    </div>
  );
}

function Corte() {
  return (
    <svg viewBox={`0 30 ${W} 530`} className="block h-auto w-full" role="img" aria-label="Corte del paisaje adaptativo de Tierra Bomba: del lecho marino a la meseta, con cotas de marea e inundación, dos ecotonos, la pasarela elevada y las especies de cada franja">
      <defs>
        <filter id="marino" colorInterpolationFilters="sRGB"><feFlood floodColor={MARINO} result="c" /><feComposite in="c" in2="SourceAlpha" operator="in" /></filter>
        <clipPath id="sobreSuelo"><path d={SOBRE_SUELO} /></clipPath>
        <marker id="flecha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 L3,5Z" fill="#111" /></marker>
      </defs>

      {/* vegetación de fondo, lavada */}
      <g opacity="0.95">
        <ArbolFondo x={900} y={suelo(900)} r={78} color="#e2f1e5" />
        <ArbolFondo x={1060} y={suelo(1060)} r={92} color="#dbeedf" />
        <ArbolFondo x={1140} y={suelo(1140)} r={60} color="#e4f2e6" />
        <ArbolFondo x={820} y={suelo(820)} r={46} color="#e6f3e8" />
        <Palma x={575} y={suelo(575)} h={205} inc={-12} />
        <Palma x={640} y={suelo(640)} h={240} inc={14} color="#cfe8de" />
        <Palma x={700} y={suelo(700)} h={175} inc={6} color="#d9eee6" />
        <ArbolFondo x={520} y={suelo(520)} r={40} color="#e4f2ec" />
      </g>

      {/* agua por cotas, recortada por el terreno */}
      <g clipPath="url(#sobreSuelo)">
        {COTAS.map((c, i) => <rect key={c.y} x="90" y={c.y} width="1060" height={(COTAS[i + 1]?.y ?? 600) - c.y} fill={c.fill} opacity="0.92" />)}
        {COTAS.map((c) => <line key={`l${c.y}`} x1="90" y1={c.y} x2="1150" y2={c.y} stroke="#4fa3b4" strokeWidth="1" strokeDasharray="2 3" />)}
      </g>
      {COTAS.map((c) => (
        <g key={`t${c.y}`}>
          <text x="96" y={c.y - 3} fill="#2c7f90" fontSize="11.9" fontFamily="Geist Mono, monospace">{c.m} · {c.nombre.toLowerCase()}</text>
          
        </g>
      ))}

      {/* pradera y pasto sobre el talud y la meseta */}
      <path d={(() => { let d = ''; for (let x = 690; x <= 1150; x += 10) d += `${x === 690 ? 'M' : 'L'}${x},${(suelo(x) - (x < E2 ? 4 : 9)).toFixed(1)} `; for (let x = 1150; x >= 690; x -= 10) d += `L${x},${suelo(x).toFixed(1)} `; return `${d}Z`; })()} fill="#b9d63c" />
      {Array.from({ length: 30 }, (_, i) => { const x = 795 + i * 12; return <Juncos key={i} x={x} y={suelo(x) - 7} n={4} h={9 + (i % 3) * 3} w={7} color="#9cbc22" />; })}

      {/* enrocado permeable al pie del talud */}
      <g fill="#cfccc4" stroke="#8d8a82" strokeWidth="0.8">
        {Array.from({ length: 16 }, (_, i) => { const x = 700 + i * 5.2; const y = suelo(x) - 3 - (i % 3) * 3; const s = 4 + (i % 4); return <polygon key={i} points={`${x},${y} ${x + s},${y - 2} ${x + s + 2},${y + s - 2} ${x + 1},${y + s} ${x - 2},${y + 3}`} />; })}
      </g>

      {/* perfil del terreno */}
      <path d={PERFIL} fill="none" stroke="#111" strokeWidth="3.2" strokeLinecap="round" markerStart="url(#flecha)" markerEnd="url(#flecha)" />

      {/* pasarela elevada (+2,10 m) */}
      <g stroke={MARINO} fill="none" strokeLinecap="round">
        {Array.from({ length: 10 }, (_, i) => { const x = 500 + i * 30; return <line key={i} x1={x} y1="410" x2={x} y2={suelo(x)} strokeWidth="1.6" />; })}
        <line x1="494" y1="410" x2="778" y2="410" strokeWidth="3" />
        <line x1="494" y1="396" x2="778" y2="396" strokeWidth="1" />
        {Array.from({ length: 15 }, (_, i) => <line key={i} x1={496 + i * 20} y1="396" x2={496 + i * 20} y2="410" strokeWidth="0.8" />)}
      </g>
      <text x="600" y="384" textAnchor="middle" fill={MARINO} fontSize="11.9" fontWeight="600" fontFamily="Geist Mono, monospace">PASARELA ELEVADA +2,10 m</text>

      {/* ecotonos */}
      {[[E1, ['MARISMA INTERMAREAL', 'PRADERA SALOBRE']], [E2, ['HUMEDAL DULCE', 'PRADERA / BOSQUE SECO']]].map(([x, [a, b]]) => {
        const y0 = suelo(x) - 150; const y1 = suelo(x) + 44;
        return (
          <g key={x}>
            <line x1={x} y1="58" x2={x} y2={y0} stroke="#111" strokeWidth="1" />
            <rect x={x - 7} y={y0} width="14" height={y1 - y0} fill="#111" />
            <text transform={`translate(${x + 3.5},${y1 - 8}) rotate(-90)`} fill="#fff" fontSize="11.9" fontWeight="700" letterSpacing="1.5" fontFamily="Geist, sans-serif">ECOTONO</text>
            <text transform={`translate(${x - 3},${y0 - 6}) rotate(-90)`} fill="#111" fontSize="11.9" fontFamily="Geist, sans-serif">{a}</text>
            <text transform={`translate(${x + 9},${y0 - 6}) rotate(-90)`} fill="#111" fontSize="11.9" fontFamily="Geist, sans-serif">{b}</text>
          </g>
        );
      })}

      {/* rótulos de franjas */}
      <text x="330" y="540" fill="#111" fontSize="14.0" fontWeight="600" letterSpacing="0.6" fontFamily="Geist, sans-serif">ZONA INTERMAREAL</text>
      <text x="700" y="446" fill="#111" fontSize="12.6" fontWeight="600" fontFamily="Geist, sans-serif"><tspan x="700">INUNDACIÓN 50 AÑOS</tspan><tspan x="700" dy="14">+ MAREJADA</tspan></text>
      <text x="985" y="352" fill="#111" fontSize="12.6" fontWeight="600" fontFamily="Geist, sans-serif"><tspan x="985">INUNDACIÓN 100 AÑOS</tspan><tspan x="985" dy="14">+ MAREJADA</tspan></text>

      {/* especies en silueta, con su nombre científico */}
      <Juncos x={250} y={suelo(250)} n={8} h={24} w={16} /><Rotulo x={238} y={suelo(250) - 28} t="Thalassia testudinum" ancla="middle" />
      <Juncos x={420} y={suelo(420)} n={9} h={34} w={18} /><Juncos x={448} y={suelo(448)} n={6} h={26} w={12} />
      <Silueta src="garza" x={108} y={406} w={86} h={74} voltear /><Rotulo x={112} y={402} t="Egretta thula" />
      <Silueta src="alba" x={380} y={396} w={34} h={78} /><Rotulo x={372} y={392} t="Ardea alba" ancla="middle" />
      <Silueta src="alba_vuelo" x={170} y={312} w={98} h={52} /><Rotulo x={205} y={372} t="Ardea alba (vuelo)" />
      <Silueta src="pelicano" x={280} y={262} w={128} h={46} voltear /><Rotulo x={300} y={316} t="Pelecanus occidentalis" />
      <Silueta src="fragata" x={860} y={130} w={124} h={66} /><Rotulo x={985} y={164} t="Fregata magnificens" />
      <Silueta src="fragata" x={990} y={96} w={64} h={34} voltear />
      <Silueta src="martin_vuelo" x={548} y={322} w={74} h={22} voltear /><Rotulo x={555} y={354} t="Megaceryle torquata" />
      <Silueta src="sardina" x={150} y={495} w={40} h={12} /><Silueta src="sardina" x={196} y={503} w={32} h={10} /><Silueta src="sardina" x={232} y={493} w={28} h={9} /><Rotulo x={150} y={523} t="Opisthonema oglinum" />
      <Tortuga x={300} y={500} s={0.9} /><Rotulo x={292} y={518} t="Chelonia mydas" />
      <Cangrejo x={446} y={478} s={0.85} /><Rotulo x={420} y={497} t="Cardisoma guanhumi" ancla="middle" />
      <Mangle x={530} y={suelo(530)} s={1} /><Rotulo x={530} y={suelo(530) - 52} t="Rhizophora mangle" ancla="middle" />
      <Mangle x={610} y={suelo(610)} s={0.8} />
      <Juncos x={570} y={suelo(570)} n={6} h={16} w={10} /><Juncos x={665} y={suelo(665)} n={6} h={14} w={10} /><Rotulo x={655} y={suelo(665) + 14} t="Sesuvium portulacastrum" ancla="middle" />
      <g fill={MARINO}>{[0, 1, 2].map((i) => <circle key={i} cx={728 + i * 9} cy={suelo(728 + i * 9) - 8 - (i % 2) * 3} r={7 + (i % 2) * 2} />)}</g><Rotulo x={760} y={suelo(742) + 18} t="Coccoloba uvifera" />
      <Iguana x={905} y={suelo(905) - 9} s={0.8} rot={-11} /><Rotulo x={880} y={suelo(880) + 16} t="Iguana iguana" />
      <ArbolMarino x={845} y={suelo(845) - 5} s={1} /><Rotulo x={845} y={suelo(845) - 62} t="Conocarpus erectus" ancla="middle" />
      <ArbolMarino x={1010} y={suelo(1010) - 7} s={1.5} /><Rotulo x={1010} y={suelo(1010) - 82} t="Ceiba pentandra" ancla="middle" />
      <Silueta src="monarca" x={955} y={268} w={26} h={18} /><Rotulo x={985} y={281} t="Danaus plexippus" />
    </svg>
  );
}

export default function PaisajeAdaptativo() {
  return (
    <section id="paisaje-adaptativo" className="relative bg-[#fbfbf8] text-[#111]" aria-label="Paisaje adaptativo: ascenso del mar e incertidumbre de sedimentos en Tierra Bomba">
      <div className="grid min-h-[100svh] grid-cols-1 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <div className="relative px-4 pb-10 pt-24 sm:px-8 lg:pl-10 lg:pr-6">
          <h2 className="font-['Geist'] text-[1.25rem] font-bold uppercase leading-tight tracking-tight sm:text-[1.55rem]">
            08&nbsp; Paisaje adaptativo – ascenso del mar e incertidumbre de sedimentos
          </h2>

          <div className="relative mt-4">
            {/* localización */}
            <figure className="absolute left-0 top-0 z-10 w-[23%] min-w-[110px] overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
              <div className="relative aspect-square">
                <img src={`${BASE}assets/texturas/cartagena_z14.jpg`} alt="Bahía de Cartagena y la isla de Tierra Bomba" className="h-full w-full object-cover [filter:grayscale(1)_brightness(2.6)_contrast(.38)]" />
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <circle cx="40" cy="63" r="2.6" fill="#f07a1e" />
                  <text x="44" y="62" fontSize="5.4" fill="#d4620f" fontWeight="700" fontFamily="Geist, sans-serif">SITIO</text>
                  <text x="4" y="12" fontSize="4.2" fill="#3b6fd6" fontFamily="Geist, sans-serif">Mar Caribe</text>
                  <text x="56" y="70" fontSize="4" fill="#555" fontFamily="Geist, sans-serif">Bahía de</text><text x="56" y="75" fontSize="4" fill="#555" fontFamily="Geist, sans-serif">Cartagena</text>
                  <text x="22" y="72" fontSize="3.6" fill="#3aa36b" fontFamily="Geist, sans-serif">Tierra Bomba</text>
                </svg>
              </div>
            </figure>
            <Corte />
          </div>

          {/* tiras de especies */}
          <div className="mt-6 flex gap-5 overflow-x-auto overflow-y-visible px-6 pb-2 pt-6 sm:justify-between sm:gap-3">
            {TIRAS.map((t) => <Tira key={t.sci} t={t} />)}
          </div>
          <p className="mt-3 text-[10px] leading-snug text-black/45">Fotos y recortes: iNaturalist (CC BY-NC). Cotas de marea y de inundación según la sección de Cartografía; perfil esquemático, sin escala vertical.</p>
        </div>

        <div className="relative h-[82svh] min-h-[520px] lg:sticky lg:top-0 lg:h-[100svh]">
          <PasarelaInmersiva />
        </div>
      </div>
    </section>
  );
}
