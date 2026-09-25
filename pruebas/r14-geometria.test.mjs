import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { medidasR11 } from '../scripts/lib/medidas-r11.mjs';
async function pagina(t,laminas,formato='16:9') {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pz-r14-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify({marca:false,emoji:'apple',formato,laminas}));
 const prep=prepararSalida(dir); let b;
 try {b=await abrir(prep.htmlPath,prep.W,prep.H);} catch(e){if(e.code!=='SIN_NAVEGADOR')throw e;t.skip(e.motivo);return null;}
 t.after(()=>b.browser.close());
 await b.page.addScriptTag({content:inyectable()+`;window.medidasR11=${medidasR11.toString()};`});
 return b.page;
}
test('r14: nota gris secundaria no se infla (banda medida 56–64 px); cita conserva x protagonista',async t=>{
 const p=await pagina(t,[{tipo:'pasos',clic:1,texto:'Tres pasos para comenzar',nota:'Una nota secundaria cabe en un renglón'},{tipo:'cita',emoji:'💬',texto:'Una petición que deja elegir'}]);if(!p)return;
 const r=await p.evaluate(()=>window.PZ.lams.map(l=>({tam:parseFloat(getComputedStyle(l.querySelector('.nota')).fontSize),q:window.medidasR11(l)})));
 // ref_115: la nota gris va a --t-nota (64) o al 60 del mapa calibrado en la ronda 12; nunca inflada.
 assert.ok(r[0].tam>=56&&r[0].tam<=64,JSON.stringify(r[0]));assert.ok(r[1].q.medidas.caveat_x.every(x=>x.proporcion>=1));
});
test('r14: burbujas de cualquier longitud tienen tope de 4 vertical / 3 horizontal',async t=>{
 for(const formato of ['9:16','16:9']) {
  const p=await pagina(t,[{tipo:'chat',mensajes:[{de:'yo',texto:'Primera idea completa\nSegunda idea completa\nTercera idea completa\nCuarta idea completa\nQuinta idea completa'}]}],formato);if(!p)return;
  const q=await p.evaluate(()=>window.medidasR11(window.PZ.lams[0]));
  assert.ok(q.avisos.some(a=>/burbuja.*renglones.*divide/.test(a)),JSON.stringify(q));
 }
});
test('r14: anotación sin renglones de dos palabras ni margen invadido',async t=>{
 const p=await pagina(t,[{tipo:'chat',mensajes:[{de:'yo',texto:'Confirma el texto antes de publicarlo.'}],anotaciones:[{a:'m0',texto:'Evita publicar un error',lado:'derecha'}]}]);if(!p)return;
 const q=await p.evaluate(()=>{const l=window.PZ.lams[0],n=l.querySelector('.anotacion');const bien=window.medidasR11(l);n.style.maxWidth='160px';n.style.left='1780px';return {bien,mal:window.medidasR11(l),lineas:window.lineasPalabras(n)};});
 assert.ok(!q.bien.errores.some(a=>/renglones mínimos|margen horizontal/.test(a)),JSON.stringify(q));
 assert.ok(q.mal.errores.some(a=>/renglones mínimos/.test(a)),JSON.stringify(q));
 assert.ok(q.mal.errores.some(a=>/margen horizontal/.test(a)),JSON.stringify(q));
});
test('r14: columnas conservan llave simétrica bajo su propio grupo',async t=>{
 const p=await pagina(t,[{tipo:'lista',columnas:[{titulo:'Incluye:',items:['Una página','Una revisión']},{titulo:'No incluye:',items:['Otra página','Otra revisión'],llave:'Se cotizan por separado'}]}]);if(!p)return;
 const q=await p.evaluate(()=>{const l=window.PZ.lams[0];return {q:window.medidasR11(l),trazos:[...l.querySelectorAll('[data-clase="llave"]')].map(e=>e.getBBox().height)};});
 assert.ok(q.trazos.length>=2,JSON.stringify(q));assert.ok(q.trazos.every(h=>h>35),JSON.stringify(q));
 assert.ok(!q.q.avisos.some(a=>/llave.*(plana|pico)/.test(a)),JSON.stringify(q));
});
test('r14: una lista corta usa UN tamaño de letra para todos sus renglones',async t=>{
 const p=await pagina(t,[{tipo:'lista',encabezado:'Sin:',vineta:'x',items:['Pasar años trabajando **12 horas al día**','**Construir** una audiencia','**Mostrar** tu cara en redes']}]);if(!p)return;
 const tams=await p.evaluate(()=>[...window.PZ.lams[0].querySelectorAll('.lista > *')].map(e=>parseFloat(getComputedStyle(e).fontSize)));
 assert.equal(new Set(tams).size,1,JSON.stringify(tams));
});
test('r14: el chat vertical no se encoge bajo 64 px ni arrastra a los demás chats; si no cabe, QA pide partirlo',async t=>{
 const p=await pagina(t,[
  {tipo:'chat',mensajes:[{de:'otro',texto:'¿Me lo dejas más barato?'}]},
  {tipo:'chat',encabezado:'Le escribes:',mensajes:[{de:'yo',texto:'¿Qué ajustamos: el precio o lo que incluye?'},{de:'otro',texto:'Solo necesito 2 de las 3 piezas.'},{de:'yo',texto:'Entonces son 2 piezas y te las entrego el viernes por la tarde.'}]},
 ],'9:16');if(!p)return;
 const r=await p.evaluate(()=>window.PZ.lams.map(l=>({tams:[...l.querySelectorAll('.burbuja')].map(b=>parseFloat(getComputedStyle(b).fontSize)),q:window.medidasR11(l)})));
 assert.ok(r.every(x=>x.tams.every(t=>t>=64)),JSON.stringify(r.map(x=>x.tams)));
 const alto=r[1].q.medidas.chat_letras?.length;
 assert.ok(alto,'mide las burbujas del chat alto');
 // si el encaje igual lo reduce, el aviso lo dice; si no, la letra efectiva queda en el piso o arriba
 const efectiva=Math.min(...r[1].q.medidas.chat_letras)/(1920/1080);
 assert.ok(efectiva>=64 || r[1].q.avisos.some(a=>/parte la conversación/.test(a)),JSON.stringify(r[1].q));
});
test('r14: en 9:16 hasta tres tarjetas crecen por ocupación y QA avisa si quedan chicas',async t=>{
 const p=await pagina(t,[{tipo:'tarjetas',items:[{emoji:'📅',texto:'Pagar hoy: **asegura tu fecha**'},{emoji:'💵',texto:'Efectivo o transferencia: **sin descuento**'}]}],'9:16');if(!p)return;
 const r=await p.evaluate(()=>{const l=window.PZ.lams[0];const bien=window.medidasR11(l);l.querySelector(':scope > .lienzo').firstElementChild.style.zoom='.6';return {bien,mal:window.medidasR11(l)};});
 assert.ok(r.bien.medidas.tarjetas_letra_nativa>=60,JSON.stringify(r.bien.medidas));
 assert.ok(r.mal.avisos.some(a=>/tarjetas 9:16/.test(a)),JSON.stringify(r.mal.avisos));
});
test('r14: el sello usa cifras alineadas (el 0 no se lee como «o»)',async t=>{
 const p=await pagina(t,[{tipo:'idea',emoji:'⭐',texto:'Tu negocio en Google',sello:'0 RESEÑAS'}]);if(!p)return;
 const r=await p.evaluate(()=>{const s=window.PZ.lams[0].querySelector('.sello-tinta');const c=getComputedStyle(s);return {num:c.fontVariantNumeric,
   // alto del 0 contra la O mayúscula en la misma letra: con cifras antiguas el 0 mide ~70% de la O
   rel:(()=>{const ctx=document.createElement('canvas').getContext('2d');ctx.font=`${c.fontWeight} 104px ${c.fontFamily}`;ctx.fontVariantNumeric='lining-nums';return null;})()};});
 assert.match(r.num,/lining-nums/,JSON.stringify(r));
});
test('r14: el conector recto del flujo queda centrado en el hueco entre sus emojis [c_1045]',async t=>{
 const p=await pagina(t,[{tipo:'flujo',nodos:[{emoji:'🕵️',etiqueta:'Identificar'},{emoji:'🤝',etiqueta:'Aliarte'}]}]);if(!p)return;
 const r=await p.evaluate(()=>{const l=window.PZ.lams[0];window.PZ.mostrar(l,99,Infinity);const q=window.medidasR11(l);
   const f=l.querySelector('.capa-mano path[data-clase="flecha"]'),L=l.getBoundingClientRect(),s=L.width/l.offsetWidth;
   const pt=t=>{const a=f.getPointAtLength(t),m=f.getScreenCTM();return (a.x*m.a+a.y*m.c+m.e-L.left)/s;};
   const ea=l.querySelector(`[data-a="${f.dataset.de}"]`).getBoundingClientRect(),eb=l.querySelector(`[data-a="${f.dataset.a}"]`).getBoundingClientRect();
   return {avisos:q.avisos,izq:pt(0)-(ea.right-L.left)/s,der:(eb.left-L.left)/s-pt(f.getTotalLength())};});
 assert.ok(Math.max(r.izq,r.der)/Math.min(r.izq,r.der)<=1.5,JSON.stringify(r));
 assert.ok(!r.avisos.some(a=>/flecha (huérfana|descentrada)/.test(a)),JSON.stringify(r.avisos));
});
test('r14: el óvalo en línea encierra las cuatro esquinas de su texto (no corta el primer ni el último glifo)',async t=>{
 const p=await pagina(t,[{tipo:'cifra',lineas:[{texto:'Costo actual: $8,000 al mes',tam:'64px'},{texto:'Inversión: (($6,000 MXN))',tam:'120px',peso:800}]}]);if(!p)return;
 const r=await p.evaluate(()=>{const l=window.PZ.lams[0];window.PZ.mostrar(l,99,Infinity);
   const o=l.querySelector('.capa-mano path[data-clase="ovalo"]'),t=l.querySelector('b.circ[data-circulo="linea"]');if(!o||!t)return {falta:true};
   const b=t.getBoundingClientRect(),inv=o.getScreenCTM().inverse();
   return [[b.left,b.top],[b.right,b.top],[b.left,b.bottom],[b.right,b.bottom]].map(([x,y])=>{const q=new DOMPoint(x,y).matrixTransform(inv);return o.isPointInFill(q);});});
 assert.ok(Array.isArray(r)&&r.every(Boolean),JSON.stringify(r));
});
test('r14: un sello sobre el emoji protagonista deja ver al menos la mitad del ícono',async t=>{
 const p=await pagina(t,[{tipo:'idea',emoji:'🛡️',texto:'Si en 14 días falta el tablero',nota:'Garantía: devolvemos el primer pago',sello:'Por escrito',sello_sobre:'emoji',sello_paso:1}]);if(!p)return;
 const q=await p.evaluate(()=>{const l=window.PZ.lams[0];window.PZ.mostrar(l,99,Infinity);return window.medidasR11(l);});
 assert.ok(q.medidas.sello_cubre_emoji!=null && q.medidas.sello_cubre_emoji<=.5,JSON.stringify(q.medidas));
 assert.ok(!q.avisos.some(a=>/sello tapa/.test(a)),JSON.stringify(q.avisos));
});
test('r14: un chat 16:9 con anotación reserva carril y la nota no pisa texto',async t=>{
 const p=await pagina(t,[{tipo:'chat',mensajes:[{de:'yo',texto:'¡Qué bueno que [lo que hiciste] quedó como querías!'},{de:'yo',texto:'¿Me dejas una reseña en Google? Aquí está el enlace: [enlace]'}],anotaciones:[{a:'m0',texto:'Así no suena masivo',lado:'derecha'}]}]);if(!p)return;
 const q=await p.evaluate(()=>{const l=window.PZ.lams[0];window.PZ.mostrar(l,99,Infinity);return window.medidasR11(l);});
 assert.ok(!q.errores.some(e=>/pisa texto|margen horizontal|renglones mínimos/.test(e)),JSON.stringify(q.errores));
 assert.ok(!q.avisos.some(a=>/burbuja de \d+ renglones/.test(a)),JSON.stringify(q.avisos));
});
