# Design: Programa de Predicación — Backend CRUD

## Technical Approach

Follow the existing Go/Fiber layered pattern (model → dto → repo → service → handler → route) as established by `casa`, `grupo`, and `territorio`. The key novelty is an N:M join table (`programa_predicacion_territorios`) synced via delete+insert on create/update. Any authenticated user can access all endpoints — no role guard beyond auth.

## Architecture Decisions

| Decision | Alternatives | Choice & Rationale |
|----------|-------------|-------------------|
| Join table sync strategy | Soft-delete / flag-based | **Delete old, insert new** — simpler, no orphan tracking. Join table has no independent semantics. |
| Duplicate detection | App-level check only | **DB UNIQUE constraint + app check** — the unique constraint `(fecha, hora_inicio)` is the safety net; the service check returns a friendly 409. |
| Response wrapper | Raw array / paginated | **`{ data: [...] }`** — matches GrupoHandler pattern (`fiber.Map{"data": result}`). Frontend service layer expects this shape. |
| No role guard on mutations | Add SUPERINTENDENTE requirement | **No guard** — per proposal. Programa management is a day-to-day operation all publishers should access. |
| N+1 on territorio load for List | Eager join | **Accept N+1** for v1. Each program fetches its territorios in a second query. Optimize with eager load later if perf degrades. |

## Data Flow

```
Client ──→ Handler (parse params/body)
               ──→ Service (validate, duplicate check)
                       ──→ Repository (CRUD + territorio sync)
                               ──→ PostgreSQL
                       ←── Model
               ←── DTO response
Client ←── JSON
```

**Create/Update flow** (territorio sync):
```
Service.Create
  ├── CheckDuplicate(fecha, hora_inicio) → 409 if exists
  └── Repo.Create(programa)
  └── Repo.SyncTerritorios(programaID, territorioIDs)
        ├── DELETE FROM programa_predicacion_territorios WHERE programa_id = $1
        └── INSERT INTO ... VALUES ($1, unnest($2::uuid[]))

Service.Update
  ├── Repo.GetByID → 404 if missing
  ├── CheckDuplicate (exclude self) → 409
  ├── Repo.Update(programa)
  └── Repo.SyncTerritorios(programaID, territorioIDs)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/migrations/005_programa_predicacion.sql` | Create | Main table + join table + unique constraint + indexes + trigger |
| `backend/internal/models/programa_predicacion.go` | Create | `ProgramaPredicacion` struct + `Response` struct |
| `backend/internal/dto/programa_predicacion.go` | Create | Create/Update request + response DTOs + converter |
| `backend/internal/repositories/programa_predicacion_repo.go` | Create | CRUD + `SyncTerritorios` + `GetTerritoriosByProgramaID` |
| `backend/internal/services/programa_predicacion_service.go` | Create | Duplicate check, N:M sync coordination |
| `backend/internal/handlers/programa_predicacion_handler.go` | Create | 5 Fiber handlers (List, GetByID, Create, Update, Delete) |
| `backend/cmd/server/main.go` | Modify | Init chain + route registration under Fase 2 |

## Interfaces / Contracts

### Model

```go
type ProgramaPredicacion struct {
    ID          uuid.UUID  `json:"id" db:"id"`
    Fecha       string     `json:"fecha" db:"fecha"`
    HoraInicio  string     `json:"hora_inicio" db:"hora_inicio"`
    HoraFin     *string    `json:"hora_fin,omitempty" db:"hora_fin"`
    PuntoEncuentro string  `json:"punto_encuentro" db:"punto_encuentro"`
    Direccion   string     `json:"direccion" db:"direccion"`
    Coordenadas *string    `json:"coordenadas,omitempty" db:"coordenadas"`
    GrupoID     *uuid.UUID `json:"grupo_id,omitempty" db:"grupo_id"`
    Territorios []uuid.UUID `json:"territorios,omitempty" db:"-"` // N:M, not persisted here
    Observaciones *string  `json:"observaciones,omitempty" db:"observaciones"`
    CreadoPor   string     `json:"creado_por" db:"creado_por"`
    CreatedAt   time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}
```

### DTOs

```go
type CreateProgramaPredicacionRequest struct {
    Fecha          string     `json:"fecha"`
    HoraInicio     string     `json:"hora_inicio"`
    HoraFin        *string    `json:"hora_fin,omitempty"`
    PuntoEncuentro string     `json:"punto_encuentro"`
    Direccion      string     `json:"direccion"`
    Coordenadas    *string    `json:"coordenadas,omitempty"`
    GrupoID        *uuid.UUID `json:"grupo_id,omitempty"`
    Territorios    []uuid.UUID `json:"territorios"`
    Observaciones  *string    `json:"observaciones,omitempty"`
    CreadoPor      string     `json:"creado_por"`
}
```

`UpdateProgramaPredicacionRequest`: same fields, all pointers. `ProgramaPredicacionResponse`: flattened + formatted dates, territorios as `[]uuid.UUID`.

### Routes

```
GET    /api/programas-predicacion     → List (no role guard)
GET    /api/programas-predicacion/:id → GetByID
POST   /api/programas-predicacion     → Create
PUT    /api/programas-predicacion/:id → Update
DELETE /api/programas-predicacion/:id → Delete
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — Service | Duplicate detection (409), missing programa (404), territorio sync empty list | Mock repo, table-driven tests with `t.Run` |
| Unit — Handler | 400 on bad body, 400 on invalid UUID, 200/201 on success | `httptest` + in-memory mock service (same pattern as `auth_handler_recovery_test.go`) |
| Integration | Full CRUD flow against test DB, unique constraint violation | `testcontainers` or dedicated test DB (future) |

Tests follow existing conventions: `package handlers` / `package services` with inline mocks. Handler tests use `fiber.New()` + `app.Test()`.

## Migration / Rollout

No migration required beyond running `005_programa_predicacion.sql`. No data backfill. Feature is fully gated by route registration — unregistering the routes and deleting the handler/svc/repo/DTO/model files is a complete rollback.

## Open Questions

None — all decisions are scoped per proposal.
