// Estima la capa manuscrita del HTML ya construido, sin contar clones ni contenido oculto.
import { RE_HUECO } from './markup.mjs';
export function analizarHTML(html) {
  const secciones = String(html).match(/<section\b[\s\S]*?<\/section>/g) || [];
  const vacios = new Set(['img','br','hr','input','meta','source','wbr','path','circle','rect','line','polyline','polygon','ellipse','use','stop']);
  return secciones.map(seccion => {
    const pila = [{tag:'raiz',fuera:false}], mano = [], pendientes = [];
    const re = /<script\b([^>]*)>([\s\S]*?)<\/script>|<!--[^]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|([^<]+)/g;
    for (const m of seccion.matchAll(re)) {
      if (m[7] != null && !pila.at(-1).fuera) pendientes.push(...[...m[7].matchAll(RE_HUECO)].map(x => x[1]));
      if (m[1] != null) {
        if (!pila.at(-1).fuera && /class="con"/.test(m[1])) {
          try { if (JSON.parse(m[2]).length) mano.push('conexiones'); } catch (error) { throw new Error(`conexiones ilegibles al estimar capa a mano: ${error.message}`); }
        }
        continue;
      }
      if (!m[4]) continue;
      const tag = m[4].toLowerCase();
      if (m[3]) { const i = pila.map(p => p.tag).lastIndexOf(tag); if (i>0) pila.splice(i); continue; }
      const attrs = m[5], cls = (attrs.match(/class="([^"]*)"/) || [,''])[1].split(/\s+/);
      const fuera = pila.at(-1).fuera || cls.some(c => ['clon','pz-oculto'].includes(c)) || /display\s*:\s*none/.test(attrs);
      if (!fuera && (cls.some(c => ['nota','tabla','sello','t-mano','mano','circ'].includes(c)) || /\bdata-(?:sub|tachar|circulo|circulo-img|tachon-img)\b/.test(attrs) || tag === 'mark')) mano.push(tag);
      if (!vacios.has(tag) && m[6] !== '/') pila.push({tag,fuera});
    }
    return { mano:mano.length, pendientes:[...new Set(pendientes)] };
  });
}

export const manoDesdeHTML = html => analizarHTML(html).map(l => l.mano);
export const pendientesDesdeHTML = html => analizarHTML(html).map(l => l.pendientes);
