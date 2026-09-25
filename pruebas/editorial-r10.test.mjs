// Ronda 10: secuencias repetidas, capa roja con significado, demostración visible, ficha de oferta,
// evaluaciones separadas, chat 16:9 legible, lista corta centrada, anclas de tinta y rótulos chicos.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { secuenciasRepetidas, reglasEditoriales, integridadOferta, validarEditorial, evaluacionesSeparadas, anotacionAporta } from '../scripts/lib/editorial.mjs';
import { prepararSalida, abrir, argumentos, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { revisarTexto } from '../scripts/lib/qa-texto.mjs';
import { compararAnclas, anclasTinta } from '../scripts/lib/tinta.mjs';

function carpeta(t, deck) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r10-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  if (deck) fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  return dir;
}

const FICHA = { producto: 'Kit de ejemplo', publico: 'Freelancers', resultado: 'Cobrar antes de empezar',
  entrega: 'Tres plantillas', responsable: 'Equipo de ejemplo', precio: '490 MXN', garantia: '14 días',
  bonos: 'Guion de llamada', llamado: 'Escribe KIT', siguiente: 'Recibes el acceso por correo',
  evidencia: 'Archivos del kit', fuente: 'Ficha de ejemplo' };

test('secuencias incluso permutadas: tres bloques son un indicio, un mapa no', () => {
  const laminas = [{ tipo: 'idea' }, { tipo: 'chat' }, { tipo: 'flujo' }, { tipo: 'lista' },
    { tipo: 'lista' }, { tipo: 'idea' }, { tipo: 'chat' }, { tipo: 'flujo' },
    { tipo: 'chat' }, { tipo: 'flujo' }, { tipo: 'lista' }, { tipo: 'idea' }];
  assert.equal(secuenciasRepetidas({ laminas }).length, 1);
  assert.equal(secuenciasRepetidas({ laminas: laminas.slice(0, 8) }).length, 0);
  assert.equal(secuenciasRepetidas({ laminas: [...laminas.slice(0, 11), { tipo: 'prueba' }] }).length, 0);
});

test('retorno aislado no encubre repetición; anotación sobre nodo tampoco', () => {
  const laminas = [{ tipo: 'idea', paga: 'x' }, { tipo: 'chat' }, { tipo: 'flujo' }, { tipo: 'lista' },
    { tipo: 'lista' }, { tipo: 'idea' }, { tipo: 'chat' }, { tipo: 'flujo' },
    { tipo: 'chat' }, { tipo: 'flujo' }, { tipo: 'lista' }, { tipo: 'idea' }];
  assert.equal(secuenciasRepetidas({ laminas }).length, 1);
  assert.equal(anotacionAporta({ tipo: 'flujo', nodos: [{ etiqueta: 'Entrega' }] }, { texto: 'Entrega' }), false);
  assert.ok(validarEditorial({ laminas: [null], bloques: [{ desde: 'a', hasta: 'a', aprendizaje: 'Descargar' }] }).length);
});

test('rojo semántico, gramática de la voz y ícono de contacto', () => {
  const l = { tipo: 'idea', texto: 'Define una entrega', emoji: '🧭', anotaciones: [{ a: 'texto', texto: 'Entrega' }] };
  assert.equal(anotacionAporta(l, l.anotaciones[0]), false);
  assert.equal(anotacionAporta(l, { texto: 'Evita rehacer el trabajo' }), true);
  assert.equal(reglasEditoriales({ laminas: [{ ...l, texto: 'Escondes el contacto', voz: 'Dos minutos para define tu entrega' }] }).avisos.length, 2);
  assert.equal(reglasEditoriales({ laminas: [{ tipo: 'idea', voz: 'Tienes dos minutos para definir tu entrega.' }] }).avisos.length, 0);
});

test('un flujo que dice «demostración» no satisface un bloque práctico; una captura sí', () => {
  const b = { desde: 'a', hasta: 'a', aprendizaje: 'Descargar el archivo', practico: true };
  assert.match(reglasEditoriales({ bloques: [b], laminas: [{ id: 'a', tipo: 'flujo', nodos: [{ etiqueta: 'Demostración' }] }] }).avisos[0], /falta demostración/);
  assert.equal(reglasEditoriales({ bloques: [b], laminas: [{ id: 'a', tipo: 'prueba', capturas: [{ src: 'assets/archivo.png', ejemplo: true }] }] }).avisos.length, 0);
});

test('prometer una demostración en el chat no acredita descargar un archivo', () => {
  const q = reglasEditoriales({ bloques: [{ desde: 'x', hasta: 'x', practico: true, aprendizaje: 'Descargar un archivo' }],
    laminas: [{ id: 'x', tipo: 'chat', mensajes: [{ de: 'yo', texto: 'Puedes mostrar ahora cómo descargar archivos' }, { de: 'otro', texto: 'Claro haremos una demostración' }] }] });
  assert.match(q.avisos[0], /falta demostración/);
});

