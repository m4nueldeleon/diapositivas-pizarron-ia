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
5. Las correcciones de gusto del usuario van como regla de una línea en `REGLAS-DEL-AUTOR.md` (≤ 8 KB, lo que lee quien
   escribe un deck) y con fecha y el porqué en `LECCIONES.md` (el historial del motor). `r17-guardia` vigila el tamaño.
6. Si el cambio se ve en el demo, regenera la vitrina del README con `node scripts/vitrina.mjs` (galería 4×4 y GIF de
   cuadros reales de `PZ.mostrar`; requiere ffmpeg) y mira `docs/galeria.jpg` antes de publicar.

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
- Las regresiones editoriales de la ronda 10 están en `pruebas/editorial-r10.test.mjs`.
  Sus tres guiones manuales y el informe de ejecución viven fuera del repo. Las pruebas
  existentes conservan las exigencias y reconocen el nuevo borrador por ficha incompleta.

## Ronda 12 · Palabras enteras, evidencia y escala

- `medidas-dom.mjs → palabrasPartidas` reúne los fragmentos de una palabra, incluidos los de
  negrita, y mide todos sus rectángulos. `qa.mjs` y el preflight de `armar.mjs` rechazan una palabra
  repartida entre renglones. `runtime.js → ajustarPalabrasChat` ajusta la letra a la palabra más
  ancha de la burbuja; CSS no permite guionado ni cortes arbitrarios.
- `medidas-dom.mjs → alturaX/alturaPrincipal` mide la x con la fuente real y su escala efectiva.
  Runtime y `medidas-r11.mjs` comparten el criterio: la x de `anotaciones` alcanza al menos el
  75% de la principal. Una anotación con llave conserva una línea; no se aprueba por tener 50 px
  nominales. `saltosEscala` compara la jerarquía de láminas contiguas y publica los indicios en QA.
- `runtime-filas.js` conserva el tamaño de filas y la alineación de flujos mixtos; un nodo sin
  emoji tiene texto principal, con objetivo de 72–84 px efectivos a 1920. Las teclas de `pasos`
  se calibran como objetos protagonistas, no como viñetas diminutas.
- `reglas-deck.mjs → evidenciasDelDeck` publica `evidencias`: muestra, demostración, resultado,
  credencial e intención sin evidencia. `credibilidad: true` declara intención y jamás acredita
  por sí sola una plantilla vacía ni una cifra. Conservar `prueba` permite distinguir el origen.
- `editorial.mjs → raicesTexto` comparte familias como entrega/entregable/entregar con la regla de
  objeciones. `reglas-arco.mjs` busca el núcleo de la objeción en su respuesta; es un indicio, no
  una certificación semántica. `funcionRetorica` avisa cuatro funciones iguales consecutivas
  aunque cambie el diseño. Una anotación necesita novedad y consecuencia, precisión, contraste o veredicto.
- `secuencia-referencia.mjs` compara ráfagas externas de 8 cps con `mostrar(lámina, paso, t)`;
  `comparar.mjs --rafagas` publica `comparar.json → secuencia` separado del encuadre y los elementos.
  La cobertura es parcial: un instante presente no acredita su trayectoria ni los tramos fuera
  de la ráfaga. Los umbrales de elementos no cambian; los resultados se reportan en el informe de ejecución.
- Regresiones de esta ronda: `pruebas/r12-*.test.mjs`. Los fixtures viven en directorios temporales
  del sistema; no leen los decks externos del encargo. Ningún 100 automático equivale a firma profesional.

## Ronda 13 · Ocupación, manuscrita y chat coherente

- `templates/runtime-legibilidad.js` se inserta junto con `runtime-filas.js` en el marcador
  `FILAS` de `runtime.js`. Amplía listas cortas y contrastes antes de encajar; reserva todos
  los pasos, centra el bloque y separa la nota de llave de la columna estrecha.
- `layouts-texto.mjs` conserva tamaños y separaciones explícitos mediante atributos internos;
  no son campos nuevos del deck. `layouts-interfaces.mjs` elige cruz para la columna roja.
- `coherenciaChats` da 84% del ancho útil a cada burbuja vertical normal; con mensajes largos
  pone los avatares encima y armoniza la letra del deck a una diferencia máxima de 1.3×.
  Los muros, celulares y tarjetas de prompt conservan sus composiciones propias.
- `ajustarCaveat` amplía el contenido manuscrito por altura de x, incluyendo citas, notas y
  rótulos. La cita protagonista toma la referencia de Figtree principal de 84 px. En mapas,
  una nota que crece a dos renglones reduce el aire anterior al titular, no su letra.
- `ajustarConsigna` prioriza texto de 84 px sobre el reloj; `encajar` omite el lienzo oculto
  del tramo en vivo. `respetarMargen` y `colocarAnotaciones` reservan 6% arriba/abajo en 16:9.
  El encaje conserva el zoom de crecimiento anterior en vez de sustituirlo.
