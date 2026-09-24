// reglas-deck.mjs — reglas de QA que se leen en el deck.json (sin navegador): duración de la pieza, apertura,
// voz, proyecciones, pruebas de maqueta, firma de relleno y llamado. qa.mjs las suma a sus hallazgos; aquí
// son funciones puras para probarlas rápido (pruebas/reglas-deck.test.mjs).
//
// Todas devuelven { errores: [], avisos: [] } con mensajes accionables que citan la referencia o el archivo.
import fs from 'node:fs';
import path from 'node:path';
import { plano } from './markup.mjs';
import { PIEZAS, minutosObjetivo, duracionTotal, tiemposSecuenciales, mmss } from './tiempos.mjs';
import { DATO_DURO } from './layouts-datos.mjs';

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
export function reglasDuracion(deck, pasos) {
  const errores = [], avisos = [];
  const est = duracionTotal(deck, pasos);
  const pieza = PIEZAS[deck.pieza] || null, vivo = deck.en_vivo === true;
  const objetivo = minutosObjetivo(deck.duracion_objetivo);
  const nomPieza = pieza ? pieza.nombre : 'pieza';
  const vivoNota = vivo ? ' En vivo amplías la voz de cada paso, pero cada paso sigue siendo un beat de 2-3 s: faltan beats, no palabras.' : '';
  const corto = (msg) => (vivo ? avisos : errores).push(msg);
  if (objetivo) {
    const r = est / (objetivo * 60);
    if (r < 0.5) corto(`la voz dura ~${mmss(est)} y el objetivo es ${mmss(objetivo * 60)}: el deck es menos de la mitad de su ${nomPieza}; escribe el guion completo con el arco de ARCOS.md.${vivoNota}`);
    else if (Math.abs(r - 1) > 0.3) avisos.push(`la voz dura ~${mmss(est)} contra un objetivo de ${mmss(objetivo * 60)} (${r > 1 ? '+' : ''}${Math.round((r - 1) * 100)}%): ajusta beats o el objetivo.${vivoNota}`);
  } else if (pieza) {
    if (est < pieza.min * 60 * 0.5) corto(`la voz dura ~${mmss(est)} y un(a) ${nomPieza} dura ${pieza.min}-${pieza.max} min: el deck es menos de la mitad; escribe el guion completo con el arco de ARCOS.md.${vivoNota}`);
    else if (est < pieza.min * 60 * 0.7 || est > pieza.max * 60 * 1.3) avisos.push(`la voz dura ~${mmss(est)}; un(a) ${nomPieza} dura ${pieza.min}-${pieza.max} min (ARCOS.md).${vivoNota}`);
  }
  if (deck.pieza === 'reel' && est > 60) avisos.push(`el reel dura ~${mmss(est)}: pasa de 60 s; recorta beats (ARCOS.md, reel)`);
  return { errores, avisos, estimado: est };
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
const LLAMADO = /\b(escribe(me)?|entra|agenda|aplica|link|liga|clic|comenta|guarda(lo)?|unete|inscribete|registrate|reserva|aparta|siguiente paso|proxima clase|nos vemos|te espero|whatsapp|mandame|dm)\b/;
const esLlamado = l => l.tipo === 'boton' || LLAMADO.test(sinAcentos([...textosVisibles(l), vozDe(l)].join(' ')));
export function reglasArco(deck) {
  const avisos = [], p = deck.pieza;
  const L = deck.laminas;
  if (['clase', 'webinar', 'vsl'].includes(p)) {
    const ultimas = L.map((l, i) => [l, i]).filter(([l]) => l.tipo !== 'camara').slice(-3);
    if (ultimas.length && !ultimas.some(([l]) => esLlamado(l))) avisos.push(`el deck (${p}) termina sin llamado ni siguiente paso: cierra con qué hacer ahora (comunidad, próxima clase, link o palabra clave) (ARCOS.md)`);
  }
  if (['clase', 'reel'].includes(p)) {
    const osc = L.map((l, i) => (l.tipo === 'oscura' || l.oscura ? i + 1 : 0)).filter(Boolean);
    if (osc.length) avisos.push(`láminas oscuras en un(a) ${p} (${osc.join(', ')}): la oscura revela un producto en webinars y VSL; aquí basta el puente al siguiente paso (ARCOS.md)`);
  }
  if (['webinar', 'vsl'].includes(p)) {
    const n = L.filter(l => l.tipo !== 'camara' && esLlamado(l)).length;
    if (n < 2) avisos.push(`el llamado aparece ${n} ${n === 1 ? 'vez' : 'veces'}; en un(a) ${p} va al menos 2 veces: después de la prueba y al final, con qué pasa después del clic (GUION §7)`);
  }
  return { errores: [], avisos };
}

// Todas juntas
export function revisarDeck(deck, pasos, { dirDeck } = {}) {
  const partes = [reglasFirma(deck), reglasDuracion(deck, pasos), reglasApertura(deck, pasos), reglasVoz(deck, palabrasProhibidas(dirDeck)),
    reglasProyeccion(deck), reglasPrueba(deck), reglasArco(deck)];
  return {
    errores: partes.flatMap(p => p.errores),
    avisos: partes.flatMap(p => p.avisos),
    duracion: partes[1].estimado,
  };
}
