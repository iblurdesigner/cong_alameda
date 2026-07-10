# Tasks: Password Recovery

## Review Workload Forecast

Estimated ~350 changed lines — single PR within budget.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full recovery flow | PR 1 | single PR: foundation → handlers → routes → tests |

## Phase 1: Foundation

- [x] 1.1 Add `ResetClaims` struct + `GenerateResetToken` / `ValidateResetToken` to `backend/pkg/jwt/jwt.go`
- [x] 1.2 Add `GetByEmail(ctx, email)` method to `backend/internal/services/user_service.go`
- [x] 1.3 Create `EmailService` interface + `ConsoleEmailService` in `backend/internal/services/email_service.go`
- [x] 1.4 Create `RateLimiter` with `Allow(key) bool` + GC in `backend/internal/services/rate_limiter.go`
- [x] 1.5 Add `RecoverRequest`, `ResetPasswordRequest` DTOs to `backend/internal/dto/responses.go`

## Phase 2: Handler + Routes

- [x] 2.1 Update `AuthHandler` struct/constructor to accept `EmailService`, `*RateLimiter`, `*JWTManager` — add `RequestRecovery` + `ResetPassword` methods
- [x] 2.2 Wire `emailService` + `rateLimiter` in `backend/cmd/server/main.go` — register `POST /auth/recover-request` and `POST /auth/recover-password` as public routes

## Phase 3: Tests

- [x] 3.1 Unit tests: RateLimiter (allow/deny/expiry), ConsoleEmailService (logs URL), ResetClaims (generate/validate/expired/wrong purpose)
- [x] 3.2 Handler tests in `backend/internal/handlers/auth_handler_recovery_test.go` — table-driven: valid request, email not found, rate limited, invalid token, expired token, weak password

## Phase 4: Verify

- [ ] 4.1 Run `go build ./...` — no compilation errors
- [ ] 4.2 Run `go test ./...` — all tests pass
