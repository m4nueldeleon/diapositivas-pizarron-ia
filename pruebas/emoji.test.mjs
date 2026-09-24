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
  assert.equal((h.match(/class="insignia izq no"/g) || []).length, 1);
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

test('📱 se dibuja en SVG (celular vertical) igual en apple y en fluent: no se confunde con 📅', () => {
  for (const modo of ['apple', 'fluent']) {
    const em = new Emojis({ modo });
    const h = em.html('📱', 200);
    assert.ok(h.includes('<svg') && h.includes('url(#pz-pantalla)'), modo);
    assert.ok(!h.includes('<img'), modo);
  }
});

import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { formaEmoji, bajoContraste, contrasteMedido, UMBRAL_CONTRASTE, VISTOS_OK, BAJO_CONTRASTE } from '../scripts/lib/emoji.mjs';
import { emojisEnSvg, sanearDeck } from '../scripts/lib/contrato.mjs';

test('enTexto (fluent): ✔ ❤ ☎ ⚠ sin FE0F también se vuelven imagen; flechas y ™ © # siguen como texto', () => {
  assert.equal(formaEmoji('☎'), '☎️');
  assert.equal(formaEmoji('→'), '');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-emo-'));
  const em = new Emojis({ modo: 'fluent', dirSalida: dir });
  const html = em.enTexto('Listo ✔ y ❤ y ☎ y ⚠');
  assert.equal((html.match(/class="emo en-texto"/g) || []).length, 4, html);
  assert.ok(html.includes('<svg'), '✔ es la palomita dibujada');
  const tipo = 'a → b ↔ c ▶ ™ © 1 #';
  assert.equal(em.enTexto(tipo), tipo);
});

test('contraste medido: 🖱️ de Apple y ⚙️ de Fluent avisan con sustituto; 📈 de Apple no (visto a ojo)', () => {
  assert.equal(bajoContraste('🖱️', 'apple', 'claro'), '👆');
  assert.equal(bajoContraste('⚙️', 'fluent', 'tarjeta'), '🛠');
  assert.equal(bajoContraste('📈', 'apple', 'claro'), '');
  assert.equal(bajoContraste('💰', 'fluent', 'tarjeta'), '');
  // la medida existe y recupera lo que la tabla revisada ya sabía
  const m = contrasteMedido();
  assert.ok(m.fluent.claro['💭'] < UMBRAL_CONTRASTE && m.apple.claro['🖱'] < UMBRAL_CONTRASTE);
  for (const set of ['apple', 'fluent']) for (const ch of Object.keys(BAJO_CONTRASTE[set].claro)) {
    const v = m[set].claro[ch];
    // ⚙️ de Fluent (30) va en la tabla por revisión a ojo: lila lavado sobre la tarjeta
    if (v != null) assert.ok(v < 35 || VISTOS_OK[set].includes(ch), `${set} ${ch} medido ${v}`);
  }
});

test('emoji en textos de gráfica (SVG): el contrato lo detecta y, con emoji "auto", sugiere moverlo', () => {
  const l = { tipo: 'grafica', grafica: 'barras', barras: [{ etiqueta: 'Operación ⚙️', valor: 1 }, { etiqueta: 'Listo ✔', valor: 2 }] };
  assert.deepEqual(emojisEnSvg(l).map(x => x[1]), ['⚙️', '✔']);
  assert.ok(sanearDeck({ laminas: [l] }).sugerencias.some(s => /⚙️ de «barras\[0\]\.etiqueta».*en Linux saldrá distinto/.test(s)));
  assert.deepEqual(sanearDeck({ emoji: 'apple', laminas: [l] }).sugerencias, []);
});

test('QA: con emoji "auto" revisa también el otro set; en fluent avisa el emoji dentro de un texto SVG', { timeout: 180_000 }, () => {
  const correr = deck => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-emoqa-'));
    fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
    const r = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/qa.mjs', import.meta.url)), dir, '--salida', path.join(dir, 's'), '--json'], { encoding: 'utf8' });
    return JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
  };
  const auto = correr({ marca: false, laminas: [{ tipo: 'idea', emoji: '💭', texto: 'Contesta rápido' }, { tipo: 'idea', emoji: '🤔', texto: '¿Por qué?' }] });
  if (process.platform === 'darwin') assert.ok(auto.avisos.some(a => /deck en emoji "auto": en fluent .*💭 → 💡/.test(a)), auto.avisos.join('\n'));
  assert.ok(auto.avisos.some(a => /🤔 en fluent → ❓/.test(a)), auto.avisos.join('\n'));
  const fl = correr({ emoji: 'fluent', marca: false, laminas: [{ tipo: 'grafica', grafica: 'barras', barras: [{ etiqueta: 'Operación ⚙️', valor: 50 }, { etiqueta: 'Sueldo', valor: 30 }] }] });
  assert.ok(fl.avisos.some(a => /emoji dentro de un texto de gráfica.*⚙️/.test(a)), fl.avisos.join('\n'));
});

test('📄 y 📃 se dibujan en SVG (hoja con renglones): ya no se sustituyen por 📋, que es «tarea»', async () => {
  const { esGlifoDibujado, bajoContraste, SUGERIDO, BAJO_CONTRASTE, Emojis } = await import('../scripts/lib/emoji.mjs');
  assert.ok(esGlifoDibujado('📄') && esGlifoDibujado('📃'));
  for (const set of ['apple', 'fluent']) for (const f of ['claro', 'tarjeta', 'oscura']) assert.equal(bajoContraste('📄', set, f), '');
  assert.ok(!Object.values(SUGERIDO).includes('📋'), 'ningún sustituto propone 📋 («tarea») como hoja');
  for (const set of Object.values(BAJO_CONTRASTE)) for (const t of Object.values(set)) assert.ok(!Object.values(t).includes('📋'));
  const html = new Emojis({ modo: 'fluent', dirSalida: '/tmp' }).html('📄', 200);
  assert.match(html, /<svg[^>]*>.*url\(#pz-doblez\)/);
  assert.ok(!/stroke="#39414f"/.test(html), 'sin el contorno negro de clip-art');
});
