# Lecciones

Historial del motor: el porqué de cada regla, cómo se detectó y qué se midió. **Para escribir un deck basta
[REGLAS-DEL-AUTOR.md](REGLAS-DEL-AUTOR.md)**; este archivo es para quien modifica el motor o quiere la historia de una regla.

## 2026-09-25 · Una palabra cortada y una muestra vacía no pueden aprobar (ronda 12)

- **Palabras enteras:** el primer rectángulo de una palabra oculta sus fragmentos en otros
  renglones. Hay que medirlos todos, incluso a través de negritas, y bloquear el corte en
  preflight. La burbuja y su letra se ajustan al ancho real de la palabra más larga.
- **Evidencia:** `credibilidad: true` declara intención; nunca acredita una plantilla vacía.
  Muestra, demostración, resultado y credencial se reportan por separado. Para demostrar una
  plantilla, enseñar la entrada, cómo se completa y el resultado utilizable; un ejemplo
  ilustrativo terminado no pasa a caso real.
- **Objeciones:** objeción → condición que se conserva → respuesta literal → ejemplo. La
  facilidad de uso no resuelve falta de tiempo, y enseñar un flujo no responde automáticamente
  a una duda de pago. El indicio por raíz ayuda a detectar respuestas desviadas; el autor
  revisa la condición y la solución exactas. Nunca inventar frecuencias ni eficacia.
- **Aportación editorial:** entrega/entregable/entregar son la misma familia. «Define un
  entregable» junto a «Define una entrega» repite; la anotación agrega consecuencia, precisión,
  contraste o veredicto. Cuatro instrucciones seguidas conservan la monotonía aunque cambien
  sus diseños. Se corrige el aprendizaje, no la etiqueta de la escena.
- **Legibilidad real:** Caveat de 50 px puede parecer la mitad de Figtree. La x de una anotación
  alcanza al menos el 75% de la x principal, con la fuente cargada y su escala final. Una nota
  de llave no se fragmenta en renglones mínimos; se reserva espacio o se reescribe.
- **Diagramas protagonistas:** sin emoji, el nodo lleva texto principal de 72–84 px efectivos
  a 1920. Las teclas y la fila ocupan el lienzo según la referencia; un mapa pequeño junto a
  burbujas enormes exige revisar la escala entre láminas, además del encaje de cada una.
- **Fidelidad temporal:** comparar los estados de `mostrar(lámina, paso, t)` con las ráfagas,
  separado de encuadre y elementos. Presencia no equivale a trayectoria; donde la ráfaga
  termina o falta una pareja, la cobertura sigue parcial. No aflojar tolerancias para sumar
  pares ni convertir QA automático en firma profesional.
- **Tiempo observado:** `data-retraso` declara cuándo comienza el motor, no cuándo aparece
  movimiento visible. Comparar píxeles en ambos lados: un retraso de 1500 ms puede producir
  el primer avance observable a 1625 ms. La coincidencia del inicio no acredita velocidad,
  recorrido ni aparición del cursor; esos aspectos conservan resultados independientes.
- **Revisión literal:** un chat que habla de modificaciones y devoluciones necesita resolver
  ambas. Retomar una raíz puede aprobar el indicio automático dejando media pregunta sin
  respuesta. Si se corrige después del primer render, conservar ambas huellas y reconocer
  el retoque aunque las dos notas automáticas sean 100.
- **Origen de la corrección:** el juez encontró una palabra partida aprobada con 100, una
  plantilla contada como credibilidad, respuestas desviadas y notas demasiado pequeñas.
  Estas reglas registran los defectos y su criterio de verificación; los resultados medidos,
  hojas revisadas y pendientes de la ronda pertenecen a su informe, sin anticipar una aprobación.

## 2026-09-25 · Lo pequeño y lo descentrado deben fallar antes del PNG (ronda 11)

- Una burbuja vertical angosta convierte cinco palabras en cuatro renglones. Primero se reparte
  el ancho útil (82–86% para la burbuja), después se ajusta la letra. QA mide todos los pasos.
- «Sin», «Incluye» y «No incluye» son la misma familia. Hasta cinco renglones, centrar el bloque
  al 47% y reservar su altura completa. `anclar: "arriba"` es una decisión explícita de continuidad.
- Una fila corta crece hasta la ocupación de referencia antes de encogerse. Sus rótulos necesitan
  al menos 60 px efectivos a 1920, también después del zoom del contenedor.
- Nota roja: el piso nominal de 50 px se completa en ronda 12 con la altura de x; para una
  anotación de llave se conserva una línea. El descargo vive fuera
  de la pila escalable. Al moverlo conserva el paso de su captura y la zona segura de Reels.
- El texto dentro de un SVG también puede quedar ilegible. Medir su escala final, exigir 44 px
  al cuerpo y conservar intacto el archivo original. Un SVG complejo sin medición o un PNG sin
  OCR no se convierten en «legibles» por carecer de texto DOM.
- Una garantía sustituye un caso de primeros clientes solo con condición, plazo y remedio real;
  «no devolvemos» no es garantía. La identidad visible de quien entrega sigue siendo obligatoria.
- Acortar una flecha moviendo su origen la deja huérfana. El inicio permanece en el borde del objeto;
  QA comprueba el contorno antes de permitir la captura.
- El historial acredita la primera nota, nunca el último 100. La aprobación profesional y la fidelidad
  por elemento requieren evidencia aparte; los fallos del comparador siguen pendientes aunque el encuadre pase.

## 2026-09-25 · La nota automática no firma una presentación (ronda 10)

- **Regla:** resolver ficha de oferta antes del guion comercial; escribir bloques desde aprendizajes
  distintos, con demostración visible, sin permutar escenas para cubrir una cuota. Una anotación
  repetida con flecha no cuenta como golpe. Revisar la voz completa como texto publicable.
- **Porqué:** el juez encontró clases fabricadas por repetición y una venta sin condiciones resueltas
  pese a notas técnicas altas. Se añadieron comprobaciones compartidas y evaluaciones independientes.
- **Primer render:** medir fuentes y todos los pasos antes de capturar evita rehacer PNG por encaje.
  Los tres encargos nuevos lograron 100 automático inicial; la revisión visual todavía pidió agrandar
  una cita vertical. No se borra ese retoque ni se convierte en «perfecto desde el primer intento».
- **Fidelidad:** el encuadre global no detecta un médico diferente, teclas de otro acabado o anclas
  desplazadas. El comparador ahora los señala; la silueta cromática tiene límites con grises y grupos.
  Sin cotejar secuencias temporales y sin firma humana, sigue pendiente el 100 profesional.

