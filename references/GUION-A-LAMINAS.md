# Del guion a las láminas: cómo piensa el diseñador

El secreto del estilo no está en el CSS, sino en la **traducción**. Cada frase del guion se
convierte en UN cambio visual que la vuelve obvia. Este documento es el método.

## 1. Partir el guion en «beats»

Un beat es una unidad de sentido, normalmente una oración o una cláusula. Cada beat es un paso:
la lámina nueva o un elemento más sobre la actual.

```
«Hay gente usando la IA para ganar lo mismo que un médico     → beat 1: lámina idea (🧑‍⚕️+💰)
 sin experiencia previa en negocios.                           → beat 2: + nota manuscrita
 Sin pasar años trabajando doce horas al día,                  → beat 3: lámina lista «Sin:» + ❌ ítem 1
 sin construir una audiencia,                                  → beat 4: + ❌ ítem 2
 y sin mostrar tu cara.»                                       → beat 5: + ❌ ítem 3
```

- **Un beat dura 2 a 3 s**: la mediana medida es 2.9 s. Si un beat dura más de 5 s, pártelo o
  corta a cámara.
- **Nueva lámina o paso extra**:
  - Si el beat **sigue la misma idea**, es un paso más en la misma lámina: acumula.
  - Si **cambia de idea**, es lámina nueva.
  - Si **contradice** la anterior, usa `foco`, un tachón o una lámina con ✕.

## 2. Tabla de traducción: qué dice el guion y qué se dibuja

| Si el guion dice… | Dibuja… | Diseño |
|---|---|---|
| una afirmación fuerte | emoji literal + frase con la clave en negrita | `idea` |
| una promesa o tesis | la frase con `__subrayado__` rojo | `idea` |
| «sin X, sin Y, sin Z» | «Sin:» + ❌ por renglón | `lista` |
| «lo que necesitas: A, B, C» | ✅ por renglón | `lista` |
| «X, Y y Z no sirven» | lista con tachones | `lista` con `tachado` |
| «A lleva a B» | A → B con flecha roja | `flujo` |
| «A NO lleva a B» | arco negro con ✕ | `flujo` + `tachada` |
| un proceso de N pasos | teclas 1-2-3 + ruta punteada | `pasos` |
| «estás en el paso 2» | la misma lámina con `activo: 2` y `hechos: [1]` | `pasos` |
| «lo mismo, dos resultados» | origen → dos ramas + llave «mismo trabajo» | `bifurcacion` |
| un cálculo | la ecuación línea por línea, con el total subrayado (si es una proyección al espectador: condición arriba y rangos, ver §3.8) | `cifra` |
| un número que impresiona | el número solo, enorme | `cifra` con una línea |
| «tendrías que vender 500» | 500 emojis en rejilla + nota «Son 500» + sello | `rejilla` |
| un porcentaje | 100 puntos, unos de otro color (agrupa los destacados, los llenos primero y en orden: «41 de 100» se lee de un vistazo; el sello nunca los tapa) | `rejilla` + `punto` |
| «tú, entre todos ellos» | multitud con uno encendido | `rejilla` + `destacar` |
| comparar opciones con criterios | tabla-marcador | `tarjetas` y luego `tabla` |
| crece, escala, se dispara | curva | `grafica` |
| «en 14 días», «en 12 meses» | línea de tiempo con tramo verde | `linea-tiempo` |
| «es muy difícil» | medidor con el pin en rojo | `medidor` u `opciones` |
| «solo das clic» | botón + cursor | `boton` |
| un mensaje o conversación | burbujas | `chat` |
| «tú te quedas con el 30%» | pastilla que se parte | `reparto` |
| un testimonio o prueba | captura con el dato encerrado | `prueba` |
| lo que NO necesitas / lo que SÍ | bloques rojo y verde | `cuadrantes` |
| una pregunta retórica | 🤔 + la pregunta | `idea` |
| una objeción del cliente | emoji negado si es «me falta X»; 🤔 si la objeción es una pregunta (EMOJIS.md, objeción) + «Objeción #N» entre el emoji y la frase + la objeción en negrita y entre comillas; la respuesta en la lámina SIGUIENTE | `idea` con `encabezado_pos: "entre"` |
| por qué falla la mayoría | la misma forma con «Razón #N» [34:25, 35:15] | `idea` |
| credibilidad (años, clientes) [36:10] | la cifra real sobre una foto o captura real | `prueba` u `objeto` |
| componente numerado «#N» de la oferta [41:10, 41:40] | «#4» + el componente, en blanco | `idea` |
| pregunta de sí después de un componente [41:00, 41:35] | 🤔 + «¿Ves cómo…?» | `idea` |
| lo que incluye la oferta, el stack que crece [42:30] | bento que se llena pieza por pieza | `stack`, `tarjetas` o `rejilla` |
| qué pasa después del clic [43:35-43:50] | flecha roja al link, «2 minutos», la invitación del calendario | `boton` o `calendario` |
| el precio | ancla real chica y gris → precio grande (una línea por paso) | `cifra` con líneas-objeto |
| desglose del precio («son $100 al día», «4 quincenas de…») | «precio ÷ unidad = __monto por unidad__», sin `arriba` obligatorio: dividir un precio no es una proyección | `cifra` |
| cupos o lista de espera (solo si son reales) [43:15-43:30] | rejilla con el color de los ocupados en un paso posterior + la fuente | `rejilla` + `destacado_paso` |
| antes / después | en UNA lámina: bloques rojo y verde, o el par de emojis | `cuadrantes` o `idea` con par |
| una fila de conceptos sin causa→efecto | nodos numerados sin flechas [19:15] | `flujo` + `flecha: "ninguna"` |
| una frase textual de alguien | letra manuscrita + flecha | `cita` |
| una idea que resume la anterior | atenuar la anterior + nota encima | `foco` |
| la revelación del producto o la marca (SOLO eso: el resto de la oferta va en blanco, §7) | lámina oscura (nombre, logo, una frase) | `oscura` |
| historia personal, confesión o llamado | nada: cámara | `camara` |

