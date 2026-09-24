// Reglas de QA que se leen en el deck.json (scripts/lib/reglas-deck.mjs): sin navegador.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reglasFirma, reglasDuracion, reglasApertura, reglasVoz, reglasProyeccion, reglasPrueba, reglasArco, palabrasProhibidas,
  reglasCredibilidad, reglasDescargo, reglasIconos, inventarioIconos, reglasClaves, notaQA, TOPE_BORRADOR, revisarDeck } from '../scripts/lib/reglas-deck.mjs';
import { duracionTotal, minutosObjetivo, mmss } from '../scripts/lib/tiempos.mjs';

const idea = (texto, extra = {}) => ({ tipo: 'idea', emoji: '💡', texto, ...extra });
const unos = n => Array.from({ length: n }, () => 1);

test('firma de relleno: tumarca.com, @tuusuario y <tu @> son error; una firma real no', () => {
  for (const marca of [{ texto: 'tumarca', sufijo: '.com' }, { texto: '@tuusuario' }, { texto: '<tu @ o dominio>' }, { texto: 'Tu Marca' }]) {
    assert.equal(reglasFirma({ marca }).errores.length, 1, JSON.stringify(marca));
  }
  assert.deepEqual(reglasFirma({ marca: { texto: 'manueldeleon', sufijo: '.com' } }).errores, []);
  assert.deepEqual(reglasFirma({ marca: false }).errores, []);
  assert.deepEqual(reglasFirma({}).errores, []);
});

test('duración: minutos o mm:ss; una «clase» de 4 min es error, en vivo es aviso; ±30% es aviso', () => {
  assert.equal(minutosObjetivo(45), 45);
  assert.equal(minutosObjetivo('0:45'), 0.75);
  assert.equal(minutosObjetivo('42:30'), 42.5);
  assert.equal(minutosObjetivo('mucho'), null);
  assert.equal(mmss(221.4), '3:41');
  // 60 láminas de ~10 palabras: unos 4 min
  const laminas = Array.from({ length: 60 }, (_, i) => idea(`Lámina ${i}`, { voz: 'una frase de diez palabras que se dice en voz alta' }));
  const deck = { pieza: 'clase', laminas };
  const est = duracionTotal(deck, unos(60));
  assert.ok(est > 200 && est < 280, String(est));
  assert.match(reglasDuracion(deck, unos(60)).errores[0], /menos de la mitad.*ARCOS/);
  const vivo = reglasDuracion({ ...deck, en_vivo: true }, unos(60));
  assert.deepEqual(vivo.errores, []);
  assert.match(vivo.avisos[0], /En vivo/);
  assert.match(reglasDuracion({ laminas, duracion_objetivo: 3 }, unos(60)).avisos[0], /\+\d+%/);
  assert.deepEqual(reglasDuracion({ laminas, duracion_objetivo: '4:00' }, unos(60)), { errores: [], avisos: [], estimado: est, laminas: est, camara: 0 });
  assert.match(reglasDuracion({ pieza: 'reel', laminas }, unos(60)).avisos.join(' '), /pasa de 60 s/);
});

test('duración: objetivo fuera del rango de su pieza avisa; clase con más de la mitad a cámara avisa; tutorial corto no', () => {
  // ~3:30 de láminas
  const laminas = Array.from({ length: 50 }, (_, i) => idea(`Lámina ${i}`, { voz: 'una frase de diez palabras que se dice en voz alta' }));
  const video = reglasDuracion({ pieza: 'video', duracion_objetivo: '3:30', laminas }, unos(50));
  assert.ok(video.avisos.some(a => /fuera de un\(a\) video de YouTube \(8-20 min\).*tutorial/.test(a)), video.avisos.join('\n'));
  assert.deepEqual(video.errores, []);
  const tutorial = reglasDuracion({ pieza: 'tutorial', laminas }, unos(50));
  assert.deepEqual([tutorial.errores, tutorial.avisos], [[], []]);
  // clase de ~24 min: 20 son tres tramos a cámara (300 + 300 + 600 s)
  const cam = dur => ({ tipo: 'camara', nota: 'demo en vivo', dur });
  const clase = { pieza: 'clase', duracion_objetivo: 25, laminas: [...laminas.slice(0, 60), cam(300), cam(300), cam(600)] };
  const r = reglasDuracion(clase, unos(clase.laminas.length));
  assert.ok(r.avisos.some(a => /son tramos a cámara \(\d+%\)/.test(a)), r.avisos.join('\n'));
  assert.ok(r.errores.some(a => /las láminas cubren ~\d+:\d\d.*a cámara/.test(a)), 'las láminas son menos de la mitad del objetivo');
  assert.ok(r.camara >= 1200 && r.laminas < 300);
  // el objetivo sin pieza sigue sin avisos
  assert.deepEqual(reglasDuracion({ laminas, duracion_objetivo: '3:30' }, unos(50)).avisos, []);
});

