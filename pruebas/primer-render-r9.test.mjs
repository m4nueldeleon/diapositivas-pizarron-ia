import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, DIR_SKILL } from '../scripts/lib/pipeline.mjs';

function proyecto(t, laminas, extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r9-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', persona: 'tu', laminas, ...extra }));
  return dir;
}
function medir(dir) {
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts/qa.mjs'), dir], { encoding: 'utf8' });
  assert.ok(fs.existsSync(path.join(dir, 'salida/qa.json')), r.stderr);
  return JSON.parse(fs.readFileSync(path.join(dir, 'salida/qa.json')));
}

test('R9: anotación automática encuentra blanco sin tapar el emoji ni su texto', t => {
  const dir = proyecto(t, [{ tipo: 'idea', emoji: '🎯', texto: 'Tu primer cliente necesita un problema concreto',
    nota: 'Describe una tarea que hoy queda sin resolver', nota_paso: 2,
    anotaciones: [{ a: 'texto', texto: 'Elige a quién', paso: 1 }],
    voz: ['Tu primer cliente necesita un problema concreto.', 'Elige a quién.', 'Describe una tarea que hoy queda sin resolver.'] }]);
  const q = medir(dir);
  assert.deepEqual(q.errores, []);
  assert.deepEqual(q.avisos, []);
});

test('R9: flujo textual largo conserva etiquetas enteras y flechas legibles', t => {
  const dir = proyecto(t, [{ tipo: 'flujo', nodos: ['Problema visible', 'Persona responsable', 'Momento concreto'].map(etiqueta => ({ etiqueta })),
    voz: ['Ubica el problema visible.', 'Habla con la persona responsable.', 'Identifica el momento concreto.'] }]);
  const q = medir(dir);
  assert.deepEqual(q.errores, []);
  assert.deepEqual(q.avisos, []);
});

test('R9: vertical corto usa el alto, centro óptico y posiciones estables entre pasos', async t => {
  const dir = proyecto(t, [
    { tipo: 'idea', emoji: '📦', texto: 'Muestras solo\n__el servicio__' },
    { tipo: 'lista', encabezado: 'Nombra a quién ayudas:', items: ['Dueños de cafeterías', 'Mesas vacías entre semana'] },
    { tipo: 'chat', encabezado: 'La consulta se enfría:', mensajes: [{ de: 'otro', texto: '¿Cómo te contrato?' }, { de: 'yo', texto: 'Mira mi perfil.' }] },
  ], { formato: '9:16' });
  const prep = prepararSalida(dir);
  const { browser, page } = await abrir(prep.htmlPath, prep.W, prep.H);
  try {
    const r = await page.evaluate(() => window.PZ.lams.map(l => {
      const bloque = l.querySelector('.lienzo').firstElementChild, L = l.getBoundingClientRect();
      const antes = bloque.getBoundingClientRect();
      window.PZ.mostrar(l, 0, Infinity);
      const despues = bloque.getBoundingClientRect();
      return { alto: antes.height / 1920, centro: (antes.top - L.top + antes.height / 2) / 1920,
        estable: Math.abs(antes.top - despues.top) < 1 && Math.abs(antes.height - despues.height) < 1 };
    }));
    for (const x of r) {
      assert.ok(x.alto >= .45, JSON.stringify(r));
      assert.ok(x.centro >= .43 && x.centro <= .49, JSON.stringify(r));
      assert.equal(x.estable, true);
    }
  } finally { await browser.close(); }
  const q = medir(dir);
  assert.deepEqual(q.errores, []);
  assert.ok(!q.avisos.some(a => /resaltado corto partido|zona que tapan/.test(a)), q.avisos.join('\n'));
});

test('R9: render directo bloquea placeholders; borrador explícito conserva el diagnóstico', t => {
  const dir = proyecto(t, [{ tipo: 'idea', texto: '{{PRECIO}}', voz: 'La inversión es {{PRECIO}}.' }],
    { datos: { PRECIO: { pendiente: true, motivo: 'El cliente define la inversión' } } });
  const cmd = [path.join(DIR_SKILL, 'scripts/render.mjs'), dir, '--sin-hoja'];
  const r = spawnSync(process.execPath, cmd, { encoding: 'utf8' });
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.ok(!fs.existsSync(path.join(dir, 'salida/laminas')));
  assert.match(r.stdout + r.stderr, /borrador/);
  const b = spawnSync(process.execPath, [...cmd, '--borrador', '--qa'], { encoding: 'utf8' });
  assert.equal(b.status, 0, b.stdout + b.stderr);
  const q = JSON.parse(fs.readFileSync(path.join(dir, 'salida/qa.json')));
  assert.equal(q.estado, 'borrador');
  assert.equal(q.primer_render.nota, q.nota);
});