Correcciones del usuario que ya se aplicaron. **Mandan sobre ESTILO.md y LAYOUTS.md.** Se escriben
en el momento en que el usuario corrige algo, con la regla, el porqué y la fecha.

## 2026-09-23 · Calibración inicial contra la referencia
- **Regla**: el texto va a 72-80 px en 1920 aunque la frase sea larga. Los emojis miden entre 170
  y 250 px y la firma unos 260 px de ancho.
- **Porqué**: en la primera versión todo salió 1.45 veces más chico que en la referencia. Las
  láminas se veían vacías y «de plantilla».
- **Cómo se detectó**: se replicaron 10 láminas del video y se compararon lado a lado, cuadro
  contra render.

## 2026-09-23 · Alineación tolerante
- **Regla**: el montaje empata guion y transcripción con una alineación global por similitud de
  letras, no por coincidencia exacta.
- **Porqué**: con una transcripción mala («Tivó y ha enseñado» en lugar de «Te voy a enseñar»)
  la búsqueda exacta ubicó 1 de 10 anclas. La alineación global ubicó 10 de 10.

## 2026-09-24 · Recalibración de escala e íconos (loop de calidad, ronda 1)
- **Regla**: la frase va a 84-90 px (76 si pasa de 15 palabras, 68 solo sobre 25) y el emoji se VE de
  200 a 250 px (caja de 230-290), hasta ~310 en el gancho. El rótulo gris es uno solo: 56 px.
- **Porqué**: medida contra c_0250 (renglón de 78 px de alto y ~1490 de ancho = Figtree 84) y ref_90 /
  ref_10 (🏆 de ~197 px, médico de ~314). A 72 px las láminas salían 15-27% más chicas que el video.
- **Cómo se detectó**: bandas de píxeles oscuros sobre los cuadros de referencia llevados a 1920.

## 2026-09-24 · El sello es una etiqueta opaca
- **Regla**: la máscara de grano va solo en la tinta; la etiqueta es blanca y opaca, centrada sobre lo
  que sella y ~100% de su ancho (ronda 2: en la ráfaga de 6:45 la tinta roja va de x 50 a 302 y la rejilla también; el 60% no salía de ninguna medida).
- **Porqué**: con la máscara sobre todo el elemento, el contenido se veía a través de las letras
  («VENTAS PERDIDAS» salía café o verde olivo). En 6:45 la etiqueta tapa las cajas.


## 2026-09-24 · La pieza manda el largo; la prueba es real o se ve como maqueta (loop, ronda 1)
- **Regla**: antes del guion se fija la pieza y su duración (ARCOS.md); una «clase» o un «webinar» no se
  comprimen a 4 minutos. La oferta sigue la referencia beat por beat (GUION §7): oscura solo la
  revelación. Un post escrito lleva `fuente` o `ejemplo: true`; la firma de ejemplo nunca se copia.
- **Porqué**: tres decks generados por agentes distintos salieron de 3-4 minutos, firmados «tumarca.com»,
  con un testimonio armado que se leía real y con la lista, el precio y la garantía en láminas oscuras.
  La skill lo enseñaba así: «guion corto», el demo con «Ana (ejemplo)» y la firma de relleno.
- **Cómo se detectó**: auditoría de mercadotecnia y usabilidad contra las hojas 14-18 y la transcripción.

## 2026-09-24 · Íconos con volumen y del set, emoji protagonista de su bloque (loop, ronda 3, estilo e íconos)
- **Regla**: se dibuja en SVG solo lo que en ESE set imprime texto, se confunde o se pierde. 📅 📆 🗓️ 🎟️ 🎫 van en
  SVG solo en Apple («JUL 17», «ADMIT ONE»); en Fluent salen sus 3D nativos, sin texto y distintos entre sí. 📱 📲 📄
  y ahora 💬 🗨️ (burbuja azul) se dibujan en los dos, y todo SVG de objeto lleva el volumen de su set: degradado,
  brillo arriba y sombra (`svg.vol`). Las siluetas 👤 👥 y las insignias ✅ ❌ siguen planas, como en la referencia.
  «Comenta [PALABRA]» es 💬; 📲 es «te llega al celular». El ícono ocupa ~40% de la pieza del stack y ~24% del lado
  menor de un cuadrante; la insignia +💰 mide ~48% del glifo; `piel` da tono a las personas; la fuente de un estudio
  va en `fuente` (sans gris 40 px), no en `nota`.
- **Porqué**: el 📅 plano era el héroe del llamado en un deck Fluent 3D, la flecha del 📲 salía cortada por el
  viewBox, el 🎓 medía 19% de su pieza y se fundía con el marino, los cuadrantes quedaban rosa casi blanco donde cae
  el texto, las citas salían en tres estilos y las personas amarillas cuando el video usa 🏻.
- **Cómo se detectó**: auditorías de diseño, íconos y fidelidad (r3) con muestreo de píxeles contra ref_10, ref_628,
  ref_1760 y 42:40; la réplica pasa de 8/10 a 9/10 pares (r1760 cuadrado; r628 a ≤ 4 RGB del rojo y verde).

## 2026-09-24 · Íconos sin texto impreso y letra que se lee en el celular (loop, ronda 2)
- **Regla**: 📅 📆 🗓️ se dibujan como un calendario SIN fecha, 🎟️ 🎫 como un boleto liso y 📲 como el
  celular con flecha, igual en Apple y Fluent (también dentro del texto). 🏪 y 🪪 imprimen texto: QA avisa.
  El texto secundario que se lee (sub de nodo, dato y % de pastilla, post) va a ≥ 48 px en 1920; solo los
  rótulos decorativos (DÍA, fuente, firma) quedan a ~28-30, como en el video.
- **Porqué**: el diccionario recomendaba 📅 para «fecha» y en Mac (el modo por omisión) imprimía «JUL 17»
  en un VSL sobre la fecha real del evento, y 🎟️ decía «ADMIT ONE» a tamaño protagonista. A 360 px de
  ancho, «2 minutos / 30 minutos» (44 px) salía a ~8 px y QA daba 100.
- **Cómo se detectó**: hojas de emojis en los dos sets (t3/t4) y montaje de 8 láminas a 360 px.

## 2026-09-24 · Calibrado contra el video, no a ojo (loop, ronda 2)
- **Regla**: el calendario pinta la fase activa en pastel con borde y número casi negro (la barra sí
  saturada); el mapa y el flujo usan columnas iguales; el stack va a sangre con tarjetas de producto a
  color; los descartes tachados van centrados con plumón grueso; la frase de `foco` va a ~88 px.
- **Porqué**: medido en ref_1760, ref_1040, h18 42:30-42:45, m_256 y 15:20: nuestras versiones usaban el
  degradado de la barra en las celdas, huecos fijos que dejaban los pasos chuecos, casillas grises con
  texto negro, la lista a la izquierda y la frase de foco 1.5 veces más chica.

