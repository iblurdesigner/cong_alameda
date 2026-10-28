# Specification: Adaptación a Modo Oscuro de Vida y Ministerio

## Overview
Alinear visualmente la vista `/asignaciones/vida-y-ministerio` con el diseño global de tema oscuro de la aplicación activado mediante el atributo `[data-theme="dark"]` en el elemento raíz HTML.

## Requirements

### Requirement: Consistencia del Workspace y Paneles en Modo Oscuro
- GIVEN the application is in dark mode (`data-theme="dark"`)
- WHEN viewing `/asignaciones/vida-y-ministerio`
- THEN the layout background, top header, editor panel, subtabs, and mobile view tabs use dark surface colors (`--background-color`, `--surface-color`).
- AND all titles, text labels, and icons are rendered with high contrast against the dark background (`--text-primary`, `--text-secondary`).

### Requirement: Formularios y Tarjetas Dinámicas Adaptadas
- GIVEN inputs, fieldsets, dynamic item cards, and study blocks in dark mode
- WHEN the user edits the program
- THEN all text inputs have a dark background (`var(--surface-color)` or `#1e293b`), borders use `--border-color`, and text color is crisp white (`#f8fafc`).
- AND read-only fields have an appropriate muted contrast preventing glare.

### Requirement: Preservación de la Simulación de Hoja A4 Física e Impresión
- GIVEN the preview panel in dark mode
- WHEN viewing the sheet `.sheet-a4` or printing the document
- THEN the A4 sheet continues to be rendered as an authentic white paper sheet with black typography and crisp colored section headers
- AND printing behavior `@media print` remains 100% faithful to the white-paper output.

### Requirement: Modales de Notificaciones S-89 en Modo Oscuro
- GIVEN the S-89 notification modal is opened in dark mode
- THEN the modal backdrop, modal card, filter tabs, student cards, and phone inputs adopt dark theme styling with clear status accents (green for WhatsApp, blue/amber for room badges).
