// R19 (juez, pendiente 6): una lista de 2-3 ítems cortos en PALABRAS pero largos en caracteres se armaba al
// tamaño fijo de layouts-texto.mjs (144/112 px) y en la columna angosta de 9:16 cada palabra caía en su propio
// renglón («Un solo / lugar / para / pagar» en vez de dos renglones balanceados).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';

async function pagina(t, laminas, formato = '9:16') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r19-lista-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', formato, laminas }));
  const prep = prepararSalida(dir); let b;
  try { b = await abrir(prep.htmlPath, prep.W, prep.H); } catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return null; }
  t.after(() => b.browser.close());
  return b.page;
}

test('r19 9:16: dos ítems de 5 palabras no parten cada palabra en su propio renglón', async t => {
  const p = await pagina(t, [{
    tipo: 'lista', encabezado: 'Por qué un solo plan:', vineta: 'check',
    items: ['Un solo lugar para pagar', 'Un solo dueño por tarea'],
    anotaciones: [{ llave: ['i0', 'i1'], texto: 'Menos que vigilar' }],
  }]); if (!p) return;
  const r = await p.evaluate(() => {
    const l = window.PZ.lams[0];
    // .item-texto es hijo directo de .item (flex): el spec la «blockifica», así que su propio getClientRects()
    // da UNA caja aunque el texto envuelva varios renglones. Un Range sobre el nodo de texto sí fragmenta por renglón.
    const renglones = e => {
      const nodo = [...e.childNodes].find(n => n.nodeType === 3 && /\S/.test(n.textContent));
      if (!nodo) return 1;
      const r = document.createRange(); r.selectNodeContents(nodo);
      return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size;
    };
    return [...l.querySelectorAll('.lista > .item')].map(e => ({
      renglones: renglones(e.querySelector('.item-texto')),
      letra: parseFloat(getComputedStyle(e).fontSize),
    }));
  });
  assert.ok(r.every(x => x.renglones <= 2), `ningún ítem pasa de 2 renglones: ${JSON.stringify(r)}`);
  assert.ok(r.every(x => x.letra >= 64), `la letra no baja del piso de 64 px: ${JSON.stringify(r)}`);
});
