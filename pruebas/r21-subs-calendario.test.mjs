// R21 [demo 25]: con el calendario grande, un rótulo de una sola palabra («Identificación») se cortaba en el borde de su
// tarjeta. `ajustarSubsCalendario` iguala la letra de los rótulos hasta que el más ancho quepa (piso de 30 px).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';

test('r21: ningún rótulo del calendario se corta en el borde de su tarjeta y todos comparten letra', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r21c-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const subs = ['Inversión', 'Identificación', 'Comunidad', 'Autoridad', 'Confianza', 'Reciprocidad', 'Prueba social', 'Historia', 'Anticipación', 'Urgencia', 'Escasez', 'Escasez', 'Urgencia', 'Cierre'];
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', laminas: [{ tipo: 'calendario', fase_activa: 2,
    dias: subs.map(s => ({ sub: s })), fases: [{ nombre: 'Fase 1', desde: 1, hasta: 3, color: 'amarillo' }, { nombre: 'Fase 2', sub: 'Entregar valor', desde: 4, hasta: 9, color: 'azul' }, { nombre: 'Fase 3', desde: 10, hasta: 14, color: 'verde' }],
    anotaciones: [{ texto: '«Me gusta su contenido»', dia: 1, lado: 'izquierda', arriba: '12%' }] }] }));
  const prep = prepararSalida(dir); let b;
  try { b = await abrir(prep.htmlPath, prep.W, prep.H); } catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return; }
  t.after(() => b.browser.close());
  const r = await b.page.evaluate(() => [...document.querySelectorAll('.calendario .dia span')].map(e => ({ t: e.textContent, sw: e.scrollWidth, tarjeta: e.parentElement.clientWidth, f: getComputedStyle(e).fontSize })));
  assert.ok(r.every(x => x.sw <= x.tarjeta), JSON.stringify(r.filter(x => x.sw > x.tarjeta)));
  assert.ok(r.every(x => parseFloat(x.f) >= 30), 'nunca bajo el piso de QA');
  assert.equal(new Set(r.map(x => x.f)).size, 1, 'una sola letra para todos los rótulos');
});
