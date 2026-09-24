# Proposal: Modo Oscuro para Asignaciones Vida y Ministerio

## Intent
Adaptar la página `/asignaciones/vida-y-ministerio` al sistema de tema oscuro (`[data-theme="dark"]`) de Congregación Alameda, alineando todos los paneles de edición, cabecera, subnavegación, historial, modales S-89 e inputs con las variables del tema (`--surface-color`, `--background-color`, `--text-primary`, `--border-color`), mientras se mantiene intacta la simulación de hoja blanca de papel para la previsualización e impresión A4 (`.sheet-a4`).

## Scope
- **Frontend (Angular 21 / SCSS)**:
  - `src/app/features/asignaciones/vida-ministerio/vida-ministerio.component.scss`:
    - Migración de colores fijos claros (`#f8fafc`, `#fff`, `#f1f5f9`, etc.) a variables semánticas (`--background-color`, `--surface-color`, `--text-primary`, `--text-secondary`, `--border-color`).
    - Reglas explícitas bajo `[data-theme="dark"]` o `:host-context([data-theme="dark"])` para:
      - Encabezado principal, botones de acción y pestañas de subnavegación.
      - Chips del historial de semanas recientes y selector de copia (Copia 1 / Copia 2).
      - Panel editor, fieldsets de secciones (Tesoros, Seamos Mejores Maestros, Vida Cristiana), tarjetas dinámicas (`.item-card`, `.study-card`) e inputs.
      - Barra de pestañas responsiva móvil/tablet (`.mobile-view-tabs`).
      - Modales de notificaciones WhatsApp y boleta S-89.
    - Preservar el fondo blanco y contraste negro de la hoja de previsualización física `.sheet-a4` y `.s89-printable-slip`.
