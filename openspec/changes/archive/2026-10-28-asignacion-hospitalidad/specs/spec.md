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