test('R9: sello del chat vertical grande respeta la franja inferior de Reels', t => {
  const dir = proyecto(t, [{ tipo: 'chat', encabezado: 'Instagram: pregunta y desaparece:',
    mensajes: [{ de: 'otro', texto: '¿Cuánto cuesta?' }, { de: 'yo', texto: 'Mira todos mis servicios.' }],
    sello: 'Se fue', sello_sobre: 'm1', sello_paso: 2,
    voz: ['Imagina que te preguntan cuánto cuesta.', 'Mandas al cliente a revisar tus servicios.', 'Desaparece. Revisa estos tres errores.'] }], { formato: '9:16' });
  const q = medir(dir);
  assert.deepEqual(q.errores, []);
  assert.deepEqual(q.avisos, []);
});

test('R9: foco vertical conserva la caja de la lista anterior', async t => {
  const dir = proyecto(t, [{ tipo: 'lista', items: ['Elige una persona', 'Describe su problema'] },
    { tipo: 'foco', texto: 'Una sola decisión' }], { formato: '9:16' });
  const prep = prepararSalida(dir);
  const { browser, page } = await abrir(prep.htmlPath, prep.W, prep.H);
  try {
    const cajas = await page.evaluate(() => [...document.querySelectorAll('.lista')].map(e => {
      const b = e.getBoundingClientRect(), l = e.closest('section').getBoundingClientRect();
      return { x: b.x - l.x, y: b.y - l.y, w: b.width, h: b.height };
    }));
    assert.equal(cajas.length, 2);
    assert.deepEqual(cajas[0], cajas[1]);
  } finally { await browser.close(); }
});

test('R9: comparar sale con error cuando la misma escena rebasa el umbral geométrico', async t => {
  const dir = proyecto(t, [{ id: 'r10', _cuadro: 'Escena sintética para probar el umbral', tipo: 'idea', emoji: '🎯', texto: 'Una decisión concreta' }]);
  const prep = prepararSalida(dir);
  const ref = path.join(dir, 'ref'); fs.mkdirSync(ref);
  const { browser, page } = await abrir(prep.htmlPath, prep.W, prep.H);
  try {
    await page.evaluate(() => { document.querySelector('.lienzo').style.transform = 'translateX(40px)'; });
    await page.locator('section.lamina').screenshot({ path: path.join(ref, 'ref_10.png') });
  } finally { await browser.close(); }
  const salida = path.join(dir, 'comparacion');
  const args = [path.join(DIR_SKILL, 'scripts/comparar.mjs'), dir, ref, '--salida', salida, '--umbral', '0.1'];
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  const q = JSON.parse(fs.readFileSync(path.join(salida, 'comparar.json')));
  assert.deepEqual(q.distintas, []);
  assert.equal(q.pares[0].falla, true);
  assert.equal(r.status, 1, r.stdout + r.stderr);
});

test('R9: preflight cuenta también las viñetas numeradas antes del primer PNG', async t => {
  const { revisarTexto } = await import('../scripts/lib/qa-texto.mjs');
  const lista = { tipo: 'lista', vineta: 'numero', items: ['Anota el producto que vas a fotografiar',
    'Pregunta dónde se usará la imagen', 'Describe el archivo que vas a entregar'],
    voz: ['Anota el producto que vas a fotografiar.', 'Pregunta dónde se usará la imagen.', 'Describe el archivo que vas a entregar.'] };
  const dir = proyecto(t, [lista]);
  assert.ok(revisarTexto(prepararSalida(dir)).avisos.some(a => /23 palabras a la vista/.test(a)));
  assert.ok(medir(dir).avisos.some(a => /23 palabras a la vista/.test(a)));
  const corto = proyecto(t, [{ ...lista, items: ['Elige el producto', 'Pregunta dónde se usará', 'Define el archivo final'] }]);
  assert.ok(!revisarTexto(prepararSalida(corto)).avisos.some(a => /palabras a la vista/.test(a)));
});
