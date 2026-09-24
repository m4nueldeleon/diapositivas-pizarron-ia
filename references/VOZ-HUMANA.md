# Voz humana en una lámina de pizarrón

**Datos que faltan.** La pantalla y la voz se escriben como si el dato ya estuviera, con el hueco dentro: «Lo imparte {{FACILITADOR}}», «Arrancamos el {{FECHA_INICIO}}», «La inversión es {{PRECIO}}» o «Si en {{PLAZO}} no ves {{CONDICION}}, {{REMEDIO}}». Nunca «por confirmar», «pendiente de…», «falta ese dato», «confirmaremos» o «verificaremos» como sustituto del dato. El motivo va en `datos.X.motivo` y en la entrega, no en pantalla ni en voz. Las notas del PDF conservan la voz: aunque se llene el dato, una frase de pendiente escrita en prosa seguiría ahí (GUION §3).

Portado de `carruseles-virales-ia/references/COPY-VOZ-HUMANA.md` (§4-§6), recortado al tamaño de una
lámina. Aplica a la `nota` de remate, al `foco`, a los ítems y, antes que nada, **al guion**: la lámina
usa las mismas palabras que se dicen (GUION §3.5), así que una frase de IA se corrige en la `voz` y en la
lámina a la vez.

La referencia amplía la idea con un dato («Without having any previous business experience», «Complete
beginners are using to get paid as much as doctors») y en 45 minutos usa unas 3 construcciones «isn't…
it's». De ahí sale la regla: **máximo una antítesis por deck**.

## 1. Las fórmulas que delatan máquina

| Fórmula | Cómo suena | Reemplazo |
|---|---|---|
| Antítesis simétrica | «No es X. Es Y.» · «No te falta X, te falta Y» · «no se trata de» | Una afirmativa con número o con la consecuencia. |
| Cierre motivacional | «Todo empieza con…» · «Empieza hoy» · «Tú puedes» · «El momento es ahora» | Una acción con objeto: qué mandar, a quién, cuándo. |
| Pregunta retórica hueca | «¿La clave?» · «¿El resultado?» | Afirma. Una pregunta 🤔 solo si espera un «sí» concreto (GUION §7, beat 5). |
| Arranque de relleno | «Hoy en día» · «En la era digital» · «En el mundo actual» | Nada: empieza por el hecho. |
| Frase de folleto | «desbloquea tu potencial» · «al siguiente nivel» · «cambia las reglas del juego» · «el secreto es» · «la clave del éxito» | El verbo concreto y el número. |
| Muletilla de gancho | «…y ni cuenta te das» | El conflicto concreto: la hora, el mensaje, la cifra. |
| Tricolón decorativo | «rápido, confiable y escalable» | Dos o cuatro, o el dato. |
| Consenso inventado | «la objeción de siempre» · «la que más oigo» · «todos me dicen» · «siempre me preguntan» · «la mayoría me dice» | Sin frecuencia, como la referencia («a quick word of warning… reason number one»): «Objeción número uno: …» o «Quizá estés pensando: …». La frecuencia solo con un dato (`OBJECION_N` confirmado en `datos`). |

QA (`scripts/lib/reglas-deck.mjs`) avisa las fórmulas del catálogo, cuenta las antítesis del deck (más
de 1 es aviso), avisa el consenso inventado en la voz de una «Objeción #N» y de su respuesta, y lee «Palabras que
nunca usas» de MI-MARCA.md. Es aviso, no error: la última palabra
la tiene tu oído.

**La misma persona en voz y pantalla.** Antes de escribir el deck, declara `persona: "tu"` o
`persona: "ustedes"`. «Te sirve» no acompaña una voz que dice «ustedes»: reescribe ambas hacia
el mismo destinatario. Pantalla y voz hablan con la misma persona: su contradicción en el mismo paso es error aunque no se declare `persona`. No usa «su», «sus», «son» ni «van» sueltos para adivinar el destinatario. Las citas entre «…» quedan fuera. Frente a una sala es «ustedes»; los títulos-fórmula y los «tú» de uno a uno se quedan, marcados como excepción.
Para una lámina que habla a alguien distinto, usa `excepcion_persona` con `titulo-formula`,
`cita`, `a-si-mismo`, `a-la-ia` o `uno-a-uno` (GUION §1). Las frases fijas del deck van en `persona_excepciones`, comparadas sin mayúsculas ni acentos.

Al cambiar «TÚ SÍ» por **«USTEDES SÍ»**, vuelve a medir la lámina: ocupa más ancho. Comprueba
saltos de línea y encuadre en el formato final, además de oír la frase en el ensayo.

## 2. Antes y después (casos reales del loop de calidad)

| Antes | Después |
|---|---|
| «Esperar no es una estrategia.» | «Cada día sin mensaje son 0 pláticas nuevas.» |
| «No le vendes a todo el mundo: le vendes a quien tiene el problema hoy.» | «Le vendes a quien tiene el problema **hoy**: 10 nombres de tu WhatsApp.» |
| «Todo empieza con 1 mensaje. Mándalo hoy.» | «Manda este mensaje a 3 contactos antes de las 8 pm.» |
| «No te falta vender. Te falta contestar.» | «6 de cada 20 preguntaron precio y se quedaron en visto.» |
| «Eso no cierra la venta: la despide.» | «Con «ok, gracias» la plática termina ahí.» |
| «Estás perdiendo ventas por WhatsApp… y ni cuenta te das.» | «¿Precio? → $1,500 → visto. Así se pierden.» |

## 3. Los movimientos para reescribir (de COPY-VOZ-HUMANA §5)

1. **Quita el arranque y entra por el hecho.** La lámina empieza en lo más concreto que tengas.
2. **Añade un ejemplo concreto o un hecho acreditado.** Nunca inventes una cifra para sonar real.
3. **Cambia el adjetivo por el dato.** Donde diga «clave» o «poderoso», ¿qué número estabas evitando?
4. **Baja de registro.** Como habla la persona de MI-MARCA: «platicar», «ya quedó», «chamba».
5. **No finjas humanidad.** Nada de errores o anécdotas inventadas.
6. **Léelo en voz alta.** Si te tropiezas o te da pena decirlo frente a alguien, se cambia.

## 4. Ortografía que delata máquina (de COPY-VOZ-HUMANA §6)

- Sin raya larga (—) como conector: punto o dos puntos.
- Comillas angulares o rectas, nunca curvas inglesas.
- Mayúscula solo en la primera palabra y en nombres propios: «Cómo cerrar por WhatsApp», no «Cómo
  Cerrar Por WhatsApp».
- Español antes que anglicismo: embudo, gancho, guardados. Los nombres de herramientas se quedan.
- Números con coma de miles y el porcentaje pegado: «1,500», «20%».
