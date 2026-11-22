import React from 'react';
import CorteVivo from './CorteVivo.jsx';
import RecorridoInmersivo from './RecorridoInmersivo.jsx';
import { corteMarisma } from '../lib/cortes/marisma.jsx';
import { corteHumedal } from '../lib/cortes/humedal.jsx';
const escenaMarisma = () => import('../lib/inmersivo/marisma.js');
const escenaHumedal = () => import('../lib/inmersivo/humedal.js');
import { corteCasa } from '../lib/cortes/casa.jsx';
const escenaCasa = () => import('../lib/inmersivo/casa.js');
import { corteColegio } from '../lib/cortes/colegio.jsx';
const escenaColegio = () => import('../lib/inmersivo/colegio.js');
import { corteParque } from '../lib/cortes/parque.jsx';
const escenaParque = () => import('../lib/inmersivo/parque.js');
import { corteLadera } from '../lib/cortes/ladera.jsx';
const escenaLadera = () => import('../lib/inmersivo/ladera.js');
import { corteConjunto } from '../lib/cortes/conjunto.jsx';
const escenaConjunto = () => import('../lib/inmersivo/conjunto.js');
import { corteHuerta } from '../lib/cortes/huerta.jsx';
const escenaHuerta = () => import('../lib/inmersivo/huerta.js');

// =============================================================================
// Secciones de paisaje: a la izquierda un corte vivo dibujado con puntos (estética del manglar de «Tramas»,
// especies en movimiento e interacciones con doble clic); a la derecha un recorrido en primera persona con
// materiales reales (Poly Haven + modelos y renders de Blender).
//  02 · Paisaje adaptativo: marisma intermareal, pasarela elevada y mirador con banco solar frente a Cartagena.
//  03 · Humedal de fitofiltración: lagunas de retención, juncos, lirio acuático, puente y sendero.
// =============================================================================

const BASE = import.meta.env.BASE_URL;

function Localizacion() {
  return (
    <figure className="absolute left-0 top-0 z-10 w-[21%] min-w-[104px] overflow-hidden ring-1 ring-white/15">
      <div className="relative aspect-square">
        <img src={`${BASE}assets/texturas/cartagena_z14.jpg`} alt="Bahía de Cartagena y la isla de Tierra Bomba" className="h-full w-full object-cover [filter:grayscale(.6)_brightness(.8)_contrast(1.1)]" />
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="40" cy="63" r="2.6" fill="#ff6b4a" />
          <circle cx="40" cy="63" r="5" fill="none" stroke="#ff6b4a" strokeWidth="0.6"><animate attributeName="r" values="3;8;3" dur="2.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite" /></circle>
          <text x="44" y="62" fontSize="5.4" fill="#ff8a6a" fontWeight="700" fontFamily="Geist Mono, monospace">SITIO</text>
          <text x="4" y="12" fontSize="4.2" fill="#7fd8ee" fontFamily="Geist Mono, monospace">Mar Caribe</text>
          <text x="56" y="72" fontSize="4" fill="#e8eef0" fontFamily="Geist Mono, monospace">Bahía de</text><text x="56" y="77" fontSize="4" fill="#e8eef0" fontFamily="Geist Mono, monospace">Cartagena</text>
          <text x="18" y="72" fontSize="3.8" fill="#c8e05a" fontFamily="Geist Mono, monospace">Tierra Bomba</text>
        </svg>
      </div>
    </figure>
  );
}

function SeccionPaisaje({ id, etiqueta, titulo, cfg, construir, leyenda, aria, nota }) {
  return (
    <section id={id} className="relative bg-tinta text-papel" aria-label={aria}>
      <div className="grid min-h-[100svh] grid-cols-1 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <div className="relative flex flex-col justify-center px-4 pb-10 pt-24 sm:px-8 lg:pl-10 lg:pr-6">
          <p className="etiqueta text-arcilla">{etiqueta}</p>
          <h2 className="mt-3 text-3xl leading-[1.02] sm:text-4xl">{titulo}</h2>
          <div className="relative mt-5">
            <Localizacion />
            <CorteVivo cfg={cfg} />
          </div>
          <p className="mt-4 text-[10px] leading-snug text-white/40">{nota}</p>
        </div>
        <div className="relative h-[82svh] min-h-[520px] lg:sticky lg:top-0 lg:h-[100svh]">
          <RecorridoInmersivo construir={construir} leyenda={leyenda} aria={`Recorrido en primera persona: ${titulo}`} />
        </div>
      </div>
    </section>
  );
}

export default function PaisajeAdaptativo() {
  return (
    <SeccionPaisaje
      id="paisaje-adaptativo" etiqueta="08 · Paisaje adaptativo" titulo="Ascenso del mar e incertidumbre de sedimentos"
      cfg={corteMarisma} construir={escenaMarisma}
      aria="Paisaje adaptativo: ascenso del mar e incertidumbre de sedimentos en Tierra Bomba"
      leyenda="El enrocado permeable, la marisma intermareal y la pasarela elevada componen un «borde blando» de costa, muy adaptable al ascenso del mar. Al final, un mirador con banco solar frente a Cartagena."
      nota="Corte dibujado con puntos, como el manglar de «Especies»; perfil esquemático, sin escala vertical. Cotas de marea e inundación según la sección de Cartografía. Recortes de especies: iNaturalist (CC BY-NC)."
    />
  );
}

