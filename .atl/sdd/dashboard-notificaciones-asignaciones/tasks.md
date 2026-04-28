# Tasks: dashboard-notificaciones-asignaciones

## Phase 1: Foundation
- [x] 1.1 Crear migración para columnas de referencia en notificaciones
- [x] 1.2 Actualizar modelos de dominio
- [x] 1.3 Crear repository base

## Phase 2: Core Backend
- [x] 2.1 Extender `NotificacionRepository` con nuevo método para crear notificaciones de asignación y limpieza TTL
- [x] 2.2 Extender `NotificacionService` para soportar el nuevo tipo con referencia
- [x] 2.3 Modificar handler de asignaciones para generar notificación automática al crear/actualizar
- [x] 2.4 Agregar endpoint TTL para limpiar notificaciones de más de 30 días
- [x] 2.5 Agregar endpoint para rekindle de notificaciones de visita 20 días antes

## Phase 3: Dashboard UI
- [x] 3.1 Crear componente de dashboard de notificaciones
- [x] 3.2 Implementar filtros por tipo
- [x] 3.3 Implementar agrupamiento por tipo
- [x] 3.4 Badge de unread count en filtros

## Phase 4: Testing
- [x] 4.1 Tests unitarios para nuevos métodos del repository (CreateConReferencia, DeleteOlderThan, GetVisitasProximas)
- [x] 4.2 Tests unitarios para nuevos métodos del service (CreateAsignacionNotification, CreateVisitaNotification)
- [x] 4.3 Tests de integración para endpoints TTL y rekindle
- [x] 4.4 Tests E2E para dashboard UI (agrupamiento, filtros, badge)