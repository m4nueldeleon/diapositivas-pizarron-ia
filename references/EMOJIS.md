# Diccionario de emojis

Regla: **literal, universal y constante**. Mismo concepto, mismo emoji en todo el deck.

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
| producto digital o curso | 💻 · 📘 | |
| venta o cierre | 🤝 | también «alianza» |
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
| experto o consultor | 🧑‍🏫 · 👨‍💼 |
| médico o profesionista | 🧑‍⚕️ |
| principiante | 🐣 |
| equipo | 👨‍👩‍👧‍👦 · 🧑‍🤝‍🧑 |
| perdido, confundido | 😵‍💫 · 🤯 |
| sin mostrar la cara | `no:🙋` · `no:🎥` |

## Acciones y proceso
| Concepto | Emoji |
|---|---|
| encontrar, investigar | 🔍 |
| construir | 🛠️ |
| lanzar | 🚀 |
| automatizar, IA | 🤖 |
| pocos clics | 👆 · 🖱️ |
| escribir, plan | 📝 |
| enviar mensaje | 📲 · 📩 en Apple (el 💬 de Fluent es lila casi blanco) |
| llamada | 📞 · ☎️ en láminas oscuras (el 📞 de Apple se hunde en el negro) |
| reunión | 📅 |
| aprender | 🧠 |
| rápido | ⚡ |
| tiempo, espera | ⏳ · ⏱️ |
| calendario | 🗓️ |
| idea | 💡 |
| advertencia | ⚠️ |
| secreto | 🔒 |
| regalo, bono | 🎁 |

## Reacciones (la lámina «pregunta»)
| Concepto | Emoji |
|---|---|
| pregunta retórica | 🤔 |
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
| `si:🤝` | alianza cerrada |
| `no:⏳` | sin perder tiempo |
| `no:🧑‍⚕️+💰` | ganar como médico sin serlo |

## Emojis dentro del texto y modo Fluent
- En modo `fluent` los emojis escritos dentro de un texto (burbujas, etiquetas, tarjetas) también se
  cambian por la imagen 3D, así la lámina usa una sola familia. En modo `apple` el texto no cambia.
- Excepción: el texto manuscrito que se dibuja en SVG (la etiqueta de una flecha, los textos de una
  gráfica) no admite imagen; ahí el emoji sale con la fuente del sistema. Evítalo.
- Si Fluent no tiene un emoji con tono de piel o de Unicode 15.1, se usa el más cercano (🤝🏽 → 🤝,
  🐦‍🔥 → 🐦) y QA lo avisa como «aproximado». © ® ™ nunca se vuelven imagen.

## Evita
- Emojis ambiguos o de doble sentido, como 🍆 o 🍑.
- Banderas para hablar de idiomas: usa 🗣️.
- Encadenar 3 o más emojis en una frase: para eso existe `flujo`.
- Logos de marcas hechos con emoji. Para una marca real se usa su **logo real** como `imagen`.

## Bajo contraste (por set y fondo)

Estos emojis casi desaparecen según el set y el fondo (muestrario sobre blanco, tarjeta gris,
cuadrantes y lámina oscura). QA avisa con el sustituto; la tabla vive en `scripts/lib/emoji.mjs`
(`BAJO_CONTRASTE`).

| Set | Fondo | Se pierden | Usa en su lugar |
|---|---|---|---|
| Fluent | blanco, tarjeta, cuadrantes | 💬 🗨️ 💭 ✉️ 📩 (lila casi blanco) | mensaje → 📲 · correo → 📧 · pensamiento → 💡 |
| Apple | blanco, tarjeta, rosa | 🏷️ (beige pálido), ✉️ | precio → 💵 · correo → 📧 |
| los dos | claro | 🤍 🏳️ 📄 🧾 | ❤️ · 🚩 · 📋 |
| Apple | oscura | 🗨️ 📞 💲 🎥 | 💬 · ☎️ · 💵 · 📹 |
| Fluent | oscura | 🗣️ | 🎤 |

La ✅ y la ❌ se dibujan en SVG igual en los dos sets: la ✅ de Fluent era verde menta pálido y se
perdía sobre el cuadrante verde.
