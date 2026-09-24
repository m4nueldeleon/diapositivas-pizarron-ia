// emoji-diccionario.mjs — lee references/EMOJIS.md (la única fuente de verdad de los emojis) y responde qué concepto
// tiene cada emoji. Lo usan el inventario de iconos de QA (qa.json → iconos: «💬 (comentar una palabra)») y la prueba de
// coherencia del diccionario (pruebas/emojis-coherencia.test.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esCampoEmoji, specsDeCampo, analizarCompuesto, analizarTrazo } from './emoji.mjs';

const RUTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'references', 'EMOJIS.md');
const sinSel = e => String(e).trim().replace(/️/g, '');
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
function limpiarConcepto(texto) {
  let s = texto.replace(/\[[^\]]*\]/g, '').replace(/\*\*|`/g, '').trim();
  while (s.endsWith(')')) {
    let nivel = 0, inicio = -1;
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i] === ')') nivel++;
      if (s[i] === '(' && --nivel === 0) { inicio = i; break; }
    }
    if (inicio < 0) break;
    s = s.slice(0, inicio).trim();
  }
  return s.replace(/\s+/g, ' ');
}
function cargar() {
  if (indice) return indice;
  indice = new Map();
  try {
    filasConcepto(fs.readFileSync(RUTA, 'utf8')).forEach(f => f.specs.forEach(sp => { if (!indice.has(sp)) indice.set(sp, limpiarConcepto(f.concepto)); }));
  } catch { /* sin diccionario: todo sale «fuera del diccionario» */ }
  return indice;
}

// Información optativa: solo se comprueba cobertura cuando el autor declara conceptos propios.
export function infoConceptos(deck) {
  if (!deck.conceptos || typeof deck.conceptos !== 'object') return null;
  const usados = new Set();
  const ir = o => {
    if (Array.isArray(o)) return o.forEach(ir);
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (esCampoEmoji(k)) specsDeCampo(k, v).forEach(s => usados.add(sinSel(s)));
      else if (v && typeof v === 'object' && !['voz', 'accion', 'si_falla', 'conceptos'].includes(k)) ir(v);
    }
  };
  ir(deck.laminas);
  const declarados = new Set(Object.keys(deck.conceptos).map(sinSel));
  const faltan = [...usados].filter(s => !declarados.has(s));
  return faltan.length ? `conceptos sin declarar: ${faltan.join(' ')}; completa conceptos con el significado corto de cada emoji usado` : null;
}
// Concepto de un emoji o compuesto: primero el spec completo («si:🤝», «📱+💬»), luego su base. null si no está.
export function conceptoDe(spec, exacto = false) {
  const m = cargar(), s = sinSel(spec || '');
  if (!s) return null;
  const trazo = analizarTrazo(analizarCompuesto(s).base);
  if (!trazo.error) return `término propio: ${trazo.rotulo}`;
  if (m.has(s)) return m.get(s);
  if (exacto) {
    const sinTono = s.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
    return m.get(sinTono) || null;
  }
  const base = s.replace(/^(no|si):/, '').split('+')[0];
  if (m.has(base)) return m.get(base);
  // Personas con tono de piel (🧑🏻‍💼): el diccionario las guarda sin tono
  const sinTono = s.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
  return sinTono !== s ? conceptoDe(sinTono) : null;
}

export const filasDelDiccionario = () => filasConcepto(fs.readFileSync(RUTA, 'utf8'));
