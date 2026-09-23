# Tasks: Programa Vida y Ministerio

## Phase 1: Backend Database & Models (TDD)
- [x] 1.1 Create migration `021_programa_vym.sql`
- [x] 1.2 Create Go model `internal/models/programa_vym.go`
- [x] 1.3 Create DTO `internal/dto/programa_vym.go`
- [x] 1.4 Implement repository with unit tests (`internal/repositories/programa_vym_repository.go` & `_test.go`)
- [x] 1.5 Implement service with unit tests (`internal/services/programa_vym_service.go` & `_test.go`)
- [x] 1.6 Implement handler and register routes with tests (`internal/handlers/programa_vym_handler.go` & `_test.go`)

## Phase 2: Frontend Service & Routing
- [x] 2.1 Create Angular service `src/app/core/services/programa-vym.service.ts`
- [x] 2.2 Register route `/asignaciones/vida-y-ministerio` in `app.routes.ts`

## Phase 3: Component Implementation & Live Preview
- [x] 3.1 Build `VidaMinisterioComponent` layout with tabs for navigation in `/asignaciones`
- [x] 3.2 Build week navigator with recent 1-month history selector for fast replacement editing
- [x] 3.3 Build dynamic form editor (Tesoros, Seamos Mejores Maestros auditorio & auxiliar, Vida Cristiana) with publisher autocomplete
- [x] 3.4 Build live A4 preview (2 programs stacked with cut line)
- [x] 3.5 Implement print and export logic

## Phase 4: Verification & Tests
- [x] 4.1 Run backend tests
- [x] 4.2 Run frontend tests
- [x] 4.3 End-to-end sanity check
