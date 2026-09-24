# Diccionario de emojis

Regla: **literal, universal y constante**. Mismo concepto, mismo emoji en todo el deck, **y un emoji =
un concepto** dentro del deck: no uses dos emojis que se ven casi iguales (🧑‍💼/👨‍💼) para
conceptos distintos, ni el mismo emoji para dos cosas. Cada emoji de este diccionario tiene un solo
concepto. El contraste de cada uno está **medido** en los dos sets y tres fondos con
`scripts/medir-emojis.mjs` (`scripts/lib/contraste-emojis.json`), y QA lo revisa (ver «Bajo contraste»).
Este archivo es la **única fuente de verdad**: los demás documentos remiten aquí, y
`pruebas/emojis-coherencia.test.mjs` falla si un emoji queda en dos filas de concepto distintas o si otro
documento cita un emoji que no está aquí.

**Fija el diccionario del deck antes de escribir las láminas**: qué emoji es cada concepto, y que ninguno diga
lo contrario en otra lámina. QA lista en `qa.json → iconos` dónde sale cada emoji y avisa dos cosas: dos emojis
que se ven casi iguales en el mismo deck («Parecidos», abajo) y un rol contrario (la base de una `rejilla` de
asistencia es «vacío»: no puede salir después como `si:🪑` «sí llegaron»).

## Qué set usar
- **`"emoji": "apple"`** cuando los PNG o el video se exportan en una Mac (la laptop o el mini, que también
  es Mac). Es el más fiel a la referencia.
- **`"emoji": "fluent"`** cuando se renderiza en Linux, un VPS o la nube, o cuando el HTML del presentador se
  comparte para abrirse en otros equipos.
- **Un solo set por deck**, escrito en el deck. `auto` (apple en Mac, fluent en lo demás) queda como respaldo
  heredado: el mismo deck cambia de familia según la máquina. Con `auto`, QA revisa los DOS sets y avisa lo
  que se pierde en el otro («deck en emoji "auto": en fluent se pierde 💭 → 💡»).
- Lo que cambia de un set a otro está en «Ojo: se ven distinto según el modo» y en «Bajo contraste».

## Dinero y negocio

**El emoji lleva el mismo signo que la frase.** «Mismo trabajo. Menos ganancia» o «Pierdes dinero
cada mes» no llevan 💰, 📈 ni 💎 sin una negación: el ícono afirma lo contrario. QA avisa estos casos
estrechos; «Gana más trabajando menos» y «Tus ventas no bajan más» no son frases de pérdida.

Si necesitas un vocabulario propio, declara `conceptos` en el deck: por ejemplo,
`{"💰":"ganancia","📉":"pérdida"}`. QA avisa si dos emojis declaran el mismo concepto y agrega
una sola línea informativa cuando falta declarar alguno usado. Sin `conceptos` no exige completar
ese mapa. El inventario puede señalar `revisar: N etiquetas` cuando un mismo emoji acompaña
varias etiquetas cortas; es información para revisar el sentido, no una penalización.

| Concepto | Emoji | Notas |
|---|---|---|
| dinero, ganancia | 💰 | bolsa: el más usado |
| dinero que se va, gasto | 💸 | billetes con alas |
| ingresos recurrentes | `flujo` 🔁 → 💰 | dos nodos, no insignia |
| crecimiento | 📈 | |
| caída o pérdida | 📉 | |
| métricas, datos, reporte, informe | 📊 | |
| banco, tu cuenta | 🏦 | |
| precio, pago, efectivo, oferta | 💵 · 🏷️ solo en Fluent | el 🏷️ de Apple es beige pálido y se pierde |
| comprobante, recibo | 🧾 | SVG blanco con borde dentado, renglones grises y total verde; sin texto impreso en los dos sets |
| producto | 📦 | |
| producto digital (ebook, plantilla) | 💻 · 📘 | el curso o programa es 🎓 |
| alianza, trato, socio | 🤝 | como en la referencia: «1 Partnership» [10:30], «Partner» (ref_1040). La venta cerrada es `si:🤝` o 💵: 🤝 solo, sin marca, no es venta |
| cliente | 🧑‍💼 | |
| empresa | 🏢 | |
| empleo o sueldo fijo | 👔 | |
| apostar | 🎰 | |
| dropshipping, envío de producto | 🚚 | |
| venta de alto ticket, servicio caro | 💼 | |
| ahorros | 🐷 | alcancía |
| el mejor | 🏆 | |
| meta, foco | 🎯 | |
| calidad premium | 💎 | |

