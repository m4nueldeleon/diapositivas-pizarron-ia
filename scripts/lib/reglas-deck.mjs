// reglas-deck.mjs — reglas de QA que se leen en el deck.json (sin navegador): duración de la pieza, apertura,
// voz, proyecciones, pruebas de maqueta, prueba real y credibilidad, objeciones, descargos en pantalla, firma de
// relleno, llamado, coherencia emoji↔concepto y claves que nadie lee. qa.mjs las suma a sus hallazgos; aquí
// son funciones puras para probarlas rápido (pruebas/reglas-deck.test.mjs).
//
// Todas devuelven { errores: [], avisos: [] } con mensajes accionables que citan la referencia o el archivo.
import fs from 'node:fs';
import path from 'node:path';
import { plano } from './markup.mjs';
import { PIEZAS, minutosObjetivo, duracionTotal, duracionPorTipo, tiemposSecuenciales, mmss } from './tiempos.mjs';
import { DATO_DURO } from './layouts-datos.mjs';
import { analizarCompuesto, PARECIDOS } from './emoji.mjs';

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
// con objeto («Agenda tu diagnóstico», «Escribe "CITA"», «Entra a…»). Una palabra suelta en la voz («WhatsApp»,
// «aparta», «nos vemos») no es un llamado.
const IMPERATIVO = /^(da(le)? clic|haz clic|dale click|agenda (tu|una|aqui|hoy|ya)|aplica( (aqui|hoy|ya|en))?|escribe(me|nos)? (["«]|la palabra|aqui|al|a mi|por)|comenta (["«]|la palabra|aqui)|manda(me|nos)? (un )?(dm|mensaje|whatsapp)|entra (a|al|en)|inscribete|registrate|reserva (tu|aqui|ya)|aparta tu (lugar|silla|cupo)|unete|descarga|pide tu|reclama tu|toca (el|aqui)|visita)\b/;
export const esLlamadoVisible = l => l.llamado === true || l.tipo === 'boton' || textosVisibles(l).some(t => IMPERATIVO.test(sinAcentos(t).replace(/^[^a-z0-9"«]+/, '')));
// Cierre de una clase: más flexible (también en la voz): próxima clase, nos vemos el…, siguiente paso, comunidad
const LLAMADO_CIERRE = /\b(proxima clase|nos vemos (el|en|la)|te espero|siguiente paso|unete|comunidad|inscribete|registrate|link|liga)\b/;
const esCierre = l => esLlamadoVisible(l) || LLAMADO_CIERRE.test(sinAcentos([...textosVisibles(l), vozDe(l)].join(' ')));
export function reglasArco(deck) {
  const avisos = [], p = deck.pieza;
  const L = deck.laminas;
  if (['clase', 'clase-corta', 'webinar', 'vsl', 'vsl-corto'].includes(p)) {
    const ultimas = L.map((l, i) => [l, i]).filter(([l]) => l.tipo !== 'camara').slice(-3);
    const cierra = p === 'clase' || p === 'clase-corta' ? esCierre : esLlamadoVisible;
    if (ultimas.length && !ultimas.some(([l]) => cierra(l))) avisos.push(`el deck (${p}) termina sin llamado visible ni siguiente paso: cierra con qué hacer ahora (botón, palabra clave, link o próxima clase) a la vista, no solo en la voz (ARCOS.md)`);
  }
  if (['clase', 'clase-corta', 'reel'].includes(p)) {
    const osc = L.map((l, i) => (l.tipo === 'oscura' || l.oscura ? i + 1 : 0)).filter(Boolean);
    if (osc.length) avisos.push(`láminas oscuras en un(a) ${p} (${osc.join(', ')}): la oscura revela un producto en webinars y VSL; aquí basta el puente al siguiente paso (ARCOS.md)`);
  }
  if (['webinar', 'vsl', 'vsl-corto'].includes(p)) {
    // láminas contiguas (sin contar cámara) cuentan como UN llamado: el botón y su «Después del clic»
    const sinCam = L.filter(l => l.tipo !== 'camara');
    let n = 0;
    sinCam.forEach((l, i) => { if (esLlamadoVisible(l) && !(i > 0 && esLlamadoVisible(sinCam[i - 1]))) n++; });
    if (n < 2) avisos.push(`el llamado visible aparece ${n} ${n === 1 ? 'vez' : 'veces'}; en un(a) ${p} va al menos 2 veces a la vista (botón o palabra clave): después de la prueba y al final, con qué pasa después del clic (GUION §7). Una palabra suelta («WhatsApp», «aparta») no cuenta; marca con "llamado": true la lámina que muestra la palabra clave o la flecha al link`);
    // Objeciones antes del botón [34:17-36:00]: `idea` con «Objeción #N» o «Razón #N» y la respuesta en la
    // siguiente. Se busca antes del primer llamado de la oferta (el primero después de la oscura; si no hay
    // oscura, el primero del deck): un llamado temprano de webinar no cuenta.
    const osc = L.findIndex(l => l.tipo === 'oscura' || l.oscura === true);
    let lim = L.findIndex((l, i) => i > osc && esLlamadoVisible(l));
    if (lim < 0) lim = L.length;
    if (!L.slice(0, lim).some(esObjecion)) avisos.push(`ninguna objeción antes del llamado: agrega ${p === 'vsl-corto' ? '1 lámina' : '1-2 láminas'} \`idea\` con encabezado «Objeción #N» o «Razón #N» (emoji negado, la objeción en negrita) y la respuesta con un dato o un paso en la siguiente; salen del público real, no se inventan (ARCOS.md, GUION §7)`);
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
const CIFRA_CREDIBILIDAD = /\b\d[\d,.]*\s*\+?\s*(anos|clientes|alumnos|estudiantes|eventos|empresas|negocios|personas|asistentes)\b|\bdesde (19|20)\d\d\b/;
export function reglasCredibilidad(deck) {
  const avisos = [], p = deck.pieza, L = deck.laminas;
  if (!PIEZAS_VENTA.includes(p)) return { errores: [], avisos };
  if (!L.some(esPruebaReal)) {
    avisos.push(`sin prueba real en el ${p}: pide 1-3 capturas con permiso o usa un sustituto de GUION §7 (demostración con material real, caso con números y «fuente», prueba lógica, primeros casos con garantía medible)`);
    L.forEach((l, i) => {
      const cs = capturasDe(l);
      if (l.tipo === 'prueba' && cs.some(c => c.ejemplo === true) && cs.every(c => c.ejemplo === true || c.hueco)) avisos.push(`${nombre(deck, i)} es una maqueta EJEMPLO en el tramo de prueba: en un ${p} se lee como «no hay pruebas»; cámbiala por una captura real o por un sustituto (GUION §7)`);
    });
  }
  const osc = L.findIndex(l => l.tipo === 'oscura' || l.oscura === true);
  const fin = osc >= 0 ? osc : Math.ceil(L.length * 0.6);
  const hay = L.slice(0, fin).some(l => CIFRA_CREDIBILIDAD.test(sinAcentos([...textosVisibles(l), vozDe(l)].join(' '))));
  if (!hay) avisos.push(`credibilidad sin cifra: di años, clientes o eventos reales antes de la revelación (GUION §7, beat 2: «desde 2016, más de 23,000 clientes»); si no los hay, omítelo, no lo inventes`);
  return { errores: [], avisos };
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
const NO_EMOJI = new Set(['emoji_tam', 'emoji_lado', 'emoji_paso']);
const esCampoEmoji = k => k === 'emoji' || k === 'iconos' || (k.startsWith('emoji_') && !NO_EMOJI.has(k));
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
        (Array.isArray(v) ? v : [v]).filter(x => typeof x === 'string' && x.trim()).forEach(sp => {
          const c = analizarCompuesto(sp);
          if (c.base) out.push({ base: sinSelector(c.base), prefijo: c.prefijo, insignia: sinSelector(c.insignia), campo: k, texto });
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
  const partes = [reglasFirma(deck), reglasDuracion(deck, pasos), reglasApertura(deck, pasos), reglasVoz(deck, palabrasProhibidas(dirDeck)),
    reglasProyeccion(deck), reglasPrueba(deck), reglasArco(deck), reglasCredibilidad(deck), reglasDescargo(deck), reglasIconos(deck),
    reglasClaves(deck)];
  return {
    errores: partes.flatMap(p => p.errores),
    avisos: partes.flatMap(p => p.avisos),
    duracion: partes[1].estimado,
    iconos: inventarioIconos(deck),
  };
}
