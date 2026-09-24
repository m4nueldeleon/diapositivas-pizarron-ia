import test from 'node:test';
import assert from 'node:assert/strict';
import { validarDeck } from '../scripts/lib/contrato.mjs';
import { LAYOUTS } from '../scripts/lib/construir.mjs';
import { codigo } from '../scripts/lib/emoji.mjs';
import fs from 'node:fs';

const tipos = Object.keys(LAYOUTS);

test('el demo es válido y usa los 27 diseños', () => {
  const deck = JSON.parse(fs.readFileSync(new URL('../ejemplos/demo/deck.json', import.meta.url)));
  assert.deepEqual(validarDeck(deck, tipos), []);
  assert.equal(tipos.length, 27);
  const usados = new Set(deck.laminas.map(l => l.tipo));
  assert.deepEqual(tipos.filter(t => !usados.has(t)), []);
});

test('detecta errores con mensajes útiles', () => {
  const e = validarDeck({ formato: '3:2', laminas: [{ tipo: 'foco', texto: 'x' }, { tipo: 'nope' }, { tipo: 'lista' }] }, tipos);
  assert.ok(e.some(x => x.includes('formato')));
  assert.ok(e.some(x => x.includes('no puede ir primero')));
  assert.ok(e.some(x => x.includes('«nope» no existe')));
  assert.ok(e.some(x => x.includes('falta items')));
  assert.deepEqual(validarDeck({}, tipos), ['falta «laminas» (una lista con al menos una lámina)']);
});

test('códigos de emoji con y sin FE0F', () => {
  assert.equal(codigo('💰'), '1f4b0');
  assert.equal(codigo('🧑‍⚕️'), '1f9d1-200d-2695-fe0f');
  assert.equal(codigo('🧑‍⚕️', false), '1f9d1-200d-2695');
});

import { sanearDeck, camposDesconocidos, CAMPOS, COMUNES } from '../scripts/lib/contrato.mjs';

test('un null o un tipo raro en una lista es error con lámina, diseño y posición (no tumba el render)', () => {
  const e = validarDeck({ laminas: [
    { tipo: 'lista', items: [null, 'dos'] },
    { tipo: 'flujo', nodos: [{ emoji: '🐷' }, null] },
    { tipo: 'tarjetas', items: [{ tono: 'v' }] },
    { tipo: 'chat', mensajes: [['hola']] },
    { tipo: 'bifurcacion', origen: 'x', ramas: [{ valor: '1' }] },
  ] }, tipos);
  assert.ok(e.some(x => /lámina 1 \(lista\): items\[0\] es null/.test(x)));
  assert.ok(e.some(x => /lámina 2 \(flujo\): nodos\[1\] es null/.test(x)));
  assert.ok(e.some(x => /tarjetas\): items\[0\] está vacío/.test(x)));
  assert.ok(e.some(x => /chat\): mensajes\[0\] debe ser un objeto/.test(x)));
  assert.ok(e.some(x => /«origen» debe ser un objeto/.test(x)));
});

test('texto suelto en tarjetas, chat y cuadrantes se normaliza a { texto }', () => {
  const { deck } = sanearDeck({ laminas: [
    { tipo: 'tarjetas', items: ['texto suelto'] }, { tipo: 'chat', mensajes: ['hola'] }, { tipo: 'cuadrantes', items: ['a'] },
    { tipo: 'tabla', columnas: ['A'], filas: [['Fila', 'x']] },
  ] });
  assert.deepEqual(deck.laminas[0].items, [{ texto: 'texto suelto' }]);
  assert.deepEqual(deck.laminas[1].mensajes, [{ texto: 'hola' }]);
  assert.deepEqual(deck.laminas[2].items, [{ texto: 'a' }]);
  assert.deepEqual(deck.laminas[3].filas, [{ etiqueta: 'Fila', celdas: ['x'] }]);
});

test('campo que el diseño no usa: aviso suave con sugerencia (no error)', () => {
  const s = camposDesconocidos({ tipo: 'pasos', sello_pso: 2, emoji_tamano: 300, tam_texto: 'medio' }, 0);
  assert.equal(s.length, 2);
  assert.ok(s.some(x => /«sello_pso».*¿quisiste decir «sello_paso»\?/.test(x)));
  assert.deepEqual(camposDesconocidos({ tipo: 'tabla', tam_texto: '60px', _comentario: 'x' }, 0).length, 1);
  const { avisos, sugerencias } = sanearDeck({ laminas: [{ tipo: 'tabla', columnas: ['a'], filas: [['x', 'y']], tam_texto: '60px' }] });
  assert.equal(avisos.length, 0);
  assert.equal(sugerencias.length, 1);
});

