# Tasks: Guardas de ruta para SUPER_ADMIN

**Cambio**: `super-admin-route-guards`

## Fase 1: Aplicación

- [x] 1.1 Ampliar guardas de ruta en `backend/cmd/server/main.go` a
  `RequireRole("SUPERINTENDENTE", "SUPER_ADMIN")` (21 rutas).
  — Aplicado en commit `f771487`.

## Fase 2: Prueba (Strict TDD)

- [x] 2.1 Crear `backend/internal/middleware/auth_test.go` con prueba
  multi-rol: SUPER_ADMIN permitido y rol menor rechazado (403).
  — RED → GREEN (4 pruebas PASS).

## Fase 3: Verificación

- [x] 3.1 Ejecutar `cd backend && go build ./...` y `go test ./...`;
  producir `verify-report.md`. Veredicto PASS.

## Fase 4: Archivo

- [ ] 4.1 Mover el directorio del cambio a
  `openspec/changes/archive/2026-07-19-super-admin-route-guards/`
  y producir `archive-report.md` (hybrid).

---

## Review Workload Forecast

- **Líneas estimadas de cambio**: < 100 (solo código de prueba).
- **400-line budget risk**: Low.
- **Chained PRs recommended**: No.
- **Decision needed before apply**: No.
- **Estrategia de entrega**: single PR (el commit `f771487` ya existe; se
  añade el archivo de prueba en el mismo PR de trabajo).
- **Rollback boundary**: el archivo `auth_test.go` es autónomo; revertirlo no
  afecta `main.go`.
