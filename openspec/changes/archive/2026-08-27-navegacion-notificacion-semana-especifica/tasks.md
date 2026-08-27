# Tasks: Navegación de Notificación a Semana Específica

- [x] 1. Backend: Actualizar `GetByUserID` en `notificacion_repo.go` para seleccionar `referencia_id` y `referencia_tipo`.
- [x] 2. Backend: Actualizar `notifyAsignacion` en `asignacion_service.go` para llamar a `CreateConReferencia` pasando `semanaID` y `"ASIGNACION"`.
- [x] 3. Frontend: Actualizar `Notificacion` interface en `notification.service.ts` para incluir `referencia_id` y `referencia_tipo`.
- [x] 4. Frontend: Actualizar `goToAction` en `notification-dashboard.component.ts` para navegar pasando `queryParams: { semana_id }`.
- [x] 5. Frontend: Actualizar `AsignacionListComponent` en `asignacion-list.component.ts` para escuchar `queryParams` de `ActivatedRoute` y seleccionar la semana.
- [x] 6. Verificación: Ejecutar pruebas unitarias de Go y `ng build` para confirmar compilación limpia.