test('la tabla de campos cubre todo lo que leen los diseños, y el demo no dispara avisos de campo', () => {
  const union = new Set([...COMUNES, ...Object.values(CAMPOS).flat()]);
  for (const f of ['layouts-texto.mjs', 'layouts-datos.mjs']) {
    const src = fs.readFileSync(new URL(`../scripts/lib/${f}`, import.meta.url), 'utf8');
    for (const [, k] of src.matchAll(/\bl\.([a-z_]+)/g)) assert.ok(union.has(k), `«${k}» (${f}) falta en CAMPOS`);
  }
  const demo = JSON.parse(fs.readFileSync(new URL('../ejemplos/demo/deck.json', import.meta.url)));
  assert.deepEqual(sanearDeck(demo).sugerencias, []);
});

test('sintaxis de emoji: más de un «+», prefijo inventado o parte vacía son error de contrato', () => {
  const e = validarDeck({ laminas: [
    { tipo: 'idea', emoji: '🤖+💬+✅', texto: 'x' },
    { tipo: 'cuadrantes', items: [{ emoji: 'nop:🎥', texto: 'x' }] },
    { tipo: 'pasos', iconos: ['🔍', '+💰'] },
    { tipo: 'idea', emoji: 'no:🧑‍⚕️+💰', texto: 'ok' },
  ] }, tipos);
  assert.ok(e.some(x => /lámina 1.*3 partes/.test(x)));
  assert.ok(e.some(x => /lámina 2.*prefijo «nop:»/.test(x)));
  assert.ok(e.some(x => /lámina 3.*iconos.*sin emoji/.test(x)));
  assert.ok(!e.some(x => /lámina 4/.test(x)));
});

test('clic_pos, sello_pos y sello_sobre pasan por listas cerradas', () => {
  const { deck, avisos } = sanearDeck({ laminas: [
    { tipo: 'boton', clic_pos: [2, -1], sello: 'x', sello_pos: 'arriba-derecha', sello_sobre: 'emoji' },
    { tipo: 'boton', clic_pos: 'x', sello_pos: 'fuera', sello_sobre: '"><img>' },
  ] });
  assert.deepEqual(deck.laminas[0].clic_pos, [1, 0]);
  assert.equal(deck.laminas[0].sello_pos, 'arriba-derecha');
  assert.equal(deck.laminas[1].clic_pos, undefined);
  assert.equal(deck.laminas[1].sello_pos, undefined);
  assert.equal(deck.laminas[1].sello_sobre, undefined);
  assert.equal(avisos.length, 3);
});

test('calendario: n hasta 42 días (pasos sigue en 12); un recorte avisa; fases, anotaciones y título que no cuadran son error', () => {
  const s = l => sanearDeck({ laminas: [l] });
  assert.equal(s({ tipo: 'calendario', n: 14 }).deck.laminas[0].n, 14);
  assert.deepEqual(s({ tipo: 'calendario', n: 28 }).avisos, []);
  const r = s({ tipo: 'calendario', n: 99 });
  assert.equal(r.deck.laminas[0].n, 42);
  assert.ok(r.avisos.some(a => /n: 99 → 42, fuera de rango/.test(a)));
  assert.equal(s({ tipo: 'pasos', n: 14 }).deck.laminas[0].n, 12);
  const v = l => validarDeck({ laminas: [l] }, tipos);
  assert.deepEqual(v({ tipo: 'calendario', titulo: 'Calendario de 14 días', n: 14, fases: [{ nombre: 'F', desde: 1, hasta: 14 }], fase_activa: 1 }), []);
  assert.ok(v({ tipo: 'calendario', n: 14, fases: [{ nombre: 'F', desde: 15, hasta: 28 }] }).some(e => /llega al día 28 y el calendario tiene 14/.test(e)));
  assert.ok(v({ tipo: 'calendario', titulo: 'Calendario de 14 días', n: 12 }).some(e => /dice 14 días y se dibujan 12/.test(e)));
  assert.ok(v({ tipo: 'calendario', fases: [{ nombre: 'F', desde: 1, hasta: 3 }], fase_activa: 2 }).some(e => /fase_activa 2 y hay 1/.test(e)));
  assert.ok(v({ tipo: 'calendario', n: 7, anotaciones: [{ dia: 9, texto: 'x' }] }).some(e => /anotaciones\[0\] apunta al día 9/.test(e)));
});

test('pasos acepta separacion, tam_etiqueta y arrastre; foco, nota_paso; tachar_paso en idea, cita y cifra', () => {
  for (const [t, c] of [['pasos', 'separacion'], ['pasos', 'tam_etiqueta'], ['pasos', 'arrastre'], ['foco', 'nota_paso'], ['idea', 'tachar_paso'], ['cita', 'tachar_paso'], ['cifra', 'tachar_paso']]) {
    assert.ok(CAMPOS[t].includes(c), `${t}.${c}`);
  }
  assert.equal(sanearDeck({ laminas: [{ tipo: 'pasos', tam_etiqueta: '64px' }] }).deck.laminas[0].tam_etiqueta, 64);
  assert.ok(COMUNES.includes('llamado') && COMUNES.includes('paso_ref'));
});