## 2026-09-24 · La nota no castiga el hueco honesto; el foco centrado y con su tinta (loop, ronda 4)
- **Regla**: los huecos declarados, los datos propuestos y las capturas por conseguir no restan nota (solo la topan
  en 90 con `estado: "borrador"`); nunca se quita un beat de venta para subir la nota. El fondo de `foco` es el
  estado final de la lámina anterior (con sus tachones) y la frase va centrada: solo se mueve a un hueco a ≤ 120 px.
- **Porqué**: el modelo vsl-corto sacaba 67 y el VSL de la ronda 4 llegó a 90 quitando el caso y su fuente; en
  sin-mostrar-cara el foco dejaba los 3 errores sin tachar y se leían como la recomendación, con la frase pegada
  abajo como pie de foto. En el video [15:20-15:23, h_pill] la frase cruza el fondo atenuado al centro.
- **Cómo se detectó**: auditorías de mercadotecnia, técnica y diseño (r4), reproducidas en la carpeta temporal de la ronda.

## 2026-09-24 · La oferta en su orden y la promesa al principio (loop, ronda 4, conocimiento)
- **Regla**: en un `vsl` o `vsl-corto`, nada de «aplica» antes de decir qué se vende: objeción y respuesta →
  revelación (en el corto, al 55-60%) → qué incluye → prueba → precio y garantía → llamado con qué pasa después →
  resumen → el MISMO llamado al final. Una sola acción por pieza (botón o palabra clave, no las dos). Y en los
  primeros 25 s, después del gancho, la promesa con su «sin…» y el nombre del mecanismo; el problema va después.
- **Porqué**: el modelo pedía aplicar al 60% y revelaba al 69%, mezclaba «CITA por WhatsApp» con «Aplica aquí» y
  dejaba 40 s de puro dolor antes de decir qué gana el que mira. En la referencia la revelación es 36:16, el primer
  botón 43:36 (los dos llamados son «aplicar») y la promesa llega de 0:08 a 0:19.
- **Cómo se detectó**: midiendo los tiempos de cada lámina del ejemplo y del VSL de la ronda contra transcript.txt.
  QA no lo veía porque contaba un botón como inicio de la oferta.

## 2026-09-24 · Objeciones propuestas, sin frecuencia; prueba de mercado con fuente (loop, ronda 4, conocimiento)
- **Regla**: una objeción que el usuario no dio va como `OBJECION_N` propuesta y se dice «Objeción número uno: …», nunca
  «la que más oigo». Sin prueba propia, un dato publicado del mercado (buscado, con medio y fecha) respalda la
  oportunidad, no el resultado del producto.
- **Porqué**: los loops escribían «la objeción de siempre» (un consenso que nadie midió) y usaban una tasa inventada como
  «prueba lógica». La referencia respalda la oportunidad con prensa real [11:25-12:00].

## 2026-09-24 · Contraste por peso, la misma imagen al volver y huecos que no se confunden (loop, ronda 5, estilo e íconos)
- **Regla**: en Caveat (400-700) la **negrita** solo se distingue desde 400: la frase de `foco` o `cita` con `**` va a 400;
  una cifra de una línea con `**` baja su base a 500. El mapa que vuelve con `como` reserva el alto del texto más largo del
  grupo y la ✅ cuelga fuera del flujo: los íconos no se mueven. El dato pendiente ([PRECIO]) es un contorno punteado del
  color de su renglón; la variable de plantilla del chat ([nombre]) es letra amarilla sin caja [c_1315]; el amarillo de
  caja ya no existe. La firma mide ~260 px y cabe en la columna vacía de la tabla [c_0545]. Las flechas que convergen
  llegan a UNA punta junto al texto de la pregunta, y el converger «a la Iman» es una lámina aparte con la columna
  aislada [7:30]. El remate del stack es un título (✓ verde sin caja, 800 a ~140 px) [42:50]. La flecha recta mide
  ~250 px con punta grande [c_1045]. Un `no:X` nunca niega un paso del mapa después de mostrarlo.
- **Porqué**: «menos de 5» (600 → 700) se leía igual que el resto; el mapa subía 58 px al aparecer la ✅; un {g:ancla}
  pendiente salía negro y en negrita sobre amarillo, igual que la plantilla; la firma de 342 px cruzaba la línea de la
  tabla; tres puntas apiladas a 100 px de una pregunta de 45 px; el ábaco tachado se leía «no calcules».
- **Cómo se detectó**: auditorías de diseño, fidelidad, íconos, mercadotecnia, técnica y usabilidad (r5) con cortes
  contra hoja_04, hoja_07, hoja_17, c_0545, c_1045, c_1315 y 42:50; verificadas con un render aparte de cada arreglo.

## 2026-09-24 · El mapa no va y viene, la respuesta demuestra y el reel enseña el cómo (loop, ronda 5, conocimiento)
- **Regla**: el mapa 1-2-3 entra una vez con `activo: 1` y vuelve con el titular de su bloque en `texto`; un regreso vacío
  va solo tras un bloque de 3 láminas y 20 s o más (en el video vuelve cada 5-6 min [17:19 → 23:08 → 28:01]). La
  respuesta a una objeción DEMUESTRA con otro diseño (`flujo`, `chat`, `linea-tiempo`, `cuadrantes`, `prueba`) y la
  `idea` de frase va después, como remate [34:30-36:05]. Un reel que promete un «cómo» enseña el prompt literal a la vista
  y la condición legal en pantalla; «Guarda» solo si hay algo que guardar. Un dato publicado de terceros es prueba de
  MERCADO: respalda la oportunidad, no el resultado, y la lámina nombra lo que se midió. El contrato de tiempo se
  cumple: la clase express del ejemplo prometía 10 min y duraba ~3:24; ahora promete 4. «Sesión en vivo» es 📞, archivar
  es 🗄️ (🗑️ dice «a la basura») y lo urgente, 🚨. La pieza no se cambia en silencio: «30 láminas no son un webinar».
- **Porqué**: el webinar de r5 hacía mapa → cita → mapa → reto → mapa en 25 s; dos objeciones con respuesta en `idea` daban
  4 `idea` seguidas y la segunda solo afirmaba; el reel «3 tareas que puedes delegar» salía `listo` sin un solo prompt;
  un estudio de MOOCs contaba como «prueba real» de una comunidad que retiene; la firma nunca se creaba desde Claude Code
  porque setup.sh exigía terminal.