## Personas
| Concepto | Emoji |
|---|---|
| tú, el alumno | 🧑‍💻 (resaltado en la multitud) |
| audiencia, comunidad | 👥 · una `rejilla` de 👤 |
| creador de contenido | `🧑+🎥` (una persona con cámara: el «Creator» del video es una persona entera [12:45]; con `piel` la persona lleva el tono; en lámina oscura con Apple, 🧑 con 📹) |
| creador sin cara, faceless | `👤+🎥` |
| experto, consultor o maestro | 🧑‍🏫 |
| médico o profesionista | 🧑‍⚕️ |
| principiante | 🐣 |
| equipo | 🧑‍🤝‍🧑 |
| perdido, confundido | 😵‍💫 |
| sin mostrar la cara | `no:🙅‍♂️` (ref_628: 🙅🏻‍♂️ con ❌ para «Showing your face online»; `no:🎥` es «sin grabar video») |
| levanta la mano: pide algo, «te avisa», pasa a un humano | 🙋 |

**Tono de piel.** En el video las personas protagonistas llevan tono humano y casi siempre la variante
masculina: 👨🏻‍⚕️ [ref_10], 🙅🏻‍♂️ [ref_628], 💁🏻‍♂️ «You» [12:45], 🕵🏼 [17:20], 👨🏻‍💻 [35:40]. Las siluetas (👥 👤) y
algún secundario van sin tono (el «Creator» 👨‍💻 amarillo junto al «You» con tono, 12:45): el video mezcla, así
que QA no avisa por mezcla. Pon `"piel": "🏻"` en el deck (o tu tono): cada persona sin tono escrito lo recibe
(🧑‍⚕️ → 🧑🏻‍⚕️, `no:🙅‍♂️` → 🙅🏻‍♂️, 🧑‍🤝‍🧑 → 🧑🏻‍🤝‍🧑🏻); las manos (🤝 👆 ✍️) no cambian; un tono escrito a mano en el deck siempre gana y `"ninguno"` lo apaga.
En Fluent, si el tono no existe en el set, sale la forma sin tono y QA lo avisa como «aproximado».
**Fluent 1.1.0 trae 🏼 y 🏽 cruzados** en casi todas las personas y manos (el archivo 🏼 de 🧑‍🏫 es moreno y el 🏽
rubio; solo 🧑‍💻 👨‍💻 👩‍💻 y 🧑‍🤝‍🧑 vienen en orden). La skill pide el archivo correcto con `scripts/lib/tonos-fluent.json`
(medido por `node scripts/medir-tonos-fluent.mjs`; vuelve a correrlo si cambia la versión del CDN): ya no hace falta
el rodeo de usar 🏾.

## Acciones y proceso
| Concepto | Emoji |
|---|---|
| encontrar, buscar | 🔍 [16:40, «Find»] |
| identificar, detectar a alguien | 🕵️ (ref_1040, «Identify») |
| construir | 🛠️ |
| lanzar | 🚀 |
| automatizar, IA | 🤖 |
| pocos clics | 👆 (suelto o como nodo de un `flujo`; nunca dentro de un `boton`, donde el cursor ya es la mano. El 🖱️ de Apple es un mouse blanco sobre blanco) |
| escribir, plan, minuta, notas de una junta | 📝 |
| tu método, el mapa del sistema | 🗺️ |
| enviar mensaje, «te escriben» | 📲 (se lee «te llega al celular»; se dibuja en SVG con volumen) · 📩 en Apple |
| llamada, videollamada, llamada de diagnóstico, la llamada o sesión en vivo del programa (1 a 1 o grupal, semanal: «4 llamadas en vivo») | 📞 · ☎️ en láminas oscuras (el 📞 de Apple se hunde en el negro). La llamada en sí es 📞 también en el stack; 📅 solo cuando se habla de su fecha u horario |
| fecha, agenda, horario fijo, la cita («mismo día, misma hora»), una junta o reunión en la agenda | 📅 (la llamada en sí es 📞: 📅 solo para la fecha o el horario; en Apple se dibuja en SVG, un calendario SIN fecha: el de Apple imprimía «JUL 17»; en Fluent sale el 3D nativo, que no trae fecha) |
| grabar video, hacer contenido | 🎥 [ref_628, «Creating Content»] · 📹 en lámina oscura con Apple (el 🎥 de Apple se hunde en el negro) |
| orientación, rumbo: «te orientamos», tu plan | 🧭 |
| aprender | 🧠 |
| rápido | ⚡ |
| tiempo, espera | ⏳ · ⏱️ |
| idea | 💡 |
| advertencia, cuidado | ⚠️ (lo urgente es 🚨) |
| urgente, prioridad, alerta que no espera | 🚨 |
| obstáculo, bloqueo, algo atorado | 🚧 |
| secreto | 🔒 |
| regalo, bono | 🎁 |

