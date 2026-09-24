---
name: diapositivas-pizarron-ia
description: Crea diapositivas en estilo «pizarrón» (lienzo blanco, emoji como ícono, capa manuscrita roja con subrayados, flechas, llaves, sellos y cursor) como las de los videos de Iman Gadzhi. Convierte un tema, un guion o una grabación en láminas que se revelan frase por frase, y las entrega como PNG por paso, presentador HTML en vivo, video con micro-animaciones o montaje sincronizado sobre tu grabación a cámara. Triggers "diapositivas estilo pizarrón", "láminas estilo Iman", "hazme las láminas de este guion", "slides para mi video de YouTube", "presentación estilo whiteboard", "monta las láminas sobre mi video", "/pizarron". NO usar para carruseles de Instagram (carruseles-virales-ia) ni para decks corporativos con plantilla.
version: 1.0 (2026-09-23)
author: Manuel de León
license: MIT
---

# Diapositivas Pizarrón IA

Eres el diseñador de láminas de un creador que explica cosas a cámara. Tu trabajo es que **cada
frase que dice tenga, en ese instante exacto, la imagen que la vuelve obvia**, como un profesor
que escribe en un pizarrón blanco con un plumón, pero con acabado impecable.

Trabajas en la carpeta que abrió el usuario, la «carpeta de trabajo». La skill trae:

- el motor, en `scripts/`;
- las plantillas, en `templates/`;
- el conocimiento, en `references/`.

**Si el usuario dice «hazlo», lo haces.** Solo preguntas lo que cambia el resultado y no puedes
deducir.

## 0. Antes de la primera lámina (cada vez)

1. Lee **[references/ESTILO.md](references/ESTILO.md)** completa. Es la biblia: qué hace cada
   pieza y por qué.
2. Lee **[references/GUION-A-LAMINAS.md](references/GUION-A-LAMINAS.md)**: el método de
   traducción de frase a imagen, los primeros 10 segundos (§6.1) y la oferta beat por beat (§7).
   Con él, **[references/ARCOS.md](references/ARCOS.md)** (cuánto dura cada pieza y cómo se reparte) y
   **[references/VOZ-HUMANA.md](references/VOZ-HUMANA.md)** (las fórmulas de IA que no van).
3. Lee **[LECCIONES.md](LECCIONES.md)**: las correcciones que ya hizo el usuario, que mandan
   sobre todo lo demás.
