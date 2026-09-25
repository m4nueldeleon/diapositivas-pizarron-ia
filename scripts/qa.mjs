#!/usr/bin/env node
import { evaluacionesSeparadas } from './lib/editorial.mjs';
import { reglasDeckCompleto, clasificarAvisos } from './lib/reglas-deck.mjs';
import { medidasTrazos, avisosGeometriaSello } from './lib/medidas-trazos.mjs';
import { subrayadosCruzan } from './lib/medidas-subrayados.mjs';
import { infoConceptos } from './lib/emoji-diccionario.mjs';
import { RE_PALABRA } from './lib/markup.mjs';
// qa.mjs — revisa el deck renderizado con reglas que cuentan, no que opinan. Nota 0-100.
//
//   node scripts/qa.mjs <carpeta|deck.json> [--salida dir] [--json] [--estricto]
//
//   --estricto  sale con 3 si no hay errores pero el estado no es «listo» (bajo-90, falta-venta, borrador: un borrador
//               nunca es final, aunque esté `listo_salvo_datos`)
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
//   · sello que tapa más del 25% de las celdas DESTACADAS de una rejilla; sello que tapa una flecha, llave o círculo, o
//     que queda a < 20 px de un subrayado (cortarlo es error); flecha de anotación o de nota al margen de menos de 60 px;
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
// Nota: 100 − 12 × errores − 3 × avisos; con datos por confirmar (huecos declarados, propuestos, capturas por
// conseguir), BORRADOR y tope de 90: esos datos NO restan, van en qa.json → datos_por_confirmar (consola: «◌»).
// qa.json trae además `estado` (con errores · borrador · bajo-90 · falta-venta · listo: los errores ganan al borrador),
// en borrador `nota_sin_tope` y `listo_salvo_datos` (sin errores, 90+ sin el tope y nada en falta), `falta_para_final` (lo que le
// falta a una pieza de venta), `ritmo` (mediana y p90 de los pasos), `por_confirmar` e `iconos` (emoji → láminas).
import fs from 'node:fs';
import { revisarTexto, informeSinMedir } from './lib/qa-texto.mjs';
import path from 'node:path';
import { argumentos, prepararSalida, abrir, ErrorNavegador } from './lib/pipeline.mjs';
import { MARCA_LITERAL, palabras } from './lib/markup.mjs';
import { BAJO_CONTRASTE, HALO_INSUFICIENTE, contrasteMedido, UMBRAL_CONTRASTE, UMBRAL_OSCURA, VISTOS_OK, DIVERGE, SUGERIDO, TEXTO_IMPRESO } from './lib/emoji.mjs';
import { inyectable, PISOS } from './lib/medidas-dom.mjs';
import { FORMATOS } from './lib/construir.mjs';
import { revisarDeck, notaQA, notaSinTope, estadoQA, TOPE_BORRADOR, infoEmoji, infoFirma, infoIconos, infoPersona, lineaArco, fichaReglasCliente } from './lib/reglas-deck.mjs';
import { rutaGlobal } from './lib/marca.mjs';
import { mmss, minutosObjetivo, duracionPorTipo } from './lib/tiempos.mjs';
import { medirSobreColor, UMBRAL_COLOR } from './lib/contraste-color.mjs';
import { errorVozPasos } from './lib/pasos-mapa.mjs';
import { glosarioDatos } from './lib/datos.mjs';
import { registrarQA } from './lib/evidencia-calidad.mjs';

