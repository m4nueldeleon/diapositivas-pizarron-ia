# El estilo «pizarrón» — biblia visual

Este estilo es el de las láminas que usa Iman Gadzhi en sus videos largos de YouTube. Lo
estudiamos cuadro por cuadro en un video de 45 minutos. Parecen dibujadas a mano en un
pizarrón blanco, pero cada decisión está medida. Aquí está lo que hace cada pieza, con números
medidos del video y la razón de que funcione.

> Regla madre: **cada lámina dice una sola idea, en el momento exacto en que se dice, con el
> menor número de elementos que la vuelva obvia.** Todo lo demás se desprende de ahí.

---

## 1. El lienzo

| Medida | Valor medido | Qué significa |
|---|---|---|
| Fondo | `#FFFFFF` puro, sin textura ni degradado | El pizarrón. Nada compite con la idea. |
| Tiempo en pantalla | 75% lámina blanca, 12% cámara, 13% pantalla o foto | La lámina es la protagonista y la cámara aparece de visita. |
| Cambio visual | uno cada **2.5 s**; mediana 2.9 s; la mitad central entre 1.8 y 4.1 s | Nunca da tiempo a desconectarse. |
| Ocupación | el contenido rara vez pasa del 40% del área | Mucho aire. Un solo punto focal. |
| Firma | marca de la empresa abajo a la derecha, ~260 px de ancho en 1920 (Figtree 600; el «.com» o el sufijo a .55 em): el motor saca la letra del largo del texto y la topa en 280 px | Ancla constante: siempre sabes de quién es el video. En la tabla-marcador cabe en la columna vacía sin tocar una línea [c_0545]. |

**Por qué funciona:** el fondo blanco más un solo elemento es el equivalente visual de
«mírame a mí». El principio de coherencia de Mayer dice que se aprende más cuando se quita
todo lo que no es la idea, y la lámina lo aplica al extremo.

## 2. Tipografía: dos voces

El encabezado arranca la frase que completan los ítems y termina en «:», «…», «...» o «?». Excepciones: `encabezado_pos: "entre"` con #N/Paso N, listas mapa (`activo`, `hechos`, `como`, `oscura`) y `encabezado_estilo: "frase"`. Nunca metadatos (semana, módulo, fecha, N personas, « · »), nombre de sección ni estados («por confirmar», «pendiente», «ficticio», «ejemplo»). La procedencia va en `fuente` o nota, nunca en un `procedencia` que idea/chat ignoran. Usa «No incluye:». QA avisa los metadatos, la puntuación ausente y más de 25% de encabezados no exentos.


| Voz | Letra | Uso |
|---|---|---|
| **La voz del profesor** (sans) | Geométrica humanista: Figtree, la alternativa libre más cercana | La frase de la lámina, en regular, con la frase clave en **negrita**. |
| **La mano del profesor** (manuscrita) | Marcador delgado inclinado: Caveat, casi idéntica | Notas al margen, tablas, anotaciones y llaves. |

| Rol | Video 16:9 | Sala 16:9 |
|---|---|---|
| Frase | 68–90 px según longitud | Piso 72 px |
| Nota a mano | 60–64 px | 88 px; piso medido 72 px |
| Fuente / pie | 40 / 36 px | 44 px |
| Etiqueta apagada | 20 % [ref_1040] | 35 % |
| Ícono apagado identificable | Piso 35 %, conserva el color | Piso 35 %, conserva el color |

