# Design: Previsualización de Programa a PDF

## Architecture & Layout
- Modal rediseñado con layout responsive de 2 columnas (`.pdf-modal-container`):
  - `.pdf-modal-sidebar`: Lista de semanas disponibles con checkboxes, contador de semanas seleccionadas y accesos rápidos (Seleccionar todo / Desmarcar todo).
  - `.pdf-modal-preview`: Área de previsualización en vivo (`.pdf-preview-sheet`) con estilo de hoja imprimible (fondo blanco, tipografía limpia, sombras de papel).
- Carga de datos multi-semana:
  - Mantener un mapa de datos en TS `previewWeeksMap = signal<Map<string, SemanaData>>(new Map())`.
  - Cargar las asignaciones de cada semana seleccionada con `asignacionService.loadAsignacionesBySemana(id)`.
- Reglas `@media print`:
  - Al ejecutar `window.print()`, ocultar la UI general del sistema (`nav`, `header`, `.modal-backdrop`, `.pdf-modal-sidebar`, `.modal-footer`).
  - Mostrar solo `.pdf-preview-sheet` en pantalla completa con bordes limpios, saltos de página adecuados por semana y tipografía de impresión optimizada.