## 3. Cómo escribir el texto de la lámina

1. **No transcribas: comprime.** La lámina lleva las palabras clave que se dicen, no la oración
   entera. Por ejemplo, se dice «hay un grupo de personas que lo está aprovechando para ganar
   tanto como un doctor» y la lámina pone «La gente lo usa para **ganar como un médico**».
2. **Máximo 22 palabras visibles.** Lo ideal son entre 6 y 14.
3. **Una frase clave en negrita.** El resto va en regular. La negrita es lo que el ojo lee si
   solo tiene medio segundo.
4. **Un énfasis por lámina**: subrayado, resaltador o círculo. Si todo es importante, nada lo es.
5. **Usa las mismas palabras que se dicen.** Si la voz dice «alianza», la lámina no pone
   «partnership».
6. **Los términos propios van entre comillas** («Marketing de crecimiento») y la primera vez se
   subrayan.
7. **Las cifras siempre con número** y en la unidad que se dice: «$10k al mes», no «diez mil
   mensuales».
   Un estudio o un dato publicado se cita en `fuente` («Autor, obra (año)», sans gris al pie), en `idea`,
   `flujo`, `grafica`, `cifra`, `cita`, `rejilla`, `tabla`, `tarjetas` o `linea-tiempo`; nunca en `nota` (LAYOUTS.md,
   «Fuente de un dato o un estudio»).