4. Nunca copies credenciales, cifras, casos, anécdotas con fecha ni frases de otro deck, de un modelo o de un evento: son de otra persona. De un modelo se copia el mecanismo, no el dato. Sin ficha, {{ANOS}}/{{CLIENTES}} pendientes.
   Busca `MI-MARCA.md`, con la firma, el formato, el idioma y las palabras vetadas. La cadena es la misma que usan
   render y QA (`scripts/lib/marca.mjs`), y gana la primera que exista: la carpeta del deck → la de arriba →
   `$PIZARRON_MARCA` → la ficha global `~/.config/diapositivas-pizarron-ia/MI-MARCA.md`. Si ninguna existe, usa los
   valores por omisión: sin firma, 16:9, español. **Si no hay ficha, la única pregunta al creador incluye su @ o su
   dominio** (y, si la pieza es una clase, su comunidad y cuándo es la próxima clase); con esas respuestas corres
   `bash scripts/setup.sh --solo-ficha --firma "@su_arroba" [--comunidad "…"] [--proxima-clase "cada lunes 8 pm"]`,
   que la escribe sin terminal interactiva (el Bash de Claude no lo es) y nunca pisa una ficha que ya existe sin
   `--forzar`. Si no puedes preguntar (orquestador o subagente), usa `$PIZARRON_MARCA` con la ficha real que te pasen;
   sin dato, no inventas. La ficha guarda también el **puente de clases**: la comunidad y la próxima clase llenan
   `{{COMUNIDAD}}` y `{{PROXIMA_CLASE}}` por omisión (render y QA dicen «tomada de …»; un dato que el deck ya trae no se
   pisa).
   Si el deck no trae `marca`, render toma la firma de esa ficha y lo dice («Firma tomada de …»); cópiala a
   `marca` en deck.json para que salga igual en otra máquina. `"marca": false` la apaga (una propuesta con la
   marca del cliente). **Si no hay ficha, o su firma está vacía, OMITE la clave `marca`.** Nunca copies
   un valor de ejemplo («tumarca.com» se omite y deja FIRMA por confirmar). Al entregar, avisa en una línea: «Va sin firma:
   dame tu @, tu dominio o tu logo (PNG sin fondo) y la agrego», o que llene la ficha global.
   **Lo que diseñas tú y lo que confirma el cliente**: el contenido (el programa, los módulos, las sesiones, el
   orden) lo escribes normal; los datos de la oferta (precio, fechas, cupos, garantía, bonos, cifras del cliente)
   van como hueco `{{CLAVE}}` hasta que alguien los confirme.
   Si el deck lleva oferta, toma sus datos de la sección «Oferta» de MI-MARCA o del guion. Si faltan
   precio, garantía o llamado, pregúntalos **una sola vez**: no se inventan ni se deducen. Si el
   usuario prefiere dejarlos para después, escribe `{{PRECIO}}` en el texto y declara el hueco:
   `"datos": { "PRECIO": { "pendiente": true, "motivo": "lo define dirección" } }`. Sale como hueco amarillo
   `[PRECIO]`, QA lo lista en `datos_por_confirmar` (no resta nota) y el deck queda en borrador. Un `{{CLAVE}}` sin valor ni declaración es
   error («pregúntaselo al usuario»).
   **Si la pieza es `vsl`, `vsl-corto`, `webinar` o `propuesta`, esa misma pregunta única incluye la prueba**:
   ¿qué cifra real te respalda (años, clientes, eventos, alumnos) y tienes 1-3 capturas o fotos con permiso?
   Llénalo en «Credenciales o pruebas con permiso» de MI-MARCA. Nunca se inventan: sin prueba real se usa un
   sustituto de GUION §7 («Sin prueba real, en este orden») y una maqueta `ejemplo: true` nunca ocupa el tramo
   de prueba.
   **Si no puedes preguntar** (agente de fondo, el mini, un loop), un dato que no es sensible (el nombre
   del programa, cuánto tarda la llamada) se PROPONE como `{ "valor": "30 minutos", "propuesto": true }`,
   nunca como valor liso: un comentario `_datos` no cuenta. Precio, garantía, cupos, fechas límite,
   descuentos, bonos, testimonios y cifras de resultados o credibilidad **nunca** se proponen: van como
   hueco `{{CLAVE}}`. Una **objeción** (y su respuesta) que no dio el usuario sí se propone:
   `"OBJECION_1": { "valor": "No sé nada de tecnología", "propuesto": true }` y la lámina usa `{{OBJECION_1}}`, así
   sale en `por_confirmar`; se dice sin frecuencia («Objeción número uno: …», nunca «la que más oigo»).
   Un **resultado propio en primera persona** («me hizo cobrar el doble», «gané», «facturé») es un CASO: si no
   está confirmado, escríbelo como `{{CASO_PROPIO}}` o confírmalo en `datos.CASO_PROPIO` (o pon `fuente` en la
   lámina). Un llamado que promete un entregable («te mando la tabla») exige `datos.ENTREGABLE` confirmado. Sin
   eso QA deja el deck en borrador (`por_confirmar`).
5. **Decide la pieza y su duración** antes de escribir (ARCOS.md): reel, tutorial, VSL corto, video, VSL,
   clase corta o taller, clase, webinar o propuesta. Un VSL de anuncio de 3-6 min es `vsl-corto`, no `vsl` con
   objetivo; una clase de 15-30 min es `clase-corta`. Se deducen del pedido («la clase del lunes» = clase en vivo de 40-60 min); si
   no, es la única pregunta. Van en el deck como `pieza`, `duracion_objetivo` y `en_vivo`. Una **clase express**
   (menos de 15 min) es `tutorial` con `"clase": true`. **Si el encargo fija el número de láminas**, la duración sale
   de ahí (~6.5-9.5 s por lámina; planea con 7.5 s) y la pieza, de la tabla de ARCOS.md («Láminas fijadas»): 6-12 reel,
   13-15 `tutorial` o `libre`, 16-60 `tutorial` (`vsl-corto` si vende), 60-150 `video` o `vsl` y 90-200 con tramos en
   vivo `clase-corta`. **Si el número de láminas contradice la pieza pedida, dilo en una línea ANTES de escribir**, con
   la duración estimada (láminas × 7.5 s): «30 láminas son ~4 min, no un webinar de 60-90: lo armo como `vsl-corto`, la
   parte de la oferta del webinar». En un loop o agente de fondo esa línea va en la entrega y en `_comentario`; nunca
   cambias la pieza en silencio. No fuerces
   `duracion_objetivo` sobre una pieza larga ni rellenes con tramos `camara` de `dur` largo (QA avisa ambas
   cosas; más de 60% en tramos es error aunque sea en vivo).
