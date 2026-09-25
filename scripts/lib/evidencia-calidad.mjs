import fs from 'node:fs';
import path from 'node:path';

const ARCHIVO = 'calidad-historial.json';
function leer(dir) {
  const archivo = path.join(dir, ARCHIVO);
  if (!fs.existsSync(archivo)) return { renders: [], revisiones: [] };
  const h = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  if (!Array.isArray(h.renders) || !Array.isArray(h.revisiones)) throw new Error(`${ARCHIVO} inválido: conserva la evidencia y revisa su estructura`);
  return h;
}
function guardar(dir, h) {
  const archivo = path.join(dir, ARCHIVO);
  fs.writeFileSync(archivo + '.tmp', JSON.stringify(h, null, 2));
  fs.renameSync(archivo + '.tmp', archivo);
  return h;
}
export function registrarRender(dir, { deck_sha, html_sha }) {
  const h = leer(dir);
  const render = { numero: h.renders.length + 1, deck_sha, html_sha, fecha: new Date().toISOString() };
  return guardar(dir, { ...h, renders: [...h.renders, render] });
}
export function registrarQA(dir, qa, html_sha) {
  if (qa.medido !== true || !Number.isFinite(qa.nota)) throw new Error('Solo un QA medido tiene nota de render');
  const h = leer(dir), ultimo = h.renders.at(-1);
  const coincide = ultimo && ultimo.deck_sha === qa.deck_sha && ultimo.html_sha === html_sha;
  const revision = { render: coincide ? ultimo.numero : null, deck_sha: qa.deck_sha, html_sha,
    nota: qa.nota, estado: qa.estado, errores: qa.errores, avisos: qa.avisos, fecha: qa.fecha };
  // Nunca sustituir una nota ya registrada del primer render por una corrida posterior.
  const revisiones = [...h.revisiones, revision];
  const primera = revisiones.find(q => q.render === 1) || null;
  return guardar(dir, { ...h, revisiones, primer_render: h.renders[0] || null,
    qa_primer_render: primera, qa_ultimo_render: coincide ? revision : null,
    advertencia: coincide ? 'La hoja todavía requiere revisión visual humana.' : 'QA sin capturas vigentes del mismo HTML; no acredita el primer render.' });
}
