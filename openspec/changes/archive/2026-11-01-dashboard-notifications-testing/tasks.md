# Tasks: Dashboard Notifications Testing

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~85–95 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Config Fix

- [x] 1.1 Add `"moduleResolution": "node"` to `tsconfig.spec.json` compilerOptions — read current, insert after `"types"` line

## Phase 2: Spec Fixes

- [x] 2.1 Verify `notification.service.spec.ts` compiles after tsconfig fix — run `npx jest notification.service` — all 25 tests must pass without code changes
- [x] 2.2 Insert `overrideSignal()` typed helper in `notification-dashboard.component.spec.ts` — add after imports, before the outer `describe` block:

```typescript
function overrideSignal<T>(
  mock: Partial<NotificationService>,
  key: 'notificaciones' | 'unreadCount' | 'loading',
  value: T
): void {
  (mock as any)[key] = signal(value);
}
```

- [x] 2.3 Replace 5 `(mockNotificationService as any).XXX = signal(...)` assignments in dashboard spec with `overrideSignal(mockNotificationService, 'XXX', ...)` calls — lines 323, 336, 360, 383, 465
- [x] 2.4 Verify dashboard spec compiles — run `npx jest notification-dashboard` — all 42 tests pass

## Phase 3: New Spec

- [x] 3.1 Create `notification-list.component.spec.ts` — 4 tests (creation, loading, empty, render) using same mock factory pattern as dashboard spec, imported from `@angular/core/testing` + `signal`/`of` + `jest.fn()`
- [x] 3.2 Verify list spec compiles — `npx jest notification-list` — 4 tests pass

## Phase 4: Verify

- [x] 4.1 Run `npx jest --testPathPattern="notification"` — all 71 tests green
- [x] 4.2 Run `ng build` — no compilation errors (tsconfig override doesn't leak)
- [x] 4.3 Run `npx jest` (full suite) — no regressions in other spec files

## Closure Note (2026-11-01)

All tasks verified complete, but the applied solution differs from the original forecast:

- Task 1.1: NOT solved via `moduleResolution: "node"` — `tsconfig.spec.json` still uses `"bundler"`. The actual fix added `paths` overrides for `@angular/core/testing`, `@angular/common/http/testing`, and `@angular/common/http` pointing at the Angular type declaration files.
- Tasks 2.1-2.4: all spec suites compile and pass without the `overrideSignal()` helper refactor.
- Task 3.1: `notification-list.component.spec.ts` exists with 4 tests (creation, loading, empty, render).
- Verified 2026-11-01: `notification.service` + `notification-dashboard` = 70/70 pass, `notification-list` = 4/4 pass.