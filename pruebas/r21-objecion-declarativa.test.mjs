// Ronda 21 (juez independiente): el chequeo de objeción compuesta en un chat solo se disparaba con un "?"
// literal en el mensaje (reglas-arco.mjs). Una objeción declarativa («No tengo presupuesto, ni sé si
// funciona, ni quiero comprometerme sin verlo») es la forma MÁS natural de objetar en español y nunca
// llegaba a revisarComponentes. Confirmado por el juez con su propio deck (láminas «objecion»/«respuesta»).
import test from 'node:test';
import assert from 'node:assert/strict';
import { reglasRespuestaObjecion } from '../scripts/lib/reglas-arco.mjs';

test('r21: una objeción declarativa (sin "?") en un chat sigue exigiendo respuesta a cada parte', () => {
  const deck = { pieza: 'vsl', laminas: [
    { tipo: 'chat', mensajes: [
      { de: 'otro', texto: 'No tengo presupuesto, ni sé si esto funciona, ni quiero comprometerme sin verlo antes.' },
      { de: 'yo', texto: 'Eso es lo de menos, mucha gente se preocupa por lo mismo.' },
    ] },
  ] };
  assert.ok(reglasRespuestaObjecion(deck).avisos.length > 0, JSON.stringify(reglasRespuestaObjecion(deck)));
  // control: una respuesta que sí da presupuesto, funcionamiento y una prueba antes de comprometerse resuelve
  const resuelto = { pieza: 'vsl', laminas: [
    { tipo: 'chat', mensajes: [
      { de: 'otro', texto: 'No tengo presupuesto, ni sé si esto funciona, ni quiero comprometerme sin verlo antes.' },
      { de: 'yo', texto: 'El presupuesto son 400 pesos al mes, ya funciona para más de mil clientes y no te comprometes a nada: pruébalo gratis dos semanas antes de pagar.' },
    ] },
  ] };
  assert.deepEqual(reglasRespuestaObjecion(resuelto).avisos, []);
});
