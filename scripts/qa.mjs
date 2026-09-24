#!/usr/bin/env node
// qa.mjs — revisa el deck renderizado con reglas que cuentan, no que opinan. Nota 0-100.
//
//   node scripts/qa.mjs <carpeta|deck.json> [--salida dir] [--json] [--estricto]
//
//   --estricto  sale con 3 si no hay errores pero el estado no es «listo» (bajo-90, falta-venta, borrador)
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
//   · un emoji tapa un renglón (la cifra de una barra, un título); una línea de gráfica atraviesa un texto;
//   · contenido recortado por su contenedor (overflow); texto suelto y negritas en un flex (se pierde el espacio);
//   · «Paso 2» o una etiqueta del mapa partida en dos renglones; ~~tachado~~ con el tachón negro del navegador;
//   · `voz` o `anclas` como lista con distinto largo que los pasos de la lámina;
//   · firma de relleno («tumarca.com», «@tuusuario»); deck de menos de la mitad de su duración (reglas-deck.mjs).
// Avisos (−3 c/u):
//   · más de 22 palabras en un paso, más de 2 énfasis, letra efectiva menor a 40 px (a 1920 de ancho);
//   · encaje de 85% o menos, sello reducido a menos de 70% (texto largo para un sello);
//   · texto que toca la firma, firma sobre una celda con texto de la tabla;
//   · contraste menor a 3:1 en texto de color (tonos, huecos, notas rojas) o sobre la lámina oscura;
//   · campo que ese diseño no usa (¿error de dedo?), emoji dudoso o aproximado en Fluent;
//   · `voz` de un solo texto en una lámina de varios pasos;
//   · 9:16: contenido en menos del 35% del alto, o dentro de la zona que tapa la interfaz de Reels;
//   · sello que tapa más del 25% de las celdas DESTACADAS de una rejilla; sello que tapa una flecha; flecha de anotación o de nota al margen de menos de 60 px (un garabato);
//   · emoji de bajo contraste para su set y su fondo (tabla revisada + medida de medir-emojis.mjs); con
//     emoji "auto", también el del OTRO set; emoji dentro de un texto SVG en fluent (sale con la fuente del sistema);
//   · etiqueta corta (≤ 3 palabras) partida, renglón huérfano («La / detecta»); ~~tachado~~ en el mismo paso que su texto;
//   · emoji de una gráfica pegado al borde de arriba; dato «propuesto» sin confirmar (qa.json → por_confirmar);
//   · lámina oscura en algo que no es una revelación (lista, cifra, tabla, tarjetas, stack, idea larga);
//   · objeción metida en el encabezado de una lista o en un botón (la receta es una `idea` propia);
//   · reglas del deck (reglas-deck.mjs): duración ±30% del objetivo, apertura con saludo, título o cámara,
//     fórmulas de IA y más de una antítesis, palabras vetadas de MI-MARCA, proyección sin condición,
//     post de maqueta con cifras, clase/webinar sin llamado final, oscuras en clase o reel;
//   · un mismo diseño 4 veces seguidas o en más del 45% del deck, 4 láminas seguidas sin capa a mano,
//     más de 15% de láminas oscuras;
//   · vsl/webinar sin prueba real, con la maqueta EJEMPLO como prueba o sin cifra de credibilidad; sin objeción
//     antes del llamado; descargo «de ejemplo» en pantalla; emojis parecidos o con rol contrario en el deck;
//     claves del deck que nadie lee (`_marca`, `_datos`); más de 40% a cámara; oferta tardía en un VSL corto.
// Nota: 100 − 12 × errores − 3 × avisos; con datos propuestos sin confirmar, BORRADOR y tope de 90.
// qa.json trae además `estado` (borrador · con errores · bajo-90 · falta-venta · listo), `falta_para_final` (lo que le
// falta a una pieza de venta), `ritmo` (mediana y p90 de los pasos), `por_confirmar` e `iconos` (emoji → láminas).
import fs from 'node:fs';
import path from 'node:path';
import { argumentos, prepararSalida, abrir } from './lib/pipeline.mjs';
import { MARCA_LITERAL, palabras } from './lib/markup.mjs';
import { BAJO_CONTRASTE, contrasteMedido, UMBRAL_CONTRASTE, VISTOS_OK, DIVERGE, SUGERIDO, TEXTO_IMPRESO } from './lib/emoji.mjs';
import { inyectable } from './lib/medidas-dom.mjs';
import { FORMATOS } from './lib/construir.mjs';
import { revisarDeck, notaQA, TOPE_BORRADOR } from './lib/reglas-deck.mjs';
import { mmss, minutosObjetivo, duracionPorTipo } from './lib/tiempos.mjs';
import { medirSobreColor, UMBRAL_COLOR } from './lib/contraste-color.mjs';

const NOTA_FINAL = 90;   // SKILL §6: 90 o más y cero errores

const { flag, pos, opt } = argumentos(process.argv);
let prep;
try { prep = prepararSalida(pos[0], opt('--salida')); } catch (e) { console.error('✗ ' + e.message); process.exit(2); }
const { deck, crudo, dirSalida, dirDeck, htmlPath, W, H, pasos, avisos: avisosBuild, sugerencias = [], propuestos = {}, declarados = {}, formato } = prep;
const { browser, page, avisos, errores: errPagina } = await abrir(htmlPath, W, H);
await page.addScriptTag({ content: inyectable() });
const CONTRASTE = { BAJO: BAJO_CONTRASTE, MEDIDO: contrasteMedido(), U: UMBRAL_CONTRASTE, OK: VISTOS_OK, DIVERGE, SUG: SUGERIDO, IMPRESO: TEXTO_IMPRESO, pedido: crudo.emoji || 'auto', mv: (FORMATOS[formato] || FORMATOS['16:9']).mv };

