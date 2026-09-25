/* R13: crecer antes de encoger. Las medidas se toman con todas las entradas
   presentes, para que el bloque no cambie de posición entre pasos. */
function ampliarListas(lam) {
  if (lam.dataset.tipo !== 'lista') return;
  const lz = lam.querySelector(':scope > .lienzo'), bloque = lz?.firstElementChild;
  const listas = [...(bloque?.querySelectorAll('.lista') || [])];
  if (!listas.length || listas.some(l => l.children.length > 5)) return;
  const items = listas.flatMap(l => [...l.children]);
  if (items.some(e => e.textContent.trim().split(/\s+/).length > 10)) return;
  const vertical = lam.offsetHeight > lam.offsetWidth;
  const cs = getComputedStyle(lz), alto = lz.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
  const contraste = bloque.querySelector('.contraste');
  if(contraste)contraste.dataset.filaCorta='2';
  if (contraste && !vertical) {
    // R14: la nota de la llave se queda bajo SU columna (su llave la señala desde ese grupo). Puede ser más ancha
    // que la columna: va en un renglón, centrada en ella, y centrarNotasContraste() la acota al margen seguro.
    contraste.querySelectorAll('.nota.roja').forEach(n => { Object.assign(n.style, { marginTop:'140px', whiteSpace:'nowrap', maxWidth:'none', width:'max-content', position:'relative', left:'50%', transform:'translateX(-50%)' }); });
    contraste.style.gap='100px';
  }
  if (!vertical) {
    // R14: UN tamaño por lista (antes cada renglón elegía 72 u 84 y el largo salía más chico que sus vecinos [demo 2]).
    listas.forEach(lista => { if (lista.dataset.tamExplicito) return; const propios=[...lista.children];
      const t=propios.some(e=>e.textContent.trim().length>30)?72:84; propios.forEach(e=>e.style.fontSize=t+'px'); });
    listas.filter(l=>!l.dataset.gapExplicito).forEach(l => l.style.setProperty('--gap-lista', items.length<=3 ? '110px' : '76px'));
    bloque.querySelectorAll('.encabezado').forEach(e=>e.style.fontSize='64px');
    bloque.querySelectorAll('.contraste-titulo').forEach(e=>e.style.fontSize='84px');
  }
  const objetivo = lam.offsetHeight*.5;
  const actual = bloque.getBoundingClientRect().height/escala(lam);
  if (actual < objetivo && listas[0].children.length>1 && !(listas[0].dataset.gapExplicito && actual/alto>=.45)) {
    const n = Math.max(...listas.map(l=>l.children.length));
    listas.forEach(l=>l.style.setProperty('--gap-lista',(parseFloat(getComputedStyle(l).gap)+(objetivo-actual)/(n-1))+'px'));
  }
  if (lz.dataset.anclar!=='arriba') {
    lz.style.justifyContent='center';
    if (!vertical) { lz.style.paddingTop='68px'; lz.style.paddingBottom='68px'; }
  }
}

// R14: la referencia manda. Solo la capa roja (anotación, nota roja, rótulo de llave) y la cita
// protagonista tienen piso de altura de x; la nota GRIS secundaria, la tabla-marcador y los rótulos
// de gráfica conservan el tamaño medido en el video (ref_115: nota gris de --t-nota bajo el titular).
const CAVEAT_CON_PISO = '.anotacion, .nota.roja, [data-a="llave-et"], [data-a="cita"]';
function ajustarCaveat(lam) {
  const ctx=document.createElement('canvas').getContext('2d');
  ctx.font="400 84px Figtree";
  const base=ctx.measureText('x').actualBoundingBoxAscent;
  const principal=alturaPrincipal(lam)||base;
  const notas=[...lam.querySelectorAll(CAVEAT_CON_PISO)].filter(e=>e.textContent.trim() && /Caveat/i.test(getComputedStyle(e).fontFamily) && !e.closest('.escena.clon'));
  notas.forEach(e=>{
    const protagonista=e.dataset.a==='cita';
    const objetivo=protagonista?base:principal*.76;
    const actual=alturaX(e,lam), tam=parseFloat(getComputedStyle(e).fontSize);
    if(actual<objetivo) { e.style.setProperty(e.matches('.nota')?'--tn':'font-size',Math.ceil(tam*objetivo/(actual||1)+1)+'px'); if(e.matches('.nota') && alturaX(e,lam)<objetivo)e.style.fontSize='var(--tn)'; }
  });
  // Cuando la nota del mapa gana un segundo renglón, cede el aire entre
  // teclas y titular. La letra conserva su ojo; el conjunto no crece hacia el borde.
  const titulo=lam.querySelector('.lz-pasos > .pila > .mt-t');
  const notaMapa=titulo?.nextElementSibling?.querySelector('.nota');
  if(lam.offsetWidth>lam.offsetHeight && notaMapa && rectsTexto(notaMapa,lam).length>1)titulo.style.marginTop='180px';
}

