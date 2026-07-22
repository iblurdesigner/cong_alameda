# Design: Password Recovery

## Architecture Overview

Four independent components wired into the existing Fiber HTTP pipeline: `ResetClaims` (JWT), `EmailService` (interface + console impl), `RateLimiter` (in-memory), and two new handler methods on `AuthHandler`. Dependencies flow: `main.go` → instantiate → inject via extended constructor → handlers consume.

```
POST /auth/recover-request ──→ AuthHandler.RequestRecovery ──→ RateLimiter.Allow
                                     │                            │
                                     ├── UserService.GetByEmail ──┘
                                     └── JWTManager.GenerateResetToken → EmailService.SendPasswordReset

POST /auth/recover-password ──→ AuthHandler.ResetPassword ──→ JWTManager.ValidateResetToken
                                     │
                                     └── UserService.Update (hashes + persists)
```

## Component Design

### 1. JWT — ResetClaims (`pkg/jwt/jwt.go`)

New struct alongside existing `Claims`:

```go
type ResetClaims struct {
    UserID  uuid.UUID `json:"user_id"`
    Email   string    `json:"email"`
    Purpose string    `json:"purpose"` // always "password_reset"
    jwt.RegisteredClaims
}
```

Two new methods on `*JWTManager`:
- `GenerateResetToken(userID uuid.UUID, email string) (string, error)` — 15-min expiry, same HMAC secret, issuer `"cong-alameda-backend"`
- `ValidateResetToken(tokenString string) (*ResetClaims, error)` — mirrors `ValidateToken` pattern but parses `ResetClaims` and checks `Purpose == "password_reset"`

**Rationale**: Separate claim type isolates recovery tokens from auth tokens; the `Purpose` field prevents a reset token from being accepted as an auth token.

### 2. EmailService (`internal/services/email_service.go`)

Interface + console implementation:

```go
type EmailService interface {
    SendPasswordReset(email string, token string) error
}

type ConsoleEmailService struct {
    frontendURL string
}

func NewConsoleEmailService(frontendURL string) *ConsoleEmailService
```

`SendPasswordReset` logs `[EmailService] Recovery URL: {frontendURL}/recovery?token={token}` to stdout via `log.Printf`.

**Rationale**: Interface enables swapping SMTP later without touching handlers. Console impl works in dev and CI.

### 3. Rate Limiter (`internal/services/rate_limiter.go`)

```go
type RateLimiter struct {
    mu       sync.Mutex
    requests map[string]time.Time
    cooldown time.Duration
}

func NewRateLimiter(cooldown time.Duration) *RateLimiter
func (rl *RateLimiter) Allow(key string) bool
```

- 5-min cooldown per email key
- `Allow` returns `false` if last request was within cooldown, otherwise records timestamp and returns `true`
- GC cleans expired entries on each call to prevent unbounded growth
- Thread-safe via `sync.Mutex`

**Rationale**: In-memory is sufficient for v1 (no multi-instance concern yet). `sync.Mutex` over `sync.Map` because we need atomic read-delete-write per key.

### 4. AuthHandler — Recovery Methods (`internal/handlers/auth_handler.go`)

New fields + constructor change:

```go
type AuthHandler struct {
    userService  *services.UserService
    jwtMgr       *jwt.JWTManager
    emailService services.EmailService
    rateLimiter  *services.RateLimiter
}

func NewAuthHandler(userService *services.UserService, jwtMgr *jwt.JWTManager,
    emailService services.EmailService, rateLimiter *services.RateLimiter) *AuthHandler
```

**RequestRecovery**:
1. Parse `RecoverRequest{Email}`
2. Check `rateLimiter.Allow(email)` — return 429 if denied
3. Attempt `userService.GetByEmail` (silently ignore error — enumeration protection)
4. If user found + active: `jwtMgr.GenerateResetToken(user.ID, user.Email)` → `emailService.SendPasswordReset(email, token)`
5. Return `{"message": "Si el email está registrado, recibirás instrucciones"}` — always 200

**ResetPassword**:
1. Parse `ResetPasswordRequest{Token, Password}`
2. Validate password ≥ 6 chars — return 400 `weak_password` if not
3. `jwtMgr.ValidateResetToken(token)` — return 400 `invalid_token` or `token_expired`
4. `userService.Update(ctx, claims.UserID, map{"password": password})` — service hashes internally
5. Return `{"message": "Contraseña actualizada exitosamente"}`

### 5. DTOs (`internal/dto/responses.go`)

```go
type RecoverRequest struct {
    Email string `json:"email"`
}
type ResetPasswordRequest struct {
    Token    string `json:"token"`
    Password string `json:"password"`
}
type RecoverResponse struct {
    Message string `json:"message"`
}
```

### 6. Routes (`cmd/server/main.go`)

Both public under existing `/auth` group, before auth middleware:

```go
auth.Post("/recover-request", authHandler.RequestRecovery)
auth.Post("/recover-password", authHandler.ResetPassword)
```

Constructor in main.go updated: `authHandler := handlers.NewAuthHandler(userService, jwtManager, emailService, rateLimiter)`

## Test Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | RateLimiter.Allow | Table-driven: allow, deny within cooldown, allow after expiry, stale cleanup |
| Unit | ResetClaims | Generate → Validate → wrong purpose → expired (mock time) |
| Unit | ConsoleEmailService | Verify `log.Printf` is called with correct URL format |
| Handler | RequestRecovery | Mock UserService+EmailService+RateLimiter via interfaces; test valid, email not found, rate limited |
| Handler | ResetPassword | Mock UserService+JWTManager; test valid, invalid token, expired token, weak password |

Handler tests in `auth_handler_recovery_test.go` using `httptest` pattern with Fiber's `app.Test()`.

## Migration / Rollback

No migration required. Rollback: remove two routes, delete `email_service.go`, `rate_limiter.go`, revert `auth_handler.go`, `jwt.go`, `responses.go`, `main.go`.
