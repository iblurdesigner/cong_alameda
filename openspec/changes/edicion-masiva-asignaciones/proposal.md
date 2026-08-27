# Proposal: Edición Masiva de Asignaciones y Nuevos Roles

## Intent
Permitir editar todas las asignaciones de una tarjeta diaria en un solo modal/pantalla, y desglosar los roles de micrófonos (Izquierda/Derecha) y acomodadores (Acomodador 1/Acomodador 2).

## Scope
- Base de Datos: Migración SQL para insertar/actualizar tipos de asignación (`MICROFONO_IZQ`, `MICROFONO_DER`, `ACOMODADOR_1`, `ACOMODADOR_2`).
- Frontend: Actualizar `asignacion-list.component.ts` para soportar la edición masiva por día y mostrar los nuevos slots en las tarjetas diarias.

## Approach
- Crear migración SQL `006_nuevos_tipos_asignacion.sql`.
- Actualizar `asignacion-list.component.ts` para renderizar el botón de edición completa por día y procesar la asignación múltiple.