function ajustarConsigna(lam) {
  if(!lam.dataset.vivo)return;

  const bloque=lam.querySelector('.vivo-pres'), reloj=bloque?.querySelector('.vivo-reloj');
  if(!bloque)return;
  bloque.style.setProperty('--t-vivo','84px');
  bloque.style.gap='36px';
  // El reloj cede espacio antes que la instrucción que debe ejecutar el público.
  if(reloj)reloj.style.width='360px';
}

const PISO_CHAT_VERTICAL = 64;
function coherenciaChats(lams) {
  const escenas=lams.filter(l=>l.offsetHeight>l.offsetWidth && l.querySelector('.lz-chat > .pila > .chat:not(.chat-muro)'));
  const burbujas=l=>[...l.querySelectorAll('.lz-chat > .pila > .chat:not(.chat-muro) .msj .burbuja')];
  for(const l of escenas) {
    const bs=burbujas(l),chat=l.querySelector('.chat'),pila=chat.parentElement;
    const largo=bs.some(b=>b.textContent.trim().split(/\s+/).length>8);
    bs.forEach(b=>b.closest('.msj').classList.toggle('msj-ancho',largo));
    chat.style.gap=bs.some(b=>b.closest('.msj').classList.contains('msj-ancho'))?'64px':'160px';
    if(bs.length===1 && bs[0].textContent.trim().split(/\s+/).length>8)bs[0].style.fontSize='100px';
    const alto=l.offsetHeight-640;
    // R14: piso de 64 px. Sin piso, un chat de tres mensajes con los avatares encima bajaba la letra a ~36 px y la
    // coherencia de escala arrastraba a TODOS los chats del reel [r14, reel del descuento]. Si no cabe en el piso, QA
    // pide partir la conversación en dos láminas: el motor no la vuelve ilegible para que quepa.
    for(let n=0;n<25 && pila.getBoundingClientRect().height/escala(l)>alto;n++) {
      let bajo=false;
      bs.forEach(b=>{const t=parseFloat(getComputedStyle(b).fontSize); if(t*.96>=PISO_CHAT_VERTICAL){b.style.fontSize=(t*.96)+'px'; bajo=true;}});
      if(!bajo)break;
    }
  }
  const chats=escenas.flatMap(burbujas);
  if(!chats.length)return;
  const minimo=Math.min(...chats.map(b=>parseFloat(getComputedStyle(b).fontSize)));
  chats.forEach(b=>{if(parseFloat(getComputedStyle(b).fontSize)>minimo*1.3)b.style.fontSize=(minimo*1.3)+'px';});
}

function respetarMargen(lam) {
  if(lam.offsetHeight>lam.offsetWidth||lam.dataset.vivo)return;
  const lz=lam.querySelector(':scope > .lienzo'), bloque=lz?.firstElementChild;
  if(!bloque||bloque.matches('.sangre,.cuadrantes'))return;
  const r=caja(bloque,lam),m=lam.offsetHeight*.06+1;
  const dy=r.y<m?m-r.y:r.y+r.h>lam.offsetHeight-m?lam.offsetHeight-m-r.y-r.h:0;
  if(dy){bloque.style.position='relative';bloque.style.top=((parseFloat(bloque.style.top)||0)+dy/(parseFloat(getComputedStyle(bloque).zoom)||1))+'px';}
}

