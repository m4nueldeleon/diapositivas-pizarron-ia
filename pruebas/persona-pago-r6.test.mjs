import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reglasPersona, infoPersona } from '../scripts/lib/sincronia.mjs';
import { reglasPagoGancho } from '../scripts/lib/reglas-arco.mjs';
import { resolverComo, sanearDeck, validarDeck, CAMPOS_OBJETO } from '../scripts/lib/contrato.mjs';

const idea = (texto, voz) => ({ tipo: 'idea', texto, voz });
const persona = (texto, voz, extra = {}) => reglasPersona({ ...extra, laminas: [idea(texto, voz)] });

test('persona: pantalla y voz opuestas son error incluso sin declarar el trato', () => {
  assert.match(persona('Ustedes van a **lanzar** hoy', 'Tú vas a lanzar hoy').errores[0], /pantalla y voz.*VOZ-HUMANA/);
  assert.match(persona('Llévate la guía', 'Tómenle foto').errores[0], /pantalla y voz/);
  assert.match(persona('Les dejo una tarea', 'Te va a llegar').errores[0], /pantalla y voz/);
});

test('persona: mezcla dentro del mismo texto avisa o falla según el trato declarado', () => {
  const texto = 'Les dejo una tarea; te va a llegar por correo';
  assert.match(persona(texto, '').avisos[0], /mezcla tú y ustedes.*VOZ-HUMANA/);
  assert.match(persona(texto, '', { persona: 'tu' }).errores[0], /persona opuesta/);
});

test('persona: reconoce los imperativos con enclítico de la lista cerrada', () => {
  for (const texto of ['Tómalo', 'Escanéalo', 'Llévate', 'Grábate']) assert.equal(persona(texto, 'Ustedes').errores.length, 1, texto);
  for (const texto of ['Tómenlo', 'Tómenle', 'Grábense', 'Llévense', 'Levanten']) assert.equal(persona(texto, 'Tú').errores.length, 1, texto);
  assert.deepEqual(persona('Su equipo y sus clientes son expertos y van juntos; compran y venden', 'Tú decides').errores, []);
});

test('persona: falta de declaración es aviso en vivo e información suave en video', () => {
  assert.match(persona('Inicio', 'Inicio', { en_vivo: true }).avisos[0], /persona sin declarar: decide tu o ustedes.*VOZ-HUMANA/);
  assert.deepEqual(persona('Inicio', 'Inicio').avisos, []);
  assert.match(infoPersona({})[0], /persona asumida: tu/);
  assert.deepEqual(infoPersona({ persona: 'ustedes' }), []);
});

test('persona: frases-fórmula ignoran mayúsculas y acentos, sin ocultar el resto del texto', () => {
  const extra = { persona: 'ustedes', persona_excepciones: ['LA GUÍA TE LLEVA.'] };
  assert.deepEqual(persona('La guía te lleva. Ustedes deciden.', 'Ustedes deciden', extra).errores, []);
  assert.equal(persona('La guía te lleva. Tú decides.', 'Ustedes deciden', extra).errores.length, 1);
  assert.deepEqual(reglasPersona({ persona: 'ustedes', laminas: [{ ...idea('Te ayudo', 'Te ayudo'), excepcion_persona: 'uno-a-uno' }] }).errores, []);
});

test('contrato: sanea persona_excepciones y acepta uno-a-uno sin mutar el deck', () => {
  const deck = { persona_excepciones: [' Te sirve ', '', 4], laminas: [{ ...idea('Te sirve'), excepcion_persona: 'uno-a-uno' }] };
  const r = sanearDeck(deck);
  assert.deepEqual(r.deck.persona_excepciones, ['Te sirve']);
  assert.equal(r.deck.laminas[0].excepcion_persona, 'uno-a-uno');
  assert.equal(deck.persona_excepciones[0], ' Te sirve ');
  assert.match(r.avisos[0], /persona_excepciones/);
  assert.ok(validarDeck(deck, ['idea']).some(e => /persona_excepciones/.test(e)));
});

const arco = extra => ({ pieza: 'vsl', laminas: Array.from({ length: 20 }, (_, i) => ({ ...idea(`Idea ${i + 1}`), id: `l${i + 1}`, ...(extra?.[i] || {}) })) });

