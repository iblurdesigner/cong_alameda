# Tasks: Setup Linter & Formatter

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~180–220 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Backend Tooling — golangci-lint + gofumpt

- [x] 1.1 Create `backend/.golangci.yml` — enable errcheck, gosimple, govet, ineffassign, staticcheck, gofumpt; set `issues.new-from-rev: HEAD` for gradual adoption (deviation: used `new-from-rev` instead of `new-from-pattern`; see notes)
- [ ] 1.2 Verify: `golangci-lint run ./...` exits 0 from `backend/` (requires golangci-lint installed — skipped)

## Phase 2: Frontend Tooling — ESLint + stylelint

- [x] 2.1 Create `frontend/eslint.config.js` — TypeScript strict + Angular recommended rules (flat config)
- [x] 2.2 Create `frontend/.stylelintrc.json` — extend `stylelint-config-standard-scss`
- [x] 2.3 Update `frontend/package.json` — add devDeps (eslint, typescript-eslint, angular-eslint, stylelint, stylelint-config-standard-scss, husky, lint-staged) and scripts (`lint`, `lint:fix`, `format`)
- [ ] 2.4 Verify: `eslint . && stylelint "src/**/*.scss"` exits 0 from `frontend/` (requires npm install — skipped)

## Phase 3: Pre-commit Hooks — Husky + lint-staged

- [x] 3.1 Initialize Husky v9 — created `.husky/` directory structure manually (no `npx husky init` executed — config-only)
- [x] 3.2 Create `.husky/pre-commit` — runs `npx --prefix frontend lint-staged` (usa npm de frontend, pero lint-staged corre desde root)
- [x] 3.3 Create `.husky/.gitignore` — ignore `_/`
- [x] 3.4 Create root `.lintstagedrc.json` — patrones `backend/**/*.go` → `gofumpt -l -w` + `golangci-lint run`, `frontend/**/*.ts` → `eslint --fix`, `frontend/**/*.scss` → `stylelint --fix`
- [x] 3.5 Delete `frontend/.lintstagedrc.json` — migrado a root para que cubra archivos Go del backend
- [x] 3.6 Update `.gitignore` — add `.husky/_` entry

## Phase 4: Task Runner — Taskfile.yml

- [x] 4.1 Create root `Taskfile.yml` — `lint`, `format`, `lint-backend`, `lint-frontend`, `format-backend`, `format-frontend` tasks
- [ ] 4.2 Verify: `task lint` and `task format` execute successfully from project root (requires go-task installed — skipped)

## Phase 5: Verification

- [ ] 5.1 Run `task lint` — confirm exit 0 on clean code (requires tools installed — skipped)
- [ ] 5.2 Run `task format` twice — second run produces zero diffs (requires tools installed — skipped)
- [ ] 5.3 Manual: stage `.go` file with errcheck violation, `git commit` blocks with error (requires husky + npm i — skipped)
- [ ] 5.4 Manual: `HUSKY=0 git commit` bypasses hooks (requires husky + npm i — skipped)
