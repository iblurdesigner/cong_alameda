# Notificaciones Dashboard UI Specification

## Purpose

Dashboard visual para notificaciones donde cada notificación se muestra como una TARJETA diferenciada por tipo de asignación. Incluye filtros, agrupación por tipo e indicadores visuales (icono, color de fondo).

## ADDED Requirements

### Requirement: Visualización de notificaciones como tarjetas agrupadas

Las notificaciones DEBEN mostrarse en un dashboard que agrupe las notificaciones por tipo de notificación, cada una como una tarjeta visual diferenciada.

- GIVEN el usuario accede a `/notificaciones`
- WHEN se cargan las notificaciones
- THEN se muestran tarjetas agrupadas por sección según el tipo de notificación
- AND cada tarjeta muestra: icono según tipo, mensaje, fecha, badge si no leída

#### Scenario: Sección de notificaciones de asignaciones

- GIVEN existen notificaciones de tipo ASIGNACION_*
- WHEN se visualiza el dashboard
- THEN aparece una sección "Asignaciones" con tantas tarjetas como notificaciones de ese tipo
- AND las tarjetas tienen color de fondo según el tipo de asignación (micrófono, acomodador, etc.)

#### Scenario: Sección de notificaciones de visitas

- GIVEN existen notificaciones de tipo VISITA_*
- WHEN se visualiza el dashboard
- THEN aparece una sección "Visitas" con tarjetas diferenciadas de las de asignaciones

### Requirement: Filtro por tipo de notificación

El dashboard DEBE permitir filtrar las notificaciones por tipo específico.

- GIVEN el usuario hace clic en "Filtrar por..."
- WHEN selecciona un tipo del filtro
- THEN Solo se muestran las notificaciones de ese tipo
- AND los filtros activos se indican visualmente

#### Scenario: Filtro por tipo ASIGNACION_CREADA

- GIVEN hay notificaciones de múltiples tipos
- WHEN usuario filtra por "Asignación Creada"
- THEN solo se muestran tarjetas con tipo ASIGNACION_CREADA

### Requirement: Iconos diferenciados por tipo

Cada tipo de notificación DEBE tener un icono representativo según la categoría de asignación.

- GIVEN una notificación de tipo ASIGNACION_CREADA con tipo_asignacion "micrófono"
- WHEN se renderiza la tarjeta
- THEN el icono mostrado es "🎤" (microphone)
- AND el color de fondo es el definido para tipo "micrófono"

| Tipo Notificación | Icono | Color Fondo |
|-----------------|------|------------|
| ASIGNACION_CREADA (micrófono) | 🎤 | #E3F2FD |
| ASIGNACION_CREADA (acomodador) | 🚪 | #E8F5E9 |
| ASIGNACION_CREADA (plataforma) | 📦 | #FFF3E0 |
| ASIGNACION_ACTUALIZADA | 🔄 | #F3E5F5 |
| ASIGNACION_COMPLETADA | ✅ | #E8F5E9 |
| VISITA_PROGRAMADA | 📅 | #E1F5FE |
| VISITA_COMPLETADA | ✅ | #E8F5E9 |
| CASA_REGISTRADA | 🏠 | #FFECB3 |

### Requirement: Indicador de notificación no leída

Las notificaciones no leídas DEBEN mostrar un indicador visual claro.

- GIVEN una notificación con `leida: false`
- WHEN se renderiza la tarjeta
- THEN aparece un badge o punto azul en el borde izquierdo
- AND el fondo tiene un tinte ligeramente azulado

#### Scenario: Tarjeta no leída

- GIVEN notificación no leída
- WHEN se visualiza
- THEN borde izquierdo color primario (#1976D2)
- AND fondo con opacidad 5% más clara

### Requirement: Navegación desde notificación

Al hacer clic en una notificación de asignación, el sistema DEBE navegar a la vista de asignaciones correspondiente.

- GIVEN usuario hace clic en notificación de tipo ASIGNACION_*
- WHEN se procesa el click
- THEN se redirige a `/asignaciones?semana={semana_id}`
- AND se marca la notificación como leída

## MODIFIED Requirements

(None — este es un nuevo capability sin requisitos existentes)

## REMOVED Requirements

(None)

## Component Architecture

```
notification-dashboard/
├── notification-dashboard.component.ts  (container)
├── components/
│   ├── notification-card.component.ts   (presentational)
│   ├── notification-filter.component.ts  (presentational)
│   └── notification-section.component.ts (presentational)
└── services/
    └── notification.service.ts (extendido)
```

## UI/UX Requirements

| Aspect | Requisito |
|--------|----------|
| Layout | Grid de tarjetas, máximo 3 columnas en desktop, 1 en mobile |
| Scroll | Infinite scroll con paginación (50 por request) |
| Loading | Skeleton loader mientras cargan |
| Empty | Estado vacío con mensaje y botón a asignaciones |
| Responsive | Mobile first, 768px breakpoint |
| Accesibilidad | ARIA labels en secciones, focus-visible en tarjetas |