- `medidas-r11.mjs` incorpora medidas y avisos R13: letra/ocupación de lista, sentido de
  columna, ancho y escala del chat, x manuscrita, margen, consigna y origen de bifurcación.
  QA y preflight ejecutan la misma función; `saltosEscala` mide también chats separados.
- `pruebas/r13-geometria.test.mjs`: regresiones positivas y negativas con Chromium y fixtures
  temporales autónomos. El historial del primer render permanece aunque cambie el motor.

## Ronda 14 · La referencia manda, una regla por pieza

- `templates/runtime-legibilidad.js → CAVEAT_CON_PISO`: el piso de altura de x es solo de la capa roja (`.anotacion`,
  `.nota.roja`, rótulo de llave) y de la cita protagonista; la nota gris, la tabla-marcador y los rótulos de gráfica
  conservan su tamaño medido. `medidas-r11.mjs` usa el mismo criterio (la nota gris solo avisa bajo 48 px).
- `centrarNotasContraste` (antes y después de `encajar`): la nota de una llave de columnas se queda bajo su columna y
  se acota al lienzo. En `runtime.js` la llave horizontal acota su pico entre los brazos y marca sus trazos
  `data-clase="llave"` + `data-forma="horizontal"`; QA avisa llave plana o pico fuera.
- `colocarAnotaciones` solo acepta posiciones con renglones de 2+ palabras (≤ 3 renglones); QA da error por renglones
  mínimos o margen lateral (3%).
- `scripts/lib/conversacion.mjs`: `demostracionChat` (entrada → transformación → salida) y `revisarComponentes`
  (objeción compuesta, `POLITICA_<TEMA>` por confirmar). `reglas-arco.mjs → RANGO_REVELACION` es la única regla de
  revelación; `pruebas/r14-documentos.test.mjs` la compara con SKILL, ARCOS, GUION y LAYOUTS.
- `imagenes.mjs → capturaDocumento`: una captura SVG con texto de `prueba` se mide como documento.
- Pruebas: `r14-editorial`, `r14-geometria`, `r14-documentos`. Réplica 8/10 (fallan r95 y r255).
- `runtime-legibilidad.js → PISO_CHAT_VERTICAL` (64 px): el chat 9:16 no se encoge bajo el piso; `medidas-r11.mjs` avisa
  y pide partir la conversación. `runtime-filas.js → ampliarTarjetasVertical`: hasta 3 tarjetas en 9:16 al 84% del ancho,
  rótulo 84→64 px en ≤ 2 renglones; si no caben apiladas, `.tarjetas-fila` (emoji al lado).
- Juez r14 (Claude, 85.80): `colocarAnotaciones` hace sitio a la nota de una llave (corre el bloque, parte la nota en dos
  renglones balanceados, encoge hasta el piso de 64 px); el conector recto del flujo va CENTRADO en el hueco y QA mide su
  centrado (1.5:1), no su origen; `reglasCapaExpresiva` exige capa roja también en piezas de 6 a 11 láminas con `pieza`;
  `.sello-tinta` usa cifras alineadas; `infoConceptoIdea` informa (sin restar) el emoji de una `idea` fuera de su concepto
  o repetido con otra frase. `pruebas/r14-aprobados.test.mjs` re-renderiza `pruebas/fixtures/aprobados/*` y exige cero
  errores: un deck aprobado no puede empeorar en silencio.
- Juez r14, segundo bloque: `elipse` (runtime) dibuja el óvalo en línea como superóvalo (n = 3.5) que encierra las cuatro
  esquinas; `runtime-sello.js` monta el sello sobre un emoji en su esquina (≥ 50% visible) y `medidas-r11` mide cuánto lo
  tapa; `esLlamadoVisible` no cuenta imperativos de lista/pasos/tarjetas/flujo como llamado; `demostracionChat` acepta un
  chat con `guion: true`; `reglasEditoriales` avisa la doble negación con tachón.
- Juez r15: `reservarCarrilChat` respeta el `lado` del autor y solo reserva carril si la nota lateral no cabe (ancho del
  chat a la medida de la nota, 45-62%); `colocarAnotaciones` exige 16 px a burbujas ajenas y QA da error por debajo.
  `markup.mjs → pegarCortas` pega con espacio duro las palabras de 1-2 letras, la cifra y su unidad y la última palabra
  corta de la frase. La doble negación se revisa en la frase entera (cruza `\n`) y no cuenta un tachón sobre un término
  citado. `r14-aprobados` usa `esperado.json` por pieza (seis piezas).
- `tinta.mjs → anclasTinta`: sin glifo cromático (menos de 40 píxeles de color no rojos a 480×270) no hay silueta ni caja
  de emoji que comparar; si solo un cuadro lo trae, sigue siendo falla. r95 (la ✕ roja, excluida por diseño) pasa: su IoU
  0 era ruido de 4 contra 19 píxeles. Réplica 9/10: r255 usa 🎫 (boleto plano del cuadro) y sigue en revisión por la
  silueta del boleto, que en el video es una imagen propia, no un emoji.
