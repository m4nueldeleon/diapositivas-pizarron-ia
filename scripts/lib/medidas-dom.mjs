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
  [...lam.querySelectorAll(selector)].filter(e => visible(e) && !e.closest('.escena:not(.lamina)') && !e.closest('.cuadrantes')).forEach(e => {
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

export const FUNCIONES_DOM = [lineasPalabras, recortes, flexMezclado];
export const inyectable = () => FUNCIONES_DOM.map(f => `window.${f.name} = ${f.toString()};`).join('\n');
