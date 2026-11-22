import React, { useEffect, useRef, useState } from 'react';

// Corte vivo dibujado con puntos (estética del manglar de «Tramas»). La escena llega en `cfg`
// (src/lib/cortes/*): perfil del terreno, cotas de agua, dibujos de fondo y pasto, especies con su
// movimiento e interacciones registradas. El agua ondula, el pasto se mece, los animales se mueven y con
// doble clic sobre uno aparece su interacción (encuentro animado + ficha con la fuente).
const BASE = import.meta.env.BASE_URL;
const REC = `${BASE}datos/tramas/m/`;
const VB = { x: 0, y: 30, w: 1200, h: 530 };

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const vaiven = (t, a, b, v, f = 0) => { const L = b - a; const u = ((t * v + f) % (2 * L) + 2 * L) % (2 * L); return u < L ? { x: a + u, dir: 1 } : { x: b - (u - L), dir: -1 }; };
const suave = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const cargar = (src) => new Promise((ok, mal) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = mal; i.src = src; });

// muestrea en puntos lo que dibuja `pintar` en un lienzo de w×h unidades lógicas
function muestrear(w, h, paso, pintar, { realce = true, saltar = () => 0 } = {}) {
  const k = 2; const c = document.createElement('canvas'); c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
  const x = c.getContext('2d', { willReadFrequently: true }); x.scale(k, k); pintar(x);
  const d = x.getImageData(0, 0, c.width, c.height).data; const pts = [];
  for (let j = 0; j < h; j += paso) for (let i = 0; i < w; i += paso) {
    const px = i + (Math.random() - 0.5) * paso * 0.9; const py = j + (Math.random() - 0.5) * paso * 0.9;
    const qx = Math.round(clamp(px, 0, w - 0.5) * k); const qy = Math.round(clamp(py, 0, h - 0.5) * k); const o = (qy * c.width + qx) * 4;
    if (d[o + 3] < 110) continue; if (Math.random() < saltar(px, py)) continue;
    let r = d[o]; let g = d[o + 1]; let b = d[o + 2];
    if (realce) { const l = (r + g + b) / 765; if (l < 0.28) { const m = (0.28 - l) * 1.9; r += (96 - r) * m; g += (112 - g) * m; b += (128 - b) * m; } r = Math.min(255, r * 1.08 + 8); g = Math.min(255, g * 1.08 + 8); b = Math.min(255, b * 1.08 + 8); }
    const v = 0.88 + Math.random() * 0.24;
    pts.push({ x: px, y: py, c: `rgb(${Math.min(255, r * v) | 0},${Math.min(255, g * v) | 0},${Math.min(255, b * v) | 0})`, r: 0.75 + Math.random() * 0.5, f: Math.random() * 6.283 });
  }
  return pts;
}
// tramos donde el agua a la cota y cubre el terreno
const tramoCota = (suelo, y) => { let x0 = null; let x1 = null; for (let x = 90; x <= 1150; x += 1) { if (suelo(x) > y + 0.5) { if (x0 == null) x0 = x; x1 = x; } else if (x0 != null) break; } return [x0 ?? 90, x1 ?? 90]; };

