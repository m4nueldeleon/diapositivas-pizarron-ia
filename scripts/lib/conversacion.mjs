// Indicios semánticos compartidos: conversación ≠ demostración y mención ≠ respuesta.
import { plano } from './markup.mjs';
const normal = x => plano(String(x || '')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const palabras = x => normal(x).match(/[a-z0-9]+/g) || [];
export function demostracionChat(l) {
  if (l.tipo !== 'chat') return false;
  const mensajes = l.mensajes || [];
  return mensajes.some((entrada,i) => mensajes.slice(i+1).some(salida => {
    const a=normal(entrada.texto), b=normal(salida.texto);
    if(entrada.de===salida.de || palabras(a).length<4 || palabras(b).length<3 || a===b) return false;
    if(/vamos a mostrar|haremos una demostracion|te ensenare|puedes mostrar/.test(a+' '+b))return false;
    const concreto=/\?|\d|portada|archivo|pagina|mensaje|precio|revision|fecha|testimonio|publicar|descuento/.test(a);
    const util=/\b(incluye|cotiza\w*|entreg\w*|confirm\w*|aprueb\w*|autoriza\w*|puedes|procede\w*|acepto|elige|envia\w*|public\w*|acuerd\w*|cambia|cuesta|vence|sera|sera|queda|fue|me ayudo)\b|\b(?:lunes|martes|miercoles|jueves|viernes)\b|\d/.test(b);
    const nuevas=palabras(b).filter(w=>w.length>2&&!palabras(a).includes(w));
    return concreto&&util&&nuevas.length>=2;
  }));
}

// Separa conjunciones, enumeraciones y preguntas; conserva las cláusulas para auditoría.
export function componentesObjecion(texto) {
  return String(texto).split(/[¿?;,]+|\s+(?:y\/o|y|o)\s+/i).map(t=>t.trim()).filter(Boolean);
}
const TEMAS = [
 ['devoluciones',/devolu\w*|reembols\w*/, /\b(proced\w*|acepta\w*|aplica\w*|devuelve\w*|reembolsa\w*|no hay|no incluye|sin devoluciones)\b/],
 ['modificaciones',/modifica\w*|revision\w*|cambio\w*/, /\b(incluy\w*|inclu\w*|cotiza\w*|cuesta\w*|cobra\w*|aparte|adicional\w*|no permite\w*)\b/],
 ['descuento',/descuento\w*|rebaja\w*/, /\b(no|sin|mantengo|conservo|aplica\w*|inclu\w*|ofre\w*|redu\w*)\b/],
 ['publicacion',/public\w*|nombre|anonim\w*/, /\b(no|sin|solo|puedes|autoriza\w*|permiso|anonim\w*)\b/],
];
export function revisarComponentes(pregunta,respuestas) {
  const partes=componentesObjecion(pregunta);
  if(partes.length<2)return [];
  const frases=respuestas.flatMap(t=>normal(t).split(/[.!?;\n]+/)).filter(Boolean);
  const temas=TEMAS.filter(([,rx])=>rx.test(normal(pregunta)));
  return temas.filter(([,tema,decision])=>!frases.some(f=>tema.test(f)&&decision.test(f)&&!(/por escrito|se acuerdan|se defin|por confirmar|pendiente/.test(f)&&! /\bsi |\bno |\bsolo |\baparte|\badicional/.test(f))))
    .map(([tema])=>({tema,componentes:partes.filter(p=>TEMAS.find(t=>t[0]===tema)[1].test(normal(p)))}));
}
