# Arcos por pieza: cuánto dura y cómo se reparte

El video de referencia dura 44:55. Su arco (GUION-A-LAMINAS §6) es el de un webinar o video largo, y
**no se comprime**: una «clase» de 4 minutos no es una clase, es un resumen. Antes de escribir decide la
pieza y su duración: se deducen del pedido («la clase del lunes» = clase de 40-60 min, «un reel» =
30-60 s). Si no se pueden deducir, es la única pregunta.

## La regla de cálculo (sale de la referencia, no se inventa)

| Medida | Valor | De dónde sale |
|---|---|---|
| Ritmo de voz | 2.7 palabras por segundo (~160 por minuto) | la transcripción: ~7,000 palabras en 44:55 (`RITMO` en `scripts/lib/tiempos.mjs`) |
| Un beat (un paso) | 2 a 3 s; mediana 2.9 s | ANATOMIA, cambios visuales |
| Pasos por lámina | ~2.2 en promedio | el demo y la referencia |
| Lámina antes de cortar a cámara | mediana 9 s | ANATOMIA |
| Tiempo a cámara | ~12% | ANATOMIA |

**Cada paso sigue siendo un beat de 2 a 3 s en todas las piezas.** Lo que cambia es cuántos beats
lleva. En vivo, el orador avanza a mano (→) y su `voz` es la nota de ese beat: puede ampliarla un poco,
pero no se convierte cada paso en un bloque de 150 palabras, porque la lámina se quedaría quieta
medio minuto y se perdería el revelado frase por frase.

**Tramos en vivo sin láminas** (una demostración en pantalla, una actividad, preguntas): van como una
lámina `camara` con `"vivo": true`, la consigna en `texto` (y sus pasos en `items`) y `dur` en segundos
(`"dur": 300` = 5 minutos). En el presentador el público ve la consigna en blanco con una cuenta regresiva;
en el montaje sigue siendo un tramo a cámara (LAYOUTS.md, `camara`). Así cuentan en la duración sin inventar
beats, pero **no sustituyen beats**: una clase o un taller necesita sus beats aunque sume minutos con `dur`.
Más de 40% del tiempo en tramos avisa, y más de 60% con las láminas bajo la mitad de lo que toca es error,
también en vivo.

## Tabla por pieza

| Pieza (`"pieza"`) | Duración | Voz escrita | Beats | Láminas | Oferta | Llamado |
|---|---|---|---|---|---|---|
| `reel` | 30-60 s | 80-140 palabras | 12-20 | 8-12 | ninguna, sin oscuras | 1: guardar o comentar una palabra |
| `video` (YouTube) | 8-20 min | 1,300-3,200 | 170-410 | 75-190 | puente suave o ninguna | 1-2 |
| `vsl` | 8-20 min | 1,300-3,200 | 170-410 | 75-190 | el 25-30% final (GUION §7) | 2 o más |
| `clase` (en vivo) | 40-60 min | el guion completo en beats, más tramos en vivo con `dur` | 500-900 + tramos | 220-400 | sin oscuras; puente al siguiente paso | al final: comunidad, próxima clase o invitación suave |
| `webinar` | 60-90 min | el arco completo de la referencia, estirado | 1,000-1,600 + tramos | 450-700 | ~20% final, oscura solo la revelación | 3 o más |
| `propuesta` | 3-20 min (corta: 3-8 min, 20-60 láminas); normalmente `en_vivo` | 480-3,200 | 60-400 | 20-180 | inversión anclada + garantía o condición de salida + siguiente paso con vigencia | 1 |
| `tutorial` | 2-8 min | 330-1,300 | 40-160 | 16-60 | ninguna | 1 (con `"clase": true`, tarea + puente) |
| `vsl-corto` | 3-6 min | 480-970 | 60-125 | 25-55 | desde el 55-60%, 1 objeción antes | 2 |
| `clase-corta` (taller) | 15-30 min | el guion en beats, más tramos en vivo con `dur` | 200-450 + tramos | 90-200 | sin oscuras; puente al siguiente paso | al final |