- Tamaños medidos en un lienzo de 1920×1080:
  - Frase normal: **84 a 90 px** (la frase de 14 palabras de c_0250 da un renglón de 78 px de
    alto y ~1490 de ancho = Figtree 84). Frases de 16 a 25 palabras: 76 px. Solo por encima de
    25 palabras baja a 68, nunca menos.
  - Rótulo gris chico, como «Sin:», «Ellos harán:», «Paso 1» o «Objeción #2»: **56 px**, uno solo
    en todo el estilo (`--t-rotulo`).
  - Nota manuscrita: 60 a 64 px. La **frase de foco** (la lámina `foco`, que escribe a mano sobre la
    anterior atenuada) no es una nota al margen: es la protagonista y va a ~88 px y hasta ~1560 px de
    ancho [15:20].
  - **Texto que se tiene que leer: ≥ 48 px** en 1920 (≈ 9 px en un celular de 360) y nunca por debajo
    de 36. Aplica al texto secundario: el sub de un nodo (52), el dato y el % de una pastilla (50 y
    52), el post escrito (50). El calendario conserva rótulos de 32 px. Se exceptúa la
    firma, que en el original va a ~28-30 px [ref_1760]. La `fuente` de un dato o un estudio sí
    se lee: sans gris a 40 px (36 en 9:16 y en la captura), y QA avisa bajo 36. QA avisa bajo 48 en el
    texto secundario y da error bajo 28 en cualquier texto.
  - Cifra protagonista: 120 a 140 px.
- Casi nunca hay título. La lámina ES la frase.
- **Jerarquía entrada → remate** [18:30, 17:15]: «That's what I call a» en regular y, en su propio
  renglón, «Monetisation Gameplan.» en negrita a ~1.5× con subrayado rojo. Se escribe `^^remate^^`.
- **Rótulo entre emoji y frase** [34:25, 35:15]: emoji → «Reason #1» gris chico → la frase en
  negrita (`encabezado_pos: "entre"`).
- **La voz del otro va en cursiva** [17:25]: la objeción que piensa el cliente, «"Iman, I don't
  know any creators."», en Figtree cursiva bajo un 🤔 chico (`*texto*`).
- **Contraste por peso, no por color**: el texto va siempre casi negro (`#111`). Lo importante
  se marca con negrita, nunca pintándolo de color.
- Mayúsculas solo en UNA palabra para gritar: «NO IDEA», «ALREADY», «YOU».
- Los términos acuñados van **entre comillas y con subrayado rojo**: «Market Gap», «Growth
  Marketer». Así nace el vocabulario del método. Solo si es un término propio sin emoji literal, se permite `trazo:figura|RÓTULO`: figura negra a plumón y rótulo, estable entre apariciones. Máximo 1–2 por deck, siempre vuelve igual (EMOJIS.md).

**Por qué funciona:** la sans habla y la manuscrita comenta. El cerebro distingue en menos de un
segundo qué es el mensaje y qué es la acotación. Es como un maestro que escribe la idea y luego
garabatea al lado.

## 3. Color: semántico, nunca decorativo

Todo el color vive en la **capa a mano** y en los datos. El texto principal es negro.

| Color | Hex medido | Significa |
|---|---|---|
| Rojo marcador | `#C8101E` | Énfasis y señalar: subrayados, flechas, círculos, ✕ y sellos. También lo malo. |
| Verde | `#22A812` | Bueno, sí, dinero que entra, el camino ideal. |
| Naranja | `#D0661A` | Intermedio, «ni bien ni mal». |
| Gris | `#8A8A8A` | Neutro, indefinido, encabezados y notas secundarias. |
| Amarillo resaltador | `#F9D932` | Una frase que hay que leer SÍ o SÍ. |
| Azul | `#3EA6F2` | Interfaz: burbujas de chat y «tú» dentro de una pantalla. |

La tabla-marcador es un semáforo: verde, naranja y rojo. Se evalúa sin leer.

**Sobre lámina oscura** el rojo #C8101E se hunde (3.4:1) y la referencia nunca subraya en rojo sobre
negro [36:40]: el subrayado, la flecha y el círculo van en **blanco**, la negación (tachón, ✕) en
rojo claro **#FF4D57**, y la cifra o el precio en **dorado #F2B33D** (`{o:$25,000}`). El sello
conserva #C8101E porque lleva su propia etiqueta blanca.

## 4. Emojis: el ícono ES el concepto

El emoji no decora: **nombra**. Estilo 3D brillante de Apple. En máquinas sin Mac se usa Fluent
3D de Microsoft, con licencia MIT y aspecto equivalente.

- **Uno por lámina**, arriba de la frase, grande: se VE de 200 a 250 px (el 🏆 de ref_90 mide ~197
  visibles) y hasta ~310 en el gancho (el médico de ref_10). La caja mide ~15% más: el glifo 3D
  llena ~85% (`medio` 230, `grande` 290, `heroe` 360).
