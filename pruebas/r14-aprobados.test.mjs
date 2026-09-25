// R14 (juez r14, punto 2): un deck que ya salió aprobado no puede empeorar en silencio. La propuesta de la ronda 11 pasó
// de 100 a 49 cuando las listas crecieron por ocupación sin reservar la nota de su llave. Estas piezas se renderizan
// con el motor actual y deben terminar sin errores (los avisos de contenido nuevos se toleran; los errores, no).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIR_SKILL, lanzarChromium } from '../scripts/lib/pipeline.mjs';

const APROBADOS = path.join(DIR_SKILL, 'pruebas', 'fixtures', 'aprobados');

for (const nombre of fs.readdirSync(APROBADOS)) {
  test(`r14: el deck aprobado «${nombre}» sigue sin errores con el motor actual`, { timeout: 300_000 }, async t => {
    try { const b = await lanzarChromium(); await b.close(); }
    catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(`SIN RENDER: ${e.motivo}`); return; }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-aprobado-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.copyFileSync(path.join(APROBADOS, nombre, 'deck.json'), path.join(dir, 'deck.json'));
    const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts/render.mjs'), dir, '--sin-hoja', '--qa'], { encoding: 'utf8' });
    const qa = JSON.parse(fs.readFileSync(path.join(dir, 'salida', 'qa.json'), 'utf8'));
    assert.deepEqual(qa.errores, [], r.stdout.slice(-2000));
    assert.ok(qa.nota >= 90, `${nombre}: nota ${qa.nota}`);
  });
}
