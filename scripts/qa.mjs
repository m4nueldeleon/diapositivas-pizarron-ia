#!/usr/bin/env node
// qa.mjs — revisa el deck renderizado con reglas que cuentan, no que opinan. Nota 0-100.
//
//   node scripts/qa.mjs <carpeta|deck.json> [--salida dir] [--json]
//
// Errores (−12 c/u):
//   · desbordes del lienzo (el sello incluido, medido con su giro), textos encimados;
//   · letra efectiva menor a 28 px (con el zoom del encaje), encaje menor a 70%;
//   · emojis o imágenes sin cargar, anclas de flechas que no existen, más de 35 palabras visibles;
//   · marcas sin convertir a la vista (**, __, ~~, ==…==, [[ ]], {v:): una marca sin cerrar o partida;
//   · sello que tapa texto (>12% de un renglón) o un emoji (>20%); cursor que tapa letras o un emoji;
//   · flecha que atraviesa un renglón de texto (se lee como tachón);
//   · burbuja, tarjeta, ítem, cuadro, etiqueta u opción vacíos;
//   · contraste menor a 2:1 entre el texto y su fondo (en degradados, contra su color medio);
//   · dato pendiente a la vista: [PRECIO], [WHATSAPP], [DÍAS]… (un error por dato, con sus láminas);
//   · `voz` o `anclas` como lista con distinto largo que los pasos de la lámina.
// Avisos (−3 c/u):
//   · más de 22 palabras en un paso, más de 2 énfasis, letra efectiva menor a 40 px (a 1920 de ancho);
//   · encaje de 85% o menos, sello reducido a menos de 70% (texto largo para un sello);
//   · texto que toca la firma, firma sobre una celda con texto de la tabla;
//   · contraste menor a 3:1 en texto de color (tonos, huecos, notas rojas) o sobre la lámina oscura;
//   · campo que ese diseño no usa (¿error de dedo?), emoji dudoso o aproximado en Fluent;
//   · `voz` de un solo texto en una lámina de varios pasos; firma por omisión («tumarca»);
//   · 9:16: contenido en menos del 35% del alto, o dentro de la zona que tapa la interfaz de Reels;
//   · un mismo diseño 4 veces seguidas o en más del 45% del deck, 4 láminas seguidas sin capa a mano,
//     más de 15% de láminas oscuras.
import fs from 'node:fs';
import path from 'node:path';
import { argumentos, prepararSalida, abrir } from './lib/pipeline.mjs';
import { MARCA_LITERAL } from './lib/markup.mjs';

const { flag, pos, opt } = argumentos(process.argv);
let prep;
try { prep = prepararSalida(pos[0], opt('--salida')); } catch (e) { console.error('✗ ' + e.message); process.exit(2); }
const { deck, dirSalida, htmlPath, W, H, pasos, avisos: avisosBuild, sugerencias = [] } = prep;
const { browser, page, avisos, errores: errPagina } = await abrir(htmlPath, W, H);

