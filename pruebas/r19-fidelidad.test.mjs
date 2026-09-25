// R19 (fidelidad): 7 de 12 ráfagas medidas (c_alcancia, k_underline y g_partner nuevas), la ✕ sobre el arco a la escala
// del video [c_alcancia 1:44.5] y las réplicas de secuencia (`_solo_rafaga`) fuera de las parejas de cuadro fijo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
import { RAFAGAS } from '../scripts/lib/secuencia-referencia.mjs';

test('r19: siete ráfagas del video tienen su lámina en la réplica', () => {
  const replica = JSON.parse(fs.readFileSync(new URL('./replica/deck.json', import.meta.url), 'utf8'));
  const ids = new Set(replica.laminas.map(l => l.id));
  assert.deepEqual(RAFAGAS.map(r => r.nombre).sort(), ['a_doctor', 'b_lista', 'c_alcancia', 'd_123', 'e_sello', 'g_partner', 'k_underline']);
  assert.ok(RAFAGAS.every(r => ids.has(r.id)), RAFAGAS.map(r => r.id).join(','));
  const r103 = replica.laminas.find(l => l.id === 'r103');
  assert.equal(r103._solo_rafaga, true, 'r103 replica la secuencia, no el cuadro fijo con fotos propias');
});

test('r19: la ✕ del arco tachado mide ~90 px con trazo grueso [ref_103]', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r19f-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', laminas: [
    { tipo: 'flujo', flecha: 'arco-negro', flechas: [{ tachada: true }], nodos: [{ emoji: '🐷', etiqueta: 'Tus ahorros' }, { emoji: '🎰', etiqueta: 'Apostarlos' }] }] }));
  const prep = prepararSalida(dir); let b;
  try { b = await abrir(prep.htmlPath, prep.W, prep.H); } catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return; }
  t.after(() => b.browser.close());
  const r = await b.page.evaluate(() => {
    const l = window.PZ.lams[0];
    return [...l.querySelectorAll('.capa-mano path[data-clase="equis"]')].map(p => { const bb = p.getBBox(); return { w: bb.width, h: bb.height, ancho: parseFloat(p.getAttribute('stroke-width')) }; });
  });
  assert.ok(r.length >= 2, JSON.stringify(r));
  assert.ok(r.every(x => x.w >= 75 && x.h >= 75 && x.ancho >= 12), JSON.stringify(r));
});
