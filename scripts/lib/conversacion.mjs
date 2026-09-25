// Indicios semánticos compartidos: conversación ≠ demostración y mención ≠ respuesta.
import { plano } from './markup.mjs';
const normal = x => plano(String(x || '')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const palabras = x => normal(x).match(/[a-z0-9]+/g) || [];
export function demostracionChat(l) {
  if (l.tipo !== 'chat') return false;
  const mensajes = l.mensajes || [];
  // R14 [juez r14]: un chat con `guion: true` es el texto LITERAL que el espectador copia (con sus variables): es la
  // demostración del cómo, como en un reel, aunque no traiga respuesta.
  // …con algo que se usa: una variable [nombre], una fecha u hora, una cifra o un entregable («Hola, ¿cómo estás hoy?» no)
  const util = t => /\[[^\]]+\]|\d|\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo|enlace|link|archivo|pagina|cotizacion|propuesta|pago|anticipo|entrega|revision|resena|precio|fecha|hora)\b/.test(normal(t));
  if (l.guion === true && mensajes.some(m => palabras(m.texto).length >= 4 && util(m.texto))) return true;
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
  // R15 [juez r15]: sin tema conocido («¿diseño o plazo?» devolvía []), cada componente debe ver su palabra clave
  // retomada en la respuesta (raíz de 5 letras). Es un indicio (aviso), no una política por confirmar: `generico: true`.
  if(!temas.length){
    const VACIAS=new Set(['puedo','puedes','quiero','tengo','tienes','hacer','algo','esto','como','cuando','donde','porque','pero','para','sobre','entre','mucho','muchos','todo','todos','cada']);
    const clave=c=>(c.match(/[a-zñ]+/g)||[]).map(w=>w).filter(w=>w.length>=4&&!VACIAS.has(w)).sort((a,b)=>b.length-a.length)[0];
    const dicho=normal(respuestas.join(' '));
    return partes.filter(p=>!/^(que|cual|cuales|como|cuanto|cuanta|cuando|donde|por que|quien)\b/.test(normal(p).replace(/^[^a-z]+/,''))).map(p=>({p,k:clave(normal(p))})).filter(x=>x.k&&!dicho.includes(x.k.slice(0,5)))
      .map(x=>({tema:x.k,componentes:[x.p],generico:true}));
  }
  return temas.filter(([,tema,decision])=>!frases.some(f=>tema.test(f)&&decision.test(f)&&!(/por escrito|se acuerdan|se defin|por confirmar|pendiente/.test(f)&&! /\bsi |\bno |\bsolo |\baparte|\badicional/.test(f))))
    .map(([tema])=>({tema,componentes:partes.filter(p=>TEMAS.find(t=>t[0]===tema)[1].test(normal(p)))}));
}
