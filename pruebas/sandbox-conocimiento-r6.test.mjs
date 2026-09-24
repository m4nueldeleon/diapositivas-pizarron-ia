import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { clasificarErrorNavegador, ErrorNavegador, lanzarChromium, evidenciaReplica, DIR_SKILL, argumentos } from '../scripts/lib/pipeline.mjs';
import { htmlHoja, htmlHojaPasos, selloEvidencia } from '../scripts/lib/hoja.mjs';

const temporal = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pz-conocimiento-'));
const ejecutar = (script, args, env = {}) => spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts', script + '.mjs'), ...args], { cwd: DIR_SKILL, encoding: 'utf8', env: { ...process.env, ...env } });

test('Chromium: clasifica MachPort, ejecutable ausente y conserva otros errores', async () => {
  const original = new Error('bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100)');
  const error = clasificarErrorNavegador(original);
  assert.ok(error instanceof ErrorNavegador);
  assert.equal(error.code, 'SIN_NAVEGADOR');
  assert.equal(error.motivo, 'sandbox');
  assert.match(error.message, /Chromium no puede arrancar dentro de este sandbox/);
  const falta = clasificarErrorNavegador(new Error('Executable doesn\'t exist. Reinstálalo con: npx playwright install chromium'));
  assert.equal(falta.motivo, 'falta');
  assert.match(falta.message, /Reinstálalo/);
  const otro = new Error('Error de red ajeno al arranque');
  assert.equal(clasificarErrorNavegador(otro), otro);
  const previo = process.env.PZ_LAUNCH_FALSO;
  process.env.PZ_LAUNCH_FALSO = 'falta';
  try { await assert.rejects(lanzarChromium(), e => e.code === 'SIN_NAVEGADOR' && e.motivo === 'falta'); }
  finally { if (previo === undefined) delete process.env.PZ_LAUNCH_FALSO; else process.env.PZ_LAUNCH_FALSO = previo; }
});

test('QA: falla de sandbox sale 4 sin stack', () => {
  const salida = temporal();
  try {
    const r = ejecutar('qa', ['ejemplos/reel', '--salida', salida], { PZ_LAUNCH_FALSO: 'mach' });
    assert.equal(r.status, 4, r.stderr);
    assert.match(r.stderr, /✗ Chromium no puede arrancar/);
    assert.doesNotMatch(r.stderr, /at abrir|at principal|ErrorNavegador:/);
  } finally { fs.rmSync(salida, { recursive: true, force: true }); }
});

test('render: un arranque fallido conserva láminas, hojas y manifiestos anteriores', () => {
  const salida = temporal();
  try {
    fs.mkdirSync(path.join(salida, 'laminas'));
    const archivos = ['laminas/anterior.png', 'hoja.jpg', 'hoja-pasos-01.jpg', 'hojas.json', 'pasos.json'];
    archivos.forEach(f => fs.writeFileSync(path.join(salida, f), 'evidencia anterior'));
    const r = ejecutar('render', ['ejemplos/reel', '--salida', salida], { PZ_LAUNCH_FALSO: 'mach' });
    assert.equal(r.status, 4, r.stderr);
    archivos.forEach(f => assert.equal(fs.readFileSync(path.join(salida, f), 'utf8'), 'evidencia anterior', f));
    assert.ok(!fs.readdirSync(salida).some(f => f.startsWith('.render-')));
  } finally { fs.rmSync(salida, { recursive: true, force: true }); }
});

