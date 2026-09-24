// Ronda 3 (conocimiento): el arco de 9 bloques de la propuesta, el desglose de un precio, la oferta (escasez, garantía,
// bonos), la ficha de marca global y la información que no resta nota. Funciones puras, sin navegador.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reglasPropuesta, reglasOferta, reglasProyeccion, reglasArco, reglasCredibilidad, revisarDeck, esDesglose,
  infoEmoji, infoFirma, palabrasProhibidas } from '../scripts/lib/reglas-deck.mjs';
import { PIEZAS } from '../scripts/lib/tiempos.mjs';
import { buscarMarca, leerFicha, leerVetadas, firmaParaDeck, convertirFichaCarrusel, rutasMarca } from '../scripts/lib/marca.mjs';

const idea = (texto, extra = {}) => ({ tipo: 'idea', emoji: '💡', texto, ...extra });
const cifra = (lineas, extra = {}) => ({ tipo: 'cifra', lineas, ...extra });

// Una propuesta con los 9 bloques de ARCOS.md
const completa = () => ({ pieza: 'propuesta', laminas: [
  cifra(['{{VENDEDORES}} vendedores × {{HORAS}} h', '= __{{HORAS_MES}} horas al mes__'], { fuente: 'llamada de diagnóstico', voz: ['En la llamada me diste tus números.', 'Son {{HORAS_MES}} horas al mes.'] }),
  idea('Hoy eso te cuesta **{{COSTO_MES}} al mes**'),
  { tipo: 'flujo', nodos: [{ emoji: '📲', etiqueta: 'Aprende' }, { emoji: '🤖', etiqueta: 'Aplica' }] },
  idea('Desde 2016, **más de 300 empresas** capacitadas'),
  cifra(['{{CASO_ANTES}} → __{{CASO_DESPUES}}__'], { fuente: 'Cliente X, 2025' }),
  idea('De {{HOY}} a la meta, **medido en la semana 8**'),
  { tipo: 'lista', encabezado: 'No incluye:', vineta: 'x', items: ['Licencias', 'Integraciones'] },
  cifra([{ texto: 'Hoy: {g:{{COSTO_MES}} al mes}' }, { texto: 'Inversión: __{{PRECIO}}__' }]),
  idea('Si en la semana 4 no se mide avance, **cancelas sin penalización**', { emoji: '🛡️' }),
  { tipo: 'flujo', nodos: [{ emoji: '✍️', etiqueta: 'Firmas' }, { emoji: '📅', etiqueta: 'Arrancamos el {{FECHA}}' }] },
  { tipo: 'boton', boton: 'Firmar', texto: 'Vigente hasta el {{VIGENCIA}}', llamado: true },
] });

test('propuesta: rango 3-20 min; la propuesta completa no da avisos de arco, bloques ni credibilidad', () => {
  assert.deepEqual([PIEZAS.propuesta.min, PIEZAS.propuesta.max], [3, 20]);
  const p = completa();
  assert.deepEqual(reglasPropuesta(p).avisos, []);
  assert.deepEqual(reglasArco(p).avisos, []);
  assert.deepEqual(reglasCredibilidad(p).avisos, []);
});

test('propuesta sin cierre (termina en el precio): avisa llamado, «No incluye», vigencia, salida, ancla, quién y caso', () => {
  const p = { pieza: 'propuesta', laminas: [
    cifra(['40 × 1-2 h', '= __800-1,600 horas al mes__'], { arriba: 'Si cada vendedor pierde 1-2 h al día:', voz: ['Pongamos que cada vendedor pierde una o dos horas.', 'Son 800 a 1,600 horas.'] }),
    idea('Tus **40 personas** con un método'), idea('Programa de **8 semanas**'),
    cifra(['Programa completo · 40 personas', '{{PRECIO}}']),
  ] };
  const todos = [...reglasPropuesta(p).avisos, ...reglasArco(p).avisos, ...reglasCredibilidad(p).avisos].join('\n');
  for (const re of [/termina sin llamado/, /NO incluye/, /fecha ni vigencia/, /si no funciona/, /sin ancla/, /quién la imparte/, /caso ni una prueba/, /Pongamos que/]) assert.match(todos, re);
  // «40 personas» del cliente no es credibilidad del proveedor; «40 personas ya capacitadas» sí
  assert.ok(!reglasCredibilidad({ ...p, laminas: [idea('Más de **400 personas ya capacitadas**'), ...p.laminas] }).avisos.some(a => /quién la imparte/.test(a)));
  // con el marcador en el deck crudo no se avisa el «Pongamos que…»
  const crudo = { laminas: [cifra(['{{VENDEDORES}} × {{HORAS}}', '= __{{HORAS_MES}}__']), ...p.laminas.slice(1)] };
  assert.ok(!reglasPropuesta(p, { crudo }).avisos.some(a => /Pongamos/.test(a)));
});

