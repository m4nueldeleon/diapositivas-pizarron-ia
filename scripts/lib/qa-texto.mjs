import { manoDesdeHTML, pendientesDesdeHTML } from './mano-html.mjs';
// Filtro previo sin Chromium. Su nota es provisional y nunca acredita revisión visual.
import { revisarDeck, notaQA, infoPersona, reglasDeckCompleto, clasificarAvisos, fichaReglasCliente } from './reglas-deck.mjs';
import { infoConceptos } from './emoji-diccionario.mjs';
import { errorVozPasos } from './pasos-mapa.mjs';

export const VISUALES_PENDIENTES = ['contraste', 'desbordes', 'geometría de la capa a mano', 'emojis', 'hoja'];
export function informeSinMedir(errores = [], resto = {}) {
  return { ...resto, medido: false, estado: 'sin-medir', nota_provisional: resto.nota_provisional ?? 0,
    nota_es_provisional: true, errores, comprobaciones_visuales_pendientes: VISUALES_PENDIENTES,
    advertencia: 'SIN RENDER, revisión visual pendiente. Faltan las medidas visuales y ver la hoja.' };
}

export function revisarTexto(prep) {
  const { deck, crudo, pasos, revela, dirDeck } = prep;
  const revision = revisarDeck({ ...deck, datos: crudo.datos }, pasos, { dirDeck, crudo, revela, credenciales: prep.credenciales });
  const errores = [...prep.avisos.map(a => 'construcción: ' + a), ...revision.errores];
  const avisos = [...(prep.sugerencias || []), ...revision.avisos];
  const composicion = reglasDeckCompleto(deck, { manoPorLamina: manoDesdeHTML(prep.html) });
  avisos.push(...composicion.avisos);
  deck.laminas.forEach((lamina, i) => {
    if (lamina.tipo === 'camara') return;
    for (const campo of ['voz', 'anclas']) {
      if (Array.isArray(lamina[campo]) && lamina[campo].length !== pasos[i]) {
        errores.push(`lámina ${i + 1}: ${errorVozPasos(campo, lamina[campo], pasos[i], revela[i])}`);
      }
    }
    if (typeof lamina.voz === 'string' && pasos[i] > 1) avisos.push(`lámina ${i + 1}: voz es un solo texto para ${pasos[i]} pasos; usa una lista (LAYOUTS, Pasos que genera cada diseño)`);
  });
  const pendientes = Object.fromEntries(Object.entries(prep.faltan || {}).map(([k,ls]) => [k,[...ls]]));
  pendientesDesdeHTML(prep.html).forEach((claves,i) => {
    for (const k of claves) {
      if (!prep.declarados?.[k] && !prep.propuestos?.[k]) pendientes[k] = [...new Set([...(pendientes[k] || []),i+1])];
    }
  });
  Object.entries(pendientes).forEach(([clave, laminas]) => errores.push(`dato pendiente [${clave}] en láminas ${laminas.join(', ')}: confírmalo o decláralo en datos (LAYOUTS, Datos que se llenan una vez)`));
  const propuestos = Object.fromEntries(Object.entries(prep.propuestos || {}).map(([clave, laminas]) => [clave, { valor: crudo.datos[clave].valor, ...(crudo.datos[clave].fuente ? {fuente:crudo.datos[clave].fuente} : {}), laminas }]));
  const porConfirmar = { ...prep.declarados, ...propuestos, ...revision.porConfirmar };
  const clasificacion = clasificarAvisos(avisos,deck.avisos_aceptados);
  return informeSinMedir(errores, { nota_provisional: notaQA({ errores, avisos:clasificacion.pendientes, porConfirmar }), avisos:clasificacion.pendientes, avisos_aceptados: clasificacion.aceptados,
    reglas_cliente:fichaReglasCliente(deck,avisos), datos_fuentes:prep.fuentes || {}, datos_por_confirmar:porConfirmar,
    info: [...infoPersona(deck), infoConceptos(deck), ...clasificacion.aceptados.map(a => `excepción pedida por el cliente: ${a.aviso}; ${a.motivo}`)].filter(Boolean), iconos:revision.iconos, por_confirmar: porConfirmar, pendientes, ritmo: revision.ritmo, arco: revision.arco,
    falta_para_final: revision.faltaParaFinal, laminas: deck.laminas.length, pasos: pasos.reduce((a, b) => a + b, 0),
    mapa_pasos: Object.fromEntries(deck.laminas.map((l, i) => [`${i + 1} · ${l.id || l.tipo}`, revela[i] || []])),
    laminas_dir: prep.evidencia.laminas_dir, invalido: prep.evidencia.invalido, deck_sha: prep.evidencia.deck_sha, fecha: new Date().toISOString() });
}
