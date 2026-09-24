import test from 'node:test';
import assert from 'node:assert/strict';
import { marcar, plano, palabras, tamTexto, enfasis } from '../scripts/lib/markup.mjs';

test('escapa HTML del usuario antes de aplicar marcas', () => {
  const h = marcar('<img src=x onerror=alert(1)> **hola**');
  assert.ok(!h.includes('<img'));
  assert.ok(h.includes('&lt;img'));
  assert.ok(h.includes('<b>hola</b>'));
});

test('marcas del estilo', () => {
  assert.equal(marcar('__clave__'), '<b class="sub" data-sub>clave</b>');
  assert.equal(marcar('==ojo=='), '<mark>ojo</mark>');
  assert.equal(marcar('~~no~~'), '<s class="tachon" data-tachar>no</s>');
  assert.equal(marcar('{v:$9,000}'), '<span class="tono-v">$9,000</span>');
  assert.equal(marcar('[[ventas]]'), '<span class="mano">ventas</span>');
  assert.equal(marcar('a\\nb'), 'a<br>b');
});

test('texto plano y conteo de palabras ignoran las marcas', () => {
  assert.equal(plano('**Hola** __mundo__ {r:rojo}'), 'Hola mundo rojo');
  assert.equal(palabras('1,000 × **0.1%** = 1,000'), 3);
});

test('tamaño automático por largo', () => {
  assert.equal(tamTexto('Cinco palabras en esta frase'), 'grande');
  assert.equal(tamTexto('una frase de diez palabras que ya es mediana y crece'), 'medio');
  assert.equal(tamTexto('x '.repeat(20)), 'chico');
  assert.equal(tamTexto('lo que sea', 'enorme'), 'enorme');
});

test('cuenta énfasis', () => {
  assert.deepEqual(enfasis('__a__ ==b== **c** **d**'), { subrayados: 1, resaltados: 1, negritas: 2 });
});
