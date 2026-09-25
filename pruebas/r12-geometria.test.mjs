import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { medidasR11, saltosEscala } from '../scripts/lib/medidas-r11.mjs';

async function pagina(t,laminas,formato='16:9') {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pz-r12-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify({marca:false,emoji:'apple',formato,laminas}));
  const p=prepararSalida(dir);
  let b;
  try { b=await abrir(p.htmlPath,p.W,p.H); }
  catch(e) { if(e.code!=='SIN_NAVEGADOR') throw e; t.skip(e.motivo); return null; }
  t.after(()=>b.browser.close());
  await b.page.addScriptTag({content:inyectable()});
  await b.page.addScriptTag({content:`window.medidasR11=${medidasR11.toString()}`});
  return b.page;
}

test('r12: cada rectángulo de una palabra cuenta y QA distingue renglones de negritas', async t=>{
  const p=await pagina(t,[{tipo:'idea',texto:'Una entrega'}]); if(!p)return;
  const q=await p.evaluate(()=>{
    const l=window.PZ.lams[0],e=l.querySelector('.t');
    e.innerHTML='<span style="overflow-wrap:anywhere;word-break:break-all">devoluciones</span>'; e.style.cssText='font-size:104px;width:290px;overflow-wrap:anywhere;word-break:break-all';
    const lineas=window.lineasPalabras(e);
    const partidas=window.palabrasPartidas?.(l);
    e.innerHTML='devolu<b>ciones</b>'; const unida=window.palabrasPartidas?.(l);
    e.style.width='1500px'; const bien=window.palabrasPartidas?.(l);
    return {lineas,partidas,unida,bien};
  });
  assert.ok(q.lineas.length>1,JSON.stringify(q));
  assert.ok(q.partidas?.some(x=>x.palabra==='devoluciones'),JSON.stringify(q));
  assert.ok(q.unida?.some(x=>x.palabra==='devoluciones'),JSON.stringify(q));
  assert.deepEqual(q.bien,[]);
});

test('r12: burbuja vertical ajusta la palabra más larga sin partir ni desbordar',async t=>{
  const p=await pagina(t,[{tipo:'chat',tam_texto:'104px',mensajes:[{de:'yo',texto:'Confirma **devolu**ciones.'}]}],'9:16'); if(!p)return;
  const q=await p.evaluate(()=>{
    const b=document.querySelector('.burbuja'),r=b.getBoundingClientRect(),rg=document.createRange();rg.selectNodeContents(b);
    const cs=getComputedStyle(b);
    return {partidas:window.palabrasPartidas?.(window.PZ.lams[0]),wrap:cs.overflowWrap,rects:[...rg.getClientRects()].map(x=>({left:x.left,right:x.right})),left:r.left,right:r.right};
  });
  assert.equal(q.wrap,'normal'); assert.deepEqual(q.partidas,[]);
  assert.ok(q.rects.every(r=>r.left>=q.left&&r.right<=q.right),JSON.stringify(q));
});

test('r12: altura x de anotación al menos 75% de principal, incluso llave',async t=>{
  const p=await pagina(t,[
    {tipo:'idea',texto:'Una oferta que puedes entregar',anotaciones:[{a:'texto',texto:'El cliente lo comprueba'}]},
    {tipo:'lista',items:['Entrega acordada','Entrega terminada'],anotaciones:[{llave:['i0','i1'],texto:'El cliente lo comprueba'}]},
  ]); if(!p)return;
  const q=await p.evaluate(()=>window.PZ.lams.map(l=>{
    const c=document.createElement('canvas').getContext('2d');
    const x=e=>{const s=getComputedStyle(e);c.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;return c.measureText('x').actualBoundingBoxAscent;};
    const n=l.querySelector('.anotacion'),main=l.querySelector('.t,.item');
    return {ratio:x(n)/x(main),lineas:window.lineasPalabras(n)};
  }));
  assert.ok(q.every(x=>x.ratio>=.75),JSON.stringify(q));
  assert.equal(q[1].lineas.length,1,JSON.stringify(q));
});

test('r12: nodo sin emoji es texto principal y mapa ocupa el centro',async t=>{
  const p=await pagina(t,[{tipo:'flujo',flecha:'ninguna',nodos:[{etiqueta:'Nombre'},{etiqueta:'Problema'},{etiqueta:'Servicio'}]},
    {tipo:'pasos',n:3,etiquetas:['Cliente','Entrega','Acuerdo']}]); if(!p)return;
  const q=await p.evaluate(()=>{
    const [l,m]=window.PZ.lams,ks=[...m.querySelectorAll('.tecla')].map(e=>e.getBoundingClientRect());
    return {medidas:window.medidasR11(l).medidas,tam:[...l.querySelectorAll('.etiqueta')].map(e=>parseFloat(getComputedStyle(e).fontSize)),teclas:ks.map(r=>r.width),centro:ks[0].y+ks[0].height/2-m.getBoundingClientRect().y};
  });
  assert.ok(q.tam.every(x=>x>=72),JSON.stringify(q));
  assert.ok(q.teclas.every(x=>x>=190),JSON.stringify(q));
  assert.ok(q.centro>=350&&q.centro<=590,JSON.stringify(q));
  assert.ok(q.medidas.fila_ancho_pct>=50,JSON.stringify(q));
});

test('r12: salto entre mapa pequeño y texto grande avisa en ambas direcciones',()=>{
  const mapa={tipo:'pasos',principal_x:30},chat={tipo:'chat',principal_x:70};
  assert.equal(saltosEscala([mapa,chat]).length,1);
  assert.equal(saltosEscala([chat,mapa]).length,1);
  assert.equal(saltosEscala([{...mapa,principal_x:50},chat]).length,0);
  assert.equal(saltosEscala([{tipo:'objeto',principal_x:30},chat]).length,0);
});

test('r12: QA usa ojo real en nota de llave y detecta regresión aunque el font-size sea 50',async t=>{
  const p=await pagina(t,[{tipo:'bifurcacion',origen:{emoji:'🤔',texto:'Tu entrega'},ramas:[{emoji:'✅',texto:'Con límite'},{emoji:'❌',texto:'Sin límite'}],llave:'El cliente lo comprueba'}]);if(!p)return;
  const q=await p.evaluate(()=>{
    const l=window.PZ.lams[0],n=l.querySelector('.nota.roja');window.PZ.mostrar(l,window.PZ.pasos(l)-1,Infinity);
    const bien=window.medidasR11(l);n.style.setProperty('--tn','50px');const mal=window.medidasR11(l);
    return {bien,mal};
  });
  assert.ok(!q.bien.errores.some(e=>/altura x|nota junto a llave/.test(e)),JSON.stringify(q.bien));
  assert.ok(q.mal.errores.some(e=>/altura x/.test(e)),JSON.stringify(q.mal));
});
