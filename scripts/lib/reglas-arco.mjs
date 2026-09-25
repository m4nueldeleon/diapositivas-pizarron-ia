import { revisarComponentes } from './conversacion.mjs';
import { anotacionAporta, raicesTexto } from './editorial.mjs';
// reglas-arco.mjs — reglas de QA del ARCO de la pieza, sobre el deck.json (sin navegador): el mapa 1-2-3 que vuelve,
// la respuesta a una objeción, el «cómo» de un reel y las métricas del arco que qa.json expone (contrato de tiempo, la
// revelación y los llamados en %). reglas-deck.mjs las suma en revisarDeck. Pruebas en pruebas/arco-r5.test.mjs.
import { plano } from './markup.mjs';
import { tiposRojos } from './reglas-marcas.mjs';
import { analizarCompuesto } from './emoji.mjs';
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
  const seguidos = [], vaivenes = [], sinContenido = [];
  for (const g of gruposDeMapa(deck)) {
    for (let k = 1; k < g.length; k++) {
      const a = g[k - 1], b = g[k];
      if (b === a + 1) {
        if ((L[a].activo || 0) === (L[b].activo || 0) && plano(L[a].texto) === plano(L[b].texto)) seguidos.push(b);
        else if ((L[b].activo || 0) > (L[a].activo || 0)) sinContenido.push(b);
        continue;
      }
      if (conTexto(plano(String(L[b].texto || '')))) continue;
      const entre = L.slice(a + 1, b).length, s = Math.max(0, inicio(b) - fin(a));
      if (s < BLOQUE_MAPA.segundos || (entre < BLOQUE_MAPA.laminas && s < BLOQUE_MAPA.segundosConPocas)) vaivenes.push({ b, entre, s });
    }
  }
  const avisos = sinContenido.map(b => `${nombre(deck,b)}: el paso ${L[b].activo} no tiene contenido: el mapa avanza sin lámina entre medio; mete al menos una lámina del bloque o une los dos mapas`);
  if (seguidos.length) avisos.push(`mapa repetido seguido (lámina ${seguidos.map(b => `${b} → ${b + 1}`).join(', ')}): es la misma lámina dos veces; pon \`activo: 1\` en el primero y quita el segundo (ARCOS «Las plantillas», GUION §5)`);
  if (vaivenes.length) avisos.push(`el mapa vuelve sin nada nuevo en ${vaivenes.map(v => `la ${nombre(deck, v.b)} (${v.entre} ${v.entre === 1 ? 'lámina' : 'láminas'}, ~${Math.round(v.s)} s desde el anterior)`).join(', ')}: mete el titular del bloque en el \`texto\` del mapa (como el reel) o quita el regreso y marca el avance con una nota «Paso N de 3»; el regreso sin texto es para bloques de 3 láminas o 20 s de voz o más, como los de minutos de la referencia [16:35 → 23:08] (ARCOS «Las plantillas», GUION §5)`);
  return { errores: [], avisos };
}