const porLamina = await page.evaluate(([W, H, MARCA, CT]) => {
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
  // Texto secundario que se tiene que LEER (≥ 48 px a 1920, ≈ 9 px en un celular de 360). Los rótulos decorativos
  // del calendario («DÍA»), la fuente y la firma quedan fuera: en el original también van a ~28-30 px [ref_1760].
  const SECUNDARIO = '.sub-etiqueta, .pastilla .dato span, .pct, .post, .etiqueta-chica, .chat-hora';
  const MINIMO = '.calendario .dia span, .calendario .dia b, .calendario .barra b, .calendario .barra span, .bento-lleno span';
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
    const r = { i, tipo: lam.dataset.tipo, errores: [], avisos: [], palabras: 0, mano: 0, enfasis: 0, pendientes: [], medir: [] };
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
      // Renglones que se salen del lienzo: la caja de .t se queda adentro (max-width) aunque una palabra larga (un link)
      // se desborde; se miden los rects reales de cada renglón
      const cortados = new Set();
      lineas.forEach(q => { if (q.b.x < -2 || q.b.y < -2 || q.b.x + q.b.w > W + 2 || q.b.y + q.b.h > H + 2) cortados.add(corto(q.n.nodeValue, 30)); });
      cortados.forEach(t => E(`«${t}» se corta en el borde del lienzo: acorta el link o la palabra (sin https://, www ni utm)`));
      // …o se sale de su propia caja (tarjeta, pastilla, burbuja, pieza del stack): aviso
      const desbordan = new Set();
      lineas.forEach(q => {
        const c = q.el.closest('.tarjeta, .opcion, .burbuja, .bento-lleno, .cuadro, .boton-ui, .pastilla');
        if (!c) return;
        const B = caja(c, lam);
        if (q.b.x < B.x - 2 || q.b.x + q.b.w > B.x + B.w + 2) desbordan.add(corto(q.n.nodeValue, 30));
      });
      desbordan.forEach(t => A(`«${t}» se sale de su caja: acorta la palabra`));
      // Textos SVG (marcas y tramos de la línea de tiempo, ejes, series): encimados entre sí o fuera del lienzo
      const tSvg = [...lam.querySelectorAll('svg text')].filter(t => fueraClon(t) && visible(t) && opac(t) >= 0.5 && t.textContent.trim() && !t.closest('.escena:not(.lamina)'));
      tSvg.forEach(t => { const b = caja(t, lam); if (b.x < -2 || b.y < -2 || b.x + b.w > W + 2 || b.y + b.h > H + 2) E(`«${corto(t.textContent, 30)}» se sale del lienzo`); });
      for (let a = 0; a < tSvg.length; a++) for (let b = a + 1; b < tSvg.length; b++) {
        const A0 = caja(tSvg[a], lam), B0 = caja(tSvg[b], lam), c = cruza(A0, B0);
        if (c > 0.06 * Math.min(A0.w * A0.h, B0.w * B0.h)) E(`se enciman «${corto(tSvg[a].textContent, 24)}» y «${corto(tSvg[b].textContent, 24)}»`);
      }
      // Marcas sin convertir
      lineas.forEach(({ n: nodo }) => { if (reMarca.test(nodo.nodeValue)) E(`marca sin cerrar o partida a la vista: «${corto(nodo.nodeValue, 40)}»`); });
      // Letra efectiva (el encaje reduce con zoom y getComputedStyle no lo descuenta)
      const extra = [...lam.querySelectorAll(SECUNDARIO + ', ' + MINIMO)].filter(e => visible(e) && !e.closest('.escena:not(.lamina)') && e.textContent.trim());
      for (const t of [...textos, ...extra]) {
        const ef = parseFloat(getComputedStyle(t).fontSize) * zoom(t);
        if (ef < 27.5) E(`letra de ${Math.round(ef)}px reales en «${corto(t.innerText, 24)}» (mínimo 28)`);
        else if (t.matches(SECUNDARIO) && ef < 48 * (W / 1920) - 0.5) A(`«${corto(t.innerText, 24)}» (texto secundario) se ve a ${Math.round(ef)}px reales: en un celular no se lee (ideal ≥ ${Math.round(48 * W / 1920)})`);
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
        // Rejilla con destacadas: esas celdas son el dato que se cuenta (la rejilla homogénea sí se tapa [6:45])
        lam.querySelectorAll('.rejilla').forEach(rj => {
          const dest = [...rj.querySelectorAll('[data-a^="d"]')];
          if (!dest.length) return;
          const n = dest.filter(d => { const b = caja(d, lam); return dentroPoligono([b.x + b.w / 2, b.y + b.h / 2], pol); }).length;
          if (n > 2 && n > 0.25 * dest.length) A(`el sello tapa ${n} de las ${dest.length} celdas destacadas de la rejilla: asegúrate de que la cifra ya se dijo o está en una nota; o quita sello_sobre para que se acomode solo`);
        });
        // los avatares del chat (.yo-av/.otro-av, silueta o emoji) cuentan como emoji: el gancho se lee por quién habla
        const iconos = [...lam.querySelectorAll('.emo, .yo-av, .otro-av')].filter(e => e.matches('.yo-av, .otro-av') || !e.closest('.yo-av, .otro-av'));
        const tapaIcono = iconos.filter(e => visible(e) && fueraClon(e) && !tolerado(e) && opac(e) > 0.5).some(e => fraccionEn(caja(e, lam), pol) > 0.2);
        if (tapaIcono) E('el sello tapa un emoji o un avatar: muévelo con sello_sobre o sello_pos');
        const tapaFlecha = [...lam.querySelectorAll(':scope > .capa-mano path[data-clase="flecha"]')].some(pth => {
          if (+pth.dataset.p > p) return false;
          const tot = pth.getTotalLength(); let k = 0;
          for (let t = 0; t <= tot; t += 6) { const q = pth.getPointAtLength(t); if (dentroPoligono([q.x, q.y], pol)) k++; }
          return k >= 3;
        });
        if (tapaFlecha) A(`el sello «${corto(sello.textContent, 20)}» tapa una flecha: muévelo con sello_sobre o sello_pos`);
        if ((+sello.dataset.k || 1) < 0.7) A(`el sello «${corto(sello.textContent, 20)}» se redujo al ${Math.round(+sello.dataset.k * 100)}% para caber: un sello lleva 1 o 2 palabras`);
      }
      // Cursor: la mano (sin el margen transparente del SVG) contra letras y emojis
      const cur = lam.querySelector(':scope > .cursor');
      if (cur && visible(cur)) {
        const C0 = caja(cur, lam), C = { x: C0.x + C0.w * 0.3, y: C0.y, w: C0.w * 0.62, h: C0.h * 0.95 };
        // Tapado de cada letra (fracción de su caja bajo la mano)
        const porLetra = q => [...q.n.nodeValue].map((ch, k) => {
          if (!ch.trim()) return null;
          const rg = document.createRange(); rg.setStart(q.n, k); rg.setEnd(q.n, k + 1);
          const b = rel(rg.getBoundingClientRect(), L); return b.w ? { ch, f: cruza(C, b) / (b.w * b.h), a: b.w * b.h } : null;
        }).filter(Boolean);
        lineas.filter(q => cruza(C, q.b) > 0).forEach(q => {
          const letras = porLetra(q), txt = q.n.nodeValue;
          if (q.el.closest('.tecla')) {
            // El número de la tecla: en ref_115 la punta del dedo toca el PIE del «1» y el número se lee entero. Se suma
            // el área tapada del glifo: error si la mano cubre más del 40% (se ve menos del 60%)
            const A = letras.reduce((t, x) => t + x.a, 0), T = letras.reduce((t, x) => t + x.f * x.a, 0);
            if (A && T / A > 0.4) E(`el cursor tapa el número de la tecla «${corto(txt, 4)}» (${Math.round((T / A) * 100)}%): ajusta clic_pos`);
            return;
          }
          const tapadas = letras.filter(x => x.f > 0.3).map(x => x.ch).join('');
          if (tapadas) E(`el cursor tapa «${tapadas}» de «${corto(txt, 24)}»: ajusta clic_pos`);
        });
        // El emoji del ancla del clic se toca (la punta del dedo va sobre él): ahí se tolera hasta la mitad
        let anclaClic = null;
        try { const sp = JSON.parse(lam.dataset.clic || 'null'); anclaClic = sp && [...lam.querySelectorAll(`[data-a="${CSS.escape(sp.a)}"]`)].find(fueraClon); } catch (e) { anclaClic = null; }
        [...lam.querySelectorAll('.emo')].filter(e => visible(e) && fueraClon(e) && opac(e) > 0.5).forEach(e => {
          const b = caja(e, lam), tope = anclaClic && anclaClic.contains(e) ? 0.5 : 0.2;
          if (cruza(C, b) / (b.w * b.h) > tope) E('el cursor tapa un emoji: ajusta clic_pos');
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
      // Flecha de anotación o de nota al margen reducida a un garabato
      lam.querySelectorAll(':scope > .capa-mano path[data-estilo="fina"], :scope > .capa-mano path[data-estilo="curva-roja"]').forEach(pth => {
        if (+pth.dataset.p > p) return;
        const largo = pth.getTotalLength();
        if (largo < 60) A(`una flecha de anotación mide ${Math.round(largo)} px: se ve como un garabato; separa la nota (≥ 60)`);
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
    const salida = lam.dataset.tipo === 'pasos' ? 'acorta las etiquetas, baja separacion o quita el prefijo (prefijo: false); un mapa no se parte' : 'parte la lámina o acorta el texto';
    if (enc < 0.7) EF(`el contenido se redujo al ${Math.round(enc * 100)}% para caber: ${salida}`);
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
    // Pastilla del rango del calendario: translúcida sobre la barra de color; se compone contra el color medio de la barra
    lam.querySelectorAll('.calendario .barra span').forEach(sp => {
      if (!visible(sp)) return;
      const cs = getComputedStyle(sp), fondoB = colores(getComputedStyle(sp.parentElement).backgroundImage), tx = colores(cs.color)[0];
      if (!fondoB.length || !tx) return;
      const bg = (cs.backgroundColor.match(/[\d.]+/g) || []).map(Number), al = bg.length === 4 ? bg[3] : bg.length === 3 ? 1 : 0;
      const media = [0, 1, 2].map(j => fondoB.reduce((s, c) => s + c[j], 0) / fondoB.length);
      const c = razon(lum(tx), lum(media.map((m, j) => al * (bg[j] || 0) + (1 - al) * m)));
      if (c < 3) AF(`la pastilla «${corto(sp.textContent, 20)}» del calendario tiene contraste ${c.toFixed(1)}:1 contra su barra (ideal ≥ 3)`);
    });
    // 9:16: que el contenido ocupe el alto y respete la zona que tapa la interfaz de Reels
    if (vertical) {
      const lz = lam.querySelector(':scope > .lienzo'), h = lz && lz.firstElementChild;
      if (h && !h.classList.contains('cuadrantes')) {
        let y0 = 1e9, y1 = -1e9, zona = '';
        [h, ...h.querySelectorAll('*')].forEach(e => {
          if ((e.closest('svg') && e.tagName !== 'svg') || !visible(e)) return;
          const b = caja(e, lam); if (!b.w || !b.h) return;
          y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.h);
          if (zona || e.childElementCount !== 0) return;
          // Con texto se mide la tinta (renglones reales), no la caja: un bloque centrado de ancho
          // completo llega al borde derecho aunque sus letras queden lejos de los botones de Reels
          const rg = document.createRange(); rg.selectNodeContents(e);
          const rs = /\S/.test(e.textContent || '') ? [...rg.getClientRects()].filter(q => q.width > 3 && q.height > 3).map(q => rel(q, L)) : [];
          const t = rs.length ? rs : [b];
          if (t.some(q => q.y + q.h > H - 320 || (q.y + q.h > H - 700 && q.x + q.w > W - 140))) zona = corto(e.textContent || e.className, 24);
        });
        const ocupa = (y1 - y0) / H;
        if (!['idea', 'cita', 'cifra', 'objeto', 'oscura', 'foco', 'camara'].includes(lam.dataset.tipo) && ocupa < 0.35) AF(`el contenido ocupa ${Math.round(ocupa * 100)}% del alto; en 9:16 conviene más grande (≥ 35%)`);
        if (zona) AF(`«${zona}» entra en la zona que tapan el caption y los botones de Reels (abajo 320 px, derecha 140 px)`);
      }
    }
    // Emojis que casi desaparecen en ese set y sobre ese fondo: la tabla revisada (con sustituto) y la medida de
    // scripts/medir-emojis.mjs (contraste-emojis.json). Base e insignias. Con emoji "auto" se revisan LOS DOS
    // sets: el deck se ve en apple en una Mac y en fluent en Linux.
    const modoEmoji = document.body.dataset.emoji || 'apple';
    const oscura = lam.classList.contains('oscura');
    const bajo = (ch, set, fondo) => {
      const t = (CT.BAJO[set] || {})[fondo === 'oscura' ? 'oscura' : 'claro'] || {};
      if (t[ch]) return t[ch];
      const m = (((CT.MEDIDO[set] || {})[fondo]) || {})[ch];
      if (m != null && m < CT.U && !(CT.OK[set] || []).includes(ch)) return CT.SUG[ch] || 'otro emoji';
      return '';
    };
    const sets = CT.pedido === 'auto' ? [modoEmoji, modoEmoji === 'apple' ? 'fluent' : 'apple'] : [modoEmoji];
    const flojos = Object.fromEntries(sets.map(x => [x, new Set()])), cambia = new Set(), impresos = new Set();
    [...lam.querySelectorAll('.emo')].filter(e => visible(e) && fueraClon(e)).forEach(e => {
      // emoji que imprime texto (🏪 «24», 🪪 «Jo Appleseed»): a tamaño de ícono se lee
      const base = e.querySelector(':scope > .emo-txt, :scope > img');
      if (base && caja(e, lam).w >= 80 * (W / 1920)) {
        const ch = String(base.tagName === 'IMG' ? base.getAttribute('alt') : base.textContent).replace(/\uFE0F/g, '');
        const t = (CT.IMPRESO[modoEmoji] || {})[ch];
        if (t) impresos.add(`${ch} dice ${t[0]}; usa ${t[1]}`);
      }
      const fondo = oscura ? 'oscura' : e.closest('.tarjeta, .cuadro, .bento-lleno, .calendario') ? 'tarjeta' : 'claro';
      e.querySelectorAll(':scope > .emo-txt, :scope > img, :scope > .insignia > img, :scope > .insignia > .emo-txt').forEach(g => {
        const ch = String(g.tagName === 'IMG' ? g.getAttribute('alt') : g.textContent).replace(/\uFE0F/g, '');
        sets.forEach(x => { const s2 = bajo(ch, x, fondo); if (s2) flojos[x].add(`${ch} → ${s2}`); const d = (CT.DIVERGE[x] || {})[ch]; if (d) cambia.add(`${ch} en ${x} → ${d}`); });
      });
    });
    // Fondo REAL de cada emoji (el primer ancestro con color o degradado): sobre las piezas de color del stack, los
    // cuadros o el botón, la tabla de 3 fondos neutros no sirve. Esos se rasterizan aparte (fuera de esta página) y se
    // mide qué % del glifo se distingue de ESE fondo.
    const neutro = c => [[255, 255, 255], [243, 243, 243], [11, 11, 14]].some(n => n.every((v, j) => Math.abs(v - c[j]) <= 8));
    const fondoReal = el => {
      for (let a = el.parentElement; a && a.nodeType === 1; a = a.parentElement) {
        const cs = getComputedStyle(a);
        const bi = /gradient/.test(cs.backgroundImage) ? colores(cs.backgroundImage).map(c => c.slice(0, 3)) : [];
        if (bi.length) return bi;
        const bc = colores(cs.backgroundColor);
        if (bc.length) return [bc[0].slice(0, 3)];
        if (a === lam) break;
      }
      return [oscura ? [11, 11, 14] : [255, 255, 255]];
    };
    [...lam.querySelectorAll('.emo')].filter(e => visible(e) && fueraClon(e) && opac(e) > 0.5 && !e.closest('.en-texto, .en-linea')).forEach(e => {
      const fondos = fondoReal(e);
      if (fondos.every(neutro)) return;
      const g = e.querySelector(':scope > .emo-txt, :scope > img, :scope > svg');
      if (!g) return;
      const tipo = g.tagName === 'IMG' ? 'img' : g.tagName.toLowerCase() === 'svg' ? 'svg' : 'txt';
      const ch = tipo === 'img' ? g.getAttribute('alt') : tipo === 'txt' ? g.textContent : '';
      r.medir.push({ tipo, ch: String(ch || '').replace(/\uFE0F/g, ''), src: tipo === 'img' ? g.getAttribute('src') : '', svg: tipo === 'svg' ? g.outerHTML : '', fondos });
    });
    const fondoTxt = oscura ? 'fondo oscuro' : 'fondo claro';
    if (flojos[modoEmoji].size) AF(`emoji de bajo contraste en ${modoEmoji} sobre ${fondoTxt}; cámbialo: ${[...flojos[modoEmoji]].join(', ')}`);
    sets.slice(1).forEach(x => { if (flojos[x].size) AF(`deck en emoji "auto": en ${x} (${x === 'fluent' ? 'Linux, VPS, la nube' : 'una Mac'}) se pierde ${[...flojos[x]].join(', ')}; fija "emoji": "apple" o "fluent" (EMOJIS.md, «Qué set usar»)`); });
    if (impresos.size) AF(`emoji con texto impreso en ${modoEmoji}: ${[...impresos].join(' · ')} (EMOJIS.md, «Emojis con texto impreso»)`);
    if (cambia.size) AF(`emoji que cambia de sentido según el set: ${[...cambia].join(', ')} (EMOJIS.md)`);
    // ---- reglas de maquetación (estado final) ----
    const visibles = sel => [...lam.querySelectorAll(sel)].filter(e => visible(e) && fueraClon(e) && !e.closest('.escena:not(.lamina)'));
    // Contenido recortado por su contenedor (overflow hidden): el calendario que se comía la última fila
    window.recortes(lam, CAJAS + ', .calendario .dia').forEach(q => EF(`«${q.que}» recortado ${q.px} px por .${q.por}: el contenido no cabe en su caja`));
    // Texto suelto y negritas como hijos de un flex/grid: se pierde el espacio antes de la negrita
    window.flexMezclado(lam).forEach(t => EF(`«${t}»: el texto y su negrita quedaron como columnas de un flex (se pierde el espacio): envuélvelo en un solo <span>`));
    // «Paso 2» o la etiqueta del mapa partidos en dos renglones
    visibles('.rotulo-paso').forEach(e => {
      const ls = window.lineasPalabras(e);
      if (ls.length > 1 && ls.some(l => l.length === 1)) EF(`«${ls.map(l => l.join(' ')).join(' / ')}» se parte en dos renglones: acorta la etiqueta (≤ 10 letras con 5 pasos), o ajusta tam_etiqueta o separacion`);
    });
    // Mapa de pasos: una etiqueta más ancha que su columna se encima con la de al lado
    visibles('.fila-pasos').forEach(f => {
      const colW = parseFloat(getComputedStyle(f).gridTemplateColumns) || 0, z = zoom(f);
      if (!colW) return;
      f.querySelectorAll('.rotulo-paso').forEach(e => {
        const w = e.getBoundingClientRect().width / z;
        if (w > colW + 8) EF(`la etiqueta «${corto(e.innerText, 20)}» mide ${Math.round(w)} px y su columna ${Math.round(colW)}: se encima con la de al lado; acórtala, baja tam_etiqueta o sube separacion`);
      });
    });
    // Etiquetas cortas partidas y renglones huérfanos
    const cortas = new Set(), huerfanos = new Set();
    visibles('.nodo .etiqueta, .calendario .dia span, .sub-etiqueta').forEach(e => {
      const ls = window.lineasPalabras(e), pal = ls.flat();
      if (pal.length && pal.length <= 3 && ls.length > 1) cortas.add(ls.map(l => l.join(' ')).join(' / '));
    });
    visibles(TEXTO).filter(e => !e.querySelector(TEXTO) && !e.closest('.post, .calendario, .tabla')).forEach(e => {
      const ls = window.lineasPalabras(e);
      if (ls.length < 2 || (ls.flat().length <= 3 && e.matches('.etiqueta'))) return;
      const h = ls.find(l => l.join('').replace(/[^\p{L}\p{N}]/gu, '').length <= 2);
      if (h) huerfanos.add(`${h.join(' ')}» en «${corto(e.innerText, 28)}`);
    });
    // Rótulo de tarjeta o de pieza del stack: dos renglones como máximo y con aire abajo (≥ 24 px del borde)
    visibles('.tarjeta .rotulo, .bento-lleno .b-texto').forEach(e => {
      const ls = window.lineasPalabras(e), caj = e.closest('.tarjeta, .bento-lleno');
      if (ls.length > 2) AF(`«${corto(e.innerText, 28)}» ocupa ${ls.length} renglones en su tarjeta: acórtalo a 2 (es un rótulo, no una frase)`);
      const rg = document.createRange(); rg.selectNodeContents(e);
      const rs = [...rg.getClientRects()].filter(q => q.width > 3 && q.height > 3);
      if (!rs.length || !caj) return;
      const aire = (caj.getBoundingClientRect().bottom - Math.max(...rs.map(q => q.bottom))) / zoom(caj);
      if (aire < 24) AF(`«${corto(e.innerText, 28)}» queda a ${Math.round(aire)} px del borde de abajo de su tarjeta (ideal ≥ 24)`);
    });
    if (cortas.size) AF(`etiqueta corta partida en dos renglones: «${[...cortas].join('», «')}»; acórtala o dale más espacio (separacion)`);
    if (huerfanos.size) AF(`renglón huérfano «${[...huerfanos].join('», «')}»: reparte la frase o acórtala`);
    // ~~tachado~~: solo el trazo rojo; y que el texto se alcance a leer antes de tacharlo
    lam.querySelectorAll('[data-tachar]').forEach(e => {
      if (/line-through/.test(getComputedStyle(e).textDecorationLine)) EF(`«${corto(e.textContent, 24)}» sale con el tachón negro del navegador además del rojo`);
      if (e.matches('s.tachon') && e.dataset.tacharP == null && fueraClon(e)) AF(`«${corto(e.textContent, 24)}» sale ya tachado en el paso en que aparece: usa "tachar_paso": 1 para que se lea antes del tachón [4:05]`);
    });
    // Emoji que tapa un renglón (la cifra de una barra, el título) y, en una gráfica, pegado al borde de arriba
    const lineasF = renglones(lam, L);
    const emos = [...lam.querySelectorAll('.emo')].filter(e => visible(e) && fueraClon(e) && opac(e) > 0.5 && !e.matches('.en-linea, .en-texto') && !e.closest('.en-linea, .en-texto, .escena:not(.lamina)'));
    const tapadosE = new Set();
    emos.forEach(e => {
      const b0 = caja(e, lam), g = { x: b0.x + b0.w * 0.08, y: b0.y + b0.h * 0.08, w: b0.w * 0.84, h: b0.h * 0.84 };
      lineasF.forEach(q => { const A = q.b.w * q.b.h; if (A && !e.contains(q.el) && !q.el.contains(e) && cruza(g, q.b) / A > 0.15) tapadosE.add(corto(q.n.nodeValue, 24)); });
      if (e.closest('.grafica') && b0.y < CT.mv * 0.99) AF(`un emoji de la gráfica queda a ${Math.round(b0.y)} px del borde de arriba (margen ${CT.mv})`);
    });
    tapadosE.forEach(t => EF(`un emoji tapa «${t}»: sepáralo del texto`));
    // Foco: la frase contra los renglones de TEXTO del fondo atenuado (renglones() excluye el clon a propósito; aquí se
    // miden sin filtro de opacidad). Sobre íconos atenuados sí puede ir [15:20]; sobre texto no.
    const clon = lam.querySelector(':scope > .escena.clon');
    if (clon) {
      const frase = lineasF.filter(q => q.el.closest('.lienzo.foco-frase'));
      const tw = document.createTreeWalker(clon, NodeFilter.SHOW_TEXT);
      const pisados = new Map();
      for (let nd; (nd = tw.nextNode());) {
        const el = nd.parentElement;
        if (!el || !/\S/.test(nd.nodeValue) || el.closest('script, style, .emo') || !visible(el)) continue;
        const rg = document.createRange(); rg.selectNodeContents(nd);
        [...rg.getClientRects()].map(q => rel(q, L)).filter(b => b.h >= 60 * (W / 1920) && b.w > 3).forEach(b => {
          const cub = Math.max(0, ...frase.filter(f => f.b.x < b.x + b.w && f.b.x + f.b.w > b.x)
            .map(f => Math.max(0, Math.min(b.y + b.h, f.b.y + f.b.h) - Math.max(b.y, f.b.y)) / b.h));
          const k = corto(nd.nodeValue, 24), o = opac(el);
          if (cub > 0.3 && !(pisados.get(k) && pisados.get(k).cub >= cub)) pisados.set(k, { cub, o });
        });
      }
      pisados.forEach(({ cub, o }, t) => {
        if (cub > 0.6 && o > 0.12) EF(`la frase del foco se escribe sobre «${t}» del fondo (se lee texto sobre texto): acorta la frase, usa "anclar" o baja "opacidad"`);
        else AF(`la frase del foco pisa «${t}» del fondo: acórtala o usa "anclar"`);
      });
    }
    // Emoji sobre emoji (dos personas encimadas en un anillo): cajas recortadas al 84%, sin compuestos ni insignias
    // (una caja dentro de la otra) y sin las celdas de la rejilla, que se miden aparte
    const recorte = e => { const b0 = caja(e, lam); return { x: b0.x + b0.w * 0.08, y: b0.y + b0.h * 0.08, w: b0.w * 0.84, h: b0.h * 0.84 }; };
    const sueltos = emos.filter(e => !e.closest('.rejilla'));
    let encimados = 0;
    for (let a = 0; a < sueltos.length; a++) for (let b = a + 1; b < sueltos.length; b++) {
      if (sueltos[a].contains(sueltos[b]) || sueltos[b].contains(sueltos[a])) continue;
      const A0 = recorte(sueltos[a]), B0 = recorte(sueltos[b]);
      if (cruza(A0, B0) > 0.15 * Math.min(A0.w * A0.h, B0.w * B0.h)) encimados++;
    }
    if (encimados) EF(`${encimados === 1 ? 'dos emojis se enciman' : `${encimados} pares de emojis se enciman`}: sepáralos (en círculos, sube «radio» o baja «personas»)`);
    // Flecha que atraviesa un emoji que no es su origen ni su destino: se lee, pero ensucia (aviso)
    lam.querySelectorAll(':scope > .capa-mano path[data-clase="flecha"]').forEach(pth => {
      if (!visible(pth) || opac(pth) < 0.5) return;
      const extremos = [pth.dataset.de, pth.dataset.a].filter(Boolean).map(id => [...lam.querySelectorAll(`[data-a="${CSS.escape(id)}"]`)].find(fueraClon)).filter(Boolean);
      const libres = [...emos, ...[...lam.querySelectorAll('img')].filter(e => visible(e) && fueraClon(e) && !e.closest('.emo'))]
        .filter(e => !extremos.some(x => x.contains(e) || e.contains(x)));
      const tot = pth.getTotalLength(), golpes = new Map();
      for (let t = tot * 0.1; t <= tot * 0.9; t += 5) {
        const q = pth.getPointAtLength(t);
        libres.forEach(e => { const b = caja(e, lam), mx = b.w * 0.15, my = b.h * 0.15; if (q.x > b.x + mx && q.x < b.x + b.w - mx && q.y > b.y + my && q.y < b.y + b.h - my) golpes.set(e, (golpes.get(e) || 0) + 1); });
      }
      if ([...golpes.values()].some(g => g >= 3)) AF('una flecha atraviesa un emoji que no es su origen ni su destino: mueve la flecha o el emoji (en una rejilla, destaca una celda de la primera fila)');
    });
    // Línea o punta de una serie que atraviesa un texto (su etiqueta, el eje, otra serie)
    lam.querySelectorAll('.grafica svg').forEach(sv => {
      const vb = sv.viewBox && sv.viewBox.baseVal, R = sv.getBoundingClientRect();
      if (!vb || !vb.width) return;
      const sx = R.width / vb.width, sy = R.height / vb.height;
      const cerca = lineasF.filter(q => sv.closest('.grafica').contains(q.el));
      sv.querySelectorAll('path[data-trazo], path[data-punta]').forEach(pth => {
        if (!visible(pth) || opac(pth) < 0.5) return;
        const tot = pth.getTotalLength(), golpes = new Map();
        for (let t = 0; t <= tot; t += 5) {
          const q0 = pth.getPointAtLength(t), x = R.left - L.left + q0.x * sx, y = R.top - L.top + q0.y * sy;
          cerca.forEach(({ n: nodo, b }) => { const m = b.h * 0.22; if (x > b.x && x < b.x + b.w && y > b.y + m && y < b.y + b.h - m) golpes.set(nodo, (golpes.get(nodo) || 0) + 1); });
        }
        golpes.forEach((g, nodo) => { if (g >= 3) EF(`una línea de la gráfica atraviesa «${corto(nodo.nodeValue, 24)}»`); });
      });
    });
    // Emoji dentro de un texto SVG en fluent: sale con la fuente del sistema, no con la imagen 3D
    if (document.body.dataset.emoji === 'fluent') {
      const seg = new Intl.Segmenter('es', { granularity: 'grapheme' }), re = /^\p{RGI_Emoji}$/v;
      const esE = g => re.test(g) || ([...g].length === 1 && /\p{Extended_Pictographic}/u.test(g) && !/[©®™‼⁉〰〽♀♂⚕#*0-9\u2194-\u21AA\u2934\u2935\u2B05-\u2B07▪▫▶◀◻◼◽◾]/u.test(g) && re.test(g + '\uFE0F'));
      const en = new Set();
      lam.querySelectorAll('svg text').forEach(t => { if (!fueraClon(t) || !visible(t)) return; for (const { segment } of seg.segment(t.textContent)) if (esE(segment)) en.add(segment); });
      if (en.size) AF(`emoji dentro de un texto de gráfica, línea de tiempo o flecha (${[...en].join(' ')}): sale con la fuente del sistema, no en Fluent; ponlo en el campo emoji, en la nota o en el nodo`);
    }
    r.mano = lam.querySelectorAll('.capa-mano path, .nota, .tabla, .sello, .t-mano').length;
    r.enfasis = lam.querySelectorAll('[data-sub], mark').length;
    [...lam.querySelectorAll('img')].forEach(im => { if (!im.complete || !im.naturalWidth) r.errores.push(`imagen sin cargar: ${im.getAttribute('src')}`); });
    out.push(r);
  });
  return out;
}, [W, H, MARCA_LITERAL, CONTRASTE]);
// Emojis sobre un fondo de color: se rasterizan en una página aparte (data URL: sin el bloqueo de file://)
const contrasteColor = await medirSobreColor(browser, porLamina, dirSalida);
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
  const flojos = contrasteColor.filter(m => m.i === r.i && m.pct != null && m.pct < (m.pastel ? CONTRASTE.U : UMBRAL_COLOR));
  if (flojos.length) avis.push(`${n}: emoji que casi no se ve sobre su fondo de color: ${flojos.map(m => `${m.ch || 'ícono'} (${m.pct}% del glifo se distingue)${CONTRASTE.SUG[m.ch] ? ` → ${CONTRASTE.SUG[m.ch]}` : ''}`).join(', ')}; cambia el color de la pieza («color») o el emoji`);
});
// Datos pendientes: UN error por dato distinto, con las láminas donde aparece. Un hueco DECLARADO a propósito
// ({ "pendiente": true, "motivo" }) no es un olvido: va como aviso y deja el deck en BORRADOR.
const pendientes = {};
porLamina.forEach(r => r.pendientes.forEach(t => (pendientes[t] = pendientes[t] || []).push(r.i + 1)));
const porConfirmar = {};
const enLaminas = ls => `${ls.length > 1 ? 'las láminas' : 'la lámina'} ${ls.join(', ')}`;
Object.entries(pendientes).forEach(([t, ls]) => {
  const k = t.replace(/^\[|\]$/g, '');
  if (Object.hasOwn(declarados, k)) {
    porConfirmar[k] = { valor: '', laminas: ls, motivo: declarados[k].motivo, pendiente: true };
    avis.push(`dato pendiente a propósito ${t} (${declarados[k].motivo}) en ${enLaminas(ls)}: el deck es borrador hasta llenarlo`);
  } else errores.push(`dato pendiente ${t} en ${enLaminas(ls)}: llénalo en "datos" (${k}) y escribe {{${k}}} en el texto; si se deja a propósito, decláralo: { "pendiente": true, "motivo": "…" }`);
});
// Datos PROPUESTOS ({ "valor", "propuesto": true }): se pintan, pero el deck no es final hasta confirmarlos
Object.entries(propuestos).forEach(([k, ls]) => {
  const v = crudo.datos && crudo.datos[k] && typeof crudo.datos[k] === 'object' ? crudo.datos[k].valor : '';
  porConfirmar[k] = { valor: v, laminas: ls };
  avis.push(`dato propuesto ${k} («${v}») en ${enLaminas(ls)}: confírmalo y quita "propuesto"; mientras tanto el deck no es final`);
});
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
// Reglas del deck.json (sin navegador): firma de relleno, duración de la pieza, apertura, voz, proyecciones,
// posts de maqueta y llamado (scripts/lib/reglas-deck.mjs)
// El deck crudo trae «datos» (CASO_PROPIO, ENTREGABLE confirmados); las láminas son las ya sustituidas
const delDeck = revisarDeck({ ...deck, datos: crudo.datos }, pasos, { dirDeck });
errores.push(...delDeck.errores);
avis.push(...delDeck.avisos);
// Resultado propio o entregable prometido sin confirmar: BORRADOR, igual que un dato propuesto
Object.entries(delDeck.porConfirmar || {}).forEach(([k, v]) => {
  porConfirmar[k] = v;
  avis.push(`${k} por confirmar en ${enLaminas(v.laminas)}: ${v.motivo}${v.valor ? ` («${v.valor}»)` : ''}`);
});
// Reglas del deck completo
const tipos = deck.laminas.map(l => l.tipo).filter(t => t !== 'camara');
let racha = 1;
for (let i = 1; i < tipos.length; i++) { racha = tipos[i] === tipos[i - 1] ? racha + 1 : 1; if (racha === 4) avis.push(`«${tipos[i]}» se usa 4 veces seguidas (desde la lámina ${i - 2}): alterna diseños`); }
const conteo = tipos.reduce((m, t) => ((m[t] = (m[t] || 0) + 1), m), {});
Object.entries(conteo).forEach(([t, c]) => { if (tipos.length >= 8 && c / tipos.length > 0.45) avis.push(`«${t}» es el ${Math.round((c / tipos.length) * 100)}% del deck (máximo 45%)`); });
let sinMano = 0;
porLamina.forEach(r => { if (r.tipo === 'camara') return; sinMano = r.mano ? 0 : sinMano + 1; if (sinMano === 4) avis.push(`4 láminas seguidas sin capa a mano (hasta la ${r.i + 1}): suma una nota, un subrayado o una flecha`); });
const oscuras = deck.laminas.filter(l => l.tipo === 'oscura' || l.oscura).length;
// La referencia solo oscurece REVELACIONES de marca o producto [36:15, 37:40, 43:00]; precio, qué incluye,
// garantía y llamado van en blanco [38:10-42:25]
deck.laminas.forEach((l, i) => {
  if (!l.oscura || l.tipo === 'oscura') return;
  if (['lista', 'cifra', 'tabla', 'tarjetas', 'stack'].includes(l.tipo) || (l.tipo === 'idea' && palabras(l.texto) > 12)) {
    avis.push(`${nombre(i)}: «oscura» en un(a) ${l.tipo}; la referencia solo oscurece la revelación de la marca o el producto (el precio y lo que incluye van en blanco)`);
  }
});
// Objeciones: una forma para todas (idea con «Objeción #N» y la respuesta en la lámina siguiente)
deck.laminas.forEach((l, i) => {
  const cab = String((['lista', 'boton', 'tarjetas'].includes(l.tipo) && (l.encabezado || l.texto)) || '');
  if (/^\s*(objeci[oó]n|raz[oó]n\s*#)/i.test(cab)) avis.push(`${nombre(i)}: la objeción va dentro de un(a) ${l.tipo}; dale su propia lámina \`idea\` con encabezado «Objeción #N» y la respuesta en la siguiente (GUION §2)`);
});
if (tipos.length >= 8 && oscuras / tipos.length > 0.15) avis.push(`${oscuras} láminas oscuras: resérvalas para revelar el producto o la oferta (≤ 15%)`);

// Con datos propuestos sin confirmar el deck es BORRADOR: la nota no pasa de TOPE_BORRADOR
const nota = notaQA({ errores, avisos: avis, porConfirmar });
const borrador = Object.keys(porConfirmar).length > 0;
const objetivo = minutosObjetivo(deck.duracion_objetivo);
const porTipo = duracionPorTipo(deck, pasos);
const duracion = { estimada: mmss(delDeck.duracion), segundos: Math.round(delDeck.duracion), laminas: mmss(porTipo.laminas), camara: mmss(porTipo.camara),
  ...(objetivo ? { objetivo: mmss(objetivo * 60) } : {}), ...(deck.pieza ? { pieza: deck.pieza } : {}) };
// Estado, en orden: borrador → con errores → bajo-90 → falta-venta → listo. Un loop o un agente de fondo lee `estado`
// (o corre con --estricto): «listo» es el ÚNICO estado que se entrega como final (SKILL §6).
const falta = delDeck.faltaParaFinal || [];
const estado = borrador ? 'borrador' : errores.length ? 'con errores' : nota < NOTA_FINAL ? 'bajo-90' : falta.length ? 'falta-venta' : 'listo';
const informe = { nota, estado, falta_para_final: falta, laminas: deck.laminas.length, pasos: pasos.reduce((a, b) => a + b, 0), duracion, ritmo: delDeck.ritmo, errores,
  avisos: avis, pendientes, por_confirmar: porConfirmar, iconos: delDeck.iconos, fecha: new Date().toISOString() };
fs.writeFileSync(path.join(dirSalida, 'qa.json'), JSON.stringify(informe, null, 2));
if (flag('--json')) console.log(JSON.stringify(informe, null, 2));
else {
  if (borrador) console.log(`BORRADOR: ${Object.keys(porConfirmar).length} dato(s) por confirmar (${Object.keys(porConfirmar).join(', ')}); la nota no pasa de ${TOPE_BORRADOR} hasta confirmarlos`);
  const partes = porTipo.camara ? ` (láminas ~${duracion.laminas} · cámara ~${duracion.camara})` : '';
  console.log(`QA ${nota}/100 · ${informe.laminas} láminas · ${informe.pasos} pasos · voz ~${duracion.estimada}${partes}${duracion.objetivo ? ` (objetivo ${duracion.objetivo})` : ''}`);
  errores.forEach(e => console.log('  ✗ ' + e));
  avis.forEach(e => console.log('  ⚠ ' + e));
  if (!errores.length && !avis.length) console.log('  ✓ sin hallazgos');
  if (estado !== 'listo') console.log(`ESTADO: ${estado}${falta.length ? ` / falta-venta: ${falta.join(', ')}` : ''}`);
}
// Código de salida: 1 con errores; con --estricto, 3 si no hay errores pero el estado no es «listo»
process.exit(errores.length ? 1 : flag('--estricto') && estado !== 'listo' ? 3 : 0);
