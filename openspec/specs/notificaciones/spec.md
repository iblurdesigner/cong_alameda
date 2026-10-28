# Specification: Notificaciones

## Requirements

### REQ-01: Referencia de Notificación en Backend
- `GetByUserID` en `NotificacionRepository` MUST retornar `referencia_id` y `referencia_tipo` en la lista de notificaciones devuelta por `/api/notificaciones`.
- `notifyAsignacion` en `AsignacionService` MUST establecer `ReferenciaID = semanaID` y `ReferenciaTipo = "ASIGNACION"` al crear notificaciones de asignación.

### REQ-02: Navegación con Query Parameter en Frontend
- Al hacer clic en "Ver →" dentro del Dashboard de Notificaciones en un ítem de tipo asignación, la app MUST redirigir a `/asignaciones?semana_id={semana_id}`.

### REQ-03: Carga de Semana desde la URL en Asignaciones
- `AsignacionListComponent` MUST suscribirse a los `queryParams` del `ActivatedRoute`.
- Si se detecta un `semana_id` válido en la URL, la vista de asignaciones MUST seleccionar automáticamente dicha semana y cargar su detalle de funciones.

## Scenarios

### SCN-01: Redirección precisa desde Notificación
- **Given** que el usuario tiene una notificación "Se te ha asignado la función 'PARQUEADERO' para la semana 'Semana del 20 al 26 de Julio 2026'".
- **When** presiona el botón "Ver →" en la tarjeta de notificación.
- **Then** el usuario navega a la URL `/asignaciones?semana_id=...` y la pantalla de asignaciones muestra directamente la semana del 20 al 26 de Julio de 2026.


<!-- Fusion specs 2026-10-28 — origen: 2026-10-28-notificaciones-s89-whatsapp -->

# Specification: Notificaciones S-89 por WhatsApp

## Overview
Proporcionar un centro de notificaciones ágil para las asignaciones estudiantiles de la reunión "Vida y Ministerio Cristianos", permitiendo a los ancianos y superintendentes enviar la boleta de asignación (S-89) con un solo clic a través de WhatsApp.

## Requirements

### Requirement: Extracción Automática de Estudiantes S-89
- GIVEN an active program for the selected week
- WHEN the user opens the S-89 notification modal
- THEN the system extracts all student assignments:
  1. Lectura de la Biblia (Auditorio Principal).
  2. Cada parte de Seamos Mejores Maestros en el Auditorio Principal (con estudiante y ayudante).
  3. Cada parte de Seamos Mejores Maestros en la Sala Auxiliar (con estudiante y ayudante).
- AND automatically matches each student name with the registered users to retrieve their phone number.

### Requirement: Redacción Estructurada del Mensaje S-89 para WhatsApp
- GIVEN an extracted student assignment
- WHEN generating the WhatsApp message
- THEN the message must contain the exact structured fields of the S-89 form:
  - Título formal: `📋 *ASIGNACIÓN: VIDA Y MINISTERIO CRISTIANOS*`
  - Congregación: `🏛️ *Congregación:* Alameda`
  - Fecha: `🗓️ *Fecha:* [Rango o fecha de la reunión]`
  - Estudiante: `👤 *Estudiante:* [Nombre]`
  - Ayudante: `👥 *Ayudante:* [Nombre]` (si aplica)
  - Sala: `📍 *Sala:* [Auditorio Principal | Sala Auxiliar]`
  - Intervención: `📖 *Intervención:* Núm. [N°] — [Título de la parte] ([Duración])`

### Requirement: Envío Directo e Interacción Accesible
- GIVEN a student with a registered phone number
- WHEN the user clicks "Enviar WhatsApp"
- THEN the system opens a new tab directed to `https://api.whatsapp.com/send?phone={cleanPhone}&text={encodedMessage}`.
- GIVEN a student without a registered phone number
- THEN the system clearly indicates that the phone is missing and provides a quick input field to enter a number manually or copy the text.

### Requirement: Vista Previa y Volante S-89 Digital
- GIVEN any student assignment in the modal
- WHEN clicking "Ver Boleta S-89"
- THEN the system displays the visual slip formatted according to the official layout and allows printing or copying.
