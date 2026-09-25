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
| `reel` | 30-60 s | 80-140 palabras | 12-20 | 6-12 | ninguna, sin oscuras | 1: guardar o comentar una palabra |
| `video` (YouTube) | 8-20 min | 1,300-3,200 | 170-410 | 75-190 | puente suave o ninguna | 1-2 |
| `vsl` | 8-20 min | 1,300-3,200 | 170-410 | 75-190 | revelación al 55-60% de duración; oferta en el resto (GUION §7) | 2 o más |
| `clase` (en vivo) | 40-60 min | el guion completo en beats, más tramos en vivo con `dur` | 500-900 + tramos | 220-400 | sin oscuras; puente al siguiente paso | al final: comunidad, próxima clase o invitación suave |
| `webinar` | 60-90 min | el arco completo de la referencia, estirado | 1,000-1,600 + tramos | 450-700 | ~20% final, oscura solo la revelación | 3 o más |
| `propuesta` | 3-20 min (corta: 3-8 min, 20-60 láminas); normalmente `en_vivo` | 480-3,200 | 60-400 | 20-180 | inversión anclada + garantía o condición de salida + siguiente paso con vigencia | 1 |
| `tutorial` | 2-8 min | 330-1,300 | 40-160 | 16-60 | ninguna | 1 (con `"clase": true`, tarea + puente) |
| `vsl-corto` | 3-6 min | 480-970 | 60-125 | 25-50 | desde el 55-60%, 1 objeción antes | 2 |
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
| 6-12 | `reel` solo sin otra pieza nombrada y en 9:16 (11 láminas miden ~55 s) |
| 13-15 | `tutorial` o `libre` |
| 16-24 y vende | `vsl-corto` compacto: revelación al 55-60 %, una objeción antes |
| 16-60 que no vende | `tutorial` (si vende con 25-50 láminas: `vsl-corto`) |
| 60-150 | `video` o `vsl` |
| 90-200 más tramos en vivo | `clase-corta` |
| una pieza larga pedida (webinar, clase, VSL) con MENOS láminas que su mínimo | su versión corta: webinar o VSL → `vsl-corto`; clase → `clase-corta`, o `tutorial` con `"clase": true`; conserva la modalidad en vivo salvo pedido grabado/evergreen/anuncio |

**Nunca se cambia la pieza en silencio.**

La conversión cambia la duración y la pieza, no la modalidad: un webinar o una clase convertido a `vsl-corto`/`clase-corta` conserva `"en_vivo": true` salvo que el pedido diga grabado, evergreen o anuncio. Si el autor decide que es video, lo dice: «lo armo como vsl-corto grabado». Un VSL pedido como VSL sigue sin `en_vivo`; un webinar evergreen tampoco se vuelve en vivo.

«Un webinar de 30 láminas» son ~3.5-4.5 min (láminas × 7.5 s), no 60-90: se arma
como `vsl-corto` (la parte de la oferta del webinar) y se dice ANTES de escribir, en una línea, con la duración estimada
(«30 láminas son ~4 min, no un webinar de 60-90: lo armo como `vsl-corto`»). En un loop o un agente de fondo, donde no
se puede preguntar, esa línea va en la entrega y en `_comentario`. Del webinar se conservan, dentro del `vsl-corto`, las
2 objeciones y un beat de filtro («para quién no es») antes de la revelación. Es una recomendación del arco: QA no la
revisa.

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
- `qa.json → arco` trae las métricas que antes se cuadraban a mano: el **contrato de tiempo** (`contrato`: sus minutos,
  la lámina y si se marcó con `"contrato": true` o se detectó), la voz (`duracion_s`) y el desvío en %; en piezas con
  oferta, `oferta.revelacion_lamina`, `revelacion_pct` e `inicio_pct`; y cada llamado visible con su lámina y su %. QA
  lo imprime en una línea («arco: contrato 4:00 (lám 4) · voz 3:24 (-15 %) · revelación 59 % · llamados lám 25 (83 %)…»).
  Avisa si la voz se aleja más de 30% de lo que promete el contrato, y si una clase, clase corta, webinar o clase
  express no trae contrato de tiempo.
