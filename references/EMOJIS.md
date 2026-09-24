# Diccionario de emojis

Regla: **literal, universal y constante**. Mismo concepto, mismo emoji en todo el deck, **y un emoji =
un concepto** dentro del deck: no uses dos emojis que se ven casi iguales (🧑‍💼/👨‍💼, 📅/🗓️) para
conceptos distintos, ni el mismo emoji para dos cosas. Cada emoji de este diccionario tiene un solo
concepto. El contraste de cada uno está **medido** en los dos sets y tres fondos con
`scripts/medir-emojis.mjs` (`scripts/lib/contraste-emojis.json`), y QA lo revisa (ver «Bajo contraste»).

## Qué set usar
- **`"emoji": "apple"`** cuando los PNG o el video se exportan en una Mac (la laptop o el mini, que también
  es Mac). Es el más fiel a la referencia.
- **`"emoji": "fluent"`** cuando se renderiza en Linux, un VPS o la nube, o cuando el HTML del presentador se
  comparte para abrirse en otros equipos.
- **Un solo set por deck**, escrito en el deck. `auto` (apple en Mac, fluent en lo demás) queda como respaldo
  heredado: el mismo deck cambia de familia según la máquina. Con `auto`, QA revisa los DOS sets y avisa lo
  que se pierde en el otro («deck en emoji "auto": en fluent se pierde 💬 → 📲»).
- Lo que cambia de un set a otro está en «Ojo: se ven distinto según el modo» y en «Bajo contraste».

## Dinero y negocio
| Concepto | Emoji | Notas |
|---|---|---|
| dinero, ganancia | 💰 | bolsa: el más usado |
| dinero que se va, gasto | 💸 | billetes con alas |
| efectivo, pago | 💵 | |
| ingresos recurrentes | `flujo` 🔁 → 💰 | dos nodos, no insignia |
| crecimiento | 📈 | |
| caída o pérdida | 📉 | |
| métricas, datos | 📊 | |
| banco, tu cuenta | 🏦 | |
| precio, oferta | 💵 · 🏷️ solo en Fluent | el 🏷️ de Apple es beige pálido y se pierde |
| producto | 📦 | |
| producto digital (ebook, plantilla) | 💻 · 📘 | el curso o programa es 🎓 |
| venta o cierre | 🤝 | solo venta; la alianza firmada es ✍️ |
| cliente | 🧑‍💼 | |
| empresa | 🏢 | |
| empleo o sueldo fijo | 👔 | |
| apostar | 🎰 | |
| ahorros | 🐷 | alcancía |
| el mejor | 🏆 | |
| meta, foco | 🎯 | |
| calidad premium | 💎 | |

## Personas
| Concepto | Emoji |
|---|---|
| tú, el alumno | 🧑‍💻 (resaltado en la multitud) |
| audiencia, comunidad | 👥 · muchos 👤 |
| creador de contenido | 🤳 |
| experto, consultor o maestro | 🧑‍🏫 |
| médico o profesionista | 🧑‍⚕️ |
| principiante | 🐣 |
| equipo | 🧑‍🤝‍🧑 |
| perdido, confundido | 😵‍💫 · 🤯 |
| sin mostrar la cara | `no:🙋` · `no:🎥` |

## Acciones y proceso
| Concepto | Emoji |
|---|---|
| encontrar, investigar | 🔍 |
| construir | 🛠️ |
| lanzar | 🚀 |
| automatizar, IA | 🤖 |
| pocos clics | 👆 (el 🖱️ de Apple es un mouse blanco sobre blanco) |
| escribir, plan | 📝 |
| enviar mensaje | 📲 · 📩 en Apple (el 💬 de Fluent es lila casi blanco) |
| llamada | 📞 · ☎️ en láminas oscuras (el 📞 de Apple se hunde en el negro) |
| fecha, agenda, reunión agendada | 📅 |
| reunión en vivo, videollamada | 📹 |
| aprender | 🧠 |
| rápido | ⚡ |
| tiempo, espera | ⏳ · ⏱️ |
| idea | 💡 |
| advertencia | ⚠️ |
| secreto | 🔒 |
| regalo, bono | 🎁 |

## Ventas y marketing
| Concepto | Emoji | Notas |
|---|---|---|
| celular, WhatsApp sin logo | 📱 | se dibuja igual en los dos modos (el de Fluent era una tableta morada) |
| varias conversaciones a la vez | `rejilla` de 📲 o 📲 con nota «×10» | nunca 👥: se lee «personas» |
| notificación | 🔔 | |
| correo | 📧 | |
| anuncio, publicidad | 📣 | |
| un prospecto, un lead | 👤 | una persona; la audiencia son 👥 o muchos 👤; el cliente ya es 🧑‍💼 |
| atraer prospectos | 🧲 | |
| seguimiento, recordatorio | ⏰ | |
| objeción | 🙅 | la lámina de objeción sigue la receta de GUION §2 |
| garantía | 🛡️ | con plazo y condición medible (GUION §7) |
| testimonio | sin emoji | es una `prueba` con captura real |
| cupos limitados | 🎟️ | solo si son reales, con `rejilla` (GUION §7) |
| descuento | ✂️ | el precio sigue siendo 💵 · 🏷️ |
| compra en línea, carrito | 🛒 | |
| tienda o negocio local | 🏪 | |
| pago con tarjeta | 💳 | |
| contrato, firma, alianza firmada | ✍️ | |

El embudo no tiene emoji: usa el diseño `flujo`.

