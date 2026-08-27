# Specification: Notificaciones

## Requirements

### REQ-01: Referencia de Notificación en Backend
- `GetByUserID` en `NotificacionRepository` MUST retornar `referencia_id` y `referencia_tipo` en la lista de notificaciones devuelta por `/api/notificaciones`.
- `notifyAsignacion` en `AsignacionService` MUST establecer `ReferenciaID = semanaID` y `ReferenciaTipo = "ASIGNACION"` al crear notificaciones de asignación.

### REQ-02: Navegación con Query Parameter en Frontend
- Al hacer clic en "Ver →" dentro del Dashboard de Notificaciones en un ítem de tipo asignación, la app MUST redirigir a `/asignaciones?semana_id={semana_id}`.

### REQ-03: Carga de Semana desde la URL en Asignaciones
- `AsignacionListComponent` MUST suscribirse a los `queryParams` del `ActivatedRoute`.
- Si se detecta un `semana_id` válido en la URL, la vista de asignaciones MUST seleccionar automáticamente dicha semana y cargar su detalle de funciones.

## Scenarios

### SCN-01: Redirección precisa desde Notificación
- **Given** que el usuario tiene una notificación "Se te ha asignado la función 'PARQUEADERO' para la semana 'Semana del 20 al 26 de Julio 2026'".
- **When** presiona el botón "Ver →" en la tarjeta de notificación.
- **Then** el usuario navega a la URL `/asignaciones?semana_id=...` y la pantalla de asignaciones muestra directamente la semana del 20 al 26 de Julio de 2026.
