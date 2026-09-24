# Clase express — el mensaje de seguimiento (menos de 15 min)

Modelo que se copia para una **clase express** o un taller corto (`deck.json` en esta carpeta). No hay pieza aparte:
es `"pieza": "tutorial"` con `"clase": true` (y `"en_vivo": true` si se da en vivo). Con `"clase": true` el cierre
son dos beats obligatorios, la tarea con objeto y el puente a la próxima clase o la comunidad, y QA los revisa en las
3 últimas láminas (ARCOS.md, «Tutorial»).

- Los tramos en vivo son `camara` con `"vivo": true` y `dur` (30 s cada uno aquí): cuentan en la duración, pero no
  sustituyen beats. QA avisa desde 40% del tiempo en tramos.
- El único dato por confirmar es `{{PROXIMA_CLASE}}` (día y hora reales).

| # | Beat | Láminas | Qué enseña |
|---|---|---|---|
| 1 | **El error en vivo antes del segundo 10** | 1 `chat` | el precio que se queda en visto, con el sello pegado a la burbuja |
| 2 | Resultado y **contrato de tiempo** | 2-4 | qué se llevan hoy («Sales con:») y el reloj «4:00» con `"contrato": true`: la promesa es lo que dura la voz (QA la mide: `qa.json → arco`, aviso a más de 30%) |
| 3 | Mapa 1-2-3 | 5 | el mapa que vuelve con `como` al abrir cada bloque |
| 4 | Bloque 1: encontrar | 6-9 | la regla, el filtro («En tu WhatsApp:») y el ejercicio en vivo (`camara` con `vivo`) |
| 5 | Bloque 2: escribir | 10-17 | lo que no funciona tachado (`tachar_despues`: 3 ítems = 6 pasos), la regla en `foco`, la fórmula en `flujo` con signos, el ejemplo en `chat` y el segundo ejercicio |
| 6 | Bloque 3: mandar | 18-23 | cuándo, qué pasa si contesta y si no, y los errores comunes |
| 7 | Resumen, **tarea con objeto** y **puente** | 24-26 | «Tu tarea: manda tus 3 mensajes hoy» y «Próxima clase: {{PROXIMA_CLASE}}», los dos a la vista |
