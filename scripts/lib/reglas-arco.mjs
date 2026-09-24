// reglas-arco.mjs — reglas de QA del ARCO de la pieza, sobre el deck.json (sin navegador): el mapa 1-2-3 que vuelve,
// la respuesta a una objeción, el «cómo» de un reel y las métricas del arco que qa.json expone (contrato de tiempo, la
// revelación y los llamados en %). reglas-deck.mjs las suma en revisarDeck. Pruebas en pruebas/arco-r5.test.mjs.
import { plano } from './markup.mjs';
import { tiemposSecuenciales, duracionTotal, mmss } from './tiempos.mjs';
import { sinAcentos, nombre, textosVisibles, conTexto, esLlamadoVisible, inicioOferta, esObjecion } from './reglas-deck.mjs';

const esOscura = l => l && (l.tipo === 'oscura' || l.oscura === true);

// ---------- el mapa 1-2-3 que vuelve (ARCOS «Las plantillas», GUION §5) ----------
// En la referencia el mapa abre bloques de MINUTOS [16:35 mapa → 16:40 «Step 1» → 23:08 → 28:01]. En una pieza corta, un
// regreso al mapa SIN texto propio después de una sola lámina es un vaivén (mapa → cita → mapa → reto → mapa) que no
// dice nada. El regreso que trae el titular del bloque en `texto` (el reel: «La IA te hace la minuta») es una lámina
// con contenido y no avisa. Dos avisos, uno por deck cada uno:
//   a) el mismo mapa en dos láminas SEGUIDAS (el mapa completo y luego el mismo con `activo: 1`);
//   b) un regreso sin `texto` cuyo bloque anterior es corto: < 20 s de voz, o < 3 láminas y < 30 s.
export const BLOQUE_MAPA = { segundos: 20, laminas: 3, segundosConPocas: 30 };
const firmaMapa = l => (Array.isArray(l.iconos) || Array.isArray(l.etiquetas)
  ? JSON.stringify([l.iconos || null, (l.etiquetas || []).map(x => plano(String(x)))]) : null);
// Grupos de apariciones del mismo mapa: por `como` (al id que apunta) o, sin `como`, por sus íconos y etiquetas
export function gruposDeMapa(deck) {
  const L = deck.laminas, grupos = new Map(), porFirma = new Map(), porId = new Map();
  L.forEach((l, i) => {
    if (!l || l.tipo !== 'pasos') return;
    let clave = null;
    if (typeof l.como === 'string') clave = porId.get(l.como) ?? `id:${l.como}`;
    const f = firmaMapa(l);
    if (!clave && f && porFirma.has(f)) clave = porFirma.get(f);
    if (!clave) clave = `lam:${i}`;
    if (l.id) porId.set(l.id, clave);
    if (f && !porFirma.has(f)) porFirma.set(f, clave);
    grupos.set(clave, [...(grupos.get(clave) || []), i]);
  });
  return [...grupos.values()].filter(g => g.length > 1);
}
export function reglasRetornoMapa(deck, pasos) {
  const L = deck.laminas, t = tiemposSecuenciales(deck, pasos);
  const inicio = i => (t.find(s => s.lamina === i) || { inicio: 0 }).inicio;
  const fin = i => { const s = t.filter(x => x.lamina === i); return s.length ? s[s.length - 1].fin : inicio(i); };
  const seguidos = [], vaivenes = [];
  for (const g of gruposDeMapa(deck)) {
    for (let k = 1; k < g.length; k++) {
      const a = g[k - 1], b = g[k];
      if (b === a + 1) { seguidos.push(b); continue; }
      if (conTexto(plano(String(L[b].texto || '')))) continue;
      const entre = L.slice(a + 1, b).length, s = Math.max(0, inicio(b) - fin(a));
      if (s < BLOQUE_MAPA.segundos || (entre < BLOQUE_MAPA.laminas && s < BLOQUE_MAPA.segundosConPocas)) vaivenes.push({ b, entre, s });
    }
  }
  const avisos = [];
  if (seguidos.length) avisos.push(`mapa repetido seguido (lámina ${seguidos.map(b => `${b} → ${b + 1}`).join(', ')}): es la misma lámina dos veces; pon \`activo: 1\` en el primero y quita el segundo (ARCOS «Las plantillas», GUION §5)`);
  if (vaivenes.length) avisos.push(`el mapa vuelve sin nada nuevo en ${vaivenes.map(v => `la ${nombre(deck, v.b)} (${v.entre} ${v.entre === 1 ? 'lámina' : 'láminas'}, ~${Math.round(v.s)} s desde el anterior)`).join(', ')}: mete el titular del bloque en el \`texto\` del mapa (como el reel) o quita el regreso y marca el avance con una nota «Paso N de 3»; el regreso sin texto es para bloques de 3 láminas o 20 s de voz o más, como los de minutos de la referencia [16:35 → 23:08] (ARCOS «Las plantillas», GUION §5)`);
  return { errores: [], avisos };
}

