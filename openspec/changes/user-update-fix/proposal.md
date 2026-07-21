# SDD Proposal: Fix User Update Persistence

## Problem
Editing user data on the `/usuarios` page does not persist correctly. 
- Some fields (like `email`) are missing from the entire update flow (Frontend -> DTO -> Handler).
- Other fields (like `telefono_validado` and notification preferences) are missing from the `RETURNING` clause in the repository, causing the UI to show stale data after a "successful" update.

## Solution
1. **Frontend**:
    - Update `UpdateUserRequest` interface to include `email`.
    - Update `saveUser` in `UsuariosListComponent` to include `email` in the payload.
2. **Backend**:
    - Update `UpdateUserRequest` DTO to include `Email`.
    - Update `UserHandler.Update` to process the `Email` field.
    - Update `UserRepository.Update` to include all fields in the `RETURNING` clause and `Scan` call.

## Affected Files
- `frontend/src/app/core/services/user.service.ts`
- `frontend/src/app/features/admin/usuarios/usuarios-list.component.ts`
- `backend/internal/dto/responses.go`
- `backend/internal/handlers/user_handler.go`
- `backend/internal/repositories/user_repo.go`

## Risks
- Email uniqueness violation if the user tries to update to an email already in use. The handler should catch this error from the repository.
