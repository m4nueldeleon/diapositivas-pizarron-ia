// R20 (juez independiente, pendientes 1, 2 y 3): tres huecos semánticos que sobrevivían a los arreglos puntuales
// de r19 en cuanto se probaban con una paráfrasis nueva. Casos verificados por el juez, no repetidos de r19.
import test from 'node:test';
import assert from 'node:assert/strict';
import { demostracionChat, revisarComponentes } from '../scripts/lib/conversacion.mjs';
import { reglasRespuestaObjecion } from '../scripts/lib/reglas-arco.mjs';

test('r20: «mira/checa/ve cómo queda…» y «aquí puedes ver cómo se resuelve…» son anuncios vacíos, no demostraciones', () => {
  assert.equal(demostracionChat({
    tipo: 'chat',
    mensajes: [
      { de: 'otro', texto: '¿Cómo se ve el resultado final de esto?' },
      { de: 'yo', texto: 'Mira cómo queda armado el proceso completo.' },
    ],
  }), false);
  assert.equal(demostracionChat({
    tipo: 'chat',
    mensajes: [
      { de: 'otro', texto: '¿Qué tan rápido puedo verlo funcionando?' },
      { de: 'yo', texto: 'Aquí puedes ver cómo se resuelve todo esto.' },
    ],
  }), false);
  assert.equal(demostracionChat({
    tipo: 'chat',
    mensajes: [
      { de: 'otro', texto: '¿Cómo se ve armado el proceso completo?' },
      { de: 'yo', texto: 'Checa cómo queda el resultado ya armado.' },
    ],
  }), false);
  // control: la misma construcción vaga, pero con un dato propio, sí demuestra
  assert.equal(demostracionChat({
    tipo: 'chat',
    mensajes: [
      { de: 'otro', texto: '¿Cómo se ve el resultado final de esto?' },
      { de: 'yo', texto: 'Mira cómo queda: 12 páginas listas y el enlace de descarga.' },
    ],
  }), true);
  // control: la cifra concreta ya cubierta por r19 sigue demostrando
  assert.equal(demostracionChat({
    tipo: 'chat',
    mensajes: [
      { de: 'otro', texto: '¿Cuánto tardas en entregar el reporte final?' },
      { de: 'yo', texto: 'Aquí está el reporte: quedó listo el jueves con doce páginas.' },
    ],
  }), true);
});

test('r20: «videollamadas» no resuelve el componente «llamada» por contener la subcadena, solo por ser la palabra', () => {
  const T = (q, r) => revisarComponentes(q, r).map(x => x.tema);
  assert.deepEqual(T(
    '¿Tienes tiempo, ni sé si esto sirve, ni quiero perder otra llamada?',
    ['Son veinte minutos, sirve para tu caso, y no hay más videollamadas.'],
  ), ['llamada']);
  // control: la palabra completa sí resuelve
  assert.deepEqual(T(
    '¿Tienes tiempo, ni sé si esto sirve, ni quiero perder otra llamada?',
    ['Son veinte minutos, sirve para tu caso, y no perderás ninguna llamada más.'],
  ), []);
  // control positivo ya cubierto por r19: sinónimo real de familia sigue resolviendo
  assert.deepEqual(T(
    'No tengo tiempo ni equipo ni experiencia para esto',
    ['Son 20 minutos al día, todo corre desde tu celular, y la plantilla ya trae los pasos: no requiere experiencia previa.'],
  ), []);
});

test('r20: una pregunta neutra de agenda con «o» en un chat no se marca como objeción sin resolver', () => {
  const deck = { pieza: 'vsl', laminas: [
    { tipo: 'chat', mensajes: [
      { de: 'otro', texto: '¿La llamada es en mi hora o en la tuya?' },
      { de: 'yo', texto: 'En la tuya: la ves en tu enlace.' },
    ] },
  ] };
  assert.deepEqual(reglasRespuestaObjecion(deck).avisos, []);
  // control: una objeción real dentro de un chat (con negación) sigue exigiendo respuesta
  const objecion = { pieza: 'vsl', laminas: [
    { tipo: 'chat', mensajes: [
      { de: 'otro', texto: '¿No tengo tiempo o no me va a servir?' },
      { de: 'yo', texto: 'Eso es lo de menos, mucha gente se preocupa por lo mismo.' },
    ] },
  ] };
  assert.ok(reglasRespuestaObjecion(objecion).avisos.length > 0, JSON.stringify(reglasRespuestaObjecion(objecion)));
});
