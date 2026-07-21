# Proposal: Dashboard de Notificaciones por Asignaciones

## Intent

Crear un estilo dashboard para las notificaciones donde cada notificación se muestre como una TARJETA diferenciada por tipo de asignación (visita asignada, micrófono, acomodador, plataforma, etc.). Actualmente las notificaciones son una lista plana sin distinción por tipo de asignación.

## Scope

### In Scope
- Nuevo modelo de datos para notificaciones de asignaciones (tabla + API)
- Nuevo tipo de notificaciones: `ASIGNACION_CREADA`, `ASIGNACION_ACTUALIZADA`, `ASIGNACION_COMPLETADA`
- Frontend: Dashboard con tarjetas visuales agrupadas por tipo de notificación
- Filtros por tipo de asignación en la UI
- Indicadores visuales (icono, color) por cada tipo de asignación

### Out of Scope
- Notificaciones push en tiempo real (WebSocket) — queda para fase 2
- Historial de asignaciones por miembro — queda para fase 2

## Capabilities

### New Capabilities
- `notificaciones-asignaciones`: Sistema de notificaciones vinculadas a asignaciones internas de la congregación. CRUD completo para notificaciones de tipo asignación.
- `notificaciones-dashboard-ui`: Dashboard visual con tarjetas diferenciadas por tipo de notificación. Incluye filtros yagrupación por tipo.

### Modified Capabilities
- `notificaciones`: Expandir el tipoenum actual (4 tipos) para incluir 3 nuevos tipos relacionados con asignaciones.

## Approach

1. **Backend**: Extender el enum `notificacion_tipo` en PostgreSQL con 3 nuevos tipos (`ASIGNACION_CREADA`, `ASIGNACION_ACTUALIZADA`, `ASIGNACION_COMPLETADA`). Crear endpoint POST que genere automáticamente notificaciones cuando se crea/actualiza una asignación.

2. **Frontend**: Reemplazar la lista plana actual (`notification-list.component.ts`) con un dashboard que agrupe notificaciones por tipo, mostrando tarjetas visuales con:
   - Color de fondo según tipo de asignación
   - Icono correspondiente (usar los iconos existentes de `asignacion-list.component.ts`)
   - Título corto, mensaje, fecha
   - Badge de "no leído"

3. **Data Flow**: El servicio de asignaciones (`asignacion.service.ts`) llama al backend para crear notificación cuando se guarda una asignación.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/internal/models/notificacion.go` | Modified | Agregar constantes para nuevos tipos |
| `backend/migrations/` | New | ALTER TYPE para agregar 3 tipos |
| `backend/internal/handlers/notificacion.go` | Modified | Endpoint POST para crear notificación por asignación |
| `frontend/src/app/features/notifications/` | New | Nuevos componentes de dashboard |
| `frontend/src/app/core/services/notification.service.ts` | Modified | Métodos para filtrar por tipo |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper compatibilidad con notificaciones existentes | Low | Migración idempotente, no elimina tipos actuales |
| UI的性能 degradada con muchas notificaciones | Medium | Agregar paginación (limit 50 por request) |
| Doble logging (asignación + notificación) | Medium | Transacción atómica en backend |

## Rollback Plan

1. Backend: Revertir migración `ALTER TYPE` (requiere drop de columna)
2. Frontend: Revertir componentes al código anterior del git
3. Database: Eliminar registros de nuevos tipos de notificación
4. No hay backwards compatibility issues porque solo se agregan tipos

## Dependencies

- Ninguna dependencia externa
- Requiere que el modelo de `asignaciones` esté funcionando (ya existe)

## Success Criteria

- [ ] Las notificaciones de asignación aparecen en dashboard con tarjeta visual diferenciada
- [ ] Filtro por tipo funciona correctamente
- [ ] Notificaciones se crean automáticamente al guardar asignación
- [ ] Tests pasan para nuevos endpoints
- [ ] UI carga en menos de 500ms con hasta 100 notificaciones