try {
const NOTA_FINAL = 90;   // SKILL §6: 90 o más y cero errores

const { flag, pos, opt } = argumentos(process.argv);
let prep;
try { prep = prepararSalida(pos[0], opt('--salida')); } catch (e) {
  console.error('✗ ' + e.message);
  if (flag('--sin-navegador')) {
    const entrada = path.resolve(pos[0] || '.');
    const destino = path.resolve(opt('--salida') || path.join(path.extname(entrada) === '.json' ? path.dirname(entrada) : entrada, 'salida'));
    fs.mkdirSync(destino, { recursive: true });
    const informe = informeSinMedir(e.errores || [e.message]);
    fs.writeFileSync(path.join(destino, 'qa-texto.json'), JSON.stringify(informe, null, 2));
    console.error(informe.advertencia);
    process.exit(flag('--estricto') ? 3 : 1);
  }
  process.exit(2);
}
const { deck, crudo, dirSalida, dirDeck, htmlPath, W, H, pasos, revela = [], avisos: avisosBuild, sugerencias = [], propuestos = {}, declarados = {}, faltan = {}, formato, firmaDe, fichaMarca, avisoFirma, infoDatosFicha = [] } = prep;
if (prep.avisoReplica) console.warn('⚠ ' + prep.avisoReplica);
if (flag('--sin-navegador')) {
  const informe = revisarTexto(prep);
  fs.writeFileSync(path.join(dirSalida, 'qa-texto.json'), JSON.stringify(informe, null, 2));
  if (flag('--json')) console.log(JSON.stringify(informe, null, 2));
  else {
    console.log(`QA de texto: nota provisional ${informe.nota_provisional}/100 · ESTADO: sin-medir`);
    informe.errores.forEach(e => console.error('  ✗ ' + e));
    informe.avisos.forEach(e => console.warn('  ⚠ ' + e));
    informe.info.forEach(e => console.log('  ℹ ' + e));
    console.log(informe.advertencia);
  }
  process.exit(flag('--estricto') ? 3 : informe.errores.length ? 1 : 0);
}
const { browser, page, avisos, errores: errPagina } = await abrir(htmlPath, W, H);
await page.addScriptTag({ content: inyectable() + `;window.medidasTrazos = ${medidasTrazos.toString()};window.avisosGeometriaSello = ${avisosGeometriaSello.toString()};window.subrayadosCruzan = ${subrayadosCruzan.toString()};` });
const CONTRASTE = { BAJO: BAJO_CONTRASTE, MEDIDO: contrasteMedido(), U: UMBRAL_CONTRASTE, UO: UMBRAL_OSCURA, OK: VISTOS_OK, DIVERGE, SUG: SUGERIDO, IMPRESO: TEXTO_IMPRESO, HALO_INSUFICIENTE, pedido: crudo.emoji || 'auto', mv: (FORMATOS[formato] || FORMATOS['16:9']).mv };

const porLamina = await page.evaluate(([W, H, MARCA, CT, PISOS, palabraFuente, datosMuestra, enVivo]) => {
  const out = [];
  const reMarca = new RegExp(MARCA);
  const rePendiente = /\[[A-ZÁÉÍÓÚÑÜ0-9_][A-ZÁÉÍÓÚÑÜ0-9 _\-]{0,30}\]/g;
  const vertical = H > W;
  const visible = e => { const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('.oculto') && e.getClientRects().length; };
  const caja = (e, lam) => { const r = e.getBoundingClientRect(), L = lam.getBoundingClientRect(); return { x: r.left - L.left, y: r.top - L.top, w: r.width, h: r.height }; };
  const rel = (r, L) => ({ x: r.left - L.left, y: r.top - L.top, w: r.width, h: r.height });
  const cruza = (a, b) => { const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)); return x * y; };
  const opac = e => { let o = 1; for (let a = e; a && a.nodeType === 1; a = a.parentElement) o *= parseFloat(getComputedStyle(a).opacity); return o; };
  const zoom = e => { let z = 1; for (let a = e; a && a.nodeType === 1; a = a.parentElement) z *= parseFloat(getComputedStyle(a).zoom) || 1; return z; };
  const corto = (s, n = 30) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const TEXTO = '.t, .t-remate, .nota, .item, .etiqueta, .valor, .encabezado, .cifra, .etiqueta-chica, .tarjeta, .opcion, .burbuja, .titulo-marca, .post p, .vivo-consigna, .vivo-items li, .llamada-yo, .llamada-rotulo, .agenda-evento b, .agenda-evento span, .agenda-dia, .agenda-numero, .invitacion-cab b, .invitacion-cab span, .invitacion-sub, .invitacion-boton, .contraste-titulo, .grabando';
  const CAJAS = TEXTO + ', .emo, img, table, .captura, .pastilla, .calendario, .rejilla, .medidor, .boton-ui, .agenda-evento, .invitacion, .celular-pantalla';
  const PRINCIPAL = '.t, .item, .etiqueta, .burbuja, .tarjeta';
  // Texto secundario que se tiene que LEER (≥ 48 px a 1920, ≈ 9 px en un celular de 360). Los rótulos decorativos
  // del calendario («DÍA») y la firma quedan fuera: en el original también van a ~28-30 px [ref_1760]. La `fuente` de un
  // dato o un estudio SÍ se lee (es la prueba del dato): ≥ 36 px, con su propio umbral (FUENTE).
  const SECUNDARIO = '.sub-etiqueta, .pastilla .dato span, .pct, .post, .etiqueta-chica, .chat-hora';
  const FUENTE = '.fuente';
  const MINIMO = '.calendario .dia span, .calendario .dia b, .calendario .barra b, .calendario .barra span, .bento-lleno span';
  const fueraClon = e => !e.closest('.escena.clon');
  // Capas OPACAS que reemplazan la escena en su paso (el remate del stack [42:50] es un lienzo limpio sobre el bento):
  // lo que queda debajo no se ve aunque siga con visibility visible y opacidad 1. El sello y la frase del foco NO van
  // aquí: que tapen texto es justo lo que QA tiene que ver.
  const TAPAS = '.stack-remate';
  const tapas = raiz => [...raiz.querySelectorAll(TAPAS)].filter(c => visible(c) && fueraClon(c) && opac(c) > 0.5);
  const tapado = (e, T, lam) => T.some(c => !c.contains(e) && !e.contains(c) && (() => {
    const b = caja(e, lam), k = caja(c, lam), A = b.w * b.h; return A > 0 && cruza(b, k) / A > 0.9;
  })());

  // Renglones reales de texto: un rect por nodo de texto y renglón (no las cajas de los elementos)
  function renglones(raiz, L) {
    const r = [], T = raiz.classList && raiz.classList.contains('lamina') ? tapas(raiz) : [];
    const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      const el = n.parentElement;
      if (!el || !/\S/.test(n.nodeValue) || el.closest('script, style, .emo, .sello, .cursor, .firma, .capa-mano') || !fueraClon(el)) continue;
      if (!visible(el) || opac(el) < 0.5 || (T.length && tapado(el, T, raiz))) continue;
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
    const pendientesPasos = new Map();
    const registrarPendiente = (t,p) => pendientesPasos.set(t, new Set([...(pendientesPasos.get(t) || []), p+1]));
    const r = { i, tipo: lam.dataset.tipo, errores: [], avisos: [], info: [], palabras: 0, mano: 0, trazos: [], contenedores: 0, enfasis: 0, pendientes: [], medir: [], contrasteReportado: [] };
    // La `camara` normal se proyecta en negro: nada que revisar. El tramo en vivo (`vivo: true`) SÍ lo ve el público minutos
    // enteros: se revisa lo que se proyecta (.captura-vivo), con las mismas reglas (palabras, pendientes, desborde, letra)
    if (lam.dataset.tipo === 'camara' && !lam.dataset.vivo) { out.push(r); return; }
    if (lam.dataset.vivo) lam.classList.add('captura-vivo');
    for (let p = 0; p < n; p++) {
      window.PZ.mostrar(lam, p, Infinity);
      const E = m => r.errores.push(`paso ${p + 1}: ${m}`), A = m => r.avisos.push(`paso ${p + 1}: ${m}`);
      window.subrayadosCruzan(lam).forEach(A);
      for (const rotulo of lam.querySelectorAll('svg.trazo-concepto text')) {
        if (!visible(rotulo)) continue;
        const matriz = rotulo.getScreenCTM(), zoomLienzo = L.width / lam.offsetWidth;
        const tam = parseFloat(getComputedStyle(rotulo).fontSize) * Math.hypot(matriz.a, matriz.b) / zoomLienzo;
        if (tam < 48) A(`el rótulo del símbolo «${rotulo.textContent}» mide ${Math.round(tam)} px: usa etiqueta externa o un concepto reconocible (mínimo 48 px)`);
      }
      const trazos = window.medidasTrazos(lam); trazos.errores.forEach(E); trazos.avisos.forEach(A);
      if (document.body.classList.contains('sala')) {
        const identificables = '.lz-pasos [style*="opacity"], .lz-pasos .paso-apagado .icono-paso, .lz-pasos .paso-apagado .rotulo-paso, .lz-pasos .paso-apagado .tecla, .item-apagado > *, .pasos-letras .pendiente, .rejilla .apagado, .rejilla .apagada, .calendario .dia.apagado, :scope > .clon';
        for (const e of lam.querySelectorAll(identificables)) {
          if (!visible(e) || (e.closest('.clon') && !e.matches('.clon'))) continue;
          const op = opac(e);
          if (op < .35 - .001) E(`elemento identificable apagado al ${Math.round(op * 100)} % en sala: usa var(--apagado) o una opacidad efectiva mínima de 35 %`);
        }
      }
      if (enVivo) for (const qr of lam.querySelectorAll('.codigo-qr')) {
        if (!visible(qr)) continue;
        const zona = Number(qr.dataset.zonaQuieta), modulos = Number(qr.dataset.modulos);
        const modulo = caja(qr, lam).w / (modulos + 2 * zona);
        if (zona < 4) E('QR sin zona quieta de cuatro módulos; restaura el SVG generado');
        if (modulo < 10 * W / 1920) E(`QR con módulo de ${modulo.toFixed(1)} px: amplía el QR hasta al menos ${(10 * W / 1920).toFixed(1)} px por módulo`);
      }
      // la multitud «tú» va a sangre a propósito [14:55]: sus siluetas se salen del lienzo
      const cajas = [...lam.querySelectorAll(CAJAS)].filter(e => visible(e) && !e.closest('.escena:not(.lamina)') && !e.closest('.cuadrantes, .rejilla-sangre'));
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
      lineas.forEach(({ n: nodo }) => (nodo.nodeValue.match(rePendiente) || []).forEach(t => registrarPendiente(t,p)));
      [...lam.querySelectorAll('svg text')].filter(t => fueraClon(t) && visible(t) && opac(t) >= .5 && !tapado(t,tapas(lam),lam)).forEach(t => (t.textContent.match(rePendiente) || []).forEach(x => registrarPendiente(x,p)));
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
      // Tabla: el texto de una celda que sale de su caja de contenido (> 4 px) se monta en la vecina [r4, 9:16 marcador]
      const fueraCelda = new Set();
      lam.querySelectorAll('.tabla td, .tabla th').forEach(cel => {
        if (!fueraClon(cel) || !visible(cel) || !cel.textContent.trim()) return;
        const R = cel.getBoundingClientRect(), cs = getComputedStyle(cel), z = R.width / (cel.offsetWidth || 1) || 1;
        const x0 = R.left + parseFloat(cs.paddingLeft) * z, x1 = R.right - parseFloat(cs.paddingRight) * z;
        const tw = document.createTreeWalker(cel, NodeFilter.SHOW_TEXT);
        for (let nd; (nd = tw.nextNode());) {
          if (!/\S/.test(nd.nodeValue) || !visible(nd.parentElement)) continue;
          const rg = document.createRange(); rg.selectNodeContents(nd);
          if ([...rg.getClientRects()].some(q => q.width > 3 && (q.left < x0 - 4 || q.right > x1 + 4))) fueraCelda.add(corto(nd.nodeValue, 24));
        }
      });
      fueraCelda.forEach(t => E(`«${t}» se sale de su celda de la tabla y se monta en la vecina: acorta el texto, quita columnas o parte la tabla en dos láminas con "fijas"`));
      // Textos SVG (marcas y tramos de la línea de tiempo, ejes, series): encimados entre sí o fuera del lienzo
      const tSvg = [...lam.querySelectorAll('svg text')].filter(t => fueraClon(t) && visible(t) && opac(t) >= 0.5 && t.textContent.trim() && !t.closest('.escena:not(.lamina)'));
      tSvg.forEach(t => { const b = caja(t, lam); if (b.x < -2 || b.y < -2 || b.x + b.w > W + 2 || b.y + b.h > H + 2) E(`«${corto(t.textContent, 30)}» se sale del lienzo`); });
      for (let a = 0; a < tSvg.length; a++) for (let b = a + 1; b < tSvg.length; b++) {
        const A0 = caja(tSvg[a], lam), B0 = caja(tSvg[b], lam), c = cruza(A0, B0);
        if (c > 0.06 * Math.min(A0.w * A0.h, B0.w * B0.h)) E(`se enciman «${corto(tSvg[a].textContent, 24)}» y «${corto(tSvg[b].textContent, 24)}»`);
      }
      // Etiquetas de una gráfica en la misma banda y a menos de 32 px: «Solo la pensaron Reportaban cada semana» se lee
      // como una sola frase (el cruce de más de 6% ya es error arriba)
      const gT = tSvg.filter(t => t.closest('.grafica'));
      for (let a = 0; a < gT.length; a++) for (let b = a + 1; b < gT.length; b++) {
        const A0 = caja(gT[a], lam), B0 = caja(gT[b], lam);
        if (!(A0.y < B0.y + B0.h && B0.y < A0.y + A0.h) || cruza(A0, B0) > 0) continue;
        const hueco = Math.max(B0.x - (A0.x + A0.w), A0.x - (B0.x + B0.w));
        if (hueco >= 0 && hueco < 32 * (W / 1920)) A(`las etiquetas «${corto(gT[a].textContent, 24)}» y «${corto(gT[b].textContent, 24)}» quedan a ${Math.round(hueco)} px y se leen como una sola frase: acórtalas`);
      }
      // Marcas sin convertir
      lineas.forEach(({ n: nodo }) => { if (reMarca.test(nodo.nodeValue)) E(`marca sin cerrar o partida a la vista: «${corto(nodo.nodeValue, 40)}»`); });
      // Letra efectiva (el encaje reduce con zoom y getComputedStyle no lo descuenta)
      const deSala = document.body.classList.contains('sala') ? ', svg text, .tabla th, .tabla td, .cal-texto, .rotulo-paso, .procedencia' : '';
      const extra = [...lam.querySelectorAll(SECUNDARIO + ', ' + MINIMO + ', ' + FUENTE + deSala)].filter(e => visible(e) && !e.closest('.escena:not(.lamina)') && e.textContent.trim());
      for (const t of [...textos, ...extra]) {
        const ef = parseFloat(getComputedStyle(t).fontSize) * zoom(t);
        if (document.body.classList.contains('sala')) {
          const rol = t.matches(FUENTE + ', .procedencia') ? 'fuente' : t.matches('.nota') ? 'nota' : t.matches('.encabezado, .rotulo-paso[style*="color:var(--gris)"]') ? 'rotulo' : t.matches(SECUNDARIO + ', ' + MINIMO + ', .vivo-items li, svg text, .tabla th, .tabla td, .cal-texto') ? 'secundario' : 'principal';
          // Los pisos de sala son nominales, como se midieron en la conferencia real (nota a mano a 72 en Caveat);
          // el motor pone la nota a 88 nominales en sala, holgado sobre ese piso.
          const pintado = ef, piso = PISOS.sala[rol] * W / 1920;
          if (pintado < piso - .5) E(`«${corto(t.innerText, 24)}» (${rol}) se ve a ${Math.round(pintado)}px en sala, mínimo ${Math.round(piso)}: parte la lámina o sube tam_texto`);
          continue;
        }
        if (t.matches('.agenda-numero, .grabando')) continue; // Microetiquetas de interfaz; siguen medidas por recorte.
        if (ef < 27.5) E(`letra de ${Math.round(ef)}px reales en «${corto(t.innerText, 24)}» (mínimo 28)`);
        else if (t.matches(FUENTE) && ef < 36 * (W / 1920) - 0.5) A(`la fuente «${corto(t.innerText, 24)}» se ve a ${Math.round(ef)} px: en un celular no se lee (≥ ${Math.round(36 * W / 1920)})`);
        else if (t.matches(SECUNDARIO) && ef < 48 * (W / 1920) - 0.5) A(`«${corto(t.innerText, 24)}» (texto secundario) se ve a ${Math.round(ef)}px reales: en un celular no se lee (ideal ≥ ${Math.round(48 * W / 1920)})`);
        else if (t.matches(PRINCIPAL) && !t.closest('.tabla, .grafica, .celular-pantalla') && ef < 40 * (W / 1920) - 0.5) A(`«${corto(t.innerText, 24)}» se ve a ${Math.round(ef)}px reales (ideal ≥ ${Math.round(40 * W / 1920)})`);
      }
      // Sello: polígono girado contra renglones y emojis; fuera del lienzo
      for (const sello of lam.querySelectorAll(':scope > .sello')) if ( visible(sello) && parseFloat(sello.style.opacity || 1) > 0.5) {
        const pol = poligonoSello(sello, L);
        const firmaSello = lam.querySelector('.firma');
        const bloquesSello = [...lam.querySelectorAll(':scope > .lienzo > *')].filter(e => e.getClientRects().length).map(e => caja(e, lam));
        const bloqueSello = bloquesSello.length ? { y: Math.min(...bloquesSello.map(b => b.y)), h: Math.max(...bloquesSello.map(b => b.y + b.h)) - Math.min(...bloquesSello.map(b => b.y)), x: Math.min(...bloquesSello.map(b => b.x)), w: Math.max(...bloquesSello.map(b => b.x + b.w)) - Math.min(...bloquesSello.map(b => b.x)) } : null;
        const margenSello = parseFloat(getComputedStyle(lam).getPropertyValue('--margen-v')) || CT.mv;
        window.avisosGeometriaSello(pol, W, H, margenSello, firmaSello ? caja(firmaSello, lam) : null, bloqueSello, !!sello.dataset.acomodado).forEach(A);
        if (pol.some(([x, y]) => x < -1 || y < -1 || x > W + 1 || y > H + 1)) E(`el sello «${corto(sello.textContent, 20)}» se sale del lienzo`);
        const tolerado = e => e.closest('.rejilla, .cuadrantes, .captura, .pruebas');
        // El ÍCONO que es el ancla de sello_sobre se sella A PROPÓSITO (LAYOUTS §Anclas; el mismo mecanismo que sobre las
        // cajas de 6:45): no cuenta como tapado. Cualquier otro emoji, y todo renglón (un texto sellado no se lee), sí.
        const destino = sello.dataset.sobre ? [...lam.querySelectorAll(`[data-a="${CSS.escape(sello.dataset.sobre)}"], [data-w="${CSS.escape(sello.dataset.sobre)}"]`)].find(fueraClon) : null;
        const esDestino = e => destino && (destino === e || destino.contains(e));
        const mover = destino ? `el sello va sobre «${sello.dataset.sobre}»: cambia el ancla o quita sello_sobre para que se acomode solo` : 'muévelo con sello_pos o quítalo para que se acomode solo';
        const tapados = new Set();
        lineas.filter(q => !tolerado(q.el)).forEach(q => { if (fraccionEn(q.b, pol) > 0.12) tapados.add(corto(q.n.nodeValue, 24)); });
        tapados.forEach(t => E(`el sello tapa «${t}»: ${mover}`));
        // Rejilla con destacadas: esas celdas son el dato que se cuenta (la rejilla homogénea sí se tapa [6:45])
        lam.querySelectorAll('.rejilla').forEach(rj => {
          const dest = [...rj.querySelectorAll('[data-a^="d"]')];
          if (!dest.length) return;
          const n = dest.filter(d => { const b = caja(d, lam); return dentroPoligono([b.x + b.w / 2, b.y + b.h / 2], pol); }).length;
          if (n > 2 && n > 0.25 * dest.length) A(`el sello tapa ${n} de las ${dest.length} celdas destacadas de la rejilla: asegúrate de que la cifra ya se dijo o está en una nota; o quita sello_sobre para que se acomode solo`);
        });
        // los avatares del chat (.yo-av/.otro-av, silueta o emoji) cuentan como emoji: el gancho se lee por quién habla
        const iconos = [...lam.querySelectorAll('.emo, .yo-av, .otro-av')].filter(e => e.matches('.yo-av, .otro-av') || !e.closest('.yo-av, .otro-av'));
        const Ts = tapas(lam);
        const tapaIcono = iconos.filter(e => visible(e) && fueraClon(e) && !tolerado(e) && !esDestino(e) && opac(e) > 0.5 && !tapado(e, Ts, lam)).some(e => fraccionEn(caja(e, lam), pol) > 0.2);
        if (tapaIcono) E(`el sello tapa un emoji o un avatar: ${mover}`);
        // Tinta a mano: el sello no corta un subrayado ni un tachón (error) ni queda pegado a él (< 20 px, aviso); sobre
        // una flecha, una llave o un círculo, aviso
        const distPol = ([x, y]) => {
          if (dentroPoligono([x, y], pol)) return 0;
          let d = Infinity;
          for (let i2 = 0, j2 = pol.length - 1; i2 < pol.length; j2 = i2++) {
            const [ax, ay] = pol[j2], [bx, by] = pol[i2], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
            const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
            d = Math.min(d, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
          }
          return d;
        };
        const trazosSello = [...lam.querySelectorAll(':scope > .capa-mano path')].filter(pth => !pth.closest('defs') && pth.dataset.pase !== '2' && !pth.classList.contains('oculto') && +(pth.dataset.p || 0) <= p);
        const muestras = pth => { const tot = pth.getTotalLength(), pts = []; for (let t = 0; t <= tot; t += 6) { const q = pth.getPointAtLength(t); pts.push([q.x, q.y]); } return pts; };
        let corta = '', pegado = 0, otra = false;
        trazosSello.forEach(pth => {
          const cl = pth.dataset.clase, pts = muestras(pth), dentro = pts.filter(q => dentroPoligono(q, pol)).length;
          if (cl === 'subrayado' || cl === 'tachon') {
            if (dentro >= 2) corta = corta || (cl === 'tachon' ? 'un tachón' : 'un subrayado');
            else { const d = Math.min(...pts.map(distPol)); if (d < 20) pegado = Math.max(pegado, 20 - d); }
          } else if (dentro >= 3) otra = true;
        });
        if (corta) E(`el sello «${corto(sello.textContent, 20)}» corta ${corta}: ${mover}`);
        else if (pegado) A(`el sello «${corto(sello.textContent, 20)}» queda pegado a un subrayado o un tachón (a menos de 20 px): sepáralo con sello_pos`);
        if (otra) A(`el sello «${corto(sello.textContent, 20)}» tapa una flecha, una llave o un círculo a mano: ${mover}`);
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
        try { const sp = JSON.parse(lam.dataset.clic || 'null'); anclaClic = sp && [...lam.querySelectorAll(`[data-a="${CSS.escape(sp.a)}"], [data-w="${CSS.escape(sp.a)}"]`)].find(fueraClon); } catch (e) { anclaClic = null; }
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
      lam.querySelectorAll(':scope > .capa-mano path[data-estilo="fina"], :scope > .capa-mano path[data-estilo="curva-roja"], :scope > .capa-mano path[data-estilo="fina-abajo"]').forEach(pth => {
        if (+pth.dataset.p > p) return;
        const largo = pth.getTotalLength();
        if (largo < 60) A(`una flecha de anotación mide ${Math.round(largo)} px: se ve como un garabato; separa la nota (≥ 60)`);
      });
      // Anotación ENCIMA de su ancla (la tarjeta, la captura) o de otra caja, y gancho que tacha su propia nota: el borde
      // del lienzo la regresaba sobre la tarjeta [r5, muro 14]. La nota va en el blanco junto a lo que señala.
      lam.querySelectorAll(':scope > .anotacion').forEach(n => {
        if (!visible(n) || opac(n) < 0.5 || +n.dataset.p > p) return;
        const N = caja(n, lam), area = N.w * N.h || 1, txt = corto(n.textContent, 24);
        const el = n.dataset.sobre ? [...lam.querySelectorAll(`[data-a="${CSS.escape(n.dataset.sobre)}"], [data-w="${CSS.escape(n.dataset.sobre)}"]`)].find(fueraClon) : null;
        const cont = el && (el.closest('.captura, .tarjeta, .burbuja, .rejilla, .post, .bento, .cuadro') || el);
        const otras = [...lam.querySelectorAll(CAJAS)].filter(e => visible(e) && fueraClon(e) && e !== n && !n.contains(e) && !e.contains(n) && opac(e) >= 0.5
          && !e.closest('.anotacion') && !(cont && (cont.contains(e) || e.contains(cont))));
        const pisa = [cont, ...otras].filter(Boolean).find(e => cruza(N, caja(e, lam)) / area > 0.04);
        if (pisa) E(`la anotación «${txt}» cae encima de «${corto(pisa.textContent || pisa.className, 24)}»: va en el blanco junto a su ancla (cambia «lado», acórtala o dale "x"/"y")`);
        const g = lam.querySelector(`:scope > .capa-mano path[data-clase="flecha"][data-de="${CSS.escape(n.dataset.a || '')}"]`);
        if (g && +g.dataset.p <= p) {
          const tot = g.getTotalLength(); let dentro = 0;
          for (let t = 0; t <= tot * 0.92; t += 4) { const q = g.getPointAtLength(t); if (q.x > N.x + 4 && q.x < N.x + N.w - 4 && q.y > N.y + 4 && q.y < N.y + N.h - 4) dentro++; }
          if (dentro >= 3) E(`el gancho de la anotación «${txt}» tacha su propia nota: sepárala de su ancla`);
        }
      });
      // Firma: ERROR si su caja (con 4 px de margen) toca cualquier tinta de la lámina: un renglón, un emoji, un trazo de
      // la capa a mano o una LÍNEA de la tabla (el borde de cada celda, tenga texto o no). La firma de 342 px cruzaba la
      // línea de la columna vacía y se metía en la última fila, y QA solo la comparaba con celdas con texto [r5, r460].
      const firma = lam.querySelector(':scope > .firma');
      if (firma && visible(firma)) {
        const F0 = caja(firma, lam), F = { x: F0.x - 4, y: F0.y - 4, w: F0.w + 8, h: F0.h + 8 };
        const toca = lineas.find(q => cruza(F, q.b) > 0);
        const emo = !toca && [...lam.querySelectorAll('.emo')].find(e => visible(e) && fueraClon(e) && opac(e) > 0.3 && cruza(F, caja(e, lam)) > 0);
        const bordes = [];
        if (!toca && !emo) lam.querySelectorAll('.tabla td, .tabla th').forEach(c => {
          if (!visible(c) || !fueraClon(c)) return;
          const b = caja(c, lam), cs = getComputedStyle(c), bl = parseFloat(cs.borderLeftWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0;
          if (bl) bordes.push({ x: b.x, y: b.y, w: bl, h: b.h });
          if (bt) bordes.push({ x: b.x, y: b.y, w: b.w, h: bt });
        });
        const linea = bordes.find(b => cruza(F, b) > 0);
        let trazoF = null;
        if (!toca && !emo && !linea) lam.querySelectorAll(':scope > .capa-mano path').forEach(pth => {
          if (trazoF || pth.closest('defs') || +pth.dataset.p > p || pth.classList.contains('oculto')) return;
          const tot = pth.getTotalLength ? pth.getTotalLength() : 0;
          for (let t = 0; t <= tot; t += 6) { const q = pth.getPointAtLength(t); if (q.x > F.x && q.x < F.x + F.w && q.y > F.y && q.y < F.y + F.h) { trazoF = pth; break; } }
        });
        if (toca) E(`«${corto(toca.n.nodeValue, 24)}» toca la firma`);
        else if (emo) E('un emoji toca la firma');
        else if (linea) E('la firma cruza una línea de la tabla: deja una columna vacía al final (vacias: 1) o usa "firma": false en esta lámina');
        else if (trazoF) E('un trazo de la capa a mano (flecha, subrayado, círculo) pasa por la firma');
        else if (lam.dataset.tipo === 'tabla') {
          const celda = [...lam.querySelectorAll('.tabla td, .tabla th')].find(c => c.textContent.trim() && cruza(F0, caja(c, lam)) > 0.15 * F0.w * F0.h);
          if (celda) A(`la firma cae dentro de la celda «${corto(celda.textContent, 24)}» de la tabla: usa "firma": false en esta lámina`);
        }
        if (F0.w > 300) A(`la firma mide ${Math.round(F0.w)} px de ancho (ideal ~260): acorta el texto de la marca`);
      }
      // Elementos vacíos
      [...lam.querySelectorAll('.burbuja, .tarjeta, .cuadro, .lista .item, .nodo .etiqueta, .opcion')]
        .filter(e => fueraClon(e) && visible(e) && !e.textContent.trim() && !e.querySelector('.emo, img'))
        .forEach(e => E(`hay un elemento vacío (${e.className.split(' ')[0]}): revisa sus datos en deck.json`));
      // en vivo: la consigna y sus pasos (el reloj no cuenta como palabras)
      const lienzo = lam.dataset.vivo ? lam.querySelector(':scope > .vivo-pres') : [...lam.querySelectorAll(':scope > .lienzo')].pop();
      if (lienzo && !['tabla', 'prueba', 'chat', 'calendario', 'agenda'].includes(lam.dataset.tipo)) {
        const txt = [...lienzo.querySelectorAll(TEXTO)].filter(visible).filter(e => !e.querySelector(TEXTO)).map(e => e.innerText).join(' ');
        r.palabras = Math.max(r.palabras, (window.textoConMuestras(txt, datosMuestra).match(new RegExp(palabraFuente, 'gu')) || []).length);
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
    r.pendientes = [...pendientesPasos.keys()];
    r.pendientes_pasos = Object.fromEntries([...pendientesPasos].map(([t,ps]) => [t,[...ps]]));
    // Contraste: un hallazgo por lámina con los fragmentos afectados
    const bajos = { e: new Set(), a: new Set() }; let peor = 99;
    // la variable de plantilla amarilla de la burbuja azul es de la referencia [c_1315] (≈2:1 contra el degradado, como el
    // blanco del mensaje): se trata como el resto de la burbuja «yo», que no se mide
    lineas.filter(q => !q.el.closest(COMPONENTE) || q.el.closest('.hueco')).forEach(q => {
      const col = colores(getComputedStyle(q.el).color)[0]; if (!col) return;
      const c = razon(lum(col), lumFondo(q.el)), t = corto(q.n.nodeValue, 24);
      // la burbuja azul «yo» es de la referencia (iMessage): ni el blanco llega a 3:1; ahí solo cuenta el error
      // la variable de plantilla de la burbuja gris va en el blanco del mensaje: no es un texto «de color»
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
      const lz = lam.querySelector(':scope > .lienzo'), h = lam.dataset.vivo ? lam.querySelector(':scope > .vivo-pres') : lz && lz.firstElementChild;
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
        r.composicion_vertical = { ocupacion_pct: +(ocupa * 100).toFixed(1), centro_pct: +((y0 + y1) / (2 * H) * 100).toFixed(1) };
        // idea, cita, cifra, objeto y botón son un solo punto focal: centrados y grandes, no llenan el alto a propósito
        if (!['idea', 'cita', 'cifra', 'objeto', 'oscura', 'foco', 'camara', 'boton'].includes(lam.dataset.tipo) && ocupa < 0.35) AF(`el contenido ocupa ${Math.round(ocupa * 100)}% del alto; en 9:16 conviene más grande (≥ 35%)${['chat', 'rejilla', 'prueba'].includes(lam.dataset.tipo) ? '; sube tam_texto y usa encabezado_estilo:"frase"' : ''}`);
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
      if (m != null && m < (fondo === 'oscura' ? CT.UO : CT.U) && !(CT.OK[set] || []).includes(ch)) return CT.SUG[ch] || 'otro emoji';
      return '';
    };
    const sets = CT.pedido === 'auto' ? [modoEmoji, modoEmoji === 'apple' ? 'fluent' : 'apple'] : [modoEmoji];
    const flojos = Object.fromEntries(sets.map(x => [x, new Set()])), cambia = new Set(), impresos = new Set();
    const Tc = tapas(lam);
    [...lam.querySelectorAll('.emo')].filter(e => visible(e) && fueraClon(e) && !tapado(e, Tc, lam)).forEach(e => {
      // emoji que imprime texto (🏪 «24», 🪪 «Jo Appleseed»): a tamaño de ícono se lee
      const base = e.querySelector(':scope > .emo-txt, :scope > img');
      if (e.closest('.lz-pasos, .lz-lista')) {
        let opacidad = 1;
        for (let a = e; a && a !== lam; a = a.parentElement) opacidad *= parseFloat(getComputedStyle(a).opacity) || 0;
        if (opacidad > 0 && opacidad < .99) {
          const glifo = e.querySelector(':scope > .emo-txt, :scope > img, :scope > svg');
          if (glifo) {
            const tipo = glifo.tagName === 'IMG' ? 'img' : glifo.tagName.toLowerCase() === 'svg' ? 'svg' : 'txt';
            r.medir.push({ tipo, ch: tipo === 'txt' ? glifo.textContent : e.dataset.e || glifo.getAttribute('alt') || 'ícono', src: tipo === 'img' ? glifo.getAttribute('src') : '', svg: tipo === 'svg' ? glifo.outerHTML : '', fondos: [[255,255,255]], apagado: opacidad });
          }
        }
      }
      if (base && caja(e, lam).w >= 80 * (W / 1920)) {
        const ch = String(base.tagName === 'IMG' ? base.getAttribute('alt') : base.textContent).replace(/\uFE0F/g, '');
        const t = (CT.IMPRESO[modoEmoji] || {})[ch];
        if (t) impresos.add(`${ch} dice ${t[0]}; usa ${t[1]}`);
      }
      const fondo = oscura ? 'oscura' : e.closest('.tarjeta, .cuadro, .bento-lleno, .calendario') ? 'tarjeta' : 'claro';
      e.querySelectorAll(':scope > .emo-txt, :scope > img, :scope > .insignia > img, :scope > .insignia > .emo-txt').forEach(g => {
        const ch = String(g.tagName === 'IMG' ? g.getAttribute('alt') : g.textContent).replace(/\uFE0F/g, '');
        sets.forEach(x => { const resuelto = oscura && g.parentElement === e && e.classList.contains('hundido') && !CT.HALO_INSUFICIENTE.includes(ch); const s2 = resuelto ? '' : bajo(ch, x, fondo); if (s2) { flojos[x].add(`${ch} → ${s2}`); if (x === modoEmoji) r.contrasteReportado.push(ch); } const d = (CT.DIVERGE[x] || {})[ch]; if (d) cambia.add(`${ch} en ${x} → ${d}`); });
      });
    });
    // Fondo REAL de cada emoji (el primer ancestro con color o degradado): sobre las piezas de color del stack, los
    // cuadros o el botón, la tabla de 3 fondos neutros no sirve. Esos se rasterizan aparte (fuera de esta página) y se
    // mide qué % del glifo se distingue de ESE fondo.
    const neutro = c => [[255, 255, 255], [243, 243, 243], [228, 228, 228], [11, 11, 14]].some(n => n.every((v, j) => Math.abs(v - c[j]) <= 8));
    const fondoReal = el => {
      for (let a = el.parentElement; a && a.nodeType === 1; a = a.parentElement) {
        if (a === lam && oscura) return [[11, 11, 14]];
        const cs = getComputedStyle(a);
        const bi = /gradient/.test(cs.backgroundImage) ? colores(cs.backgroundImage).map(c => c.slice(0, 3)) : [];
        if (bi.length) return bi;
        const bc = colores(cs.backgroundColor);
        if (bc.length) return [bc[0].slice(0, 3)];
        if (a === lam) break;
      }
      return [oscura ? [11, 11, 14] : [255, 255, 255]];
    };
    [...lam.querySelectorAll('.emo')].filter(e => visible(e) && fueraClon(e) && opac(e) > 0.5 && !e.closest('.en-texto, .en-linea') && !tapado(e, Tc, lam)).forEach(e => {
      const fondos = fondoReal(e);
      if (fondos.every(neutro)) {
        // Fondo neutro: la tabla medida (contraste-emojis.json) solo trae ~170 emojis. Uno que NO está en ella (🔈 💿 🔉)
        // se rasteriza en vivo contra su fondo real, base e insignias; los glifos SVG de la skill no se miden.
        const fondoN = oscura ? 'oscura' : e.closest('.tarjeta, .cuadro, .bento-lleno, .calendario') ? 'tarjeta' : 'claro';
        e.querySelectorAll(':scope > .emo-txt, :scope > img, :scope > .insignia > img, :scope > .insignia > .emo-txt').forEach(g => {
          const tipo = g.tagName === 'IMG' ? 'img' : 'txt';
          const ch = String(tipo === 'img' ? g.getAttribute('alt') : g.textContent).replace(/\uFE0F/g, '');
          const enTabla = ((CT.BAJO[modoEmoji] || {})[fondoN === 'oscura' ? 'oscura' : 'claro'] || {})[ch] || (((CT.MEDIDO[modoEmoji] || {})[fondoN]) || {})[ch] != null || (CT.OK[modoEmoji] || []).includes(ch);
          if (!ch || enTabla || (oscura && g.parentElement === e && e.classList.contains('hundido') && !CT.HALO_INSUFICIENTE.includes(ch))) return;
          r.medir.push({ tipo, ch, src: tipo === 'img' ? g.getAttribute('src') : '', svg: '', fondos, neutro: true, fondoN });
        });
        return;
      }
      const g = e.querySelector(':scope > .emo-txt, :scope > img, :scope > svg');
      if (!g) return;
      const tipo = g.tagName === 'IMG' ? 'img' : g.tagName.toLowerCase() === 'svg' ? 'svg' : 'txt';
      const ch = tipo === 'img' ? g.getAttribute('alt') : tipo === 'txt' ? g.textContent : '';
      // la silueta se mide con el relleno que de verdad se pinta ahí (pz-sil-claro sobre color, por CSS)
      const sil = tipo === 'svg' && g.querySelector('[fill="url(#pz-sil)"]');
      const claro = sil && /pz-sil-claro/.test(getComputedStyle(sil).fill);
      const svg = tipo === 'svg' ? (claro ? g.outerHTML.replace(/url\(#pz-sil\)/g, 'url(#pz-sil-claro)') : g.outerHTML) : '';
      r.medir.push({ tipo, ch: String(ch || '').replace(/\uFE0F/g, ''), src: tipo === 'img' ? g.getAttribute('src') : '', svg, fondos });
    });
    const fondoTxt = oscura ? 'fondo oscuro' : 'fondo claro';
    if (flojos[modoEmoji].size) AF(`emoji de bajo contraste en ${modoEmoji} sobre ${fondoTxt}; cámbialo: ${[...flojos[modoEmoji]].join(', ')}`);
    sets.slice(1).forEach(x => { if (flojos[x].size) AF(`deck en emoji "auto": en ${x} (${x === 'fluent' ? 'Linux, VPS, la nube' : 'una Mac'}) se pierde ${[...flojos[x]].join(', ')}; fija "emoji": "apple" o "fluent" (EMOJIS.md, «Qué set usar»)`); });
    if (impresos.size) AF(`emoji con texto impreso en ${modoEmoji}: ${[...impresos].join(' · ')} (EMOJIS.md, «Emojis con texto impreso»)`);
    if (cambia.size) AF(`emoji que cambia de sentido según el set: ${[...cambia].join(', ')} (EMOJIS.md)`);
    // Insignia (+💵) diminuta en una rejilla: a ~45 px entre 70 figuras no se encuentra [r3, short 05-setenta]. El glifo
    // de la insignia mide ~82% de su caja. Se sugiere apagar el resto o nombrar al destacado; nunca se cambia solo.
    const insChicas = [...lam.querySelectorAll('.rejilla .emo .insignia:not(.izq)')].filter(e => visible(e) && fueraClon(e) && opac(e) > 0.5)
      .map(e => caja(e, lam).w * 0.82).filter(w => w < (vertical ? 40 : 44) * (W / (vertical ? 1080 : 1920)));
    if (insChicas.length) AF(`la insignia del destacado de la rejilla mide ${Math.round(Math.min(...insChicas))} px: casi no se distingue entre las demás; usa "apagar_resto": true o "etiqueta_destacado" (el «tú» encendido de 43:10)`);
    // ---- reglas de maquetación (estado final) ----
    const visibles = sel => [...lam.querySelectorAll(sel)].filter(e => visible(e) && fueraClon(e) && !e.closest('.escena:not(.lamina)'));
    // Contenido recortado por su contenedor (overflow hidden): el calendario que se comía la última fila
    window.recortes(lam, CAJAS + ', .calendario .dia').forEach(q => EF(`«${q.que}» recortado ${q.px} px por .${q.por}: el contenido no cabe en su caja`));
    // **Negrita** que no se distingue de su frase (mismo color, peso casi igual): ESTILO §2 pide contraste por peso
    const planas = window.negritasPlanas(lam);
    if (planas.length) AF(`la negrita ${planas.map(x => `«${x.texto}»`).join(', ')} no se distingue del resto de su frase (${planas[0].mano ? 'Caveat: 400 → 700' : 'Figtree: al menos 200 de peso'}); baja el peso de la frase o quita la negrita`);
    // Flujo vertical: nodos, íconos y etiquetas en el eje de la columna (tolerancia 2% del ancho) [r5, reel 03-minuta]
    const fueraEje = window.ejesFlujo(lam);
    if (fueraEje.length) AF(`flujo vertical fuera de eje: ${fueraEje.slice(0, 3).map(x => `${x.que} a ${x.dx > 0 ? '+' : ''}${x.dx}% del centro`).join(', ')}: cada nodo va centrado en la columna (la flecha sale torcida)`);
    // Texto suelto y negritas como hijos de un flex/grid: se pierde el espacio antes de la negrita
    window.flexMezclado(lam).forEach(t => EF(`«${t}»: el texto y su negrita quedaron como columnas de un flex (se pierde el espacio): envuélvelo en un solo <span>`));
    // Etiquetas hermanas de una fila de flujo con distinto número de renglones («Le dan / la otra» entre dos de uno), o
    // encimadas con la vecina (con columnas minmax(0, 1fr) el desborde ya no agranda la columna)
    visibles('.fila-igual').forEach(f => {
      const et = [...f.children].filter(nd => nd.classList.contains('nodo') && !nd.classList.contains('nodo-aparte')).map(nd => nd.querySelector(':scope > .etiqueta')).filter(e => e && visible(e));
      if (et.length < 2) return;
      const ls = et.map(e => window.lineasPalabras(e));
      if (new Set(ls.map(l => l.length)).size > 1 && f.dataset.columnas !== 'propias') {
        const larga = et[ls.findIndex(l => l.length>1)], letras = larga.textContent.trim().length;
        const sobrantes = Math.max(1,Math.ceil(letras * (1-1/ls.find(l => l.length>1).length)));
        AF(`etiquetas hermanas con distinto número de renglones: a «${larga.textContent.trim()}» le sobran ~${sobrantes} letras para ir en un renglón${f.dataset.sepFija && parseFloat(getComputedStyle(f).columnGap)>Number(f.dataset.gapMin || 90) ? '; baja separacion hasta el piso indicado' : '; acorta esa etiqueta'}`);
      }
      const cj = et.map(e => caja(e, lam));
      for (let i = 1; i < cj.length; i++) {
        const apilado = getComputedStyle(f).flexDirection === 'column';
        const distancia = apilado ? cj[i].y - cj[i - 1].y - cj[i - 1].h : cj[i].x - cj[i - 1].x - cj[i - 1].w;
        if (distancia < 24) EF(`«${corto(et[i - 1].innerText, 20)}» y «${corto(et[i].innerText, 20)}» se enciman o quedan a menos de 24 px: acorta una etiqueta o sube «separacion»`);
      }
    });
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
    // Etiquetas cortas partidas y renglones huérfanos: el nombre del hueco no es el dato final.
    const lineasTipograficas = e => {
      const originales = window.lineasPalabras(e);
      if (!e.matches('.hueco.pendiente') && !e.querySelector('.hueco.pendiente')) return originales;
      const m = window.lineasConMuestra(e, datosMuestra);
      if (m.lineas.length < originales.length) r.info.push(`revísalo al llenar ${m.claves.join(', ')}`);
      return m.lineas;
    };
    const cortas = new Set(), huerfanos = new Set();
    visibles('.nodo .etiqueta, .calendario .dia span, .sub-etiqueta').forEach(e => {
      const ls = lineasTipograficas(e), pal = ls.flat();
      if (pal.length && pal.length <= 3 && ls.length > 1) cortas.add(ls.map(l => l.join(' ')).join(' / '));
    });
    visibles(TEXTO).filter(e => !e.querySelector(TEXTO) && !e.closest('.post, .calendario, .tabla')).forEach(e => {
      const ls = lineasTipograficas(e);
      if (ls.length < 2 || (ls.flat().length <= 3 && e.matches('.etiqueta'))) return;
      const h = ls.find(l => l.join('').replace(/[^\p{L}\p{N}]/gu, '').length <= 2);
      if (h) huerfanos.add(`${h.join(' ')}» en «${corto(e.innerText, 28)}`);
    });
    // Tabla con flechas que convergen [7:30]: la pregunta se lee (≥ 64 px) y la tabla no se encoge; en 9:16, fuera de
    // la franja de los botones de Reels
    const conv = lam.querySelector('.tabla-conv');
    if (conv && fueraClon(conv)) {
      const tx = conv.querySelector('.conv-texto');
      if (enc < 0.9) EF(`la tabla con flechas que convergen se redujo al ${Math.round(enc * 100)}%: pon el converger en una lámina aparte ({ "como": "<id>", "revelar": "todo", "converger": {…} }) para aislar la columna [7:30]`);
      else if (tx && !conv.classList.contains('aislada') && parseFloat(getComputedStyle(tx).fontSize) * zoom(tx) < 64 * (W / (vertical ? 1080 : 1920))) AF(`la pregunta de las flechas que convergen queda chica: pon el converger en una lámina aparte ({ "como": "<id>", "revelar": "todo", "converger": {…} }); así se aísla la columna como en [7:30]`);
      if (vertical && tx) { const b = caja(tx, lam); if (b.x + b.w > W - 140) EF('la pregunta de las flechas que convergen entra en la franja de los botones de Reels (140 px a la derecha)'); }
    }
    // El nombre del producto en la revelación: un último renglón de 1-2 palabras bajo uno de 3 o más («Diplomado en
    // Comunidades / de Pago») es una huérfana en el momento más importante de la venta [r5]
    visibles('.titulo-marca').forEach(e => {
      const ls = lineasTipograficas(e);
      if (ls.length >= 2 && ls.at(-1).length <= 2 && ls.at(-2).length >= 3) AF(`el nombre del producto deja «${ls.at(-1).join(' ')}» solo en el último renglón: acórtalo o repártelo`);
    });
    // Rótulo de tarjeta o de pieza del stack: dos renglones como máximo y con aire abajo (≥ 24 px del borde)
    visibles('.tarjeta .rotulo, .bento-lleno .b-texto').forEach(e => {
      const ls = lineasTipograficas(e), caj = e.closest('.tarjeta, .bento-lleno');
      if (ls.length > 2) AF(`«${corto(e.innerText, 28)}» ocupa ${ls.length} renglones en su tarjeta: acórtalo a 2 (es un rótulo, no una frase)`);
      const rg = document.createRange(); rg.selectNodeContents(e);
      const rs = [...rg.getClientRects()].filter(q => q.width > 3 && q.height > 3);
      if (!rs.length || !caj) return;
      const aire = (caj.getBoundingClientRect().bottom - Math.max(...rs.map(q => q.bottom))) / zoom(caj);
      if (aire < 24) AF(`«${corto(e.innerText, 28)}» queda a ${Math.round(aire)} px del borde de abajo de su tarjeta (ideal ≥ 24)`);
    });
    if (cortas.size) AF(`etiqueta corta partida en dos renglones: «${[...cortas].join('», «')}»; acórtala o dale más espacio (separacion)`);
    // Ecuación partida (la cifra ya se encogió hasta su piso) y resaltado corto partido en dos pastillas o dos trozos
    visibles('.cifra').forEach(e => {
      let ls = window.lineasPalabras(e);
      if (ls.length > 1 && e.querySelector('.hueco.pendiente')) {
        const m = window.lineasConMuestra(e, datosMuestra);
        if (m.lineas.length <= 1) { r.info.push(`revísalo al llenar ${m.claves.join(', ')}`); return; }
        ls = m.lineas;
      }
      if (ls.length > 1) AF(`la ecuación «${corto(e.innerText, 36)}» se parte en ${ls.length} renglones: acórtala o ponla en dos líneas del deck (lineas: […]), cada una una cuenta completa [3:15]`);
    });
    const partidos = new Set();
    visibles('.hueco, .var-plantilla, mark, [data-sub]').filter(e => !e.closest('.cifra')).forEach(e => {
      const ls = window.lineasPalabras(e);
      if (ls.length > 1 && (e.matches('.hueco.pendiente') || e.querySelector('.hueco.pendiente'))) {
        const m = window.lineasConMuestra(e, datosMuestra);
        if (m.lineas.length <= 1) { r.info.push(`revísalo al llenar ${m.claves.join(', ')}`); return; }
      }
      if (ls.length > 1 && ls.flat().length <= 3) partidos.add(ls.map(l => l.join(' ')).join(' / '));
    });
    if (partidos.size) AF(`resaltado corto partido en dos renglones: «${[...partidos].join('», «')}»; acorta la frase para que el resaltado quede entero`);
    if (huerfanos.size) AF(`renglón huérfano «${[...huerfanos].join('», «')}»: reparte la frase o acórtala`);
    // ~~tachado~~: solo el trazo rojo; y que el texto se alcance a leer antes de tacharlo
    lam.querySelectorAll('[data-tachar]').forEach(e => {
      if (/line-through/.test(getComputedStyle(e).textDecorationLine)) EF(`«${corto(e.textContent, 24)}» sale con el tachón negro del navegador además del rojo`);
      if (e.matches('s.tachon') && e.dataset.tacharP == null && fueraClon(e)) AF(`«${corto(e.textContent, 24)}» sale ya tachado en el paso en que aparece: usa "tachar_paso": 1 para que se lea antes del tachón [4:05]`);
    });
    // Emoji que tapa un renglón (la cifra de una barra, el título) y, en una gráfica, pegado al borde de arriba
    const lineasF = renglones(lam, L);
    const Tf = tapas(lam);
    const emos = [...lam.querySelectorAll('.emo')].filter(e => visible(e) && fueraClon(e) && opac(e) > 0.5 && !e.matches('.en-linea, .en-texto') && !e.closest('.en-linea, .en-texto, .escena:not(.lamina)') && !tapado(e, Tf, lam));
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
        [...rg.getClientRects()].map(q => rel(q, L)).filter(b => b.h >= (el.closest('.fuente') ? 36 : 60) * (W / 1920) && b.w > 3).forEach(b => {
          const cub = Math.max(0, ...frase.filter(f => f.b.x < b.x + b.w && f.b.x + f.b.w > b.x)
            .map(f => Math.max(0, Math.min(b.y + b.h, f.b.y + f.b.h) - Math.max(b.y, f.b.y)) / b.h));
          const k = corto(nd.nodeValue, 24), o = opac(el);
          if (cub > 0.3 && !(pisados.get(k) && pisados.get(k).cub >= cub)) pisados.set(k, { cub, o });
        });
      }
      // Sobre un fondo a ≤ 12% la frase puede cruzar renglones: así va en la referencia [15:22, h_pill]
      const anclada = !!lam.querySelector(':scope > .lienzo.foco-frase[data-anclar]');
      const salida = anclada ? 'acorta la frase o baja "opacidad"' : 'acorta la frase, usa "anclar" o baja "opacidad"';
      pisados.forEach(({ cub, o }, t) => {
        if (o <= 0.12) return;
        if (cub > 0.6) EF(`la frase del foco se escribe sobre «${t}» del fondo (se lee texto sobre texto): ${salida}`);
        else AF(`la frase del foco pisa «${t}» del fondo: ${salida}`);
      });
      // La frase es la protagonista: centrada (≤ 120 px del centro), no pegada debajo del fondo como pie de foto
      const pilaF = lam.querySelector(':scope > .lienzo.foco-frase > *');
      if (pilaF && !anclada) {
        const b = caja(pilaF, lam), d = Math.abs(b.y + b.h / 2 - H / 2);
        if (d > 120) AF(`la frase del foco quedó ${Math.round(d)} px fuera del centro: se lee como pie de foto del fondo; acórtala o usa "anclar"`);
      }
      // El fondo es el ESTADO FINAL de la lámina anterior: la misma tinta (tachones, subrayados, flechas)
      const prev = i > 0 ? window.PZ.lams[i - 1] : null;
      const tinta = svg => (svg ? [...svg.querySelectorAll('path')].filter(q => !q.closest('defs') && !q.classList.contains('oculto') && q.dataset.pase !== '2').length : 0);
      const enClon = tinta(clon.querySelector(':scope > .capa-mano')), antes = prev ? tinta(prev.querySelector(':scope > .capa-mano')) : 0;
      if (enClon < antes) EF(`el fondo del foco perdió tinta de la lámina anterior (${enClon} de ${antes} trazos): no es su estado final (un tachón perdido invierte el mensaje)`);
      // …y el mismo sello y las mismas notas: sin el sello «ERROR» la frase se leía como recomendación
      if (prev) for (const [sel, que] of [['.sello', 'el sello'], ['.anotacion', 'la anotación']]) {
        const n0 = [...prev.querySelectorAll(`:scope > ${sel}`)].filter(visible).length, n1 = [...clon.querySelectorAll(`:scope > ${sel}`)].filter(visible).length;
        if (n1 < n0) EF(`el fondo del foco perdió ${que} de la lámina anterior (${n1} de ${n0}): no es su estado final`);
      }
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
      const extremos = [pth.dataset.de, pth.dataset.a].filter(Boolean).map(id => [...lam.querySelectorAll(`[data-a="${CSS.escape(id)}"], [data-w="${CSS.escape(id)}"]`)].find(fueraClon)).filter(Boolean);
      const libres = [...emos, ...[...lam.querySelectorAll('img')].filter(e => visible(e) && fueraClon(e) && !e.closest('.emo'))]
        .filter(e => !extremos.some(x => x.contains(e) || e.contains(x) || (e.closest('.captura') && e.closest('.captura').contains(x))));
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
    for (const img of lam.querySelectorAll('img[data-recorte]')) {
      if (img.dataset.recorteError) AF(`no se pudo comprobar el fondo de la imagen: ${img.dataset.recorteError}; usa un PNG local con transparencia`);
      else if (img.dataset.recorteOpaco === 'true') AF(img.dataset.recorte === 'anfitrion' ? 'la imagen de anfitrion no tiene alfa útil: aporta un PNG recortado real con transparencia' : 'se verá como rectángulo de foto: quítale el fondo o usa `foto`');
    }
    const visiblesTinta = selector => [...lam.querySelectorAll(selector)].filter(e => fueraClon(e) && !e.closest('.pz-oculto'));
    const clasesTrazo = { subrayado: 'subrayado', tachon: 'tachón', llave: 'llave', flecha: 'flecha', circulo: 'círculo', ovalo: 'círculo' };
    r.trazos = [...new Set(visiblesTinta('.capa-mano path[data-clase]').map(e => clasesTrazo[e.dataset.clase]).filter(Boolean))];
    if (visiblesTinta(':scope > .sello').length) r.trazos.push('sello');
    // El conteo rojo excluye notas grises y tablas; la geometría sigue midiéndose aparte.
    r.rojo = visiblesTinta('.capa-mano path, .sello, [data-sub], .circ').filter(e => {
      const c = getComputedStyle(e), color = e.tagName.toLowerCase() === 'path' ? c.stroke : c.color;
      const rgb = color.match(/[\d.]+/g)?.map(Number) || [];
      return rgb.length >= 3 && rgb[0] > rgb[1] * 1.4 && rgb[0] > rgb[2] * 1.3;
    }).length;
    r.mano = visiblesTinta('.capa-mano path, .nota, .tabla, .sello, .t-mano, .mano, [data-sub], mark, .circ').length;
    r.contenedores = visiblesTinta('.nota, .tabla').length;
    r.enfasis = lam.querySelectorAll('[data-sub], mark, .circ').length;
    [...lam.querySelectorAll('img')].forEach(im => { if (!im.complete || !im.naturalWidth) r.errores.push(`imagen sin cargar: ${im.getAttribute('src')}`); });
    out.push(r);
  });
  return out;
}, [W, H, MARCA_LITERAL, CONTRASTE, PISOS, RE_PALABRA.source, crudo.datos || {}, deck.en_vivo === true]);
// Emojis sobre un fondo de color: se rasterizan en una página aparte (data URL: sin el bloqueo de file://)
const contrasteColor = await medirSobreColor(browser, porLamina, dirSalida);
const modoRender = await page.evaluate(() => document.body.dataset.emoji || 'apple');
// Qué emojis se midieron en vivo por estar fuera de la tabla y cuáles no se pudieron revisar (Apple fuera de macOS)
const enVivo = [...new Set(porLamina.flatMap(r => (r.medir || []).filter(m => m.neutro).map(m => m.ch)))];
// Una persona con tono (🧑🏻‍💼) se sigue midiendo en vivo (el tono cambia el contraste), pero no se lista como «fuera de la
// tabla» si su forma sin tono ya está medida: era ruido fijo en todo deck con `piel`
const enTablaSinTono = ch => {
  const k = String(ch).replace(/\uFE0F/g, ''), base = k.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
  return base !== k && Object.values(contrasteMedido()[modoRender] || {}).some(f => f && f[base] != null);
};
const enVivoInfo = enVivo.filter(ch => !enTablaSinTono(ch));
const sinRevisar = process.platform === 'darwin' ? [] : [...new Set(porLamina.flatMap(r => (r.medir || []).filter(m => m.neutro && m.tipo === 'txt').map(m => m.ch)))];
await browser.close();

// `avisDatos`: los datos por confirmar (huecos declarados, datos propuestos, resultado propio o entregable sin
// confirmar, capturas por conseguir). Se imprimen y van a qa.json → datos_por_confirmar, pero NO restan nota: ya los
// representa el tope de BORRADOR (restarlos castigaba dos veces el hueco honesto y empujaba a borrar la prueba).
const errores = [], avisDatos = [];
let avis = [];
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
  if (r.enfasis > 2) avis.push(`${n}: ${r.enfasis} énfasis (subrayado/resaltador/círculo); uno por lámina, dos como máximo`);
  const apagados = contrasteColor.filter(m => m.i === r.i && m.apagado != null && m.pct != null && m.pct < 15);
  if (apagados.length) avis.push(`${n}: el ícono apagado casi no se reconoce (${apagados.map(m => `${m.ch}: ${m.pct} % del glifo a ≥ 1.3:1`).join(', ')}); aumenta --apagado-icono o elige otro ícono que se reconozca`);
  const flojos = contrasteColor.filter(m => m.i === r.i && m.apagado == null && !r.contrasteReportado.includes(m.ch) && !m.neutro && m.pct != null && m.pct < (m.pastel ? CONTRASTE.U : m.oscuro ? UMBRAL_OSCURA : UMBRAL_COLOR));
  // fuera de la tabla medida, sobre blanco, tarjeta u oscura: el umbral de la tabla neutra (30 en la oscura)
  const flojosN = contrasteColor.filter(m => m.i === r.i && m.apagado == null && !r.contrasteReportado.includes(m.ch) && m.neutro && m.pct != null && m.pct < (m.fondoN === 'oscura' ? UMBRAL_OSCURA : CONTRASTE.U));
  if (flojosN.length) avis.push(`${n}: emoji fuera de la tabla medida que casi no se ve en ${modoRender} sobre ${flojosN[0].fondoN === 'oscura' ? 'la lámina oscura' : flojosN[0].fondoN === 'tarjeta' ? 'la tarjeta' : 'blanco'}: ${flojosN.map(m => `${m.ch} (${m.pct}%)${CONTRASTE.SUG[m.ch] ? ` → ${CONTRASTE.SUG[m.ch]}` : ''}`).join(', ')}; cámbialo (EMOJIS.md)`);
  if (flojos.length) avis.push(`${n}: emoji que casi no se ve sobre su fondo de color: ${flojos.map(m => `${m.ch || 'ícono'} (${m.pct}% del glifo se distingue)${CONTRASTE.SUG[m.ch] ? ` → ${CONTRASTE.SUG[m.ch]}` : ''}`).join(', ')}; cambia el color de la pieza («color») o el emoji`);
});
const geometria = { errores: [...errores], avisos: [...avis] };
// Datos pendientes: UN error por dato distinto, con las láminas donde aparece. Un hueco DECLARADO a propósito
// ({ "pendiente": true, "motivo" }) no es un olvido: va como aviso y deja el deck en BORRADOR.
const pendientes = {};
const sumarPendiente = (t,ls) => { pendientes[t] = [...new Set([...(pendientes[t] || []), ...ls])].sort((a,b) => a-b); };
porLamina.forEach(r => r.pendientes.forEach(t => sumarPendiente(t,[r.i+1])));
Object.entries(faltan).forEach(([k,ls]) => sumarPendiente(`[${k}]`,ls));
Object.entries(declarados).forEach(([k,d]) => sumarPendiente(`[${k}]`,d.laminas));
const porConfirmar = {};
const enLaminas = (ls = []) => `${ls.length > 1 ? 'las láminas' : 'la lámina'} ${ls.join(', ')}`;
Object.entries(pendientes).forEach(([t, ls]) => {
  const k = t.replace(/^\[|\]$/g, '');
  if (Object.hasOwn(declarados, k)) {
    porConfirmar[k] = { ...declarados[k], valor: '', laminas: ls, pendiente: true };
    avisDatos.push(`dato pendiente a propósito ${t} (${declarados[k].motivo}) en ${enLaminas(ls)}: el deck es borrador hasta llenarlo`);
  } else {
    // El texto puede traer ya {{CLAVE}} (el deck la escribió bien y falta el valor) o un [CLAVE] a mano
    const yaMarcada = JSON.stringify(crudo.laminas || []).includes(`{{${k}}}`);
    const pasosVistos = porLamina.flatMap(r => (r.pendientes_pasos?.[t] || []).map(p => `lámina ${r.i+1}, paso ${p}`));
    errores.push(`dato pendiente ${t} en ${enLaminas(ls)}${pasosVistos.length ? ` (${pasosVistos.join('; ')})` : ''}: pregúntaselo al usuario y ponlo en "datos": { "${k}": "…" }${yaMarcada ? '' : ` (en el texto va como {{${k}}})`}; no se inventa. Si se deja a propósito, decláralo: "${k}": { "pendiente": true, "motivo": "…" }`);
  }
});
// Datos PROPUESTOS ({ "valor", "propuesto": true }): se pintan, pero el deck no es final hasta confirmarlos
Object.entries(propuestos).forEach(([k, ls]) => {
  const v = crudo.datos && crudo.datos[k] && typeof crudo.datos[k] === 'object' ? crudo.datos[k].valor : '';
  porConfirmar[k] = { valor: v, laminas: ls, ...(crudo.datos[k].fuente ? {fuente:crudo.datos[k].fuente} : {}) };
  avisDatos.push(`dato propuesto ${k} («${v}») en ${enLaminas(ls)}: confírmalo y quita "propuesto"; mientras tanto el deck no es final`);
});
// Voz y anclas contra los pasos (una frase por paso; si no cuadran, los cortes del montaje se desalinean)
deck.laminas.forEach((l, i) => {
  if (l.tipo === 'camara') return;
  for (const k of ['voz', 'anclas']) {
    if (!Array.isArray(l[k]) || l[k].length === pasos[i]) continue;
    errores.push(`${nombre(i)}: ${errorVozPasos(k, l[k], pasos[i], revela[i])}`);
  }
  if (typeof l.voz === 'string' && pasos[i] > 1) avis.push(`${nombre(i)}: «voz» es un solo texto y la lámina tiene ${pasos[i]} pasos; los pasos 2 en adelante quedan sin voz ni ancla (usa una lista)`);
});
// Reglas del deck.json (sin navegador): firma de relleno, duración de la pieza, apertura, voz, proyecciones,
// posts de maqueta y llamado (scripts/lib/reglas-deck.mjs)
// El deck crudo trae «datos» (CASO_PROPIO, ENTREGABLE confirmados); las láminas son las ya sustituidas
const delDeck = revisarDeck({ ...deck, datos: crudo.datos }, pasos, { dirDeck, crudo, revela, credenciales: prep.credenciales });
errores.push(...delDeck.errores);
avis.push(...delDeck.avisos);
// Resultado propio o entregable prometido sin confirmar: BORRADOR, igual que un dato propuesto
Object.entries(delDeck.porConfirmar || {}).forEach(([k, v]) => {
  porConfirmar[k] = v;
  avisDatos.push(`${k} por confirmar en ${enLaminas(v.laminas)}: ${v.motivo}${v.valor ? ` («${v.valor}»)` : ''}`);
});
avis.push(...reglasDeckCompleto(deck, { manoPorLamina: porLamina.map(r => r.mano), tiposPorLamina: porLamina.map(r => r.trazos) }).avisos);

// Con datos propuestos sin confirmar el deck es BORRADOR: la nota no pasa de TOPE_BORRADOR
const revisionAvisos = clasificarAvisos(avis, deck.avisos_aceptados);
const reglasCliente = fichaReglasCliente(deck, avis);
avis = revisionAvisos.pendientes;
const nota = notaQA({ errores, avisos: avis, porConfirmar });
const borrador = Object.keys(porConfirmar).length > 0;
const objetivo = minutosObjetivo(deck.duracion_objetivo);
const porTipo = duracionPorTipo(deck, pasos);
const duracion = { estimada: mmss(delDeck.duracion), segundos: Math.round(delDeck.duracion), laminas: mmss(porTipo.laminas), camara: mmss(porTipo.camara),
  ...(objetivo ? { objetivo: mmss(objetivo * 60) } : {}), ...(deck.pieza ? { pieza: deck.pieza } : {}) };
// Estado, en orden: con errores → borrador → bajo-90 → falta-venta → listo (los errores mandan aunque haya datos por
// confirmar). Un loop o un agente de fondo lee `estado` y `listo_salvo_datos` (o corre con --estricto): «listo» es el
// ÚNICO estado que se entrega como final (SKILL §6).
const falta = delDeck.faltaParaFinal || [];
const estado = estadoQA({ errores, borrador, nota, falta, avisos: avis, aceptados: deck.avisos_aceptados, notaFinal: NOTA_FINAL });
// Sin el tope del borrador: ¿quedan avisos por corregir? `listo_salvo_datos` = mismo criterio que «listo», ignorando el tope
const sinTope = notaSinTope({ errores, avisos: avis });
const listoSalvoDatos = borrador && !errores.length && sinTope >= NOTA_FINAL && !falta.length && !revisionAvisos.pendientes.length;
// Información que NO resta nota: el set de emojis sin fijar y la firma (de dónde salió o dónde se llena)
const pruebaInfo = delDeck.prueba && ['logica', 'garantia'].includes(delDeck.prueba.tipo)
  ? `va con prueba por sustituto ${delDeck.prueba.tipo === 'logica' ? 'd (prueba lógica)' : 'e (primeros casos con garantía)'} en la lámina ${delDeck.prueba.lamina}; una captura real con permiso la refuerza (GUION §7)` : null;
const infoContraste = [
  enVivoInfo.length ? `contraste medido en vivo (fuera de la tabla de medir-emojis.mjs) en ${modoRender}: ${enVivoInfo.join(' ')}${CONTRASTE.pedido === 'auto' ? `; con emoji "auto", en ${modoRender === 'apple' ? 'fluent' : 'apple'} quedaron sin revisar` : ''}` : null,
  sinRevisar.length ? `no revisados (Apple solo se mide en macOS): ${sinRevisar.join(' ')}` : null,
];
const info = [...infoPersona(deck), ...porLamina.flatMap(r => (r.info || []).map(x => `${nombre(r.i)}: ${x}`)), ...infoContraste, infoEmoji(crudo), infoFirma(crudo, { aplicada: firmaDe, rutaGlobal: rutaGlobal(), ficha: fichaMarca }), avisoFirma, ...infoDatosFicha, pruebaInfo, infoIconos(deck), infoConceptos(deck)].filter(Boolean);
info.push(...revisionAvisos.aceptados.map(a => `excepción pedida por el cliente: ${a.aviso}; ${a.motivo}`));
const evaluaciones = evaluacionesSeparadas({ deck, geometria, editorial: { errores: errores.filter(e => !geometria.errores.includes(e)), avisos: avis.filter(a => !geometria.avisos.includes(a)) }, pendientes: porConfirmar, falta, medido: true });
const medicion = { evaluaciones, alcance_nota: 'cumplimiento automático; no calidad profesional', glosario: glosarioDatos(crudo), html_sha: prep.html_sha, medido: true, laminas_dir: prep.evidencia.laminas_dir, avisos_aceptados: revisionAvisos.aceptados, pendientes_por_paso: porLamina.filter(r => Object.keys(r.pendientes_pasos || {}).length).map(r => ({ lamina: r.i+1, datos: r.pendientes_pasos })), invalido: prep.evidencia.invalido, deck_sha: prep.evidencia.deck_sha, nota, estado, ...(borrador ? { nota_sin_tope: sinTope, listo_salvo_datos: listoSalvoDatos } : {}), avisos_n: avis.length, falta_para_final: falta, laminas: deck.laminas.length, pasos: pasos.reduce((a, b) => a + b, 0), duracion, ritmo: delDeck.ritmo, errores,
  avisos: avis, datos_por_confirmar: porConfirmar, datos_fuentes: prep.fuentes || {}, reglas_cliente: reglasCliente, info, ...(delDeck.prueba !== undefined ? { prueba: delDeck.prueba } : {}), arco: delDeck.arco, pendientes, por_confirmar: porConfirmar, iconos: delDeck.iconos,
  composicion_vertical: porLamina.filter(r => r.composicion_vertical).map(r => ({ lamina: r.i + 1, ...r.composicion_vertical })),
  tinta: porLamina.map(r => ({ lamina: r.i + 1, rojo: r.rojo, trazos: r.trazos, contenedores: r.contenedores })),
  mapa_pasos: Object.fromEntries(deck.laminas.map((l, i) => [`${i + 1} · ${l.id || l.tipo}`, revela[i] || []])), fecha: new Date().toISOString() };
if (flag('--preflight-geometria')) {
  fs.writeFileSync(path.join(dirSalida, 'preflight-geometria.json'), JSON.stringify({ ...medicion, fase: 'antes-de-captura', primer_render: null }, null, 2));
  console.log(`Encaje previo con fuentes reales: ${geometria.errores.length} errores · ${geometria.avisos.length} avisos`);
  [...geometria.errores, ...geometria.avisos].forEach(x => console.log(x));
  process.exit(geometria.errores.length || geometria.avisos.length ? 3 : 0);
}
const historial = registrarQA(dirSalida, medicion, prep.html_sha);
const informe = { ...medicion, primer_render: historial.qa_primer_render };
fs.writeFileSync(path.join(dirSalida, 'qa.json'), JSON.stringify(informe, null, 2));
if (flag('--json')) console.log(JSON.stringify(informe, null, 2));
else {
  if (borrador) console.log(`BORRADOR: ${Object.keys(porConfirmar).length} dato(s) por confirmar (${Object.keys(porConfirmar).join(', ')}); la nota no pasa de ${TOPE_BORRADOR} hasta confirmarlos; ${avis.length} aviso(s), sin tope sería ${sinTope}; listo salvo datos: ${listoSalvoDatos ? 'sí' : 'no'}`);
  const partes = porTipo.camara ? ` (láminas ~${duracion.laminas} · cámara ~${duracion.camara})` : '';
  console.log(`QA ${nota}/100 · ${informe.laminas} láminas · ${informe.pasos} pasos · voz ~${duracion.estimada}${partes}${duracion.objetivo ? ` (objetivo ${duracion.objetivo})` : ''}`);
  if (delDeck.arco && (delDeck.arco.contrato || delDeck.arco.oferta || delDeck.arco.llamados.length)) console.log(`  ${lineaArco(delDeck.arco)}`);
  errores.forEach(e => console.log('  ✗ ' + e));
  avis.forEach(e => console.log('  ⚠ ' + e));
  avisDatos.forEach(e => console.log('  ◌ ' + e));
  if (!errores.length && !avis.length && !avisDatos.length) console.log('  ✓ sin hallazgos');
  info.forEach(e => console.log('  ℹ ' + e));
  if (estado !== 'listo') console.log(`ESTADO: ${estado}${falta.length ? ` / falta-venta: ${falta.join(', ')}` : ''}`);
}
// Código de salida: 1 con errores; con --estricto, 3 si no hay errores pero el estado no es «listo»
process.exit(errores.length ? 1 : flag('--estricto') && estado !== 'listo' ? 3 : 0);

} catch (error) {
  if (!(error instanceof ErrorNavegador)) throw error;
  console.error('✗ ' + error.message);
  process.exit(4);
}