- **Cómo se detectó**: auditorías de diseño, fidelidad, mercadotecnia, íconos y usabilidad de la ronda 5 sobre
  webinar-comunidad, reel-ia-ceo y precios-premium, con hoja_07 [16:35-17:25] y 34:25-36:05 de la referencia.

## 2026-09-24 · La rejilla que sigue un ejemplo no es un dato publicado (loop, ronda 5, integración)
- **Qué cambió**: el aviso «¿dato publicado?» de la rejilla (reglasFuente) calla si su propia voz lo dice como ejemplo
  («Imagina…», «Pongamos…») o si una de las 3 láminas anteriores lo planteó como ejemplo con el mismo total.
- **Porqué**: al re-renderizar precios-premium con el motor de r5, «Se pueden ir 5 de 30» (lám 9) pedía fuente aunque
  sale del «Pongamos: treinta clientes» de la lámina 7; un falso positivo que bajaba la nota sin tope de 97 a 94.
- **Cómo se detectó**: comparación ANTES | DESPUÉS de los 3 decks de la ronda (integrador r5).

## 2026-09-24 · Lo que el ojo reprueba se vuelve una medida (cierre del ciclo de mejora, iniciado el 2026-09-23)
- **Regla**: cada defecto de alineación que encuentra la revisión visual se convierte en una medición geométrica de QA con
  su prueba (centros de nodos contra el eje de su columna, con tolerancia en % del lienzo). El flujo vertical (9:16) va
  con cada nodo, su ícono y su etiqueta centrados en el eje, y las flechas rectas; `ejesFlujo` avisa a más de 2%.
- **Porqué**: en `ejemplos/reel` 03-minuta, «La minuta» y 📝 quedaban 9% a la izquierda (la pila iba en `flex-start`) y la
  segunda flecha salía torcida, y QA daba 100/100. Una nota que premia lo que el ojo reprueba entrena al loop a no mirar.
- **Cómo se detectó**: el juez de la ronda 5 sobre la hoja del reel. Con el motor viejo la regla nueva da 97 y señala la
  lámina 3; con el arreglo, 100 (prueba en `pruebas/ejes-flujo.test.mjs`).

## 2026-09-24 · La vitrina del repo es parte del motor (cierre del ciclo de mejora)
- **Regla**: al cerrar una ronda que cambia el estilo se regeneran `docs/galeria.jpg` (16 láminas finales del demo, 4×4,
  640×360, fondo #e4e4e4, separación 14 px) y `docs/animacion.gif` (5 láminas con `dur` 1.6, 12 fps, 720 px, paleta
  optimizada), sin láminas que parezcan maqueta (un `hueco` o la `camara` gris). El número de diseños que dicen README,
  SKILL y LAYOUTS lo vigila una prueba contra `LAYOUTS` (hoy 29: 27 de lámina más `foco` y `camara`).
- **Porqué**: tras cinco rondas la galería seguía siendo la del primer commit: el estilo de antes y la firma
  «tumarca.com», que la skill ya marca como error de QA. README y SKILL decían 27 diseños cuando la ronda 5 ya había
  sumado `llamada` y `meses`. Quien llega al repo juzga por la vitrina.

## 2026-09-24 · Los tonos de Fluent se miden, no se confían (loop, ronda 4, estilo e íconos)
- **Regla**: Fluent Emoji 3D 1.1.0 trae 🏼 y 🏽 cruzados en casi todas las personas y manos; `corregirTono` pide el archivo
  que de verdad tiene el tono según `tonos-fluent.json` (medido con `scripts/medir-tonos-fluent.mjs`). Una secuencia sin
  medir se intercambia y sale como aproximada. Si cambia la versión del CDN, se vuelve a medir.
- **Porqué**: con `piel: "🏼"` las personas salían con el tono de al lado, y nadie lo notaba sin muestrear el color.

## 2026-09-24 · Una propuesta tiene su arco, no el de un VSL (loop, ronda 3, conocimiento)
- **Regla**: una `propuesta` sigue los 9 bloques de ARCOS.md: diagnóstico con los números del cliente, costo de no hacer
  nada, solución, quién la imparte y su prueba, metas medibles, alcance (qué incluye y qué NO), inversión anclada al
  costo, garantía o condición de salida, y siguiente paso con fecha y vigencia. Los números del cliente van como huecos
  declarados, nunca «pongamos que…», y se manda con `laminas-notas.pdf` (la voz como texto). La escasez sin dato es
  error; la garantía y los bonos se preguntan, no se proponen.
- **Porqué**: las propuestas de las primeras rondas copiaban el orden de un VSL, no decían qué quedaba fuera ni hasta
  cuándo valía el precio, y llegaban a la junta sin la voz para quien no estuvo.


## 2026-09-24 · Motor, ronda 6 (lo aprendido de una conferencia real en sala)

- **Regla**: presentar desde Keynote o Slides exige un paso por página (`--pdf-pasos`, recapturado sin cursor);
  `laminas.pdf` es solo documento. En vivo no implica sala: `sala` se declara aparte (35 % de apagado y pisos de
  letra de sala solo con ella; el video conserva su 20 %).
- **Regla**: QA mide lo que antes dependía de la memoria del autor: cuentas de `cifra`, cifras que se contradicen,
  pantalla que se adelanta a la voz o fuente que llega tarde, persona tú/ustedes, color decorativo, mayúsculas
  en frase, emoji con signo contrario, logos de herramientas y el QR que se pide sin existir.
- **Porqué**: en una conferencia real hecha con esta skill, los tamaños, la persona gramatical, la sincronía
  pantalla-voz y los QR sumaron la mayoría de los hallazgos y fueron lo último en cerrarse. Toda heurística nueva
  es aviso y omite lo ambiguo: un falso error enseña a ignorar el QA.

## 2026-09-24 · Legibilidad, imágenes y tinta (ronda 6)

- **Procedencia del criterio:** una presentación presencial permitió comprobar el piso nominal de nota a mano de 72 px, pie de 44 px y apagado de 0.35. Se generaliza sin conservar nombres, datos ni material del evento. Sala es explícita: una clase por Internet conserva el perfil de video.
- **Regla:** el calendario se divide después de dos semanas y la fila de meses después de seis celdas. El foco respeta el apagado de sala y QA mide opacidad efectiva.
- **Tinta:** medir la línea base de cada nodo mantiene el subrayado debajo de g/p/q/y; el arco sube levemente y tiene un tope que evita invadir letras o huecos.
- **Imágenes:** una fotografía opaca necesita foto a sangre con velo; la sombra de objeto solo se aplica al recorte. Los ejemplos visuales se rotulan y nunca acreditan resultados.
- **Íconos:** los conceptos de tienda, identificación y factura deben tener un glifo inequívoco; la oscura resuelve glifos hundidos con halo sin medir el halo como parte del emoji.

