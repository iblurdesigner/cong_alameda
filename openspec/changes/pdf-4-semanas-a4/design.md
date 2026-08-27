# Design: Optimización de Espacios e Impresión A4 para 5 Semanas

## Estrategia de Optimización Espacial
Para garantizar que 5 semanas encajen en los 297mm de alto del formato A4:

1. **Ajustes de Impresión Estrictos (`@media print`)**:
   - `@page { size: A4 portrait; margin: 6mm 8mm; }`
   - Reducción del tamaño del encabezado institucional a 1.1rem (título) y 0.75rem (subtítulo).
   - Padding en celdas de tabla reducido a `2px 5px` (0.12rem 0.3rem).
   - Altura de línea compacta (`line-height: 1.15`, `font-size: 9.5px`).
   - Margen entre bloques semanales reducido a `4px`.

2. **Doble Modo de Vista Previa**:
   - **Modo Tablas Semanales Ultra-Compactas**: 5 bloques semanales ajustados verticalmente (cada bloque mide ~170px de alto, total ~900px < 1050px espacio imprimible A4).
   - **Modo Matriz Mensual**: 1 sola tabla unificada donde las Filas son las Semanas/Días (10 filas) y las Columnas son las Funciones/Roles. Mide ~280px de alto total.