test('pago: un retorno en el último 25 % hacia el primer 20 % basta', () => {
  for (const campo of ['paga', 'como']) assert.deepEqual(reglasPagoGancho(arco({ 19: { [campo]: 'l1' } })).avisos, []);
  assert.match(reglasPagoGancho(arco()).avisos[0], /falta el pago del gancho.*ARCOS/);
  assert.deepEqual(reglasPagoGancho({ ...arco(), pieza: 'propuesta' }).avisos, []);
});

test('pago: avisa origen fuera del gancho, id desconocido y retorno antes del cierre', () => {
  for (const id of ['l5', 'ausente']) assert.ok(reglasPagoGancho(arco({ 19: { paga: id } })).avisos.some(a => /fuera del primer 20 %.*ARCOS/.test(a)));
  assert.match(reglasPagoGancho(arco({ 5: { paga: 'l1' } })).avisos[0], /falta el pago/);
  assert.deepEqual(reglasPagoGancho({ ...arco({ 19: { paga: 'l4' } }), pieza: 'tutorial', clase: true }).avisos, []);
});

test('contrato: paga solo conserva ids existentes, con aviso accionable si falta', () => {
  const base = arco({ 19: { paga: 'l1' } });
  assert.equal(sanearDeck(base).deck.laminas[19].paga, 'l1');
  for (const paga of ['inexistente', 1, { id: 'l1' }]) {
    const r = sanearDeck(arco({ 19: { paga } }));
    assert.equal(r.deck.laminas[19].paga, undefined);
    assert.ok(r.sugerencias.some(a => /paga debe apuntar.*ARCOS/.test(a)));
  }
});

test('como: chat hereda su marco, pero la hija aporta mensajes y voz', () => {
  const madre = { id: 'inicio', tipo: 'chat', encabezado: 'Una consulta', avatar_yo: '🤖', avatar_otro: '👤', avatar_tam: 80, sello: 'Visto', sello_sobre: 'm0', mensajes: [{ texto: 'Inicio' }], voz: 'Inicio' };
  const hija = { id: 'fin', tipo: 'chat', como: 'inicio', sello: 'Listo', mensajes: [{ texto: 'Respondido' }], voz: 'Cierre' };
  const copia = structuredClone(madre);
  const r = resolverComo({ laminas: [madre, hija] });
  assert.deepEqual(r.errores, []);
  assert.equal(r.deck.laminas[1].encabezado, 'Una consulta');
  assert.equal(r.deck.laminas[1].avatar_yo, '🤖');
  assert.equal(r.deck.laminas[1].sello, 'Listo');
  assert.deepEqual(r.deck.laminas[1].mensajes, [{ texto: 'Respondido' }]);
  assert.equal(r.deck.laminas[1].voz, 'Cierre');
  assert.deepEqual(madre, copia);
  assert.ok(!CAMPOS_OBJETO.chat.includes('mensajes'));
});

test('como: idea hereda emojis y tamaño; prueba hereda capturas', () => {
  for (const [tipo, campos] of [['idea', { emoji: '😩+📥', emoji_tam: 'heroe' }], ['prueba', { capturas: [{ hueco: 'La pantalla' }] }]]) {
    const r = resolverComo({ laminas: [{ id: 'a', tipo, ...campos, texto: 'Arranque' }, { id: 'b', tipo, como: 'a', texto: 'Resuelto' }] });
    assert.deepEqual(r.errores, []);
    for (const [campo, valor] of Object.entries(campos)) assert.deepEqual(r.deck.laminas[1][campo], valor);
    assert.equal(r.deck.laminas[1].texto, 'Resuelto');
  }
});

test('ejemplos: reel, clase express y venta pagan el gancho, y los nuevos campos constan en schema', () => {
  for (const nombre of ['reel', 'clase-express', 'vsl-corto']) {
    const deck = JSON.parse(fs.readFileSync(new URL(`../ejemplos/${nombre}/deck.json`, import.meta.url)));
    assert.deepEqual(reglasPagoGancho(deck).avisos, [], nombre);
  }
  const schema = JSON.parse(fs.readFileSync(new URL('../templates/deck.schema.json', import.meta.url)));
  assert.ok(schema.properties.persona_excepciones);
  assert.ok(schema.$defs.lamina.properties.paga);
  assert.ok(schema.$defs.lamina.properties.excepcion_persona.enum.includes('uno-a-uno'));
});
