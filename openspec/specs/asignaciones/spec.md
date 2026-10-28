# Asignaciones de ASEO_SALON solo por grupo — Specification

## Overview

The `asignacion_semanal` table stores weekly assignments. Each assignment targets either a `user_id`
(person) or a `grupo_id` (group), never both. For the assignment type **ASEO_SALON**
(`b10c74a7-ba4c-4a71-b639-1248aa404eb4`), the assignment MUST be made exclusively by group — never by
person. This rule is enforced on the backend (service layer), not only in the UI.

## Requirements

### Requirement: Soporte de grupo_id en backend

The `asignacion_semanal` table MUST be able to store an optional group (`grupo_id`) in addition to the
optional user (`user_id`). An assignment MAY have a user OR a group, never both. The backend MUST:

- Add a `grupo_id` column to the table
- Create an FK to the `grupos` table
- Keep `user_id` nullable
- In read queries, LEFT JOIN with `grupos` to fetch the group name

- GIVEN the `asignacion_semanal` table
- WHEN a migration adds `grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL`
- THEN `user_id` remains nullable and a `grupo_id` index exists

- GIVEN an assignment with a `grupo_id`
- WHEN `GetBySemana` / `GetBySemanaAndDia` are called
- THEN the result includes the joined `grupo` (id, nombre, numero)

### Requirement: Modal de asignación solo grupo para ASEO_SALON

In both assignment modals (page `/asignaciones` and editor `/asignaciones/semana/:id`):

- WHEN the assignment type is ASEO_SALON (`b10c74a7-ba4c-4a71-b639-1248aa404eb4`)
- THEN ONLY the group selector MUST be shown
- AND the person selector and the text "O seleccionar Persona" MUST NOT be shown
- AND the save button MUST be enabled when a group is selected

- WHEN the assignment type is any type other than ASEO_SALON
- THEN the person selector MUST be shown (unchanged behavior)

### Requirement: Envío de grupo_id al crear/editar

When saving an ASEO_SALON assignment:

- The frontend MUST send `grupo_id` to the backend
- The backend MUST accept and persist `grupo_id`
- On edit, if the existing assignment has `grupo_id`, it MUST be preselected

- GIVEN an ASEO_SALON assignment being saved with a selected group
- WHEN the save is triggered
- THEN the request payload includes `grupo_id` (and `user_id` is undefined)

- GIVEN an existing ASEO_SALON assignment that has `grupo_id`
- WHEN its edit modal opens
- THEN the group selector is preselected with that `grupo_id`

### Requirement: Compatibilidad con asignaciones existentes

Existing ASEO_SALON assignments that have `user_id` (person) MUST remain functional:

- They MUST render correctly in the views
- They MAY be edited (changed from person to group or vice versa)
- Existing queries MUST NOT break

- GIVEN an existing ASEO_SALON assignment with `user_id` set
- WHEN it is read or edited
- THEN it behaves correctly without requiring migration of its data

### Requirement: Bulk creation compatible

The bulk creation modal (Nueva Programación) already handles groups for ASEO_SALON. It MUST continue
to work, sending `grupo_id` when appropriate, and MUST NOT silently discard invalid group UUIDs.

- GIVEN a bulk create request with an item targeting ASEO_SALON and a valid `grupo_id`
- WHEN the request is processed
- THEN `grupo_id` is persisted

- GIVEN a bulk create request whose item has an invalid `grupo_id` UUID
- WHEN the request is parsed
- THEN the backend MUST respond `400` with error `invalid_grupo_id`

### Requirement: Backend enforcement of ASEO_SALON grupo-only

The rule that ASEO_SALON can only be assigned by group (not by person) MUST be enforced in the backend
(service layer), making it server-authoritative.

- WHEN `tipo_asignacion.nombre == 'ASEO_SALON'`, an assignment MUST have a non-null `GrupoID` AND MUST
  NOT have a `UserID`. This applies to **Create**, **Update**, and **BulkCreate**.
- IF a request sends `user_id` (or omits `grupo_id`) for ASEO_SALON
- THEN the backend MUST respond `400` with error `aseo_salon_requires_grupo`
- For all other assignment types, current behavior is unchanged (UserID required, GrupoID optional).

- GIVEN an ASEO_SALON Create/Update/BulkCreate with `user_id` set
- WHEN the service enforces the policy
- THEN it returns `ErrAseoSalonRequiresGrupo` mapped to HTTP `400` `aseo_salon_requires_grupo`

