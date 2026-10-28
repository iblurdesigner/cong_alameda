# Specification: Directorio de Publicadores de la Congregación Alameda

## Overview
Proveer un registro completo y seguro de todos los miembros de la congregación Alameda (publicadores), gestionando información de contacto regular y de emergencia sin otorgar acceso al sistema ni contaminar la tabla de credenciales `users`.

## Requirements

### Requirement: Separación de Identidad y Padrón de Congregación
- GIVEN the application database and models
- WHEN a publisher is created or listed
- THEN they exist in the `publicadores` entity independently of whether they have a login user or not.
- AND only publishers linked to a `User` record have an associated `user_id`.

### Requirement: Gestión de Datos de Contacto y Emergencia
- GIVEN an authorized user (SuperAdmin, Superintendente, Anciano)
- WHEN creating or updating a publisher
- THEN the system records:
  - `nombres` (requerido, nombres de pila)
  - `apellidos` (requerido, apellidos familiares)
  - `celular` (opcional, teléfono móvil principal para WhatsApp/llamadas)
  - `telefono` (opcional, teléfono fijo o secundario)
  - `email` (opcional, correo electrónico personal)
  - `domicilio` (opcional, dirección residencial)
  - `grupo_id` (opcional, grupo de predicación al que pertenece, vinculado con `grupos(id)`)
  - Ordenamiento por defecto: alfabético por apellidos (`apellidos ASC, nombres ASC`).
  - `contacto_emergencia_nombre` (opcional)
  - `contacto_emergencia_telefono` (opcional)
  - `contacto_emergencia_parentesco` (opcional, ej: Cónyuge, Hijo/a, Padre/Madre, Familiar)
  - `observaciones` (opcional, notas pastorales o médicas generales)
  - `activo` (booleano, por defecto `true`)

### Requirement: Búsqueda y Filtros en Tiempo Real
- GIVEN the publishers administration view
- WHEN the user types in the search bar
- THEN the list dynamically filters by publisher name, phone number, emergency contact, or status (active/inactive).

### Requirement: Vinculación Opcional con Usuario del Sistema
- GIVEN a publisher who also possesses a system account
- WHEN editing the publisher or user
- THEN an administrator can optionally link the publisher with an existing `User`, ensuring a 1-to-1 unique relationship.

### Requirement: Control de Acceso y Autorización
- GIVEN an unauthenticated or unauthorized user (visitante sin permisos)
- WHEN attempting to access `/admin/publicadores` or endpoints `/api/v1/publicadores`
- THEN access is denied with 401 Unauthorized or 403 Forbidden.

### Requirement: Soporte para Modo Oscuro y Diseño Responsivo
- GIVEN the publisher directory UI in light or dark mode (`data-theme="dark"`)
- WHEN viewing on desktop, tablet, or smartphone
- THEN the layout renders clearly with semantic tokens, accessible forms, and quick action buttons (WhatsApp, call, edit).
