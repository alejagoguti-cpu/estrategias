import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Antes de la red de especies, como en «Laboratorios ecosistémicos epigenéticos»:
// 1) Tierra Bomba en puntos; 2) el manglar reconstruido con puntos desde una fotografía y una profundidad estimada,
// por el que la cámara avanza al bajar; 3) dentro del manglar salen las especies (fotos de iNaturalist recortadas,
// dibujadas con puntos) y los cuadrados de sus interacciones. Las parejas ya vistas quedan ancladas en el bosque.
const BASE = import.meta.env.BASE_URL;
const FOTOS = `${BASE}datos/tramas/`;
const R = 104; // resolución del retrato en puntos

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const suave = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const cargarImg = (src) => new Promise((ok, mal) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = mal; i.src = src; });

async function retrato(tid) {
  try {
    const img = await cargarImg(`${FOTOS}${tid}.png`);
    const c = document.createElement('canvas'); c.width = R; c.height = R; const x = c.getContext('2d', { willReadFrequently: true });
    const m = Math.min(img.width, img.height); x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, R, R);
    const d = x.getImageData(0, 0, R, R).data; const pts = [];
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) { const o = (j * R + i) * 4; if (d[o + 3] < 90) continue; const lum = (d[o] + d[o + 1] + d[o + 2]) / 765; pts.push({ i: i + (Math.random() - 0.5) * 0.5, j: j + (Math.random() - 0.5) * 0.5, c: `rgb(${Math.min(255, d[o] * 1.08 + 8)},${Math.min(255, d[o + 1] * 1.08 + 8)},${Math.min(255, d[o + 2] * 1.08 + 8)})`, r: 0.28 + 0.36 * lum, sx: Math.random(), sy: Math.random(), f: Math.random() }); }
    return pts;
  } catch { return null; }
}

// profundidad estimada de la foto del manglar (u, v en 0..1): agua como plano hasta la línea de raíces,
// troncos de los lados cerca, fondo del bosque lejos y los claros de luz más lejos
const HORIZONTE = 0.56;
function profundidad(u, v, lum) {
  if (v > HORIZONTE) return Math.min(26, Math.max(1.6, 2.6 / (v - HORIZONTE + 0.035)));
  const lado = Math.abs(u - 0.55) * 2; // 0 centro, 1 bordes
  let z = 22 - 13 * Math.pow(lado, 1.4);
  z += (HORIZONTE - v) * 6; // la copa se inclina hacia la cámara
  if (lum > 0.78) z += 10; // cielo entre las copas, al fondo
  return Math.max(4, Math.min(34, z));
}

// anclas (u, v) dentro de la foto donde quedan las parejas ya vistas
const ANCLAS = [[0.17, 0.5], [0.36, 0.42], [0.6, 0.47], [0.82, 0.4], [0.27, 0.66], [0.5, 0.6], [0.72, 0.64], [0.9, 0.56]];

