// Ronda 21 (juez independiente): dos huecos semánticos un nivel arriba de los ya corregidos en r19/r20.
// Verificados por el juez con paráfrasis nuevas (P/juez-r21/pruebas/semantica-r21.mjs, casos 3a y 3-control-b).
import test from 'node:test';
import assert from 'node:assert/strict';
import { revisarComponentes } from '../scripts/lib/conversacion.mjs';

test('r21: "comprometerme" no cae en la familia comprar/pedir/orden solo por compartir el prefijo "compr"', () => {
  const T = (q, r) => revisarComponentes(q, r).map(x => x.tema);
  // "comprar el plan" no responde a la duda de "no quiero comprometerme": el componente debe seguir sin resolver.
  assert.ok(T(
    '¿Tienes tiempo esta semana, ni sé si esto sirve para mi caso, ni quiero comprometerme a nada?',
    ['Son 20 minutos y sí sirve para tu caso: puedes comprar el plan básico si quieres probar primero.'],
  ).some(t => /comprometerme/.test(t)));
  // Control: la familia sigue viva para sus miembros reales (comprar ↔ compras, sin la raíz literal).
  assert.deepEqual(T(
    '¿Ya compras en otro lado?',
    ['Compro aquí desde hace tiempo.'],
  ), []);
});

test('r21: la palabra clave de un componente no elige un pronombre indefinido cuando empata en longitud', () => {
  const T = (q, r) => revisarComponentes(q, r).map(x => x.tema);
  // "el soporte es por correo" SÍ responde "tengo alguien de soporte": clave() no debe quedarse con "alguien".
  assert.deepEqual(T(
    '¿El precio incluye actualizaciones, ni tengo alguien de soporte, ni sé si aguanta mucho tráfico?',
    ['Sí incluye actualizaciones, cuesta $400 al mes, el soporte es por correo y aguanta hasta 10 mil visitas.'],
  ), []);
});
