// pipeline.mjs — lo que comparten render, video y qa: leer el deck, construir el HTML y abrirlo en Chromium.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { construirHTML } from './construir.mjs';
import { cargarPlaywright } from './playwright.mjs';
import { firmaParaDeck, datosParaDeck, buscarMarca } from './marca.mjs';

// Si el lector de la tubería se va («render.mjs … | head -1»), escribir en stdout daba EPIPE y el proceso moría a
// media escritura (con hojas.json apuntando a hojas ya borradas). render, qa y video importan este módulo: aquí se
// ignora ese error y el trabajo en disco termina con su código normal.
for (const s of [process.stdout, process.stderr]) s.on('error', e => { if (e.code !== 'EPIPE' && e.code !== 'ERR_STREAM_DESTROYED') throw e; });

export const DIR_SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Banderas que nunca llevan valor (así «--finales carpeta» no se come la carpeta)
const BOOLEANAS = new Set(['--borrador', '--forzar', '--finales', '--sin-hoja', '--solo-html', '--json', '--conservar-cuadros', '--pdf', '--pdf-pasos', '--notas', '--sin-notas', '--estricto', '--pasos', '--qa', '--sin-navegador', '--corregir']);

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
export function prepararSalida(entrada, salida, { forzar = false } = {}) {
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
  return { ...r, html_sha: crypto.createHash('sha256').update(r.html).digest('hex'), credenciales: buscarMarca(dirDeck)?.credenciales || [], crudo: { ...base, laminas: r.crudoResuelto.laminas }, jsonPath, dirDeck, dirSalida, htmlPath, firmaDe: f.ruta, fichaMarca: f.ficha,
    evidencia: evidenciaReplica(leido, jsonPath, fs.readFileSync(jsonPath), { forzar }), avisoFirma: f.aviso, infoDatosFicha: p.info, avisoReplica: avisoReplica(leido, jsonPath) };
}

// Un deck cuyas láminas son TODAS «r<seg>», sin `_cuadro` y fuera de pruebas/replica parece la réplica vieja de
// pizarron-ref: no se bloquea (un deck real puede usar esos ids), solo se avisa por consola.
export function avisoReplica(deck, jsonPath) {
  const L = Array.isArray(deck.laminas) ? deck.laminas.filter(l => l && l.tipo !== 'camara') : [];
  if (L.length < 3 || !L.every(l => /^r\d+$/.test(String(l.id || ''))) || L.some(l => l._cuadro)) return null;
  if (path.resolve(jsonPath) === path.join(DIR_SKILL, 'pruebas', 'replica', 'deck.json')) return null;
  return 'parece la réplica vieja (láminas r<seg> sin _cuadro): la fidelidad se mide con node scripts/comparar.mjs <carpeta-ref> (compara pruebas/replica)';
}

export async function abrir(htmlPath, W, H, { escala = 1, modo = 'render' } = {}) {
  const browser = await lanzarChromium();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: escala });
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  await page.goto(pathToFileURL(htmlPath).href + '?modo=' + encodeURIComponent(modo), { waitUntil: 'load', timeout: 90_000 });
  await page.evaluate(() => window.PZ.listo);
  await page.waitForTimeout(150);
  const avisos = await page.evaluate(() => window.PZ.avisos.slice());
  return { browser, page, errores, avisos };
}

// La huella se calcula sobre los bytes del archivo, antes de sanear o sustituir datos.
export function evidenciaReplica(deck, jsonPath, contenido = JSON.stringify(deck), { forzar = false } = {}) {
  const deck_sha = crypto.createHash('sha256').update(contenido).digest('hex').slice(0, 12);
  const invalido = !forzar && Boolean(avisoReplica(deck, jsonPath));
  return { invalido, deck_sha, laminas_dir: invalido ? 'laminas-NO-VALE' : 'laminas', sello: invalido ? `NO VALE · réplica vieja · sha ${deck_sha}` : '' };
}