test('ficha de oferta: sin ella está incompleta; completa es documentada o ejemplo; campos cerrados', () => {
  assert.equal(integridadOferta({ pieza: 'vsl', laminas: [] }).estado, 'incompleta');
  assert.equal(integridadOferta({ pieza: 'clase', laminas: [] }).estado, 'no-aplica');
  assert.equal(integridadOferta({ pieza: 'vsl', ficha_oferta: FICHA, laminas: [] }).estado, 'documentada');
  assert.equal(integridadOferta({ pieza: 'propuesta', ficha_oferta: { ...FICHA, ejemplo: true }, laminas: [] }).estado, 'ejemplo-completo');
  assert.deepEqual(integridadOferta({ pieza: 'vsl', ficha_oferta: { ...FICHA, precio: '{{PRECIO}}' }, laminas: [] }).faltan, ['precio']);
  assert.ok(validarEditorial({ ficha_oferta: { precio: 100 }, laminas: [] }).some(e => /tipo inválido/.test(e)));
  assert.ok(validarEditorial({ ficha_oferta: { sobreprecio: 'x' }, laminas: [] }).some(e => /campo desconocido/.test(e)));
});

test('100 geométrico no da firma visual: la aprobación queda pendiente-humana', () => {
  const deck = { pieza: 'vsl', laminas: [] };
  const q = evaluacionesSeparadas({ deck, geometria: { errores: [], avisos: [] }, editorial: { errores: [], avisos: [] }, medido: true });
  assert.equal(q.geometria.nota, 100);
  assert.equal(q.integridad_comercial.estado, 'incompleta');
  assert.equal(q.aprobacion_visual.estado, 'pendiente-humana');
  assert.equal(evaluacionesSeparadas({ deck, geometria: { errores: [], avisos: [] }, editorial: { errores: [], avisos: [] } }).geometria.nota, null);
});

test('anclas de tinta detectan desplazamiento y silueta, sin fingir secuencia', () => {
  const a = { bandas: [{ x: 10, y: 10, w: 20, h: 20 }], emoji: { x: 10, y: 10, w: 20, h: 20 }, silueta: [1, 0, 1] };
  assert.equal(compararAnclas(a, a).falla, false);
  assert.equal(compararAnclas(a, { ...a, bandas: [{ x: 15.4, y: 10, w: 20, h: 20 }] }).falla, true);
  assert.equal(compararAnclas(a, { ...a, silueta: [0, 1, 0] }).falla, true);
  assert.equal(compararAnclas(a, a).secuencia.estado, 'sin-referencia-temporal');
  assert.doesNotThrow(() => anclasTinta(new Uint8ClampedArray(480 * 480 * 4), 480, 480));
});

test('bandera de preflight antes de la ruta y error de voz dentro de la evaluación editorial', t => {
  assert.deepEqual(argumentos(['node', 'qa.mjs', '--preflight-geometria', 'deck.json']).pos, ['deck.json']);
  const dir = carpeta(t, { marca: false, laminas: [{ tipo: 'idea', texto: 'Un alcance concreto', nota: 'Antes de cobrar', voz: ['Solo un paso'] }] });
  const q = revisarTexto(prepararSalida(dir));
  assert.ok(q.errores.some(e => /voz/.test(e)));
  assert.equal(q.evaluaciones.editorial.estado, 'requiere-revision');
  assert.deepEqual(q.evaluaciones.editorial.errores, q.errores);
});

async function navegador(t) {
  const { lanzarChromium } = await import('../scripts/lib/pipeline.mjs');
  try { const b = await lanzarChromium(); await b.close(); return true; }
  catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(`SIN RENDER: ${e.motivo}`); return false; }
}

test('16:9: el chat ocupa un alto legible y la lista corta queda centrada sin salto', async t => {
  if (!(await navegador(t))) return;
  const dir = carpeta(t, { marca: false, emoji: 'apple', laminas: [
    { tipo: 'chat', mensajes: [{ de: 'otro', texto: '¿Cuándo puedes empezar?' }, { de: 'yo', texto: 'Al recibir el anticipo.' }] },
    { tipo: 'lista', encabezado: 'Antes de comenzar:', items: ['Define la entrega', 'Fija el anticipo', 'Confirma la fecha'] },
  ] });
  const p = prepararSalida(dir), { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  try {
    const r = await page.evaluate(() => window.PZ.lams.map(l => {
      const b = l.querySelector('.lienzo').firstElementChild, L = l.getBoundingClientRect(), a = b.getBoundingClientRect();
      window.PZ.mostrar(l, 0, Infinity);
      const z = b.getBoundingClientRect();
      return { alto: a.height / L.height, centro: (a.top - L.top + a.height / 2) / L.height, estable: Math.abs(a.y - z.y) < 1,
        tam: parseFloat(getComputedStyle(l.querySelector('.burbuja') || b).fontSize) };
    }));
    assert.ok(r[0].alto >= 0.28, JSON.stringify(r));
    assert.equal(r[0].tam, 84);
    assert.ok(r[1].centro >= 0.45 && r[1].centro <= 0.55, JSON.stringify(r));
    assert.equal(r[1].estable, true);
  } finally { await browser.close(); }
});

test('un rótulo chico dentro de un símbolo da un diagnóstico legible en el preflight', async t => {
  if (!(await navegador(t))) return;
  const dir = carpeta(t, { marca: false, laminas: [{ tipo: 'idea', texto: 'Un acuerdo verificable', emoji: 'trazo:triangulo|ACUERDOS', emoji_tam: 120 }] });
  const p = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts/qa.mjs'), dir, '--preflight-geometria'], { encoding: 'utf8' });
  assert.equal(p.status, 3, p.stdout + p.stderr);
  const q = JSON.parse(fs.readFileSync(path.join(dir, 'salida/preflight-geometria.json')));
  assert.ok(q.evaluaciones.geometria.avisos.some(x => /rótulo.*48 px/.test(x)), JSON.stringify(q.evaluaciones.geometria));
  assert.equal(fs.existsSync(path.join(dir, 'salida/calidad-historial.json')), false);
});
