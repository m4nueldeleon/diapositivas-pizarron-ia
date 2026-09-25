#!/usr/bin/env node
// vitrina.mjs — regenera docs/galeria.jpg (16 láminas del demo, 4×4) y docs/animacion.gif (cuadros reales de
// PZ.mostrar a 12 cps) con el motor actual. Uso: node scripts/vitrina.mjs  (requiere ffmpeg y Chromium).
// Solo quien mantiene la skill lo corre, después de un cambio que se vea en el demo (CLAUDE.md, reglas de mantenimiento).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { abrir, DIR_SKILL } from './lib/pipeline.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-vitrina-')), demo = path.join(tmp, 'demo'), cuadros = path.join(tmp, 'cuadros');
fs.mkdirSync(cuadros, { recursive: true });
try {
  execFileSync(process.execPath, [path.join(DIR_SKILL, 'scripts/render.mjs'), path.join(DIR_SKILL, 'ejemplos/demo'), '--salida', demo, '--sin-hoja'], { stdio: 'inherit' });
  const pasos = JSON.parse(fs.readFileSync(path.join(demo, 'pasos.json'), 'utf8'));
  // Láminas elegidas (numeradas desde 1): una muestra de los diseños que definen el estilo.
  const ELEGIDAS = [1, 2, 3, 4, 6, 7, 9, 10, 11, 17, 20, 21, 25, 26, 45, 55];
  ELEGIDAS.forEach((n, i) => {
    const p = pasos.filter(x => x.lamina === n - 1 && x.archivo).at(-1);
    fs.copyFileSync(path.join(demo, p.archivo), path.join(cuadros, `gal-${String(i).padStart(2, '0')}.png`));
  });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(cuadros, 'gal-%02d.png'), '-vf',
    'scale=640:360,tile=4x4:padding=14:margin=14:color=0xe4e4e4', '-frames:v', '1', '-q:v', '2', path.join(DIR_SKILL, 'docs/galeria.jpg')]);
  // Tramos animados: [lámina desde 0, paso, segundos]
  const TRAMOS = [[1, 0, 1], [1, 1, 1], [1, 2, 1], [3, 0, 4], [20, 0, 1], [20, 1, 1], [20, 2, 1], [15, 0, .7], [15, 1, .7], [15, 2, 2],
    [54, 0, .8], [54, 1, .8], [54, 2, .8], [54, 3, .8], [54, 4, .8]];
  const { browser, page } = await abrir(path.join(demo, 'index.html'), 1920, 1080);
  let n = 0;
  try {
    for (const [i, p, s] of TRAMOS) for (let f = 0; f < Math.round(s * 12); f++) {
      await page.evaluate(([i, p, t]) => window.PZ.mostrar(window.PZ.lams[i], p, t), [i, p, f * 1000 / 12]);
      await page.locator('section.lamina').nth(i).screenshot({ path: path.join(cuadros, `anim-${String(n++).padStart(4, '0')}.png`) });
    }
  } finally { await browser.close(); }
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '12', '-i', path.join(cuadros, 'anim-%04d.png'), '-filter_complex',
    'scale=720:405:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse=dither=bayer:bayer_scale=3', '-loop', '0', path.join(DIR_SKILL, 'docs/animacion.gif')]);
  console.log(`docs/galeria.jpg (16 láminas) y docs/animacion.gif (${n} cuadros a 12 cps) regenerados`);
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
