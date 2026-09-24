# Anatomía del video de referencia

**Video**: Iman Gadzhi, «Best Online Business to Make $10k+/month In 2026 (Beginner Friendly)».
Duración 44:55. Publicado el 17-mar-2026: https://www.youtube.com/watch?v=pPpb4t2eV2M

Lo estudiamos así:

- 539 cuadros, uno cada 5 s, en 18 hojas de contacto.
- 20 láminas a resolución completa.
- 12 ráfagas a 8 cuadros por segundo para ver la animación.
- Clasificación de cada medio segundo en lámina, cámara o pantalla.
- Detección de cambios de escena y muestreo de color.

Este repo **no incluye cuadros del video**: son del autor. Todo lo que sigue son observaciones
con su marca de tiempo, para que puedas ir a verlas.

## Métricas medidas

| Métrica | Valor |
|---|---|
| Tiempo en lámina blanca | 75.0% |
| Tiempo a cámara | 11.6% |
| Tiempo en pantalla, fotos o láminas oscuras | 13.4% |
| Cambios visuales entre el minuto 1 y el 18 | 403 en 17 min, uno cada 2.53 s |
| Tiempo entre cambios | mediana 2.88 s; 25% en 1.84 s; 75% en 4.12 s |
| Tramo típico a cámara | mediana 4 s |
| Tramo típico de lámina antes de cortar a cámara | mediana 9 s; media 19.6 s |

Colores muestreados:

| Uso | Colores |
|---|---|
| Rojo de subrayados y ✕ | `#C00818` a `#D0081A` |
| Verde de la tabla | `#20B010` a `#30A020` |
| Naranja de la tabla | `#C06010` a `#D06010` |
| Resaltador | `#F8D830` |
| Pastilla verde | `#C0F8C0` |
| Barra del calendario | `#F0C808` |
| Líneas de tabla y notas grises | `#505050` |

## Recursos, con el momento donde aparecen

