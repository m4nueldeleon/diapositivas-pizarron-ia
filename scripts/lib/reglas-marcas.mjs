// Reglas puras de marcas, interfaces, escala y correspondencia estrecha de iconos.
import { plano, palabras } from './markup.mjs';
import { analizarCompuesto } from './emoji.mjs';
import { filasDelDiccionario } from './emoji-diccionario.mjs';
const normal = t => plano(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const base = t => String(analizarCompuesto(t).base || '').replace(/\uFE0F/g,'');
const singular = t => normal(t).replace(/[*`]/g,'').replace(/(?:es|s)$/,'');
export function posicionesTiempo(marcas) {
  const valores = marcas.map(m => normal(typeof m === 'string' ? m : m.texto).match(/^(?:(dias?|days?|semanas?|weeks?|mes(?:es)?|months?|anos?|years?)\s+(\d+(?:\.\d+)?)|(\d{4}))$/));
  if (!valores.length || valores.some(v => !v)) return null;
  if (new Set(valores.map(v => (v[1] || 'ano').replace(/s$/,'').replace(/^mese$/,'mes'))).size !== 1) return null;
  const numeros = valores.map(v => Number(v[2] || v[3])), inicio = numeros[0], fin = Math.max(...numeros);
  if (fin <= inicio || numeros.some(n => n < inicio)) return null;
  return numeros.map(n => (n-inicio)/(fin-inicio));
}
export function reglasEscalaTiempo(deck) {
  const avisos = [];
  deck.laminas.forEach((l,i) => {
    if (l.tipo !== 'linea-tiempo' || l.marcas?.length < 3 || l.escala === 'proporcional' || l.marcas.some(m => m?.pos != null)) return;
    const pos = posicionesTiempo(l.marcas);
    if (pos?.some((p,j) => Math.abs(p-j/(pos.length-1)) > .10)) avisos.push(`lámina ${i+1}: las marcas numéricas equidistantes alteran la escala; usa pos: ${JSON.stringify(pos.map(p => +p.toFixed(4)))} o escala: "proporcional" (LAYOUTS, linea-tiempo)`);
  });
  return { errores: [], avisos };
}
export function reglasIconosInversa(deck) {
  const avisos = [], indice = new Map();
  filasDelDiccionario().filter(f => !/^Compuestos/.test(f.seccion) && !f.concepto.includes(':')).forEach(f => {
    f.concepto.replace(/\([^)]*\)/g,'').split(',').forEach(t => {
      const clave = singular(t); if (!clave || palabras(clave)>3) return;
      indice.set(clave,[...new Set([...(indice.get(clave)||[]),f])]);
    });
  });
  deck.laminas.forEach((l,i) => {
    const candidatos = [...(l.nodos || []), ...(['stack','tarjetas'].includes(l.tipo) ? l.items || [] : []),
      ...(l.tipo === 'pasos' ? (l.iconos || []).map((emoji,j) => ({ emoji, texto:l.etiquetas?.[j] })) : [])];
    candidatos.forEach(o => {
      if (!o || typeof o.emoji !== 'string' || /^(no|si):/.test(o.emoji)) return;
      const texto = plano(o.etiqueta || o.texto || ''); if (palabras(texto)>3) return;
      const filas = indice.get(singular(texto)); if (filas?.length !== 1) return;
      const f = filas[0]; if (f.specs.some(s => base(s) === base(o.emoji))) return;
      avisos.push(`lámina ${i+1}: “${texto}” ya tiene emoji en EMOJIS.md: ${f.specs.join(' o ')} (${f.concepto}); usas ${o.emoji}`);
    });
  });
  return { errores: [], avisos };
}
function textos(o, clave = '') {
  if (/^(voz|fuente|id|tipo|imagen|src|app|accion|si_falla|_)/.test(clave)) return [];
  if (typeof o === 'string') return [o];
  if (!o || typeof o !== 'object') return [];
  return Object.entries(o).flatMap(([k,v]) => textos(v,k));
}
export function reglasMarcasYSuperficies(deck) {
  const errores = [], avisos = [];
  deck.laminas.forEach((l,i) => {
    const n = `lámina ${i+1}`, ts = textos(l), t = normal(ts.join(' '));
    const ovalos = ts.flatMap(s => [...s.matchAll(/\(\(([\s\S]*?)\)\)/g)]).filter(m => m[1].trim());
    if (ovalos.length>1) errores.push(`${n}: hay más de un óvalo; encierra solo la cifra o palabra principal`);
    if (ovalos.some(m => /\n|\\n/.test(m[1]))) errores.push(`${n}: el óvalo ((…)) abarca un salto de línea; encierra una cifra en un renglón`);
    if (ovalos.some(m => palabras(m[1])>3)) avisos.push(`${n}: el óvalo encierra más de 3 palabras; acórtalo a la cifra o palabra principal`);
    if (ovalos.length && ts.some(s => /__|==/.test(s))) avisos.push(`${n}: el óvalo convive con subrayado o resaltado; deja un único énfasis`);
    if (l.tipo === 'lista' && l.vineta === 'letras' && l.letras?.length && !l.items?.some(it => it?.emoji)) {
      const j = deck.laminas.slice(0,i).findIndex(x => x.tipo === 'pasos' && JSON.stringify(x.letras) === JSON.stringify(l.letras));
      if (j>=0) avisos.push(`${n}: añade el emoji de cada letra (los de la lámina ${j+1}) para que el ícono vuelva en el cierre`);
    }
    if (l.tipo === 'cuadrantes' && ts.some(s => /\{s:(Antes|Después|Sí|No)\}/i.test(s))) avisos.push(`${n}: usa lista con columnas para el contraste Sí/No o antes/después; cuadrantes da el mismo peso a ambos`);
    if (l.tipo === 'chat') {
      if (l.procedencia === 'real' && !/\{\{[A-Z0-9_]+\}\}|\[[A-Z0-9_]+\]|\b(?:19|20)\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(l.fuente || '')) errores.push(`${n}: chat real exige fuente con fecha; completa el registro de origen`);
      if (l.variante === 'muro' && deck.formato === '9:16' && l.mensajes.length>8) avisos.push(`${n}: el muro vertical supera 8 mensajes; pártelo en dos láminas`);
      if (l.marco === 'celular' && l.mensajes.length>3) avisos.push(`${n}: el celular tiene más de 3 mensajes; divide la conversación`);
      if (['vsl','vsl-corto','webinar'].includes(deck.pieza) && !l.procedencia && !l.fuente && !l.mensajes.some(m => m.ejemplo || m.fuente)) avisos.push(`${n}: declara procedencia y fuente del chat, o ejemplo: true en los mensajes (LAYOUTS, chat)`);
    }
    const emojis = [];
    const ir = o => { if (o && typeof o === 'object') Object.entries(o).forEach(([k,v]) => { if (k === 'emoji' && typeof v === 'string') emojis.push(v); else if (typeof v === 'object') ir(v); }); }; ir(l);
    const fallo = [...t.matchAll(/\b(vuelve a hacer|vuelves a hacer|rehace[sn]?|otra vez|no llega[sn]?|falla[sn]?|se le va|se te va)\b/g)].some(m => !/\b(no|nunca|sin|ya no)\s*$/.test(t.slice(0,m.index)));
    if (fallo && emojis.some(e => !/^(no|si):/.test(e) && ['👑','🏆','🏅','🎉','🚀'].includes(base(e)))) avisos.push(`${n}: el emoji celebra y la frase es un fallo: usa 😩 o el concepto negado (no:…)`);
  });
  return { errores, avisos };
}
