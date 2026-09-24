# Technical Design: Arquitectura de Modo Oscuro para Vida y Ministerio

## 1. Mapeo de Variables y Tokens

| Elemento | Tema Claro | Tema Oscuro (`[data-theme="dark"]`) |
| :--- | :--- | :--- |
| Fondo general (`.vym-layout`) | `--background-color` (`#f8fafc`) | `--background-color` (`#0c0e12`) |
| Cabecera (`.top-header`) | `--surface-color` (`#ffffff`) | `--surface-color` (`#161922`) |
| Panel Editor (`.editor-panel`) | `--surface-color` (`#ffffff`) | `--surface-color` (`#161922`) |
| Textos principales (`h1`, `h2`, labels) | `#0f172a` / `#1e293b` | `--text-primary` (`#f8fafc`) |
| Textos secundarios (`subtitle`, hints) | `#64748b` | `--text-secondary` (`#94a3b8`) |
| Bordes y divisores | `--border-color` (`#e2e8f0`) | `--border-color` (`#242936`) |
| Inputs y textareas | `#f8fafc` | `#11141c` con texto `#f8fafc` y borde `#2d3546` |
| Tarjetas dinámicas (`.item-card`) | `#f8fafc` | `#11141c` |
| Chips de semanas (`.week-chip`) | `#f8fafc` | `#161922` |
| Pestañas móvil (`.mobile-view-tabs`) | `#f1f5f9` | `#161922` |
| Modales (`.s89-modal-card`) | `#ffffff` | `--surface-color` (`#161922`) |
| Hoja A4 física (`.sheet-a4`) | `#ffffff` / `#111827` | **Preservado `#ffffff` / `#111827`** (simulación de papel) |

## 2. Estrategia SCSS y Encapsulación Angular
Se utiliza una doble estrategia para garantizar máxima robustez y compatibilidad:
1. **Tokens nativos como valores por defecto**: Usar `var(--surface-color)`, `var(--text-primary)`, `var(--border-color)` en las clases base.
2. **Bloque `:host-context([data-theme="dark"])`**: Para elementos con fondos específicos, badges coloreados o contrastes de fieldsets que requieran variantes oscuras dedicadas.
