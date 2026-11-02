# Design: Password Recovery

## Technical Approach

Implementar recuperación de contraseña usando JWT temporal con claim "type": "password_reset". El JWT se envía por email y permite cambiar la contraseña sin necesidad de estado persistente en base de datos. El flow completo:

```
Usuario → POST /recover-request → JWT con expiry 15min → Email con link
Usuario clickea link → /recovery?token={jwt}
Usuario ingresa nueva password → POST /recover-password → Valida JWT → Actualiza password
```

## Architecture Decisions

### Decision: JWT temporal en vez de token en DB

**Choice**: JWT con claim "type": "password_reset"
**Alternatives considered**: Tabla password_reset_tokens en DB, Redis
**Rationale**: Sin estado extra, no requiere migración, fácil invalidación (expira en 15min)

### Decision: Estructura de DTOs

**Choice**: DTOs en `dto/responses.go` (no archivo separado)
**Alternatives considered**: Archivo `dto/auth_recovery_dto.go` propio
**Rationale**: Mantener consistencia con DTOs existentes en responses.go

### Decision: Rate limiting in-memory

**Choice**: Mapa sync.Map con limpieza por goroutine
**Alternatives considered**: Redis, middleware de terceros
**Rationale**: Simple, no external dependency. Para producción con múltiples instancias, migrar a Redis.

## Data Flow

### Solicitud de Recovery
```
LoginComponent (frontend)
  └─→ AuthService.requestRecovery(email)
        └─→ POST /api/auth/recover-request
              └─→ UserService.GetByEmail()
                    └─→ JWTManager.GenerateResetToken(email) [15min]
                          └─→ NotificationService.SendPasswordReset(email, link)
                                └─→ Email con link
```

### Cambio de Contraseña
```
RecoveryComponent (frontend)
  └─→ AuthService.resetPassword(token, newPassword)
        └─→ POST /api/auth/recover-password
              └─→ JWTManager.ValidateResetToken(token) [verifica claim "password_reset"]
                    └─→ UserService.UpdatePassword(email, newPassword)
                          └─→ Login con nueva contraseña
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/pkg/jwt/jwt.go` | Modify | Agregar GenerateResetToken y ValidateResetToken |
| `backend/internal/dto/responses.go` | Modify | Agregar RecoverRequest, RecoverPasswordRequest, MessageResponse |
| `backend/internal/handlers/auth_handler.go` | Modify | Agregar RecoverRequest y RecoverPassword handlers |
| `backend/internal/services/user_service.go` | Modify | Agregar GetByEmailForRecovery, UpdatePasswordWithoutAuth |
| `backend/internal/services/notification_service.go` | Modify | Agregar SendPasswordResetNotification + template |
| `frontend/src/app/core/services/auth.service.ts` | Modify | Agregar requestRecovery, resetPassword |
| `frontend/src/app/features/auth/login/login.component.ts` | Modify | Agregar link "Olvidé mi contraseña" |
| `frontend/src/app/features/auth/recovery/recovery.component.ts` | Create | Página de recovery con form |
| `frontend/src/app/app.routes.ts` | Modify | Agregar ruta /recovery |

## Interfaces / Contracts

### Backend DTOs (backend/internal/dto/responses.go)

```go
type RecoverRequest struct {
    Email string `json:"email"`
}

type RecoverPasswordRequest struct {
    Token    string `json:"token"`
    Password string `json:"password"`
}

type MessageResponse struct {
    Message string `json:"message"`
}
```

### JWT Extended (backend/pkg/jwt/jwt.go)

```go
// ResetClaims contiene claims específicos para reset de password
type ResetClaims struct {
    Email string `json:"email"`
    Type  string `json:"type"` // "password_reset"
    jwt.RegisteredClaims
}

// GenerateResetToken genera JWT para recovery con expiry 15min
func (m *JWTManager) GenerateResetToken(email string) (string, error)

// ValidateResetToken valida JWT de recovery
func (m *JWTManager) ValidateResetToken(tokenString string) (*ResetClaims, error)
```

### Frontend API (frontend/src/app/core/services/auth.service.ts)

```typescript
requestRecovery(email: string): Observable<{ message: string }>
resetPassword(token: string, password: string): Observable<{ message: string }>
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Go) | JWT generate/validate con ResetClaims | Unit test directo |
| Unit (Go) | UpdatePassword sin auth | Mock repo |
| Unit (Go) | Rate limiting | Mock time |
| Integration | Endpoint /recover-request | httptest |
| Integration | Endpoint /recover-password | httptest |
| E2E | Flow completo recovery | No (requiere email real) |

## Migration / Rollout

No requiere migración de base de datos. Feature flag no necesaria (rollout directo).

## Open Questions

Ninguna — todas las decisiones están tomadas.

---

### Pregunta Pendiente (para vos)
**¿Cuál es la URL base de la app?** (necesito saberla para construir el link en el email). Por ejemplo: `https://app.congalameda.org` o `http://localhost:4200` en desarrollo.