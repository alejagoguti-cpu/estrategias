import React, { useEffect, useRef, useState } from 'react';

// Red de especies de la isla (aplicación aparte, embebida). Empieza a cargar al llegar a «Tramas de vida», para estar lista al final del recorrido,
// para no frenar la carga de la escena 3D.
// copia de la aplicación con colores suaves y la tipografía del sitio (lee sus datos de anasoficasca-code.github.io/tierrabomba)
const URL_RED = `${import.meta.env.BASE_URL}especies/`;

export default function RedEspecies() {
  const ref = useRef(null);
  const [cargar, setCargar] = useState(false);
  const [lista, setLista] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setCargar(true); io.disconnect(); } }, { rootMargin: '0px 0px 1200% 0px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <section id="especies" ref={ref} className="relative bg-tinta text-papel">
      <div className="mx-auto max-w-[1640px] px-5 lg:px-16 pt-20 sm:px-10 sm:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="etiqueta text-arcilla">07 · Especies de la isla</p>
            <h2 className="mt-4 max-w-6xl text-3xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">La red de vida de Tierra Bomba.</h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/70">
              Las especies registradas en la isla y sus relaciones (depredación, polinización, dispersión de semillas, refugio), sobre el modelo 3D. Explórala aquí mismo: gira, filtra por grupo y toca una especie para ver su ficha.
            </p>
          </div>
          <a href={URL_RED} target="_blank" rel="noopener noreferrer" className="ficha !h-10 !px-4 grid place-items-center">Abrir en pantalla completa ↗</a>
        </div>
      </div>
      <div className={`relative mx-auto mt-10 w-full transition-all duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] ${lista ? 'h-[100svh] max-w-none px-0 pb-0' : 'h-[86svh] min-h-[560px] max-w-[1760px] px-3 pb-20 sm:px-8 lg:px-12 sm:pb-28'}`}>
        <div className={`relative h-full w-full overflow-hidden bg-black transition-all duration-[1200ms] ${lista ? 'rounded-none border-0' : 'rounded-[6px] border border-white/15'}`}>
          {cargar && (
            <iframe
              src={URL_RED}
              title="Red de especies de Tierra Bomba"
              className="absolute inset-0 h-full w-full transition-opacity duration-700"
              style={{ opacity: lista ? 1 : 0 }}
              onLoad={() => setLista(true)}
              allow="fullscreen"
            />
          )}
          {!lista && <p className="etiqueta absolute inset-0 grid place-items-center text-white/50">Cargando la red de especies…</p>}
        </div>
      </div>
    </section>
  );
}
