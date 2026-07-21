# Spec: Guardas de ruta para SUPER_ADMIN

**Cambio**: `super-admin-route-guards`

## Requisito

Las rutas mutantes privilegiadas (POST/PUT/DELETE) de los grupos `casa`,
`visita`, `usuario`, `grupo`, `territorio`, `semana`, `dia` y `asignacion`
deben aceptar los roles `SUPERINTENDENTE` y `SUPER_ADMIN`, y rechazar
cualquier rol menor con `403 Forbidden` (o `401 Unauthorized` si no hay token).

### REQ-01: Aceptación de SUPER_ADMIN en rutas privilegiadas

Las rutas protegidas por `RequireRole("SUPERINTENDENTE", "SUPER_ADMIN")`
deben permitir el acceso a un token cuyo `rol` sea `SUPER_ADMIN`.

**Escenarios**:

- **Dado** un token válido con `rol = "SUPER_ADMIN"`
  **Cuando** se invoca una ruta POST/PUT/DELETE de `casa`, `visita`,
  `usuario`, `grupo`, `territorio`, `semana`, `dia` o `asignacion`
  **Entonces** la guarda `RequireRole("SUPERINTENDENTE", "SUPER_ADMIN")` delega
  a `c.Next()` (acceso permitido).

- **Dado** un token válido con `rol = "SUPERINTENDENTE"`
  **Cuando** se invoca la misma ruta
  **Entonces** el acceso se permite (sin cambios de comportamiento).

### REQ-02: Rechazo de roles menores

Las mismas rutas deben rechazar un token con un rol distinto a los permitidos.

**Escenarios**:

- **Dado** un token válido con `rol = "ADMIN"` (u otro rol menor)
  **Cuando** se invoca una ruta protegida
  **Entonces** la guarda responde `403 Forbidden` con
  `{"error": "No tienes permiso para acceder a este recurso"}`.

- **Dado** una petición sin token (o con token inválido)
  **Cuando** se invoca una ruta protegida
  **Entonces** `Authenticate()` responde `401 Unauthorized`.

## Notas

- No hay cambio de comportamiento para `SUPERINTENDENTE`.
- El middleware `RequireRole` ya soporta múltiples roles; el cambio es
  exclusivamente de cableado en `main.go`.