test('desglose de un precio: no es proyección; «$500 al día en ventas» sí', () => {
  const sin = ['$3,000 ÷ 30 días = __$100 al día__', '{{PRECIO}} ÷ 40 vendedores = __$2,500 por vendedor__', '$6,997 × 1.20 ÷ 4 = __$2,099 por quincena__'];
  sin.forEach(t => assert.deepEqual(reglasProyeccion({ laminas: [cifra([t])] }).avisos, [], t));
  assert.ok(esDesglose(['$3,000 ÷ 30 días', '= __$100 al día__'], '= __$100 al día__'));
  for (const t of ['$3,000 ÷ 30 días = __$500 al día en ventas__', '10 × $50 = __$500 al día__']) assert.equal(reglasProyeccion({ laminas: [cifra([t])] }).avisos.length, 1, t);
});

test('oferta: escasez escrita a mano es error; con {{CUPOS}}, tachada o negada no; garantía sin plazo y bonos sin dato avisan', () => {
  const vsl = { pieza: 'vsl-corto', laminas: [
    idea('**Garantía total**', { emoji: '🛡️', nota: 'Sin riesgo' }),
    idea('Quedan **solo 3 lugares**', { emoji: '⏳', nota: 'Precio especial solo hoy' }),
    { tipo: 'stack', items: [{ emoji: '🎁', texto: 'Bono: plantillas' }, { emoji: '🤖', texto: 'Tu agente' }, { emoji: '🎁', texto: 'Bono: comunidad' }] },
  ] };
  const r = reglasOferta(vsl);
  assert.equal(r.errores.length, 1);
  assert.match(r.errores[0], /lámina 2 .*escasez/);
  assert.ok(r.avisos.some(a => /lámina 1 .*garantía sin plazo/.test(a)));
  assert.ok(r.avisos.some(a => /2 bonos sin dato/.test(a)));
  assert.ok(r.avisos.some(a => /antes de una pieza base/.test(a)));
  // bien hecho: con el dato, tachado (enseña lo que no se hace), negado y garantía con plazo y condición
  const bien = { laminas: [
    idea('Quedan **{{CUPOS}} lugares**', { emoji: '🎟️' }),
    { tipo: 'lista', items: [{ texto: 'Precio especial solo hoy', tachado: true }], voz: 'Nada de «precio especial solo hoy»' },
    idea('~~Precio especial solo hoy~~', { nota: 'Urgencia solo si es real' }),
    idea('**«Seguro cierra hoy»**', { emoji: 'no:⏳', encabezado: 'Objeción #1' }),
    idea('Garantía de **{{GARANTIA_DIAS}} días**', { emoji: '🛡️', nota: 'Si {{GARANTIA_CONDICION}}, te devuelvo tu dinero' }),
    { tipo: 'stack', items: [{ emoji: '🤖', texto: 'Tu agente' }, { emoji: '🎁', texto: '{{BONO_1}}', sub: 'Bono #1' }] },
  ] };
  assert.deepEqual(reglasOferta(bien), { errores: [], avisos: [] });
  // «precio especial por volumen» (propuesta B2B) no es urgencia
  assert.deepEqual(reglasOferta({ laminas: [idea('Precio especial **por volumen**')] }).errores, []);
  // qa pasa el deck crudo: «Quedan 3 lugares» que vino de {{CUPOS}} no es escasez inventada
  const sust = { laminas: [idea('Quedan **3 lugares**')] }, crudo = { laminas: [idea('Quedan **{{CUPOS}} lugares**')] };
  assert.deepEqual(reglasOferta(sust, { crudo }).errores, []);
  assert.equal(reglasOferta(sust).errores.length, 1);
});