export default function CorteVivo({ cfg }) {
  const caja = useRef(null); const lienzo = useRef(null);
  const interRef = useRef(null); const alAbrir = useRef(null); const alCerrar = useRef(null);
  const [ficha, setFicha] = useState(null);
  alAbrir.current = (d) => setFicha(d); alCerrar.current = () => setFicha(null);
  const { suelo } = cfg;

  useEffect(() => {
    const el = caja.current; const cv = lienzo.current; if (!el || !cv) return undefined;
    const cx = cv.getContext('2d'); let vivo = true; let raf = 0; let visible = false;
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DPR = Math.min(devicePixelRatio || 1, 2);
    const COT = cfg.cotas; const yTope = COT[0]?.y ?? 9999;
    // puntos
    const fondo = muestrear(1200, 560, 3.0, cfg.pintarFondo, { saltar: (px, py) => (py > suelo(px) + 4 ? clamp((py - suelo(px)) / 90, 0, 0.82) : 0) });
    const pasto = muestrear(1200, 560, 2.4, cfg.pintarPasto).map((p) => ({ ...p, base: suelo(p.x) }));
    const flotantes = cfg.pintarFlotantes ? muestrear(1200, 560, 2.0, cfg.pintarFlotantes) : [];
    const agua = [];
    COT.forEach((c, i) => {
      const y0 = c.y; const y1 = COT[i + 1]?.y ?? 540;
      for (let y = y0; y < y1; y += 3.1) for (let xx = 90; xx < 1150; xx += 3.1) {
        const px = xx + (Math.random() - 0.5) * 2.6; const py = y + (Math.random() - 0.5) * 2.6;
        if (py >= suelo(px) - 1.5 || Math.random() > c.dens) continue;
        const v = 0.8 + Math.random() * 0.35; agua.push({ x: px, y: py, c: `rgb(${(c.col[0] * v) | 0},${(c.col[1] * v) | 0},${(c.col[2] * v) | 0})`, r: 0.7 + Math.random() * 0.5, f: Math.random() * 6.283, banda: i });
      }
    });
    const espuma = []; COT.forEach((c) => { const [a, b] = tramoCota(suelo, c.y); for (let xx = a + 2; xx < b; xx += 5.5) espuma.push({ x: xx, y: c.y, f: Math.random() * 6.283 }); });
    const ola = (x, y, t, banda = 0) => { const prof = clamp((y - yTope) / 130, 0, 1); return Math.sin(x * 0.045 + t * 1.3 + banda) * (1.6 - prof) + Math.sin(x * 0.11 - t * 2.1) * 0.5; };
    // especies → puntos
    const especies = cfg.especies.map((e) => ({ ...e, pts: null, alto: 0 }));
    especies.forEach((e) => {
      const listo = (img) => {
        const w = e.w; const h = img ? (w * img.height) / img.width : (w * e.ch) / e.cw; e.alto = h;
        const paso = w < 60 ? 1.05 : w < 120 ? 1.3 : 1.5;
        const pts = muestrear(w, h, paso, (x) => { if (img) x.drawImage(img, 0, 0, w, h); else { x.scale(w / e.cw, w / e.cw); e.pintar(x); } });
        e.pts = pts.map((p) => ({ ...p, x: p.x - w / 2, y: e.anc === 'pie' ? p.y - h : p.y - h / 2 }));
      };
      if (e.src || e.url) cargar(e.url ? `${BASE}${e.url}` : `${REC}${e.src}.webp`).then((img) => { if (vivo) listo(img); }).catch(() => {}); else listo(null);
    });

    // capa estática prerenderizada
    const capa = document.createElement('canvas'); const cc = capa.getContext('2d');
    let esc = 1; let W = 0; let H = 0;
    const punto = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); };
    const tam = () => {
      W = Math.round(cv.clientWidth * DPR); H = Math.round(cv.clientHeight * DPR); if (!W || !H) return;
      cv.width = W; cv.height = H; capa.width = W; capa.height = H; esc = W / VB.w;
      cc.setTransform(esc, 0, 0, esc, 0, -VB.y * esc); cc.clearRect(0, VB.y, VB.w, VB.h);
      for (const p of fondo) { cc.fillStyle = p.c; cc.globalAlpha = 0.9; punto(cc, p.x, p.y, 1.15 * p.r); }
      cc.globalAlpha = 1;
    };
    const ro = new ResizeObserver(tam); ro.observe(cv); tam();
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '200px' }); io.observe(el);

    const dibujar = (ms) => {
      if (!vivo) return; raf = requestAnimationFrame(dibujar);
      if (!visible || !W) return;
      const t = quieto ? 4 : ms / 1000;
      cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, W, H); cx.drawImage(capa, 0, 0);
      cx.setTransform(esc, 0, 0, esc, 0, -VB.y * esc);
      for (let i = (Math.floor(t * 30) % 7); i < fondo.length; i += 7) { const p = fondo[i]; const a = 0.5 + 0.5 * Math.sin(t * 2.2 + p.f * 3); if (a < 0.75) continue; cx.globalAlpha = (a - 0.75) * 1.6; cx.fillStyle = '#f2f7f2'; punto(cx, p.x, p.y, 0.7); }
      for (const p of agua) { cx.globalAlpha = 0.72 + 0.28 * Math.sin(t * 1.7 + p.f * 5); cx.fillStyle = p.c; punto(cx, p.x + Math.sin(t * 0.6 + p.y * 0.1) * 0.8, p.y + ola(p.x, p.y, t, p.banda), 1.05 * p.r); }
      cx.fillStyle = '#d8f4fb';
      for (const q of espuma) { cx.globalAlpha = 0.35 + 0.45 * Math.max(0, Math.sin(t * 2 + q.f + q.x * 0.03)); punto(cx, q.x + Math.sin(t + q.f) * 1.5, q.y + Math.sin(q.x * 0.045 + t * 1.3) * 1.6, 0.85); }
      for (const p of flotantes) { cx.globalAlpha = 0.95; cx.fillStyle = p.c; punto(cx, p.x + Math.sin(t * 0.5 + p.x * 0.02) * 1.2, p.y + Math.sin(p.x * 0.045 + t * 1.3) * 1.4, 0.95 * p.r); }
      for (const p of pasto) {
        const alto = Math.max(0, p.base - p.y); const sub = cfg.sumergido?.(p.x, p.y); const sw = sub ? Math.sin(t * 0.9 + p.x * 0.04) * 0.12 : (Math.sin(t * 1.6 + p.x * 0.05) * 0.09 + Math.sin(t * 3.7 + p.x * 0.2) * 0.03);
        cx.globalAlpha = 0.95; cx.fillStyle = p.c; punto(cx, p.x + alto * sw * (alto / 18), p.y, 1.05 * p.r);
      }
      cfg.animar?.(cx, t, punto);
      cx.globalAlpha = 1;
      // especies: movimiento normal y, si hay interacción activa, el encuentro
      const M = {}; for (const e of especies) M[e.id] = e.mov(t);
      const it = interRef.current; let kI = 0; let posA = null; let posB = null; let uI = 0;
      if (it) {
        uI = t - (it.t0 ?? (it.t0 = t)); const D = 11;
        kI = suave(uI / 1.6) * (1 - suave((uI - (D - 1.6)) / 1.6));
        if (uI > D) { interRef.current = null; alCerrar.current?.(); }
        else {
          const d = it.def; const A = M[d.a]; const pie = (id, x) => (cfg.pie[id] ? cfg.pie[id](x) : suelo(x));
          const objetivo = {}; const bAnimal = typeof d.b === 'string'; const grupo = bAnimal ? cfg.grupos?.[d.b] : null; const bRef = bAnimal ? (grupo ? grupo[0] : d.b) : null;
          if (it.P == null) it.P = d.P0 ? d.P0(A) : bAnimal ? M[bRef].x : d.b.x;
          const P = it.P;
          if (d.modo === 'cardumen') {
            const ataque = uI > 2.2 ? Math.pow(Math.max(0, Math.sin(uI * 2.2)), 10) * 10 : 0;
            objetivo[d.a] = { x: P, y: pie(d.a, P) + ataque, dir: 1 };
            grupo.forEach((id, i) => { const sp = Math.sin(uI * 1.6 + i * 0.9); objetivo[id] = { x: P + d.dx + Math.cos(uI * 1.4 + i) * 20 - ataque * 1.2, y: d.yB + (i % 4) * 5 + Math.sin(uI * 2 + i) * 3, dir: sp > 0 ? 1 : -1 }; });
          } else if (d.modo === 'compite') {
            const lado = A.x < P ? 1 : -1; const B0 = M[d.b]; const [r0, r1] = cfg.rangos[d.b];
            objetivo[d.a] = d.yA != null ? { x: P - lado * (d.sep ?? 60), y: d.yA, dir: lado, fase: uI * 0.8 } : { x: P - lado * 10, y: pie(d.a, P - lado * 10), dir: lado };
            const xb = clamp(P + lado * 75 * suave((uI - 1.4) / 2), r0, r1); objetivo[d.b] = { x: xb, y: pie(d.b, xb), dir: lado, paso: B0.paso };
          } else if (d.modo === 'caza') {
            const B0 = M[d.b]; const [r0, r1] = cfg.rangos[d.b]; const huye = d.huye ?? 1; const xb = clamp(B0.x + huye * 55 * suave((uI - 1.5) / 2.5), r0, r1);
            objetivo[d.b] = { x: xb, y: pie(d.b, xb), dir: huye, paso: B0.paso };
            if (d.vuela) { const picada = uI > 2.6 && uI < 4.4 ? Math.sin(((uI - 2.6) / 1.8) * Math.PI) : 0; objetivo[d.a] = { x: xb - 30 * huye, y: suelo(xb) - 70 + picada * 48, dir: huye, fase: uI * (picada > 0 ? 1 : 4) }; }
            else { const xa = xb - huye * (22 + 12 * Math.max(0, Math.sin(uI * 2.4))); objetivo[d.a] = { x: xa, y: pie(d.a, xa), dir: huye, paso: Math.sin(uI * 16) * 1.2 }; }
          } else if (d.modo === 'acompana') { const B0 = M[d.b]; objetivo[d.a] = { x: B0.x + Math.sin(uI * 1.3) * 14, y: B0.y - 40 + Math.sin(uI * 2) * 4, dir: -1, fase: uI * 9 }; }
          else if (d.modo === 'planta') { objetivo[d.a] = { x: d.b.x + Math.sin(uI * 2.5) * 4, y: d.yA ?? (cfg.pie[d.a] ? pie(d.a, d.b.x) : d.b.y), dir: -1, nado: uI * 2.5, paso: Math.sin(uI * 6) * 0.5 }; }
          else if (d.modo === 'visita') { objetivo[d.a] = { x: d.b.x + Math.sin(uI * 1.8) * 14, y: d.b.y + Math.sin(uI * 2.7) * 9, dir: Math.cos(uI * 1.8) > 0 ? 1 : -1, fase: uI * 16 }; }
          for (const [id, o] of Object.entries(objetivo)) { const m0 = M[id]; M[id] = { ...m0, ...o, x: m0.x + (o.x - m0.x) * kI, y: m0.y + (o.y - m0.y) * kI, dir: kI > 0.35 ? o.dir : m0.dir }; }
          posA = M[d.a]; posB = bAnimal ? M[bRef] : d.b;
          it.ids = new Set([d.a, ...Object.keys(objetivo)]);
        }
      }
      if (posA && posB && kI > 0.05) {
        const ya = posA.y - 18; const yb = posB.y - 6; cx.globalAlpha = kI; cx.strokeStyle = 'rgba(255,107,74,.85)'; cx.lineWidth = 1.3; cx.setLineDash([6, 6]); cx.lineDashOffset = -t * 30;
        cx.beginPath(); cx.moveTo(posA.x, ya); cx.lineTo(posB.x, yb); cx.stroke(); cx.setLineDash([]);
        const mx = (posA.x + posB.x) / 2; const my = Math.min(ya, yb) - 46; const L = 74;
        cx.fillStyle = 'rgba(4,6,7,.78)'; cx.fillRect(mx - L / 2, my - L / 4, L, L / 2); cx.fillStyle = 'rgba(255,107,74,.16)'; cx.fillRect(mx - L / 2, my - L / 4, L, L / 2);
        cx.strokeStyle = '#ff6b4a'; cx.strokeRect(mx - L / 2, my - L / 4, L, L / 2);
        cx.font = '600 10px "Geist Mono", monospace'; cx.fillStyle = '#ff8a6a'; cx.textAlign = 'center';
        const pal = interRef.current.def.tipo.toUpperCase().split(' '); const lin = []; let l = ''; pal.forEach((w) => { if ((`${l} ${w}`).trim().length > 12) { lin.push(l.trim()); l = w; } else l += ` ${w}`; }); lin.push(l.trim());
        lin.slice(0, 3).forEach((s, i) => cx.fillText(s, mx, my - (lin.length - 1) * 6 + i * 12 + 3));
        cx.strokeStyle = '#d8f4fb';
        for (const q of [posA, posB]) { if (q.y < yTope - 6 || suelo(q.x) < q.y - 2) continue; for (let r = 0; r < 3; r++) { const rr = ((uI * 14 + r * 11) % 33); cx.globalAlpha = kI * (1 - rr / 33) * 0.8; cx.beginPath(); cx.ellipse(q.x, Math.min(q.y, cfg.superficie) - 2, rr, rr * 0.28, 0, 0, 6.283); cx.stroke(); } }
        cx.globalAlpha = 1;
      }
      cx.font = 'italic 12.5px Geist, sans-serif'; cx.textAlign = 'center';
      for (const e of especies) {
        if (!e.pts) continue; const m = M[e.id]; const sx = e.sinVoltear ? 1 : m.dir * e.mira;
        const atenuado = it && it.ids && kI > 0 && !it.ids.has(e.id) ? 1 - 0.7 * kI : 1;
        e.caja = e.anc === 'pie' ? [m.x - e.w / 2, m.y - e.alto, m.x + e.w / 2, m.y] : [m.x - e.w / 2, m.y - e.alto / 2, m.x + e.w / 2, m.y + e.alto / 2];
        let ang = 0; if (e.inclina) { ang = Math.atan2(suelo(m.x + 4) - suelo(m.x - 4), 8); }
        const ca = Math.cos(ang); const sa = Math.sin(ang); const media = e.w / 2;
        for (const p of e.pts) {
          let px = p.x * sx; let py = p.y;
          if (e.aleteo) { const ala = clamp(Math.abs(p.x) / media, 0, 1); py += Math.sin(m.fase) * e.aleteo * e.alto * ala * ala * (p.y < 0 ? 1.4 : 0.6); }
          if (e.mariposa) px *= 0.35 + 0.65 * Math.abs(Math.sin(m.fase));
          if (m.nado != null) py += Math.sin(m.nado + p.x * 0.25) * 0.9;
          if (m.paso != null && py > -e.alto * 0.35) px += m.paso * (p.f > 3.14 ? 1 : -1) * 0.6;
          const rx = px * ca - py * sa; const ry = px * sa + py * ca;
          cx.globalAlpha = 0.95 * atenuado; cx.fillStyle = p.c; punto(cx, m.x + rx, m.y + ry, 0.78 * p.r);
        }
        if (e.sci) { const abajo = e.rotuloAbajo; cx.globalAlpha = 0.72 * atenuado; cx.fillStyle = '#d6ebef'; cx.fillText(e.sci, m.x, abajo ? m.y + e.alto / 2 + 14 : m.y + (e.anc === 'pie' ? -e.alto - 7 : -e.alto / 2 - 7)); }
      }
      cx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(dibujar);

    // doble clic (o doble toque) sobre un animal → su interacción
    const aLogico = (ev) => { const r = cv.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * VB.w, VB.y + ((ev.clientY - r.top) / r.height) * VB.h]; };
    const tocado = (ev) => { const [x, y] = aLogico(ev); let mejor = null; let dm = 1e9; for (const e of especies) { if (!e.caja) continue; const [x0, y0, x1, y1] = e.caja; if (x < x0 - 10 || x > x1 + 10 || y < y0 - 10 || y > y1 + 10) continue; const d = Math.hypot(x - (x0 + x1) / 2, y - (y0 + y1) / 2); if (d < dm) { dm = d; mejor = e; } } return mejor; };
    const abrir = (ev) => {
      const e = tocado(ev); if (!e) return; ev.preventDefault?.();
      const def = cfg.interacciones[cfg.alias ? cfg.alias(e.id) : e.id];
      if (!def || !def.tipo) { interRef.current = null; alAbrir.current?.({ sinRegistro: true, es: def?.es ?? e.sci, sci: def?.sci ?? e.sci }); return; }
      interRef.current = { def, t0: null, P: null }; alAbrir.current?.(def);
    };
    let ultimoToque = 0; let ultimoXY = [0, 0];
    const toque = (ev) => { if (ev.pointerType === 'mouse') return; const ahora = performance.now(); if (ahora - ultimoToque < 330 && Math.hypot(ev.clientX - ultimoXY[0], ev.clientY - ultimoXY[1]) < 30) { abrir(ev); ultimoToque = 0; } else { ultimoToque = ahora; ultimoXY = [ev.clientX, ev.clientY]; } };
    const sobre = (ev) => { cv.style.cursor = tocado(ev) ? 'pointer' : 'default'; };
    cv.addEventListener('dblclick', abrir); cv.addEventListener('pointerup', toque); cv.addEventListener('pointermove', sobre);
    return () => { vivo = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.removeEventListener('dblclick', abrir); cv.removeEventListener('pointerup', toque); cv.removeEventListener('pointermove', sobre); };
  }, [cfg]);

  const { Overlay } = cfg;
  return (
    <div ref={caja} className="relative w-full" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
      <p className="pointer-events-none absolute right-1 top-1 z-10 font-mono text-[10px] uppercase tracking-wider text-white/55">Doble clic sobre un animal: su interacción</p>
      {ficha && (
        <div className="entra absolute left-[23%] top-[1%] z-20 w-[min(21rem,38%)] border border-[#ff6b4a]/50 bg-[#040607]/88 p-2.5 backdrop-blur" role="dialog" aria-live="polite">
          <button type="button" onClick={() => { interRef.current = null; setFicha(null); }} className="absolute right-2 top-1.5 text-[13px] text-white/60 hover:text-white" aria-label="Cerrar">✕</button>
          {ficha.sinRegistro ? (
            <><p className="etiqueta text-arcilla">Sin interacciones registradas</p><p className="mt-2 text-[13px] text-white/85">{ficha.es} <i className="text-white/55">({ficha.sci})</i></p><p className="mt-1.5 text-[11px] leading-snug text-white/55">La base de especies de la isla no registra todavía relaciones de esta especie con las demás del corte.</p></>
          ) : (
            <><p className="etiqueta text-arcilla">{ficha.tipo}</p>
              <p className="mt-1.5 text-[13.5px] leading-tight text-white">{ficha.A[0]}<span className="mx-1.5 text-arcilla">↔</span>{ficha.B[0]}</p>
              <p className="mt-0.5 text-[11px] italic text-white/55">{ficha.A[1]} · {ficha.B[1]}</p>
              <p className="mt-1.5 text-[11.5px] leading-snug text-white/80">{ficha.texto}</p>
              <p className="mt-2 text-[10px] leading-snug text-white/40">Interacción: {ficha.fuente}</p></>
          )}
        </div>
      )}
      <canvas ref={lienzo} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="pointer-events-none absolute inset-0 h-full w-full" role="img" aria-label={cfg.aria}>
        <defs><marker id={`flecha-${cfg.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 L3,5Z" fill="#f4f1ea" /></marker></defs>
        <path d={`M66,${suelo(66)} L60,${suelo(60)}`} stroke="#f4f1ea" strokeWidth="3" markerEnd={`url(#flecha-${cfg.id})`} />
        <path d={`M1144,${suelo(1144)} L1150,${suelo(1150)}`} stroke="#f4f1ea" strokeWidth="3" markerEnd={`url(#flecha-${cfg.id})`} />
        {cfg.cotas.map((c) => {
          const [x0, x1] = tramoCota(suelo, c.y); const et = cfg.etiquetaCota ? cfg.etiquetaCota(c, x0, x1) : { x: x0 + 6, y: c.y - 4, a: 'start' };
          return (
            <g key={c.y}>
              <line x1={x0} y1={c.y} x2={x1} y2={c.y} stroke="#49c6e5" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 4" />
              <text x={et.x} y={et.y} textAnchor={et.a} fill="#7fd8ee" fontSize="11.5" fontFamily="Geist Mono, monospace">{c.m} · {c.nombre}</text>
            </g>
          );
        })}
        {cfg.ecotonos.map(([x, [a, b]]) => {
          const y0 = suelo(x) - 150; const y1 = suelo(x) + 44;
          return (
            <g key={x}>
              <line x1={x} y1="58" x2={x} y2={y0} stroke="#e8eef0" strokeOpacity="0.7" strokeWidth="1" />
              <text transform={`translate(${x + 4},${y1 - 8}) rotate(-90)`} fill="#040607" fontSize="11" fontWeight="700" letterSpacing="1.5" fontFamily="Geist, sans-serif">ECOTONO</text>
              <text transform={`translate(${x - 4},${y0 - 6}) rotate(-90)`} fill="#e8eef0" fontSize="11.5" fontFamily="Geist Mono, monospace">{a}</text>
              <text transform={`translate(${x + 12},${y0 - 6}) rotate(-90)`} fill="#e8eef0" fillOpacity="0.75" fontSize="11.5" fontFamily="Geist Mono, monospace">{b}</text>
            </g>
          );
        })}
        {Overlay && <Overlay />}
        {cfg.rotulos.map(([x, y, t, a]) => <text key={t} x={x} y={y} textAnchor={a} fill="#d6ebef" fillOpacity="0.72" fontSize="12.5" fontStyle="italic" fontFamily="Geist, sans-serif">{t}</text>)}
      </svg>
    </div>
  );
}