export function HumedalFitofiltracion() {
  return (
    <SeccionPaisaje
      id="humedal" etiqueta="09 · Humedal de fitofiltración" titulo="Agua de lluvia retenida y limpiada en la meseta"
      cfg={corteHumedal} construir={escenaHumedal}
      aria="Humedal de fitofiltración en la meseta de Tierra Bomba"
      leyenda="Lagunas de retención en la meseta: guardan el agua de lluvia, la limpian entre juncos y lirios acuáticos y la devuelven al acuífero. Un sendero y un puente las recorren."
      nota="Corte esquemático, sin escala vertical; niveles de agua ilustrativos para una laguna de retención. Especies e interacciones de la base de especies de la isla (iNaturalist, Poelen 2014, Vlad et al. 2022)."
    />
  );
}

export function ViviendaModular() {
  return (
    <SeccionPaisaje
      id="vivienda" etiqueta="04 · Vivienda modular" titulo="Una casa que se arma por módulos y se replica"
      cfg={corteCasa} construir={escenaCasa}
      aria="Vivienda modular y replicable en la meseta de Tierra Bomba"
      leyenda="Cinco módulos de 3,6 m sobre la meseta segura: zaguán abierto para la brisa, cubiertas que captan lluvia y sol, celosía de ladrillo que da sombra. El mismo módulo se repite en hilera o en L."
      nota="Corte esquemático. Módulo de 3,6 × 3,6 m; captación de lluvia hacia cisterna con rebose al humedal (09). Muebles: Poly Haven (CC0). Especies e interacciones de la base de especies de la isla (iNaturalist, Poelen 2014, Bello et al. 2017, Ollerton et al. 2019)."
    />
  );
}

export function Colegio() {
  return (
    <SeccionPaisaje
      id="colegio" etiqueta="05 · Colegio" titulo="Aulas de tierra bajo una cubierta que da sombra"
      cfg={corteColegio} construir={escenaColegio}
      aria="Colegio de bloque de tierra con cubierta flotante en Tierra Bomba"
      leyenda="Aulas de bloque de tierra comprimida bajo una gran cubierta flotante que da sombra y deja salir el aire caliente. La galería de madera, el patio de adoquín y el árbol de sombra son el lugar de encuentro."
      nota="Corte esquemático. Muros de bloque de tierra comprimida (BTC), cubierta de lámina sobre cerchas de madera, captación de lluvia a tanque. Mobiliario y texturas: Poly Haven (CC0). Especies e interacciones de la base de especies de la isla."
    />
  );
}

export function Huerta() {
  return (
    <SeccionPaisaje
      id="huerta" etiqueta="06 · Huerta comunitaria" titulo="Un vivero para sembrar la comida y el bosque"
      cfg={corteHuerta} construir={escenaHuerta}
      aria="Huerta y vivero comunitario de Tierra Bomba"
      leyenda="El invernadero protege las plántulas del sol y la lluvia fuerte; afuera, bancales elevados de madera sobre mantillo, caminos de grava y un maizal. Riego por goteo desde el tanque de lluvia y un seto para los polinizadores."
      nota="Corte esquemático. Hortalizas y plántulas modeladas en Blender; texturas escaneadas de Poly Haven (CC0). Interacciones de la base de especies de la isla (Bello et al. 2017; Fricke y Svenning 2020; Bat Eco-Interactions; Ollerton et al. 2019)."
    />
  );
}

export function Parque() {
  return (
    <SeccionPaisaje
      id="parque" etiqueta="07 · Parque" titulo="Un claro en el bosque para jugar"
      cfg={corteParque} construir={escenaParque}
      aria="Parque de juego natural en el bosque seco de Tierra Bomba"
      leyenda="Un parque de juego natural en un claro del bosque seco: red de trepar, torre, troncos de equilibrio, pilotes y túnel sobre un piso de viruta que amortigua las caídas, con bancas a la sombra."
      nota="Corte esquemático. Juegos de madera, cuerda y acero modelados para el recorrido; texturas escaneadas de Poly Haven (CC0). Interacciones de la base de especies de la isla."
    />
  );
}

export function ColegioLadera() {
  return (
    <SeccionPaisaje
      id="colegio-ladera" etiqueta="09 · Colegio en ladera" titulo="Aulas sobre pilotes entre el bosque"
      cfg={corteLadera} construir={escenaLadera}
      aria="Colegio en ladera sobre pilotes en el bosque de Tierra Bomba"
      leyenda="Dos barras de aulas escalonadas sobre pilotes dejan pasar el bosque por debajo. Balcones corridos, fachadas de listones de madera, cubiertas flotantes con paneles solares y escaleras exteriores entre niveles."
      nota="Corte esquemático. Estructura de acero y madera modelada para el recorrido; texturas escaneadas de Poly Haven (CC0). Interacciones de la base de especies de la isla."
    />
  );
}

export function ConjuntoVivienda() {
  return (
    <SeccionPaisaje
      id="conjunto" etiqueta="10 · Conjunto de vivienda" titulo="Bloques alrededor de un eje de agua y jardín"
      cfg={corteConjunto} construir={escenaConjunto}
      aria="Conjunto de vivienda alrededor de un canal de agua en la meseta de Tierra Bomba"
      leyenda="Dos hileras de bloques blancos de cuatro pisos, escalonados, se abren a un eje central con un canal que retiene la lluvia, jardín y árboles de sombra. Balcones, terrazas con pérgola y ventilación cruzada."
      nota="Corte esquemático. Bloques, canal y jardín modelados para el recorrido; texturas escaneadas de Poly Haven (CC0). Interacción de garzas registrada en la base de especies de la isla (iNaturalist)."
    />
  );
}
