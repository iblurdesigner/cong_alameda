# Developer Tooling Specification

## Purpose

Define lint, format, and pre-commit quality standards for the project. This spec governs tooling configuration and developer workflow, not application behavior.

## Requirements

### Requirement: Backend Linting

The project SHALL configure `golangci-lint` with Fiber/Go 1.21-friendly presets. The linter SHALL run on all `.go` files in `backend/`.

#### Scenario: Full backend lint passes

- GIVEN a Go file with no lint violations
- WHEN `golangci-lint run ./...` is executed from `backend/`
- THEN it exits with code 0 and produces no errors

#### Scenario: Lint catches common errors

- GIVEN a Go file with an unchecked error return value
- WHEN `golangci-lint run` is executed
- THEN `errcheck` reports the unhandled error and exits with code 1

### Requirement: Backend Formatting

The project SHALL use `gofumpt` for Go code formatting. All `.go` files MUST comply with gofumpt style.

#### Scenario: Formatted code passes

- GIVEN a Go file formatted with gofumpt
- WHEN `gofumpt -d .` is executed from `backend/`
- THEN it produces no diffs and exits with code 0

#### Scenario: Unformatted code is detected

- GIVEN a Go file with non-standard imports grouping
- WHEN `gofumpt -d .` is executed
- THEN it outputs a diff showing the expected formatting

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

### Requirement: Pre-commit Quality Gate

The project SHALL use Husky v9 with lint-staged to enforce lint and format checks before every commit. Staged `.go` files SHALL trigger golangci-lint; staged `.ts` and `.scss` files SHALL trigger ESLint.

#### Scenario: Valid commit succeeds

- GIVEN staged `.go` and `.ts` files with no violations
- WHEN `git commit` is executed
- THEN lint-staged runs both linters, both pass, and the commit completes

#### Scenario: Invalid commit is blocked

- GIVEN a staged `.ts` file with a lint violation
- WHEN `git commit` is executed
- THEN lint-staged runs ESLint, it fails, and the commit is aborted with error output

### Requirement: Task Automation

The project SHALL provide a root-level `Taskfile.yml` with `lint` and `format` targets. The `lint` target SHALL run both backend and frontend linters; the `format` target SHALL run both formatters.

#### Scenario: Lint target runs both stacks

- GIVEN the Taskfile.yml is configured
- WHEN `task lint` is executed from the project root
- THEN it invokes golangci-lint for backend and ESLint for frontend sequentially

#### Scenario: Format target runs both formatters

- GIVEN the Taskfile.yml is configured
- WHEN `task format` is executed from the project root
- THEN it invokes gofumpt for backend and Angular CLI format for frontend

### Requirement: Safety Valve

Developers SHALL be able to bypass pre-commit hooks when necessary using the `HUSKY=0` environment variable. Bypassing MUST NOT silence linters in CI.

#### Scenario: Intentional bypass

- GIVEN a developer needs to commit despite lint failures
- WHEN `HUSKY=0 git commit` is executed
- THEN the commit proceeds without pre-commit checks
