import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { prepararSalida, abrir, lanzarChromium, DIR_SKILL } from '../scripts/lib/pipeline.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { medidasR11 } from '../scripts/lib/medidas-r11.mjs';
import { reglasRevelacion, reglasContrato } from '../scripts/lib/reglas-arco.mjs';
import { reglasCredibilidad } from '../scripts/lib/reglas-deck.mjs';

const carpeta = (t, deck) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r11-qa-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(deck));
  return dir;
};
async function navegador(t) {
  try { const b = await lanzarChromium(); await b.close(); return true; }
  catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(`SIN RENDER: ${e.motivo}`); return false; }
}
async function abrirDeck(t, deck) {
  const dir = carpeta(t, { marca: false, emoji: 'apple', ...deck });
  const p = prepararSalida(dir), sesion = await abrir(p.htmlPath,p.W,p.H);
  t.after(() => sesion.browser.close());
  await sesion.page.addScriptTag({ content: inyectable() + `;window.medidasR11=${medidasR11.toString()};` });
  return sesion.page;
}

test('r11/r14: revelación del vsl-corto en 55–60% y del vsl largo en 75–82% (la referencia revela en 36:16 de 44:55)', () => {
  const crear = (pieza, dur) => ({ pieza, laminas: [
    { tipo:'idea', texto:'Antes', dur }, { tipo:'oscura', texto:'Oferta', dur:100-dur },
  ] });
  for (const n of [44,54.99,60.01,75]) assert.equal(reglasRevelacion(crear('vsl-corto',n),[1,1]).avisos.length,1,`vsl-corto ${n}`);
  for (const n of [55,57,60]) assert.equal(reglasRevelacion(crear('vsl-corto',n),[1,1]).avisos.length,0,`vsl-corto ${n}`);
  assert.match(reglasContrato(crear('vsl-corto',44),[1,1]).avisos[0], /44.0%.*55–60%/);
  for (const n of [44,60,74.99,82.01]) assert.equal(reglasRevelacion(crear('vsl',n),[1,1]).avisos.length,1,`vsl ${n}`);
  for (const n of [75,80,82]) assert.equal(reglasRevelacion(crear('vsl',n),[1,1]).avisos.length,0,`vsl ${n}`);
  assert.match(reglasContrato(crear('vsl',44),[1,1]).avisos[0], /44.0%.*75–82%/);
  assert.equal(reglasRevelacion({ ...crear('vsl',44), pieza:'propuesta' },[1,1]).avisos.length,0);
});

test('r11: propuesta admite sustituto medible de GUION antes de inversión, sin inventar trayectoria', () => {
  const garantia = { tipo:'idea', emoji:'🛡️', texto:'Si faltan entregables en 30 días, devolvemos el anticipo.' };
  const inversion = { tipo:'cifra', arriba:'Inversión', lineas:['$12,000'] };
  const proveedor={tipo:'idea',texto:'Lo implementa Agencia Brújula'};
  const propuesta = laminas => ({pieza:'propuesta',laminas:[proveedor,...laminas]});
  assert.deepEqual(reglasCredibilidad(propuesta([garantia,inversion])).avisos,[]);
  assert.deepEqual(reglasCredibilidad(propuesta([{tipo:'idea',texto:'Primeros casos: pago sujeto a entrega'},inversion,garantia])).avisos,[]);
  assert.equal(reglasCredibilidad(propuesta([inversion,garantia])).avisos.length,2);
  assert.equal(reglasCredibilidad(propuesta([{...garantia,texto:'Garantía sin condiciones.'},inversion])).avisos.length,2);
  assert.equal(reglasCredibilidad(propuesta([{...garantia,texto:'Si trabajamos durante 30 días, tienes acceso a reuniones.'},inversion])).avisos.length,2);
  assert.equal(reglasCredibilidad(propuesta([{...garantia,texto:'Si faltan entregables en 30 días, no devolvemos el anticipo.'},inversion])).avisos.length,2);
  assert.equal(reglasCredibilidad(propuesta([{tipo:'prueba',capturas:[{texto:'Resultado imaginado',ejemplo:true}]},inversion])).avisos.length,2);
  assert.equal(reglasCredibilidad(propuesta([{tipo:'cifra',arriba:'Si cada vendedor pierde 1-2 h al día:',lineas:['40 × 1-2 h','= 800-1,600 horas al mes']},inversion])).avisos.length,2);
  assert.equal(reglasCredibilidad({pieza:'propuesta',laminas:[garantia,inversion]}).avisos.length,2);
  assert.equal(reglasCredibilidad({pieza:'propuesta',laminas:[{...proveedor,texto:'Una entrega',voz:proveedor.texto},garantia,inversion]}).avisos.length,2);
  assert.equal(reglasCredibilidad({pieza:'propuesta',laminas:[garantia,inversion,proveedor]}).avisos.length,2);
});

