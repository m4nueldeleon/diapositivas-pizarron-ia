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
- `templates/runtime-sello.js` (dónde cae el sello) no es un script suelto: construir.mjs lo inserta DENTRO de runtime.js
  (marca `SELLO`) y usa sus utilidades.
- `templates/base.css` guarda los tokens medidos en la referencia. Si cambias un tamaño,
  justifícalo contra ella.
- `scripts/lib/sincronia.mjs`: persona y sincronía pantalla↔voz sobre `revela`; las heurísticas avisan, la persona declarada contradictoria es error.
- `scripts/lib/aritmetica.mjs`: cuentas de `cifra` con intervalos, continuaciones y tolerancia; contradicciones literales y proporciones de rejilla. Lo ambiguo se omite.
- `scripts/lib/reglas-estilo.mjs`: avisos estrechos de color, mayúsculas y logos de herramientas en etiquetas.
- `scripts/lib/qr.mjs` encapsula `qr-vendor/` (codificador MIT de terceros, sin npm ni red; no se edita), `reglas-qr.mjs`
  revisa el acceso en vivo y `variantes.mjs` revisa bandas, siglas y prompt/respuesta. El QR añade un paso: alinea la voz.
- `scripts/lib/tiempos.mjs` da el ritmo y la alineación global con la transcripción.
- `scripts/qa.mjs` tiene reglas que cuentan. Cada regla nueva lleva su mensaje accionable y una
  prueba en `pruebas/qa-visual.test.mjs` (fixtures en `pruebas/fixtures/`).
- `scripts/lib/contrato.mjs` guarda en `CAMPOS` lo que lee cada diseño. Si un layout lee un campo
  nuevo, agrégalo ahí: la prueba lo exige, y un campo fuera de la tabla sale como aviso en QA.
- `scripts/lib/reglas-deck.mjs`: reglas de QA que se leen en el deck.json sin navegador (firma de
  relleno, duración de la pieza y peso de los tramos en vivo, apertura, voz humana, proyecciones, posts de
  maqueta, llamado, prueba real y credibilidad, objeciones, descargos en pantalla, coherencia emoji↔concepto,
  claves que nadie lee, los 9 bloques de la propuesta, escasez/garantía/bonos de la oferta, desglose de un precio,
  promesas de ingreso sin descargo visible, el orden de la oferta en un VSL (ningún llamado antes de la revelación, un
  solo canal de llamado, la oferta medida desde la oscura), la promesa o el mecanismo antes del segundo 30, objeciones
  con frecuencia inventada, tasas sin origen, sustitutos de prueba d/e de GUION §7 (`origenPrueba`: la prueba PROPIA, a/b, contra la de MERCADO, c, con `fuente` de terceros: cuenta para final pero avisa en un vsl), capturas `hueco`
  por conseguir, tutoriales sin demostración y el cierre de una clase: tarea + puente)
  y la nota (`notaQA`, con tope de BORRADOR: los datos por confirmar NO restan; qa.mjs los pone en `datos_por_confirmar`). `infoEmoji`/`infoFirma` van a `qa.json → info` y NO restan. Son
  funciones puras: su prueba va en `pruebas/reglas-deck.test.mjs` u `oferta-propuesta.test.mjs`. `revisarDeck`
  recibe `crudo` (el deck antes de sustituir `datos`) para saber si un número vino de un `{{MARCADOR}}`.
- `scripts/lib/reglas-arco.mjs`: el mapa que vuelve (repetido seguido o vacío tras un bloque corto), la respuesta a una
  objeción que solo afirma, el «cómo» de un reel (`falta_para_final`: «el cómo a la vista»), el contrato de tiempo contra la
  voz (`"contrato": true` o detectado en el primer 25%) y `arcoDeck` → `qa.json → arco` (contrato, revelación y llamados en %;
  qa.mjs lo imprime con `lineaArco`). Pruebas en `pruebas/arco-r5.test.mjs`. `render.mjs --qa` corre QA al terminar.
