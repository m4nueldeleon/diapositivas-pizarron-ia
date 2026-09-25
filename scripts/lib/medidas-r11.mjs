// Geometría editorial ejecutada dentro de Chromium, antes de la primera captura.
// Autocontenida para inyectar la MISMA regla en QA y sus regresiones.
export function medidasR11(lam) {
  const errores = [], avisos = [], medidas = {};
  const L = lam.getBoundingClientRect(), W = lam.offsetWidth, H = lam.offsetHeight;
  const escala = L.width / W, a1920 = 1920 / W;
  const lienzo = lam.querySelector(':scope > .lienzo');
  if (!lienzo) return { errores, avisos, medidas };
  const util = W - parseFloat(getComputedStyle(lienzo).paddingLeft) - parseFloat(getComputedStyle(lienzo).paddingRight);
  const caja = e => { const b = e.getBoundingClientRect(); return { x: (b.left-L.left)/escala, y: (b.top-L.top)/escala, w: b.width/escala, h: b.height/escala }; };
  const visible = e => {
    if (e.closest('.oculto, .pz-oculto, .escena.clon, script, style')) return false;
    for (let a = e; a && a !== lam.parentElement; a = a.parentElement) {
      const c = getComputedStyle(a);
      if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false;
    }
    return e.getClientRects().length > 0;
  };
  const tam = e => {
    let z = 1;
    for (let a = e; a && a !== lam.parentElement; a = a.parentElement) {
      const c = getComputedStyle(a); z *= parseFloat(c.zoom) || 1;
      if (c.transform !== 'none') { const m = new DOMMatrix(c.transform); z *= Math.hypot(m.a,m.b); }
    }
    return parseFloat(getComputedStyle(e).fontSize) * z * a1920 / escala;
  };
  const textos = raiz => {
    const out = [], it = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n; (n = it.nextNode());) {
      const el = n.parentElement;
      if (!/\S/.test(n.nodeValue) || !visible(el) || el.closest('.firma, .sufijo, .emo, .cursor, script, style')) continue;
      out.push({ el, texto: n.nodeValue.trim() });
    }
    return out;
  };
  const union = elementos => {
    const bs = elementos.map(caja).filter(b => b.w && b.h);
    if (!bs.length) return null;
    const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
    return { x, y, w: Math.max(...bs.map(b => b.x+b.w))-x, h: Math.max(...bs.map(b => b.y+b.h))-y };
  };
  const corto = s => s.replace(/\s+/g,' ').slice(0,48);

  if (H > W && lam.dataset.tipo === 'chat') {
    const chat = lienzo.querySelector('.chat');
    if (chat) {
      const porcentaje = caja(chat).w / util * 100;
      medidas.chat_ancho_pct = +porcentaje.toFixed(1);
      if (porcentaje < 70) avisos.push(`chat 9:16 ocupa ${porcentaje.toFixed(1)}% del ancho útil (mínimo 70%): amplía el bloque sin invadir avatar ni margen seguro`);
    }
    for (const e of lienzo.querySelectorAll('.burbuja')) {
      if (!visible(e)) continue;
      const lineas = window.lineasPalabras(e), palabras = lineas.flat().length;
      if (palabras > 0 && palabras <= 8 && lineas.length > 2) avisos.push(`burbuja de ${palabras} palabras ocupa ${lineas.length} renglones (máximo 2): amplía la burbuja hasta 82–86% del ancho útil`);
    }
  }
  const lista = lienzo.querySelector('.lista');
  if (lam.dataset.tipo === 'lista' && lista && lista.querySelectorAll(':scope > .item').length <= 5) {
    // El contenedor reserva TODOS los pasos: una lista no salta mientras se revela.
    const bloque = lienzo.firstElementChild, b = caja(bloque), centro = (b.y + b.h/2) / H * 100;
    medidas.lista_centro_pct = +centro.toFixed(1);
    medidas.lista_anclaje = lienzo.dataset.anclar === 'arriba' ? 'arriba-explicito' : 'centro';
    if (lienzo.dataset.anclar !== 'arriba' && (centro < 40 || centro > 58)) avisos.push(`lista corta: centro del bloque al ${centro.toFixed(1)}% del alto (40–58%): centra el bloque completo; anclar arriba requiere una continuación explícita`);
  }

  const tiposFila = ['pasos','flujo','rejilla','bifurcacion','opciones','circulos'];
  const contraste = lam.dataset.tipo === 'lista' && lienzo.querySelector('.contraste');
  if (tiposFila.includes(lam.dataset.tipo) || contraste) {
    const t = lam.dataset.tipo;
    const sel = { pasos: '.fila-pasos > *, .lz-pasos > .pila > .fila > *', flujo: '.fila-flujo > .nodo',
      rejilla: '.rejilla > *', bifurcacion: '.fila > .nodo', opciones: '.opcion', circulos: '.emo', lista: '.contraste > .contraste-col' }[t];
    const items = [...lienzo.querySelectorAll(sel)];
    // En círculos la composición es el par de anillos, no la unión de personas
    // repartidas dentro: esa unión cambia de ancho sin que cambie el diagrama.
    const anillos = t === 'circulos' ? lienzo.querySelector('[data-composicion-circulos]') : null;
    const cantidad = items.length;
    if (cantidad >= 2 && cantidad <= 4) {
      const b = anillos ? caja(anillos) : union(items), pct = b ? b.w / util * 100 : 0;
      medidas.fila_ancho_pct = +pct.toFixed(1);
      const flujo = t === 'flujo' ? lienzo.querySelector('.fila-flujo') : null;
      const columna = flujo && getComputedStyle(flujo).flexDirection === 'column';
      medidas.fila_orientacion = columna ? 'columna' : 'fila';
      if (!columna && pct < 50) avisos.push(`fila de ${cantidad} elementos ocupa ${pct.toFixed(1)}% del ancho útil (mínimo 50%): aumenta su escala y céntrala como bloque`);
      const rotulos = [...lienzo.querySelectorAll('.rotulo-paso, .etiqueta, .opcion > span, .contraste-titulo, .contraste-col .item')].filter(visible);
      const minimo = rotulos.length ? Math.min(...rotulos.map(tam)) : null;
      medidas.fila_rotulo_px1920 = minimo == null ? null : +minimo.toFixed(1);
      if (minimo != null && minimo < 60) avisos.push(`fila corta: rótulo de ${minimo.toFixed(1)} px a 1920 (mínimo 60 px): aumenta la tipografía antes de encoger el conjunto`);
    }
  }
  for (const e of lam.querySelectorAll('.anotacion, .nota.roja')) {
    if (!visible(e)) continue;
    const n = tam(e);
    if (n < 46) errores.push(`anotación «${corto(e.textContent)}» de ${n.toFixed(1)} px a 1920 (mínimo 46 px): reubícala o pártela en dos renglones antes de encoger`);
    const principal = window.alturaPrincipal(lam), x = window.alturaX(e,lam);
    medidas.anotaciones_x ||= [];
    medidas.anotaciones_x.push({texto:corto(e.textContent),x,principal,proporcion:principal ? x/principal : null});
    if(principal && x/principal < .75) errores.push(`anotación «${corto(e.textContent)}»: altura x ${(100*x/principal).toFixed(1)}% del texto principal (mínimo 75%); aumenta Caveat y reserva espacio antes de encajar`);
    if((e.dataset.llaveHasta || e.matches('.nota.roja')) && window.lineasPalabras(e).length>1) errores.push(`nota junto a llave «${corto(e.textContent)}» partida: mantenla en un renglón y reserva su anchura real`);
  }
  medidas.principal_x = window.alturaPrincipal(lam)*a1920;
  medidas.tipo = lam.dataset.tipo;
  for(const nodo of lienzo.querySelectorAll('.fila-flujo .nodo')) {
    if(nodo.querySelector('.emo,img') || !visible(nodo))continue;
    const et=nodo.querySelector('.etiqueta');
    if(et && tam(et)<72) avisos.push(`nodo sin emoji «${corto(et.textContent)}»: texto principal de ${tam(et).toFixed(1)} px a 1920 (mínimo 72 px)`);
  }
  const pequenos = textos(lam).filter(q => tam(q.el) < 30);
  if (pequenos.length) avisos.push(`texto visible menor de 30 px a 1920: ${[...new Set(pequenos.map(q => `«${corto(q.texto)}» (${tam(q.el).toFixed(1)} px)`))].join(', ')}; aumenta su tamaño (solo firma y sufijos están exentos)`);
  medidas.documentos_svg = [];
  for (const img of lam.querySelectorAll('img[data-documento-svg]')) {
    if (!visible(img)) continue;
    if (img.dataset.documentoError) { avisos.push(`documento SVG sin medir: ${img.dataset.documentoError}; simplifica el SVG o revisa su texto visualmente`); continue; }
    if (!img.dataset.documentoMedidas) { avisos.push('documento SVG sin medidas de texto; ejecuta la preparación antes de capturar'); continue; }
    const d = JSON.parse(img.dataset.documentoMedidas), b = caja(img);
    const escalaSvg = (d.estirar ? b.h/d.alto : Math.min(b.w/d.ancho,b.h/d.alto)) * a1920;
    const medidos = d.textos.map(t => ({ texto:t.texto, px1920:t.tam*escalaSvg }));
    medidas.documentos_svg.push({ textos:medidos, alto:b.h, ancho:b.w });
    const min = Math.min(...medidos.map(t => t.px1920));
    if (min < 44) avisos.push(`cuerpo de documento SVG de ${min.toFixed(1)} px a 1920 (mínimo 44 px): amplía la tarjeta o separa su contenido antes de encoger`);
    if (min < 30) avisos.push(`texto visible dentro del documento SVG menor de 30 px a 1920: ${medidos.filter(t => t.px1920<30).map(t => `«${corto(t.texto)}» (${t.px1920.toFixed(1)} px)`).join(', ')}; aumenta la imagen o reduce su contenido`);
  }

  const candidatos = [...lam.querySelectorAll('.emo, .t, .burbuja, .nota, .etiqueta, .item, .tecla, .tarjeta, .opcion, .captura, .cuadro, img, [data-a], [data-w]')]
    .filter(e => visible(e) && !e.closest('.capa-mano, .firma') && !e.matches('.lienzo, .lamina'));
  const distancia = (p,b) => {
    const dx = Math.max(b.x-p.x, 0, p.x-b.x-b.w), dy = Math.max(b.y-p.y, 0, p.y-b.y-b.h);
    return dx || dy ? Math.hypot(dx,dy) : Math.min(p.x-b.x,b.x+b.w-p.x,p.y-b.y,b.y+b.h-p.y);
  };
  for (const p of lam.querySelectorAll(':scope > .capa-mano path[data-clase="flecha"]')) {
    if (!visible(p) || !p.getTotalLength()) continue;
    const q = p.getPointAtLength(0), m = p.getScreenCTM();
    const origen = { x: (q.x*m.a+q.y*m.c+m.e-L.left)/escala, y: (q.x*m.b+q.y*m.d+m.f-L.top)/escala };
    const d = Math.min(...candidatos.map(e => distancia(origen,caja(e)))) * a1920;
    if (d > 24) avisos.push(`flecha huérfana: inicio a ${Number.isFinite(d) ? d.toFixed(1) : 'más de 24'} px del contorno más cercano (máximo 24 px a 1920): ánclala al borde del origen u omítela`);
  }
  return { errores, avisos, medidas };
}

export function saltosEscala(medidas) {
  const avisos=[], diagramas=new Set(['pasos','flujo','bifurcacion','circulos']);
  for(let i=1;i<medidas.length;i++) {
    const a=medidas[i-1],b=medidas[i]; if(!a?.principal_x||!b?.principal_x)continue;
    const menor=a.principal_x<b.principal_x?a:b,ratio=Math.max(a.principal_x,b.principal_x)/menor.principal_x;
    if(diagramas.has(menor.tipo)&&ratio>1.8) avisos.push(`salto de escala entre láminas ${i} y ${i+1}: texto principal ${ratio.toFixed(2)}×; amplía el diagrama o revisa la jerarquía contigua`);
  }
  return avisos;
}
