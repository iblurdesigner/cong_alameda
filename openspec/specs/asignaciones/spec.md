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
