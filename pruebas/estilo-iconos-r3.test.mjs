// Estilo e íconos, ronda 3 del loop: tono de piel, fuente legible y con un solo estilo, emoji que crece con su bloque
// (cuadrantes, stack a sangre), etiquetas hermanas del flujo con los mismos renglones, calendario grande de celdas
// cuadradas [ref_1760], insignia de Fluent al ~48% [ref_10] y cuadrantes saturados [ref_628].
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { Emojis, conPiel } from '../scripts/lib/emoji.mjs';
import { validarDeck } from '../scripts/lib/contrato.mjs';
import { LAYOUTS } from '../scripts/lib/construir.mjs';
import { tamEmojiCuadro } from '../scripts/lib/layouts-texto.mjs';
import { tamEmojiPieza, colorPieza } from '../scripts/lib/layouts-datos.mjs';
import { reglasFuente } from '../scripts/lib/reglas-deck.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-ei3-'));
async function conDeck(deck, fn) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  await page.addScriptTag({ content: inyectable() });
  try { return await fn(page, p); } finally { await browser.close(); }
}
function qa(deck) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', 'qa.mjs'), dir, '--salida', path.join(dir, 's'), '--json'], { encoding: 'utf8' });
  return JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
}

test('piel: las personas sin tono reciben el del deck; siluetas, tonos a mano y objetos no cambian', () => {
  assert.equal(conPiel('🧑‍⚕️', '🏻'), '🧑🏻‍⚕️');
  assert.equal(conPiel('🧑‍🤝‍🧑', '🏻'), '🧑🏻‍🤝‍🧑🏻');
  assert.equal(conPiel('🙅‍♂️', '🏻'), '🙅🏻‍♂️');
  assert.equal(conPiel('👥', '🏻'), '👥');
  assert.equal(conPiel('👍🏽', '🏻'), '👍🏽');
  assert.equal(conPiel('💰', '🏻'), '💰');
  for (const mano of ['🤝', '👆', '👍', '✍️', '🤳']) assert.equal(conPiel(mano, '🏻'), mano, `${mano}: las manos no son personas`);
  assert.equal(conPiel('🕵️', '🏻'), '🕵🏻');
  assert.equal(conPiel('🧑‍⚕️', 'ninguno'), '🧑‍⚕️');
  const em = new Emojis({ modo: 'apple', dirSalida: tmp(), piel: '🏻' });
  assert.ok(em.html('no:🙅‍♂️').includes('🙅🏻‍♂️'));
  assert.ok(em.html('🧑‍⚕️+💰').includes('🧑🏻‍⚕️') && em.html('🧑‍⚕️+💰').includes('💰'));
  assert.ok(em.html('👥').startsWith('<span class="emo') && em.html('👥').includes('url(#pz-sil)'));
  assert.ok(validarDeck({ piel: 'rosa', laminas: [{ tipo: 'idea', texto: 'x' }] }, Object.keys(LAYOUTS)).some(e => /piel «rosa»/.test(e)));
  assert.deepEqual(validarDeck({ piel: '🏽', laminas: [{ tipo: 'idea', texto: 'x' }] }, Object.keys(LAYOUTS)), []);
});

test('fuente: una cita con forma «Autor (año)» en nota avisa; en `fuente` no', () => {
  const r = reglasFuente({ laminas: [
    { tipo: 'flujo', nota: 'Johansson y Hall, revista Science (2005)' },
    { tipo: 'cita', nota: 'Antonio Damasio, neurocientífico' },
    { tipo: 'grafica', fuente: 'Tversky y Kahneman (1992)', nota: 'Duele el doble' },
  ] });
  assert.equal(r.avisos.length, 1);
  assert.match(r.avisos[0], /lámina 1 \(flujo\).*ponla en "fuente"/);
});

test('tamaños: el emoji crece con su bloque (cuadrantes) y con su pieza (stack a sangre)', () => {
  assert.equal(tamEmojiCuadro(1920, 1080, 4, 2), 130, '4 bloques: como ref_628');
  assert.equal(tamEmojiCuadro(1920, 1080, 2, 2), 220, '2 bloques a lo alto');
  const dosFilas = tamEmojiPieza(514, 617, false);
  assert.ok(dosFilas >= 190 && dosFilas <= 220, `2 filas: ${dosFilas}`);
  assert.ok(dosFilas / 514 >= 0.36, 'el ícono es ~40% de la pieza [42:40]');
  const tresSub = tamEmojiPieza(337, 460, true);
  assert.ok(tresSub >= 72 && 337 - 48 - 114 - 58 - 18 - tresSub >= 24, `3 filas con sub deja aire: ${tresSub}`);
  // el color que salta por el emoji oscuro no repite el de la pieza anterior
  assert.equal(colorPieza('🎓', 1, 'morado'), 'naranja');
  assert.notEqual(colorPieza('📄', 2, 'naranja'), 'naranja');
});

