# Tasks: Programa de Predicación — Backend CRUD

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~845 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation → PR 2: Core → PR 3: Wiring + Tests |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Migration + Model + DTO | PR 1 | base: feature/tracker branch; compiles independently |
| 2 | Repository + Service + service tests | PR 2 | base: PR 1 branch; depends on PR 1 |
| 3 | Handler + Routes + handler tests | PR 3 | base: PR 2 branch; depends on PR 2 |

## Phase 1: Foundation

- [x] 1.1 Create `backend/migrations/005_programa_predicacion.sql` — main table, join table, unique (fecha, hora_inicio), indexes, trigger
- [x] 1.2 Create `backend/internal/models/programa_predicacion.go` — `ProgramaPredicacion` struct with JSON + db tags + `Response` struct
- [x] 1.3 Create `backend/internal/dto/programa_predicacion.go` — `CreateProgramaPredicacionRequest`, `UpdateProgramaPredicacionRequest`, `ProgramaPredicacionResponse`, converter

## Phase 2: Core (RED → GREEN)

- [x] 2.1 Write failing test: service duplicate `fecha`+`hora_inicio` returns 409 with mock repo
- [x] 2.2 Write failing test: service `GetByID` returns error when missing
- [x] 2.3 Write failing test: service `SyncTerritorios` replaces join-table rows atomically
- [x] 2.4 Implement `backend/internal/repositories/programa_predicacion_repo.go` — CRUD + `SyncTerritorios` + `GetTerritoriosByProgramaID`
- [x] 2.5 Implement `backend/internal/services/programa_predicacion_service.go` — duplicate check, territorio sync, missing-ID handling
- [x] 2.6 Make all service tests pass (GREEN)

## Phase 3: Wiring (RED → GREEN)

- [x] 3.1 Write failing handler test: POST creates program, returns 201 + `{ data }`
- [x] 3.2 Write failing handler test: POST duplicate returns 409
- [x] 3.3 Write failing handler test: PUT missing ID returns 404
- [x] 3.4 Write failing handler test: DELETE returns 204
- [x] 3.5 Write failing handler test: invalid UUID in param returns 400
- [x] 3.6 Implement `backend/internal/handlers/programa_predicacion_handler.go` — 5 Fiber handlers (List, GetByID, Create, Update, Delete)
- [x] 3.7 Modify `backend/cmd/server/main.go` — init service, register `protected.Group("/programas-predicacion")`
- [x] 3.8 Make all handler tests pass (GREEN)

## Phase 4: Comprehensive Tests

- [x] 4.1 Write handler test: unauthenticated request returns 401
- [x] 4.2 Write handler test: List response wraps in `{ "data": [...] }`
- [x] 4.3 Write handler test: Update with empty territorios clears join table
- [x] 4.4 Write handler test: GET /:id for non-existent ID returns 404
