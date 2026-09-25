# Reglas del autor

Lo que ya se decidió al escribir un deck. **Manda sobre ESTILO.md y LAYOUTS.md.** Se lee entero antes de la primera
lámina; son reglas, no historia. El porqué y cómo se detectó cada una está en [LECCIONES.md](LECCIONES.md), que es el
historial del motor (para quien lo modifica).

Cuando el usuario corrija algo, la regla va aquí en una línea y su historia en LECCIONES.md, antes de cerrar el turno.

## La pieza

- Antes del guion se fija la pieza y su duración (ARCOS.md). Una clase o un webinar no se comprimen a 4 minutos, y la
  pieza no se cambia en silencio: 30 láminas no son un webinar.
- Una promesa de tiempo se cumple: si la clase dice 10 minutos, dura 10.
- En los primeros 25 s, después del gancho, va la promesa con su «sin…» y el nombre del mecanismo. El problema va
  después.
- La revelación cae en `vsl-corto` al 55-60 % y en `vsl` al 75-82 %. Antes de ella no hay ningún llamado.
- La oferta sigue su orden: objeción y respuesta → revelación → qué incluye → prueba → precio y garantía → llamado con
  qué pasa después → resumen → el MISMO llamado. Hay una sola acción por pieza: botón o palabra clave, no las dos.
- Una `propuesta` sigue los 9 bloques de ARCOS, no el arco de un VSL. Los números del cliente van como huecos
  declarados.
- Una clase cierra con tarea y puente: cuándo o cómo se entra.
- Un reel que promete un «cómo» enseña el cómo a la vista (el prompt literal). «Guarda» solo va si hay algo que
  guardar.

## Guion y voz

- `voz` lleva **una frase por paso**, y esa frase nombra lo que aparece en ese paso.
- Se comprime: ≤ 22 palabras por lámina, una negrita y un énfasis.
- Una objeción que el usuario no dio va como `OBJECION_N` propuesta («Objeción número uno: …»), nunca como «la que más
  oigo».
- Una objeción compuesta («¿pago hoy y en efectivo?») se responde parte por parte.
- La respuesta a una objeción DEMUESTRA con otro diseño: `flujo`, `chat`, `linea-tiempo`, `cuadrantes` o `prueba`. La
  `idea` de frase va después, como remate.
- Una demostración enseña entrada → transformación → salida utilizable. Un saludo con «[nombre]» no demuestra nada.
- No se inventan cifras, casos, frecuencias ni resultados. Lo que falta se escribe `{{CLAVE}}` en `datos` o se marca
  `pendiente: true`. Los datos por confirmar bloquean producción (`--borrador` para verlos).
- `credibilidad: true` declara una intención; no acredita nada. Una plantilla vacía no es prueba.
- Un dato publicado de terceros es prueba de MERCADO: respalda la oportunidad, no el resultado del producto. Lleva
  medio y fecha.
- Un ejemplo inventado se rotula como ejemplo, en cualquier pieza: `procedencia: "ejemplo"`, `ejemplo: true` o la
  fuente real. Esto vale en especial para un chat con `paga` o con sello de resultado.
- Nunca copies credenciales, cifras, casos ni frases de otro deck, de un modelo o de un evento. Del modelo se copia el
  mecanismo, no el dato.
- La voz se revisa entera como texto publicable, sin fórmulas de IA (VOZ-HUMANA.md).

## La lámina

- Frase a 84-90 px (76 px si pasa de 15 palabras). Emoji de 200-250 px. Un solo punto focal.
- La capa roja lleva una marca por lámina, dos como máximo. Cada 4-6 láminas cae un golpe fuerte: sello, tachón,
  llave, flecha con nota, óvalo o escala. La nota gris no cuenta como capa roja.
- Lo que se tacha se lee antes: `tachar_paso`. El tachón ya niega, así que no lleva además un «no».
- Una anotación agrega consecuencia, precisión, contraste o veredicto. Si repite la frase con otras palabras, sobra.
- El mapa 1-2-3 entra una vez con `activo` y vuelve con `"como"` y el titular de su bloque. Solo vuelve vacío tras un
  bloque de 3 láminas y 20 s. Un `no:` nunca niega un paso del mapa ya mostrado.
- ✅ solo afirma inclusión o algo hecho. Los planes y los pendientes llevan número o su emoji literal.
- Los emojis salen de EMOJIS.md, un concepto por emoji: 💬 es comentar, 📲 es «te llega al celular», 📞 es sesión en
  vivo, 🗄️ es archivar y 🚨 es lo urgente.
- Para una marca real se usa su logo real, nunca un emoji ni uno dibujado.
- El `lado` que escribes para una nota se respeta. El motor solo lo cambia si no cabe.
- Una lista de dos a cinco renglones cortos se centra. Para continuar arriba se declara `anclar: "arriba"`.

## El chat

- Una idea por burbuja: como máximo 3 renglones en 16:9 y 4 en 9:16. Si es más largo, se parte en varios mensajes.
- Los chats son como máximo el 45 % del deck. Si hay más, cambia uno por `tarjetas`, `flujo` o una `idea` con cita.
- En 9:16 la letra no baja de 64 px. Si no cabe, la conversación va en dos láminas.
- `sello_sobre: "mN"` pone el sello sobre la burbuja que califica. `paga` resuelve en el cierre el gancho del
  principio.
- Las horas de los mensajes son ambientación y van a ~44 px. No pongas en `hora` un dato que se tenga que leer: ese
  dato va en el mensaje o en una nota.
- Dentro de un celular (`marco: "celular"`) caben de 1 a 3 mensajes cortos, sin avatares. La conversación se asienta
  abajo, como en un teléfono.

## Entregar

- Corre `armar.mjs` hasta que diga `listo` y luego mira **todas** las hojas (`hoja-01.jpg`…): un 100 automático no
  sustituye tus ojos.
- La primera nota es la de `primer_render` y no se reemplaza. Si retocas después, dilo.
- Nunca quites un beat de venta (caso, prueba, precio, garantía, llamado) ni un hueco declarado para subir la nota.
- Si una regla de QA contradice un cuadro de la referencia, gana el cuadro. Repórtalo, no lo esquives.
