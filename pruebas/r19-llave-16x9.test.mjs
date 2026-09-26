// R19 (juez, pendiente 1): una lista con llave en 16:9 (sin columnas) no tenía ruta de repliegue cuando los ítems
// eran de largo normal — colocarAnotaciones() se rendía y la nota salía del lienzo, y armar.mjs truena con 4 errores.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';

async function pagina(t, laminas, formato = '16:9') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r19-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', formato, laminas }));
  const prep = prepararSalida(dir); let b;
  try { b = await abrir(prep.htmlPath, prep.W, prep.H); } catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return null; }
  t.after(() => b.browser.close());
  return b.page;
}

test('r19 16:9: una llave con ítems de largo normal no se sale del lienzo — se repliega bajo la lista, como en 9:16', async t => {
  const p = await pagina(t, [{
    tipo: 'lista', encabezado: 'Por qué automatizarlo:', vineta: 'check',
    items: ['No dependes de acordarte de mandar el segundo cobro', 'El cliente lo ve normal, no como un reclamo tuyo'],
    anotaciones: [{ llave: ['i0', 'i1'], texto: 'Cero fricción, cero pena' }],
  }]); if (!p) return;
  const r = await p.evaluate(() => {
    const l = window.PZ.lams[0], L = l.getBoundingClientRect(), s = L.width / l.offsetWidth;
    const n = l.querySelector('.anotacion'), a = n.getBoundingClientRect();
    return {
      bajo: n.dataset.llaveBajo,
      x: (a.x - L.x) / s, y: (a.y - L.y) / s, w: a.width / s, h: a.height / s,
      W: l.offsetWidth, H: l.offsetHeight,
    };
  });
  // R19: sin repliegue, la nota caía en x negativo (fuera del margen izquierdo) o su borde derecho pasaba el ancho.
  assert.equal(r.bajo, '1', 'la llave se repliega horizontal, como en 9:16');
  assert.ok(r.x >= 0 && r.x + r.w <= r.W, `la nota cabe en el ancho del lienzo: ${JSON.stringify(r)}`);
  assert.ok(r.y >= 0 && r.y + r.h <= r.H, `la nota cabe en el alto del lienzo: ${JSON.stringify(r)}`);
});

test('r19 16:9: armar.mjs no truena con la lista con llave del caso anterior (antes daba 4 errores)', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r19-armar-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({
    titulo: 'Reproduccion', formato: '16:9', emoji: 'apple', marca: false,
    laminas: [
      { id: 'gancho', tipo: 'idea', texto: 'Bug de reproducción:\n__llave en 16:9__', voz: 'Bug de reproducción: llave en 16:9.' },
      {
        id: 'razones', tipo: 'lista', encabezado: 'Por qué automatizarlo:', vineta: 'check',
        items: ['No dependes de acordarte de mandar el segundo cobro', 'El cliente lo ve normal, no como un reclamo tuyo'],
        anotaciones: [{ llave: ['i0', 'i1'], texto: 'Cero fricción, cero pena' }],
        voz: ['No dependes de acordarte de mandar el segundo cobro.', 'El cliente lo ve normal, no como un reclamo tuyo.', 'Cero fricción, cero pena.'],
      },
    ],
  }));
  const r = spawnSync(process.execPath, ['scripts/armar.mjs', dir], { cwd: DIR_SKILL, encoding: 'utf8' });
  if (/SIN_NAVEGADOR|falta el navegador|No encuentro playwright/.test(r.stdout + r.stderr)) { t.skip('sin navegador'); return; }
  assert.ok(!/se sale del lienzo|invade el margen horizontal/.test(r.stdout), r.stdout);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