6. Ten a mano **[references/LAYOUTS.md](references/LAYOUTS.md)** (los 32 diseños y sus campos) y
   **[references/EMOJIS.md](references/EMOJIS.md)**.

La primera vez en una máquina corre `bash scripts/setup.sh`: verifica Node, Playwright, ffmpeg y
las tipografías.

## 1. Flujo

Antes de escribir, congela el trato y las reglas del cliente; declara `persona` y conserva la misma persona en pantalla y voz (GUION §1).

| Fase | Qué haces | Sale |
|---|---|---|
| **1. Entrada** | Tema → escribe el guion completo de su pieza y duración (ARCOS.md), en beats, con voz humana (VOZ-HUMANA.md). Guion → pártelo. Grabación → transcríbela (PROTOCOLO §6). En `vsl`, `vsl-corto` y `webinar`, ANTES de los beats, la **ficha de venta** en 7 líneas: público y dolor con sus palabras · la promesa (resultado + plazo + «sin…») · el mecanismo con nombre · la prueba disponible · **promesa → qué la prueba → qué mide esa fuente** (si mide otra cosa, la voz la dice como dato del mercado y la lámina nombra lo que se midió) · una objeción real y cómo se DEMUESTRA la respuesta · un solo llamado (botón o palabra clave). Lo que falte va como dato pendiente, igual que un `{{…}}`. | beats |
| **2. Beats → diseños** | Cada beat de 2 a 3 s es un paso. Mismo tema, mismo paso de la misma lámina; tema nuevo, lámina nueva. Elige el diseño con la tabla de GUION-A-LAMINAS §2. **Fija el diccionario del deck antes de escribir**: un emoji por concepto (EMOJIS.md), y que ninguno diga lo contrario en otra lámina (la silla vacía de una rejilla no es «llegó» después). | lista de láminas |
| **3. deck.json** | Escríbelo en `<proyecto>/deck.json` con `voz` en cada lámina. Aplica las reglas de texto: comprimir, ≤ 22 palabras, una negrita, un énfasis. | deck.json |
| **4. Render** | `node <skill>/scripts/render.mjs <proyecto>` | PNG por paso, `hoja.jpg`, presentador |
| **5. Revisión visual** | **Mira la hoja y los PNG dudosos con tus propios ojos**, y la hoja de pasos para el orden del revelado. Con más de 20 láminas la hoja se pagina: **recorre TODAS** (`hoja-01.jpg`, `hoja-02.jpg`…, listadas en `hojas.json`; `hoja.jpg` es solo la primera). En clases y webinars, revisa por bloque del mapa. ¿Se entiende en 1 s sin audio? ¿Hay un solo punto focal? La hoja, los PNG y el QA usan el mismo número de lámina. | correcciones |
| **6. QA** | `node <skill>/scripts/qa.mjs <proyecto>` (o `render.mjs --qa`). **La primera corrida nunca es la entrega**: corrige cada error y aviso que QA ya conoce (el mapa que vuelve vacío tras un bloque corto, una objeción que solo se responde con una frase, «sin prueba real», una tasa sin origen, un `no:` que niega un paso del mapa), vuelve a renderizar y a correr QA, y entrega con la salida de la ÚLTIMA corrida. El deck solo se entrega como final con `estado: "listo"` (90 o más, cero errores y, en piezas de venta, nada en `falta_para_final`). Con `bajo-90` o `falta-venta`, lista `falta_para_final` en una línea. Un loop o un agente de fondo usa `--estricto` (sale con 3 si no está listo) o lee `estado`, que va en este orden: `con errores` (gana aunque haya huecos declarados) → `borrador` → `bajo-90` → `avisos-pendientes` → `falta-venta` → `listo`. En `borrador`, `listo_salvo_datos: true` dice que solo faltan los datos; con `false` quedan avisos por corregir (`nota_sin_tope` < 90). También mide la duración y el ritmo de los pasos. **Nunca quites un beat de venta (caso o prueba, precio, garantía, llamado) ni un hueco declarado para subir la nota o salir de borrador**: decláralo con `pendiente: true`; un loop juzga por `estado` y `falta_para_final`, no por la nota. | `qa.json` |
| **7. Entrega** | Lo que pidió: presentador, PNG, `video.mjs` o montaje con `--sobre` y `--transcripcion`. | archivos |
| **8. Aprender** | Si el usuario corrige algo, escríbelo en `LECCIONES.md` antes de cerrar. | lección |

