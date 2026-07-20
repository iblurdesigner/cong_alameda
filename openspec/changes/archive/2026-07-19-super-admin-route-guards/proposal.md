# Propuesta: Guardas de ruta para SUPER_ADMIN

**Cambio**: `super-admin-route-guards`
**Fecha**: 2026-07-19
**Estado**: Aplicado (commit `f771487`) + prueba pendiente

## Intención

Los usuarios con rol `SUPER_ADMIN` deben disponer del mismo acceso de escritura
privilegiado que `SUPERINTENDENTE` en las rutas protegidas del backend: `casa`,
`visita`, `usuario`, `grupo`, `territorio`, `semana`, `dia` y `asignacion`.
Actualmente esas rutas sólo admiten `SUPERINTENDENTE`, lo que obliga a usar la
cuenta de superintendente para tareas administrativas que debería poder realizar
`SUPER_ADMIN`.

## Alcance

- **Único archivo afectado**: `backend/cmd/server/main.go` (ya aplicado en
  `f771487`).
- Se amplía cada guarda `RequireRole("SUPERINTENDENTE")` a
  `RequireRole("SUPERINTENDENTE", "SUPER_ADMIN")` en las rutas mutantes
  (POST/PUT/DELETE) de los grupos mencionados.
- **Fuera de alcance**: frontend, migraciones, cambios de modelo, lógica de
  handlers, nuevos endpoints.

## Enfoque

Aprovechar la capacidad multi-rol ya existente en
`backend/internal/middleware/auth.go` (`RequireRole(roles ...string)`), que
acepta cualquier rol de la lista. No se requiere cambio en el middleware ni en
los handlers: basta con pasar el rol adicional en el cableado de `main.go`.

## Riesgo

Bajo. Es cableado puro de autorización. No altera el comportamiento para
`SUPERINTENDENTE` y sigue rechazando (403) roles menores.