8. **Proyecciones al espectador.** Cuando la cuenta promete lo que ganará o conseguirá quien mira
   (dinero, clientes, ventas). No aplica al tamaño de un mercado ni a un dato publicado: ahí va `fuente`.
   - a) La condición concreta va en `arriba`, con número: «Si te escriben 20 personas al día:» o «Con 10
     mensajes diarios:». Nunca un «Supuesto:» vacío.
   - b) Las tasas y los resultados van en rango y en la unidad que se dice, como en la referencia
     [33:45-33:55]: arriba «For a creator with 50K-100K followers», abajo «100-250 sales × $100-200 =
     $10,000-$50,000». Si hay que dar un solo número, sale de la tasa baja. **Las tasas no se inventan**: salen
     de `datos` (`{{TASA_…}}` con su origen real, o pendiente), de una `fuente`, o van como hipótesis en la
     condición de `arriba` («Si te contrata el 0.1-0.3%:»). QA avisa «tasa sin origen» y deja el deck en borrador.
   - c) **El descargo va en pantalla una vez, cerca del gancho**, cuando el deck le promete resultados al
     espectador («puedes ganar $10k-50k», «ganar lo mismo que un médico», «vas a vender 8 clientes»), como la
     referencia [0:38-0:42]: después de «100% transparent» sale la `idea` «Just because I got these results,
     doesn't mean you will» con su subrayado. En español: una `idea` «Que yo tenga estos resultados ==no
     significa que tú los tengas==». QA avisa si hay promesa y ninguna lámina visible trae el descargo, y deja el
     deck en borrador. No hace falta en cada lámina de promesa ni una condición con número en cada gancho `idea`
     (la referencia no la trae en 0:10); la condición se sigue pidiendo en la `cifra` de la proyección. La voz
     también lo dice. QA avisa además cuando el arranque afirma un resultado propio («me hizo cobrar el doble») y
     ninguna voz trae el descargo, y deja el deck en borrador hasta confirmar ese resultado en `datos.CASO_PROPIO`.
   - d) **Escena o cifra ilustrativa**: una situación inventada para explicar, que no le promete nada al
     espectador («entran $50,000 este mes»). La voz la presenta **una sola vez** y con naturalidad, al abrir
     la escena: «Pongamos que este mes vendiste 50 mil…», como la referencia [22:28, «in this example», sobre
     la lámina «Revenue Split» de 22:15, que no lleva ninguna etiqueta]. **En pantalla no va ningún
     descargo de ejemplo** (esto aplica a las escenas ilustrativas; el descargo de resultados de c) sí va): ni `nota`, ni `titulo`, ni `subtitulo`, ni `encabezado`, ni `arriba` dicen «ejemplo»,
     «hipotético» o «ilustrativo». La nota a mano lleva la consecuencia («Y el 17 pides prestado»), como pide
     el punto 9. El carácter ilustrativo queda en `_comentario` para quien edite el deck. Si la cifra es un
     dato real publicado, lleva `fuente`; si es una proyección al espectador, siguen a) a c). Las maquetas
     de `prueba` (`ejemplo: true`) sí llevan su sello EJEMPLO: son otra cosa. **En una propuesta no aplica**: los
     números del cliente vienen de la llamada de diagnóstico (`fuente` o `{{CLAVE}}` en `datos`), no de «Pongamos
     que…» (ARCOS.md, propuesta, bloque 1).
   - e) **Dividir un precio no es una proyección**: «$3,000 ÷ 30 días = __$100 al día__» o «{{PRECIO}} ÷ 40
     vendedores = __$2,500 por vendedor__» no piden condición ni rango. QA lo reconoce cuando una línea divide un
     monto o el precio y el total termina en «por/al/cada + unidad»; «= __$500 al día en ventas__» sigue siendo
     promesa.
   QA avisa cuando una `cifra` subraya un total de dinero, % o clientes y `arriba` no trae número, y
   también cuando la cuenta no trae NINGÚN rango (§3.8 b); cuando un descargo («de ejemplo», «Ejemplo:»,
   «hipotético») va en pantalla fuera de una `prueba`, y cuando la voz repite que es un ejemplo en más de dos
   láminas (§3.8 d).
9. **La nota de remate y el `foco` llevan un dato, una consecuencia concreta o una acción con objeto**
   (qué mandar, a quién, cuándo). Máximo una antítesis «No X, Y» por deck, y nada de cierre motivacional
   genérico («Todo empieza con…», «Mándalo hoy», «Esperar no es una estrategia»). Si la frase viene del
   guion hablado, corrígela en el guion y no solo en la lámina, para no romper la regla 5. Lista completa
   y pares antes/después en [VOZ-HUMANA.md](VOZ-HUMANA.md); QA avisa las fórmulas y las palabras de
   «Palabras que nunca usas» de MI-MARCA.

