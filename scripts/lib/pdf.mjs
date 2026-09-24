// pdf.mjs — `render.mjs --pdf`: el deck como documento para MANDAR (propuesta, VSL), no el volcado de la hoja.
//
//   laminas.pdf        una página por lámina, del tamaño del formato (para Keynote o Google Slides): el último paso,
//                      sin la mano del cursor ni la onda del clic. Un `stack` a sangre (data-clave-paso) da UNA
//                      página: el stack lleno y, debajo, su remate en una banda (en pantalla el remate tapa el stack).
//   laminas-notas.pdf  con --notas, o por omisión en `propuesta`, `vsl` y `vsl-corto` (--sin-notas lo apaga): una hoja
//                      vertical por lámina con la imagen arriba y su `voz` debajo como TEXTO real (se busca y se
//                      copia). Quien recibe la propuesta sin haber estado en la junta lee el porqué, que vive en la voz.
//   pdf.json           páginas, láminas, cursores visibles al capturar (0) y datos pendientes a la vista.
// El `foco` sale tal cual (su fondo atenuado es el comentario a la lámina anterior, como en el video [15:20]) y el
// mapa 1-2-3 que vuelve se queda: en papel también separa las secciones.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { escapar } from './markup.mjs';

export const PIEZAS_CON_NOTAS = new Set(['propuesta', 'vsl', 'vsl-corto']);
const PENDIENTE = /\[[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ0-9_]+\]/g;

// ¿Lleva el PDF con notas? --notas lo fuerza, --sin-notas lo apaga; si no, según la pieza
export const conNotas = (pieza, { notas = false, sinNotas = false } = {}) => !sinNotas && (notas || PIEZAS_CON_NOTAS.has(pieza));

// La voz de una lámina como párrafos (un paso, un párrafo)
export function vozPlana(l) {
  const v = Array.isArray(l && l.voz) ? l.voz : l && typeof l.voz === 'string' ? [l.voz] : [];
  return v.map(x => String(x).replace(/\s+/g, ' ').trim()).filter(Boolean);
}

// Datos pendientes a la vista o en la voz ([PRECIO]…): el PDF no se manda como final con ellos
export function pendientesDe(paginas) {
  const s = new Set();
  paginas.forEach(p => (JSON.stringify(p.textos || []) + JSON.stringify(p.voz || [])).replace(PENDIENTE, m => { s.add(m); return m; }));
  return [...s];
}

const FUENTES = `@font-face{font-family:'Figtree';src:url('fonts/Figtree.ttf') format('truetype');font-weight:300 900}`;

// Una página por lámina, del tamaño del formato
export function htmlLaminas(paginas, { W, H }) {
  const pag = p => p.banda
    ? `<section class="p"><img class="con-banda" src="${escapar(p.img)}"><img class="banda" src="${escapar(p.banda)}"></section>`
    : `<section class="p"><img class="sola" src="${escapar(p.img)}"></section>`;
  return `<!doctype html><meta charset="utf-8"><style>@page{size:${W}px ${H}px;margin:0}html,body{margin:0;padding:0;background:#fff}
.p{width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(H * 0.01)}px;break-after:page;overflow:hidden}
.p:last-child{break-after:auto}.sola{display:block;width:${W}px;height:${H}px}
.con-banda{display:block;height:${Math.round(H * 0.78)}px;width:auto;box-shadow:0 0 0 2px #eee}
.banda{display:block;max-height:${Math.round(H * 0.18)}px;max-width:${Math.round(W * 0.9)}px;width:auto}</style>${paginas.map(pag).join('')}`;
}

// Hoja vertical por lámina: la imagen arriba y la voz como texto real debajo
export function htmlNotas(paginas, { W, H, titulo = '' }) {
  const alto = Math.round(W * 1.414), m = Math.round(W * 0.06);
  const pag = p => `<section class="h"><div class="n">${escapar(`${p.n} · ${p.id}`)}${titulo ? ` — ${escapar(titulo)}` : ''}</div>
<img class="lam" src="${escapar(p.img)}" style="height:${Math.round((W - 2 * m) * H / W)}px">${p.banda ? `<img class="banda" src="${escapar(p.banda)}">` : ''}
<div class="voz">${p.voz.length ? p.voz.map(v => `<p>${escapar(v)}</p>`).join('') : '<p class="sin">(sin voz)</p>'}</div></section>`;
  return `<!doctype html><meta charset="utf-8"><style>${FUENTES}@page{size:${W}px ${alto}px;margin:0}html,body{margin:0;padding:0;background:#fff}
.h{width:${W}px;height:${alto}px;box-sizing:border-box;padding:${m}px;break-after:page;overflow:hidden;font-family:'Figtree',system-ui,sans-serif;color:#1d1d1d}
.h:last-child{break-after:auto}.n{font:600 34px 'Figtree',system-ui;color:#8a8a8a;margin-bottom:24px}
.lam{display:block;width:${W - 2 * m}px;border:2px solid #e6e6e6}.banda{display:block;max-width:${Math.round((W - 2 * m) * 0.8)}px;max-height:260px;margin:18px auto 0}
.voz{margin-top:48px;font-size:46px;line-height:1.45;font-weight:400}.voz p{margin:0 0 22px}.sin{color:#9a9a9a}</style>${paginas.map(pag).join('')}`;
}