- **Par antes/después** [10:55]: dos emojis en fila, el negado atenuado: `["no:📚", "si:🤖"]`.
- **Fila de conceptos numerados sin flechas** [19:10-19:15]: 📦 💵 📈, cada uno en su paso
  (`flujo` con `flecha: "ninguna"`).
- **Literal y universal**:
  - 💰 dinero, 🤝 alianza, 🤔 pregunta, 🏆 lo mejor (diccionario completo y único en EMOJIS.md).
  - ⏳ tiempo, 🔍 encontrar, 🚀 lanzar, 🤖 IA, 📦 producto.
  - ✅ sí, ❌ no.
- **Emoji compuesto**: dos emojis cuentan una historia completa. Es la firma del estilo. La ✕ de
  «no:» mide ~55% del emoji y le CRUZA el cuarto inferior izquierdo [ref_628, 12:15].
  - 🧑‍⚕️ con 💰 encima: «gana como médico».
  - 🎥 con ❌: «sin hacer contenido».
  - 🙅‍♂️ con ❌: «sin mostrar tu cara» (ref_628).
  - 💸 con ✅: «$0 de capital».
- **Emoji como viñeta**: ❌ para lo que NO necesitas. ✅ solo en «Incluye», «Es para ti si», «Te llevas», «Sales con / Hoy hiciste» y el mapa `hechos`. Temarios, agendas, actividades, módulos, evaluación y pasos usan `vineta: "numero"` o un emoji por ítem; objetivos: 🎯. Una lista con `{{HUECO}}` nunca lleva ✅. Tamaño del texto.
- **Emoji como cantidad**: 500 cajas 📦 hacen visible «tendrías que vender 500». 99 puntos
  verdes y uno rojo dicen «99%». Una multitud de 👤 con uno encendido dice «tú».
- **Teclas numéricas 1️⃣ 2️⃣ 3️⃣** unidas por una ruta punteada son el «sistema de 3 pasos», con
  la frase ~240 px debajo [ref_115]. La ruta solo existe con las teclas; el mapa con íconos
  (🔍 🛠️ 🚀) no lleva ruta [16:40, 28:00]. La imagen vuelve en cada sección con el paso activo
  encendido; las etiquetas pendientes van al 20 % en video [ref_1040], 35 % en sala, y los íconos tienen piso propio de 35 %, sin gris ni contraste artificial y la ✅ bajo los completados **a todo color**: es la señal de
  avance. Funciona como mapa del video. En el deck, el objeto que vuelve se declara una vez y se reúsa con
  `como` (LAYOUTS.md): la imagen es la misma porque ES la misma.

Diccionario completo en [EMOJIS.md](EMOJIS.md).

**Por qué funciona:** el emoji se reconoce antes que la palabra, en menos de 200 ms. Además
todos lo leen igual en cualquier idioma. Es codificación dual (Paivio): la idea entra por la
imagen y por la palabra al mismo tiempo.

## 5. La capa a mano: el profesor en el pizarrón

Meta en el momento clave: ~1 golpe fuerte cada 3-4 láminas; sigue valiendo máximo un énfasis por lámina. En el arco completo se pide uno cada 4-6 (GUION §5). La capa ROJA —subrayado, flecha, anotación, sello, círculo/óvalo/encerrado, tachón, llave, ✕— es distinta de una nota gris o tabla. Referencia aproximada: ~1 de cada 2 láminas con marca roja; en decks de 12+ QA avisa menos de tres tipos o cuatro láminas seguidas sin rojo, sin contar `camara`.

| Momento de una propuesta | Marca que pide |
|---|---|
| Problema | Llave con nota |
| Costo | Anotación con flecha |
| Inversión | Óvalo |
| No incluye | Tachado o ✕ |
| Garantía confirmada | Sello; no sellar un hueco |
| Participantes | Multitud o rejilla |

