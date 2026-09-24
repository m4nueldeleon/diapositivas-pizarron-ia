# Lecciones

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
- **Cómo se detectó**: auditorías de mercadotecnia, técnica y diseño (r4), reproducidas en /private/tmp/pz-loop/r4.

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
  contra hoja_04, hoja_07, hoja_17, c_0545, c_1045, c_1315 y 42:50; verificadas en /private/tmp/pz-loop/r6/verif.

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