// Captura las páginas desde el presentador ya abierto (window.PZ), sin cursor ni onda
export async function capturarPaginas(page, deck, dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  await page.addStyleTag({ content: '.pdf-captura .cursor,.pdf-captura .onda{display:none!important}' });
  await page.evaluate(() => document.body.classList.add('pdf-captura'));
  const lams = await page.$$('section.lamina');
  const paginas = [];
  let cursores = 0;
  for (let i = 0; i < lams.length; i++) {
    const l = deck.laminas[i];
    if (!l || l.tipo === 'camara') continue;
    const n = await page.evaluate(k => window.PZ.pasos(window.PZ.lams[k]), i);
    const clave = await page.evaluate(k => {
      const v = [...window.PZ.lams[k].querySelectorAll('[data-clave-paso]')].map(e => Number(e.dataset.clavePaso)).filter(Number.isInteger);
      return v.length ? Math.min(...v) : null;
    }, i);
    const base = path.join(dir, `${String(i + 1).padStart(2, '0')}`);
    const p = { n: i + 1, id: l.id || l.tipo, voz: vozPlana(l), img: `${base}.png` };
    const conBanda = clave != null && clave >= 0 && clave < n - 1;
    await page.evaluate(([k, q]) => window.PZ.mostrar(window.PZ.lams[k], q, Infinity), [i, conBanda ? clave : n - 1]);
    cursores += await page.evaluate(k => [...window.PZ.lams[k].querySelectorAll('.cursor,.onda')].filter(c => getComputedStyle(c).display !== 'none').length, i);
    await lams[i].screenshot({ path: p.img, type: 'png' });
    if (conBanda) {
      await page.evaluate(([k, q]) => window.PZ.mostrar(window.PZ.lams[k], q, Infinity), [i, n - 1]);
      // la banda es el recorte de lo que se ve del remate (sus hijos), no la caja completa, que ocupa el lienzo
      const clip = await page.evaluate(k => {
        const r = window.PZ.lams[k].querySelector('.stack-remate');
        const cajas = r ? [...r.querySelectorAll('*')].filter(e => getComputedStyle(e).visibility !== 'hidden' && !e.classList.contains('oculto'))
          .map(e => e.getBoundingClientRect()).filter(b => b.width > 2 && b.height > 2) : [];
        if (!cajas.length) return null;
        const x = Math.min(...cajas.map(b => b.left)), y = Math.min(...cajas.map(b => b.top));
        const pad = 24;
        return { x: Math.max(0, x - pad), y: Math.max(0, y - pad), width: Math.max(...cajas.map(b => b.right)) - x + 2 * pad, height: Math.max(...cajas.map(b => b.bottom)) - y + 2 * pad };
      }, i);
      if (clip) { p.banda = `${base}-remate.png`; await page.screenshot({ path: p.banda, type: 'png', clip }); }
    }
    p.textos = await page.evaluate(k => window.PZ.lams[k].innerText, i);
    paginas.push(p);
  }
  return { paginas, cursores };
}

// Imprime un HTML a PDF con Chromium (el HTML temporal va junto a la salida para que resuelva fonts/ y las imágenes)
export async function imprimir(browser, html, dirSalida, destino, { ancho, alto }) {
  const hp = path.join(dirSalida, `.${path.basename(destino, '.pdf')}.html`);
  fs.writeFileSync(hp, html);
  const p = await browser.newPage();
  await p.goto(pathToFileURL(hp).href, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await p.pdf({ path: destino, width: `${ancho}px`, height: `${alto}px`, printBackground: true, preferCSSPageSize: true });
  await p.close();
  fs.unlinkSync(hp);
}

// Todo el pase: laminas.pdf, y laminas-notas.pdf si toca. Las imágenes van con ruta relativa a la salida.
export async function exportarPdf({ browser, page, deck, dirSalida, W, H, notas }) {
  const dir = path.join(dirSalida, '.pdf');
  const { paginas, cursores } = await capturarPaginas(page, deck, dir);
  if (!paginas.length) { fs.rmSync(dir, { recursive: true, force: true }); return { paginas: 0, avisos: ['--pdf: no hay láminas con imagen'] }; }
  const rel = paginas.map(p => ({ ...p, img: path.relative(dirSalida, p.img), ...(p.banda ? { banda: path.relative(dirSalida, p.banda) } : {}) }));
  await imprimir(browser, htmlLaminas(rel, { W, H }), dirSalida, path.join(dirSalida, 'laminas.pdf'), { ancho: W, alto: H });
  const avisos = [];
  const pendientes = pendientesDe(rel);
  if (notas) {
    await imprimir(browser, htmlNotas(rel, { W, H, titulo: typeof deck.titulo === 'string' ? deck.titulo : '' }), dirSalida, path.join(dirSalida, 'laminas-notas.pdf'), { ancho: W, alto: Math.round(W * 1.414) });
    if (rel.some(p => !p.voz.length)) avisos.push(`laminas-notas.pdf: ${rel.filter(p => !p.voz.length).map(p => p.n).join(', ')} sin voz: la página queda sin explicación`);
  }
  if (pendientes.length) avisos.push(`el PDF lleva datos pendientes a la vista (${pendientes.join(', ')}): no lo mandes como final hasta llenarlos en "datos"`);
  if (cursores) avisos.push(`--pdf: ${cursores} cursor(es) visibles al capturar`);
  fs.writeFileSync(path.join(dirSalida, 'pdf.json'), JSON.stringify({ paginas: rel.length, laminas: rel.map(p => p.n), notas: !!notas, cursores_visibles: cursores, pendientes }, null, 2));
  fs.rmSync(dir, { recursive: true, force: true });
  return { paginas: rel.length, notas: !!notas, avisos };
}
