import test from 'node:test';
import assert from 'node:assert/strict';
import { cajaTinta, compararCajas, emparejar } from '../scripts/lib/tinta.mjs';

// Imagen sintética de 100×50 blanca con un rectángulo pintado
function lienzo(w, h, pintar) {
  const d = new Uint8ClampedArray(w * h * 4).fill(255);
  pintar((x, y, [r, g, b]) => { const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; });
  return d;
}
const rect = (x0, y0, x1, y1, c) => set => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, c); };

test('la caja de tinta encierra lo oscuro y lo rojo, e ignora fondos pálidos y la marca de agua', () => {
  const img = lienzo(100, 50, set => {
    rect(0, 0, 100, 50, [247, 195, 195])(set);   // fondo rosa pálido de cuadrante: no es tinta
    rect(20, 10, 40, 20, [17, 17, 17])(set);     // texto negro
    rect(50, 30, 60, 35, [200, 16, 30])(set);    // trazo rojo
    rect(90, 46, 99, 49, [0, 0, 0])(set);        // marca de agua en la esquina: se ignora
  });
  assert.deepEqual(cajaTinta(img, 100, 50), { x: 20, y: 20, w: 40, h: 50 });
  assert.equal(cajaTinta(lienzo(10, 10, () => {}), 10, 10), null);
});

test('comparar cajas: falla si algo pasa del umbral', () => {
  assert.equal(compararCajas({ x: 10, y: 10, w: 50, h: 50 }, { x: 12, y: 9, w: 55, h: 50 }).falla, false);
  assert.equal(compararCajas({ x: 10, y: 10, w: 50, h: 50 }, { x: 20, y: 9, w: 55, h: 50 }).falla, true);
  assert.equal(compararCajas(null, { x: 0, y: 0, w: 1, h: 1 }).falla, true);
});

test('emparejar: r<seg> con ref_<seg>, y avisa lo que sobra de cada lado', () => {
  const r = emparejar(['r90', 'r255', 'intro', 'r999'], ['ref_255.jpg', 'ref_90.jpg', 'ref_460.jpg', 'notas.txt']);
  assert.deepEqual(r.pares.map(p => p.id), ['r90', 'r255']);
  assert.deepEqual(r.sinRef, ['r999']);
  assert.deepEqual(r.sinLamina, ['ref_460.jpg']);
});
