import React, { useEffect, useRef, useState } from 'react';
import { BASE } from '../lib/arboles.js';

// La isla y sus cuatro sectores, dibujada con puntos (celdas de 47 m con el color de la imagen satelital).
// Datos: analisis/capas.json (malla de la isla) y los puntos de referencia de sectores del archivo de la tesis.
const SECT = {
  tierra: { nombre: 'Tierra Bomba', ll: [-75.57532, 10.38022], cons: 770 },
  punta: { nombre: 'Punta Arena', ll: [-75.5496, 10.36518], cons: 385 },
  cano: { nombre: 'Caño del Oro', ll: [-75.543611, 10.343889], cons: 441 },
  boca: { nombre: 'Bocachica', ll: [-75.58107, 10.32364], cons: 1004 },
};
const CLAVES = Object.keys(SECT);
const fmt = (n) => Math.round(n).toLocaleString('es-CO');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const suave = (x) => 1 - (1 - clamp01(x)) ** 3;
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export default function Sectores() {
  const cvRef = useRef(null);
  const [datos, setDatos] = useState(null);
  const [sel, setSel] = useState('isla');
  const selRef = useRef('isla');
  selRef.current = sel;

  useEffect(() => {
    let vivo = true;
    (async () => {
      const D = await (await fetch(`${BASE}analisis/capas.json`)).json();
      const { gw: GW, gh: GH, celdaM } = D.malla; const N = GW * GH; const W = D.win; const S = W.S;
      const isla = b64(D.isla);
      const capa = Object.fromEntries(D.capas.map((c) => [c.id, b64(c.v)]));
      const sat = new Uint8ClampedArray(N * 3).fill(60);
      try {
        const img = new Image(); img.src = `${BASE}assets/texturas/sat_base.jpg`; await img.decode();
        const c = document.createElement('canvas'); c.width = GW; c.height = GH; const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(img, W.left, W.top, W.w, W.h, 0, 0, GW, GH); const d = cx.getImageData(0, 0, GW, GH).data;
        for (let k = 0; k < N; k++) { sat[k * 3] = d[k * 4]; sat[k * 3 + 1] = d[k * 4 + 1]; sat[k * 3 + 2] = d[k * 4 + 2]; }
      } catch { /* sin imagen */ }
      const n15 = 2 ** 15;
      const celda = ([lon, lat]) => { const tx = ((lon + 180) / 360) * n15; const ty = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n15; return [((tx - W.mos.x0) * 256 - W.left) / S, ((ty - W.mos.y0) * 256 - W.top) / S]; };
      const pos = Object.fromEntries(CLAVES.map((k) => [k, celda(SECT[k].ll)]));
      const sector = new Uint8Array(N); const haC = (celdaM * celdaM) / 1e4;
      const res = CLAVES.map(() => ({ tot: 0, p30: 0, inu: 0 }));
      for (let k = 0; k < N; k++) {
        if (!isla[k]) continue; const i = k % GW; const j = Math.floor(k / GW); let best = 0; let bd = 1e9;
        CLAVES.forEach((s, q) => { const [a, b] = pos[s]; const d = (a - i) ** 2 + (b - j) ** 2; if (d < bd) { bd = d; best = q; } });
        sector[k] = best; res[best].tot++;
        const r = capa.retroceso[k]; if (r !== 255 && (1 - r / 254) * 60 <= 30) res[best].p30++;
        if (capa.inundable[k] !== 255 && capa.inundable[k] > 127) res[best].inu++;
      }
      if (vivo) setDatos({ GW, GH, N, isla, sat, pos, sector, haIsla: D.stats.haIsla, res: res.map((r) => ({ ha: r.tot * haC, ha30: r.p30 * haC, haInu: r.inu * haC })) });
    })().catch((e) => console.warn('sectores:', e));
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    if (!datos) return undefined;
    const cv = cvRef.current; const ctx = cv.getContext('2d'); const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const { GW, GH, N, isla, sat, pos, sector } = datos;
    const marcos = { isla: { cx: GW / 2, cy: GH / 2, ancho: GW * 0.78 } };
    CLAVES.forEach((s) => { marcos[s] = { cx: pos[s][0], cy: pos[s][1], ancho: 40 }; });
    const cam = { ...marcos.isla }; let hover = null; let visto = 0; let raf = 0;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !visto) visto = performance.now(); }, { threshold: 0.2 }); io.observe(cv);
    const geom = () => { const r = cv.getBoundingClientRect(); const w = Math.round(r.width * DPR); const h = Math.round(r.height * DPR); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } const esc = Math.min(w / cam.ancho, h / (cam.ancho * GH / GW)); return { w, h, esc, ox: w / 2 - cam.cx * esc, oy: h / 2 - cam.cy * esc }; };
    const mover = (e) => { const g = geom(); const r = cv.getBoundingClientRect(); const mx = (e.clientX - r.left) * DPR; const my = (e.clientY - r.top) * DPR; hover = CLAVES.find((s) => Math.hypot(g.ox + pos[s][0] * g.esc - mx, g.oy + pos[s][1] * g.esc - my) < 26 * DPR) || null; cv.style.cursor = hover ? 'pointer' : 'default'; };
    const clic = () => { if (hover) setSel(hover); else if (selRef.current !== 'isla') setSel('isla'); };
    cv.addEventListener('pointermove', mover); cv.addEventListener('click', clic);
    const dibujar = (t) => {
      raf = requestAnimationFrame(dibujar);
      const r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const M = marcos[selRef.current]; cam.cx += (M.cx - cam.cx) * 0.08; cam.cy += (M.cy - cam.cy) * 0.08; cam.ancho += (M.ancho - cam.ancho) * 0.08;
      const g = geom(); ctx.clearRect(0, 0, g.w, g.h);
      const ia = visto ? clamp01((t - visto) / 1800) : 0; const rad = Math.max(0.9, g.esc * 0.42);
      const selQ = selRef.current === 'isla' ? -1 : CLAVES.indexOf(selRef.current);
      for (let q = 0; q < N; q++) {
        if (!isla[q]) continue; const sem = ((q * 2654435761) % 1000) / 1000; const e = suave((ia - sem * 0.45) / 0.55);
        let x = g.ox + ((q % GW) + 0.5) * g.esc; let y = g.oy + (Math.floor(q / GW) + 0.5) * g.esc;
        if (e < 1) { x += Math.cos(sem * 40) * g.w * 0.6 * (1 - e); y += Math.sin(sem * 57) * g.h * 0.6 * (1 - e); }
        if (x < -5 || y < -5 || x > g.w + 5 || y > g.h + 5) continue;
        const apagado = selQ >= 0 && sector[q] !== selQ ? 0.35 : 1;
        ctx.globalAlpha = (0.2 + 0.8 * e) * apagado * (0.74 + 0.26 * Math.sin(t * 0.003 + sem * 30));
        ctx.fillStyle = `rgb(${Math.min(255, sat[q * 3] * 1.45 + 30)},${Math.min(255, sat[q * 3 + 1] * 1.45 + 38)},${Math.min(255, sat[q * 3 + 2] * 1.35 + 34)})`;
        ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = Math.min(1, ia * 2);
      CLAVES.forEach((s) => {
        const x = g.ox + pos[s][0] * g.esc; const y = g.oy + pos[s][1] * g.esc; const pul = 0.5 + 0.5 * Math.sin(t * 0.004);
        ctx.strokeStyle = `rgba(200,109,81,${0.4 + 0.4 * pul})`; ctx.lineWidth = 1.5 * DPR; ctx.beginPath(); ctx.arc(x, y, (8 + 9 * pul) * DPR, 0, 6.283); ctx.stroke();
        ctx.fillStyle = '#c86d51'; ctx.beginPath(); ctx.arc(x, y, 4.5 * DPR, 0, 6.283); ctx.fill();
        ctx.font = `600 ${15 * DPR}px "Geist Mono", monospace`; ctx.fillStyle = s === hover || s === selRef.current ? '#f4f1ec' : 'rgba(244,241,236,.6)';
        ctx.fillText(SECT[s].nombre.toUpperCase(), x + 13 * DPR, y + 4 * DPR);
      });
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(dibujar);
    return () => { cancelAnimationFrame(raf); io.disconnect(); cv.removeEventListener('pointermove', mover); cv.removeEventListener('click', clic); };
  }, [datos]);

  const r = datos && sel !== 'isla' ? datos.res[CLAVES.indexOf(sel)] : null;
  return (
    <section id="sectores" className="relative bg-tinta text-papel">
      <div className="mx-auto max-w-[1760px] px-5 py-16 sm:px-10 sm:py-24 lg:px-12">
        <p className="etiqueta text-arcilla">Del encuadre al sector</p>
        <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl">La isla y sus cuatro sectores.</h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] lg:gap-12">
          <canvas ref={cvRef} className="block h-[72svh] min-h-[460px] w-full lg:h-[88svh]" aria-label="Mapa de puntos de Tierra Bomba con sus cuatro sectores; toca un punto rojo para acercarte" />
          <div className="flex flex-col lg:pt-2">
            <ul className="border-t border-white/15">
            {[['isla', 'La isla', null], ...CLAVES.map((k) => [k, SECT[k].nombre, datos ? datos.res[CLAVES.indexOf(k)] : null])].map(([k, t, rr]) => {
              const on = sel === k;
              return (
                <li key={k} className="border-b border-white/15">
                <button type="button" onClick={() => setSel(k)} aria-pressed={on}
                  className="group relative w-full py-4 pl-5 pr-1 text-left">
                  <span className={`absolute left-0 top-4 h-[calc(100%-2rem)] w-[2px] transition-colors duration-300 ${on ? 'bg-arcilla' : 'bg-transparent'}`} />
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`text-lg tracking-tight transition-colors sm:text-xl ${on ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{t}</p>
                    {k !== 'isla' ? <p className="num text-[12px] text-white/45">{fmt(SECT[k].cons)} construcciones</p> : datos && <p className="num text-[12px] text-white/45">{fmt(datos.haIsla)} ha · 2.600 construcciones</p>}
                  </div>
                  {rr && (
                    <div className={`grid transition-[grid-template-rows] duration-500 ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="mt-4 flex h-2 w-full overflow-hidden bg-white/12" aria-hidden="true">
                          <span className="h-full bg-arcilla" style={{ width: `${(100 * rr.ha30) / rr.ha}%` }} />
                          <span className="h-full" style={{ width: `${(100 * Math.min(rr.haInu, rr.ha - rr.ha30)) / rr.ha}%`, background: 'repeating-linear-gradient(135deg, rgba(244,241,236,.55) 0 2px, transparent 2px 5px)' }} />
                        </div>
                        <dl className="mt-3 grid grid-cols-3 gap-3">
                          <div><dd className="cifra text-2xl text-white sm:text-3xl">{fmt(rr.ha)} <span className="text-[12px] text-white/45">ha</span></dd><dt className="text-[11px] text-white/50">del sector</dt></div>
                          <div><dd className="cifra text-2xl text-[#e0917a] sm:text-3xl">{fmt(rr.ha30)} <span className="text-[12px] text-white/45">ha</span></dd><dt className="text-[11px] text-white/50">perdidas a 30 años ({fmt((100 * rr.ha30) / rr.ha)} %)</dt></div>
                          <div><dd className="cifra text-2xl text-white/85 sm:text-3xl">{fmt(rr.haInu)} <span className="text-[12px] text-white/45">ha</span></dd><dt className="text-[11px] text-white/50">en zona inundable</dt></div>
                        </dl>
                      </div>
                    </div>
                  )}
                </button>
                </li>
              );
            })}
            </ul>            <p className="mt-2 text-[11px] leading-snug text-white/40">Puntos: celdas de 47 m con el color de la imagen satelital (Esri World Imagery); costa © OpenStreetMap. Sector de cada celda: el punto de referencia más cercano del archivo de la tesis. Pérdida a 30 años: retroceso por tramo con tasas de INVEMAR; zona inundable: MIDAS.</p>
          </div>
        </div>
      </div>
    </section>
  );
}