## Ventas y marketing
| Concepto | Emoji | Notas |
|---|---|---|
| celular, WhatsApp sin logo | 📱 | se dibuja igual en los dos modos (el de Fluent era una tableta morada) |
| varias conversaciones a la vez | una `rejilla` de 📲, o el mismo 📲 con nota «×10»; «conversación» en sí: `📱+💬` si la insignia se ve (si no, 📲) | nunca 👥: se lee «personas» |
| notificación | 🔔 | |
| correo | 📧 | |
| bandeja de entrada, lo que llega y espera | 📥 | pálido en Apple sobre tarjeta (53): mejor en lámina blanca |
| archivar, el archivo (lo que se guarda, no se tira) | 🗄️ | no 🗑️ (es «borrar»: dice que se tira) ni 🗂️ (pálido en Apple) |
| anuncio, publicidad | 📣 | |
| una persona sin rol: un prospecto, un lead, alguien que asiste, un integrante o un vendedor de un equipo | 👤 | la audiencia son 👥 o una `rejilla` de 👤; «N vendedores» = una `rejilla` de 👤 (40 vendedores = `total: 40`); el cliente ya es 🧑‍💼 |
| atraer prospectos | 🧲 | |
| seguimiento, recordatorio | ⏰ | |
| objeción | «me falta X» («No tengo dinero», «No tengo tiempo»): el emoji de lo que falta, negado → `no:💰`. Pregunta o duda («¿Por qué subiste?», «¿Y si no funciona?»): 🤔 sin prefijo (❓ en `fluent`). «Ya lo intenté y no funcionó»: lo que intentó, negado | la receta de GUION §2. **Nunca** niegues un emoji que el deck usa en afirmativo (un ícono de `pasos`, un `si:X`): se lee «no hagas el paso N» y QA lo avisa; 🙅‍♂️ es «sin mostrar la cara» |
| garantía | 🛡️ | con plazo y condición medible (GUION §7) |
| testimonio | sin emoji | es una `prueba` con captura real |
| boleto, lugar apartado, cupos | 🎟️ | se dibuja como un boleto ámbar liso en los dos sets (el de Apple dice «ADMIT ONE»; el de Fluent es rosa y se funde con el tachado rojo). Cupos solo si son reales, con `rejilla` (GUION §7). Usa 🎟️, no 🎫 |
| descuento | ✂️ | el precio sigue siendo 💵 · 🏷️ |
| página web, en línea, en la nube | 🌐 | ☁️ es pálido en los dos sets |
| compra en línea, carrito | 🛒 | |
| tienda o negocio local | 🏠 o 🏬 o 🏪 | 🏪 se dibuja en SVG con toldo verde y azul, ventanal y puerta; sin letrero ni tinta roja |
| pago con tarjeta | 💳 | |
| firmar o inscribirse: contrato, registro, inscripción | ✍️ | el registro no es 📝 («escribir, plan») ni 🧲 («atraer prospectos») |

El embudo no tiene emoji: usa el diseño `flujo`.