- GIVEN an ASEO_SALON Create/Update/BulkCreate with a valid `grupo_id` and no `user_id`
- WHEN the service enforces the policy
- THEN it succeeds

- GIVEN an ASEO_SALON Create/Update/BulkCreate with an invalid `grupo_id` UUID
- WHEN the handler parses it
- THEN it responds `400` with error `invalid_grupo_id`

## Non-Functional

- **Service-layer authority**: the ASEO_SALON group-only rule lives in `asignacion_service.go`
  (`enforceAseoSalonPolicy`), independent of `main.go` wiring.
- **Backward compatibility**: `user_id`-based existing assignments are unaffected.
- **Test coverage**: Strict TDD — 10 backend + 6 frontend passing tests cover REQ-01..REQ-06.

## Non-Goals

- Other assignment types' flows are unchanged.
- PDF reports are unchanged (they already display group correctly).
- Unrelated visual refactor of `asignacion-list.component.ts` (CSS class renames, comment style, HTML
  compaction) is out of scope and tracked separately.


<!-- Fusion specs 2026-10-28 — origen: 2026-10-28-asignacion-hospitalidad -->

# Specification: Asignación de Hospitalidad en Funciones de Reunión

## Overview
Permitir a los administradores y usuarios con permisos asignar la función semanal de "Hospitalidad" a un grupo de predicación específico en cada reunión semanal, garantizando la consistencia en el almacenamiento de datos, validaciones de negocio y experiencia de usuario tanto en el panel web como en la persistencia.

## Requirements

### Requirement: Tipo de Asignación en Base de Datos
- GIVEN the database catalog of assignment types `tipo_asignacion`
- WHEN the database migrations are executed
- THEN a record with `nombre = 'HOSPITALIDAD'`, `icono = '☕'`, and `descripcion = 'Hospitalidad y refrigerio'` MUST exist.

### Requirement: Validación de Asignación Exclusiva por Grupo (Backend)
- GIVEN an assignment payload with `tipo_asignacion` corresponding to `HOSPITALIDAD`
- WHEN an administrator creates or updates an assignment
- THEN the system MUST require a valid `grupo_id`.
- AND the system MUST NOT accept a `user_id` (it MUST be null or empty).
- AND if `grupo_id` is missing or `user_id` is provided, the API MUST return an HTTP 400 Bad Request error.

### Requirement: Renderizado de Selector de Grupo en la UI (Frontend)
- GIVEN the "Funciones Reunión" view (`/asignaciones`)
- WHEN an administrator opens the assignment modal for `HOSPITALIDAD` or views the weekly batch assignment form
- THEN the UI MUST display exclusively a group selector dropdown (`#grupoSelect`).
- AND the UI MUST NOT display the user/publisher selector for `HOSPITALIDAD`.
- AND the UI MUST label the assignment clearly with name "Hospitalidad" and icon "☕".

### Requirement: Guardado y Persistencia en Lote
- GIVEN the weekly day assignment form modal (`saveDiaAsignaciones`)
- WHEN an administrator assigns a group to `HOSPITALIDAD` and submits the form
- THEN the frontend application MUST dispatch a request containing `grupo_id` and omit `user_id`.
- AND when the assignment is removed, the frontend MUST trigger the deletion of the existing assignment record.


<!-- Fusion specs 2026-10-28 — origen: 2026-10-28-edicion-masiva-asignaciones -->

# Feature Spec: Edición Masiva y Nuevos Roles

## Requirements
1. The system shall support `MICROFONO_IZQ` (Micrófono Izquierda) and `MICROFONO_DER` (Micrófono Derecha) instead of a single microphone slot.
2. The system shall support `ACOMODADOR_1` (Acomodador 1) and `ACOMODADOR_2` (Acomodador 2) instead of a single usher slot.
3. The weekly assignment card for each service day (Wednesday/Saturday) shall provide an "Edit Day" action to edit all role assignments of that day at once.
4. Saving the daily edit modal shall save all selected role assignments for that day.


<!-- Fusion specs 2026-10-28 — origen: 2026-10-28-rediseno-asignaciones-semanales -->

# Feature Spec: Unificación de Asignaciones Semanales

## Requirements
1. Each week block shall display a single unified column "Asignación" matching the congregation format (Fecha, Presidente, Lector Atalaya, Acomodadores, Plataforma, Mic. Derecho, Mic. Izquierdo, Parqueadero, Aseo).
2. Roles assigned for the week shall automatically apply to both weekly meetings without requiring double data entry for Wednesday and Saturday.
3. The PDF export document preview shall mirror the exact format provided in the reference image (2 columns: Función | Asignación per week).