## 2026-09-24 · Estilo e íconos: recetas de una conferencia real (ronda 7)

- **Regla:** el sello libre remata cerca y centrado bajo el bloque, con margen y firma protegidos; la ✅ afirma inclusión o algo hecho, mientras planes y pendientes llevan números o su emoji literal. El tramo en vivo conserva tres niveles: reloj de segmentos, consigna e ítems espaciados. Los prompts seguidos comparten tarjeta sin borde. Los íconos pendientes mantienen su color y un piso de 35 %, separado de la etiqueta. Un término propio puede volver como figura negra con rótulo estable; el óvalo encierra hasta cuatro palabras sin invadir otro renglón. Cada sección se abre con el mapa que vuelve, sin eyebrow. Los modelos enseñan la transformación por pasos con sello, tachón, círculo y llave, conservando los datos pendientes y el arco. Se generalizan los aprendizajes sin incorporar nombres, cifras ni materiales del evento.

## 2026-09-24 · El modelo plano produce decks planos
- **Regla**: los modelos alternan golpes fuertes (sello confirmado, tachón, llave, anotación con flecha, óvalo, objeto y escala), no solo listas e ideas. Un golpe cada 4-6 láminas y ~3-4 en el momento clave, un énfasis por lámina.
- **Porqué**: quien copia un modelo copia su ritmo; cambiar el texto de una sucesión de listas conserva la monotonía. La nota gris no sustituye una marca roja.
- **Verificación**: QA cuenta golpes y capa roja desde el deck, también sin navegador; los datos todavía sin confirmar permanecen como huecos, sin sello de garantía.
## 2026-09-24 · La primera nota necesita evidencia de la captura

Una nota de texto o de un QA posterior no es la nota del primer render. Guarda la primera
medición asociada a sus huellas de deck y HTML; si no existe, reporta que falta. Antes de
renderizar, corrige avisos conocidos y detén el armado ante datos pendientes. La autocorrección
de una fuente no puede borrar el beat que antes ocupaba: conserva pasos y voz o deja el caso al autor.

## 2026-09-25 · Primera captura y composición vertical (ronda 9)
- **Regla**: una anotación automática evita también emojis e imágenes; busca blanco en el eje de su lado antes de aceptar un choque. Los flujos exclusivamente textuales de hasta tres nodos se apilan si sus etiquetas no caben enteras en fila.
- **Porqué**: una clase larga repetía el mismo choque de anotación y los flujos partían etiquetas de dos palabras. Corregir cada lámina ocultaba la causa del motor.
- **Regla**: en 9:16 las ideas, listas y chats cortos crecen por defecto, con centro óptico cercano al 47%. No cambies indiscriminadamente los tamaños de tablas y mapas. El fondo de `foco` hereda diseño y anclaje; no salta al clonar.
- **Porqué**: una lista ocupaba solo 26% del alto y quedaba arriba. Aumentar globalmente la letra produjo una invasión de Reels y reducir el alto útil encogió una tabla; ambas se detectaron con la suite existente.
- **Regla**: la primera nota sale de `qa.json → primer_render.nota`, aunque la última sea mayor. Los datos sin confirmar bloquean el render de producción; `--borrador` conserva la condición de borrador. No quites oferta, prueba o puente para subir una nota.
- **Regla**: el comparador falla también por distancia geométrica fuera del umbral, no solo por referencias ausentes u otra escena. La medición de encuadre acompaña la mirada; no certifica identidad de tipografía, ícono o trazo.
- **Cómo se comprobó**: decks nuevos antes y después, capturas dentro de Codex, hojas finales y de pasos abiertas, pruebas de regresión vistas fallar antes del arreglo y réplica medida contra sus cuadros.

- **Cierre adicional de la ronda 9**: una lista de 20 palabras con tres viñetas numeradas suma 23 visibles. El preflight ahora cuenta las listas simples con el mismo criterio; la explicación se conserva en voz y el texto se comprime. Esto se encontró después del primer render de una clase: su primera nota no se reemplaza por la corregida.

## 2026-09-25 · El 100 no detectaba letra pequeña con mucho blanco (ronda 13)

- **Regla:** una lista de hasta cinco renglones cortos crece antes de encajar. En horizontal,
  objetivo de 72–84 px, piso QA de 64 y bloque de al menos 45% del alto útil. El contraste
  comparte la regla, incluido su encabezado; la llave larga ocupa el ancho del conjunto.
- **Regla:** la burbuja vertical normal ocupa 82–86% del ancho útil. El avatar puede subir
  encima de un mensaje largo; no se roba ese ancho al texto. La escala entre chats del mismo
  deck no varía más de 1.3×. Medir el contenedor del chat no basta.
- **Regla:** Caveat se mide por altura de x, no por tamaño nominal: 75% de la principal;
  la cita protagonista alcanza la principal. El reloj cede espacio a la consigna de 84 px.
- **Regla:** el borde superior/inferior del contenido de 16:9 conserva al menos 6%. La nota
  puede usar más ancho antes de empujar las burbujas. No se suma margen a costa de encoger
  otra vez toda la composición. Una columna roja no recibe una marca verde por omisión.
- **Evidencia:** el cuadro de lista tachada ocupa 48.3% del alto; sus márgenes de tinta son
  26.4% arriba y 25.3% abajo. En diez cuadros de réplica el menor margen superior es 6.02%.
  La firma de la esquina queda fuera de esta medición de tinta.
- **Límite:** rehacer el render después de cambiar el motor también es un retoque. Un primer
  100 no acredita «sin retoques» si el HTML final cambió. Una oferta de ejemplo puede enseñar
  muestra y demostración; no permite inventar credenciales ni resultados para callar QA.

## 2026-09-25 · La referencia manda sobre una regla de legibilidad (ronda 14)

- **Error del orquestador:** la ronda 13 pidió «TODA letra Caveat con contenido ≥ 75% de la x principal». La nota gris
  secundaria creció a dos renglones y la réplica cayó de 8/10 a 6/10 elementos (r10, r115). Acotar el piso a la capa roja
  y a la cita protagonista devolvió el 8/10 sin tocar tolerancias.
- **Regla:** antes de subir un piso de tamaño o de margen, corre `comparar.mjs` con la réplica. Si un cuadro del video
  contradice la regla, gana el cuadro y la regla se acota a lo que el cuadro no cubre.
- **Regla:** una sola regla de revelación por pieza. `vsl-corto` 55–60%; `vsl` largo 75–82% (la referencia revela en
  36:16 de 44:55). La ronda 11 las había unificado en 55–60% y GUION seguía diciendo «~20-25% final»: el juez lo detectó.
  `pruebas/r14-documentos.test.mjs` compara ahora los documentos contra `RANGO_REVELACION`.