// ---------- la respuesta a una objeción DEMUESTRA (GUION §2 y §7, beat 0) ----------
// Después de «Reason #1» la referencia demuestra con otro diseño [34:30 cuadrantes cuchillo/formón, 35:10 la ecuación
// «You + AI = Product», 35:35 el chat, 36:05 los pasos 1-2-3]; la `idea` de frase («Absolutely.») va DESPUÉS, como
// remate. El bloque de respuesta va desde la lámina siguiente hasta la próxima objeción, la oscura o el primer botón (3
// como máximo). Si su primera lámina es una `idea` sin `fuente`, la respuesta solo afirma.
const PIEZAS_OBJECION = ['vsl', 'vsl-corto', 'webinar', 'clase', 'clase-corta', 'tutorial', 'propuesta', 'reel'];
export const demuestraRespuesta = l => l && l.tipo !== 'camara' && (l.tipo !== 'idea' || conTexto(l.fuente));
export function reglasRespuestaObjecion(deck) {
  const avisos = [];
  if (!PIEZAS_OBJECION.includes(deck.pieza)) return { errores: [], avisos };
  const L = deck.laminas;
  const porConfirmar = {};
  L.forEach((l,i)=>{
    const pregunta=esObjecion(l)?l.texto:(l.tipo==='chat'?(l.mensajes||[]).filter(m=>m.de==='otro'&&/\?/.test(m.texto)).map(m=>m.texto).join(' '):'');
    if(!pregunta)return;
    const respuestas=[];
    for(let j=i;j<L.length;j++) {
      if(j>i&&(esObjecion(L[j])||esOscura(L[j])||L[j].tipo==='boton'))break;
      if(L[j].tipo==='chat')respuestas.push(...(L[j].mensajes||[]).filter(m=>m.de==='yo').map(m=>m.texto));
      else if(j>i)respuestas.push(...textosVisibles(L[j]));
      // R16 [juez r16]: las anotaciones también responden (una nota «Le das una salida» retoma la objeción)
      if(j>i||L[j].tipo==='chat')respuestas.push(...(L[j].anotaciones||[]).map(a=>a?.texto).filter(Boolean));
    }
    for(const f of revisarComponentes(pregunta,respuestas)) {
      if(f.generico){ avisos.push(`${nombre(deck,i)}: la objeción pregunta por «${f.tema}» y la respuesta no lo retoma; responde cada parte de la pregunta`); continue; }
      avisos.push(`${nombre(deck,i)}: componente «${f.tema}» sin respuesta explícita; política pendiente: declara el dato real y responde a cada condición`);
      const clave='POLITICA_'+f.tema.toUpperCase();
      porConfirmar[clave]={pendiente:true,motivo:'La mención no resuelve el componente '+f.tema,laminas:[...(porConfirmar[clave]?.laminas||[]),i+1]};
    }
  });
  L.forEach((l, i) => {
    if (!esObjecion(l)) return;
    const bloque = [];
    for (let j = i + 1; j < L.length && bloque.length < 3; j++) {
      const x = L[j];
      if (!x || esObjecion(x) || esOscura(x) || x.tipo === 'boton') break;
      if (x.tipo !== 'camara') bloque.push(x);
    }
    const raices = raicesTexto(l.texto || '');
    // Prioriza el objeto de la dificultad. Compartir «equipo» o «cliente» no
    // responde a no saber tecnología, no tener tiempo o no poder pagar.
    const problemas = raices.filter(w => /^familia(?:2|4|5|6|7|8|9)$/.test(w));
    const nucleo = problemas.length ? problemas : raices.filter(w => !['equipo','cliente','persona','negocio'].includes(w));
    const respuesta = new Set(raicesTexto(bloque.flatMap(textosVisibles).join(' ')));
    if (demuestraRespuesta(bloque[0]) && nucleo.length && !nucleo.some(w => respuesta.has(w))) avisos.push(`${nombre(deck,i)}: la respuesta no retoma el núcleo de la objeción; conserva la condición, responde literalmente a su verbo o sustantivo principal y muestra un ejemplo (GUION §7)`);
    if (bloque.length && demuestraRespuesta(bloque[0])) return;
    const n = (sinAcentos(plano(String(l.encabezado || ''))).match(/\d+/) || ['N'])[0];
    avisos.push(`${nombre(deck, i)}: la respuesta a la Objeción #${n} solo afirma; demuéstrala con \`flujo\`, \`chat\`, \`linea-tiempo\`, \`cuadrantes\`, \`prueba\` o \`cifra\` con fuente, y deja la \`idea\` de frase como remate después (GUION §2, tabla «objeción → respuesta»)`);
  });
  return { errores: [], avisos, porConfirmar };
}

// ---------- el «cómo» de un reel (ARCOS §Reel) ----------
// Un reel que promete tareas, pasos o un «cómo» («3 tareas que ya puedes delegar a la IA») enseña algo que se puede
// hacer: el prompt literal en un `chat` (mensaje `de: "yo"` que arranca con un verbo), una captura real (`prueba` con
// `src`) o una foto del paso (`objeto` con `imagen`). Un botón «Enviar» solo no enseña qué escribir. Un reel de opinión
// o de «3 errores» no promete un cómo y no se revisa.
const PROMETE_COMO = /\b(pasos?|tareas?|delega\w*|prompts?|trucos?|haz esto|puedes (delegar|hacer|usar|pedir|copiar)|como (hacer|delegar|responder|cobrar|vender|lograr|usar|pedir|conseguir|evitar))\b/;
const PROMPT = /^(haz(me)?|dame|escribe(me)?|redacta|resume(me)?|ordena|separa|genera|crea|lee|busca|pon|arma|dime|revisa|clasifica|saca|convierte|traduce|analiza|prepara|responde|contesta|lista|agrupa|ayudame|sugiere|compara|calcula|extrae|marca|archiva|manda|programa|agenda|toma|anota|transcribe)\b/;
export const esPrompt = m => m && typeof m === 'object' && m.de === 'yo' && PROMPT.test(sinAcentos(plano(String(m.texto || ''))).replace(/^[^a-z]+/, ''));
export const ensenaComo = l => l && ((l.tipo === 'chat' && Array.isArray(l.mensajes) && (l.mensajes.some(esPrompt) || (l.mensajes.some(m => m && m.de === 'yo' && conTexto(m.texto)) && (l.guion === true || /\b(responde(le)?|contesta(le)?|dile|escribele|mandale|copia|pega|pregunta(le)?)\b|\basi\s*:?\s*$|:\s*$/.test(sinAcentos(l.encabezado || ''))))))
  || (l.tipo === 'prueba' && Array.isArray(l.capturas) && l.capturas.some(c => c && conTexto(c.src) && c.ejemplo !== true))
  || (l.tipo === 'objeto' && conTexto(l.imagen)));
