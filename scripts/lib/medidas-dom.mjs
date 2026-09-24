// medidas-dom.mjs — medidas que qa.mjs hace DENTRO de Chromium. Cada función es autocontenida (qa.mjs las
// inyecta con su .toString()), así las pruebas pueden inyectarlas igual y probar cada regla por separado.

// Palabras por renglón de un elemento (sin los emojis): [["Tu", "oferta"], ["en", "una", "frase"]].
// Se mide cada palabra con un Range: sirve para «Paso / 2», «La / detecta» y los renglones huérfanos.
export function lineasPalabras(el) {
  const lineas = [];
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    const p = n.parentElement;
    if (!p || p.closest('.emo, script, style')) continue;
    const re = /\S+/g;
    for (let m; (m = re.exec(n.nodeValue));) {
      const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
      const r = [...rg.getClientRects()].find(q => q.width > 1 && q.height > 1);
      if (!r) continue;
      const y = r.top + r.height / 2;
      let l = lineas.find(o => Math.abs(o.y - y) < r.height * 0.5);
      if (!l) lineas.push(l = { y, palabras: [] });
      l.palabras.push(m[0]);
    }
  }
  return lineas.sort((a, b) => a.y - b.y).map(l => l.palabras);
}

// Elementos visibles que un ancestro con overflow ≠ visible recorta (el calendario que se come su última fila).
// Devuelve [{ que, px, por }]. Se detiene en el lienzo: lo que se sale del lienzo lo mide otra regla.
export function recortes(lam, selector) {
  const out = [];
  const visible = e => { const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && e.getClientRects().length; };
  [...lam.querySelectorAll(selector)].filter(e => visible(e) && !e.closest('.escena:not(.lamina)') && !e.closest('.cuadrantes, .rejilla-sangre')).forEach(e => {
    const b = e.getBoundingClientRect();
    for (let a = e.parentElement; a && a !== lam && !a.classList.contains('lienzo'); a = a.parentElement) {
      const cs = getComputedStyle(a);
      if ([cs.overflow, cs.overflowX, cs.overflowY].every(v => v === 'visible')) continue;
      const r = a.getBoundingClientRect();
      const px = Math.max(r.top - b.top, b.bottom - r.bottom, r.left - b.left, b.right - r.right);
      if (px > 4) out.push({ que: String(e.innerText || e.className || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 30), px: Math.round(px), por: String(a.className || a.tagName).split(' ')[0] });
      break;
    }
  });
  return out;
}

// Contenedores flex o grid con texto suelto Y elementos en línea como hijos directos: cada nodo de texto y cada
// <b> se vuelven ítems separados, el espacio antes de la negrita se pierde («enuna frase») y la frase se parte
// en columnas. El texto tiene que ir en un solo hijo (un <span> o un bloque).
export function flexMezclado(lam) {
  const out = [];
  lam.querySelectorAll('*').forEach(el => {
    if (el.closest('svg, .escena.clon, script')) return;
    if (!/flex|grid/.test(getComputedStyle(el).display)) return;
    const hijos = [...el.childNodes];
    const texto = hijos.some(n => n.nodeType === 3 && /\S/.test(n.nodeValue));
    const enLinea = hijos.some(n => n.nodeType === 1 && /^(B|STRONG|U|S|MARK|I|EM|SPAN|A|BR)$/.test(n.tagName) && !n.classList.contains('emo'));
    if (texto && enLinea) out.push(String(el.textContent).replace(/\s+/g, ' ').trim().slice(0, 40));
  });
  return out;
}

// **Negritas** que no se distinguen del resto de su frase: mismo color y menos de 200 de peso de diferencia en Figtree, o
// menos de 300 en Caveat (la fuente manuscrita llega solo de 400 a 700: 600 → 700 y 500 → 700 se ven iguales; el peso
// calculado de más de 700 se topa en 700, que es lo que se dibuja) [r5, foco «menos de 5», cifra «$30,000»]. Un color
// distinto ya es énfasis; una frase que va TODA en negrita no tiene contra qué contrastar; el remate del stack y las
// mayúsculas van en 800 a propósito. Devuelve [{ texto, dw, mano }].
export function negritasPlanas(lam) {
  const out = [];
  const peso = e => parseFloat(getComputedStyle(e).fontWeight) || 400;
  const visible = e => { const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('.oculto') && e.getClientRects().length; };
  const limpio = t => String(t || '').replace(/\s+/g, ' ').trim();
  const BLOQUE = '.nota, .t, .item, .cifra, .etiqueta, .tarjeta, .burbuja, .rotulo-paso, .b-texto, td, th, .titulo-marca, .opcion, .cal-texto, .cuadro, .post p, .fuente, .llamada-rotulo';
  lam.querySelectorAll('b, strong').forEach(b => {
    // los <b> estructurales (el nombre de la fase del calendario, el dato de la pastilla, el usuario del post) no son énfasis
    if (b.closest('.escena.clon, svg, mark, [data-sub], .emo, .t-remate, .mayus, .hueco, .calendario, .pastilla, .post .cab') || b.matches('.sub, [data-sub]') || !visible(b)) return;
    const padre = b.parentElement; if (!padre) return;
    const cb = getComputedStyle(b), cp = getComputedStyle(padre);
    if (cb.color !== cp.color) return;
    const txt = limpio(b.textContent), bloque = b.closest(BLOQUE) || padre;
    if (!txt || limpio(bloque.textContent) === txt) return;
    const mano = /caveat/i.test(cb.fontFamily.split(',')[0]);
    const tope = mano ? 700 : 900;
    const dw = Math.min(tope, peso(b)) - Math.min(tope, peso(padre));
    if (dw < (mano ? 300 : 200)) out.push({ texto: txt.slice(0, 30), dw, mano });
  });
  return out;
}

