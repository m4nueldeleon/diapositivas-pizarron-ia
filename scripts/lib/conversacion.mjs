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
  // R16 [juez r16]: variable, cifra o día Y ADEMÁS una acción o un entregable («Hola [nombre], ¿cómo estás el lunes?» no)
  // R17 [juez r17]: la variable del saludo ([nombre], [cliente]) no es un dato: «Hola [nombre], revisamos tu pedido» no demuestra
  // «aquí», enlace o link apuntan al entregable concreto («¿me dejas una reseña aquí?»)
  const dato = t => /\[[^\]]+\]|\d|https?:|\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|aqui|enlace|link)\b/.test(normal(t).replace(/\[(nombre|cliente|name|tu nombre|persona)\]/g, ''));
  const accion = t => /\b(enlace|link|archivo|pagina|cotizacion|propuesta|pago|anticipo|entrega|revision|resena|precio|fecha|hora|cajas?|pedido|mando|mandar|dejo|dejas|envio|te comparto|aqui esta|agenda\w*|reserv\w*|apart\w*|pag\w*|compr\w*|confirm\w*|entreg\w*|llevaste|salieron)\b/.test(normal(t));
  const util = t => dato(t) && accion(t);
  // R18 [juez r18]: «Hola [nombre], revisamos tu pedido el lunes» pasaba por el día. Un guion demuestra si trae una variable
  // de plantilla que no es el saludo ([día], [monto]), un enlace o «aquí», o si es largo y específico (10+ palabras).
  const plantilla = t => /\[(?!(nombre|cliente|name|tu nombre|persona)\])[^\]]+\]|https?:|\b(aqui|enlace|link)\b/.test(normal(t));
  if (l.guion === true && mensajes.some(m => palabras(m.texto).length >= 4 && util(m.texto) && (plantilla(m.texto) || palabras(m.texto).length >= 10))) return true;
  return mensajes.some((entrada,i) => mensajes.slice(i+1).some(salida => {
    const a=normal(entrada.texto), b=normal(salida.texto);
    if(entrada.de===salida.de || palabras(a).length<4 || palabras(b).length<3 || a===b) return false;
    // R19 [juez]: «Enseguida te muestro cómo queda armado…» colaba por «queda»; el anuncio de mostrar/enseñar
    // descalifica aunque la frase siga con palabras nuevas, igual que ya pasa con «vamos a mostrar».
    // R20 [juez]: la lista fija de frases se evade con cualquier paráfrasis («mira/checa/ve cómo queda…», «aquí
    // puedes ver cómo se resuelve…»): un anuncio con «cómo/qué» + un verbo de estado vago descalifica salvo que la
    // frase traiga además un dato propio (cifra, día o entregable) que sí demuestre algo concreto.
    const anuncioVago=/vamos a mostrar|haremos una demostracion|te ensenare|puedes mostrar|te muestro (como|que)|te enseno (como|que)|aqui te muestro|\b(como|que)\b\s+(se\s+)?(queda|quedo|ve|resuelve|funciona|soluciona|sale|arma|armo)\b/.test(a+' '+b);
    const entregable=/\d|\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b|\b(archivo|reporte|pagina|documento|enlace|link|cotizacion|propuesta|plantilla|formato|diseno|video|imagen|entrega\w*|precio|fecha|monto|total|borrador|contrato|factura|recibo)\b/.test(b);
    if(anuncioVago&&!entregable)return false;
    const concreto=/\?|\d|portada|archivo|pagina|mensaje|precio|revision|fecha|testimonio|publicar|descuento/.test(a);
    // R18 [juez r18]: «Puedes revisar todo tranquilamente» no responde «¿cuánto cuesta y cuándo entregas?»: si la entrada
    // pregunta cuánto o cuándo, la salida trae el valor o el plazo («La A. Puedes continuar» sí decide una elección).
    const util=/\b(incluye|cotiza\w*|entreg\w*|confirm\w*|aprueb\w*|autoriza\w*|puedes|procede\w*|acepto|elige|envia\w*|public\w*|acuerd\w*|cambia|cuesta|vence|sera|queda|fue|me ayudo)\b|\b(?:lunes|martes|miercoles|jueves|viernes)\b|\d/.test(b)
      && (!/\bcuant[oa]s?\b|\bcuando\b/.test(a) || VALOR.test(b) || PLAZO.test(b));
    const nuevas=palabras(b).filter(w=>w.length>2&&!palabras(a).includes(w));
    return concreto&&util&&nuevas.length>=2;
  }));
}

