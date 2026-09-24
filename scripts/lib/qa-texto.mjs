// Filtro previo sin Chromium. Su nota es provisional y nunca acredita revisión visual.
import { revisarDeck, notaQA, infoPersona } from './reglas-deck.mjs';
import { errorVozPasos } from './pasos-mapa.mjs';

export const VISUALES_PENDIENTES = ['contraste', 'desbordes', 'capa a mano', 'emojis', 'hoja'];
export function informeSinMedir(errores = [], resto = {}) {
  return { ...resto, medido: false, estado: 'sin-medir', nota_provisional: resto.nota_provisional ?? 0,
    nota_es_provisional: true, errores, comprobaciones_visuales_pendientes: VISUALES_PENDIENTES,
    advertencia: 'SIN RENDER, revisión visual pendiente. Faltan las medidas visuales y ver la hoja.' };
}

export function revisarTexto(prep) {
  const { deck, crudo, pasos, revela, dirDeck } = prep;
  const revision = revisarDeck({ ...deck, datos: crudo.datos }, pasos, { dirDeck, crudo, revela });
  const errores = [...prep.avisos.map(a => 'construcción: ' + a), ...revision.errores];
  const avisos = [...(prep.sugerencias || []), ...revision.avisos];
  deck.laminas.forEach((lamina, i) => {
    if (lamina.tipo === 'camara') return;
    for (const campo of ['voz', 'anclas']) {
      if (Array.isArray(lamina[campo]) && lamina[campo].length !== pasos[i]) {
        errores.push(`lámina ${i + 1}: ${errorVozPasos(campo, lamina[campo], pasos[i], revela[i])}`);
      }
    }
    if (typeof lamina.voz === 'string' && pasos[i] > 1) avisos.push(`lámina ${i + 1}: voz es un solo texto para ${pasos[i]} pasos; usa una lista (LAYOUTS, Pasos que genera cada diseño)`);
  });
  Object.entries(prep.faltan || {}).forEach(([clave, laminas]) => errores.push(`dato pendiente [${clave}] en láminas ${laminas.join(', ')}: confírmalo o decláralo en datos (LAYOUTS, Datos que se llenan una vez)`));
  const propuestos = Object.fromEntries(Object.entries(prep.propuestos || {}).map(([clave, laminas]) => [clave, { valor: crudo.datos[clave].valor, laminas }]));
  const porConfirmar = { ...prep.declarados, ...propuestos, ...revision.porConfirmar };
  return informeSinMedir(errores, { nota_provisional: notaQA({ errores, avisos, porConfirmar }), avisos,
    info: infoPersona(deck), por_confirmar: porConfirmar, pendientes: prep.faltan, ritmo: revision.ritmo, arco: revision.arco,
    falta_para_final: revision.faltaParaFinal, laminas: deck.laminas.length, pasos: pasos.reduce((a, b) => a + b, 0),
    mapa_pasos: Object.fromEntries(deck.laminas.map((l, i) => [`${i + 1} · ${l.id || l.tipo}`, revela[i] || []])),
    invalido: prep.evidencia.invalido, deck_sha: prep.evidencia.deck_sha, fecha: new Date().toISOString() });
}
