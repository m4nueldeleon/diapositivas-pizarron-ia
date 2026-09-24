// Sincronía entre lo que entra en pantalla y la voz: reglas puras sobre el mapa real del motor.
import { plano } from './markup.mjs';

const normal = t => plano(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const nombre = (l, i) => `lámina ${i + 1} (${l.id || l.tipo})`;
const textoEtiqueta = t => {
  const s = String(t || '');
  const citas = [...s.matchAll(/«([^»]*)»/g)].map(m => m[1]);
  return (citas.length ? citas.join(' ') : s.replace(/^[^\p{L}\p{N}]+/u, '')).replace(/…$/, '');
};
const UNIDADES = 'cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciseis diecisiete dieciocho diecinueve veinte veintiuno veintidos veintitres veinticuatro veinticinco veintiseis veintisiete veintiocho veintinueve'.split(' ');
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
function numeroEscrito(n) {
  if (n < 30) return UNIDADES[n];
  if (n < 100) return DECENAS[Math.floor(n / 10)] + (n % 10 ? ` y ${UNIDADES[n % 10]}` : '');
  if (n === 100) return 'cien';
  return CENTENAS[Math.floor(n / 100)] + (n % 100 ? ` ${numeroEscrito(n % 100)}` : '');
}
const NUMEROS = new Map(Array.from({ length: 1000 }, (_, n) => [numeroEscrito(n), n]));
const RE_NUMEROS = new RegExp(`\\b(?:${[...NUMEROS.keys()].sort((a, b) => b.length - a.length).join('|')})\\b`, 'g');
function normalizarNumeros(t) {
  return normal(t).replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(RE_NUMEROS, m => String(NUMEROS.get(m) ?? 1))
    .replace(/\b(?:(\d+|un) )?(mil|millones|millon)\b/g, (_, n, escala) => String(Number(!n || n === 'un' ? 1 : n) * (escala === 'mil' ? 1000 : 1000000)))
    .replace(/\b(\d{4,}) (\d{1,3})\b/g, (_, miles, resto) => String(Number(miles) + Number(resto)));
}
function claves(t, enfasis = true) {
  const fuertes = enfasis ? [...String(t).matchAll(/\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|==([\s\S]+?)==/g)].map(m => m[1] || m[2] || m[3]) : [];
  const s = normalizarNumeros(fuertes.length ? fuertes.join(' ') : t);
  return new Set((s.match(/[a-z]+|\d+/g) || []).filter(w => fuertes.length || !enfasis || w.length > 3 || /^\d+$/.test(w)).map(w => /^\d+$/.test(w) ? w : w.slice(0, 5)));
}
const coincide = (a, b) => [...a].some(k => b.has(k));
const textoPlano = t => normal(textoEtiqueta(t));
const OMITIR_CAMPO = /^(?:tipo|id|voz|accion|si_falla|procedencia|credibilidad|anclas?|emoji.*|iconos|imagen|src|logo|fuente|como|paga|excepcion_persona|persona|sobre|centro|clic|cursor|revelar|fondo|sello_sobre|sello_pos|anclar|color|estilo|flecha|de|a|forma|grafica|lado|encabezado_pos|encabezado_estilo|posicion|tono.*|tam.*|_.*)$/;
function textosOriginales(l) {
  const ir = x => typeof x === 'string' ? [x] : Array.isArray(x) ? x.flatMap(ir)
    : x && typeof x === 'object' ? Object.entries(x).filter(([k]) => !OMITIR_CAMPO.test(k)).flatMap(([, v]) => ir(v)) : [];
  return ir(l);
}
function omisiones(l) {
  return [l.fuente, ...(['lista', 'tarjetas'].includes(l.tipo) ? [l.encabezado] : []),
    ...(Array.isArray(l.columnas) ? l.columnas : []), l.eje_x, l.eje_y,
    ...(['calificacion', 'tabla'].includes(l.tipo) ? (l.filas || []).map(f => f.texto || f.etiqueta) : [])]
    .filter(t => typeof t === 'string').map(normal);
}
function originalDe(et, originales) {
  const t = textoEtiqueta(et), limpio = normal(t);
  return originales.find(o => normal(o) === limpio) || originales.find(o => limpio.length > 5 && normal(o).startsWith(limpio)) || t;
}
function avisosLexicos(l, mapa, n, donde) {
  if (!Array.isArray(l.voz) || l.voz.length !== n || mapa.length !== n) return [];
  const voz = l.voz.map(t => claves(t, false)), originales = textosOriginales(l), omitir = omisiones(l);
  return mapa.flatMap((etiquetas, k) => {
    if (k === 0) return [];
    return etiquetas.flatMap(et => {
      if (/^(?:sello |tachón |se apaga |marco|trazo\b|cambio\b|flecha|clic\b|[★☆])/.test(et)) return [];
      const t = textoEtiqueta(et);
      if (!t || omitir.some(x => x === normal(t) || (normal(t).length > 5 && x.startsWith(normal(t))))) return [];
      const ks = claves(originalDe(et, originales));
      if (!ks.size || voz.slice(0, k + 1).some(v => coincide(ks, v))) return [];
      const j = voz.findIndex((v, p) => p > k && coincide(ks, v));
      return j < 0 ? [] : [`${donde}, paso ${k}: «${t}» se adelanta a la voz del paso ${j}; mueve su revelado o la frase al mismo paso (índices desde 0; GUION §1)`];
    });
  });
}
function avisosFuente(l, mapa, donde) {
  if (!l.fuente || !l.voz) return [];
  const voz = Array.isArray(l.voz) ? l.voz : [l.voz];
  // Los datos pendientes y el origen de un diagnóstico privado no son una atribución bibliográfica.
  if (/\{\{|\[[A-ZÁÉÍÓÚÑ_]+\]/.test(l.fuente) || /^(llamada de diagnostico|datos del cliente)\b/.test(normal(l.fuente))) return [];
  const fuente = normal(l.fuente), ks = claves(l.fuente, false);
  const observado = mapa.findIndex(xs => xs.some(et => fuente.startsWith(textoPlano(et)) && textoPlano(et).length > 4));
  const paso = l.fuente_paso ?? observado;
  if (paso <= 0) return [];
  const j = voz.findIndex((v, i) => i < paso && coincide(ks, claves(v, false)));
  return j < 0 ? [] : [`${donde}: la fuente llega tarde, se cita en voz en el paso ${j} y entra en el ${paso}; usa fuente_paso: ${j} (GUION §1; índices desde 0)`];
}
function avisosEstructurales(l, n, donde) {
  const avisos = [];
  if (l.tipo === 'linea-tiempo') {
    const tramos = l.tramos || [], ultimo = Math.max(0, ...tramos.map((t, j) => t.paso ?? j + 1));
    (l.marcas || []).forEach((m, j) => {
      if (!['r', 'v'].includes(m.tono) || m.paso == null) return;
      const i = tramos.findIndex(t => t.hasta === j), esperado = i < 0 ? ultimo : tramos[i].paso ?? i + 1;
      if (m.paso < esperado) avisos.push(`${donde}: la marca «${m.texto || j}» de tono ${m.tono} entra antes de su tramo; usa paso: ${esperado} o quita su paso explícito (GUION §1)`);
    });
  }
  if (n < 3) return avisos;
  const elementos = [l.sello && l.sello_paso === 0 ? 'sello' : '', /\{r:[^}]+\}/.test(l.nota || '') && l.nota_paso === 0 ? 'nota roja' : '',
    l.tachar_paso === 0 && (l.texto_paso ?? 0) === 0 && /~~/.test(String(l.texto || (l.lineas || [])[0] || '')) ? 'tachado' : ''].filter(Boolean);
  if (elementos.length) avisos.push(`${donde}: ${elementos.join(', ')} en el paso 0 adelanta el remate de una lámina de ${n} pasos; muévelo al beat que lo dice (GUION §1)`);
  return avisos;
}
export function reglasSincronia(deck, { pasos = [], revela = [] } = {}) {
  const avisos = (deck.laminas || []).flatMap((l, i) => {
    if (l.tipo === 'camara' || l.revelar === 'todo') return [];
    const mapa = revela[i] || [], n = pasos[i] || mapa.length || 1, donde = nombre(l, i);
    return [...avisosEstructurales(l, n, donde), ...avisosLexicos(l, mapa, n, donde), ...avisosFuente(l, mapa, donde)];
  });
  return { errores: [], avisos };
}

const EXCEPCIONES = new Set(['titulo-formula', 'cita', 'a-si-mismo', 'a-la-ia', 'uno-a-uno']);
const SINGULAR = /\b(tu|tus|te|ti|contigo|tomalo|escanealo|llevate|grabate)\b/;
// Lista explícita: nunca inferimos ustedes por una terminación -an/-en ni por su/sus/son/van.
const PLURAL = /\b(ustedes|miren|imaginen|anoten|levanten|escriban|hagan|tomenlo|tomenle|grabense|llevense)\b|\bles (dejo|pido|propongo|muestro|recomiendo|invito|comparto|digo)\b/;
const personaDe = (t, excepciones) => {
  const s = excepciones.reduce((texto, frase) => texto.replace(new RegExp(`(?<![a-z0-9])${frase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`, 'g'), ''), normal(String(t || '').replace(/«[^»]*»/g, '')));
  return { tu: SINGULAR.test(s), ustedes: PLURAL.test(s) };
};
export const infoPersona = deck => !deck.persona && deck.en_vivo !== true
  ? ['persona asumida: tu; declara persona si el trato será ustedes (VOZ-HUMANA.md)'] : [];

export function reglasPersona(deck, { pasos = [], revela = [] } = {}) {
  const errores = [], avisos = [];
  const excepciones = (Array.isArray(deck.persona_excepciones) ? deck.persona_excepciones : []).filter(t => typeof t === 'string' && t.trim()).map(normal);
  if (!deck.persona && deck.en_vivo === true) avisos.push('persona sin declarar: decide tu o ustedes antes del guion (VOZ-HUMANA.md)');
  (deck.laminas || []).forEach((l, i) => {
    if (EXCEPCIONES.has(l.excepcion_persona)) return;
    const mapa = revela[i] || [], n = pasos[i] || mapa.length || (Array.isArray(l.voz) ? l.voz.length : 1);
    const voz = Array.isArray(l.voz) ? l.voz : [l.voz || ''];
    const originales = textosOriginales(l);
    const pantalla = mapa.length ? mapa.map(xs => xs.map(et => originalDe(et, originales)).join(' ')) : [originales.join(' ')];
    for (let k = 0; k < n; k++) {
      const p = personaDe(pantalla.slice(0, k + 1).join(' '), excepciones), v = personaDe(voz[k], excepciones), donde = `${nombre(l, i)}, paso ${k}`;
      if (['tu', 'ustedes'].includes(deck.persona)) {
        const opuesta = deck.persona === 'tu' ? 'ustedes' : 'tu';
        if (p[opuesta] || v[opuesta]) errores.push(`${donde}: persona opuesta en ${[p[opuesta] && 'pantalla', v[opuesta] && 'voz'].filter(Boolean).join(' y ')}; el deck declara persona: "${deck.persona}". Mantén la misma persona o documenta excepcion_persona (GUION §1)`);
      } else if ((p.tu && v.ustedes) || (p.ustedes && v.tu)) {
        errores.push(`${donde}: pantalla y voz cambian entre tú y ustedes; elige persona: "tu" o "ustedes" y alinea ambas (VOZ-HUMANA.md)`);
      } else if ((p.tu && p.ustedes) || (v.tu && v.ustedes)) {
        avisos.push(`${donde}: mezcla tú y ustedes; fija la persona o marca la frase en persona_excepciones (VOZ-HUMANA.md)`);
      }
    }
  });
  return { errores, avisos };
}
