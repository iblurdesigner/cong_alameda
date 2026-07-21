# Spec: password-recovery

## Overview

Provides a secure password recovery flow with two endpoints: one to request a recovery token (sent via email) and one to reset the password using that token. Protects against email enumeration by returning identical 200 responses for found and unfound emails, and rate-limits requests per email to 1 per 5 minutes.

## Endpoints

### POST /api/auth/recover-request

**Purpose**: Initiate password recovery by requesting a reset token sent via email.

**Request**:
```json
{ "email": "string" }
```

**Response 200** (always):
```json
{ "message": "Si el email está registrado, recibirás instrucciones" }
```

**Behavior**:
- Always returns HTTP 200 regardless of whether the email exists (enumeration protection)
- If the email exists: generates a JWT reset token with 15-minute expiry and `Purpose: "password_reset"`, then sends via `EmailService.SendPasswordReset`
- If the email does not exist: silently returns 200 with the same message, no side effects
- Rate-limited: at most 1 request per email per 5 minutes from the in-memory rate limiter

**Error states**: None — always returns 200 (enumeration prevention).

**Rate limiting**: In-memory `map[string]time.Time` with mutex, per-email, 1 request / 5 min sliding window. Returns 429 with `{"error": "rate_limit", "message": "Demasiadas solicitudes. Intente nuevamente en 5 minutos."}` if exceeded.

**Idempotency**: Multiple requests within the same rate-limit window do NOT regenerate the token. The first valid request generates the token; subsequent requests return 200 silently.

### POST /api/auth/recover-password

**Purpose**: Reset a forgotten password using a valid recovery token.

**Request**:
```json
{ "token": "string", "password": "string" }
```

**Response 200**:
```json
{ "message": "Contraseña actualizada exitosamente" }
```

**Response 400** — Invalid token:
```json
{ "error": "invalid_token", "message": "El token de recuperación es inválido" }
```

**Response 400** — Expired token:
```json
{ "error": "token_expired", "message": "El token de recuperación ha expirado" }
```

**Response 400** — Weak password:
```json
{ "error": "weak_password", "message": "La contraseña debe tener al menos 6 caracteres" }
```

**Validation**:
- Password MUST be at least 6 characters
- Token MUST be a valid JWT signed by the HMAC secret
- Token MUST NOT be expired (15-minute maximum age)
- Token MUST have `Purpose` claim set to `"password_reset"`
- Token is single-use: after a successful reset, the password hash changes, invalidating the token for future attempts

## Integration

### JWT (`pkg/jwt/jwt.go`)
- New `ResetClaims` struct with `UserID`, `Email`, `Purpose string`, `jwt.RegisteredClaims`
- `GenerateResetToken(userID uuid.UUID, email string) (string, error)` — 15-min expiry, issuer `"cong-alameda-backend"`
- `ValidateResetToken(token string) (*ResetClaims, error)` — validates signature, Purpose, and expiry
- Reuses the existing HMAC secret from `JWTManager`

### EmailService (`internal/services/email_service.go`)
- New interface:
  ```go
  type EmailService interface {
      SendPasswordReset(email string, token string) error
  }
  ```
- `ConsoleEmailService` — logs the full recovery URL to stdout
- `SMTPEmailService` — placeholder struct for future SMTP integration

### Rate Limiter (`internal/services/rate_limiter.go`)
- In-memory, per-email, 5-minute cooldown window
- Thread-safe via `sync.Mutex`
- GC cleans expired entries on each access

### AuthHandler
- Extended to accept `EmailService` and `*jwt.JWTManager` as dependencies
- New public methods: `RequestRecovery`, `ResetPassword`

### Routes
- Both endpoints are PUBLIC (no auth middleware) under `/api/auth/`
- `POST /api/auth/recover-request` → `AuthHandler.RequestRecovery`
- `POST /api/auth/recover-password` → `AuthHandler.ResetPassword`

## Non-Functional Requirements

- **Security**: Reset tokens MUST expire after 15 minutes. Token reuse MUST be prevented (password hash changes on reset, invalidating old tokens). Always return 200 on recover-request to prevent email enumeration.
- **Performance**: In-memory rate limiter adds negligible overhead (~1µs per check). No database writes on recover-request (only on actual password reset).
- **Observability**: ConsoleEmailService MUST print the full recovery URL to stdout. Rate limiter SHOULD log when throttling a request.
- **Resilience**: Rate limiter state is lost on restart — acceptable for v1. Token is self-contained (JWT) with no server-side session storage.
