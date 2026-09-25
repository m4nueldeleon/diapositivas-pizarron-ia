// R17 (fidelidad, pendiente 9 del juez r16): la ráfaga e_sello [6:44.8 → 6:44.9] muestra el sello COMPLETO en el corte e
// inmóvil después; la rejilla de 500 cajas [hoja_03 6:40] va en 25×20 y usa casi todo el alto.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir } from '../scripts/lib/pipeline.mjs';
import { RAFAGAS } from '../scripts/lib/secuencia-referencia.mjs';
import { inyectable } from '../scripts/lib/medidas-dom.mjs';
import { medidasR11 } from '../scripts/lib/medidas-r11.mjs';

async function pagina(t, deck) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r17f-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', formato: '16:9', ...deck }));
  const prep = prepararSalida(dir); let b;
  try { b = await abrir(prep.htmlPath, prep.W, prep.H); } catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(e.motivo); return null; }
  t.after(() => b.browser.close());
  await b.page.addScriptTag({ content: inyectable() + `;window.medidasR11=${medidasR11.toString()};` });
  return b.page;
}
const REJILLA = { tipo: 'rejilla', encabezado: 'Tendrías que vender…', encabezado_estilo: 'frase', emoji: '📦', total: 500, anotacion: 'Son 500', sello: 'Mucha habilidad' };

test('r17: en seco el sello entra completo en el corte y no se mueve; el golpe con temblor es de «suave»', async t => {
  for (const [animacion, completo] of [[undefined, true], ['suave', false]]) {
    const p = await pagina(t, { animacion, laminas: [REJILLA] }); if (!p) return;
    const r = await p.evaluate(() => {
      const l = window.PZ.lams[0], ultimo = window.PZ.pasos(l) - 1, s = l.querySelector('.sello');
      return [0, 125, 250].map(ms => { window.PZ.mostrar(l, ultimo, ms); return { ms, o: +s.style.opacity, t: s.style.transform }; });
    });
    if (completo) assert.ok(r.every(x => x.o === 1 && /scale\(1\)/.test(x.t) && /translate\(0px, 0px\)/.test(x.t)), JSON.stringify(r));
    else assert.ok(r[0].o < 1 || !/scale\(1\)/.test(r[0].t), `suave conserva el golpe: ${JSON.stringify(r)}`);
  }
});

test('r17: 500 cajas van en 25×20, llegan a ~1190 px y usan el alto; el sello cubre la rejilla; QA no la cuenta en el margen', async t => {
  const p = await pagina(t, { laminas: [REJILLA, { ...REJILLA, total: 300, anotacion: 'Son 300' }] }); if (!p) return;
  const r = await p.evaluate(() => window.PZ.lams.map(l => {
    const k = e => { const a = e.getBoundingClientRect(), L = l.getBoundingClientRect(), s = L.width / l.offsetWidth; return { w: a.width / s, h: a.height / s }; };
    const rej = l.querySelector('.rejilla');
    return { cols: getComputedStyle(rej).gridTemplateColumns.split(' ').length, rej: k(rej), sello: k(l.querySelector('.sello')), masiva: rej.classList.contains('rejilla-masiva'), avisos: window.medidasR11(l).avisos };
  }));
  const [m, n] = r;
  assert.equal(m.cols, 25); assert.ok(m.masiva);
  assert.ok(m.rej.w >= 1150 && m.rej.h >= 840, JSON.stringify(m.rej));
  assert.ok(m.sello.w >= m.rej.w * .95, `sello ${m.sello.w} sobre rejilla ${m.rej.w}`);
  assert.ok(!m.avisos.some(a => /margen seguro/.test(a)), m.avisos.join('\n'));
  assert.ok(!n.masiva && n.cols === 22, `300 cajas conservan la rejilla de siempre: ${JSON.stringify(n)}`);
});

test('r17: la ráfaga e_sello se mide en el paso del sello de r403, con su región roja', () => {
  const e = RAFAGAS.find(r => r.nombre === 'e_sello');
  assert.ok(e && e.id === 'r403' && e.paso === -1 && e.regiones.sello, JSON.stringify(e));
  const replica = JSON.parse(fs.readFileSync(new URL('./replica/deck.json', import.meta.url), 'utf8'));
  assert.ok(replica.laminas.some(l => l.id === 'r403' && l.tipo === 'rejilla' && l.total === 500 && l.sello));
});
