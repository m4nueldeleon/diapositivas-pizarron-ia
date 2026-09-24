// Cierre del loop: el flujo vertical (9:16) centra cada nodo, su ícono y su etiqueta en el eje de la columna, y QA lo
// mide (ejesFlujo, tolerancia 2% del ancho). Antes la pila iba en flex-start: «La minuta» y 📝 quedaban a la izquierda
// en ejemplos/reel 03-minuta, la segunda flecha salía torcida y QA daba 100 [juez r5].
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';

const MINUTA = { tipo: 'flujo', emoji_tam: 140, nodos: [
  { emoji: '🎤+🔴', etiqueta: 'Grabas la junta', sub: 'con permiso de todos' },
  { emoji: '🤖', etiqueta: 'La IA transcribe' },
  { emoji: '📝', etiqueta: 'La minuta' },
] };

test('flujo vertical: nodos en el eje de la columna; forzado a flex-start, ejesFlujo lo detecta', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-ejes-'));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ formato: '9:16', emoji: 'apple', laminas: [MINUTA] }));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  try {
    await page.addScriptTag({ content: inyectable() });
    const r = await page.evaluate(() => {
      const lam = window.PZ.lams[0];
      window.PZ.mostrar(lam, 2, Infinity);
      const antes = window.ejesFlujo(lam);
      lam.querySelector('.pila.fila-flujo').style.alignItems = 'flex-start';
      const despues = window.ejesFlujo(lam);
      return { antes, despues };
    });
    assert.deepEqual(r.antes, [], JSON.stringify(r.antes));
    assert.ok(r.despues.some(x => /La minuta/.test(x.que) && Math.abs(x.dx) > 2), JSON.stringify(r.despues));
  } finally { await browser.close(); }
});