// Separa conjunciones, enumeraciones y preguntas; conserva las cláusulas para auditoría.
export function componentesObjecion(texto) {
  return String(texto).split(/[¿?;,]+|\s+(?:y\/o|y|o|ni|pero)\s+/i).map(t=>t.trim()).filter(Boolean);
}
const TEMAS = [
 ['devoluciones',/devolu\w*|reembols\w*/, /\b(proced\w*|acepta\w*|aplica\w*|devuelve\w*|reembolsa\w*|no hay|no incluye|sin devoluciones)\b/],
 ['modificaciones',/modifica\w*|revision\w*|cambio\w*/, /\b(incluy\w*|inclu\w*|cotiza\w*|cuesta\w*|cobra\w*|aparte|adicional\w*|no permite\w*)\b/],
 ['descuento',/descuento\w*|rebaja\w*/, /\b(no|sin|mantengo|conservo|aplica\w*|inclu\w*|ofre\w*|redu\w*)\b/],
 ['publicacion',/public\w*|nombre|anonim\w*/, /\b(no|sin|solo|puedes|autoriza\w*|permiso|anonim\w*)\b/],
];
// R20 [juez]: en un chat, CUALQUIER pregunta de dos partes con «o» se trataba como si fuera una objeción a resolver
// («¿mi hora o la tuya?» se marcaba igual que «no tengo tiempo ni dinero»). Solo cuenta como objeción si trae una
// duda o negación real, o toca un tema ya conocido (TEMAS); una pregunta neutra de agenda o logística no basta.
const DUDA_OBJECION=/\bno\b|\bnunca\b|\bdud[oa]\w*|\bpreocup\w*|\bmiedo\b|\binsegur\w*|\bdesconf\w*|\briesgo\w*|\barriesg\w*|\bdificil\b|\bcomplicad\w*|\bcaro\b|\bcostoso\b|\bque pasa si\b|\by si\b|\bseguro que\b/;
export function pareceObjecionChat(texto) {
  const t=normal(texto);
  return DUDA_OBJECION.test(t) || TEMAS.some(([,rx])=>rx.test(t));
}
// R17 [juez r17]: «El precio es importante» nombra el tema sin responderlo: una frase que solo lo valora (es importante,
// es clave) y no trae ningún dato concreto (cifra, plazo, día, cantidad, sí/no, límite o alternativa) no cuenta.
const CONCRETA = /\d|\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|cien|mil|gratis|nada|todo|todos|ningun\w*|si|no|sin|solo|hasta|desde|cada|antes|despues|hoy|manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|semana\w*|dia|dias|hora\w*|minuto\w*|mes|meses|aqui|cuando|siempre|nunca|ya|usa|usas|basta|alcanza|puedes|sirve|en lugar|en vez)\b/;
const VALORA=/\b(es|son|resulta|parece|sera)\s+(muy\s+|lo mas\s+|super\s+)?(importante\w*|clave|fundamental\w*|relevante\w*|necesari\w*|basic\w*|esencial\w*|interesante\w*|buen\w*|mal\w*|lo de menos|lo primero)\b|\b(merece\w*|requiere\w*) (atencion|cuidado|analisis)|\bes un tema\b|\bhay que ver(lo)?\b|\bdepende\b|\blo (vemos|platicamos|revisamos) (luego|despues|con calma)/;
// R18 [juez r18]: mencionar el tema no basta. Precio → un valor; plazo → una duración, un día o un momento; lo que incluye →
// lo que trae («incluye una revisión»). Una contrapregunta («¿Qué precio te gustaría pagar?») no da el valor.
const NUMERO='\\d|\\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|cuarenta|cincuenta|cien|mil|millon\\w*|media|medio)\\b';
const VALOR=new RegExp(NUMERO+'|\\b(gratis|sin costo|nada|mitad|doble)\\b');
const PLAZO=new RegExp('('+NUMERO+').{0,24}\\b(segund\\w*|minut\\w*|hora\\w*|dia\\w*|seman\\w*|mes\\w*|ano\\w*)\\b|\\b(hoy|manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|al terminar|al final|antes de|despues de|en cuanto|inmediat\\w*|el mismo dia)\\b');
const CONTENIDO=/\b(inclu\w*|trae|viene\w*|contiene)\b\s+(\d|un|una|unos|unas|dos|tres|cuatro|cinco|el|la|los|las|tu|su|sus|tus|todo)\b/;
const PIDE={precio:VALOR,plazo:PLAZO,incluye:CONTENIDO};
const VACIAS=new Set(['puedo','puedes','quiero','tengo','tienes','hacer','algo','esto','como','cuando','donde','porque','pero','para','sobre','entre','mucho','muchos','todo','todos','cada','cuanto','cuanta','importa','mejor']);
// R21 [juez]: en «ni tengo alguien de soporte», clave() elegía «alguien» (empata en longitud con «soporte» y
// queda primero) y el aviso de «sin responder» no se resolvía aunque la respuesta sí trajera «el soporte es
// por correo». Un pronombre indefinido nunca es la palabra que la respuesta debe retomar.
const PRONOMBRES_INDEFINIDOS=new Set(['alguien','alguno','algunos','alguna','algunas','nadie','ninguno','ninguna','ningunos','ningunas','cualquiera','quienquiera']);
// R19 [juez, caso d]: «No tengo equipo» respondido con «todo corre desde tu celular» seguía sin resolver porque
// el motor exigía la raíz «equip-» literal. Sinónimos frecuentes del mismo componente no repiten la palabra exacta.
const FAMILIAS=[['cuest','preci','cobr','pag','cost','inver'],['tard','plaz','tiemp','dias','seman','entreg','cuand','segund','minut','hora'],['inclu','trae','vien','conti'],
  ['funcio','result','sirv'],['molest','incomod'],['compr','pedi','orden'],['disen','diseñ'],['garant','devol','reemb'],
  ['equip','celular','computador','compu','telefono','laptop','dispositivo']];
