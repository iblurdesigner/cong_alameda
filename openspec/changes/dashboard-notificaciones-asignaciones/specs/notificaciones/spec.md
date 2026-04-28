# Delta for Notificaciones

Extiende el tipo enum `NotificacionTipo` para incluir 3 nuevos tipos relacionados con asignaciones.

## ADDED Requirements

(None)

## MODIFIED Requirements

### Requirement: Tipos de notificación disponibles (EXPANDED)

El sistema DEBE soportar los siguientes tipos de notificación:

**Tipos existentes (sin cambios):**
- `CASA_REGISTRADA`: Notificación cuando se registra una nueva casa en el sistema
- `VISITA_PROGRAMADA`: Notificación cuando se programa una visita
- `VISITA_COMPLETADA`: Notificación cuando se completa una visita
- `PERSONA_REQUIERE_VISITA`: Notificación cuando una persona requiere visita

**Nuevos tipos agregados:**
- `ASIGNACION_CREADA`: Notificación cuando se crea una asignación para un miembro
- `ASIGNACION_ACTUALIZADA`: Notificación cuando se actualiza una asignación existente
- `ASIGNACION_COMPLETADA`: Notificación cuando se marca una asignación como completada

(Previamente: 4 tipos disponibles)

#### Scenario: Enum con 7 tipos

- GIVEN se consulta el endpoint GET /api/notificaciones
- WHEN no hay filtro
- THEN se retornan notificaciones de cualquier tipo de los 7 tipos disponibles
- AND la respuesta incluye el campo `tipo` con valores del enum expandido

### Requirement: Métodos de validación de tipo (EXPANDED)

El sistema DEBE validar que el tipo de notificación corresponda a un valor válido del enum.

- GIVEN una notificación con tipo "ASIGNACION_CREADA"
- WHEN se valida la notificación
- THEN es válida y se procesa correctamente

(Previamente: solo 4 tipos válidos)

## REMOVED Requirements

(None)

## Database Migration

```sql
-- Extender el enum existente
ALTER TYPE notificacion_tipo ADD VALUE 'ASIGNACION_CREADA';
ALTER TYPE notificacion_tipo ADD VALUE 'ASIGNACION_ACTUALIZADA';
ALTER TYPE notificacion_tipo ADD VALUE 'ASIGNACION_COMPLETADA';
```

## Backend Changes

### models/notificacion.go

Agregar constantes:

```go
const (
    // ... tipos existentes ...
    NotifTipoAsignacionCreada     NotificacionTipo = "ASIGNACION_CREADA"
    NotifTipoAsignacionActualizada NotificacionTipo = "ASIGNACION_ACTUALIZADA"
    NotifTipoAsignacionCompletada NotificacionTipo = "ASIGNACION_COMPLETADA"
)
```

Actualizar método `IsValid()` para incluir los 3 nuevos tipos.

Actualizar método `String()` para incluir label de cada nuevo tipo.