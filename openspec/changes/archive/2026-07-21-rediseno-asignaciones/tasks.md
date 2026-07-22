# Tasks: Rediseño Moderno de Asignaciones Semanales

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150-250 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Rediseño visual de Asignaciones (List + Modal) | Single PR | `npm --prefix frontend run build` | Visual verify on http://localhost:4200/asignaciones | `frontend/src/app/features/asignaciones/` |

## Phase 1: Foundation & Styling Tokens

- [x] 1.1 Definir variables CSS y tokens de diseño en `asignacion-list.component.ts` (glows, sombras elevadas, degradados suaves, borders redondeados de 16px).

## Phase 2: Refactor de Plantilla HTML & Componentes

- [x] 2.1 Actualizar la barra superior y los botones principales ("Nueva Programación", "Exportar PDF") usando iconos e interacciones hover.
- [x] 2.2 Reestructurar la grilla de días del calendario con tarjetas estilizadas y resalte distintivo para el día actual.
- [x] 2.3 Transformar las asignaciones diarias en badges/chips interactivos con identificación visual por categoría/grupo.
- [x] 2.4 Actualizar el modal de edición/creación en `semana-editar.component.ts` con backdrop-blur, encabezados elegantes e iconografía.

## Phase 3: Testing & Verification

- [x] 3.1 Ejecutar prueba de compilación de Angular (`npm run build`) para garantizar que la lógica de Signals y componentes compila sin errores.
- [x] 3.2 Verificar visualmente la renderización en navegador.
