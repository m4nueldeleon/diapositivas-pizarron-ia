// Ronda 21 (encargo, prioridad 3): en comparar/secuencia, el cursor de d_123 solo se comparaba por PRESENCIA
// (hay o no hay tinta neutra en la región) y su caja de posición, nunca por FORMA — dos siluetas muy distintas
// dentro de la misma caja pasaban igual. medirRegion ahora puede devolver una silueta 16×16 de la región (como
// ya hace tinta.mjs para el glifo de un emoji) e iouSiluetas la compara entre referencia y réplica.
import test from 'node:test';
import assert from 'node:assert/strict';
import { medirRegion, iouSiluetas } from '../scripts/lib/secuencia-referencia.mjs';

// Lienzo de 20×20, RGBA, todo blanco (255) por omisión.
function lienzo(w, h) { return new Uint8Array(w * h * 4).fill(255); }
function pintar(rgba, w, x, y, valor = 100) { const i = (y * w + x) * 4; rgba[i] = rgba[i + 1] = rgba[i + 2] = valor; }

test('medirRegion sin conSilueta no cambia su forma (compatibilidad con los llamados existentes)', () => {
  const r = medirRegion(lienzo(20, 20), 20, 20, [0, 0, 1, 1]);
  assert.equal(r.silueta, undefined);
});

test('medirRegion con conSilueta arma una rejilla 16×16 de la región, no del lienzo completo', () => {
  const w = 20, h = 20, rgba = lienzo(w, h);
  // Un cuadro de tinta neutra en la esquina superior izquierda de la región [.5,.5,.5,.5] → x:10-14, y:10-14
  for (let y = 10; y < 15; y++) for (let x = 10; x < 15; x++) pintar(rgba, w, x, y);
  const r = medirRegion(rgba, w, h, [.5, .5, .5, .5], 'neutro', true);
  assert.equal(r.silueta.length, 256);
  assert.ok(r.silueta.some(v => v === 1), 'la rejilla debe marcar la tinta pintada');
  // Nada pintado en la mitad derecha de la rejilla (columnas 8-15)
  assert.ok(r.silueta.filter((v, i) => (i % 16) >= 8).every(v => v === 0));
});

test('iouSiluetas: idéntica da 1, disjunta da 0, mitad y mitad da 0.5', () => {
  const a = new Array(256).fill(0).map((_, i) => (i < 128 ? 1 : 0));
  const b = new Array(256).fill(0).map((_, i) => (i < 128 ? 1 : 0));
  assert.equal(iouSiluetas(a, b), 1);
  const disjunta = new Array(256).fill(0).map((_, i) => (i >= 128 ? 1 : 0));
  assert.equal(iouSiluetas(a, disjunta), 0);
  const mitad = new Array(256).fill(0).map((_, i) => (i < 64 ? 1 : 0));
  assert.equal(iouSiluetas(a, mitad), 0.5);
  assert.equal(iouSiluetas(null, a), null);
});
