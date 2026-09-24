// reglas-venta.mjs — reglas de QA del guion que dejan el deck en BORRADOR o avisan en el cierre: tasas de resultado sin
// origen, promesas de ingreso sin descargo visible y el cierre de una clase (tarea + puente). Funciones puras sobre el
// deck.json; reglas-deck.mjs las suma en revisarDeck. Pruebas en pruebas/reglas-deck.test.mjs.
import { plano } from './markup.mjs';
import { sinAcentos, nombre, textosVisibles, textosCrudos, conTexto, lineasCifra, esDesglose, esVerboConObjeto } from './reglas-deck.mjs';

// ---------- tasas sin origen (SKILL: las cifras de resultados nunca se proponen) ----------
// «10 × 30-50% se van con otro»: una tasa escrita en la cuenta (no en la condición de `arriba`, que es la hipótesis
// dicha como tal: «Si te contrata el 0.1-0.3%:») es un resultado inventado si no trae `fuente` ni sale de un
// {{TASA_*}} de "datos". El deck queda en borrador (por_confirmar) hasta darle origen.
const PORCENTAJE = /\d[\d.,]*\s*(?:[-–]\s*\d[\d.,]*\s*)?%/g;
export function reglasTasa(deck, { crudo } = {}) {
  const avisos = [], porConfirmar = {};
  const L = deck.laminas, C = crudo && Array.isArray(crudo.laminas) && crudo.laminas.length === L.length ? crudo.laminas : L;
  L.forEach((l, i) => {
    if (!l || l.tipo !== 'cifra' || conTexto(l.fuente) || /\{\{\s*TASA_/i.test(JSON.stringify(C[i] || {}))) return;
    const lineas = lineasCifra(l).map(plano);
    const total = lineasCifra(l).find(x => /=[^=]*__[^_]+__/.test(x));
    if (!total || esDesglose(lineasCifra(l), total)) return;
    const arriba = plano(l.arriba || '').replace(/\s+/g, '');
    const tasas = [...new Set(lineas.flatMap(x => x.match(PORCENTAJE) || []).map(t => t.replace(/\s+/g, '')))].filter(t => !arriba.includes(t));
    if (!tasas.length) return;
    avisos.push(`${nombre(deck, i)}: tasa sin origen (${tasas.join(', ')}): una tasa de resultado no se propone; ponla como {{TASA_…}} en "datos" (real o { "pendiente": true, "motivo" }), dale «fuente» o escríbela como hipótesis en la condición de «arriba» (SKILL, regla de cifras; GUION §3.8)`);
    porConfirmar[`TASA_${i + 1}`] = { valor: tasas.join(', '), laminas: [i + 1], pendiente: true, motivo: 'tasa de resultado sin origen: dato real con fuente o {{TASA_…}} en "datos"' };
  });
  return { errores: [], avisos, porConfirmar };
}

// ---------- promesas de ingreso al espectador (GUION §3.8 c) ----------
// «Puedes ganar $10k-50k», «vas a vender 8 clientes», «ganar lo mismo que un médico»: la referencia las dice [0:10] y
// las respalda con el descargo EN PANTALLA una vez, cerca del gancho [0:40 «Just because I got these results, doesn't
// mean you will»]. Sin ningún descargo visible en el deck: aviso y borrador. No se pide condición con número en cada
// gancho `idea`: la referencia no la trae; la condición se sigue exigiendo en la `cifra` (reglasProyeccion).
const PROMESA_VERBO = /\b(vas a|puedes|podras|podrias|podrian|van a|lograras)\s+(ganar|vender|facturar|cobrar|tener|conseguir|cerrar)\b/;
const PROMESA_CIFRA = /[$€]\s*\d|\d[\d,.]*\s*(k|mil|millones?)\b|\d\s*%|\b\d+\s*(clientes|ventas|citas)\b|\ben \d+ (dias|semanas|meses)\b/;
const PROMESA_COMO = /ganar (lo mismo|tanto) (que|como) un (medico|doctor|abogado|ingeniero)/;
const DESCARGO_VISIBLE = /no (significa|quiere decir) que (tu|tu lo|lo|vayas)|resultados no (estan )?garantizados|no (te )?garantiza/;
const TIPOS_PROMESA = new Set(['idea', 'cita', 'rejilla', 'cifra', 'oscura']);
export const esPromesa = frase => { const t = sinAcentos(frase); return (PROMESA_VERBO.test(t) && PROMESA_CIFRA.test(t)) || PROMESA_COMO.test(t); };
export function reglasPromesa(deck) {
  const avisos = [], porConfirmar = {}, L = deck.laminas;
  const con = L.map((l, i) => (l && TIPOS_PROMESA.has(l.tipo) && textosVisibles(l).some(t => t.split(/[.!?\n]+/).some(esPromesa)) ? i + 1 : 0)).filter(Boolean);
  if (!con.length || L.some(l => l && DESCARGO_VISIBLE.test(sinAcentos(textosVisibles(l).join(' / '))))) return { errores: [], avisos, porConfirmar };
  avisos.push(`promete resultados al espectador (${con.length > 1 ? 'láminas' : 'lámina'} ${con.join(', ')}) sin descargo visible: agrega una \`idea\` cerca del gancho como la referencia a 0:40: «Que yo tenga estos resultados ==no significa que tú los tengas==» (GUION §3.8 c)`);
  porConfirmar.DESCARGO = { valor: '', laminas: con, pendiente: true, motivo: 'promesa de ingreso sin descargo en pantalla (GUION §3.8 c)' };
  return { errores: [], avisos, porConfirmar };
}

// ---------- cierre de una clase: la tarea Y el puente (ARCOS.md, Tutorial y Clase corta) ----------
// Una clase gratis que termina en «Comenta LISTO cuando lo subas» no dice a dónde sigue y no lleva a nadie al programa.
// Aplica a `clase`, `clase-corta` y al `tutorial` marcado con `"clase": true` (clase express o taller de < 15 min; no se
// infiere de `en_vivo`, que también marca demostraciones y propuestas). En las 3 últimas láminas que no son cámara:
//   TAREA: un texto visible que empieza con «Tu tarea», con un verbo + su objeto («Sube tu encuesta») o con
//          «Mañana/Hoy + verbo», o una lista/pasos con encabezado «tarea»;
//   PUENTE (visible, no solo en la voz): próxima clase, nos vemos el…, te espero, comunidad, únete, programa, inscríbete,
//          regístrate, un {{PROXIMA_CLASE}} o {{COMUNIDAD}}, o un botón. «Siguiente paso» o «link» sueltos no cuentan.
const TAREA = /^(tu tarea|tarea\b|para (manana|la proxima))/;
const VERBO_TAREA = /^(sube|graba|haz|escribe|publica|manda|abre|arma|prueba|elige|define|crea|agenda|llena|contesta|responde|comenta|guarda|descarga|pon|cambia|mide|calcula|busca|copia|pega|anota|revisa)\b\s+\S+/;
const CUANDO_TAREA = /^(hoy|manana|esta semana|esta noche)\s+(subes|grabas|haces|escribes|publicas|mandas|armas|pruebas|eliges|defines|creas|llenas|anotas|revisas)\b/;
const PUENTE = /\b(proxima clase|nos vemos (el|en|la)|te espero|comunidad|unete|programa|inscribete|registrate)\b/;
const esTareaTexto = t => { const x = sinAcentos(plano(t)).replace(/^[^a-z0-9]+/, ''); return TAREA.test(x) || VERBO_TAREA.test(x) || CUANDO_TAREA.test(x); };
const esTarea = l => textosVisibles(l).some(esTareaTexto) || (['lista', 'pasos'].includes(l.tipo) && /tarea/.test(sinAcentos(plano(String(l.encabezado || '')))));
const esPuente = (l, c) => l.tipo === 'boton' || PUENTE.test(sinAcentos(textosVisibles(l).join(' / '))) || /\{\{\s*(PROXIMA_CLASE|COMUNIDAD)\b/.test(JSON.stringify(c || {}));
export const esClase = deck => ['clase', 'clase-corta'].includes(deck.pieza) || (deck.pieza === 'tutorial' && deck.clase === true);
export function cierreDeClase(deck, { crudo } = {}) {
  const avisos = [];
  const L = deck.laminas, C = crudo && Array.isArray(crudo.laminas) && crudo.laminas.length === L.length ? crudo.laminas : L;
  if (esClase(deck)) {
    const ult = L.map((l, i) => [l, C[i]]).filter(([l]) => l && l.tipo !== 'camara').slice(-3);
    if (ult.length) {
      const tarea = ult.some(([l]) => esTarea(l)), puente = ult.some(([l, c]) => esPuente(l, c));
      if (!puente) avisos.push(`${tarea ? 'tarea sin puente' : 'cierre sin puente'}: la clase termina sin decir a dónde sigue; cierra con la próxima clase (fecha y hora desde {{PROXIMA_CLASE}}) o con {{COMUNIDAD}} / el programa, más su palabra clave o link, a la vista (ARCOS.md)`);
      if (!tarea) avisos.push('cierre sin tarea con objeto: la clase cierra con algo que el público hace hoy («Tu tarea: sube tu encuesta»), antes del puente (ARCOS.md)');
    }
  }
  // `llamado: true` es para la flecha al link o la palabra clave, no para una tarea (ARCOS.md: lo que no empieza con verbo)
  L.forEach((l, i) => {
    if (!l || l.llamado !== true) return;
    const crudos = textosCrudos(C[i] || l), junto = crudos.join(' / ');
    if (!crudos.length || !esTareaTexto(crudos[0])) return;
    if (/whatsapp|\bdm\b|link|liga|correo|https?:|\.com|\{\{/i.test(junto) || /\b[A-ZÁÉÍÓÚÑ]{2,}\b/.test(plano(junto))) return;
    // En un tutorial que no es clase express, quitar el `llamado` deja el deck sin cierre: el aviso da la salida entera
    const salida = deck.pieza === 'tutorial' && !esClase(deck)
      ? '; si es un taller o clase express, marca "clase": true y cierra con la tarea y el puente (próxima clase o comunidad); si no, el llamado va en una lámina con el link o la palabra clave'
      : '';
    avisos.push(`${nombre(deck, i)}: \`llamado: true\` en una tarea («${plano(crudos[0]).slice(0, 40)}»): es para la flecha al link o la palabra clave, no para una tarea${salida} (ARCOS.md)`);
  });
  return { errores: [], avisos };
}

