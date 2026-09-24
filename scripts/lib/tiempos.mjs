// tiempos.mjs — cuánto dura en pantalla cada paso de cada lámina.
//
// Tres fuentes, en este orden de prioridad:
//   1. Transcripción con marcas de tiempo (Whisper u otra): cada paso arranca cuando se dice su ancla.
//   2. «dur» en la lámina: segundos por paso (número) o lista por paso.
//   3. «voz»: lo que se dice en ese paso, a 2.7 palabras por segundo (ritmo medido en la referencia).
// Sin nada de eso, 2.6 s por paso: la mediana medida entre cambios visuales de la referencia fue 2.9 s.
import fs from 'node:fs';
import { palabras as contar } from './markup.mjs';

export const RITMO = { palabrasPorSegundo: 2.7, pasoPorOmision: 2.6, pasoSiguiente: 2.2, camara: 4, minimo: 1.2 };

const vozDe = (l, k) => (Array.isArray(l.voz) ? l.voz[k] : k === 0 ? l.voz : undefined);

export function duracionPaso(l, k) {
  if (Array.isArray(l.dur)) return Math.max(RITMO.minimo, Number(l.dur[k] ?? l.dur[l.dur.length - 1]) || RITMO.pasoPorOmision);
  if (typeof l.dur === 'number') return Math.max(RITMO.minimo, l.dur);
  const v = vozDe(l, k);
  if (v) return Math.max(RITMO.minimo, contar(v) / RITMO.palabrasPorSegundo + 0.35);
  if (l.tipo === 'camara') return RITMO.camara;
  return k === 0 ? RITMO.pasoPorOmision : RITMO.pasoSiguiente;
}

// Lista plana de segmentos {lamina, paso, camara, inicio, fin} en orden de aparición
export function segmentos(deck, pasos) {
  const segs = [];
  deck.laminas.forEach((l, i) => {
    const n = l.tipo === 'camara' ? 1 : pasos[i];
    for (let k = 0; k < n; k++) segs.push({ lamina: i, paso: k, camara: l.tipo === 'camara', id: l.id || l.tipo, ancla: anclaDe(l, k) });
  });
  return segs;
}

export function tiemposSecuenciales(deck, pasos, desde = 0) {
  let t = desde;
  return segmentos(deck, pasos).map(s => {
    const d = duracionPaso(deck.laminas[s.lamina], s.paso);
    const r = { ...s, inicio: t, fin: t + d };
    t += d;
    return r;
  });
}

// ---------- duración de la pieza ----------
// Rango de duración por tipo de pieza, en minutos (references/ARCOS.md). Sale del RITMO de arriba: cada paso
// sigue siendo un beat de 2-3 s en todas las piezas; lo que cambia es cuántos beats lleva.
export const PIEZAS = {
  reel: { min: 0.5, max: 1, nombre: 'reel' },
  video: { min: 8, max: 20, nombre: 'video de YouTube' },
  vsl: { min: 8, max: 20, nombre: 'VSL' },
  clase: { min: 40, max: 60, nombre: 'clase' },
  webinar: { min: 60, max: 90, nombre: 'webinar' },
  propuesta: { min: 5, max: 20, nombre: 'propuesta' },
  // piezas cortas con arco propio (ARCOS.md): no son el arco largo comprimido
  tutorial: { min: 3, max: 8, nombre: 'tutorial' },
  'vsl-corto': { min: 3, max: 6, nombre: 'VSL corto' },
  'clase-corta': { min: 15, max: 30, nombre: 'clase corta o taller' },
  libre: null,
};

// «duracion_objetivo»: minutos (45) o "mm:ss" ("0:45", "42:30"). null si no se entiende.
export function minutosObjetivo(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 && v <= 600 ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(\d{1,3}):([0-5]\d)$/);
  if (m) { const x = +m[1] + +m[2] / 60; return x > 0 ? x : null; }
  const n = Number(v.trim());
  return v.trim() && Number.isFinite(n) && n > 0 && n <= 600 ? n : null;
}

