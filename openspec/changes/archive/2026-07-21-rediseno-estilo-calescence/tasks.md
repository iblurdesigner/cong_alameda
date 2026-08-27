# Tasks: Rediseño Global al Estilo Calescence

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-450 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Rediseño de Layout Global, Dashboard y Tema Calescence | Single PR | `npm --prefix frontend run build` | Visual check on http://localhost:4200/dashboard | `frontend/src/` |

## Phase 1: Global Theme & Style Tokens

- [x] 1.1 Actualizar `styles.scss` con los tokens Calescence (`#f3f4f8` canvas background, `#ffffff` surface, `#121316` dark card, `#c4f82a` lime accent, `#2563eb` electric blue, `border-radius: 24px`).
- [x] 1.2 Importar la fuente `Plus Jakarta Sans` / `Inter` y mejorar las reglas de `.material-symbols-outlined`.

## Phase 2: Floating Layout & Sidebar

- [x] 2.1 Refactorizar el sidebar en `app.component.ts` como una cápsula flotante vertical (`border-radius: 28px`) con íconos redondeados e indicador activo.
- [x] 2.2 Refactorizar el header superior en `app.component.ts` con barra de búsqueda pill, botón de notificaciones, toggle de tema y menú de perfil.

## Phase 3: Dashboard Redesign

- [x] 3.1 Rediseñar `dashboard.component.ts` con tarjetas de estadísticas estilo Calescence (combinación de tarjetas blancas y tarjetas oscuras de alto contraste con acentos neón).
- [x] 3.2 Crear la sección de Acciones Rápidas con tarjetas modernas e interactividad visual.

## Phase 4: Integration & Verification

- [x] 4.1 Actualizar la página de Asignaciones para encajar con el nuevo esquema de colores e interactividad.
- [x] 4.2 Ejecutar `npm run build` para asegurar compilación limpia sin errores de Angular.
