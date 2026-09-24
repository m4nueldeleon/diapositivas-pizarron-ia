// Comprueba únicamente cuentas numéricas legibles y cantidades visibles: nunca interpreta la voz.
import { plano } from './markup.mjs';

const nombre = (l, i) => `lámina ${i + 1} (${l.id || l.tipo})`;
const normal = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const NUMERO = String.raw`(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)`;
const ESCALA = String.raw`(?:millones|mill[oó]n|mil|[kKmM])(?!\p{L})`;
const ATOMO = String.raw`~?\s*\$?\s*(${NUMERO})\s*(${ESCALA})?\s*(%)?`;
const OPERANDO = new RegExp(String.raw`^${ATOMO}(?:(\s*[-–]\s*|\s*a\s+)${ATOMO})?`, 'u');
const pendientes = s => /~~/.test(s) || /\{\{|\[[A-ZÁÉÍÓÚÑÜ_][A-ZÁÉÍÓÚÑÜ\d_ ]*\]/.test(plano(s));
const intervalo = (a, b = a) => [Math.min(a, b), Math.max(a, b)];
const escala = s => !s ? 1 : /^k$/i.test(s) ? 1000 : /^mil$/i.test(s) ? 1000 : 1000000;
const valor = (n, sufijo, porcentaje) => Number(n.replaceAll(',', '')) * escala(sufijo) / (porcentaje ? 100 : 1);

function operando(s) {
  const m = s.match(OPERANDO);
  if (!m) return null;
  // El guion de un rango va entre sus extremos; «179 - 80» es una resta convencional.
  const rango = Boolean(m[5]) && (m[4].trim() === 'a' || !/\s/.test(m[4]));
  if (!rango && m[5]) {
    const uno = s.match(new RegExp(`^${ATOMO}`, 'u'));
    return { valor: intervalo(valor(uno[1], uno[2], uno[3])), largo: uno[0].length };
  }
  const a = valor(m[1], m[2] || (rango ? m[6] : ''), m[3] || (rango ? m[7] : ''));
  return { valor: intervalo(a, rango ? valor(m[5], m[6] || m[2], m[7] || m[3]) : a), largo: m[0].length };
}
function tokensDe(texto) {
  const s = plano(texto).replace(/[×✕]/g, '*').replace(/÷/g, '/');
  // «+ IVA del 16%» no suma 0.16: el texto describe una operación adicional que aquí no inferimos.
  if (/\b(?:iva|impuestos?|descuentos?)\b.*\d[\d.]*\s*%|\b(?:del|sobre)\s+(?:el\s+)?\d[\d.]*\s*%/i.test(s)) return null;
  const tokens = [];
  let p = 0;
  while (p < s.length) {
    const c = s[p];
    if (/\d|\$|~/.test(c)) {
      const n = operando(s.slice(p));
      if (!n) return null;
      tokens.push(n.valor); p += n.largo; continue;
    }
    if (/[+*/−-]/.test(c) || (c === 'x' && /\s/.test(s[p - 1] || '') && /\s/.test(s[p + 1] || ''))) {
      tokens.push(c === 'x' ? '*' : c === '−' ? '-' : c); p++; continue;
    }
    // Las unidades se ignoran, pero una expresión matemática desconocida no se adivina.
    if (/[=^()[\]{}%<>]/.test(c)) return null;
    if (c === '.' && /\d/.test(s[p + 1] || '')) return null;
    p++;
  }
  return tokens;
}
function operar(a, op, b) {
  if (op === '+') return [a[0] + b[0], a[1] + b[1]];
  if (op === '-') return [a[0] - b[1], a[1] - b[0]];
  if (op === '/' && b[0] <= 0 && b[1] >= 0) return null;
  const valores = a.flatMap(x => b.map(y => op === '*' ? x * y : x / y));
  return valores.every(Number.isFinite) ? [Math.min(...valores), Math.max(...valores)] : null;
}
function evaluar(tokens) {
  if (!tokens?.length || tokens.length % 2 === 0 || tokens.some((t, i) => i % 2 ? typeof t !== 'string' : !Array.isArray(t))) return null;
  // Primero multiplicación y división; luego suma y resta, con intervalos en cada operación.
  const grupos = [];
  let actual = tokens[0];
  for (let i = 1; i < tokens.length; i += 2) {
    if (['*', '/'].includes(tokens[i])) {
      actual = operar(actual, tokens[i], tokens[i + 1]);
      if (!actual) return null;
    } else { grupos.push(actual, tokens[i]); actual = tokens[i + 1]; }
  }
  grupos.push(actual);
  return grupos.slice(1).reduce((acc, t, i) => i % 2 === 0 ? acc : operar(acc, grupos[i], t), grupos[0]);
}
const cerca = (a, b, aproximada) => Math.abs(a - b) <= Math.max(1, Math.abs(a) * 0.05) || (aproximada && a !== 0 && Number(a.toPrecision(1)) === b);
const iguales = (a, b, aproximada = false) => a && b && cerca(a[0], b[0], aproximada) && cerca(a[1], b[1], aproximada);
const mostrar = v => v[0] === v[1] ? String(Number(v[0].toPrecision(8))) : `${Number(v[0].toPrecision(8))}-${Number(v[1].toPrecision(8))}`;
const empiezaOperador = s => /^[\s~]*[×✕*x÷/+−-]/.test(s);
const empiezaMonto = s => /^[\s~]*\$?\s*\d/.test(s);
const textoLinea = l => typeof l === 'string' ? l : l?.texto || '';

function revisarLinea(texto, anterior, donde) {
  const partes = texto.split('='), izquierda = tokensDe(partes[0]);
  if (!izquierda) return { anterior: null, errores: [] };
  const continua = empiezaOperador(partes[0]);
  const tokens = continua && anterior ? [anterior.valor, ...izquierda] : izquierda;
  const esperada = partes[0].trim() ? evaluar(tokens) : anterior?.valor;
  if (!esperada) return { anterior: null, errores: [] };
  const conCuenta = tokens.length >= 3 || (!partes[0].trim() && anterior?.conCuenta);
  const errores = [];
  if (anterior?.igualdad && empiezaMonto(partes[0]) && izquierda.length && !iguales(anterior.valor, izquierda[0])) {
    errores.push(`${donde}: la cuenta no da: la cadena debe continuar con ${mostrar(anterior.valor)}, no ${mostrar(izquierda[0])} (${texto})`);
  }
  if (partes.length === 1) return { anterior: { valor: esperada, conCuenta, igualdad: false }, errores };
  // Una igualdad sin operación previa puede convertir unidades («45 días = 1.5 meses»).
  if (!conCuenta) return { anterior: null, errores: [] };
  const resultados = partes.slice(1).map(p => evaluar(tokensDe(p)));
  if (resultados.some(r => !r)) return { anterior: null, errores: [] };
  for (const resultado of resultados) {
    if (!iguales(esperada, resultado, /~/.test(texto))) errores.push(`${donde}: la cuenta no da: ${texto}; da ${mostrar(esperada)}, no ${mostrar(resultado)}`);
  }
  return { anterior: { valor: resultados.at(-1), conCuenta: true, igualdad: true }, errores };
}
function cuentas(l, i) {
  if (l.tipo !== 'cifra' || !Array.isArray(l.lineas)) return [];
  let anterior = null;
  const errores = [];
  for (const linea of l.lineas) {
    const original = textoLinea(linea);
    if (pendientes(original)) { anterior = null; continue; }
    const r = revisarLinea(plano(original), anterior, nombre(l, i));
    anterior = r.anterior;
    errores.push(...r.errores);
  }
  return errores;
}

const CAMPOS_TEXTO = new Set(['texto', 'nombre', 'etiquetas', 'arriba', 'abajo', 'encabezado', 'nota', 'anotacion', 'sello', 'titulo', 'subtitulo', 'etiqueta', 'lineas', 'items', 'filas', 'celdas', 'anotaciones', 'componentes']);
function textos(l) {
  const ir = (x, ruta = '') => typeof x === 'string' ? [{ texto: x, ruta }] : Array.isArray(x) ? x.flatMap((v, i) => ir(v, `${ruta}.${i}`))
    : x && typeof x === 'object' ? Object.entries(x).filter(([k]) => CAMPOS_TEXTO.has(k)).flatMap(([k, v]) => ir(v, `${ruta}.${k}`)) : [];
  return ir(l);
}
const RE_CANTIDAD = new RegExp(String.raw`\b(${NUMERO})\s+(años|clientes|alumnos|personas|empresas|ventas)\b`, 'giu');
function cifrasRepetidas(deck, crudo) {
  const grupos = new Map();
  (deck.laminas || []).forEach((l, i) => {
    // Se leen los literales originales: {{DATO}} no puede convertirse en una contradicción espuria.
    for (const { texto } of textos(crudo?.laminas?.[i] || l)) {
      const limpio = plano(texto);
      if (/~~/.test(texto) || /[=×÷]|\b(?:antes|después|despues|ahora|ejemplo|supongamos|si |entre |de cada )/i.test(limpio)) continue;
      for (const m of limpio.matchAll(RE_CANTIDAD)) {
        const previo = limpio.slice(0, m.index), posterior = limpio.slice(m.index + m[0].length);
        if (/[-–]\s*$|\b\d[\d,.]*\s+a\s*$/i.test(previo) || /^\s*(?:[-–]|a\s+\d|por\b|al\b|cada\b)/i.test(posterior)) continue;
        const unidad = normal(m[2]), valor = Number(m[1].replaceAll(',', ''));
        grupos.set(unidad, [...(grupos.get(unidad) || []), { i, valor }]);
      }
    }
  });
  return [...grupos].flatMap(([unidad, datos]) => {
    const laminas = new Set(datos.map(d => d.i)), valores = new Set(datos.map(d => d.valor));
    if (laminas.size < 2 || valores.size < 2) return [];
    const clave = unidad === 'anos' ? 'AÑOS' : unidad.toUpperCase();
    return [`cifras contradictorias: ${[...new Map(datos.map(d => [`${d.i}:${d.valor}`, d])).values()].map(d => `${nombre(deck.laminas[d.i], d.i)}: ${d.valor} ${unidad === 'anos' ? 'años' : unidad}`).join('; ')}. Confirma si es el mismo dato y reutiliza datos con {{${clave}}} (GUION §6)`];
  });
}
function proporcionRejilla(l, i) {
  if (l.tipo !== 'rejilla' || !Number.isInteger(l.total) || l.total <= 0 || !Array.isArray(l.destacar) || l.multitud) return [];
  const destacadas = new Set(l.destacar.filter(n => Number.isInteger(n) && n >= 0 && n < l.total)).size;
  // El demo «99%» dibuja 99 verdes y destaca la excepción roja. Ambos grupos están a la vista.
  const complemento = l.punto === true && (l.tono || 'v') === 'v' && (l.tono_destacado || 'r') === 'r';
  const visible = [l.texto, l.anotacion, l.sello].filter(t => typeof t === 'string' && !pendientes(t)).map(plano).join(' ');
  const proporciones = [...visible.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map(m => ({ tasa: Number(m[1]) / 100, texto: m[0] }));
  for (const m of visible.matchAll(/(\d+)\s+de\s+cada\s+(\d+)/g)) if (Number(m[2]) > 0) proporciones.push({ tasa: Number(m[1]) / Number(m[2]), texto: m[0] });
  return proporciones.filter(p => p.tasa >= 0 && p.tasa <= 1 && Math.abs(l.total * p.tasa - destacadas) > 1
    && (!complemento || Math.abs(l.total * p.tasa - (l.total - destacadas)) > 1))
    .map(p => `${nombre(l, i)}: la rejilla destaca ${destacadas} de ${l.total}, pero dice «${p.texto}»; ajusta destacar o el porcentaje para que difieran como máximo en una celda (GUION §3.8)`);
}
export function reglasAritmetica(deck, { crudo } = {}) {
  const laminas = deck.laminas || [];
  return { errores: laminas.flatMap(cuentas), avisos: [...cifrasRepetidas(deck, crudo), ...laminas.flatMap(proporcionRejilla)] };
}
