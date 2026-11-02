# Proposal: Dashboard Notifications Testing

## Intent

Fix the existing test suite for the notifications feature (dashboard + service) so tests compile and pass. Currently, `notification.service.spec.ts` (16 tests) and `notification-dashboard.component.spec.ts` (30+ tests) fail due to `tsconfig.spec.json` misconfiguration (`moduleResolution: "bundler"` is incompatible with ts-jest) and type errors. The `notification-list.component.ts` is orphan code with zero test coverage.

## Scope

### In Scope
- Fix `tsconfig.spec.json` to use a `moduleResolution` compatible with ts-jest + jest-preset-angular
- Fix compile errors in `notification.service.spec.ts` (logic is correct, only type/config issues)
- Fix compile errors in `notification-dashboard.component.spec.ts` (15+ tests, non-trivial mock setup)
- Create `notification-list.component.spec.ts` with minimal coverage: render + empty state

### Out of Scope
- Backend `auth_handler_recovery_test.go` — not part of this change
- New tests for `notification-list.component` beyond basic rendering
- Refactoring notification-list (orphan code decision deferred)
- E2E or integration tests for the notification flow
- Other failing spec files outside notifications

## Capabilities

> This section is the CONTRACT between proposal and specs phases.
> The sdd-spec agent reads this to know exactly which spec files to create or update.

### New Capabilities
None — no new capability introduced. All artifacts are test-only changes.

### Modified Capabilities
None — no spec-level behavior changes. Only test configuration and test file fixes.

## Approach

1. **tsconfig.spec.json** — change `moduleResolution` from `"bundler"` (inherited via `extends`) to `"node"` (or `"node16"`), which `ts-jest` and `jest-preset-angular` support for module resolution.
2. **notification.service.spec.ts** — fix any type errors (likely `HttpTestingController` generics, signal access patterns). Logic is solid with 16 well-structured tests.
3. **notification-dashboard.component.spec.ts** — fix mock type mismatches (the mock uses `as any` casts for signal overrides) and compile errors from Angular testing utilities.
4. **notification-list.component.spec.ts** — create a lean spec: component creation + loading state + empty state. No need for full coverage since the component is not in use.
5. **Verify** — run `npx jest` targeting notification specs, confirm all pass.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/tsconfig.spec.json` | Modified | Fix `moduleResolution` for Jest compat |
| `frontend/src/app/core/services/notification.service.spec.ts` | Modified | Fix compile errors (16 tests) |
| `frontend/src/app/features/notifications/notification-dashboard/notification-dashboard.component.spec.ts` | Modified | Fix compile errors (30+ tests) |
| `frontend/src/app/features/notifications/notification-list/notification-list.component.spec.ts` | **New** | Basic render + empty state tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `moduleResolution` change breaks other spec files | Low | `tsconfig.spec.json` only affects `.spec.ts` files; verify with full `npx jest` run |
| Signal override pattern doesn't match component expectations | Med | Use `computed` signals in mocks instead of `WritableSignal` casts; test one at a time |
| Angular 21 + jest-preset-angular 16 version incompatibility | Low | Pin exact versions; verify against existing working tests in repo |

## Rollback Plan

Revert `tsconfig.spec.json` to its original content. Restore any modified `.spec.ts` files via `git checkout`. No data, schema, or production code is affected.

## Dependencies

- Jest 30 + jest-preset-angular 16 + ts-jest 29 already installed
- Angular 21 standalone project already configured

## Success Criteria

- [ ] `npx jest --testPathPattern="notification"` passes all tests
- [ ] `ng build` completes without errors
- [ ] `notification-list.component.spec.ts` compiles and runs
- [ ] No regressions in other spec files