test('references/LAYOUTS.md documenta todo campo que leen los diseños (y los de ítem más usados)', () => {
  const md = fs.readFileSync(new URL('../references/LAYOUTS.md', import.meta.url), 'utf8');
  const todos = new Set([...COMUNES, ...Object.values(CAMPOS).flat(), 'valor_texto', 'emoji', 'tono', 'sub', 'numero']);
  const faltan = [...todos].filter(k => !new RegExp('[`"]' + k + '\\b').test(md));
  assert.deepEqual(faltan, [], `sin documentar en LAYOUTS.md: ${faltan.join(', ')}`);
});

test('camara en vivo: vivo es booleano, items es lista de textos; sin dur ni consigna avisa', () => {
  const tipos = ['idea', 'camara'];
  assert.match(validarDeck({ laminas: [{ tipo: 'camara', vivo: 'sí' }] }, tipos).join(' '), /«vivo» es true o false/);
  assert.match(validarDeck({ laminas: [{ tipo: 'camara', vivo: true, items: [3] }] }, tipos).join(' '), /«items» es una lista de textos/);
  const { sugerencias } = sanearDeck({ laminas: [{ tipo: 'camara', vivo: true }] });
  assert.ok(sugerencias.some(s => /sin "dur" o de menos de 30 s/.test(s)), sugerencias.join('\n'));
  assert.ok(sugerencias.some(s => /sin consigna/.test(s)));
  const bien = sanearDeck({ laminas: [{ tipo: 'camara', vivo: true, dur: 300, texto: 'Ahora tú', items: ['Uno'], emoji: '🙋' }] });
  assert.deepEqual(bien.sugerencias, []);
  assert.equal(bien.deck.laminas[0].vivo, true);
});

// ---------- ronda 3 ----------
import { PIEZAS } from '../scripts/lib/tiempos.mjs';
const mini = extra => ({ ...extra, laminas: [{ tipo: 'idea', emoji: '💡', texto: 'Hola', voz: 'Hola' }] });

test('pieza: todas las de PIEZAS valen (libre incluida); «xyz» y «toString» no', () => {
  for (const p of Object.keys(PIEZAS)) assert.ok(!validarDeck(mini({ pieza: p }), tipos).some(e => /pieza/.test(e)), p);
  for (const p of ['xyz', 'toString', 'constructor']) assert.ok(validarDeck(mini({ pieza: p }), tipos).some(e => new RegExp(`pieza «${p}» no existe`).test(e)), p);
});

test('viñeta y avatares son campos de emoji: un compuesto de 3 partes es error; el alias x no avisa', () => {
  const e = validarDeck({ laminas: [{ tipo: 'lista', vineta: '🤖+💬+✅', items: ['a', 'b'] }, { tipo: 'chat', avatar_otro: '🤖+💬+✅', mensajes: ['x'] }] }, tipos);
  assert.ok(e.some(x => /lámina 1\.vineta: emoji .* lleva 3 partes/.test(x)), e.join('\n'));
  assert.ok(e.some(x => /lámina 2\.avatar_otro/.test(x)));
  const { sugerencias } = sanearDeck({ laminas: [{ tipo: 'lista', vineta: 'x', items: ['a'] }] });
  assert.deepEqual(sugerencias, []);
});

test('opciones y boton exigen su contenido (sin demo); «opciones» en opciones sugiere «items»; texto vacío es ausente; foco tras foco', () => {
  const e = validarDeck({ laminas: [{ tipo: 'opciones', opciones: ['a'] }, { tipo: 'boton' }, { tipo: 'idea', texto: '  ' }, { tipo: 'idea', texto: 'x' }, { tipo: 'foco', texto: 'a' }, { tipo: 'foco', texto: 'b' }] }, tipos);
  assert.ok(e.some(x => /lámina 1 \[opciones\]: falta items/.test(x)));
  assert.ok(e.some(x => /lámina 2 \[boton\]: falta boton/.test(x)));
  assert.ok(e.some(x => /lámina 3 \[idea\]: falta texto o emoji/.test(x)));
  assert.ok(e.some(x => /lámina 6: foco tras foco/.test(x)));
  const { sugerencias } = sanearDeck({ laminas: [{ tipo: 'opciones', opciones: ['a'], items: ['a'] }] });
  assert.ok(sugerencias.some(s => /«opciones» no existe en `opciones`: va en «items»/.test(s)), sugerencias.join('\n'));
});

