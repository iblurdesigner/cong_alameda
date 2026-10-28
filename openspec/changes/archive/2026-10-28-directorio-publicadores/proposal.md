# Proposal: Directorio de Publicadores de la Congregación Alameda

## Intent
Crear un módulo independiente de "Directorio de Publicadores" para registrar a todos los hermanos de la Congregación Alameda con sus datos de contacto (celular, teléfono, email, domicilio), contacto de emergencia (nombre, teléfono, parentesco) y observaciones, separando claramente el padrón de hermanos del sistema de autenticación de usuarios (`users`), y permitiendo alimentar las asignaciones y notificaciones de reuniones sin requerir cuentas de usuario para cada uno.

## Scope
- **Backend (Go / Fiber / PostgreSQL)**:
  - Migración `022_publicadores.sql`:
    - Tabla `publicadores` con campos: `id` (UUID PK), `nombres` (VARCHAR, NOT NULL), `apellidos` (VARCHAR, NOT NULL), `celular` (VARCHAR), `telefono` (VARCHAR), `email` (VARCHAR), `domicilio` (TEXT), `grupo_id` (UUID NULL REFERENCES grupos(id) ON DELETE SET NULL), `contacto_emergencia_nombre` (VARCHAR), `contacto_emergencia_telefono` (VARCHAR), `contacto_emergencia_parentesco` (VARCHAR), `observaciones` (TEXT), `activo` (BOOLEAN DEFAULT TRUE), `user_id` (UUID NULL UNIQUE REFERENCES users(id) ON DELETE SET NULL), timestamps (`created_at`, `updated_at`).
    - Ordenamiento alfabético por apellidos (`ORDER BY apellidos ASC, nombres ASC`).
  - Modelo `models.Publicador`:
    - Definición de structs Go y validaciones.
  - Repositorio `PublicadorRepository`:
    - Operaciones CRUD (Create, List, GetByID, Update, Delete/Deactivate, Search).
  - Servicio `PublicadorService`:
    - Lógica de negocio y normalización de datos.
  - Handler `PublicadorHandler`:
    - Endpoints REST `/api/v1/publicadores` protegidos con autenticación JWT y roles autorizados.
  - Pruebas unitarias de Backend en Go.

- **Frontend (Angular 21 / Signals / SCSS)**:
  - Modelo y Servicio `PublicadorService`:
    - Métodos para listar, crear, editar, buscar y desactivar/activar publicadores.
  - Componente de Administración `PublicadoresComponent` en `src/app/features/admin/publicadores`:
    - Listado con buscador reactivo en tiempo real (por nombre, celular o emergencia).
    - Tarjetas o tabla responsiva adaptada a tema claro y oscuro (`[data-theme="dark"]`).
    - Modal o formulario de alta/edición con campos: Datos personales (nombre, celular, teléfono, email, domicilio), Contacto de emergencia (nombre, celular, parentesco), Notas/Observaciones, y Vínculo opcional con usuario del sistema.
    - Acciones rápidas (llamada directa `tel:`, WhatsApp directo, editar, dar de baja).
  - Rutas y Navegación:
    - Ruta `/admin/publicadores` accesible para administradores, ancianos y superintendentes.
    - Enlace en la navegación o panel de administración junto a "Usuarios del Sistema".
  - Pruebas unitarias frontend con Jest.