La cuenta que usa QA: **duración ≈ palabras ÷ 2.7 + 0.35 × pasos**. 140 palabras en 20 pasos dan ≈ 59 s: por eso
el reel va hasta 140 palabras (con 160 pasaba de 60 s). Cada paso es un beat de 2-3 s: QA avisa (un solo aviso por
deck) si 15% o más de los pasos pasan de 5 s o si alguno pasa de 6 s, da error si uno pasa de 8 s (un párrafo con
la lámina quieta) y guarda en `qa.json → ritmo` la mediana y el p90 (la referencia va a 2.9 s).

`"pieza": "libre"` no tiene rango: apaga las revisiones de arco y de duración por pieza (y el aviso «fuera de
rango»); si hay `duracion_objetivo`, solo se compara la voz contra ese objetivo. Sirve para un deck con el número
de láminas fijo o de duración atípica.

`tutorial`, `vsl-corto` y `clase-corta` son arcos propios de piezas cortas, no el arco largo comprimido: un VSL
de 5 min no puede dejar la oferta para el 25% final, porque no le queda espacio para gancho, problema,
mecanismo y prueba. Si el encargo fija el número de láminas («18-30 láminas»), estima la duración antes de
escribir con **~6.5-9.5 s por lámina; planea con 7.5 s** (2.2 pasos × 2.9 s por lo bajo; el VSL de 30 láminas midió
4:41, ~9.4 s) y escoge la pieza con esta tabla en vez de forzar el objetivo sobre una pieza larga:

| Láminas fijadas | Pieza |
|---|---|
| 5-9 | `reel` |
| 10-15 | `libre`, o `reel`/`tutorial` ajustando la voz |
| 16-60 | `tutorial` (o `vsl-corto` si vende: 25-50) |
| 60-150 | `video` o `vsl` |
| 90-200 más tramos en vivo | `clase-corta` |

QA solo avisa fuera de 0.7 × el mínimo y 1.3 × el máximo de la pieza. Una **clase express** (menos de 15 min) es
`"pieza": "tutorial"` con `"clase": true`: no hay pieza aparte. La duración real la mide QA con la voz.

`"duracion_objetivo"` (minutos o `"mm:ss"`) manda sobre el rango de la tabla. QA estima la duración con
la voz (y los `dur`) y:

- da **error** si las LÁMINAS cubren menos de la mitad de su objetivo o del mínimo de su pieza (los
  tramos `camara` no cuentan para esto; con `"en_vivo": true` baja a aviso);
- da **aviso** si la voz total se aleja más de 30% del objetivo, si el objetivo cae fuera del rango de su
  pieza (una «clase» de 3 min es un `tutorial`; una de 25, una `clase-corta`), si más de 40% es cámara o
  tramos en vivo (la referencia va ~12%), si un reel pasa de 60 s o si la oferta de un VSL corto empieza
  después del 70%;
- da **error** si más de 60% son tramos en vivo y las láminas no cubren la mitad de lo que toca, aunque sea
  `en_vivo`: el deck es mayormente tramos sin lámina;
- avisa si CUALQUIER pieza de la tabla (reel, video, tutorial, propuesta, clase, VSL, webinar) termina sin
  llamado visible o siguiente paso en sus 3 últimas láminas, si una clase o un reel llevan láminas oscuras, si un
  reel lleva más de un llamado separado, si un VSL o webinar tiene menos de 2 llamados VISIBLES, si un `vsl` o
  `vsl-corto` pide actuar antes de la revelación oscura, si los llamados mezclan botón o link con palabra clave por
  mensaje, y si en un VSL o webinar ninguna lámina de los primeros 30 s trae la promesa («sin…») o el mecanismo con
  nombre (GUION §6.1). La oferta de un VSL corto empieza en la revelación oscura (sin oscura, en el primer `stack`): un
  botón temprano no cuenta como oferta. Un llamado
  visible es un botón, `llamado: true` o un texto que ARRANCA con verbo + objeto: la palabra clave marcada o en
  MAYÚSCULAS («Comenta ==DOBLE==», «Escríbeme **CITA** por WhatsApp», «Manda INFO al…»), «este/tu + algo»
  («Guarda este reel», «Agenda tu llamada») o un canal. `llamado: true` queda para lo que no empieza con verbo
  (una flecha al link). Una palabra suelta en la voz («WhatsApp», «aparta») no cuenta;