// Flujo vertical (9:16): cada nodo, su ícono y su etiqueta se centran en el eje de la columna. Con la pila en flex-start los
// nodos angostos quedaban pegados a la izquierda («La minuta» y 📝 en el reel 03-minuta) y la flecha salía torcida, y QA
// daba 100 [r5, juez]. Mide el centro de cada pieza contra el centro de la columna y devuelve las que se salen más de
// `tol` (fracción del ancho de la lámina; 2% por omisión): [{ que, dx }], uno por nodo, con dx en % del ancho.
export function ejesFlujo(lam, tol = 0.02) {
  const out = [];
  const W = lam.getBoundingClientRect().width || 1;
  const visible = e => { const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('.oculto, .escena.clon') && e.getClientRects().length; };
  const cx = e => { const r = e.getBoundingClientRect(); return r.left + r.width / 2; };
  lam.querySelectorAll('.pila.fila-flujo').forEach(col => {
    if (!visible(col)) return;
    const eje = cx(col);
    [...col.children].filter(n => n.classList.contains('nodo') && visible(n)).forEach(n => {
      const et = n.querySelector(':scope > .etiqueta');
      const nombre = (et ? et.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 30) || 'nodo';
      const piezas = [['nodo', n], ['ícono', n.firstElementChild], ['etiqueta', et]].filter(([, e]) => e && visible(e));
      // una entrada por nodo, con la pieza que más se sale (el nodo entero, su ícono o su etiqueta)
      const peor = piezas.map(([que, e]) => ({ que, dx: (cx(e) - eje) / W })).sort((a, b) => Math.abs(b.dx) - Math.abs(a.dx))[0];
      if (peor && Math.abs(peor.dx) > tol) out.push({ que: `${peor.que} de «${nombre}»`, dx: Math.round(peor.dx * 1000) / 10 });
    });
  });
  return out;
}

export const FUNCIONES_DOM = [lineasPalabras, recortes, flexMezclado, negritasPlanas, ejesFlujo, factorLetra, lineasConMuestra, textoConMuestras];
export const inyectable = () => FUNCIONES_DOM.map(f => `window.${f.name} = ${f.toString()};`).join('\n');

// Pisos por rol a 1920 px, en tamaño nominal (la nota a mano de sala, 72 en Caveat, como en la conferencia real).
// factorLetra (altura x de Caveat contra Figtree) queda como medida auxiliar: a 88 nominales da ~63 px de Figtree.
export const PISOS = { video: { principal: 40, nota: 28, secundario: 48, fuente: 36, rotulo: 28 },
  sala: { principal: 72, nota: 72, secundario: 56, fuente: 44, rotulo: 34 } };
export function factorLetra(el) {
  const cs = getComputedStyle(el);
  if (!/Caveat/.test(cs.fontFamily)) return 1;
  const c = document.createElement('canvas').getContext('2d');
  c.font = `${cs.fontWeight} 100px Caveat`;
  const mano = c.measureText('x').actualBoundingBoxAscent;
  c.font = `${cs.fontWeight} 100px Figtree`;
  const sans = c.measureText('x').actualBoundingBoxAscent;
  return mano > 0 && sans > 0 ? mano / sans : 1;
}

// Mide renglones con una muestra provisional y restaura el DOM aun si la medición falla.
export function lineasConMuestra(el, datos = {}) {
  const huecos = [...el.querySelectorAll('.hueco.pendiente')];
  if (el.matches('.hueco.pendiente')) huecos.unshift(el);
  const originales = huecos.map(e => ({ e, texto: e.textContent, clave: e.textContent.replace(/^\[|\]$/g, '') }));
  try {
    originales.forEach(({ e, clave }) => { e.textContent = typeof datos[clave]?.muestra === 'string' ? datos[clave].muestra : '0000'; });
    return { lineas: window.lineasPalabras(el), claves: originales.map(x => x.clave) };
  } finally { originales.forEach(({ e, texto }) => { e.textContent = texto; }); }
}

// Un marcador pendiente representa el dato de muestra, no varias palabras separadas por guiones bajos.
export function textoConMuestras(texto, datos = {}) {
  return String(texto).replace(/\[([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ0-9 _-]*)\]/g, (_, clave) => typeof datos[clave]?.muestra === 'string' ? datos[clave].muestra : '0000');
}