test('r11: chat vertical detecta las dos regresiones antes del PNG', async t => {
  if (!(await navegador(t))) return;
  const page = await abrirDeck(t, { formato:'9:16', laminas:[
    { tipo:'chat', mensajes:[{ de:'yo', texto:'Cuesta $800. ¿Para qué fecha?' }] },
  ] });
  const r = await page.evaluate(() => {
    const l = window.PZ.lams[0]; window.PZ.mostrar(l,window.PZ.pasos(l)-1,Infinity);
    const buena = window.medidasR11(l), chat = l.querySelector('.chat'), b = l.querySelector('.burbuja');
    chat.style.width='500px'; b.style.maxWidth='300px';
    return { buena, mala:window.medidasR11(l), lineas:window.lineasPalabras(b).length };
  });
  assert.equal(r.buena.avisos.filter(a => /chat 9:16|burbuja de/.test(a)).length,0,JSON.stringify(r));
  assert.ok(r.mala.avisos.some(a => /mínimo 70%/.test(a)),JSON.stringify(r));
  assert.ok(r.mala.avisos.some(a => /máximo 2/.test(a)),JSON.stringify(r));
});

test('r11: listas cortas x, check y sin marca centradas, estables y anclaje explícito medido', async t => {
  if (!(await navegador(t))) return;
  for (const formato of ['16:9','9:16']) {
    const page = await abrirDeck(t, { formato, laminas:[
      { tipo:'lista', encabezado:'Sin:', vineta:'x', items:['Sorpresas','Retrabajo'] },
      { tipo:'lista', encabezado:'Incluye:', vineta:'check', items:['Una revisión','Una entrega'] },
      { tipo:'lista', items:['Precio claro','Una pregunta'] },
    ] });
    const r = await page.evaluate(() => window.PZ.lams.map(l => {
      window.PZ.mostrar(l,0,Infinity); const inicio=window.medidasR11(l);
      window.PZ.mostrar(l,window.PZ.pasos(l)-1,Infinity); const fin=window.medidasR11(l);
      const z=l.querySelector('.lienzo'); z.style.justifyContent='flex-start'; z.style.paddingTop='0px';
      const mala=window.medidasR11(l); z.dataset.anclar='arriba';
      return { inicio,fin,mala,explicita:window.medidasR11(l) };
    }));
    for (const q of r) {
      assert.ok(q.fin.medidas.lista_centro_pct >=40 && q.fin.medidas.lista_centro_pct <=58,JSON.stringify(q));
      assert.equal(q.inicio.medidas.lista_centro_pct,q.fin.medidas.lista_centro_pct);
      assert.ok(q.mala.avisos.some(a => /lista corta:/.test(a)),JSON.stringify(q));
      assert.ok(!q.explicita.avisos.some(a => /lista corta:/.test(a)));
      assert.equal(q.explicita.medidas.lista_anclaje,'arriba-explicito');
    }
  }
});

test('r11: fila corta mide ocupación real y fuente efectiva tras encaje', async t => {
  if (!(await navegador(t))) return;
  const page = await abrirDeck(t, { laminas:[
    { tipo:'pasos', iconos:['📦','💵','📅'], etiquetas:['Entrega','Monto','Fecha'], prefijo:false },
  ] });
  const r=await page.evaluate(() => {
    const l=window.PZ.lams[0]; window.PZ.mostrar(l,window.PZ.pasos(l)-1,Infinity);
    const buena=window.medidasR11(l), fila=l.querySelector('.fila-pasos'); fila.style.zoom='.4';
    return { buena,mala:window.medidasR11(l) };
  });
  assert.equal(r.buena.avisos.filter(a=>/fila de|fila corta:/.test(a)).length,0,JSON.stringify(r));
  assert.ok(r.mala.avisos.some(a=>/mínimo 50%/.test(a)),JSON.stringify(r));
  assert.ok(r.mala.avisos.some(a=>/mínimo 60 px/.test(a)),JSON.stringify(r));
});

