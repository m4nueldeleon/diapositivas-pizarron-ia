# Ronda 8 · Informe de mantenimiento

Trabajo realizado por Codex en solitario, sin commits, stash, push ni cambios en las copias
externas. Se conservaron las pruebas de navegador; no se sustituyeron por comprobaciones de texto.
Los cambios nuevos no incorporan datos ni assets de eventos privados.

## Arreglos aplicados

Las pruebas R8 citadas están en `pruebas/calidad-r8.test.mjs`.

| # | Cambio y lugar | Evidencia |
|---|---|---|
| 1 | `scripts/armar.mjs`: filtro antes del PNG, cola con `tipo_arreglo`, repetición tras corregir y paro explícito (`lib/ciclo-calidad.mjs`). Los avisos no se aceptan solos. | R8.1 y R8.4; bloquea huecos en 16:9/9:16 y falta de sala; detecta estancamiento. Los tres decks aportados quedan bloqueados con sus pendientes. |
| 2 | `lib/autocorregir.mjs`: ícono de pérdida ante titular inequívoco de pérdida; reconstrucción y QA antes de guardar. | R8.2: inmutabilidad, negaciones, conceptos propios, respaldo y SHA del deck corregido. |
| 3 | `armar.mjs` + `autocorregir.mjs`: adelantar `fuente_paso` cuando se pronuncia la cita completa. | R8.3: no elimina el último beat ni modifica la voz; rechaza candidatos con regresiones. |
| 4 | `lib/evidencia-calidad.mjs`, render, pipeline y QA: historial del primer render con nota exacta y huellas de deck/HTML. `armar` rechaza un QA anterior al subproceso. | R8.5: 82 sigue siendo 82 después de una medición de 96; sin primer QA queda null; una ficha/HTML diferente no empata. Integración visual nueva en `qa-visual.test.mjs`, pendiente de Chromium. |
| 5 | `reglas_cliente` como nombre explícito de la ficha única; contrato raíz, saneamiento, schema y salida de QA. | R8.6: alias excluyentes, motivo, decisiones que todavía no aplican y reglas no negociables. |
| 6 | `datos.mjs`, markup y QA: detectar `[X]`, marcadores malformados y valores que contienen otros marcadores. | R8.7; se fortaleció la expectativa de `motor-r7.test.mjs` para incluir X. Integración visual del stack intermedio pendiente. |
| 7 | Contrato y `reglas-arco.mjs`: IDs únicos, pago hacia una lámina anterior e identidad del ícono al volver al mismo diseño. | R8.8: rechaza pago a sí mismo, IDs ambiguos y cambio total de íconos; permite el objeto negado/afirmado. La coherencia semántica del relato sigue requiriendo revisión. |
| 8 | `datos.mjs` y ambos QA: glosario derivado con valor, fuente, estado y usos en pantalla/voz. | R8.9: cambiar una cifra en datos actualiza todos sus usos; no muta el original. No atribuye automáticamente magnitudes a cifras literales. |
| 9 | `qa --sin-navegador --estricto` devuelve 3 siempre. SKILL/PROTOCOLO y error de arranque asignan a Claude/orquestador el render fuera del sandbox. | R8.10: filtro limpio sigue sin medir; el armado distingue fallo de navegador (4), conserva diagnóstico y no aprueba. |

Contrato operativo completo: [Calidad antes del primer render](CALIDAD-PRIMER-RENDER.md).
No se agregó ningún diseño ni se cambiaron tamaños CSS: las cinco obligaciones de diseño nuevo
no se activan. No se agregó interpolación de texto del deck a HTML.

## Evidencia de la auditoría

Se abrieron las cuatro hojas del demo, PNG individuales del stack/óvalo/ícono dibujado y las
cinco hojas de los decks aportados. Se contrastaron cuadros originales de la referencia.
El demo ya tiene símbolo propio dibujado, variante de contraste y pasos intermedios del stack.

Los QA aportados dicen **82, 90 y 90**. No se alteraron ni se trasladaron al historial nuevo.
El filtro actual de los tres archivos produce:

| Deck | Errores | Avisos | Datos por confirmar | Resultado |
|---|---:|---:|---:|---|
| liderazgo-gerentes | 6 | 33 | 14 | Bloqueado antes de PNG |
| gancho-3-segundos | 0 | 3 | 1 | Bloqueado antes de PNG |
| agenda-citas-ia | 0 | 13 | 14 | Bloqueado antes de PNG |

