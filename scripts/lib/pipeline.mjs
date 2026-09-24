// pipeline.mjs — lo que comparten render, video y qa: leer el deck, construir el HTML y abrirlo en Chromium.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { construirHTML } from './construir.mjs';
import { cargarPlaywright } from './playwright.mjs';
import { firmaParaDeck, datosParaDeck } from './marca.mjs';

// Si el lector de la tubería se va («render.mjs … | head -1»), escribir en stdout daba EPIPE y el proceso moría a
// media escritura (con hojas.json apuntando a hojas ya borradas). render, qa y video importan este módulo: aquí se
// ignora ese error y el trabajo en disco termina con su código normal.
for (const s of [process.stdout, process.stderr]) s.on('error', e => { if (e.code !== 'EPIPE' && e.code !== 'ERR_STREAM_DESTROYED') throw e; });

export const DIR_SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Banderas que nunca llevan valor (así «--finales carpeta» no se come la carpeta)
const BOOLEANAS = new Set(['--finales', '--sin-hoja', '--solo-html', '--json', '--conservar-cuadros', '--pdf', '--pdf-pasos', '--notas', '--sin-notas', '--estricto', '--pasos', '--qa']);

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

// Un deck SIN «marca» (ausente, no `false`) toma la firma de la ficha MI-MARCA.md (marca.mjs: carpeta del deck → la de
// arriba → $PIZARRON_MARCA → ~/.config/diapositivas-pizarron-ia/MI-MARCA.md). `crudo` sigue siendo el deck.json tal cual;
// `firmaDe` dice de qué ficha salió la firma (render y QA lo imprimen).
export function prepararSalida(entrada, salida) {
  const { deck: leido, jsonPath, dirDeck } = leerDeck(entrada);
  const dirSalida = path.resolve(salida || path.join(dirDeck, 'salida'));
  const f = firmaParaDeck(leido, dirDeck);
  // {{COMUNIDAD}} / {{PROXIMA_CLASE}} de la ficha (puente de clases) cuando el deck no los trae: van también al `crudo`
  const p = datosParaDeck(leido, dirDeck);
  const base = p.deck;
  const deck = f.marca ? { ...base, marca: f.marca } : base;
  const r = construirHTML({ deck, dirDeck, dirSalida, dirSkill: DIR_SKILL });
  const htmlPath = path.join(dirSalida, 'index.html');
  fs.writeFileSync(htmlPath, r.html);
  // `crudo`: el deck.json con los `como` ya resueltos, antes de sustituir `datos` (las reglas leen de ahí los {{MARCADORES}})
  return { ...r, crudo: { ...base, laminas: r.crudoResuelto.laminas }, jsonPath, dirDeck, dirSalida, htmlPath, firmaDe: f.ruta, fichaMarca: f.ficha,
    avisoFirma: f.aviso, infoDatosFicha: p.info, avisoReplica: avisoReplica(leido, jsonPath) };
}

// Un deck cuyas láminas son TODAS «r<seg>», sin `_cuadro` y fuera de pruebas/replica parece la réplica vieja de
// pizarron-ref: no se bloquea (un deck real puede usar esos ids), solo se avisa por consola.
function avisoReplica(deck, jsonPath) {
  const L = Array.isArray(deck.laminas) ? deck.laminas.filter(l => l && l.tipo !== 'camara') : [];
  if (L.length < 3 || !L.every(l => /^r\d+$/.test(String(l.id || ''))) || L.some(l => l._cuadro)) return null;
  if (path.resolve(jsonPath) === path.join(DIR_SKILL, 'pruebas', 'replica', 'deck.json')) return null;
  return 'parece la réplica vieja (láminas r<seg> sin _cuadro): la fidelidad se mide con node scripts/comparar.mjs <carpeta-ref> (compara pruebas/replica)';
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
