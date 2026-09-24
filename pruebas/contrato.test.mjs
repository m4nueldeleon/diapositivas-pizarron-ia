import test from 'node:test';
import assert from 'node:assert/strict';
import { validarDeck } from '../scripts/lib/contrato.mjs';
import { LAYOUTS } from '../scripts/lib/construir.mjs';
import { codigo } from '../scripts/lib/emoji.mjs';
import fs from 'node:fs';

const tipos = Object.keys(LAYOUTS);

test('el demo es válido y usa los 25 diseños', () => {
  const deck = JSON.parse(fs.readFileSync(new URL('../ejemplos/demo/deck.json', import.meta.url)));
  assert.deepEqual(validarDeck(deck, tipos), []);
  assert.equal(tipos.length, 25);
  const usados = new Set(deck.laminas.map(l => l.tipo));
  assert.deepEqual(tipos.filter(t => !usados.has(t)), []);
});

test('detecta errores con mensajes útiles', () => {
  const e = validarDeck({ formato: '3:2', laminas: [{ tipo: 'foco', texto: 'x' }, { tipo: 'nope' }, { tipo: 'lista' }] }, tipos);
  assert.ok(e.some(x => x.includes('formato')));
  assert.ok(e.some(x => x.includes('no puede ir primero')));
  assert.ok(e.some(x => x.includes('«nope» no existe')));
  assert.ok(e.some(x => x.includes('falta items')));
  assert.deepEqual(validarDeck({}, tipos), ['falta «laminas» (una lista con al menos una lámina)']);
});

test('códigos de emoji con y sin FE0F', () => {
  assert.equal(codigo('💰'), '1f4b0');
  assert.equal(codigo('🧑‍⚕️'), '1f9d1-200d-2695-fe0f');
  assert.equal(codigo('🧑‍⚕️', false), '1f9d1-200d-2695');
});
