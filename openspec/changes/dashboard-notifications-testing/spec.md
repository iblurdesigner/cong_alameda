# Spec: Dashboard Notifications Testing

## Overview

Testing-only change — no behavior modifications. Fix compilation in existing notification spec files and add minimal coverage for the orphan `notification-list` component.

## Preconditions

- `tsconfig.spec.json` configured with `moduleResolution: "node"` (overrides inherited `"bundler"`)
- Jest 30 + jest-preset-angular 16 + ts-jest 29 installed (`frontend/package.json`)
- `@angular/compiler` imported in `setup-jest.ts` (JIT compilation for `HttpClient`)
- `NotificationService` injectable via `providedIn: 'root'`
- `localStorage` mock configured in `setup-jest.ts`
- `jsdom` test environment (set in `jest.config.js`)
- `skipLibCheck: true` in `tsconfig.json` (already set)

## Existing Specs

### `notification.service.spec.ts` (MODIFY — compile only)

| Describe block | Tests | What it validates |
|---|---|---|
| `loadNotifications` | 8 | GET calls with filters (none, leida, tipo, both), signal updates (`notificaciones`, `unreadCount`, `loading`), empty response |
| `markAsRead` | 5 | PUT call, local state mutation, `unreadCount` decrement (including floor at 0), 404 error |
| `markAllAsRead` | 3 | PUT call, all → leida, `unreadCount` → 0 |
| `signal state` | 4 | Initial values (`[]`, `0`, `false`), loading flips to `true` during request |
| `error handling` | 3 | HTTP 500, network error, loading reset on error |
| `filter combinations` | 2 | `leida=true`, all 7 supported `tipo` values |
| **Total** | **25** | |

**Expected compile issues after `moduleResolution` fix**: None. Logic and types are correct. No code changes needed.

### `notification-dashboard.component.spec.ts` (MODIFY — mock types)

| Describe block | Tests | What it validates |
|---|---|---|
| `initialization` | 4 | Component created, `loadNotifications` called on init, unread count in header (`3 sin leer`), mark-all button present |
| `filter chips` | 5 | Default "Todos" chip active, all 7 tipo chips rendered, chip badge counts, `setFilter` on click, page reset to 1 |
| `grouping by type` | 4 | Groups created from notifications, count per group, alphabetical sort by `tipo`, no grouping when filtered |
| `notification cards` | 5 | `mensaje` rendered, formatted date (`24 abr`), unread badge present/absent, `.unread` CSS class |
| `mark as read` | 4 | Click unread → calls `markAsRead`, click read → no call, `markAllAsRead` called, button disabled at 0 |
| `empty state` | 2 | Empty list shows `.empty-state` with "No hay notificaciones", filter with no matches |
| `loading state` | 1 | `.loading` / `.loader-container` visible when `loading()` is `true` |
| `pagination` | 4 | Pagination visible with 55 items (PAGE_SIZE=50), page info text, prev/next buttons, disable at boundaries |
| `computed signals` | 3 | `filteredNotificaciones` without/with filter, `totalPages` calculation |
| `helper methods` | 5 | `getCountByTipo`, `getTipoConfig` (valid + invalid), `getTipoLabel`, `formatDate` |
| `tipos config` (standalone `describe`) | 3 | All 7 required types present, unique icons, unique colors |
| `badge logic` (standalone `describe`) | 2 | `showBadge` predicate (`count > 0`), count calculation |
| **Total** | **42** | |

**Compile issues to resolve**:
- Signal overrides use `as any` casts at lines 323, 324, 336, 360, 383, 465:
  ```typescript
  (mockNotificationService as any).unreadCount = signal(0);
  (mockNotificationService as any).notificaciones = signal([]);
  (mockNotificationService as any).loading = signal(true);
  ```
  These bypass type checking and may mask compilation errors. Fix with a typed override helper.

## New Spec

### `notification-list.component.spec.ts` (CREATE — 4 tests)

| # | Test name | What it validates |
|---|---|---|
| 1 | `should create` | Component instantiates, signals initialized |
| 2 | `should show loading state` | `.loader-container` visible when `loading()` is `true` |
| 3 | `should show empty state` | `.empty-state` contains "No hay notificaciones" when notifications array is empty |
| 4 | `should render notifications` | Notifications displayed with `mensaje` and tipo label when data is present |

**Mock pattern**:
- `jest.fn()` for all service methods (`loadNotifications`, `markAsRead`, `markAllAsRead`)
- `signal(...).asReadonly()` for state signals (`notificaciones`, `unreadCount`, `loading`)
- Typed factory using `as unknown as NotificationService` or an explicit interface matching the service's public API
- Provide mock via `TestBed.configureTestingModule({ providers: [{ provide: NotificationService, useValue: mock }] })`

## Success Criteria

- [ ] `notification.service.spec.ts` compiles and all 25 tests pass
- [ ] `notification-dashboard.component.spec.ts` compiles and all 42 tests pass
- [ ] `notification-list.component.spec.ts` compiles and all 4 tests pass
- [ ] `npx jest --testPathPattern="notification"` → all green (no errors, no failures)
- [ ] `ng build` → no errors (tsconfig change doesn't leak to app build)
- [ ] `npx jest` (full suite) → no regressions in other spec files
