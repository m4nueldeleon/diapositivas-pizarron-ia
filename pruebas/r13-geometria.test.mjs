import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { medidasR11, saltosEscala } from '../scripts/lib/medidas-r11.mjs';

async function pagina(t, laminas, formato = '16:9') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r13-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca:false, emoji:'apple', formato, laminas }));
  const p = prepararSalida(dir);
  let b;
  try { b = await abrir(p.htmlPath, p.W, p.H); }
  catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return null; }
  t.after(() => b.browser.close());
  await b.page.addScriptTag({content:inyectable() + `;window.medidasR11=${medidasR11.toString()};`});
  return b.page;
}
const contraste = {tipo:'lista', columnas:[
  {titulo:'Incluye:',items:['Una página','Una revisión']},
  {titulo:'Cambio:',items:['Agregar un servicio','Crear otra página'],llave:'Otro alcance requiere cotización'}
]};

test('r13: lista corta crece por ocupación, conserva centro y QA detecta reducción', async t => {
  const p = await pagina(t,[{tipo:'lista',encabezado:'Sales con:',items:['Un cliente definido','Una entrega concreta','Un acuerdo escrito']}]); if(!p)return;
  const q=await p.evaluate(()=>{const l=window.PZ.lams[0]; const bien=window.medidasR11(l);l.querySelector('.pila').style.zoom='.55';return {bien,mal:window.medidasR11(l)};});
  assert.ok(q.bien.medidas.lista_letra_px1920>=80,JSON.stringify(q));
  assert.ok(q.bien.medidas.lista_alto_util_pct>=45,JSON.stringify(q));
  assert.ok(q.bien.medidas.lista_centro_pct>=40&&q.bien.medidas.lista_centro_pct<=58);
  assert.ok(q.mal.avisos.some(s=>/lista corta.*(64 px|45%)/.test(s)),JSON.stringify(q));
});
test('r13: contraste crece con su nota y la columna roja no afirma inclusión', async t=>{
  const p=await pagina(t,[contraste]);if(!p)return;
  const q=await p.evaluate(()=>{const l=window.PZ.lams[0],col=l.querySelectorAll('.contraste-col')[1];const bien=window.medidasR11(l);const marcas=[...col.querySelectorAll('.emo')].map(e=>decodeURIComponent(e.dataset.e));col.querySelector('.emo').dataset.e=encodeURIComponent('✅');l.querySelector('.pila').style.zoom='.5';return {bien,marcas,mal:window.medidasR11(l)};});
  assert.ok(q.bien.medidas.lista_letra_px1920>=80,JSON.stringify(q));
  assert.ok(q.bien.medidas.lista_alto_util_pct>=45,JSON.stringify(q));
  assert.ok(q.marcas.every(e=>e!=='✅'),JSON.stringify(q));
  assert.ok(q.mal.avisos.some(s=>/columna roja/.test(s)),JSON.stringify(q));
  assert.ok(q.mal.avisos.some(s=>/lista corta/.test(s)),JSON.stringify(q));
});
test('r13: toda burbuja vertical usa 82–86% útil y chat conserva escala entre escenas',async t=>{
  const p=await pagina(t,[
    {tipo:'chat',mensajes:[{de:'otro',texto:'Está caro. ¿Puedes incluir las modificaciones y las devoluciones?'}]},
    {tipo:'chat',mensajes:[{de:'yo',texto:'El precio incluye una revisión. Modificaciones adicionales se cotizan aparte; las devoluciones se acuerdan por escrito.'}]},
    {tipo:'chat',mensajes:[{de:'otro',texto:'Entendido: una página y una revisión.'},{de:'yo',texto:'Sí. El precio cambia si agregas otra página.'}]}
  ],'9:16');if(!p)return;
  const q=await p.evaluate(()=>window.PZ.lams.map(l=>window.medidasR11(l)));
  assert.ok(q.every(r=>r.medidas.burbujas_ancho_pct?.every(n=>n>=82&&n<=86)),JSON.stringify(q));
  // El porcentaje útil solo no basta: un lienzo con demasiado padding seguía
  // dando 84% aunque la burbuja ocupara apenas 70% de la pantalla.
  const anchos=await p.evaluate(()=>window.PZ.lams.flatMap(l=>[...l.querySelectorAll('.burbuja')].map(b=>b.getBoundingClientRect().width/l.getBoundingClientRect().width)));
  assert.ok(anchos.every(n=>n>=.78),JSON.stringify(anchos));
  const tamanos=q.flatMap(r=>r.medidas.chat_letras||[]);
  assert.ok(tamanos.length===4&&Math.max(...tamanos)/Math.min(...tamanos)<=1.3,JSON.stringify(q));
  const mal=await p.evaluate(()=>{const l=window.PZ.lams[0];l.querySelector('.burbuja').style.width='60%';return window.medidasR11(l);});
  assert.ok(mal.avisos.some(s=>/82–86%/.test(s)),JSON.stringify(mal));
});
test('r13/r14: citas protagonistas con ojo principal; una nota Caveat diminuta avisa (la gris no se infla: referencia)',async t=>{
  const p=await pagina(t,[{tipo:'cita',emoji:'💬',texto:'«Nos preguntan lo mismo por mensaje»'},
    {tipo:'idea',texto:'Conserva el precio acordado',nota:'Menos alcance, otra propuesta'}]);if(!p)return;
  const q=await p.evaluate(()=>window.PZ.lams.map(l=>{const n=l.querySelector('.nota');const bien=window.medidasR11(l);n.style.fontSize='30px';return {bien,mal:window.medidasR11(l)};}));
  assert.ok(q.every(r=>r.bien.medidas.caveat_x?.every(n=>n.proporcion>=n.minimo)),JSON.stringify(q));
  assert.ok(q.every(r=>r.mal.avisos.some(s=>/Caveat/.test(s))),JSON.stringify(q));
});
test('r13: chat con anotación respeta 6% superior e inferior',async t=>{
  const p=await pagina(t,[{tipo:'chat',mensajes:[{de:'yo',texto:'La página dirá: entrevista y plan de seguimiento. ¿Es correcto?'},{de:'otro',texto:'Sí. Agrega que deben traer sus estudios previos.'}],anotaciones:[{a:'m1',texto:'Requiere aprobación del responsable',lado:'abajo'}]}]);if(!p)return;
  const q=await p.evaluate(()=>{const l=window.PZ.lams[0];const bien=window.medidasR11(l);const b=l.querySelector('.pila');b.style.position='absolute';b.style.top='20px';return {bien,mal:window.medidasR11(l)};});
  assert.ok(q.bien.medidas.margen_superior_pct>=6&&q.bien.medidas.margen_inferior_pct>=6,JSON.stringify(q));
  assert.ok(q.mal.avisos.some(s=>/margen seguro/.test(s)),JSON.stringify(q));
});
test('r13: consigna en vivo prioriza letra de 72 px y QA exige 64',async t=>{
  const p=await pagina(t,[{tipo:'camara',vivo:true,dur:45,texto:'Describe tu entrega comprobable',items:['Qué recibe','Qué queda fuera','Cómo lo comprueba']}]);if(!p)return;
  const q=await p.evaluate(()=>{const l=window.PZ.lams[0];l.classList.add('captura-vivo');const bien=window.medidasR11(l);l.querySelector('.vivo-items').style.setProperty('--t-vivo','40px');return {bien,mal:window.medidasR11(l)};});
  assert.ok(q.bien.medidas.vivo_letra_px1920>=80,JSON.stringify(q));
  assert.ok(q.mal.avisos.some(s=>/consigna en vivo/.test(s)),JSON.stringify(q));
});
test('r13: bifurcación amplía también el origen y preserva los rótulos',async t=>{
  const p=await pagina(t,[{tipo:'bifurcacion',origen:{emoji:'🤔',texto:'¿Qué compro?'},ramas:[{texto:'Horas'},{texto:'Una entrega'}],llave:'El cliente necesita comprobarla'}]);if(!p)return;
  const q=await p.evaluate(()=>{const l=window.PZ.lams[0];const m=window.medidasR11(l),icono=l.querySelector('.emo').getBoundingClientRect().width;l.querySelector('.emo').style.setProperty('--s','100px');return {m,icono,mal:window.medidasR11(l)};});
  assert.ok(q.icono>=170,JSON.stringify(q));assert.ok(q.m.medidas.fila_rotulo_px1920>=64,JSON.stringify(q));assert.ok(q.mal.avisos.some(s=>/bifurcación.*170/.test(s))); 
});
test('r13: QA detecta una diferencia de chat mayor de 1.3 en el deck',()=>{
  assert.ok(saltosEscala([{tipo:'chat',chat_letras:[104]},{tipo:'idea'},{tipo:'chat',chat_letras:[64]}]).some(s=>/chat.*1.3/.test(s)));
  assert.deepEqual(saltosEscala([{tipo:'chat',chat_letras:[84]},{tipo:'chat',chat_letras:[76]}]),[]);
});
