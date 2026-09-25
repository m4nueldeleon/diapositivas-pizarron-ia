// R19 (fidelidad): 11 de 12 ráfagas medidas (falta i_calendario), la ✕ sobre el arco a la escala
// del video [c_alcancia 1:44.5] y las réplicas de secuencia (`_solo_rafaga`) fuera de las parejas de cuadro fijo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
import { RAFAGAS } from '../scripts/lib/secuencia-referencia.mjs';

test('r19: once de doce ráfagas del video tienen su lámina en la réplica', () => {
  const replica = JSON.parse(fs.readFileSync(new URL('./replica/deck.json', import.meta.url), 'utf8'));
  const ids = new Set(replica.laminas.map(l => l.id));
  assert.deepEqual(RAFAGAS.map(r => r.nombre).sort(), ['a_doctor', 'b_lista', 'c_alcancia', 'd_123', 'e_sello', 'f_flechas', 'g_partner', 'h_pill', 'j_table', 'k_underline', 'l_stack']);
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

test('r19: la gráfica llena el lienzo 16:9 y el mapa con manos invierte la escala (mano > tecla) [ref_448, ref_668]', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r19g-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', laminas: [
    { tipo: 'grafica', titulo: 'Dropshipping', subtitulo: 'Scalability', series: [{ nombre: 'Scale', forma: 'recta', tono: 'a' }, { nombre: 'Ad cost', forma: 'exponencial', tono: 'r' }], banda: 'Your Margins' },
    { tipo: 'pasos', n: 3, sobre: '✋', texto: 'The exact **3-step system**' }] }));
  const prep = prepararSalida(dir); let b;
  try { b = await abrir(prep.htmlPath, prep.W, prep.H); } catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return; }
  t.after(() => b.browser.close());
  const r = await b.page.evaluate(() => {
    const [g, m] = window.PZ.lams, k = (l, e) => { const a = e.getBoundingClientRect(), L = l.getBoundingClientRect(), s = L.width / l.offsetWidth; return { w: a.width / s, h: a.height / s }; };
    return { svg: k(g, g.querySelector('.lienzo svg')), mano: k(m, m.querySelector('.icono-paso')), tecla: k(m, m.querySelector('.tecla')) };
  });
  assert.ok(r.svg.w >= 1450 && r.svg.h >= 600, JSON.stringify(r.svg));
  assert.ok(r.mano.h > r.tecla.h, JSON.stringify(r));
});
