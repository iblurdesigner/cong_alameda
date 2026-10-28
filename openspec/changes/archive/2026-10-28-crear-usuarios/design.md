# Technical Design: Creación de Usuarios

## Frontend Changes
- `user.service.ts`:
  - Interface `CreateUserRequest`: `nombre`, `email`, `password`, `telefono`, `rol`.
  - Method `createUser(data: CreateUserRequest): Observable<User>`.
- `usuarios-list.component.ts`:
  - Signal / state `showCreateModal: boolean`.
  - Object `createForm`: `nombre`, `email`, `password`, `telefono`, `rol`.
  - Methods: `openCreateModal()`, `closeCreateModal()`, `submitCreateUser()`.
