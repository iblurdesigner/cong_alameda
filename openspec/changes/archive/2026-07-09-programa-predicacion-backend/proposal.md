# Proposal: Programa de Predicación — Backend CRUD

## Intent

Frontend has full UI for "Programa de Predicación" (list/create/edit/delete + territory assignment). Backend has zero endpoints. Users cannot manage preaching programs until the API exists.

## Scope

### In Scope
- Migration 005: `programas_predicacion` table + join table `programa_predicacion_territorios` (N:M)
- Full CRUD handler: List, GetByID, Create, Update, Delete
- Model + DTOs matching frontend interface (all location/contact fields, optional grupo reference, optional territorios array)
- Duplicate validation: 409 Conflict on same `fecha` + `hora_inicio`
- N:M territorio sync on create/update (replace all assignments)
- Routes: `GET/POST /api/programas-predicacion`, `GET/PUT/DELETE /api/programas-predicacion/:id`
- Any authenticated user (no role guard on any endpoint)

### Out of Scope
- Frontend changes (already complete)
- Calendar/gantt scheduling view
- Email/push notifications on program changes
- Pagination (list returns all; page/limit added later if needed)

## Capabilities

### New Capabilities
- `programa-predicacion`: backend CRUD API for preaching program management, including N:M territorio assignment

### Modified Capabilities
- None

## Approach

Follow the existing Go/Fiber layered pattern (same as `grupo`, `casa`, `territorio`):

1. **Migration** — `005_programa_predicacion.sql`: main table with all fields + join table + unique constraint on `(fecha, hora_inicio)` + FK to `grupos` (optional) + FK to `territorios` via join table
2. **Model** — `ProgramaPredicacion` struct in `models/programa_predicacion.go` with JSON + db tags
3. **DTOs** — `CreateProgramaPredicacionRequest`, `UpdateProgramaPredicacionRequest`, `ProgramaPredicacionResponse` in DTO package
4. **Repository** — pgx queries in `repositories/programa_predicacion_repo.go`: CRUD + territorio join sync
5. **Service** — `services/programa_predicacion_service.go`: duplicate check, territorio association management
6. **Handler** — `handlers/programa_predicacion_handler.go`: Fiber CRUD methods (no role guard, just `Authenticate()`)
7. **Routes** — Register in `main.go`: `protected.Group("/programas-predicacion")`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/migrations/005_programa_predicacion.sql` | New | Tables + join table + unique constraint |
| `backend/internal/models/programa_predicacion.go` | New | Model struct |
| `backend/internal/dto/programa_predicacion.go` | New | Request/response DTOs |
| `backend/internal/repositories/programa_predicacion_repo.go` | New | pgx CRUD + join sync |
| `backend/internal/services/programa_predicacion_service.go` | New | Business logic + validations |
| `backend/internal/handlers/programa_predicacion_handler.go` | New | Fiber handler methods |
| `backend/cmd/server/main.go` | Modified | Init chain + route registration |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| N+1 on list (territorios per program) | Medium | Acceptable for v1; eager-load if perf degrades |
| Race condition on duplicate check | Low | DB unique constraint as safety net |

## Rollback Plan

Remove route registration in `main.go`. Delete handler, service, repo, model, DTO files. Drop migration 005. Revert `main.go` init chain.

## Dependencies

- None (no new external packages)

## Success Criteria

- [ ] All CRUD endpoints respond correctly (200/201/204/404)
- [ ] Duplicate `fecha` + `hora_inicio` returns 409 Conflict
- [ ] N:M territorio assignment creates/updates join table correctly
- [ ] Any authenticated user can access all endpoints (no 403)
- [ ] Build compiles without errors