export function prometeComo(deck) {
  const L = deck.laminas, mapa = L.findIndex(l => l && l.tipo === 'pasos');
  const donde = [0, 1, mapa].filter((i, k, a) => i >= 0 && i < L.length && a.indexOf(i) === k);
  return donde.some(i => { const t = textosVisibles(L[i]).join(' / '); return /(^|[^\p{L}])c[óÓ]mo(?!\p{L})/u.test(t) || PROMETE_COMO.test(sinAcentos(t)); });
}
export const reelSinComo = deck => deck.pieza === 'reel' && prometeComo(deck) && !deck.laminas.some(ensenaComo);
export function reglasReel(deck) {
  if (!reelSinComo(deck)) return { errores: [], avisos: [] };
  return { errores: [], avisos: ['el reel promete un «cómo» (tareas, pasos, «puedes…») y ninguna lámina lo enseña: pon el texto literal (el prompt para la IA o el guion de respuesta para el cliente) en un `chat` (mensaje `de: "yo"`, `guion: true` o encabezado «Puedes responder así:»), una captura real o la foto del paso; «Guarda este reel» solo sirve si hay algo que guardar a la vista (ARCOS §Reel, ejemplos/reel)'] };
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
  const arco = { contrato: c, duracion_s: Math.round(dur), desvio_pct: c ? Math.round((dur / (c.min * 60) - 1) * 100) : null, golpes: golpesDeck(deck) };
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
  const avisos = [...reglasRevelacion(deck, pasos).avisos], c = contratoDeTiempo(deck);
  if (c) {
    const dur = duracionTotal(deck, pasos), d = dur / (c.min * 60) - 1;
    if (Math.abs(d) > 0.3) avisos.push(`la lámina ${c.lamina} promete ${mmss(c.min * 60)} y la voz dura ~${mmss(dur)} (${d > 0 ? '+' : ''}${Math.round(d * 100)} %): ajusta la promesa o los beats; el contrato de tiempo se cumple [2:03 «los próximos 33 minutos»] (ARCOS.md)`);
  } else if (conContrato(deck)) {
    avisos.push('falta el contrato de tiempo: después del gancho, un `objeto` con `reloj` («10:00») y los minutos en negrita, o `"contrato": true` en la lámina que lo promete [2:00-2:03] (ARCOS.md, GUION §6.1)');
  }
  return { errores: [], avisos };
}

// Una sola regla por pieza; pruebas/r14-documentos.test.mjs exige que SKILL, ARCOS, GUION y LAYOUTS digan lo mismo.
export const RANGO_REVELACION = Object.freeze({ 'vsl-corto': Object.freeze([0.55, 0.60]), vsl: Object.freeze([0.75, 0.82]) });
// VSL largo: revelación 36:16 / 44:55 = 80.74%, banda 75–82%.
// El corto reserva 40–45% para explicar su oferta. Se mide TIEMPO real, no número de láminas ni % redondeado.
export function reglasRevelacion(deck, pasos) {
  const avisos = [];
  if (!['vsl', 'vsl-corto'].includes(deck.pieza)) return { errores: [], avisos };
  const i = deck.laminas.findIndex(esOscura), dur = duracionTotal(deck, pasos);
  if (i < 0 || dur <= 0) return { errores: [], avisos };
  const inicio = tiemposSecuenciales(deck, pasos).find(s => s.lamina === i)?.inicio;
  const proporcion = inicio / dur;
  const [min,max]=RANGO_REVELACION[deck.pieza==='vsl'?'vsl':'vsl-corto'];
  if (proporcion < min || proporcion > max) avisos.push(`la revelación de ${deck.pieza} cae al ${(proporcion * 100).toFixed(1)}% de la duración: debe caer entre ${Math.round(min*100)}–${Math.round(max*100)}%; ajusta el arco antes de capturar (ARCOS.md)`);
  return { errores: [], avisos };
}