test('apertura: saludo, título «Cómo…» o cámara antes del segundo 10 avisan; una escena no', () => {
  const resto = [idea('Uno'), idea('Dos'), idea('Tres')];
  const titulo = reglasApertura({ laminas: [idea('Cómo usar la IA para conseguir tus primeros 10 clientes', { nota: 'Aunque hoy no tengas ni uno' }), ...resto] }, unos(4));
  assert.ok(titulo.avisos.some(a => /abre con el título/.test(a)));
  const cam = reglasApertura({ laminas: [idea('Uno'), { tipo: 'camara', nota: 'Bienvenido al Lunes Sinergético' }, ...resto] }, unos(5));
  assert.ok(cam.avisos.some(a => /cámara en el segundo/.test(a)));
  assert.ok(cam.avisos.some(a => /saludo/.test(a)));
  assert.ok(reglasApertura({ laminas: [idea('x', { voz: 'Hola, soy Manuel y hoy te enseño' }), ...resto] }, unos(4)).avisos.some(a => /saludo/.test(a)));
  assert.deepEqual(reglasApertura({ laminas: [idea('11:40 pm. Alguien quiere comprarte', { voz: 'Son las 11:40 de la noche' }), ...resto] }, unos(4)).avisos, []);
});

test('voz humana: fórmulas de IA, más de una antítesis y palabras vetadas de MI-MARCA', () => {
  const deck = { laminas: [
    idea('Esperar **no es una estrategia**.'),
    idea('Todo empieza con 1 mensaje. Mándalo hoy.'),
    idea('No te falta vender. Te falta contestar.'),
    idea('Eso no cierra la venta: la despide.'),
    idea('Usa la sinergia del ecosistema'),
    idea('Si te escriben 20 al día, 6 preguntan precio.'),
  ] };
  const r = reglasVoz(deck, ['sinergia', 'ecosistema']);
  const hay = re => r.avisos.some(a => re.test(a));
  assert.ok(hay(/lámina 1 .*no es una estrategia/));
  assert.ok(hay(/lámina 2 .*todo empieza con.*cierre motivacional/));
  assert.ok(hay(/lámina 3 .*no te falta/));
  assert.ok(hay(/antítesis «No X, Y» en \d láminas/));
  assert.ok(hay(/lámina 5 .*«sinergia».*MI-MARCA/));
  assert.ok(!r.avisos.some(a => /lámina 6/.test(a)));
  // la lista sale de «Palabras que nunca usas:» en MI-MARCA.md, junto al deck o una carpeta arriba
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-marca-'));
  fs.mkdirSync(path.join(dir, 'deck'));
  fs.writeFileSync(path.join(dir, 'MI-MARCA.md'), '## Tu voz\n- Palabras que nunca usas: sinergia, `ecosistema`, game changer\n');
  assert.deepEqual(palabrasProhibidas(path.join(dir, 'deck')), ['sinergia', 'ecosistema', 'game changer']);
  // la plantilla vacía no veta nada
  fs.copyFileSync(new URL('../templates/MI-MARCA.md', import.meta.url), path.join(dir, 'deck', 'MI-MARCA.md'));
  assert.deepEqual(palabrasProhibidas(path.join(dir, 'deck')), []);
  fs.writeFileSync(path.join(dir, 'deck', 'MI-MARCA.md'), '- Palabras que nunca usas (en UNA línea, separadas por comas): hack, gurú\n');
  assert.deepEqual(palabrasProhibidas(path.join(dir, 'deck')), ['hack', 'gurú']);
});