test('render: flujo con etiquetas hermanas igualadas, fuente a 40 px, cuadrantes saturados, calendario cuadrado, insignia al ~48%', { timeout: 180_000 }, async () => {
  await conDeck({ emoji: 'fluent', marca: false, laminas: [
    { tipo: 'flujo', separacion: 120, nodos: [{ emoji: '👩', etiqueta: 'Elige una cara' }, { emoji: '🪄', etiqueta: 'Le dan la otra' }, { emoji: '🧮', etiqueta: 'Explica por qué' }],
      fuente: 'Johansson y Hall, «Science» (2005)' },
    { tipo: 'cuadrantes', items: [{ emoji: 'no:🎥', texto: 'Crear contenido', tono: 'r' }, { emoji: 'si:💸', texto: '$0 de capital', tono: 'v' }] },
    { tipo: 'calendario', fase_activa: 2, n: 14, fases: [{ nombre: 'Fase 1', desde: 1, hasta: 3, color: 'amarillo' }, { nombre: 'Fase 2', sub: 'Valor', desde: 4, hasta: 9, color: 'azul' }] },
    { tipo: 'idea', emoji: '🧑‍🤝‍🧑+🤖', texto: 'Tu equipo con IA' },
  ] }, async page => {
    const r = await page.evaluate(() => {
      const L = [...document.querySelectorAll('.lamina')];
      const etq = [...L[0].querySelectorAll('.fila-igual .etiqueta')].map(e => ({ lin: window.lineasPalabras(e).length, r: e.getBoundingClientRect() }));
      const fuente = L[0].querySelector('.fuente');
      const cuadro = L[1].querySelector('.cuadro.r'), emoC = L[1].querySelector('.cuadro .emo');
      const dia = L[2].querySelector('.calendario .dia'), cal = L[2].querySelector('.calendario');
      const base = L[3].querySelector('.emo'), ins = base.querySelector('.insignia:not(.izq) > img');
      return {
        lineas: etq.map(e => e.lin), huecos: etq.slice(1).map((e, i) => e.r.left - etq[i].r.right),
        fuente: parseFloat(getComputedStyle(fuente).fontSize), estiloFuente: getComputedStyle(fuente).fontFamily,
        fondoR: getComputedStyle(cuadro).backgroundImage, emoC: emoC.getBoundingClientRect().height,
        dia: [dia.offsetWidth, dia.offsetHeight], grande: cal.classList.contains('grande'),
        ins: ins.getBoundingClientRect().height / base.getBoundingClientRect().height,
      };
    });
    assert.deepEqual(r.lineas, [1, 1, 1], 'las tres hermanas en un renglón');
    assert.ok(r.huecos.every(h => h >= 24), `sin encimarse: ${r.huecos}`);
    assert.equal(r.fuente, 40);
    assert.ok(!/Caveat/.test(r.estiloFuente), 'la fuente va en sans, no a mano');
    assert.match(r.fondoR, /radial-gradient/, 'el cuadrante lleva el brillo de la esquina');
    assert.match(r.fondoR, /242, 173, 173/, 'rojo saturado donde cae el texto (ref_628)');
    assert.ok(r.emoC >= 200, `2 bloques: emoji de ${r.emoC}`);
    assert.ok(r.grande && Math.abs(r.dia[0] - r.dia[1]) <= 4, `celdas cuadradas: ${r.dia}`);
    assert.ok(r.ins >= 0.44 && r.ins <= 0.5, `insignia al ${r.ins.toFixed(2)} del glifo base (ref_10: 0.45)`);
  });
});

test('QA: la fuente a 40 px no avisa; una fila de flujo con renglones distintos sí', { timeout: 180_000 }, () => {
  const ok = qa({ emoji: 'apple', marca: false, laminas: [{ tipo: 'idea', emoji: '🧠', texto: 'Decides con **emoción**', fuente: 'Antonio Damasio, «El error de Descartes» (1994)' }] });
  assert.ok(!ok.avisos.some(a => /fuente/.test(a)), ok.avisos.join('\n'));
  const mal = qa({ emoji: 'apple', marca: false, laminas: [{ tipo: 'flujo', separacion: 400, nodos: [
    { emoji: '📝', etiqueta: 'Uno' }, { emoji: '📞', etiqueta: 'Una etiqueta bastante larga para su columna' }, { emoji: '✅', etiqueta: 'Tres' }] }] });
  assert.ok(mal.avisos.some(a => /etiquetas hermanas con distinto número de renglones/.test(a)), mal.avisos.join('\n'));
});
