// Ronda 21 (juez independiente + encargo): un chat de 1-2 mensajes cortos en 9:16 quedaba centrado en el
// lienzo, dejando ~70% del alto vacío arriba y abajo (P/juez-r20/pruebas/vertical-demo9x16, láminas
// «gancho» y «llamado», reproducido de nuevo por el juez r21 en su propio deck). El bloque debe anclarse
// al tercio superior, como un mensaje real de un feed, en vez de flotar al centro del lienzo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r21-chatv-'));
async function conDeck(deck, fn) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  try { return await fn(page, p); } finally { await browser.close(); }
}
const base = laminas => ({ emoji: 'apple', marca: false, formato: '9:16', laminas });

test('chat de un mensaje corto en 9:16: el bloque se ancla arriba, no flota al centro del lienzo', { timeout: 120_000 }, async () => {
  const deck = base([{ tipo: 'chat', mensajes: [{ de: 'otro', texto: 'Antes de contratarte, hazme una demo gratis.' }] }]);
  const centroPct = await conDeck(deck, page => page.evaluate(() => {
    const chat = document.querySelector('.lz-chat .chat');
    const r = chat.getBoundingClientRect();
    return ((r.top + r.bottom) / 2 / window.innerHeight) * 100;
  }));
  // Centrado el bloque quedaría cerca del 50%; anclado arriba debe quedar bien dentro del primer tercio.
  assert.ok(centroPct < 38, `el centro del chat quedó en ${centroPct.toFixed(1)}% del alto: sigue flotando al centro`);
});

test('un chat de 3+ mensajes en 9:16 sigue centrado (no se fuerza arriba)', { timeout: 120_000 }, async () => {
  const deck = base([{ tipo: 'chat', mensajes: [
    { de: 'otro', texto: '¿Cuánto cuesta y cuánto tarda?' },
    { de: 'yo', texto: 'Cuesta 400 pesos al mes y lo tienes listo en dos días.' },
    { de: 'otro', texto: 'Perfecto, ¿cómo le hago?' },
  ] }]);
  const centroPct = await conDeck(deck, page => page.evaluate(() => {
    const chat = document.querySelector('.lz-chat .chat');
    const r = chat.getBoundingClientRect();
    return ((r.top + r.bottom) / 2 / window.innerHeight) * 100;
  }));
  assert.ok(centroPct > 40 && centroPct < 60, `un chat largo no debería anclarse arriba (centro: ${centroPct.toFixed(1)}%)`);
});