- avisa el mapa repetido seguido y el que vuelve sin nada nuevo (arriba, «Las plantillas»); en `vsl`, `vsl-corto` y
  `webinar`, la respuesta a una objeción que solo afirma (GUION §2); y en un reel que promete un cómo sin enseñarlo a la
  vista (`falta_para_final`: «el cómo a la vista»).
- `qa.json → prueba` dice de dónde sale la prueba: `propia` (captura o caso del creador), `mercado` (un dato publicado de
  terceros), `logica` o `garantia`. La de mercado cuenta para final, pero en un vsl o webinar avisa: respalda la
  oportunidad, no tu resultado (GUION §7 c).
- `qa.json → estado`: `con errores` → `borrador` (datos por confirmar, sin errores) → `bajo-90` → `falta-venta` → `listo`.
  Un borrador con errores sale `con errores`; en borrador, `nota_sin_tope` y `listo_salvo_datos` dicen si quedan avisos.
  `falta_para_final` lista lo que le falta a una pieza de venta (prueba real, cifra de credibilidad, objeción antes
  del llamado, 2º llamado visible, llamado final, inversión). Solo `listo` se entrega como final; `qa.mjs
  --estricto` sale con 3 si no hay errores pero el estado no es `listo`.
- Un precio (o cualquier dato) que se deja a propósito para después se DECLARA en `datos`:
  `"PRECIO": { "pendiente": true, "motivo": "lo define dirección el lunes" }`. Se pinta como hueco `[PRECIO]`,
  pero cuenta como aviso y deja el deck en borrador (tope de 90), no como error.

## Siembra y pago

En `vsl`, `vsl-corto`, `webinar`, `clase` (incluida la clase express) y `reel`, el objeto del gancho vuelve en el tramo final, antes o junto al llamado, con el mismo diseño y emoji: resuelto (el mismo chat contestado, el reloj libre) o reafirmado. Como en [44:15, 44:35], puede regresar el muro de prensa del gancho y repetirse la frase del mecanismo. Un pago por deck basta; puede ser la lámina del llamado. Márcalo con `paga: "<id-del-gancho>"` o reutiliza el objeto con `como`: el último 25 % remite al primer 20 %.

## Las plantillas

Minutos por bloque. **El mapa 1-2-3** (`pasos` con `activo`) es un separador entre bloques largos: en la referencia
presenta el sistema [16:35] y vuelve cada 5-6 min [17:19 → 23:08 → 28:01].

- El mapa entra **una vez, con el primer paso ya activo** (`activo: 1`). Nunca un mapa completo seguido del mismo mapa
  con `activo: 1`: es la misma lámina dos veces (QA avisa «mapa repetido seguido»).
- Un regreso al mapa se justifica si trae algo nuevo: **el titular del bloque en `texto`** («La IA te hace __la
  minuta__»), el patrón del reel, donde mapa y rótulo son una sola lámina. Un regreso SIN texto va solo cuando el bloque
  anterior tuvo 3 láminas o más y 20 s de voz o más; si no, el avance va dentro de la lámina del bloque (el mapa con su
  titular, o una nota gris «Paso 2 de 3»). QA avisa «el mapa vuelve sin nada nuevo» (mapa → cita → mapa → reto → mapa).
- En piezas largas (clase, video, webinar) el regreso sin texto se mantiene: cada bloque dura minutos, como en el
  original.

### Reel (30-60 s)
Modelo: **`ejemplos/reel/`** (9:16, 11 láminas, ~55 s). Recetas de tamaño en LAYOUTS.md, «Recetas 9:16».
1. **Gancho de conflicto** (0-3 s): el conflicto concreto en la lámina 1 (el chat en visto, el número, la hora).
2. **Mapa o 3 beats** (3-45 s): los 3 errores o los 3 pasos. El mapa entra una vez ya en el paso 1 y vuelve con el
   titular de cada bloque; cada beat lleva 1-2 láminas.
3. **Un solo llamado** (últimos 5 s): guardar 📌 o comentar una palabra 💬.

- Si el reel promete tareas, pasos o un «cómo» («puedes», «pasos», «delegar», «prompt»), **cada beat enseña algo que se
  puede hacer a la vista**: el prompt literal y corto en un `chat` (el mensaje `de: "yo"`), la captura o la foto del
  paso. Un botón «Enviar» solo no enseña qué escribir. QA lo avisa y lo pone en `falta_para_final` («el cómo a la
  vista»): el deck no sale `listo`. Un reel de opinión o de «3 errores» no promete un cómo y no se revisa.