test('proyección: «Supuesto:» vacío avisa; una condición con número o una fuente no', () => {
  const cuenta = { tipo: 'cifra', lineas: ['100 × 20% = 20 pláticas', '20 × 50% = __10 clientes__'] };
  assert.equal(reglasProyeccion({ laminas: [{ ...cuenta, arriba: 'Supuesto:' }] }).avisos.length, 1);
  assert.equal(reglasProyeccion({ laminas: [cuenta] }).avisos.length, 1);
  const conRango = { tipo: 'cifra', lineas: ['100 × 10-20% = 10-20 pláticas', '× 30-50% = __3-10 clientes__'] };
  assert.deepEqual(reglasProyeccion({ laminas: [{ ...conRango, arriba: 'Si te escriben 20 al día:' }] }).avisos, []);
  // §3.8 b: condición con número pero la cuenta exacta, sin ningún rango → un aviso aparte
  const demo = { tipo: 'cifra', arriba: 'Si te contrata el 0.1%:', lineas: ['1,000,000 × **0.1%** = 1,000', '1,000 × $25,000 = __$25,000,000__'] };
  const b = reglasProyeccion({ laminas: [demo] }).avisos;
  assert.equal(b.length, 1);
  assert.match(b[0], /§3\.8 b/);
  assert.deepEqual(reglasProyeccion({ laminas: [{ ...demo, arriba: 'Si te contrata del 0.1% al 0.3%:', lineas: ['1,000,000 × **0.1-0.3%** = 1,000-3,000', '1,000-3,000 × $25,000 = __$25-75 millones__'] }] }).avisos, []);
  assert.deepEqual(reglasProyeccion({ laminas: [{ ...demo, fuente: 'Datos del negocio, 2025' }] }).avisos, []);
  assert.deepEqual(reglasProyeccion({ laminas: [{ ...cuenta, arriba: 'Entre 10 y 20 al día:' }] }).avisos, []);
  assert.deepEqual(reglasProyeccion({ laminas: [{ tipo: 'cifra', lineas: ['1,000 × $25,000 = __$25,000,000__'], fuente: 'Tamaño del mercado, Statista 2025' }] }).avisos, []);
  assert.deepEqual(reglasProyeccion({ laminas: [{ tipo: 'cifra', lineas: ['__42__'] }] }).avisos, []);
});

test('prueba: un post de ejemplo con dinero o resultados avisa; sin cifras no', () => {
  const post = texto => ({ tipo: 'prueba', capturas: [{ ejemplo: true, post: { texto: [texto] } }] });
  assert.equal(reglasPrueba({ laminas: [post('$3,000 por adelantado + 20% de las ventas')] }).avisos.length, 1);
  assert.equal(reglasPrueba({ laminas: [post('Hoy cerré mi primer cliente')] }).avisos.length, 1);
  assert.deepEqual(reglasPrueba({ laminas: [post('Así se ve un mensaje que sí contestan')] }).avisos, []);
});

test('arco: clase sin llamado final, oscuras en una clase y un solo llamado en un webinar', () => {
  const cuerpo = [idea('Uno'), idea('Dos'), idea('Tres'), idea('Cuatro')];
  assert.ok(reglasArco({ pieza: 'clase', laminas: cuerpo }).avisos.some(a => /termina sin llamado/.test(a)));
  assert.deepEqual(reglasArco({ pieza: 'clase', laminas: [...cuerpo, idea('Nos vemos el lunes en la próxima clase')] }).avisos, []);
  assert.ok(reglasArco({ pieza: 'clase', laminas: [...cuerpo, { tipo: 'oscura', titulo: 'Club' }, idea('Únete hoy')] }).avisos.some(a => /oscuras en un\(a\) clase/.test(a)));
  const web = reglasArco({ pieza: 'webinar', laminas: [...cuerpo, { tipo: 'boton', boton: 'Aplica aquí' }] });
  assert.ok(web.avisos.some(a => /aparece 1 vez/.test(a)));
  assert.deepEqual(reglasArco({ laminas: cuerpo }).avisos, []);
});

