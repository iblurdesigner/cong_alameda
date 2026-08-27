# Design: Rediseño Global al Estilo Calescence

## Technical Approach

Implementar el sistema de diseño estilo Calescence mediante:
1. **Tokens CSS (`styles.scss`)**:
   - Fondo canvas: `#f3f4f8` (Modo claro) / `#0d0f14` (Modo oscuro).
   - Superficie tarjeta clara: `#ffffff` con `border-radius: 24px` y `box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.04)`.
   - Tarjeta contraste oscura: `#121316` con texto blanco.
   - Colores de acento: Verde Lima Neón (`#c4f82a`) y Azul Eléctrico (`#2563eb`).
2. **Layout Flotante (`app.component.ts`)**:
   - Sidebar vertical separado del borde de la pantalla con margen de `16px` y radio `28px`.
   - Header horizontal flotante tipo cápsula con barra de búsqueda, perfil y notificaciones en cápsulas.
3. **Dashboard Rediseñado (`dashboard.component.ts`)**:
   - Tarjetas de métricas estilizadas con tipografía grande (`2.25rem`), badge de tendencia verde lima neón (`#c4f82a`) o azul.
   - Sección de Acciones Rápidas con tarjetas flotantes e íconos destacados.
4. **Vista de Asignaciones (`asignacion-list.component.ts`)**:
   - Tarjetas del calendario integradas al tema claro/oscuro de Calescence con resalte de hoy en azul/lima.

## Architecture Decisions

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Theme System** | CSS Variables en `:root` y `[data-theme="dark"]` | Permite alternar entre la versión clara estilo Calescence y la versión oscura manteniendo tokens idénticos. |
| **Card Geometry** | `border-radius: 24px` | Reproduce fielmente la geometría redondeada de la referencia visual. |
| **Pill Controls** | Layout flexbox con `border-radius: 9999px` | Da el aspecto característico de cápsulas a botones, navegadores e indicadores. |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/styles.scss` | Modify | Actualización de tokens de color, sombras, border-radius e íconos globales |
| `frontend/src/app/app.component.ts` | Modify | Rediseño de Sidebar flotante y Header superior en estilo cápsula |
| `frontend/src/app/features/dashboard/dashboard.component.ts` | Modify | Rediseño completo del Dashboard con tarjetas Calescence |
| `frontend/src/app/features/asignaciones/asignacion-list.component.ts` | Modify | Ajuste de colores y radios de tarjetas de asignación |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit Build | Compilación de Angular | `npm run build` |
| Visual Check | Navegación, Sidebar, Dashboard, Asignaciones | Verificación en localhost:4200 |
