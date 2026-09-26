// Ronda 21 (juez independiente + encargo): el calendario 16:9 de ≤15 días con anotaciones de `dia` se
// encogía para hacerles sitio (r1738, IoU 0.203 contra el video: la referencia llena ~80% del alto,
// nuestra réplica ~73%). El motor debe usar el mismo aprovechamiento de alto que el calendario "grande"
// sin anotaciones (r1760), dejando que las notas vivan en el margen sin achicar la tarjeta.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida } from '../scripts/lib/pipeline.mjs';
import { abrir } from '../scripts/lib/pipeline.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r21-cal-'));
async function conDeck(deck, fn) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  try { return await fn(page, p); } finally { await browser.close(); }
}

const DIAS_14 = Array.from({ length: 14 }, (_, i) => ({ sub: `Tema ${i + 1}` }));
const base = laminas => ({ emoji: 'apple', marca: false, laminas });

test('calendario 16:9 con anotaciones de día: la tarjeta ocupa tanto alto como sin anotaciones (no se encoge)', { timeout: 120_000 }, async () => {
  const conNotas = base([{ tipo: 'calendario', titulo: '14 Days', dias: DIAS_14,
    anotaciones: [{ dia: 1, texto: 'Nota A', lado: 'izquierda', arriba: '30%' }, { dia: 14, texto: 'Nota B', lado: 'derecha', arriba: '74%' }] }]);
  const sinNotas = base([{ tipo: 'calendario', titulo: '14 Days', dias: DIAS_14 }]);
  const altoConNotas = await conDeck(conNotas, page => page.evaluate(() => {
    const el = document.querySelector('.calendario');
    return el.getBoundingClientRect().height / window.innerHeight;
  }));
  const altoSinNotas = await conDeck(sinNotas, page => page.evaluate(() => {
    const el = document.querySelector('.calendario');
    return el.getBoundingClientRect().height / window.innerHeight;
  }));
  // Con la referencia (ref_1738 vs ref_1760) ambas versiones llenan un alto comparable: la diferencia
  // no debe superar unos pocos puntos porcentuales, nunca los ~7-8 puntos que medía comparar.mjs antes.
  assert.ok(altoConNotas >= altoSinNotas - 0.03,
    `con anotaciones el calendario mide ${(altoConNotas * 100).toFixed(1)}% del alto; sin anotaciones ${(altoSinNotas * 100).toFixed(1)}% — se sigue encogiendo para hacerles sitio`);
  // Debe seguir usando el mismo aprovechamiento "grande" (≥ 75% del alto de cuadro), no el tamaño chico.
  assert.ok(altoConNotas >= 0.75, `con anotaciones el calendario solo mide ${(altoConNotas * 100).toFixed(1)}% del alto — no llega al tamaño "grande"`);
});
