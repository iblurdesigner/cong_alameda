# Proposal: Asignación de Hospitalidad en Funciones de Reunión

## Intent
Incorporar la función de asignación **Hospitalidad** dentro del módulo de **Funciones Reunión** (`/asignaciones`). Al igual que la función de *Aseo del Salón*, la asignación de Hospitalidad debe asignarse exclusivamente a un **Grupo de Predicación** (`grupo_id`), y no a un publicador individual (`user_id`).

## Scope

### 1. Base de Datos (PostgreSQL)
- Migración `023_add_hospitalidad_tipo_asignacion.sql`:
  - Registrar en la tabla `tipo_asignacion` el nuevo registro:
    - `nombre`: `'HOSPITALIDAD'`
    - `descripcion`: `'Hospitalidad y refrigerio'`
    - `icono`: `'☕'`
  - Compatible con la restricción existente `chk_user_or_grupo` en `asignacion_semanal` que ya permite asociar asignaciones a `grupo_id`.

### 2. Backend (Go / Fiber)
- **Constantes y Políticas de Servicio** (`backend/internal/services/asignacion_service.go`):
  - Definir la constante `hospitalidadNombre = "HOSPITALIDAD"`.
  - Extender la validación de asignaciones por grupo (actualmente `enforceAseoSalonPolicy` -> generalizar o incluir `HOSPITALIDAD`) para exigir `grupo_id != nil` y prohibir `user_id != uuid.Nil` cuando el tipo sea `HOSPITALIDAD`.
  - Definir/mapear el error correspondiente (`ErrHospitalidadRequiresGrupo` o error común de validación de asignación a grupo).
- **Handler** (`backend/internal/handlers/asignacion_handler.go`):
  - Mapear el error de validación a respuesta HTTP 400 (`hospitalidad_requires_grupo`).
- **Pruebas Unitarias**:
  - Tests unitarios en `asignacion_service_test.go` y `asignacion_handler_test.go` verificando que `HOSPITALIDAD` requiera `grupo_id` y rechace `user_id`.

### 3. Frontend (Angular 21 / SCSS / Signals)
- **Vista de Asignaciones** (`frontend/src/app/features/asignaciones/asignacion-list.component.ts`):
  - Incorporar `'HOSPITALIDAD': 'Hospitalidad'` en el diccionario de nombres legibles (`getTipoNombre`).
  - Asignar orden de visualización en `getTiposList()` (ejemplo: posición 10, inmediatamente posterior a Aseo del Salón o según prioridad de funciones).
  - Incluir fallback en `getTiposList()` con `{ id: '10', nombre: 'HOSPITALIDAD', icono: '☕', descripcion: 'Hospitalidad' }`.
  - En los modales de asignación (individual y modal rápido de edición semanal de día), tratar `HOSPITALIDAD` como función de grupo (renderizar el selector de `<select id="grupoSelect">` y no el de usuario/publicador).
  - En `saveDiaAsignaciones()`, enviar `grupo_id` (y no `user_id`) para el tipo `HOSPITALIDAD`.
- **Vista de Edición de Semana** (`frontend/src/app/features/asignaciones/semana-editar.component.ts`):
  - Permitir la selección de grupo para el tipo de asignación `HOSPITALIDAD`.
- **Pruebas Unitarias Frontend**:
  - Tests en `asignacion-list.component.spec.ts` validando el comportamiento exclusivo de grupo para `HOSPITALIDAD`.

## Rollback Plan
- Revertir la migración eliminando el registro de `tipo_asignacion` donde `nombre = 'HOSPITALIDAD'`.
- Revertir los cambios de código en backend y frontend mediante Git (`git revert`).
