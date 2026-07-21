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

- [ ] 1.1 Add `"moduleResolution": "node"` to `tsconfig.spec.json` compilerOptions — read current, insert after `"types"` line

## Phase 2: Spec Fixes

- [ ] 2.1 Verify `notification.service.spec.ts` compiles after tsconfig fix — run `npx jest notification.service` — all 25 tests must pass without code changes
- [ ] 2.2 Insert `overrideSignal()` typed helper in `notification-dashboard.component.spec.ts` — add after imports, before the outer `describe` block:

```typescript
function overrideSignal<T>(
  mock: Partial<NotificationService>,
  key: 'notificaciones' | 'unreadCount' | 'loading',
  value: T
): void {
  (mock as any)[key] = signal(value);
}
```

- [ ] 2.3 Replace 5 `(mockNotificationService as any).XXX = signal(...)` assignments in dashboard spec with `overrideSignal(mockNotificationService, 'XXX', ...)` calls — lines 323, 336, 360, 383, 465
- [ ] 2.4 Verify dashboard spec compiles — run `npx jest notification-dashboard` — all 42 tests pass

## Phase 3: New Spec

- [ ] 3.1 Create `notification-list.component.spec.ts` — 4 tests (creation, loading, empty, render) using same mock factory pattern as dashboard spec, imported from `@angular/core/testing` + `signal`/`of` + `jest.fn()`
- [ ] 3.2 Verify list spec compiles — `npx jest notification-list` — 4 tests pass

## Phase 4: Verify

- [ ] 4.1 Run `npx jest --testPathPattern="notification"` — all 71 tests green
- [ ] 4.2 Run `ng build` — no compilation errors (tsconfig override doesn't leak)
- [ ] 4.3 Run `npx jest` (full suite) — no regressions in other spec files