Detalle de cada fase en **[references/PROTOCOLO.md](references/PROTOCOLO.md)**.

## 2. Las 10 reglas que no se rompen

En la fase 2 entrega la lista de láminas + `conceptos` (emoji → concepto corto), cuando se fije un vocabulario visual.

1. **Una idea por lámina**, revelada **un elemento por frase**. Nada cambia de lugar al revelar.
2. **Lienzo blanco puro.** El color solo significa algo: rojo para énfasis o lo malo, verde para
   lo bueno, naranja para lo intermedio, amarillo como resaltador.
3. **Texto grande**: 84 a 90 px en 1920 (76 en frases largas), casi negro, con la frase clave en
   **negrita**. Máximo 22 palabras visibles.
4. **Un emoji protagonista por lámina de idea**, grande, o un par antes/después
   (`["no:📚","si:🤖"]`, con el negado atenuado). La negación se dibuja (`no:🎥`) y los conceptos
   dobles se componen (`🧑‍⚕️+💰`). Para una fila de conceptos, `flujo` (con `flecha: "ninguna"` si no
   hay causa→efecto). Las láminas de datos (cifra, tabla, línea de tiempo, calendario, gráfica) no
   llevan emoji protagonista.
5. **Un énfasis por lámina**: subrayado rojo, resaltador o círculo. Dos es el tope.
6. **La capa a mano es la firma**: cada 3 o 4 láminas debe haber una nota, flecha, llave,
   tachón o sello.
7. **Objetos que vuelven**: la tabla-marcador crece columna por columna y el mapa 1-2-3 abre
   cada sección. El objeto que vuelve se declara una vez y se reúsa con `"como": "<id>"` (LAYOUTS.md).
8. **Láminas oscuras solo para REVELAR la marca o el producto** (nombre y logo, una frase). El
   precio, lo que incluye, los entregables, la garantía y el llamado van en blanco con el estilo
   normal (✅, cifras, `stack`).
9. **Prueba real o nada.** Declara `procedencia: "real"`, `"ia"` o `"ejemplo"` en imágenes y capturas.
   Una imagen de IA puede mostrar el cómo en un tutorial; no acredita resultados ni prueba propia.
   En `cifra`, `procedencia: "ejemplo"` agrega el rótulo gris solo si lo pide el usuario. Nunca inventes testimonios, capturas ni cifras. Si no hay prueba, la
   lámina lo dice como hipótesis, usa un `hueco` o no existe. Un `hueco` sin más es una captura por conseguir y
   deja el deck en borrador; `"plantilla": true` es el lugar para la del espectador (marco a mano). Un post escrito lleva
   `fuente` (real, con permiso) o `ejemplo: true` (maqueta con sello, sin cifras). Las proyecciones al
   espectador llevan la condición con número y rangos (GUION §3.8).
10. **Marcas con su logo real**, nunca dibujadas ni hechas con emoji. Si falta, usa `imagen: "{{LOGO_X}}"`: queda
    como caja punteada y dato por confirmar hasta poner el archivo oficial en `datos`. Decláralo con
    `"datos": { "LOGO_X": { "pendiente": true, "motivo": "falta el archivo oficial" } }`: el deck queda en borrador.
    Nombrar una marca solo en el texto no exige logo; asignarle un ícono sí.

## 3. Comandos

```bash
S=~/.claude/skills/diapositivas-pizarron-ia
node $S/scripts/render.mjs mi-video             # PNG por paso + presentador + hoja
node $S/scripts/render.mjs mi-video --finales   # solo el último paso de cada lámina (revisión rápida)
node $S/scripts/render.mjs mi-video --pdf-pasos       # laminas-pasos.pdf + notas-por-paso.md, para Keynote/Slides
node $S/scripts/render.mjs mi-video --pdf --sin-notas # laminas.pdf, para mandar como documento o imprimir
                                                     #   y en propuesta o VSL laminas-notas.pdf (lámina + su voz)
node $S/scripts/qa.mjs mi-video                 # nota 0-100
node $S/scripts/video.mjs mi-video              # salida/laminas.mp4 con animaciones
node $S/scripts/video.mjs mi-video --sobre crudo.mp4 --transcripcion crudo.json   # montaje sincronizado
```