El óvalo `((…))` cuenta como el único énfasis: no se combina con subrayado ni resaltador.
Receta de credibilidad: cifra encerrada + nota colgada del óvalo.
`idea` con `"texto": "Desde ^^(({{ANOS}}))^^"` y `"anotaciones": [{"a":"ovalo","texto":"Trayectoria confirmada","lado":"derecha"}]`.
El dato lo aporta la ficha o queda pendiente; se copia el mecanismo de [una conferencia en vivo], nunca su cifra.


Es lo que hace que se vea «hecho a mano pero pulido». Son trazos de marcador sobre un diseño
limpio:

| Trazo | Cómo se ve | Cuándo |
|---|---|---|
| **Subrayado rojo** | Línea delgada y un poco ondulada bajo la frase clave en negrita | La frase que es la tesis de la lámina. |
| **Flecha roja recta** | Plumón con punta abierta en V | Proceso A → B: identificar → aliarte. |
| **Flecha negra curva** | Gruesa (≈10 px), en arco, con punta abierta en V del mismo grosor que el trazo | Bifurcación o salto: 1 alianza → $2,000 / $50,000. Nace por fuera de cada extremo de la frase y baja en diagonal hacia fuera [c_0635]. |
| **Arco con ✕** | Arco negro con una ✕ roja al centro | «Esto NO lleva a aquello»: tus ahorros ✕→ apostarlos. |
| **Flecha gris fina** | Curva delgada de 120-160 px que sale del borde y baja en gancho con la punta SOBRE la nota | Señalar una nota: «Son 500» [6:45]. |
| **Llave roja** | Une dos cosas con una nota manuscrita abajo | Comparar dos valores: «Mismo trabajo». |
| **Círculo o caja roja** | Óvalo o rectángulo redondeado alrededor de un dato | La cifra, el año de credibilidad, el precio, la palabra clave o un dato de una captura. |
| **Tachón rojo** | Línea sobre texto o ítem | Descartar opciones, como tachar Dropshipping o Trading. |
| **Ruta punteada gris** | Curva sinuosa entre pasos | Un camino o un proceso en etapas. |
| **Sello de goma** | Etiqueta blanca opaca con doble borde rojo, girada −5°, letra slab con grano leve, centrada sobre lo que sella y ~100% de su ancho (en [6:45] mide 1210 px sobre una rejilla de 1210, con letras de ~100 px); no tapa notas ni flechas | El remate: «MUCHA HABILIDAD» sobre una rejilla [6:45]. Puede tapar parte de la rejilla: la cifra ya se dijo antes. |

Reglas:

- El sello libre se centra bajo lo que sella, sin invadir el margen de 100 px ni la firma (140 px inferiores con firma). Primero prueba el centro limpio; después debajo y sobre el bloque. No tapa el último renglón.
- Máximo **un énfasis** por lámina: subrayado, resaltador o círculo. Dos es el tope.
- El trazo tiene **textura de plumón**, un leve temblor y extremos redondos. Nunca líneas
  vectoriales perfectas.
- Las notas manuscritas van en gris. Solo son rojas cuando señalan.


| Qué dice el guion | Qué trazo |
|---|---|
| Contradicción o descarte | Tachón después de leer la opción |
| Conclusión o veredicto | Sello sobre la composición apagada |
| Agrupar y comentar | Llave con nota |
| Cifra clave, credencial, año, precio o ítem elegido | Círculo `((…))`, hasta 4 palabras |
| Escala | Rejilla o multitud con sello |
| Pausa | Descanso de una sola palabra |

El trazo sigue a la frase: un énfasis por lámina, ninguno de remate en el paso 0. Cada modelo incluye una secuencia de 3–4 pasos que transforma la misma composición. QA distingue trazos de énfasis de contenedores como nota o tabla; avisa sin restar si un deck de 12 láminas usa menos de dos tipos, o deja precio, garantía o «no incluye» sin trazo.

## 6. Imágenes

1. **Objetos reales recortados** sobre blanco, con una sombra suave de piso: una alcancía, una
   tragamonedas, un cronómetro o un billete. Se quita el fondo con rembg. Nunca un rectángulo
   de foto.
