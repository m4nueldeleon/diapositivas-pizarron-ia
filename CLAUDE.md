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
- `scripts/qa.mjs` tiene reglas que cuentan. Cada regla nueva lleva su mensaje accionable y una
  prueba en `pruebas/qa-visual.test.mjs` (fixtures en `pruebas/fixtures/`).
- `scripts/lib/contrato.mjs` guarda en `CAMPOS` lo que lee cada diseño. Si un layout lee un campo
  nuevo, agrégalo ahí: la prueba lo exige, y un campo fuera de la tabla sale como aviso en QA.
- `scripts/lib/reglas-deck.mjs`: reglas de QA que se leen en el deck.json sin navegador (firma de
  relleno, duración de la pieza y peso de los tramos en vivo, apertura, voz humana, proyecciones, posts de
  maqueta, llamado, prueba real y credibilidad, objeciones, descargos en pantalla, coherencia emoji↔concepto,
  claves que nadie lee, los 9 bloques de la propuesta, escasez/garantía/bonos de la oferta, desglose de un precio)
  y la nota (`notaQA`, con tope de BORRADOR). `infoEmoji`/`infoFirma` van a `qa.json → info` y NO restan. Son
  funciones puras: su prueba va en `pruebas/reglas-deck.test.mjs` u `oferta-propuesta.test.mjs`. `revisarDeck`
  recibe `crudo` (el deck antes de sustituir `datos`) para saber si un número vino de un `{{MARCADOR}}`.
- `scripts/lib/marca.mjs`: la ficha MI-MARCA.md (firma y palabras vetadas) con UNA cadena de búsqueda (carpeta del
  deck → arriba → `$PIZARRON_MARCA` → `~/.config/diapositivas-pizarron-ia/MI-MARCA.md`). `pipeline.mjs` aplica la
  firma a un deck sin `marca`; el logo solo se copia si la ficha está en la carpeta del deck.
- `scripts/lib/datos.mjs` sustituye `{{CLAVE}}` con `datos` antes de sanear; lo que falta queda como
  `[CLAVE]`, que `marcar()` pinta como hueco y QA cuenta como pendiente.
- `scripts/lib/hoja.mjs` arma `hoja.jpg` y `hoja-pasos.jpg` con la misma numeración que los PNG y el QA; con más
  de 20 láminas las pagina (`hoja-01.jpg`…, `hojas.json`). `render.mjs --pdf` usa `scripts/lib/pdf.mjs`: recaptura
  cada lámina sin cursor (una página por lámina; el stack con su remate en una banda) y en propuesta o VSL arma
  `laminas-notas.pdf` con la voz como texto (`pdf.json` lo resume).
- `ejemplos/vsl-corto/` es el modelo de guion de venta; `pruebas/ejemplos.test.mjs` exige que no dé avisos de guion.
- `templates/presentador.js` es el presentador en vivo y la vista de ensayo (`?modo=orador`), sobre
  `window.PZ`. Lee la voz del `<script class="guion">` que `construir.mjs` mete en cada lámina. Las dos
  ventanas se siguen por `postMessage` (ventana ↔ opener; BroadcastChannel no cruza documentos `file://` en
  Safari) y la `camara` con `vivo: true` lleva su bloque `.vivo-pres` con cuenta regresiva.
- `scripts/comparar.mjs` (+ `lib/tinta.mjs`) mide la réplica versionada (`pruebas/replica/deck.json`) contra
  los cuadros del video, que viven fuera del repo: ver PROTOCOLO §4b. Es la única evidencia de fidelidad de una
  ronda (`comp_N.jpg` con métrica + `comparar.json`); se niega a comparar si junto a los cuadros hay otro deck.json.
- `scripts/lib/medidas-dom.mjs`: medidas que QA hace dentro de Chromium (palabras por renglón, recortes, flex
  con texto y negrita). Son autocontenidas: qa.mjs y las pruebas las inyectan con `inyectable()`.
- `scripts/medir-emojis.mjs` → `scripts/lib/contraste-emojis.json`: el contraste medido de cada emoji (dos
  sets, tres fondos). Córrelo al agregar emojis a EMOJIS.md. Sobre un fondo de COLOR (pieza del stack, cuadro,
  botón) QA rasteriza el glifo en cada corrida contra el color real (`scripts/lib/contraste-color.mjs`).
- `references/EMOJIS.md` es la única fuente de verdad de los emojis. `pruebas/emojis-coherencia.test.mjs` falla
  si un emoji queda en dos filas de concepto, si otro documento cita un emoji que no está en el diccionario o
  si un sustituto de `BAJO_CONTRASTE` cambia de concepto. Los grupos de `PARECIDOS` (emoji.mjs) van en su tabla.

## Reglas de mantenimiento
1. **Un diseño nuevo exige cinco cosas**:
   - la función en `layouts-*.mjs`;
   - su registro en `LAYOUTS`;
   - sus campos obligatorios (`REQUERIDOS`) y los que lee (`CAMPOS`) en `contrato.mjs`;
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