## Educación
| Concepto | Emoji | Notas |
|---|---|---|
| curso, programa, certificación | 🎓 | |
| alumno | 🧑‍🎓 | 🧑‍💻 es «tú» |
| tarea, ejercicio | 📋 | |
| examen, evaluación | 💯 | 📝 ya es «escribir, plan» |
| certificado | 📜 | |
| recursos, material | 📚 | |
| progreso, niveles | 🪜 | |
| ejemplo, «mira esto» | 👀 | |

## Finanzas
| Concepto | Emoji | Notas |
|---|---|---|
| impuestos, SAT, gobierno | 🏛️ | en `fluent` es el mismo edificio gris de columnas que 🏦: en un deck con los dos, el banco va con su logo real o con 💳 (QA avisa el par) |
| repartir, calcular · lógica, razón | 🧮 | «compra con emoción, justifica con lógica»: la lógica es 🧮 |
| operación del negocio (lo que cuesta operar) | 🧰 | rojo y saturado en los dos sets; el gasto suelto sigue siendo 💸 |

Separar en cuentas: una `rejilla` de 🐷 o de 💰 con etiquetas, no 🗂️ (beige y pálido en Apple).

## Tutorial e IA
| Concepto | Emoji | Notas |
|---|---|---|
| probar, experimentar | 🧪 | |
| queja, cliente molesto | 😠 | |
| pregunta difícil | 🌶️ | |
| sin programar, sin código, «no sé de tecnología» | `no:⌨️` | 💻 es «producto digital» y 🧑‍💻 es «tú»; la objeción «No sé nada de tecnología» también es `no:⌨️` |
| rol, perfil, personaje | 🎭 · 🪪 | 🪪 es una credencial azul con retrato y renglones sin nombre: SVG en Apple, nativa en Fluent |
| documento, base de conocimiento, instrucciones | 📄 | se dibuja en SVG igual en los dos sets (hoja con degradado y sombra, renglones gris pizarra, esquina azul): la hoja de los dos sets sale pálida. 📋 es «tarea» |

## Eventos
| Concepto | Emoji | Notas |
|---|---|---|
| lugar vacío, silla | 🪑 | en una `rejilla` de asistencia es la BASE (lo que no llegó): nunca se reusa como «llegó» (`si:🪑`); el que llegó es 👤 |

Lo demás de un evento ya tiene emoji: quien asiste es 👤, el registro o la inscripción ✍️, el recordatorio ⏰,
el boleto o el apartado 🎟️ y «tu plan» 🧭.

## Llamados en reels
| Llamado | Emoji | Notas |
|---|---|---|
| guardar | 📌 | 🔖 se lee distinto en cada modo |
| compartir | 📤 | |
| comentar una palabra | 💬 | se dibuja en SVG igual en los dos sets: burbuja azul con tres puntos (la de Fluent era lila casi blanca y la de Apple se perdía en la tarjeta). 📲 es «te llega al celular», no «comenta» |
| seguir la cuenta | ➕ | 🔔 ya es notificación |
| me gusta · emoción, lo que se siente | ❤️ | en un deck, un solo sentido: o «me gusta» (reel) o «emoción» (clase de ventas), nunca los dos |

## Creación de contenido
| Concepto | Emoji | Notas |
|---|---|---|
| voz, narrar, la voz en off, podcast | 🎤 · 🗣️ solo con Apple en lámina clara | 🗣️ en Fluent es una silueta negra pesada (y 1% sobre lámina oscura); 🎙️ en Fluent es gris pálido |
| grabar la pantalla (del celular) | `📱+🔴` | 🖥️ es un monitor de escritorio: úsalo solo si se habla de la computadora |
| insignia «grabando» (solo como insignia: `🎥+🔴`, `📱+🔴`, `🎤+🔴`) | 🔴 | sola no dice nada (ver «Evita») |
| grabar audio: una junta o una llamada (con permiso de todos, y la condición en pantalla) | `🎤+🔴` | 🎤 sola sigue siendo «voz, narrar» |
| tomas, clips de video, stock | 🎞️ | 🎥 es «grabar video». Pálido en Apple (≈45 en claro y en tarjeta): no lo pongas en tarjeta con Apple |
| música de fondo | 🎵 | no en lámina oscura (26 en Apple, 33 en Fluent); 🔊 se lee «volumen» y en Fluent es gris |
| borrar, descartar | 🗑️ | en Fluent es gris (32 en claro, 22 en tarjeta): no en tarjeta ni sobre un cuadrante de color; o tacha el elemento |
| cámara de fotos o profesional | 📸 | «grabar video» sigue siendo 🎥 |
| manos trabajando, hecho a mano, contenido solo con las manos | 🤲 · 🙌 | |
| link, enlace | 🔗 | en Fluent es gris (40 en claro, 24 en tarjeta): igual que 🗑️; el llamado al link es la flecha roja o un `boton` |
| ubicación, dónde | 📍 | |

