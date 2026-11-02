# Tasks: Dashboard de Notificaciones de Asignaciones

## Phase 1: Infrastructure (DB + Modelos)

- [x] 1.1 Crear migración `017_add_notificaciones_asignaciones.sql` con nuevos campos: referencia_id, referencia_tipo, y TTL para notificaciones de asignaciones
- [x] 1.2 Modificar `internal/models/notificacion.go`: agregar enum tipos ASIGNACION_CREADA, ASIGNACION_ACTUALIZADA, ASIGNACION_COMPLETADA
- [x] 1.3 Agregar referencias (referencia_id, referencia_tipo) al struct Notificacion - opcionales para notificaciones de asignaciones
- [x] 1.4 Actualizar método IsValid() y String() del enum NotificacionTipo

## Phase 2: Core Backend

- [x] 2.1 Extender `NotificacionRepository` con nuevo método para crear notificaciones de asignación y limpieza TTL
- [x] 2.2 Extender `NotificacionService` para soportar el nuevo tipo con referencia
- [x] 2.3 Modificar handler de asignaciones para generar notificación automática al crear/actualizar
- [x] 2.4 Agregar endpoint TTL para limpiar notificaciones de más de 30 días
- [x] 2.5 Agregar endpoint para rekindle de notificaciones de visita 20 días antes

## Phase 3: Frontend Dashboard

- [x] 3.1 Crear componente `notification-dashboard.component.ts` agrupado por tipo
- [x] 3.2 Agregar mapa de colores e iconos por tipo de notificación
- [x] 3.3 Agregar filtros por tipo en la UI (dropdown/checkboxes)
- [x] 3.4 Agregar badge de "no leído" en cada tarjeta
- [x] 3.5 Agregar empty state cuando no hay notificaciones
- [x] 3.6 Agregar paginación (límite 50)

## Phase 4: Testing

- [x] 4.1 Tests unitarios: verificar nuevo enum NotificacionTipo IsValid() y String()
- [x] 4.2 Tests unitarios: verificar generación de notificaciones en asignacion_handler
- [x] 4.3 Tests integración: GET /api/notificaciones retorna notificaciones agrupadas por tipo
- [x] 4.4 Tests frontend: verificar rendering de dashboard agrupado y badges de unread

## Phase 5: Cleanup

- [x] 5.1 Revisar y limpiar logs de notificaciones en handlers
- [x] 5.2 Verificar que notificaciones old (≥30 días) de asignaciones se eliminen correctamente
- [x] 5.3 Documentar nuevo enum en comentarios del modelo
## Closure Note (2026-11-01)

Phase 4 (Testing) and Phase 5 (Cleanup) completed. The verify-report v1.0 claiming 25/25 was optimistic: phases 4-5 were still open in tasks.md and several existing "integration tests" were hollow `t.Log` placeholders.

Work done:

- **4.1** `internal/models/notificacion_test.go`: IsValid/String for all 7 NotificacionTipo values + invalid/fallback cases + ReferenciaTipo.IsValid.
- **4.2** Test seams + `internal/services/asignacion_service_notify_test.go`: AsignacionService.notifService now typed as local interface `notificacionCreator` (same per-dependency pattern as the repo fields; constructor keeps the concrete `*NotificacionService` param with defensive nil conversion to avoid the Go typed-nil trap — caught by TestAsignacionService_Create_NilNotifCreatorDoesNotPanic). 5 tests: Create notifies ASIGNACION_CREADA with referencia + tipo/semana names; grupo assignment does not notify; Update notifies ASIGNACION_ACTUALIZADA; BulkCreate notifies per user item; nil creator does not panic.
- **4.3** `internal/handlers/notificacion_handler_list_test.go`: NotificacionHandler.notificacionService now typed as local interface `notificacionServiceAPI` (6 methods, defensive nil conversion). Real Fiber `app.Test()` GET /api/notificaciones with fake service asserting mixed tipos in `data` (dashboard groups client-side) + unread_count.
- **4.4** Frontend: `notification-dashboard.component.spec.ts` (42 tests) covers grouping filters, unread badges, empty states, pagination. Full frontend suite 153/153 green.
- **5.1** Log review: only 2 `log.Printf` error logs remain in notificacion_handler.go REKINDLE path (legitimate error handling). No print/debug logs in notificacion_service.go or asignacion_service.go.
- **5.2** TTL verified: `TestNotificacionService_CleanupOldNotifications` (in-memory, 3 subtests) green; repo-level `TestNotificacionRepository_DeleteOlderThan` exists but is env-blocked (needs live Postgres test DB).
- **5.3** Enum documented in `internal/models/notificacion.go` (type-level comment block + per-branch String()).

Backend suites: handlers/middleware/models/services/jwt all OK. Only pre-existing `TestNotificacionRepository_*` fail (Postgres SASL auth, env-blocked, unrelated).

Known spec-vs-code gaps are recorded at the bottom of `openspec/specs/notificaciones-asignaciones/spec.md` (ASIGNACION_ELIMINADA, ASIGNACION_COMPLETADA, referencia_id semantics).