test('llamado: solo cuenta el llamado VISIBLE; «WhatsApp», «aparta» o «agenda» sueltos no', () => {
  const cuerpo = [idea('Uno'), idea('Dos'), idea('Tres')];
  const falso = reglasArco({ pieza: 'vsl', laminas: [...cuerpo, idea('Recordatorios por WhatsApp', { voz: 'Te llega por WhatsApp' }), idea('Nadie aparta su lugar'), idea('Agenda citas sola')] });
  assert.ok(falso.avisos.some(a => /aparece 0 veces/.test(a)), falso.avisos.join('\n'));
  assert.ok(falso.avisos.some(a => /termina sin llamado visible/.test(a)));
  // botón + «Después del clic» contiguos = UN llamado; el resumen final sin botón no suma
  const uno = reglasArco({ pieza: 'vsl', laminas: [...cuerpo, { tipo: 'boton', boton: 'Agendar diagnóstico' },
    { tipo: 'flujo', encabezado: 'Después del clic', nodos: [{ emoji: '📅', etiqueta: 'Eliges hora' }, { emoji: '📞', etiqueta: 'Te llamamos' }] },
    { tipo: 'lista', items: ['Sala llena', 'Menos faltas'] }, { tipo: 'camara', voz: 'Da clic abajo' }] });
  assert.ok(uno.avisos.some(a => /aparece 1 vez/.test(a)), uno.avisos.join('\n'));
  // dos llamados a la vista (botón a media pieza y al final) y una objeción antes: sin avisos
  const obj = idea('**«No tengo tiempo»**', { emoji: 'no:⏰', encabezado: 'Objeción #1', encabezado_pos: 'entre' });
  const dos = reglasArco({ pieza: 'vsl', laminas: [obj, ...cuerpo, { tipo: 'boton', boton: 'Aplica aquí' }, idea('Cuatro'), idea('Cinco'),
    idea('Escribe «CITA» al WhatsApp del video'), { tipo: 'camara' }] });
  assert.deepEqual(dos.avisos, []);
  // `llamado: true` marca a mano la lámina que muestra la palabra clave o la flecha al link
  assert.deepEqual(reglasArco({ pieza: 'webinar', laminas: [...cuerpo, obj, idea('La palabra: CITA', { llamado: true }), idea('Cuatro'), { tipo: 'boton', boton: 'Entrar' }] }).avisos, []);
});

// ---------- ronda 2: prueba real, credibilidad, objeciones, descargos, emojis, claves, nota ----------
const maqueta = { tipo: 'prueba', id: 'prueba', encabezado: 'El mensaje que quieres recibir:', capturas: [{ ejemplo: true, post: { texto: ['Ya aparté mi lugar para el sábado'] } }] };
const camaraQuien = voz => ({ tipo: 'camara', id: 'quien', voz });
const oscura = { tipo: 'oscura', titulo: 'Sala Llena' };
const boton = { tipo: 'boton', boton: 'Aplica aquí' };

test('credibilidad: un vsl cuya única prueba es una maqueta da los 2 avisos de prueba', () => {
  const r = reglasCredibilidad({ pieza: 'vsl', laminas: [idea('Uno'), camaraQuien('En Sinergéticos organizamos eventos'), maqueta, oscura, boton] });
  assert.ok(r.avisos.some(a => /^sin prueba real en el vsl/.test(a)), r.avisos.join('\n'));
  assert.ok(r.avisos.some(a => /lámina 3 \(prueba\) es una maqueta EJEMPLO/.test(a)));
  assert.ok(r.avisos.some(a => /credibilidad sin cifra/.test(a)));
});

test('credibilidad: una captura con src o fuente, o un objeto con imagen, cuentan como prueba real', () => {
  for (const real of [
    { tipo: 'prueba', capturas: [{ src: 'assets/captura.png' }] },
    { tipo: 'prueba', capturas: [{ post: { texto: ['Llegaron 83 de 100'] }, fuente: 'real, con permiso' }] },
    { tipo: 'objeto', imagen: 'assets/sala.jpg' },
    { tipo: 'cifra', lineas: ['83 de 100'], fuente: 'Registro del evento, marzo 2026' },
  ]) {
    const r = reglasCredibilidad({ pieza: 'webinar', laminas: [idea('Uno'), maqueta, real, oscura] });
    assert.ok(!r.avisos.some(a => /prueba real|maqueta EJEMPLO/.test(a)), JSON.stringify(real) + '\n' + r.avisos.join('\n'));
  }
  // un hueco «La tuya va aquí» no es prueba real
  assert.ok(reglasCredibilidad({ pieza: 'vsl', laminas: [{ tipo: 'prueba', capturas: [{ hueco: 'La tuya va aquí' }] }] }).avisos.some(a => /sin prueba real/.test(a)));
});

test('credibilidad: «desde 2016, más de 300 eventos» en la voz de una cámara antes de la oscura no avisa; sin cifra, sí', () => {
  const con = reglasCredibilidad({ pieza: 'vsl', laminas: [idea('Uno'), camaraQuien('Desde 2016 hemos hecho más de 300 eventos'), { tipo: 'objeto', imagen: 'a.png' }, oscura, boton] });
  assert.deepEqual(con.avisos, []);
  const tarde = reglasCredibilidad({ pieza: 'vsl', laminas: [idea('Uno'), { tipo: 'objeto', imagen: 'a.png' }, oscura, camaraQuien('Más de 300 eventos'), boton] });
  assert.ok(tarde.avisos.some(a => /credibilidad sin cifra/.test(a)), 'la cifra después de la revelación no cuenta');
  assert.deepEqual(reglasCredibilidad({ pieza: 'vsl', laminas: [idea('**12 años** y 4,000 alumnos'), { tipo: 'objeto', imagen: 'a.png' }] }).avisos, []);
});

