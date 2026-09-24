// reglas-deck.mjs — reglas de QA que se leen en el deck.json (sin navegador): duración de la pieza, apertura,
// voz, proyecciones, pruebas de maqueta, prueba real y credibilidad, objeciones, descargos en pantalla, firma de
// relleno, llamado, coherencia emoji↔concepto y claves que nadie lee. qa.mjs las suma a sus hallazgos; aquí
// son funciones puras para probarlas rápido (pruebas/reglas-deck.test.mjs).
//
// Todas devuelven { errores: [], avisos: [] } con mensajes accionables que citan la referencia o el archivo.
import { plano } from './markup.mjs';
import { PIEZAS, minutosObjetivo, duracionTotal, duracionPorTipo, tiemposSecuenciales, mmss, duracionPaso } from './tiempos.mjs';
import { DATO_DURO } from './layouts-datos.mjs';
import { analizarCompuesto, PARECIDOS, esCampoEmoji, specsDeCampo, contrasteMedido, esGlifoDibujado } from './emoji.mjs';
import { RELLENO, buscarMarca } from './marca.mjs';
import { conceptoDe } from './emoji-diccionario.mjs';
import { reglasTasa, reglasPromesa, cierreDeClase, esClase } from './reglas-venta.mjs';
export { reglasTasa, reglasPromesa, esPromesa, cierreDeClase, esClase } from './reglas-venta.mjs';