- `scripts/lib/reglas-venta.mjs`: tasas sin origen, promesas sin descargo visible y el cierre de una clase (tarea +
  puente con su DATO: cuándo o cómo se entra; sin él, `por_confirmar.PUENTE`); reglas-deck.mjs las re-exporta y las suma
  en `revisarDeck`. `estadoQA` (reglas-deck) fija el orden del estado: con errores → borrador → bajo-90 → avisos-pendientes → falta-venta → listo.
- El fondo del `foco` copia en runtime (copiarExtrasAlClon) el sello y las anotaciones YA colocados de la lámina anterior:
  preparar() arma primero las láminas normales y después los focos.
- `scripts/lib/marca.mjs`: la ficha MI-MARCA.md (firma y palabras vetadas) con UNA cadena de búsqueda (carpeta del
  deck → arriba → `$PIZARRON_MARCA` → `~/.config/diapositivas-pizarron-ia/MI-MARCA.md`). `pipeline.mjs` aplica la
  firma a un deck sin `marca`; el logo solo se copia si la ficha está en la carpeta del deck. La ficha guarda también el
  puente de clases (`leerPuente`): `datosParaDeck` llena `{{COMUNIDAD}}`/`{{PROXIMA_CLASE}}` que falten (o pendientes sin
  valor) en el deck y el `crudo`. `setup.sh --solo-ficha --firma …` la escribe sin terminal (`fichaDesdeOpciones` rechaza un
  relleno); `mensajeSinFirma` distingue «la ficha no existe» de «no tiene Texto».
- `scripts/lib/datos.mjs` sustituye `{{CLAVE}}` con `datos` antes de sanear; lo que falta queda como
  `[CLAVE]`, que `marcar()` pinta como hueco y QA cuenta como pendiente.
- `scripts/lib/hoja.mjs` arma `hoja.jpg` y `hoja-pasos.jpg` con la misma numeración que los PNG y el QA; con más
  de 20 láminas las pagina (`hoja-01.jpg`…, `hojas.json`). `render.mjs --pdf` usa `scripts/lib/pdf.mjs`: recaptura
  cada lámina sin cursor (una página por lámina; el stack con su remate en una banda) y en propuesta o VSL arma
  `laminas-notas.pdf` con la voz como texto (`pdf.json` lo resume). `--pdf-pasos` recaptura un estado por página,
  sin cursor, y exporta `notas-por-paso.md` con `voz`, `accion` y `si_falla`. `--pasos` sigue siendo solo el mapa previo.
- `ejemplos/vsl-corto/` (venta), `ejemplos/propuesta/` (los 9 bloques), `ejemplos/clase-express/` (tutorial con
  `"clase": true`) y `ejemplos/reel/` (9:16, el cómo a la vista) son los modelos de guion que se copian; `pruebas/ejemplos.test.mjs` exige que no den avisos de guion,
  que la revelación del VSL caiga entre el 55 y el 60% y que ningún ejemplo use un emoji de «Evita».
- `scripts/lib/pasos-mapa.mjs`: qué entra en cada paso, leído del HTML armado (sin navegador). construir.mjs lo devuelve
  como `revela`; lo usan `render.mjs --pasos`, `pasos.json → revela`, `qa.json → mapa_pasos` y el error de voz de QA.
  Los `.emo` llevan `data-e` con su spec para que el mapa nombre los emojis dibujados en SVG.
- `templates/presentador.js` es el presentador en vivo y la vista de ensayo (`?modo=orador`), sobre
  `window.PZ`. Lee la voz del `<script class="guion">` que `construir.mjs` mete en cada lámina. Las dos
  ventanas se siguen por `postMessage` (ventana ↔ opener; BroadcastChannel no cruza documentos `file://` en
  Safari) y la `camara` con `vivo: true` lleva su bloque `.vivo-pres` con cuenta regresiva.
