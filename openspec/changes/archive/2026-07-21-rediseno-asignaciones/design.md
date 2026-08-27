# Design: Rediseño Moderno de Asignaciones Semanales

## Technical Approach

Modernizar la interfaz de asignaciones semanales en Angular 21 integrando:
1. **Glassmorphism + Modern Dark Palette**: Fondos semitransparentes con desfoque, gradientes sutiles y bordes vivos (`#3b82f6`, `#8b5cf6`, `#10b981`).
2. **Iconografía `<re-icon>`**: Sustituir emojis/iconos planos por componentes `<re-icon>` en la barra superior, botones y tarjetas de asignación.
3. **Indicador de Día Actual**: Resaltar el día de hoy con `box-shadow` reluciente, gradiente suave de fondo y bordes redondeados `16px`.
4. **Badges Interactivas**: Mostrar cada asignación dentro de un chip con hover lift (`transform: translateY(-2px)`), sombra suave y distintivos según categoría.
5. **Modal Elevado**: Rediseñar `semana-editar.component.ts` con overlay oscuro difuminado (`backdrop-filter: blur(8px)`), encabezado destacado y botones primarios con micro-interacciones.

## Architecture Decisions

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Icon Component** | `<re-icon>` (Remix Icons Wrapper) | Mantiene coherencia visual con la barra lateral y resto del sistema de diseño. |
| **Grid Layout** | CSS Grid con `repeat(7, 1fr)` | Garantiza la estructura de calendario de 7 días responsiva. |
| **Themeing** | CSS Variables + HSL Colors | Soporte nativo para Dark/Light mode con transiciones suaves. |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/app/features/asignaciones/asignacion-list.component.ts` | Modify | Plantilla HTML modernizada y estilos SCSS mejorados |
| `frontend/src/app/features/asignaciones/semana-editar.component.ts` | Modify | Estilos de modal y selectores de asignación modernizados |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit Test | Renderizado de asignacion-list y semana-editar | `npm run test` (Jest) |
| Visual Check | Tarjetas, badges, hover effects, modal y día actual | Verificación visual en localhost:4200/asignaciones |