test('credibilidad: una clase o un reel con una maqueta no dan avisos', () => {
  for (const pieza of ['clase', 'reel', 'video', undefined]) assert.deepEqual(reglasCredibilidad({ pieza, laminas: [idea('Uno'), maqueta] }).avisos, [], String(pieza));
});

test('objeciones: un vsl sin «Objeción #N» antes del llamado avisa; con una idea «Razón #1» no', () => {
  const sin = reglasArco({ pieza: 'vsl', laminas: [idea('Uno'), idea('Dos'), oscura, boton, idea('Tres'), idea('Escribe «SALA» al WhatsApp')] });
  assert.ok(sin.avisos.some(a => /ninguna objeción antes del llamado/.test(a)), sin.avisos.join('\n'));
  const con = reglasArco({ pieza: 'vsl', laminas: [idea('Uno'), idea('**«Mi público no paga apartado»**', { emoji: 'no:💵', encabezado: 'Razón #1', encabezado_pos: 'entre' }),
    idea('Empieza con $100'), oscura, boton, idea('Tres'), idea('Escribe «SALA» al WhatsApp')] });
  assert.ok(!con.avisos.some(a => /objeción/.test(a)), con.avisos.join('\n'));
  // la objeción DESPUÉS del botón de la oferta no cuenta; en vsl-corto pide 1
  const tarde = reglasArco({ pieza: 'vsl-corto', laminas: [idea('Uno'), oscura, boton, idea('**«No tengo tiempo»**', { encabezado: 'Objeción #1' }), idea('Escribe «SALA»')] });
  assert.ok(tarde.avisos.some(a => /ninguna objeción.*1 lámina/.test(a)), tarde.avisos.join('\n'));
  assert.ok(!reglasArco({ pieza: 'clase', laminas: [idea('Uno'), idea('Nos vemos en la próxima clase')] }).avisos.some(a => /objeción/.test(a)));
});

test('descargo: «Cifra de ejemplo» en la nota avisa; en una prueba con ejemplo:true no; la voz repetida avisa', () => {
  const r = reglasDescargo({ laminas: [idea('**$50,000**', { nota: 'Cifra de ejemplo.' }), { tipo: 'grafica', subtitulo: 'Porcentajes de ejemplo' },
    { tipo: 'reparto', titulo: 'Ejemplo: entran $50,000' }, { tipo: 'cifra', arriba: 'Caso hipotético:', lineas: ['1 + 1'] }] });
  assert.equal(r.avisos.length, 4, r.avisos.join('\n'));
  assert.match(r.avisos[0], /lámina 1 .*«Cifra de ejemplo\.» en «nota».*§3\.8 d/);
  assert.deepEqual(reglasDescargo({ laminas: [{ ...maqueta, encabezado: 'Mensaje de ejemplo:' }] }).avisos, []);
  assert.deepEqual(reglasDescargo({ laminas: [idea('Por ejemplo, **3 mensajes**', { nota: 'Y el 17 pides prestado' })] }).avisos, []);
  const voz = reglasDescargo({ laminas: [1, 2, 3].map(k => idea(`L${k}`, { voz: `Esto es un ejemplo número ${k}` })) });
  assert.ok(voz.avisos.some(a => /repite que es un ejemplo en 3 láminas/.test(a)));
});

test('iconos: 🏦 y 🏛️ en fluent avisan (en apple no); 🧑‍💼 y 👨‍💼 en cualquiera', () => {
  const banco = [idea('Todo en una cuenta', { emoji: '🏦' }), idea('3. Impuestos', { emoji: '🏛️' })];
  assert.ok(reglasIconos({ emoji: 'fluent', laminas: banco }).avisos.some(a => /🏦 y 🏛 se ven casi iguales en fluent/.test(a)));
  assert.deepEqual(reglasIconos({ emoji: 'apple', laminas: banco }).avisos, []);
  assert.equal(reglasIconos({ laminas: banco }).avisos.length, 1, 'con auto revisa los dos sets');
  assert.equal(reglasIconos({ emoji: 'apple', laminas: [idea('Cliente', { emoji: '🧑‍💼' }), { tipo: 'flujo', nodos: [{ emoji: '👨‍💼', etiqueta: 'Experto' }] }] }).avisos.length, 1);
});

