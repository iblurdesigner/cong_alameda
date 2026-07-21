# Proposal: Fix Frontend Lint Errors

## Intent

Clean up TypeScript lint violations in `frontend/src/` so that `npx eslint .` exits clean. Currently, `recommendedTypeChecked` rules flag ~100+ errorsΓÇömostly `no-unsafe-*` and `no-explicit-any` in test files. Unclean lint blocks pre-commit hooks and masks real issues.

## Scope

### In Scope
- Add ESLint `overrides` for `.spec.ts` and `setup-jest.ts` relaxing `no-unsafe-*` and `no-explicit-any`
- Fix `no-unused-vars` in production code
- Fix `no-floating-promises` in production code
- Add proper types where `any` is used in production code
- Handle `no-unsafe-*` errors in production code (type narrow or suppress per file)

### Out of Scope
- Backend lint errors (none exist)
- New type interfaces or modelsΓÇöuse existing types only
- Full codebase type refactoring
- SCSS lint rules (currently none configured)

## Capabilities

### New Capabilities
NoneΓÇöno new capability introduced.

### Modified Capabilities
- `developer-tooling`: ESLint rules relaxed for test files via `overrides`; production `recommendedTypeChecked` remains unchanged.

## Approach

1. **ESLint config first**: Add `overrides` block for test files relaxing `@typescript-eslint/no-unsafe-*` and `@typescript-eslint/no-explicit-any`.
2. **Fix production code file by file**: Prioritize by error countΓÇöfix `no-unused-vars`, `no-floating-promises`, then `no-unsafe-*` and missing types.
3. **Verify after each batch**: Run `npx eslint .` and `ng build` to confirm zero regressions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/eslint.config.js` | Modified | Add test-file overrides |
| `frontend/src/**/*.ts` (prod, ~37 files) | Modified | Fix lint errors per file |
| `frontend/src/**/*.spec.ts` (4 files) | Modified | Minor type annotations where practical |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking type fixes | Low | `ng build` catches type errors; fix per file, not bulk |
| High error count in production | Med | Test overrides eliminate ~70%; remaining ~30 errors across 37 files is manageable |
| Pre-commit hook blocks progress | Med | `HUSKY=0` bypass available during fix phase |

## Rollback Plan

Revert `eslint.config.js` changes and/or use `git checkout -- frontend/src/` for individual files that break. The change is additiveΓÇöno schema or data migration involved.

## Dependencies

- None. ESLint, TypeScript, and Angular CLI already installed.

## Success Criteria

- [ ] `npx eslint .` exits with code 0 from `frontend/`
- [ ] `ng build` completes without errors
- [ ] All pre-existing Jest tests pass (`npx jest`)
