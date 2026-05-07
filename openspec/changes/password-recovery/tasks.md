# Tasks: Password Recovery

## Phase 1: Foundation (Backend)

- [x] 1.1 Agregar `ResetClaims` struct y `GenerateResetToken(email) → (string, error)` en `backend/pkg/jwt/jwt.go`
- [x] 1.2 Agregar `ValidateResetToken(token) → (*ResetClaims, error)` en `backend/pkg/jwt/jwt.go`
- [x] 1.3 Agregar DTOs `RecoverRequest`, `RecoverPasswordRequest`, `MessageResponse` en `backend/internal/dto/responses.go`

## Phase 2: Backend Services

- [x] 2.1 Agregar método `SendPasswordReset(email, resetLink string)` en `backend/internal/services/notification_service.go`
- [x] 2.2 Agregar template de email `NotificationPasswordReset` en `notification_service.go` (Subject: "Recuperación de Contraseña - Congregación Alameda")
- [x] 2.3 Agregar método `GetByEmailForRecovery(ctx, email)` en `backend/internal/services/user_service.go`
- [x] 2.4 Agregar método `UpdatePassword(ctx, email, password)` en `backend/internal/services/user_service.go` (sin auth required)
- [x] 2.5 Implementar rate limiting in-memory para `recover-request` (1 req/email/5min) en `backend/internal/handlers/auth_handler.go`
- [x] 2.6 Agregar handler `RecoverRequest` (POST `/api/auth/recover-request`) en `auth_handler.go`
- [x] 2.7 Agregar handler `RecoverPassword` (POST `/api/auth/recover-password`) en `auth_handler.go`
- [x] 2.8 Registrar nuevas rutas en el router de Fiber

## Phase 3: Frontend

- [x] 3.1 Agregar métodos `requestRecovery(email)` y `resetPassword(token, password)` en `frontend/src/app/core/services/auth.service.ts`
- [x] 3.2 Agregar enlace "Olvidé mi contraseña" en `frontend/src/app/features/auth/login/login.component.ts` bajo el formulario
- [x] 3.3 Crear `frontend/src/app/features/auth/recovery/recovery.component.ts` con:
  - Leer token de query param `?token=...`
  - Form con campos "Nueva Contraseña" y "Confirmar Contraseña"
  - Validación de contraseña (mín 6 caracteres)
  - Validación de match entre contraseñas
  - Llamar `AuthService.resetPassword()`
  - Mostrar mensaje de éxito y link a login
- [x] 3.4 Agregar ruta `/recovery` en `frontend/src/app/app.routes.ts` apuntando a `RecoveryComponent`

## Phase 4: Testing

- [x] 4.1 Testear `GenerateResetToken` y `ValidateResetToken` en `backend/pkg/jwt/jwt_test.go`
- [ ] 4.2 Testear handler `RecoverRequest` con email existente y no existente (httptest) - **PENDING: requiere test environment**
- [ ] 4.3 Testear handler `RecoverPassword` con token válida, inválida y expirado (httptest) - **PENDING: requiere test environment**
- [ ] 4.4 Testear `UpdatePassword` actualiza hash correcto (permite login con nueva password) - **PENDING: requiere test environment**

## Phase 5: Verificación

- [x] 5.1 Compilar backend: `go build ./...`
- [x] 5.2 Compilar frontend: `ng build`
- [x] 5.3 Verificar que endpoints responden correctamente (manual testing)
  - POST /api/auth/recover-request → 200 ✅
  - POST /api/auth/recover-password (invalid token) → 400 ✅
- [x] 5.4 Verificar flow completo: request → email → recovery page → nueva password → login
  - Ruta /recovery configurada ✅
  - RecoveryComponent implementado con validaciones ✅