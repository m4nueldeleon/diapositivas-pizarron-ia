// pasos-mapa.mjs — qué entra en cada paso de una lámina, leído del HTML ya armado (sin navegador). Sirve para escribir la
// `voz` alineada con el revelado: render.mjs --pasos lo imprime, pasos.json lo guarda (`revela`) y qa.mjs lo agrega al
// error «voz tiene N textos y la lámina M pasos». Sale del DOM que arma construir.mjs, no de una tabla a mano: si un
// diseño cambia sus pasos, el mapa cambia con él (LAYOUTS.md, «Pasos que genera cada diseño»).
//
//   describirPasos(html, n, conexiones) → [[etiqueta, …], …] (n listas: una por paso, contadas desde 0)
//   resumenPasos(revela, max)           → «paso 1: … · paso 2: …» (numerado desde 1, como la hoja)
const VACIOS = new Set(['img', 'br', 'hr', 'input', 'meta', 'source', 'wbr', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'use', 'stop']);
const attr = (s, k) => { const m = s.match(new RegExp(`\\s${k}="([^"]*)"`)); return m ? m[1] : null; };
const desescapar = t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const LARGO = 30;
// data-e va codificado (encodeURIComponent en emoji.mjs): el HTML no lleva el emoji ni el «+» literales
const deEmoji = v => { if (v == null) return null; try { return decodeURIComponent(v); } catch { return v; } };
export const recortar = (t, n = LARGO) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s; };

function nuevoMarco(tag, attrs, padre) {
  const clase = attr(attrs, 'class') || '';
  const dp = attr(attrs, 'data-p'), tp = attr(attrs, 'data-tachar-p'), ap = attr(attrs, 'data-atenuar');
  return {
    tag, clase, textos: [], emojis: [], todo: [],
    propio: dp != null, p: dp != null ? Number(dp) : padre ? padre.p : 0,
    tachar: tp != null ? Number(tp) : null, atenuar: ap != null && Number(ap) > 0 ? Number(ap) : null,
    emo: /(^|\s)emo(\s|$)/.test(clase), e: deEmoji(attr(attrs, 'data-e')),
    fuera: /(^|\s)(onda|pz-oculto)(\s|$)/.test(clase) || (padre && padre.fuera),
  };
}
function etiqueta(f) {
  const texto = recortar(f.textos.join(f.tag === 'table' ? ' · ' : ' '));
  if (/(^|\s)sello(\s|$)/.test(f.clase)) return `sello «${recortar(f.todo.join(' '))}»`;
  if (/(^|\s)cursor(\s|$)/.test(f.clase)) return 'clic/cursor';
  const partes = [...f.emojis, texto ? `«${texto}»` : ''].filter(Boolean);
  if (f.tag === 'table') return `marco y rótulos${texto ? ` («${texto}»)` : ''}`;
  if (!partes.length) return f.tag === 'svg' || /grafica|linea|medidor|barra/.test(f.clase) ? 'trazo' : '';
  return partes.join(' ');
}

export function describirPasos(html, n, conexiones = []) {
  const total = Math.max(1, Number(n) || 1);
  const pasos = Array.from({ length: total }, () => []);
  const poner = (k, et) => { if (et && Number.isInteger(k) && k >= 0) { const q = Math.min(k, total - 1); if (!pasos[q].includes(et)) pasos[q].push(et); } };
  const raiz = nuevoMarco('raiz', ' data-p="0"', null);
  const pila = [raiz];
  const dueno = desde => { for (let i = desde; i >= 0; i--) if (pila[i].propio) return pila[i]; return raiz; };
  const cerrar = () => {
    const f = pila.pop();
    const padre = pila[pila.length - 1];
    if (f.emo) { const d = dueno(pila.length - 1); if (!f.fuera) d.emojis.push(f.e || f.todo.join('').trim() || 'emoji'); }
    if (!f.fuera && f.tachar != null) poner(f.tachar, `tachón de «${recortar(f.todo.join(' '), 24)}»`);
    if (!f.fuera && f.atenuar != null) poner(f.atenuar, `se apaga «${recortar(f.todo.join(' '), 24)}»`);
    if (f.propio && !f.fuera) poner(f.p, etiqueta(f));
    if (padre) padre.todo.push(...f.todo);
  };
  const re = /<script[\s\S]*?<\/script>|<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(String(html || '')))) {
    if (m[5] != null) {
      const t = desescapar(m[5]).replace(/\s+/g, ' ');
      if (!t.trim()) continue;
      const emoAbierto = pila.some(f => f.emo);
      pila[pila.length - 1].todo.push(t.trim());
      if (!emoAbierto) dueno(pila.length - 1).textos.push(t.trim());
      continue;
    }
    if (!m[2]) continue;
    const tag = m[2].toLowerCase();
    if (m[1]) {   // cierre: hasta su etiqueta (tolera HTML mal anidado)
      const k = pila.map(f => f.tag).lastIndexOf(tag);
      if (k > 0) while (pila.length > k) cerrar();
      continue;
    }
    const f = nuevoMarco(tag, m[3], pila[pila.length - 1]);
    if (tag === 'img') { const alt = attr(m[3], 'alt'); if (alt) pila[pila.length - 1].todo.push(desescapar(alt)); }
    if (m[4] === '/' || VACIOS.has(tag)) { if (f.propio && !f.fuera) poner(f.p, etiqueta(f)); continue; }
    pila.push(f);
  }
  while (pila.length > 1) cerrar();
  if (raiz.textos.length || raiz.emojis.length) poner(0, `marco ${etiqueta({ ...raiz, tag: 'div' })}`);
  for (const c of Array.isArray(conexiones) ? conexiones : []) {
    if (c && !c.anot) poner(Number(c.p) || 0, c.estilo === 'entrada' ? 'flecha que entra' : 'flecha');
  }
  return pasos;
}

// Una línea para el error de voz: «paso 1: … · paso 2: …» (máx. `max` pasos y «…»)
export function resumenPasos(revela, max = 6) {
  if (!Array.isArray(revela) || !revela.length) return '';
  const r = revela.slice(0, max).map((xs, k) => `paso ${k + 1}: ${xs.length ? xs.join(' + ') : '(sin cambio visible)'}`).join(' · ');
  return revela.length > max ? `${r} · …` : r;
}

// El error de QA cuando `voz` o `anclas` no cuadran con los pasos: dice qué entra en cada paso para saber qué frase juntar
// o qué campo *_paso mover (esos cuentan desde 0; la hoja y este mensaje, desde 1).
export function errorVozPasos(clave, textos, n, revela) {
  const sobra = textos.length > n ? `; se perderían: «${textos.slice(n).join('», «').slice(0, 60)}»` : '';
  const mapa = resumenPasos(revela);
  const que = textos.length > n ? 'junta frases o separa lo que entra junto (texto_paso, nota_paso, clic_paso…)' : 'parte una frase o junta pasos';
  return `«${clave}» tiene ${textos.length} textos y la lámina ${n} pasos${sobra}${mapa ? `. Lo que entra: ${mapa}; ${que} (los campos *_paso cuentan desde 0)` : ''}`;
}
