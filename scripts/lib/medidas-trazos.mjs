// Medidas autocontenidas para inyectar en Chromium. Solo revisa el paso visible, sin clones.
export function medidasTrazos(lam) {
  const errores = [], avisos = [];
  const visible = e => e && !e.closest('.clon, .pz-oculto, .oculto') && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().height>0;
  const buscar = id => [...lam.querySelectorAll(`[data-a="${CSS.escape(id)}"], [data-w="${CSS.escape(id)}"]`)].find(e => !e.closest('.clon'));
  const caja = e => e.getBoundingClientRect();
  const cruza = (a,b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const distancia = (a,b) => Math.hypot(Math.max(0,a.left-b.right,b.left-a.right),Math.max(0,a.top-b.bottom,b.top-a.bottom));
  const lienzo = caja(lam);
  const trazaCruza = (path,b) => {
    const matriz = path.getScreenCTM(); if (!matriz) return false;
    const longitud = path.getTotalLength(), total = Math.max(24,Math.ceil(longitud/5));
    for (let j=0;j<=total;j++) {
      const p = path.getPointAtLength(longitud*j/total).matrixTransform(matriz);
      if (p.x>b.left && p.x<b.right && p.y>b.top && p.y<b.bottom) return true;
    }
    return false;
  };
  const con = lam.querySelector(':scope > script.con');
  const conexiones = con ? JSON.parse(con.textContent) : [];
  conexiones.forEach(c => {
    for (const id of [c.de,c.a].filter(Boolean)) {
      const e = buscar(id);
      if (e && caja(e).height===0) avisos.push(`el ancla ${id} de una conexión mide 0 px de alto; ancla la conexión al texto o al ícono visible`);
    }
  });
  if (lam.dataset.tipo === 'flujo') lam.querySelectorAll('path[data-clase="flecha"]').forEach(f => {
    if (!visible(f) || ['retorno','arco','arco-negro'].includes(f.dataset.estilo)) return;
    const a = buscar(f.dataset.de), b = buscar(f.dataset.a); if (!a || !b) return;
    const A = caja(a), B = caja(b), F = caja(f), cy = (F.top+F.bottom)/2;
    if (lienzo.width > lienzo.height && A.height && B.height && (cy < Math.max(A.top,B.top)-4 || cy > Math.min(A.bottom,B.bottom)+4)) avisos.push('la flecha del flujo queda fuera de la banda vertical común de sus anclas; alinea los nodos y sus etiquetas');
    lam.querySelectorAll('.etiqueta,.encabezado').forEach(e => {
      if (!visible(e) || e.contains(a) || e.contains(b) || a.contains(e) || b.contains(e)) return;
      if (trazaCruza(f,caja(e))) avisos.push('la flecha del flujo cruza una etiqueta o encabezado ajeno; aumenta el espacio entre nodos');
      else if (e.matches('.encabezado') && distancia(F,caja(e))<40) avisos.push('la flecha del flujo queda a menos de 40 px del encabezado; separa el encabezado de la fila');
    });
  });
  lam.querySelectorAll('path[data-clase="ovalo"]').forEach(f => {
    if (!visible(f)) return;
    const propia = buscar(f.dataset.a); if (!propia) return;
    const obstaculos = [...lam.querySelectorAll('.emo,img')].filter(visible).map(caja);
    const walker = document.createTreeWalker(lam,NodeFilter.SHOW_TEXT);
    for (let nodo; (nodo=walker.nextNode());) {
      const e = nodo.parentElement; if (!nodo.textContent.trim() || !visible(e) || propia.contains(e) || e.closest('script,style,svg')) continue;
      // palabra por palabra y sin el interlineado: el rect de un nodo incluye el espacio final y la caja de línea, que no son tinta [r7]
      for (const m of nodo.textContent.matchAll(/\S+/g)) { const rango = document.createRange(); rango.setStart(nodo, m.index); rango.setEnd(nodo, m.index + m[0].length); obstaculos.push(...[...rango.getClientRects()].map(b => ({ left: b.left, right: b.right, top: b.top + b.height * .15, bottom: b.bottom - b.height * .15 }))); }
    }
    if (obstaculos.some(b => trazaCruza(f,b))) errores.push('el óvalo cruza otro renglón o un emoji; separa la cifra de los elementos vecinos');
  });
  conexiones.filter(c => c.estilo==='llave' && c.vertical).forEach(c => {
    const a=buscar(c.de), b=buscar(c.a), nota=buscar(c.via); if (!visible(nota) || !a || !b) return;
    const A=caja(a), B=caja(b), N=caja(nota);
    if (Math.min(A.right,B.right)<=Math.max(A.left,B.left) || Math.abs((A.left+A.right-B.left-B.right)/2)>Math.max(A.width,B.width)*.4) errores.push('las anclas de la llave no están en columna; elige dos renglones de la misma columna');
    if (N.left<lienzo.left || N.right>lienzo.right || N.top<lienzo.top || N.bottom>lienzo.bottom) errores.push('la nota de la llave se sale del lienzo; acórtala o deja espacio a la derecha');
  });
  lam.querySelectorAll('.mensajes-superpuestos .burbuja').forEach(e => {
    if (!visible(e)) return;
    const B=caja(e);
    if (lam.querySelector('.foto-contenido .t') && [...lam.querySelectorAll('.foto-contenido .t')].filter(visible).some(t => cruza(B,caja(t)))) errores.push('la burbuja tapa el texto de la foto; cambia mensajes_pos o separa la frase');
    if (lienzo.width>lienzo.height && parseFloat(getComputedStyle(e).fontSize)<48) errores.push('la burbuja sobre la imagen mide menos de 48 px; conserva el tamaño de lectura');
    lam.querySelectorAll('[data-circulo-img],[data-tachon-img]').forEach(im => {
      const I=caja(im), regiones = [...(im.dataset.circuloImg ? [im.dataset.circuloImg.split(',').map(Number)] : []),...(im.dataset.tachonImg ? JSON.parse(im.dataset.tachonImg) : [])];
      if (regiones.some(([x,y,w,h]) => cruza(B,{left:I.left+I.width*x/100,right:I.left+I.width*(x+w)/100,top:I.top+I.height*y/100,bottom:I.top+I.height*(y+h)/100}))) errores.push('la burbuja tapa el círculo o tachón de la captura; cambia mensajes_pos o la región marcada');
    });
  });
  lam.querySelectorAll('path[data-sin-espacio]').forEach(f => { if (visible(f)) avisos.push('el subrayado no tiene espacio entre renglones; separa las líneas o acorta la frase'); });
  return { errores:[...new Set(errores)], avisos:[...new Set(avisos)] };
}

// Polígono girado, no su caja exterior: evita falsos cruces de firma en las esquinas vacías.
export function avisosGeometriaSello(poligono, W, H, margen, firma, bloque, automatico) {
  const avisos = [];
  if (poligono.some(([, y]) => y > H - margen + 1)) avisos.push(`el sello invade la franja inferior de ${margen} px; súbelo o quita sello_pos para acomodarlo dentro del margen`);
  if (firma) {
    const rectangulo = [[firma.x,firma.y],[firma.x+firma.w,firma.y],[firma.x+firma.w,firma.y+firma.h],[firma.x,firma.y+firma.h]];
    const ejes = [...poligono, ...rectangulo].map((p,i) => { const figura = i < 4 ? poligono : rectangulo, q = figura[(i+1)%4]; return [-(q[1]-p[1]), q[0]-p[0]]; });
    const cruza = ejes.every(([x,y]) => {
      const a = poligono.map(p => p[0]*x+p[1]*y), b = rectangulo.map(p => p[0]*x+p[1]*y);
      return Math.max(...a) >= Math.min(...b) && Math.max(...b) >= Math.min(...a);
    });
    if (cruza) avisos.push('el sello cruza la firma; sepáralo de la firma o quita sello_pos para acomodarlo solo');
  }
  if (automatico && bloque) {
    const centro = poligono.reduce((s,p) => [s[0]+p[0]/4,s[1]+p[1]/4],[0,0]);
    // solo el desvío horizontal: centrado DEBAJO del bloque es el lugar preferido y queda lejos en vertical por diseño
    if (Math.abs(centro[0]-(bloque.x+bloque.w/2)) > .15*W) avisos.push('el sello acomodado solo queda corrido más del 15 % del ancho respecto al centro del bloque; acorta el sello o despeja espacio centrado debajo');
  }
  return avisos;
}
