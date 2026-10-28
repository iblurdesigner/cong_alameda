# Specification: Vida y Ministerio (Seamos Mejores Maestros)

## Purpose

Especificacion del modulo `/asignaciones/vida-y-ministerio`: gestion del programa semanal, layout responsive y adaptacion a modo oscuro.


<!-- Fusion specs 2026-10-28 — origen: 2026-10-28-programa-vida-y-ministerio -->

# Specification: Programa Vida y Ministerio ("Seamos Mejores Maestros")

## Overview
Proveer un sistema integral para gestionar y emitir el programa semanal de la reunión "Vida y Ministerio Cristianos". El programa comprende tres secciones: Tesoros de la Biblia, Seamos Mejores Maestros (con subsalas independientes de Auditorio Principal y Sala Auxiliar) y Nuestra Vida Cristiana.

## Requirements

### Requirement: Persistencia del Programa por Semana en Backend
- GIVEN a valid `semana_id`
- WHEN a `GET /api/v1/programa-vym/semana/:semana_id` request is executed
- THEN the backend returns the stored program or 404/empty default if not yet created.

- GIVEN valid program data with dynamic room assignments (`seamos_maestros_auditorio`, `seamos_maestros_auxiliar`, `vida_cristiana_partes`)
- WHEN a `POST /api/v1/programa-vym/semana/:semana_id` request is executed
- THEN the backend upserts the `programa_vym` row and returns the saved entity with updated timestamp.

### Requirement: Historial y Edición de Reemplazos
- GIVEN a user managing assignments
- WHEN opening the Vida y Ministerio view
- THEN the system displays a week navigator and quick selector for weeks in the past month (and upcoming)
- AND allows modifying any participant (President, Speaker, Student, Assistant, Reader, etc.) and saving the change immediately.

### Requirement: Impresión y Exportación Fiel en A4
- GIVEN a loaded or edited program
- WHEN triggering print or PDF export
- THEN exactly 2 programs are laid out vertically on a single A4 sheet with a dashed dividing cut-line.


<!-- Fusion specs 2026-10-28 — origen: 2026-10-28-responsive-vida-y-ministerio -->

# Specification: Responsive Design en Asignaciones Vida y Ministerio

## Overview
Adaptar la interfaz de usuario de `/asignaciones/vida-y-ministerio` para brindar una experiencia de usuario intuitiva, ergonómica y libre de desbordamientos en smartphones (viewport < 768px), tabletas (768px - 1024px) y pantallas de escritorio.

## Requirements

### Requirement: Toggle de Vista Editor / Vista Previa en Móviles y Tablets
- GIVEN a user accessing `/asignaciones/vida-y-ministerio` on a viewport width < 1024px
- WHEN the view loads
- THEN the system displays a segmented view switch `[ ✏️ Editar ]` and `[ 📄 Vista Previa A4 ]`
- AND displays only the selected panel without horizontal layout breakage or double scrollbars.
- GIVEN a user accessing on a desktop screen (>= 1024px)
- THEN both Editor and Live Preview are displayed side by side as a split workspace.

### Requirement: Adaptabilidad del Encabezado y Acciones
- GIVEN any screen resolution down to 360px width
- WHEN viewing the top header
- THEN title, action buttons ("Word", "Imprimir/PDF", "Guardar"), and recent weeks chips wrap seamlessly
- AND buttons maintain touch targets of at least 40-44px for accessible tapping on touch devices.

### Requirement: Formulario y Tarjetas Dinámicas Flexibles
- GIVEN inputs for time, title, duration, student, and helper
- WHEN displayed on mobile screens (< 768px and < 480px)
- THEN form rows adapt into wrapping or stacked layouts preventing inputs from shrinking into unreadable sizes.
- AND inputs maintain a font size of at least 16px on mobile focus to prevent unwanted iOS auto-zoom.

### Requirement: Vista Previa A4 Adaptativa y Respeto a Impresión
- GIVEN the A4 preview panel on a smartphone or tablet
- WHEN the user selects "Vista Previa A4"
- THEN the A4 sheet is properly contained or scaled with smooth horizontal/vertical panning so users can inspect the complete layout
- AND printing or exporting to PDF via `@media print` remains unaffected with exact 210mm x 297mm dimensions and 2 stacked programs per page.


<!-- Fusion specs 2026-10-28 — origen: 2026-10-28-dark-mode-vida-y-ministerio -->

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
