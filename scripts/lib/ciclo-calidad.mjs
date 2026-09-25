import crypto from 'node:crypto';

export function qaVigente(qa, { deck_sha, html_sha, desde }) {
  return qa.medido === true && qa.deck_sha === deck_sha && qa.html_sha === html_sha
    && Number.isFinite(Date.parse(qa.fecha)) && Date.parse(qa.fecha) >= desde;
}

export function tipoArreglo(texto) {
  if (/Chromium|SIN RENDER|sin-medir|navegador/i.test(texto)) return 'entorno';
  if (/vineta|fuente_paso|consigna.*[ií]tems|lista con columnas|emoji|[ií]conos/i.test(texto)) return 'json';
  if (/gancho|persona|voz|45%|45 %|arco|revelaci[oó]n|demostr|golpe|anuncia un dato/i.test(texto)) return 'guion';
  if (/dato pendiente|por confirmar|conf[ií]rma|firma|sala.*declara|¿se proyecta|qui[eé]n entrega/i.test(texto)) return 'decision_cliente';
  if (/captura real|logo oficial|archivo.*(?:falta|no existe)|imagen.*(?:cargar|no existe)/i.test(texto)) return 'asset';
  if (/encim|desborde|recortad|geometr|subrayado cruza|contraste|encaje/i.test(texto)) return 'motor';
  if (/prueba/i.test(texto)) return 'guion';
  return 'json';
}

export function colaCalidad(qa) {
  const crear = (mensaje, severidad) => ({ id: crypto.createHash('sha256').update(`${severidad}:${mensaje}`).digest('hex').slice(0, 12), mensaje, severidad, tipo_arreglo: tipoArreglo(mensaje) });
  return [
    ...(qa.errores || []).map(x => crear(x, 'error')),
    ...(qa.avisos || []).map(x => crear(x, 'aviso')),
    ...Object.entries(qa.por_confirmar || {}).map(([k, d]) => crear(`${k} por confirmar: ${d.motivo || 'requiere confirmación'}`, 'dato')),
    ...(qa.falta_para_final || []).map(x => crear(x, 'final')),
  ];
}

export function decisionCiclo(qa, anteriores = []) {
  const cola = colaCalidad(qa), firma = cola.map(x => x.id).sort().join(',');
  const repetido = cola.length > 0 && anteriores.some(q => colaCalidad(q).map(x => x.id).sort().join(',') === firma);
  const soloDatos = cola.length > 0 && cola.every(x => x.severidad === 'dato');
  const estado = !cola.length ? (qa.medido === true && qa.estado === 'listo' ? 'revisar_hoja' : 'render_pendiente')
    : soloDatos ? 'espera_datos' : repetido ? 'estancado' : anteriores.length >= 2 ? 'limite_de_rondas' : 'corregir';
  return { estado, puede_renderizar: !cola.length, puede_entregar: false, cola,
    criterio_paro: 'Sin errores ni avisos pendientes; datos confirmados; QA medido listo y hoja revisada del mismo deck. Repetición o tres rondas detienen la automatización, nunca aprueban.' };
}