- `scripts/comparar.mjs` (+ `lib/tinta.mjs`) mide la réplica versionada (`pruebas/replica/deck.json`) contra
  los cuadros del video, que viven fuera del repo: ver PROTOCOLO §4b. Es la única evidencia de fidelidad de una
  ronda (`comp_N.jpg` con métrica y el sha256 del deck + `comparar.json` con `deck_sha`); un deck.json junto a los cuadros
  se ignora con aviso. Con un solo argumento (la carpeta de cuadros) compara `pruebas/replica`.
- `scripts/lib/medidas-dom.mjs`: medidas que QA hace dentro de Chromium (palabras por renglón, recortes, flex
  con texto y negrita, negritas que no se distinguen de su frase: `negritasPlanas`, 200 de peso en Figtree, 300 en Caveat; nodos del
  flujo vertical fuera del eje de su columna: `ejesFlujo`, 2% del ancho). Son autocontenidas: qa.mjs y las pruebas las inyectan con `inyectable()`.
- `scripts/medir-emojis.mjs` → `scripts/lib/contraste-emojis.json`: el contraste medido de cada emoji (dos
  sets, tres fondos) y `rojo` (% del glifo en el rojo de la tinta, también para los SVG de la skill: QA avisa un emoji
  rojo negado con `no:` o tachado). Córrelo al agregar emojis a EMOJIS.md. Sobre un fondo de COLOR (pieza del stack, cuadro,
  botón) QA rasteriza el glifo en cada corrida contra el color real (`scripts/lib/contraste-color.mjs`).
- `scripts/medir-tonos-fluent.mjs` → `scripts/lib/tonos-fluent.json`: Fluent 1.1.0 trae 🏼/🏽 cruzados en casi todas las
  personas y manos; `emoji.mjs → corregirTono` pide el archivo que de verdad tiene el tono (una secuencia sin medir se
  intercambia). Vuelve a correrlo si cambia la versión del CDN.
- `scripts/lib/emoji-diccionario.mjs` lee EMOJIS.md y da el concepto de cada emoji (`conceptoDe`): qa.json → iconos
  sale como «💬 (comentar una palabra)».
- `contrato.mjs → resolverComo`: `"como": "<id>"` (pasos, calendario, tabla, lista, meses) hereda los campos del objeto
  que vuelve antes de validar; construir.mjs lo corre primero y pipeline.mjs entrega el `crudo` ya resuelto. En un
  grupo de `pasos`, `marcarGrupos` pone `_grupo_texto`/`_grupo_nota`/`_grupo_hechos` para que el mapa no salte.
- La firma de texto sale a ~260 px (`construir.mjs → medidaFirma`, runtime `ajustarFirma` la topa en 280); su ancho
  llega a los diseños como `ctx.firmaAncho` (la tabla-marcador le deja sitio en su última columna vacía).
- `references/EMOJIS.md` es la única fuente de verdad de los emojis. `pruebas/emojis-coherencia.test.mjs` falla
  si un emoji queda en dos filas de concepto, si otro documento cita un emoji que no está en el diccionario o
  si un sustituto de `BAJO_CONTRASTE` cambia de concepto. Los grupos de `PARECIDOS` (emoji.mjs) van en su tabla.

