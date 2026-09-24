import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conceptoDe, filasConcepto, infoConceptos } from '../scripts/lib/emoji-diccionario.mjs';
import { infoIconos, inventarioIconos, reglasIconos } from '../scripts/lib/reglas-deck.mjs';
import { glifoSVG, Emojis, candidatos, imagenFluent, TEXTO_IMPRESO, BAJO_CONTRASTE, SUGERIDO, contrasteMedido } from '../scripts/lib/emoji.mjs';
import { sustituirDatos } from '../scripts/lib/datos.mjs';
import { resolverComo } from '../scripts/lib/contrato.mjs';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const md = fs.readFileSync(path.join(RAIZ, 'references/EMOJIS.md'), 'utf8');
const indice = new Set(fs.readFileSync(path.join(RAIZ, 'pruebas/fluent-nombres.txt'), 'utf8').trim().split('\n'));
const avisos = laminas => reglasIconos({ emoji: 'apple', laminas }).avisos;

test('diccionario: compuestos completos reconocidos y conceptos sin notas entre corchetes/paréntesis', () => {
  for (const f of filasConcepto(md)) for (const spec of f.specs.filter(s => s.includes('+') || s.includes(':'))) {
    const deck = { laminas: [{ tipo: 'idea', emoji: spec }] };
    assert.equal(infoIconos(deck), null, spec);
    assert.doesNotMatch(conceptoDe(spec), /[\[\]()]/, spec);
    for (const k of Object.keys(inventarioIconos(deck))) {
      const concepto = k.slice(k.indexOf(' (') + 2, -1);
      assert.doesNotMatch(concepto, /[\[\]()]|fuera del diccionario/, `${spec}: ${k}`);
    }
  }
  assert.match(infoIconos({ laminas: [{ tipo: 'idea', emoji: '💰+🦤' }] }), /🦤/);
});

test('conceptos: duplicados avisan, falta declarar usado informa y sin mapa no cambia nada', () => {
  const laminas = [{ tipo: 'idea', emoji: '💰', texto: 'Ganancia' }, { tipo: 'idea', emoji: '📈', texto: 'Crecimiento' }];
  const deck = { emoji: 'apple', conceptos: { '💰': 'Ganáncia', '📈': 'ganancia' }, laminas };
  assert.match(reglasIconos(deck).avisos[0], /mismo concepto/);
  assert.equal(infoConceptos(deck), null);
  assert.match(infoConceptos({ ...deck, conceptos: { '💰': 'ganancia' } }), /conceptos sin declarar: 📈/);
  assert.equal(infoConceptos({ laminas }), null);
  assert.deepEqual(reglasIconos({ laminas }).avisos, []);
});

test('inventario: mismo emoji con distintas etiquetas cortas se marca como información', () => {
  const deck = { laminas: [{ tipo: 'idea', emoji: '💰', texto: 'Capital' }, { tipo: 'idea', emoji: '💰', texto: 'Ganancia' }] };
  assert.ok(Object.values(inventarioIconos(deck)).flat().includes('revisar: 2 etiquetas'));
  assert.deepEqual(reglasIconos(deck).avisos, []);
});

test('negación: dolor anterior a solución no avisa; después o en objeción sí', () => {
  const dolor = { tipo: 'idea', emoji: 'no:📅', texto: 'Sin agenda' };
  const stack = { tipo: 'stack', items: [{ emoji: '📅', nombre: 'Agenda' }] };
  assert.deepEqual(avisos([dolor, stack]), []);
  assert.ok(Object.values(inventarioIconos({ laminas: [dolor, stack] })).flat().some(t => /revisar:.*afirmado/.test(t)));
  assert.ok(avisos([stack, dolor]).some(t => /niega el mismo emoji/.test(t)));
  assert.ok(avisos([{ ...dolor, encabezado: 'Objeción #1' }, stack]).some(t => /niega el mismo emoji/.test(t)));
});

test('polaridad: ganancia positiva con pérdida explícita avisa sin afectar otros sentidos', () => {
  for (const texto of ['Mismo trabajo. Menos ganancia', 'Pierdes dinero cada mes', 'Baja la utilidad']) {
    assert.ok(avisos([{ tipo: 'idea', emoji: '💰', texto }]).some(t => /signo.*frase/.test(t)), texto);
  }
  for (const [emoji, texto] of [['😌', 'Menos estrés'], ['💰', 'Gana más trabajando menos'], ['📈', 'Tus ventas no bajan más'], ['no:💰', 'Pierdes dinero'], ['📉', 'Pierdes dinero'], ['💰', 'No pierdes dinero']]) {
    assert.ok(!avisos([{ tipo: 'idea', emoji, texto }]).some(t => /signo.*frase/.test(t)), texto);
  }
});

test('glifos: credencial solo Apple, recibo/tienda ambos; SVG con volumen, sin letras y sin rojo medido', () => {
  for (const e of ['🪪', '🧾', '🏪']) for (const modo of ['apple', 'fluent']) {
    if (e === '🪪' && modo === 'fluent') { assert.equal(glifoSVG(e, modo), ''); continue; }
    const svg = glifoSVG(e, modo);
    assert.match(svg, /class="vol" viewBox="0 0 24 24"/);
    assert.doesNotMatch(svg, /<text|RECEIPT|Appleseed|24 H/);
    assert.equal(TEXTO_IMPRESO[modo][e], undefined);
    assert.equal(contrasteMedido().rojo.svg[e], 0, 'el glifo dibujado no lleva rojo: no se funde con la capa a mano');
  }
  for (const modo of ['apple', 'fluent']) assert.equal(BAJO_CONTRASTE[modo].claro['🧾'], undefined);
  assert.equal(SUGERIDO['🧾'], undefined);
  const em = new Emojis({ modo: 'apple' });
  assert.equal((em.enTexto('<p>🪪 🧾 🏪</p>').match(/<svg /g) || []).length, 3);
});

