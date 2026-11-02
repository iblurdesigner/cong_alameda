# Notificaciones de Asignaciones Specification

## Purpose

Sistema de notificaciones vinculadas a asignaciones internas de la congregación. CRUD completo para notificaciones de tipo asignación generadas automáticamente cuando se crea, actualiza o completa una asignación.

## ADDED Requirements

### Requirement: Notificación automática al crear asignación

Cuando un usuario crea una nueva asignación, el sistema DEBE generar automáticamente una notificación de tipo `ASIGNACION_CREADA` dirigida al usuario asignado.

- GIVEN una asignación válida con `user_id` asignado
- WHEN se ejecuta POST `/api/asignaciones` con datos válidos
- THEN se crea la asignación en la base de datos
- AND se crea una notificación con tipo `ASIGNACION_CREADA` cuyo destinatario es el `user_id` asignado
- AND el mensaje contiene: tipo de asignación, día de la semana, fecha de la semana

#### Scenario: Notificación criada exitosamente

- GIVEN asignación para "Micrófono" el día domingo
- WHEN usuario crea la asignación via API
- THEN notificación creada con mensaje "Se te ha asignado: Micrófono para el domingo"

#### Scenario: Asignación sin usuario no genera notificación

- GIVEN asignación sin `user_id` (pendiente de asignar)
- WHEN se crea la asignación
- THEN no se genera ninguna notificación

### Requirement: Notificación automática al actualizar asignación

Cuando una asignación existente tiene su `user_id` modificado, el sistema DEBE generar una notificación de tipo `ASIGNACION_ACTUALIZADA`.

- GIVEN una asignación existente con `user_id` anterior "A"
- WHEN se ejecuta PUT `/api/asignaciones/:id` con nuevo `user_id` "B"
- THEN la asignación se actualiza con el nuevo usuario
- AND se genera notificación de tipo `ASIGNACION_ACTUALIZADA` para el nuevo usuario "B"
- AND se genera notificación de tipo `ASIGNACION_ELIMINADA` para el usuario anterior "A" (si existía)

#### Scenario: Cambio de usuario genera notificación al nuevo destinatario

- GIVEN asignación existente asignada a usuario "A"
- WHEN se reasigna a usuario "B"
- THEN usuario "B" recibe notificación de asignación actualizada
- AND usuario "A" recibe notificación de asignación removida

### Requirement: Notificación automática al completar asignación

Cuando una asignación se marca como completada (observaciones registradas), el sistema DEBE generar una notificación de tipo `ASIGNACION_COMPLETADA`.

- GIVEN una asignación con `user_id` asignado
- WHEN se actualiza la asignación con observaciones (campo no vacío)
- THEN se genera notificación de tipo `ASIGNACION_COMPLETADA`
- AND el mensaje incluye: tipo de asignación, fecha de completación

### Requirement: Identificación de asignación en notificación

Toda notificación de tipo asignación DEBE incluir referencia a la asignación origen para navegación desde la UI.

- GIVEN cualquier notificación de tipo `ASIGNACION_CREADA`, `ASIGNACION_ACTUALIZADA`, o `ASIGNACION_COMPLETADA`
- WHEN se consulta la notificación
- THEN el campo `referencia_id` contiene el UUID de la asignación asociada
- AND el campo `referencia_tipo` contiene "ASIGNACION"

## MODIFIED Requirements

(None — este es un nuevo capability sin requisitos existentes)

## REMOVED Requirements

(None)

## Data Model

| Field | Type | Required | Description |
|-------|------|----------|--------------|
| id | UUID | Yes | Primary key |
| tipo | NotificacionTipo | Yes | Enum: ASIGNACION_CREADA, ASIGNACION_ACTUALIZADA, ASIGNACION_COMPLETADA |
| referencia_id | UUID | Yes | ID de la asignación asociada |
| referencia_tipo | string | Yes | "ASIGNACION" |
| destinatarios | UUID[] | Yes | Lista de usuarios que reciben la notificación |
| mensaje | string | Yes | Texto descriptivo de la notificación |
| leida | boolean | Yes | Default false |
| created_at | timestamp | Yes | Fecha de creación |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/notificaciones/asignacion | Crear notificación manual de asignación (opcional) |
| GET | /api/notificaciones?tipo=ASIGNACION_* | Listar notificaciones de asignaciones filtradas |