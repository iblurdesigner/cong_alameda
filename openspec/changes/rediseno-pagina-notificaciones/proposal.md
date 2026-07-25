# Proposal: Rediseño de la Página de Notificaciones y Asignaciones del Usuario

## Intent
Rediseñar la pantalla de `/notificaciones` para consolidar todas las tareas y asignaciones asignadas al usuario activo a lo largo de las diferentes secciones del sistema (Casas, Visitas, Asignaciones de Reunión) bajo el sistema de diseño Calescence Modern Minimalist.

## Scope
- Frontend: `notification-dashboard.component.ts` (Rediseño de tarjetas, pestañas de navegación por categoría: Todos, Asignaciones de Reunión, Visitas, Casas; badges de estado, acceso directo a la sección correspondiente).
- Servicios: Integración fluida con `NotificationService`, `AsignacionService`, y accesos directos por tipo de tarea.