test('iconos: la base de una rejilla que sale como si:🪑 en otra lámina avisa (rol contrario)', () => {
  const sala = { tipo: 'rejilla', id: 'sala', total: 100, emoji: '🪑', emoji_destacado: '👤', destacar: [1, 2, 3] };
  const r = reglasIconos({ emoji: 'apple', laminas: [sala, idea('Que **sí lleguen**', { emoji: 'si:🪑' }), idea('Los que faltan', { emoji: 'no:👤' })] });
  assert.ok(r.avisos.some(a => /lámina 2 .*si:🪑 contradice la lámina 1 \(sala\)/.test(a)), r.avisos.join('\n'));
  assert.ok(r.avisos.some(a => /lámina 3 .*no:👤 contradice/.test(a)));
  assert.deepEqual(reglasIconos({ emoji: 'apple', laminas: [sala, idea('Que **sí lleguen**', { emoji: 'si:👤' })] }).avisos, []);
  // inventario para qa.json → iconos
  const inv = inventarioIconos({ laminas: [sala, { tipo: 'flujo', nodos: [{ emoji: '✍️', etiqueta: 'Registro' }, { emoji: '👤', etiqueta: 'Llegó' }] }] });
  assert.deepEqual(inv['👤'], ['lámina 1', 'lámina 2 · Llegó']);
  assert.deepEqual(inv['✍'], ['lámina 2 · Registro']);
});

test('iconos y reglas nuevas: el demo sale limpio', () => {
  const demo = JSON.parse(fs.readFileSync(new URL('../ejemplos/demo/deck.json', import.meta.url), 'utf8'));
  const r = revisarDeck(demo, demo.laminas.map(() => 1));
  assert.deepEqual([r.errores, r.avisos.filter(a => !/dura|objetivo|cámara/.test(a))], [[], []]);
  assert.ok(Object.keys(r.iconos).length > 20);
});

test('claves del deck: _marca y _datos avisan (nadie las lee); _comentario no', () => {
  const r = reglasClaves({ titulo: 'x', _marca: 'sin firma', _datos: 'propuestos', _comentario: 'nota', laminas: [] });
  assert.equal(r.avisos.length, 2);
  assert.match(r.avisos[0], /«_marca» no lo lee nadie/);
  assert.match(reglasClaves({ laminas: [], titlo: 'x' }).avisos[0], /«titlo» no es un campo del deck/);
});

test('nota: con datos propuestos el deck es borrador y no pasa de 90', () => {
  assert.equal(notaQA({ errores: [], avisos: [] }), 100);
  assert.equal(notaQA({ errores: ['e'], avisos: ['a', 'b'] }), 82);
  assert.equal(notaQA({ errores: [], avisos: [], porConfirmar: { PRODUCTO: { valor: 'Sala Llena', laminas: [7] } } }), TOPE_BORRADOR);
  assert.equal(notaQA({ errores: ['e', 'f'], avisos: [], porConfirmar: { X: {} } }), 76);
});

test('duración: clase de 25 min es clase-corta; mayormente tramos en vivo es error aunque sea en vivo; 10% a cámara no avisa', () => {
  const laminas = Array.from({ length: 60 }, (_, i) => idea(`Lámina ${i}`, { voz: 'una frase de diez palabras que se dice en voz alta' }));
  const cam = dur => ({ tipo: 'camara', nota: 'actividad', vivo: true, dur });
  const finanzas = { pieza: 'clase', duracion_objetivo: 25, en_vivo: true, laminas: [...laminas, cam(300), cam(300), cam(600)] };
  const r = reglasDuracion(finanzas, unos(finanzas.laminas.length));
  assert.ok(r.errores.some(e => /mayormente tramos sin lámina/.test(e)), r.errores.join('\n'));
  assert.ok(r.avisos.some(a => /clase-corta 15-30/.test(a)));
  const corta = reglasDuracion({ ...finanzas, pieza: 'clase-corta' }, unos(finanzas.laminas.length));
  assert.ok(!corta.avisos.some(a => /fuera de/.test(a)));
  // ~10% en vivo: sin aviso de cámara
  const poco = reglasDuracion({ pieza: 'tutorial', laminas: [...laminas, { tipo: 'camara', dur: 25 }] }, unos(61));
  assert.ok(!poco.avisos.some(a => /tramos a cámara/.test(a)), poco.avisos.join('\n'));
  // 45% a cámara en un video: aviso, no error
  const mitad = reglasDuracion({ pieza: 'tutorial', laminas: [...laminas, { tipo: 'camara', dur: 200 }] }, unos(61));
  assert.ok(mitad.avisos.some(a => /tramos a cámara \(\d+%\)/.test(a)), mitad.avisos.join('\n'));
});