2. **Capturas de prueba**: una tarjeta blanca con esquinas de 22 px y sombra grande y suave. El
   dato clave va encerrado en rojo y los nombres o cuentas van tachados con marcador. Pueden
   ir apiladas y ligeramente giradas.
3. **Maquetas de interfaz dibujadas** (no capturas):
   - burbujas de chat azules y grises;
   - una pastilla verde «5k audiencia | $30,000»;
   - botones con cursor;
   - calendarios de fases;
   - tarjetas de métricas gris suave;
   - tarjeta de prompt blanca con sombra suave, sin borde; prompts seguidos dentro de una sola tarjeta que crece por renglón. Respuesta verde clara sin borde; remitente a la izquierda.
4. **Fotos o video de ambiente** solo para emoción: un laberinto para «perdido» o un escenario
   para «comunidad». Pocas.
5. **Láminas oscuras**: fondo negro con brillo violeta (o azul arriba, o negro plano: `fondo`).
   Son **solo para REVELAR la marca o el producto** [36:15, 37:40, 37:50, 43:00]:
   - el nombre y el logo, y una frase;
   - sus **pilares** como lista blanca con emoji (2 a 5) [37:40 «⚙️ Software / 🤝 Service»], que
     VUELVE con uno encendido y los demás al 25% al abrir cada sección [39:45]: `lista` con
     `oscura: true` y, al volver, `"como": "<id>"` + `activo`;
   - para quién es y el ancla de precio en dorado (`{o:…}`), una línea por paso, justo después de
     la revelación [36:30-36:40]: `cifra` con `oscura: true`.
   Lo que incluye en detalle, la garantía, el precio final del stack y el llamado van en blanco con
   el estilo normal (✅, cifras, barras) [38:10-42:25]. El cambio de fondo le avisa al ojo que eso
   es otra cosa; si se usa para todo, deja de avisar (QA avisa una lista con ✅, una tabla, un stack
   o tarjetas en oscura).

Foto a sangre solo con velo blanco o banda blanca; nunca foto suelta en rectángulo. El diseño `foto` conserva la frase, el revelado y un único énfasis rojo. La fuente y la procedencia se declaran; `anfitrion` usa un PNG recortado real aportado por el usuario (nunca una silueta ni un dibujo de relleno en algo entregable).

## 7. Movimiento: casi nada, y siempre con propósito

- **Corte seco**: sin transiciones. La lámina aparece.
- **La lista crece hacia abajo desde arriba** [ref_95 «Without:», 3:25, 9:25]: arranca en el cuarto
  superior cuando conserva el encabezado de una continuación, con `anclar: "arriba"` explícito.
  Toda lista de hasta cinco renglones se centra como bloque al 47% del alto, también con ❌,
  ✅ o sin viñeta. El alto final se reserva desde el primer paso; QA avisa fuera de 40–58%.
- **Revelado por acumulación**: cada frase dicha suma UN elemento y nada cambia de lugar. Las
  listas crecen renglón por renglón y la tabla se llena columna por columna.
- Solo cuatro micro-efectos:
  1. El **cursor** entra, hace clic con una onda y elige una opción.
  2. La **ruta punteada** se dibuja, y la dibuja la mano [1:53-1:55]: tras el clic en la tecla, la mano
     cerrada (más chica y gris) sale hacia la siguiente con la ruta naciendo detrás, ~700 ms por tramo,
     y termina de dedo sobre la última tecla. En `pasos` es el comportamiento por omisión con `clic`
     (`arrastre: false` lo apaga).
  3. El **sello** cae con golpe y un temblor.
  4. **Foco**: la lámina anterior queda al 20 % en video [ref_1040], 35 % en sala y encima aparece una frase manuscrita.
- Los trazos a mano (subrayado, flechas, llaves, elipses, ✕) entran completos con su elemento, en el mismo cuadro
  del corte [ráfagas k_underline 0:41.2, c_alcancia 1:44.5, f_flechas 7:30.1]. Solo crece la ruta punteada que
  arrastra la mano [d_123 1:55.6-1:55.9]. El dibujado progresivo existe solo en modo `suave`.
