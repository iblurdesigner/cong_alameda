# Specification: Navegación de Notificación a la Semana Específica

## Requirements

### Requirement 1: Referencia de Notificación en Backend
- `GetByUserID` en `NotificacionRepository` debe retornar `referencia_id` y `referencia_tipo` en la lista de notificaciones devuelta por `/api/notificaciones`.
- `notifyAsignacion` en `AsignacionService` debe establecer `ReferenciaID = semanaID` y `ReferenciaTipo = "ASIGNACION"` al crear notificaciones de asignación.

### Requirement 2: Navegación con Query Parameter en Frontend
- Al hacer clic en "Ver →" dentro del Dashboard de Notificaciones en un ítem de tipo asignación, la app debe redirigir a `/asignaciones?semana_id={semana_id}`.

### Requirement 3: Carga de Semana desde la URL en Asignaciones
- `AsignacionListComponent` debe suscribirse a los `queryParams` del `ActivatedRoute`.
- Si se detecta un `semana_id` válido en la URL, la vista de asignaciones debe seleccionar automáticamente dicha semana y cargar su detalle de funciones.

## Scenarios

### Scenario 1: Redirección precisa desde Notificación
- **Dado** que el usuario tiene una notificación "Se te ha asignado la función 'PARQUEADERO' para la semana 'Semana del 20 al 26 de Julio 2026'".
- **Cuando** presiona el botón "Ver →" en la tarjeta de notificación.
- **Entonces** el usuario navega a la URL `/asignaciones?semana_id=...` y la pantalla de asignaciones muestra directamente la semana del 20 al 26 de Julio de 2026.
