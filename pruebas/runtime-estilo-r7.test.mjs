// Ronda 7: geometría del sello, óvalos y visibilidad de iconos apagados.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { marcar, plano } from '../scripts/lib/markup.mjs';
import { avisosGeometriaSello, medidasTrazos } from '../scripts/lib/medidas-trazos.mjs';
import { pctApagado } from '../scripts/lib/contraste-color.mjs';
import { reglasCapaExpresiva, reglasMarcasYSuperficies } from '../scripts/lib/reglas-marcas.mjs';
import { notaSinTope } from '../scripts/lib/reglas-deck.mjs';
import { analizarHTML } from '../scripts/lib/mano-html.mjs';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
const raiz = '/private/tmp/pz-loop/r7/codex-impl-estilo-iconos';
const idea = texto => ({ tipo: 'idea', texto });

test('óvalo: no cruza saltos, escapa y desaparece en texto plano', () => {
  assert.match(marcar('Desde ((2020))'), /data-circulo/);
  for (const texto of ['((a\nb))', '((a\\nb))']) assert.doesNotMatch(marcar(texto), /data-circulo/);
  assert.match(marcar('((<dato>))'), /&lt;dato&gt;/);
  assert.equal(plano('Desde ((2020))'), 'Desde 2020');
  assert.ok(reglasMarcasYSuperficies({ laminas: [idea('((una frase de cinco palabras))')] }).errores.some(e => /más de 4 palabras/.test(e)));
  assert.ok(reglasMarcasYSuperficies({ laminas: [idea('((uno)) __dos__ ==tres==')] }).avisos.some(e => /3 énfasis/.test(e)));
});

test('sello: avisa por franja, firma y descentramiento, sin avisar en el hueco limpio', () => {
  const pol = [[500,850],[900,850],[900,1000],[500,1000]];
  const avisos = avisosGeometriaSello(pol,1920,1080,100,{x:800,y:950,w:280,h:80},{x:1100,w:200,y:800,h:100},true);
  assert.ok(avisos.some(a => /franja inferior/.test(a)));
  assert.ok(avisos.some(a => /cruza la firma/.test(a)));
  assert.ok(avisos.some(a => /15 %/.test(a)));
  assert.deepEqual(avisosGeometriaSello([[750,700],[1150,700],[1150,820],[750,820]],1920,1080,100,{x:1500,y:980,w:280,h:50},{x:600,w:700,y:620,h:120},true),[]);
  // La esquina superior derecha de la caja envolvente no pertenece al rombo.
  assert.deepEqual(avisosGeometriaSello([[100,0],[200,100],[100,200],[0,100]],1920,1080,100,{x:190,y:0,w:10,h:10},null,false),[]);
});

test('apagado: mide la tinta compuesta sobre blanco al 35 %, sin contar transparencia', () => {
  assert.equal(pctApagado(new Uint8ClampedArray([0,0,0,255,255,255,255,255,0,0,0,0])),50);
  assert.equal(pctApagado(new Uint8ClampedArray([0,0,0,255]),0),0);
  assert.equal(pctApagado(new Uint8ClampedArray([255,255,255,0])),null);
});

test('capa expresiva: contenedores no bastan, variedad y marcas de venta sí cuentan', () => {
  const sinTinta = { laminas: Array.from({length:12},(_,i) => ({...idea(i ? 'Frase' : 'Garantía'),nota:'Comentario'})) };
  assert.equal(reglasCapaExpresiva(sinTinta).avisos.length,2);
  assert.equal(notaSinTope({avisos:reglasCapaExpresiva(sinTinta).avisos}),100);
  const html = analizarHTML('<section><p class="nota">Nota</p><div class="tabla">Tabla</div><b data-sub>Clave</b></section>')[0];
  assert.deepEqual(html.trazos,['subrayado']);
  assert.equal(html.contenedores,2);
  const conTinta = { laminas: sinTinta.laminas.map((l,i) => i===0 ? {...l,sello:'Protegido'} : i===1 ? {...l,texto:'((Cifra))'} : l) };
  assert.deepEqual(reglasCapaExpresiva(conTinta).avisos,[]);
  assert.equal(reglasCapaExpresiva({laminas:[idea('No incluye servicios')]}).avisos.length,1);
  assert.deepEqual(reglasCapaExpresiva({laminas:[idea('~~No incluye servicios~~')]}).avisos,[]);
});

