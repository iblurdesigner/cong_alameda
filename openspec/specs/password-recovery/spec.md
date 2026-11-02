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


<!-- Fusion specs 2026-11-01 - origen: 2026-11-01-password-recovery -->

# Password Recovery Specification

## Purpose

Este specification define el sistema de recuperación de contraseña por correo electrónico. Permite a usuarios que olvidan su contraseña restablecer el acceso mediante un enlace temporal enviado por email.

## Requirements

### Requirement: Solicitar Recuperación de Contraseña

El sistema DEBE permitir a un usuario solicitar un enlace de recuperación de contraseña ingresando únicamente su dirección de correo electrónico.

#### Scenario: Solicitud válida

- GIVEN un usuario con email registrado "usuario@test.com"
- WHEN solicita recuperación en `/api/auth/recover-request` con `{"email": "usuario@test.com"}`
- THEN recibe respuesta HTTP 200 con `{"message": "Se envió un enlace de recuperación a tu correo"}`
- AND se envía email con link de recovery a "usuario@test.com"

#### Scenario: Email no registrado

- GIVEN ningún usuario con email "inexistente@test.com"
- WHEN solicita recuperación con `{"email": "inexistente@test.com"}`
- THEN respuesta HTTP 200 (mismo comportamiento que caso válido para prevenir enumeration)
- AND NO se envía email

#### Scenario: Rate limiting

- GIVEN un usuario solicitó recovery para "test@test.com" en los últimos 5 minutos
- WHEN intenta solicitar nuevamente
- THEN recibe HTTP 429 con error "rate_limit_exceeded"

### Requirement: Validar Token de Recuperación

El sistema DEBE validar tokens de recuperación JWT y verificar que no haya expirado.

#### Scenario: Token válido

- GIVEN un JWT válido con claim "password_reset" y expiry 15 minutos
- WHEN endpoint `/api/auth/recover-password` valida el token
- THEN permite cambio de contraseña

#### Scenario: Token expirado

- GIVEN un JWT válido pero con expiry hace más de 15 minutos
- WHEN valida el token
- THEN recibe HTTP 400 con error "token_expired"

#### Scenario: Token inválido

- GIVEN un JWT con formato inválido o sin claim "password_reset"
- WHEN valida el token
- THEN recibe HTTP 400 con error "invalid_token"

### Requirement: Cambiar Contraseña

El sistema DEBE permitir cambiar la contraseña usando token válido.

#### Scenario: Cambio exitoso

- GIVEN un token JWT válido "password_reset" y nueva contraseña "NuevaPass123"
- WHEN envía POST `/api/auth/recover-password` con `{"token": "...", "password": "NuevaPass123"}`
- THEN respuesta HTTP 200 con `{"message": "Contraseña actualizada"}`
- AND la nueva contraseña permite hacer login

#### Scenario: Contraseña débil

- GIVEN token válido y contraseña "123" (menos de 6 caracteres)
- WHEN intenta cambiar contraseña
- THEN HTTP 400 con error "password_too_short"

### Requirement: Email de Recuperación

El sistema DEBE enviar un email con enlace de recuperación que contenga el token JWT.

#### Scenario: Contenido del email

- GIVEN el sistema envía email de recuperación
- WHEN el usuario recibe el email
- THEN contiene subject "Recuperación de Contraseña - Congregación Alameda"
- AND contiene link con formato `{baseUrl}/recovery?token={jwt}`

## ADDED Requirements

### Requirement: Rate Limiting por Email

El sistema DEBE implementar rate limiting para prevenir abuso del endpoint de recuperación.

- GIVEN cualquier solicitud a `/api/auth/recover-request`
- WHEN el mismo email se solicita más de 1 vez en 5 minutos
- THEN responder con HTTP 429 "rate_limit_exceeded"
- AND NO reenviar email

### Requirement: Formato de Token JWT

El token de recuperación DEBE ser un JWT con características específicas.

- GIVEN el sistema genera un token de recuperación
- WHEN crea el JWT
- THEN incluir claim "type": "password_reset"
- AND incluir claim "email": email del usuario
- AND setear expiration a 15 minutos desde generación

### Requirement: Frontend - Link de Recuperación

La página de login DEBE mostrar un enlace para recuperar contraseña.

- GIVEN el usuario está en la página de login
- WHEN visualiza el formulario
- THEN ve enlace/link "Olvidé mi contraseña"
- AND al hacer click navega a `/recovery`

### Requirement: Frontend - Página de Recovery

La página de recovery DEBE permitir al usuario establecer una nueva contraseña.

- GIVEN el usuario accede a `/recovery?token={jwt}`
- WHEN la página carga
- THEN valida que el token sea válido mostrar el formulario
- AND muestra campos "Nueva Contraseña" y "Confirmar Contraseña"
- AND incluye botón "Cambiar Contraseña"

#### Scenario: Token inválido en frontend

- GIVEN el usuario accede a `/recovery?token=invalid`
- WHEN la página intenta usar el token
- THEN muestra error "Token inválido o expirado"
- AND no muestra formulario de contraseña