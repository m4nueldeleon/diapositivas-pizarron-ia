// Hoja de contacto: se pagina con más de 20 láminas (una clase de 240 no cabe legible en una imagen), con el
// número GLOBAL de lámina en cada cuadro y el rango en el encabezado; --pdf arma una página por lámina.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { paginar, tituloPagina, archivoPagina, cuadrosHoja, htmlHoja, filasPasos, htmlHojaPasos, POR_HOJA, FILAS_POR_HOJA, ANCHO_MAX_PASOS } from '../scripts/lib/hoja.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifiesto = n => Array.from({ length: n }, (_, i) => ({ lamina: i, id: `l${i + 1}`, tipo: 'idea', paso: 0, pasos: 1, archivo: `laminas/${i + 1}.png` }));

test('paginar: 45 láminas → 3 hojas parejas con rótulos globales; 12 → una sola hoja.jpg', () => {
  const cuadros = cuadrosHoja(manifiesto(45));
  const p = paginar(cuadros, POR_HOJA);
  assert.deepEqual(p.map(x => x.length), [15, 15, 15]);
  assert.equal(p[1][0].n, 16, 'el número de lámina es el global, no el de la página');
  assert.equal(tituloPagina(p[1], 1, 3, 45), 'láminas 16-30 de 45 · hoja 2/3');
  assert.match(tituloPagina(p[0], 0, 3, 45), /hoja 1\/3 — revisa TODAS/);
  assert.deepEqual(p.map((_, k) => archivoPagina('hoja', k, 3)), ['hoja-01.jpg', 'hoja-02.jpg', 'hoja-03.jpg']);
  const h = htmlHoja(p[1], { W: 1920, H: 1080, titulo: tituloPagina(p[1], 1, 3, 45) });
  assert.match(h.html, /láminas 16-30 de 45/);
  assert.match(h.html, />16 · l16</);
  assert.equal(h.cols, 4);
  const una = paginar(cuadrosHoja(manifiesto(12)), POR_HOJA);
  assert.equal(una.length, 1);
  assert.equal(archivoPagina('hoja', 0, 1), 'hoja.jpg');
  assert.equal(tituloPagina(una[0], 0, 1, 12), '');
  assert.deepEqual(paginar([], POR_HOJA), [[]]);
  // 240 láminas: 12 hojas de 20
  assert.deepEqual(paginar(cuadrosHoja(manifiesto(240)), POR_HOJA).map(x => x.length), Array(12).fill(20));
});

test('hoja de pasos: 10 filas por hoja y una lámina de muchos pasos no pasa de ~2400 px de ancho', () => {
  const m = [];
  for (let i = 0; i < 25; i++) for (let p = 0; p < (i === 3 ? 14 : 2); p++) m.push({ lamina: i, id: `l${i + 1}`, tipo: 'idea', paso: p, pasos: 2, archivo: `laminas/${i}-${p}.png` });
  const filas = filasPasos(m);
  const pp = paginar(filas, FILAS_POR_HOJA);
  assert.deepEqual(pp.map(x => x.length), [9, 9, 7]);
  const hp = htmlHojaPasos(pp[0], { W: 1920, H: 1080, titulo: tituloPagina(pp[0], 0, pp.length, 25) });
  assert.ok(hp.anchoTotal <= ANCHO_MAX_PASOS + 40, String(hp.anchoTotal));
  assert.match(hp.html, /láminas 1-9 de 25 · hoja 1\/3/);
});

test('render --finales --pdf: una página por lámina (sin las cámaras) y hojas paginadas con hojas.json', { timeout: 180_000 }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-pdf-'));
  const laminas = Array.from({ length: 23 }, (_, i) => ({ tipo: 'idea', id: `i${i + 1}`, emoji: '💡', texto: `Idea **${i + 1}**` }));
  laminas.splice(5, 0, { tipo: 'camara', id: 'cam' });
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ emoji: 'apple', laminas }));
  // una hoja vieja de un render más largo no debe quedarse
  fs.mkdirSync(path.join(dir, 'salida'));
  fs.writeFileSync(path.join(dir, 'salida', 'hoja-07.jpg'), 'viejo');
  execFileSync(process.execPath, [path.join(RAIZ, 'scripts', 'render.mjs'), dir, '--finales', '--pdf'], { stdio: 'pipe' });
  const sal = path.join(dir, 'salida');
  const pdf = fs.readFileSync(path.join(sal, 'laminas.pdf'));
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length, 23);
  const hojas = JSON.parse(fs.readFileSync(path.join(sal, 'hojas.json'), 'utf8'));
  assert.deepEqual(hojas.hojas.map(h => [h.archivo, h.desde, h.hasta]), [['hoja-01.jpg', 1, 12], ['hoja-02.jpg', 13, 24]]);
  assert.ok(fs.existsSync(path.join(sal, 'hoja.jpg')), 'hoja.jpg sigue existiendo (copia de la hoja 1)');
  assert.ok(!fs.existsSync(path.join(sal, 'hoja-07.jpg')));
});
