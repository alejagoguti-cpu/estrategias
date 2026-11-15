import React, { useEffect, useRef, useState } from 'react';

// Antes de la red de especies: Tierra Bomba en puntos de fondo y, al bajar, parejas de especies dibujadas con puntos
// (fotos de la red de especies) que se arman frente a la cámara, unidas por un cuadrado con su interacción.
// Las parejas anteriores quedan como cuadrados pequeños sobre la isla: una constelación que anticipa la red.
const BASE = import.meta.env.BASE_URL;
const FOTOS = 'https://anasoficasca-code.github.io/tierrabomba/assets/fotos/';
const R = 64; // resolución del retrato en puntos

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const suave = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const cargarImg = (src) => new Promise((ok, mal) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = mal; i.src = src; });

async function retrato(tid) {
  try {
    const img = await cargarImg(`${FOTOS}${tid}.webp`);
    const c = document.createElement('canvas'); c.width = R; c.height = R; const x = c.getContext('2d', { willReadFrequently: true });
    const m = Math.min(img.width, img.height); x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, R, R);
    const d = x.getImageData(0, 0, R, R).data; const pts = [];
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) { const o = (j * R + i) * 4; const lum = (d[o] + d[o + 1] + d[o + 2]) / 765; pts.push({ i, j, c: `rgb(${d[o]},${d[o + 1]},${d[o + 2]})`, r: 0.16 + 0.34 * lum, sx: Math.random(), sy: Math.random(), f: Math.random() }); }
    return pts;
  } catch { return null; }
}

// posiciones (fracción de pantalla) de las parejas ya vistas: cuadrados pequeños sobre la isla
const CONSTELACION = [[0.58, 0.18], [0.82, 0.24], [0.66, 0.42], [0.9, 0.5], [0.55, 0.66], [0.78, 0.74], [0.63, 0.88], [0.92, 0.86]];

