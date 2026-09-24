// Los ejemplos son material que se copia: el de venta (ejemplos/vsl-corto) cumple GUION §7 sin un solo aviso de guion,
// la propuesta sigue los 9 bloques y la clase express cierra con tarea y puente,
// y ningún ejemplo deja el set de emojis en «auto» (SKILL §3).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { revisarDeck, esLlamadoVisible, inicioOferta } from '../scripts/lib/reglas-deck.mjs';
import { demuestraRespuesta, ensenaComo } from '../scripts/lib/reglas-arco.mjs';
import { tiemposSecuenciales, duracionTotal } from '../scripts/lib/tiempos.mjs';
import { esMano, esCampoEmoji, specsDeCampo } from '../scripts/lib/emoji.mjs';
import { sustituirDatos, validarDatos } from '../scripts/lib/datos.mjs';
import { resolverComo } from '../scripts/lib/contrato.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = n => JSON.parse(fs.readFileSync(path.join(RAIZ, 'ejemplos', n, 'deck.json'), 'utf8'));
const ejemplos = fs.readdirSync(path.join(RAIZ, 'ejemplos')).filter(n => fs.existsSync(path.join(RAIZ, 'ejemplos', n, 'deck.json')));

test('ejemplos: existe el modelo de venta y ningún deck usa "emoji": "auto"', () => {
  for (const n of ['vsl-corto', 'demo', 'propuesta', 'clase-express', 'reel']) assert.ok(ejemplos.includes(n), `falta ejemplos/${n}: ${ejemplos.join(', ')}`);
  for (const n of ejemplos) assert.ok(['apple', 'fluent'].includes(leer(n).emoji), `${n}: emoji «${leer(n).emoji}»`);
  for (const n of ['vsl-corto', 'propuesta', 'clase-express', 'reel']) assert.ok(fs.existsSync(path.join(RAIZ, 'ejemplos', n, 'guion.md')), n);
});

