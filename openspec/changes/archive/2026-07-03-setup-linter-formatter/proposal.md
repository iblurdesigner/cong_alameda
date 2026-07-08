# Proposal: Setup Linter & Formatter

## Intent

Standardize code quality tools across the project. Currently, there are no linters or formatters configured ΓÇö Go code is unchecked, and frontend code has no ESLint setup. This leads to inconsistent style, avoidable bugs, and review overhead.

## Scope

### In Scope
- `golangci-lint` config for Go backend (`.golangci.yml`)
- `gofumpt` formatter config for Go backend
- ESLint config for frontend TypeScript + SCSS files
- Angular CLI format config for frontend
- Husky + lint-staged for pre-commit hooks (both backend & frontend)
- `Taskfile.yml` with lint/format commands
- Updated `package.json` with lint scripts

### Out of Scope
- CI/CD integration (deferred)
- Prettier (user chose ESLint-only for frontend)
- Code style migration / bulk reformatting

## Capabilities

> Pure tooling/config change ΓÇö no spec-level behavior changes.

### New Capabilities
None (tooling/config change ΓÇö no spec-level behavior changes)

### Modified Capabilities
None (tooling/config change ΓÇö no spec-level behavior changes)

## Approach

1. **Backend**: Create `.golangci.yml` with Fiber/Go 1.21-friendly presets (govet, errcheck, staticcheck, gosimple). Enable `gofumpt` as the formatter.
2. **Frontend**: Create `eslint.config.js` (flat config) for TypeScript + SCSS. Configure Angular CLI format as fallback.
3. **Pre-commit**: Install Husky + lint-staged. Wire `golangci-lint run` for `*.go` files, `eslint --fix` for `*.ts`/`*.scss` files.
4. **Scripts**: Add `Taskfile.yml` at root with `lint`/`format` targets. Add `lint` scripts to frontend `package.json`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/.golangci.yml` | New | golangci-lint configuration |
| `backend/.gofumpt.yml` | New | gofumpt configuration |
| `frontend/eslint.config.js` | New | ESLint flat config (TS + SCSS) |
| `.husky/pre-commit` | New | Pre-commit hook via Husky |
| `.husky/.gitignore` | New | Husky gitignore |
| `Taskfile.yml` | New | Root-level task definitions |
| `frontend/package.json` | Modified | Add lint scripts, eslint dep |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Linter flags existing code | High | Use `issues: new-from-pattern` or `--new` for gradual adoption |
| Husky hooks block git flow | Low | Offer `HUSKY=0` env var to skip hooks |

## Rollback Plan

Delete all new config files (`.golangci.yml`, `eslint.config.js`, `.husky/`). Revert `package.json` changes. Uninstall linter packages via `npm uninstall`.

## Dependencies

- `golangci-lint` v1.55+ (install via `go install` or scoop/choco)
- `gofumpt` (install via `go install mvdan.cc/gofumpt@latest`)
- ESLint + TypeScript ESLint packages (npm, committed to `package.json`)
- Husky v9 (npm, committed to `package.json`)

## Success Criteria

- [ ] `gofumpt -d` returns no diffs on entire Go codebase
- [ ] `golangci-lint run` passes with zero issues
- [ ] `cd frontend && npx eslint .` passes with zero issues
- [ ] Pre-commit hook runs lint-staged on staged `.go`, `.ts`, `.scss` files
- [ ] `ng lint` runs without errors
- [ ] `Taskfile.yml` targets `lint` and `format` execute successfully