- Juez r15, segundo bloque: `reglasIconosInversa` respeta el emoji que el deck declara en `conceptos`; `mismoConcepto` compara
  sin artículos y `reglasConceptosIconos` trata como familia dos conceptos de la misma fila del diccionario (📅 «fecha» y
  «agendar»). `demuestra` (reglas-deck) es la única función de evidencia: `camara` cuenta solo con `demuestra`, `texto`,
  `nota` o `vivo`, y un chat con `demostracionChat` (guion con variable, cifra, día o entregable). `revisarComponentes`
  revisa objeciones compuestas de cualquier tema (`generico: true` → aviso, no política por confirmar).
- Juez r15, tercer bloque: `references/ARRANQUE.md` es la entrada de dos páginas (SKILL §0 paso 1); si cambia un diseño,
  un campo mínimo o un aviso frecuente, actualiza su tabla. Dentro del celular (`.celular-pantalla`) no hay avatares y la
  letra va a 46 px. El sello deja 3% de margen lateral y la nota de llave 3.75%. El mapa que se presenta sin texto sigue
  reservando el alto de sus regresos: gana «nada se mueve de lugar» (LECCIONES, decisión r15).
- Juez r16: en 16:9 el chat sube por largo sin saltar a 54 px (`layouts-datos → chat`: 84/72/64, piso 60);
  `coherenciaChatsHorizontal` iguala la escala del deck (≤ 1.3×) y `ajustarBurbujas` ciñe cada burbuja a su renglón más
  largo (itera: el reparto «pretty» reacomoda). QA registra `chat_letras` también en 16:9 y avisa hueco interno > 12%.
  `pruebas/fixtures/aprobados/tutorial-recuperar` es el deck del juez r16.
- `runtime-filas.js → anclarMapas` (después de encajar): los mapas de íconos en 16:9 llevan el borde superior de sus
  íconos al 32% del alto; todas las apariciones de un mismo mapa (mismas etiquetas) usan el mismo desplazamiento.

- Juez r16, cierre: la guardia de aprobados (`r14-aprobados`, con `scripts/lib/guardia.mjs`) falla también con un aviso
  nuevo, con una medida de `geometria_r11` fuera de tolerancia (5 puntos en %, 10% o 4 px en px) o con un PNG cuyo dHash
  16×16 cambió más de 8 bits (solo en la plataforma donde se tomó). Si el cambio es intencional:
  `PZ_ACTUALIZAR_APROBADOS=1 node --test pruebas/r14-aprobados.test.mjs`, mira las láminas que cambiaron y revisa el diff
  de `esperado.json`. La lista de dos renglones topa su intervalo en 2.4× la letra (QA: mínimo 36% del alto útil) y la
  llave con una sola nota centra el conjunto; el celular asienta la conversación abajo (`.celular-entrada`);
  `runtime-legibilidad.js → pisoSecundario` sube la hora del chat a 48 px efectivos después del encaje.
- R17, fidelidad: la ráfaga e_sello entra en `secuencia-referencia.mjs → RAFAGAS` (réplica `r403`, `paso: -1` = el último, región
  roja `sello`) y `ref_403.jpg` vive con los demás cuadros fuera del repo. En seco el sello entra completo (runtime → `mostrar`:
  el golpe con temblor solo con `suave`). `layouts-datos → rejilla`: 400+ en 16:9 es `rejilla-masiva` (1.25 de aspecto, 900 px
  de alto, columnas a ~1210/cols, rótulo-frase a 62 px, nota a 100 px); `respetarMargen` y el margen de QA la exceptúan.
  La silueta de r403 (IoU ~0.6) sigue en «revisar», como r255: 500 celdas de ~12 px a 480×270 no alinean píxel a píxel.
- Juez r17 (Codex, 84.50 sobre 360ff59): en 9:16 la anotación con llave va HORIZONTAL bajo la lista (`colocarAnotaciones` →
  `data-llave-bajo`, `dibujar` → llave de columna) y el conjunto lista + llave + nota se centra al 47%; el contraste apilado
  usa letra común 84→64 y títulos de 96; el flujo apilado sube a 200/96 px (texto solo: 112, tramo de 240) y
  `ajustarFlujoVertical` topa sus etiquetas en 780 px (zona de Reels); `ajustarCifras` baja su piso a 72/64 en 9:16; el
  fondo del `foco` recibe `ampliarListas` (el clon lleva `data-tipo`). `pegarCortas` encadena palabras cortas seguidas
  (lookbehind). La procedencia se pide a todo chat que afirme un resultado o lleve sello de resultado (`avisosProcedencia`),
  el sello de chat evita `.procedencia` y prueba montarse arriba de la burbuja. Objeciones: una frase que solo valora el tema
  («es importante») no responde, y las partes genéricas se revisan aunque haya un tema conocido. `demuestra`: un anuncio
  («Vamos a ver una demostración») no cuenta; `[nombre]` no es dato. La guardia cuenta la tinta roja por PNG (`rojoPNG`).
