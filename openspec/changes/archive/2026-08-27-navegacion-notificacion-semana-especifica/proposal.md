# Proposal: Navegación de Notificación a la Semana Específica

## Intent
Cuando el usuario presiona el botón "Ver →" en una notificación de asignación semanal dentro de `/notificaciones`, la aplicación debe navegar a `/asignaciones` seleccionando y desplegando automáticamente la semana exacta a la cual corresponde la asignación (ej. *Semana del 20 al 26 de Julio 2026*), en lugar de la semana por defecto o actual.

## Scope
1. **Backend**:
   - Incluir `referencia_id` y `referencia_tipo` en la consulta `GetByUserID` del `NotificacionRepository`.
   - Garantizar que al crear o actualizar una asignación en `AsignacionService`, la notificación se guarde con `ReferenciaID` = `semanaID` y `ReferenciaTipo` = `ASIGNACION`.
2. **Frontend (`notification.service.ts`)**:
   - Agregar `referencia_id` y `referencia_tipo` al modelo `Notificacion` en TypeScript.
3. **Frontend (`notification-dashboard.component.ts`)**:
   - Actualizar la acción `goToAction(notif)` para que cuando `referencia_tipo === 'ASIGNACION'` (o el mensaje/tipo sea de asignación), navegue a `/asignaciones` pasando el query param `semana_id`.
4. **Frontend (`asignacion-list.component.ts`)**:
   - Escuchar `ActivatedRoute.queryParams` para tomar `semana_id` de la URL, cargarla y seleccionarla automáticamente.

## Approach
- Retener la compatibilidad en `AsignacionService` al poblar `ReferenciaID` = `semanaID` y `ReferenciaTipo` = `"ASIGNACION"`.
- En Angular, usar `router.navigate(['/asignaciones'], { queryParams: { semana_id: ... } })`.
- En `AsignacionListComponent`, al inicializar o recibir cambio en `queryParams`, establecer `this.selectedSemanaId = semana_id` y ejecutar `loadSemana()`.