test('r11: anotación pequeña es error, descargo pequeño aviso, firma y sufijo exentos', async t => {
  if (!(await navegador(t))) return;
  const page=await abrirDeck(t,{laminas:[
    { tipo:'idea', texto:'Cobra por una entrega', anotaciones:[{a:'texto',texto:'Evita rehacer gratis'}] },
  ]});
  const r=await page.evaluate(() => {
    const l=window.PZ.lams[0]; window.PZ.mostrar(l,window.PZ.pasos(l)-1,Infinity);
    const buena=window.medidasR11(l), nota=l.querySelector('.anotacion'); nota.style.fontSize='40px';
    const d=document.createElement('div'); d.textContent='Ejemplo ficticio';d.style.fontSize='26px';l.append(d);
    const firma=document.createElement('div');firma.className='firma';firma.textContent='Firma pequeña';firma.style.fontSize='16px';l.append(firma);
    const sufijo=document.createElement('span');sufijo.className='sufijo';sufijo.textContent='/año';sufijo.style.fontSize='16px';l.append(sufijo);
    return { buena,mala:window.medidasR11(l) };
  });
  assert.ok(!r.buena.errores.some(a=>/anotación/.test(a)),JSON.stringify(r));
  assert.ok(r.mala.errores.some(a=>/mínimo 46 px/.test(a)),JSON.stringify(r));
  assert.ok(r.mala.avisos.some(a=>/texto visible.*Ejemplo ficticio/.test(a)),JSON.stringify(r));
  assert.ok(!r.mala.avisos.some(a=>/Firma pequeña|\/año/.test(a)),JSON.stringify(r));
});

test('r11: las dos columnas Incluye/No incluye también pasan por QA de fila corta', async t => {
  if (!(await navegador(t))) return;
  const page=await abrirDeck(t,{laminas:[{tipo:'lista',columnas:[
    {titulo:'Incluye:',items:['Una entrega']},{titulo:'No incluye:',items:['Cambios extra']},
  ]}]});
  const r=await page.evaluate(()=>{
    const l=window.PZ.lams[0];window.PZ.mostrar(l,window.PZ.pasos(l)-1,Infinity);
    const buena=window.medidasR11(l);l.querySelector('.contraste').style.zoom='.4';
    return {buena,mala:window.medidasR11(l)};
  });
  assert.ok(r.buena.medidas.fila_ancho_pct>=50,JSON.stringify(r));
  assert.ok(r.buena.medidas.fila_rotulo_px1920>=60,JSON.stringify(r));
  assert.ok(r.mala.avisos.some(a=>/mínimo 50%/.test(a)),JSON.stringify(r));
  assert.ok(r.mala.avisos.some(a=>/mínimo 60 px/.test(a)),JSON.stringify(r));
});

test('r11: flecha solo admite un inicio a 24 px del contorno', async t => {
  if (!(await navegador(t))) return;
  const page=await abrirDeck(t,{laminas:[{tipo:'idea',texto:'Un precio concreto'}]});
  const r=await page.evaluate(() => {
    const l=window.PZ.lams[0];window.PZ.mostrar(l,0,Infinity);
    const svg=l.querySelector('.capa-mano'),p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.dataset.clase='flecha';p.setAttribute('d','M 20 20 L 60 60');svg.append(p);
    const mala=window.medidasR11(l),b=l.querySelector('.t').getBoundingClientRect(),L=l.getBoundingClientRect();
    p.setAttribute('d',`M ${b.left-L.left-12} ${b.top-L.top} l -80 -80`);
    return { mala,buena:window.medidasR11(l) };
  });
  assert.ok(r.mala.avisos.some(a=>/flecha huérfana/.test(a)),JSON.stringify(r));
  assert.ok(!r.buena.avisos.some(a=>/flecha huérfana/.test(a)),JSON.stringify(r));
});

test('r11: qa --preflight-geometria bloquea texto pequeño y no crea primera captura ni historial', async t => {
  if (!(await navegador(t))) return;
  const dir=carpeta(t,{marca:false,laminas:[{tipo:'idea',texto:'Un precio concreto',tam_texto:'28px'}]});
  const p=spawnSync(process.execPath,[path.join(DIR_SKILL,'scripts/qa.mjs'),dir,'--preflight-geometria'],{encoding:'utf8'});
  assert.equal(p.status,3,p.stdout+p.stderr);
  const q=JSON.parse(fs.readFileSync(path.join(dir,'salida/preflight-geometria.json')));
  assert.ok(q.evaluaciones.geometria.avisos.some(a=>/texto visible menor de 30/.test(a)),JSON.stringify(q.evaluaciones.geometria));
  assert.equal(fs.existsSync(path.join(dir,'salida/calidad-historial.json')),false);
  assert.equal(fs.existsSync(path.join(dir,'salida/01.png')),false);
});
