# Technical Design: Asignación de Hospitalidad en Funciones de Reunión

## Architecture & Data Flow

### 1. Database Schema
Migration file: `backend/migrations/023_add_hospitalidad_tipo_asignacion.sql`.
```sql
INSERT INTO tipo_asignacion (nombre, descripcion, icono) VALUES
    ('HOSPITALIDAD', 'Hospitalidad y refrigerio', '☕')
ON CONFLICT (nombre) DO NOTHING;
```
The table `asignacion_semanal` already contains:
```sql
CONSTRAINT chk_user_or_grupo CHECK (
    (user_id IS NOT NULL AND grupo_id IS NULL) OR
    (user_id IS NULL AND grupo_id IS NOT NULL)
)
```
which guarantees database-level integrity for group-based assignments.

### 2. Backend Architecture (Go / Fiber)

#### Rationale & Decisions
- **Unified Group Policy vs Specific Errors**:
  Currently, `enforceAseoSalonPolicy` explicitly checks for `ASEO_SALON`. Rather than duplicating identical policy logic for each group assignment, we define a helper `isGroupAssignment(tipoNombre string) bool` that returns `true` for `ASEO_SALON` and `HOSPITALIDAD`.
  If `isGroupAssignment` is true:
  - `grupoID == nil` -> error (requires group)
  - `userID != uuid.Nil` -> error (forbids individual user)
  We preserve backward-compatible error handling in handlers (`ErrGroupAssignmentRequired` or mapping both `aseo_salon` and `hospitalidad` appropriately).

#### Layered Interactions
```
HTTP Request (POST/PUT /api/v1/asignaciones)
   │
   ▼
[AsignacionHandler]
   │  - Validates UUIDs
   │  - Invokes service
   ▼
[AsignacionService]
   │  - Checks isGroupAssignment(tipo)
   │  - Validates grupo_id != nil && user_id == Nil
   │  - Dispatches to repository
   ▼
[AsignacionRepository]
   │  - Executes SQL INSERT/UPDATE on asignacion_semanal
   ▼
PostgreSQL Database
```

### 3. Frontend Architecture (Angular 21)

#### Component Behavior
- In `AsignacionListComponent`:
  - Introduce helper `isGroupType(tipoNombre: string): boolean { return tipoNombre === 'ASEO_SALON' || tipoNombre === 'HOSPITALIDAD'; }`.
  - Update templates to use `isGroupType(editingTipo?.nombre)` and `isGroupType(tipo.nombre)`.
  - Update `saveDiaAsignaciones()` to use `isGroupType(tipo.nombre)` when segregating `selectedUserId` vs `selectedGrupoId`.
  - Add `'HOSPITALIDAD': 'Hospitalidad'` to `getTipoNombre()`.
  - Add `{ id: '...', nombre: 'HOSPITALIDAD', icono: '☕', descripcion: 'Hospitalidad' }` with priority index `10` in `getTiposList()`.
- In `SemanaEditarComponent`:
  - Identify group-assigned types by name or configuration instead of hardcoded UUID, allowing both `ASEO_SALON` and `HOSPITALIDAD` to prompt for group selection.
