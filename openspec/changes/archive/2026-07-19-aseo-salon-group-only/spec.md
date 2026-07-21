# Spec: Asignaciones de ASEO_SALON solo por grupo

## Resumen

Agregar soporte de `grupo_id` en el backend para `asignacion_semanal` y modificar los modales del frontend para que ASEO_SALON solo permita seleccionar un grupo, no una persona.

## Requerimientos

### REQ-01: Soporte de grupo_id en backend

La tabla `asignacion_semanal` debe poder almacenar un grupo opcional (`grupo_id`) además del usuario opcional (`user_id`). Una asignación puede tener un usuario O un grupo, no ambos. El backend debe:

- Agregar columna `grupo_id` a la tabla
- Crear FK a la tabla `grupos`
- Permitir `user_id` nullable
- En las queries de lectura, hacer LEFT JOIN con `grupos` para traer el nombre del grupo

### REQ-02: Modal de asignación solo grupo para ASEO_SALON

En ambos modales de asignación (página `/asignaciones` y editor `/asignaciones/semana/:id`):

- Cuando el tipo de asignación es ASEO_SALON (`b10c74a7-ba4c-4a71-b639-1248aa404eb4`), mostrar **solo** el selector de grupo
- NO mostrar el selector de persona ni el texto "O seleccionar Persona"
- El botón guardar se habilita cuando se selecciona un grupo
- Para los demás tipos de asignación, el comportamiento sigue igual (selector de persona)

### REQ-03: Envío de grupo_id al crear/editar

Al guardar una asignación de ASEO_SALON:

- El frontend debe enviar `grupo_id` al backend
- El backend debe aceptar y persistir `grupo_id`
- En edición, si la asignación actual tiene `grupo_id`, se debe mostrar preseleccionado

### REQ-04: Compatibilidad con asignaciones existentes

Las asignaciones de ASEO_SALON existentes que tienen `user_id` (persona) se mantienen funcionales:

- Se renderizan correctamente en las vistas
- Se pueden editar (cambiar de persona a grupo o viceversa)
- Las queries existentes no se rompen

### REQ-05: Bulk creation compatible

El modal de creación masiva (Nueva Programación) ya maneja grupos para ASEO_SALON. Debe seguir funcionando, enviando `grupo_id` cuando corresponda.

### REQ-06: Backend enforcement of ASEO_SALON grupo-only

La regla de que ASEO_SALON solo puede asignarse por grupo (no por persona) DEBE ser aplicada en el backend (capa de servicio), no solo en el frontend. Esto convierte la regla en autoritativa del lado del servidor.

- Cuando `tipo_asignacion.nombre == 'ASEO_SALON'`, una asignación DEBE tener un `GrupoID` no nulo y NO DEBE tener un `UserID`. Esto aplica en **Create**, **Update** y **BulkCreate**.
- Si una petición envía `user_id` (o no envía `grupo_id`) para ASEO_SALON, el backend DEBE responder `400` con el error `aseo_salon_requires_grupo`.
- Para los demás tipos de asignación, el comportamiento actual se mantiene (UserID requerido, GrupoID opcional).

## No-alcance

- No se cambia el flujo de los demás tipos de asignación
- No se modifican los reportes PDF (ya muestran grupo correctamente)
- El refactor visual no relacionado de `asignacion-list.component.ts` (renombres de clases CSS, cambio de estilo de comentarios, compactación de HTML) queda FUERA DE ALCANCE de este cambio y se sigue por separado.
