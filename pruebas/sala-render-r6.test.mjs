// Sala en el navegador: lo apagado queda a 35 % y un deck de sala sin densidad de video no da errores de tamaño;
// el mismo deck sin sala conserva el perfil de video (20 %) [ref_1040].
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..');
const FIXTURE = JSON.parse(fs.readFileSync(path.join(RAIZ, 'pruebas/fixtures/sala-r6/deck.json'), 'utf8'));

async function opacidades(deck) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-sala-'));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  const p = prepararSalida(dir, path.join(dir, 'salida'));
  const { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  try {
    return await page.evaluate(() => {
      const [, mapa, foco] = window.PZ.lams;
      window.PZ.mostrar(mapa, window.PZ.pasos(mapa) - 1, Infinity);
      window.PZ.mostrar(foco, window.PZ.pasos(foco) - 1, Infinity);
      const apagados = [...mapa.querySelectorAll('[style*="opacity"]')].map(e => +getComputedStyle(e).opacity).filter(o => o < 1);
      return { apagados, foco: +getComputedStyle(foco.querySelector('.escena.clon')).opacity };
    });
  } finally { await browser.close(); }
}

test('sala: pasos inactivos y fondo del foco al 35 %; video idéntico al 20 %', { timeout: 120_000 }, async () => {
  const sala = await opacidades(FIXTURE);
  assert.ok(sala.apagados.length >= 2, JSON.stringify(sala));
  sala.apagados.forEach(o => assert.ok(Math.abs(o - 0.35) < 0.001, JSON.stringify(sala)));
  assert.ok(Math.abs(sala.foco - 0.35) < 0.001, JSON.stringify(sala));
  const video = await opacidades({ ...FIXTURE, sala: undefined });
  video.apagados.forEach(o => assert.ok(Math.abs(o - 0.2) < 0.001, JSON.stringify(video)));
  assert.ok(Math.abs(video.foco - 0.2) < 0.001, JSON.stringify(video));
});

test('sala: un deck sin densidad de video pasa sin errores de tamaño ni de apagado', { timeout: 180_000 }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-sala-qa-'));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(FIXTURE));
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'scripts/qa.mjs'), dir, '--salida', path.join(dir, 'salida')], { encoding: 'utf8' });
  const qa = JSON.parse(fs.readFileSync(path.join(dir, 'salida', 'qa.json'), 'utf8'));
  assert.deepEqual(qa.errores.filter(e => /en sala/.test(e)), [], r.stdout + r.stderr);
});
