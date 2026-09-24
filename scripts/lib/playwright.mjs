// playwright.mjs — (portado de carruseles-virales-ia) encuentra playwright donde esté (carpeta de la skill, carpeta de trabajo, global de npm)
// y comprueba que el navegador exista. Si el sistema limpió ~/Library/Caches (pasa con limpiadores
// de disco), lo dice y da el comando exacto para reinstalarlo.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function cargarPlaywright(dirSkill) {
  const estable = path.join(os.homedir(), '.playwright-browsers');
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(estable)) process.env.PLAYWRIGHT_BROWSERS_PATH = estable;
  const candidatos = [path.join(dirSkill, 'node_modules') + path.sep, process.cwd() + path.sep];
  try { candidatos.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() + path.sep); } catch {}
  candidatos.push('/opt/homebrew/lib/node_modules/', '/usr/local/lib/node_modules/', '/usr/lib/node_modules/');
  let pw = null, base = null;
  for (const b of candidatos) { try { pw = createRequire(b)('playwright'); base = b; break; } catch {} }
  if (!pw) throw new Error('No encuentro playwright. Corre: bash "' + path.join(dirSkill, 'scripts', 'setup.sh') + '"');
  let exe = '';
  try { exe = pw.chromium.executablePath(); } catch {}
  if (exe && !fs.existsSync(exe)) {
    const cli = path.join(base, 'playwright', 'cli.js');
    throw new Error(`Playwright está, pero falta el navegador (${exe}). Reinstálalo con:\n  node "${cli}" install chromium\n` +
      `Consejo: exporta PLAYWRIGHT_BROWSERS_PATH=${estable} antes de instalar para que ningún limpiador de caché lo borre.`);
  }
  return pw;
}