test('duración: en un VSL corto la oferta que arranca después del 70% avisa', () => {
  const beats = n => Array.from({ length: n }, (_, i) => idea(`L${i}`, { voz: 'una frase de diez palabras que se dice en voz alta' }));
  const tarde = { pieza: 'vsl-corto', laminas: [...beats(50), { tipo: 'oscura', titulo: 'X', voz: 'Te presento X' }, ...beats(5)] };
  assert.ok(reglasDuracion(tarde, unos(56)).avisos.some(a => /oferta del VSL corto empieza/.test(a)));
  const bien = { pieza: 'vsl-corto', laminas: [...beats(30), { tipo: 'oscura', titulo: 'X', voz: 'Te presento X' }, ...beats(25)] };
  assert.ok(!reglasDuracion(bien, unos(56)).avisos.some(a => /oferta del VSL corto/.test(a)));
});

// ---------- ronda 3: llamado con palabra clave, arco en todas las piezas, estado final, afirmación propia, ritmo ----------
import { esLlamadoVisible, faltaParaFinal, reglasAfirmacionPropia, reglasRitmo, emojisDeLamina } from '../scripts/lib/reglas-deck.mjs';

test('llamado: verbo + palabra clave marcada o en MAYÚSCULAS, «este/tu + algo» o un canal cuentan; frases de contenido no', () => {
  const si = ['Comenta ==DOBLE==', 'Comenta DOBLE', 'Escríbeme **CITA** por WhatsApp', 'Guarda este reel', 'Responde **SÍ** a este correo',
    'Agenda **la llamada de arranque**', 'Manda INFO al 33 1234 5678', 'Agenda tu llamada', 'Comenta la palabra DOBLE'];
  const no = ['Así cobras **el doble**', 'agenda', 'WhatsApp', 'Agenda citas sola', 'Guarda el dinero', 'Recordatorios por WhatsApp'];
  si.forEach(t => assert.ok(esLlamadoVisible(idea(t)), t));
  no.forEach(t => assert.ok(!esLlamadoVisible(idea(t)), t));
});

test('arco: reel, tutorial y propuesta sin llamado final avisan; el reel con «Comenta ==DOBLE==» sin llamado:true no', () => {
  const cuerpo = [idea('Uno'), idea('Dos'), idea('Tres'), idea('Cuatro')];
  for (const pieza of ['reel', 'tutorial', 'video', 'propuesta']) {
    assert.ok(reglasArco({ pieza, laminas: [...cuerpo, idea('Así cobras **el doble**')] }).avisos.some(a => /termina sin llamado/.test(a)), pieza);
  }
  assert.ok(!reglasArco({ pieza: 'reel', laminas: [...cuerpo, idea('Comenta ==DOBLE==')] }).avisos.some(a => /termina sin llamado/.test(a)));
  // un reel con dos llamados separados avisa (lleva 1)
  assert.ok(reglasArco({ pieza: 'reel', laminas: [idea('Guarda este reel'), ...cuerpo, idea('Comenta ==DOBLE==')] }).avisos.some(a => /2 llamados/.test(a)));
  // propuesta: un `flujo` con «firmas» cierra; sin monto ni {{PRECIO}} avisa por la inversión
  const prop = { pieza: 'propuesta', laminas: [...cuerpo, { tipo: 'flujo', nodos: [{ emoji: '✍️', etiqueta: 'Firmas' }, { emoji: '🚀', etiqueta: 'Arrancamos el lunes' }] }] };
  const r = reglasArco(prop);
  assert.ok(!r.avisos.some(a => /termina sin llamado/.test(a)), r.avisos.join('\n'));
  assert.ok(r.avisos.some(a => /lámina de inversión/.test(a)));
  assert.ok(!reglasArco({ ...prop, laminas: [{ tipo: 'cifra', valor: 'Inversión: [PRECIO]' }, ...prop.laminas] }).avisos.some(a => /inversión/.test(a)));
});

test('faltaParaFinal: un vsl sin prueba, sin objeción y con 1 llamado da esas claves; una clase no da nada', () => {
  const vsl = { pieza: 'vsl', laminas: [idea('Uno'), idea('Dos'), { tipo: 'boton', boton: 'Aplica aquí' }] };
  const f = faltaParaFinal(vsl);
  for (const k of ['prueba real', 'objeción antes del llamado', '2º llamado visible', 'cifra de credibilidad']) assert.ok(f.includes(k), k);
  assert.deepEqual(faltaParaFinal({ pieza: 'clase', laminas: [idea('Uno'), idea('Nos vemos en la próxima clase')] }), []);
});