export default function Tramas() {
  const ref = useRef(null); const cvRef = useRef(null);
  const [datos, setDatos] = useState(null);
  const [paso, setPaso] = useState(-1);
  useEffect(() => {
    let vivo = true; const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; io.disconnect(); fetch(`${BASE}datos/tramas.json`).then((r) => r.json()).then((d) => { if (vivo) setDatos(d); }); }, { rootMargin: '1500px 0px' });
    io.observe(el); return () => { vivo = false; io.disconnect(); };
  }, []);

  useEffect(() => {
    if (!datos) return undefined;
    const cv = cvRef.current; const cx = cv.getContext('2d'); const sec = ref.current;
    let raf = 0; let vivo = true; const DPR = Math.min(devicePixelRatio || 1, 2);
    const N = datos.pares.length;
    const ret = {}; datos.pares.forEach((p) => [p.a, p.b].forEach((s) => { retrato(s.tid).then((r) => { ret[s.tid] = r; }); }));
    // la isla en puntos, con el color de la imagen satelital
    let isla = []; let islaAsp = 1;
    (async () => {
      try {
        const C = await (await fetch(`${BASE}datos/capas_lectura.json`)).json();
        const GW = C.malla.gw; const GH = C.malla.gh; const W = C.win; const m = Uint8Array.from(atob(C.isla), (c) => c.charCodeAt(0));
        const img = await cargarImg(`${BASE}assets/texturas/sat_base.jpg`);
        const t = document.createElement('canvas'); t.width = GW; t.height = GH; const tx = t.getContext('2d', { willReadFrequently: true });
        tx.drawImage(img, W.left, W.top, W.w, W.h, 0, 0, GW, GH); const d = tx.getImageData(0, 0, GW, GH).data;
        let i0 = GW; let i1 = 0; let j0 = GH; let j1 = 0; for (let k = 0; k < GW * GH; k++) if (m[k]) { const i = k % GW; const j = Math.floor(k / GW); i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
        const pts = []; for (let k = 0; k < GW * GH; k++) if (m[k]) { const i = k % GW; const j = Math.floor(k / GW); pts.push([(i - i0) / (i1 - i0), (j - j0) / (j1 - j0), d[k * 4], d[k * 4 + 1], d[k * 4 + 2], Math.random()]); }
        isla = pts; islaAsp = (i1 - i0) / (j1 - j0);
      } catch { /* sin isla de fondo */ }
    })();
    const campo = Array.from({ length: innerWidth < 760 ? 1800 : 5000 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), r: Math.random() }));
    const vistoEn = {}; // momento en que apareció cada pareja

    const recuadro = (x, y, L, pts, k, num, nombre, t, alfa = 1) => {
      cx.globalAlpha = alfa;
      cx.fillStyle = 'rgba(4,6,7,.82)'; cx.fillRect(x, y, L, L);
      if (pts) {
        const p = L / R;
        for (const q of pts) {
          const kk = suave((k - q.f * 0.45) / 0.55);
          const tx = (q.i + 0.5) * p; const ty = (q.j + 0.5) * p;
          const fx = x + (q.sx * 2 - 0.5) * L * (1 - kk) + tx * kk; const fy = y + (q.sy * 2 - 0.5) * L * (1 - kk) + ty * kk;
          const resp = 0.9 + 0.1 * Math.sin(t * 0.003 + q.f * 30);
          cx.fillStyle = q.c; cx.beginPath(); cx.arc(fx, fy, Math.max(0.4, p * q.r * resp), 0, 6.283); cx.fill();
        }
      }
      cx.strokeStyle = 'rgba(214,230,236,.45)'; cx.lineWidth = 1 * DPR; cx.strokeRect(x + 0.5, y + 0.5, L - 1, L - 1);
      if (num != null) { cx.font = `500 ${Math.round(10 * DPR)}px "Geist Mono", monospace`; cx.fillStyle = 'rgba(232,238,240,.75)'; cx.textAlign = 'right'; cx.fillText(String(num).padStart(2, '0'), x + L - 6 * DPR, y + 14 * DPR); }
      if (nombre) { cx.font = `500 ${Math.round(11 * DPR)}px "Geist Mono", monospace`; cx.fillStyle = 'rgba(232,238,240,.9)'; cx.textAlign = 'left'; cx.fillText(nombre.toUpperCase(), x, y + L + 18 * DPR); }
      cx.globalAlpha = 1;
    };
    const cuadroInter = (x, y, L, tipo, k) => {
      cx.globalAlpha = k;
      cx.fillStyle = 'rgba(255,107,74,.12)'; cx.fillRect(x - L / 2, y - L / 2, L, L);
      cx.strokeStyle = '#ff6b4a'; cx.lineWidth = 1.2 * DPR; cx.strokeRect(x - L / 2, y - L / 2, L, L);
      cx.font = `500 ${Math.round(10 * DPR)}px "Geist Mono", monospace`; cx.fillStyle = '#ff8a6a'; cx.textAlign = 'center';
      const pal = tipo.toUpperCase().split(' '); const lineas = []; let l = '';
      pal.forEach((w) => { if ((l + ' ' + w).trim().length > 14) { lineas.push(l.trim()); l = w; } else l += ' ' + w; }); lineas.push(l.trim());
      lineas.slice(0, 4).forEach((s, i) => cx.fillText(s, x, y - (lineas.length - 1) * 7 * DPR + i * 14 * DPR + 4 * DPR));
      cx.globalAlpha = 1;
    };
    const linea = (x0, y0, x1, y1, k, t, coral) => {
      cx.strokeStyle = coral ? 'rgba(255,107,74,.75)' : 'rgba(214,230,236,.3)'; cx.lineWidth = 1 * DPR;
      cx.setLineDash([6 * DPR, 6 * DPR]); cx.lineDashOffset = -t * 0.03;
      cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); cx.stroke(); cx.setLineDash([]);
    };

    const dibujar = (t) => {
      if (!vivo) return; raf = requestAnimationFrame(dibujar);
      const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const w = Math.round(cv.clientWidth * DPR); const h = Math.round(cv.clientHeight * DPR); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const p = clamp01(-r.top / Math.max(1, r.height - innerHeight));
      const pasos = N + 2; const s = Math.min(N, Math.floor(p * pasos) - 1); // -1 intro · 0..N-1 parejas · N final
      setPaso((x) => (x === s ? x : s));
      if (s >= 0 && s < N && vistoEn[s] == null) vistoEn[s] = t;
      const movil = innerWidth < 760;
      cx.fillStyle = '#040607'; cx.fillRect(0, 0, w, h);
      // campo de partículas
      for (const q of campo) {
        const ang = Math.sin(q.x * 6 + t * 0.00025) * 2 + Math.cos(q.y * 5 - t * 0.0002) * 2;
        q.x += Math.cos(ang) * 0.00022 * (0.4 + q.z); q.y += Math.sin(ang) * 0.00022 * (0.4 + q.z); if (q.x < 0) q.x += 1; if (q.x > 1) q.x -= 1; if (q.y < 0) q.y += 1; if (q.y > 1) q.y -= 1;
        const a = (0.08 + 0.3 * q.z) * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.002 * (0.5 + q.r) + q.r * 40)));
        cx.fillStyle = q.z > 0.8 ? `rgba(220,248,255,${a})` : `rgba(73,198,229,${a * 0.7})`; const z = (0.6 + q.z * 1.4) * DPR; cx.fillRect(q.x * w, q.y * h, z, z);
      }
      // la isla de fondo
      if (isla.length) {
        const ih = h * (movil ? 0.62 : 0.92); const iw = ih * islaAsp; const ix = (movil ? 0.5 : 0.72) * w - iw / 2; const iy = (movil ? 0.2 : 0.04) * h;
        const al = s < 0 ? 0.75 : 0.42; const pz = Math.max(1.2, iw / 150) * 0.9;
        for (const [x, y, rr, g, b, f] of isla) { const res = 0.75 + 0.25 * Math.sin(t * 0.0015 + f * 20); cx.fillStyle = `rgba(${rr},${g},${b},${al * res})`; cx.fillRect(ix + x * iw, iy + y * ih, pz, pz); }
      }
      // parejas ya vistas: cuadrados pequeños unidos sobre la isla
      const Lp = (movil ? 30 : 44) * DPR;
      for (let k = 0; k < Math.min(s, N); k++) {
        const [px, py] = CONSTELACION[k % CONSTELACION.length]; const X = (movil ? 0.15 + (k % 4) * 0.23 : px) * w; const Y = (movil ? 0.08 + Math.floor(k / 4) * 0.08 : py) * h;
        const pr = datos.pares[k]; const ka = 1;
        recuadro(X - Lp * 1.15, Y - Lp / 2, Lp, ret[pr.a.tid], 1, null, null, t, 0.9);
        recuadro(X + Lp * 0.15, Y - Lp / 2, Lp, ret[pr.b.tid], 1, null, null, t, 0.9);
        cx.fillStyle = '#ff6b4a'; cx.fillRect(X - 3 * DPR, Y - 3 * DPR, 6 * DPR, 6 * DPR);
        if (k > 0) { const [qx, qy] = CONSTELACION[(k - 1) % CONSTELACION.length]; if (!movil) linea(qx * w, qy * h, X, Y, ka, t, false); }
      }
      // la pareja actual, grande
      if (s >= 0 && s < N) {
        const pr = datos.pares[s]; const k = clamp01((t - vistoEn[s]) / 1600);
        const L = (movil ? Math.min(w * 0.36, h * 0.2) : Math.min(w * 0.17, h * 0.34));
        const ax = movil ? w * 0.08 : w * 0.38; const ay = movil ? h * 0.3 : h * 0.3; const bx = movil ? w * 0.92 - L : w * 0.38 + L * 2.1; const by = movil ? h * 0.3 : h * 0.3;
        const qx = (ax + L + bx) / 2; const qy = ay + L / 2; const Lq = movil ? L * 0.55 : L * 0.62;
        linea(ax + L, ay + L / 2, qx - Lq / 2, qy, suave(k * 1.6 - 0.4), t, true);
        linea(bx, by + L / 2, qx + Lq / 2, qy, suave(k * 1.6 - 0.4), t, true);
        recuadro(ax, ay, L, ret[pr.a.tid], k, 2 * s + 1, pr.a.es, t);
        recuadro(bx, by, L, ret[pr.b.tid], clamp01(k * 1.15 - 0.15), 2 * s + 2, pr.b.es, t);
        cuadroInter(qx, qy, Lq, pr.tipo, suave(k * 2 - 0.6));
      }
    };
    raf = requestAnimationFrame(dibujar);
    return () => { vivo = false; cancelAnimationFrame(raf); };
  }, [datos]);

  const N = datos?.pares.length ?? 8;
  const pr = datos && paso >= 0 && paso < N ? datos.pares[paso] : null;
  return (
    <section id="tramas" ref={ref} className="relative bg-tinta text-papel" style={{ height: `${(N + 2) * 100}svh` }} aria-label="Especies de Tierra Bomba y sus interacciones">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={cvRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <div className="marco" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-tinta/90 to-transparent sm:hidden" />
        <div className="absolute bottom-10 left-5 right-5 sm:bottom-auto sm:left-12 sm:right-auto sm:top-1/2 sm:w-[min(24rem,30vw)] sm:-translate-y-1/2">
          {paso < 0 && (
            <div key="intro" className="entra">
              <p className="etiqueta text-arcilla">07 · Especies de la isla</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">Tramas de vida de Tierra Bomba</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/75">Cada especie de la isla depende de otras: las poliniza, se las come, dispersa sus semillas o le da refugio. Baje para ver algunas de esas relaciones.</p>
              <p className="etiqueta mt-6 flex items-center gap-3 text-white/60">Baje <span className="flecha inline-block">↓</span></p>
            </div>
          )}
          {pr && (
            <div key={paso} className="entra">
              <p className="etiqueta text-arcilla">{String(paso + 1).padStart(2, '0')} / {String(N).padStart(2, '0')} · {pr.tipos.join(' · ')}</p>
              <h2 className="mt-3 text-3xl leading-[1.02] sm:text-4xl">{pr.a.es}<span className="mx-2 text-arcilla">↔</span>{pr.b.es}</h2>
              <p className="mt-3 text-[13px] italic leading-snug text-white/60">{pr.a.sci} · {pr.b.sci}</p>
              <p className="mt-4 text-[11px] leading-snug text-white/45">Fuente: {pr.fuente}</p>
            </div>
          )}
          {datos && paso >= N && (
            <div key="fin" className="entra">
              <p className="etiqueta text-arcilla">La trama completa</p>
              <h2 className="mt-3 text-4xl sm:text-5xl">{datos.relaciones.toLocaleString('es-CO')} relaciones entre {datos.especies} especies</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/75">Estas ocho son solo una muestra. Abajo, la red completa de la isla para explorar.</p>
              <p className="etiqueta mt-6 flex items-center gap-3 text-white/60">La red <span className="flecha inline-block">↓</span></p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