| Momento | Recurso | Diseño equivalente |
|---|---|---|
| 0:10 | Médico con bolsa de dinero (emoji compuesto) + frase con subrayado rojo + nota manuscrita gris | `idea` |
| 0:15 | «All without ever:» + emoji con ✕ + «Showing their face» | `lista` |
| 0:25 | Cursor de flecha + «If you clicked on this video because…» | `idea` + `clic` |
| 0:30 | «"Market Gap"» entre comillas: término acuñado | `idea` |
| 0:35 | Estado de cuenta con nombre tachado en rojo y monto | `prueba` |
| 0:38 | «100% transparent» con resaltador amarillo; el descargo «just because I got these results, doesn't mean you will» | `idea` con `==` |
| 1:00-1:20 | Capturas de prueba que se apilan con sombra | `prueba` |
| 1:35 | «Without:» + ❌ ítems, uno por frase | `lista` |
| 1:45 | Alcancía → arco negro con ✕ → tragamonedas (fotos recortadas) | `flujo` + `tachada` |
| 1:55 | Teclas 1 2 3, ruta punteada que se dibuja, cursor de mano que hace clic | `pasos` |
| 1:26 | Quién habla (el nombre llega hasta aquí, no al inicio) | `camara` |
| 2:00-2:12 | Reloj digital «33:00» (contrato de tiempo), el filtro «if you don't have 33 minutes…» y el regalo por quedarse | `objeto` + `idea` |
| 2:40 | Billete con anotaciones manuscritas y flechas | `objeto` + notas |
| 3:10-3:15 | 1,000,000 × 0.1% = 1,000, luego × $25,000 = $25,000,000 subrayado | `cifra` |
| 3:50 | Meme de película («That is an excellent question») | imagen |
| 4:05-4:15 | Lista de modelos tachados → «Todos son viables» | `lista` tachada → `idea` |
| 4:20-4:25 | Medidor verde→rojo con pin | `medidor` |
| 4:30 | EASY / MEDIUM / DIFFICULT con cursor | `opciones` |
| 4:45 | Tarjeta con 3 modelos y estrellas ⭐ calificadas con cursor | `tarjetas` |
| 5:00-5:15 | 6 tarjetas de métricas que aparecen una por una | `tarjetas` |
| 5:25-10:05 | **Tabla-marcador** manuscrita: se llena celda por celda y columna por columna | `tabla` |
| 5:35 | Tarjetas de citas de ventas (azul, verde, naranja, rojo) | maqueta |
| 5:50 | Línea de meses con llave naranja «2-6 months» | `linea-tiempo` |
| 6:15 | Gráfica tiempo contra dinero, recta roja con puntos | `grafica` |
| 6:30 | Proveedor → cliente con arco rojo | `flujo` + `arco` |
| 6:35-6:45 | 500 cajas 📦 + «That's 500» + sello «A LOT OF SKILL» | `rejilla` + `sello` |
| 7:15 | Medidor + «full-stack entrepreneur» | `medidor` |
| 7:25 | Curvas escala contra costo de anuncios con «Your Margins» en verde | `grafica` + `banda` |
| 7:30 | Columna de la tabla con flechas rojas que convergen en una pregunta manuscrita | sin diseño todavía (`tabla` no dibuja flechas convergentes) |
| 9:50 | Día 1 / 14 / 30 con «Ideal» en verde y «High likelihood of quitting» en rojo | `linea-tiempo` |
| 10:10 | Seis ✅ + «one single solution» | `idea` |
| 10:20-10:25 | Cuadrantes rojo y verde a sangre con emojis tachados o palomeados | `cuadrantes` |
| 10:30 | 1 Partnership → $2,000 / $50,000 + llave «Same Work» | `bifurcacion` |
| 10:45-10:50 | Círculo rojo lleno de personas, luego verde: «CHANGED» | `circulos` |
| 11:00 | Manos ✋ sobre las teclas 1 2 3 (emoji animado) | `pasos` + `sobre` |
| 11:15 | Línea Now / 12 / 24 meses en verde | `linea-tiempo` |
| 11:25-11:30 | Artículos de prensa como captura con subrayado | `prueba` |
| 12:45 | Creador → producto → audiencia → dinero; 70% y 30% | `flujo` |
| 13:55-14:00 | Teléfonos con perfiles de creadores | `prueba` |
| 14:25 | Perfil con «Last 24 hours $15,763» encerrado y flecha roja | `prueba` + `circulo` (la flecha que entra desde fuera aún no existe) |
| 14:45 | 99 puntos verdes y 1 rojo | `rejilla` + `punto` |
| 14:55 | Multitud de siluetas y «You» | `rejilla` + `destacar` |
| 15:20 | Lámina anterior atenuada + frase manuscrita encima | `foco` |
| 15:25-15:30 | Pastilla «5k Audience · $30,000» que se parte en 70% gris y 30% verde | `reparto` |
| 16:05 | Línea de años con $1B, $2B y $3B | `linea-tiempo` |
| 16:40 | 🔍 Step 1 Find (los demás atenuados) | `pasos` + `iconos` + `activo` |
| 17:45 | Burbuja azul «Hey, want to work together?» | `chat` |
| 18:25 | Documento 📝 + flecha roja curva + promesa manuscrita | `cita` |
| 18:30 | «Monetisation Gameplan.» subrayado | `idea` |
| 18:50 | Checklist ✅ de lo que incluye | `lista` |
| 19:00 | Una decena de respuestas grises: «Yes, I'm down» | `chat` |
| 20:00-27:40 | Grabación de pantalla con la cara en círculo abajo a la izquierda | fuera del alcance: tu editor |
| 23:15 | Botón «Generate 🤖» + cursor de mano | `boton` |
| 28:00 | Step 1 ✅ Step 2 ✅ Step 3 Launch | `pasos` + `hechos` |
| 28:45-29:20 | Calendario de 14 días con 3 fases de color y notas manuscritas | `calendario` |
| 33:45-33:55 | Condición arriba («For a creator with 50K-100K followers») y rangos: «100-250 sales × $100-200 = $10,000-$50,000», «Your 30% cut» en verde | `cifra` con `arriba` |
| 34:10 | Barras rojas chicas → barras verdes altas: $5K → $30K+ | `grafica` + `barras` |
| 34:25-35:15 | «Reason #1», «Reason #2» | `idea` |
| 35:45-35:50 | Foto de laberinto: sentirse perdido | `objeto` |
| 36:10 | Credibilidad sobre foto real: «since 2016, over 23,000 clients» | `prueba` u `objeto` |
| 36:15-37:55 | Láminas oscuras de marca: Consulting.com, Monetise, Quantum, Synthesise AI | `oscura` |
| 36:38 | Ancla con el nivel caro real: «Quantum… starts at $25,000», antes del producto | `cifra` |
| 39:25 | Avatares → $140,000 cada uno | `flujo` |
| 40:15-40:50 | «They will:» — lista en blanco que crece renglón por renglón | `lista` |
| 41:00 · 41:35 | Pregunta de sí después de cada componente: 🤔 «Can you see how…» / «How much easier…» | `idea` |
| 41:10 · 41:40 | Componentes numerados «#4» y «#5», en blanco | `idea` |
| 42:00 | Muro de capturas reales de resultados | `prueba` |
| 42:30-42:45 | Bento de valor que se llena pieza por pieza | `stack` |
| 43:00 | «UpLevel · Limited availability» (la segunda revelación oscura) | `oscura` |
| 43:15 | Rejilla «Enrolled / Waiting» | `rejilla` |
| 43:20 | «Small number of spots» (escasez real) | `idea` o `rejilla` |
| 43:30 | «Waitlist months long» | `idea` |
| 43:35 · 44:30 | Flecha roja al link (sobre una captura real, no sobre fondo oscuro de plantilla); el link sale dos veces | `prueba` + flecha, o `boton` |
| 43:40 | «2 minutes»: cuánto tarda aplicar | `idea` ⏱️ |
| 43:50 | La invitación de calendario: qué pasa después del clic | `calendario` o `prueba` |
| 44:05 | «If it's not, we'll point you in the right direction»: la salida honesta | `idea` 🤝 |
| 44:20-44:25 | Resumen del stack | `lista` |
| 44:35-44:40 | Por qué ahora y cierre de identidad; 44:45 a cámara | `idea`, luego `camara` |