test('afirmación propia: «me hizo cobrar el doble» y «te mando la tabla» quedan por confirmar; «vendiste», «me hizo pensar» no', () => {
  const short = { pieza: 'reel', laminas: [
    idea('La regla del 1% que **me hizo cobrar el doble**', { nota: 'Sin un solo aumento grande', voz: 'Esta regla me hizo cobrar el doble.' }),
    idea('Dos'), idea('Tres'), idea('Cuatro'), idea('Cinco'), idea('Seis'), idea('Siete'),
    idea('Comenta ==DOBLE==', { nota: 'y te mando la tabla con tus 70 precios', voz: 'Comenta DOBLE y te mando la tabla.' })] };
  const r = reglasAfirmacionPropia(short);
  assert.deepEqual(r.porConfirmar.CASO_PROPIO.laminas, [1]);
  assert.deepEqual(r.porConfirmar.ENTREGABLE.laminas, [8]);
  assert.ok(r.avisos.some(a => /descargo/.test(a)));
  // confirmado en datos: ya no queda por confirmar
  const ok = reglasAfirmacionPropia({ ...short, datos: { CASO_PROPIO: 'Pasé de $800 a $1,600 por sesión en 2025', ENTREGABLE: 'tabla.xlsx' } });
  assert.deepEqual(ok.porConfirmar, {});
  // negativos
  const neg = reglasAfirmacionPropia({ laminas: [idea('Si vendiste 50 mil este mes'), idea('Esto me hizo pensar'), idea('Que tu negocio gane más')] });
  assert.deepEqual(neg.porConfirmar, {});
  // con porConfirmar el deck no pasa de 90
  assert.equal(notaQA({ porConfirmar: r.porConfirmar }), TOPE_BORRADOR);
});

test('ritmo: un paso de 16 palabras avisa (uno por deck), uno de 13 solo no, uno de 22 es error; dur y cámara quedan fuera', () => {
  const pal = n => Array.from({ length: n }, (_, i) => `palabra${i}`).join(' ');
  const base = Array.from({ length: 8 }, (_, i) => idea(`L${i}`, { voz: 'una frase corta de seis palabras' }));
  const r16 = reglasRitmo({ laminas: [...base, idea('x', { voz: pal(16) }), idea('y', { voz: pal(16) })] }, unos(10));
  assert.equal(r16.avisos.filter(a => /pasan de 5 s/.test(a)).length, 1, r16.avisos.join('\n'));
  assert.deepEqual(r16.errores, []);
  assert.deepEqual(reglasRitmo({ laminas: [...base, idea('x', { voz: pal(13) })] }, unos(9)).avisos, []);
  assert.ok(reglasRitmo({ laminas: [...base, idea('x', { voz: pal(22) })] }, unos(9)).errores.some(e => /dura 8\.\d s/.test(e)));
  const exento = reglasRitmo({ laminas: [...base, idea('x', { voz: pal(30), dur: 9 }), { tipo: 'camara', voz: pal(40) }] }, unos(10));
  assert.deepEqual([exento.errores, exento.avisos], [[], []]);
  assert.ok(r16.ritmo.mediana > 0 && r16.ritmo.p90 >= r16.ritmo.mediana);
  // la réplica del video queda sin hallazgos de ritmo
  const rep = JSON.parse(fs.readFileSync(new URL('./replica/deck.json', import.meta.url), 'utf8'));
  const rr = reglasRitmo(rep, rep.laminas.map(l => (Array.isArray(l.voz) ? l.voz.length : 1)));
  assert.deepEqual([rr.errores, rr.avisos], [[], []]);
});

test('iconos: la viñeta y los avatares entran al inventario', () => {
  const deck = { laminas: [{ tipo: 'chat', avatar_otro: '🤖', mensajes: [{ texto: 'hola 🤔' }] }, { tipo: 'lista', vineta: '🤔', items: ['a', 'b'] }, { tipo: 'lista', vineta: 'x', items: ['c'] }] };
  const inv = inventarioIconos(deck);
  assert.ok(inv['🤖'] && inv['🤖'][0].startsWith('lámina 1'));
  assert.ok(inv['🤔'] && inv['🤔'].some(x => x.startsWith('lámina 2')));
  assert.ok(inv['❌'], 'el alias x de la viñeta cuenta como ❌');
  assert.equal(emojisDeLamina(deck.laminas[0])[0].campo, 'avatar_otro');
});
