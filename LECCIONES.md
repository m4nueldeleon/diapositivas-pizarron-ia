# Lecciones

Correcciones del usuario que ya se aplicaron. **Mandan sobre ESTILO.md y LAYOUTS.md.** Se escriben
en el momento en que el usuario corrige algo, con la regla, el porqué y la fecha.

## 2026-09-23 · Calibración inicial contra la referencia
- **Regla**: el texto va a 72-80 px en 1920 aunque la frase sea larga. Los emojis miden entre 170
  y 250 px y la firma unos 260 px de ancho.
- **Porqué**: en la primera versión todo salió 1.45 veces más chico que en la referencia. Las
  láminas se veían vacías y «de plantilla».
- **Cómo se detectó**: se replicaron 10 láminas del video y se compararon lado a lado, cuadro
  contra render.

## 2026-09-23 · Alineación tolerante
- **Regla**: el montaje empata guion y transcripción con una alineación global por similitud de
  letras, no por coincidencia exacta.
- **Porqué**: con una transcripción mala («Tivó y ha enseñado» en lugar de «Te voy a enseñar»)
  la búsqueda exacta ubicó 1 de 10 anclas. La alineación global ubicó 10 de 10.

## 2026-09-24 · Recalibración de escala e íconos (loop de calidad, ronda 1)
- **Regla**: la frase va a 84-90 px (76 si pasa de 15 palabras, 68 solo sobre 25) y el emoji se VE de
  200 a 250 px (caja de 230-290), hasta ~310 en el gancho. El rótulo gris es uno solo: 56 px.
- **Porqué**: medida contra c_0250 (renglón de 78 px de alto y ~1490 de ancho = Figtree 84) y ref_90 /
  ref_10 (🏆 de ~197 px, médico de ~314). A 72 px las láminas salían 15-27% más chicas que el video.
- **Cómo se detectó**: bandas de píxeles oscuros sobre los cuadros de referencia llevados a 1920.

## 2026-09-24 · El sello es una etiqueta opaca
- **Regla**: la máscara de grano va solo en la tinta; la etiqueta es blanca y opaca, centrada sobre lo
  que sella y ~60% de su ancho.
- **Porqué**: con la máscara sobre todo el elemento, el contenido se veía a través de las letras
  («VENTAS PERDIDAS» salía café o verde olivo). En 6:45 la etiqueta tapa las cajas.