- **Regla:** una burbuja carga una idea (tope 4 renglones en 9:16, 3 en 16:9); una objeción compuesta se responde
  componente por componente; una demostración muestra entrada, transformación y salida utilizable.
- **Límite:** r95 (✕ delgada, 1.5% más abajo) y r255 (silueta de la fila de tachones) siguen fallando por elemento.
  Mover el relleno de la lista anclada movió el bloque de forma no lineal: hay otra regla que la reacomoda. Queda como
  pendiente medido, no como ajuste a ojo.
- **Evidencia (reel escrito a mano por el orquestador en la ronda 14):** el primer render dio QA 100 con el texto del chat
  a ~36 px en cuatro láminas. El bucle de encaje del chat vertical no tenía piso y la escala común arrastró a los demás
  chats. Se corrigió con un piso de 64 px y un aviso que pide partir la conversación; el mismo reel reveló tarjetas de
  46 px en 9:16 (ahora crecen al 84% del ancho y pasan a tarjeta-renglón si no caben). Un 100 automático no sustituye
  mirar la hoja: esa revisión es la que encontró los dos defectos.
- **Regresión silenciosa (juez r14):** la propuesta de la ronda 11 bajó de 100 a 49 cuando las listas crecieron sin
  reservar la nota de su llave. Ninguna prueba re-renderizaba decks aprobados. Ahora `pruebas/fixtures/aprobados/` los
  guarda y `r14-aprobados` exige cero errores. Cada pieza que el juez apruebe entra ahí.
- **Una regla de QA puede torcer el estilo:** la ronda 11 ancló la flecha del flujo al origen para calmar la regla de flecha
  huérfana y la sacó del centro del hueco, que es como la dibuja el video. Una regla nueva se prueba contra la réplica y el
  demo, no solo contra el caso que la motivó.
- **Chromium:** asignar `textWrap` después de `whiteSpace` borra el `nowrap` (comparten `text-wrap-mode`). Primero
  `textWrap`, luego `whiteSpace`.


## 2026-09-25 · Mi propio arreglo rompió una clase aprobada (juez r15)

- **Error del orquestador:** el carril del chat 16:9 forzaba el lado de TODA nota a «derecha». Las tres notas «abajo» de la
  clase de 60 láminas dejaron de caber y la clase bajó de 97 a 70 con las 573 pruebas en verde.
- **Regla:** el `lado` que escribe el autor se respeta. El motor solo cambia la composición cuando lo pedido no cabe, y lo
  mide antes (ancho natural de la nota contra el sitio junto a su burbuja).
- **Regla:** la guardia de regresión cubre ahora seis piezas reales con su nota esperada (`pruebas/fixtures/aprobados/*/
  esperado.json`); falla si aparece un error o la nota baja más de 3 puntos. Se corre en cada ronda.
- **Tipografía:** no se deja una palabra de 1-2 letras ni la última palabra corta de una frase sola en su renglón, ni un
  número separado de su unidad (`markup.mjs → pegarCortas`, espacio duro). Las pruebas que comparan cadenas normalizan
  U+00A0: el texto visible es el mismo.
- **Decisión (juez r15, pendiente 8):** el mapa de íconos que se presenta sin texto y luego vuelve con texto o nota reserva
  ese alto y se ve cargado arriba. Centrarlo haría saltar los íconos entre la primera aparición y sus regresos, y el
  principio del estilo es que en el revelado por acumulación nada se mueve de lugar (ESTILO; prueba r5 «mapa sin salto»).
  Gana la continuidad. Si el mapa no vuelve con texto, no hay reserva y sale centrado, como en ref_1040.
  **Actualización (juez r16):** la continuidad era correcta pero la altura no: en el video los íconos arrancan cerca del
  32% del alto en CADA aparición. `runtime-filas.js → anclarMapas` traslada todas las apariciones del mismo mapa (se
  reconocen por sus etiquetas) con un mismo desplazamiento, el que cabe en el miembro más limitado.



## 2026-09-25 · La guardia ve lo que el ojo ve (juez r16)

- **Regla:** una pieza aprobada guarda sus avisos, su geometría por lámina y un hash perceptual de cada PNG. Un cambio
  del motor que la mueve sin bajar la nota hace fallar la guardia; si el cambio es intencional se miran las láminas y se
  actualiza la foto con `PZ_ACTUALIZAR_APROBADOS=1`.
- **Porqué:** la guardia de la ronda 15 solo miraba errores y nota; el juez señaló que ningún cambio geométrico o visual que
  conservara la nota la hacía fallar. Comprobado: bajar la letra de las listas de 84 a 78 px hace fallar 6 de las 7 piezas.
- **Regla:** con dos renglones, el hueco entre ellos no pasa de 2.4 veces la letra: a 440 px «Responsable» y «Fecha» ya no
  se leían como lista. La lista con llave y nota se centra como conjunto.
- **Regla:** en el celular la conversación va abajo, sobre la barra de escribir, como en un teléfono: tres mensajes arriba
  dejaban el 45 % de la pantalla en blanco.
- **Regla:** el motor, no el autor, garantiza los 48 px de la hora del chat; el aviso pedía un arreglo que el autor no podía
  hacer. Un aviso sin arreglo accionable enseña a ignorar el QA.
- **Entrada:** las reglas para escribir un deck se separaron en REGLAS-DEL-AUTOR.md (≤ 8 KB); LECCIONES pesaba 34 KB y se
  leía completa antes de cada deck.

## 2026-09-25 · El sello no golpea y 500 cajas abruman (ronda 17, fidelidad)

- **Regla:** en seco el sello entra completo en el corte y se queda quieto; el golpe con temblor es de `suave`.
- **Porqué:** ESTILO decía «cae con golpe y un temblor» sin medida. La ráfaga e_sello [6:44.8 → 6:44.9] lo muestra entero de
  un cuadro al siguiente y con la misma caja y los mismos píxeles después. Nuestro golpe (1.9× → 1× en 150 ms + 180 ms de
  temblor) se habría visto un 28% más grande en el primer cuadro de 8 cps.
- **Regla:** la rejilla crece con la cantidad. 500 cajas van en 25 × 20 y usan casi todo el alto [hoja_03 6:40]; con 1.55 de
  aspecto y 720 px de tope salían en 28 × 18 a ~34 px, y el sello, que mide el ancho de la rejilla, quedaba chico.
- **Cómo se detectó:** al sumar r403 y su ráfaga a `comparar.mjs --rafagas`. El encuadre pasó de fallar (y +7.4, h −15.6) a
  pasar (x −2.3, y +1.1, w +1.3, h −1.5); la silueta de 500 celdas diminutas queda en «revisar» y el umbral no se aflojó.

