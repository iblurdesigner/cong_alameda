# Design: Dashboard Notifications Testing

## Technical Approach

Fix the root cause (`moduleResolution: "bundler"` → `"node"` in `tsconfig.spec.json`), clean up mock typing patterns in the dashboard spec, and add minimal test coverage for the orphan `notification-list` component.

## Architecture Decisions

### Decision: `moduleResolution` override

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Override to `"node"` in `tsconfig.spec.json` | Works with ts-jest, compatible with existing imports | ✅ **Chosen** |
| Override to `"node16"` | Also works but requires `.js` extensioned imports | Stricter than needed |
| Fix `tsconfig.json` (remove bundler) | Breaks Angular CLI build (depends on bundler for HMR) | Not acceptable |
| Keep `"bundler"` | ts-jest 29 chokes — tests don't compile | Broken |

**Rationale**: ts-jest compiles spec files with a Node-based resolver. `"bundler"` resolution is incompatible and causes ts-jest to reject the config. Overriding only `tsconfig.spec.json` confines the impact to test files.

### Decision: Typed mock helper over `as any`

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Typed factory + `updateMockSignal()` helper | Clean types, maintainable | ✅ **Chosen** |
| Keep `as any` casts | Works at runtime but disables type checking | Rejected |
| `jest.spyOn(realService)` | Requires full DI + HTTP setup, couples to implementation | Overkill |

**Rationale**: The six `as any` signal reassignments in the spec mask real type mismatches. A typed helper makes intent explicit and preserves compile-time safety.

### Decision: Signal-based mocks for new spec

Use `signal(...).asReadonly()` for state and `jest.fn().mockReturnValue(of(...))` for methods — consistent with the existing dashboard spec pattern and idiomatic Angular for service-dependent components.

## Data Flow

```
jest.config.js ──→ tsconfig.spec.json  ──→ *.spec.ts
       │                │
       │          (override             notification.service.spec.ts
       │         moduleResolution:      (25 tests, no changes needed)
       │           "node")                    │
       │                │               notification-dashboard.component.spec.ts
  setup-jest.ts         │               (42 tests, fix mock types)
  (localStorage,        │                     │
   @angular/compiler)   │               notification-list.component.spec.ts ★
                        │               (4 tests, new file)
                   tsconfig.json
                   (bundler — unchanged,
                    only app build)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/tsconfig.spec.json` | Modify | Add `"moduleResolution": "node"` to `compilerOptions` |
| `frontend/src/app/core/services/notification.service.spec.ts` | Modify | Verify compilation — no logic changes expected |
| `frontend/src/app/features/notifications/notification-dashboard/notification-dashboard.component.spec.ts` | Modify | Replace `(mock as any).signal = signal(v)` with typed `overrideMockSignal()` helper |
| `frontend/src/app/features/notifications/notification-list/notification-list.component.spec.ts` | Create | 4 tests: creation → loading → empty → render |

## Interfaces / Mock Pattern

```typescript
// Typed mock factory (dashboard + list specs)
function createMockNotifService(overrides?: {
  notificaciones?: Notificacion[];
  unreadCount?: number;
  loading?: boolean;
}): NotificationService {
  const items = overrides?.notificaciones ?? [];
  return {
    notificaciones: signal(items).asReadonly(),
    unreadCount: signal(overrides?.unreadCount ?? 0).asReadonly(),
    loading: signal(overrides?.loading ?? false).asReadonly(),
    loadNotifications: jest.fn().mockReturnValue(
      of({ data: items, unread_count: overrides?.unreadCount ?? 0 })
    ),
    markAsRead: jest.fn().mockReturnValue(of({})),
    markAllAsRead: jest.fn().mockReturnValue(of({ message: 'OK' })),
  } as unknown as NotificationService;
}

// Helper to override a signal mid-test (replaces `as any` pattern)
function overrideSignal<T>(
  mock: NotificationService,
  key: 'notificaciones' | 'unreadCount' | 'loading',
  value: T
): void {
  (mock as any)[key] = signal(value);
}
```

## Testing Strategy

| Layer | Count | Approach |
|-------|-------|----------|
| Unit — service | 25 (keep) | `HttpTestingController` + TestBed, no logic changes |
| Unit — dashboard | 42 (fix) | Signal-based mocks, DOM queries, typed override helper |
| Unit — list | 4 (new) | Same mock pattern, lean coverage |
| Build smoke | — | `ng build` must succeed — config change isolated to `.spec.ts` |

## Implementation Order

1. **`tsconfig.spec.json`** — add `"moduleResolution": "node"`
2. **`notification.service.spec.ts`** — validate: `npx jest notification.service` → green
3. **`notification-dashboard.component.spec.ts`** — insert mock helper + override function, replace `as any` assignments, verify 42 tests pass
4. **`notification-list.component.spec.ts`** — create file with mock factory + 4 tests
5. **Verify** — `npx jest --testPathPattern="notification"` && `ng build`

## Migration / Rollout

No migration required. `tsconfig.spec.json` only affects `.spec.ts` files. Run full `npx jest` to confirm no regressions.

## Open Questions

- [ ] Verify `"moduleResolution": "node"` doesn't trigger TS5095 on Angular type declarations — `skipLibCheck: true` (already set in `tsconfig.json`) mitigates this
- [ ] Confirm `as unknown as NotificationService` compiles in strict mode — the cast discards private methods, which is acceptable for a test mock
