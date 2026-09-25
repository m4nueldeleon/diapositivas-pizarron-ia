import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenciasDelDeck, revisarDeck } from '../scripts/lib/reglas-deck.mjs';
import { reglasEditoriales, funcionRetorica, anotacionAporta } from '../scripts/lib/editorial.mjs';
import { reglasRespuestaObjecion, reglasRevelacion } from '../scripts/lib/reglas-arco.mjs';

const chat = mensajes => ({tipo:'chat',mensajes});
test('r14: saludo, eco y promesa no son una demostración',()=>{
  for(const textos of [['Hola','Hola'],['Necesito una propuesta concreta','Necesito una propuesta concreta'],['Enséñame cómo aprobar la portada','Claro, vamos a mostrar una demostración']]) {
    const l=chat([{de:'yo',texto:textos[0]},{de:'otro',texto:textos[1]}]);
    assert.deepEqual(evidenciasDelDeck({laminas:[l]}).demostracion,[]);
    assert.notEqual(funcionRetorica(l),'demostracion');
  }
});
test('r14: decisión concreta transforma entrada en salida utilizable',()=>{
  const l=chat([{de:'yo',texto:'¿Apruebas la portada A o la B?'},{de:'otro',texto:'La A. Puedes continuar.'}]);
  assert.deepEqual(evidenciasDelDeck({laminas:[l]}).demostracion,[1]);
  assert.equal(anotacionAporta(l,{texto:'Queda por escrito'}),true);
  assert.deepEqual(reglasEditoriales({laminas:[{...l,anotaciones:[{a:'m1',texto:'Queda por escrito'}]}]}).avisos,[]);
});
test('r14: incertidumbre editorial informa; repetición comprobada bloquea',()=>{
  const l={tipo:'idea',texto:'Define una entrega',anotaciones:[{a:'texto',texto:'Conserva la conversación'}]};
  const q=reglasEditoriales({laminas:[l]});
  assert.deepEqual(q.avisos,[]); assert.ok(q.info.length);
  assert.ok(reglasEditoriales({laminas:[{...l,anotaciones:[{a:'texto',texto:'Define un entregable'}]}]}).avisos.some(a=>/redundante/.test(a)));
});
test('r14: cada componente exige respuesta, mencionar devoluciones no cierra política',()=>{
  for(const pregunta of ['¿Incluye modificaciones y devoluciones?','¿Incluye modificaciones, devoluciones?','¿Incluye modificaciones? ¿Y devoluciones?','¿Incluye modificaciones o devoluciones?']) {
    const deck={pieza:'reel',laminas:[chat([{de:'otro',texto:pregunta}]),{tipo:'idea',texto:'Conserva el acuerdo'},chat([{de:'yo',texto:'Las modificaciones se cotizan aparte; las devoluciones se acuerdan por escrito.'}])]};
    assert.ok(reglasRespuestaObjecion(deck).avisos.some(a=>/devoluciones.*(pendiente|explícita)/.test(a)));
    assert.ok(revisarDeck(deck,[1,1,1]).porConfirmar.POLITICA_DEVOLUCIONES);
    const completo={...deck,laminas:[deck.laminas[0],chat([{de:'yo',texto:'Las modificaciones se cotizan aparte.'},{de:'yo',texto:'Las devoluciones proceden si no entregamos el archivo acordado.'}])]};
    assert.ok(!reglasRespuestaObjecion(completo).avisos.some(a=>/componente/.test(a)));
  }
});
test('r14: VSL largo revela 75–82%, corto 55–60%, límites exactos',()=>{
  const deck=(pieza,dur)=>({pieza,laminas:[{tipo:'idea',texto:'Antes',dur},{tipo:'oscura',texto:'Oferta',dur:100-dur}]});
  for(const [pieza,min,max] of [['vsl',75,82],['vsl-corto',55,60]]) {
    for(const n of [min,(min+max)/2,max])assert.deepEqual(reglasRevelacion(deck(pieza,n),[1,1]).avisos,[]);
    for(const n of [min-.01,max+.01])assert.equal(reglasRevelacion(deck(pieza,n),[1,1]).avisos.length,1);
  }
});
