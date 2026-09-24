// Los ejemplos son material que se copia: el de venta (ejemplos/vsl-corto) cumple GUION §7 sin un solo aviso de guion,
// y ningún ejemplo deja el set de emojis en «auto» (SKILL §3).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { revisarDeck, esLlamadoVisible } from '../scripts/lib/reglas-deck.mjs';
import { sustituirDatos, validarDatos } from '../scripts/lib/datos.mjs';
import { resolverComo } from '../scripts/lib/contrato.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = n => JSON.parse(fs.readFileSync(path.join(RAIZ, 'ejemplos', n, 'deck.json'), 'utf8'));
const ejemplos = fs.readdirSync(path.join(RAIZ, 'ejemplos')).filter(n => fs.existsSync(path.join(RAIZ, 'ejemplos', n, 'deck.json')));

test('ejemplos: existe el modelo de venta y ningún deck usa "emoji": "auto"', () => {
  assert.ok(ejemplos.includes('vsl-corto') && ejemplos.includes('demo'), ejemplos.join(', '));
  for (const n of ejemplos) assert.ok(['apple', 'fluent'].includes(leer(n).emoji), `${n}: emoji «${leer(n).emoji}»`);
  assert.ok(fs.existsSync(path.join(RAIZ, 'ejemplos', 'vsl-corto', 'guion.md')));
});

test('vsl-corto: cero avisos de arco, objeción, llamado, prueba, credibilidad, voz, proyección u oferta; lo que queda son datos', () => {
  const crudo = resolverComo(leer('vsl-corto')).deck;
  assert.equal(crudo.pieza, 'vsl-corto');
  assert.deepEqual(validarDatos(crudo.datos), []);
  const { deck } = sustituirDatos(crudo);
  const r = revisarDeck(deck, deck.laminas.map(l => Math.max(1, Array.isArray(l.voz) ? l.voz.length : 1)), { crudo });
  assert.deepEqual(r.errores, []);
  const deGuion = r.avisos.filter(a => /llamado|objeci|prueba|credibilidad|antítesis|VOZ-HUMANA|proyecci|garantía|bono|escasez|oferta|arranca|saludo|cámara/i.test(a));
  assert.deepEqual(deGuion, []);
  assert.deepEqual(r.faltaParaFinal, []);
  // la objeción va seguida de su respuesta, y el llamado aparece 2 veces o más
  const L = deck.laminas, k = L.findIndex(l => /Objeción #1/.test(l.encabezado || ''));
  assert.ok(k > 0 && L[k + 1].tipo === 'idea' && !/Objeción/.test(L[k + 1].encabezado || ''));
  assert.ok(L.filter(esLlamadoVisible).length >= 2);
});

test('demo: la objeción tiene respuesta en la lámina siguiente, no:⌨️ y un llamado después del precio', () => {
  const demo = leer('demo'), L = demo.laminas;
  const k = L.findIndex(l => l.id === 'objecion');
  assert.equal(L[k].emoji, 'no:⌨️');
  assert.equal(L[k + 1].id, 'respuesta');
  const precio = L.findIndex(l => l.id === 'precio');
  assert.ok(L.slice(precio + 1).some(l => l.tipo === 'boton' && l.llamado === true));
  assert.ok(!L.some(l => /Lo demás es ruido/.test(l.nota || '')));
});
