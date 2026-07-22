# Design: Asignaciones de ASEO_SALON solo por grupo

## Cambios en Backend

### Migración (`006_aseo_grupo_id.sql`)

```sql
-- Agregar columna grupo_id a asignacion_semanal
ALTER TABLE asignacion_semanal
    ADD COLUMN grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL;

-- Hacer user_id nullable (si la constraint NOT NULL existe)
-- Nota: user_id ya es nullable en la tabla actual

-- Índice para grupo_id
CREATE INDEX IF NOT EXISTS idx_asignacion_semanal_grupo ON asignacion_semanal(grupo_id);
```

### Modelo (`models/asignacion.go`)

```go
type AsignacionSemanal struct {
    ID               uuid.UUID  `json:"id"`
    SemanaID         uuid.UUID  `json:"semana_id"`
    TipoAsignacionID uuid.UUID  `json:"tipo_asignacion_id"`
    UserID           uuid.UUID  `json:"user_id"`
    GrupoID          *uuid.UUID `json:"grupo_id,omitempty"`  // NUEVO: nullable
    DiaSemana        int        `json:"dia_semana"`
    Observaciones    *string    `json:"observaciones,omitempty"`
    CreatedAt        time.Time  `json:"created_at"`
    UpdatedAt        time.Time  `json:"updated_at"`
}

type AsignacionDetail struct {
    AsignacionSemanal
    TipoAsignacion *TipoAsignacion `json:"tipo_asignacion,omitempty"`
    User           *User           `json:"user,omitempty"`
    Grupo          *Grupo          `json:"grupo,omitempty"`  // NUEVO
    Semana         *SemanaVisita   `json:"semana,omitempty"`
}
```

Tengo que verificar que el modelo `Grupo` exista. Déjame revisar.

### Repositorio (`repositories/asignacion_repo.go`)

**Create**: Agregar `grupo_id` al INSERT
```go
query := `
    INSERT INTO asignacion_semanal (id, semana_id, tipo_asignacion_id, user_id, grupo_id, dia_semana, observaciones)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
`
```

**GetBySemana**: LEFT JOIN con `grupos`
```go
query := `
    SELECT 
        a.id, a.semana_id, a.tipo_asignacion_id, a.user_id, a.grupo_id, a.dia_semana, 
        a.observaciones, a.created_at, a.updated_at,
        t.id, t.nombre, t.descripcion, t.icono,
        u.id, u.nombre, u.email, u.rol,
        g.id, g.nombre, g.numero
    FROM asignacion_semanal a
    JOIN tipo_asignacion t ON t.id = a.tipo_asignacion_id
    LEFT JOIN users u ON u.id = a.user_id
    LEFT JOIN grupos g ON g.id = a.grupo_id
    WHERE a.semana_id = $1
    ORDER BY a.dia_semana, t.nombre
`
```

**GetBySemanaAndDia**: Mismo cambio — agregar LEFT JOIN con grupos y seleccionar grupo_id.

**Update**: Agregar `grupo_id`
```go
UPDATE asignacion_semanal 
SET user_id = $1, grupo_id = $2, observaciones = $3, updated_at = $4
WHERE id = $5
```

### Handler (`handlers/asignacion_handler.go`)

**Create**: Aceptar `grupo_id` opcional
```go
var req struct {
    SemanaID         string  `json:"semana_id"`
    TipoAsignacionID string  `json:"tipo_asignacion_id"`
    UserID           string  `json:"user_id"`
    GrupoID          string  `json:"grupo_id"`       // NUEVO
    DiaSemana        int     `json:"dia_semana"`
    Observaciones    *string `json:"observaciones,omitempty"`
}
```

Parsear grupo_id si viene:
```go
var grupoID *uuid.UUID
if req.GrupoID != "" {
    parsed, err := uuid.Parse(req.GrupoID)
    if err != nil {
        return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_grupo_id"})
    }
    grupoID = &parsed
}
```

**BulkCreate**: Mismo cambio — aceptar `grupo_id` opcional por asignación.

**Update**: Aceptar `grupo_id`
```go
var req struct {
    UserID        string  `json:"user_id"`
    GrupoID       string  `json:"grupo_id"`
    Observaciones *string `json:"observaciones,omitempty"`
}
```

### Service-layer enforcement (NEW)

La regla ASEO_SALON "solo grupo" se aplica ahora a nivel de servicio (no solo UI). En `backend/internal/services/asignacion_service.go`, en `Create`, `Update` y la ruta por ítem de `BulkCreate`:

- Tras resolver `tipo_asignacion` por ID, si `tipo.Nombre == "ASEO_SALON"`:
  - Requerir `GrupoID != nil` AND `UserID == nil` (o tratar UserID como ignorado/nil).
  - Si no se cumple, retornar un error de dominio mapeado a HTTP `400` con código `aseo_salon_requires_grupo`.
- Para tipos no ASEO_SALON, mantener el comportamiento actual (UserID requerido, GrupoID opcional).

