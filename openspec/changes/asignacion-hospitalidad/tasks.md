# Tasks: Asignación de Hospitalidad en Funciones de Reunión

## Fase 1: Base de Datos y Backend (Go)
- [x] 1.1 Crear migración `backend/migrations/023_add_hospitalidad_tipo_asignacion.sql`.
- [x] 1.2 Actualizar `backend/internal/services/asignacion_service.go` para validar que `HOSPITALIDAD` sea estrictamente por grupo (`grupo_id`).
- [x] 1.3 Actualizar `backend/internal/handlers/asignacion_handler.go` para manejar errores de asignación de grupo para `HOSPITALIDAD`.
- [x] 1.4 Escribir y ejecutar pruebas unitarias en `backend/internal/services/asignacion_service_test.go` y `backend/internal/handlers/asignacion_handler_test.go`.

## Fase 2: Frontend (Angular 21)
- [x] 2.1 Actualizar `AsignacionListComponent` en `frontend/src/app/features/asignaciones/asignacion-list.component.ts`:
  - Registrar nombre legible `'HOSPITALIDAD': 'Hospitalidad'` y prioridad en `getTiposList()`.
  - Usar método auxiliar `isGroupType()` para renderizar selector de grupo para `HOSPITALIDAD` y `ASEO_SALON`.
  - Ajustar `saveDiaAsignaciones()` para mapear `grupo_id` en `HOSPITALIDAD`.
- [x] 2.2 Actualizar `SemanaEditarComponent` en `frontend/src/app/features/asignaciones/semana-editar.component.ts` para soportar `HOSPITALIDAD` con selector de grupo.
- [x] 2.3 Actualizar y ejecutar pruebas unitarias Jest en `frontend/src/app/features/asignaciones/asignacion-list.component.spec.ts`.

## Fase 3: Verificación y Validación Final
- [x] 3.1 Ejecutar suite de tests y build de Backend (`go test ./internal/services ./internal/handlers` y `go build ./cmd/server`).
- [x] 3.2 Ejecutar tests unitarios de Frontend (`npm test -- asignacion-list` y `npx tsc --noEmit`).
