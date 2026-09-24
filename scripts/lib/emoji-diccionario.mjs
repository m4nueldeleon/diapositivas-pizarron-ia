// emoji-diccionario.mjs — lee references/EMOJIS.md (la única fuente de verdad de los emojis) y responde qué concepto
// tiene cada emoji. Lo usan el inventario de iconos de QA (qa.json → iconos: «💬 (comentar una palabra)») y la prueba de
// coherencia del diccionario (pruebas/emojis-coherencia.test.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RUTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'references', 'EMOJIS.md');
const sinSel = e => String(e).replace(/️/g, '');
// Tablas de concepto: todas, salvo las de sets, contraste, texto impreso, parecidos y «Evita»
export const NO_CONCEPTO = /^(Qué set|Emojis dentro|Evita|Ojo|Emojis con texto|Bajo contraste|Parecidos)/;
const TOKEN = /^((?:no|si):)?(\p{RGI_Emoji})(\+(\p{RGI_Emoji}))?/v;
// Filas de concepto: [{ seccion, concepto, specs: ['🤝', 'si:🤝', '📱+💬'] }]
export function filasConcepto(md) {
  const filas = [];
  for (const bloque of md.split(/^## /m).slice(1)) {
    const seccion = bloque.split('\n')[0].trim();
    if (NO_CONCEPTO.test(seccion)) continue;
    const compuestos = /^Compuestos/.test(seccion);
    bloque.split('\n').filter(l => /^\|/.test(l) && !/^\|\s*-/.test(l)).slice(1).forEach(l => {
      const celdas = l.split('|').slice(1, -1).map(c => c.trim());
      // En Compuestos, la Lectura trae notas tras «;» («“No tengo tiempo” (objeción); “rápido…” es ⚡»): el concepto es lo de antes
      const [conc, col] = compuestos ? [celdas[1].split(';')[0].trim(), celdas[0]] : [celdas[0], celdas[1]];
      if (!col) return;
      const limpia = col.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');
      const specs = limpia.split(/\s+·\s+|\s+o\s+/).map(p => p.replace(/`/g, '').trim()).map(p => p.match(TOKEN)).filter(Boolean)
        .map(m => sinSel(`${m[1] || ''}${m[2]}${m[3] || ''}`));
      if (specs.length) filas.push({ seccion, concepto: conc, specs });
    });
  }
  return filas;
}

let indice = null;
function cargar() {
  if (indice) return indice;
  indice = new Map();
  try {
    filasConcepto(fs.readFileSync(RUTA, 'utf8')).forEach(f => f.specs.forEach(sp => { if (!indice.has(sp)) indice.set(sp, f.concepto.replace(/\*\*|`/g, '').trim()); }));
  } catch { /* sin diccionario: todo sale «fuera del diccionario» */ }
  return indice;
}
// Concepto de un emoji o compuesto: primero el spec completo («si:🤝», «📱+💬»), luego su base. null si no está.
export function conceptoDe(spec) {
  const m = cargar(), s = sinSel(spec || '');
  if (!s) return null;
  if (m.has(s)) return m.get(s);
  const base = s.replace(/^(no|si):/, '').split('+')[0];
  if (m.has(base)) return m.get(base);
  // Personas con tono de piel (🧑🏻‍💼): el diccionario las guarda sin tono
  const sinTono = s.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
  return sinTono !== s ? conceptoDe(sinTono) : null;
}