test('Fluent direccional: conserva secuencia completa antes del primer componente y espeja el dibujo', () => {
  const correr = candidatos('🏃‍➡️'), andar = candidatos('🧑‍🦯‍➡️');
  assert.equal(correr.find(c => indice.has(c)), '1f3c3');
  assert.ok(correr.exactos.has('1f3c3') && correr.espejos.has('1f3c3'));
  assert.ok(andar.indexOf('1f9d1-200d-1f9af') < andar.indexOf('1f9d1'));
  assert.ok(andar.exactos.has('1f9d1-200d-1f9af'));
  assert.ok(!andar.exactos.has('1f9d1') && andar.espejos.has('1f9d1'));
  assert.match(imagenFluent('🏃‍➡️', 'emoji/1f3c3.webp'), /transform:scaleX\(-1\)/);
  assert.match(imagenFluent('🧑‍🦯‍➡️', 'emoji/1f9d1.webp'), /transform:scaleX\(-1\)/);
  const familia = candidatos('🧑‍🧑‍🧒'), base = familia.find(c => indice.has(c));
  assert.ok(!familia.exactos.has(base) && !familia.espejos.has(base));
});

test('reglas de iconos: ejemplos y réplica conservan cero avisos nuevos', () => {
  const carpetas = fs.readdirSync(path.join(RAIZ, 'ejemplos')).map(n => path.join('ejemplos', n));
  for (const carpeta of [...carpetas, 'pruebas/replica']) {
    const archivo = path.join(RAIZ, carpeta, 'deck.json');
    if (!fs.existsSync(archivo)) continue;
    const { deck } = sustituirDatos(resolverComo(JSON.parse(fs.readFileSync(archivo, 'utf8'))).deck);
    assert.deepEqual(reglasIconos(deck).avisos, [], carpeta);
    assert.equal(infoConceptos(deck), null, carpeta);
  }
});

test('B5 revisión: etiquetas relacionadas y pérdidas negadas no generan ruido', () => {
  const deck = { laminas: ['Ganancia mensual', 'Ganancia anual'].map(texto => ({ tipo: 'idea', emoji: '💰', texto })) };
  assert.ok(!Object.values(inventarioIconos(deck)).flat().some(t => /revisar: \d/.test(t)));
  for (const texto of ['No vas a perder dinero', 'No volverás a perder dinero', 'Sin perder dinero']) assert.deepEqual(avisos([{ tipo: 'idea', emoji: '💰', texto }]), [], texto);
  assert.equal(infoConceptos({ conceptos: { '💰': 'dinero' }, laminas: [{ tipo: 'idea', emoji: ' 💰 ' }] }), null);
});

test('r6: halo de oscura automático sin alterar el HTML claro; ➕ hereda el blanco del lienzo', async () => {
  const { necesitaHalo } = await import('../scripts/lib/emoji.mjs');
  for (const modo of ['apple', 'fluent']) {
    const em = new Emojis({ modo });
    for (const emoji of ['🎓', '♟️', '🎵']) {
      assert.equal(necesitaHalo(emoji, modo), true, `${modo}: ${emoji}`);
      // La salida Apple permite comprobar la marca sin red; la clasificación sí usa ambos sets.
      const html = new Emojis({ modo: 'apple' }).html(emoji);
      assert.doesNotMatch(html, /hundido/);
      assert.match(em.enOscura(html), /class="emo[^\"]*hundido/);
    }
    assert.equal(necesitaHalo('➕', modo), false);
    assert.match(glifoSVG('➕', modo), /stroke="currentColor"/);
  }
});

test('r6: el glifo sin tabla se marca para medición en vivo; el SVG y el gris plano no', () => {
  const em = new Emojis({ modo: 'apple' });
  assert.match(em.enOscura(em.html('🦩')), /data-halo-medir="30"/);
  for (const emoji of ['➕', '🔈']) assert.doesNotMatch(em.enOscura(em.html(emoji)), /data-halo-medir|hundido/);
});

test('r6: la medición en vivo usa píxeles del glifo sin filtro, activa halo oscuro y conserva el claro', async () => {
  const { runInNewContext } = await import('node:vm');
  const medir = async rgba => {
    const resultado = { clases: [], avisos: [] };
    const elemento = { dataset: { haloMedir: '30' }, querySelector: () => ({ textContent: '🦩' }),
      classList: { toggle: (clase, valor) => resultado.clases.push([clase, valor]) } };
    const ctx = { clearRect() {}, fillText() {}, getImageData: () => ({ data: new Uint8ClampedArray(rgba) }) };
    const contexto = { document: { querySelectorAll: () => [elemento], createElement: () => ({ getContext: () => ctx }) },
      getComputedStyle: () => ({ fontFamily: 'Apple Color Emoji' }), avisos: resultado.avisos };
    await runInNewContext(leerRuntime() + '\nprepararHalos();', contexto);
    return { ...resultado, contraste: elemento.dataset.haloContraste };
  };
  const leerRuntime = () => fs.readFileSync(path.join(RAIZ, 'templates/runtime-emojis.js'), 'utf8');
  assert.deepEqual(await medir([11, 11, 14, 255]), { clases: [['hundido', true]], avisos: [], contraste: 0 });
  assert.deepEqual(await medir([255, 255, 255, 255]), { clases: [['hundido', false]], avisos: [], contraste: 100 });
  const vacio = await medir([0, 0, 0, 0]);
  assert.match(vacio.avisos[0], /no produjo píxeles opacos.*EMOJIS/);
});
