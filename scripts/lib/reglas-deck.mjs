// reglas-deck.mjs — reglas de QA que se leen en el deck.json (sin navegador): duración de la pieza, apertura,
// voz, proyecciones, pruebas de maqueta, prueba real y credibilidad, objeciones, descargos en pantalla, firma de
// relleno, llamado, coherencia emoji↔concepto y claves que nadie lee. qa.mjs las suma a sus hallazgos; aquí
// son funciones puras para probarlas rápido (pruebas/reglas-deck.test.mjs).
//
// Todas devuelven { errores: [], avisos: [] } con mensajes accionables que citan la referencia o el archivo.
import fs from 'node:fs';
import path from 'node:path';
import { plano } from './markup.mjs';
import { PIEZAS, minutosObjetivo, duracionTotal, duracionPorTipo, tiemposSecuenciales, mmss, duracionPaso } from './tiempos.mjs';
import { DATO_DURO } from './layouts-datos.mjs';
import { analizarCompuesto, PARECIDOS, esCampoEmoji, specsDeCampo } from './emoji.mjs';

const sinAcentos = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const nombre = (deck, i) => `lámina ${i + 1} (${deck.laminas[i].id || deck.laminas[i].tipo})`;

// Campos que no son texto a la vista: ahí no se buscan frases
const NO_VISIBLE = new Set(['tipo', 'id', 'voz', 'anclas', 'ancla', 'emoji', 'iconos', 'sobre', 'centro', 'imagen', 'src', 'logo', 'clic',
  'cursor', 'revelar', 'fondo', 'sello_sobre', 'sello_pos', 'anclar', 'color', 'estilo', 'flecha', 'de', 'a', 'forma', 'grafica', 'lado',
  'encabezado_pos', 'encabezado_estilo', 'posicion', 'fuente']);
const noVisible = k => NO_VISIBLE.has(k) || /^(emoji_|avatar|tono|tam)/.test(k);

// Textos visibles de una lámina, en orden (planos: sin marcas)
export function textosVisibles(l) {
  const out = [];
  const ir = (x, k) => {
    if (k && noVisible(k)) return;
    if (typeof x === 'string') { const t = plano(x); if (t) out.push(t); }
    else if (Array.isArray(x)) x.forEach(y => ir(y, null));
    else if (x && typeof x === 'object') Object.entries(x).forEach(([kk, v]) => ir(v, kk));
  };
  ir(l, null);
  return out;
}
const vozDe = l => (Array.isArray(l.voz) ? l.voz.join(' ') : typeof l.voz === 'string' ? l.voz : '');

// ---------- firma ----------
const RELLENO = /^(tu ?marca(\.com)?|@?tu_?usuario|@?tu ?arroba|tu ?dominio(\.com)?|<.*>|ejemplo|marca|nombre)$/i;
export function reglasFirma(deck) {
  const m = deck.marca && typeof deck.marca === 'object' ? deck.marca : null;
  if (!m || !m.texto) return { errores: [], avisos: [] };
  const t = String(m.texto).trim(), junto = `${t}${m.sufijo || ''}`.replace(/\s+/g, '');
  if (RELLENO.test(t) || RELLENO.test(junto)) return { errores: [`la firma «${junto}» es un valor de ejemplo: omite "marca" (las láminas salen sin firma) o pon la real`], avisos: [] };
  return { errores: [], avisos: [] };
}

// ---------- duración de la pieza (ARCOS.md) ----------
// El objetivo manda sobre el rango de la pieza, pero un objetivo que cae fuera del rango de su pieza avisa (una
// «clase» de 3 min es un tutorial). «Menos de la mitad» se mide con el tiempo de LÁMINAS: los tramos a cámara
// con `dur` no rellenan el pizarrón. Más de 40% a cámara avisa en cualquier pieza, y más de 60% con las láminas
// bajo la mitad es error también en vivo.
export function reglasDuracion(deck, pasos) {
  const errores = [], avisos = [];
  const est = duracionTotal(deck, pasos);
  const { laminas: lam, camara: cam } = duracionPorTipo(deck, pasos);
  const pieza = PIEZAS[deck.pieza] || null, vivo = deck.en_vivo === true;
  const objetivo = minutosObjetivo(deck.duracion_objetivo);
  const nomPieza = pieza ? pieza.nombre : 'pieza';
  const vivoNota = vivo ? ' En vivo amplías la voz de cada paso, pero cada paso sigue siendo un beat de 2-3 s: faltan beats, no palabras.' : '';
  // Peso de cámara: la referencia va ~12%. Más de 40% avisa en cualquier pieza; si pasa de 60% y las láminas no
  // cubren la mitad de lo que toca, es error AUNQUE sea en vivo: el deck es mayormente tramos sin lámina.
  const meta = objetivo ? objetivo * 60 : pieza ? pieza.min * 60 : 0;
  const pc = est > 0 ? Math.round((cam / est) * 100) : 0;
  const mayormenteCamara = vivo && pc > 60 && meta && lam < meta * 0.5;
  const corto = (msg) => { if (!mayormenteCamara) (vivo ? avisos : errores).push(msg); };
  const deCam = cam > 0 ? ` (de eso, ~${mmss(cam)} es a cámara)` : '';
  if (objetivo) {
    if (lam < objetivo * 60 * 0.5) corto(`las láminas cubren ~${mmss(lam)}${deCam} y el objetivo es ${mmss(objetivo * 60)}: el deck es menos de la mitad de su ${nomPieza}; escribe el guion completo con el arco de ARCOS.md.${vivoNota}`);
    else if (Math.abs(est / (objetivo * 60) - 1) > 0.3) { const r = est / (objetivo * 60); avisos.push(`la voz dura ~${mmss(est)} contra un objetivo de ${mmss(objetivo * 60)} (${r > 1 ? '+' : ''}${Math.round((r - 1) * 100)}%): ajusta beats o el objetivo.${vivoNota}`); }
    if (pieza && (objetivo < pieza.min * 0.7 || objetivo > pieza.max * 1.3)) {
      avisos.push(`el objetivo ${mmss(objetivo * 60)} queda fuera de un(a) ${nomPieza} (${pieza.min}-${pieza.max} min): usa la pieza que le toca (tutorial 3-8, vsl-corto 3-6, clase-corta 15-30 o libre) en vez de forzar el objetivo (ARCOS.md)`);
    }
  } else if (pieza) {
    if (lam < pieza.min * 60 * 0.5) corto(`las láminas cubren ~${mmss(lam)}${deCam} y un(a) ${nomPieza} dura ${pieza.min}-${pieza.max} min: el deck es menos de la mitad; escribe el guion completo con el arco de ARCOS.md.${vivoNota}`);
    else if (est < pieza.min * 60 * 0.7 || est > pieza.max * 60 * 1.3) avisos.push(`la voz dura ~${mmss(est)}; un(a) ${nomPieza} dura ${pieza.min}-${pieza.max} min (ARCOS.md).${vivoNota}`);
  }
  if (pc > 40) {
    if (mayormenteCamara) errores.push(`el deck es mayormente tramos sin lámina: de ~${mmss(est)}, ~${mmss(cam)} son a cámara o en vivo (${pc}%) y las láminas cubren ~${mmss(lam)}. Los tramos en vivo no sustituyen beats: escribe los bloques en beats (ARCOS.md)`);
    else avisos.push(`de ~${mmss(est)}, ~${mmss(cam)} son tramos a cámara (${pc}%); las láminas cubren ~${mmss(lam)}. La referencia va ~12% a cámara: el objetivo se cumple con beats, no con tramos en vivo (ARCOS.md)`);
  }
  if (deck.pieza === 'vsl-corto' && est > 0) {
    const i0 = deck.laminas.findIndex(esOferta);
    const seg = i0 >= 0 ? tiemposSecuenciales(deck, pasos).find(s => s.lamina === i0) : null;
    if (seg && seg.inicio / est > 0.7) avisos.push(`la oferta del VSL corto empieza en ${mmss(seg.inicio)} de ~${mmss(est)} (${Math.round((seg.inicio / est) * 100)}%): en 3-6 min va desde el 55-60%, con el llamado 2 veces (ARCOS.md, VSL corto)`);
  }
  if (deck.pieza === 'reel' && est > 60) avisos.push(`el reel dura ~${mmss(est)}: pasa de 60 s; recorta beats (ARCOS.md, reel)`);
  return { errores, avisos, estimado: est, laminas: lam, camara: cam };
}

