/* Filas cortas: la referencia ocupa 60–75 % del ancho, con íconos de 170–250 px.
   Se mide el contenido completo antes del revelado, nunca el paso visible. */
function ampliarFilas(lam) {
  if (lam.offsetWidth < lam.offsetHeight) { if (lam.dataset.tipo === 'tarjetas') ampliarTarjetasVertical(lam); return; }
  const tipos = ['pasos', 'flujo', 'bifurcacion', 'opciones', 'rejilla', 'lista', 'circulos'];
  if (!tipos.includes(lam.dataset.tipo) || lam.dataset.tipo === 'lista') return;
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
    (lam.dataset.tipo==='bifurcacion'?bloque:fila).querySelectorAll('.emo').forEach(e => {
      if (!e.closest('.insignia') && e.offsetWidth < 210) e.style.setProperty('--s', '210px');
    });
  }
  if(lam.dataset.tipo==='bifurcacion') { fila.style.marginTop='40px'; bloque.querySelectorAll('.nodo .emo').forEach(e=>e.style.setProperty('--s',e.closest('.fila')?'180px':'200px')); bloque.querySelectorAll('.etiqueta').forEach(e=>e.style.fontSize='84px'); bloque.querySelectorAll('.nota.roja').forEach(e=>e.style.marginTop='200px'); }
  const s = escala(lam), cajas = nodos.map(e => e.getBoundingClientRect());
  const anchoTinta = (Math.max(...cajas.map(r => r.right)) - Math.min(...cajas.map(r => r.left))) / s;
  const b = bloque.getBoundingClientRect();
  const factor = Math.min(1.65, util * .67 / anchoTinta, util / (b.width / s), alto / (b.height / s));
  if (factor > 1.005) bloque.style.zoom = factor.toFixed(3);
  fila.dataset.filaCorta = String(nodos.length);
  fila.dataset.ocupacionObjetivo = '.67';
  // El hueco restante se reparte arriba/abajo; no queda en el tercio superior.
  if (!lz.dataset.anclar && !(lam.dataset.tipo==='pasos' && bloque.querySelector('.mt-t'))) { lz.style.justifyContent = 'center'; lz.style.paddingTop = '68px'; lz.style.paddingBottom = '132px'; }
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

// Una fila mixta alinea sus anclas DESPUÉS de ampliar iconos y letras.
function alinearFlujoMixto(lam) {
  lam.querySelectorAll('.fila-flujo.flujo-con-texto:not(.flujo-textual-apilado)').forEach(fila=>{
    const nodos=[...fila.children].filter(e=>e.classList.contains('nodo'));
    const anclas=nodos.map(n=>n.querySelector('[data-a^="et"]')||n.querySelector('[data-a^="n"]'));
    if(anclas.some(e=>!e))return;
    const centros=anclas.map(e=>{const r=e.getBoundingClientRect();return r.y+r.height/2;});
    const z=fila.getBoundingClientRect().width/fila.offsetWidth, max=Math.max(...centros);
    nodos.forEach((n,i)=>n.style.paddingTop=((parseFloat(getComputedStyle(n).paddingTop)||0)+(max-centros[i])/z)+'px');
  });
}

// Las notas rojas integradas en una llave necesitan el mismo ojo que las
// anotaciones flotantes. Se reserva su renglón antes de encajar el conjunto.
function ajustarNotasLlave(lam) {
  const objetivo = alturaPrincipal(lam) * .75;
  lam.querySelectorAll('.nota.roja').forEach(n => {
    const actual = alturaX(n, lam), tam = parseFloat(getComputedStyle(n).fontSize);
    if (actual < objetivo) n.style.setProperty('--tn', (1 + Math.ceil(tam * objetivo / (actual || 1))) + 'px');
    n.style.whiteSpace = 'nowrap';
  });
}

