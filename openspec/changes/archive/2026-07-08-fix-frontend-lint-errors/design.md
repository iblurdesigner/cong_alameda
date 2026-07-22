# Design: Fix Frontend Lint Errors

## Technical Approach

Config-first: add ESLint `overrides` for test files to suppress `no-unsafe-*`/`no-explicit-any` (70% of current errors), then fix production files file-by-file sorted by error count (quick wins first). Each batch verified with `npx eslint . && ng build`. Per spec: no global suppression, no new types ΓÇö use existing interfaces.

## Architecture Decisions

### Decision: Test File Override Rules

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Disable all rules for test files | Loses real jest API errors | Γ¥î |
| Selective override: `no-unsafe-*` + `no-explicit-any` | False-positive Jest mock errors suppressed; meaningful violations caught | Γ£à |
| Override per spec file with inline comments | Duplicate `eslint-disable` in every spec file | Γ¥î |

**Rationale**: Jest 30 mocks (`jest.fn()`, `mockReturnValue`) are inherently dynamic ΓÇö `recommendedTypeChecked` flags every mock call as unsafe, producing ~190 false positives across 4 spec files and `setup-jest.ts`. Centralized overrides in `eslint.config.js` are the only practical fix.

### Decision: Fix Order ΓÇö Error Count Ascending

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Fix by error count ascending | Quick wins build confidence; complex files get more attention | Γ£à |
| Fix by dependency order (services ΓåÆ components) | Blocks UI work until backend fix cycle finishes | Γ¥î |
| Fix all at once with `eslint --fix` | Cannot use auto-fix for type-aware rules; risks breakage | Γ¥î |

**Rationale**: Files with 1ΓÇô2 errors (unused vars, floating promises) are trivial to fix and can be verified independently. Starting with them builds rhythm and validates the verify script (`eslint . && ng build`). Heavier files (services with `any` usage) come last.

### Decision: Floating Promises ΓÇö `void` over `await`

| Scenario | Approach | Rationale |
|----------|----------|-----------|
| Fire-and-forget (e.g. sidebar animation) | `void` expression | Intent is explicit: result is discarded |
| Observable subscription with side effect | `await` in async context | Router calls, navigation guards must complete |
| `subscribe()` with no error handler | Add `.subscribe({ error: ... })` or `completed` | Prevents unhandled rejections |

**Rationale**: `void` signals intentional discard; `await` signals the caller waits for completion. Both satisfy `no-floating-promises` but communicate different intent.

## Data Flow

```
eslint.config.js (add overrides)
       Γöé
       Γû╝
  Batch 1: Fix spec files (via override config)
       Γöé
       Γû╝
  Batch 2-5: Fix production files (ascending errors)
       Γöé
       Γû╝
  Verify: eslint . ΓåÆ ng build
       Γöé
       Γû╝
  All files clean ΓåÆ Done
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/eslint.config.js` | Modify | Add test file override block (7 relaxed rules) |
| `frontend/src/app/app.component.ts` | Modify | Remove unused `computed` import, add `void` to floating promise |
| `frontend/src/app/core/guards/auth.guard.ts` | Modify | Remove unused route/state params, `await` promise |
| `frontend/src/app/core/interceptors/auth.interceptor.ts` | Modify | Remove unused `router` assignment |
| `frontend/src/app/core/services/asignacion.service.ts` | Modify | Replace `any` with HttpClient/domain types |
| `frontend/src/app/core/services/auth.service.ts` | Modify | Lint fixes |
| `frontend/src/app/core/services/casa.service.ts` | Modify | Lint fixes |
| `frontend/src/app/core/services/notification.service.ts` | Modify | Lint fixes |
| `frontend/src/app/core/services/programa-visita.service.ts` | Modify | Lint fixes |
| `frontend/src/app/core/services/semana.service.ts` | Modify | Lint fixes |
| `frontend/src/app/features/admin/usuarios/usuarios-list.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/asignaciones/asignacion-list.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/asignaciones/semana-editar.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/auth/login/login.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/auth/recovery/recovery.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/casas/casa-detail/casa-detail.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/casas/casa-form/casa-form.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/casas/casa-list/casa-list.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/dashboard/dashboard.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/profile/profile.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/programa-predicacion/programa-predicacion-list.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/programa-visita/programa-visita-list.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/semanas/semana-detail.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/semanas/semana-list.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/territorios/territorio-list.component.ts` | Modify | Lint fixes |
| `frontend/src/app/features/visitas/visita-list/visita-list.component.ts` | Modify | Lint fixes |

## Interfaces / Contracts

No new interfaces. Existing types to reference:

```typescript
import { HttpClient } from '@angular/common/http';  // services use this
import { Observable } from 'rxjs';                    // for return types
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Lint | All `.ts` files pass | `npx eslint .` exits 0 |
| Build | Full Angular compilation | `ng build` completes |
| Unit | Existing Jest tests | `npx jest` ΓÇö no regressions |
| Smoke | Test file overrides do not mask real errors | Manual: add intentional error in spec, verify it's caught by remaining active rules |

## Migration / Rollout

No migration required. Change is purely lint configuration + production code fixes. Each batch is independently verifiable and revertable.

## Open Questions

- None. Error categories, fix patterns, and file scope are all confirmed by running ESLint against the current codebase.
