// Presentador en vivo: guion del orador en el HTML, notas, pantalla en negro, salto por número y cámara limpia.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';

const deck = { emoji: 'apple', marca: false, laminas: [
  { tipo: 'idea', id: 'uno', emoji: '💡', texto: 'Uno', nota: 'nota', voz: ['Primera frase del orador', 'Segunda frase'] },
  { tipo: 'camara', id: 'cam', nota: 'Te cuento algo', voz: 'Aquí hablo a cámara' },
  { tipo: 'idea', id: 'tres', emoji: '💰', texto: 'Tres', voz: 'Tercera' },
  { tipo: 'idea', id: 'cuatro', emoji: '⏳', texto: 'Cuatro', voz: 'Cuarta' },
  { tipo: 'idea', id: 'cinco', emoji: '🚀', texto: 'Cinco', voz: 'Quinta' },
] };

function preparar() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-pres-'));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  return prepararSalida(dir, path.join(dir, 'salida'));
}

test('el HTML trae el guion del orador (voz y duración por paso) en cada lámina, sin dibujarlo', () => {
  const p = preparar();
  const guiones = [...p.html.matchAll(/<script type="application\/json" class="guion">(.*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  assert.equal(guiones.length, deck.laminas.length);
  assert.deepEqual(guiones[0].voz, ['Primera frase del orador', 'Segunda frase']);
  assert.equal(guiones[0].dur.length, 2);
  assert.deepEqual(guiones[1].voz, ['Aquí hablo a cámara']);
});

test('presentador: N muestra la voz, B pone negro, 5 G salta a la lámina 5 y la cámara sale en negro limpio', { timeout: 120_000 }, async () => {
  const p = preparar();
  const { browser, page } = await abrir(p.htmlPath, 1280, 720, { modo: 'presentador' });
  try {
    await page.waitForSelector('.notas-pres', { state: 'attached' });
    const activa = () => page.evaluate(() => document.querySelector('.lamina.activa').dataset.id);
    assert.equal(await activa(), 'uno');
    await page.keyboard.press('n');
    assert.match(await page.evaluate(() => getComputedStyle(document.querySelector('.notas-pres')).display + '|' + document.querySelector('.notas-pres').textContent), /^block\|.*Primera frase del orador/);
    await page.keyboard.press('b');
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.velo-pres')).backgroundColor), 'rgb(0, 0, 0)');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.velo-pres')).display), 'none', 'avanzar quita el negro');
    await page.keyboard.press('ArrowRight');
    assert.equal(await activa(), 'cam');
    const cam = await page.evaluate(() => { const l = document.querySelector('.lamina.activa'); return [getComputedStyle(l).backgroundColor, getComputedStyle(l.querySelector('.lienzo .nota')).visibility]; });
    assert.deepEqual(cam, ['rgb(0, 0, 0)', 'hidden']);
    await page.keyboard.press('5');
    await page.keyboard.press('g');
    assert.equal(await activa(), 'cinco');
    await page.keyboard.press('Enter');                       // sin número, Intro sigue avanzando (fin del deck)
    assert.equal(await activa(), 'cinco');
    await page.keyboard.press('1'); await page.keyboard.press('Enter');
    assert.equal(await activa(), 'uno');
  } finally { await browser.close(); }
});

test('vista de ensayo (?modo=orador): paso actual, siguiente en miniatura, voz y cronómetro', { timeout: 120_000 }, async () => {
  const p = preparar();
  const { browser, page } = await abrir(p.htmlPath, 1280, 800, { modo: 'orador' });
  try {
    await page.waitForSelector('.orador-ui .o-reloj b');
    const r = await page.evaluate(() => ({
      voz: document.querySelector('.o-voz').textContent, sig: document.querySelector('.o-voz-sig').textContent,
      pos: document.querySelector('.o-pos').textContent, clon: !!document.querySelector('.lamina.clon-sig'), reloj: document.querySelector('.o-reloj').textContent,
    }));
    assert.equal(r.voz, 'Primera frase del orador');
    assert.equal(r.sig, 'Segunda frase');
    assert.match(r.pos, /lámina 1\/5 · paso 1\/2/);
    assert.ok(r.clon);
    assert.match(r.reloj, /total \d+:\d\d · lámina \d+:\d\d \/ \d+:\d\d/);
  } finally { await browser.close(); }
});
