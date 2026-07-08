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

The project SHALL configure ESLint (flat config) for TypeScript and SCSS files in `frontend/`. The linter SHALL run on all `.ts` and `.scss` files.

#### Scenario: Full frontend lint passes

- GIVEN a TypeScript file with no lint violations
- WHEN `npx eslint .` is executed from `frontend/`
- THEN it exits with code 0 and produces no errors

#### Scenario: Lint flags unused import

- GIVEN a TypeScript file with an unused import
- WHEN `npx eslint .` is executed
- THEN it reports the unused import and exits with code 1

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