test('QA de texto nunca lanza Chromium, nunca entrega listo y conserva el QA visual', () => {
  const salida = temporal();
  try {
    fs.writeFileSync(path.join(salida, 'qa.json'), 'medición previa');
    const r = ejecutar('qa', ['--sin-navegador', 'ejemplos/reel', '--salida', salida], { PZ_LAUNCH_FALSO: 'mach' });
    assert.equal(r.status, 0, r.stderr);
    const q = JSON.parse(fs.readFileSync(path.join(salida, 'qa-texto.json')));
    assert.equal(q.medido, false);
    assert.equal(q.estado, 'sin-medir');
    assert.equal(q.nota_es_provisional, true);
    assert.deepEqual(q.comprobaciones_visuales_pendientes, ['contraste', 'desbordes', 'capa a mano', 'emojis', 'hoja']);
    assert.ok(q.ritmo && q.arco);
    assert.match(r.stdout, /Faltan las medidas visuales/);
    assert.equal(fs.readFileSync(path.join(salida, 'qa.json'), 'utf8'), 'medición previa');
    assert.deepEqual(argumentos(['node', 'qa', '--sin-navegador', 'ejemplos/reel']).pos, ['ejemplos/reel']);
  } finally { fs.rmSync(salida, { recursive: true, force: true }); }
});

test('QA de texto estricto: errores de validación quedan en el informe y salen con 3', () => {
  const salida = temporal();
  try {
    fs.writeFileSync(path.join(salida, 'deck.json'), JSON.stringify({ laminas: [{ tipo: 'inexistente' }] }));
    const r = ejecutar('qa', [salida, '--sin-navegador', '--estricto', '--salida', salida]);
    assert.equal(r.status, 3, r.stderr);
    const q = JSON.parse(fs.readFileSync(path.join(salida, 'qa-texto.json')));
    assert.equal(q.estado, 'sin-medir');
    assert.ok(q.errores.length);
  } finally { fs.rmSync(salida, { recursive: true, force: true }); }
});

test('réplica vieja: sello diagonal, huella del archivo e invalidez en ambas hojas', () => {
  const deck = { laminas: [10, 20, 30].map(seg => ({ id: `r${seg}`, tipo: 'idea', texto: 'Una idea' })) };
  const e = evidenciaReplica(deck, path.join(os.tmpdir(), 'replica-antigua', 'deck.json'));
  assert.equal(e.invalido, true);
  assert.match(e.deck_sha, /^[a-f0-9]{12}$/);
  assert.equal(e.sello, `NO VALE · réplica vieja · sha ${e.deck_sha}`);
  for (const generar of [htmlHoja, htmlHojaPasos]) {
    const html = generar([], { W: 1920, H: 1080, sello: e.sello }).html;
    assert.match(html, /NO VALE · réplica vieja · sha/);
    assert.match(html, /rotate\(-18deg\)/);
    assert.match(html, /color:#c90000/);
  }
  assert.doesNotMatch(selloEvidencia('<img src=x>'), /<img/);
  assert.equal(evidenciaReplica(deck, path.join(DIR_SKILL, 'pruebas', 'replica', 'deck.json')).invalido, false);
  assert.equal(evidenciaReplica({ laminas: [{ ...deck.laminas[0], _cuadro: 'ref_10.jpg' }, ...deck.laminas.slice(1)] }, '/tmp/deck.json').invalido, false);
  assert.notEqual(evidenciaReplica(deck, '/tmp/deck.json', 'otro contenido').deck_sha, e.deck_sha);
});

test('réplica vieja: QA de texto guarda invalido y el sha de los bytes del deck', () => {
  const salida = temporal();
  try {
    const deck = { emoji: 'apple', marca: false, laminas: [10, 20, 30].map(seg => ({ id: `r${seg}`, tipo: 'idea', texto: 'Una idea', voz: 'Una idea' })) };
    const contenido = JSON.stringify(deck, null, 2) + '\n';
    const archivo = path.join(salida, 'deck.json');
    fs.writeFileSync(archivo, contenido);
    const r = ejecutar('qa', [archivo, '--sin-navegador', '--salida', salida]);
    assert.equal(r.status, 0, r.stderr);
    const q = JSON.parse(fs.readFileSync(path.join(salida, 'qa-texto.json')));
    assert.equal(q.invalido, true);
    assert.equal(q.deck_sha, evidenciaReplica(deck, archivo, contenido).deck_sha);
  } finally { fs.rmSync(salida, { recursive: true, force: true }); }
});
