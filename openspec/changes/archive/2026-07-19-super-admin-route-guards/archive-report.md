# Archive Report: Guardas de ruta para SUPER_ADMIN

**Cambio**: `super-admin-route-guards`
**Fecha de archivo**: 2026-07-19
**Rama**: `feat/super-admin-route-guards`
**Commit aplicado**: `f771487` (main.go, 21 guardas)

## Resumen

Se ampliaron las guardas de rol de las rutas mutantes privilegiadas (POST/PUT/DELETE)
de `casa`, `visita`, `usuario`, `grupo`, `territorio`, `semana`, `dia` y
`asignacion` para aceptar también el rol `SUPER_ADMIN`, mediante la firma
multi-rol ya existente `RequireRole("SUPERINTENDENTE", "SUPER_ADMIN")`.

## Delta specs sincronizados

**Ninguno.** El cambio es cableado puro de autorización (wiring). No existe una
base spec en `openspec/specs/` que describa las guardas de rol, y se decidió NO
crear specs para cableado trivial, según la convención del proyecto.

## Archivos del cambio

| Archivo | Estado |
|---|---|
| `openspec/changes/archive/2026-07-19-super-admin-route-guards/proposal.md` | archivado |
| `openspec/changes/archive/2026-07-19-super-admin-route-guards/spec.md` | archivado |
| `openspec/changes/archive/2026-07-19-super-admin-route-guards/design.md` | archivado |
| `openspec/changes/archive/2026-07-19-super-admin-route-guards/tasks.md` | archivado |
| `openspec/changes/archive/2026-07-19-super-admin-route-guards/verify-report.md` | archivado |

## Artifacts de código (fuera de openspec)

- `backend/cmd/server/main.go` — commit `f771487` (ya en la rama, no tocado).
- `backend/internal/middleware/auth_test.go` — NUEVO, sin commitear (en working tree).

## Veredicto de verify

**PASS** — `go build ./...` OK, `go test ./...` OK, 4 pruebas multi-rol PASS.

## Notas para el orquestador

- No commitear desde el agente; el orquestador hace work-unit commits.
- El único archivo sin commitear es `backend/internal/middleware/auth_test.go`.
- Conveniente añadirlo al mismo PR que `f771487`.
