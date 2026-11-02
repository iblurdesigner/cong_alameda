# Design: Dashboard de Notificaciones por Asignaciones

## Technical Approach

Extender el sistema de notificaciones existente para soportar notificaciones de asignaciones con generación automática, reemplazando la lista plana actual por un dashboard visual con tarjetas agrupadas por tipo.

**Estrategia:**
1. Agregar 3 nuevos tipos al enum `NotificacionTipo` en backend
2. Crear método en repository para notificaciones con referencia a asignación
3. Modificar handler de asignaciones para generar notificaciones automáticas
4. Reemplazar el componente lista por dashboard con grouping

## Architecture Decisions

### Decision: Dónde generar las notificaciones de asignación

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **En handler de asignaciones** | Acoplamiento directo, pero transacciones atómicas | **Elegido** |
| En service repository separado | Mejor separación, pero dos operaciones | Descartado |
| En middleware/evento | Desacoplado, pero más complejo | Descartado |

**Rationale**: Transacciones atómicas críticas para consistencia (asignación + notificación en una misma operación). Simplicidad sobre abstracción prematura.

### Decision: Estructura de datos para referencias

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Agregar campos referencia_id, referencia_tipo al modelo** | Migración simple, consulta directa | **Elegido** |
| Tabla relacional separate | Normalizado, pero joins extras | Descartado |
| JSONB en campo mensaje | Flexible, pero no indexable | Descartado |

**Rationale**: Consulta directa por ID sin joins. PostgreSQL soporta ALTER TYPE + ADD COLUMN de forma idempotente.

### Decision: Componente dashboard vs extending lista actual

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Reemplazar lista por dashboard** | Más trabajo, pero cumple specs de grouping | **Elegido** |
| Extender lista existente | Menos código, pero violaría specs de grouping | Descartado |

**Rationale**: Las specs requieren grouping por tipo y filtros visuales que la lista actual no soporta.

## Data Flow

```
[User] → POST /api/asignaciones
              ↓
[Handler: asignaciones.Update]
              ↓ +txn
[AsignacionRepository.Update] → notificaciones/notificacion_repo.go.Create
              ↓
[Response] + Notificación creada
              ↓
[Frontend] → GET /notificaciones
              ↓
[NotificationService] → signal<Notificacion[]>
              ↓
[DashboardComponent] → grouped by tipo → cards
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/internal/models/notificacion.go` | Modify | Agregar 3 constantes al enum + campos referencia_id/tipo |
| `backend/migrations/` | Create | ALTER TYPE + ADD COLUMN referencia |
| `backend/internal/repositories/notificacion_repo.go` | Modify | Nuevo método GetWithReference, CreateWithReference |
| `backend/internal/handlers/notificacion.go` | Modify | Endpoint POST /notificaciones/asignacion |
| `backend/internal/handlers/asignacion.go` | Modify | Hook para generar notificación automática |
| `frontend/src/app/core/services/notification.service.ts` | Modify | Agregar getByTipo, método para grouping |
| `frontend/src/app/features/notifications/` | Replace | Nuevo componente dashboard + components/ |
| `frontend/src/app/features/notifications/notification-dashboard/` | Create | Carpeta con componentes |

## Interfaces / Contracts

### Backend: Notificacion con referencia

```go
type Notificacion struct {
    ID             uuid.UUID        `json:"id" db:"id"`
    Tipo           NotificacionTipo  `json:"tipo" db:"tipo"`
    ReferenciaID    *uuid.UUID       `json:"referencia_id,omitempty" db:"referencia_id"`
    ReferenciaTipo *string          `json:"referencia_tipo,omitempty" db:"referencia_tipo"`
    CasaID         *uuid.UUID       `json:"casa_id,omitempty" db:"casa_id"`
    Destinatarios  []uuid.UUID      `json:"destinatarios" db:"destinatarios"`
    Mensaje        string           `json:"mensaje" db:"mensaje"`
    Leida          bool             `json:"leida" db:"leida"`
    CreatedAt      time.Time        `json:"created_at" db:"created_at"`
}

// Enum nuevos tipos
const (
    NotifTipoAsignacionCreada    NotificacionTipo = "ASIGNACION_CREADA"
    NotifTipoAsignacionActualizada NotificacionTipo = "ASIGNACION_ACTUALIZADA"
    NotifTipoAsignacionCompletada NotificacionTipo = "ASIGNACION_COMPLETADA"
)
```

### Frontend: NotificacionGrouped

```typescript
interface NotificacionGroup {
  tipo: string;
  titulo: string;
  icono: string;
  colorFondo: string;
  notificaciones: Notificacion[];
}
```

### Iconos por Tipo de Asignación (existentes)

| TipoAsignacion | Icono |
|---------------|------|
| MICROFONO | 🎤 |
| PLATAFORMA | 📺 |
| PARQUEADERO | 🚗 |
| ACOMODADOR_SALON | 🪑 |
| ASEO_SALON | 🧹 |
| PRESIDENTE | 🎯 |
| LECTOR_ATALAYA | 📖 |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | NotificacionTipo.IsValid() con nuevos tipos | Test enum validation |
| Integration | Transacción handler → repo → notification | Test con DB real |
| Unit | Component grouping logic | Jest test de señal agrupada |
| E2E | Crear asignación → notificación creada → navigation | Playwright |

## Migration / Rollout

1. **Migración PostgreSQL** (idempotente):
   - `ALTER TYPE notificacion_tipo ADD VALUE IF NOT EXISTS 'ASIGNACION_CREADA'`
   - `ALTER TYPE notificacion_tipo ADD VALUE IF NOT EXISTS 'ASIGNACION_ACTUALIZADA'`
   - `ALTER TYPE notificacion_tipo ADD VALUE IF NOT EXISTS 'ASIGNACION_COMPLETADA'`
   - `ALTER TABLE notificaciones ADD COLUMN referencia_id UUID`
   - `ALTER TABLE notificaciones ADD COLUMN referencia_tipo TEXT`

2. **Feature Flag**: No requiere — solo se agregan tipos

3. **Rollout**: Backend primero → luego frontend (graceful degradation si no hay notificaciones de asignaciones)

## Open Questions

- [ ] ¿El campo `casa_id` sigue siendo necesario para notificaciones de asignaciones? (las asignaciones no tienen casa_id)
- [ ] ¿Eliminar notificaciones old +30 días automatically? (queda para cleanup posterior)

## Next Step

Ready for tasks (sdd-tasks).