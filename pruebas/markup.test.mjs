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

test('las marcas cruzan un salto de línea real (el \\n de un deck.json)', () => {
  assert.equal(marcar('**a\nb**'), '<b>a<br>b</b>');
  assert.equal(marcar('__a\nb__'), '<b class="sub" data-sub>a<br>b</b>');
  assert.equal(marcar('~~a\nb~~'), '<s class="tachon" data-tachar>a<br>b</s>');
  assert.equal(marcar('==a\nb=='), '<mark>a<br>b</mark>');
  assert.equal(marcar('[[a\nb]]'), '<span class="mano">a<br>b</span>');
  assert.equal(marcar('{v:a\nb}'), '<span class="tono-v">a<br>b</span>');
  assert.equal(marcar('**a**\n\n**b**'), '<b>a</b><br><br><b>b</b>');
  assert.equal(marcar('x **a\nb** y **c**'), 'x <b>a<br>b</b> y <b>c</b>');
  assert.equal(marcar('__uno__\n**dos**'), '<b class="sub" data-sub>uno</b><br><b>dos</b>');
  // el caso de la réplica (ref_90): la negrita va en la frase clave, no invertida
  const r90 = marcar('the **best business\nmodel** to start as a **beginner**');
  assert.equal(r90, 'the <b>best business<br>model</b> to start as a <b>beginner</b>');
  assert.ok(!r90.includes('**'));
  // el \n escrito como texto (barra + n) sigue funcionando
  assert.equal(marcar('**a\\nb**'), '<b>a<br>b</b>');
});

test('el conteo de énfasis ve las marcas partidas en dos renglones', () => {
  assert.equal(enfasis('**a\nb**').negritas, 1);
  assert.equal(enfasis('__a\nb__').subrayados, 1);
  assert.equal(enfasis('==a\nb==').resaltados, 1);
});

test('MARCA_LITERAL detecta marcas sin convertir sin confundir un «==» suelto', async () => {
  const { MARCA_LITERAL } = await import('../scripts/lib/markup.mjs');
  const re = new RegExp(MARCA_LITERAL);
  assert.ok(re.test('**sin cerrar'));
  assert.ok(re.test('~~a'));
  assert.ok(re.test('{v:x'));
  assert.ok(!re.test('2 + 2 == 4'));
  assert.ok(!re.test('Hola [nombre]'));
});
