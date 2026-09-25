# ARRANQUE — tu primer deck en dos páginas

Lo mínimo para escribir un deck que pase el preflight a la primera. El resto de `references/` se consulta **por
sección**, cuando el preflight lo pide o la pieza lo necesita (tabla al final). REGLAS-DEL-AUTOR.md (una página) se
lee siempre: manda.

## 1. El flujo

1. Fija la pieza y su duración (ARCOS.md, tabla de piezas): `reel` 30-60 s, `tutorial`, `clase`, `vsl-corto`, `vsl`,
   `propuesta`. Si vende, llena antes la `ficha_oferta` (SKILL.md, ruta mínima por pieza). Un reel de 10+ láminas
   con chat, lista, flujo, tarjetas y contraste casi siempre pasa de 60 s en la primera pasada [r19]: arranca con
   7-9 láminas o cuenta con recortar la voz 2-3 veces en `armar.mjs --corregir`.
2. Escribe el guion como **frases de voz**, una por cosa que aparece en pantalla.
3. Traduce cada frase a una lámina (tabla de abajo) y escribe `deck.json` a mano.
4. Corre `node scripts/armar.mjs <carpeta>`: revisa el guion y la geometría ANTES del primer PNG. Corrige lo que pida
   (sección 4) y vuelve a correrlo hasta que diga `QA medido … listo`.
5. Mira TODAS las hojas (`salida/hoja*.jpg`). Un 100 automático no sustituye tus ojos.

## 2. El esqueleto

```json
{
  "titulo": "Qué contestar cuando te piden descuento",
  "formato": "9:16", "emoji": "apple", "pieza": "reel", "persona": "tu", "marca": false,
  "laminas": [
    { "id": "gancho", "tipo": "chat", "mensajes": [{ "de": "otro", "hora": "9:40 pm", "texto": "¿Me lo dejas más barato?" }],
      "voz": "Te piden descuento y sientes que tienes que ceder." },
    { "id": "tesis", "tipo": "idea", "texto": "No contestes con un ~~«no»~~:\n__contesta con una pregunta__",
      "tachar_paso": 1, "voz": ["No contestes con un no.", "Contesta con una pregunta."] }
  ]
}
```

## 3. Los ocho diseños que cubren casi todo

| Diseño | Campos mínimos | Pasos que genera |
|---|---|---|
| `idea` | `texto`; `emoji` opcional; `nota` gris | 1 (+1 por `texto_paso`, `nota_paso`, `tachar_paso`, sello o anotación) |
| `lista` | `items`; `encabezado` opcional; `vineta` (`numero`, `check`, `x`) | 1 por ítem (el encabezado sale con el primero) |
| `chat` | `mensajes` con `de` (`yo`/`otro`) y `texto`; `hora` opcional (ambientación, ~48 px) | 1 por mensaje (+1 por `sello`) |
| `flujo` | `nodos` con `emoji` y `etiqueta` | 1 por nodo |
| `pasos` (mapa 1-2-3) | `iconos` + `etiquetas`, o `n`; `activo`; vuelve con `"como": "<id>"` | 1 (+ texto) |
| `cifra` | `lineas` con `texto`; encierra con `((…))` | 1 por línea |
| `tarjetas` | `items` con `emoji` y `texto` corto | 1 por tarjeta |
| `prueba` / `objeto` | `capturas` con `src` real / `imagen` del deck | 1 |

Marcas del texto: `**negrita**`, `__subrayado rojo__`, `~~tachón~~`, `==resaltado==`, `((óvalo))`, `{v:verde}`,
`[[a mano]]`, `\n` salto. Una marca roja por lámina, dos como máximo.

**La regla de oro:** `voz` lleva **una frase por paso**. Si una lámina tiene 3 pasos, su `voz` es una lista de 3
frases, y cada frase dice lo que aparece en ese paso.

## 4. Lo que el preflight pide más seguido

| Aviso | Arreglo |
|---|---|
| «voz tiene N textos y la lámina M pasos» | junta frases o separa lo que entra (`texto_paso`, `nota_paso`, `tachar_paso`) |
| «X se adelanta a la voz del paso N» | que la frase de ese paso nombre lo que aparece |
| «falta el pago del gancho» | en el último 25 %, repite la lámina del gancho con `"como"` y `"paga"`, resuelta |
| «el sello del chat queda suelto» | `"sello_sobre": "m1"` (la burbuja que califica, desde 0) |
| «chat es el N % del deck (máximo 45 %)» | cambia un chat por `tarjetas`, `flujo` o una `idea` con cita |
| «burbuja de N renglones (tope…)» | una idea por burbuja: parte el mensaje en varios |
| «N láminas seguidas sin capa roja» | `__subraya__` la tesis o añade una flecha, un tachón o un sello |
| «sale ya tachado» | `"tachar_paso": 1`: que se lea antes de tacharse |
| «doble negación» | el tachón ya niega: quita el «no» o no taches |
| «componente … sin respuesta» | responde CADA parte de la objeción («¿pago hoy y en efectivo?» son dos) |
| «rótulo … 3 renglones en su tarjeta» | acórtalo a 2: es un rótulo, no una frase |
| «chat que paga el gancho … sin procedencia» | `"procedencia": "ejemplo"` (sale «Ejemplo ficticio») o la `fuente` real |
| «(texto secundario) se ve a N px» | quita texto a la lámina para que el encaje no la reduzca; un dato que se lee no va en `hora` |
| «lista corta: bloque ocupa N %» | sube la letra o suma un renglón; no rellenes con aire |
| «contraste desalineado» | acorta el ítem largo de la columna que parte renglones |
| `[PRECIO]` o `FICHA_OFERTA` por confirmar | el dato real en `datos`; nunca inventado |

## 5. Qué leer después, y cuándo

| Necesitas | Lee |
|---|---|
| el porqué de un tamaño, un color o una marca | ESTILO.md, la sección de ese recurso |
| todos los campos de un diseño | LAYOUTS.md, solo la sección de ese diseño |
| cuántas láminas y dónde va cada beat | ARCOS.md, la fila y la sección de tu pieza |
| vender: oferta, prueba, objeción, llamado | GUION-A-LAMINAS.md §7 |
| elegir un emoji | EMOJIS.md, tabla de conceptos |
| que la voz no suene a IA | VOZ-HUMANA.md |
| entregar video, PDF o presentador | PROTOCOLO.md |