## 4. Cómo elegir el emoji

- **Literal antes que ingenioso**: dinero es 💰, tiempo es ⏳, no un emoji «creativo».
- **Uno protagonista por lámina de idea**, o un par antes/después (`["no:📚", "si:🤖"]`, con el
  negado atenuado) [10:55]. Si hacen falta dos juntos, es un emoji compuesto (`"🧑‍⚕️+💰"`); para
  una fila de conceptos, un `flujo` (con `flecha: "ninguna"` si no hay causa→efecto). Las láminas de
  datos (cifra, tabla, línea de tiempo, calendario, gráfica) no llevan emoji protagonista.
- **Revisa el contraste del emoji** (EMOJIS.md, «Bajo contraste»): en Fluent 💬 y ✉️ casi
  desaparecen sobre blanco; en Apple 🏷️ se pierde. QA lo avisa y propone el sustituto.
- **La negación se dibuja**: `"no:🎥"` en lugar de escribir «sin video».
- **Mismo concepto, mismo emoji** en todo el deck: si «producto» fue 📦, lo sigue siendo. Y al revés:
  **un emoji, un concepto**. No uses dos emojis que se ven casi iguales (🧑‍💼 y 👨‍💼) para
  conceptos distintos.
- Diccionario completo en [EMOJIS.md](EMOJIS.md).

## 5. Ritmo y variedad

- **No repitas el mismo diseño 4 veces seguidas.** Alterna texto, proceso y dato.
- **Cada 3 o 4 láminas debe haber algo a mano**: subrayado, flecha, nota, tabla o sello. Es la
  firma del estilo.
- **La cámara es el respiro.** Tramos de unos 4 s, cada 30 a 60 s, en los momentos personales.
- **Las láminas oscuras son solo para revelar la marca o el producto.** Si aparecen antes, o se
  usan para el precio y la lista de lo que incluye, pierden su efecto.
- **Hay objetos que regresan**: la tabla-marcador y el mapa de pasos se repiten creciendo. Esa
  repetición le da estructura al video.

## 6. Arcos: el de la referencia y los de cada pieza

**Antes de escribir, decide la pieza y su duración** (reel, video, VSL, clase, webinar, propuesta):
cada una tiene su arco, su número de beats y su peso de oferta en **[ARCOS.md](ARCOS.md)**. Ponlas en
el deck (`"pieza"`, `"duracion_objetivo"`, `"en_vivo"`) y QA mide la voz contra el objetivo. Una
«clase» de 4 minutos no es una clase: es un resumen.

Estos son los grandes bloques del video de referencia (44:55), con su minuto aproximado. Es el arco
del **webinar o video largo**:

1. **Gancho** (0:00-2:30): ver §6.1. Presenta el sistema 1-2-3.
2. **Credibilidad** (2:30-3:20): quién habla, con logos y cifras.
3. **Criterios** (4:00-5:20): por qué la mayoría falla. Presenta 6 métricas.
4. **Comparación** (5:20-10:05): la tabla-marcador se llena modelo por modelo.
5. **Revelación** (10:10-12:30): «una sola solución cumple todo». Cuadrantes verdes y rojos.
6. **Por qué ahora** (11:10-16:30): la curva de crecimiento, la industria y la prueba.
7. **El sistema paso a paso** (16:35-34:00): el mapa 1-2-3 abre cada paso, con demostraciones.
8. **Objeciones** (34:20-36:00): «Razón #1», «Razón #2». Todas con la MISMA forma: `idea` con
   emoji negado si es «me falta X»; 🤔 si la objeción es una pregunta (EMOJIS.md, objeción), «Objeción #N» o «Razón #N» entre el emoji y la frase, la objeción en negrita; la
   respuesta en la lámina siguiente, y si hay contraste, pregunta → «Sí.» → «Pero…» en láminas de una
   frase [34:35-34:45]. Nunca dentro del encabezado de una lista ni pegada a un botón. De 2 a 3
   objeciones antes del precio.
