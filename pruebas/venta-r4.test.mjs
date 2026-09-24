// Ronda 4 (mercadotecnia): el orden de la oferta en un VSL, un solo canal de llamado, la promesa antes del segundo 30,
// objeciones sin frecuencia inventada y el cierre de una clase express. Funciones puras de scripts/lib/reglas-deck.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { reglasArco, reglasDuracion, reglasApertura, reglasObjecion, inicioOferta, llamadoAntesDeRevelar, canalesDeLlamado,
  cierraConLlamado, cierreDeClase, revisarDeck } from '../scripts/lib/reglas-deck.mjs';
import { PIEZAS } from '../scripts/lib/tiempos.mjs';

const idea = (texto, extra = {}) => ({ tipo: 'idea', emoji: '💡', texto, ...extra });
const beats = (n, voz = 'una frase de diez palabras que se dice en voz alta') => Array.from({ length: n }, (_, i) => idea(`Lámina ${i}`, { voz }));
const unos = n => Array.from({ length: n }, () => 1);
const oscura = { tipo: 'oscura', titulo: 'Sala Llena', voz: 'Por eso armé Sala Llena.' };
const boton = { tipo: 'boton', boton: 'Aplica aquí', emoji: '📝' };
const obj = idea('**«No tengo tiempo»**', { emoji: 'no:⏳', encabezado: 'Objeción #1', encabezado_pos: 'entre', voz: 'Objeción número uno: no tengo tiempo.' });

test('oferta: un botón no marca el inicio de la oferta; la revelación oscura sí (y sin oscura, el primer stack)', () => {
  assert.equal(inicioOferta([idea('a'), boton, idea('b'), oscura, { tipo: 'stack', items: [] }]), 3);
  assert.equal(inicioOferta([idea('a'), boton, { tipo: 'stack', items: [] }]), 2);
  assert.equal(inicioOferta([idea('a'), boton]), -1);
  // un botón al 40% ya no tapa una revelación al 90%
  const deck = { pieza: 'vsl-corto', laminas: [...beats(20), boton, ...beats(25), oscura, ...beats(5)] };
  const r = reglasDuracion(deck, unos(deck.laminas.length));
  assert.ok(r.avisos.some(a => /la oferta del VSL corto empieza/.test(a)), r.avisos.join('\n'));
});

test('VSL: un llamado antes de la revelación avisa (vsl y vsl-corto); en un webinar no', () => {
  const temprano = { pieza: 'vsl-corto', laminas: [...beats(4), boton, obj, idea('Respuesta'), oscura, ...beats(2), boton] };
  assert.equal(llamadoAntesDeRevelar(temprano), 4);
  assert.ok(reglasArco(temprano).avisos.some(a => /lámina 5 .*pide actuar antes de decir qué se vende/.test(a)));
  assert.ok(!reglasArco({ ...temprano, pieza: 'webinar' }).avisos.some(a => /pide actuar antes/.test(a)));
  const bien = { pieza: 'vsl-corto', laminas: [...beats(4), obj, idea('Respuesta'), oscura, ...beats(2), boton, ...beats(2), { ...boton }] };
  assert.equal(llamadoAntesDeRevelar(bien), -1);
  assert.deepEqual(reglasArco(bien).avisos, []);
});

test('VSL: mezclar botón y palabra clave por WhatsApp avisa; la misma acción dos veces no', () => {
  const cita = idea('Escríbeme **CITA** por WhatsApp', { llamado: true });
  const mezcla = { pieza: 'vsl-corto', laminas: [...beats(3), obj, idea('R'), oscura, boton, ...beats(2), cita] };
  const c = canalesDeLlamado(mezcla);
  assert.deepEqual([c.boton, c.palabra], [[6], [9]]);
  assert.ok(reglasArco(mezcla).avisos.some(a => /mezclan dos acciones/.test(a)));
  const solo = { ...mezcla, laminas: [...beats(3), obj, idea('R'), oscura, cita, ...beats(2), { ...cita }] };
  assert.ok(!reglasArco(solo).avisos.some(a => /mezclan/.test(a)));
});

test('apertura: en un VSL sin promesa ni mecanismo antes del segundo 30 avisa; con «Sin:» o «…» subrayado no; en un tutorial no', () => {
  const gancho = { tipo: 'chat', mensajes: [{ de: 'otro', texto: '¿Tienes cita?' }], voz: 'Once cuarenta de la noche: te piden una cita.' };
  const dolor = beats(8, 'contestas tarde y la cita se va con otro de noche');
  const viejo = { pieza: 'vsl-corto', laminas: [gancho, ...dolor] };
  const aviso = a => /primeros 30 s no dicen qué gana/.test(a);
  assert.ok(reglasApertura(viejo, unos(viejo.laminas.length)).avisos.some(aviso));
  assert.ok(!reglasApertura({ ...viejo, pieza: 'tutorial' }, unos(viejo.laminas.length)).avisos.some(aviso));
  const conSin = { pieza: 'vsl-corto', laminas: [gancho, { tipo: 'lista', encabezado: 'Sin:', items: ['Desvelarte'] }, ...dolor] };
  assert.ok(!reglasApertura(conSin, unos(conSin.laminas.length)).avisos.some(aviso));
  const conMecanismo = { pieza: 'vsl', laminas: [gancho, idea('Lo llamo la __«Agenda en automático»__'), ...dolor] };
  assert.ok(!reglasApertura(conMecanismo, unos(conMecanismo.laminas.length)).avisos.some(aviso));
  // el mecanismo al segundo 40 ya no cuenta
  const tarde = { pieza: 'vsl', laminas: [gancho, ...dolor, idea('Lo llamo la __«Agenda en automático»__')] };
  assert.ok(reglasApertura(tarde, unos(tarde.laminas.length)).avisos.some(aviso));
});