// R21 [juez]: «comprometerme» caía en la familia comprar/pedir/orden solo por compartir las 5 letras «compr» con
// «comprar» — un verbo distinto, no una conjugación. Una palabra de la MISMA familia solo alarga la raíz con una
// desinencia corta (comprar: -o, -as, -ar, -ando, -amos…); un remanente largo señala una palabra distinta.
const RAIZ_MAX_DESINENCIA=4;
const compartenRaiz=(palabra,raiz)=>palabra.startsWith(raiz)&&palabra.length-raiz.length<=RAIZ_MAX_DESINENCIA;
export function revisarComponentes(pregunta,respuestas) {
  const partes=componentesObjecion(pregunta);
  if(partes.length<2)return [];
  const frases=respuestas.flatMap(t=>normal(t).split(/[.!?;\n]+/)).filter(Boolean);
  const temas=TEMAS.filter(([,rx])=>rx.test(normal(pregunta)));
  const conocidos=temas.filter(([,tema,decision])=>!frases.some(f=>tema.test(f)&&decision.test(f)&&!(/por escrito|se acuerdan|se defin|por confirmar|pendiente/.test(f)&&! /\bsi |\bno |\bsolo |\baparte|\badicional/.test(f))))
    .map(([tema])=>({tema,componentes:partes.filter(p=>TEMAS.find(t=>t[0]===tema)[1].test(normal(p)))}));
  // Las partes que no son de un tema conocido se revisan con la regla genérica aunque otra parte sí lo sea
  // («¿Incluye devoluciones y cuánto tarda?» con «Aceptamos devoluciones» dejaba el plazo sin revisar).
  const sueltas=temas.length ? partes.filter(p=>!temas.some(([,rx])=>rx.test(normal(p)))) : partes;
  return conocidos.concat(genericos(pregunta,respuestas,sueltas,partes));
}
// R15/R16 [jueces r15 y r16]: sin tema conocido, cada componente debe ver su palabra clave (o su familia: tarda ↔ plazo)
// retomada en una frase que la responda. Es un indicio (aviso), no una política por confirmar: `generico: true`.
function genericos(pregunta,respuestas,sueltas,partes){
  if(!sueltas.length)return [];
  const clave=c=>(c.match(/[a-zñ]+/g)||[]).filter(w=>w.length>=4&&!VACIAS.has(w)&&!PRONOMBRES_INDEFINIDOS.has(w)).sort((a,b)=>b.length-a.length)[0];
  // Sin familia real, la raíz de respaldo conserva casi toda la palabra (solo hasta 4 caracteres de flexión al
  // final): una raíz fija de 5 letras truncaba "comprometerme" al mismo "compr" de la familia comprar/pedir/orden
  // y volvía a colar el falso amigo por la puerta de atrás.
  const familia=k=>{const f=FAMILIAS.find(f=>f.some(r=>compartenRaiz(k,r)));return f||[k.slice(0,Math.max(5,k.length-RAIZ_MAX_DESINENCIA))];};
  const tipo=k=>{const i=FAMILIAS.findIndex(f=>f.some(r=>compartenRaiz(k,r)));return ['precio','plazo','incluye'][i]||null;};
  // Una pregunta cuenta si AGREGA contenido (2+ palabras que la objeción no tenía: «¿Qué te gusta de donde compras
  // ahora?»); la que solo repite la objeción es eco («¿Te molesta? ¿Compras en otro lado?») y no responde.
  const deLaObjecion=new Set((normal(pregunta).match(/[a-zñ]{4,}/g)||[]));
  const aporta=f=>(f.match(/[a-zñ]{4,}/g)||[]).filter(w=>!deLaObjecion.has(w)).length>=2;
  const afirmaciones=respuestas.flatMap(t=>normal(t).split(/(?<=[.!?])\s+|\n+/)).filter(f=>f.trim()&&(!/\?\s*$/.test(f.trim())||aporta(f)));
  // Una frase que solo valora el tema («El precio es importante») sin ningún dato no lo responde
  const vacia=f=>VALORA.test(f)&&!CONCRETA.test(f);
  // R20 [juez]: «videollamadas» resolvía el componente «llamada» por contener la subcadena "llama" a media
  // palabra, no por sinonimia real; la raíz debe empezar una palabra propia (límite \b). R21 [juez]: la palabra
  // que empieza con la raíz tampoco puede alargarse sin límite (ver compartenRaiz) o cualquier palabra ajena que
  // arranque igual (p. ej. "comprometido" contra la raíz "compr") contaría como respuesta.
  const contieneRaiz=(f,r)=>(f.match(/[a-z]+/g)||[]).some(w=>compartenRaiz(w,r));
  const responde=(r,k)=>{ const pide=PIDE[tipo(k)];
    return afirmaciones.some(f=>contieneRaiz(f,r)&&!vacia(f)&&(!pide||(pide.test(f)&&!/\?\s*$/.test(f.trim())))); };
  // Opciones con artículo («¿Qué importa más, el diseño o el plazo?»): el interrogativo no es un componente aparte
  const conArticulo=partes.filter(p=>/^(el|la|los|las|un|una|tu|tus)\s/.test(normal(p).replace(/^[^a-z]+/,''))).length;
  const interrogativa=p=>/^(que|cual|cuales|como|cuanto|cuanta|cuando|donde|por que|quien)\b/.test(normal(p).replace(/^[^a-z]+/,''));
  return sueltas.filter(p=>!(conArticulo>=2&&interrogativa(p))).map(p=>({p,k:clave(normal(p))}))
    .filter(x=>x.k&&!familia(x.k).some(r=>responde(r,x.k)))
    .map(x=>({tema:x.k,componentes:[x.p],generico:true}));
}