test('vsl-corto: cero avisos de arco, objeción, llamado, prueba, credibilidad, voz, proyección u oferta; lo que queda son datos', () => {
  const crudo = resolverComo(leer('vsl-corto')).deck;
  assert.equal(crudo.pieza, 'vsl-corto');
  assert.deepEqual(validarDatos(crudo.datos), []);
  const { deck } = sustituirDatos(crudo);
  const r = revisarDeck(deck, deck.laminas.map(l => Math.max(1, Array.isArray(l.voz) ? l.voz.length : 1)), { crudo });
  assert.deepEqual(r.errores, []);
  const deGuion = r.avisos.filter(a => /llamado|objeci|prueba|credibilidad|antítesis|VOZ-HUMANA|proyecci|garantía|bono|escasez|oferta|arranca|saludo|cámara|qué se vende|mezclan|30 s|frecuente/i.test(a));
  assert.deepEqual(deGuion, []);
  assert.deepEqual(r.faltaParaFinal, []);
  // la objeción va seguida de su respuesta, que DEMUESTRA (no es una `idea` que afirma: GUION §2), y el llamado aparece 2
  // veces o más
  const L = deck.laminas, k = L.findIndex(l => /Objeción #1/.test(l.encabezado || ''));
  assert.ok(k > 0 && demuestraRespuesta(L[k + 1]) && !/Objeción/.test(L[k + 1].encabezado || ''), L[k + 1].tipo);
  assert.ok(L.filter(esLlamadoVisible).length >= 2);
});

test('demo: la objeción tiene respuesta en la lámina siguiente, no:⌨️ y un llamado después del precio', () => {
  const demo = leer('demo'), L = demo.laminas;
  const k = L.findIndex(l => l.id === 'objecion');
  assert.equal(L[k].emoji, 'no:⌨️');
  assert.equal(L[k + 1].id, 'respuesta');
  const precio = L.findIndex(l => l.id === 'precio');
  assert.ok(L.slice(precio + 1).some(l => l.tipo === 'boton' && l.llamado === true));
  assert.ok(!L.some(l => /Lo demás es ruido/.test(l.nota || '')));
});

// ---------- ronda 4: el orden de la oferta, un solo canal, la promesa temprana, la propuesta y la clase express ----------
const preparar = n => {
  const crudo = resolverComo(leer(n)).deck;
  const { deck } = sustituirDatos(crudo);
  const pasos = deck.laminas.map(l => Math.max(1, Array.isArray(l.voz) ? l.voz.length : 1));
  return { crudo, deck, pasos, r: revisarDeck({ ...deck, datos: crudo.datos }, pasos, { crudo }) };
};

test('vsl-corto r4: revelación entre el 55 y el 60%, ningún llamado antes, un solo canal y la objeción propuesta sin frecuencia', () => {
  const { crudo, deck, pasos } = preparar('vsl-corto');
  const i = inicioOferta(deck.laminas), t = tiemposSecuenciales(deck, pasos), tot = duracionTotal(deck, pasos);
  const rel = t.find(s => s.lamina === i).inicio / tot;
  assert.equal(deck.laminas[i].tipo, 'oscura');
  assert.ok(rel >= 0.55 && rel <= 0.6, `la revelación entra al ${Math.round(rel * 100)}%`);
  assert.ok(!deck.laminas.slice(0, i).some(esLlamadoVisible), 'un llamado antes de la revelación');
  const llamados = deck.laminas.filter(esLlamadoVisible);
  assert.ok(llamados.length >= 2 && llamados.every(l => l.tipo === 'boton'), llamados.map(l => l.id).join(', '));
  // la objeción es un dato propuesto y va antes de la revelación, con su respuesta en la siguiente
  assert.deepEqual(crudo.datos.OBJECION_1, { valor: 'No sé nada de tecnología', propuesto: true });
  const k = deck.laminas.findIndex(l => l.id === 'objecion');
  assert.ok(k > 0 && k < i && /^Objeción número uno/.test(deck.laminas[k].voz));
  // la promesa y el mecanismo, antes del segundo 25
  const antes25 = new Set(t.filter(s => s.inicio < 25).map(s => deck.laminas[s.lamina].id));
  assert.ok(antes25.has('sin') && antes25.has('mecanismo'), [...antes25].join(', '));
});

test('propuesta: los 9 bloques sin avisos de propuesta; lo que falta son los huecos declarados', () => {
  const { crudo, r } = preparar('propuesta');
  assert.equal(crudo.pieza, 'propuesta');
  assert.deepEqual(validarDatos(crudo.datos), []);
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.avisos.filter(a => /propuesta|ancla|vigencia|No incluye|Pongamos|imparte|caso|salida|llamado|dura|pasos pasan/i.test(a)), []);
  assert.deepEqual(r.faltaParaFinal, []);
  assert.ok(Object.values(crudo.datos).every(v => v.pendiente === true && v.motivo), 'todo dato del cliente es un hueco declarado');
});

test('clase express: tutorial con "clase": true, tarea y puente al final, sin avisos de arco, duración ni cierre', () => {
  const { crudo, r } = preparar('clase-express');
  assert.equal(crudo.pieza, 'tutorial');
  assert.equal(crudo.clase, true);
  assert.deepEqual(validarDatos(crudo.datos), []);
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.avisos.filter(a => /cierre|tarea|puente|termina sin|dura|cámara|demostración|pasos pasan/i.test(a)), []);
});

