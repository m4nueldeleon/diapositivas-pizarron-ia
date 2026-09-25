import test from 'node:test';
import assert from 'node:assert/strict';
import { ARGS_UN_PROCESO, lanzarChromium, nuevaPagina } from '../scripts/lib/pipeline.mjs';

// Codex corre en un sandbox de macOS donde Chromium no puede registrar puertos Mach: el motor reintenta en un solo
// proceso. Aquí se comprueba que ese modo arranca y pinta, y que el diagnóstico simulado se conserva.
test('Chromium en un solo proceso arranca y pinta (respaldo del sandbox de Codex)', { timeout: 60_000 }, async t => {
  let b;
  try { b = await lanzarChromium({ args: ARGS_UN_PROCESO }); } catch { t.skip('sin Chromium en esta máquina'); return; }
  try {
    const p = await b.newPage();
    await p.setContent('<div style="width:40px;height:40px;background:#c8101e"></div>');
    const png = await p.screenshot();
    assert.ok(png.length > 100);
  } finally { await b.close(); }
});

test('si el sandbox también bloquea el reintento, queda el diagnóstico original', async () => {
  const antes = process.env.PZ_LAUNCH_FALSO;
  process.env.PZ_LAUNCH_FALSO = 'mach';
  try { await assert.rejects(lanzarChromium(), e => e.motivo === 'sandbox'); }
  finally { if (antes === undefined) delete process.env.PZ_LAUNCH_FALSO; else process.env.PZ_LAUNCH_FALSO = antes; }
});

test('en un solo proceso, nuevaPagina abre una segunda página y se cierra con el navegador', { timeout: 60_000 }, async t => {
  let b;
  try { b = await lanzarChromium({ args: ARGS_UN_PROCESO }); } catch { t.skip('sin Chromium en esta máquina'); return; }
  try {
    const p1 = await nuevaPagina(b, { viewport: { width: 200, height: 100 } });
    await p1.setContent('<b>uno</b>');
    const p2 = await nuevaPagina(b, { viewport: { width: 200, height: 100 } });
    await p2.setContent('<b>dos</b>');
    assert.ok((await p2.screenshot()).length > 100);
    await p2.close();
  } finally { await b.close(); }
});
