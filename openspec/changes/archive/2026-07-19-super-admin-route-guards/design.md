# Design: Guardas de ruta para SUPER_ADMIN

**Cambio**: `super-admin-route-guards`

## Decisión de diseño

Ampliar los guardas de rol en el cableado de Fiber (`backend/cmd/server/main.go`)
de un rol único a dos roles, aprovechando la firma variádica ya existente del
middleware:

```go
authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN")
```

### Por qué este enfoque

- `RequireRole(roles ...string)` en `backend/internal/middleware/auth.go`
  itera la lista de roles y permite el acceso si `userRol` coincide con
  cualquiera. No requiere modificar el middleware.
- Es cableado puro: cero cambios en handlers, servicios, repositorios o modelo.
- Minimiza superficie de riesgo y facilita revisión.

## Cambio ya aplicado

Commit `f771487` (autor: iblurdesigner, 2026-07-18):

- 21 guardas de ruta cambiadas de `RequireRole("SUPERINTENDENTE")` a
  `RequireRole("SUPERINTENDENTE", "SUPER_ADMIN")` en los grupos `casa`,
  `visita`, `usuario`, `grupo`, `territorio` (incluido `/upload`), `semana`,
  `dia` y `asignacion`.
- Archivo afectado: `backend/cmd/server/main.go` (42 líneas, +21/-21).

## Enfoque de prueba (Strict TDD)

Como el cambio es de cableado y no de lógica, la prueba más significativa se
hace al nivel del middleware `RequireRole` con múltiples roles:

1. **RED**: añadir `auth_test.go` en `backend/internal/middleware/` que
   - genera un token JWT con `rol = "SUPER_ADMIN"` vía `pkg/jwt`,
   - simula una petición Fiber con `Authenticate()` + `RequireRole("SUPERINTENDENTE", "SUPER_ADMIN")`,
   - afirma que el acceso es permitido (`c.Next()`), y
   - un segundo caso con `rol = "ADMIN"` que afirma `403`.
2. **GREEN**: la prueba pasa sin modificar `main.go` ni el middleware, porque
   la lógica multi-rol ya existe.
3. **REFACTOR**: sin cambios necesarios.

Esto prueba directamente la capacidad que `main.go` ahora usa.

## Fuera de alcance

- Frontend, migraciones, modelo de datos, nuevos endpoints.