// Emojis que «Evita» de EMOJIS.md prohíbe siempre (los que dependen del contexto, como 🖥️ o 👆, no entran)
const EVITADOS = ['🏬', '🍆', '🍑', '🤵', '🧑‍✈️', '🤳', '👨‍👩‍👧‍👦', '🔖', '📇', '🎫', '🗂️', '🗓️', '📆'];
const sinSel = e => String(e).replace(/\uFE0F/g, '');
test('ejemplos: ningún emoji que EMOJIS.md manda evitar, y ningún botón con cursor de mano lleva una mano', () => {
  const emojis = fs.readFileSync(path.join(RAIZ, 'references', 'EMOJIS.md'), 'utf8');
  const evita = emojis.split('## Evita')[1].split('\n## ')[0];
  EVITADOS.forEach(e => assert.ok(evita.includes(e), `${e} ya no está en «Evita»: actualiza la prueba`));
  const malos = [];
  for (const n of ejemplos) {
    const d = leer(n);
    const specs = [];
    const ir = o => { if (Array.isArray(o)) return o.forEach(ir); if (!o || typeof o !== 'object') return;
      for (const [k, v] of Object.entries(o)) { if (esCampoEmoji(k)) specs.push(...specsDeCampo(k, v)); else if (typeof v === 'object') ir(v); } };
    ir(d.laminas);
    specs.forEach(sp => sp.replace(/^(no|si):/, '').split('+').forEach(e => { if (EVITADOS.map(sinSel).includes(sinSel(e))) malos.push(`${n}: ${e}`); }));
    d.laminas.forEach(l => { if (l.tipo === 'boton' && l.cursor !== 'flecha' && esMano(l.emoji)) malos.push(`${n}/${l.id}: botón con ${l.emoji} y cursor de mano`); });
  }
  assert.deepEqual(malos, []);
});

// r5: el modelo de reel (9:16) enseña el «cómo» a la vista, entra al mapa una vez y cierra con UN llamado; ningún modelo
// repite el mapa seguido ni vuelve a él vacío tras una lámina
test('reel r5: 9:16, 30-60 s, el prompt a la vista, un solo llamado y sin avisos de guion; ningún ejemplo con vaivén de mapa', () => {
  const { crudo, deck, pasos, r } = preparar('reel');
  assert.equal(crudo.pieza, 'reel');
  assert.equal(crudo.formato, '9:16');
  const d = duracionTotal(deck, pasos);
  assert.ok(d >= 30 && d <= 60, `dura ${d} s`);
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.avisos, []);
  assert.deepEqual(r.faltaParaFinal, []);
  assert.ok(deck.laminas.some(ensenaComo), 'ningún chat con el prompt');
  assert.equal(deck.laminas.filter(esLlamadoVisible).length, 1);
  for (const n of ['reel', 'vsl-corto', 'propuesta', 'clase-express']) {
    const { r: rn } = preparar(n);
    assert.deepEqual(rn.avisos.filter(a => /mapa repetido|el mapa vuelve|solo afirma|contrato|promete \d/.test(a)), [], n);
  }
});

// Los modelos enseñan transformaciones completas y mantienen voz y revelado sincronizados.
import { prepararSalida } from '../scripts/lib/pipeline.mjs';
import { revisarTexto } from '../scripts/lib/qa-texto.mjs';
test('r7: los cuatro modelos construyen sin errores y transforman una composición en 3–4 pasos', t => {
  const raiz = '/private/tmp/pz-loop/r7/codex-impl-estilo-iconos/pruebas-ejemplos';
  fs.mkdirSync(raiz, { recursive: true });
  const carpeta = fs.mkdtempSync(path.join(raiz, 'modelos-'));
  t.after(() => fs.rmSync(carpeta, { recursive: true, force: true }));
  const secuencias = { propuesta: 'otra-vez', reel: 'gancho', 'vsl-corto': 'intentos', 'clase-express': 'reciente' };
  for (const [nombre, id] of Object.entries(secuencias)) {
    const prep = prepararSalida(path.join(RAIZ, 'ejemplos', nombre), path.join(carpeta, nombre));
    const revision = revisarTexto(prep);
    assert.deepEqual(revision.errores, [], nombre);
    const i = prep.deck.laminas.findIndex(l => l.id === id);
    assert.ok(prep.pasos[i] >= 3 && prep.pasos[i] <= 4, `${nombre}: ${prep.pasos[i]} pasos`);
    assert.ok(prep.revela[i].every(p => p.length > 0), `${nombre}: hay un paso vacío`);
  }
});
