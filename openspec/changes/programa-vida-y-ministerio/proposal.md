# Proposal: Módulo de Asignaciones "Vida y Ministerio - Seamos Mejores Maestros"

## Intent
Integrar en la aplicación de Congregación Alameda la gestión y generación del programa semanal de la reunión "Vida y Ministerio Cristianos" (bloques *Tesoros de la Biblia*, *Seamos Mejores Maestros* con salas Auditorio Principal y Auxiliar, y *Nuestra Vida Cristiana*), adaptando el código prototipo de `C:\Users\David\OneDrive\Documentos\DEV\programa-vida-y-ministerio` a la arquitectura de Alameda (Go + PostgreSQL + Angular 21 + Signals).

## Scope
- **Backend (Go / Fiber / PostgreSQL)**:
  - Migración SQL `021_programa_vym.sql` con tabla `programa_vym` vinculada a `semanas_visita(id)` y campos JSONB para partes dinámicas.
  - Modelo `ProgramaVyM`, DTOs de solicitud/respuesta.
  - Repositorio, Servicio y Handler para consulta y upsert (creación/actualización) del programa semanal.
  - Rutas REST bajo `/api/v1/programa-vym`.
  - Pruebas unitarias de repositorio, servicio y handler.

- **Frontend (Angular 21 / TypeScript / SCSS)**:
  - `ProgramaVyMService`: servicio HTTP con signals para interactuar con la API.
  - Componente Standalone `VidaMinisterioComponent` en `src/app/features/asignaciones/vida-ministerio/`:
    - Selector semanal integrado con historial de al menos 1 mes hacia atrás (y semanas futuras) para poder consultar y editar reemplazos en cualquier momento.
    - Acceso rápido a las semanas recientes del mes para sustituciones ágiles de participantes.
    - Formulario reactivo de edición para los 3 bloques principales.
    - Soporte para Auditorio Principal y Sala Auxiliar dinámicas.
    - Autocompletado de publicadores/usuarios activos manteniendo opción de texto libre.
    - Vista previa en tiempo real de la hoja A4 vertical (2 copias por hoja con línea de corte punteada).
    - Herramienta para clonar Programa 1 a Programa 2 en un clic.
    - Exportación a PDF e impresión de alta fidelidad vía CSS `@media print` y exportación a Word.
  - Integración en navegación: tabs o enlaces directos dentro de `/asignaciones` y menú lateral.
