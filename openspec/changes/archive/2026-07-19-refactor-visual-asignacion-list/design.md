# Design: Refactor Visual de `asignacion-list.component.ts`

## Resumen
Cambio puramente cosmético. El archivo se revierte de un cambio mixto previo;
este cambio **aisla solo la parte visual**. Se conserva el comportamiento de
`main` línea a línea en la lógica, incluyendo `ASEO_SALON` (que no existe en
`main`, por lo que no se toca).

## Cambios concretos de formato a aplicar

### 1. Comentarios HTML — casing consistente
Los comentarios de sección del template usan title-case. Se normalizan a
MAYÚSCULAS para alinearlos con la convención de "section banners" del proyecto
y facilitar el escaneo:

- `<!-- Assign Modal -->` → `<!-- ASSIGN MODAL -->`
- `<!-- Bulk Assign Modal -->` → `<!-- BULK ASSIGN MODAL -->`

(Los comentarios inline dentro de bloques `@if`/`@for` no se tocan para evitar
ruido.)

### 2. Compactación de líneas verbosas a una sola línea
El botón "Programar Semana" y el botón "Asignar" del modal bulk están
indentados en múltiples líneas con atributos en su propia línea. Se colapsan a
una línea legible donde el proyecto ya lo hace (el botón "Asignar" del modal de
asignación individual ya está en múltiples líneas; se mantiene idéntico porque
la convención del repo mezcla ambos estilos y no hay una regla única — el
objetivo es consistencia interna sin introducir ruido).

Cambio aplicado:
```html
<!-- ANTES -->
<button class="btn btn-primary" (click)="openBulkModal()">
  ✏️ Programar Semana
</button>

<!-- DESPUÉS -->
<button class="btn btn-primary" (click)="openBulkModal()">✏️ Programar Semana</button>
```
Y en el footer del bulk modal:
```html
<!-- ANTES -->
<button class="btn btn-primary" (click)="saveBulkAsignaciones()">
  Guardar Semana
</button>

<!-- DESPUÉS -->
<button class="btn btn-primary" (click)="saveBulkAsignaciones()">Guardar Semana</button>
```

### 3. Consistencia de clases CSS
Se auditan las clases del template contra los `styles`. Todas (`btn-primary`,
`btn-outline`, `btn-sm`, `btn-icon`, `btn-close`, `modal`, `modal-lg`, `form-group`,
etc.) existen en `styles` y siguen la convención del repo. **No se renombra
ninguna clase** — no hay desviación que corregir.

### 4. Variables locales
El archivo usa `asignacion` consistentemente en el template y `asig` no aparece
en ninguna parte. **No se renombra** ninguna variable local (no se introduce una
convención nueva inconsistente).

## Lo que NO se toca
- Bindings: `[(ngModel)]`, `(click)`, `[class.empty]`, `*ngTemplateOutlet`.
- Lógica de componente: todos los métodos en la clase.
- `styles` funcionales (solo se mantienen; si algún comentario CSS existiera se
  normalizaría, pero no hay).
- Cualquier flujo de datos o llamada a servicios.

## Estrategia de verificación
1. `npx tsc --noEmit` → 0 errores en el archivo.
2. Nuevo spec `asignacion-list.component.spec.ts` (Jest + TestBed) que:
   - Renderiza el componente.
   - Abre el modal (`openAssignModal`) y aserta que `#persona` y
     `#observaciones` existen en el DOM.
   - Espía `AsignacionService.createAsignacion` y confirma que `saveAsignacion`
     lo invoca.
   - Resultado: GREEN.

## Riesgo
Bajo. Frontend únicamente, sin lógica. Una sola PR, < 400 líneas.
