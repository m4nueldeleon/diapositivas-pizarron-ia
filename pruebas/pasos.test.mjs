// Mapa de pasos (scripts/lib/pasos-mapa.mjs): qué entra en cada paso, leído del HTML armado, sin navegador. Los casos
// que confunden al escribir la voz (LAYOUTS.md, «Pasos que genera cada diseño») y el error de voz de QA con el desglose.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { prepararSalida } from '../scripts/lib/pipeline.mjs';
import { describirPasos, resumenPasos, errorVozPasos } from '../scripts/lib/pasos-mapa.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CASOS = [
  // [id, lámina, pasos que dice LAYOUTS.md]
  ['boton', { tipo: 'boton', boton: 'Aplica aquí', emoji: '📝', texto: 'Contestas **3 preguntas**' }, 1],
  ['tabla', { tipo: 'tabla', esquina: 'Métrica', columnas: ['A', 'B', 'C'], filas: [{ etiqueta: 'Capital', celdas: [{ texto: '$0' }, { texto: '$1' }, { texto: '$2' }] }] }, 4],
  ['tachar', { tipo: 'lista', encabezado: 'Errores:', tachar_despues: true, items: [{ texto: 'Uno', tachado: true }, { texto: 'Dos', tachado: true }, { texto: 'Tres', tachado: true }] }, 6],
  ['sello', { tipo: 'idea', emoji: '📅', texto: 'Dices a qué hora cierras\ny cierras a esa hora', sello: 'Cerrado' }, 2],
  ['flujo', { tipo: 'flujo', texto: 'Así se mueve', nodos: [{ emoji: '📲', etiqueta: 'Mensaje' }, { emoji: '🤖', etiqueta: 'Agente' }, { emoji: '📅', etiqueta: 'Cita' }] }, 3],
  ['lista', { tipo: 'lista', encabezado: 'Sin:', items: ['Uno', 'Dos', 'Tres'] }, 3],
];
function preparar() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-pasos-'));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ emoji: 'apple', marca: false, laminas: CASOS.map(([id, l]) => ({ id, ...l })) }));
  return { dir, p: prepararSalida(dir, path.join(dir, 'salida')) };
}

test('pasos por diseño: lo que dice LAYOUTS.md es lo que arma el motor', () => {
  const { p } = preparar();
  const layouts = fs.readFileSync(path.join(RAIZ, 'references', 'LAYOUTS.md'), 'utf8');
  assert.match(layouts, /### Pasos que genera cada diseño/);
  CASOS.forEach(([id, , n], i) => {
    assert.equal(p.pasos[i], n, `${id}: ${p.pasos[i]} pasos`);
    assert.equal(p.revela[i].length, n, `${id}: revela con ${p.revela[i].length} entradas`);
  });
  const [boton, tabla, tachar, sello, flujo] = p.revela;
  assert.ok(boton[0].includes('clic/cursor') && boton[0].some(x => /Aplica aquí/.test(x)), JSON.stringify(boton));
  assert.match(tabla[0].join(' '), /marco/);
  assert.match(tabla[1].join(' '), /«A»/);
  assert.ok(tachar.slice(3).every(xs => xs.some(x => /^tachón de «/.test(x))), JSON.stringify(tachar));
  assert.ok(tachar.slice(0, 3).every(xs => !xs.some(x => /^tachón/.test(x))));
  assert.deepEqual(sello[1], ['sello «Cerrado»']);
  // el texto de un flujo entra en el ÚLTIMO paso (texto_paso: 0 lo sube)
  assert.ok(flujo[2].some(x => /Así se mueve/.test(x)) && !flujo[0].some(x => /Así se mueve/.test(x)));
});

test('el emoji se nombra aunque se dibuje en SVG, y el marco sin paso propio sale en el paso 1', () => {
  const html = `<div class="t" data-p="0"><span class="emo " style="--s:9px" data-e="${encodeURIComponent('📅')}"><svg><path d="M0"/></svg></span> Hola</div>`
    + '<div class="rotulo">Marco</div><div class="nota" data-p="1" data-tachar-p="2">Nota</div><div class="onda" data-p="1"></div>';
  const r = describirPasos(html, 3, [{ de: 'a', a: 'b', p: 1 }]);
  assert.deepEqual(r[0], ['📅 «Hola»', 'marco «Marco»']);
  assert.deepEqual(r[1], ['«Nota»', 'flecha']);
  assert.deepEqual(r[2], ['tachón de «Nota»']);
  assert.equal(resumenPasos(r), 'paso 1: 📅 «Hola» + marco «Marco» · paso 2: «Nota» + flecha · paso 3: tachón de «Nota»');
});

test('error de voz: dice qué entra en cada paso y que *_paso cuenta desde 0', () => {
  const msg = errorVozPasos('voz', ['Dices a qué hora cierras', 'y cierras a esa hora', 'cerrado'], 2, [['📅 «Dices a qué hora…»'], ['sello «Cerrado»']]);
  assert.match(msg, /tiene 3 textos y la lámina 2 pasos; se perderían: «cerrado»/);
  assert.match(msg, /Lo que entra: paso 1: 📅 «Dices a qué hora…» · paso 2: sello «Cerrado»/);
  assert.match(msg, /cuentan desde 0/);
  const largo = Array.from({ length: 9 }, (_, k) => [`«${k}»`]);
  assert.match(resumenPasos(largo), /paso 6: «5» · …$/);
});

test('render.mjs --pasos imprime el mapa sin navegador y marca la voz que no cuadra', () => {
  const { dir } = preparar();
  const d = JSON.parse(fs.readFileSync(path.join(dir, 'deck.json'), 'utf8'));
  d.laminas[3].voz = ['Uno', 'Dos', 'Tres'];
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(d));
  const out = execFileSync(process.execPath, [path.join(RAIZ, 'scripts', 'render.mjs'), dir, '--salida', path.join(dir, 'salida'), '--pasos'], { encoding: 'utf8' });
  assert.match(out, /4 · sello \(idea\) · 2 pasos {2}✗ voz: 3 textos/);
  assert.match(out, /paso 2: sello «Cerrado»/);
  assert.ok(!fs.existsSync(path.join(dir, 'salida', 'laminas')), 'no debe capturar PNG');
});
