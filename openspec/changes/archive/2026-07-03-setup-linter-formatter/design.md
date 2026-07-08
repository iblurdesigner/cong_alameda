# Design: Setup Linter & Formatter

## Technical Approach

Pure tooling/config change — zero source code modifications. Introduce golangci-lint + gofumpt for Go, ESLint + stylelint for frontend, wired through Husky + lint-staged for pre-commit gating. Gradual adoption via `issues.new-from-pattern` and `--allow-empty-input` to avoid flagging existing code.

## Architecture Decisions

| Decision | Options | Tradeoffs | Verdict |
|---|---|---|---|
| **Go linter engine** | golangci-lint vs staticcheck standalone | golangci-lint wraps multiple linters (errcheck, gosimple, staticcheck, govet) in one binary — less tooling overhead | ✅ **golangci-lint v1.55+** |
| **Go formatter** | gofumpt vs gofmt | gofumpt is stricter superset of gofmt — enforces import grouping, blank-line discipline. Same cost, higher consistency | ✅ **gofumpt** |
| **Frontend TS linter** | ESLint flat config vs eslintrc | Angular 21 ships with ESLint v9 — flat config (`eslint.config.js`) is the modern standard; eslintrc is deprecated | ✅ **ESLint flat config** |
| **SCSS linting** | stylelint + ESLint vs skip SCSS | ESLint cannot parse SCSS natively. stylelint handles `.scss` rules (nested syntax, selector patterns, color-hex length) | ✅ **stylelint** (separate tool) |
| **Pre-commit hooks** | Husky v9 + lint-staged vs Lefthook | Husky + lint-staged is mature ecosystem, standard for Angular/JS projects; Lefthook is Go-native but less common in this stack | ✅ **Husky v9 + lint-staged** |
| **Existing code shield** | `issues.new-from-pattern: ''` vs `--new` flag | `issues.new-from-pattern` is persistent (config-driven), `--new` is CLI-only and requires detecting changed files | ✅ **`issues.new-from-pattern: ''`** |
| **Task runner** | Taskfile.yml vs npm scripts | Taskfile runs cross-language tasks from root; npm scripts only work inside `frontend/`. Already no Taskfile exists — clean slate | ✅ **Taskfile.yml** |
| **Angular format** | `eslint --fix` vs `ng format` | Angular 21 removed `ng format`. `eslint --fix` handles both TS and SCSS via respective plugins | ✅ **`eslint --fix` + `stylelint --fix`** |

## Data Flow

```
Git commit
  └→ Husky pre-commit hook
      └→ lint-staged
          ├── lint-staged: *.go → golangci-lint run (new-from-pattern)
          ├── lint-staged: *.ts  → eslint --fix
          └── lint-staged: *.scss → stylelint --fix
              ↓
          All pass → commit proceeds
          Any fail → commit aborted with error
```

```
task lint
  ├── cd backend && golangci-lint run ./...
  └── cd frontend && eslint . && stylelint "src/**/*.scss"

task format
  ├── cd backend && gofumpt -w .
  └── cd frontend && eslint --fix . && stylelint --fix "src/**/*.scss"
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/.golangci.yml` | Create | Linter config: errcheck, gosimple, govet, staticcheck, ineffassign, gofumpt. `issues.new-from-pattern: ''` for gradual adoption |
| `Taskfile.yml` | Create | Root tasks: `lint`, `format`, `lint:check` — delegates to backend/frontend tools |
| `frontend/eslint.config.js` | Create | ESLint flat config: TypeScript (typescript-eslint/strict-type-checked) + Angular (@angular-eslint/recommended) |
| `frontend/.stylelintrc.json` | Create | SCSS lint config: extends stylelint-config-standard-scss |
| `.husky/pre-commit` | Create | Husky hook: runs `npx lint-staged` |
| `.husky/.gitignore` | Create | Ignores `_/` (Husky internal dir) |
| `frontend/.lintstagedrc.json` | Create | lint-staged config: map file patterns to tool commands |
| `frontend/package.json` | Modify | Add devDeps (eslint, typescript-eslint, angular-eslint, stylelint, husky, lint-staged). Add `lint`, `lint:fix`, `format` scripts |
| `.gitignore` | Modify | Add `.husky/_` to global gitignore |

## Interfaces / Contracts

**golangci-lint key settings** (`.golangci.yml`):
```yaml
linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - gofumpt
issues:
  new-from-pattern: ""
  exclude-dirs:
    - node_modules
```

**ESLint flat config key structure**:
```js
// @angular-eslint recommended rules + typescript-eslint strict
// TS config for .ts files, empty config for .html (no template lint yet)
```

**lint-staged mapping**:
```json
{
  "*.go": "golangci-lint run",
  "*.ts": "eslint --fix",
  "*.scss": "stylelint --fix"
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | Lint passes on clean code | Run `task lint` — expect exit 0 on unchanged code (new-from-pattern = no new issues) |
| Integration | Formatter idempotent | Run `task format` twice — second run produces no diffs |
| Manual | Pre-commit hook | Stage a `.go` file with an errcheck violation, try `git commit` — expect block |
| Manual | Safety valve | `HUSKY=0 git commit` — expect bypass |

## Migration / Rollout

**Gradual adoption only**. `issues.new-from-pattern: ''` in `.golangci.yml` makes golangci-lint ignore all existing code — it only flags lines introduced in new commits (diff against HEAD). Existing code will NOT be blocked. Stylelint is the same: only new `.scss` files are checked. This is the zero-friction path for existing projects.

If a developer wants to fix all existing issues, they can run `golangci-lint run --no-new` or `stylelint --fix "src/**/*.scss"` manually.

## Open Questions

- [ ] **SCSS scope**: Should stylelint only check new/changed `.scss` files, or all `.scss`? The spec says "all .ts and .scss files" but gradual adoption suggests new-only is safer.
- [ ] **Angular HTML templates**: Should ESLint also lint `.html` templates? The spec doesn't mention it — defer to a future change.
