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
  // R14: una burbuja carga una unidad de sentido. Tope de renglones para CUALQUIER longitud (≤ 4 en 9:16, ≤ 3 en 16:9);
  // un mensaje con varias ideas se parte en mensajes revelados por separado [juez r12: 8 renglones en un paso].
  if (lam.dataset.tipo === 'chat') {
    const tope = H > W ? 4 : 3;
    for (const e of lienzo.querySelectorAll('.chat:not(.chat-muro) .burbuja')) {
      if (!visible(e)) continue;
      const n = window.lineasPalabras(e).length;
      if (n > tope) avisos.push(`burbuja de ${n} renglones (tope ${tope} en ${H > W ? '9:16' : '16:9'}): divide el mensaje en varios mensajes revelados por separado, una idea por burbuja`);
    }
  }
  for (const t of lam.querySelectorAll(':scope > .capa-mano path[data-clase="llave"][data-forma="horizontal"]')) {
    if (!visible(t)) continue;
    const bb = t.getBBox();
    if (bb.height < 35) avisos.push(`llave plana (${bb.height.toFixed(0)} px de alto): reserva aire entre el grupo y su nota`);
    const pico = +t.dataset.pico;
    if (Number.isFinite(pico) && (pico < bb.x - 1 || pico > bb.x + bb.width + 1)) avisos.push('llave con pico fuera de sus brazos: la nota debe quedar bajo su propio grupo');
  }
  if (H > W && lam.dataset.tipo === 'tarjetas') {
    const textosT=[...lienzo.querySelectorAll('.tarjeta')].filter(visible).flatMap(t=>textos(t).map(q=>q.el));
    const minimo=textosT.length?Math.min(...textosT.map(e=>tam(e)/a1920)):null;
    medidas.tarjetas_letra_nativa=minimo;
    if(minimo!=null && minimo<60) avisos.push(`tarjetas 9:16 con letra de ${minimo.toFixed(0)} px (mínimo 60): con hasta tres tarjetas el bloque crece; con más, pártelas en dos láminas`);
  }
  // R13: ancho real de cada burbuja, no únicamente su contenedor.
  if (H > W && lam.dataset.tipo === 'chat') {
    const burbujas=[...lienzo.querySelectorAll('.chat:not(.chat-muro) > .msj > .burbuja')].filter(visible);
    medidas.burbujas_ancho_pct=burbujas.map(e=>caja(e).w/util*100);
    medidas.chat_letras=burbujas.map(tam);
    // R14: letra efectiva (con encaje) en px del propio lienzo vertical; bajo 64 la conversación no cabe en una lámina.
    const nativas=burbujas.map(e=>tam(e)/a1920);
    if(nativas.length && Math.min(...nativas)<64) avisos.push(`chat 9:16 con letra de ${Math.min(...nativas).toFixed(0)} px (mínimo 64): parte la conversación en dos láminas o acorta los mensajes; no la encojas para que quepa`);
    if(medidas.burbujas_ancho_pct.some(n=>n<82||n>86)) avisos.push('burbuja 9:16 fuera de 82–86% del ancho útil: amplía su ancho antes de reducir la letra');
  }
  if (lam.dataset.tipo==='lista') {
    const listas=[...lienzo.querySelectorAll('.lista')];
    const items=listas.flatMap(l=>[...l.children]);
    if(listas.length && listas.every(l=>l.children.length<=5) && items.every(e=>e.textContent.trim().split(/\s+/).length<=10)) {
      const cs=getComputedStyle(lienzo), alto=H-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
      medidas.lista_letra_px1920=Math.min(...items.map(tam));
      medidas.lista_alto_util_pct=caja(lienzo.firstElementChild).h/alto*100;
      if(medidas.lista_letra_px1920<64)avisos.push(`lista corta: renglón de ${medidas.lista_letra_px1920.toFixed(1)} px (mínimo 64 px a 1920); aumenta la letra antes de encoger`);
      if(medidas.lista_alto_util_pct<45)avisos.push(`lista corta: bloque ocupa ${medidas.lista_alto_util_pct.toFixed(1)}% del alto útil (mínimo 45%); aumenta letra y separación, centrando el conjunto`);
    }
    for(const col of lienzo.querySelectorAll('.contraste-col')) {
      if(col.querySelector('.contraste-titulo.tono-r') && [...col.querySelectorAll('.emo')].some(e=>visible(e)&&decodeURIComponent(e.dataset.e||'')==='✅'))avisos.push('columna roja con ✅ verde: usa una cruz o marca neutra acorde con la exclusión o cambio');
    }
  }
  const ctx=document.createElement('canvas').getContext('2d');ctx.font='400 84px Figtree';
  const base=ctx.measureText('x').actualBoundingBoxAscent;
  const principal=window.alturaPrincipal(lam)||base;
  // R14: el piso de altura de x es de la capa roja y de la cita protagonista; la nota gris, la
  // tabla-marcador y los rótulos de gráfica siguen el tamaño medido en la referencia.
  const conPiso=e=>!!e.closest('.anotacion, .nota.roja, [data-a="llave-et"], [data-a="cita"]');
  const enCaveat=[...new Set(textos(lam).map(q=>q.el).filter(e=>/Caveat/i.test(getComputedStyle(e).fontFamily)))];
  const manuscritos=enCaveat.filter(conPiso);
  for(const e of enCaveat.filter(e=>!conPiso(e)&&e.closest('.nota'))) {
    const n=tam(e);
    if(n<48)avisos.push(`nota gris en Caveat «${corto(e.textContent)}» de ${n.toFixed(1)} px a 1920 (mínimo 48 px; la referencia la mide en 64 px): reserva su espacio antes de encoger`);
  }
  medidas.caveat_x=manuscritos.map(e=>{
    const protagonista=!!e.closest('[data-a="cita"]'), minimo=protagonista?1:.75;
    const referencia=protagonista?base:principal, x=window.alturaX(e,lam), proporcion=x/referencia;
    if(proporcion<minimo)avisos.push(`Caveat «${corto(e.textContent)}»: altura x ${(100*proporcion).toFixed(1)}% (mínimo ${minimo*100}% del texto principal); amplía el contenido manuscrito`);
    return {texto:corto(e.textContent),proporcion,minimo,x,principal:referencia};
  });
  if(lam.dataset.vivo) {
    const items=[...lam.querySelectorAll('.vivo-items li,.vivo-consigna')].filter(visible);
    medidas.vivo_letra_px1920=items.length?Math.min(...items.map(tam)):null;
    if(items.length&&medidas.vivo_letra_px1920<64)avisos.push('consigna en vivo menor de 64 px a 1920: reduce el reloj antes que la instrucción');
  }
  if(W>H) {
    const elems=[...lam.querySelectorAll('.t,.item,.nota,.burbuja,.emo,.encabezado,.etiqueta,.anotacion,.vivo-consigna,.vivo-items,.vivo-reloj')]
      .filter(e=>visible(e)&&!e.closest('.firma,.escena.clon,.sangre,.cuadrantes'));
    const b=union(elems);
    if(b) {
      medidas.margen_superior_pct=b.y/H*100;medidas.margen_inferior_pct=(H-b.y-b.h)/H*100;
      if(b.y<H*.06-.5||b.y+b.h>H*.94+.5)avisos.push('contenido fuera del margen seguro de 6% arriba/abajo: reubica la anotación o reduce su espacio antes de acercar el bloque al borde');
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
  if(lam.dataset.tipo==='bifurcacion') {
    const origen=lienzo.querySelector('.pila > .nodo .emo');
    if(origen && visible(origen)) {
      medidas.bifurcacion_origen_px1920=caja(origen).w*a1920;
      if(medidas.bifurcacion_origen_px1920<170)avisos.push('bifurcación: origen menor de 170 px a 1920; amplía el ícono antes de encoger');
    }
    if(medidas.fila_rotulo_px1920!=null && medidas.fila_rotulo_px1920<64)avisos.push('bifurcación: rótulos menores de 64 px a 1920; aumenta la letra como texto principal');
  }
  for (const e of lam.querySelectorAll('.anotacion, .nota.roja')) {
    if (!visible(e)) continue;
    const n = tam(e);
    if (n < 46) errores.push(`anotación «${corto(e.textContent)}» de ${n.toFixed(1)} px a 1920 (mínimo 46 px): reubícala o pártela en dos renglones antes de encoger`);
    const principal = window.alturaPrincipal(lam), x = window.alturaX(e,lam);
    medidas.anotaciones_x ||= [];
    medidas.anotaciones_x.push({texto:corto(e.textContent),x,principal,proporcion:principal ? x/principal : null});
    if(principal && x/principal < .75) errores.push(`anotación «${corto(e.textContent)}»: altura x ${(100*x/principal).toFixed(1)}% del texto principal (mínimo 75%); aumenta Caveat y reserva espacio antes de encajar`);
    // R14: se admiten DOS renglones balanceados (2+ palabras cada uno); más, o un renglón de una palabra, es error.
    { const ls=window.lineasPalabras(e);
      if((e.dataset.llaveHasta || e.matches('.nota.roja')) && (ls.length>2 || (ls.length===2 && ls.some(l=>l.length<2)))) errores.push(`nota junto a llave «${corto(e.textContent)}» partida en ${ls.length} renglones: máximo dos balanceados de 2+ palabras; reserva su anchura real`); }
    // R14: una anotación no pisa texto (burbuja, renglón, ítem): caía encima del chat con el gancho sobre las letras
    { const bn=caja(e), pisa=[...lam.querySelectorAll('.burbuja, .t, .item, .etiqueta, .encabezado')].filter(x=>visible(x)&&!e.contains(x)&&!x.contains(e))
        .map(x=>{const b=caja(x);return Math.max(0,Math.min(bn.x+bn.w,b.x+b.w)-Math.max(bn.x,b.x))*Math.max(0,Math.min(bn.y+bn.h,b.y+b.h)-Math.max(bn.y,b.y));});
      const fr=Math.max(0,...pisa)/(bn.w*bn.h||1);
      const ancla0=lam.querySelector(`[data-a="${e.dataset.sobre}"]`), propia=ancla0?.closest('.burbuja')||ancla0;
      // R15: a menos de 16 px de una burbuja AJENA ya se lee encima (el juez midió 5 px con QA 100)
      const cerca=[...lam.querySelectorAll('.burbuja')].filter(x=>visible(x)&&x!==propia).map(x=>{const b=caja(x);return Math.hypot(Math.max(0,b.x-(bn.x+bn.w),bn.x-(b.x+b.w)),Math.max(0,b.y-(bn.y+bn.h),bn.y-(b.y+b.h)));});
      if(cerca.length && Math.min(...cerca)*a1920<16) errores.push(`anotación «${corto(e.textContent)}» a ${(Math.min(...cerca)*a1920).toFixed(0)} px de otra burbuja (mínimo 16): muévela al carril libre o debajo de su ancla`);
      if(fr>.08) errores.push(`anotación «${corto(e.textContent)}» pisa texto (${Math.round(fr*100)}% de su caja): el motor reserva carril en chats 16:9; acórtala o cámbiala de ancla`); }
    // R14: ni renglones de una palabra ni pegada al borde lateral [r13, clase 36: «Evita / publicar / un error»]
    const lineas=window.lineasPalabras(e), pal=lineas.flat().length;
    if(pal>=3 && lineas.length>1 && (lineas.length>3 || pal/lineas.length<2)) errores.push(`anotación «${corto(e.textContent)}» en renglones mínimos (${lineas.map(l=>l.length).join('/')} palabras): dale ancho para 1-3 renglones de 2+ palabras o muévela debajo`);
    const bx=caja(e), mh=W*.03;
    if(bx.x<mh-.5 || bx.x+bx.w>W-mh+.5) errores.push(`anotación «${corto(e.textContent)}» invade el margen horizontal (${(Math.min(bx.x,W-bx.x-bx.w)*a1920).toFixed(0)} px a 1920; mínimo ${(mh*a1920).toFixed(0)}): cámbiala de lado o debajo de su ancla`);
  }
  // R14: un sello sobre el emoji protagonista deja ver al menos la mitad del ícono [juez r14, propuesta 20].
  for (const se of lam.querySelectorAll(':scope > .sello[data-sobre]')) {
    if (!visible(se)) continue;
    const an = lam.querySelector(`[data-a="${se.dataset.sobre}"]`), emo = an && (an.matches('.emo') ? an : an.querySelector(':scope > .emo'));
    if (!emo || !visible(emo)) continue;
    const a = caja(emo), b = caja(se.querySelector('.sello-tinta') || se);
    const cubre = Math.max(0, Math.min(a.x+a.w, b.x+b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y+a.h, b.y+b.h) - Math.max(a.y, b.y)) / (a.w*a.h || 1);
    medidas.sello_cubre_emoji = +cubre.toFixed(2);
    if (cubre > .5) avisos.push(`el sello tapa ${Math.round(cubre*100)}% de su emoji (máximo 50%): móntalo en una esquina del ícono, no encima`);
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
  const punto = (p, t) => { const q = p.getPointAtLength(t), m = p.getScreenCTM(); return { x: (q.x*m.a+q.y*m.c+m.e-L.left)/escala, y: (q.x*m.b+q.y*m.d+m.f-L.top)/escala }; };
  for (const p of lam.querySelectorAll(':scope > .capa-mano path[data-clase="flecha"]')) {
    if (!visible(p) || !p.getTotalLength()) continue;
    // R14: el conector recto (flujo) va CENTRADO en el hueco entre sus dos anclas [c_1045]; no se le pide origen pegado.
    if (p.dataset.estilo === 'recta' && p.dataset.de && p.dataset.a) {
      const ea = lam.querySelector(`[data-a="${p.dataset.de}"]`), eb = lam.querySelector(`[data-a="${p.dataset.a}"]`);
      if (ea && eb) {
        const da = distancia(punto(p, 0), caja(ea)), db = distancia(punto(p, p.getTotalLength()), caja(eb));
        if (Math.min(da, db) > 0 && Math.max(da, db) / Math.min(da, db) > 1.5 && (Math.max(da, db) - Math.min(da, db)) * a1920 > 24) avisos.push(`flecha descentrada: ${(da*a1920).toFixed(0)} px del origen y ${(db*a1920).toFixed(0)} px del destino (máximo 1.5:1): va centrada en el hueco entre los dos elementos [c_1045]`);
        continue;
      }
    }
    const origen = punto(p, 0);
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
  const chats=medidas.flatMap(m=>m?.chat_letras||[]);
  if(chats.length && Math.max(...chats)/Math.min(...chats)>1.3+1e-6)avisos.push('chat: diferencia de escala mayor de 1.3× entre láminas; conserva una escala común en el deck');
  return avisos;
}