- `layouts-interfaces.mjs` dibuja agenda, invitación y contraste; `burbujas.mjs` comparte la burbuja de chat entre muro, celular y foto/captura. Sus límites viven en `contrato-superficies.mjs` y sus campos en `contrato.mjs`.
- `reglas-marcas.mjs` contiene las reglas puras de óvalo, escala temporal e iconos; `medidas-trazos.mjs` las comprobaciones de geometría inyectadas en QA. `mano-html.mjs` estima la tinta del HTML en QA sin navegador.
- Credenciales: `leerCredenciales` lee MI-MARCA; `credibilidadConfirmada` comprueba cada cifra contra su marcador, fuente o ficha. La firma de relleno se omite y queda como FIRMA por confirmar.
- `reglasDeckCompleto` comparte la composición entre ambos QA; las aceptaciones de avisos requieren motivo y respetan el alcance de láminas. Los pendientes se acumulan en todos los pasos y se unen con los estructurales.
- Réplica vieja: `evidenciaReplica.laminas_dir` gobierna las rutas de PNG, pasos y hojas. `video.mjs` recaptura HTML; no consume esa carpeta. Pruebas de esta ronda: `motor-r7.test.mjs`, `qa-r7.test.mjs`, `ejemplos-render.test.mjs` (omiten Chromium solo cuando no arranca), `golpes-columnas-r7.test.mjs`, `conocimiento-datos-r7.test.mjs` e `inventario-conceptos-r7.test.mjs`.
- Golpes y capa roja: `reglas-arco.mjs → golpesDeck/reglasGolpes` (qa.json → `arco.golpes`) y `reglas-marcas.mjs → tiposRojos` cuentan desde el deck, también sin navegador; la nota gris y la tabla no son capa roja. `reglas-deck.mjs` suma dato anunciado como faltante, quién entrega, atribución de revista y la apertura de la propuesta. La ficha de reglas del cliente reutiliza `avisos_aceptados` (`contrato-superficies.mjs → REGLAS_NEGOCIABLES`).

### Ronda 11 · Geometría antes del PNG

- `scripts/lib/medidas-r11.mjs`: chat corto, centro de listas, ocupación y letra de filas,
  anotaciones, texto pequeño y origen de flechas. Corre en cada paso de QA y preflight;
  publica `geometria_r11` sin tocar el historial de capturas.
- `templates/runtime-filas.js`: amplía composiciones pequeñas antes de encajar y dibujar
  conexiones. `construir.mjs` lo inserta dentro del runtime.
- `runtime.js → fijarDescargos`: separa procedencias y descargos del contenedor escalable,
  conserva el paso efectivo de su captura y apila los pies en el margen seguro, a 36 px.
- `imagenes.mjs` identifica documentos SVG locales; `templates/runtime-documentos.js` mide su
  texto declarativo en XML inerte, extrae descargos y amplía el cuerpo a 44 px. QA vuelve a medir
  después del encaje; variantes no medibles y formatos sin OCR se distinguen explícitamente.
- Las listas de hasta cinco ítems se centran por omisión, incluso `x/no`. Las continuaciones
  superiores usan `anclar: "arriba"`. Las pruebas antiguas de ese anclaje lo declaran ahora
  explícitamente, conservando todas sus aserciones.
- `reglas-arco.mjs → reglasRevelacion`: VSL y VSL corto revelan al 55–60% del tiempo.
  Las propuestas conservan sus nueve bloques y el sustituto de primeros casos con garantía medible.
- Regresiones: `pruebas/r11-motor.test.mjs`, `r11-filas.test.mjs`, `r11-qa.test.mjs`, `r11-documentos.test.mjs`.
  Los fixtures usan directorios temporales del sistema y no dependen de decks de rondas externas.

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

