# Tasks: Refactor Visual de `asignacion-list.component.ts`

## Fase Apply

### 1. Refactor cosmético del componente
- [x] Normalizar comentarios HTML a MAYÚSCULAS (`<!-- ASSIGN MODAL -->`, `<!-- BULK ASSIGN MODAL -->`)
- [x] Compactar botones verbosos del bulk modal a una línea legible
- [x] Verificar `npx tsc --noEmit` → 0 errores en el archivo

### 2. Agregar spec de render (Jest)
- [x] Crear `asignacion-list.component.spec.ts` con TestBed (DOM + save-wiring)
- [x] Asertar que el modal abre y renderiza `#persona` y `#observaciones`
- [x] Asertar que `saveAsignacion` invoca `createAsignacion`
- [~] Ejecutar `npm test` → GREEN **probando bajo config corregida de Angular 21** (4/4 passed). BLOQUEADO bajo `jest.config.js` actual del repo (ver verify-report: harness no resuelve subpaths `exports`-only de Angular 21). No se editó `jest.config.js` por la regla de alcance.

### 3. Verificar
- [x] `npx tsc --noEmit` → 0 errores en `asignacion-list.component.ts` (fuente de verdad)
- [~] Ejecutar el nuevo spec → GREEN demostrado con config temporal; pendiente de habilitación de harness en repo
- [x] Producir `verify-report.md`

### 4. Archivar
- [ ] Mover dir a `openspec/changes/archive/2026-07-19-refactor-visual-asignacion-list/`
- [ ] Producir `archive-report.md`
- [ ] No se requiere actualización de base spec (cambio cosmético)

---

## Review Workload Forecast
- `Decision needed before apply: No`
- `Chained PRs recommended: No`
- `400-line budget risk: Low`
- Riesgo: bajo. Frontend únicamente, sin lógica. Una sola PR, < 400 líneas.
- `Chain strategy: pending`
