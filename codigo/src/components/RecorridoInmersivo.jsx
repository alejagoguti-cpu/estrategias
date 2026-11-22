import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PAS, azar, clamp } from '../lib/inmersivo/comun.js';

// Recorrido en primera persona con materiales reales: cielo HDRI fotográfico (Poly Haven), luz solar con
// sombras y una escena (`construir`) que aporta el trazado, el terreno y lo que hay en él.
// Se avanza y retrocede (botones, ↑ ↓ / W S, barra, rueda en pantalla completa) y se mira arrastrando.
const OJO = 1.62;

export default function RecorridoInmersivo({ construir, leyenda, aria = 'Recorrido en primera persona' }) {
  const caja = useRef(null); const lienzo = useRef(null);
  const ctl = useRef({ dir: 0, auto: false, yaw: 0, pitch: -0.04, s: 6, salto: null });
  const [listo, setListo] = useState(false);
  const [prog, setProg] = useState(0);
  const [auto, setAuto] = useState(false);
  const [completa, setCompleta] = useState(false);
  const largoRef = useRef(1);

  useEffect(() => {
    const el = caja.current; const hueco = lienzo.current; if (!el || !hueco) return undefined;
    let vivo = true; let raf = 0; let visible = false; let iniciado = false; let limpiar = () => {}; let apagar = 0;
    // una sola escena viva a la vez: se crea al entrar en pantalla y se destruye (liberando la GPU) al salir
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { clearTimeout(apagar); if (!iniciado) { iniciado = true; limpiar = iniciar(); } }
      else if (iniciado) { clearTimeout(apagar); apagar = setTimeout(() => { if (!visible && iniciado) { limpiar(); limpiar = () => {}; iniciado = false; setListo(false); } }, 900); }
    }, { rootMargin: '0px' });
    io.observe(el);

    function iniciar() {
      const cv = document.createElement('canvas'); cv.className = 'absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing'; cv.setAttribute('aria-label', aria); hueco.appendChild(cv);
      const ren = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
      ren.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      ren.toneMapping = THREE.ACESFilmicToneMapping; ren.toneMappingExposure = 0.95;
      ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap;
      const escena = new THREE.Scene();
      const COL_NIEBLA = new THREE.Color(0xb9cfdf);
      escena.fog = new THREE.Fog(COL_NIEBLA, 260, 2600);
      const nieblaU = { value: new THREE.Vector4(COL_NIEBLA.r, COL_NIEBLA.g, COL_NIEBLA.b, 1800) };
      const cam = new THREE.PerspectiveCamera(60, 1, 0.08, 12000);
      const tl = new THREE.TextureLoader();
      const uT = { value: 0 };

      // cielo fotográfico y sol tomado de su píxel más brillante
      const sol = new THREE.Vector3(-0.45, 0.6, -0.65).normalize();
      const luzSol = new THREE.DirectionalLight(0xfff1dc, 3.2); luzSol.castShadow = true; luzSol.shadow.mapSize.set(2048, 2048);
      Object.assign(luzSol.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 180 }); luzSol.shadow.bias = -0.0004; luzSol.shadow.normalBias = 0.03;
      escena.add(luzSol, luzSol.target);
      let activo = true; const ctx = { escena, ren, tl, sol, nieblaU, uT, vivo: () => vivo && activo, rnd: azar(7), agua: null };
      const pm = new THREE.PMREMGenerator(ren);
      new RGBELoader().setDataType(THREE.FloatType).load(`${PAS}cielo_1k.hdr`, (hdr) => {
        if (!vivo || !activo) return;
        const { data, width: w, height: h } = hdr.image; let mejor = 0; let bi = 0; let bj = 0;
        for (let j = 0; j < h / 2; j++) for (let i = 0; i < w; i++) { const o = (j * w + i) * 4; const l = data[o] * 0.3 + data[o + 1] * 0.59 + data[o + 2] * 0.11; if (l > mejor) { mejor = l; bi = i; bj = j; } }
        const fi = ((bi + 0.5) / w - 0.5) * Math.PI * 2; const elev = (0.5 - (bj + 0.5) / h) * Math.PI;
        sol.set(Math.cos(fi) * Math.cos(elev), Math.sin(elev), Math.sin(fi) * Math.cos(elev)).normalize();
        if (sol.y < 0.25) { sol.y = 0.25; sol.normalize(); }
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        escena.environment = pm.fromEquirectangular(hdr).texture; escena.environmentIntensity = 0.85; hdr.dispose();
        if (ctx.agua) ctx.agua.material.uniforms.sunDirection.value.copy(sol);
      });
      tl.load(`${PAS}cielo_8k.jpg`, (t) => { if (!vivo || !activo) { t.dispose(); return; } t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; escena.background = t; });

      const E = construir(ctx); const L = E.L; largoRef.current = L;

      // controles
      const k = ctl.current; const v = { s: k.s, yaw: 0, pitch: 0 };
      const teclas = {};
      const onKey = (e, on) => { if (!visible) return; const code = e.code; if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(code)) { const r = el.getBoundingClientRect(); if (r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4) { teclas[code] = on; e.preventDefault(); } } };
      const kd = (e) => onKey(e, true); const ku = (e) => onKey(e, false);
      addEventListener('keydown', kd); addEventListener('keyup', ku);
      let arr = null;
      const pd = (e) => { arr = { x: e.clientX, y: e.clientY, yaw: k.yaw, pitch: k.pitch }; cv.setPointerCapture(e.pointerId); };
      const pmv = (e) => { if (!arr) return; k.yaw = arr.yaw - (e.clientX - arr.x) * 0.0045; k.pitch = clamp(arr.pitch - (e.clientY - arr.y) * 0.0035, -1.0, 0.75); };
      const pu = () => { arr = null; };
      cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pmv); cv.addEventListener('pointerup', pu); cv.addEventListener('pointercancel', pu);
      const rueda = (e) => { if (!document.fullscreenElement) return; e.preventDefault(); k.s = clamp(k.s - e.deltaY * 0.02, 0, L); };
      cv.addEventListener('wheel', rueda, { passive: false });

      const tam = () => { const w = cv.clientWidth; const h = cv.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
      const ro = new ResizeObserver(tam); ro.observe(cv); tam();

      let ult = performance.now(); let pasoBob = 0; let ultProg = -1; let primero = true;
      const vtmp = new THREE.Vector3(); const mira = new THREE.Vector3();
      const ciclo = (ahora) => {
        if (!vivo || !activo) return; raf = requestAnimationFrame(ciclo);
        if (!visible && !primero) { ult = ahora; return; }
        const dt = Math.min(0.05, (ahora - ult) / 1000); ult = ahora; const t = ahora / 1000;
        const dirTec = (teclas.KeyW || teclas.ArrowUp ? 1 : 0) - (teclas.KeyS || teclas.ArrowDown ? 1 : 0);
        const dir = clamp(k.dir + dirTec + (k.auto ? 0.55 : 0), -1, 1);
        if (k.salto != null) { v.s = k.salto; k.s = k.salto; k.salto = null; }
        k.s = clamp(k.s + dir * 1.45 * dt, 0, L); if (k.auto && k.s >= L) { k.auto = false; setAuto(false); }
        const antes = v.s; v.s += (k.s - v.s) * Math.min(1, dt * 4); v.yaw += (k.yaw - v.yaw) * Math.min(1, dt * 6); v.pitch += (k.pitch - v.pitch) * Math.min(1, dt * 6);
        const mov = Math.abs(v.s - antes) / Math.max(dt, 1e-3); pasoBob += mov * dt * 1.9;
        const f = E.marco(v.s, -0.15); const bob = Math.sin(pasoBob * Math.PI) * 0.025 * clamp(mov, 0, 1);
        cam.position.set(f.p.x, E.altura(v.s) + OJO + bob, f.p.z);
        const fa = E.marco(Math.min(L, v.s + 6)); vtmp.subVectors(fa.p, f.p).setY(0).normalize(); if (v.s > L - 6.5) vtmp.copy(f.t);
        const pend = Math.atan2(E.altura(Math.min(L, v.s + 3)) - E.altura(v.s), 3) * 0.6;
        const yaw = Math.atan2(vtmp.x, -vtmp.z) + v.yaw; const pitch = v.pitch + pend;
        mira.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).add(cam.position); cam.lookAt(mira);
        luzSol.position.copy(cam.position).addScaledVector(sol, 90); luzSol.target.position.copy(cam.position).addScaledVector(vtmp, 10); luzSol.target.updateMatrixWorld();
        uT.value = t; E.actualizar(t);
        ren.render(escena, cam);
        if (primero) { primero = false; setListo(true); }
        const pr = v.s / L; if (Math.abs(pr - ultProg) > 0.002) { ultProg = pr; setProg(pr); }
      };
      raf = requestAnimationFrame(ciclo);

      return () => {
        activo = false; cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('keydown', kd); removeEventListener('keyup', ku);
        cv.removeEventListener('pointerdown', pd); cv.removeEventListener('pointermove', pmv); cv.removeEventListener('pointerup', pu); cv.removeEventListener('pointercancel', pu); cv.removeEventListener('wheel', rueda);
        escena.traverse((o) => { o.geometry?.dispose?.(); const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (!m) return; ['map', 'normalMap', 'aoMap', 'roughnessMap'].forEach((kk) => m[kk]?.dispose?.()); m.dispose?.(); }); });
        escena.background?.dispose?.(); escena.environment?.dispose?.(); pm.dispose(); ren.dispose(); cv.remove();
      };
    }
    return () => { vivo = false; clearTimeout(apagar); io.disconnect(); limpiar(); };
  }, [construir, aria]);

  useEffect(() => { const f = () => setCompleta(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);

  const mantener = (d) => ({
    onPointerDown: (e) => { e.preventDefault(); ctl.current.dir = d; },
    onPointerUp: () => { ctl.current.dir = 0; }, onPointerLeave: () => { ctl.current.dir = 0; }, onPointerCancel: () => { ctl.current.dir = 0; },
  });
  const metros = Math.round(prog * largoRef.current);
  const boton = 'pointer-events-auto flex h-10 items-center gap-2 rounded-full bg-black/55 px-4 text-[12px] font-medium text-white backdrop-blur transition hover:bg-black/75 select-none';

  return (
    <div ref={caja} className="relative h-full min-h-[460px] w-full overflow-hidden bg-[#b9cfdf]">
      <div ref={lienzo} className="absolute inset-0" />
      {!listo && <div className="absolute inset-0 grid place-items-center text-[12px] font-mono uppercase tracking-widest text-slate-600">Cargando…</div>}
      {leyenda && <p className="pointer-events-none absolute bottom-24 left-5 max-w-[19rem] text-[12.5px] leading-snug text-white [text-shadow:0_1px_6px_rgba(0,0,0,.6)] sm:bottom-28">{leyenda}</p>}
      <p className="pointer-events-none absolute left-5 top-20 rounded bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/90 backdrop-blur">Arrastre para mirar · ↑ ↓ o W S para caminar</p>
      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-2">
        <button type="button" className={boton} {...mantener(-1)} aria-label="Retroceder">◀ Retroceder</button>
        <button type="button" className={boton} {...mantener(1)} aria-label="Avanzar">Avanzar ▶</button>
        <button type="button" className={boton} onClick={() => { ctl.current.auto = !ctl.current.auto; setAuto(ctl.current.auto); }}>{auto ? '❚❚ Pausa' : '▶ Caminar solo'}</button>
        <label className="pointer-events-auto flex min-w-[9rem] flex-1 items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-[11px] text-white/85 backdrop-blur">
          <input type="range" min="0" max="1000" value={Math.round(prog * 1000)} onChange={(e) => { ctl.current.salto = (e.target.value / 1000) * largoRef.current; }} className="w-full accent-[#c8e05a]" aria-label="Posición en el recorrido" />
          <span className="w-14 text-right font-mono">{metros} m</span>
        </label>
        <button type="button" className={boton} onClick={() => { ctl.current.yaw = 0; ctl.current.pitch = -0.04; }}>⟳ Frente</button>
        <button type="button" className={boton} onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); else caja.current?.requestFullscreen?.(); }}>{completa ? '✕ Salir' : '⛶ Pantalla completa'}</button>
      </div>
    </div>
  );
}