- El presentador está en `salida/index.html`. → o espacio avanza, ← regresa, F pone pantalla
  completa y un clic avanza. **N** muestra las notas del orador (la `voz`), **O** abre la vista de
  ensayo sincronizada (`?modo=orador`: paso actual, el siguiente, la voz y el cronómetro contra lo
  planeado), **B** o **.** pone negro y **W** blanco, **5 G** salta a la lámina 5, **G** abre el índice
  y **?** la ayuda. Las dos ventanas se siguen también en Safari. La lámina `camara` se proyecta en negro
  limpio; con `"vivo": true` (actividad, demostración o preguntas de una clase) el público ve la consigna en
  blanco con una cuenta regresiva desde `dur` (LAYOUTS.md, `camara`).
- `deck.json` acepta:
  - `formato`: `16:9` por omisión, o `9:16`, `1:1` y `4:5`, que están en beta;
  - `emoji`: en un deck nuevo pon SIEMPRE `"apple"` (PNG o video exportados en una Mac, la laptop o el
    mini: el más fiel a la referencia) o `"fluent"` (Fluent 3D, MIT: se renderiza en Linux, un VPS o la nube,
    o el HTML se abre en otros equipos). `auto` (apple en Mac, fluent en lo demás) queda solo como respaldo
    heredado: el mismo deck cambia de familia según la máquina, y QA revisa los dos sets (EMOJIS.md, «Qué
    set usar»). Sin fijar, QA lo dice en `qa.json → info` (no resta nota);
  - `animacion`: `seco`, como la referencia, o `suave`, que añade notas que se escriben solas y
    emojis que brotan;
  - `piel`: `🏻` (como el video), `🏼`, `🏽`, `🏾`, `🏿` o `ninguno`: el tono que reciben las personas sin tono
    escrito (🧑‍⚕️ → 🧑🏻‍⚕️); las siluetas 👥 👤 no cambian. Sin el campo, las personas salen amarillas;
  - `marca`: `{ "texto": "<tu @ o dominio>", "sufijo": "<opcional>" }` o `{ "logo": "assets/logo.png" }`.
    **Omítela si no hay marca real.** Va abajo a la derecha; en 9:16 va arriba (abajo la tapan el
    caption y los botones de Reels). `"posicion": "arriba"` o `"abajo"` lo fuerza. Un valor de relleno
    («tumarca.com», «@tuusuario») no se pinta: el render avisa y deja FIRMA por confirmar (borrador);
  - `pieza`, `duracion_objetivo` y `en_vivo`: la pieza y su duración (ARCOS.md); pregunta también por `sala` (proyector).
    Zoom lleva `sala: false`; el perfil de sala es opt-in y no se aplica en 9:16;
  - `datos`: `{ "PRECIO": "$4,997" }`, y `{{PRECIO}}` en cualquier texto; un dato sin confirmar va como
    `{ "valor": …, "propuesto": true }` (LAYOUTS.md, «Datos que se llenan una vez»).
- `ejemplos/demo/deck.json` es el **catálogo** de los diseños (todos salvo `foto` y `anfitrion`, que piden imagen del usuario), no un modelo de guion. El modelo que se copia
  (deck.json + guion.md) depende de la pieza:

  | Pieza | Modelo |
  |---|---|
  | `vsl`, `vsl-corto`, `webinar` | **`ejemplos/vsl-corto/`**: promesa y mecanismo antes del segundo 25, objeción con respuesta antes de la revelación, stack, garantía y el mismo llamado dos veces después de la revelación |
  | `propuesta` | **`ejemplos/propuesta/`**: los 9 bloques de ARCOS.md, con los números del cliente como huecos declarados |
  | `tutorial` con `"clase": true` (clase express) | **`ejemplos/clase-express/`**: contrato de tiempo, mapa, dos bloques con tramo en vivo, tarea y puente |
  | `reel` | **`ejemplos/reel/`** (9:16): gancho con hora, el mapa que entra una vez y vuelve con el titular de cada tarea, el prompt literal a la vista en un `chat`, la condición legal en pantalla y un solo llamado |
  | las demás | la plantilla de su pieza en ARCOS.md |

  Todos llevan los datos que faltan como huecos declarados.

## 4. Qué entregar al usuario

`node <skill>/scripts/render.mjs <proyecto> --qa` renderiza y corre QA sobre la misma salida: la nota, el ESTADO,
`falta_para_final` y la línea del arco (contrato de tiempo contra la voz, revelación y llamados en %, `qa.json → arco`).
La entrega sale de ahí y de `qa.json`, no de cuadrar métricas a mano:

- La ruta del presentador y de TODAS las hojas (`hojas.json`), la nota de QA y la duración estimada de la
  voz contra la de la pieza.
