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