**Acceso al nombre del tipo**: el servicio necesita resolver el nombre del tipo. Verificar si el servicio ya tiene un `tipoAsignacionRepo`/`GetByID` o si recibe el nombre del tipo desde el handler. Si no está disponible, anotar el mínimo agregado necesario (p. ej. inyectar `TipoAsignacionRepo` o pasar `tipo.Nombre` desde el handler). NO implementar; solo diseñarlo aquí.

### BulkCreate grupo UUID fix (NEW)

El handler de `BulkCreate` actualmente hace `parsed, _ := uuid.Parse(...)` ignorando el error, lo que silenciosamente descarta UUIDs de grupo inválidos. Cambiar para retornar `400 invalid_grupo_id` en error de parseo, consistente con Create/Update. Además, enrutar cada ítem del bulk por la misma validación de servicio ASEO_SALON (sección anterior).

## Cambios en Frontend

### `asignacion-list.component.ts` (página `/asignaciones`)

> Nota: el archivo fue revertido a `main` para descartar un refactor visual no relacionado (renombres de clases CSS, cambio de estilo de comentarios, compactación de HTML). Los cambios de este cambio se limitan SOLO a la rama ASEO_SALON (el selector de grupo exclusivo), que debe re-aplicarse sobre la base limpia.

**Modal (template, ~lineas 185-210)**:
```html
@if (assignForm.tipo_id) {
    @if (assignForm.tipo_id === 'b10c74a7-ba4c-4a71-b639-1248aa404eb4') {
        <!-- Solo selector de grupo para ASEO_SALON -->
        <div class="form-group">
            <label for="grupoSelect">Seleccionar Grupo</label>
            <select id="grupoSelect" [(ngModel)]="assignForm.grupo_id">
                <option value="">Seleccionar grupo...</option>
                @for (grupo of getGruposList(); track grupo.id) {
                    <option [value]="grupo.id">{{ grupo.nombre }} ({{ grupo.numero }})</option>
                }
            </select>
        </div>
    } @else {
        <!-- Para otros tipos: selector de persona -->
        <div class="form-group">
            <label for="nuevaPersona">Seleccionar Persona</label>
            <select id="nuevaPersona" [(ngModel)]="assignForm.user_id">
                <option value="">Seleccionar persona...</option>
                @for (user of getAvailableUsersForTipo(); track user.id) {
                    <option [value]="user.id">{{ user.nombre }} ({{ user.rol }})</option>
                }
            </select>
        </div>
    }
    <!-- Observaciones siempre visible -->
    <div class="form-group">
        <label for="observaciones">Observaciones</label>
        <textarea id="observaciones" [(ngModel)]="assignForm.observaciones" rows="2" placeholder="Observaciones opcionales..."></textarea>
    </div>
}
```

**`saveAsignacion()`**: Enviar `grupo_id` cuando corresponda
```typescript
this.asignacionService.createAsignacion({
    semana_id: this.selectedSemanaId || '',
    tipo_asignacion_id: this.assignForm.tipo_id,
    user_id: this.assignForm.user_id || '',
    grupo_id: this.assignForm.grupo_id || undefined,
    dia_semana: this.editingDiaSemana,
    observaciones: this.assignForm.observaciones || undefined
})
```

### `semana-editar.component.ts` (página `/asignaciones/semana/:id`)

**Modal (template, ~lineas 109-129)**: Mismo cambio — para ASEO_SALON solo mostrar grupo, para otros tipos solo persona.

```html
@if (assignForm.tipo_id === 'b10c74a7-ba4c-4a71-b639-1248aa404eb4') {
    <!-- Solo grupo -->
    <div class="form-group">
        <label for="grupoSelect">Seleccionar Grupo:</label>
        <select id="grupoSelect" [(ngModel)]="assignForm.grupo_id">
            <option value="">Seleccionar grupo...</option>
            @for (grupo of grupos(); track grupo.id) {
                <option [value]="grupo.id">{{ grupo.nombre }} ({{ grupo.numero }})</option>
            }
        </select>
    </div>
} @else {
    <!-- Solo persona -->
    <div class="form-group">
        <label for="nuevaPersona">Seleccionar Persona:</label>
        <select id="nuevaPersona" [(ngModel)]="assignForm.user_id">
            <option value="">Seleccionar persona...</option>
            @for (user of users(); track user.id) {
                <option [value]="user.id">{{ user.nombre }} ({{ user.rol }})</option>
            }
        </select>
    </div>
}
```

### `asignacion.service.ts`

Ya tiene `grupo_id` en los tipos y métodos. Solo asegurarse de que `updateAsignacion` envíe `grupo_id` al backend — ya lo hace.

## Notas

- El modelo `Grupo` existe en `backend/internal/models/grupo.go` — verificar su estructura exacta antes de implementar.
- Los endpoints de bulk creation ya envían grupo_id desde el frontend; solo falta que el backend lo procese.
- Al editar una asignación existente que tiene grupo, el `assignForm.grupo_id` se carga desde `asignacion.grupo_id`.
