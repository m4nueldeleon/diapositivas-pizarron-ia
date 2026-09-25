  // SVG documento: análisis XML desconectado; nunca se inserta contenido SVG en el DOM.
  // Solo tamaños declarativos comprobables. CSS externo/complejo queda señalado para QA.
  function datosDocumentoSVG(xml) {
    if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(xml)) throw new Error('declaraciones XML externas no admitidas');
    const doc = new DOMParser().parseFromString(xml, 'image/svg+xml'), svg = doc.documentElement;
    if (doc.querySelector('parsererror') || svg.localName !== 'svg') throw new Error('SVG inválido');
    if (doc.querySelector('style, foreignObject, textPath, svg svg')) throw new Error('CSS, texto sobre ruta o SVG anidado: requiere medición visual');
    if (doc.querySelector('use, symbol, defs text, mask text, clipPath text')) throw new Error('texto definido o reutilizado con use/symbol: requiere medición visual');
    if (doc.querySelector('animate, animateTransform, animateMotion, set')) throw new Error('SVG animado: requiere medición visual');
    if (/\bslice\b/.test(svg.getAttribute('preserveAspectRatio') || '')) throw new Error('preserveAspectRatio slice: requiere medición visual');
    const vb = (svg.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
    if (svg.hasAttribute('viewBox') && (vb.length !== 4 || !vb.every(Number.isFinite))) throw new Error('viewBox no medible');
    if (vb.length !== 4 && (svg.style.width || svg.style.height || !['width','height'].every(k => /^\d+(?:\.\d+)?(?:px)?$/.test(svg.getAttribute(k) || '')))) throw new Error('dimensiones sin viewBox requieren números o px, sin CSS');
    const ancho = vb.length === 4 ? vb[2] : parseFloat(svg.getAttribute('width'));
    const alto = vb.length === 4 ? vb[3] : parseFloat(svg.getAttribute('height'));
    if (![ancho,alto].every(n => Number.isFinite(n) && n > 0)) throw new Error('SVG sin dimensiones medibles');
    const estilo = (e,k) => e.style?.getPropertyValue(k) || e.getAttribute(k) || '';
    const numero = (s,base) => {
      const m = String(s).trim().match(/^([\d.]+)(px|pt|em|rem|%)?$/);
      if (!m || !Number.isFinite(+m[1]) || +m[1] <= 0) throw new Error(`font-size no medible: ${String(s).slice(0,24)}`);
      return +m[1] * ({ pt:4/3, em:base, rem:16, '%':base/100 }[m[2]] || 1);
    };
    const escalaTransform = cadena => {
      let m = new DOMMatrix(), resto = String(cadena);
      for (const f of String(cadena).matchAll(/([a-z]+)\s*\(([^)]*)\)/gi)) {
        const ns = f[2].trim().split(/[ ,]+/).map(Number);
        if (!ns.length || ns.some(n => !Number.isFinite(n))) throw new Error('transform SVG no medible');
        const [a,b,c] = ns;
        if (f[1] === 'scale' && ns.length <= 2) m = m.scale(a,b ?? a);
        else if (f[1] === 'translate' && ns.length <= 2) m = m.translate(a,b || 0);
        else if (f[1] === 'rotate' && [1,3].includes(ns.length)) m = m.translate(b || 0,c || 0).rotate(a).translate(-(b || 0),-(c || 0));
        else if (f[1] === 'matrix' && ns.length === 6) m = m.multiply(new DOMMatrix(ns));
        else if (f[1] === 'skewX' && ns.length === 1) m = m.skewX(a);
        else if (f[1] === 'skewY' && ns.length === 1) m = m.skewY(a);
        else throw new Error('transform SVG no admitido');
        resto = resto.replace(f[0],'');
      }
      if (resto.trim()) throw new Error('transform SVG no medible');
      return m;
    };
    const medir = el => {
      const padres = []; for (let a = el; a; a = a.parentElement) padres.unshift(a);
      let tam = 16, matriz = new DOMMatrix();
      for (const a of padres) {
        if (estilo(a,'display') === 'none' || estilo(a,'visibility') === 'hidden' || estilo(a,'opacity') === '0') return null;
        if (a.style?.font || a.style?.transform) throw new Error('font abreviado o transform CSS: requiere medición visual');
        if (estilo(a,'font-size')) tam = numero(estilo(a,'font-size'),tam);
        if (a.getAttribute('transform')) matriz = matriz.multiply(escalaTransform(a.getAttribute('transform')));
      }
      return tam * Math.hypot(matriz.c,matriz.d);
    };
    const descargos = [], textos = [];
    for (const el of doc.querySelectorAll('text')) {
      if (medir(el) == null || !/^\s*(?:ejemplo fictici|archivo de pr[áa]ctica|no es una venta real|muestra original)/i.test(el.textContent)) continue;
      descargos.push(el.textContent.trim()); el.remove();
    }
    for (const el of [...doc.querySelectorAll('text, tspan')]) {
      const tam = medir(el); if (tam == null) continue;
      const texto = [...el.childNodes].filter(n => n.nodeType === 3 || n.nodeType === 4).map(n => n.nodeValue).join(' ').trim();
      if (texto) textos.push({ texto, tam });
    }
    return { doc, ancho, alto, textos, descargos, estirar:svg.getAttribute('preserveAspectRatio') === 'none' };
  }

  async function prepararDocumentosSVG() {
    for (const img of document.querySelectorAll('img[data-documento-svg]')) {
      try {
        if (img.dataset.documentoMedidas || img.dataset.documentoError) continue;
        const lam = img.closest('.lamina'); if (!lam || img.closest('.clon')) continue;
        if (!/^data:image\/svg\+xml;base64,/.test(img.src)) throw new Error('documento SVG no local');
        const bytes = Uint8Array.from(atob(img.src.split(',')[1]), c => c.charCodeAt(0));
        const d = datosDocumentoSVG(new TextDecoder().decode(bytes));
        img.dataset.documentoMedidas = JSON.stringify({ancho:d.ancho,alto:d.alto,textos:d.textos,estirar:d.estirar});
        // Descargo compartido; se conserva el paso máximo de su imagen y sus ancestros.
        let paso = 0; for (let a = img; a && a !== lam; a = a.parentElement) paso = Math.max(paso,Number(a.dataset.p) || 0);
        for (const texto of d.descargos) {
          const el = document.createElement('div'); el.className = 'fuente'; el.textContent = texto;
          el.dataset.p = String(paso); el.dataset.documentoDescargo = '1'; lam.append(el);
        }
        if (d.descargos.length) {
          const xml = new XMLSerializer().serializeToString(d.doc);
          const carga = new Promise((res,rej) => { img.onload = res; img.onerror = () => rej(new Error('SVG sin descargo no cargó')); });
          img.src = 'data:image/svg+xml;base64,' + btoa([...new TextEncoder().encode(xml)].map(b => String.fromCharCode(b)).join(''));
          await carga;
        }
        if (!d.textos.length) continue;
        const piso = 44 * lam.offsetWidth / 1920, menor = Math.min(...d.textos.map(t => t.tam));
        if (!(menor > 0)) throw new Error('escala de texto SVG nula');
        const alto = Math.max(img.offsetHeight,Math.ceil(d.alto * piso / menor));
        img.style.height = alto + 'px'; img.style.width = 'auto';
        img.dataset.documentoAltoMinimo = String(alto);
      } catch (e) { img.dataset.documentoError = e.message; }
    }
  }
