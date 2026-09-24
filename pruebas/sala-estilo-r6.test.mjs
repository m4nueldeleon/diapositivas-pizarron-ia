// Sala y video mantienen contratos distintos; nunca se deduce sala de en_vivo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { reglasPresentacion } from '../scripts/lib/reglas-deck.mjs';

test('sala: máximo dos semanas o seis meses, sin límite nuevo para video', () => {
  const laminas = [{ tipo: 'calendario', n: 15 }, { tipo: 'meses', celdas: Array.from({ length: 7 }, () => ({ mes: 'Ejemplo' })) }];
  const r = reglasPresentacion({ sala: true, laminas });
  assert.equal(r.errores.length, 2);
  assert.match(r.errores[0], /máximo 14 días.*divídelo/);
  assert.match(r.errores[1], /máximo 6 meses.*divide/);
  assert.deepEqual(reglasPresentacion({ laminas }).errores, []);
  assert.deepEqual(reglasPresentacion({ sala: true, formato: '9:16', laminas }).errores, []);
  assert.deepEqual(reglasPresentacion({ sala: true, laminas: [{ tipo: 'calendario', n: 14 }, { tipo: 'meses', celdas: Array(6).fill({ mes: 'Ejemplo' }) }] }).errores, []);
});

test('prueba: un marco de tutorial no acredita un resultado, aviso sin error ni tope', () => {
  const prueba = { tipo: 'prueba', encabezado: 'Una prueba real', capturas: [{ hueco: 'Tu imagen', plantilla: true }] };
  const r = reglasPresentacion({ laminas: [prueba] });
  assert.equal(r.avisos.length, 1); assert.deepEqual(r.errores, []);
  assert.match(r.avisos[0], /añade la captura.*tutorial/);
  assert.deepEqual(reglasPresentacion({ laminas: [{ ...prueba, encabezado: 'Tu captura va aquí' }] }).avisos, []);
  assert.deepEqual(reglasPresentacion({ laminas: [{ ...prueba, capturas: [{ src: 'ejemplo.png', procedencia: 'ejemplo' }] }] }).avisos, []);
});
