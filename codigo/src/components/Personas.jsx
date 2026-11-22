import React from 'react';

// Personas de Tierra Bomba ilustradas (comunidad afrocaribeña): palenquera con ponchera de frutas, pescador con
// atarraya, niños con uniforme escolar, madre con su hija, maestra, pareja paseando. Vector, con contorno coral
// como en las láminas de fases. Cada figura ocupa un lienzo de 100 × 240 (pies en y = 232).
const PIELES = ['#5a3626', '#6b402b', '#4a2b1f', '#7a4a32'];
const CONTORNO = 'url(#contornoCoral)';

function Cuerpo({ piel, pelo = 'corto', camisa, pantalon, falda, zapatos = '#2a2420', paso = 0.6, altura = 1, brazos = 'normal', children, pelo2 = '#1a1210' }) {
  const s = altura; const y0 = 232 - 222 * s; const cab = 15 * s; const hx = 50; const hy = y0 + cab;
  const hombro = hy + cab + 8 * s; const cadera = hombro + 70 * s; const pie = 232;
  const largoPierna = pie - cadera; const d = 12 * paso;
  return (
    <g>
      {/* piernas */}
      {falda ? null : <path d={`M${hx - 9},${cadera} L${hx - 9 - d},${pie - 4} L${hx - 1 - d},${pie - 4} L${hx},${cadera + 8} L${hx + 1 + d * 0.4},${pie - 4} L${hx + 9 + d * 0.4},${pie - 4} L${hx + 9},${cadera} Z`} fill={pantalon} />}
      {falda && <><path d={`M${hx - 6},${cadera + largoPierna * 0.45} L${hx - 7 - d},${pie - 4} L${hx - 1 - d},${pie - 4} L${hx},${cadera + largoPierna * 0.45} Z M${hx + 2},${cadera + largoPierna * 0.45} L${hx + 2 + d * 0.4},${pie - 4} L${hx + 8 + d * 0.4},${pie - 4} L${hx + 8},${cadera + largoPierna * 0.45} Z`} fill={piel} /><path d={`M${hx - 13},${cadera - 6} C${hx - 20},${cadera + 20} ${hx - 22},${cadera + largoPierna * 0.5} ${hx - 24},${cadera + largoPierna * 0.55} L${hx + 24},${cadera + largoPierna * 0.55} C${hx + 22},${cadera + largoPierna * 0.5} ${hx + 20},${cadera + 20} ${hx + 13},${cadera - 6} Z`} fill={falda} /></>}
      <ellipse cx={hx - 5 - d} cy={pie - 3} rx={7} ry={3.4} fill={zapatos} /><ellipse cx={hx + 5 + d * 0.4} cy={pie - 3} rx={7} ry={3.4} fill={zapatos} />
      {/* torso */}
      <path d={`M${hx - 15 * s},${hombro} C${hx - 18 * s},${hombro + 30 * s} ${hx - 13 * s},${cadera - 10} ${hx - 12},${cadera + 2} L${hx + 12},${cadera + 2} C${hx + 13 * s},${cadera - 10} ${hx + 18 * s},${hombro + 30 * s} ${hx + 15 * s},${hombro} C${hx + 8},${hombro - 5} ${hx - 8},${hombro - 5} ${hx - 15 * s},${hombro} Z`} fill={camisa} />
      {/* brazos */}
      {brazos === 'arriba'
        ? <><path d={`M${hx - 14 * s},${hombro + 3} C${hx - 22 * s},${hombro - 12 * s} ${hx - 18 * s},${hy - cab - 2} ${hx - 10},${hy - cab - 6}`} stroke={piel} strokeWidth={6 * s} fill="none" strokeLinecap="round" /><path d={`M${hx + 14 * s},${hombro + 3} C${hx + 22 * s},${hombro - 12 * s} ${hx + 18 * s},${hy - cab - 2} ${hx + 10},${hy - cab - 6}`} stroke={piel} strokeWidth={6 * s} fill="none" strokeLinecap="round" /></>
        : <><path d={`M${hx - 14 * s},${hombro + 3} C${hx - 20 * s},${hombro + 25 * s} ${hx - 22 * s},${hombro + 45 * s} ${hx - 20 * s - d * 0.6},${hombro + 62 * s}`} stroke={piel} strokeWidth={6 * s} fill="none" strokeLinecap="round" /><path d={`M${hx + 14 * s},${hombro + 3} C${hx + 20 * s},${hombro + 25 * s} ${hx + 21 * s},${hombro + 45 * s} ${hx + 19 * s + d * 0.6},${hombro + 62 * s}`} stroke={piel} strokeWidth={6 * s} fill="none" strokeLinecap="round" /></>}
      {/* mangas */}
      <path d={`M${hx - 15 * s},${hombro} L${hx - 20 * s},${hombro + 16 * s} L${hx - 12 * s},${hombro + 18 * s} Z M${hx + 15 * s},${hombro} L${hx + 20 * s},${hombro + 16 * s} L${hx + 12 * s},${hombro + 18 * s} Z`} fill={camisa} />
      {/* cuello y cabeza */}
      <rect x={hx - 4 * s} y={hy + cab - 3} width={8 * s} height={10 * s} fill={piel} />
      <ellipse cx={hx} cy={hy} rx={cab * 0.86} ry={cab} fill={piel} />
      {pelo === 'corto' && <path d={`M${hx - cab * 0.88},${hy - 2} C${hx - cab},${hy - cab * 1.3} ${hx + cab},${hy - cab * 1.3} ${hx + cab * 0.88},${hy - 2} C${hx + cab * 0.6},${hy - cab * 0.7} ${hx - cab * 0.6},${hy - cab * 0.7} ${hx - cab * 0.88},${hy - 2} Z`} fill={pelo2} />}
      {pelo === 'afro' && <ellipse cx={hx} cy={hy - cab * 0.35} rx={cab * 1.2} ry={cab * 1.0} fill={pelo2} />}
      {pelo === 'trenzas' && <><ellipse cx={hx} cy={hy - cab * 0.4} rx={cab * 0.95} ry={cab * 0.75} fill={pelo2} />{[-1, 1].map((k) => <path key={k} d={`M${hx + k * cab * 0.8},${hy - 2} q${k * 4},${cab} ${k * 2},${cab * 2}`} stroke={pelo2} strokeWidth={3.4 * s} fill="none" strokeLinecap="round" />)}</>}
      {pelo === 'panuelo' && <path d={`M${hx - cab},${hy - 1} C${hx - cab * 1.1},${hy - cab * 1.5} ${hx + cab * 1.1},${hy - cab * 1.5} ${hx + cab},${hy - 1} Z`} fill="#e8b020" />}
      {pelo === 'gorra' && <><path d={`M${hx - cab * 0.95},${hy - 3} C${hx - cab},${hy - cab * 1.3} ${hx + cab},${hy - cab * 1.3} ${hx + cab * 0.95},${hy - 3} Z`} fill="#c8402e" /><rect x={hx} y={hy - 5} width={cab * 1.4} height={3.4} rx={1.5} fill="#a8301e" /></>}
      {children}
    </g>
  );
}

