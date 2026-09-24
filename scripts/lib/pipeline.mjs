// pipeline.mjs — lo que comparten render, video y qa: leer el deck, construir el HTML y abrirlo en Chromium.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { construirHTML } from './construir.mjs';
import { cargarPlaywright } from './playwright.mjs';

export const DIR_SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Banderas que nunca llevan valor (así «--finales carpeta» no se come la carpeta)
const BOOLEANAS = new Set(['--finales', '--sin-hoja', '--solo-html', '--json', '--conservar-cuadros', '--pdf']);

export function argumentos(argv) {
  const args = argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
  const flag = k => args.includes(k);
  const conValor = new Set(args.map((a, i) => (a.startsWith('--') && !BOOLEANAS.has(a) && args[i + 1] && !args[i + 1].startsWith('--') ? i + 1 : -1)));
  const pos = args.filter((a, i) => !a.startsWith('--') && !conValor.has(i));
  return { args, opt, flag, pos };
}

// Acepta la carpeta del deck o la ruta a deck.json
export function leerDeck(entrada) {
  let jsonPath = path.resolve(entrada || '.');
  if (fs.existsSync(jsonPath) && fs.statSync(jsonPath).isDirectory()) jsonPath = path.join(jsonPath, 'deck.json');
  if (!fs.existsSync(jsonPath)) throw new Error(`No existe ${jsonPath}`);
  let deck;
  try { deck = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (e) { throw new Error(`deck.json no es JSON válido: ${e.message}`); }
  return { deck, jsonPath, dirDeck: path.dirname(jsonPath) };
}

export function prepararSalida(entrada, salida) {
  const { deck, jsonPath, dirDeck } = leerDeck(entrada);
  const dirSalida = path.resolve(salida || path.join(dirDeck, 'salida'));
  const r = construirHTML({ deck, dirDeck, dirSalida, dirSkill: DIR_SKILL });
  const htmlPath = path.join(dirSalida, 'index.html');
  fs.writeFileSync(htmlPath, r.html);
  return { ...r, crudo: deck, jsonPath, dirDeck, dirSalida, htmlPath };
}

export async function abrir(htmlPath, W, H, { escala = 1, modo = 'render' } = {}) {
  const { chromium } = cargarPlaywright(DIR_SKILL);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: escala });
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  await page.goto(pathToFileURL(htmlPath).href + '?modo=' + encodeURIComponent(modo), { waitUntil: 'load', timeout: 90_000 });
  await page.evaluate(() => window.PZ.listo);
  await page.waitForTimeout(150);
  const avisos = await page.evaluate(() => window.PZ.avisos.slice());
  return { browser, page, errores, avisos };
}