export class ErrorNavegador extends Error {
  constructor(mensaje, motivo) {
    super(mensaje);
    this.name = 'ErrorNavegador';
    this.code = 'SIN_NAVEGADOR';
    this.motivo = motivo;
  }
}

export function clasificarErrorNavegador(error) {
  const mensaje = String(error?.message || error);
  if (/bootstrap_check_in|MachPortRendezvous|Permission denied|SIGTRAP|Target page, context or browser has been closed/i.test(mensaje)) {
    return new ErrorNavegador('Chromium no puede arrancar dentro de este sandbox (p. ej. Codex con -s workspace-write en macOS). El orquestador o Claude debe renderizar y revisar las hojas fuera del sandbox; mientras, usa qa.mjs --sin-navegador. SIN RENDER, revisión visual pendiente', 'sandbox');
  }
  if (/falta el navegador|Executable doesn.t exist|executable.*(not found|does not exist)|No encuentro playwright/i.test(mensaje)) {
    return new ErrorNavegador(mensaje, 'falta');
  }
  return error;
}

// Dentro de un sandbox de macOS (Codex con -s workspace-write) Chromium no puede registrar sus puertos Mach y
// muere al arrancar; en un solo proceso sí arranca y pinta igual. Se reintenta así solo cuando el primer intento
// cae por el sandbox (PZ_SIN_UNICO=1 lo apaga). Si el reintento también falla, se conserva el diagnóstico original.
export const ARGS_UN_PROCESO = ['--single-process', '--no-zygote', '--no-sandbox', '--disable-gpu'];

async function lanzarUnaVez(opciones) {
  if (process.env.PZ_LAUNCH_FALSO === 'mach') throw new Error('bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100)');
  if (process.env.PZ_LAUNCH_FALSO === 'falta') throw new Error('Playwright está, pero falta el navegador. Reinstálalo con: npx playwright install chromium');
  const { chromium } = cargarPlaywright(DIR_SKILL);
  return await chromium.launch(opciones);
}

// Navegadores lanzados en un solo proceso: no admiten un segundo contexto (browser.newPage después de la primera
// página falla con «Target page, context or browser has been closed»). nuevaPagina() lo resuelve.
const UN_PROCESO = new WeakSet();
const marcarUnProceso = b => { UN_PROCESO.add(b); return b; };

export async function lanzarChromium(opciones = {}) {
  const pedido = (opciones.args || []).includes('--single-process');
  let original;
  try { const b = await lanzarUnaVez(opciones); return pedido ? marcarUnProceso(b) : b; } catch (error) { original = clasificarErrorNavegador(error); }
  if (original?.motivo === 'sandbox' && process.env.PZ_SIN_UNICO !== '1') {
    try { return marcarUnProceso(await lanzarUnaVez({ ...opciones, args: [...(opciones.args || []), ...ARGS_UN_PROCESO] })); } catch { /* queda el diagnóstico original */ }
  }
  throw original;
}

// Una página más en el mismo navegador. En un solo proceso se abre en un navegador extra que se cierra con la página
// (y con el navegador principal, si alguien olvida cerrar la página). Fuera del sandbox es browser.newPage de siempre.
export async function nuevaPagina(browser, opciones = {}) {
  if (!UN_PROCESO.has(browser) || browser.contexts().length === 0) return browser.newPage(opciones);
  const extra = await lanzarChromium({ args: ARGS_UN_PROCESO });
  const page = await extra.newPage(opciones);
  const cerrarPagina = page.close.bind(page);
  page.close = async (...a) => { try { await cerrarPagina(...a); } finally { await extra.close().catch(() => {}); } };
  if (!browser.__extras) {
    browser.__extras = new Set();
    const cerrarPrincipal = browser.close.bind(browser);
    browser.close = async (...a) => { await Promise.all([...browser.__extras].map(x => x.close().catch(() => {}))); return cerrarPrincipal(...a); };
  }
  browser.__extras.add(extra);
  extra.on('disconnected', () => browser.__extras.delete(extra));
  return page;
}