// ---------- la respuesta a una objeción DEMUESTRA (GUION §2 y §7, beat 0) ----------
// Después de «Reason #1» la referencia demuestra con otro diseño [34:30 cuadrantes cuchillo/formón, 35:10 la ecuación
// «You + AI = Product», 35:35 el chat, 36:05 los pasos 1-2-3]; la `idea` de frase («Absolutely.») va DESPUÉS, como
// remate. El bloque de respuesta va desde la lámina siguiente hasta la próxima objeción, la oscura o el primer botón (3
// como máximo). Si su primera lámina es una `idea` sin `fuente`, la respuesta solo afirma.
const PIEZAS_OBJECION = ['vsl', 'vsl-corto', 'webinar'];
export const demuestraRespuesta = l => l && l.tipo !== 'camara' && (l.tipo !== 'idea' || conTexto(l.fuente));
export function reglasRespuestaObjecion(deck) {
  const avisos = [];
  if (!PIEZAS_OBJECION.includes(deck.pieza)) return { errores: [], avisos };
  const L = deck.laminas;
  L.forEach((l, i) => {
    if (!esObjecion(l)) return;
    const bloque = [];
    for (let j = i + 1; j < L.length && bloque.length < 3; j++) {
      const x = L[j];
      if (!x || esObjecion(x) || esOscura(x) || x.tipo === 'boton') break;
      if (x.tipo !== 'camara') bloque.push(x);
    }
    if (!bloque.length || demuestraRespuesta(bloque[0])) return;
    const n = (sinAcentos(plano(String(l.encabezado || ''))).match(/\d+/) || ['N'])[0];
    avisos.push(`${nombre(deck, i)}: la respuesta a la Objeción #${n} solo afirma; demuéstrala con \`flujo\`, \`chat\`, \`linea-tiempo\`, \`cuadrantes\`, \`prueba\` o \`cifra\` con fuente, y deja la \`idea\` de frase como remate después (GUION §2, tabla «objeción → respuesta»)`);
  });
  return { errores: [], avisos };
}

// ---------- el «cómo» de un reel (ARCOS §Reel) ----------
// Un reel que promete tareas, pasos o un «cómo» («3 tareas que ya puedes delegar a la IA») enseña algo que se puede
// hacer: el prompt literal en un `chat` (mensaje `de: "yo"` que arranca con un verbo), una captura real (`prueba` con
// `src`) o una foto del paso (`objeto` con `imagen`). Un botón «Enviar» solo no enseña qué escribir. Un reel de opinión
// o de «3 errores» no promete un cómo y no se revisa.
const PROMETE_COMO = /\b(puedes|como|pasos?|tareas?|delega\w*|prompts?|trucos?|haz esto)\b/;
const PROMPT = /^(haz(me)?|dame|escribe(me)?|redacta|resume(me)?|ordena|separa|genera|crea|lee|busca|pon|arma|dime|revisa|clasifica|saca|convierte|traduce|analiza|prepara|responde|contesta|lista|agrupa|ayudame|sugiere|compara|calcula|extrae|marca|archiva|manda|programa|agenda|toma|anota|transcribe)\b/;
export const esPrompt = m => m && typeof m === 'object' && m.de === 'yo' && PROMPT.test(sinAcentos(plano(String(m.texto || ''))).replace(/^[^a-z]+/, ''));
export const ensenaComo = l => l && ((l.tipo === 'chat' && Array.isArray(l.mensajes) && l.mensajes.some(esPrompt))
  || (l.tipo === 'prueba' && Array.isArray(l.capturas) && l.capturas.some(c => c && conTexto(c.src) && c.ejemplo !== true))
  || (l.tipo === 'objeto' && conTexto(l.imagen)));
export function prometeComo(deck) {
  const L = deck.laminas, mapa = L.findIndex(l => l && l.tipo === 'pasos');
  const donde = [0, 1, mapa].filter((i, k, a) => i >= 0 && i < L.length && a.indexOf(i) === k);
  return donde.some(i => PROMETE_COMO.test(sinAcentos(textosVisibles(L[i]).join(' / '))));
}
export const reelSinComo = deck => deck.pieza === 'reel' && prometeComo(deck) && !deck.laminas.some(ensenaComo);
export function reglasReel(deck) {
  if (!reelSinComo(deck)) return { errores: [], avisos: [] };
  return { errores: [], avisos: ['el reel promete un «cómo» (tareas, pasos, «puedes…») y ninguna lámina lo enseña: pon el prompt literal en un `chat` (mensaje `de: "yo"`), una captura real o la foto del paso; «Guarda este reel» solo sirve si hay algo que guardar a la vista (ARCOS §Reel, ejemplos/reel)'] };
}