const porLamina = await page.evaluate(([W, H, MARCA]) => {
  const out = [];
  const reMarca = new RegExp(MARCA);
  const rePendiente = /\[[A-ZÁÉÍÓÚÑÜ0-9][A-ZÁÉÍÓÚÑÜ0-9 _\-]{1,30}\]/g;
  const vertical = H > W;
  const visible = e => { const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('.oculto') && e.getClientRects().length; };
  const caja = (e, lam) => { const r = e.getBoundingClientRect(), L = lam.getBoundingClientRect(); return { x: r.left - L.left, y: r.top - L.top, w: r.width, h: r.height }; };
  const rel = (r, L) => ({ x: r.left - L.left, y: r.top - L.top, w: r.width, h: r.height });
  const cruza = (a, b) => { const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)); return x * y; };
  const opac = e => { let o = 1; for (let a = e; a && a.nodeType === 1; a = a.parentElement) o *= parseFloat(getComputedStyle(a).opacity); return o; };
  const zoom = e => { let z = 1; for (let a = e; a && a.nodeType === 1; a = a.parentElement) z *= parseFloat(getComputedStyle(a).zoom) || 1; return z; };
  const corto = (s, n = 30) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const TEXTO = '.t, .nota, .item, .etiqueta, .valor, .encabezado, .cifra, .etiqueta-chica, .tarjeta, .opcion, .burbuja, .titulo-marca';
  const CAJAS = TEXTO + ', .emo, img, table, .captura, .pastilla, .calendario, .rejilla, .medidor, .boton-ui';
  const PRINCIPAL = '.t, .item, .etiqueta, .burbuja, .tarjeta';
  const fueraClon = e => !e.closest('.escena.clon');

  // Renglones reales de texto: un rect por nodo de texto y renglón (no las cajas de los elementos)
  function renglones(raiz, L) {
    const r = [];
    const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      const el = n.parentElement;
      if (!el || !/\S/.test(n.nodeValue) || el.closest('script, style, .emo, .sello, .cursor, .firma, .capa-mano') || !fueraClon(el)) continue;
      if (!visible(el) || opac(el) < 0.5) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      [...rg.getClientRects()].filter(q => q.width > 3 && q.height > 3).forEach(q => r.push({ el, n, b: rel(q, L) }));
    }
    return r;
  }
  // Polígono del sello girado (a partir de su transform real, que ya trae la escala del encaje)
  function poligonoSello(s, L) {
    const r = s.getBoundingClientRect(), cx = r.left - L.left + r.width / 2, cy = r.top - L.top + r.height / 2;
    const m = new DOMMatrix(getComputedStyle(s).transform);
    const sc = Math.hypot(m.a, m.b) || 1, ang = Math.atan2(m.b, m.a), hw = s.offsetWidth * sc / 2, hh = s.offsetHeight * sc / 2;
    const c = Math.cos(ang), sn = Math.sin(ang);
    return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => [cx + x * c - y * sn, cy + x * sn + y * c]);
  }
  const dentroPoligono = (p, pol) => { let d = false; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const [xi, yi] = pol[i], [xj, yj] = pol[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) d = !d; } return d; };
  const fraccionEn = (b, pol) => { let k = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) if (dentroPoligono([b.x + (i + 0.5) * b.w / 6, b.y + (j + 0.5) * b.h / 3], pol)) k++; return k / 18; };
  // Contraste WCAG. En un degradado se usa su color medio (los stops opacos promediados en luminancia).
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const colores = s => [...String(s).matchAll(/rgba?\(([^)]+)\)/g)].map(m => m[1].split(/[,\s/]+/).filter(Boolean).map(Number)).filter(c => c.length < 4 || c[3] > 0.5);
  function lumFondo(el) {
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const cs = getComputedStyle(a);
      const bi = /gradient/.test(cs.backgroundImage) ? colores(cs.backgroundImage) : [];
      if (bi.length) return bi.reduce((s, c) => s + lum(c), 0) / bi.length;
      const bc = colores(cs.backgroundColor);
      if (bc.length) return lum(bc[0]);
    }
    return 1;
  }
  const razon = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const COMPONENTE = '.opcion, .boton-ui, .pastilla, .tecla, .calendario, .msj.yo .burbuja, .grafica, .tabla';

  window.PZ.lams.forEach((lam, i) => {
    const n = window.PZ.pasos(lam), L = lam.getBoundingClientRect();
    const r = { i, tipo: lam.dataset.tipo, errores: [], avisos: [], palabras: 0, mano: 0, enfasis: 0, pendientes: [] };
    if (lam.dataset.tipo === 'camara') { out.push(r); return; }
    for (let p = 0; p < n; p++) {
      window.PZ.mostrar(lam, p, Infinity);
      const E = m => r.errores.push(`paso ${p + 1}: ${m}`), A = m => r.avisos.push(`paso ${p + 1}: ${m}`);
      const cajas = [...lam.querySelectorAll(CAJAS)].filter(e => visible(e) && !e.closest('.escena:not(.lamina)') && !e.closest('.cuadrantes'));
      for (const e of cajas) {
        const b = caja(e, lam);
        if (b.x < -2 || b.y < -2 || b.x + b.w > W + 2 || b.y + b.h > H + 2) E(`«${corto(e.innerText || e.className || e.tagName, 40)}» se sale del lienzo`);
      }
      const textos = [...lam.querySelectorAll(TEXTO)].filter(e => visible(e) && !e.closest('.escena:not(.lamina)') && !e.querySelector(TEXTO));
      for (let a = 0; a < textos.length; a++) for (let b = a + 1; b < textos.length; b++) {
        if (textos[a].contains(textos[b]) || textos[b].contains(textos[a])) continue;
        const A0 = caja(textos[a], lam), B0 = caja(textos[b], lam), c = cruza(A0, B0);
        if (c > 0.06 * Math.min(A0.w * A0.h, B0.w * B0.h)) E(`se enciman «${corto(textos[a].innerText, 24)}» y «${corto(textos[b].innerText, 24)}»`);
      }
      const lineas = renglones(lam, L);
      // Marcas sin convertir
      lineas.forEach(({ n: nodo }) => { if (reMarca.test(nodo.nodeValue)) E(`marca sin cerrar o partida a la vista: «${corto(nodo.nodeValue, 40)}»`); });
      // Letra efectiva (el encaje reduce con zoom y getComputedStyle no lo descuenta)
      for (const t of textos) {
        const ef = parseFloat(getComputedStyle(t).fontSize) * zoom(t);
        if (t.closest('.post, .calendario')) continue;
        if (ef < 27.5) E(`letra de ${Math.round(ef)}px reales en «${corto(t.innerText, 24)}» (mínimo 28)`);
        else if (t.matches(PRINCIPAL) && !t.closest('.tabla, .grafica') && ef < 40 * (W / 1920) - 0.5) A(`«${corto(t.innerText, 24)}» se ve a ${Math.round(ef)}px reales (ideal ≥ ${Math.round(40 * W / 1920)})`);
      }
      // Sello: polígono girado contra renglones y emojis; fuera del lienzo
      const sello = lam.querySelector(':scope > .sello');
      if (sello && visible(sello) && parseFloat(sello.style.opacity || 1) > 0.5) {
        const pol = poligonoSello(sello, L);
        if (pol.some(([x, y]) => x < -1 || y < -1 || x > W + 1 || y > H + 1)) E(`el sello «${corto(sello.textContent, 20)}» se sale del lienzo`);
        const tolerado = e => e.closest('.rejilla, .cuadrantes, .captura, .pruebas');
        const tapados = new Set();
        lineas.filter(q => !tolerado(q.el)).forEach(q => { if (fraccionEn(q.b, pol) > 0.12) tapados.add(corto(q.n.nodeValue, 24)); });
        tapados.forEach(t => E(`el sello tapa «${t}»: muévelo con sello_sobre o sello_pos`));
        [...lam.querySelectorAll('.emo')].filter(e => visible(e) && fueraClon(e) && !tolerado(e) && opac(e) > 0.5).forEach(e => {
          if (fraccionEn(caja(e, lam), pol) > 0.2) E('el sello tapa un emoji: muévelo con sello_sobre o sello_pos');
        });
        if ((+sello.dataset.k || 1) < 0.7) A(`el sello «${corto(sello.textContent, 20)}» se redujo al ${Math.round(+sello.dataset.k * 100)}% para caber: un sello lleva 1 o 2 palabras`);
      }
      // Cursor: la mano (sin el margen transparente del SVG) contra letras y emojis
      const cur = lam.querySelector(':scope > .cursor');
      if (cur && visible(cur)) {
        const C0 = caja(cur, lam), C = { x: C0.x + C0.w * 0.3, y: C0.y, w: C0.w * 0.62, h: C0.h * 0.95 };
        lineas.filter(q => !q.el.closest('.tecla') && cruza(C, q.b) > 0).forEach(q => {
          const txt = q.n.nodeValue; let tapadas = '';
          for (let k = 0; k < txt.length; k++) {
            if (!txt[k].trim()) continue;
            const rg = document.createRange(); rg.setStart(q.n, k); rg.setEnd(q.n, k + 1);
            const b = rel(rg.getBoundingClientRect(), L); if (!b.w) continue;
            if (cruza(C, b) / (b.w * b.h) > 0.3) tapadas += txt[k];
          }
          if (tapadas) E(`el cursor tapa «${tapadas}» de «${corto(txt, 24)}»: ajusta clic_pos`);
        });
        [...lam.querySelectorAll('.emo')].filter(e => visible(e) && fueraClon(e) && opac(e) > 0.5).forEach(e => {
          const b = caja(e, lam); if (cruza(C, b) / (b.w * b.h) > 0.2) E('el cursor tapa un emoji: ajusta clic_pos');
        });
      }
      // Flechas que cruzan un renglón (≥ 3 muestras dentro del renglón recortado 22% arriba y abajo)
      lam.querySelectorAll(':scope > .capa-mano path[data-clase="flecha"]').forEach(pth => {
        if (+pth.dataset.p > p) return;
        const tot = pth.getTotalLength(), golpes = new Map();
        for (let t = tot * 0.1; t <= tot * 0.9; t += 5) {
          const q = pth.getPointAtLength(t);
          lineas.forEach(({ n: nodo, b }) => { const m = b.h * 0.22; if (q.x > b.x && q.x < b.x + b.w && q.y > b.y + m && q.y < b.y + b.h - m) golpes.set(nodo, (golpes.get(nodo) || 0) + 1); });
        }
        golpes.forEach((g, nodo) => { if (g >= 3) E(`una flecha atraviesa «${corto(nodo.nodeValue, 24)}» y se lee como tachón`); });
      });
      // Firma: contra renglones (también en tablas) y contra celdas con texto
      const firma = lam.querySelector(':scope > .firma');
      if (firma) {
        const F = caja(firma, lam);
        const toca = lineas.find(q => cruza(F, q.b) > 4);
        if (toca) A(`«${corto(toca.n.nodeValue, 24)}» toca la firma`);
        else if (lam.dataset.tipo === 'tabla') {
          const celda = [...lam.querySelectorAll('.tabla td, .tabla th')].find(c => c.textContent.trim() && cruza(F, caja(c, lam)) > 0.15 * F.w * F.h);
          if (celda) A(`la firma cae dentro de la celda «${corto(celda.textContent, 24)}» de la tabla: usa "firma": false en esta lámina`);
        }
      }
      // Elementos vacíos
      [...lam.querySelectorAll('.burbuja, .tarjeta, .cuadro, .lista .item, .nodo .etiqueta, .opcion')]
        .filter(e => fueraClon(e) && visible(e) && !e.textContent.trim() && !e.querySelector('.emo, img'))
        .forEach(e => E(`hay un elemento vacío (${e.className.split(' ')[0]}): revisa sus datos en deck.json`));
      const lienzo = [...lam.querySelectorAll(':scope > .lienzo')].pop();
      if (lienzo && !['tabla', 'prueba', 'chat', 'calendario'].includes(lam.dataset.tipo)) {
        const txt = [...lienzo.querySelectorAll(TEXTO)].filter(visible).filter(e => !e.querySelector(TEXTO)).map(e => e.innerText).join(' ');
        r.palabras = Math.max(r.palabras, (txt.match(/[\p{L}\p{N}]+/gu) || []).length);
      }
    }
    // ---- estado final ----
    window.PZ.mostrar(lam, n - 1, Infinity);
    const EF = m => r.errores.push(`paso ${n}: ${m}`), AF = m => r.avisos.push(`paso ${n}: ${m}`);
    const enc = lam.dataset.encaje ? +lam.dataset.encaje : 1;
    if (enc < 0.7) EF(`el contenido se redujo al ${Math.round(enc * 100)}% para caber: parte la lámina o acorta el texto`);
    else if (enc <= 0.85) AF(`el contenido se redujo al ${Math.round(enc * 100)}% para caber; conviene partir la lámina o acortar el texto`);
    const lineas = renglones(lam, L);
    // Datos pendientes ([PRECIO], [WHATSAPP]…): solo MAYÚSCULAS; «[nombre]» es plantilla a propósito
    const vistos = new Set();
    lineas.forEach(({ n: nodo }) => (nodo.nodeValue.match(rePendiente) || []).forEach(t => vistos.add(t)));
    [...lam.querySelectorAll('svg text')].filter(t => fueraClon(t) && visible(t)).forEach(t => (t.textContent.match(rePendiente) || []).forEach(x => vistos.add(x)));
    r.pendientes = [...vistos];
    // Contraste: un hallazgo por lámina con los fragmentos afectados
    const bajos = { e: new Set(), a: new Set() }; let peor = 99;
    lineas.filter(q => !q.el.closest(COMPONENTE) || q.el.closest('.hueco')).forEach(q => {
      const col = colores(getComputedStyle(q.el).color)[0]; if (!col) return;
      const c = razon(lum(col), lumFondo(q.el)), t = corto(q.n.nodeValue, 24);
      // la burbuja azul «yo» es de la referencia (iMessage): ni el blanco llega a 3:1; ahí solo cuenta el error
      const deColor = (q.el.closest('[class*="tono-"], .hueco, .roja') || lam.classList.contains('oscura')) && !q.el.closest('.msj.yo');
      if (c < 2) { bajos.e.add(t); peor = Math.min(peor, c); } else if (c < 3 && deColor) { bajos.a.add(t); peor = Math.min(peor, c); }
    });
    if (bajos.e.size) EF(`casi no se lee (contraste ${peor.toFixed(1)}:1, mínimo 2): «${[...bajos.e].join('», «')}»`);
    else if (bajos.a.size) AF(`contraste bajo (${peor.toFixed(1)}:1, ideal ≥ 3) en «${[...bajos.a].join('», «')}»`);
    // 9:16: que el contenido ocupe el alto y respete la zona que tapa la interfaz de Reels
    if (vertical) {
      const lz = lam.querySelector(':scope > .lienzo'), h = lz && lz.firstElementChild;
      if (h && !h.classList.contains('cuadrantes')) {
        let y0 = 1e9, y1 = -1e9, zona = '';
        [h, ...h.querySelectorAll('*')].forEach(e => {
          if ((e.closest('svg') && e.tagName !== 'svg') || !visible(e)) return;
          const b = caja(e, lam); if (!b.w || !b.h) return;
          y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.h);
          if (!zona && e.childElementCount === 0 && (b.y + b.h > H - 320 || (b.y + b.h > H - 700 && b.x + b.w > W - 140))) zona = corto(e.textContent || e.className, 24);
        });
        const ocupa = (y1 - y0) / H;
        if (!['idea', 'cita', 'cifra', 'objeto', 'oscura', 'foco', 'camara'].includes(lam.dataset.tipo) && ocupa < 0.35) AF(`el contenido ocupa ${Math.round(ocupa * 100)}% del alto; en 9:16 conviene más grande (≥ 35%)`);
        if (zona) AF(`«${zona}» entra en la zona que tapan el caption y los botones de Reels (abajo 320 px, derecha 140 px)`);
      }
    }
    r.mano = lam.querySelectorAll('.capa-mano path, .nota, .tabla, .sello, .t-mano').length;
    r.enfasis = lam.querySelectorAll('[data-sub], mark').length;
    [...lam.querySelectorAll('img')].forEach(im => { if (!im.complete || !im.naturalWidth) r.errores.push(`imagen sin cargar: ${im.getAttribute('src')}`); });
    out.push(r);
  });
  return out;
}, [W, H, MARCA_LITERAL]);
await browser.close();

