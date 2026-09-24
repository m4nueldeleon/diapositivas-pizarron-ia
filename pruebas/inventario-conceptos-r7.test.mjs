import test from 'node:test';
import assert from 'node:assert/strict';
import { inventarioIconos } from '../scripts/lib/reglas-deck.mjs';
import { infoConceptos } from '../scripts/lib/emoji-diccionario.mjs';
import { revisarTexto } from '../scripts/lib/qa-texto.mjs';

const idea = (emoji, texto = 'Texto') => ({ tipo: 'idea', emoji, texto });
const sinSelector = s => s.replace(/\uFE0F/g, '');

test('inventario publica concepto exacto del deck con prefijos y compuestos, más el diccionario', () => {
  const deck = {
    conceptos: { '🤖': 'el agente de citas', 'no:✂': 'sin rebaja', '🎥+✂': 'el editor del curso' },
    laminas: [idea('🤖'), idea('no:✂️'), idea('🎥+✂️'), idea('📦')],
  };
  const claves = Object.keys(inventarioIconos(deck));
  assert.ok(claves.includes('🤖 (deck: el agente de citas · dic: automatizar, IA)'));
  assert.ok(claves.includes('no:✂️ (deck: sin rebaja · dic: descuento)'));
  assert.ok(claves.includes('🎥+✂️ (deck: el editor del curso · dic: editar o cortar video)'));
  assert.ok(claves.includes('📦 (producto)'));
  assert.doesNotMatch(JSON.stringify(inventarioIconos(deck)), /concepto declarado sin palabras en común/);
});

test('cobertura excluye el valor crudo de los alias de viñeta pero exige emojis literales', () => {
  const base = { conceptos: { '🤖': 'agente' }, laminas: [idea('🤖')] };
  for (const vineta of ['x', 'cruz', 'no', 'check', 'si', 'letras', 'numero']) {
    assert.equal(infoConceptos({ ...base, laminas: [...base.laminas, { tipo: 'lista', vineta, items: ['Uno'] }] }), null, vineta);
  }
  assert.match(infoConceptos({ ...base, laminas: [{ tipo: 'lista', vineta: '✅', items: ['Uno'] }] }), /✅/);
});

test('inventario normaliza RGI y compara etiquetas sin selectores', () => {
  const inv = inventarioIconos({ laminas: [idea('🎟', 'Un formulario'), idea('🎟️', 'Una videollamada'), idea('🧑‍⚕', 'Personal médico'), idea('#️⃣', 'Número')] });
  const boleto = Object.keys(inv).find(k => sinSelector(k).startsWith('🎟 ('));
  assert.ok(boleto.startsWith('🎟️ ('), boleto);
  assert.ok(inv[boleto].includes('revisar: 2 etiquetas'));
  for (const k of Object.keys(inv)) assert.match(k.split(' (')[0], /^\p{RGI_Emoji}$/v, k);
});

test('avatares y encabezados de viñeta no inflan etiquetas; frases distintas sí quedan para revisión', () => {
  const deck = { laminas: [
    idea('👤', 'Participante'), { tipo: 'chat', avatar_yo: '👤', avatar_otro: '👤', mensajes: [] },
    { tipo: 'lista', vineta: '👤', encabezado: 'Equipo de ventas:', items: ['Uno'] },
  ] };
  assert.ok(!Object.values(inventarioIconos(deck)).flat().some(v => /^revisar: \d+ etiquetas/.test(v)));
  const otro = { laminas: [idea('🎟️', 'Un formulario de registro'), idea('🎟️', 'Consulta privada')] };
  assert.ok(Object.values(inventarioIconos(otro)).flat().includes('revisar: 2 etiquetas'));
});

test('QA sin navegador conserva el inventario con el concepto del deck', () => {
  const deck = { marca: false, conceptos: { '🤖': 'el agente de citas' }, laminas: [idea('🤖', 'Revisa las citas')] };
  const informe = revisarTexto({ deck, crudo: deck, pasos: [1], revela: [[]], avisos: [], html: '',
    evidencia: { laminas_dir: 'laminas', invalido: false, deck_sha: 'prueba-inventario' } });
  assert.equal(informe.medido, false);
  assert.equal(informe.estado, 'sin-medir');
  assert.ok(Object.hasOwn(informe.iconos, '🤖 (deck: el agente de citas · dic: automatizar, IA)'));
  assert.ok(!informe.info.some(x => /conceptos sin declarar/.test(x)));
});