9. **Oferta** (36:00-44:50, el 20% final): **ver §7, beat por beat.** En resumen: puente del dolor,
   credibilidad, ancla con el nivel caro, revelación oscura, componentes «#N» con su pregunta de sí,
   prueba real, stack que se llena, escasez real, llamado con qué pasa después, resumen y llamado otra
   vez, por qué ahora. Oscura SOLO la revelación de marca; todo lo demás en blanco con emoji.

### 6.1 Los primeros 10 segundos

- **Antes del segundo ~10 el espectador ya vio el resultado o el conflicto concreto.** Nada de saludo,
  «bienvenido», presentación personal ni el título de la clase («Cómo…») como primera lámina. La
  bienvenida y el «quién soy» van después de la primera prueba: en la referencia el nombre llega en 1:26.
- Aperturas que sirven:
  - una escena concreta con hora y lugar: «11:40 pm. Alguien quiere comprarte…»;
  - el resultado más «sin…» [0:10-0:19];
  - el error en vivo: el chat que se queda en visto;
  - un dato contraintuitivo. Un gancho con un dato publicado lleva su `fuente` en la MISMA lámina, porque la primera
    vista es muda; y no se generaliza el dato más allá de la población del estudio («alumnos verificados de edX», no
    «un curso en línea»).
- **Se tiene que entender sin sonido**: en YouTube y en reels la primera vista suele ser muda. Un gancho
  en chat muestra a la vista la hora de los dos extremos (cuándo escribió y cuándo contestaste: `hora` por
  mensaje) y pega el sello a la burbuja culpable con `sello_sobre: "m1"` (LAYOUTS.md, `chat`).
- Se permite una tesis breve antes, como el «We are entering a new era» de la referencia [0:00-0:10],
  siempre que el resultado llegue en 10 s o menos.
- En un reel (menos de 60 s) el conflicto concreto va en la lámina 1, no después del mapa.
- Los beats de retención de la referencia entre 0:00 y 2:30, con su minuto:
  | Beat | Minuto | En la lámina |
  |---|---|---|
  | resultado + «sin…» | 0:10-0:19 | `idea` + `lista` «Sin:» |
  | llamado a quién es («si hiciste clic es porque…») | 0:26 | `idea` + `clic` |
  | mecanismo con nombre («Market Gap») | 0:31 | `idea` con el término entre comillas |
  | prueba rápida y descargo de resultados | 0:35-0:40 | `prueba` + la voz: «que yo los tenga no quiere decir que tú los tengas» |
  | quién habla | 1:26 | `camara` o `idea` |
  | contrato de tiempo («los próximos 33 minutos») | 2:03 | `objeto` con `reloj` («33:00» → los minutos de tu clase) + `texto` con los minutos en negrita [2:00] |
  | filtro («si no tienes 33 minutos…») | 2:05 | `idea` |
  | regalo por quedarse hasta el final | 2:12 | `idea` 🎁 |
- QA avisa si hay cámara antes del segundo 10, saludo en las dos primeras láminas o una primera lámina
  que empieza con «Cómo» o «Aprende a».

## 7. La oferta, beat por beat (referencia 36:00-44:50)

La regla de fondo: **oscura SOLO en la revelación de la marca o el producto** (36:15-37:55 y 43:00).
Todo lo demás va en lámina **blanca con emoji**, con la capa a mano de siempre: la lista «They will:»,
las preguntas 🤔, los «#4» y «#5», la lista de espera y el «2 minutes» son blancos. La oferta escala con
la pieza (ARCOS.md): un reel no lleva oferta y una clase solo un puente al siguiente paso. **Todo dato es
real**: si no hay cifra de credibilidad, prueba o escasez real, el beat se omite o se cambia por un sustituto
honesto (abajo, «Sin prueba real, en este orden»); nunca se inventa.

