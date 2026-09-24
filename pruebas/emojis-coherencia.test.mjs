// EMOJIS.md es la única fuente de verdad de los emojis: un emoji = un concepto, los demás documentos solo citan
// emojis del diccionario, y el sustituto de bajo contraste dice lo mismo que el emoji que reemplaza.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BAJO_CONTRASTE, PARECIDOS } from '../scripts/lib/emoji.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const EMOJIS = leer('references/EMOJIS.md');
const sinSel = e => String(e).replace(/️/g, '');
const seg = new Intl.Segmenter('es', { granularity: 'grapheme' });
const RGI = /^\p{RGI_Emoji}$/v;
const emojisDe = t => [...seg.segment(t)].map(x => x.segment).filter(g => RGI.test(g)).map(sinSel);

// Tablas de concepto: todas, salvo las de sets, contraste, texto impreso, parecidos y «Evita»
const NO_CONCEPTO = /^(Qué set|Emojis dentro|Evita|Ojo|Emojis con texto|Bajo contraste|Parecidos)/;
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
      const [conc, col] = compuestos ? [celdas[1], celdas[0]] : [celdas[0], celdas[1]];
      if (!col) return;
      const limpia = col.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');
      const specs = limpia.split(/\s+·\s+|\s+o\s+/).map(p => p.replace(/`/g, '').trim()).map(p => p.match(TOKEN)).filter(Boolean)
        .map(m => sinSel(`${m[1] || ''}${m[2]}${m[3] || ''}`));
      if (specs.length) filas.push({ seccion, concepto: conc, specs });
    });
  }
  return filas;
}

test('EMOJIS.md: ningún emoji o compuesto está en dos filas de concepto distintas', () => {
  const filas = filasConcepto(EMOJIS);
  assert.ok(filas.length > 80, `se leyeron ${filas.length} filas`);
  const donde = new Map();
  const dobles = [];
  filas.forEach(f => f.specs.forEach(sp => {
    if (donde.has(sp) && donde.get(sp) !== f.concepto) dobles.push(`${sp}: «${donde.get(sp)}» y «${f.concepto}»`);
    else donde.set(sp, f.concepto);
  }));
  assert.deepEqual(dobles, []);
  // las decisiones de la ronda: 🤝 alianza, 🧭 orientación, 📞 videollamada, 🎥 grabar, no:🙅‍♂️ sin la cara
  const de = sp => (filas.find(f => f.specs.includes(sinSel(sp))) || {}).concepto || '';
  assert.match(de('🤝'), /alianza/);
  assert.match(de('si:🤝'), /venta cerrada/);
  assert.match(de('🧭'), /orientaci/);
  assert.match(de('📞'), /videollamada/);
  assert.match(de('🎥'), /grabar/);
  assert.match(de('no:🙅‍♂️'), /sin mostrar la cara/);
  assert.match(de('📄'), /documento/);
  assert.equal(de('no:🙋'), '', '«sin mostrar la cara» ya no es no:🙋');
});

test('los demás documentos solo citan emojis que están en EMOJIS.md', () => {
  const dic = new Set(emojisDe(EMOJIS));
  const faltan = [];
  for (const f of fs.readdirSync(path.join(RAIZ, 'references')).filter(f => f.endsWith('.md') && f !== 'EMOJIS.md')) {
    const fuera = [...new Set(emojisDe(leer(`references/${f}`)))].filter(e => !dic.has(e) && !/⃣/.test(e));
    if (fuera.length) faltan.push(`${f}: ${fuera.join(' ')}`);
  }
  for (const f of ['SKILL.md', 'templates/MI-MARCA.md']) {
    const fuera = [...new Set(emojisDe(leer(f)))].filter(e => !dic.has(e) && !/⃣/.test(e));
    if (fuera.length) faltan.push(`${f}: ${fuera.join(' ')}`);
  }
  assert.deepEqual(faltan, []);
});

test('el sustituto de bajo contraste dice lo mismo que el emoji que reemplaza (misma fila de EMOJIS.md)', () => {
  const filas = filasConcepto(EMOJIS);
  const fila = e => filas.find(f => f.specs.includes(sinSel(e)));
  const malos = [];
  for (const [set, fondos] of Object.entries(BAJO_CONTRASTE)) for (const [fondo, tabla] of Object.entries(fondos)) for (const [orig, sub] of Object.entries(tabla)) {
    const f = fila(orig);
    if (f && !f.specs.includes(sinSel(sub))) malos.push(`${set}/${fondo}: ${orig} («${f.concepto}») → ${sub} («${(fila(sub) || {}).concepto || 'sin fila'}»)`);
  }
  assert.deepEqual(malos, []);
});

test('los grupos de PARECIDOS de emoji.mjs están documentados en EMOJIS.md', () => {
  const dic = new Set(emojisDe(EMOJIS.split('## Parecidos')[1] || ''));
  for (const set of Object.values(PARECIDOS)) for (const g of set) for (const e of g) assert.ok(dic.has(sinSel(e)), `${e} no está en la tabla «Parecidos»`);
});
