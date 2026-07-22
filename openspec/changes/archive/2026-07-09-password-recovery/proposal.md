# Proposal: Password Recovery

## Intent

Users need a way to regain access when they forget their password. Frontend already has the UI — backend is missing the recovery endpoints entirely.

## Scope

### In Scope
- Backend recovery handlers: `RequestRecovery` + `ResetPassword`
- `ResetClaims` JWT type with `Purpose: "password_reset"` (15 min expiry)
- DTOs for recovery request and password reset
- `EmailService` interface + `ConsoleEmailService` (console logger) + deferred `SMTPEmailService`
- In-memory rate limiting (1 req / 5 min per email)
- Routes: `POST /auth/recover-request`, `POST /auth/recover-password` (both public)
- Handler tests with table-driven pattern

### Out of Scope
- Frontend changes (already complete)
- Password strength rules beyond min 6 chars
- SMTP implementation (deferred, console logger in dev)
- Rate-limit persistence across restarts

## Capabilities

### New Capabilities
- `password-recovery`: request recovery token generation and password reset flow

### Modified Capabilities
- None

## Approach

1. **JWT**: Add `ResetClaims` struct to `pkg/jwt/jwt.go` with `UserID`, `Email`, `Purpose: "password_reset"`. Add `GenerateResetToken(userID, email)` and `ValidateResetToken(token)` with 15 min expiry. Reuses same HMAC secret.
2. **EmailService**: Interface with `SendPasswordReset(email, token)` — `ConsoleEmailService` logs to stdout, `SMTPEmailService` placeholder for later.
3. **Handlers**: `RequestRecovery` — validates email (always returns 200 to prevent enumeration), calls `userRepo.GetByEmail`, generates reset token, sends via EmailService. `ResetPassword` — validates reset token, hashes new password via `userRepo.Update`.
4. **Rate limiting**: In-memory `map[string]time.Time` with mutex, GC on each check.
5. **Routes** in `main.go`: both public under `/auth/` group.
6. **Tests**: HTTP handler tests mocking UserService + EmailService.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/pkg/jwt/jwt.go` | Modified | Add `ResetClaims` + reset token methods |
| `backend/internal/handlers/auth_handler.go` | Modified | Add `RequestRecovery`, `ResetPassword` |
| `backend/internal/dto/responses.go` | Modified | Add `RecoverRequest`, `ResetPasswordRequest` |
| `backend/cmd/server/main.go` | Modified | Register 2 new public routes |
| `backend/internal/services/` | New | `email_service.go` — interface + console impl |
| `backend/internal/handlers/auth_handler_test.go` | New | Table-driven handler tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| No email delivery without SMTP | High | Console logger prints link to stdout |
| Rate limit bypass on multi-instance | Low | Acceptable for v1; redis later if needed |
| Token replay window (15 min) | Low | Short expiry; user must complete flow in one shot |

## Rollback Plan

Remove routes, handlers, and `ResetClaims` code. Rate limiter memory is lost on restart.

## Dependencies

- None (no new external packages)

## Success Criteria

- [ ] All backend handler tests pass
- [ ] Full recovery flow works end-to-end: request → token → reset → login
- [ ] Build compiles without errors