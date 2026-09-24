import test from 'node:test';
import assert from 'node:assert/strict';
import { analizarCompuesto, analizarTrazo, trazoSVG, Emojis, specsDeCampo } from '../scripts/lib/emoji.mjs';
import { conceptoDe } from '../scripts/lib/emoji-diccionario.mjs';
import { reglasVinetasPlan, reglasEyebrows, reglasTrazosPropios, reglasProductoIconos, reglasConceptosIconos, reglasEstilo, notaQA, infoIconos, emojisDeLamina } from '../scripts/lib/reglas-deck.mjs';

const deck = (...laminas) => ({ laminas });
const lista = (encabezado, extra = {}) => ({ tipo: 'lista', encabezado, vineta: 'check', items: ['Primero', 'Segundo'], ...extra });

test('r7: check de temario, objetivos o facilitador pendiente avisa una sola vez sin restar', () => {
  for (const l of [lista('Hoy vemos:'), lista('Objetivos'), lista('Quién lo imparte · por confirmar', { items: ['{{FACILITADOR}}', '[FECHA]'] }), lista('Agenda', { vineta: '', items: [{ emoji: '✅', texto: 'Presentación' }] })]) {
    const r = reglasVinetasPlan(deck(l));
    assert.equal(r.avisos.length, 1);
    assert.match(r.avisos[0], /vineta:"numero"/);
    assert.equal(notaQA(r), 100);
  }
});
test('r7: check de incluidos y hechos no se confunde con agenda', () => {
  for (const l of [lista('Incluye: módulos'), lista('Te llevas una evaluación'), lista('Es para ti si'), lista('Temario', { hechos: [1] }), lista('Agenda', { activo: 1 }), lista('Agenda', { vineta: 'numero' })]) assert.deepEqual(reglasVinetasPlan(deck(l)).avisos, []);
  assert.deepEqual(specsDeCampo('vineta', 'numero'), []);
  assert.deepEqual(specsDeCampo('vineta', 'letras'), []);
  assert.equal(infoIconos(deck(lista('Agenda', { vineta: 'numero' }))), null);
});
test('r7: trazo estable, negro, con texto escapado y figuras cerradas', () => {
  const spec = 'trazo:triangulo|MÉTODO';
  assert.equal(trazoSVG(spec), trazoSVG(spec));
  assert.match(trazoSVG(spec), /stroke="#171717".*stroke-linecap="round"/);
  assert.match(trazoSVG(spec), /font-family="Caveat,cursive" font-weight="700"/);
  assert.match(trazoSVG('trazo:marco|<b>'), /&lt;B&gt;/);
  assert.doesNotMatch(trazoSVG('trazo:marco|<b>'), /<B>/);
  assert.match(analizarCompuesto('trazo:estrella|NOMBRE').error, /triangulo, circulo o marco/);
  assert.ok(analizarTrazo('trazo:marco|A\nB').error);
  assert.ok(analizarTrazo(`trazo:marco|${'X'.repeat(25)}`).error);
  const em = new Emojis({ modo: 'apple' });
  assert.match(em.html(`no:${spec}+💰`), /trazo-concepto/);
  assert.equal(em.malformados.size, 0);
  assert.match(conceptoDe(spec), /término propio: MÉTODO/);
  assert.equal(infoIconos(deck({ tipo: 'idea', emoji: spec })), null);
  assert.match(conceptoDe('🪝'), /gancho/);
});
test('r7: los símbolos propios vuelven y conservan figura con máximo dos rótulos', () => {
  const idea = emoji => ({ tipo: 'idea', emoji });
  assert.deepEqual(reglasTrazosPropios(deck(idea('trazo:marco|PLAN'), idea('trazo:marco|PLAN'))).avisos, []);
  assert.match(reglasTrazosPropios(deck(idea('trazo:marco|PLAN'))).avisos[0], /una sola vez/);
  assert.match(reglasTrazosPropios(deck(idea('trazo:marco|PLAN'), idea('trazo:circulo|PLAN'))).avisos[0], /distinta figura/);
  assert.ok(reglasTrazosPropios(deck(...['UNO', 'DOS', 'TRES'].map(t => idea(`trazo:marco|${t}`)))).avisos.some(a => /3 rótulos distintos/.test(a)));
});
test('r7: iconos mixtos conservan el índice de su etiqueta y cuentan el trazo de objeto', () => {
  const l = { tipo: 'pasos', iconos: [{ emoji: 'trazo:triangulo|MÉTODO' }, '📅', { emoji: '💰', etiqueta: 'Dinero' }], etiquetas: ['Método propio', 'Fecha'] };
  assert.deepEqual(emojisDeLamina(l).map(e => [e.base, e.texto]), [['trazo:triangulo|MÉTODO', 'Método propio'], ['📅', 'Fecha'], ['💰', 'Dinero']]);
  const avisos = reglasTrazosPropios(deck(l)).avisos;
  assert.equal(avisos.length, 1);
  assert.match(avisos[0], /MÉTODO.*una sola vez/);
});
test('r7: el producto mantiene su compuesto entre revelación y stack', () => {
  const l = [{ tipo: 'oscura', titulo: 'El agente de citas', emoji: '🤖+📅' }, { tipo: 'stack', items: [{ texto: 'Tu agente de citas', emoji: '🤖' }] }];
  assert.match(reglasProductoIconos(deck(...l)).avisos[0], /producto sale con 🤖\+📅 en la 1 y con 🤖 en la 2/);
  assert.match(reglasProductoIconos(deck({ ...l[0], titulo: '{{PRODUCTO}}', texto: 'Tu agente de citas, configurado contigo' }, l[1])).avisos[0], /producto sale con 🤖\+📅/);
  assert.deepEqual(reglasProductoIconos(deck(l[0], { ...l[1], items: [{ texto: 'Agente de citas', emoji: '🤖+📅' }] })).avisos, []);
  const conceptos = { '🤖+📅': 'el agente de citas', '🤖': 'el agente que agenda' };
  assert.match(reglasProductoIconos({ laminas: [], conceptos }).avisos[0], /sustantivo principal «agente»/);
  assert.deepEqual(reglasProductoIconos({ laminas: [], conceptos: { '🤖': 'agente', '🤖+📅': 'calendario inteligente' } }).avisos, []);
});
test('r7: coherencia incluye el mapa declarado y paga, omite herencias y conserva corte de frases', () => {
  const previo = { tipo: 'idea', emoji: '💰', texto: 'Dinero' };
  for (const siguiente of [{ tipo: 'pasos', iconos: ['💰'], etiquetas: ['Tiempo'] }, { tipo: 'mapa', items: [{ emoji: '💰', texto: 'Tiempo' }] }, { tipo: 'lista', paga: 'ancla', items: [{ emoji: '💰', texto: 'Tiempo' }] }, { tipo: 'grafica', barras: [{ emoji: '💰', etiqueta: 'Tiempo', valor: 5 }] }]) {
    assert.ok(reglasConceptosIconos(deck(previo, siguiente)).avisos.some(a => /coherencia emoji/.test(a)));
    assert.ok(!reglasConceptosIconos(deck(previo, { ...siguiente, como: 'mapa' })).avisos.some(a => /coherencia emoji/.test(a)));
  }
  const larga = 'Un término muy largo creado para este caso';
  const otro = { tipo: 'idea', emoji: '💰', texto: larga };
  assert.deepEqual(reglasConceptosIconos(deck(previo, otro)).avisos, []);
  assert.ok(reglasConceptosIconos({ ...deck(previo, otro), conceptos: { '💰': larga } }).avisos.some(a => /coherencia emoji/.test(a)));
});
test('r7: el verbo de un paso no redefine el concepto de su icono', () => {
  for (const [emoji, etiqueta, texto] of [['🤖', 'Aplican', 'IA'], ['🤖', 'Contesta', 'IA'], ['📲', 'Manda', 'Mensaje']]) {
    const d = deck({ tipo: 'pasos', iconos: [emoji], etiquetas: [etiqueta] }, { tipo: 'idea', emoji, texto });
    assert.ok(!reglasConceptosIconos(d).avisos.some(a => /coherencia emoji/.test(a)));
  }
});
test('r7: secciones repetidas piden mapa y los encabezados válidos quedan libres', () => {
  const secciones = ['Módulo 1', 'Semana 2', 'Bloque 3'].map(encabezado => ({ tipo: 'idea', encabezado, texto: 'Una frase' }));
  assert.match(reglasEyebrows(deck(...secciones)).avisos[0], /3 láminas.*mapa que vuelve/);
  // 12 láminas: 4 con encabezado no exento (33 %) aunque haya mapa
  const relleno = [{ tipo: 'idea', encabezado: 'Módulo 4', texto: 'Una frase' }, ...[...Array(7)].map(() => ({ tipo: 'idea', texto: 'Una frase' }))];
  const conMapa = reglasEyebrows(deck(...secciones, { tipo: 'pasos', como: 'mapa', activo: 1 }, ...relleno)).avisos;
  assert.ok(!conMapa.some(a => /mapa que vuelve/.test(a)));
  assert.ok(conMapa.some(a => /25 %/.test(a)), 'el mapa no exime los encabezados de las demás láminas');
  assert.equal(reglasEstilo(deck(...secciones)).avisos.length, 3);
  const validos = ['Sin:', 'Incluye:', 'Ellos harán:', 'La idea…', 'La pregunta?', 'Objeción #1', 'Paso 1'].map(encabezado => ({ tipo: 'idea', encabezado, encabezado_pos: 'entre' }));
  assert.deepEqual(reglasEstilo(deck(...validos)).avisos, []);
  for (const tipo of ['lista', 'flujo', 'chat', 'cifra']) assert.ok(reglasEstilo(deck({ tipo, encabezado: 'Lección · semana 2' })).avisos.some(a => /eyebrow/.test(a)));
});
