# SDD Tasks: User Update Persistence Fix

- [x] **Task 1: Backend DTO Update**
    - [x] Update `UpdateUserRequest` in `backend/internal/dto/responses.go` to include `Email`.
- [x] **Task 2: Backend Handler Update**
    - [x] Update `Update` in `backend/internal/handlers/user_handler.go` to process `Email`.
- [x] **Task 3: Backend Repository Update**
    - [x] Update `Update` in `backend/internal/repositories/user_repo.go` with full `RETURNING` and `Scan`.
- [x] **Task 4: Frontend Service Update**
    - [x] Update `UpdateUserRequest` in `frontend/src/app/core/services/user.service.ts` to include `email`.
- [x] **Task 5: Frontend Component Update**
    - [x] Update `saveUser` in `frontend/src/app/features/admin/usuarios/usuarios-list.component.ts` to send `email`.
- [x] **Task 6: Verification**
    - [x] Verify that all fields persist correctly and the UI updates without refresh.

## Closure Note (2026-11-01)

Task 6 verified by static end-to-end trace across all three layers plus runnable test suites:

- Repo `UserRepository.Update`: full `RETURNING` (12 fields incl. `email`) + matching `Scan` (user_repo.go:199-215).
- Handler `UserHandler.Update`: `updates["email"]` populated from `UpdateUserRequest.Email`.
- Frontend `saveUser`: sends `email` in payload and replaces the edited user via `users.update(map(...))` in the `next` callback -> UI updates without refresh.
- Suites: Go `handlers`/`services`/`middleware`/`jwt` OK; frontend Jest 153/153 OK. Note: `internal/repositories` package fails only on `TestNotificacionRepository_*` (needs live Postgres test DB, env-blocked); no `UserRepository` tests exist.