test('una palabra de más de 24 letras (un link) avisa al sanear', () => {
  const { sugerencias } = sanearDeck({ laminas: [{ tipo: 'idea', texto: 'Entra a https://www.midominiomuylargoparaprobar.com/registro' }, { tipo: 'idea', texto: 'Entra a midominio.com' }] });
  assert.equal(sugerencias.filter(s => /palabra de \d+ letras/.test(s)).length, 1);
});

// ---------- ronda 4: objetos que vuelven con `como` ----------
import { resolverComo } from '../scripts/lib/contrato.mjs';
test('como r4: hereda solo los campos del objeto (no revelar ni voz), la hija gana, cadenas A←B←C; errores de id, adelante, sí misma y tipo; avisa copias a mano', () => {
  const mapa = { id: 'mapa', tipo: 'pasos', iconos: ['🔍', '🛠️', '🚀'], etiquetas: ['Encontrar', 'Construir', 'Lanzar'], prefijo: 'Paso', revelar: 'pasos', voz: ['a', 'b', 'c'], activo: 1 };
  const deck = { laminas: [mapa, { id: 'm2', tipo: 'pasos', como: 'mapa', activo: 2, hechos: [1] }, { id: 'm3', tipo: 'pasos', como: 'm2', activo: 3, etiquetas: ['A', 'B', 'C'] }] };
  const copia = JSON.parse(JSON.stringify(deck));
  const r = resolverComo(deck);
  assert.deepEqual(r.errores, []);
  const [, b, c] = r.deck.laminas;
  assert.deepEqual(b.iconos, mapa.iconos);
  assert.equal(b.prefijo, 'Paso');
  assert.equal(b.revelar, undefined);
  assert.equal(b.voz, undefined);
  assert.equal(b.activo, 2);
  assert.deepEqual(c.etiquetas, ['A', 'B', 'C']);
  assert.deepEqual(c.iconos, mapa.iconos, 'cadena');
  assert.deepEqual(deck, copia, 'el deck original no cambia');
  const e = l => resolverComo({ laminas: [mapa, l, { id: 'cal', tipo: 'calendario', n: 14 }] }).errores.join('\n');
  assert.match(e({ tipo: 'pasos', como: 'nada' }), /no es el id de ninguna lámina/);
  assert.match(e({ tipo: 'pasos', como: 'cal' }), /va DESPUÉS/);
  assert.match(e({ id: 'yo', tipo: 'pasos', como: 'yo' }), /a sí misma/);
  assert.match(resolverComo({ laminas: [mapa, { id: 'cal', tipo: 'calendario', n: 14 }, { tipo: 'calendario', como: 'mapa' }] }).errores.join(), /una lámina pasos y esta es calendario/);
  assert.match(resolverComo({ laminas: [{ id: 'i', tipo: 'idea', texto: 'x' }, { tipo: 'idea', como: 'i' }] }).errores.join(), /solo existe en/);
  // copia a mano: avisa y sugiere el id
  const av = resolverComo({ laminas: [mapa, { tipo: 'pasos', iconos: mapa.iconos, etiquetas: mapa.etiquetas, activo: 2 }] }).avisos;
  assert.match(av.join('\n'), /repite a mano el pasos de la lámina 1: .*"como": "mapa"/);
  // el campo `como` lo conoce el contrato
  assert.ok(COMUNES.includes('como'));
});

test('r5: índices fuera de rango son error (pasos activo/hechos desde 1; rejilla destacar y opciones elegida desde 0)', async () => {
  const { resolverComo } = await import('../scripts/lib/contrato.mjs');
  const v = laminas => validarDeck(resolverComo({ laminas }).deck, tipos);
  const mapa = { id: 'mapa', tipo: 'pasos', etiquetas: ['A', 'B', 'C'] };
  const e = v([mapa, { tipo: 'pasos', como: 'mapa', activo: 9, hechos: [7, 8] }]);
  assert.ok(e.some(x => /activo 9 y hay 3 pasos/.test(x)), e.join('\n'));
  assert.equal(e.filter(x => /hechos incluye/.test(x)).length, 2, e.join('\n'));
  assert.deepEqual(v([{ ...mapa, activo: 3, hechos: [1, 2] }]), []);
  assert.ok(v([{ ...mapa, hechos: [0] }]).some(x => /hechos incluye 0/.test(x)));
  const rj = destacar => v([{ tipo: 'rejilla', total: 30, destacar }]);
  assert.deepEqual(rj([29]), []);
  assert.ok(rj([30]).some(x => /destacar 30 y la rejilla tiene 30 celdas/.test(x)));
  assert.ok(v([{ tipo: 'opciones', items: ['a', 'b'], elegida: 2 }]).some(x => /elegida 2 y hay 2 opciones/.test(x)));
  assert.deepEqual(v([{ tipo: 'opciones', items: ['a', 'b'], elegida: 1 }]), []);
});
