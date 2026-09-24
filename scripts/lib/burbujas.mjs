// La misma burbuja y avatar en conversación, muro, celular y sobre una imagen.
import { marcar, escapar, PERSONA } from './comun.mjs';
export function burbuja(m, ctx, { indice = 0, paso = indice, avatar, avatarTam = 108, ejemplo = false, rafaga = false, celda = false } = {}) {
  const yo = (m.de || 'yo') === 'yo';
  const cuerpo = marcar(m.texto).replace(/\[([^\[\]<>]+)\]/g, (todo,t) => /^[A-ZÁÉÍÓÚÑÜ0-9 _-]+$/.test(t) ? todo : `<span class="var-plantilla${t.trim().split(/\s+/).length>3 ? ' largo' : ''}">[${t}]</span>`);
  // El sello EJEMPLO y la fuente por mensaje son de la tarjeta `respuesta` (la salida de una IA). En una conversación
  // yo/otro la procedencia va UNA vez en el pie de la lámina (rotuloProcedencia): un sello en cada burbuja tapaba el texto.
  const pie = m.de !== 'respuesta' ? '' : ejemplo || m.ejemplo === true ? '<div class="chat-ejemplo">EJEMPLO</div>' : m.fuente ? `<div class="fuente">${escapar(m.fuente)}</div>` : '';
  if (['prompt','respuesta'].includes(m.de)) {
    const rem = m.de === 'respuesta' ? `<div class="nota chat-remitente">${marcar(m.remitente || 'Respuesta')}</div>` : '';
    return `<div class="chat-tarjeta ${m.de}"${ctx.P(paso)}${ctx.A('m'+indice)}>${rem}<div class="burbuja">${cuerpo}</div>${pie}</div>`;
  }
  const spec = m.avatar ?? avatar, clase = yo ? 'yo-av' : 'otro-av';
  const av = spec === false ? '' : typeof spec === 'string' && spec ? `<div class="${clase} av-emo">${ctx.emoji(spec,avatarTam)}</div>` : `<div class="${clase}">${PERSONA}</div>`;
  const hora = m.hora ? `<div class="chat-hora"${ctx.P(paso)}>${escapar(m.hora)}</div>` : '';
  const retraso = rafaga ? ` data-rafaga="1" data-retraso="${indice*250}"` : '';
  return `${celda ? `<div class="chat-celda"${ctx.P(paso)}${retraso}>` : ''}${hora}<div class="msj ${yo ? 'yo' : 'otro'}"${ctx.P(paso)}${!celda ? retraso : ''}>${yo ? '' : av}<div class="burbuja"${ctx.A('m'+indice)}>${cuerpo}</div>${yo ? av : ''}</div>${celda ? '</div>' : ''}`;
}
export function mensajesSobre(l, ctx) {
  if (!l.mensajes?.length) return '';
  const inicio = ctx.max+1;
  return `<div class="mensajes-superpuestos mensajes-${l.mensajes_pos || 'izq'}"><div class="chat">${l.mensajes.map((m,i) => burbuja(m,ctx,{indice:i,paso:inicio+i,avatarTam:76})).join('')}</div></div>`;
}