// ---------- métricas del arco (qa.json → arco) y el contrato de tiempo (ARCOS, GUION §6.1 [2:03]) ----------
// El contrato («los próximos 33 minutos» [2:03]) se marca con `"contrato": true`. Sin marca se busca solo en el primer 25%
// de las láminas, en un `objeto` con `reloj` o en una `idea`/`objeto`/`cifra` que diga «los próximos N minutos» o «en N
// minutos te/vas/aprendes/sales»: «en 5 minutos lo configuras» dentro de una lista o de un paso es una tarea, no una promesa.
const RE_CONTRATO = /\b(?:los |estos |las )?proxim[oa]s? (\d{1,3}) minutos\b|\ben (?:estos |los )?(\d{1,3}) minutos (?:te |vas |aprendes|sales|salimos|tienes)/;
const minutosDe = l => {
  if (l.tipo === 'objeto' && typeof l.reloj === 'string' && /^\d{1,2}:\d{2}$/.test(l.reloj)) { const [m, s] = l.reloj.split(':').map(Number); if (m + s / 60 > 0) return m + s / 60; }
  // «Te pido los próximos:» + «__4 minutos__» (una `cifra` en dos líneas) se leen juntos
  const m = sinAcentos(textosVisibles(l).join(' ')).replace(/[\s:/,.;]+/g, ' ').match(RE_CONTRATO);
  return m ? Number(m[1] || m[2]) : null;
};
export function contratoDeTiempo(deck) {
  const L = deck.laminas, k = L.findIndex(l => l && l.contrato === true);
  if (k >= 0) { const min = minutosDe(L[k]); return min ? { min, lamina: k + 1, fuente: 'marcado' } : null; }
  const tope = Math.max(1, Math.ceil(L.length * 0.25));
  for (let i = 0; i < tope; i++) {
    const l = L[i];
    if (!l || !['objeto', 'idea', 'cifra'].includes(l.tipo)) continue;
    const min = minutosDe(l);
    if (min) return { min, lamina: i + 1, fuente: 'detectado' };
  }
  return null;
}
const PIEZAS_OFERTA = ['vsl', 'vsl-corto', 'webinar', 'propuesta'];
export const conContrato = deck => ['clase', 'clase-corta', 'webinar'].includes(deck.pieza) || (deck.pieza === 'tutorial' && deck.clase === true);
export function arcoDeck(deck, pasos) {
  const L = deck.laminas, t = tiemposSecuenciales(deck, pasos), dur = duracionTotal(deck, pasos);
  const pct = i => { const s = t.find(x => x.lamina === i); return s && dur > 0 ? Math.round((s.inicio / dur) * 100) : null; };
  const c = contratoDeTiempo(deck);
  const arco = { contrato: c, duracion_s: Math.round(dur), desvio_pct: c ? Math.round((dur / (c.min * 60) - 1) * 100) : null };
  if (PIEZAS_OFERTA.includes(deck.pieza)) {
    const rev = L.findIndex(esOscura), ini = inicioOferta(L);
    arco.oferta = rev >= 0 || ini >= 0 ? { revelacion_lamina: rev >= 0 ? rev + 1 : null, revelacion_pct: rev >= 0 ? pct(rev) : null, inicio_pct: ini >= 0 ? pct(ini) : null } : null;
  }
  arco.llamados = L.map((l, i) => [l, i]).filter(([l]) => l && l.tipo !== 'camara' && esLlamadoVisible(l)).map(([l, i]) => ({ lamina: i + 1, id: l.id || l.tipo, pct: pct(i) }));
  return arco;
}
// Una línea para la consola: «arco: contrato 10:00 (lám 4) · voz 9:12 (−8 %) · revelación 58 % · llamados lám 26 (80 %), 30 (98 %)»
export function lineaArco(a) {
  if (!a) return '';
  const partes = [];
  if (a.contrato) partes.push(`contrato ${mmss(a.contrato.min * 60)} (lám ${a.contrato.lamina}) · voz ${mmss(a.duracion_s)} (${a.desvio_pct > 0 ? '+' : ''}${a.desvio_pct} %)`);
  else partes.push(`voz ${mmss(a.duracion_s)}`);
  if (a.oferta && a.oferta.revelacion_pct != null) partes.push(`revelación ${a.oferta.revelacion_pct} % (lám ${a.oferta.revelacion_lamina})`);
  else if (a.oferta && a.oferta.inicio_pct != null) partes.push(`oferta desde ${a.oferta.inicio_pct} %`);
  if (a.llamados.length) partes.push(`llamados ${a.llamados.map(x => `lám ${x.lamina} (${x.pct} %)`).join(', ')}`);
  return `arco: ${partes.join(' · ')}`;
}
// El umbral es el mismo 30% de `duracion_objetivo` (reglasDuracion)
export function reglasContrato(deck, pasos) {
  const avisos = [], c = contratoDeTiempo(deck);
  if (c) {
    const dur = duracionTotal(deck, pasos), d = dur / (c.min * 60) - 1;
    if (Math.abs(d) > 0.3) avisos.push(`la lámina ${c.lamina} promete ${mmss(c.min * 60)} y la voz dura ~${mmss(dur)} (${d > 0 ? '+' : ''}${Math.round(d * 100)} %): ajusta la promesa o los beats; el contrato de tiempo se cumple [2:03 «los próximos 33 minutos»] (ARCOS.md)`);
  } else if (conContrato(deck)) {
    avisos.push('falta el contrato de tiempo: después del gancho, un `objeto` con `reloj` («10:00») y los minutos en negrita, o `"contrato": true` en la lámina que lo promete [2:00-2:03] (ARCOS.md, GUION §6.1)');
  }
  return { errores: [], avisos };
}
