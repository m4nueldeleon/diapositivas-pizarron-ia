// Interfaces observadas en la referencia: agenda mensual e invitación de llamada.
import { marcar, escapar, nota, fuente, pasoDe } from './comun.mjs';
export function agenda(l, ctx) {
  const semanas = l.semanas || 4, dias = ctx.vertical ? l.dias.slice(0,3) : l.dias;
  const eventos = [...(l.series || []).flatMap((s,i) => (s.semanas || Array.from({length:semanas},(_,j) => j+1)).map(semana => ({...s,semana,paso:s.paso ?? i+1}))),
    ...(l.eventos || []).map((e,i) => ({...e,paso:e.paso ?? (l.series || []).length+i+1}))];
  const cab = dias.map(d => `<div class="agenda-dia"${ctx.P(0)}>${escapar(d)}</div>`).join('');
  const celdas = Array.from({length:semanas},(_,s) => dias.map((_,d) => {
    const hoy = l.hoy?.semana === s+1 && l.hoy?.dia === d+1;
    const numero = ((l.inicio || 1)-1+s*7+d)%31+1;
    const bloques = eventos.filter(e => e.semana === s+1 && e.dia === d+1).map((e,j) => `<div class="agenda-evento agenda-${e.tono || 'azul'}"${ctx.P(e.paso)}${ctx.A(`evento${s}-${d}-${j}`)}><b>${marcar(e.texto)}</b>${e.sub ? `<span>${marcar(e.sub)}</span>` : ''}</div>`).join('');
    return `<div class="agenda-celda"><div class="agenda-numero${hoy ? ' agenda-hoy' : ''}"${ctx.P(0)}>${numero}</div>${bloques}</div>`;
  }).join('')).join('');
  return `<div class="agenda sangre" style="--dias:${dias.length};--semanas:${semanas}">${cab}${celdas}</div>`;
}
export function invitacion(l, ctx) {
  return `<div class="invitacion"${ctx.P(0)}><div class="invitacion-cab"><b>${marcar(l.texto)}</b><span>${escapar(l.hora || '')}</span></div>${l.sub ? `<div class="invitacion-sub">${marcar(l.sub)}</div>` : ''}<div class="invitacion-boton"${ctx.A('boton')}>${escapar(l.boton || 'Unirme')}</div></div>`;
}
export function listaContraste(l, ctx) {
  const porColumna = l.revelar === 'columna', columnas = l.columnas;
  const offsets = columnas.map((_,i) => columnas.slice(0,i).reduce((n,c) => n+c.items.length,0));
  const total = porColumna ? columnas.length : columnas.reduce((n,c) => n+c.items.length,0);
  const html = columnas.map((c,j) => {
    const filas = c.items.map((item,i) => {
      const o = typeof item === 'string' ? {texto:item} : item, e = o.emoji || (c.vineta === 'cruz' ? '❌' : '✅');
      return `<div class="item"${ctx.P(porColumna ? j : offsets[j]+i)}${ctx.A('i'+(offsets[j]+i))}>${ctx.em.html(e,'1.12em')}<span>${marcar(o.texto)}</span></div>`;
    }).join('');
    return `<div class="contraste-col"${ctx.A('c'+j)}${l.apagar === j ? ' data-contraste-apagado="1"' : ''}><div class="contraste-titulo tono-${c.tono || 'n'}"${ctx.P(porColumna ? j : offsets[j])}>${marcar(c.titulo)}</div><div class="lista">${filas}</div></div>`;
  }).join('');
  return `<div class="pila">${l.encabezado ? `<div class="encabezado"${ctx.P(0)}>${marcar(l.encabezado)}</div>` : ''}<div class="contraste">${html}</div>${nota(ctx,l.nota,pasoDe(l,'nota_paso',total),'mt-m')}${fuente(ctx,l.fuente,pasoDe(l,'fuente_paso',total-1))}</div>`;
}
