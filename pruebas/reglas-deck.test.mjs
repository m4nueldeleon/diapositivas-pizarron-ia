// Reglas de QA que se leen en el deck.json (scripts/lib/reglas-deck.mjs): sin navegador.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reglasFirma, reglasDuracion, reglasApertura, reglasVoz, reglasProyeccion, reglasPrueba, reglasArco, palabrasProhibidas } from '../scripts/lib/reglas-deck.mjs';
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
  assert.deepEqual(reglasDuracion({ laminas, duracion_objetivo: '4:00' }, unos(60)), { errores: [], avisos: [], estimado: est });
  assert.match(reglasDuracion({ pieza: 'reel', laminas }, unos(60)).avisos.join(' '), /pasa de 60 s/);
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
  assert.deepEqual(reglasProyeccion({ laminas: [{ ...cuenta, arriba: 'Si te escriben 20 al día:' }] }).avisos, []);
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
