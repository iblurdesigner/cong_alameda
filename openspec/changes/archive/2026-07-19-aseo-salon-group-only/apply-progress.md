# Apply Progress: aseo-salon-group-only

**Change**: aseo-salon-group-only
**Mode**: Strict TDD (RED → GREEN)
**Branch**: feat/aseo-salon-group-only
**Status**: Tasks 4, 5, 6, 9, 10 complete. Task 11 (verification) pending.

## Completed Tasks
- [x] Task 4 (BulkCreate fix): handler now parses every UUID strictly; invalid grupo_id → 400 `invalid_grupo_id`. Bulk items routed through service `BulkCreate` so ASEO_SALON enforcement applies per item.
- [x] Task 5 (Service enforcement): `AsignacionService` resolves tipo via `tipoAsignRepo.GetByID` and enforces ASEO_SALON → require `GrupoID != nil` AND `UserID == uuid.Nil`, else returns `ErrAseoSalonRequiresGrupo`. Applied in Create, Update (resolves tipo from existing record via new repo `GetByID`), and BulkCreate (per item). Non-ASEO_SALON types unchanged. Service now depends on minimal repo interfaces (no main.go change).
- [x] Task 6 (Frontend lista): re-applied ASEO_SALON-only-group branch in `asignacion-list.component.ts` on the reverted clean base. Template shows `#grupoSelect` for ASEO_SALON UUID, `#persona` otherwise; observaciones always visible. `onTipoChange()` resets both user_id and grupo_id. `saveAsignacion()` sends `grupo_id: ... || undefined`. Added `grupos` signal + `loadGrupos()`. No CSS renames / HTML compaction introduced.
- [x] Task 9 (Backend tests, Strict TDD): RED written first, then GREEN. Covers invalid_grupo_id (Create/Update/BulkCreate), ASEO_SALON enforcement (reject user, require grupo) for Create/Update/BulkCreate, non-ASEO success, and grupo_id persistence via mock repo.
- [x] Task 10 (Frontend render test): new `asignacion-list.component.spec.ts` (6 tests) asserting ASEO_SALON renders only group selector; observaciones visible; non-ASEO renders only person; save sends grupo_id not user_id; onTipoChange resets both.

## Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `backend/internal/services/asignacion_service.go` | Modified | Added `ErrAseoSalonRequiresGrupo`, `aseoSalonNombre` const, repo interfaces, `enforceAseoSalonPolicy`, enforcement in Create/Update/BulkCreate. |
| `backend/internal/handlers/asignacion_handler.go` | Modified | Handler now depends on `asignacionService` interface; BulkCreate parses UUIDs strictly (invalid_grupo_id); maps `ErrAseoSalonRequiresGrupo` → 400 `aseo_salon_requires_grupo`. |
| `backend/internal/repositories/asignacion_repo.go` | Modified | Added `GetByID` (returns `ErrAsignacionNotFound`); added `pgx` import. |
| `backend/internal/services/asignacion_service_test.go` | Created | Strict TDD tests for service ASEO_SALON enforcement + grupo persistence. |
| `backend/internal/handlers/asignacion_handler_test.go` | Created | Strict TDD tests for invalid_grupo_id (Create/Update/BulkCreate) + aseo_salon mapping. |
| `frontend/src/app/features/asignaciones/asignacion-list.component.ts` | Modified | Re-applied ASEO_SALON only-group branch; save/onTipoChange/grupos signal. |
| `frontend/src/app/features/asignaciones/asignacion-list.component.spec.ts` | Created | Render + behavior tests for ASEO_SALON branch. |

## Deviations from Design
- Service `Update` resolves the ASEO_SALON tipo from the existing assignment via a NEW repository method `GetByID` (the Update signature was NOT changed to avoid touching main.go). This is the minimal injection noted as acceptable in the task brief.
- Handler was refactored to depend on an `asignacionService` interface (structurally satisfied by `*services.AsignacionService`), enabling unit tests with a mock. main.go wiring unchanged.
- Service now depends on small repo interfaces instead of concrete `*repositories.X` structs; main.go still compiles (concrete repos satisfy the interfaces).

## Issues Found
- Pre-existing: `frontend/src/app/core/services/auth.service.spec.ts` fails `tsc --noEmit` due to missing `@types/jest` (unrelated to this change). Jest runtime is unaffected. Noted, not fixed.
- Latent BulkCreate UUID-parse bug (task brief) fixed.

## Remaining Tasks
- [ ] Task 11: Verification (integration/manual: create ASEO_SALON with grupo via lista + editor, confirm backend rejects user_id, confirm non-ASEO still works) — belongs to sdd-verify.

## Workload / PR Boundary
- Mode: single PR (review budget ~250-320 lines, Low risk per forecast).
- Current work unit: full change (tasks 4,5,6,9,10).
- Boundary: from clean reverted base through enforcement + frontend re-apply + tests.
- Estimated review budget impact: within 400-line limit.

## TDD Cycle Evidence
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 9 (service) | `asignacion_service_test.go` | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 5 cases (reject user, require grupo, non-ASEO ok, Update, Bulk) | ✅ Clean |
| 9 (handler) | `asignacion_handler_test.go` | Unit (HTTP) | N/A (new) | ✅ Written | ✅ Passed | ✅ 5 cases (Create/Update/Bulk invalid_grupo_id, aseo mapping x2) | ✅ Clean |
| 10 (frontend) | `asignacion-list.component.spec.ts` | Unit (Angular) | N/A (new) | ✅ Written | ✅ Passed | ✅ 6 cases | ✅ Clean |

## Test Summary
- **Total tests written**: 16 (10 backend + 6 frontend)
- **Total tests passing**: 16
- **Layers used**: Unit (16)
- **Approval tests**: None — no refactoring of existing behavior.
- **Pure functions created**: none (enforcement is in service methods operating on models).
