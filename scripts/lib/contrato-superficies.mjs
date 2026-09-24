// Límites de las nuevas superficies; las referencias inválidas fallan antes de dibujar.
export function validarSuperficies(l, formato, nombre) {
  const errores = [], error = t => errores.push(`${nombre}: ${t}`);
  if (l.tipo === 'agenda') {
    const semanas = l.semanas ?? 4, dias = Array.isArray(l.dias) ? l.dias : [];
    if (!dias.length || dias.length>7 || dias.some(d => typeof d !== 'string' || !d.trim())) error('agenda.dias debe contener de 1 a 7 nombres de día');
    if (!Number.isInteger(semanas) || semanas<1 || semanas>6) error('agenda.semanas debe ser un entero de 1 a 6');
    const comprobar = (o, nombre, serie = false) => {
      if (!o || typeof o !== 'object' || Array.isArray(o)) { error(`${nombre} debe ser un objeto`); return; }
      if (formato === '9:16' && o.dia>3) error(`${nombre}.dia queda fuera de los tres días visibles en vertical; divide la agenda`);
      if (!Number.isInteger(o.dia) || o.dia<1 || o.dia>dias.length) error(`${nombre}.dia no existe en la agenda`);
      const ss = serie ? o.semanas ?? Array.from({length:6},(_,i) => i+1).slice(0,semanas) : [o.semana];
      if (!Array.isArray(ss) || !ss.length || ss.some(n => !Number.isInteger(n) || n<1 || n>semanas)) error(`${nombre}.semana no existe en la agenda`);
      if (nombre !== 'hoy' && (typeof o.texto !== 'string' || !o.texto.trim())) error(`${nombre}.texto debe ser texto no vacío`);
      if (o.tono != null && !['azul','verde','morado'].includes(o.tono)) error(`${nombre}.tono debe ser azul, verde o morado`);
    };
    if (l.hoy) comprobar(l.hoy,'hoy');
    if (Array.isArray(l.series)) l.series.forEach((o,i) => comprobar(o,`series[${i}]`,true));
    if (Array.isArray(l.eventos)) l.eventos.forEach((o,i) => comprobar(o,`eventos[${i}]`));
  }
  if (l.tipo === 'lista' && l.columnas != null) {
    if (!Array.isArray(l.columnas) || l.columnas.length !== 2) error('lista.columnas exige dos columnas');
    else l.columnas.forEach((c,i) => {
      if (!c || typeof c !== 'object') { error(`columnas[${i}] debe ser un objeto`); return; }
      if (typeof c.titulo !== 'string' || !c.titulo.trim()) error(`columnas[${i}].titulo falta`);
      if (!Array.isArray(c.items) || !c.items.length || c.items.some(o => !(typeof o === 'string' || (o && typeof o.texto === 'string')))) error(`columnas[${i}].items exige textos`);
      if (c.tono != null && !['v','r','n'].includes(c.tono)) error(`columnas[${i}].tono debe ser v, r o n`);
      if (c.vineta != null && !['check','cruz'].includes(c.vineta)) error(`columnas[${i}].vineta debe ser check o cruz`);
    });
  }
  if (l.tipo === 'chat') {
    if (l.variante === 'muro' && (!Array.isArray(l.mensajes) || l.mensajes.length<6 || l.mensajes.length>12 || l.mensajes.some(m => m?.de !== 'otro'))) error('chat muro exige 6-12 mensajes de otro; no admite yo, prompt ni respuesta');
    if (l.procedencia === 'real' && !(typeof l.fuente === 'string' && /\{\{[A-Z0-9_]+\}\}|\b(?:19|20)\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(l.fuente))) error('chat real exige fuente con fecha');
    if (l.app != null && !(typeof l.app === 'string' && /^(?:\{\{LOGO_[A-Z0-9_]+\}\}|\[LOGO_[A-Z0-9_]+\]|https:\/\/[^\s]+|[^\s]+\.(?:png|jpe?g|webp|svg))$/i.test(l.app))) error('app necesita el logo real o {{LOGO_X}} declarado; no inventes un logo');
  }
  if (['foto','prueba'].includes(l.tipo) && l.mensajes != null && (!Array.isArray(l.mensajes) || l.mensajes.length>2 || l.mensajes.some(m => !m || !['yo','otro'].includes(m.de) || typeof m.texto !== 'string'))) error('mensajes admite máximo dos burbujas {de: yo|otro, texto}');
  if (Array.isArray(l.anotaciones)) l.anotaciones.forEach((a,i) => {
    if (a?.llave != null && (!Array.isArray(a.llave) || a.llave.length!==2 || a.llave.some(x => typeof x !== 'string' || !/^(?:i|m|l|w)\d+$/.test(x)))) error(`anotaciones[${i}].llave exige dos anclas i*, m*, l* o w*`);
  });
  return errores;
}
export function sanearAceptaciones(lista, avisos) {
  if (!Array.isArray(lista)) { avisos.push('avisos_aceptados debe ser una lista con texto o regla y motivo'); return []; }
  return lista.flatMap((a,i) => {
    const texto = a?.texto, regla = a?.regla, motivo = a?.motivo;
    const valido = typeof motivo === 'string' && motivo.trim() && motivo.length<=500
      && ((typeof texto === 'string' && texto.trim() && texto.length<=500) || (typeof regla === 'string' && regla.trim() && regla.length<=120))
      && (a.laminas == null || (Array.isArray(a.laminas) && a.laminas.length && a.laminas.every(n => Number.isInteger(n) && n>0 && n<=10000)));
    if (!valido) { avisos.push(`avisos_aceptados[${i}]: exige texto o regla, motivo no vacío y láminas enteras positivas`); return []; }
    return [{ ...(typeof texto === 'string' ? {texto:texto.trim().slice(0,500)} : {regla:regla.trim()}), motivo:motivo.trim(), ...(a.laminas ? {laminas:[...a.laminas]} : {}) }];
  });
}
