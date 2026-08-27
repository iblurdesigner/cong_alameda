# Proposal: Rediseño Global al Estilo Calescence

## Intent

Transformar el sistema de diseño global de la aplicación (layout, navegación, tarjetas, paleta de colores y componentes) al estilo visual **Calescence / Modern Minimalist**:
- Fondo neutro ultra limpio (`#f4f5f9`).
- Tarjetas flotantes blancas con bordes redondeados pronunciados (`24px`), sombras suaves y alta legibilidad.
- Tarjetas oscuras de alto contraste (`#121316`) para destacar métricas o bloques principales.
- Acentos en **Verde Lima Neón (`#c4f82a`)** y **Azul Eléctrico (`#2563eb`)** para badges, píldoras activas y estados.
- Sidebar vertical y barra de navegación superior flotantes con contenedores tipo píldora (*pill bars*).

## Scope

### In Scope
- **Tokens de Diseño Globales (`styles.scss`)**: Nueva paleta de colores, sombras suavizadas, radios de borde (`24px`), estilos de botones pill y tipografía.
- **Layout Principal (`app.component.ts`)**: Sidebar vertical flotante con estilo pill bar, header con barra de búsqueda, perfil y notificaciones en cápsulas.
- **Dashboard (`dashboard.component.ts`)**: Rediseño de métricas, tarjetas oscuras/claras de contraste, badges de estado y botones rápidos al estilo Calescence.
- **Vista de Asignaciones (`asignacion-list.component.ts`)**: Adaptación del calendario y paneles de asignación al nuevo lenguaje de diseño.

### Out of Scope
- Lógica de negocio backend, APIs o modelos de datos.

## Capabilities

### Modified Capabilities
- `global-design-system`: Actualizar los tokens de tema, layout global, sidebar, header y componentes principales al estilo Calescence.

## Approach

1. **Tokens Globales**: Definir variables para fondo neutro (`#f4f5f9`), superficies blancas puras (`#ffffff`), tarjetas oscuras (`#121316`), acentos lima neón (`#c4f82a`) y azul eléctrico (`#2563eb`).
2. **Layout Flotante**: Transformar el sidebar y el header en contenedores redondeados flotantes con márgenes sutiles respecto al borde de pantalla.
3. **Componentes y Tarjetas**: Implementar `border-radius: 20px-24px`, badges en cápsula (*pills*) y tipografía con jerarquía fuerte.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/styles.scss` | Modified | Tokens de diseño, sombras, radios y clases utilitarias |
| `frontend/src/app/app.component.ts` | Modified | Layout principal, sidebar vertical y header |
| `frontend/src/app/features/dashboard/dashboard.component.ts` | Modified | Rediseño visual del Dashboard principal |
| `frontend/src/app/features/asignaciones/asignacion-list.component.ts` | Modified | Integración del nuevo tema en la vista de Asignaciones |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incompatibilidad de espacio en pantallas móviles | Low | Ajustar breakpoints responsive con sidebar colapsable |

## Rollback Plan

Revertir los archivos modificados mediante Git si es necesario.

## Success Criteria

- [ ] La aplicación refleja la estética Calescence: fondo gris suave, tarjetas blancas/oscuras redondeadas (`24px`), detalles verde lima y azul eléctrico.
- [ ] El sidebar y header lucen como cápsulas flotantes y modernas.
- [ ] La experiencia es 100% fluida en desktop y mobile.