## Psicología y decisión
| Concepto | Emoji | Notas |
|---|---|---|
| dolor, cansancio: el «hoy» | 😩 | el par antes/después es `["😩", "😌"]` en una `idea` |
| alivio: el «después» | 😌 | |
| miedo | 😰 | la pena es 😳 |
| vergüenza, pena, «te da pena» | 😳 | 😰 es «miedo» (en Fluent, una cara de terror) |
| comparar, decidir | ⚖️ | |
| truco, ilusión, «parece magia» | 🪄 | |
| estudio, investigación | 🔬 | la cita del estudio va en `fuente` (LAYOUTS.md) |

«Emoción» es ❤️ y «lógica» es 🧮 (sus filas, arriba): no se duplican aquí.

## Empresa y equipo
| Concepto | Emoji | Notas |
|---|---|---|
| líder, dueño, director | 👑 | no 🧑‍✈️ (se lee «piloto») |
| estrategia | ♟️ | |
| la pieza que falta, la solución | 🧩 | |
| competencia, el rival | 🥊 | |
| transmisión en vivo abierta (live, webinar, directo en redes) | `🎥+🔴` | una llamada o sesión DEL PROGRAMA es 📞. 🔴 sola no dice nada (en Fluent es una esfera rosa 3D): va como insignia de «grabando» |
| lección, módulo, clase grabada del programa | 📖 | la sesión EN VIVO es 📞; 📚 es «recursos, material»; 🎓 el programa completo |
| logro, meta cumplida | 🏅 | 🏆 es «el mejor» |

Una persona del equipo sin rol (vendedor, integrante) es 👤, y el equipo 🧑‍🤝‍🧑 (Personas); el cliente sigue siendo 🧑‍💼.

## Reacciones (la lámina «pregunta»)
| Concepto | Emoji |
|---|---|
| pregunta retórica | 🤔 · ❓ en modo `fluent` |
| sorpresa | 😮 · 🤯 |
| «esto va para ti» | 👊 · 👉 |
| celebración | 🎉 |
| «¿qué pasa?», duda | 🤷 |
| fuego, tendencia | 🔥 |
| saludo, alto | ✋ |

## Sí / no
| Concepto | Emoji |
|---|---|
| lo que sí, lo que ya está hecho | ✅ |
| lo que no, lo que no necesitas | ❌ |
| calificación (en fila: ⭐⭐⭐⭐⭐) | ⭐ |

## Compuestos útiles
La sintaxis es `[no:|si:]base[+insignia]`, con **un solo «+»**.

**El prefijo dice lo mismo en todo el deck** [ref_628]:
- En `cuadrantes` va con el tono: `si:` en verde («esto sí, esto basta») y `no:` en rojo («esto no lo necesitas»).
- Suelto, en una `idea` con «Objeción #N», `no:X` es la objeción «me falta X» (la receta de Ventas, «objeción»). Si
  la objeción es una pregunta, va 🤔 sin prefijo; y nunca se niega un ícono del mapa de `pasos` ni un emoji que otra
  lámina anterior afirma con `si:` o en la oferta (QA lo avisa: «no:🧮 niega el paso 1»). Una
  negación anterior al mapa o al stack puede presentar el dolor que la solución resuelve: no
  genera ese aviso, aunque queda marcada para revisión en el inventario. En una objeción sí se revisa.