## 2026-09-25 · El 9:16 no es un 16:9 angosto (juez r17)

- **Regla:** en el lienzo alto, lo que en 16:9 va al lado va debajo. La nota de una llave a la derecha salía 440 px fuera
  del lienzo; ahora la llave es horizontal bajo la lista y la nota va centrada debajo.
- **Regla:** los tamaños de 16:9 no sirven apilados. El contraste iba a 48 px, el flujo a 76 junto a listas de 144 y la
  cuenta de una línea se partía con el piso de 96. En 9:16 cada diseño tiene su escala, medida contra sus vecinos.
- **Porqué:** el juez de Codex escribió un reel 9:16 a mano y su primer render dio QA 34 con cuatro errores; con estos
  arreglos, el mismo deck da 94 sin errores. El demo es 16:9: ninguna prueba ejercitaba el reel completo.
- **Regla:** una regla nueva se prueba contra las piezas aprobadas antes de publicarla. Encoger las listas 9:16 a un renglón
  empeoró el reel aprobado (el verbo arriba y la frase en negrita abajo era un diseño bueno): se revirtió.
- **Regla:** QA no premia nombrar el tema. «El precio es importante» no responde «¿cuánto cuesta?», «Vamos a ver una
  demostración» no demuestra y un sello VENDIDO es un resultado aunque lo diga «yo».

## 2026-09-25 · Mencionar no es responder, anunciar no es demostrar (juez r18)

- **Regla:** cada parte de una objeción pide su tipo de respuesta: un valor para el precio, una duración o un día para el
  plazo y lo que trae para «qué incluye». «El precio merece atención» o «¿Qué precio te gustaría?» no lo dan.
- **Regla:** «Enseguida veremos una demostración» y «Hola [nombre], revisamos tu pedido el lunes» no demuestran nada; un guion
  demuestra con una variable de plantilla ([día], [monto]), un enlace o un mensaje específico de 10+ palabras.
- **Porqué:** el juez escribió variantes nuevas de los mismos casos y pasaban: la regla anterior buscaba palabras, no la
  respuesta. Cada arreglo se prueba contra las variantes del juez Y contra los decks aprobados (la regla estricta de modales
  rompió «La A. Puedes continuar», una decisión legítima, y se corrigió antes de publicar).
- **Regla:** una guardia que suma toda la tinta roja no ve perder un subrayado junto a un emoji rojo grande: se mide por celdas.

## 2026-09-25 · Medir cada ráfaga, sin fingir el cuadro (ronda 19, fidelidad)

- **Regla:** la ✕ sobre un arco tachado se ve desde lejos: ~90 px y plumón grueso. La nuestra medía la mitad y se perdía.
- **Regla:** cuando el cuadro del video usa fotos propias (la alcancía con billetes), la réplica mide su SECUENCIA (qué
  entra en el corte, qué se queda quieto) y no se empareja con el cuadro fijo: la silueta mediría la foto, no el motor.
- **Evidencia:** las 12 ráfagas medidas; todas coinciden en aparición (la nota nueva, el sello, el arco tachado y la pastilla
  entran completos en el corte) y la réplica queda estable en todas; encuadre 17/17 y elementos 10/17.
- **Pendiente medido:** en la presentación del calendario [28:58] las notas viven en los márgenes y el calendario llena el
  alto; el nuestro se encoge para hacerles sitio (h −7.4%). La réplica coloca las notas con `arriba` a la altura de su día.
- **Regla:** cada réplica nueva es una oportunidad de calibrar. La gráfica del video llena el lienzo (la nuestra salía ~10%
  más chica en cada eje) y en el mapa con manos la mano manda sobre la tecla. Un ajuste que acierta en un eje y rompe otro
  (zoom a la pastilla del reparto: +8.5% de ancho y la flecha del demo a 43 px) se revierte.

- **Evidencia:** 7 de 12 ráfagas medidas, las 7 coinciden en aparición y estabilidad; encuadre 12/12 y elementos 10/12.

## 2026-09-25 · Una regla que cuenta palabras no mide ancho (juez r19, 88.95 sobre 058d029)

- **Regla:** en `colocarAnotaciones` (`templates/runtime.js`), la llave de una lista SIN columnas en 16:9 solo probaba
  el lado derecho (correr el bloque, partir la nota en dos renglones, encoger el zoom); si con ítems de largo normal
  (~9 palabras) nada de eso bastaba, el código hacía `puestas.push(...); return;` sin red y la nota salía del lienzo:
  `armar.mjs` truena con 4 errores («la nota de la llave se sale del lienzo», «invade el margen horizontal a -291 px»).
  La rama vertical (9:16) sí tenía una ruta completa (`llaveBajo`); la horizontal, no.
- **Porqué:** un juez que escribe su propio deck 16:9 (no un ejemplo ya calibrado) topó con esto en el primer intento y
  tuvo que acortar los ítems a la fuerza para poder seguir. Es el mismo patrón que la lección de ronda 17 («el 9:16 no
  es un 16:9 angosto»), pero en sentido inverso: aquí faltaba portar el repliegue de 9:16 A 16:9.
- **Arreglo:** `llaveAbajo()` se extrajo como función compartida entre las dos ramas; si el corrimiento y el piso de
  64 px de la rama horizontal no cierran (`exceso>0`), cae al mismo repliegue de 9:16 (llave bajo la lista, nota
  centrada debajo), y si el conjunto sigue sin caber, encoge la ZOOM de la lista (no la nota) en pasos de .06 hasta el
  mismo piso de 64 px que ya usa el resto del motor. Verificado con el caso exacto del juez (2 ítems, `armar.mjs` pasa
  de 4 errores a 0 errores/0 avisos, QA 100/100) y con la suite completa (616 pruebas, guardia de 9 aprobados sin
  cambios).
- **Regla:** `demostracionChat` (`scripts/lib/conversacion.mjs`) tenía una lista negra de 4 frases EXACTAS para anuncios
  de demo («vamos a mostrar», «te enseñaré»...). «Enseguida te muestro cómo queda armado todo el proceso completo»
  colaba como demostración porque ninguna frase de la lista coincidía Y «queda» está en la lista de palabras que la
  regla trata como «concreto». Se sumaron las formas conjugadas reales del verbo mostrar/enseñar en presente («te
  muestro/enseño cómo/que», «aquí te muestro») a la misma lista negra — no una raíz gramatical, porque «muestro» no
  comparte raíz ortográfica con «mostrar» (el diptongo o→ue la rompe).
