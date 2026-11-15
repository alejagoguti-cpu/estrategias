import React, { useEffect, useRef, useState } from 'react';
import '../analisis.css';

// 02 · Lectura territorial: las secciones de /analisis/ dentro de la presentación
// (pérdida de suelo, capas, relaciones y relieve). El código vive en lib/analisis.js y se carga
// solo cuando el bloque se acerca a la pantalla.
export default function Lectura() {
  const ref = useRef(null);
  const [lista, setLista] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    let parar = null; let cancelado = false; let empezado = false; let t = 0;
    // se empieza a cargar en segundo plano poco después de abrir la página (o antes, si el bloque se acerca)
    const empezar = () => {
      if (empezado) return; empezado = true; io.disconnect(); clearTimeout(t);
      import('../lib/analisis.js').then(({ iniciarAnalisis }) => iniciarAnalisis(el, import.meta.env.BASE_URL))
        .then((f) => { if (cancelado) f?.(); else { parar = f; setLista(true); } })
        .catch((err) => console.error('lectura territorial', err));
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) empezar(); }, { rootMargin: '2500px 0px' });
    io.observe(el);
    const alCargar = () => { t = setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(empezar, { timeout: 3000 }) : empezar()), 3500); };
    if (document.readyState === 'complete') alCargar(); else window.addEventListener('load', alCargar, { once: true });
    return () => { cancelado = true; io.disconnect(); clearTimeout(t); window.removeEventListener('load', alCargar); parar?.(); };
  }, []);
  return (
    <div id="lectura" ref={ref} className={`an ${lista ? 'an-lista' : ''}`}>
      <section id="lectura-cab" className="an-cab">
        <p className="rotulo"><span className="text-arcilla">02</span> · Lectura territorial</p>
        <h2>Quince capas del mismo encuadre</h2>
        <p>El mar, el suelo, la gente y las especies, leídos sobre la misma malla de 47 m de la isla: primero lo que se pierde y dónde; después cada capa, cómo se relacionan y cómo visten el relieve.</p>
      </section>

      <section id="transformacion" aria-label="Pérdida de suelo">
        <div className="pegado">
          <canvas id="tr-lienzo" aria-hidden="true" />
          <div className="pestanas" role="tablist">
            <button type="button" role="tab" aria-selected="true" data-tr="0">Pérdida de suelo</button>
            <button type="button" role="tab" aria-selected="false" data-tr="1">¿Dónde?</button>
          </div>
          <div className="tr-texto"><h2 id="tr-titulo" /><p id="tr-p" /></div>
          <div className="barras" id="barras" />
          <p className="nota leyenda-tr" id="tr-nota" />
        </div>
      </section>

      <section id="capas" aria-label="Capas del territorio">
        <div className="capas-cab"><p className="num">15</p><h2>Capas del territorio</h2><p>Cada estrato es un ráster del encuadre de la isla sobre la misma malla de 47 m; las tres de arriba vienen de los modelos de Rhino de la tesis (economía y turismo, síntesis de picos, drenaje). Cada capa sube donde su valor es mayor: más densidad, más altura. Pase el cursor para levantarla; haga clic para leer su ficha.</p></div>
        <div className="pila"><div id="pila-3d" aria-label="Pila de capas en 3D"><p className="an-cargando">Cargando las capas…</p></div><ol id="pila-lista" /></div>
      </section>
      <aside className="ficha-capa" id="ficha-capa" aria-live="polite" />

      <section id="relaciones" aria-label="Relaciones">
        <div className="rel-pestanas" role="tablist" id="rel-pestanas">
          <button type="button" role="tab" aria-selected="true" data-modo="">Capas</button>
          <button type="button" role="tab" aria-selected="false" data-modo="modo-norm">Normalización</button>
          <button type="button" role="tab" aria-selected="false" data-modo="modo-media">Media</button>
          <button type="button" role="tab" aria-selected="false" data-modo="modo-op">⊕ y √</button>
        </div>
        <div className="rel-cuerpo">
          <div><h2>De la capa a la relación</h2><p id="rel-texto" /></div>
          <div className="rejilla" id="rejilla" />
        </div>
      </section>

      <section id="relieve" aria-label="Relieve">
        <div className="rel-izq">
          <h2>Geografías latentes</h2>
          <p id="relieve-texto" />
          <div className="chips" id="chips" />
          <p className="nota" style={{ marginTop: 18 }}>Fuente del terreno: Terrain Tiles (Mapzen / AWS, Terrarium), agregado a celdas de 47 m y exagerado ×6 en vertical. En «Solo relieve», el color sale de la iluminación del noroeste y de la altura, no de un valor analítico. Arrastre para girar; rueda o pellizco para acercar.</p>
        </div>
        <div id="relieve-3d"><span className="norte">N<br />↑</span><div className="rampa" id="rampa" /></div>
      </section>
    </div>
  );
}