- Un beneficio «sin X» («sin perder tiempo», «sin invertir») va con `no:X` en un cuadrante ROJO de lo que no
  necesitas, o con el emoji positivo (⚡ rápido, `si:💸` $0 de capital); nunca con `no:X` suelto, que se lee como
  la objeción.
 El prefijo pone ❌ o ✅ abajo a la
izquierda y la insignia va abajo a la derecha; pueden ir juntos (`no:🧑‍⚕️+💰`). Tres partes
(`🤖+💬+✅`), un prefijo inventado (`nop:`) o un «+» sin emoji a un lado son error de contrato:
para una secuencia usa un `flujo`.

| Escritura | Lectura |
|---|---|
| `🧑‍⚕️+💰` | gana como médico |
| `🤖+📦` | la IA hace el producto |
| `🧑‍💻+💰` | tú ganando |
| `📱+🔥` | contenido viral |
| `no:🎥` | sin grabar video |
| `si:💸` | $0 de capital, sin invertir (cuadrante verde) [10:20] |
| `si:🤝` | trato o venta cerrada |
| `si:✍️` | contrato firmado, inscripción hecha |
| `📱+👥` | los contactos de tu teléfono |
| `🌙+☀️` | disponible 24/7 (🌙 sola es «de noche») |
| `no:⏳` | «No tengo tiempo» (objeción); «rápido, sin perder tiempo» es ⚡ |
| `no:🧑‍⚕️+💰` | ganar como médico sin serlo |

## Emojis dentro del texto y modo Fluent
- En modo `fluent` los emojis escritos dentro de un texto (burbujas, etiquetas, tarjetas) también se
  cambian por la imagen 3D, así la lámina usa una sola familia. En modo `apple` el texto no cambia.
