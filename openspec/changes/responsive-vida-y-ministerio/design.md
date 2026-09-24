# Technical Design: Responsive Architecture para Vida y Ministerio

## 1. Breakpoints y Estrategia de Layout

```
Desktop (>= 1024px)
+------------------------+---------------------------------------+
| Header / Actions       |                                       |
+------------------------+---------------------------------------+
| Editor Panel (540px)   | Live A4 Preview Panel (Flex-1)        |
| - Copia 1 / Copia 2    | - Sheet 210mm x 297mm                 |
| - Tesoros / Seamos...  | - Zoom / Scroll                       |
+------------------------+---------------------------------------+

Tablet / Mobile (< 1024px)
+----------------------------------------------------------------+
| Header / Title / Action buttons (Wrapped / Compact)            |
+----------------------------------------------------------------+
| Segmented Bar: [ ✏️ Formulario ]  [ 📄 Vista Previa A4 ]        |
+----------------------------------------------------------------+
| Active Tab Content (Full Width 100%):                          |
| - Si 'editor': Panel de formulario adaptado                    |
| - Si 'preview': Vista A4 con auto-ajuste y zoom interactivo    |
+----------------------------------------------------------------+
```

## 2. Decisiones Técnicas

### 2.1 Estado de Pestaña Móvil con Signals
En `VidaMinisterioComponent`:
```typescript
mobileTab = signal<'editor' | 'preview'>('editor');
```
Se conmuta mediante botones táctiles segmentados que solo aparecen en pantallas `< 1024px`. En pantallas de escritorio (`>= 1024px`), el CSS muestra ambos paneles simultáneamente vía `display: flex`.

### 2.2 Escalamiento del Preview A4 en Pantallas Angostas
Una hoja A4 tiene 210mm (~794px). En teléfonos de 360px-430px:
- Se implementa un contenedor con scroll horizontal suave y un botón de "Ajustar al ancho" (`fit-to-width`) mediante una clase CSS con escala `transform: scale(...)` o `zoom: auto` que adapta la hoja al ancho disponible en móviles para visualización global instantánea.
- Se conserva inalterada la regla `@media print` para no comprometer la resolución física al imprimir o exportar a PDF.

### 2.3 Refactor de Grillas de Formulario (`.form-row` y `.item-card`)
- En pantallas `< 768px`, las filas con múltiples inputs pasan a `flex-wrap: wrap` con `gap: 0.5rem`.
- En `.item-card-header`:
  - En móviles (`< 520px`), el tiempo, la duración y el botón de eliminar se agrupan en una sub-fila, y el título ocupa el 100% del ancho para no quedar comprimido a tamaños ilegibles.
- Target táctil mínimo: 42px - 44px de alto para todos los botones de acción e inputs.