const FIGURAS = {
  // palenquera con vestido de colores y ponchera de frutas tropicales
  palenquera: (k) => (
    <Cuerpo piel={PIELES[k % 4]} pelo="panuelo" camisa="#e03a3e" falda="#f2c230" paso={0.5} brazos="arriba">
      <ellipse cx="50" cy="16" rx="30" ry="7" fill="#d8d4cc" /><path d="M20,16 Q50,30 80,16 Z" fill="#b8b2a6" />
      {[[34, 9, '#f2c230'], [44, 6, '#e8681e'], [55, 7, '#7fae36'], [64, 10, '#f2c230'], [50, 3, '#c8402e'], [40, 12, '#7fae36']].map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="6" fill={c} />)}
      <path d="M36,128 L64,128 L66,138 L34,138 Z" fill="#2a6fb8" />
    </Cuerpo>
  ),
  // pescador con gorra y atarraya al hombro
  pescador: (k) => (
    <Cuerpo piel={PIELES[(k + 2) % 4]} pelo="gorra" camisa="#e8e4d8" pantalon="#3a4a5a" paso={0.9}>
      <path d="M64,66 C86,86 92,130 80,170 L66,170 C74,140 72,100 60,74 Z" fill="none" stroke="#cfc6a8" strokeWidth="1.2" />
      {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${62 + i * 3},${72 + i * 2} L${68 + i * 2.4},${170}`} stroke="#cfc6a8" strokeWidth="0.9" />)}
      <ellipse cx="73" cy="170" rx="9" ry="3" fill="#8a7a5a" />
    </Cuerpo>
  ),
  // niña y niño con uniforme escolar y morral
  colegiala: (k) => (
    <Cuerpo piel={PIELES[(k + 1) % 4]} pelo="trenzas" camisa="#f4f4f0" falda="#3a4a8a" altura={0.72} paso={0.8} zapatos="#1a1a1a">
      <rect x="58" y="112" width="16" height="26" rx="4" fill="#e85a4a" />
    </Cuerpo>
  ),
  colegial: (k) => (
    <Cuerpo piel={PIELES[(k + 3) % 4]} pelo="corto" camisa="#f4f4f0" pantalon="#3a4a8a" altura={0.75} paso={1} zapatos="#1a1a1a">
      <rect x="27" y="108" width="15" height="26" rx="4" fill="#2a8ac0" />
    </Cuerpo>
  ),
  // madre con blusa estampada y niña de la mano
  madre: (k) => (
    <Cuerpo piel={PIELES[k % 4]} pelo="afro" camisa="#2a9a8a" falda="#f0e6d0" paso={0.4}>
      {[[42, 70], [54, 80], [46, 92], [58, 100]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#f2c230" />)}
    </Cuerpo>
  ),
  nina: (k) => <Cuerpo piel={PIELES[(k + 1) % 4]} pelo="trenzas" camisa="#f29ac0" falda="#f29ac0" altura={0.5} paso={0.6} />,
  // maestra y hombre mayor
  maestra: (k) => <Cuerpo piel={PIELES[(k + 2) % 4]} pelo="afro" camisa="#f4f1ea" pantalon="#6a4a3a" paso={0.5}><rect x="22" y="112" width="12" height="16" fill="#2a6fb8" /></Cuerpo>,
  abuelo: (k) => <Cuerpo piel={PIELES[(k + 3) % 4]} pelo="corto" pelo2="#d8d4cc" camisa="#c8e0f0" pantalon="#d8c8a8" paso={0.3}><path d="M72,110 L76,232" stroke="#6a4a30" strokeWidth="3" /></Cuerpo>,
};

export function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="contornoCoral" x="-20%" y="-10%" width="140%" height="120%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="2.6" result="borde" />
          <feFlood floodColor="#ff4a3a" floodOpacity="0.95" />
          <feComposite in2="borde" operator="in" result="coral" />
          <feGaussianBlur in="coral" stdDeviation="0.6" result="coralSuave" />
          <feMerge><feMergeNode in="coralSuave" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    </svg>
  );
}

// grupo de personas posicionado sobre el panel (x, y en %, alto en % del panel)
export default function Personas({ lista }) {
  return lista.map(({ tipo, x, y, alto, voltear, k = 0, rotulo }, i) => (
    <div key={i} className="entra pointer-events-none absolute" style={{ left: `${x}%`, bottom: `${100 - y}%`, height: `${alto}%`, aspectRatio: '100 / 240', transform: `translateX(-50%) ${voltear ? 'scaleX(-1)' : ''}` }}>
      <svg viewBox="0 0 100 240" className="h-full w-full overflow-visible drop-shadow-[0_6px_6px_rgba(0,0,0,.35)]" aria-hidden="true"><g filter={CONTORNO}>{FIGURAS[tipo](k)}</g></svg>
      {rotulo && <span className="absolute left-1/2 top-[-18px] -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-white [text-shadow:0_1px_4px_rgba(0,0,0,.9)]" style={{ transform: `translateX(-50%) ${voltear ? 'scaleX(-1)' : ''}` }}>{rotulo}</span>}
    </div>
  ));
}