## Educación
| Concepto | Emoji | Notas |
|---|---|---|
| curso, programa, certificación | 🎓 | |
| maestro | 🧑‍🏫 | el mismo que experto |
| alumno | 🧑‍🎓 | 🧑‍💻 es «tú» |
| tarea, ejercicio | 📋 | |
| examen, evaluación | 💯 | 📝 ya es «escribir, plan» |
| certificado | 📜 | |
| recursos, material | 📚 | |
| progreso, niveles | 🪜 | |
| ejemplo, «mira esto» | 👀 | |

## Llamados en reels
| Llamado | Emoji | Notas |
|---|---|---|
| guardar | 📌 | 🔖 se lee distinto en cada modo |
| compartir | 📤 | |
| comentar una palabra | 📲 | el 💬 de Fluent casi desaparece sobre blanco |
| seguir la cuenta | ➕ | 🔔 ya es notificación |
| me gusta | ❤️ | |

## Reacciones (la lámina «pregunta»)
| Concepto | Emoji |
|---|---|
| pregunta retórica | 🤔 · ❓ en modo `fluent` |
| sorpresa | 😮 · 🤯 |
| «esto va para ti» | 👊 · 👉 |
| celebración | 🎉 |
| «¿qué pasa?», duda | 🤷 |
| fuego, tendencia | 🔥 |
| saludo o levantar la mano | ✋ |

## Sí / no
- ✅ lo que sí, lo que ya está hecho.
- ❌ lo que no, lo que no necesitas.
- ⭐ calificación (se ve bien en fila: ⭐⭐⭐⭐⭐).

## Compuestos útiles
La sintaxis es `[no:|si:]base[+insignia]`, con **un solo «+»**. El prefijo pone ❌ o ✅ abajo a la
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
| `no:💸` | sin invertir |
| `si:🤝` | venta cerrada |
| `si:✍️` | alianza o contrato firmado |
| `📱+👥` | los contactos de tu teléfono |
| `🌙+☀️` | disponible 24/7 (🌙 sola es «de noche») |
| `no:⏳` | sin perder tiempo |
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
- Banderas para hablar de idiomas: usa 🗣️.
- Encadenar 3 o más emojis en una frase: para eso existe `flujo`.
- Logos de marcas hechos con emoji. Para una marca real se usa su **logo real** como `imagen`.
- 👨‍💼 junto a 🧑‍💼: se ven casi iguales en los dos modos. Cliente es 🧑‍💼; experto, 🧑‍🏫.
- 👨‍👩‍👧‍👦 para equipo: en Apple es un mosaico gris de siluetas. Usa 🧑‍🤝‍🧑.
- 🗓️ y 📆: en Fluent son la misma rejilla lila que 📅. Fecha y agenda son 📅.
- 🔖: en Apple es una etiqueta de precio y en Fluent un marcador rojo. Para «guardar», 📌.
- 📇 para «contactos»: sale como un aparato gris ilegible. Usa `📱+👥`.
- 👥 para «conversaciones»: se lee «personas».

## Ojo: se ven distinto según el modo
| Emoji | Apple | Fluent | Qué hacer |
|---|---|---|---|
| 📱 | teléfono | tableta morada con apps, se confunde con 📅 | ya se dibuja en SVG igual en los dos modos |
| 🤔 | pensativo | con ojos de alarma | para la pregunta retórica en modo `fluent`, ❓ |
| 🗣️ | perfil que habla | silueta negra | sirve en lámina clara, pero no junto a 👤 o 👥 grises |
| 📅 🗓️ 📆 | tres calendarios distintos | la misma rejilla lila | un solo concepto: 📅 |

## Bajo contraste (por set y fondo)

Estos emojis casi desaparecen según el set y el fondo. Dos fuentes, las dos en `scripts/lib/emoji.mjs`:
- la **medida** (`contraste-emojis.json`, de `node scripts/medir-emojis.mjs`): % del glifo que se distingue
  del fondo (contraste ≥ 2:1 o saturación ≥ 0.45) sobre blanco, tarjeta gris y lámina oscura. Bajo 15, QA
  avisa, salvo los revisados a ojo que sí se leen (`VISTOS_OK`: 📈 📉 💡 📩 de Apple). Revisa la base y las
  insignias. Al agregar emojis al diccionario, vuelve a correr la medida;
- la **tabla revisada** (`BAJO_CONTRASTE`), con el sustituto que QA propone.

| Set | Fondo | Se pierden | Usa en su lugar |
|---|---|---|---|
| Fluent | blanco, tarjeta, cuadrantes | 💬 🗨️ 💭 ✉️ 📩 📨 (lila casi blanco) | mensaje → 📲 · correo → 📧 · pensamiento → 💡 |
| Fluent | blanco, tarjeta | ⚙️ 🔧 (lila lavado) · 📃 🗒️ | 🛠️ · 📋 |
| Apple | blanco, tarjeta, rosa | 🏷️ (beige pálido), ✉️, 🖱️ (mouse blanco) | precio → 💵 · correo → 📧 · clic → 👆 |
| Apple | tarjeta gris | 💬 (burbuja blanca) | 📲 |
| los dos | claro | ☁️ | «en la nube» → 🌐 |
| los dos | claro | 🤍 🏳️ 📄 🧾 | ❤️ · 🚩 · 📋 |
| Apple | oscura | 🗨️ 📞 💲 🎥 | 💬 · ☎️ · 💵 · 📹 |
| Fluent | oscura | 🗣️ | 🎤 |

La ✅ y la ❌ se dibujan en SVG igual en los dos sets: la ✅ de Fluent era verde menta pálido y se
perdía sobre el cuadrante verde.
