# CLAUDE.md — mantener esta skill

Este archivo es para quien **modifica el motor o el conocimiento**. Para **usar** la skill, lee
SKILL.md.

## Mapa
- `scripts/lib/construir.mjs` convierte deck.json en HTML. Registra los diseños en `LAYOUTS` y
  los formatos en `FORMATOS`.
- `scripts/lib/layouts-texto.mjs` y `layouts-datos.mjs` tienen un diseño por función. Los pasos
  se asignan con `ctx.P(k)`, las anclas con `ctx.A(id)` y las flechas con `ctx.con({...})`.
- `templates/runtime.js` corre en el navegador: `encajar`, luego `dibujar` la capa a mano, y
  `mostrar(lámina, paso, t)`. Esa última función es la única fuente de verdad del revelado para
  el presentador, los PNG y el video.
- `templates/base.css` guarda los tokens medidos en la referencia. Si cambias un tamaño,
  justifícalo contra ella.
- `scripts/lib/tiempos.mjs` da el ritmo y la alineación global con la transcripción.
- `scripts/qa.mjs` tiene reglas que cuentan. Cada regla nueva lleva su mensaje accionable.

## Reglas de mantenimiento
1. **Un diseño nuevo exige cinco cosas**:
   - la función en `layouts-*.mjs`;
   - su registro en `LAYOUTS`;
   - sus campos obligatorios en `contrato.mjs`;
   - su sección en `references/LAYOUTS.md`;
   - su lámina en `ejemplos/demo/deck.json`. La prueba `contrato.test.mjs` exige que el demo
     use todos los diseños.
2. **Se calibra contra la referencia, no a ojo.** Replica la lámina del video, renderízala y
   compárala lado a lado. No se suben cuadros del video al repo.
3. **Todo texto del deck pasa por `marcar()` o `escapar()`** antes de llegar al HTML. Todo campo
   numérico, de tono o de tamaño pasa por `sanearDeck()` (`contrato.mjs`), que usa listas cerradas.
   Las imágenes solo se copian desde la carpeta del deck. Hay pruebas de regresión en
   `pruebas/seguridad.test.mjs`.
4. Antes de publicar, corre estos comandos y mira `ejemplos/demo/salida/hoja.jpg`:
   ```bash
   node --test pruebas/*.test.mjs
   node scripts/render.mjs ejemplos/demo && node scripts/qa.mjs ejemplos/demo
   ```
5. Las correcciones de gusto del usuario van en `LECCIONES.md`, con fecha y el porqué.
