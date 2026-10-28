# Design: Programa Vida y Ministerio

## Architecture Decisions

### 1. Database Schema (`021_programa_vym.sql`)
- Foreign Key to `semanas_visita(id)` with `UNIQUE(semana_id)` ensuring 1 program per week.
- JSONB columns `seamos_maestros_auditorio`, `seamos_maestros_auxiliar`, and `vida_cristiana_partes` for flexible dynamic parts.

### 2. Backend Layering (Go / Fiber)
- `models.ProgramaVyM`: Go struct with JSON and DB tags.
- `dto.UpsertProgramaVyMRequest`: input validation and JSON unmarshaling.
- `repositories.ProgramaVyMRepository`: parameterized queries with `pgx`.
- `services.ProgramaVyMService`: validation and upsert logic.
- `handlers.ProgramaVyMHandler`: Fiber endpoints under `/api/v1/programa-vym`.

### 3. Frontend Architecture (Angular 21)
- `VidaMinisterioComponent` as a standalone component using Angular Signals.
- Live reactive preview updating immediately on input change.
- Native CSS `@media print` with `@page { size: A4; margin: 0; }` rendering exactly 2 stacked cards separated by `.cut-line`.
- Autocomplete integration with `UserService`.
