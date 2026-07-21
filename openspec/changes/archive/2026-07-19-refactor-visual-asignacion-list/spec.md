# Spec: Refactor Visual de `asignacion-list.component.ts`

## Requisito
El refactor cosmético debe **preservar todo el comportamiento existente** del
componente `AsignacionListComponent` y **sólo** cambiar la presentación/formato.

## Requerimientos
- **R1**: El modal de asignación (`showAssignModal`) debe poder abrirse y
  renderizar los selectores de persona/grupo y el textarea de observaciones.
- **R2**: El flujo de guardado (`saveAsignacion`) debe permanecer cableado al
  botón "Asignar" y llamar al servicio de creación.
- **R3**: La lógica de carga de semanas, tipos y usuarios (`loadSemanas`,
  `loadTipos`, `loadUsers`, `loadSemana`) no debe cambiar.
- **R4**: Solo se modifican comentarios HTML, formato de plantilla y consistencia
  de clases CSS/estilos — sin cambios en bindings, handlers ni data flow.

## Escenarios (criterios de aceptación)

### Escenario: El modal de asignación renderiza sus controles
- **Dado** el componente renderizado con `showAssignModal = true`
- **Cuando** se inspecciona el DOM del modal
- **Entonces** existe un `<select id="persona">` con la lista de usuarios
- **Y** existe un `<textarea id="observaciones">`
- **Y** existe un botón "Asignar" que invoca `saveAsignacion()`

### Escenario: El refactor no altera la lógica de guardado
- **Dado** el componente con un `assignForm.user_id` válido
- **Cuando** se invoca `saveAsignacion()`
- **Entonces** se llama a `AsignacionService.createAsignacion` con el payload
  correcto (mismo shape que la versión de `main`)

### Escenario: El componente compila sin errores
- **Dado** el archivo refactorizado
- **Cuando** se ejecuta `npx tsc --noEmit`
- **Entonces** no hay errores de TypeScript en `asignacion-list.component.ts`

## No objetivos
- No cambiar el comportamiento del modal bulk (`showBulkModal`).
- No introducir nuevas convenciones de nombrado inconsistentes.
