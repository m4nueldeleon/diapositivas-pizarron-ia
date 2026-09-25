import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { abrir, prepararSalida, lanzarChromium, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { medidasR11 } from '../scripts/lib/medidas-r11.mjs';

const DOCUMENTO = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
<rect x="5" y="5" width="1190" height="590" rx="22" fill="white" stroke="#333"/>
<g font-family="Arial" font-size="54" fill="#111">
<text x="64" y="90" font-size="58">Acuerdo de diseño</text>
<text x="64" y="180">Entrega: 3 piezas</text>
<text x="64" y="270">Incluye: 1 revisión</text>
<text x="64" y="360">Fecha: martes acordado</text>
<text x="64" y="460">Anticipo: $3,000 MXN</text>
<text x="64" y="555" font-size="40" fill="#666">Archivo de práctica · no es una venta real</text>
</g></svg>`;

async function navegador(t) {
  try { const b=await lanzarChromium(); await b.close(); return true; }
  catch(e) { if(e.code!=='SIN_NAVEGADOR') throw e; t.skip(`SIN RENDER: ${e.motivo}`); return false; }
}
async function documento(t, svg=DOCUMENTO) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pz-r11-doc-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.writeFileSync(path.join(dir,'documento.svg'),svg);
  fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify({marca:false,laminas:[
    {tipo:'objeto',imagen:'documento.svg',alto:300,texto:'Confirma el alcance',procedencia:'ejemplo'},
  ]}));
  const p=prepararSalida(dir),sesion=await abrir(p.htmlPath,p.W,p.H);
  t.after(()=>sesion.browser.close());
  await sesion.page.addScriptTag({content:inyectable()+`;window.medidasR11=${medidasR11.toString()};`});
  return {...sesion,dir};
}

test('r11: documento SVG crece al cuerpo44, saca descargo32 y conserva fuente original',async t=>{
  if(!(await navegador(t)))return;
  const {page,dir}=await documento(t);
  const r=await page.evaluate(()=>{
    const l=window.PZ.lams[0];window.PZ.mostrar(l,window.PZ.pasos(l)-1,Infinity);
    const img=l.querySelector('img[data-documento-svg]'),buena=window.medidasR11(l);
    const descargo=l.querySelector('[data-documento-descargo]');
    const xml=new TextDecoder().decode(Uint8Array.from(atob(img.src.split(',')[1]),c=>c.charCodeAt(0)));
    const antes=img.style.height;img.style.height='300px';
    return {buena,mala:window.medidasR11(l),antes,xml,descargo:{texto:descargo.textContent,tam:parseFloat(getComputedStyle(descargo).fontSize),padre:descargo.parentElement===l,paso:descargo.dataset.p}};
  });
  assert.ok(!r.buena.avisos.some(a=>/documento SVG/.test(a)),JSON.stringify(r));
  assert.ok(r.buena.medidas.documentos_svg[0].textos.every(x=>x.px1920>=44),JSON.stringify(r));
  assert.ok(r.mala.avisos.some(a=>/mínimo 44 px/.test(a)),JSON.stringify(r));
  assert.ok(r.mala.avisos.some(a=>/dentro del documento SVG menor de 30/.test(a)),JSON.stringify(r));
  assert.ok(r.descargo.tam>=32);assert.equal(r.descargo.padre,true);assert.equal(r.descargo.paso,'0');
  assert.match(r.descargo.texto,/Archivo de práctica/);assert.doesNotMatch(r.xml,/Archivo de práctica/);
  assert.match(r.xml,/Acuerdo de diseño/);assert.match(r.xml,/Anticipo: \$3,000 MXN/);
  assert.equal(fs.readFileSync(path.join(dir,'documento.svg'),'utf8'),DOCUMENTO);
});

test('r11: medición SVG hereda fuente y escala, y el descargo conserva el paso de imagen',async t=>{
  if(!(await navegador(t)))return;
  const {page}=await documento(t);
  await page.addScriptTag({content:fs.readFileSync(path.join(DIR_SKILL,'templates/runtime-documentos.js'),'utf8')});
  const r=await page.evaluate(async()=>{
    const l=window.PZ.lams[0],div=document.createElement('div');div.dataset.p='2';l.querySelector('.lienzo').append(div);
    const img=document.createElement('img');img.dataset.documentoSvg='1';img.style.height='100px';
    img.src='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><g font-size="48" transform="scale(.5)"><text x="40" y="80">Entrega concreta</text><text x="40" y="150" font-size="40">Ejemplo ficticio</text></g></svg>');
    div.append(img);await img.decode();await prepararDocumentosSVG();
    return {medidas:JSON.parse(img.dataset.documentoMedidas),alto:img.style.height,paso:[...l.querySelectorAll('[data-documento-descargo]')].at(-1).dataset.p};
  });
  assert.equal(r.medidas.textos[0].tam,24);assert.ok(parseFloat(r.alto)>=550);assert.equal(r.paso,'2');
});

test('r11: SVG permanece imagen inerte y CSS no medible produce aviso explícito',async t=>{
  if(!(await navegador(t)))return;
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" onload="window.pzAtaque=1"><style>text{font-size:20px}</style><text x="20" y="90">Documento con CSS</text><script>window.pzAtaque=2</script></svg>';
  const {page}=await documento(t,svg);
  const r=await page.evaluate(()=>{
    const l=window.PZ.lams[0];window.PZ.mostrar(l,window.PZ.pasos(l)-1,Infinity);
    return {qa:window.medidasR11(l),ataque:window.pzAtaque||0,activos:l.querySelectorAll('svg[onload]').length};
  });
  assert.equal(r.ataque,0);assert.equal(r.activos,0);assert.ok(r.qa.avisos.some(a=>/documento SVG sin medir: CSS/.test(a)),JSON.stringify(r));
});

test('r11: imagen PNG no se etiqueta como documento medido ni finge OCR',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pz-r11-png-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.writeFileSync(path.join(dir,'imagen.png'),Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ9sAAAAASUVORK5CYII=','base64'));
  fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify({marca:false,laminas:[{tipo:'objeto',imagen:'imagen.png',texto:'Consulta el archivo'}]}));
  const p=prepararSalida(dir),html=fs.readFileSync(p.htmlPath,'utf8');
  assert.doesNotMatch(html,/<img[^>]+data-documento-svg/);
});

test('r11: texto reutilizado con use y recorte slice quedan sin medir, nunca aprobación falsa',async t=>{
  if(!(await navegador(t)))return;
  const {page}=await documento(t,'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><defs><text id="t" font-size="100">Cuerpo</text></defs><use href="#t" transform="scale(.2)"/></svg>');
  const reutilizado=await page.evaluate(()=>window.medidasR11(window.PZ.lams[0]));
  assert.ok(reutilizado.avisos.some(a=>/documento SVG sin medir.*use\/symbol/.test(a)),JSON.stringify(reutilizado));
  const slice=await documento(t,'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice"><text x="40" y="200" font-size="40">Documento cortado</text></svg>');
  const recorte=await slice.page.evaluate(()=>window.medidasR11(window.PZ.lams[0]));
  assert.ok(recorte.avisos.some(a=>/documento SVG sin medir.*slice/.test(a)),JSON.stringify(recorte));
});

test('r11: dimensiones SVG físicas sin viewBox no se confunden con píxeles',async t=>{
  if(!(await navegador(t)))return;
  const {page}=await documento(t,'<svg xmlns="http://www.w3.org/2000/svg" width="10cm" height="5cm"><text x="20" y="30" font-size="8">Texto diminuto</text></svg>');
  const r=await page.evaluate(()=>window.medidasR11(window.PZ.lams[0]));
  assert.ok(r.avisos.some(a=>/documento SVG sin medir.*dimensiones sin viewBox/.test(a)),JSON.stringify(r));
});

test('r11: un título ficticio se conserva y el descargo sin acento también queda fijo',async t=>{
  if(!(await navegador(t)))return;
  const {page}=await documento(t,'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><text x="30" y="80" font-size="48">Contrato ficticio</text><text x="30" y="140" font-size="48">Entrega definida</text><text x="30" y="260" font-size="30">Archivo de practica</text></svg>');
  const r=await page.evaluate(()=>{
    const l=window.PZ.lams[0],img=l.querySelector('[data-documento-svg]'),d=l.querySelector('[data-documento-descargo]');
    const xml=new TextDecoder().decode(Uint8Array.from(atob(img.src.split(',')[1]),c=>c.charCodeAt(0)));
    return {xml,clase:d.className,tam:parseFloat(getComputedStyle(d).fontSize)};
  });
  assert.match(r.xml,/Contrato ficticio/);assert.doesNotMatch(r.xml,/Archivo de practica/);
  assert.match(r.clase,/descargo/);assert.ok(r.tam>=32);
});
