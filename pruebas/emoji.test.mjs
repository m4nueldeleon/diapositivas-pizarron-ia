// Emojis: sintaxis compuesta, respaldo de nombres Fluent (sin red) y emojis dentro del texto.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { candidatos, analizarCompuesto, Emojis } from '../scripts/lib/emoji.mjs';

// Índice oficial de @lobehub/fluent-emoji-3d@1.1.0 (API de jsDelivr, /flat): 3390 nombres
const indice = new Set(fs.readFileSync(new URL('./fluent-nombres.txt', import.meta.url), 'utf8').split('\n').filter(Boolean));
const primero = ch => candidatos(ch).find(c => indice.has(c));

test('candidatos Fluent: tonos de piel, Unicode 15.1 y equivalencias caen en un archivo que existe', () => {
  assert.equal(primero('🤝🏽'), '1f91d');
  assert.equal(primero('👍🏽'), '1f44d-1f3fd');                       // el tono existe: se respeta
  assert.equal(primero('🧑🏻‍🤝‍🧑🏿'), '1f9d1-200d-1f91d-200d-1f9d1');     // sin tonos, la secuencia completa
  assert.equal(primero('🫱🏼‍🫲🏿'), '1f91d');                             // dos manos → apretón
  assert.equal(primero('⛓️‍💥'), '26d3-fe0f');
  assert.equal(primero('🐦‍🔥'), '1f426');
  assert.equal(primero('🕵️‍♂️'), '1f575-fe0f-200d-2642-fe0f');
  assert.ok(indice.has(primero('1️⃣')));
  for (const e of ['🙂‍↔️', '🚶‍➡️', '🍋‍🟩', '🍄‍🟫', '🧑‍🧒']) assert.ok(primero(e), `sin archivo para ${e}`);
});

test('emoji compuesto: [no:|si:]base[+insignia] sin descartar nada en silencio', () => {
  assert.deepEqual(analizarCompuesto('no:🧑‍⚕️+💰'), { base: '🧑‍⚕️', prefijo: 'no', insignia: '💰', error: '' });
  assert.deepEqual(analizarCompuesto('si:🤝'), { base: '🤝', prefijo: 'si', insignia: '', error: '' });
  assert.deepEqual(analizarCompuesto('🧑‍⚕️+💰'), { base: '🧑‍⚕️', prefijo: '', insignia: '💰', error: '' });
  assert.equal(analizarCompuesto('🧑‍💻').error, '');
  assert.match(analizarCompuesto('🤖+💬+✅').error, /3 partes/);
  assert.match(analizarCompuesto('nop:🎥').error, /prefijo/);
  assert.equal(analizarCompuesto('nop:🎥').base, '🎥');
  assert.match(analizarCompuesto('💰+').error, /sin emoji/);
});

test('no:X+Y dibuja la base, la ❌ a la izquierda y la insignia a la derecha, sin «+» literal', () => {
  const em = new Emojis({ modo: 'apple' });
  const h = em.html('no:🧑‍⚕️+💰');
  assert.ok(!h.includes('+'));
  assert.equal((h.match(/class="insignia izq"/g) || []).length, 1);
  assert.equal((h.match(/class="insignia"/g) || []).length, 1);
  assert.ok(h.includes('💰') && h.includes('🧑‍⚕️'));
  em.html('🤖+💬+✅');
  assert.ok(em.malformados.has('🤖+💬+✅'));
});

test('enTexto: en fluent cambia los emojis del texto; ©®™, atributos, scripts y svg quedan intactos', () => {
  const em = new Emojis({ modo: 'fluent' });
  em.glifo = ch => `<img alt="${ch}">`;          // sin red
  const html = '<div class="burbuja" data-x="🚀">Perfecto 🚀 ✅</div><div class="etiqueta">Marca® 🏷️ ™</div>'
    + '<script type="application/json" class="con">[{"etiqueta":"🔥"}]</script><svg><text>💰</text></svg>';
  const out = em.enTexto(html);
  assert.equal((out.match(/<img /g) || []).length, 3);
  assert.ok(out.includes('Marca®') && out.includes('™'));
  assert.ok(out.includes('data-x="🚀"'));
  assert.ok(out.includes('[{"etiqueta":"🔥"}]'));
  assert.ok(out.includes('<text>💰</text>'));
  // un emoji que Fluent no tiene (ya resuelto como .emo-txt) no se vuelve a envolver
  assert.equal(em.enTexto('<span class="emo-txt ">🫠</span>'), '<span class="emo-txt ">🫠</span>');
});

test('enTexto: en modo apple el HTML sale idéntico', () => {
  const em = new Emojis({ modo: 'apple' });
  const html = '<div class="burbuja">Perfecto 🚀 ✅</div>';
  assert.equal(em.enTexto(html), html);
});