- El subrayado va bajo los descendentes: centro ≈ línea base + 0.2 em (ref_10, m_1060); arco suave hacia arriba
  ≤0.5 % del ancho y ≤0.06 em; nunca cruza g/p/q/y ni la caja de un hueco; afina la cola (m_1790).
  El plumón mide 4–6 px, arranca un poco a la derecha del texto y remata antes de la última letra,
  con la punta final 2–4 px más baja. La base se mide en el texto, también dentro de un hueco con padding.

**Por qué funciona:** el revelado por acumulación es el principio de segmentación. Un elemento
por frase reduce la carga cognitiva y además crea contigüidad temporal: la imagen aparece en el
instante en que se dice su palabra. Por eso el video se siente rápido sin sentirse ruidoso.

## 8. Recursos narrativos

- **La tabla-marcador**: primero se presentan los criterios, luego cada opción llena una columna.
  Al final aparece la columna «modelo ideal» toda en verde. Es un argumento que el espectador
  ve crecer durante 10 minutos.
- **El mapa de pasos 1-2-3**: abre cada sección y deja claro dónde estás. Sin eyebrow: ningún texto chico encima del titular que no sea el arranque de la frase. Declara el mapa una vez y vuelve con `como` + `activo`; número y semana van en la etiqueta del paso.
- **Pregunta → emoji 🤔**: «¿Ves por qué esto no es ideal para un principiante?».
- **Prueba antes de la explicación**: la captura con el dato encerrado llega antes que la teoría.
- **Cámara en los momentos personales**: la historia, la confesión o la oferta. Tramos de unos
  4 s, cada 30 a 60 s.

## 8b. Formato vertical (9:16, beta)

El video original es 16:9. En vertical el lienzo mide 1080×1920: con los tamaños de 16:9 el contenido
ocupaba 23-30% del alto. Equivalencias que aplica el motor:

| Pieza | 16:9 | 9:16 | Sala 16:9 |
|---|---|---|---|
| texto compacto / chico / medio / grande / enorme | 68 / 76 / 84 / 90 / 120 px | 72 / 78 / 88 / 100 / 140 px (idea grande: 112) | Piso 72 px |
| nota manuscrita | 64 px | 80 px | 88 px (piso 72) |
| frase de foco (protagonista, a mano) | 88 px (84 con más de 14 palabras) | 96 px (88) | 88 px (piso 72) |
| texto secundario que se lee (sub, dato, %, post) | ≥ 48 px | ≥ 44 px | Piso 56 px |
| burbuja de chat | 84 px con ≤2 mensajes de ≤12 palabras; 72 con 3; resto 54 | 104 px con ≤2 mensajes de ≤6 palabras; 58–76 px en conversaciones largas | Piso 72 px |
| emoji con tamaño con nombre (`medio`, `heroe`…) | caja de 150-360 px | ×1.25 | Igual que 16:9 |
| lista | 58-72 px | 144 px con ≤2 ítems cortos, 112 con 3; resto ×1.2 | Piso 72 px |
| rótulo gris | 56 px | 60 px | 64 px |
| margen de arriba y de abajo | 100 px | 260 / 380 px; centro óptico ≈47% | 100 px |
| firma | abajo a la derecha | arriba al centro (y ≈ 226), bajo la barra de Reels y lejos de la cámara | Igual que 16:9 |
| tabla-marcador | columnas iguales, 50 / 44 px; con `converger`, las flechas terminan en UNA punta a ~20 px del primer renglón de la pregunta (≥ 68 px) [7:30] | filas de 220 px como máximo, vacías de 80 px, columnas según su palabra más larga, letra hasta 62 / 56 px según ancho y alto (piso 38 / 34); con `converger`, la pregunta va DEBAJO de la tabla (≥ 80 px) y las flechas bajan a una sola punta | Piso 56 px en celdas; 72 en frase |
| gráfica | 1500×660 con etiqueta lateral | 940×1000, la banda arriba y dentro | Piso 56 px en etiquetas |
| línea de tiempo | letra 56 / 84 px | ×1.35 de letra y alturas | Piso 56 px en etiquetas |
| botón y opciones | tamaño base | ×1.6 y ×1.45 | Piso 72 px |