// El objeto del primer 20 % vuelve durante el último 25 %: un solo pago basta por deck.
const PIEZAS_PAGO = new Set(['vsl', 'vsl-corto', 'webinar', 'clase', 'clase-corta', 'reel']);
export function reglasPagoGancho(deck) {
  const avisos = [], L = deck.laminas || [];
  if ((!PIEZAS_PAGO.has(deck.pieza) && deck.clase !== true) || !L.length) return { errores: [], avisos };
  const limiteGancho = Math.max(1, Math.ceil(L.length * 0.2));
  const inicioCierre = Math.floor(L.length * 0.75);
  const indice = id => typeof id === 'string' ? L.findIndex(l => l.id === id) : -1;
  const apuntaGancho = id => indice(id) >= 0 && indice(id) < limiteGancho;
  L.forEach((l, i) => {
    if (l.paga != null && !apuntaGancho(l.paga)) avisos.push(`${nombre(deck, i)}: paga apunta fuera del primer 20 % o a un id inexistente; usa el id del objeto del gancho (ARCOS.md, siembra y pago)`);
    if (l.paga != null && apuntaGancho(l.paga)) {
      const origen = L[indice(l.paga)];
      if (indice(l.paga) >= i) avisos.push(`${nombre(deck, i)}: paga debe retomar una lámina anterior, no pagarse a sí misma`);
      const bases = x => [].concat(x.emoji || []).flatMap(e => { const c = analizarCompuesto(e); return [c.base, c.insignia].filter(Boolean).map(s => s.replace(/\uFE0F|[\u{1F3FB}-\u{1F3FF}]/gu, '')); });
      const a = bases(origen), b = bases(l);
      if (origen.tipo === l.tipo && a.length && b.length && !a.some(e => b.includes(e))) avisos.push(`${nombre(deck, i)}: el pago del gancho cambia todos sus íconos; conserva el objeto de «${l.paga}» para que se reconozca al volver`);
    }
  });
  if (!L.slice(inicioCierre).some(l => apuntaGancho(l.paga) || apuntaGancho(l.como))) avisos.push('falta el pago del gancho: en el último 25 % retoma un objeto del primer 20 % con paga o como, el mismo diseño y emoji, resuelto o reafirmado (ARCOS.md, siembra y pago; GUION §6)');
  return { errores: [], avisos };
}

// Un golpe tiene una forma fuerte, distinta de la cuota de tinta roja. Lista cerrada del contrato.
export function tiposGolpe(l) {
  if (l.tipo === 'camara' || esOscura(l)) return [];
  const rojos = tiposRojos(l), tipos = rojos.filter(t => ['sello','tachón','círculo','llave'].includes(t));
  if (l.tipo === 'rejilla' || l.multitud === true) tipos.push('rejilla');
  if (l.tipo === 'circulos') tipos.push('círculos');
  if (l.tipo === 'cifra') tipos.push('cifra');
  if (l.tipo === 'idea' && !l.emoji && plano(l.texto || '').trim().split(/\s+/).length === 1
    && (parseFloat(l.tam_texto) >= 140 || l.tam_texto === 'enorme')) tipos.push('palabra');
  if (l.anotaciones?.some(a => !a.llave && a.a && anotacionAporta(l, a))) tipos.push('anotación');
  if (['objeto','tarjetas','boton'].includes(l.tipo) || l.nodos?.some(n => n.tarjeta)) tipos.push('objeto');
  return [...new Set(tipos)];
}
export function golpesDeck(deck) {
  const laminas = [];
  let tramo = 0, mayorTramoSin = 0;
  deck.laminas.forEach((l,i) => {
    if (l.tipo === 'camara' || esOscura(l)) return;
    const tipos = tiposGolpe(l);
    if (tipos.length) { laminas.push({ lamina:i+1, tipos }); tramo = 0; }
    else { tramo++; mayorTramoSin = Math.max(mayorTramoSin,tramo); }
  });
  return { total:laminas.length, laminas, mayorTramoSin };
}
export function reglasGolpes(deck) {
  const g = golpesDeck(deck), avisos = [], n = deck.laminas.length;
  if (n >= 12 && g.mayorTramoSin >= 8) avisos.push(`golpes visuales: ${g.mayorTramoSin} láminas seguidas sin golpe; coloca sello, tachón, rejilla, llave con nota u objeto cada 4–6 láminas (GUION §5)`);
  if (n >= 20 && g.total && g.laminas.filter(l => l.tipos.includes('cifra')).length / g.total > .6) avisos.push('golpes visuales: más del 60 % son cifra; alterna con llave con nota, rejilla o anotación con flecha (GUION §5)');
  return { errores:[], avisos };
}