Desde Codex/sandbox: consulta [PROTOCOLO, Desde Codex / sandbox](references/PROTOCOLO.md#desde-codex--sandbox); `--sin-navegador` no sustituye render, QA medidos ni revisión de la hoja.

### Ronda 8 · Primer render y evidencia
- `scripts/armar.mjs` es la entrada de producción: preflight, autocorrecciones acotadas con respaldo,
  relectura del archivo corregido y render+QA solo sin pendientes. No inventa datos ni excepciones.
- `lib/autocorregir.mjs`, `ciclo-calidad.mjs` y `evidencia-calidad.mjs` separan correcciones,
  cola con `tipo_arreglo`/paro e historial de la primera nota medida. `html_sha` ata QA a capturas.
- `CAMPOS_RAIZ` registra el contrato raíz; `reglas_cliente` se valida y sanea como alias exclusivo
  de `avisos_aceptados`. Los layouts no leen un campo nuevo.
- `datos.mjs` valida marcadores y deriva el glosario de usos; ambos QA lo publican.
- Protocolo y límites: `references/CALIDAD-PRIMER-RENDER.md`. Regresiones: `pruebas/calidad-r8.test.mjs`.
- Con Chromium bloqueado por el sandbox, `lanzarChromium` reintenta en un solo proceso (`ARGS_UN_PROCESO`) y así Codex renderiza, ve sus hojas y corre las pruebas de navegador; `PZ_SIN_UNICO=1` lo apaga. Si ni así arranca, la revisión visual pasa al orquestador.

### Ronda 7 · Estilo e íconos
- `emoji.mjs` valida `trazo:figura|RÓTULO` y `tinta.mjs` produce su geometría determinista; `reglas-deck.mjs` revisa reuso, identidad del producto, viñetas de plan y eyebrows.
- `layouts-texto.mjs` comparte la viñeta numérica y el reloj de segmentos con el tramo en vivo; `runtime.js → actualizarReloj` actualiza la misma geometría en presentador y captura. `pasos-mapa.mjs` cuenta también el óvalo diferido.
- QA distingue `trazos` de `contenedores`, vigila sello libre y firma, óvalos entre renglones y contraste del ícono apagado; `contraste-color.mjs` calcula `pctApagado` y `medir-emojis.mjs` lo guarda como `apagado`.
- Pruebas: `layouts-estilo-r7.test.mjs`, `reglas-iconos-r7.test.mjs`, `runtime-estilo-r7.test.mjs` y la integración de secuencias en `ejemplos.test.mjs`.

## Mantenimiento de la primera captura (ronda 9)

- `pruebas/primer-render-r9.test.mjs` protege el espacio de anotaciones, el flujo textual apilado, la ocupación y estabilidad vertical, los sellos dentro de Reels, la continuidad de `foco`, el bloqueo de pendientes y el código de salida del comparador.
- El chat vertical de hasta dos mensajes cortos usa 104 px y avatar automático de 135 px; tamaños explícitos conservan prioridad. No reduzcas tolerancias del QA para aprobar estos tamaños.
- `qa.json` incluye `primer_render` del mismo historial y `composicion_vertical` (ocupación y centro del bloque). La primera nota es inmutable; el resultado actual sigue en `nota` y `estado`.
- Los clones de `foco` deben conservar `lz-<tipo>` y `data-anclar` del origen. Cualquier CSS nuevo de diseño se prueba también en sus clones.

## Ronda 10 · Guion, encaje y límites de aprobación

- `lib/editorial.mjs` comparte validación y reglas de `bloques` y `ficha_oferta` entre ambos QA.
  Detecta tres bloques estructurales repetidos incluso permutados; `como` y `paga` no los exentan.
  Solo un bloque declarado permite exigir una demostración por bloque: la cobertura semántica
  y la novedad del aprendizaje siguen bajo revisión del autor.
- La oferta comercial incompleta queda como `FICHA_OFERTA` pendiente y bloquea producción.
  Una ficha de ejemplo completa se identifica como tal; jamás acredita clientes o resultados.
- `armar` mide el encaje con Chromium y fuentes reales antes de capturar; `preflight-geometria.json`
  no toca el historial del primer render. `qa.json → evaluaciones` separa geometría, integridad
  comercial, indicios editoriales y aprobación visual humana pendiente.
- Chat corto horizontal: 84/72 px según longitud; el vertical conserva 104 px. Las listas cortas
  reservan el bloque completo centrado. Desde ronda 11, `x/no` también se centra; una continuación
  superior de la referencia se declara explícitamente con `anclar: "arriba"`.
  Una cita vertical usa 112 px y glifo de 430 px: el tamaño horizontal no sirve en el lienzo alto.
- `comparar` conserva encuadre y añade bandas, espaciado, escala y silueta cromática. Un fallo
  de elementos sale con 1. Las secuencias sin referencia temporal no pasan por omisión.
- La ronda 10 conserva sus pruebas nuevas y sus tres guiones manuales fuera del repo por
  instrucción del encargo; el informe externo registra sus comandos y resultados. Las pruebas
  existentes conservan las exigencias y reconocen el nuevo borrador por ficha incompleta.