export const sinAcentos = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const nombre = (deck, i) => `lámina ${i + 1} (${deck.laminas[i].id || deck.laminas[i].tipo})`;

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
      avisos.push(`el objetivo ${mmss(objetivo * 60)} queda fuera de un(a) ${nomPieza} (${pieza.min}-${pieza.max} min): usa la pieza que le toca (tutorial 2-8, vsl-corto 3-6, clase-corta 15-30 o libre) en vez de forzar el objetivo (ARCOS.md)`);
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
    const i0 = inicioOferta(deck.laminas);
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
  // Piezas de venta: la promesa («sin…») o el mecanismo con nombre antes del segundo 30 [0:08-0:36]
  if (PIEZAS_VENTA.includes(deck.pieza) && !hayPromesaTemprana(deck, t)) avisos.push(`los primeros 30 s no dicen qué gana el que mira: después del gancho, la promesa con su «sin…» (\`idea\` + \`lista\` «Sin:») y el nombre del mecanismo entre «comillas» y __subrayado__, dicho de pasada, antes del segundo 25; el problema va después (GUION §6.1, ARCOS.md «VSL corto»)`);
  return { errores: [], avisos };
}
// ¿Alguna lámina que arranca antes del segundo 30 trae la promesa o el mecanismo? Un término «…» subrayado, una `lista`
// «Sin:» o una promesa con «sin…» (en el texto de una `idea` o en la voz). `t`: tiemposSecuenciales del deck.
const MECANISMO_MARCADO = /__[^_]*«[^»]+»[^_]*__|«[^»]*__[^_]+__[^»]*»/;
const PROMESA_SIN = /(^|[^a-z])sin [a-z]{3,}/;
export function hayPromesaTemprana(deck, t) {
  const idx = new Set(t.filter(s => s.inicio < 30).map(s => s.lamina));
  return [...idx].some(i => {
    const l = deck.laminas[i];
    if (!l || l.tipo === 'camara') return false;
    if (textosCrudos(l).some(x => MECANISMO_MARCADO.test(x))) return true;
    if (l.tipo === 'lista' && /^sin\b/.test(sinAcentos(plano(String(l.encabezado || ''))).trim())) return true;
    const vistos = l.tipo === 'idea' ? textosVisibles(l) : [];
    return [...vistos, vozDe(l)].some(x => PROMESA_SIN.test(sinAcentos(x)));
  });
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

// «Palabras que nunca usas» de la ficha MI-MARCA.md: la misma cadena de búsqueda que la firma (marca.mjs:
// carpeta del deck → la de arriba → $PIZARRON_MARCA → ~/.config/diapositivas-pizarron-ia/MI-MARCA.md)
export function palabrasProhibidas(dirDeck, opciones) {
  const f = buscarMarca(dirDeck, opciones);
  return f ? f.vetadas : [];
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
// Desglose de un precio («$3,000 ÷ 30 días = __$100 al día__», «{{PRECIO}} ÷ 40 vendedores = __$2,500 por vendedor__»):
// dividir lo que cuesta no promete nada. Solo es desglose si se cumplen LAS DOS: (a) una línea anterior, o la misma
// antes del «=», divide (÷ o /) y empieza con un monto o con el precio; (b) el total subrayado termina en «por/al/cada
// + unidad». «= __$500 al día en ventas__» sigue siendo una promesa. No hay bandera manual: sería un escape.
const EMPIEZA_MONTO = /^\s*(\{\{\s*precio[^}]*\}\}|\[precio[^\]]*\]|\$\s*\d|\d)/;
const UNIDAD_FINAL = /\b(por|al|a la|cada)\s+(dia|semana|mes|ano|persona|vendedor|alumno|quincena|pago|sesion|participante|usuario|integrante|colaborador|hora|clase|modulo)(e?s)?\s*$/;
export function esDesglose(lineas, total) {
  const k = lineas.indexOf(total);
  const antes = [...lineas.slice(0, k), total.split('=')[0]].map(x => sinAcentos(plano(x)));
  const divide = antes.some(x => /[÷/]/.test(x) && EMPIEZA_MONTO.test(x));
  const sub = (total.match(/__([^_]+)__/) || [])[1] || '';
  return divide && UNIDAD_FINAL.test(sinAcentos(plano(sub)).replace(/[.!]+$/, ''));
}
export function reglasProyeccion(deck) {
  const avisos = [];
  deck.laminas.forEach((l, i) => {
    if (l.tipo !== 'cifra' || l.fuente) return;
    const lineas = (l.lineas || (l.valor ? [l.valor] : [])).map(x => (x && typeof x === 'object' ? x.texto : x)).filter(x => typeof x === 'string');
    const total = lineas.find(x => PROMESA.test(sinAcentos(x)));
    if (!total || esDesglose(lineas, total)) return;
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
export function textosCrudos(l) {
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
  // La marca que cubre la frase entera («__Guarda este reel__», «**Comenta MINUTA**») deja una « antes del verbo y una »
  // pegada a él: se quitan las dos. El objeto lo siguen resolviendo OBJETO_MARCADO y OBJETO_PALABRA.
  const t = semiPlano(texto).replace(/^[^\p{L}«"]+/u, '').replace(/^[«"](?=\p{L})/u, '');
  const m = t.toLowerCase().match(VERBO_LLAMADO);
  if (!m) return false;
  const resto = t.slice(m[0].length).replace(/^[»"]/, '');
  // el objeto va pegado al verbo; los canales también se aceptan con su preposición («por WhatsApp»)
  return OBJETO_MARCADO.test(resto) || OBJETO_PALABRA.test(resto.toLowerCase());
}
// `llamado: false` gana a todo: un `boton` de demostración («Enviar», «Generar», el «solo das clic» del mecanismo) no es
// un llamado (LAYOUTS §boton)
export const esLlamadoVisible = l => l.llamado !== false && (l.llamado === true || l.tipo === 'boton'
  || textosVisibles(l).some(t => IMPERATIVO.test(sinAcentos(t).replace(/^[^a-z0-9"«]+/, '')))
  || textosCrudos(l).some(esVerboConObjeto));
// Botones que cuentan como llamado y no están en las 3 últimas láminas: pueden ser una demostración sin marcar
export function pistaBotonDemo(deck, solo = null) {
  const L = deck.laminas, vis = L.map((l, i) => [l, i]).filter(([l]) => l && l.tipo !== 'camara');
  const finales = new Set(vis.slice(-3).map(([, i]) => i));
  const b = vis.filter(([l, i]) => l.tipo === 'boton' && l.llamado !== true && !finales.has(i) && (solo === null || solo === i)).map(([, i]) => i + 1);
  return b.length ? `; si el botón de la lámina ${b.join(', ')} es de una demostración («Enviar», «Generar»), márcalo "llamado": false` : '';
}
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
// Un tutorial marcado `"clase": true` (clase express) cierra como una clase: la próxima clase o la comunidad cuentan.
export function cierraConLlamado(deck) {
  const f = deck.pieza === 'tutorial' && esClase(deck) ? esCierre : CIERRE_POR_PIEZA[deck.pieza];
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
// La lámina de inversión en sí (no un costo del diagnóstico): dice «inversión» o lleva el precio
const INVERSION = /invers|\[precio|\{\{\s*precio/i;
const esInversion = l => l && ['cifra', 'idea'].includes(l.tipo) && INVERSION.test(sinAcentos(textosCrudos(l).join(' ')));
export function reglasArco(deck) {
  const avisos = [], p = deck.pieza;
  const L = deck.laminas;
  if (CIERRE_POR_PIEZA[p] && !cierraConLlamado(deck)) {
    const que = p === 'propuesta' ? 'la inversión y el siguiente paso (firmar, agendar el arranque)' : p === 'reel' ? 'guardar o comentar la palabra clave' : 'qué hacer ahora (botón, palabra clave, link o próxima clase)';
    // Un tutorial que cierra con una tarea suele ser un taller: la tarea cuenta como cierre con "clase": true y su puente
    const taller = p === 'tutorial' && !esClase(deck) ? '; si es un taller o clase express que cierra con una tarea, marca "clase": true y pon el puente (próxima clase o comunidad)' : '';
    avisos.push(`el deck (${p}) termina sin llamado visible ni siguiente paso: cierra con ${que} a la vista, no solo en la voz${taller} (ARCOS.md)`);
  }
  if (p === 'reel' && llamadosVisibles(deck) > 1) avisos.push(`el reel lleva ${llamadosVisibles(deck)} llamados visibles separados: un reel lleva 1 (guardar o comentar), al final${pistaBotonDemo(deck)} (ARCOS.md)`);
  if (p === 'propuesta' && !hayInversion(deck)) avisos.push('la propuesta no tiene lámina de inversión: pon el monto (o {{PRECIO}} si aún no está) en una `cifra` o `idea` antes del siguiente paso (ARCOS.md, propuesta)');
  if (['clase', 'clase-corta', 'reel'].includes(p)) {
    const osc = L.map((l, i) => (l.tipo === 'oscura' || l.oscura ? i + 1 : 0)).filter(Boolean);
    if (osc.length) avisos.push(`láminas oscuras en un(a) ${p} (${osc.join(', ')}): la oscura revela un producto en webinars y VSL; aquí basta el puente al siguiente paso (ARCOS.md)`);
  }
  if (['webinar', 'vsl', 'vsl-corto'].includes(p)) {
    const n = llamadosVisibles(deck);
    if (n < 2) avisos.push(`el llamado visible aparece ${n} ${n === 1 ? 'vez' : 'veces'}; en un(a) ${p} va al menos 2 veces a la vista (botón o palabra clave): después de la revelación y al final, con qué pasa después del clic (GUION §7). Una palabra suelta («WhatsApp», «aparta») no cuenta; marca con "llamado": true la lámina que muestra la palabra clave o la flecha al link`);
    // Objeciones antes del botón [34:17-36:00]: `idea` con «Objeción #N» o «Razón #N» y la respuesta en la
    // siguiente. Se busca antes del primer llamado de la oferta: un llamado temprano de webinar no cuenta.
    if (!hayObjecionAntes(deck)) avisos.push(`ninguna objeción antes del llamado: agrega ${p === 'vsl-corto' ? '1 lámina' : '1-2 láminas'} \`idea\` con encabezado «Objeción #N» o «Razón #N» (emoji negado, la objeción en negrita) y la respuesta con un dato o un paso en la siguiente; salen del público real, no se inventan (ARCOS.md, GUION §7)`);
    // Un solo canal por pieza [43:36, 44:31: los dos llamados son «aplicar»]: botón/link o palabra clave por mensaje
    const canales = canalesDeLlamado(deck);
    if (canales.boton.length && canales.palabra.length) avisos.push(`los llamados mezclan dos acciones: botón o link (${canales.boton.map(i => `lámina ${i + 1}`).join(', ')}) y palabra clave por mensaje (${canales.palabra.map(i => `lámina ${i + 1}`).join(', ')}): una sola acción por pieza, la misma en todos los llamados${pistaBotonDemo(deck)} (GUION §7)`);
  }
  // VSL: nada de «aplica» antes de decir qué se vende [la referencia: revelación 36:16, primer botón 43:36]. El webinar
  // puede llevar un llamado temprano (GUION §7).
  if (['vsl', 'vsl-corto'].includes(p)) {
    const k = llamadoAntesDeRevelar(deck);
    if (k >= 0) avisos.push(`${nombre(deck, k)} pide actuar antes de decir qué se vende: en un(a) ${p} el llamado va después de la revelación (la lámina oscura) y otra vez al final; mueve este llamado detrás de la revelación y deja antes la objeción con su respuesta${pistaBotonDemo(deck, k)} (GUION §7)`);
  }
  return { errores: [], avisos };
}
// Primer llamado visible antes de la revelación oscura (-1 si no hay oscura o no hay llamado antes)
export function llamadoAntesDeRevelar(deck) {
  const L = deck.laminas, osc = L.findIndex(esLaminaOscura);
  return osc < 0 ? -1 : L.slice(0, osc).findIndex(l => l && l.tipo !== 'camara' && esLlamadoVisible(l));
}
// Canal de cada llamado visible: `boton` (un botón, un link, «aplica», «da clic») o `palabra` (palabra clave por
// WhatsApp, DM o comentario). { boton: [i…], palabra: [i…] }
const CANAL_BOTON = /\b(link|liga|aplica|aplicar|da(le)? clic|haz clic|boton|formulario)\b|https?:|\.com\b/;
const CANAL_PALABRA = /\b(whatsapp|dm|mensaje|comenta|escribe(me|nos)?|manda(me|nos)?)\b/;
export function canalesDeLlamado(deck) {
  const r = { boton: [], palabra: [] };
  deck.laminas.forEach((l, i) => {
    if (!l || l.tipo === 'camara' || !esLlamadoVisible(l)) return;
    const t = sinAcentos(textosVisibles(l).join(' / '));
    if (l.tipo === 'boton' || CANAL_BOTON.test(t)) r.boton.push(i);
    else if (CANAL_PALABRA.test(t)) r.palabra.push(i);
  });
  return r;
}
const OBJECION = /^(objecion|razon)\s*(#|n[.o°º]?)\s*\d/;
const esObjecion = l => l && l.tipo === 'idea' && OBJECION.test(sinAcentos(plano(String(l.encabezado || ''))).trim());
const esLaminaOscura = l => l && (l.tipo === 'oscura' || l.oscura === true);
// Dónde empieza la oferta (para medir en un VSL corto): la revelación oscura; sin oscura, el primer `stack`. Un botón NO
// es la oferta: un «Aplica aquí» temprano tapaba una revelación tardía (GUION §7).
export function inicioOferta(L) {
  const o = L.findIndex(esLaminaOscura);
  return o >= 0 ? o : L.findIndex(l => l && l.tipo === 'stack');
}
// ¿El deck trae algo de oferta? (para la escasez inventada: un botón también cuenta)
const pareceOferta = l => l && (esLaminaOscura(l) || l.tipo === 'stack' || l.tipo === 'boton');

// ---------- objeciones con una frecuencia que nadie midió (VOZ-HUMANA §5, GUION §7 beat 0) ----------
// «La objeción de siempre», «la que más oigo»: afirma un consenso sin dato. La referencia la introduce sin frecuencia
// («a quick word of warning… reason number one»). Se revisa la voz de la lámina «Objeción #N» y la de la siguiente;
// no avisa si datos.OBJECION_N está confirmado (valor sin «propuesto»).
const FRECUENCIA = /de siempre|que mas (oigo|escucho|me dicen)|todos me dicen|siempre me preguntan|la mayoria (me )?dice/;
export function reglasObjecion(deck) {
  const avisos = [], L = deck.laminas, datos = deck.datos && typeof deck.datos === 'object' ? deck.datos : {};
  L.forEach((l, i) => {
    if (!esObjecion(l)) return;
    const n = (sinAcentos(plano(String(l.encabezado || ''))).match(/\d+/) || [''])[0];
    if (n && confirmado(datos[`OBJECION_${n}`])) return;
    const voz = sinAcentos([vozDe(l), L[i + 1] ? vozDe(L[i + 1]) : ''].join(' '));
    const m = voz.match(FRECUENCIA);
    if (m) avisos.push(`${nombre(deck, i)}: «${m[0]}» afirma que la objeción es frecuente sin dato: confirma OBJECION_${n || 'N'} en "datos" o dila sin frecuencia («Objeción número uno: …», «Quizá estés pensando: …») (VOZ-HUMANA.md)`);
  });
  return { errores: [], avisos };
}

// ---------- prueba real y credibilidad en piezas de venta (GUION §7, beats 2 y 6) ----------
// Una maqueta `ejemplo: true` enseña un formato («así se ve el mensaje»); no respalda la oferta. Sin prueba real,
// GUION §7 da los sustitutos en orden; si no hay ninguno, el beat se omite. Todo es aviso: un creador nuevo
// puede no tener pruebas y usar un sustituto legítimo.
const PIEZAS_VENTA = ['vsl', 'vsl-corto', 'webinar'];
export const conTexto = v => typeof v === 'string' && v.trim() !== '';
const capturasDe = l => (Array.isArray(l.capturas) ? l.capturas.filter(c => c && typeof c === 'object') : []);
export function esPruebaReal(l) {
  if (!l || typeof l !== 'object') return false;
  if (l.tipo === 'prueba') return capturasDe(l).some(c => c.ejemplo !== true && !c.hueco && (conTexto(c.src) || conTexto(c.fuente)));
  if (l.tipo === 'objeto') return conTexto(l.imagen);
  if (l.tipo === 'cifra') return conTexto(l.fuente);
  return false;
}
// Capturas `{ hueco }` sin `plantilla: true`: un recuadro vacío a la vista es una captura POR CONSEGUIR (el deck es
// borrador hasta tenerla; qa.mjs la pone en por_confirmar como CAPTURA_N). Con `plantilla: true` el hueco es el lugar
// de la captura del espectador y se dibuja con marco a mano. Basta un hueco suelto junto a una captura real.
export function huecosDePrueba(deck) {
  return deck.laminas.map((l, i) => (l && l.tipo === 'prueba' && capturasDe(l).some(c => conTexto(c.hueco) && c.plantilla !== true) ? i + 1 : 0)).filter(Boolean);
}
// Tutoriales y clases: cada paso con su demostración (ARCOS §Tutorial, paso 3): una captura real, un objeto con foto o
// un tramo a cámara. Es aviso: el emoji grande como objeto es del estilo original, pero un tutorial sin NINGUNA
// demostración enseña de palabra.
const PIEZAS_ENSENAN = ['tutorial', 'clase', 'clase-corta'];
export const demuestra = l => l && ((l.tipo === 'prueba' && capturasDe(l).some(c => conTexto(c.src) && !c.hueco && c.ejemplo !== true))
  || (l.tipo === 'objeto' && conTexto(l.imagen)) || l.tipo === 'camara');
export function reglasDemostracion(deck) {
  if (!PIEZAS_ENSENAN.includes(deck.pieza) || deck.laminas.some(demuestra)) return { errores: [], avisos: [] };
  return { errores: [], avisos: [`sin demostración: el ${deck.pieza} enseña sin mostrar nada real (ARCOS §Tutorial, paso 3 pide captura real o \`camara\` corta): pide 1 captura o foto por paso (\`prueba\` con \`src\`, \`objeto\` con \`imagen\`) o corta a cámara a demostrarlo`] };
}
// El número puede ser un hueco declarado («Más de [CLIENTES] clientes»): el lugar de la cifra existe y QA lo cuenta
// como dato pendiente aparte (borrador hasta llenarlo), no como «sin credibilidad».
const NUM_O_HUECO = '(\\d[\\d,.]*|\\[[a-z0-9_]+\\])';
const CIFRA_CREDIBILIDAD = new RegExp(`${NUM_O_HUECO}\\s*\\+?\\s*(anos|clientes|alumnos|estudiantes|eventos|empresas|negocios|personas|asistentes|casos|proyectos)\\b|\\bdesde (19|20)\\d\\d\\b`);
// En una propuesta «40 personas» es el equipo del CLIENTE: la credibilidad es del proveedor (años, clientes, empresas,
// eventos, casos, personas YA capacitadas) o su «desde 20XX».
const CIFRA_PROVEEDOR = new RegExp(`\\bdesde (19|20)\\d\\d\\b|${NUM_O_HUECO}\\s*\\+?\\s*(anos|clientes|empresas|alumnos|egresados|graduados|eventos|casos|proyectos|generaciones)\\b|${NUM_O_HUECO}\\s*\\+?\\s*(personas|vendedores|equipos|lideres)\\s+(ya\\s+)?(capacitad|formad|entrenad|atendid)`);
// Predicados que usan los avisos y faltaParaFinal (la misma condición, sin comparar textos de mensajes)
export const hayPruebaReal = deck => deck.laminas.some(esPruebaReal);
// Sustitutos de GUION §7 que QA cuenta como prueba para final (una captura real sigue siendo mejor):
//   d) prueba lógica: `cifra` sin `fuente` con la condición en `arriba` («Si…», «Cuando…», «Con…») y un número, y un
//      rango en `arriba` o en `lineas` (no un desglose de precio);
//   e) primeros casos con garantía: `idea` 🛡️ con plazo REAL («30 días»; un {{GARANTIA_DIAS}} sin llenar no cuenta) y
//      condición («si…»).
const CONDICION_INICIO = /^\s*(si|cuando|con|pongamos|supongamos)\b/;
const PLAZO_REAL = /\d+\s*(dias|semanas|meses|anos)\b/;
export const lineasCifra = l => (l.lineas || (l.valor ? [l.valor] : [])).map(x => (x && typeof x === 'object' ? x.texto : x)).filter(x => typeof x === 'string');
export function sustitutoPrueba(l) {
  if (!l || typeof l !== 'object') return null;
  if (l.tipo === 'cifra' && !conTexto(l.fuente)) {
    const arriba = sinAcentos(plano(l.arriba || '')), lineas = lineasCifra(l);
    const total = lineas.find(x => PROMESA.test(sinAcentos(x)));
    if (total && esDesglose(lineas, total)) return null;
    if (CONDICION_INICIO.test(arriba) && /\d/.test(arriba) && [arriba, ...lineas.map(plano)].some(x => RANGO.test(x))) return 'logica';
  }
  if (l.tipo === 'idea' && [].concat(l.emoji || []).some(e => typeof e === 'string' && e.includes('🛡'))) {
    const t = todoTexto(l);
    if (PLAZO_REAL.test(t) && CONDICION.test(t)) return 'garantia';
  }
  return null;
}
// La prueba del deck: la real primero; si no, el primer sustituto d o e (la c, prueba de mercado, lleva `fuente`: ya es real). null si no hay ninguno.
export function pruebaDelDeck(deck) {
  const i = deck.laminas.findIndex(esPruebaReal);
  if (i >= 0) return { tipo: 'real', lamina: i + 1 };
  const j = deck.laminas.findIndex(l => sustitutoPrueba(l));
  return j >= 0 ? { tipo: sustitutoPrueba(deck.laminas[j]), lamina: j + 1 } : null;
}
const soloMaqueta = l => { const cs = capturasDe(l); return l.tipo === 'prueba' && cs.some(c => c.ejemplo === true) && cs.every(c => c.ejemplo === true || c.hueco); };
export function hayCifraCredibilidad(deck) {
  const L = deck.laminas, osc = L.findIndex(l => l.tipo === 'oscura' || l.oscura === true);
  const fin = osc >= 0 ? osc : Math.ceil(L.length * 0.6);
  return L.slice(0, fin).some(l => CIFRA_CREDIBILIDAD.test(sinAcentos([...textosVisibles(l), vozDe(l)].join(' '))));
}
// Propuesta, bloque 4 (ARCOS.md): quién la imparte con una cifra suya, antes de la inversión, y un caso o una prueba
export function hayCredencialProveedor(deck) {
  const L = deck.laminas, inv = L.findIndex(esInversion);
  return L.slice(0, inv >= 0 ? inv : L.length).some(l => CIFRA_PROVEEDOR.test(sinAcentos([...textosVisibles(l), vozDe(l)].join(' '))));
}
// Un caso: una prueba real, cualquier lámina con `fuente` o el hueco declarado de un caso ([CASO…])
export const hayCaso = deck => hayPruebaReal(deck) || deck.laminas.some(l => conTexto(l.fuente) || /\[CASO[A-Z0-9_]*\]/.test(textosVisibles(l).join(' ')));
export function reglasCredibilidad(deck) {
  const avisos = [], p = deck.pieza, L = deck.laminas;
  // la propuesta no lleva muro de capturas: bloque 4 de ARCOS (quién la imparte y un caso). Avisos orientativos.
  if (p === 'propuesta') {
    if (!hayCredencialProveedor(deck)) avisos.push('la propuesta no dice quién la imparte con una cifra suya (años, clientes, empresas, «desde 20XX»): va antes de la inversión (ARCOS.md, propuesta, bloque 4). «40 personas» del cliente no cuenta. Si no hay cifra real, un sustituto de GUION §7; nunca inventada');
    if (!hayCaso(deck)) avisos.push('la propuesta no trae un caso ni una prueba: un caso parecido al suyo con números y «fuente», o `{{CASO}}` declarado como pendiente; sin caso real, un sustituto de GUION §7 (ARCOS.md, propuesta, bloque 4)');
    return { errores: [], avisos };
  }
  if (!PIEZAS_VENTA.includes(p)) return { errores: [], avisos };
  const pr = pruebaDelDeck(deck);
  if (pr && pr.tipo !== 'real') {
    L.forEach((l, i) => { if (soloMaqueta(l)) avisos.push(`${nombre(deck, i)} es una maqueta EJEMPLO en el tramo de prueba: en un ${p} se lee como «no hay pruebas»; la prueba del deck es el sustituto de la lámina ${pr.lamina} (GUION §7)`); });
  } else if (!pr) {
    avisos.push(`sin prueba real en el ${p}: pide 1-3 capturas con permiso o usa un sustituto de GUION §7 (demostración con material real, caso con números y «fuente», dato de mercado publicado con «fuente» (búscalo, no de memoria), prueba lógica con la tasa en la condición o con «fuente», primeros casos con garantía medible)`);
    L.forEach((l, i) => { if (soloMaqueta(l)) avisos.push(`${nombre(deck, i)} es una maqueta EJEMPLO en el tramo de prueba: en un ${p} se lee como «no hay pruebas»; cámbiala por una captura real o por un sustituto (GUION §7)`); });
  }
  if (!hayCifraCredibilidad(deck)) avisos.push(`credibilidad sin cifra: di años, clientes o eventos reales antes de la revelación (GUION §7, beat 2: «desde 2016, más de 23,000 clientes»); si no los hay, omítelo, no lo inventes`);
  return { errores: [], avisos };
}

// ---------- propuesta: el arco de 9 bloques (ARCOS.md, Propuesta) ----------
// Avisos orientativos (una propuesta real puede no tener garantía; entonces dice cómo se cuidan los riesgos). Las
// láminas crudas (antes de sustituir `datos`) dicen si un número del cliente vino de un {{MARCADOR}}.
const NO_INCLUYE = /(^|\s)no incluye\b/;
const MESES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';
const VIGENCIA = new RegExp(`\\{\\{\\s*(fecha|vigencia)|\\[(fecha|vigencia)|vigente hasta|vigencia|valida hasta|\\b\\d{1,2} de (${MESES})\\b|\\b\\d{1,2}/\\d{1,2}(/\\d{2,4})?\\b|\\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo) \\d{1,2}\\b`);
const SALIDA = /garant|si no .{0,60}(devolv|reembols|cobr)|condicion de salida|riesgos?\b|puedes (cancelar|salir)|sin penalizacion/;
const COSTO = /[$€]|\b(mxn|usd)\b|\[costo|\{\{\s*costo|\bcosto|\bcuesta|\bpierde|\bperdid|\bperdemos|\bpierden/;
const SUPUESTO = /^\s*(pongamos|supongamos|imaginemos|digamos) que\b/;
const todoTexto = l => sinAcentos([...textosVisibles(l), vozDe(l)].join(' / '));
export function reglasPropuesta(deck, { crudo } = {}) {
  const avisos = [];
  if (deck.pieza !== 'propuesta') return { errores: [], avisos };
  const L = deck.laminas, C = crudo && Array.isArray(crudo.laminas) && crudo.laminas.length === L.length ? crudo.laminas : L;
  if (!L.some(l => textosVisibles(l).some(t => NO_INCLUYE.test(sinAcentos(t))))) avisos.push('la propuesta no dice qué NO incluye: una `lista` con encabezado «No incluye» evita el malentendido al firmar (ARCOS.md, propuesta, bloque 6)');
  if (!L.some(l => VIGENCIA.test(todoTexto(l)))) avisos.push('la propuesta no trae fecha ni vigencia: el siguiente paso lleva {{FECHA}} de arranque y «vigente hasta {{VIGENCIA}}» (ARCOS.md, propuesta, bloque 9)');
  if (!L.some(l => SALIDA.test(todoTexto(l)))) avisos.push('la propuesta no dice qué pasa si no funciona: una garantía con plazo y condición medible, una condición de salida o «riesgos y cómo se cuidan» (ARCOS.md, propuesta, bloque 8)');
  // Inversión anclada: el costo de no hacer nada, en dinero, en la misma lámina o en la anterior
  const inv = L.findIndex(esInversion);
  if (inv >= 0) {
    const previa = L.slice(0, inv).reverse().find(l => l.tipo !== 'camara');
    const lineas = textosVisibles(L[inv]).filter(t => !INVERSION.test(sinAcentos(t)));
    if (!lineas.some(t => COSTO.test(sinAcentos(t))) && !(previa && COSTO.test(sinAcentos(textosVisibles(previa).join(' '))))) {
      avisos.push(`${nombre(deck, inv)}: la inversión sale sin ancla: arriba, en gris, el costo de no hacer nada en la misma unidad y periodo («Hoy: {{HORAS_PERDIDAS}} h × {{COSTO_HORA}} = {{COSTO_MES}} al mes»), o ese costo en la lámina anterior (ARCOS.md, propuesta, bloque 7; LAYOUTS.md, «Inversión anclada»)`);
    }
  }
  // Los números del cliente vienen de la llamada de diagnóstico, no de «Pongamos que…»
  L.forEach((l, i) => {
    if (!['cifra', 'rejilla', 'grafica'].includes(l.tipo) || conTexto(l.fuente)) return;
    const voz = Array.isArray(l.voz) ? l.voz : [vozDe(l)];
    if (!voz.some(v => SUPUESTO.test(sinAcentos(v)))) return;
    if (/\{\{/.test(JSON.stringify(C[i] || {}))) return;
    avisos.push(`${nombre(deck, i)}: los números del cliente salen de «Pongamos que…»: en una propuesta vienen de la llamada de diagnóstico, con \`fuente: "llamada de diagnóstico"\` o como {{MARCADOR}} declarado en "datos" (ARCOS.md, propuesta, bloque 1; la excepción de GUION §3.8 d es para clases y VSL)`);
  });
  return { errores: [], avisos };
}

// ---------- oferta: escasez, garantía y bonos (GUION §7, beats 7b, 8 y la garantía) ----------
// Todo dato de oferta es real. Se lee el deck CRUDO: «Quedan {{CUPOS}} lugares» con su dato no es escasez inventada,
// y «Quedan solo 3 lugares» escrito a mano sí. Lo tachado (~~…~~, `tachado: true`) y la lámina con emoji negado
// enseñan lo que NO se hace (neuroventas: «~~Precio especial solo hoy~~»): ahí no se marca.
// «precio especial» solo cuenta con plazo («precio especial hasta el viernes»): «precio especial por volumen» de una
// propuesta B2B no es urgencia
// «Te quedan 2 semanas de práctica» no es escasez: «quedan N» cuenta solo con lugares, cupos, boletos…
const ESCASEZ = /solo hoy|precio especial (solo )?(hoy|por hoy|esta semana|este mes|hasta|por tiempo)|quedan (solo )?\d+ (lugares|cupos|asientos|boletos|espacios|plazas|unidades)|ultimos? \d+ (lugares|cupos)|cierra (hoy|manana)|oferta termina/;
// La escasez inventada solo se revisa en un deck que VENDE (sin pieza, libre, VSL, webinar, propuesta, o con una
// lámina de oferta): un tutorial que enseña a anunciar «cierra mañana a las 10 pm» no está vendiendo nada.
const PIEZAS_QUE_VENDEN = ['vsl', 'vsl-corto', 'webinar', 'propuesta'];
const vendeElDeck = deck => !deck.pieza || deck.pieza === 'libre' || PIEZAS_QUE_VENDEN.includes(deck.pieza) || deck.laminas.some(pareceOferta);
const PLAZO_GARANTIA = /\d+\s*(dias|semanas|meses|anos)\b|\{\{\s*garantia|\[garantia/;
const CONDICION = /\bsi\b|\bcondicion|\bsiempre que\b|\bcuando\b/;
const negada = l => [].concat(l.emoji || []).some(e => typeof e === 'string' && /^no:/.test(e.trim()));
// Textos crudos de una lámina sin lo tachado; `tachada` dice si la lámina enseña algo tachado
function textosSinTachar(l) {
  const out = [];
  let tachada = false;
  const ir = (x, k) => {
    if (k && noVisible(k) && k !== 'voz') return;
    if (typeof x === 'string') { if (/~~/.test(x)) tachada = true; const t = x.replace(/~~[\s\S]*?~~/g, ' '); if (t.trim()) out.push(t); }
    else if (Array.isArray(x)) x.forEach(y => ir(y, k === 'voz' ? 'voz' : null));
    else if (x && typeof x === 'object') { if (x.tachado === true) { tachada = true; return; } Object.entries(x).forEach(([kk, v]) => ir(v, kk)); }
  };
  ir(l, null);
  return { textos: out, tachada };
}
export function reglasOferta(deck, { crudo } = {}) {
  const errores = [], avisos = [];
  const L = deck.laminas, C = crudo && Array.isArray(crudo.laminas) && crudo.laminas.length === L.length ? crudo.laminas : L;
  const vende = vendeElDeck(deck);
  C.forEach((l, i) => {
    if (!l || typeof l !== 'object' || l.tipo === 'camara' || negada(l)) return;
    const { textos, tachada } = textosSinTachar(l);
    const vistos = tachada ? textos.filter(t => !vozDe(l).includes(t)) : textos;   // con algo tachado, la voz lo explica
    const txt = sinAcentos(vistos.map(t => plano(t)).join(' / '));
    const m = vende && txt.match(ESCASEZ);
    if (m) errores.push(`${nombre(deck, i)}: «${m[0]}» es escasez o urgencia sin dato confirmado: usa {{CUPOS}} o {{FECHA_LIMITE}} con su valor real en "datos", o quítala (GUION §7, beat 8)`);
    const todo = sinAcentos(textos.map(t => plano(t)).join(' / '));
    const escudo = [].concat(l.emoji || []).some(e => typeof e === 'string' && e.includes('🛡'));
    if ((/garantia/.test(todo) || (escudo && /sin riesgo|\btotal\b/.test(todo))) && !PLAZO_GARANTIA.test(todo) && !CONDICION.test(todo)) {
      avisos.push(`${nombre(deck, i)}: garantía sin plazo ni condición medible: di cuántos días ({{GARANTIA_DIAS}}), qué tiene que pasar ({{GARANTIA_CONDICION}}) y cómo se reclama; «total» o «sin riesgo» no dicen nada (GUION §7, garantía)`);
    }
    if (l.tipo === 'stack' && Array.isArray(l.items)) {
      const esBono = it => it && typeof it === 'object' && /\bbono\b/i.test(sinAcentos(JSON.stringify([it.texto, it.sub])));
      const sinDato = l.items.filter(it => esBono(it) && !/\{\{\s*BONO/.test(JSON.stringify(it)));
      if (sinDato.length) avisos.push(`${nombre(deck, i)}: ${sinDato.length === 1 ? 'el bono' : `${sinDato.length} bonos`} sin dato (${sinDato.map(it => `«${plano(String(it.texto || it.sub || '')).slice(0, 30)}»`).join(', ')}): cada bono se nombra con {{BONO_N}} confirmado en "datos" y va con \`sub: "Bono #N"\` (GUION §7, beat 7b)`);
      const primero = l.items.findIndex(esBono);
      if (primero >= 0 && l.items.slice(primero).some(it => !esBono(it))) avisos.push(`${nombre(deck, i)}: un bono va antes de una pieza base: los bonos van al final del stack (GUION §7, beat 7b)`);
    }
  });
  return { errores, avisos };
}

// ---------- ¿qué le falta a una pieza de venta para llamarse final? (SKILL §6) ----------
// Claves cortas, con los mismos predicados que los avisos. Solo en piezas que venden; una clase con nota ≥ 90 es final.
export function faltaParaFinal(deck) {
  const p = deck.pieza, falta = [];
  if (PIEZAS_VENTA.includes(p)) {
    if (!pruebaDelDeck(deck)) falta.push('prueba real');
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
// Inventario para qa.json → iconos: { "emoji (concepto de EMOJIS.md)": ["lámina N · texto", …] }. Quien revisa ve
// «💬 (comentar una palabra): lámina 14 · Te preguntan» y lo cambia por 📲. No hay regla automática que compare el texto
// con el concepto: se probó y daba ~27 alertas por 2 aciertos (el texto describe la frase, no el ícono).
export const claveIcono = (x, spec) => `${x} (${conceptoDe(spec || x) || 'fuera del diccionario'})`;
export function inventarioIconos(deck) {
  const inv = {};
  deck.laminas.forEach((l, i) => emojisDeLamina(l).forEach(e => {
    const spec = `${e.prefijo ? e.prefijo + ':' : ''}${e.base}${e.insignia ? '+' + e.insignia : ''}`;
    // la negación va en la clave: «no:🧮 (…)» junto a «🧮 (…)» deja ver que el mismo emoji se niega en otra lámina [r5]
    const base = e.prefijo ? `${e.prefijo}:${e.base}` : e.base;
    for (const [x, sp] of [[base, spec], [e.insignia, e.insignia]].filter(([x]) => x)) {
      const k = claveIcono(x, sp), r = `lámina ${i + 1}${e.texto ? ` · ${e.texto}` : ''}`;
      (inv[k] = inv[k] || []).includes(r) || inv[k].push(r);
    }
  }));
  return inv;
}
// Emojis de base que no están en el diccionario (una sola línea de info, sin restar nota)
export function infoIconos(deck) {
  const fuera = [...new Set(deck.laminas.flatMap(emojisDeLamina).filter(e => e.base && !conceptoDe(`${e.prefijo ? e.prefijo + ':' : ''}${e.base}`)).map(e => e.base))];
  return fuera.length ? `emojis fuera del diccionario (${fuera.join(' ')}): usa uno de EMOJIS.md o agrégalo con su concepto; revisa en qa.json → iconos que cada lámina diga el concepto de su emoji` : null;
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
  // c) un `no:X` que niega el ícono de un paso del mapa (`pasos.iconos`, también el que vuelve con `como`) o un emoji que
  // otra lámina afirma con `si:X`: el ábaco tachado de «¿Por qué subiste?» se leía «no calcules» cinco láminas después de
  // «Paso 1 · Calcula» [r5, precios-premium 22]. La objeción que es PREGUNTA va con 🤔 (EMOJIS.md, objeción).
  const mapa = new Map();
  L.forEach((l, i) => {
    if (!l || l.tipo !== 'pasos' || !Array.isArray(l.iconos)) return;
    l.iconos.forEach((ic, k) => {
      const b = typeof ic === 'string' ? sinSelector(analizarCompuesto(ic).base) : '';
      const et = Array.isArray(l.etiquetas) && typeof l.etiquetas[k] === 'string' ? plano(l.etiquetas[k]) : '';
      if (b && !mapa.has(b)) mapa.set(b, { i, k, et });
    });
  });
  const afirmados = new Map();
  usos.forEach((es, i) => es.forEach(e => { if (e.prefijo === 'si' && !afirmados.has(e.base)) afirmados.set(e.base, i); }));
  usos.forEach((es, j) => {
    const vistosJ = new Set();
    es.filter(e => e.prefijo === 'no' && !vistosJ.has(e.base)).forEach(e => {
      vistosJ.add(e.base);
      // Antes del mapa, el ícono negado es el dolor que ese paso resuelve («no:📅 una cita que se va» → «Paso 3 · Agenda»):
      // vale. Después del mapa, o en una objeción, se lee como «no hagas el paso N».
      const m = mapa.get(e.base);
      if (m && (j > m.i || esObjecion(L[j]))) avisos.push(`${nombre(deck, j)}: no:${e.base} niega el paso ${m.k + 1}${m.et ? ` («${m.et}»)` : ''} del mapa de la ${nombre(deck, m.i)}: se lee «no hagas el paso ${m.k + 1}»; si la objeción es una pregunta usa 🤔, si es «me falta X» niega lo que falta (EMOJIS.md, objeción)`);
      else if (afirmados.has(e.base) && afirmados.get(e.base) !== j) avisos.push(`${nombre(deck, j)}: no:${e.base} niega el mismo emoji que la ${nombre(deck, afirmados.get(e.base))} afirma con si:${e.base}: el ícono dice lo contrario en el mismo deck; cambia uno (EMOJIS.md, objeción)`);
    });
  });
  // d) un emoji ROJO (🎯 ❤️ 🧰 📌) negado con `no:` o tachado en una lista: la ✕ y el tachón son rojos y se funden con él
  // (medido: % del glifo a ΔE < 25 del rojo de la tinta, contraste-emojis.json → rojo) [r5, prueba-no]
  const rojo = contrasteMedido().rojo || {};
  const setsR = deck.emoji === 'apple' || deck.emoji === 'fluent' ? [deck.emoji] : ['apple', 'fluent'];
  const pctR = b => Math.max(0, ...setsR.map(set => (esGlifoDibujado(b, set) ? (rojo.svg || {})[b] : (rojo[set] || {})[b]) ?? 0));
  L.forEach((l, i) => {
    const bases = new Set(usos[i].filter(e => e.prefijo === 'no').map(e => e.base));
    if (l && l.tipo === 'lista' && Array.isArray(l.items)) l.items.forEach(it => { if (it && typeof it === 'object' && it.tachado && typeof it.emoji === 'string') bases.add(sinSelector(analizarCompuesto(it.emoji).base)); });
    const rojos = [...bases].filter(b => b && pctR(b) >= 30);
    if (rojos.length) avisos.push(`${nombre(deck, i)}: ${rojos.join(' ')} ${rojos.length > 1 ? 'son rojos' : 'es rojo'} y va negado o tachado: la ✕ y el tachón rojos se funden con el emoji; usa otro de EMOJIS.md para ese concepto`);
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

// ---------- citas bibliográficas escritas como nota ----------
// «Johansson y Hall, revista Science (2005)» en `nota` sale en Caveat de 60 px; la misma función en otra lámina salía
// en la `fuente` gris de 40: dos jerarquías para lo mismo. En los diseños que aceptan `fuente`, una nota con forma de
// cita (Autor … (año)) avisa. La atribución a mano sin año («Antonio Damasio, neurocientífico») sigue siendo nota.
export const CON_FUENTE = new Set(['idea', 'flujo', 'grafica', 'cifra', 'cita', 'rejilla', 'tabla', 'tarjetas', 'linea-tiempo']);
export const RE_CITA = /[A-ZÁÉÍÓÚÑ][\p{L}'-]+(\s+(y|e|&)\s+[A-ZÁÉÍÓÚÑ][\p{L}'-]+|\s+et al\.)?.*\((1[89]|20)\d\d\)/u;
// `rejilla`, `tabla`, `tarjetas` y `linea-tiempo` también llevan `fuente` (r5): el gancho con un dato publicado la trae en la
// misma lámina, porque la primera vista es muda (GUION §6.1)
export function reglasFuente(deck, { crudo } = {}) {
  const avisos = [];
  const L = deck.laminas, C = crudo && Array.isArray(crudo.laminas) && crudo.laminas.length === L.length ? crudo.laminas : L;
  L.forEach((l, i) => {
    if (!CON_FUENTE.has(l.tipo) || typeof l.nota !== 'string' || !RE_CITA.test(plano(l.nota))) return;
    avisos.push(`${nombre(deck, i)}: la nota «${plano(l.nota).slice(0, 50)}» parece una cita: ponla en "fuente" (un solo estilo: Autor, obra (año); sans gris al pie)`);
  });
  // Una rejilla que AFIRMA una proporción («54 de 100 no lo terminaron», puntos con destacados) sin fuente: ¿dato
  // publicado? Una pregunta («¿El 99%…?») o un ejemplo dicho como tal («Imagina 100…», «Pongamos…») no afirman nada.
  L.forEach((l, i) => {
    if (!l || l.tipo !== 'rejilla' || l.multitud === true || conTexto(l.fuente) || /\{\{/.test(JSON.stringify(C[i] || {}))) return;
    const txt = sinAcentos(plano([l.encabezado, l.texto, l.anotacion].filter(x => typeof x === 'string').join(' / ')));
    const proporcion = (l.punto && Array.isArray(l.destacar) && l.destacar.length) || /\b\d+\s+de\s+(cada\s+)?\d+\b|\d\s*%/.test(txt);
    if (!proporcion || /[¿?]|\b(imagina|pongamos|supongamos|digamos|si)\b/.test(txt)) return;
    avisos.push(`${nombre(deck, i)}: ¿dato publicado? dale "fuente" (Autor, obra (año)) en la misma lámina; si es un ejemplo, dilo en el encabezado («Imagina 100…», «Pongamos…») (GUION §6.1)`);
  });
  return { errores: [], avisos };
}

// ---------- claves del deck que nadie lee ----------
// `_datos`, `_marca`, `_duracion`: un aviso de entrega escondido en el deck no llega al usuario. Lo que el
// usuario debe saber va en qa.json (datos propuestos, firma, duración) o en el mensaje de entrega.
const CLAVES_DECK = new Set(['$schema', 'titulo', 'formato', 'emoji', 'animacion', 'idioma', 'marca', 'pieza', 'duracion_objetivo', 'en_vivo', 'clase', 'datos', 'laminas', 'piel', '_comentario']);
export function reglasClaves(deck) {
  const avisos = [];
  Object.keys(deck).filter(k => !CLAVES_DECK.has(k)).forEach(k => avisos.push(k.startsWith('_')
    ? `«${k}» no lo lee nadie: un dato sin confirmar va en "datos" como { "valor", "propuesto": true }, la firma en "marca" y lo demás se dice al entregar (SKILL §4)`
    : `«${k}» no es un campo del deck y se ignora (campos: ${[...CLAVES_DECK].filter(c => !c.startsWith('_') && c !== '$schema').join(', ')})`));
  return { errores: [], avisos };
}

// ---------- información que NO resta nota (qa.json → info) ----------
// El set de emojis sin fijar: el mismo deck sale en Apple en una Mac y en Fluent en Linux (SKILL §3). Es un consejo,
// no un defecto: los decks heredados con `auto` no bajan de nota.
export function infoEmoji(crudo) {
  const e = crudo && crudo.emoji;
  if (e === 'apple' || e === 'fluent') return null;
  return `emoji sin fijar (${e ? '"auto"' : 'sin el campo'}): el mismo deck sale en Apple en una Mac y en Fluent en Linux; fija "emoji": "apple" o "fluent" (SKILL §3, EMOJIS.md «Qué set usar»)`;
}
// Sin firma: dónde se llena la ficha global (marca.mjs). "marca": false es a propósito y no se menciona.
export function infoFirma(crudo, { aplicada = null, rutaGlobal = '~/.config/diapositivas-pizarron-ia/MI-MARCA.md' } = {}) {
  if (!crudo || crudo.marca === false) return null;
  if (aplicada) return `firma tomada de ${aplicada}: cópiala a "marca" en deck.json para que el deck salga igual en otra máquina (SKILL §0.4)`;
  if (crudo.marca && typeof crudo.marca === 'object') return null;
  return `va sin firma: llena «Texto» en ${rutaGlobal} (o corre bash scripts/setup.sh) y sale en todos tus decks; pon "marca": false si es a propósito (propuesta con la marca del cliente)`;
}

// Nota de QA: −12 por error y −3 por aviso. Con datos por confirmar, el deck es BORRADOR y la nota no pasa de
// TOPE_BORRADOR: un VSL con el nombre del programa inventado nunca sale como final. Los huecos declarados no restan
// (qa.mjs no los pasa en `avisos`): ya los representa el tope; restarlos premiaba borrar el caso o la prueba.
export const TOPE_BORRADOR = 90;
// La nota SIN el tope del borrador: distingue un borrador limpio (100) de uno con 3 avisos (91), que el tope iguala en 90.
export const notaSinTope = ({ errores = [], avisos = [] } = {}) => Math.max(0, 100 - 12 * errores.length - 3 * avisos.length);
export function notaQA({ errores = [], avisos = [], porConfirmar = {} } = {}) {
  const n = notaSinTope({ errores, avisos });
  return Object.keys(porConfirmar).length ? Math.min(n, TOPE_BORRADOR) : n;
}
// Estado, en orden: con errores → borrador → bajo-90 → falta-venta → listo. Los errores mandan aunque haya datos por
// confirmar: un hueco declarado no puede esconder una marca rota o una firma de relleno a quien lee solo `estado`.
export function estadoQA({ errores = [], borrador = false, nota = 100, falta = [], notaFinal = 90 } = {}) {
  return errores.length ? 'con errores' : borrador ? 'borrador' : nota < notaFinal ? 'bajo-90' : falta.length ? 'falta-venta' : 'listo';
}

// Todas juntas
// `crudo`: el deck antes de sustituir `datos` (qa.mjs lo pasa); dice si un número vino de un {{MARCADOR}}
export function revisarDeck(deck, pasos, { dirDeck, crudo, marca } = {}) {
  const ritmo = reglasRitmo(deck, pasos), propia = reglasAfirmacionPropia(deck), tasa = reglasTasa(deck, { crudo }), promesa = reglasPromesa(deck);
  const cierre = cierreDeClase(deck, { crudo });
  const partes = [reglasFirma(deck), reglasDuracion(deck, pasos), reglasApertura(deck, pasos), reglasVoz(deck, palabrasProhibidas(dirDeck, marca)),
    reglasProyeccion(deck), reglasPrueba(deck), reglasArco(deck), reglasObjecion(deck), reglasCredibilidad(deck), reglasDescargo(deck), reglasIconos(deck),
    reglasClaves(deck), reglasFuente(deck, { crudo }), ritmo, propia, reglasPropuesta(deck, { crudo }), reglasOferta(deck, { crudo }),
    reglasDemostracion(deck), tasa, promesa, cierre];
  return {
    errores: partes.flatMap(p => p.errores),
    avisos: partes.flatMap(p => p.avisos),
    duracion: partes[1].estimado,
    iconos: inventarioIconos(deck),
    ritmo: ritmo.ritmo,
    porConfirmar: { ...propia.porConfirmar, ...tasa.porConfirmar, ...promesa.porConfirmar, ...cierre.porConfirmar, ...Object.fromEntries(huecosDePrueba(deck).map(n => [`CAPTURA_${n}`, { valor: '', laminas: [n], pendiente: true,
      motivo: 'falta la captura real (o marca "plantilla": true si el espectador pone la suya)' }])) },
    faltaParaFinal: faltaParaFinal(deck),
    prueba: PIEZAS_VENTA.includes(deck.pieza) ? pruebaDelDeck(deck) : undefined,
  };
}