const errores = [], avis = [];
avisos.forEach(a => errores.push(a));
avisosBuild.forEach(a => errores.push('construcción: ' + a));
sugerencias.forEach(a => avis.push(a));
errPagina.forEach(a => errores.push('error de la página: ' + a));
const nombre = i => `lámina ${i + 1} (${deck.laminas[i].id || deck.laminas[i].tipo})`;
porLamina.forEach(r => {
  const n = nombre(r.i);
  const agrupar = lista => { const m = new Map(); lista.forEach(e => { const k = e.replace(/^paso \d+: /, ''); if (!m.has(k)) m.set(k, e.replace(/^paso (\d+): /, 'desde el paso $1: ')); }); return [...m.values()]; };
  agrupar(r.errores).forEach(e => errores.push(`${n}: ${e}`));
  agrupar(r.avisos).forEach(e => avis.push(`${n}: ${e}`));
  if (r.palabras > 35) errores.push(`${n}: ${r.palabras} palabras a la vista; el estilo pide una idea por lámina (≤ 22)`);
  else if (r.palabras > 22) avis.push(`${n}: ${r.palabras} palabras a la vista (ideal ≤ 22)`);
  if (r.enfasis > 2) avis.push(`${n}: ${r.enfasis} énfasis (subrayado/resaltador); uno por lámina, dos como máximo`);
});
// Datos pendientes: UN error por dato distinto, con las láminas donde aparece
const pendientes = {};
porLamina.forEach(r => r.pendientes.forEach(t => (pendientes[t] = pendientes[t] || []).push(r.i + 1)));
Object.entries(pendientes).forEach(([t, ls]) => errores.push(`dato pendiente ${t} en ${ls.length > 1 ? 'las láminas' : 'la lámina'} ${ls.join(', ')}: llénalo antes de entregar`));
// Voz y anclas contra los pasos (una frase por paso; si no cuadran, los cortes del montaje se desalinean)
deck.laminas.forEach((l, i) => {
  if (l.tipo === 'camara') return;
  for (const k of ['voz', 'anclas']) {
    if (!Array.isArray(l[k]) || l[k].length === pasos[i]) continue;
    const sobra = l[k].length > pasos[i] ? `; se perderían: «${l[k].slice(pasos[i]).join('», «').slice(0, 60)}»` : '';
    errores.push(`${nombre(i)}: «${k}» tiene ${l[k].length} textos y la lámina ${pasos[i]} pasos${sobra}`);
  }
  if (typeof l.voz === 'string' && pasos[i] > 1) avis.push(`${nombre(i)}: «voz» es un solo texto y la lámina tiene ${pasos[i]} pasos; los pasos 2 en adelante quedan sin voz ni ancla (usa una lista)`);
});
const marca = deck.marca && typeof deck.marca === 'object' ? deck.marca : null;
if (marca && /^tumarca$/i.test(String(marca.texto || '').trim())) avis.push('la firma es la de ejemplo («tumarca»): pon la tuya en "marca" o usa "marca": false');
// Reglas del deck completo
const tipos = deck.laminas.map(l => l.tipo).filter(t => t !== 'camara');
let racha = 1;
for (let i = 1; i < tipos.length; i++) { racha = tipos[i] === tipos[i - 1] ? racha + 1 : 1; if (racha === 4) avis.push(`«${tipos[i]}» se usa 4 veces seguidas (desde la lámina ${i - 2}): alterna diseños`); }
const conteo = tipos.reduce((m, t) => ((m[t] = (m[t] || 0) + 1), m), {});
Object.entries(conteo).forEach(([t, c]) => { if (tipos.length >= 8 && c / tipos.length > 0.45) avis.push(`«${t}» es el ${Math.round((c / tipos.length) * 100)}% del deck (máximo 45%)`); });
let sinMano = 0;
porLamina.forEach(r => { if (r.tipo === 'camara') return; sinMano = r.mano ? 0 : sinMano + 1; if (sinMano === 4) avis.push(`4 láminas seguidas sin capa a mano (hasta la ${r.i + 1}): suma una nota, un subrayado o una flecha`); });
const oscuras = deck.laminas.filter(l => l.tipo === 'oscura' || l.oscura).length;
if (tipos.length >= 8 && oscuras / tipos.length > 0.15) avis.push(`${oscuras} láminas oscuras: resérvalas para revelar el producto o la oferta (≤ 15%)`);

const nota = Math.max(0, 100 - 12 * errores.length - 3 * avis.length);
const informe = { nota, laminas: deck.laminas.length, pasos: pasos.reduce((a, b) => a + b, 0), errores, avisos: avis, pendientes, fecha: new Date().toISOString() };
fs.writeFileSync(path.join(dirSalida, 'qa.json'), JSON.stringify(informe, null, 2));
if (flag('--json')) console.log(JSON.stringify(informe, null, 2));
else {
  console.log(`QA ${nota}/100 · ${informe.laminas} láminas · ${informe.pasos} pasos`);
  errores.forEach(e => console.log('  ✗ ' + e));
  avis.forEach(e => console.log('  ⚠ ' + e));
  if (!errores.length && !avis.length) console.log('  ✓ sin hallazgos');
}
process.exit(errores.length ? 1 : 0);
