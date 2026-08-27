# Feature Spec: Rediseño de Notificaciones y Tareas Asignadas

## Requirements
1. **Header & General Status**: Display a Calescence header with total unread items, action "Marcar todas como leídas", and status overview.
2. **Category Tabs (Pills/Cards)**:
   - **Todos**: Feed completo de notificaciones y asignaciones.
   - **Asignaciones de Reunión** (🎤): Asignaciones semanales de reunión (Lector, Presidente, Micrófonos, Plataforma, Acomodador, Aseo).
   - **Visitas** (📅): Visitas pastorales y de territorio asignadas o programadas.
   - **Casas** (🏠): Casas del grupo/zona asignadas que requieren seguimiento.
3. **Card Structure**:
   - Icon badge styled according to category.
   - Title, descriptive message, date/time formatted nicely.
   - Status tag ("Sin leer", "Nueva", "Pendiente").
   - Quick action button ("Ir a Asignaciones", "Ver Visita", "Ver Casa") taking the user directly to the relevant view.
4. **Empty State**: Friendly empty state illustration and message per selected category.
