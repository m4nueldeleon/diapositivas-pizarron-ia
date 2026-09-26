// R19 (juez, pendientes 2 y 3): un anuncio disfrazado («te muestro cómo queda») colaba como demostración porque
// «queda» está en la lista de palabras útiles, y una objeción de equipo respondida con «celular» seguía sin
// resolver porque el motor exigía la raíz «equip-» literal, sin sinónimos.
import test from 'node:test';
import assert from 'node:assert/strict';
import { revisarComponentes, demostracionChat } from '../scripts/lib/conversacion.mjs';

test('r19: «te muestro cómo queda» es un anuncio disfrazado, no una demostración', () => {
  assert.equal(demostracionChat({
    tipo: 'chat',
    mensajes: [
      { de: 'otro', texto: '¿Cómo se ve el resultado final de esto?' },
      { de: 'yo', texto: 'Enseguida te muestro cómo queda armado todo el proceso completo.' },
    ],
  }), false);
  // control positivo: una salida con un dato real sigue demostrando
  assert.equal(demostracionChat({
    tipo: 'chat',
    mensajes: [
      { de: 'otro', texto: '¿Cuánto cuesta y cuándo entregas?' },
      { de: 'yo', texto: 'Cuesta 900 pesos y te lo entrego el viernes.' },
    ],
  }), true);
});

test('r19: una objeción de equipo se responde con «celular» sin repetir la raíz «equip-»', () => {
  const T = (q, r) => revisarComponentes(q, r).map(x => x.tema);
  assert.deepEqual(T(
    'No tengo tiempo ni equipo ni experiencia para esto',
    ['Son 20 minutos al día, todo corre desde tu celular, y la plantilla ya trae los pasos: no requiere experiencia previa.'],
  ), []);
  // control positivo: sin ningún dato, «equipo» sigue marcándose
  assert.deepEqual(T(
    'No tengo tiempo ni equipo ni experiencia para esto',
    ['Eso es lo de menos, mucha gente se preocupa por lo mismo.'],
  ), ['tiempo', 'equipo', 'experiencia']);
});