test('render: cita y sello libre respetan margen, firma y ancho; el icono conserva 35 %', {timeout:120000}, async t => {
  fs.mkdirSync(raiz,{recursive:true});
  const dir = fs.mkdtempSync(path.join(raiz,'fixture-sello-'));
  const deck = { emoji:'apple', marca:{texto:'Firma de prueba'}, laminas:[
    {tipo:'cita',texto:'Una frase que merece atención.',sello:'Así es',firma:false},
    {tipo:'cita',texto:'Otra frase que merece atención.',sello:'Así es'},
    {tipo:'pasos',iconos:['📅','📋'],etiquetas:['Fecha','Lista'],activo:1},
  ]};
  fs.writeFileSync(path.join(dir,'deck.json'),JSON.stringify(deck));
  const prep = prepararSalida(dir,path.join(dir,'salida'));
  let abierto;
  try { abierto = await abrir(prep.htmlPath,prep.W,prep.H); }
  catch (error) { if (error.code !== 'SIN_NAVEGADOR') throw error; t.skip(`SIN RENDER: ${error.motivo}`); return; }
  const {browser,page} = abierto;
  try {
    await page.addScriptTag({content:`window.medidasTrazos=${medidasTrazos.toString()}`});
    const medidas = await page.evaluate(() => window.PZ.lams.slice(0,2).map(lam => {
      window.PZ.mostrar(lam,window.PZ.pasos(lam)-1,Infinity);
      const s=lam.querySelector('.sello'), b=s.getBoundingClientRect(), L=lam.getBoundingClientRect();
      const bloques=[...lam.querySelectorAll(':scope > .lienzo > *')].map(e=>e.getBoundingClientRect());
      const ancho=Math.max(...bloques.map(b=>b.right))-Math.min(...bloques.map(b=>b.left));
      return {arriba:b.top-L.top,abajo:L.bottom-b.bottom,ancho:b.width,tope:Math.max(.8*ancho,420),letra:parseFloat(getComputedStyle(s.querySelector('.sello-tinta')).fontSize),firma:!!lam.querySelector('.firma'),trazos:window.medidasTrazos(lam)};
    }));
    for (const m of medidas) { assert.ok(m.arriba>=99);assert.ok(m.abajo>=(m.firma?139:99));assert.ok(m.ancho<=m.tope+1);assert.ok(m.letra<=96);assert.deepEqual(m.trazos.errores,[]); }
    const opacidad = await page.evaluate(() => [...window.PZ.lams[2].querySelectorAll('.emo')].map(e=>{let op=1;for(let a=e;a&&!a.classList.contains('lamina');a=a.parentElement) op*=Number(getComputedStyle(a).opacity);return op;}));
    assert.ok(opacidad.every(o=>o>=.35-.001),JSON.stringify(opacidad));
    await page.screenshot({path:path.join(dir,'sello.png')});
  } finally { await browser.close(); }
});


test('consigna con reloj: más de tres ítems pide dividir sin ocultar el contenido', () => {
  const vivo = cantidad => ({ tipo: 'camara', vivo: true, dur: 180, texto: 'Practica ahora', items: Array.from({length:cantidad}, () => 'Una tarea') });
  const tres = reglasMarcasYSuperficies({laminas:[vivo(3)]});
  assert.deepEqual(tres.avisos,[]);
  const cinco = reglasMarcasYSuperficies({laminas:[vivo(5)]});
  assert.ok(cinco.avisos.some(a => /más de 3 ítems.*divídela/.test(a)));
  assert.deepEqual(cinco.errores,[]);
  assert.deepEqual(reglasMarcasYSuperficies({laminas:[{...vivo(5), dur:undefined}]}).avisos,[]);
});
