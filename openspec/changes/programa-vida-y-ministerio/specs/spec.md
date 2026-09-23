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