| # | Beat | Minuto | Diseño |
|---|---|---|---|
| 0 | **Objeciones o razones** antes de la oferta: «a quick word of warning… two reasons. Reason number one…». Cada una con la receta de §2 (emoji negado si es «me falta X», 🤔 si es una pregunta: EMOJIS.md, objeción), «Objeción #N» o «Razón #N» entre el emoji y la frase, la objeción en negrita; la respuesta en la lámina siguiente, con un dato real o un paso concreto. Nunca pegada al botón | 34:17-36:00 | `idea` + `encabezado_pos: "entre"` |
| 1 | Puente del dolor a la solución («te sientes perdido») | 35:45-36:05 | `objeto` (foto real) o `idea` |
| 2 | Credibilidad con cifra y años («desde 2016, más de 23,000 clientes»). Si no hay cifra real, sale la `camara` de quién habla sin inventar número (QA lo avisa) | 36:10 | `prueba` u `objeto` con foto real |
| 3 | Ancla con tu nivel caro real («Quantum… desde $25,000»), opcional | 36:30-36:40 | `cifra` |
| 4 | Revelación del producto, en 1 paso; en oscura pueden seguir sus pilares (lista blanca con emoji que vuelve con uno activo) y para quién es. Si el programa es «hecho contigo», la videollamada «TÚ + tu mentor» lo presenta [36:45] | 36:15-37:55, 43:00 | `oscura` · `lista` + `oscura` · `llamada` |
| 5 | Componentes numerados «#N». Cada uno se desarrolla en su lámina (`lista` que crece como «They will:», `calendario` o `boton`; un componente humano —mentor, consultor, llamadas en vivo— con `llamada` antes de su `lista` [40:10, 41:15]) y cierra con una pregunta de sí 🤔 («¿Ves cómo…?») | 40:15-41:40 | `idea` + `lista` / `calendario` / `boton` / `llamada` |
| 6 | Prueba real: el muro de capturas (con `src` o `fuente`). Sin prueba real, un sustituto de la tabla de abajo; nunca una maqueta `ejemplo: true` | 42:00 | `prueba` |
| 7 | El stack que se llena pieza por pieza: a sangre, cada pieza una tarjeta de producto a color nombrada con un sustantivo corto («Ghostwriter OS», «4 llamadas en vivo»), no una frase; el remate es un título en su propio corte: ✓ verde sin caja + frase en 800 a ~140 px [42:50] | 42:30-42:50 | `stack` (o `tarjetas` / `rejilla`) |
| 7b | **Bonos** (solo si la oferta los tiene): en el MISMO `stack`, después de las piezas base, cada uno con `sub: "Bono #N"` y su nombre desde `{{BONO_N}}` (LAYOUTS.md, `stack`). No hay diseño de bono aparte: la referencia no los tiene | — | `stack` |
| 8 | Escasez, solo si es real: inscritos contra lista de espera, cupos, meses de espera, o una fecha límite (`calendario` con el día marcado). Siempre desde `{{CUPOS}}` o `{{FECHA_LIMITE}}` con su dato real: «solo hoy», «Quedan solo 3 lugares» escritos a mano son error de QA | 43:00-43:30 | `rejilla` + `destacado_paso`, o `calendario` |
| 9 | Llamado con qué pasa después: flecha roja al link, cuánto tarda («2 minutos»), qué pasa luego (la invitación del calendario) y la salida honesta «si no es para ti, te orientamos» | 43:35-44:10 | `prueba` / `boton` + `idea` ⏱️ + `calendario` + `idea` 🧭 |
| 10 | Resumen del stack y el llamado otra vez | 44:20-44:30 | `lista` + `boton` o `prueba` |
| 11 | Por qué ahora y cierre de identidad, luego a cámara | 44:35-44:45 | `idea`, después `camara` |