- **Regla:** la tabla `FAMILIAS` (misma función, para `revisarComponentes`) exigía la raíz literal del componente de la
  objeción. «No tengo tiempo ni equipo ni experiencia» respondido con «todo corre desde tu celular» seguía marcando
  «equipo» como sin resolver porque el texto dice «celular», no «equip-». Se sumó una familia de sinónimos
  (equipo/celular/computadora/laptop/teléfono/dispositivo): el patrón ya existía para otros componentes (tarda↔plazo,
  incluye↔trae) pero «equipo» no tenía la suya.
- **Regla:** `layouts-texto.mjs` arma una lista 9:16 de ≤2 ítems de ≤6 palabras a 144 px SIN comprobar el ancho de la
  columna: «Un solo lugar para pagar» (5 palabras, 25 caracteres) partía en 4 renglones de una palabra («Un solo /
  lugar / para / pagar») en la columna angosta. El heurístico de PALABRAS no mide caracteres/ancho real, y esa medida
  solo se puede hacer en el navegador (el build no tiene DOM). `ampliarListas` (`runtime-legibilidad.js`) ahora, para
  toda lista vertical sin contraste, baja la letra de 4 en 4 hasta el piso de 64 px si algún ítem pasa de 2 renglones —
  el mismo patrón que ya usaban el contraste horizontal y el contraste vertical apilado, aplicado aquí a la lista
  simple. Medir renglones de un `.item-texto` exige un `Range` sobre su nodo de texto, no `getClientRects()` del
  elemento: al ser hijo directo de `.item` (`display:flex`), el spec lo «blockifica» y su propia caja sale como UNA
  sola aunque el texto envuelva varios renglones.
- **Límite (abierto):** la réplica de r255 (tachones/boleto) y r403 (sello) mejoraron pero siguen en «revisar» (IoU
  0.500 y 0.598); la cobertura temporal quedó en 7/12 ráfagas sin comparar la trayectoria real del cursor; y
  `revisarComponentes` sigue con un falso positivo cuando la respuesta usa una paráfrasis que no está en `FAMILIAS`
  (p. ej. «sin experiencia previa» no resuelve un componente de «experiencia» a menos que la palabra clave calzada por
  `clave()` coincida). Estos tres quedan documentados y sin tocar: requieren trabajo de calibración visual contra los
  cuadros del video (fuera del repo) o extender `FAMILIAS` caso por caso, que no se puede generalizar sin arriesgar
  nuevos falsos negativos.

## 2026-09-25 · Un parche sobre el caso exacto no es la corrección de raíz (juez r20, 88.80 sobre 15116d4)

- **Regla:** un juez independiente probó los tres "arreglos" semánticos de r19 con paráfrasis NUEVAS (no las mismas
  frases) y los tres seguían fallando. La lección: cuando el pendiente es «una lista fija coló X», sumar X a la lista
  cierra el caso reportado pero no el defecto — hay que preguntar qué PATRÓN describe X, no qué FRASE.
- **Regla:** `demostracionChat` (`conversacion.mjs`) tenía una lista negra de frases EXACTAS para el anuncio de una
  demo («te muestro cómo queda», sumada en r19). «Mira cómo queda armado…», «aquí puedes ver cómo se resuelve…» y
  «checa cómo queda…» — ninguna coincide con la lista, las tres colaban. El patrón real no es el verbo (mostrar,
  enseñar, mirar, checar, ver todos sirven igual de anuncio) sino la construcción «cómo/qué + verbo de estado»
  (queda, resuelve, funciona, se ve) sin ningún dato propio detrás. Se reemplazó la lista de frases por esa
  construcción general, con una salvedad: si la frase SÍ trae un dato (cifra, día o palabra de entregable como
  «archivo», «enlace», «cotización»), no descalifica — «mira cómo queda: 12 páginas listas» demuestra igual que
  «aquí está el reporte: quedó listo el jueves».
- **Regla:** `revisarComponentes` (misma función) resolvía un componente con `String.includes()`: la respuesta
  «videollamadas» resolvía el componente «llamada» porque la cadena «llama» aparece DENTRO de «videollamadas», sin
  que sea la misma palabra ni un sinónimo real de la familia `FAMILIAS`. Cambiar `.includes(r)` por una prueba con
  límite de palabra (`\b` + la raíz) basta: ahora exige que la raíz empiece una palabra, no que aparezca a media
  palabra por accidente ortográfico.
- **Regla:** `reglasRespuestaObjecion` (`reglas-arco.mjs`) derivaba una «pregunta de objeción» de CUALQUIER mensaje
  de un chat con «?» que viniera de `otro`, sin filtrar si el contenido era realmente una objeción. Una pregunta de
  agenda («¿la llamada es en mi hora o en la tuya?») —dos partes unidas por «o», como cualquier objeción compuesta—
  se marcaba con el mismo aviso que «no tengo tiempo ni dinero». El filtro que faltaba: la pregunta debe traer una
  duda/negación real (no, nunca, dudo, preocupa, miedo, inseguro, difícil, caro…) o tocar un tema ya conocido
  (`TEMAS`); una pregunta neutra de logística no entra a `revisarComponentes`.
- **Porqué:** el patrón se repite en LECCIONES.md al menos tres veces ya (r17, r18, r19): una regla de texto que
  compara contra una lista fija de frases o una raíz literal siempre se evade con la primera paráfrasis que no está
  en la lista. La corrección sostenible es describir la FORMA del problema (construcción gramatical, límite de
  palabra, vocabulario de dominio), no enumerar sus instancias conocidas.
- **Límite (abierto):** el juez también reportó `r1738` (ráfaga `i_calendario`) como el peor IoU medido (0.203) tras
  ampliar la cobertura de 7 a 12 ráfagas. Se investigó la hipótesis del juez (un desfase de 1-2 cuadros en el
  `corte`) y NO es la causa: las dos anotaciones del cuadro de referencia («I like this person's content», «I need
  to buy this product») YA estaban en `pruebas/replica/deck.json` (`dia: 1` y `dia: 14`, con su `lado`/`arriba`/
  `paso`) desde una ronda anterior. La comparación visual (`comp_4.jpg`) muestra que el contenido es correcto pero
  la geometría no calza con precisión (offsets de la caja y de las flechas de anotación) — es un problema de
  calibración fina de posición, no de temporización ni de contenido faltante. Corregirlo exige iterar
  render→captura→comparación visual contra el cuadro real (fuera del repo) varias veces, como ya documentaron rondas
  anteriores para r255/r403; no se adivinó un valor de `arriba`/`lado` sin esa verificación. `demostracionChat` y
  `revisarComponentes` siguen usando reglas semánticas basadas en vocabulario/regex, no en comprensión real: un
  humano sigue debiendo leer cada componente/demostración marcado, estas reglas solo bajan cuánto hay que revisar.