La idea sin tamaño explícito usa un emoji de 530 px; las listas cortas se centran ópticamente salvo `anclar: "arriba"`. Se reserva el bloque completo desde el primer paso, para que nada salte al revelar. `qa.json → composicion_vertical` publica ocupación y centro del bloque por lámina.

### Pisos medidos antes del PNG (ronda 11)

- Chat vertical: burbuja de 82–86% del ancho útil, dejando sitio al avatar. Hasta ocho palabras,
  máximo dos renglones; el bloque de chat ocupa al menos 70% del ancho útil.
- Filas de dos a cuatro elementos: objetivo 60–75% del ancho útil, íconos de 170–250 px y
  rótulos de 64–80 px a 1920. QA avisa bajo 50% o rótulos menores de 60 px. Las columnas
  apiladas no son filas horizontales.
- Anotación: piso de 50 px. Prueba otro lado y dos renglones antes de reducir letra;
  QA da error bajo 46 px efectivos a 1920.
- Descargo: sans gris de 36 px, fijo abajo a la izquierda, fuera del encaje y de la firma; conserva el paso de su objeto y apila varios hacia arriba.
  Texto visible menor de 30 px avisa; solo se exceptúan firma y sufijos. El cuerpo de un
  documento ilustrativo debe diseñarse para verse a 44 px o más después de escalar la captura.
  El motor no lee letras dentro de imágenes: ese piso requiere revisar la fuente y la lámina.
- Flechas: el inicio queda a 24 px o menos del contorno de un elemento. Acortar una flecha
  nunca mueve su origen al vacío; si no puede anclarse, se omite.

**Zona segura de Reels**: arriba, la barra de Reels (~220 px); los ~320 px de abajo los tapan el caption y los botones, y la columna de
botones ocupa unos 140 px a la derecha de la franja baja. QA avisa si algo entra ahí, y si una lámina
de diagrama o lista ocupa menos del 35% del alto.

## 9. Lo que NO es este estilo

- No lleva plantillas con título, viñetas y logo arriba.
- No lleva degradados morados, vidrio esmerilado ni tarjetas por reflejo, salvo en la lámina de
  oferta.
- No lleva ilustraciones «de IA», personajes 3D inventados ni íconos de línea genéricos.
- No lleva párrafos: si una lámina necesita más de 22 palabras, son dos láminas.
- No usa colores decorativos: si algo es rojo, significa algo.


### Perfil de sala (complemento de §2, §4, §7 y §8b)

Solo se activa con `sala: true` o `{ "distancia_m": número positivo }`. En vivo por Zoom no implica sala.

| Medida | Video | Sala |
|---|---|---|
| Etiqueta apagada | 20 % | 35 % (`--apagado`) |
| Ícono apagado de pasos/lista activa | ≥35 % (`--apagado-icono`), a color | ≥35 %, a color |
| Rótulo de encabezado | 56 px | 64 px |
| Consigna: ítems | 66 px | 72 px |
| Nota manuscrita | 64 px | 88 px (piso 72) |
| Fuente / pie | 40 / 36 px | 44 px |
| Subtítulo / pastilla | 42 / 50 px | 56 px |
| Fondo del foco | 20 % | 35 % (salvo `opacidad` explícita; QA comprueba el piso) |

QA usa pisos de sala en tamaño nominal a 1920, medido en el render (con el encaje): principal 72, nota a mano 72,
secundario 56, fuente 44 y rótulo gris («Paso 1», encabezado) 34 px. Bajar del piso es error: parte la lámina o sube
`tam_texto`. El perfil de video conserva sus umbrales. Medido con una clase real en sala: el mapa apagado al 35 %
se identifica sin competir con el paso activo; lo que el motor no agranda solo (etiquetas de flujo, listas y cuentas
de 60-66 px) sale como error para que se decida. En 9:16 no se aplica sala. Calendario: máximo 14 días; meses: máximo 6 celdas. No se reducen para caber: se dividen; QA da error al exceder el límite o bajar de 35 % de opacidad efectiva.

