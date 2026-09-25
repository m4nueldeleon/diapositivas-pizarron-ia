import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararSalida, abrir, lanzarChromium } from '../scripts/lib/pipeline.mjs';
import { medidasR11 } from '../scripts/lib/medidas-r11.mjs';

async function navegador(t) {
  try { const b = await lanzarChromium(); await b.close(); return true; }
  catch (e) { if (e.code !== 'SIN_NAVEGADOR') throw e; t.skip(`SIN RENDER: ${e.motivo}`); return false; }
}

test('r11: filas breves ocupan el lienzo, conservan rótulos legibles y no saltan al revelar', async t => {
  if (!(await navegador(t))) return;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pz-r11-filas-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify({ marca: false, emoji: 'apple', laminas: [
    { tipo: 'flujo', flecha: 'ninguna', nodos: [{ emoji: '📦', etiqueta: 'Entrega' }, { emoji: '💵', etiqueta: 'Monto' }, { emoji: '📅', etiqueta: 'Fecha' }] },
    { tipo: 'pasos', etiquetas: ['Define', 'Confirma', 'Entrega'], revelar: 'pasos' },
    { tipo: 'bifurcacion', origen: { texto: 'Dos alcances' }, ramas: [{ emoji: '📦', texto: 'Inicial' }, { emoji: '📦', texto: 'Completo' }] },
    { tipo: 'lista', columnas: [{ titulo: 'Incluye:', items: ['Una entrega'] }, { titulo: 'No incluye:', vineta: 'cruz', items: ['Cambios extra'] }] },
    { tipo: 'opciones', items: [{ texto: 'Inicial' }, { texto: 'Completo' }] },
    { tipo: 'opciones', texto: 'Elige el alcance', texto_pos: 'arriba', items: [{ texto: 'Inicial' }, { texto: 'Completo' }] },
    { tipo: 'circulos', texto: 'Clientes', personas: 2 },
    { tipo: 'rejilla', total: 3, columnas: 3, emoji: '📦' },
    { tipo: 'circulos', texto: 'Por eso esta industria estaba reservada para **unos pocos**', personas: 12, adentro: 2, emoji: '🧑‍💼' },
  ] }));
  const p = prepararSalida(dir), { browser, page } = await abrir(p.htmlPath, p.W, p.H);
  try {
    await page.addScriptTag({ content: `window.medidasR11=${medidasR11.toString()}` });
    const medidas = await page.evaluate(() => window.PZ.lams.map(l => {
      window.PZ.mostrar(l, window.PZ.pasos(l) - 1, Infinity);
      const L = l.getBoundingClientRect(), z = l.querySelector('.lienzo'), cs = getComputedStyle(z);
      const util = z.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const fila = l.querySelector('[data-fila-corta],[data-composicion-circulos]');
      if (l.dataset.tipo === 'circulos' && l.querySelectorAll('.emo').length > 4) {
        return { tipo: l.dataset.tipo, corta: false, qa: window.medidasR11(l) };
      }
      if (!fila) return { tipo: l.dataset.tipo, falta: true };
      const r = fila.getBoundingClientRect(), b = z.firstElementChild.getBoundingClientRect();
      const etiquetas = [...fila.querySelectorAll('.etiqueta,.rotulo-paso,.contraste-titulo,.item,.opcion')];
      const efectivo = e => {
        let zoom = 1;
        for (let p = e; p && p !== l; p = p.parentElement) zoom *= parseFloat(getComputedStyle(p).zoom) || 1;
        return parseFloat(getComputedStyle(e).fontSize) * zoom;
      };
      const em = [...fila.querySelectorAll('.emo')].filter(e => !e.closest('.item'));
      window.PZ.mostrar(l, 0, Infinity);
      const inicial = fila.getBoundingClientRect();
      return { tipo: l.dataset.tipo, ancho: r.width / util, centro: (b.top - L.top + b.height / 2) / L.height,
        letra: Math.min(...etiquetas.map(efectivo)), emojis: em.map(e => e.getBoundingClientRect().width),
        salto: Math.abs(inicial.y - r.y) + Math.abs(inicial.x - r.x) };
    }));
    for (const m of medidas) {
      if (m.corta === false) {
        assert.equal(m.qa.medidas.fila_ancho_pct, undefined, JSON.stringify(m));
        assert.ok(!m.qa.avisos.some(a => /ancho útil/.test(a)), JSON.stringify(m));
        continue;
      }
      assert.equal(m.falta, undefined, JSON.stringify(m));
      assert.ok(m.ancho >= .5, JSON.stringify(m));
      assert.ok(m.letra >= 60, JSON.stringify(m));
      assert.ok(m.centro >= .4 && m.centro <= .58, JSON.stringify(m));
      assert.ok(m.salto < 1, JSON.stringify(m));
      if (m.tipo === 'flujo') assert.ok(m.emojis.every(tam => tam >= 200), JSON.stringify(m));
    }
    const circulos = await page.evaluate(() => {
      const l = window.PZ.lams.find(l => l.dataset.tipo === 'circulos');
      const bueno = window.medidasR11(l);
      l.querySelector('[data-composicion-circulos]').style.zoom = '.5';
      return { bueno, malo: window.medidasR11(l) };
    });
    assert.ok(circulos.bueno.medidas.fila_ancho_pct >= 50, JSON.stringify(circulos));
    assert.ok(!circulos.bueno.avisos.some(a => /ancho útil/.test(a)), JSON.stringify(circulos));
    assert.ok(circulos.malo.avisos.some(a => /ancho útil/.test(a)), JSON.stringify(circulos));
  } finally { await browser.close(); }
});