- en `propuesta` (los 9 bloques de abajo), avisa si no hay lámina de inversión (un monto, «inversión» o
  `{{PRECIO}}`), si no cierra con el siguiente paso (un llamado, o un `flujo`/`pasos` con «firmas», «agenda»,
  «arrancamos»…), si la inversión no trae el costo de no hacer nada en la misma lámina o en la anterior, si no hay
  una lista «No incluye», si no aparece fecha o vigencia, si no dice qué pasa si no funciona (garantía, condición de
  salida o riesgos), si no dice quién la imparte con una cifra SUYA (años, clientes, empresas, «desde 20XX»: «40
  personas» del cliente no cuenta), si no trae un caso o una prueba, y si los números del cliente salen de
  «Pongamos que…» sin `fuente` ni `{{…}}`. No se le piden capturas;
- en cualquier pieza, es **error** la escasez o urgencia escrita a mano («solo hoy», «Quedan solo 3 lugares»,
  «cierra mañana»): va con `{{CUPOS}}` o `{{FECHA_LIMITE}}` y su dato real (lo tachado o negado no cuenta, porque
  enseña lo que no se hace); avisa una garantía sin plazo ni condición («Garantía total», «Sin riesgo») y un bono del
  `stack` sin `{{BONO_N}}` o antes de las piezas base (GUION §7);
