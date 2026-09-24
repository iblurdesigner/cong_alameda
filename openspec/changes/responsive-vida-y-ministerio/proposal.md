# Proposal: Diseño Adaptativo (Responsive Design) para Asignaciones Vida y Ministerio

## Intent
Hacer que la página `/asignaciones/vida-y-ministerio` sea plenamente funcional, accesible y visualmente atractiva en una amplia variedad de dispositivos móviles (smartphones) y tabletas, además de pantallas de escritorio, resolviendo los problemas de desbordamiento horizontal y rigidez del panel de edición y vista previa A4.

## Scope
- **Frontend (Angular 21 / SCSS / TypeScript)**:
  - `src/app/features/asignaciones/vida-ministerio/vida-ministerio.component.ts`:
    - Incorporar estado reactivo de visualización para pantallas pequeñas (`mobileViewTab: signal<'editor' | 'preview'>`).
    - Detección de viewport / toggle responsive sin afectar el comportamiento en escritorio.
  - `src/app/features/asignaciones/vida-ministerio/vida-ministerio.component.html`:
    - Barra de alternancia de vista móvil (Editor vs Vista Previa A4) visible únicamente en pantallas compactas/tabletas.
    - Reorganización adaptable del encabezado principal, acciones rápidas y chips de semanas recientes.
    - Adaptación de filas de formularios y tarjetas de partes dinámicas para flujo táctil óptimo.
  - `src/app/features/asignaciones/vida-ministerio/vida-ministerio.component.scss`:
    - Media queries estratégicas (`max-width: 1200px`, `max-width: 992px`, `max-width: 768px`, `max-width: 480px`).
    - Desacoplamiento del ancho fijo (`width: 580px`) del panel editor a ancho fluido en mobile/tablet.
    - Escala y visualización contenida de la hoja A4 (`sheet-a4`) para evitar desbordes en pantallas pequeñas.
    - Optimización de targets táctiles (mínimo 44px de alto), inputs legibles y wrapping fluido de formularios.
    - Preservar al 100% las reglas de impresión `@media print` para A4 en papel/PDF.
