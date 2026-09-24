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

// El lector del diccionario vive en scripts/lib/emoji-diccionario.mjs (QA lo usa para el inventario de iconos)
import { filasConcepto, conceptoDe } from '../scripts/lib/emoji-diccionario.mjs';
export { filasConcepto };

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
  assert.match(de('🤔'), /objeción|duda/);
  assert.match(de('❓'), /objeción|duda/);
  assert.match(de('👊'), /para ti/);
  assert.equal(de('no:🙋'), '', '«sin mostrar la cara» ya no es no:🙋');
});

test('cada fila de concepto se interpreta o declara sin emoji, flujo, rejilla o receta', () => {
  const filas = filasConcepto(EMOJIS);
  for (const f of filas) assert.ok(f.specs.length || /sin emoji|`flujo`|`rejilla`|receta `no:X`/i.test(f.indicacion),
    `${f.seccion}: «${f.concepto}» no tiene spec ni excepción explícita`);
  const objeciones = new Set(filas.filter(f => /objeci[oó]n/i.test(f.concepto)).flatMap(f => f.specs));
  const retoricas = filas.filter(f => /pregunta ret[oó]rica/i.test(f.concepto)).flatMap(f => f.specs);
  assert.deepEqual(retoricas.filter(s => objeciones.has(s)), []);
  for (const c of ['ingresos recurrentes', 'varias conversaciones a la vez', 'testimonio']) {
    assert.ok(filas.some(f => f.concepto === c), `el lector omite «${c}»`);
  }
});

test('contenido y capacitación: editar es un compuesto; estado y ejemplo conservan conceptos distintos', () => {
  assert.match(conceptoDe('🎥+✂️', true), /editar|cortar video/);
  assert.match(conceptoDe('✂️', true), /descuento/);
  assert.match(conceptoDe('🎞️', true), /tomas.*clips/);
  assert.match(conceptoDe('👤+💬', true), /1 a 1.*retroalimentación/);
  assert.match(conceptoDe('📱+💬', true), /chat/);
  assert.match(conceptoDe('🤝', true), /acuerdo.*compromiso/);
  assert.match(conceptoDe('🪜', true), /ascenso.*puesto/);
  assert.match(EMOJIS, /😩\/😌 solo cuentan el estado de la persona/);
  assert.match(EMOJIS, /`no:🪝`.*tono `r`/);
  assert.match(EMOJIS, /`si:🪝`.*tono `v`/);
  assert.match(EMOJIS, /si el deck ya usa|Si el deck ya usa/);
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

test('compuestos con el mismo sentido en todos los documentos: si:💸 es $0 de capital, no:⏳ es la objeción, nada de no:💻', () => {
  const filas = filasConcepto(EMOJIS);
  const de = sp => (filas.find(f => f.specs.includes(sinSel(sp))) || {}).concepto || '';
  assert.match(de('si:💸'), /capital/);
  assert.equal(de('no:💸'), '', 'no:💸 ya no es «sin invertir»: se leía como la objeción «no tengo dinero»');
  assert.match(de('no:⏳'), /no tengo tiempo|objeci/i);
  assert.match(de('no:⌨️'), /tecnolog/);
  // los documentos y los ejemplos: ningún no:💻 y cada prefijo sobre un emoji del diccionario
  const dic = new Set(emojisDe(EMOJIS));
  const textos = [...fs.readdirSync(path.join(RAIZ, 'references')).filter(f => f.endsWith('.md')).map(f => [f, leer(`references/${f}`)]),
    ...fs.readdirSync(path.join(RAIZ, 'ejemplos')).filter(n => fs.existsSync(path.join(RAIZ, 'ejemplos', n, 'deck.json'))).map(n => [n, leer(`ejemplos/${n}/deck.json`)])];
  const malos = [];
  for (const [f, t] of textos) {
    if (/no:💻/.test(t)) malos.push(`${f}: no:💻 (usa no:⌨️)`);
    for (const m of t.matchAll(/\b(?:no|si):(\p{RGI_Emoji})/gv)) if (!dic.has(sinSel(m[1]))) malos.push(`${f}: ${m[0]} no está en EMOJIS.md`);
  }
  assert.deepEqual(malos, []);
});

// r5: «la llamada o sesión en vivo» tenía cuatro salidas (📞, 📅, `🎥+🔴`, 📖) y un webinar mezcló dos para lo mismo. Una
// palabra clave de concepto que sale en dos filas con emojis distintos es una puerta a mezclar: la sesión es 📞.
test('EMOJIS.md r5: «sesión» vive en una sola fila (📞), 🚨 🗄️ 📥 🚧 tienen fila y 🗑️ no es «archivar»', () => {
  const filas = filasConcepto(EMOJIS);
  const conSesion = filas.filter(f => /\bsesi[oó]n/i.test(f.concepto));
  assert.equal(conSesion.length, 1, conSesion.map(f => f.concepto).join(' | '));
  assert.ok(conSesion[0].specs.includes('📞'), conSesion[0].specs.join(' '));
  assert.match(conceptoDe('🚨'), /urgente/);
  assert.match(conceptoDe('🗄️'), /archivar/);
  assert.match(conceptoDe('📥'), /bandeja/);
  assert.match(conceptoDe('🚧'), /obst[aá]culo/);
  assert.match(conceptoDe('🎤+🔴'), /grabar audio/);
  assert.doesNotMatch(conceptoDe('🗑️'), /archiv/);
  assert.match(conceptoDe('📅'), /fecha/);
});

test('r6: compuestos del diccionario usan el spec completo; una base inventada sigue avisando', async () => {
  const { infoIconos } = await import('../scripts/lib/reglas-deck.mjs');
  const compuestos = filasConcepto(EMOJIS).flatMap(f => f.specs).filter(s => s.includes('+'));
  for (const emoji of [...compuestos, '🧑+🎥']) assert.equal(infoIconos({ laminas: [{ tipo: 'idea', emoji }] }), null, emoji);
  assert.match(infoIconos({ laminas: [{ tipo: 'idea', emoji: '🦩+🎥' }] }), /🦩/);
});

test('r6: conceptos de negocio en México sin logos genéricos ni identificación confundida con rol', () => {
  for (const [emoji, concepto] of [['🛍️', /tienda/], ['🔁', /suscripción/], ['⌨️', /prompt/], ['🏠', /casa/], ['🏪', /tienda/], ['🪪', /identificación.*INE.*pasaporte/], ['🧾', /factura.*comprobante/]]) {
    assert.match(conceptoDe(emoji), concepto, emoji);
  }
  assert.equal(conceptoDe('🏬'), null);
  assert.doesNotMatch(conceptoDe('📱'), /WhatsApp/);
  assert.match(conceptoDe('no:⌨️'), /sin programar/);
});