- Una condición legal o de consentimiento («con permiso de todos», «con su autorización») va **en pantalla**, no solo en
  la voz: la lámina «Grabas la junta» sin ella enseña a grabar a escondidas.
- «Guarda este reel» solo si hay algo que guardar a la vista (los prompts, la lista). Si no, «Comenta PALABRA 💬» con
  `datos.ENTREGABLE` declarado (o pendiente).
- Si nombras una herramienta, va su logo real o un hueco declarado (SKILL, regla 10), nunca un emoji en su lugar.

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
   respuesta va en la lámina siguiente y DEMUESTRA: su primera lámina no es una `idea` que afirma (GUION §2, tabla
   «objeción → respuesta»). Nunca pegada al botón. Salen del público real, no se inventan [34:17-36:00].
6. Revelación entre el 55 y el 60% de la duración y oferta en el resto, beat por beat (GUION §7, «El orden en un `vsl`»): revelación, qué incluye, prueba,
   precio y garantía si los hay, llamado con qué pasa después, resumen y el llamado otra vez. Ningún «aplica» antes
   de la revelación y una sola acción en todos los llamados.

### Clase en vivo (40-60 min)
1. Gancho (≤ 2 min, GUION §6.1) y **contrato de tiempo**: qué se van a llevar en esta hora.
2. Mapa 1-2-3 de la clase.
3. **Tres bloques** de 10-15 min. Cada uno abre con el mapa (con bloques de 10-15 min el regreso sin texto siempre
   se justifica), explica en beats, hace una demostración en vivo (`camara` con `vivo: true` y `dur`) y regresa al mapa.
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

Con N láminas, presupuesta la revelación en ≈ 0.55-0.60 × N. Quedan ≈ 0.4 × N para stack, prueba, precio, dos llamados y pago del gancho. Verifica también el porcentaje de duración con QA: no todas las láminas duran igual.

El rango **55–60% aplica tanto a `vsl` como a `vsl-corto`**. La duración cambia la profundidad de la demostración, no el lugar de la revelación. El 25–30% final que antes se indicaba para `vsl` dejaba sin tiempo la explicación completa de la oferta y se sustituye por este rango. QA mide el inicio de la primera revelación oscura contra la duración total sin redondear; estar fuera del rango produce aviso también antes del render. `propuesta` conserva sus nueve bloques y `webinar` su arco propio: esta regla no los convierte en VSL.

La apertura sigue la tabla de GUION §6.1 (la referencia da la promesa de 0:08 a 0:19, el nombre del mecanismo a
0:23 y el «te voy a enseñar a…» de 0:29 a 0:36): en un anuncio de 3-4 min los primeros 30 s deciden si se quedan.
1. **0:00-0:10, el conflicto o la escena concreta** (elige un arquetipo de GUION §6.1; si es chat, con la hora a la vista).
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

Pantalla y voz llevan la frase resuelta con `{{CLAVE}}`; el motivo de lo que falta vive solo en `datos.X.motivo` y la entrega (GUION §3). Capa roja: sello en garantía confirmada, óvalo en inversión y tachado o ✕ en «No incluye:»; ver ESTILO §5.

1. **Lo que les pasa hoy, con sus números**: escena concreta que reconozcan (quién, qué hace mal y cuándo), su consecuencia y su número, con `fuente: "llamada de diagnóstico"` o `{{CLAVE}}` en `datos`. La escena escrita es obligatoria aunque falten números. Entrevistas y autoevaluación son actividades de solución o `linea-tiempo`, no el problema. La portada lleva el resultado o el costo para el cliente, no solo el programa; el problema aparece a más tardar en la lámina 3 y no hay temario antes.
   Nunca «Pongamos que cada vendedor pierde 1-2 h»: la excepción de GUION §3.8 d es para clases y VSL.
2. **Costo de no hacer nada, en dinero u horas y con sus números**: «{{HORAS_PERDIDAS}} h × {{COSTO_HORA}} =
   {{COSTO_MES}} al mes». Es el ancla de la inversión.
