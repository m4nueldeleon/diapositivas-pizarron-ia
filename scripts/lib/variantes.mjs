// Reglas puras de las variantes de rejilla, mapa de letras y prompt/respuesta.
import { plano } from './markup.mjs';
const nombre = (l, i) => `lámina ${i + 1} (${l.id || l.tipo})`;
const fuente = s => typeof s === 'string' && s.trim().length > 0;
const dato = s => /\{\{[^}]+\}\}|\[[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ_\d ]*\]/.test(String(s || ''));
const fecha = s => /\b(?:19|20)\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(String(s || ''));

function reglasBandas(l, crudo, donde) {
  const errores = [], avisos = [];
  if (l.tipo !== 'rejilla' || !Array.isArray(l.bandas) || !l.bandas.length) return { errores, avisos };
  const bandas = l.bandas, total = l.total || 100;
  const valida = b => b && Number.isInteger(b.desde) && Number.isInteger(b.hasta) && b.desde >= 0 && b.hasta >= b.desde;
  if (bandas.some((b, i) => !valida(b) || b.desde !== (i ? bandas[i - 1]?.hasta + 1 : 0))) errores.push(`${donde}: las bandas deben ser contiguas desde 0, con desde/hasta enteros inclusivos; se cuentan desde abajo a la derecha`);
  const suma = bandas.filter(valida).reduce((n, b) => n + b.hasta - b.desde + 1, 0);
  if (suma > total || bandas.some(b => b?.hasta >= total)) errores.push(`${donde}: las bandas suman ${suma} celdas y no pueden superar el total ${total}`);
  if (l.encerrar != null && (!Number.isInteger(l.encerrar) || l.encerrar < 0 || l.encerrar >= bandas.length)) errores.push(`${donde}: encerrar debe señalar el índice de una banda existente, desde 0`);
  for (const [i, x] of (l.leyenda || []).entries()) {
    const banda = bandas.find(b => b?.tono === x.tono);
    if (!banda) errores.push(`${donde}: el tono ${x.tono} de leyenda[${i}] no tiene una banda`);
    const original = crudo?.leyenda?.[i]?.cifra ?? x.cifra;
    if (/\d/.test(plano(x.cifra || '')) && !fuente(l.fuente) && !dato(original)) errores.push(`${donde}: la cifra de leyenda[${i}] necesita fuente o un {{DATO}}; no inventes el porcentaje`);
    const pct = plano(x.cifra || '').match(/(\d+(?:\.\d+)?)\s*%/);
    if (banda && pct && Math.abs(total * Number(pct[1]) / 100 - (banda.hasta - banda.desde + 1)) > 1) avisos.push(`${donde}: leyenda[${i}] dice ${pct[0]}, pero la banda tiene ${banda.hasta - banda.desde + 1} de ${total} celdas; ajusta la cifra o la banda (máximo una celda de diferencia)`);
  }
  return { errores, avisos };
}
function reglasLetras(l, donde) {
  const errores = [];
  if (l.tipo === 'pasos' && Array.isArray(l.letras)) {
    if (l.letras.length !== l.iconos?.length || l.letras.length !== l.etiquetas?.length) errores.push(`${donde}: letras, iconos y etiquetas deben tener la misma longitud`);
    const emojis = (l.iconos || []).map(x => typeof x === 'string' ? x : x.emoji).filter(Boolean).map(x => x.replace(/\uFE0F/g, ''));
    if (new Set(emojis).size !== emojis.length) errores.push(`${donde}: no repitas emojis en los pasos con letras; cada letra representa un concepto`);
  }
  if (l.tipo === 'lista' && l.vineta === 'letras' && (!Array.isArray(l.letras) || l.letras.length !== l.items?.length)) errores.push(`${donde}: vineta: "letras" exige una letra por ítem en letras`);
  return errores;
}
function reglasRespuestas(l, donde) {
  if (l.tipo !== 'chat') return [];
  return (l.mensajes || []).flatMap((m, i) => {
    if (m.de !== 'respuesta' || m.ejemplo === true) return [];
    if (!fuente(m.fuente)) return [`${donde}: respuesta ${i + 1} sin fuente; añade fuente con fecha o ejemplo: true para mostrar el sello EJEMPLO`];
    return fecha(m.fuente) ? [] : [`${donde}: la fuente de respuesta ${i + 1} necesita fecha para documentar el resultado real`];
  });
}
export function reglasVariantes(deck, { crudo } = {}) {
  const resultados = (deck.laminas || []).map((l, i) => {
    const donde = nombre(l, i), bandas = reglasBandas(l, crudo?.laminas?.[i], donde);
    return { errores: [...bandas.errores, ...reglasLetras(l, donde), ...reglasRespuestas(l, donde)], avisos: bandas.avisos };
  });
  return { errores: resultados.flatMap(r => r.errores), avisos: resultados.flatMap(r => r.avisos) };
}