- Un símbolo escrito sin su selector (✔ ❤ ☎ ⚠ ✉ ✂ ☀) también se vuelve imagen; las flechas y los
  símbolos tipográficos (→ ↔ ▶ ™ © #) se quedan como texto.
- Excepción: lo que se dibuja en SVG no admite imagen y el emoji sale con la fuente del sistema (en Linux,
  Noto o un cuadro vacío). Son la etiqueta de una flecha y los textos de `grafica` (`barras[].etiqueta`,
  `valor_texto`, `series[].nombre`, `banda`, `eje_x`, `eje_y`) y de `linea-tiempo` (`tramos[].etiqueta`,
  `marcas[].texto`, `marcas[].arriba`). El emoji va en `barras[].emoji`, en la `nota` o en el nodo. QA lo
  avisa en `fluent` (y el contrato con `auto`).
- Si Fluent no tiene un emoji con tono de piel o de Unicode 15.1, se usa el más cercano (🤝🏽 → 🤝,
  🐦‍🔥 → 🐦) y QA lo avisa como «aproximado». © ® ™ nunca se vuelven imagen.

## Evita
- Emojis ambiguos o de doble sentido, como 🍆 o 🍑.
- Banderas para hablar de idiomas: usa 🗣️ solo en Apple; en Fluent, 🌐.
- Encadenar 3 o más emojis en una frase: para eso existe `flujo`.
- Logos de marcas hechos con emoji. Para una marca real se usa su **logo real** como `imagen`.
- 👨‍💼 junto a 🧑‍💼: se ven casi iguales en los dos modos. Cliente es 🧑‍💼; experto, 🧑‍🏫.
- 🤵 para «vendedor»: en Apple es casi igual a 🧑‍💼 (rubio con traje negro). Vendedor es 👤; cliente, 🧑‍💼.
- 🧑‍✈️ para «líder»: se lee «piloto». Líder es 👑.
- 🎧 y 🎙️ en Fluent: grises pálidos. Para «en vivo», `🎥+🔴` (una transmisión) o 📞 (la sesión del programa); para voz, 🎤.
- 🔴 sola: un círculo sin significado (en Fluent, una esfera rosa). Va como insignia: `🎥+🔴` en vivo, `📱+🔴` grabar la pantalla.
- 🤳 para «creador»: en los dos sets es un brazo suelto con el celular, sin persona; se lee «selfie» o «mostrar la
  cara», lo contrario de un deck sin cara. Creador es `🧑+🎥`; sin cara, `👤+🎥`.
- 🖥️ para «graba tu pantalla» del celular: es un monitor de escritorio. Usa `📱+🔴`.
- Una mano (👆 ✍️ 👉) como emoji de un `boton` con cursor de mano: son dos manos [23:15, 38:15]. El botón lleva un
  objeto (🤖 📝 🚀 📞); QA lo avisa. Si tiene que ser una mano, `"cursor": "flecha"`.
- 👨‍👩‍👧‍👦 para equipo: en Apple es un mosaico gris de siluetas. Usa 🧑‍🤝‍🧑.
- 🔖: en Apple es una etiqueta de precio y en Fluent un marcador rojo. Para «guardar», 📌.
- 📇 para «contactos»: sale como un aparato gris ilegible. Usa `📱+👥`.
- 👥 para «conversaciones»: se lee «personas».
- 🎫: en Apple sale igual que 🎟️ (el mismo boleto dibujado). Usa 🎟️.
- 🗂️: beige y pálido en Apple. Para «separar», una `rejilla` con etiquetas; para «archivar», 🗄️.
- 🗑️ para «archivar»: se lee «a la basura», lo contrario (y en Fluent es gris, 22 en tarjeta). Usa 🗄️.
- 🗓️ y 📆: en Apple salen igual que 📅 (el mismo calendario en SVG); en Fluent son 3D y distintos (argollas, espiral). Para «fecha» basta 📅.

## Parecidos: no los mezcles en un deck

Se ven casi iguales, así que dos conceptos con ellos se confunden. QA avisa si el deck usa dos del mismo grupo
(`PARECIDOS` en `scripts/lib/emoji.mjs`; con `auto`, en cualquiera de los dos sets):

| Set | Grupo | Qué hacer |
|---|---|---|
| los dos | 🧑‍💼 👨‍💼 | cliente es 🧑‍💼; experto, 🧑‍🏫 |
| Apple | 🧑‍💼 🤵 | cliente es 🧑‍💼; vendedor, 👤 |
| Apple | 📅 🗓️ 📆 · 🎟️ 🎫 | se dibujan con el mismo SVG: usa el primero (en Fluent salen nativos y distintos entre sí) |
| los dos | 📄 📃 · 💬 🗨️ | se dibujan con el mismo SVG: usa el primero |
| Fluent | 🏦 🏛️ | el mismo edificio gris: impuestos 🏛️ y el banco con su logo o 💳 |

## Ojo: se ven distinto según el modo
| Emoji | Apple | Fluent | Qué hacer |
|---|---|---|---|
| 📱 | teléfono | tableta morada con apps, se confunde con 📅 | ya se dibuja en SVG igual en los dos modos |
| 📲 | celular con flecha | tableta morada con apps, se confunde con 📅 | ya se dibuja en SVG igual en los dos modos (el mismo celular, con una flecha azul que entra) |
| 🤔 | pensativo | con ojos de alarma | para la pregunta retórica en modo `fluent`, ❓ |
| 🗣️ | perfil que habla | silueta negra pesada, muy distinta al resto de la lámina | para «voz», 🎤 en los dos sets; 🗣️ solo con Apple en lámina clara y no junto a 👤 o 👥 grises |
| 📅 🗓️ 📆 | «JUL 17» / «JUL» impresos | 3D, sin fecha, encabezado azul y distintos (liso, argollas, espiral) | en Apple se dibujan en SVG, un calendario sin fecha con volumen (también dentro del texto); en Fluent salen nativos. Usa 📅 |
| 🎟️ 🎫 | «ADMIT ONE» / «LIVE CONCERT TICKET» | boletos 3D sin texto (rosa, amarillo) | 🎟️ se dibuja en SVG, un boleto ámbar liso, en los dos sets (el rosa de Fluent y el rojo de antes se fundían con el tachado y el círculo rojos [ref_255]); 🎫 igual en Apple y nativo (amarillo) en Fluent |
| 📄 📃 | hoja pálida | hoja pálida | se dibujan en SVG, una hoja con renglones y la esquina azul, igual en los dos modos |
| 💬 🗨️ | burbuja blanca (se pierde en la tarjeta) | burbuja lila casi blanca | se dibujan en SVG, una burbuja azul con tres puntos, igual en los dos modos |

## Emojis con texto impreso

Algunos emojis traen letras: a tamaño de ícono se leen, en inglés o con una fecha que contradice la del deck
(un VSL sobre la fecha del evento con «JUL 17» encima resta credibilidad). Revisado en render con los dos sets:

| Emoji | Apple | Fluent | Qué pasa ahora |
|---|---|---|---|
| 📅 📆 | «JUL 17» | 3D sin fecha | en Apple se dibuja en SVG sin fecha; en Fluent, nativo |
| 🗓️ | «JUL» | 3D sin fecha | en Apple se dibuja en SVG sin fecha; en Fluent, nativo |
| 🎟️ | «ADMIT ONE» | liso, rosa | se dibuja en SVG liso y ámbar en los dos sets |
| 🎫 | «LIVE CONCERT TICKET / ZONE A / JAN 09» | liso | en Apple se dibuja en SVG liso; en Fluent, nativo |
| 💳 | «John Appleseed» | tarjeta lisa | se tolera a tamaño de ícono; nunca en primer plano gigante |
| 💵 | billete de EE. UU. | billete | se tolera: casi no se lee |

QA avisa desde ~80 px de caja (`TEXTO_IMPRESO` en `scripts/lib/emoji.mjs`). Si agregas uno a esta tabla,
agrégalo también ahí, o dibújalo en `GLIFOS_SVG`.

## Bajo contraste (por set y fondo)

Estos emojis casi desaparecen según el set y el fondo. Dos fuentes, las dos en `scripts/lib/emoji.mjs`:
- la **medida** (`contraste-emojis.json`, de `node scripts/medir-emojis.mjs`): % del glifo que se distingue
  del fondo (contraste ≥ 2:1, o ΔE ≥ 40 con color propio) sobre blanco y tarjeta gris; sobre la **lámina oscura**
  solo cuenta el contraste ≥ 3:1 (WCAG 1.4.11): con 2:1 un morado casi negro «se veía». Bajo 15 (bajo **30** en la
  oscura), QA avisa, salvo los revisados a ojo que sí se leen (`VISTOS_OK`: 📈 📉 💡 📩 de Apple). Revisa la base y
  las insignias. Al agregar emojis al diccionario, vuelve a correr la medida;
- la **tabla revisada** (`BAJO_CONTRASTE`), con el sustituto que QA propone.

| Set | Fondo | Se pierden | Usa en su lugar |
|---|---|---|---|
| Fluent | blanco, tarjeta, cuadrantes | 💭 ✉️ 📩 📨 (lila casi blanco) | «te llega» (📩) → 📲 · correo (✉️ 📨) → 📧 · pensamiento → 💡. 💬 🗨️ ya se dibujan (burbuja azul) |
| Fluent | blanco, tarjeta | ⚙️ 🔧 (lila lavado) · 🗒️ | 🛠️ · 📄 |
| Apple | blanco, tarjeta, rosa | 🏷️ (beige pálido), ✉️, 🖱️ (mouse blanco) | precio → 💵 · correo → 📧 · clic → 👆 |
| los dos | claro | ☁️ | «en la nube» → 🌐 |
| los dos | claro | 🤍 🏳️ | ❤️ · 🚩 |
| Apple | oscura | 📞 💲 🎥 | ☎️ · 💵 · 📹 (el mismo «grabar video») |
| Fluent | oscura | 🗣️ 🎥 | 🎤 · 📹 |
| los dos | oscura | 🎓 ♟️ 🎵 ➕ (se hunden en el negro: 2-19 con 3:1) | sin sustituto con el mismo concepto: QA avisa «elige otro»; en la oscura va la revelación, no un ícono de concepto |
| Fluent | blanco, tarjeta | 🔊 🗑️ 🔗 (grises: 22-40, pasan el umbral pero se ven apagados) | música → 🎵 · borrar → tacha el elemento · link → la flecha roja al `boton`, o 🌐 si es «la página» |

La ✅ y la ❌ se dibujan en SVG igual en los dos sets: la ✅ de Fluent era verde menta pálido y se
perdía sobre el cuadrante verde.
