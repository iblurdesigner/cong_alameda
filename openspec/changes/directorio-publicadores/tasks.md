# Tasks: Directorio de Publicadores de la Congregación Alameda

## Fase 1: Base de Datos y Backend (Go)
- [x] 1.1 Crear migración `backend/migrations/022_publicadores.sql` con la tabla `publicadores` e índices.
- [x] 1.2 Implementar modelo `backend/internal/models/publicador.go` y DTOs de request/response.
- [x] 1.3 Implementar repositorio `backend/internal/repositories/publicador_repo.go` con tests unitarios.
- [x] 1.4 Implementar servicio `backend/internal/services/publicador_service.go` con tests unitarios.
- [x] 1.5 Implementar handler `backend/internal/handlers/publicador_handler.go` y registrar rutas en el servidor.
- [x] 1.6 Ejecutar y validar tests del backend en Go.

## Fase 2: Frontend (Angular 21)
- [x] 2.1 Crear modelo y servicio `PublicadorService` en `frontend/src/app/core/services/publicador.service.ts`.
- [x] 2.2 Crear componente de administración `PublicadoresListComponent` en `frontend/src/app/features/admin/publicadores/publicadores-list.component.ts`.
- [x] 2.3 Implementar listado, búsqueda reactiva por filtros, y vista de tarjetas/tabla con acciones rápidas (WhatsApp, llamada, editar, baja).
- [x] 2.4 Implementar modal de formulario para creación y edición de publicador con datos de contacto, emergencia y observaciones.
- [x] 2.5 Configurar rutas en `frontend/src/app/app.routes.ts` y enlaces en la barra de navegación/menú de administración.
- [x] 2.6 Adaptar estilos para modo claro y modo oscuro (`[data-theme="dark"]`).
- [x] 2.7 Crear y ejecutar pruebas unitarias Jest en frontend (`publicadores-list.component.spec.ts` y `publicador.service.spec.ts`).
