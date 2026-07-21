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
- [ ] **Task 6: Verification**
    - [ ] Verify that all fields persist correctly and the UI updates without refresh.
