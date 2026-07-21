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

- [ ] 4.1 Tests unitarios: verificar nuevo enum NotificacionTipo IsValid() y String()
- [ ] 4.2 Tests unitarios: verificar generación de notificaciones en asignacion_handler
- [ ] 4.3 Tests integración: GET /api/notificaciones retorna notificaciones agrupadas por tipo
- [ ] 4.4 Tests frontend: verificar rendering de dashboard agrupado y badges de unread

## Phase 5: Cleanup

- [ ] 5.1 Revisar y limpiar logs de notificaciones en handlers
- [ ] 5.2 Verificar que notificaciones old (≥30 días) de asignaciones se eliminen correctamente
- [ ] 5.3 Documentar nuevo enum en comentarios del modelo