export default function Tramas() {
  const ref = useRef(null); const cvRef = useRef(null); const glRef = useRef(null);
  const [datos, setDatos] = useState(null);
  const [paso, setPaso] = useState(-1);
  useEffect(() => {
    let vivo = true; const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; io.disconnect(); fetch(`${BASE}datos/tramas.json`).then((r) => r.json()).then((d) => { if (vivo) setDatos(d); }); }, { rootMargin: '0px 0px 600% 0px' });
    io.observe(el); return () => { vivo = false; io.disconnect(); };
  }, []);

  useEffect(() => {
    if (!datos) return undefined;
    const cv = cvRef.current; const cx = cv.getContext('2d'); const sec = ref.current; const gl = glRef.current;
    let raf = 0; let vivo = true; const DPR = Math.min(devicePixelRatio || 1, 2);
    const N = datos.pares.length;
    const ret = {}; datos.pares.forEach((p) => [p.a, p.b].forEach((s) => { retrato(s.tid).then((r) => { ret[s.tid] = r; }); }));

    // ---- el manglar en puntos (three.js)
    const ren = new THREE.WebGLRenderer({ canvas: gl, antialias: false, alpha: true, powerPreference: 'high-performance' });
    ren.setPixelRatio(Math.min(DPR, 1.5)); ren.setClearColor(0x040607, 1);
    const escena = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(58, 1, 0.05, 200);
    const FOV_FOTO = 62; // apertura con la que se "proyecta" la foto
    const k = Math.tan(THREE.MathUtils.degToRad(FOV_FOTO / 2));
    let aspFoto = 2; const anclas3d = [];
    const uniformes = { uT: { value: 0 }, uTam: { value: 2.2 * Math.min(DPR, 1.5) }, uAlfa: { value: 0 } };
    cargarImg(`${FOTOS}manglar.webp`).then((img) => {
      if (!vivo) return;
      const W = 420; const H = Math.round(W * img.height / img.width); aspFoto = img.width / img.height;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, W, H);
      const d = x.getImageData(0, 0, W, H).data;
      const pos = []; const col = []; const fase = [];
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const u = (i + Math.random()) / W; const v = (j + Math.random()) / H; const o = (j * W + i) * 4;
        const r = d[o] / 255; const g = d[o + 1] / 255; const b = d[o + 2] / 255; const lum = 0.3 * r + 0.59 * g + 0.11 * b;
        const z = profundidad(u, v, lum) * (0.94 + Math.random() * 0.12);
        pos.push((u - 0.5) * 2 * k * aspFoto * z, -(v - 0.5) * 2 * k * z, -z);
        col.push(Math.min(1, r * 1.12), Math.min(1, g * 1.12), Math.min(1, b * 1.12)); fase.push(Math.random() * 6.283);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      geo.setAttribute('aFase', new THREE.Float32BufferAttribute(fase, 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: uniformes, transparent: true, depthWrite: false, vertexColors: true,
        vertexShader: `uniform float uT; uniform float uTam; attribute float aFase; varying vec3 vC; varying float vA;
          void main(){ vec3 p = position; p.x += sin(uT*0.6 + aFase + p.y*0.4) * 0.002 * -p.z; p.y += cos(uT*0.5 + aFase) * 0.0015 * -p.z;
            vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
            float dist = -mv.z; gl_PointSize = clamp(uTam * 22.0 / dist, 1.0, 9.0);
            vC = color; vA = clamp(1.6 - dist / 30.0, 0.15, 1.0) * (0.82 + 0.18 * sin(uT * 1.5 + aFase)); }`,
        fragmentShader: `uniform float uAlfa; varying vec3 vC; varying float vA;
          void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q); if (r > 0.5) discard; gl_FragColor = vec4(vC, vA * uAlfa * smoothstep(0.5, 0.2, r)); }`,
      });
      escena.add(new THREE.Points(geo, mat));
      ANCLAS.forEach(([u, v]) => { const z = profundidad(u, v, 0.4) * 0.8; anclas3d.push(new THREE.Vector3((u - 0.5) * 2 * k * aspFoto * z, -(v - 0.5) * 2 * k * z, -z)); });
    });

    // ---- la isla en puntos (fondo de la portada)
    let isla = []; let islaAsp = 1;
    (async () => {
      try {
        const C = await (await fetch(`${BASE}datos/capas_lectura.json`)).json();
        const GW = C.malla.gw; const GH = C.malla.gh; const W = C.win; const m = Uint8Array.from(atob(C.isla), (c) => c.charCodeAt(0));
        const img = await cargarImg(`${BASE}assets/texturas/sat_base.jpg`);
        const t = document.createElement('canvas'); t.width = GW; t.height = GH; const tx = t.getContext('2d', { willReadFrequently: true });
        tx.drawImage(img, W.left, W.top, W.w, W.h, 0, 0, GW, GH); const d = tx.getImageData(0, 0, GW, GH).data;
        let i0 = GW; let i1 = 0; let j0 = GH; let j1 = 0; for (let q = 0; q < GW * GH; q++) if (m[q]) { const i = q % GW; const j = Math.floor(q / GW); i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
        const pts = []; for (let q = 0; q < GW * GH; q++) if (m[q]) { const i = q % GW; const j = Math.floor(q / GW); pts.push([(i - i0 + 0.5 + (Math.random() - 0.5) * 0.7) / (i1 - i0 + 1), (j - j0 + 0.5 + (Math.random() - 0.5) * 0.7) / (j1 - j0 + 1), d[q * 4], d[q * 4 + 1], d[q * 4 + 2], Math.random()]); }
        isla = pts; islaAsp = (i1 - i0) / (j1 - j0);
      } catch { /* sin isla */ }
    })();
    const campo = Array.from({ length: innerWidth < 760 ? 1800 : 5000 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), r: Math.random() }));
    const vistoEn = {};

    const recuadro = (x, y, L, pts, kk0, num, nombre, t, alfa = 1) => {
      cx.globalAlpha = alfa;
      cx.fillStyle = 'rgba(4,6,7,.9)'; cx.fillRect(x, y, L, L);
      if (pts) {
        const p = L / R;
        for (const q of pts) {
          const kk = suave((kk0 - q.f * 0.45) / 0.55);
          const tx = (q.i + 0.5) * p; const ty = (q.j + 0.5) * p;
          const fx = x + (q.sx * 2 - 0.5) * L * (1 - kk) + tx * kk; const fy = y + (q.sy * 2 - 0.5) * L * (1 - kk) + ty * kk;
          const resp = 0.9 + 0.1 * Math.sin(t * 0.003 + q.f * 30);
          cx.fillStyle = q.c; cx.beginPath(); cx.arc(fx, fy, Math.max(0.4, p * q.r * resp), 0, 6.283); cx.fill();
        }
      }
      cx.strokeStyle = 'rgba(214,230,236,.5)'; cx.lineWidth = 1 * DPR; cx.strokeRect(x + 0.5, y + 0.5, L - 1, L - 1);
      if (num != null) { cx.font = `500 ${Math.round(10 * DPR)}px "Geist Mono", monospace`; cx.fillStyle = 'rgba(232,238,240,.75)'; cx.textAlign = 'right'; cx.fillText(String(num).padStart(2, '0'), x + L - 6 * DPR, y + 14 * DPR); }
      if (nombre) { cx.font = `500 ${Math.round(11 * DPR)}px "Geist Mono", monospace`; cx.fillStyle = 'rgba(232,238,240,.95)'; cx.textAlign = 'left'; cx.fillText(nombre.toUpperCase(), x, y + L + 18 * DPR); }
      cx.globalAlpha = 1;
    };
    const cuadroInter = (x, y, L, tipo, kk) => {
      cx.globalAlpha = kk;
      cx.fillStyle = 'rgba(4,6,7,.72)'; cx.fillRect(x - L / 2, y - L / 2, L, L);
      cx.fillStyle = 'rgba(255,107,74,.14)'; cx.fillRect(x - L / 2, y - L / 2, L, L);
      cx.strokeStyle = '#ff6b4a'; cx.lineWidth = 1.2 * DPR; cx.strokeRect(x - L / 2, y - L / 2, L, L);
      cx.font = `500 ${Math.round(10 * DPR)}px "Geist Mono", monospace`; cx.fillStyle = '#ff8a6a'; cx.textAlign = 'center';
      const pal = tipo.toUpperCase().split(' '); const lineas = []; let l = '';
      pal.forEach((w) => { if ((l + ' ' + w).trim().length > 14) { lineas.push(l.trim()); l = w; } else l += ' ' + w; }); lineas.push(l.trim());
      lineas.slice(0, 4).forEach((s, i) => cx.fillText(s, x, y - (lineas.length - 1) * 7 * DPR + i * 14 * DPR + 4 * DPR));
      cx.globalAlpha = 1;
    };
    const linea = (x0, y0, x1, y1, kk, t, coral) => {
      cx.strokeStyle = coral ? 'rgba(255,107,74,.8)' : 'rgba(214,230,236,.45)'; cx.lineWidth = 1 * DPR;
      cx.setLineDash([6 * DPR, 6 * DPR]); cx.lineDashOffset = -t * 0.03;
      cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x0 + (x1 - x0) * kk, y0 + (y1 - y0) * kk); cx.stroke(); cx.setLineDash([]);
    };
    const v3 = new THREE.Vector3();

    const dibujar = (t) => {
      if (!vivo) return; raf = requestAnimationFrame(dibujar);
      const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const w = Math.round(cv.clientWidth * DPR); const h = Math.round(cv.clientHeight * DPR); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const p = clamp01(-r.top / Math.max(1, r.height - innerHeight));
      const pasos = N + 2; const s = Math.min(N, Math.floor(p * pasos) - 1); // -1 isla · 0..N-1 parejas · N final
      setPaso((x) => (x === s ? x : s));
      if (s >= 0 && s < N && vistoEn[s] == null) vistoEn[s] = t;
      const movil = innerWidth < 760;
      // del mapa de la isla al manglar
      const p0 = 1 / pasos; const bosque = suave((p - p0 * 0.55) / (p0 * 0.5));
      // ---- manglar
      const gw = gl.clientWidth; const gh = gl.clientHeight;
      if (gl.width !== Math.round(gw * ren.getPixelRatio()) || gl.height !== Math.round(gh * ren.getPixelRatio())) { ren.setSize(gw, gh, false); cam.aspect = gw / gh; cam.updateProjectionMatrix(); }
      const avance = clamp01((p - p0 * 0.55) / (1 - p0 * 0.55));
      cam.position.set(Math.sin(t * 0.00018) * 0.35, Math.sin(t * 0.00023) * 0.12, 0.4 - avance * 8);
      cam.lookAt(cam.position.x * 1.4 + Math.sin(t * 0.00012) * 0.3, cam.position.y - 0.25, cam.position.z - 10);
      uniformes.uT.value = t * 0.001; uniformes.uAlfa.value = bosque;
      if (bosque > 0.01) ren.render(escena, cam); else ren.clear();
      // ---- capa 2D: isla, partículas y especies
      cx.clearRect(0, 0, w, h);
      const aIsla = 1 - bosque;
      if (aIsla > 0.01) {
        cx.globalAlpha = aIsla; cx.fillStyle = '#040607'; cx.fillRect(0, 0, w, h); cx.globalAlpha = 1;
        for (const q of campo) {
          const ang = Math.sin(q.x * 6 + t * 0.00025) * 2 + Math.cos(q.y * 5 - t * 0.0002) * 2;
          q.x += Math.cos(ang) * 0.00022 * (0.4 + q.z); q.y += Math.sin(ang) * 0.00022 * (0.4 + q.z); if (q.x < 0) q.x += 1; if (q.x > 1) q.x -= 1; if (q.y < 0) q.y += 1; if (q.y > 1) q.y -= 1;
          const a = (0.16 + 0.5 * q.z) * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.002 * (0.5 + q.r) + q.r * 40))) * aIsla;
          cx.fillStyle = q.z > 0.8 ? `rgba(220,248,255,${a})` : `rgba(73,198,229,${a * 0.7})`; const z = (0.6 + q.z * 1.4) * DPR; cx.fillRect(q.x * w, q.y * h, z, z);
        }
        if (isla.length) {
          // al pasar al manglar, la isla se acerca y se disuelve
          const zoom = 1 + bosque * 2.5;
          const ih = h * (movil ? 0.62 : 0.92) * zoom; const iw = ih * islaAsp; const ix = (movil ? 0.5 : 0.68) * w - iw / 2; const iy = (movil ? 0.2 : 0.04) * h - (zoom - 1) * h * 0.25; const rad = Math.max(0.8, iw / 300);
          for (const [x, y, rr, g, b, f] of isla) { const res = 0.7 + 0.3 * Math.sin(t * 0.0015 + f * 20); cx.fillStyle = `rgba(${Math.min(255, rr * 1.25 + 20)},${Math.min(255, g * 1.25 + 25)},${Math.min(255, b * 1.2 + 25)},${0.85 * res * aIsla})`; cx.beginPath(); cx.arc(ix + x * iw, iy + y * ih, rad * (0.7 + 0.5 * f), 0, 6.283); cx.fill(); }
        }
      }
      // velo para leer el texto sobre el manglar
      if (bosque > 0.01) { const gr = cx.createLinearGradient(0, 0, w * 0.45, 0); gr.addColorStop(0, `rgba(4,6,7,${0.78 * bosque})`); gr.addColorStop(1, 'rgba(4,6,7,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, w * 0.45, h); }
      // parejas ya vistas: cuadrados pequeños anclados en el manglar
      const Lp = (movil ? 28 : 40) * DPR;
      const enPantalla = [];
      for (let q = 0; q < Math.min(s, N); q++) {
        const A = anclas3d[q % Math.max(1, anclas3d.length)]; if (!A) continue;
        v3.copy(A).project(cam); if (v3.z > 1) continue;
        const X = (v3.x * 0.5 + 0.5) * w; const Y = (-v3.y * 0.5 + 0.5) * h; enPantalla.push([X, Y]);
        const pr = datos.pares[q];
        recuadro(X - Lp * 1.12, Y - Lp / 2, Lp, ret[pr.a.tid], 1, null, null, t, 0.95 * bosque);
        recuadro(X + Lp * 0.12, Y - Lp / 2, Lp, ret[pr.b.tid], 1, null, null, t, 0.95 * bosque);
        cx.globalAlpha = bosque; cx.fillStyle = '#ff6b4a'; cx.fillRect(X - 3 * DPR, Y - 3 * DPR, 6 * DPR, 6 * DPR);
        cx.font = `500 ${Math.round(9 * DPR)}px "Geist Mono", monospace`; cx.fillStyle = 'rgba(232,238,240,.85)'; cx.textAlign = 'left'; cx.fillText(`${String(q + 1).padStart(2, '0')} · ${pr.tipo.toLowerCase()}`, X - Lp * 1.12, Y + Lp / 2 + 13 * DPR); cx.globalAlpha = 1;
      }
      for (let q = 1; q < enPantalla.length; q++) linea(enPantalla[q - 1][0], enPantalla[q - 1][1], enPantalla[q][0], enPantalla[q][1], bosque, t, false);
      // la pareja actual, grande
      if (s >= 0 && s < N) {
        const pr = datos.pares[s]; const kk = clamp01((t - vistoEn[s]) / 1600);
        const L = (movil ? Math.min(w * 0.4, h * 0.24) : Math.min(w * 0.2, h * 0.4));
        const ax = movil ? w * 0.06 : w * 0.37; const ay = movil ? h * 0.26 : h * 0.29; const bx = movil ? w * 0.94 - L : w * 0.37 + L * 1.95; const by = ay;
        const Lq = L * 0.6;
        const qx = movil ? w / 2 : (ax + L + bx) / 2; const qy = movil ? ay + L + 34 * DPR + Lq / 2 : ay + L / 2;
        if (movil) { linea(ax + L / 2, ay + L + 26 * DPR, qx - Lq / 2, qy, suave(kk * 1.6 - 0.4), t, true); linea(bx + L / 2, by + L + 26 * DPR, qx + Lq / 2, qy, suave(kk * 1.6 - 0.4), t, true); }
        else { linea(ax + L, ay + L / 2, qx - Lq / 2, qy, suave(kk * 1.6 - 0.4), t, true); linea(bx, by + L / 2, qx + Lq / 2, qy, suave(kk * 1.6 - 0.4), t, true); }
        recuadro(ax, ay, L, ret[pr.a.tid], kk, 2 * s + 1, pr.a.es, t);
        recuadro(bx, by, L, ret[pr.b.tid], clamp01(kk * 1.15 - 0.15), 2 * s + 2, pr.b.es, t);
        cuadroInter(qx, qy, Lq, pr.tipo, suave(kk * 2 - 0.6));
      }
    };
    raf = requestAnimationFrame(dibujar);
    return () => { vivo = false; cancelAnimationFrame(raf); ren.dispose(); };
  }, [datos]);

  const N = datos?.pares.length ?? 8;
  const pr = datos && paso >= 0 && paso < N ? datos.pares[paso] : null;
  return (
    <section id="tramas" ref={ref} className="relative bg-tinta text-papel" style={{ height: `${(N + 2) * 100}svh` }} aria-label="Especies de Tierra Bomba y sus interacciones, dentro del manglar">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={glRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <canvas ref={cvRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <div className="marco" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-tinta/90 to-transparent sm:hidden" />
        <div className="absolute bottom-10 left-5 right-5 sm:bottom-auto sm:left-12 sm:right-auto sm:top-1/2 sm:w-[min(24rem,30vw)] sm:-translate-y-1/2">
          {paso < 0 && (
            <div key="intro" className="entra">
              <p className="etiqueta text-arcilla">07 · Especies de la isla</p>
              <h2 className="mt-4 text-4xl sm:text-5xl">Tramas de vida de Tierra Bomba</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/75">Cada especie de la isla depende de otras: las poliniza, se las come, dispersa sus semillas o le da refugio. Baje para entrar al manglar.</p>
              <p className="etiqueta mt-6 flex items-center gap-3 text-white/60">Baje <span className="flecha inline-block">↓</span></p>
            </div>
          )}
          {pr && (
            <div key={paso} className="entra">
              <p className="etiqueta text-arcilla">{String(paso + 1).padStart(2, '0')} / {String(N).padStart(2, '0')} · {pr.tipos.join(' · ')}</p>
              <h2 className="mt-3 text-3xl leading-[1.02] sm:text-4xl">{pr.a.es}<span className="mx-2 text-arcilla">↔</span>{pr.b.es}</h2>
              <p className="mt-3 text-[13px] italic leading-snug text-white/60">{pr.a.sci} · {pr.b.sci}</p>
              <p className="mt-4 text-[11px] leading-snug text-white/45">Interacción: {pr.fuente}</p>
              <p className="mt-1 text-[10.5px] leading-snug text-white/35">Fotos (iNaturalist): {pr.a.credito}; {pr.b.credito}</p>
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
        <p className="absolute bottom-3 right-6 hidden max-w-md text-right text-[10px] leading-snug text-white/35 sm:block">Manglar reconstruido con puntos desde una fotografía y una profundidad estimada: representación, no un levantamiento.</p>
      </div>
    </section>
  );
}