// Segundos estimados del deck completo (voz a 2.7 palabras/s, dur explícito, cámara 4 s)
export function duracionTotal(deck, pasos) {
  const t = tiemposSecuenciales(deck, pasos);
  return t.length ? t[t.length - 1].fin : 0;
}

// Segundos de voz sobre láminas y segundos a cámara, por separado: una «clase de 25 min» con 20 min de cámara
// tiene 5 min de pizarrón (la referencia va ~12% a cámara).
export function duracionPorTipo(deck, pasos) {
  return tiemposSecuenciales(deck, pasos).reduce((a, s) => {
    a[s.camara ? 'camara' : 'laminas'] += s.fin - s.inicio;
    return a;
  }, { laminas: 0, camara: 0 });
}

export const mmss = seg => { const s = Math.max(0, Math.round(seg)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// ---------- alineación con transcripción ----------
export function normalizar(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function anclaDe(l, k) {
  if (Array.isArray(l.anclas) && l.anclas[k]) return l.anclas[k];
  if (k === 0 && l.ancla) return l.ancla;
  const v = vozDe(l, k);
  return v ? normalizar(v).slice(0, 4).join(' ') : null;
}

// Acepta: Whisper ({segments:[{words:[{word,start,end}]}]} o {words:[…]}), una lista de palabras
// ({word|palabra|text, start|inicio, end|fin}) o segmentos sin palabras (se reparten a partes iguales).
export function cargarTranscripcion(ruta) {
  const j = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const out = [];
  const empujar = (w, s, e) => normalizar(w).forEach((tok, i, arr) => {
    const d = (e - s) / arr.length;
    out.push({ w: tok, s: s + i * d, e: s + (i + 1) * d });
  });
  const lista = Array.isArray(j) ? j : j.words || (j.segments || []).flatMap(sg => (sg.words && sg.words.length ? sg.words : [{ ...sg, __seg: true }]));
  for (const x of lista) {
    const w = x.word ?? x.palabra ?? x.text ?? x.texto ?? '';
    const s = Number(x.start ?? x.inicio), e = Number(x.end ?? x.fin ?? s);
    if (!isFinite(s)) continue;
    empujar(w, s, isFinite(e) ? e : s);
  }
  if (!out.length) throw new Error(`La transcripción ${ruta} no trae palabras con tiempos`);
  return out;
}

// Similitud entre dos palabras (1 = idénticas) con distancia de edición
function similitud(a, b) {
  if (a === b) return 1;
  const n = a.length, m = b.length;
  if (!n || !m) return 0;
  let prev = Array.from({ length: m + 1 }, (_, j) => j), cur = new Array(m + 1);
  for (let i = 1; i <= n; i++) {
    cur[0] = i;
    for (let j = 1; j <= m; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    [prev, cur] = [cur, prev];
  }
  return 1 - prev[m] / Math.max(n, m);
}

// Alineación global guion ↔ transcripción (programación dinámica en banda). Tolera palabras mal
// reconocidas, palabras de más (muletillas) y palabras del guion que no se dijeron.
function alinearTokens(guion, pal) {
  const n = guion.length, m = pal.length, GAP = -0.35;
  const banda = Math.max(250, Math.round(Math.abs(n - m) + 0.15 * Math.max(n, m)));
  const centro = i => Math.round((i * m) / Math.max(1, n));
  const S = [], B = [];
  const get = (M, i, j) => { const r = M[i]; if (!r) return -Infinity; const k = j - r.o; return k >= 0 && k < r.v.length ? r.v[k] : -Infinity; };
  for (let i = 0; i <= n; i++) {
    const o = Math.max(0, centro(i) - banda), f = Math.min(m, centro(i) + banda);
    S[i] = { o, v: new Float32Array(f - o + 1).fill(-Infinity) }; B[i] = { o, v: new Uint8Array(f - o + 1) };
    for (let j = o; j <= f; j++) {
      let mejor = -Infinity, via = 0;
      if (i === 0 && j === 0) mejor = 0;
      if (i > 0 && j > 0) {
        const sim = similitud(guion[i - 1], pal[j - 1].w);
        const v = get(S, i - 1, j - 1) + (sim >= 0.5 ? sim : -0.5);
        if (v > mejor) { mejor = v; via = 1; }
      }
      if (i > 0) { const v = get(S, i - 1, j) + GAP; if (v > mejor) { mejor = v; via = 2; } }
      if (j > 0) { const v = get(S, i, j - 1) + (i === 0 || i === n ? 0 : GAP); if (v > mejor) { mejor = v; via = 3; } }
      S[i].v[j - o] = mejor; B[i].v[j - o] = via;
    }
  }
  const mapa = new Array(n).fill(-1);
  let i = n, j = Math.min(m, S[n].o + S[n].v.length - 1);
  while (i > 0 || j > 0) {
    const via = get(B, i, j) || (i > 0 ? 2 : 3);
    if (via === 1) { if (similitud(guion[i - 1], pal[j - 1].w) >= 0.5) mapa[i - 1] = j - 1; i--; j--; }
    else if (via === 2) i--; else j--;
    if (i < 0 || j < 0) break;
  }
  return mapa;
}

export function tiemposAlineados(deck, pasos, pal, durTotal) {
  const segs = segmentos(deck, pasos);
  // El guion completo: la voz de cada paso (o su ancla), en orden
  const guion = [], rango = [];
  segs.forEach(s => {
    const l = deck.laminas[s.lamina];
    // Lo que se busca en la transcripción: el ancla explícita manda sobre la voz
    const explicita = (Array.isArray(l.anclas) && l.anclas[s.paso]) || (s.paso === 0 && l.ancla);
    const toks = normalizar(explicita || vozDe(l, s.paso) || s.ancla || '');
    rango.push([guion.length, guion.length + toks.length]);
    guion.push(...toks);
  });
  const mapa = guion.length ? alinearTokens(guion, pal) : [];
  const reporte = [];
  segs.forEach((s, k) => {
    s.inicio = null;
    const [a, b] = rango[k];
    for (let t = a; t < b; t++) {
      if (mapa[t] >= 0) { s.inicio = Math.max(0, pal[mapa[t]].s - (t - a) * 0.33); break; }
    }
    if (a < b) reporte.push({ id: s.id, paso: s.paso, ancla: guion.slice(a, Math.min(b, a + 4)).join(' '), t: s.inicio == null ? null : +s.inicio.toFixed(2), empatadas: mapa.slice(a, b).filter(x => x >= 0).length, palabras: b - a });
  });
  // Los pasos sin ancla encontrada se reparten entre sus vecinos conocidos
  const fin = durTotal || (pal[pal.length - 1].e + 0.6);
  if (segs[0].inicio == null) segs[0].inicio = 0;
  for (let i = 0; i < segs.length; i++) {
    if (segs[i].inicio != null) continue;
    let j = i; while (j < segs.length && segs[j].inicio == null) j++;
    const a = segs[i - 1].inicio, b = j < segs.length ? segs[j].inicio : fin;
    const paso = (b - a) / (j - i + 1);
    for (let k = i; k < j; k++) segs[k].inicio = a + paso * (k - i + 1);
  }
  // Inicios siempre crecientes
  for (let i = 1; i < segs.length; i++) if (segs[i].inicio <= segs[i - 1].inicio) segs[i].inicio = segs[i - 1].inicio + 0.4;
  segs.forEach((s, i) => { s.fin = i + 1 < segs.length ? segs[i + 1].inicio : Math.max(fin, s.inicio + 1); });
  return { segs, reporte };
}
