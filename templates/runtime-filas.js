/* Filas cortas: la referencia ocupa 60–75 % del ancho, con íconos de 170–250 px.
   Se mide el contenido completo antes del revelado, nunca el paso visible. */
function ampliarFilas(lam) {
  if (lam.offsetWidth < lam.offsetHeight) return;
  const tipos = ['pasos', 'flujo', 'bifurcacion', 'opciones', 'rejilla', 'lista', 'circulos'];
  if (!tipos.includes(lam.dataset.tipo)) return;
  const lz = lam.querySelector(':scope > .lienzo');
  if (lam.dataset.tipo === 'opciones' && lz?.children.length > 1) {
    const hijos = [...lz.children], envoltura = document.createElement('div');
    envoltura.className = 'pila';
    lz.replaceChildren(envoltura); envoltura.append(...hijos);
  }
  const bloque = lz?.firstElementChild;
  if (!bloque) return;
  if (lam.dataset.tipo === 'circulos') { ampliarCirculos(lam, lz, bloque); return; }
  const selector = { pasos: '.fila-pasos', flujo: '.fila-flujo', bifurcacion: '.fila',
    opciones: '.pila', rejilla: '.rejilla', lista: '.contraste' }[lam.dataset.tipo];
  const fila = lam.dataset.tipo === 'opciones' ? bloque.querySelector('.opcion')?.parentElement
    : bloque.matches(selector) ? bloque : bloque.querySelector(selector);
  if (!fila || fila.classList.contains('flujo-textual-apilado')) return;
  const nodos = [...fila.children].filter(e => !e.matches('.signo,.retorno-et,.nodo-aparte'));
  if (nodos.length < 2 || nodos.length > 4) return;
  const cs = getComputedStyle(lz), util = lz.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const alto = lz.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const etiquetas = [...fila.querySelectorAll('.etiqueta,.rotulo-paso,.contraste-titulo,.item,.opcion')];
  const piso = document.body.classList.contains('sala') ? 72 : 64;
  etiquetas.forEach(e => {
    const tam = parseFloat(getComputedStyle(e).fontSize);
    if (tam < piso) e.style.fontSize = piso + 'px';
  });
  // Las teclas y el mapa ya están calibrados; un flujo sin flechas heredaba 120 px.
  if (['flujo', 'bifurcacion'].includes(lam.dataset.tipo)) {
    fila.querySelectorAll('.emo').forEach(e => {
      if (!e.closest('.insignia') && e.offsetWidth < 210) e.style.setProperty('--s', '210px');
    });
  }
  const s = escala(lam), cajas = nodos.map(e => e.getBoundingClientRect());
  const anchoTinta = (Math.max(...cajas.map(r => r.right)) - Math.min(...cajas.map(r => r.left))) / s;
  const b = bloque.getBoundingClientRect();
  const factor = Math.min(1.65, util * .67 / anchoTinta, util / (b.width / s), alto / (b.height / s));
  if (factor > 1.005) bloque.style.zoom = factor.toFixed(3);
  fila.dataset.filaCorta = String(nodos.length);
  fila.dataset.ocupacionObjetivo = '.67';
  // El hueco restante se reparte arriba/abajo; no queda en el tercio superior.
  if (!lz.dataset.anclar) { lz.style.justifyContent = 'center'; lz.style.paddingTop = '68px'; lz.style.paddingBottom = '132px'; }
}

// Los anillos son cuadrados: el alto limita antes que el ancho. Se agranda el
// dibujo, conservando el rótulo y reduciendo solo su aire hasta 16 px.
function ampliarCirculos(lam, lz, bloque) {
  const dibujo = [...bloque.children].find(e => e.style.position === 'relative' && e.style.width);
  if (!dibujo) return;
  const personajes = dibujo.querySelectorAll('.emo').length;
  if (personajes < 2 || personajes > 4) return;
  const cs = getComputedStyle(lz), util = lz.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const alto = lz.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) + 40;
  const titulo = bloque.querySelector(':scope > .t');
  if (titulo) titulo.style.marginBottom = '16px';
  const s = escala(lam), d = dibujo.getBoundingClientRect();
  const otros = bloque.getBoundingClientRect().height / s - d.height / s;
  const factor = Math.min(1.4, util * .51 / (d.width / s), (alto - otros) / (d.height / s));
  if (factor > 1.005) dibujo.style.zoom = factor.toFixed(3);
  dibujo.dataset.composicionCirculos = '1';
  if (!lz.dataset.anclar) { lz.style.paddingTop = '68px'; lz.style.paddingBottom = '132px'; }
}
