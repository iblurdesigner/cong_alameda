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