- en `vsl`, `vsl-corto` y `webinar`, avisa si no hay ninguna objeción («Objeción #N» o «Razón #N») antes del
  llamado de la oferta, si su voz afirma una frecuencia que nadie midió («la de siempre», «la que más oigo»), si no hay ninguna prueba real o la única es una maqueta, y si antes de la revelación no
  aparece una cifra de credibilidad (GUION §7).
- `qa.json → duracion` trae la voz total y, aparte, `laminas` y `camara`.
- `qa.json → estado`: `con errores` → `borrador` (datos por confirmar, sin errores) → `bajo-90` → `falta-venta` → `listo`.
  Un borrador con errores sale `con errores`; en borrador, `nota_sin_tope` y `listo_salvo_datos` dicen si quedan avisos.
  `falta_para_final` lista lo que le falta a una pieza de venta (prueba real, cifra de credibilidad, objeción antes
  del llamado, 2º llamado visible, llamado final, inversión). Solo `listo` se entrega como final; `qa.mjs
  --estricto` sale con 3 si no hay errores pero el estado no es `listo`.
- Un precio (o cualquier dato) que se deja a propósito para después se DECLARA en `datos`:
  `"PRECIO": { "pendiente": true, "motivo": "lo define dirección el lunes" }`. Se pinta como hueco `[PRECIO]`,
  pero cuenta como aviso y deja el deck en borrador (tope de 90), no como error.

## Las plantillas

Minutos por bloque. Cada bloque abre, si toca, con el mapa 1-2-3 (`pasos` con `activo`).

### Reel (30-60 s)
1. **Gancho de conflicto** (0-3 s): el conflicto concreto en la lámina 1 (el chat en visto, el número).
2. **Mapa o 3 beats** (3-45 s): los 3 errores o los 3 pasos, uno por lámina.
3. **Un solo llamado** (últimos 5 s): guardar 📌 o comentar una palabra 💬.

### Video de YouTube (8-20 min)
1. Gancho con los beats de retención de GUION §6.1 (0:00-1:30).
2. Credibilidad corta (≤ 1 min).
3. El problema y por qué falla la mayoría (2-4 min).
4. El mecanismo o el sistema 1-2-3, con demostración (4-10 min).
5. Prueba (1-2 min).
6. Cierre con un siguiente paso concreto.

### VSL (8-20 min)
1. Gancho (≤ 1 min) y credibilidad (≤ 1 min, con cifra real: años, clientes, eventos).
2. Problema y costo de no hacer nada (2-3 min).
3. Mecanismo con nombre (2-4 min).
4. Prueba real (1-2 min), o un sustituto de GUION §7 («Sin prueba real, en este orden»).
5. **Objeciones o razones antes de la oferta**: 2 si el VSL dura 8 min o más. Con la forma de GUION §2: `idea`
   con emoji negado, «Objeción #N» o «Razón #N» entre el emoji y la frase y la objeción en negrita; la
   respuesta va en la lámina siguiente, con un dato real o un paso concreto. Nunca pegada al botón. Salen del
   público real, no se inventan [34:17-36:00].
6. Oferta en el 25-30% final, beat por beat (GUION §7, «El orden en un `vsl`»): revelación, qué incluye, prueba,
   precio y garantía si los hay, llamado con qué pasa después, resumen y el llamado otra vez. Ningún «aplica» antes
   de la revelación y una sola acción en todos los llamados.

### Clase en vivo (40-60 min)
1. Gancho (≤ 2 min, GUION §6.1) y **contrato de tiempo**: qué se van a llevar en esta hora.
2. Mapa 1-2-3 de la clase.
3. **Tres bloques** de 10-15 min. Cada uno abre con el mapa, explica en beats, hace una demostración
   en vivo (`camara` con `vivo: true` y `dur`) y regresa al mapa.
4. **Tarea**: qué hacer hoy, con objeto (qué mandar, a quién).
5. **Puente al siguiente paso**: la comunidad, la próxima clase o una invitación suave, con su dato a la vista:
   CUÁNDO (fecha y hora, `{{PROXIMA_CLASE}}`) o CÓMO se entra (link, palabra clave o `boton` con destino,
   `{{COMUNIDAD}}`). Sin láminas oscuras.

### Webinar (60-90 min)
El arco completo de la referencia (GUION §6), estirado, con dos bloques más:
1. Gancho (≤ 2:30) y credibilidad.
2. **Para quién es y para quién no** (filtro, 1-2 min).
3. Criterios, comparación y revelación.
4. El sistema paso a paso, con demostraciones.
5. Objeciones (2-3).
6. Oferta en el ~20% final, beat por beat (GUION §7). Oscura solo la revelación; el llamado aparece 3
   veces o más.

### Tutorial (2-8 min)
También es la pieza de una **clase de menos de 15 min** («clase express» o taller): se marca con `"clase": true`
en el deck (no se deduce de `en_vivo`). Entonces el cierre son **dos beats obligatorios**: la tarea con objeto y el
puente a la próxima clase o la comunidad, con un dato real (`{{PROXIMA_CLASE}}`, `{{COMUNIDAD}}`) a la vista. QA avisa
«tarea sin puente» o «cierre sin tarea». El puente de una clase gratis lleva CUÁNDO (fecha y hora) y CÓMO se entra (link,
palabra clave o botón con destino): «Te espero» o «Nos vemos en la comunidad» sin dato avisan «puente sin dato» y dejan
el deck en borrador (`por_confirmar.PUENTE`), igual que quitar el puente. No hay pieza aparte.
1. El resultado a la vista en los primeros 10 s, o el error en vivo.
2. El mapa 1-2-3 si son 3 pasos o más.
3. Los pasos, uno por bloque, cada uno con su demostración (captura real, `objeto` con foto o `camara` corta). QA
   avisa «sin demostración» si el tutorial entero enseña solo con emojis y texto. Sin captura, una imagen generada
   con IA sin cifras vale para una escena de cómo se hace (el celular en cenital sobre la mesa), como `objeto` con
   `imagen`; nunca para un resultado ni como prueba.
4. Los errores comunes (una `lista` con tachones o una `idea` por error).
5. Un siguiente paso concreto, con objeto (1 llamado). Con `"clase": true`: la tarea («Tu tarea: sube tu
   encuesta») y, en la lámina siguiente, el puente (`idea` 📅 «Próxima clase: {{PROXIMA_CLASE}}» o un `boton`
   «Únete a {{COMUNIDAD}}»). `llamado: true` es para la flecha al link o la palabra clave, no para la tarea.

### VSL corto (3-6 min)
La apertura sigue la tabla de GUION §6.1 (la referencia da la promesa de 0:08 a 0:19, el nombre del mecanismo a
0:23 y el «te voy a enseñar a…» de 0:29 a 0:36): en un anuncio de 3-4 min los primeros 30 s deciden si se quedan.
1. **0:00-0:10, el conflicto o la escena concreta** (el gancho en `chat`, con la hora a la vista).
2. **0:10-0:25, la promesa**: resultado, plazo si es real, y su «sin…» (`idea` + `lista` «Sin:»), más el nombre del
   mecanismo entre «comillas» y __subrayado__, dicho de pasada («más de eso en un minuto»).
3. **0:25-0:35, a quién va dirigido** (el filtro «Es para ti si:») con una credibilidad breve (la cifra real o su
   `{{CLIENTES}}`).
4. Problema y costo de no hacer nada, ahora DESPUÉS de la promesa.
5. Cómo funciona el mecanismo: el qué, con el mapa 1-2-3 (no el cómo completo).
6. Prueba real o su sustituto (GUION §7, «Sin prueba real, en este orden»).
7. **Objeción y su respuesta**, antes de la revelación [34:17-36:00].
8. Oferta en el orden de GUION §7 («El orden en un `vsl` o `vsl-corto`»): revelación oscura entre el 55 y el 60%
   (QA avisa después del 70%), qué incluye (`stack`), precio y garantía si hay precio público, **llamado 1** con qué
   pasa después del clic, resumen y **llamado 2** al final. Ningún llamado antes de la revelación, y los dos con la
   misma acción (botón o link, o la palabra clave por WhatsApp).

### Clase corta o taller (15-30 min)
1. Gancho (≤ 1 min), contrato de tiempo y mapa 1-2-3.
2. **Dos bloques** en vez de tres, cada uno en beats con su demostración o actividad en vivo (`camara` con
   `vivo: true`).
3. Tarea con objeto y puente a la vista (la próxima clase con `{{PROXIMA_CLASE}}`, la comunidad o el programa): los
   dos, no uno u otro. El puente dice cuándo (fecha y hora) y cómo se entra (link, palabra clave o botón); sin ese
   dato el deck queda en borrador. QA los revisa en las 3 últimas láminas. Sin láminas oscuras.

### Propuesta (3-20 min; la corta, 3-8 min y 20-60 láminas, se presenta en vivo con conversación)
Nueve bloques. Se reenvía a directores que no estuvieron en la junta: el porqué va en la `voz` y se manda con
`laminas-notas.pdf` (`render.mjs --pdf`).
1. **Diagnóstico con los números del cliente**: vienen de la llamada de diagnóstico, con `fuente: "llamada de
   diagnóstico"` o como `{{CLAVE}}` en `"datos"` (pendiente si aún no hay llamada), o «se mide en la semana 1».
   Nunca «Pongamos que cada vendedor pierde 1-2 h»: la excepción de GUION §3.8 d es para clases y VSL.
2. **Costo de no hacer nada, en dinero u horas y con sus números**: «{{HORAS_PERDIDAS}} h × {{COSTO_HORA}} =
   {{COSTO_MES}} al mes». Es el ancla de la inversión.
3. **Solución y cómo funciona**, con una demostración si la hay (`chat`, `prueba` con material real, `boton`).
4. **Quién la imparte y prueba**: una cifra real de años, clientes o eventos («desde 2016, 23,000 clientes»), o un
   caso parecido al suyo con números y `fuente`. Si no hay, un sustituto de GUION §7 («Sin prueba real, en este
   orden»). Nunca inventada: sin dato, `{{CLIENTES}}` o `{{CASO}}` declarados como pendientes.
5. **Metas medibles**: «de {{HOY}} a …, medido en la semana N» (`cifra`, `linea-tiempo` o `tarjetas`).
6. **Alcance**: qué incluye (`stack` o `lista` ✅) y qué NO incluye (`lista` con encabezado «No incluye»).
7. **Inversión anclada**: una `cifra` con el costo del bloque 2 arriba y en gris, `{{PRECIO}}` grande y el desglose
   por persona, por día o en quincenas (LAYOUTS.md, `cifra`, «Inversión anclada»).
8. **Garantía o condición de salida** con plazo y condición medible (`idea` 🛡️ o `cifra` + `pasos`); si no la hay,
   «riesgos y cómo se cuidan».
9. **Siguiente paso con {{FECHA}} y vigencia {{VIGENCIA}}**: `flujo` «Firmas → Agendamos → Arrancamos» y la lámina
   del llamado con `"llamado": true`. Sin la regla de 2 llamados ni la de objeciones (se conversan en vivo).