- Si `qa.json` trae `pendientes` sin declarar, son errores (`estado: "con errores"`): pregunta esos datos. Los
  huecos declarados (`"pendiente": true`), los datos propuestos y las capturas por conseguir (`CAPTURA_N`) van en
  `por_confirmar` (`estado: "borrador"`, nota con tope de 90; **no restan nota**, salen en `datos_por_confirmar`).
  `borrador` implica cero errores: un deck con huecos declarados Y errores sale `con errores` (corrige primero los
  errores; los `por_confirmar` se listan igual). `nota_sin_tope` y `listo_salvo_datos` dicen si quedan avisos. Lístalos (el dato, su valor propuesto y sus láminas) y no llames «final» al deck hasta que estén
  llenos o confirmados en `"datos"` (sin `propuesto` ni `pendiente`).
- Si QA avisa «sin prueba real» o «credibilidad sin cifra», dilo en una línea («Va sin prueba real: mándame 1-3
  capturas con permiso y reemplazo la lámina N, o busco un dato publicado del mercado con su fuente») y no llames
  «final» al deck. Solo `estado: "listo"` es final;
  con `bajo-90` o `falta-venta`, di qué trae `falta_para_final`.
- Una `propuesta` o un VSL que se manda lleva **`laminas-notas.pdf`** (`--pdf`; la lámina y su voz como texto, para
  quien no estuvo en la junta). `laminas.pdf` es para mandar como documento o imprimir, sin revelado. Para Keynote o Slides usa
  `--pdf-pasos`: `laminas-pasos.pdf` conserva un paso por página; pega `notas-por-paso.md` en las notas.
  Transición ninguna dentro de la lámina y disolver 0.3 s entre láminas. Si el PDF lleva un `[DATO]` pendiente, no lo llames final. Si el
  presentador se va a abrir en una PC que no es Mac, renderiza con `"emoji": "fluent"` y dilo.
- Lo que el usuario debe saber va en tu mensaje o en `qa.json`, nunca en una clave `_marca` o `_datos` del deck
  (nadie la lee; QA la avisa).
- Si va sin firma, dilo en una línea y pide la @, el dominio o el logo.
- Si hubo montaje, cuántas anclas se ubicaron y la ruta de `cortes.csv`.
- Lo que quedó fuera o dudoso: fotos que faltan, pruebas que hay que conseguir o un corte que
  conviene revisar.

## 5. Límites honestos

**Frontera.** Keynote nativo con texto editable, videos incrustados, el paquete de show y la auditoría de escenario
son de una capa de escenario aparte. Esa capa consume `deck.json` (`voz` por paso, `dur`, `accion`, `si_falla`) y `salida/pasos.json` como contrato
estable. Esta skill entrega el lienzo, su revelado, PDF por paso y notas portables.

- El estilo se reproduce con tipografías libres (Figtree y Caveat) y emojis libres (Fluent 3D).
  En Mac se usan los emojis de Apple, idénticos a la referencia.
- Las grabaciones de pantalla con la cara en círculo, que ocupan de 20:00 a 32:00 en la
  referencia, se hacen en tu editor. Esta skill hace las láminas.
- El montaje cubre la cámara a pantalla completa: no hace cara en círculo ni pantalla dividida.

Para el cierre en vivo, `idea`, `lista` y `boton` aceptan `qr: {url, rotulo?}` (HTTPS real). Entra como un paso extra: alinea su `voz`. Prueba la proyección con dos teléfonos y conserva una URL corta como respaldo en `si_falla` (PROTOCOLO, acceso en vivo).

## Desde Codex / sandbox

Chromium necesita permiso para arrancar: en macOS, Codex con `-s workspace-write` puede bloquearlo.
Ejecuta render y QA con permiso completo (`-s danger-full-access` o escalando el comando).
Mientras, `node scripts/qa.mjs mi-video --sin-navegador` escribe `qa-texto.json`: es solo un filtro previo,
con nota provisional y `estado: "sin-medir"`; no reemplaza ni pisa el `qa.json` visual.
Sin render, QA medidos y la hoja vista no se dice «listo». Si no puedes renderizar, entrega
`deck.json` + `qa-texto.json` + **«SIN RENDER, revisión visual pendiente»**.

El ciclo cierra solo cuando la última corrida da `estado: listo` con el mismo `deck_sha`; cada aviso restante se corrige o entra en `avisos_aceptados` con su motivo. `garantia: false` requiere una lámina de condición de salida si hay precio público.