- **El orden en un `vsl` o `vsl-corto`** (la referencia: objeciones 34:17-36:00 → revelación 36:16 → componentes y
  stack → resumen 42:29 → primer «click the button below» 43:36 → el mismo botón otra vez 44:31):
  1. objeción y su respuesta (beat 0);
  2. revelación oscura (beat 4): en un `vsl-corto`, a más tardar al 60% (en un `vsl` largo va en el ~20-25% final);
  3. qué incluye: componentes y `stack` (beats 5 y 7);
  4. prueba (beat 6);
  5. precio y garantía, solo si hay precio público;
  6. llamado 1 con qué pasa después del clic (beat 9);
  7. resumen del stack (beat 10);
  8. llamado 2, al final.

  Dos reglas: **ningún llamado visible antes de la revelación** («Aplica aquí» antes de decir qué se vende; el
  webinar sí puede llevar un llamado temprano) y **un solo canal de llamado por pieza**: botón o link, o palabra
  clave por WhatsApp, repetido; no mezclados (los dos llamados de la referencia son la misma acción: aplicar). QA
  avisa las dos, y mide dónde empieza la oferta por la revelación oscura (sin oscura, el primer `stack`): un botón
  temprano no cuenta como oferta.
- **VSL y webinar: al menos 1 objeción antes del llamado de la oferta** (beat 0): 1 en un `vsl-corto`, 2 en un
  VSL de 8 min o más, 2-3 en un webinar. No se inventan objeciones ni respuestas: salen del público real (en un
  VSL de eventos, «mi público no paga apartado» o «ya mando recordatorios y aun así no llegan»). QA avisa si no
  hay ninguna `idea` «Objeción #N» o «Razón #N» antes del llamado. **Si no puedes preguntar** (loop, agente de fondo),
  la objeción que no dio el usuario se PROPONE: `"datos": { "OBJECION_1": { "valor": "No sé nada de tecnología",
  "propuesto": true } }` y la lámina dice `**«{{OBJECION_1}}»**`, así sale en `por_confirmar`. Y se introduce sin
  frecuencia: «Objeción número uno: …» o «Quizá estés pensando: …», nunca «la de siempre» ni «la que más oigo» sin un
  dato (QA lo avisa; VOZ-HUMANA.md).
- **Sin prueba real, en este orden** (el beat 6 y el tramo de prueba de un vsl o webinar):

  | # | Sustituto | Diseño |
  |---|---|---|
  | a | Demostración del mecanismo con material real del creador: su calendario, su cuenta, su chat | `prueba` con `src`, o `objeto` con `imagen` |
  | b | Caso propio con números y su `fuente` | `cifra` con `fuente` o `prueba` con `fuente` |
  | c | **Prueba de mercado**: una nota de prensa o un dato publicado real (INEGI, un estudio, un medio) que respalda la OPORTUNIDAD, no el resultado del producto [11:25 «$250 billion Creator Economy», 11:30 Forbes citando a Goldman Sachs, 12:00 creadores reales con su logo]. Se busca y se abre con WebSearch o WebFetch, **nunca un número de memoria**. En la voz se dice como dato del mercado («según INEGI…»), nunca como caso propio. Su sitio natural es el tramo de «por qué ahora», antes de la revelación; no sustituye el muro de capturas del beat 6 cuando lo hay | `prueba` con la captura del artículo en `src` y su `fuente` (medio y fecha), con el subrayado o el círculo rojo en la frase clave; o `cifra` con `fuente` |
  | d | Prueba lógica: la cuenta con la condición en `arriba` (§3.8). La tasa va DENTRO de la condición, dicha como hipótesis («Si te contrata el 0.1-0.3%:»), o con `fuente` (puede ser la misma nota de c). Una tasa escrita en la cuenta sin origen («10 × 20% compran») es una cifra de resultado inventada: QA la deja en borrador («tasa sin origen») y el deck no es final | `cifra` sin `fuente`, con `arriba` que empieza con la condición («Si…», «Cuando…», «Con…») y un número, y un rango en `arriba` o en `lineas` |
  | e | Oferta de «primeros casos» con garantía de condición medible | `idea` 🛡️ con plazo real («30 días»; un `{{GARANTIA_DIAS}}` sin llenar no cuenta) y condición («si…») |

  QA cuenta la prueba de mercado (c) como prueba real (lleva `fuente`) y la lógica (d, sin tasas sueltas) y la
  garantía (e) como sustitutos para final (qa.json → `prueba`: `real`, `logica` o `garantia`); una captura real sigue siendo mejor. La `a` es `prueba` con `src` u `objeto` con `imagen`; la `b` y la `c`, `cifra` o `prueba` con
  `fuente` (si la fuente es un `{{HUECO}}`, queda como dato pendiente y el deck es borrador hasta llenarla).

  Si no hay ninguno, el beat se omite. **Un `prueba` hecho solo de capturas `ejemplo: true` nunca ocupa el
  beat 6 ni el tramo de prueba**: la maqueta enseña un formato («así se ve el mensaje») dentro del contenido,
  pero no respalda la oferta. Si el usuario deja la prueba para después, va un `{ "hueco": "Tu captura va
  aquí" }` o `{{PRUEBA}}`: QA los lista en `por_confirmar` (el hueco como `CAPTURA_N`) y el deck queda en borrador. QA avisa si un vsl o webinar no trae ninguna prueba real
  (`prueba` con `src` o `fuente`, `objeto` con `imagen`, `cifra` con `fuente`), si la única es una maqueta, y
  si antes de la revelación no hay una cifra de credibilidad (años, clientes, eventos, alumnos) a la vista ni
  en la voz.