// R14: la nota de una llave de columnas no se sale del lienzo: si su centro sobre la columna la empuja más allá del
// margen, se corre lo justo hacia adentro (la llave apunta a su centro real y su pico se acota entre los brazos).
function centrarNotasContraste(lam) {
  // Corre ANTES de encajar (contra el relleno del lienzo: la nota no obliga a encoger las columnas) y después (margen).
  const lz=lam.querySelector(':scope > .lienzo'), W=lam.offsetWidth;
  const m=Math.max(W*.03, lz ? parseFloat(getComputedStyle(lz).paddingLeft)||0 : 0);
  lam.querySelectorAll('.contraste .nota.roja').forEach(n=>{
    const b=caja(n,lam), z=parseFloat(getComputedStyle(n.closest('.lienzo > *')||n).zoom)||1;
    const dx=b.x<m?m-b.x:b.x+b.w>W-m?W-m-b.x-b.w:0;
    if(dx) n.style.marginLeft=((parseFloat(n.style.marginLeft)||0)+dx/z)+'px';
  });
}

// R14 [juez r14]: un chat 16:9 con anotaciones no dejaba sitio a la nota (las burbujas llenaban el alto y la nota caía
// encima, con el gancho cruzando el texto). Antes de encajar se reserva un carril lateral: el chat se angosta al 58% del
// ancho y se corre a la izquierda; la nota va a la derecha de su burbuja.
function reservarCarrilChat(lam) {
  if (lam.offsetWidth <= lam.offsetHeight || lam.dataset.tipo !== 'chat') return;
  // R15 [juez r15]: se respeta el `lado` del autor. Una nota «abajo»/«arriba» nunca pide carril (antes se forzaba a la
  // derecha y la clase de 60 láminas cayó de 97 a 70). Solo se reserva si la nota va a un costado y, medida a su ancho
  // natural, NO cabe junto a su burbuja con el aire del gancho.
  const W = lam.offsetWidth, m = Math.max(40, lam.offsetHeight * .06), aire = 130;
  const notas = [...lam.querySelectorAll(':scope > .anotacion[data-sobre]')].filter(n => !n.dataset.llaveHasta && !n.dataset.fija
    && (!n.dataset.lado || n.dataset.lado === 'derecha' || n.dataset.lado === 'izquierda'));
  const lz = lam.querySelector(':scope > .lienzo'), chat = lz?.querySelector('.chat');
  if (!notas.length || !chat) return;
  const necesita = notas.some(n => {
    const el = ancla(lam, n.dataset.sobre); if (!el) return false;
    const A = caja(el.closest('.burbuja') || el, lam), ancho = Math.min(n.scrollWidth || n.offsetWidth, 760);
    const lado = n.dataset.lado || 'derecha';
    return lado === 'derecha' ? W - m - (A.x + A.w) - aire < ancho : A.x - m - aire < ancho;
  });
  if (!necesita) return;
  // Ancho del carril a la medida de la nota más ancha (con su gancho); el chat queda entre 45 y 62% del ancho.
  const izq = Math.round(W * .06), notaMax = Math.max(...notas.map(n => Math.min(n.scrollWidth || n.offsetWidth, 760)));
  const anchoChat = Math.round(Math.max(W * .45, Math.min(W * .62, W - m - izq - aire - notaMax - 20)));
  chat.style.maxWidth = anchoChat + 'px'; chat.style.width = anchoChat + 'px';
  lz.style.alignItems = 'flex-start'; lz.style.paddingLeft = izq + 'px';
  notas.forEach(n => { n.dataset.lado = 'derecha'; });
  // Más angosto, una burbuja podía pasar el tope de 3 renglones: la letra baja de 4 en 4 hasta 64 px antes de romperlo.
  const bs = [...chat.querySelectorAll('.burbuja')];
  for (let t = 80; t >= 64 && bs.some(b => rectsTexto(b, lam).length > 3); t -= 4)
    bs.forEach(b => { if (parseFloat(getComputedStyle(b).fontSize) > t) b.style.fontSize = t + 'px'; });
}

