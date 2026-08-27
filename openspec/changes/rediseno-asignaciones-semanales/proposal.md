# Proposal: Unificación de Asignaciones Semanales (Sin Redundancia Entre Semana / Fin de Semana)

## Intent
Rediseñar la gestión y visualización de asignaciones semanales para que las funciones (Acomodadores, Micrófonos, Plataforma, Parqueadero, Aseo, etc.) se asignen **por semana completa** en lugar de duplicar listas separadas para Miércoles y Sábado.

## Scope
- Frontend: `asignacion-list.component.ts` (tabla principal de asignaciones y vista previa del documento imprimible PDF).
- Backend / Modelo: Adaptación de la asignación semanal unificada.