test('info que no resta nota: emoji sin fijar y firma', () => {
  assert.match(infoEmoji({}), /emoji sin fijar/);
  assert.match(infoEmoji({ emoji: 'auto' }), /"auto"/);
  assert.equal(infoEmoji({ emoji: 'apple' }), null);
  assert.equal(infoFirma({ marca: false }), null);
  assert.equal(infoFirma({ marca: { texto: '@yo' } }), null);
  assert.match(infoFirma({}, { rutaGlobal: '/x/MI-MARCA.md' }), /\/x\/MI-MARCA\.md/);
  assert.match(infoFirma({}, { aplicada: '/y/MI-MARCA.md' }), /firma tomada de \/y/);
  // revisarDeck no la cuenta como aviso
  const r = revisarDeck({ laminas: [idea('Uno')] }, [1]);
  assert.ok(!r.avisos.some(a => /emoji sin fijar/.test(a)));
});

test('ficha de marca: cadena deck → arriba → $PIZARRON_MARCA → ~/.config; formatos con negritas, «·» y «/»', () => {
  const casa = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-casa-'));
  const trabajo = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-trabajo-'));
  const deck = path.join(trabajo, 'deck');
  fs.mkdirSync(deck);
  const env = { HOME: casa };
  assert.equal(buscarMarca(deck, { env }), null);
  const global = path.join(casa, '.config', 'diapositivas-pizarron-ia', 'MI-MARCA.md');
  fs.mkdirSync(path.dirname(global), { recursive: true });
  fs.writeFileSync(global, '- Texto (tu @ o tu dominio): @manueldeleonmjr\n- **Palabras que NUNCA usas:** gurú/experto (de ti mismo) · fácil · ingreso pasivo\n');
  const g = buscarMarca(deck, { env });
  assert.equal(g.ruta, global);
  assert.deepEqual(g.firma, { texto: '@manueldeleonmjr' });
  assert.deepEqual(g.vetadas, ['gurú', 'experto', 'fácil', 'ingreso pasivo']);
  assert.deepEqual(palabrasProhibidas(deck, { env }), ['gurú', 'experto', 'fácil', 'ingreso pasivo']);
  // «no» apaga la global; la del deck gana sobre todas
  assert.equal(buscarMarca(deck, { env: { ...env, PIZARRON_MARCA: 'no' } }), null);
  fs.writeFileSync(path.join(deck, 'MI-MARCA.md'), '- Texto (tu @ o tu dominio): tumarca.com\n');
  assert.equal(buscarMarca(deck, { env }).firma, null, 'un valor de ejemplo no es firma');
  assert.deepEqual(rutasMarca(deck, env).slice(-1), [global]);
  // un deck sin «marca» toma la firma; con "marca": false o con su propia marca, no
  fs.rmSync(path.join(deck, 'MI-MARCA.md'));
  assert.deepEqual(firmaParaDeck({ laminas: [] }, deck, { env }).marca, { texto: '@manueldeleonmjr' });
  assert.equal(firmaParaDeck({ marca: false, laminas: [] }, deck, { env }).marca, undefined);
  assert.equal(firmaParaDeck({ marca: { texto: '@otro' }, laminas: [] }, deck, { env }).marca, undefined);
  // el logo de una ficha que no está en la carpeta del deck no se copia
  fs.writeFileSync(global, '- Logo (opcional): assets/logo.png\n');
  const f = firmaParaDeck({ laminas: [] }, deck, { env });
  assert.equal(f.marca, undefined);
  assert.match(f.aviso, /no se copia/);
  // la plantilla vacía no da firma ni vetadas
  assert.deepEqual(leerFicha(fs.readFileSync(new URL('../templates/MI-MARCA.md', import.meta.url), 'utf8')), { firma: null, vetadas: [] });
  assert.deepEqual(leerVetadas('- Palabras que nunca usas: hack, gurú\n'), ['hack', 'gurú']);
});

test('ficha de carruseles: se CONVIERTE (la cuenta y las vetadas), sin reglas de carrusel', () => {
  const carrusel = '## 1\n- **Cuenta de Instagram:** @manueldeleonmjr · ~509,000 seguidores\n## 3\n- **Palabras que NUNCA usas:** gurú/experto (de ti mismo) · secreto (como anzuelo vacío) · anglicismos con palabra en español (embudo, no funnel).\n- **Emojis:** 1-2 en el caption como máximo; nunca en las láminas.\n';
  const nueva = convertirFichaCarrusel(carrusel);
  assert.deepEqual(leerFicha(nueva), { firma: { texto: '@manueldeleonmjr' }, vetadas: ['gurú', 'experto', 'secreto'] });
  assert.ok(!/nunca en las láminas/.test(nueva));
});