3. **Solución y cómo funciona**, con una demostración si la hay (`chat`, `prueba` con material real, `boton`).
4. **Quién la imparte y prueba**: una cifra real de años, clientes o eventos («desde 2016, 23,000 clientes»), o un
   caso parecido al suyo con números y `fuente`. Si no hay, un sustituto de GUION §7 («Sin prueba real, en este
   orden»). Nunca inventada: sin datos, una sola `idea` con `{{CREDENCIAL}}` declarado, no una lista de tres huecos.
   El sustituto de primeros casos se anuncia aquí, **antes de la inversión**, y lleva una garantía medible (condición, plazo real y devolución o salida sin penalización), desarrollada aquí o en el bloque 8. También vale presentar esa garantía completa aquí. Una garantía presentada solo al final, sin anunciar primeros casos, no cubre el bloque 4. QA no exige inventar años o clientes cuando este sustituto ya está presente. Una captura ficticia por sí sola nunca acredita trayectoria; una hipótesis sobre pérdidas del cliente tampoco sustituye este bloque.
5. **Metas medibles**: «de {{HOY}} a …, medido en la semana N» (`cifra`, `linea-tiempo` o `tarjetas`).
6. **Alcance**: qué incluye (`stack` o `lista` ✅) y qué NO incluye (`lista` con encabezado «No incluye:»).
7. **Inversión anclada**: una `cifra` con el costo del bloque 2 arriba y en gris, `{{PRECIO}}` grande y el desglose
   por persona, por día o en quincenas (LAYOUTS.md, `cifra`, «Inversión anclada»).
8. **Garantía o condición de salida** con plazo y condición medible (`idea` 🛡️ o `cifra` + `pasos`); si no la hay,
   «riesgos y cómo se cuidan».
9. **Siguiente paso con {{FECHA}} y vigencia {{VIGENCIA}}**: `flujo` «Firmas → Agendamos → Arrancamos» y la lámina
   del llamado con `"llamado": true`. Sin la regla de 2 llamados ni la de objeciones (se conversan en vivo).


Tutorial, paso 3: una imagen con `procedencia: "ia"` puede ser la escena del cómo; jamás prueba propia ni resultado.
Las capturas de respuestas reales de IA llevan `fuente` con nombre de la IA y fecha; los ejemplos se declaran.

Reel: el cómo es el texto literal (el prompt para la IA o el guion de respuesta para el cliente) en un `chat`.
Usa `guion: true` o un encabezado de respuesta («Puedes responder así:», «Dile», «Copia») o terminado en dos puntos.
Debe haber un mensaje `de: "yo"` con texto. Una lista de imperativos no lo sustituye. El gancho abre con conflicto
concreto: hora, cifra, chat, cita o captura. La lista de quiénes cuentan para credibilidad vive en GUION §7.

Las herramientas de una escena usan sus logos reales; si falta uno, declara `imagen: "{{LOGO_X}}"` (regla 10).

En vivo, el **cómo se entra** es un `qr`, una URL corta grande (≥ 64 px) o una palabra clave. El `boton` lleva debajo una URL corta ≥ 64 px (`{{URL_CORTA}}` si falta) o «Escribe PALABRA en el chat». En sala se suma `qr`; `si_falla`: «pega el link en el chat». La voz dice la URL o la palabra. Un botón por sí solo sirve en video o PDF; en una sala o por Zoom necesita una forma de acceso que el público pueda usar. La receta del QR está en LAYOUTS.md.

En las plantillas de mapa, activo y texto iguales en dos láminas seguidas repiten la misma lámina. Si activo avanza, falta contenido entre bloques: añade al menos una lámina o une los mapas.

### Demostración visible por bloque práctico

En `bloques`, marca `practico: true` y delimita sus láminas por id. Cada bloque debe mostrar el trabajo:
una captura o archivo de ejemplo legible, o un recorrido concreto con entrada, acción y resultado.
Una conversación puede demostrar qué escribir y qué respuesta permite continuar. Para enseñar a
descargar un archivo, muestra el archivo, el control de descarga y el resultado abierto: un chat
que solo promete descargarlo no acredita esa demostración. «Duda → Demostración → Comprobación»,
un emoji, una cámara sin acción comprobable o la descripción de una herramienta no bastan.
Las capturas de ejemplo enseñan el procedimiento; nunca acreditan resultados comerciales.
QA comprueba recursos visibles por bloque declarado; el revisor comprueba su relación con el objetivo.
