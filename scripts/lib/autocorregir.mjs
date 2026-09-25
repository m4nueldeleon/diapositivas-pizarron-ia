// Correcciones conservadoras: no inventan contenido ni aceptan avisos por el autor.
import { plano } from './markup.mjs';
import { CAMPOS } from './contrato.mjs';

const normal = t => plano(String(t || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const PERDIDA_LITERAL = /^(?:menos|pierdes|pierde|perder|baja|caen) (?:tu |tus |el |la |los |las )?(?:ganancia|ganancias|dinero|ingresos|ventas|margen|utilidad|utilidades)$/;
const ICONO_PERDIDA = { '💰': '💸', '📈': '📉' };

export function corregirSigno(deck) {
  const cambios = [];
  const laminas = deck.laminas.map((l, i) => {
    const nuevo = ICONO_PERDIDA[l.emoji];
    // Solo una frase inequívoca y un ícono protagonista sin diccionario propio.
    if (l.tipo !== 'idea' || !nuevo || !PERDIDA_LITERAL.test(normal(l.texto))
      || deck.conceptos?.[l.emoji] || deck.conceptos?.[nuevo]) return l;
    cambios.push({ lamina: i + 1, campo: 'emoji', antes: l.emoji, despues: nuevo, tipo_arreglo: 'json', motivo: 'el ícono ahora expresa la pérdida literal del titular' });
    return { ...l, emoji: nuevo };
  });
  return { deck: { ...deck, laminas }, cambios };
}

export function candidatosFuente(deck, avisos = []) {
  return deck.laminas.flatMap((l, i) => {
    if (!CAMPOS[l.tipo]?.includes('fuente_paso') || !Array.isArray(l.voz) || !l.fuente
      || /\{|\[/.test(l.fuente) || !avisos.some(a => a.startsWith(`lámina ${i + 1} `) && a.includes('la fuente llega tarde'))) return [];
    const fuente = normal(l.fuente);
    // El detector léxico puede dar un aviso por una sola palabra. Para editar exigimos la cita completa.
    const paso = l.voz.findIndex(v => (` ${normal(v)} `).includes(` ${fuente} `));
    return fuente.length >= 8 && paso >= 0 && paso !== l.fuente_paso ? [{ indice: i, paso }] : [];
  });
}
