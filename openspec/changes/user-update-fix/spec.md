# SDD Specification: User Update Persistence Fix

## Requirements
1. **Field Coverage**: The update flow must support the following fields:
    - `nombre` (string)
    - `email` (string)
    - `telefono` (string, optional)
    - `telefono_validado` (boolean)
    - `notificaciones_email` (boolean)
    - `notificaciones_whatsapp` (boolean)
2. **Data Consistency**: The backend must return the complete user model after an update to ensure the frontend state matches the database perfectly.
3. **Uniqueness**: Changing a user's email to an already existing one must be handled (409 Conflict).

## Acceptance Criteria
- [ ] Changing any field in the "Editar Usuario" modal and clicking "Guardar Cambios" persists the data in the DB.
- [ ] Toggling notification checkboxes or "Tel├⌐fono validado" persists the data.
- [ ] After saving, the UI displays the new values without needing a refresh.
- [ ] If an email is already taken, a clear error message is shown.

## Scenarios
### Scenario 1: Basic Information Update
**Given** I am in the user management list
**When** I edit a user's name and phone number
**And** I click "Guardar Cambios"
**Then** the modal closes
**And** the list shows the updated name and phone

### Scenario 2: Email Update with Conflict
**Given** there is a user with email "test@example.com"
**When** I try to change another user's email to "test@example.com"
**Then** an error message "El email ya est├í registrado" appears
**And** the changes are not saved
