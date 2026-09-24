// Avisos estrechos de semántica: la tinta tiene significado y las mayúsculas son un golpe breve.
import { plano } from './markup.mjs';
const normal = t => plano(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const SIGLAS = new Set(['IA', 'CRM', 'SAT', 'USD', 'MXN', 'PDF', 'URL', 'CEO', 'VSL']);
const CORTAS_COMUNES = new Set(['HOY', 'HAY', 'VAS', 'VE', 'DA', 'DAS', 'MAS', 'MÁS', 'DOS', 'MES', 'DÍA', 'A', 'AL', 'DE', 'DEL', 'EL', 'EN', 'ES', 'LA', 'LAS', 'LO', 'LOS', 'MI', 'MIS', 'NO', 'POR', 'QUE', 'SE', 'SIN', 'SON', 'SU', 'SUS', 'TE', 'TU', 'TUS', 'UN', 'UNA', 'UNO', 'Y', 'YA']);
const CAMPOS = ['texto', 'nota', 'lineas', 'items', 'etiquetas', 'arriba', 'abajo'];
export const encabezadoSeccion = t => /^(modulo|semana|bloque|parte|dia|fase|etapa|sesion)\s*\d/i.test(normal(t).trim()) && !/[:…?]$|\.\.\.$/.test(plano(t).trim());
function textos(l) {
  const leer = v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(leer)
    : v && typeof v === 'object' ? leer(v.texto || v.etiqueta || '') : [];
  return CAMPOS.flatMap(k => leer(l[k]));
}
export const encabezadoExento = l => l.encabezado_estilo === 'frase'
  || (l.encabezado_pos === 'entre' && /(?:#\s*\d|\bpaso\s+\d)/i.test(l.encabezado || ''))
  || (l.tipo === 'lista' && (l.activo != null || l.hechos != null || l.como != null || l.oscura === true));
export function reglasEstilo(deck) {
  const avisos = [];
  deck.laminas.forEach((l, i) => {
    const cab = plano(l.encabezado || '');
    const exento = encabezadoExento(l);
    if (cab && /[·]|\b(?:semana|modulo)\s*\d|\b(?:por confirmar|pendiente|ficticio|ejemplo)\b|\{\{/.test(normal(l.encabezado))) avisos.push(`lámina ${i+1}: el encabezado «${cab}» lleva metadatos o estado (eyebrow); quítalos y lleva la procedencia a fuente o nota (ESTILO §2)`);
    else if (cab && !exento && !/[:…?]$|\.\.\.$/.test(cab.trim())) avisos.push(`lámina ${i+1}: el encabezado «${cab}» debe arrancar la frase que completan los ítems y terminar en «:», «…» o «?» (ESTILO §2)`);

    const nombre = `lámina ${i + 1} (${l.id || l.tipo})`;
    for (const t of textos(l)) {
      for (const m of t.matchAll(/\{([vr]):([^{}]+)\}/g)) {
        const s = normal(m[2]);
        if (m[1] === 'v' && !/\d|[$%✓]|\b(si|ok)\b|\b(gan|entr|vend|cerr|logr)/.test(s)) avisos.push(`${nombre}: {v:${m[2]}} usa verde sin cifra, sí ni resultado; déjalo negro o gris (ESTILO §3)`);
        const conectado = /__/.test(m[2]) || (Array.isArray(l.flechas) && l.flechas.length) || Boolean(l.llave);
        const perdida = /[-−]\s*\$?\d|✕|\bno\b|\b(pierd|cae|mal|error)|\bsin\s+(dinero|ventas|clientes|ingresos|margen|utilidad)/.test(s);
        if (m[1] === 'r' && !perdida && !conectado) avisos.push(`${nombre}: {r:${m[2]}} usa rojo sin pérdida ni señal; déjalo negro o conecta la marca con flecha, llave o subrayado (ESTILO §3)`);
      }
      if (!['idea', 'lista', 'cifra', 'pasos'].includes(l.tipo)) continue;
      const palabras = plano(t.replace(/\{\{[^}]+\}\}|\[[A-ZÁÉÍÓÚÑÜ0-9_ -]+\]/g, '')).match(/[\p{L}\p{N}]+/gu) || [];
      let seguidas = 0;
      for (const p of palabras) {
        const mayuscula = (p.length > 3 || CORTAS_COMUNES.has(p)) && !/\d/.test(p) && !SIGLAS.has(p) && p === p.toUpperCase() && p !== p.toLowerCase();
        seguidas = mayuscula ? seguidas + 1 : 0;
        if (seguidas >= 4) { avisos.push(`${nombre}: cuatro palabras seguidas en mayúsculas; reserva las mayúsculas para 1-3 palabras de golpe y escribe la frase en caja normal (ESTILO §2)`); break; }
      }
    }
  });
  return { errores: [], avisos: [...new Set(avisos)] };
}

const MARCAS = /\b(TikTok|Seller Center|Instagram|WhatsApp|YouTube|Shopify|Mercado Libre|ChatGPT|Canva|Stripe)\b/i;
export function reglasLogos(deck) {
  const avisos = [];
  deck.laminas.forEach((l, i) => {
    const items = [...(l.nodos || []), ...(l.items || []), ...(l.tipo === 'pasos' ? (l.iconos || []).map((x, k) => typeof x === 'string' ? { emoji: x, imagen: l.logos?.[k], etiqueta: l.etiquetas?.[k] } : { ...x, imagen: l.logos?.[k] || x.imagen, etiqueta: l.etiquetas?.[k] }) : [])];
    for (const it of items) {
      if (!it || typeof it !== 'object' || !it.emoji || it.imagen) continue;
      const t = plano(it.etiqueta || it.texto || '');
      const m = t.match(MARCAS);
      // Solo etiqueta de nodo o ítem: una frase corrida no es la identidad de una herramienta.
      const etiqueta = t.replace(/^(logo|app|herramienta|plataforma)( de)?[: ]+/i, '').trim();
      const marca = etiqueta.match(MARCAS);
      const sufijo = marca ? etiqueta.slice(marca.index + marca[0].length).trim() : '';
      if (!m || !marca || marca.index !== 0 || (sufijo && !/^(Business|Shop|Ads|Pro|IA|para negocios)$/i.test(sufijo))) continue;
      const clave = /TikTok|Seller Center/i.test(m[0]) ? 'TIKTOK' : m[0].toUpperCase().replace(/\s+/g, '_');
      avisos.push(`lámina ${i + 1}: "${t}" lleva ${it.emoji}; pon su logo en "imagen" o "{{LOGO_${clave}}}" (regla 10)`);
    }
  });
  return { errores: [], avisos };
}
