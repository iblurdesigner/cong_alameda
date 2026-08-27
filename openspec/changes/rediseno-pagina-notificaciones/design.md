# Design: Rediseño de la Pantalla de Notificaciones

## Sistema Visual Calescence
- **Pills de Navegación por Categoría**:
  - `Todos` (Icono: `dashboard`)
  - `Asignaciones de Reunión` (Icono: `assignment`, Color: `#8b5cf6`)
  - `Visitas` (Icono: `event_available`, Color: `#3b82f6`)
  - `Casas` (Icono: `home`, Color: `#22c55e`)
  - `Alertas / Requiere Visita` (Icono: `warning`, Color: `#f59e0b`)

- **Diseño de Tarjetas**:
  - `notif-card` con bordes redondeados `var(--radius-lg)`, sombra sutil, ícono con fondo translúcido acorde a la categoría.
  - Botón de navegación contextual (`routerLink`) según el tipo de notificación/asignación.

- **Integración de Asignaciones de Reunión**:
  - Mapear tipos de backend (`ASIGNACION_CREADA`, `ASIGNACION_ACTUALIZADA`, `ASIGNACION_COMPLETADA`, `VISITA_PROGRAMADA`, `CASA_REGISTRADA`, `PERSONA_REQUIERE_VISITA`) a enlaces directos y categorías claras.
