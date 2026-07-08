# Delta for developer-tooling

## MODIFIED Requirements

### Requirement: Frontend Linting

The project SHALL configure ESLint (flat config) for TypeScript and SCSS files in `frontend/`. Production `.ts` files SHALL enforce `recommendedTypeChecked` rules. Test files (`.spec.ts`, `setup-jest.ts`) SHOULD relax `@typescript-eslint/no-unsafe-*` and `@typescript-eslint/no-explicit-any` via `overrides` to reduce false positives while keeping type-aware rules active.
(Previously: ESLint applied `recommendedTypeChecked` uniformly to all `.ts` files)

#### Scenario: Full frontend lint passes

- GIVEN production `.ts` files with no violations and test `.ts` files using relaxed rules
- WHEN `npx eslint .` is executed from `frontend/`
- THEN it exits with code 0 and produces no errors

#### Scenario: Lint flags unused import

- GIVEN a TypeScript file with an unused import
- WHEN `npx eslint .` is executed
- THEN it reports the unused import and exits with code 1

#### Scenario: Test file overrides suppress unsafe rules

- GIVEN a `.spec.ts` file with an `@typescript-eslint/no-unsafe-call` or `no-explicit-any` violation
- WHEN `npx eslint .` is executed
- THEN the violation is permitted (no error or warning from relaxed rules)

## ADDED Requirements

### Requirement: Production Code Lint Compliance

Production `.ts` files in `frontend/src/` SHALL be fixed file-by-file until `npx eslint .` exits with code 0. Each fix batch SHALL be verified with `npx eslint .` AND `ng build` — both MUST pass. Production code MUST NOT disable `recommendedTypeChecked` globally; per‑file suppressions MUST carry an inline justification comment.

#### Scenario: File-by-file fix verified

- GIVEN a set of production `.ts` files with lint errors
- WHEN each file is fixed and `npx eslint . && ng build` is run
- THEN both commands pass and the fix batch is complete

#### Scenario: Global suppression rejected

- GIVEN a developer proposes disabling `recommendedTypeChecked` for all production files
- WHEN the approach is evaluated against this requirement
- THEN it MUST be rejected; only per‑file suppressions with justification are allowed
