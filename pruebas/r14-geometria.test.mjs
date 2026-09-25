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