QA avisa runs `{v:…}` sin cifra, moneda, porcentaje, sí/ok/✓ o verbo de resultado (ganar, entrar, vender, cerrar,
lograr). `{r:…}` pide una cifra negativa, no/✕, pérdida explícita o señal conectada (flecha, llave o subrayado).
También avisa cuatro palabras largas consecutivas en mayúsculas en idea/lista/cifra/pasos. Sellos, secciones,
stack, calendario, huecos, siglas cortas o con dígitos quedan fuera. Son avisos de lectura, no errores.

### Legibilidad y ocupación verificable (ronda 13)

Estas medidas se aplican después del encaje, no solo al CSS nominal:

| Composición | Objetivo del motor | Aviso de QA |
|---|---|---|
| Lista de ≤5 renglones, cada uno ≤10 palabras | 72–84 px en 16:9; bloque centrado | Letra <64 px a 1920 o alto <45% del útil |
| Contraste de dos columnas cortas | Misma ocupación; título acompaña; nota debajo | Mismos pisos; ✅ bajo título rojo |
| Chat normal 9:16 | Cada burbuja al 84% del ancho útil; avatar arriba si hace falta | Fuera de 82–86%; escala del deck >1.3× |
| Capa roja en Caveat (anotación, nota roja, rótulo de llave) | x ≥75% de la principal | x por debajo de 75% |
| Chat 9:16 (letra efectiva) | Nunca se encoge bajo 64 px; la escala común del deck no arrastra bajo ese piso | Letra <64 px: parte la conversación en dos láminas |
| Hasta 3 tarjetas en 9:16 | 84% del ancho útil, rótulo de 84 px (piso 64, ≤ 2 renglones); si apiladas no caben, tarjeta-renglón con el emoji al lado | Rótulo <60 px |
| Nota GRIS secundaria (`nota`) | Su tamaño medido: 64 px (60 px bajo el mapa 1-2-3) [ref_115] | Nota gris <48 px efectivos |
| Cita protagonista | x de texto principal (Figtree 84 px de referencia) | x por debajo de 100% |
| Contenido 16:9 | ≥6% arriba y abajo | Contenido medido fuera del margen |
| Consigna en vivo | 84 px; reloj de 360 px | Consigna <64 px a 1920 |
| Bifurcación horizontal | Origen de 200 px, rótulos de 84 px antes de encajar | Origen <170 px o rótulo <64 px efectivos |

El alto de lista reserva todos sus pasos, aunque todavía no se vean. Un anclaje superior
explícito conserva su intención. Un tamaño explícito se respeta y QA avisa si incumple.
El encabezado gris crece con los renglones; el blanco restante se reparte alrededor del bloque.
No agrandes primero las separaciones si todavía tienes letra pequeña.

**La referencia manda sobre una regla de legibilidad (ronda 14).** La ronda 13 aplicó el piso de 75% a TODA letra
Caveat y la nota gris secundaria creció hasta ~2 renglones; ref_115 la muestra pequeña, en un renglón bajo el titular, y
la réplica bajó de 8/10 a 6/10 elementos. El piso queda solo para la capa roja y la cita protagonista; la nota gris, la
tabla-marcador y los rótulos de gráfica conservan el tamaño medido. Antes de subir un piso, mide el cuadro del video que
le corresponde (`comparar.mjs`): si lo contradice, gana el cuadro.

La regla del chat se refiere a conversaciones normales, no al muro, al celular ilustrado ni a
la tarjeta de prompt. Los mensajes largos usan el ancho antes de reducir la letra; la escala
común se calcula entre las conversaciones del deck completo, aunque haya otras escenas en medio.

Referencia medida por caja de tinta, sin firma de esquina: lista tachada `m_256`, 48.33% de
alto y márgenes 26.39/25.28%; `ref_95` (primer paso), 13.89/63.98%; `ref_1760`, 6.02/30.56%.
El mínimo de 6% protege el contenido; los fondos a sangre y la firma tienen sus zonas propias.
El QA automático de margen cubre texto principal, listas, notas, burbujas, emojis, rótulos,
anotaciones y tramo en vivo. No sustituye revisar imágenes, tablas y trazos en las hojas.
