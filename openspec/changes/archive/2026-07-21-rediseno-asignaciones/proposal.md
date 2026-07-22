# Proposal: Rediseño Moderno de Asignaciones Semanales

## Intent

Transformar la vista de **Asignaciones Semanales** de una grilla rígida y fría a una experiencia moderna, dinámica e intuitiva. El objetivo es brindar mejor jerarquía visual, indicadores claros de estado (días pasados, día actual, días con/sin asignación), tarjetas estilizadas para cada día, micro-interacciones sutiles y soporte impecable para dark/light mode con colores armoniosos e iconos representativos (`re-icon`).

## Scope

### In Scope
- **Jerarquía Visual y Tipografía**: Encabezado moderno, badges coloridas para estado de la semana y resumen cuantitativo.
- **Grilla y Tarjetas Diarias**: Reemplazar las celdas frías por tarjetas interactivas con bordes suaves, resplandores (glows) sutiles para el día actual y chips/badges para cada asignación.
- **Acciones y Controles**: Barra de control con navegación de mes/semana fluida, botón de "Nueva Programación" y "Exportar PDF" destacados con gradientes y micro-animaciones en hover.
- **Modal de Edición/Asignación**: Modal modernizado con glassmorphism/elevación, formularios limpios, validaciones visuales y distinción clara entre asignaciones por Persona vs Grupo (Aseo del Salón).
- **Iconografía Integrada**: Uso consistente del componente `<re-icon>` en lugar de emojis o texto plano.

### Out of Scope
- Modificaciones a la API backend de asignaciones (el modelo de datos se mantiene intacto).
- Cambios en los permisos de usuario o guards de rutas.

## Capabilities

### Modified Capabilities
- `asignaciones-ui`: Mejorar la interfaz de asignaciones semanales para ofrecer una experiencia moderna, tarjetas dinámicas e integración visual fluida.

## Approach

1. **Tokens y Estilos CSS/SCSS**: Definir variables de diseño (gradientes, shadows, glow effects, borders) en el componente o módulo de asignaciones.
2. **Estructura HTML/Angular**: Refactorizar la plantilla de `asignacion-list` (y subcomponentes/modales asociados) manteniendo el flujo de Signals de Angular 21.
3. **Componentes Visuales**: Utilizar badges personalizadas por tipo de asignación (Ej: Micrófono, Presidente, Lector, Aseo Salón), con colores distintivos por categoría.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/app/features/asignaciones/asignacion-list.component.ts` | Modified | Plantilla HTML y estilos SCSS encapsulados/integrados |
| `frontend/src/app/features/asignaciones/semana-editar.component.ts` | Modified | Modal y asignaciones diarias alineados al nuevo diseño |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ruptura de responsive en pantallas pequeñas | Low | Usar CSS Grid / Flexbox con breakpoints media queries dedicados |
| Incompatibilidad de estilos con Dark Mode | Low | Utilizar tokens CSS vinculados a las variables de tema global |

## Rollback Plan

En caso de fallos, revertir los cambios de frontend mediante `git checkout` al commit previo al rediseño.

## Success Criteria

- [ ] La página de Asignaciones se ve limpia, moderna y con buena profundidad (glows/card shadows).
- [ ] El día actual resalta claramente respecto al resto de la grilla.
- [ ] Los tipos de asignación se distinguen por badges coloridas e iconos `<re-icon>`.
- [ ] Responsive y totalmente funcional en desktop y mobile.