Son versiones escritas antes de las reglas finales de la ronda anterior: estos conteos no son
nuevas notas visuales. La evidencia local del filtro está en `salida/r8/decks/`, con `deck.json`,
`salida/qa-texto.json`, `salida/armado.json` y el log de cada corrida. Las autocorrecciones acotadas
se demuestran con regresiones controladas; estos tres archivos todavía requieren corrección
editorial y confirmación de datos. No se declaran terminados.

## Omitidos y límites

- **Primer render ≥85 y cero errores en cualquier deck:** no se puede certificar sin medidas
  visuales. El filtro evita fallos conocidos, pero no garantiza geometría ni legibilidad.
- **Corrección editorial completa de los tres decks:** queda pendiente. El programa no puede
  deducir sala, identidad de quien entrega, prueba propia, fecha de próxima clase ni respaldo real.
  Los hallazgos resolubles de guion siguen en la cola, no se convierten en excepciones.
- **Recomposición 9:16:** sin render nuevo no se cambiaron tamaños ni posiciones. Los umbrales
  existentes no se relajaron. Claude debe revisar ocupación óptica, apertura y zonas de Reels.
- **PPTX/Keynote editable, recortes y hoja de show:** permanecen en la frontera de la capa de
  escenario. No hay adaptador comprobado aquí; el PDF por paso no se presenta como editable.
- **Ícono propio y antes/después:** ya implementados en la ronda anterior y vistos en el demo;
  no se reconstruyeron. Sus riesgos geométricos siguen cubiertos por las pruebas existentes.
- **Fidelidad medida:** se ejecutó el comparador de la réplica versionada; salió con código 4
  antes de medir por Chromium. No existe una distancia nueva por lámina ni un porcentaje de
  aprobación que reportar. Conserva los umbrales de PROTOCOLO §4b.

## Revisión pendiente de Claude

1. Ejecutar la suite fuera del sandbox y revisar la nueva integración de stack e historial.
2. Renderizar demo y modelos; recorrer todas las hojas finales y de pasos. Probar la pérdida
   corregida y la fuente adelantada, especialmente con Fluent, sala y 9:16.
3. Comprobar que `calidad-historial.json` ata la nota al HTML de los PNG y que no cambia la primera
   nota tras una corrección. Usar una carpeta de salida por deck, sin escrituras concurrentes.
4. Ejecutar `comparar.mjs` contra los cuadros originales y publicar las distancias por lámina.
5. Revisar y resolver la cola editorial de los tres decks; los datos no confirmados siguen bloqueados.

**SIN RENDER, revisión visual pendiente.** Se vieron las imágenes aportadas de la ronda anterior;
no se vieron renders de los cambios nuevos porque Chromium no pudo arrancar.

## Resultado de pruebas

`node --test pruebas/*.test.mjs`: **480 pruebas; 379 pasan, 88 fallan por navegador, 13 omitidas por sus guardas existentes**. No se modificó ninguna guarda para esta ronda. Las 12 regresiones nuevas sin navegador pasan; la nueva integración visual está entre los 88 fallos.

El render del demo y el comparador salieron con **código 4**. Los fallos indirectos (`Unexpected end of JSON input`, archivo QA/comparación ausente y sincronía con retorno null) vienen de helpers que intentan leer el resultado después de fallar el arranque. Se revisaron esos helpers; no son aprobaciones ni mediciones visuales.

| Archivo | Pruebas fallidas por navegador |
|---|---:|
| pruebas/datos.test.mjs | 1 |
| pruebas/ejes-flujo.test.mjs | 1 |
| pruebas/emoji.test.mjs | 1 |
| pruebas/estilo-iconos-r3.test.mjs | 2 |
| pruebas/estilo-iconos-r4.test.mjs | 3 |
| pruebas/estilo-iconos-r5.test.mjs | 3 |
| pruebas/estilo-iconos.test.mjs | 4 |
| pruebas/estilo.test.mjs | 2 |
| pruebas/hoja.test.mjs | 4 |
| pruebas/maquetacion.test.mjs | 17 |
| pruebas/motor-r5.test.mjs | 10 |
| pruebas/motor-r6.test.mjs | 1 |
| pruebas/presentador.test.mjs | 5 |
| pruebas/qa-visual.test.mjs | 26 |
| pruebas/sala-render-r6.test.mjs | 2 |
| pruebas/tinta.test.mjs | 6 |

Detalle local de cada caso: `salida/r8-fallos-navegador.json`. Log completo: `salida/r8-pruebas-final.log`.
