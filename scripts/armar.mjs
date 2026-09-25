#!/usr/bin/env node
// Entrada de producción: no abre Chromium mientras queden hallazgos o datos pendientes.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { argumentos, prepararSalida, leerDeck, DIR_SKILL } from './lib/pipeline.mjs';
import { construirHTML } from './lib/construir.mjs';
import { revisarTexto, informeSinMedir } from './lib/qa-texto.mjs';
import { corregirSigno, candidatosFuente } from './lib/autocorregir.mjs';
import { decisionCiclo, qaVigente } from './lib/ciclo-calidad.mjs';

const { opt, flag, pos } = argumentos(process.argv);
const salida = path.resolve(opt('--salida') || path.join(path.extname(pos[0] || '') === '.json' ? path.dirname(pos[0]) : pos[0] || '.', 'salida'));
const escribir = (nombre, valor) => fs.writeFileSync(path.join(salida, nombre), JSON.stringify(valor, null, 2));

function revisarCandidato(prep, deck) {
  const r = construirHTML({ deck: { ...prep.crudo, ...deck, datos: prep.crudo.datos, marca: prep.deck.marca },
    dirDeck: prep.dirDeck, dirSalida: salida, dirSkill: DIR_SKILL });
  return { pasos: r.pasos, qa: revisarTexto({ ...prep, ...r, crudo: { ...deck, datos: prep.crudo.datos, laminas: r.crudoResuelto.laminas } }) };
}
function sinRegresion(antes, despues, pasosAntes, pasosDespues) {
  return JSON.stringify(pasosAntes) === JSON.stringify(pasosDespues)
    && despues.errores.every(e => antes.errores.includes(e))
    && despues.avisos.every(a => antes.avisos.includes(a))
    && despues.avisos.length < antes.avisos.length;
}
function corregir(prep, original, inicial) {
  const signo = corregirSigno(original);
  let deck = original, qa = inicial;
  const cambios = [], omitidos = [];
  const intentar = (candidato, registro) => {
    const r = revisarCandidato(prep, candidato);
    if (!sinRegresion(qa, r.qa, prep.pasos, r.pasos)) {
      omitidos.push({ ...registro, motivo: 'requiere revisar voz, pasos o avisos nuevos; no se aplica automáticamente' }); return;
    }
    deck = candidato; qa = r.qa; cambios.push(registro);
  };
  if (signo.cambios.length) intentar(signo.deck, { tipo_arreglo: 'json', motivo: 'signo del emoji', detalles: signo.cambios });
  for (const { indice, paso } of candidatosFuente(deck, qa.avisos)) {
    intentar({ ...deck, laminas: deck.laminas.map((l, i) => i === indice ? { ...l, fuente_paso: paso } : l) },
      { tipo_arreglo: 'json', lamina: indice + 1, campo: 'fuente_paso', antes: deck.laminas[indice].fuente_paso ?? null, despues: paso, motivo: 'la cita completa ya está en la voz de ese paso' });
  }
  return { deck, cambios, omitidos };
}

try {
  fs.mkdirSync(salida, { recursive: true });
  const original = leerDeck(pos[0]);
  let prep = prepararSalida(original.jsonPath, salida), qa = revisarTexto(prep);
  const inicial = qa;
  const correccion = flag('--corregir') ? corregir(prep, original.deck, qa) : { deck: original.deck, cambios: [], omitidos: [] };
  if (correccion.cambios.length) {
    // Snapshot por contenido: una reanudación nunca pisa la entrada anterior.
    const respaldo = `deck-antes-${prep.evidencia.deck_sha}.json`;
    if (!fs.existsSync(path.join(salida, respaldo))) fs.copyFileSync(original.jsonPath, path.join(salida, respaldo));
    fs.writeFileSync(original.jsonPath, JSON.stringify(correccion.deck, null, 2) + '\n');
  }
  // Reconstruye siempre: la evidencia corresponde exactamente al archivo en disco, aun si se rechazó una corrección.
  prep = prepararSalida(original.jsonPath, salida); qa = revisarTexto(prep);
  escribir('qa-texto.json', qa);
  const archivoCiclo = path.join(salida, 'armado.json');
  const previo = fs.existsSync(archivoCiclo) ? JSON.parse(fs.readFileSync(archivoCiclo, 'utf8')) : { rondas: [] };
  if (!Array.isArray(previo.rondas)) throw new Error('armado.json inválido: conserva la evidencia y revisa rondas');
  const ciclo = decisionCiclo(qa, previo.rondas.map(r => r.qa_visual ?? r.qa));
  const ronda = { deck_sha: qa.deck_sha, inicial, qa, cambios: correccion.cambios, omitidos: correccion.omitidos };
  escribir('armado.json', { ...ciclo, rondas: [...previo.rondas, ronda] });
  console.log(`Preflight: ${ciclo.estado} · ${qa.errores.length} errores · ${qa.avisos.length} avisos · ${Object.keys(qa.por_confirmar).length} datos por confirmar`);
  for (const h of ciclo.cola) console.log(`  ${h.tipo_arreglo}: ${h.mensaje}`);
  if (!ciclo.puede_renderizar || flag('--sin-navegador')) {
    console.log(qa.advertencia); process.exit(3);
  }
  const encaje = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts/qa.mjs'), original.jsonPath, '--salida', salida, '--preflight-geometria'], { stdio: 'inherit' });
  if (encaje.error) throw encaje.error;
  if (encaje.status !== 0) {
    escribir('armado.json', { ...ciclo, estado: encaje.status === 4 ? 'render_fallido' : 'encaje-pendiente', puede_renderizar: false, puede_entregar: false, rondas: [...previo.rondas, ronda] });
    process.exit(encaje.status ?? 3);
  }
  const inicioRender = Date.now();
  const r = spawnSync(process.execPath, [path.join(DIR_SKILL, 'scripts/render.mjs'), original.jsonPath, '--salida', salida, '--qa'], { stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status === 0 || r.status === 1) {
    const medido = JSON.parse(fs.readFileSync(path.join(salida, 'qa.json'), 'utf8'));
    if (!qaVigente(medido, { ...prep.evidencia, html_sha: prep.html_sha, desde: inicioRender })) throw new Error('El render no dejó un QA nuevo del mismo deck y HTML; la medición previa no acredita esta corrida');
    const visual = decisionCiclo(medido, previo.rondas.map(x => x.qa_visual ?? x.qa));
    escribir('armado.json', { ...visual, rondas: [...previo.rondas, { ...ronda, qa_visual: medido }] });
    console.log(`QA medido: ${medido.nota}/100 · ${medido.estado}. Revisa todas las hojas antes de entregar.`);
    process.exit(r.status === 0 && medido.estado === 'listo' ? 0 : 3);
  }
  escribir('armado.json', { ...ciclo, estado: 'render_fallido', codigo_render: r.status, puede_entregar: false,
    advertencia: qa.advertencia, rondas: [...previo.rondas, ronda] });
  process.exit(r.status ?? 1);
} catch (error) {
  fs.mkdirSync(salida, { recursive: true });
  const qa = informeSinMedir(error.errores || [error.message]);
  escribir('qa-texto.json', qa);
  console.error(error.message); console.error(qa.advertencia); process.exit(2);
}
