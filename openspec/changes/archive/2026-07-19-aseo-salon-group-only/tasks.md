# Tasks: Asignaciones de ASEO_SALON solo por grupo

## Review Workload Forecast

- **Estimated changed lines**: ~250-320 (backend enforcement + tests)
- **400-line budget risk**: Low
- **Chained PRs recommended**: No
- **Decision needed before apply**: No

---

## Task 1: Migración — agregar grupo_id a asignacion_semanal [x]

**File**: `backend/migrations/006_aseo_grupo_id.sql`

- [x] Agregar columna `grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL`
- [x] Crear índice `idx_asignacion_semanal_grupo`
- [x] Verificar que `user_id` ya es nullable (confirmado en migración 004)

## Task 2: Backend Model — GrupoID en AsignacionSemanal y Grupo en Detail [x]

**File**: `backend/internal/models/asignacion.go`

- [x] Agregar `GrupoID *uuid.UUID \`json:"grupo_id,omitempty"\`` a `AsignacionSemanal`
- [x] Agregar `Grupo *Grupo \`json:"grupo,omitempty"\`` a `AsignacionDetail`

## Task 3: Backend Repository — grupo_id en CRUD [x]

**File**: `backend/internal/repositories/asignacion_repo.go`

- [x] **Create**: Agregar `grupo_id` al INSERT (bind $5)
- [x] **GetBySemana**: Agregar `a.grupo_id` al SELECT, LEFT JOIN con `grupos g`, seleccionar `g.id, g.nombre, g.numero`, escanear en `Grupo`
- [x] **GetBySemanaAndDia**: Mismo cambio que GetBySemana
- [x] **Update**: Agregar `grupo_id` al SET (bind $2)

## Task 4: Backend Handler — aceptar grupo_id en endpoints

**File**: `backend/internal/handlers/asignacion_handler.go`

- [x] **Create**: Agregar `GrupoID string \`json:"grupo_id"\`` al request struct, parsear si no está vacío
- [x] **Update**: Agregar `GrupoID string \`json:"grupo_id"\`` al request struct
- [x] **BulkCreate fix (NEW)**: Cambiar `parsed, _ := uuid.Parse(...)` por manejo de error → retornar `400 invalid_grupo_id` (consistente con Create/Update). Agregar `grupo_id` al request por ítem.

## Task 5: Backend Service — pasar grupo_id + enforcement

**File**: `backend/internal/services/asignacion_service.go`

- [x] **Create/Update**: Aceptar y pasar `grupoID` al repo, omitir validación de usuario cuando hay grupo
- [x] **Service-layer ASEO_SALON enforcement (NEW)**: Tras resolver `tipo_asignacion`, si `tipo.Nombre == "ASEO_SALON"` requerir `GrupoID != nil` AND `UserID == nil`; si no, error de dominio → HTTP `400 aseo_salon_requires_grupo`. Aplicar en Create, Update y ruta por ítem de BulkCreate. Resolver acceso al nombre del tipo (inyectar TipoAsignacionRepo o pasar desde handler).

## Task 6: Frontend Lista — re-aplicar rama ASEO_SALON sobre base limpia [ ]

**File**: `frontend/src/app/features/asignaciones/asignacion-list.component.ts`

- [x] **Modal (template)**: Re-aplicar SOLO la rama ASEO_SALON (selector de grupo exclusivo) sobre el archivo revertido a `main` (sin refactor visual no relacionado).
- [x] **saveAsignacion()**: Enviar `grupo_id` cuando corresponda.
- [x] **onTipoChange()**: Limpiar también `grupo_id` al cambiar de tipo.

## Task 7: Frontend Editor — modal solo grupo [x]

**File**: `frontend/src/app/features/asignaciones/semana-editar.component.ts`

- [x] **Modal (template)**: Para ASEO_SALON, mostrar solo selector de grupo; para otros tipos, solo selector de persona

## Task 8: Frontend Service — verificar envío de grupo_id [x]

**File**: `frontend/src/app/core/services/asignacion.service.ts`

- [x] `createAsignacion()` acepta `grupo_id` — verificar envío en POST
- [x] `updateAsignacion()` acepta `grupoId` — verificar envío en PUT
- [x] `bulkCreateAsignaciones()` acepta `grupo_id` en el array — verificar

## Task 9: Backend tests (Strict TDD) [ ]

- [x] Handler: `invalid_grupo_id` (Create, Update, BulkCreate parse error)
- [x] Service: ASEO_SALON enforcement — rechazar `user_id` (Create/Update/BulkCreate)
- [x] Service: ASEO_SALON enforcement — requerir `grupo_id` (Create/Update/BulkCreate)
- [x] Repo: binding de `grupo_id` (Create/Update/Get)

## Task 10: Frontend test — render componente [ ]

- [x] Componente renderiza selector solo-grupo para ASEO_SALON (assert del `ASEO_SALON` branch)

## Task 11: Verificación [ ]

- [ ] Probar que la migración corre sin errores
- [ ] Probar crear asignación ASEO_SALON con grupo (lista y editor)
- [ ] Probar que backend rechaza ASEO_SALON con `user_id` → `400 aseo_salon_requires_grupo`
- [ ] Probar que backend rechaza BulkCreate con grupo UUID inválido → `400 invalid_grupo_id`
- [ ] Probar que otros tipos de asignación siguen funcionando con persona
- [ ] Probar editar una asignación existente de ASEO_SALON (con persona)
