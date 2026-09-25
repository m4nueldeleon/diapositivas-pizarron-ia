import test from 'node:test';
import assert from 'node:assert/strict';
import { anotacionAporta, reglasEditoriales } from '../scripts/lib/editorial.mjs';
import { hayCifraCredibilidad, credibilidadConfirmada, evidenciasDelDeck } from '../scripts/lib/reglas-deck.mjs';
import { reglasRespuestaObjecion } from '../scripts/lib/reglas-arco.mjs';

test('r12: intención de credibilidad y una fuente no convierten muestra vacía en credencial', () => {
  const muestra = { tipo:'prueba', credibilidad:true, fuente:'Plantilla del autor', capturas:[{hueco:'Nombre / Entrega / Fecha',plantilla:true}] };
  const deck = { pieza:'vsl', laminas:[muestra,{tipo:'oscura',texto:'Servicio'}] };
  assert.equal(hayCifraCredibilidad(deck), false);
  assert.equal(credibilidadConfirmada(deck,muestra), false);
  assert.equal(hayCifraCredibilidad({ ...deck, laminas:[{tipo:'idea',texto:'Desde 2020',fuente:'Registro del proveedor'},deck.laminas[1]] }),true);
  const roles=evidenciasDelDeck(deck);
  assert.deepEqual(roles.muestra,[1]);
  assert.deepEqual(roles.credencial,[]);
  assert.deepEqual(roles.demostracion,[]);
  assert.deepEqual(roles.intencion_sin_evidencia,[1]);
  assert.equal(hayCifraCredibilidad({...deck,laminas:[{...muestra,texto:'Plantilla para 20 clientes'},deck.laminas[1]]}),false);
});

test('r12: conversación muestra una demostración, no inventa resultado ni credencial',()=>{
  const r=evidenciasDelDeck({laminas:[{tipo:'chat',mensajes:[{de:'otro',texto:'¿Qué recibo?'},{de:'yo',texto:'Una página con tus servicios.'}]}]});
  assert.deepEqual(r.demostracion,[1]);assert.deepEqual(r.resultado,[]);assert.deepEqual(r.credencial,[]);
  assert.deepEqual(evidenciasDelDeck({laminas:[{tipo:'cifra',arriba:'Si ganas dos clientes',valor:'$20,000',fuente:'Ejemplo ilustrativo'}]}).resultado,[]);
});

test('r12: entrega, entregar y entregable no añaden información; una consecuencia sí', () => {
  const l = { tipo:'idea',texto:'Define una entrega' };
  for (const texto of ['Define un entregable','Define qué entregar','Una entrega excelente','Define el mismo entregable','Define una plantilla']) assert.equal(anotacionAporta(l,{texto}),false,texto);
  for (const texto of ['Evita rehacer el trabajo','Entrega el viernes','Solo una revisión','El cliente lo comprueba']) assert.equal(anotacionAporta(l,{texto}),true,texto);
});

test('r12: cuatro instrucciones con distintos diseños siguen siendo monotonía retórica', () => {
  const laminas = [
    {tipo:'idea',texto:'Define tu entrega'}, {tipo:'lista',items:['Elige tu cliente']},
    {tipo:'cita',texto:'Escribe tu precio'}, {tipo:'flujo',nodos:[{etiqueta:'Anota tu plazo'}]},
  ];
  assert.ok(reglasEditoriales({laminas}).avisos.some(a=>/función retórica/.test(a)));
  assert.ok(!reglasEditoriales({laminas:[...laminas.slice(0,3),{tipo:'chat',mensajes:[{de:'otro',texto:'¿Qué recibo?'},{de:'yo',texto:'Una página con tus servicios.'}]}]}).avisos.some(a=>/función retórica/.test(a)));
});

test('r12: respuesta retoma núcleo con raíz y conserva condición; también en clase', () => {
  const obj = {tipo:'idea',encabezado:'Objeción #1',texto:'¿Puedo pagar todo al terminar?'};
  const incorrecta = {tipo:'chat',mensajes:[{de:'yo',texto:'Te entrego una pieza menor.'}]};
  const correcta = {tipo:'chat',mensajes:[{de:'yo',texto:'El pago conserva anticipo. El saldo, al terminar.'}]};
  for(const pieza of ['clase','vsl','propuesta']) {
    assert.ok(reglasRespuestaObjecion({pieza,laminas:[obj,incorrecta]}).avisos.some(a=>/núcleo/.test(a)),pieza);
    assert.equal(reglasRespuestaObjecion({pieza,laminas:[obj,correcta]}).avisos.length,0,pieza);
  }
  const cambio={...obj,texto:'¿Y si pido cambios a cada rato?'};
  assert.ok(reglasRespuestaObjecion({pieza:'vsl',laminas:[cambio,{tipo:'flujo',nodos:[{etiqueta:'Una pieza adicional'}]}]}).avisos.some(a=>/núcleo/.test(a)));
  assert.equal(reglasRespuestaObjecion({pieza:'vsl',laminas:[cambio,{tipo:'chat',mensajes:[{de:'yo',texto:'Incluye una revisión. Cambiar el objetivo se cotiza aparte.'}]}]}).avisos.length,0);
  assert.ok(reglasRespuestaObjecion({pieza:'vsl',laminas:[{...obj,texto:'¿Mi equipo sabe usar tecnología?'},{tipo:'chat',mensajes:[{de:'yo',texto:'Mi equipo gana más clientes.'}]}]}).avisos.some(a=>/núcleo/.test(a)));
});
