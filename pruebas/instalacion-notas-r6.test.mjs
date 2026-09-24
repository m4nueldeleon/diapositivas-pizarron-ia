import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { htmlNotas, notasPlanas } from '../scripts/lib/pdf.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const variables = ['FIRMA', 'SUFIJO', 'LOGO', 'VETADAS', 'COMUNIDAD', 'PROXIMA_CLASE'];
function conCasa(probar) {
  const casa = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-ficha-r6-'));
  const entorno = Object.fromEntries(Object.entries(process.env).filter(([k]) => !variables.some(v => k === `PIZARRON_${v}`)));
  const ficha = path.join(casa, '.config/diapositivas-pizarron-ia/MI-MARCA.md');
  const correr = (extra = {}, flags = []) => spawnSync('bash', [path.join(raiz, 'scripts/setup.sh'), '--solo-ficha', ...flags], {
    env: { ...entorno, HOME: casa, ...extra }, input: '', detached: true, encoding: 'utf8',
  });
  try { probar({ ficha, correr }); } finally { fs.rmSync(casa, { recursive: true, force: true }); }
}

test('firma y puente por entorno crean la ficha sin terminal', () => conCasa(({ ficha, correr }) => {
  const r = correr({ PIZARRON_FIRMA: '@x', PIZARRON_COMUNIDAD: 'Club del ejemplo', PIZARRON_PROXIMA_CLASE: 'lunes a las 18' });
  assert.equal(r.status, 0, r.stderr);
  const contenido = fs.readFileSync(ficha, 'utf8');
  assert.match(contenido, /Texto.*@x/);
  assert.match(contenido, /Club del ejemplo/);
  assert.match(contenido, /lunes a las 18/);
}));

test('los flags ganan sobre la firma del entorno', () => conCasa(({ ficha, correr }) => {
  assert.equal(correr({ PIZARRON_FIRMA: '@x' }, ['--firma', '@otra']).status, 0);
  assert.match(fs.readFileSync(ficha, 'utf8'), /Texto.*@otra/);
}));

test('stdin en pipe y sin TTY abrible conserva el consejo y termina sin ficha', () => conCasa(({ ficha, correr }) => {
  const r = correr();
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.existsSync(ficha), false);
  assert.match(r.stdout, /sin terminal interactiva.*--solo-ficha.*--firma/);
}));

test('la firma de relleno por entorno conserva el código de error de --firma', () => conCasa(({ ficha, correr }) => {
  assert.equal(correr({ PIZARRON_FIRMA: 'tumarca.com' }).status, 3);
  assert.equal(fs.existsSync(ficha), false);
}));

test('la hoja PDF de notas conserva voz, acción y respaldo por paso, escapados', () => {
  const notas = notasPlanas({ voz: ['Primer paso', 'Segundo paso'], accion: ['Abrir <sitio>', 'Mostrar respuesta'], si_falla: 'Usar captura & explicar' });
  assert.deepEqual(notas, ['Primer paso\nACCIÓN: Abrir <sitio>\nSI FALLA: Usar captura & explicar', 'Segundo paso\nACCIÓN: Mostrar respuesta\nSI FALLA: Usar captura & explicar']);
  const html = htmlNotas([{ n: 1, id: 'ensayo', img: 'ensayo.png', voz: ['Primer paso'], notas }], { W: 1920, H: 1080 });
  assert.match(html, /ACCIÓN: Abrir &lt;sitio&gt;/);
  assert.match(html, /SI FALLA: Usar captura &amp; explicar/);
  assert.doesNotMatch(html, /<sitio>/);
});