- **El llamado aparece al menos 2 veces** (beats 9 y 10), **a la vista**: un `boton`, la palabra clave o
  la flecha al link (`llamado: true` marca esa lámina). Que la voz diga «WhatsApp» o «aparta» no es un
  llamado, y el que va solo en la voz de la cámara final tampoco cuenta. En un webinar, 3 si hay un llamado
  temprano.
- **Precio, formas de pago y garantía NO están en la referencia**: su llamado es aplicar y agendar una
  llamada, y el único precio es el ancla del nivel caro. Se agregan solo si la oferta tiene precio
  público: el precio con `cifra` (el ancla es algo real que el público ya vio: el precio anterior real, o el costo
  de no hacer nada ya calculado en el deck; nunca un «Valor» inventado; el tachado es opcional) y la garantía con
  diseños que ya existen: una `cifra` con el plazo («{{GARANTIA_DIAS}} días») y la condición medible en `arriba`
  («Si aplicas los 6 módulos y no…»), y después `pasos` con cómo se reclama. «Garantía total» o «sin riesgo» sin plazo
  ni condición no dicen nada (QA avisa). Los datos que falten van con `{{PRECIO}}` en el texto y `"datos"` en el deck
  (LAYOUTS.md, «Datos que se llenan una vez»): QA los lista como pendientes.
- **El modelo que se copia** depende de la pieza (deck.json + guion.md en cada carpeta):

  | Pieza | Modelo |
  |---|---|
  | `vsl`, `vsl-corto`, `webinar` | `ejemplos/vsl-corto/`: gancho, promesa y mecanismo antes del segundo 25, filtro y credibilidad, problema, cómo funciona, prueba, objeción con su respuesta, revelación, stack, precio anclado, garantía, el llamado con qué pasa después, resumen y el llamado otra vez |
  | `propuesta` | `ejemplos/propuesta/`: los 9 bloques de ARCOS.md, con los números del cliente como huecos declarados |
  | `tutorial` con `"clase": true` (clase express) | `ejemplos/clase-express/`: gancho, contrato de tiempo, mapa, dos bloques con su tramo en vivo, tarea y puente |
  | cualquier otra | ARCOS.md, la plantilla de su pieza |

  Con los datos que faltan como huecos declarados. El demo (`ejemplos/demo/`) es un catálogo de diseños, no un modelo
  de guion.
- **Propuesta**: su arco son los 9 bloques de ARCOS.md (diagnóstico con sus números, costo, solución, quién la imparte
  y un caso, metas, alcance con «No incluye», inversión anclada, garantía o condición de salida, siguiente paso con
  fecha y vigencia). Sin prueba real, los sustitutos de arriba; nunca inventada.