// ---------- apertura: los primeros 10 segundos (GUION §6.1) ----------
const SALUDO = /\b(bienvenid[oa]s?|hola a todos|hola,? que tal|me llamo|mi nombre es)\b/;
export function reglasApertura(deck, pasos) {
  const avisos = [];
  const L = deck.laminas;
  if (L.length < 4) return { errores: [], avisos };
  const t = tiemposSecuenciales(deck, pasos);
  const cam = t.find(s => s.camara && s.inicio < 10);
  if (cam) avisos.push(`${nombre(deck, cam.lamina)}: va a cámara en el segundo ${Math.round(cam.inicio)}; antes del segundo 10 va el resultado o el conflicto concreto, y el saludo después de la primera prueba (GUION §6.1; el nombre llega en 1:26)`);
  for (let i = 0; i < Math.min(2, L.length); i++) {
    const txt = sinAcentos([...textosVisibles(L[i]), vozDe(L[i]), L[i].nota || ''].join(' '));
    const cruda = [...textosVisibles(L[i]), vozDe(L[i])].join(' ');
    if (SALUDO.test(txt) || /\bsoy [A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(cruda)) { avisos.push(`${nombre(deck, i)}: abre con saludo o presentación; el gancho (resultado, conflicto o escena) va primero (GUION §6.1)`); break; }
  }
  const primera = L.findIndex(l => l.tipo !== 'camara');
  if (primera >= 0) {
    const txt = sinAcentos(plano(L[primera].texto || L[primera].titulo || ''));
    if (/^(como|aprende a)\b/.test(txt)) avisos.push(`${nombre(deck, primera)}: abre con el título («${plano(L[primera].texto || L[primera].titulo).slice(0, 40)}…»); abre con el resultado, la escena o el error en vivo y deja el título para después (GUION §6.1)`);
  }
  return { errores: [], avisos };
}

// ---------- voz humana (VOZ-HUMANA.md) ----------
const FORMULAS = [
  [/no es una estrategia/, 'antítesis de cartel'],
  [/no te falta .{1,40} te falta/, 'antítesis «no te falta X, te falta Y»'],
  [/todo empieza con/, 'cierre motivacional'],
  [/ni cuenta te das/, 'muletilla de gancho'],
  [/cambia(n)? las reglas( del juego)?/, 'frase de IA'],
  [/el secreto (es|esta)/, 'frase de IA'],
  [/la clave (del exito|es)/, 'frase de IA'],
  [/no se trata (solo )?de/, 'antítesis «no se trata de»'],
  [/\b(empieza hoy|tu puedes|el momento es ahora|no esperes mas|hazlo ya)\b/, 'cierre motivacional'],
  [/\b(en la era digital|hoy en dia|en el mundo actual)\b/, 'arranque de relleno'],
  [/\b(desbloquea tu potencial|al siguiente nivel|revoluciona|transforma tu (vida|negocio))\b/, 'frase de IA'],
];
const ANTITESIS = /\bno (es|son|te falta|cierra|le vendes|vendes|necesitas|se trata)\b[^.!?]*[.:,;/]\s*\S/;

// «Palabras que nunca usas: a, b, c» de MI-MARCA.md (en la carpeta del deck o la de arriba)
export function palabrasProhibidas(dirDeck) {
  for (const d of [dirDeck, path.dirname(dirDeck || '.')]) {
    const f = d && path.join(d, 'MI-MARCA.md');
    if (!f || !fs.existsSync(f)) continue;
    const m = fs.readFileSync(f, 'utf8').match(/^\s*-?\s*Palabras que nunca usas(?:\s*\([^)\n]*\))?:[ \t]*(.*)$/im);
    return m ? m[1].split(',').map(x => x.replace(/[`*«»"]/g, '').trim()).filter(Boolean) : [];
  }
  return [];
}

export function reglasVoz(deck, prohibidas = []) {
  const avisos = [], conAntitesis = [];
  const vetadas = prohibidas.map(p => [p, new RegExp(`(^|[^a-z0-9])${sinAcentos(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`)]);
  deck.laminas.forEach((l, i) => {
    if (l.tipo === 'camara') return;
    const txt = sinAcentos(textosVisibles(l).join(' / '));
    const vistas = new Set();
    for (const [re, que] of FORMULAS) { const m = txt.match(re); if (m && !vistas.has(que)) { vistas.add(que); avisos.push(`${nombre(deck, i)}: «${m[0]}» es ${que}; cámbiala por un dato, una consecuencia concreta o una acción con objeto (VOZ-HUMANA.md). Si viene de la voz, corrígela también en el guion`); } }
    if (ANTITESIS.test(txt)) conAntitesis.push(i + 1);
    vetadas.forEach(([p, re]) => { if (re.test(txt)) avisos.push(`${nombre(deck, i)}: usa «${p}», que está en «Palabras que nunca usas» de MI-MARCA.md`); });
  });
  if (conAntitesis.length > 1) avisos.push(`antítesis «No X, Y» en ${conAntitesis.length} láminas (${conAntitesis.join(', ')}): máximo una por deck; las demás, afirmativas con número (VOZ-HUMANA.md)`);
  return { errores: [], avisos };
}

// ---------- proyecciones al espectador (GUION §3.8) ----------
const PROMESA = /=[^=]*__[^_]*([$%]|client|venta|platica|alumn|lead)[^_]*__/i;
// Un rango en algún punto de la cuenta: «10-20%», «de 5 a 10», «entre $3 y $5»
const RANGO = /\d[\d,.]*\s*(%|k|mil)?\s*[-–]\s*\$?\d|\bde\s+\$?\d[\d,.]*\s*(%|k|mil|millones)?\s+a\s+\$?\d|\bentre\s+\$?\d/i;
export function reglasProyeccion(deck) {
  const avisos = [];
  deck.laminas.forEach((l, i) => {
    if (l.tipo !== 'cifra' || l.fuente) return;
    const lineas = (l.lineas || (l.valor ? [l.valor] : [])).map(x => (x && typeof x === 'object' ? x.texto : x)).filter(x => typeof x === 'string');
    const total = lineas.find(x => PROMESA.test(sinAcentos(x)));
    if (!total) return;
    const arriba = plano(l.arriba || '');
    if (!arriba || !/\d/.test(arriba) || /^(supuestos?|ejemplo)\s*:?$/i.test(arriba)) {
      avisos.push(`${nombre(deck, i)}: la cuenta subraya un total («${plano(total).slice(0, 40)}») sin condición: escribe en «arriba» la condición con número («Si mandas 10 mensajes al día:») y usa rangos (GUION §3.8). Si es un dato publicado (tamaño de un mercado), pon «fuente»`);
    } else if (![arriba, ...lineas.map(plano)].some(x => RANGO.test(x))) {
      avisos.push(`${nombre(deck, i)}: la proyección da un número exacto sin rango («${plano(total).slice(0, 40)}»): pon la tasa o el resultado en rango («10-20%», «$25-75 millones») (GUION §3.8 b). Si es un dato publicado, pon «fuente»`);
    }
  });
  return { errores: [], avisos };
}

// ---------- pruebas de maqueta (LAYOUTS, `prueba`) ----------
export function reglasPrueba(deck) {
  const avisos = [];
  deck.laminas.forEach((l, i) => {
    if (l.tipo !== 'prueba' || !Array.isArray(l.capturas)) return;
    l.capturas.forEach((c, j) => {
      if (!c || !c.post || c.ejemplo !== true) return;
      const txt = [...(c.post.texto || []), c.post.clave || ''].join(' ');
      if (DATO_DURO.test(txt) || /\b(client|venta|vend[ií]|cerr[eé])/i.test(txt)) avisos.push(`${nombre(deck, i)}: el post de ejemplo ${j + 1} trae dinero, porcentajes o resultados; una maqueta con resultado se lee como testimonio: quita la cifra o usa una captura real con «fuente»`);
    });
  });
  return { errores: [], avisos };
}

// ---------- arco: llamado y láminas oscuras según la pieza (ARCOS.md) ----------
// Llamado VISIBLE: un botón, una lámina con `llamado: true` o un texto a la vista que ARRANCA con un imperativo
// con objeto («Agenda tu diagnóstico», «Escribe "CITA"», «Entra a…», «Comenta ==DOBLE==», «Guarda este reel»,
// «Manda INFO al…»). Una palabra suelta en la voz («WhatsApp», «aparta», «nos vemos») no es un llamado.
const IMPERATIVO = /^(da(le)? clic|haz clic|dale click|agenda (tu|una|aqui|hoy|ya)|aplica( (aqui|hoy|ya|en))?|escribe(me|nos)? (["«]|la palabra|aqui|al|a mi|por)|comenta (["«]|la palabra|aqui)|manda(me|nos)? (un )?(dm|mensaje|whatsapp)|entra (a|al|en)|inscribete|registrate|reserva (tu|aqui|ya)|aparta tu (lugar|silla|cupo)|unete|descarga|pide tu|reclama tu|toca (el|aqui)|visita)\b/;
// La forma más común del llamado en este estilo es un verbo + la PALABRA CLAVE marcada o en MAYÚSCULAS
// («Comenta ==DOBLE==», «Escríbeme **CITA** por WhatsApp»). Eso se lee en el texto CRUDO: plano() quita las marcas y
// sinAcentos() las mayúsculas. El verbo no distingue mayúsculas; el objeto sí: una palabra marcada («X», ==X==, **X**),
// una palabra en MAYÚSCULAS, «este/esta/tu/tus + algo» o un canal (WhatsApp, DM, link, correo). «Guarda el dinero» o
// «Agenda citas sola» no cuentan: con «el/la» genéricos se colaban frases de contenido.
const VERBO_LLAMADO = /^(comenta(me)?|escribe(me|nos)?|manda(me|nos)?|guarda(lo|la)?|responde(me)?|agenda|firma|aparta|reserva|entra|da(le)? clic|descarga(la|lo)?|comparte(lo|la)?|compartelo)(?![a-z])/;
const OBJETO_MARCADO = /^\s*(«[^»]+»|"[^"]+"|[A-ZÑ]{2,}(?![a-zA-ZñÑ]))/;
const OBJETO_PALABRA = /^\s*((este|esta|estos|estas|tu|tus)\s+[a-zñ]+|((por|al|a|en|un|una)\s+)?(whatsapp|dm|mensaje|link|liga|correo)(?![a-z]))/;
const sinTildes = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
// Texto crudo con las marcas de énfasis vueltas «comillas» (para conservar QUÉ va marcado) y sin tildes
const semiPlano = t => sinTildes(String(t || '')
  .replace(/\{[vrngako]:([^{}]+?)\}/g, '$1').replace(/\[\[|\]\]/g, '')
  .replace(/(==|\*\*|__|\^\^)([\s\S]+?)\1/g, '«$2»').replace(/~~/g, '')
  .replace(/\\n|\n/g, ' ').replace(/\s+/g, ' ').trim());
function textosCrudos(l) {
  const out = [];
  const ir = (x, k) => {
    if (k && noVisible(k)) return;
    if (typeof x === 'string') { if (x.trim()) out.push(x); }
    else if (Array.isArray(x)) x.forEach(y => ir(y, null));
    else if (x && typeof x === 'object') Object.entries(x).forEach(([kk, v]) => ir(v, kk));
  };
  ir(l, null);
  return out;
}
export function esVerboConObjeto(texto) {
  const t = semiPlano(texto).replace(/^[^\p{L}«"]+/u, '');
  const m = t.toLowerCase().match(VERBO_LLAMADO);
  if (!m) return false;
  const resto = t.slice(m[0].length);
  // el objeto va pegado al verbo; los canales también se aceptan con su preposición («por WhatsApp»)
  return OBJETO_MARCADO.test(resto) || OBJETO_PALABRA.test(resto.toLowerCase());
}
export const esLlamadoVisible = l => l.llamado === true || l.tipo === 'boton'
  || textosVisibles(l).some(t => IMPERATIVO.test(sinAcentos(t).replace(/^[^a-z0-9"«]+/, '')))
  || textosCrudos(l).some(esVerboConObjeto);
// Cierre de una clase: más flexible (también en la voz): próxima clase, nos vemos el…, siguiente paso, comunidad
const LLAMADO_CIERRE = /\b(proxima clase|nos vemos (el|en|la)|te espero|siguiente paso|unete|comunidad|inscribete|registrate|link|liga)\b/;
const esCierre = l => esLlamadoVisible(l) || LLAMADO_CIERRE.test(sinAcentos([...textosVisibles(l), vozDe(l)].join(' ')));
// Propuesta: también cierra un `flujo` o `pasos` con el siguiente paso a la vista («Firmas → arrancamos el lunes»)
const CIERRE_PROPUESTA = /\b(siguiente paso|siguientes pasos|firmas?|agenda|arrancamos|empezamos)\b/;
const esCierrePropuesta = l => esLlamadoVisible(l) || (['flujo', 'pasos'].includes(l.tipo) && CIERRE_PROPUESTA.test(sinAcentos(textosVisibles(l).join(' '))));
// Piezas que cierran con un llamado visible, y cuántas láminas del final se revisan
const CIERRE_POR_PIEZA = { clase: esCierre, 'clase-corta': esCierre, webinar: esLlamadoVisible, vsl: esLlamadoVisible, 'vsl-corto': esLlamadoVisible,
  reel: esLlamadoVisible, video: esLlamadoVisible, tutorial: esLlamadoVisible, propuesta: esCierrePropuesta };
const sinCamara = L => L.filter(l => l.tipo !== 'camara');
// ¿Cierra con qué hacer ahora? (las 3 últimas láminas que no son cámara)
export function cierraConLlamado(deck) {
  const f = CIERRE_POR_PIEZA[deck.pieza];
  if (!f) return true;
  const ult = sinCamara(deck.laminas).slice(-3);
  return !ult.length || ult.some(f);
}
// Llamados visibles distintos: láminas contiguas (sin contar cámara) cuentan como UNO (el botón y su «Después del clic»)
export function llamadosVisibles(deck) {
  const L = sinCamara(deck.laminas);
  let n = 0;
  L.forEach((l, i) => { if (esLlamadoVisible(l) && !(i > 0 && esLlamadoVisible(L[i - 1]))) n++; });
  return n;
}
// ¿Hay una objeción antes del llamado de la oferta? (el primero después de la oscura; sin oscura, el primero del deck)
export function hayObjecionAntes(deck) {
  const L = deck.laminas;
  const osc = L.findIndex(l => l.tipo === 'oscura' || l.oscura === true);
  let lim = L.findIndex((l, i) => i > osc && esLlamadoVisible(l));
  if (lim < 0) lim = L.length;
  return L.slice(0, lim).some(esObjecion);
}
// Propuesta: la lámina de inversión (un monto, «inversión» o el hueco del precio)
const MONTO = /[$€]|\b(mxn|usd)\b|\d[\d,.]*\s*(mil|k)\b|invers|\[precio\]|\{\{\s*precio/i;
export const hayInversion = deck => deck.laminas.some(l => ['cifra', 'idea', 'stack', 'oscura', 'tabla', 'tarjetas', 'lista'].includes(l.tipo) && MONTO.test(sinAcentos(textosCrudos(l).join(' '))));
export function reglasArco(deck) {
  const avisos = [], p = deck.pieza;
  const L = deck.laminas;
  if (CIERRE_POR_PIEZA[p] && !cierraConLlamado(deck)) {
    const que = p === 'propuesta' ? 'la inversión y el siguiente paso (firmar, agendar el arranque)' : p === 'reel' ? 'guardar o comentar la palabra clave' : 'qué hacer ahora (botón, palabra clave, link o próxima clase)';
    avisos.push(`el deck (${p}) termina sin llamado visible ni siguiente paso: cierra con ${que} a la vista, no solo en la voz (ARCOS.md)`);
  }
  if (p === 'reel' && llamadosVisibles(deck) > 1) avisos.push(`el reel lleva ${llamadosVisibles(deck)} llamados visibles separados: un reel lleva 1 (guardar o comentar), al final (ARCOS.md)`);
  if (p === 'propuesta' && !hayInversion(deck)) avisos.push('la propuesta no tiene lámina de inversión: pon el monto (o {{PRECIO}} si aún no está) en una `cifra` o `idea` antes del siguiente paso (ARCOS.md, propuesta)');
  if (['clase', 'clase-corta', 'reel'].includes(p)) {
    const osc = L.map((l, i) => (l.tipo === 'oscura' || l.oscura ? i + 1 : 0)).filter(Boolean);
    if (osc.length) avisos.push(`láminas oscuras en un(a) ${p} (${osc.join(', ')}): la oscura revela un producto en webinars y VSL; aquí basta el puente al siguiente paso (ARCOS.md)`);
  }
  if (['webinar', 'vsl', 'vsl-corto'].includes(p)) {
    const n = llamadosVisibles(deck);
    if (n < 2) avisos.push(`el llamado visible aparece ${n} ${n === 1 ? 'vez' : 'veces'}; en un(a) ${p} va al menos 2 veces a la vista (botón o palabra clave): después de la prueba y al final, con qué pasa después del clic (GUION §7). Una palabra suelta («WhatsApp», «aparta») no cuenta; marca con "llamado": true la lámina que muestra la palabra clave o la flecha al link`);
    // Objeciones antes del botón [34:17-36:00]: `idea` con «Objeción #N» o «Razón #N» y la respuesta en la
    // siguiente. Se busca antes del primer llamado de la oferta: un llamado temprano de webinar no cuenta.
    if (!hayObjecionAntes(deck)) avisos.push(`ninguna objeción antes del llamado: agrega ${p === 'vsl-corto' ? '1 lámina' : '1-2 láminas'} \`idea\` con encabezado «Objeción #N» o «Razón #N» (emoji negado, la objeción en negrita) y la respuesta con un dato o un paso en la siguiente; salen del público real, no se inventan (ARCOS.md, GUION §7)`);
  }
  return { errores: [], avisos };
}
const OBJECION = /^(objecion|razon)\s*(#|n[.o°º]?)\s*\d/;
const esObjecion = l => l && l.tipo === 'idea' && OBJECION.test(sinAcentos(plano(String(l.encabezado || ''))).trim());
// Primera lámina de la oferta (para medir dónde empieza en un VSL corto)
const esOferta = l => l && (l.tipo === 'oscura' || l.oscura === true || l.tipo === 'stack' || l.tipo === 'boton');

// ---------- prueba real y credibilidad en piezas de venta (GUION §7, beats 2 y 6) ----------
// Una maqueta `ejemplo: true` enseña un formato («así se ve el mensaje»); no respalda la oferta. Sin prueba real,
// GUION §7 da los sustitutos en orden; si no hay ninguno, el beat se omite. Todo es aviso: un creador nuevo
// puede no tener pruebas y usar un sustituto legítimo.
const PIEZAS_VENTA = ['vsl', 'vsl-corto', 'webinar'];
const conTexto = v => typeof v === 'string' && v.trim() !== '';
const capturasDe = l => (Array.isArray(l.capturas) ? l.capturas.filter(c => c && typeof c === 'object') : []);
export function esPruebaReal(l) {
  if (!l || typeof l !== 'object') return false;
  if (l.tipo === 'prueba') return capturasDe(l).some(c => c.ejemplo !== true && !c.hueco && (conTexto(c.src) || conTexto(c.fuente)));
  if (l.tipo === 'objeto') return conTexto(l.imagen);
  if (l.tipo === 'cifra') return conTexto(l.fuente);
  return false;
}
const CIFRA_CREDIBILIDAD = /\b\d[\d,.]*\s*\+?\s*(anos|clientes|alumnos|estudiantes|eventos|empresas|negocios|personas|asistentes|casos|proyectos)\b|\bdesde (19|20)\d\d\b/;
// Predicados que usan los avisos y faltaParaFinal (la misma condición, sin comparar textos de mensajes)
export const hayPruebaReal = deck => deck.laminas.some(esPruebaReal);
const soloMaqueta = l => { const cs = capturasDe(l); return l.tipo === 'prueba' && cs.some(c => c.ejemplo === true) && cs.every(c => c.ejemplo === true || c.hueco); };
export function hayCifraCredibilidad(deck) {
  const L = deck.laminas, osc = L.findIndex(l => l.tipo === 'oscura' || l.oscura === true);
  const fin = osc >= 0 ? osc : Math.ceil(L.length * 0.6);
  return L.slice(0, fin).some(l => CIFRA_CREDIBILIDAD.test(sinAcentos([...textosVisibles(l), vozDe(l)].join(' '))));
}
export function reglasCredibilidad(deck) {
  const avisos = [], p = deck.pieza, L = deck.laminas;
  // la propuesta no lleva capturas: solo el aviso suave de credibilidad (años, clientes o casos)
  if (p === 'propuesta') {
    if (!hayCifraCredibilidad(deck)) avisos.push('credibilidad sin cifra en la propuesta: di años, clientes o casos reales parecidos al suyo antes de la inversión; si no los hay, omítelo, no lo inventes');
    return { errores: [], avisos };
  }
  if (!PIEZAS_VENTA.includes(p)) return { errores: [], avisos };
  if (!hayPruebaReal(deck)) {
    avisos.push(`sin prueba real en el ${p}: pide 1-3 capturas con permiso o usa un sustituto de GUION §7 (demostración con material real, caso con números y «fuente», prueba lógica, primeros casos con garantía medible)`);
    L.forEach((l, i) => { if (soloMaqueta(l)) avisos.push(`${nombre(deck, i)} es una maqueta EJEMPLO en el tramo de prueba: en un ${p} se lee como «no hay pruebas»; cámbiala por una captura real o por un sustituto (GUION §7)`); });
  }
  if (!hayCifraCredibilidad(deck)) avisos.push(`credibilidad sin cifra: di años, clientes o eventos reales antes de la revelación (GUION §7, beat 2: «desde 2016, más de 23,000 clientes»); si no los hay, omítelo, no lo inventes`);
  return { errores: [], avisos };
}

// ---------- ¿qué le falta a una pieza de venta para llamarse final? (SKILL §6) ----------
// Claves cortas, con los mismos predicados que los avisos. Solo en piezas que venden; una clase con nota ≥ 90 es final.
export function faltaParaFinal(deck) {
  const p = deck.pieza, falta = [];
  if (PIEZAS_VENTA.includes(p)) {
    if (!hayPruebaReal(deck)) falta.push('prueba real');
    if (!hayCifraCredibilidad(deck)) falta.push('cifra de credibilidad');
    if (!hayObjecionAntes(deck)) falta.push('objeción antes del llamado');
    if (llamadosVisibles(deck) < 2) falta.push('2º llamado visible');
  }
  if ([...PIEZAS_VENTA, 'propuesta'].includes(p) && !cierraConLlamado(deck)) falta.push('llamado final');
  if (p === 'propuesta' && !hayInversion(deck)) falta.push('inversión');
  return falta;
}

// ---------- descargos en pantalla (GUION §3.8 d) ----------
// Una escena ilustrativa se presenta UNA vez en la voz («Pongamos que…», como «in this example» [22:28]); la
// lámina lleva la consecuencia, no «Cifra de ejemplo» [22:15 no trae etiqueta]. La maqueta de `prueba` sí lleva
// su sello EJEMPLO: ahí no aplica.
const DESCARGO = /\b(de ejemplo|ejemplo\s*:|hipotetic|ilustrativ)/;
const CAMPOS_DESCARGO = ['nota', 'titulo', 'subtitulo', 'encabezado', 'arriba'];
export function reglasDescargo(deck) {
  const avisos = [], enVoz = [];
  deck.laminas.forEach((l, i) => {
    if (l.tipo === 'prueba') return;
    for (const k of CAMPOS_DESCARGO) {
      const v = l[k], t = typeof v === 'string' ? v : v && typeof v === 'object' && typeof v.texto === 'string' ? v.texto : '';
      if (t && DESCARGO.test(sinAcentos(plano(t)))) { avisos.push(`${nombre(deck, i)}: «${plano(t).slice(0, 40)}» en «${k}» es un descargo en pantalla; va una vez en la voz al abrir la escena («Pongamos que…») y la lámina lleva la consecuencia (GUION §3.8 d)`); break; }
    }
    if (/\bes (solo )?un ejemplo\b|\bde ejemplo\b|\bhipotetic/.test(sinAcentos(vozDe(l)))) enVoz.push(i + 1);
  });
  if (enVoz.length > 2) avisos.push(`la voz repite que es un ejemplo en ${enVoz.length} láminas (${enVoz.join(', ')}): dilo una vez al abrir la escena (GUION §3.8 d)`);
  return { errores: [], avisos };
}

// ---------- coherencia emoji ↔ concepto dentro del deck (EMOJIS.md: un emoji, un concepto) ----------
const sinSelector = e => String(e || '').replace(/\uFE0F/g, '');
// Emojis de una lámina: [{ base, prefijo, insignia, campo, texto }] con el texto que los acompaña
export function emojisDeLamina(l) {
  const out = [];
  const ir = (o, campoPadre) => {
    if (Array.isArray(o)) return o.forEach(x => ir(x, campoPadre));
    if (!o || typeof o !== 'object') return;
    const texto = plano(String(o.etiqueta || o.texto || o.titulo || o.encabezado || '')).slice(0, 40);
    for (const [k, v] of Object.entries(o)) {
      if (esCampoEmoji(k)) {
        // la viñeta es de toda la lista: se nombra por su encabezado; un avatar, por el chat
        const txt = k === 'vineta' ? plano(String(o.encabezado || '(viñeta)')).slice(0, 40) : /^avatar/.test(k) ? `(${k.replace('_', ' ')})` : texto;
        specsDeCampo(k, v).forEach(sp => {
          const c = analizarCompuesto(sp);
          if (c.base) out.push({ base: sinSelector(c.base), prefijo: c.prefijo, insignia: sinSelector(c.insignia), campo: k, texto: txt });
        });
      } else if (v && typeof v === 'object' && k !== 'voz') ir(v, k);
    }
  };
  ir(l, null);
  return out;
}
// Inventario para qa.json → iconos: { emoji: ["lámina N · texto", …] }
export function inventarioIconos(deck) {
  const inv = {};
  deck.laminas.forEach((l, i) => emojisDeLamina(l).forEach(e => {
    for (const x of [e.base, e.insignia].filter(Boolean)) {
      const r = `lámina ${i + 1}${e.texto ? ` · ${e.texto}` : ''}`;
      (inv[x] = inv[x] || []).includes(r) || inv[x].push(r);
    }
  }));
  return inv;
}
export function reglasIconos(deck) {
  const avisos = [], L = deck.laminas;
  const usos = L.map(emojisDeLamina);
  const usados = new Set(usos.flat().flatMap(e => [e.base, e.insignia]).filter(Boolean));
  // a) dos emojis que se ven casi iguales en el set del deck (con auto, en cualquiera de los dos)
  const sets = deck.emoji === 'apple' || deck.emoji === 'fluent' ? [deck.emoji] : ['apple', 'fluent'];
  const vistos = new Set();
  for (const set of sets) for (const grupo of PARECIDOS[set] || []) {
    const en = grupo.filter(e => usados.has(e));
    const clave = en.join('');
    if (en.length > 1 && !vistos.has(clave)) { vistos.add(clave); avisos.push(`${en.join(' y ')} se ven casi iguales en ${set}: usa uno solo o cambia el otro (EMOJIS.md, «un emoji = un concepto»)`); }
  }
  // b) rol contradictorio en una rejilla: la base es «lo otro» (la silla vacía) y el destacado «lo que cuenta»
  // (quien llegó). Si la base sale en otra lámina con ✅ o el destacado con ❌, el mismo emoji dice lo contrario.
  L.forEach((l, i) => {
    if (l.tipo !== 'rejilla' || typeof l.emoji !== 'string' || typeof l.emoji_destacado !== 'string') return;
    const base = sinSelector(analizarCompuesto(l.emoji).base), dest = sinSelector(analizarCompuesto(l.emoji_destacado).base);
    if (!base || !dest || base === dest) return;
    usos.forEach((es, j) => {
      if (j === i) return;
      if (es.some(e => e.base === base && e.prefijo === 'si')) avisos.push(`${nombre(deck, j)}: si:${base} contradice la ${nombre(deck, i)}, donde ${base} es la base de la rejilla (lo que NO cuenta) y ${dest} lo que sí: usa si:${dest} o cambia la base (EMOJIS.md, Eventos)`);
      if (es.some(e => e.base === dest && e.prefijo === 'no')) avisos.push(`${nombre(deck, j)}: no:${dest} contradice la ${nombre(deck, i)}, donde ${dest} es lo que cuenta en la rejilla: usa la base ${base} (EMOJIS.md)`);
    });
  });
  return { errores: [], avisos };
}

// ---------- ritmo: cada paso es un beat de 2-3 s (GUION §1; mediana medida en la referencia 2.9 s) ----------
// Con la duración de cada paso (duracionPaso: voz a 2.7 palabras/s + 0.35). Quedan fuera las `camara` y las láminas con
// `dur` explícito. Un paso de más de 8 s es un párrafo con la lámina quieta: error. Los de más de 5 s van en UN aviso
// por deck (no uno por lámina: los de 5.2 s, 13 palabras, están al límite y un aviso por lámina hundía la nota),
// y solo si son muchos (≥ 15%) o si alguno pasa de 6 s.
export const RITMO_BEAT = { largo: 5, muyLargo: 6, error: 8, mediana: 3.5, proporcion: 0.15 };
export function reglasRitmo(deck, pasos) {
  const errores = [], avisos = [], todos = [], largos = [];
  deck.laminas.forEach((l, i) => {
    if (!l || l.tipo === 'camara' || l.dur != null) return;
    const n = Math.max(1, (pasos && pasos[i]) || 1);
    for (let k = 0; k < n; k++) {
      const d = duracionPaso(l, k);
      todos.push(d);
      if (d > RITMO_BEAT.error) errores.push(`${nombre(deck, i)}, paso ${k + 1} dura ${d.toFixed(1)} s: es un párrafo con la lámina quieta; parte el beat en dos pasos o corta a cámara (GUION §1)`);
      else if (d > RITMO_BEAT.largo) largos.push({ lamina: i + 1, paso: k + 1, s: +d.toFixed(1) });
    }
  });
  const orden = [...todos].sort((a, b) => a - b);
  const q = f => (orden.length ? +orden[Math.min(orden.length - 1, Math.floor(f * (orden.length - 1) + 0.5))].toFixed(1) : 0);
  const ritmo = { mediana: q(0.5), p90: q(0.9), pasos_largos: largos.map(x => `${x.lamina}.${x.paso}`) };
  if (largos.length && (largos.length / Math.max(1, todos.length) >= RITMO_BEAT.proporcion || largos.some(x => x.s > RITMO_BEAT.muyLargo))) {
    const lista = [...largos].sort((a, b) => b.s - a.s).slice(0, 8).map(x => `${x.lamina}.${x.paso} de ${x.s} s`).join(', ');
    avisos.push(`${largos.length} de ${todos.length} pasos pasan de 5 s (${lista}${largos.length > 8 ? '…' : ''}): parte el beat en dos pasos o recorta la voz (GUION §1, un beat son 2-3 s)`);
  }
  if (orden.length >= 8 && ritmo.mediana > RITMO_BEAT.mediana) avisos.push(`el paso típico va a ${ritmo.mediana} s (mediana; la referencia va a 2.9 s): el ritmo se siente lento; parte los beats (GUION §1)`);
  return { errores, avisos, ritmo };
}

// ---------- resultados propios y entregables que nadie confirmó (VOZ-HUMANA §5, GUION §3.8 c) ----------
// «La regla que ME HIZO COBRAR el doble» es un CASO, igual que {{CASO}}: si no está confirmado en datos.CASO_PROPIO (o
// la lámina no trae «fuente»), el deck es BORRADOR. Un llamado que promete un entregable («te mando la tabla») pide
// datos.ENTREGABLE confirmado. El verbo va en primera persona CON tilde («gané», «vendí»): sin tilde «gane» y «cobre»
// son subjuntivo o el metal; y con límite al final para no atrapar «vendiste» ni «ganes».
const RES_FRASE = /(?:^|[^a-z])(me (?:hizo|permitio|llevo a) (?:cobrar|ganar|vender|facturar|duplicar|triplicar)|(?:ganamos|facturamos|vendimos|duplicamos|triplicamos))(?![a-z])/;
const RES_VERBO = /(?:^|[^\p{L}])(gané|cobré|facturé|vendí|dupliqué|tripliqué|pasé de \$?\d)(?![\p{L}])/u;
export const afirmaResultadoPropio = t => RES_FRASE.test(sinAcentos(plano(t))) || RES_VERBO.test(plano(t).toLowerCase());
const PROMETE_ENTREGABLE = /(?:^|[^a-z])(te (?:mando|envio|regalo|paso|comparto)|descarga(?:la|lo)?)(?![a-z])/;
const DESCARGO_RESULTADO = /no quiere decir que tu|no garantiza|a mi me funciono|cada caso es distinto|no te prometo|tus resultados (pueden|van a) (variar|ser distintos)/;
const confirmado = v => (typeof v === 'string' && v.trim() !== '') || (typeof v === 'number' && Number.isFinite(v))
  || (v && typeof v === 'object' && !Array.isArray(v) && v.propuesto !== true && v.pendiente !== true && v.valor != null && String(v.valor).trim() !== '');
export function reglasAfirmacionPropia(deck) {
  const avisos = [], porConfirmar = {}, datos = deck.datos && typeof deck.datos === 'object' ? deck.datos : {};
  const L = deck.laminas, conClaim = [];
  L.forEach((l, i) => {
    if (!l || l.fuente) return;
    const frases = [...textosVisibles(l), vozDe(l)].filter(Boolean);
    const f = frases.find(afirmaResultadoPropio);
    if (f) conClaim.push({ i, frase: plano(f).slice(0, 60) });
  });
  if (conClaim.length && !confirmado(datos.CASO_PROPIO)) {
    porConfirmar.CASO_PROPIO = { valor: conClaim[0].frase, laminas: conClaim.map(c => c.i + 1),
      motivo: 'resultado propio en primera persona sin confirmar: confírmalo en datos.CASO_PROPIO o escríbelo como {{CASO_PROPIO}}' };
  }
  // El llamado que promete un entregable
  const conEntregable = L.map((l, i) => [l, i]).filter(([l]) => l && esLlamadoVisible(l)
    && PROMETE_ENTREGABLE.test(sinAcentos([vozDe(l), plano(typeof l.nota === 'string' ? l.nota : (l.nota && l.nota.texto) || ''), ...textosVisibles(l)].join(' '))));
  if (conEntregable.length && !confirmado(datos.ENTREGABLE)) {
    porConfirmar.ENTREGABLE = { valor: '', laminas: conEntregable.map(([, i]) => i + 1),
      motivo: 'el llamado promete un entregable («te mando…»): confirma que existe en datos.ENTREGABLE' };
  }
  // GUION §3.8 c: el resultado propio del arranque lleva su descargo en la voz
  const arranque = conClaim.filter(c => c.i <= Math.min(2, L.length - 1));
  if (arranque.length) {
    const voces = L.filter((l, i) => arranque.some(c => c.i === i) || ['prueba', 'cifra'].includes(l.tipo)).map(vozDe).join(' ');
    if (!DESCARGO_RESULTADO.test(sinAcentos(voces))) avisos.push(`${nombre(deck, arranque[0].i)}: «${arranque[0].frase}» afirma un resultado propio y ninguna voz trae el descargo («no quiere decir que tú…», «a mí me funcionó así») (GUION §3.8 c)`);
  }
  return { errores: [], avisos, porConfirmar };
}

// ---------- claves del deck que nadie lee ----------
// `_datos`, `_marca`, `_duracion`: un aviso de entrega escondido en el deck no llega al usuario. Lo que el
// usuario debe saber va en qa.json (datos propuestos, firma, duración) o en el mensaje de entrega.
const CLAVES_DECK = new Set(['$schema', 'titulo', 'formato', 'emoji', 'animacion', 'idioma', 'marca', 'pieza', 'duracion_objetivo', 'en_vivo', 'datos', 'laminas', '_comentario']);
export function reglasClaves(deck) {
  const avisos = [];
  Object.keys(deck).filter(k => !CLAVES_DECK.has(k)).forEach(k => avisos.push(k.startsWith('_')
    ? `«${k}» no lo lee nadie: un dato sin confirmar va en "datos" como { "valor", "propuesto": true }, la firma en "marca" y lo demás se dice al entregar (SKILL §4)`
    : `«${k}» no es un campo del deck y se ignora (campos: ${[...CLAVES_DECK].filter(c => !c.startsWith('_') && c !== '$schema').join(', ')})`));
  return { errores: [], avisos };
}

// Nota de QA: −12 por error y −3 por aviso. Con datos propuestos sin confirmar, el deck es BORRADOR y la nota
// no pasa de TOPE_BORRADOR: un VSL con el nombre del programa inventado nunca sale como final.
export const TOPE_BORRADOR = 90;
export function notaQA({ errores = [], avisos = [], porConfirmar = {} } = {}) {
  const n = Math.max(0, 100 - 12 * errores.length - 3 * avisos.length);
  return Object.keys(porConfirmar).length ? Math.min(n, TOPE_BORRADOR) : n;
}

// Todas juntas
export function revisarDeck(deck, pasos, { dirDeck } = {}) {
  const ritmo = reglasRitmo(deck, pasos), propia = reglasAfirmacionPropia(deck);
  const partes = [reglasFirma(deck), reglasDuracion(deck, pasos), reglasApertura(deck, pasos), reglasVoz(deck, palabrasProhibidas(dirDeck)),
    reglasProyeccion(deck), reglasPrueba(deck), reglasArco(deck), reglasCredibilidad(deck), reglasDescargo(deck), reglasIconos(deck),
    reglasClaves(deck), ritmo, propia];
  return {
    errores: partes.flatMap(p => p.errores),
    avisos: partes.flatMap(p => p.avisos),
    duracion: partes[1].estimado,
    iconos: inventarioIconos(deck),
    ritmo: ritmo.ritmo,
    porConfirmar: propia.porConfirmar,
    faltaParaFinal: faltaParaFinal(deck),
  };
}
