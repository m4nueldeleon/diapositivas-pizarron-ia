// Revisión editorial: indicios comprobables, nunca una firma de calidad humana.
import { plano } from './markup.mjs';

const normal = x => plano(String(x || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = x => normal(x).split(' ').filter(w => w.length > 3);
// Familias explícitas: evitar un stemmer agresivo que equipare precio y precisión.
export function raicesTexto(x) {
  const familias = [/^entreg/, /^defin/, /^pag/, /^termin/, /^cambi/, /^revis/, /^cost|^car[oa]s?$|^precio/, /^tecnolog/, /^tiemp/, /^aprend/, /^comprob/];
  const vacias = new Set(['para','como','puedo','puede','puedes','quiero','tengo','todo','cada','rato','esta','estas','este','estos','pero','solo','nunca','siempre','ahora','hacer','tiene','tienes','seria','quien','cual','cuando','donde','porque']);
  return tokens(x).filter(w => !vacias.has(w)).map(w => {
    const i = familias.findIndex(r => r.test(w));
    return i >= 0 ? `familia${i}` : w.replace(/(?:es|s)$/,'');
  });
}
const CAMPOS_TEXTO = new Set(['texto','encabezado','nota','etiqueta','etiquetas','titulo','sub','lineas','items','mensajes','nodos','columnas','filas','arriba','abajo','valor']);
const extraer = x => typeof x === 'string' ? [x] : Array.isArray(x) ? x.flatMap(extraer) : x && typeof x === 'object' ? Object.entries(x).filter(([k]) => CAMPOS_TEXTO.has(k)).flatMap(([,v]) => extraer(v)) : [];
const contenido = l => extraer(Object.fromEntries(Object.entries(l).filter(([k]) => !['nota','anotaciones'].includes(k)))).join(' ');
const firma = l => [l.tipo, l.variante || '', l.items?.length || 0, l.mensajes?.length || 0, l.nodos?.length || 0, Boolean(l.sello), Boolean(l.anotaciones?.length)].join(':');
export function anotacionAporta(l, a) {
  if (!a.texto) return false;
  const base = new Set(raicesTexto(contenido(l))), t = normal(a.texto);
  const nueva = raicesTexto(a.texto).some(w => !base.has(w) && !['excelente','bueno','mejor','grand','importante','correcto','mismo','misma'].includes(w));
  // Consecuencia, precisión, contraste o veredicto observables. Un adjetivo no basta.
  const consecuencia = /\b(evit\w*|reduc\w*|permit\w*|impid\w*|ahorr\w*|pierd\w*|cuesta|porque|por eso|requiere|necesita|consume|pagado|costo)\b/;
  const contraste = /\b(sin|antes|despues|excepto|en vez|no es)\b/;
  const precision = /\b(hasta|desde|solo|cada|porcentaje|ano|primero|mientras|cuando|contigo|acompanamiento)\b|\d|\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/;
  const veredicto = /\b(comprueb\w*|comprobad\w*|verific\w*|acept\w*|rechaz\w*|sirve|falla|suficiente|falta|sobra|funciona|listos|decide|elige|acuerda|copia|pide|delimitar)\b/;
  // Una atribución concreta o una cita literal precisa el referente de su ancla.
  const referente = /\bexperiencia del equipo\b/.test(t) || /[«»"]/.test(String(a.texto));
  const aporte = [consecuencia, contraste, precision, veredicto].some(r => r.test(t)) || referente;
  return nueva && aporte;
}

export function funcionRetorica(l) {
  const t = normal(contenido(l));
  if (l.tipo === 'camara') return 'practica';
  if (l.tipo === 'chat' && l.mensajes?.some(m => m.de === 'yo') && l.mensajes?.some(m => m.de === 'otro')) return 'demostracion';
  if (/^(define|elige|escribe|anota|revisa|manda|abre|fija|confirma|delimita)\b/.test(t)) return 'instruccion';
  if (/\?/.test(contenido(l))) return 'pregunta';
  if (/^(sin|no necesitas|evita)\b/.test(t)) return 'descarte';
  if (/^(incluye|te llevas|sales con)\b/.test(t)) return 'inclusion';
  return null;
}

export function secuenciasRepetidas(deck) {
  const L = deck.laminas || [], hallazgos = [];
  // Tres ventanas contiguas de 4–8 láminas con la misma bolsa de estructuras.
  // Ordenar la firma detecta también la permutación del generador de la ronda 9.
  for (let n = 4; n <= 8; n++) {
    for (let i = 0; i + n * 3 <= L.length; i++) {
      const bloques = [0, 1, 2].map(k => L.slice(i + k * n, i + (k + 1) * n));
      const claves = bloques.map(b => b.map(firma).sort().join('|'));
      if (new Set(claves).size === 1) {
        hallazgos.push({ desde: i + 1, hasta: i + n * 3, longitud: n });
        i += n * 3 - 1;
      }
    }
  }
  return hallazgos.filter((h, i, a) => !a.some((x, j) => j < i && x.desde <= h.desde && x.hasta >= h.hasta));
}

const OFERTA = ['producto', 'publico', 'resultado', 'entrega', 'responsable', 'precio', 'garantia', 'bonos', 'llamado', 'siguiente', 'evidencia', 'fuente'];
const lleno = x => typeof x === 'string' && x.trim().length > 0 && !/\{\{|\[[A-Z_]+\]|por confirmar|pendiente/i.test(x);
export function integridadOferta(deck) {
  if (!['vsl', 'vsl-corto', 'webinar', 'propuesta'].includes(deck.pieza)) return { estado: 'no-aplica', faltan: [] };
  const ficha = deck.ficha_oferta || {};
  const faltan = OFERTA.filter(k => !lleno(ficha[k]));
  return { estado: faltan.length ? 'incompleta' : ficha.ejemplo === true ? 'ejemplo-completo' : 'documentada', faltan,
    evidencia: ficha.evidencia || null, verificacion_humana: 'pendiente' };
}

export function validarEditorial(deck) {
  const errores = [], f = deck.ficha_oferta;
  if (f != null) {
    if (!f || typeof f !== 'object' || Array.isArray(f)) errores.push('ficha_oferta debe ser un objeto');
    else for (const [k, v] of Object.entries(f)) {
      if (![...OFERTA, 'ejemplo'].includes(k)) errores.push(`ficha_oferta.${k}: campo desconocido`);
      else if (k === 'ejemplo' ? typeof v !== 'boolean' : typeof v !== 'string') errores.push(`ficha_oferta.${k}: tipo inválido`);
    }
  }
  if (deck.bloques != null) {
    if (!Array.isArray(deck.bloques)) errores.push('bloques debe ser una lista');
    else deck.bloques.forEach((b, i) => {
      if (!b || typeof b !== 'object' || !lleno(b.aprendizaje) || !lleno(b.desde) || !lleno(b.hasta)) {
        errores.push(`bloque ${i + 1}: exige desde, hasta y aprendizaje concretos`); return;
      }
      const inicio = deck.laminas.findIndex(l => l?.id === b.desde), fin = deck.laminas.findIndex(l => l?.id === b.hasta);
      if (inicio < 0 || fin < inicio) errores.push(`bloque ${i + 1}: intervalo de láminas inválido`);
      if (b.practico != null && typeof b.practico !== 'boolean') errores.push(`bloque ${i + 1}: practico debe ser booleano`);
    });
  }
  return errores;
}

function demostracionVisible(l, aprendizaje = '') {
  const archivo = /descarg|archivo|herramienta|aplicacion/.test(normal(aprendizaje));
  const promesa = /demostracion|mostrare|vamos a mostrar|puedes mostrar|haremos|te ensenare/.test(normal(contenido(l)));
  return (l.tipo === 'prueba' && l.capturas?.some(c => c.src && !c.hueco))
    || (l.tipo === 'objeto' && l.imagen)
    // Un recorrido concreto muestra entrada literal y respuesta observable. Una flecha no basta.
    || (!archivo && !promesa && l.tipo === 'chat' && l.mensajes?.some(m => m.de === 'yo' && tokens(m.texto).length >= 3)
      && l.mensajes?.some(m => m.de === 'otro' && tokens(m.texto).length >= 2));
}
export function reglasEditoriales(deck) {
  const avisos = [], L = deck.laminas || [];
  let racha = 0, anterior = null;
  L.forEach((l,i) => {
    const f = funcionRetorica(l); racha = f && f === anterior ? racha + 1 : 1; anterior = f;
    if (f && racha === 4) avisos.push(`láminas ${i-2}–${i+1}: misma función retórica «${f}» cuatro veces seguidas; introduce una demostración, contraste o decisión nueva, aunque cambie el diseño`);
  });
  for (const h of secuenciasRepetidas(deck)) avisos.push(`secuencias repetidas: láminas ${h.desde}–${h.hasta}, tres bloques de ${h.longitud} estructuras incluso permutadas; reescribe desde decisiones y demostraciones distintas, sin cuota`);
  const aprendizajes = new Set();
  for (const b of deck.bloques || []) {
    const inicio = L.findIndex(l => l?.id === b.desde), fin = L.findIndex(l => l?.id === b.hasta);
    if (aprendizajes.has(normal(b.aprendizaje))) avisos.push(`bloque ${b.desde}: repite el aprendizaje; aporta una decisión nueva`);
    aprendizajes.add(normal(b.aprendizaje));
    if (b.practico && !L.slice(inicio, fin + 1).some(l => demostracionVisible(l, b.aprendizaje))) avisos.push(`bloque ${b.desde}: falta demostración visible; muestra archivo, captura o conversación completa, no «Duda → Demostración → Comprobación»`);
  }
  L.forEach((l, i) => {
    for (const a of l.anotaciones || []) if (a.texto && !anotacionAporta(l, a)) avisos.push(`lámina ${i + 1}: anotación redundante «${a.texto}»; añade consecuencia, contraste, precisión o veredicto`);
    const voces = Array.isArray(l.voz) ? l.voz : [l.voz];
    for (const v of voces.filter(Boolean)) {
      if (/\bpara (define|escribe|elige|anota|revisa|manda|abre)\b|\brevisa (escribe|define|elige|anota|manda)\b/i.test(v)) avisos.push(`lámina ${i + 1}: gramática de voz «${v}»; después de «para» usa infinitivo y separa instrucciones con puntuación`);
    }
    if (/contacto|escribirte|telefono/.test(normal(contenido(l))) && /🧭/.test(l.emoji || '')) avisos.push(`lámina ${i + 1}: contacto pide teléfono o mensaje; la brújula representa orientación`);
  });
  return { errores: [], avisos };
}

export function evaluacionesSeparadas({ deck, geometria, editorial, pendientes = {}, falta = [], medido = false }) {
  const oferta = integridadOferta(deck);
  const comercial = { ...oferta, pendientes: Object.keys(pendientes), falta };
  if (oferta.estado !== 'no-aplica' && (comercial.pendientes.length || falta.length)) comercial.estado = 'incompleta';
  return {
    geometria: { medido, errores: geometria.errores, avisos: geometria.avisos,
      nota: medido ? Math.max(0, 100 - geometria.errores.length * 12 - geometria.avisos.length * 3) : null },
    integridad_comercial: comercial,
    editorial: { estado: editorial.errores.length || editorial.avisos.length ? 'requiere-revision' : 'sin-indicios-automaticos', ...editorial,
      limite: 'Las heurísticas no certifican progresión narrativa, veracidad ni naturalidad.' },
    aprobacion_visual: { estado: 'pendiente-humana', nota: null, motivo: 'Una nota automática no acredita la firma de un diseñador.' },
  };
}