// R14: en 9:16, hasta tres tarjetas apiladas toman ~84% del ancho útil y su letra sube hacia el texto principal
// (84 px, piso 64): salían a ~46 px con media lámina vacía y se leían como nota al pie [r14, reel del descuento, 7].
// Escalar el bloque no bastaba: la frase larga fijaba el ancho. Aquí la tarjeta se ensancha y el texto se reparte.
function ampliarTarjetasVertical(lam) {
  const lz = lam.querySelector(':scope > .lienzo'), bloque = lz?.firstElementChild, grid = bloque?.matches('.tarjetas') ? bloque : bloque?.querySelector('.tarjetas');
  if (!grid || grid.children.length > 3 || lz.dataset.anclar) return;
  const cs = getComputedStyle(lz), util = lz.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const alto = lz.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), s = escala(lam);
  grid.style.setProperty('--cols', '1'); grid.style.setProperty('--tw', Math.round(util * .84) + 'px');
  // Primero apiladas (emoji arriba); si a 64 px no caben, el emoji pasa AL LADO del texto (tarjeta-renglón): el alto de
  // cada tarjeta baja casi a la mitad y la letra vuelve a 84 [r14, ejemplo reel 6: tres tarjetas + encabezado].
  const probar = (fila) => {
    grid.classList.toggle('tarjetas-fila', fila);
    for (let tt = 84; tt >= 64; tt -= 4) {
      grid.style.setProperty('--tt', tt + 'px');
      grid.querySelectorAll('.emo').forEach(e => e.style.setProperty('--s', Math.round(tt * (fila ? 1.5 : 1.9)) + 'px'));
      const rotulosOk = [...grid.querySelectorAll('.rotulo')].every(r => rectsTexto(r, lam).length <= 2);
      if (rotulosOk && bloque.getBoundingClientRect().height / s <= alto * .9) return true;
    }
    return false;
  };
  if (!probar(false)) probar(true);
  lz.style.justifyContent = 'center';
}

// R16 [juez r16, ref_1040 17:20 y 28:00]: en el video la fila de íconos del mapa va a la MISMA altura en cada aparición,
// con su borde superior cerca del 32% del alto (ref_1040; 28:00), y el texto cuelga debajo. Con la reserva del grupo (nada se mueve de lugar) el bloque se
// centraba entero y los íconos subían al ~17%. Corre DESPUÉS de encajar: solo traslada, sin salir del margen de 6%.
function anclarMapas(lams) {
  // Todas las apariciones del MISMO mapa (misma secuencia de íconos) se trasladan lo mismo: el desplazamiento común es el
  // que cabe en el miembro más limitado, así los íconos quedan a idéntica altura en cada regreso.
  const grupos = new Map();
  lams.forEach(lam => {
    if (lam.offsetWidth <= lam.offsetHeight || lam.dataset.tipo !== 'pasos') return;
    const lz = lam.querySelector(':scope > .lienzo'), bloque = lz?.firstElementChild;
    if (!bloque || lz.dataset.anclar || bloque.querySelector('.tecla') || !bloque.querySelector('.fila, .fila-pasos')) return;
    // Solo los íconos de la fila (no la ✅ que cuelga en los regresos); el grupo se reconoce por sus etiquetas
    const iconos = [...bloque.querySelectorAll('.icono-paso .emo, .icono-paso img')].filter(e => e.getClientRects().length);
    if (!iconos.length) return;
    const H = lam.offsetHeight, m = H * .06, cajas = iconos.map(e => caja(e, lam)), B = caja(bloque, lam);
    const arriba = Math.min(...cajas.map(b => b.y));   // el borde SUPERIOR de los íconos al 32% del alto [ref_1040; prueba r5]
    const clave = [...bloque.querySelectorAll('.rotulo-paso')].map(e => e.textContent.trim()).join('|') || iconos.map(e => e.dataset.e || '').join('|');
    const g = grupos.get(clave) || { deseado: H * .32 - arriba, max: Infinity, min: -Infinity, miembros: [] };
    g.max = Math.min(g.max, H - m - (B.y + B.h)); g.min = Math.max(g.min, m - B.y); g.miembros.push(bloque);
    grupos.set(clave, g);
  });
  grupos.forEach(g => {
    const dy = Math.max(g.min, Math.min(g.deseado, g.max));
    if (Math.abs(dy) < 4) return;
    g.miembros.forEach(b => { const z = parseFloat(getComputedStyle(b).zoom) || 1; b.style.position = 'relative'; b.style.top = ((parseFloat(b.style.top) || 0) + dy / z) + 'px'; });
  });
}

