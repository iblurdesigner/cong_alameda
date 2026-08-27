# Proposal: Recordatorios de Asignaciones por WhatsApp

## Intent
Permitir a los administradores / superintendentes enviar un mensaje de recordatorio formateado por WhatsApp a cada usuario asignado en una semana programada.

## Scope
- Frontend: `asignacion-list.component.ts` (botón de acción principal "Enviar Recordatorios WhatsApp", modal de lista de destinatarios con mensajes personalizados y enlace directo a `https://wa.me/{telefono}?text=...`).
- Backend / DTOs: Verificación de números de teléfono de usuarios.
