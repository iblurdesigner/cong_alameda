# Propuesta: Asignaciones de ASEO_SALON solo por grupo

## Problema

En la página `/asignaciones` y en el editor de semana (`/asignaciones/semana/:id`), al asignar el tipo "Aseo del Salón" (ASEO_SALON), el modal muestra tanto el selector de grupo como el de persona, y además se requiere seleccionar una persona. Sin embargo, la asignación de aseo debería hacerse exclusivamente por grupo — no por persona.

Actualmente:
- El backend no soporta `grupo_id` en la tabla `asignacion_semanal` ni en los endpoints
- El modal de asignación muestra grupo O persona, pero permite/requiere ambos
- El `saveAsignacion()` del componente lista no envía `grupo_id` al backend

## Solución propuesta

### Backend

1. **Migración**: Nueva migración que agregue `grupo_id` a `asignacion_semanal` con FK a `grupos`
2. **Modelo**: Agregar `GrupoID *uuid.UUID` nullable a `AsignacionSemanal`, y `Grupo *Grupo` a `AsignacionDetail`
3. **Repositorio**:
   - `Create`: Insertar también `grupo_id`
   - `GetBySemana`/`GetBySemanaAndDia`: LEFT JOIN con `grupos`
   - `Update`: Actualizar también `grupo_id`
4. **Handler**:
   - `Create`: Aceptar `grupo_id` opcional
   - `BulkCreate`: Aceptar `grupo_id` opcional
   - `Update`: Aceptar `grupo_id` opcional

### Frontend

1. **`asignacion-list.component.ts`** (página `/asignaciones`):
   - Modal: para ASEO_SALON, ocultar completamente el selector de persona
   - `saveAsignacion()`: enviar `grupo_id` al backend cuando se selecciona grupo
   
2. **`semana-editar.component.ts`** (página `/asignaciones/semana/:id`):
   - Modal: para ASEO_SALON, ocultar completamente el selector de persona

3. **`asignacion.service.ts`**: Ya tiene `grupo_id` en las interfaces y métodos — el backend es el que no lo soporta aún. Una vez que el backend lo procese, funciona.

### Asignaciones existentes

Las asignaciones de ASEO_SALON que ya tienen persona asignada se mantienen intactas. El modelo ahora soportará tanto `user_id` como `grupo_id`, por lo que los registros existentes siguen funcionando.

## Criterios de éxito

- En el modal de asignación de ASEO_SALON, solo se muestra el selector de grupo
- Al guardar una asignación de ASEO_SALON con grupo, se persiste correctamente en BD
- Las asignaciones existentes con persona se muestran correctamente
- El resto de tipos de asignación siguen funcionando con persona como antes
