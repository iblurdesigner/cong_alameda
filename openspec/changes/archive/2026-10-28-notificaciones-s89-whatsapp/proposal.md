# Proposal: Notificaciones de Asignaciones Estudiantiles S-89 por WhatsApp

## Intent
Permitir a los administradores y superintendentes notificar de manera individual a cada estudiante asignado en la reunión "Vida y Ministerio Cristianos" (Lectura de la Biblia y Seamos Mejores Maestros tanto en Auditorio Principal como en Sala Auxiliar), enviando el volante oficial S-89 mediante un mensaje formateado en WhatsApp y opción de volante digital imprimible.

## Scope
- **Frontend (Angular 21 / TypeScript / SCSS)**:
  - `src/app/features/asignaciones/vida-ministerio/vida-ministerio.component.ts`:
    - Generación de lista de asignaciones estudiantiles (`getEstudiantesS89List()`) a partir de la semana activa y el programa cargado.
    - Vinculación con los usuarios registrados (`users()`) para obtener números de teléfono móvil normalizados.
    - Redacción automática del mensaje en formato oficial S-89 con emojis, negritas y datos precisos (Fecha, Estudiante, Ayudante, Sala, N° Intervención, Título).
    - Control del modal de recordatorios S-89 (`showS89Modal`).
    - Soporte de apertura directa de WhatsApp (`https://api.whatsapp.com/send?phone=...&text=...`) y Web Share API cuando esté disponible.
  - `src/app/features/asignaciones/vida-ministerio/vida-ministerio.component.html`:
    - Botón de acción en la cabecera: `[ 📱 Notificar Estudiantes (S-89) ]`.
    - Modal emergente con tarjetas/grilla de estudiantes:
      - Estado del teléfono.
      - Vista previa rápida del mensaje.
      - Botón de envío directo a WhatsApp por participante.
      - Opción de vista e impresión de boleta S-89 individual.
  - `src/app/features/asignaciones/vida-ministerio/vida-ministerio.component.scss`:
    - Estilos accesibles, responsivos y modernos para el modal de notificaciones S-89 en móviles, tablets y escritorio.
