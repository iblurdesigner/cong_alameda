# Propuesta: Refactor Visual de `asignacion-list.component.ts`

## Identificador del cambio
`refactor-visual-asignacion-list`

## Intención
Realizar un refactor **puramente cosmético/formativo** del componente
`frontend/src/app/features/asignaciones/asignacion-list.component.ts` para
homogeneizar su presentación con el resto del codebase (estilo de comentarios
HTML, formato de plantilla y consistencia de clases CSS), **sin alterar ninguna
lógica de negocio ni comportamiento**.

## Contexto
El archivo proviene de un cambio mixto anterior que combinaba lógica y
presentación. Este cambio **aisla únicamente la parte cosmética** y deja la
versión de `main` intacta en su comportamiento (incluida la lógica del modal de
asignación, el flujo de guardado y el data flow). La rama `ASEO_SALON` es un
cambio separado y **no está presente** en la versión de `main`; no se toca.

## Alcance
- Normalización de comentarios HTML (`<!-- Assign Modal -->` → estilo
  consistente en mayúsculas/casing uniforme).
- Compactación de líneas HTML verbosas a líneas legibles de una sola línea donde
  el proyecto ya lo hace.
- Renombrado de clases CSS sólo cuando existe una convención real en el repo
  (en este archivo no hay desviaciones, así que se mantienen `btn-primary`,
  `btn-outline`, etc.).
- Renombrado de variables locales sólo si el resto del archivo ya usa ese
  shorthand (no se introduce ninguna convención nueva).

## Fuera de alcance
- Cualquier cambio en `saveAsignacion`, `openAssignModal`, `loadSemana` o el
  flujo de datos.
- Cualquier lógica de grupo/`ASEO_SALON`.
- Modificación de otros archivos.

## Enfoque
1. Aplicar los cambios de formato en el template inline y los `styles`.
2. Agregar un spec de render (Jest) que pruebe que el refactor no rompió el
   modal de asignación (abre, renderiza selectores y textarea de observaciones,
   y `saveAsignacion` está cableado).
3. Verificar con `npx tsc --noEmit` (0 errores en este archivo) y ejecutar el
   spec → GREEN.

## Plan de rollback
Revertir únicamente `asignacion-list.component.ts` y su nuevo spec mediante
`git checkout` de la rama. No hay migraciones ni estado persistente afectado.
