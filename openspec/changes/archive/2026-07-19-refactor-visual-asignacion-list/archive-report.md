# Archive Report — `refactor-visual-asignacion-list`

## Estado
**Archivado**. Cambio puramente cosmético de `asignacion-list.component.ts` completado y verificado (ver `verify-report.md`).

## Qué se hizo
- Refactor cosmético aplicado: comentarios HTML normalizados a MAYÚSCULAS
  (`<!-- ASSIGN MODAL -->`, `<!-- BULK ASSIGN MODAL -->`) y botones verbosos del
  bulk modal compactados a una línea legible.
- Sin cambios de lógica de negocio; data flow, modal de asignación, `saveAsignacion`
  y la lógica de `main` (incl. ASEO_SALON, ausente en main) intactos.
- Spec `asignacion-list.component.spec.ts` creado (TestBed + DOM + save-wiring).
- `npx tsc --noEmit` → 0 errores en el archivo (fuente de verdad).
- Spec ejecutado **GREEN 4/4** bajo configuración de Jest corregida para Angular 21.

## Verdict de verify
**PASS WITH WARNINGS** — ver `verify-report.md`. El spec está verificado; el
harness de pruebas del repo (pre-existente, `jest-preset-angular@16.1.1` + Jest 30)
no resuelve subpaths `exports`-only de Angular 21 y requiere un ajuste de
test-infra fuera del alcance de este refactor (documentado en verify-report).

## Base spec domain update
No requerido — cambio cosmético, sin contrato de comportamiento nuevo.

## Archivos
- `frontend/src/app/features/asignaciones/asignacion-list.component.ts` (modificado)
- `frontend/src/app/features/asignaciones/asignacion-list.component.spec.ts` (nuevo)
- `openspec/changes/archive/2026-07-19-refactor-visual-asignacion-list/*` (este dir)