test('objeciones: «la que más oigo» o «de siempre» sin dato avisan; con OBJECION_N confirmado o sin frecuencia no', () => {
  const con = voz => ({ pieza: 'vsl-corto', laminas: [idea('x'), { ...obj, voz }, idea('Respuesta')] });
  assert.match(reglasObjecion(con('La objeción que más oigo: no tengo tiempo.')).avisos[0], /frecuente sin dato.*OBJECION_1/);
  assert.equal(reglasObjecion(con('La objeción de siempre: no tengo tiempo.')).avisos.length, 1);
  assert.deepEqual(reglasObjecion(con('Objeción número uno: no tengo tiempo.')).avisos, []);
  assert.deepEqual(reglasObjecion({ ...con('La que más oigo: no tengo tiempo.'), datos: { OBJECION_1: { valor: 'No tengo tiempo' } } }).avisos, []);
  assert.equal(reglasObjecion({ ...con('La que más oigo: no tengo tiempo.'), datos: { OBJECION_1: { valor: 'No tengo tiempo', propuesto: true } } }).avisos.length, 1);
  // también en la voz de la respuesta
  const resp = { pieza: 'vsl-corto', laminas: [obj, idea('R', { voz: 'Todos me dicen eso, y es fácil.' })] };
  assert.equal(reglasObjecion(resp).avisos.length, 1);
});

test('clase express: tutorial con "clase": true cierra con la próxima clase; un tutorial grabado sigue pidiendo un llamado visible', () => {
  const cierre = [idea('Tu tarea: **sube tu encuesta**'), idea('Te espero en la próxima clase', { emoji: '📅' })];
  assert.equal(cierraConLlamado({ pieza: 'tutorial', clase: true, laminas: [idea('Paso'), ...cierre] }), true);
  assert.equal(cierraConLlamado({ pieza: 'tutorial', laminas: [idea('Paso'), ...cierre] }), false);
  // el tutorial va de 2 a 8 min: ya no queda hueco de 1-3 min entre el reel y el tutorial
  assert.deepEqual([PIEZAS.tutorial.min, PIEZAS.tutorial.max], [2, 8]);
  const dos = { pieza: 'tutorial', laminas: beats(34) };   // ~2:10
  assert.ok(!reglasDuracion(dos, unos(34)).avisos.some(a => /dura/.test(a)));
});

test('revisarDeck suma la regla de objeciones', () => {
  const d = { pieza: 'vsl-corto', laminas: [idea('x'), { ...obj, voz: 'La de siempre: no tengo tiempo.' }, idea('R')] };
  assert.ok(revisarDeck(d, unos(3)).avisos.some(a => /frecuente sin dato/.test(a)));
});

test('tutorial que cierra con una tarea: los dos avisos dicen la misma salida (clase express o llamado real), sin callejón', () => {
  const tarea = { ...idea('Tu tarea: **sube tu encuesta**'), llamado: true };
  const conLlamado = cierreDeClase({ pieza: 'tutorial', en_vivo: true, laminas: [idea('Paso'), tarea] }).avisos.join('\n');
  assert.match(conLlamado, /en una tarea/);
  assert.match(conLlamado, /"clase": true/);
  const sinLlamado = reglasArco({ pieza: 'tutorial', en_vivo: true, laminas: [idea('Paso'), idea('Tu tarea: **sube tu encuesta**')] }).avisos.join('\n');
  assert.match(sinLlamado, /termina sin llamado/);
  assert.match(sinLlamado, /"clase": true/);
  // en una clase express la tarea con su puente (con su dato: cuándo) no pide nada más
  assert.deepEqual(cierreDeClase({ pieza: 'tutorial', clase: true, laminas: [idea('Paso'), idea('Tu tarea: **sube tu encuesta**'), idea('Te espero el **jueves 2 de octubre, 7 pm**')] }).avisos, []);
  // r5: «Te espero en la próxima clase» sin cuándo ni cómo es un puente sin dato: aviso y borrador
  const vago = cierreDeClase({ pieza: 'tutorial', clase: true, laminas: [idea('Paso'), idea('Tu tarea: **sube tu encuesta**'), idea('Te espero en la próxima clase')] });
  assert.ok(vago.avisos.some(a => /^puente sin dato/.test(a)), vago.avisos.join('\n'));
  assert.ok(vago.porConfirmar.PUENTE);
});
