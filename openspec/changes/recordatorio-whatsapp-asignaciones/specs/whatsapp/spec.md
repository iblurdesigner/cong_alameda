# Feature Spec: Recordatorios por WhatsApp

## Requirements
1. A button "Enviar Recordatorios WhatsApp" shall be visible in the weekly assignment card header when at least one assignment is populated.
2. Clicking the button shall open a modal listing all assigned users for that week with their role and telephone number.
3. Each user row in the modal shall have a button "Enviar WhatsApp" that opens `https://wa.me/{phone}?text={encodedMessage}` in a new tab with a friendly, pre-formatted message:
   "Hola [Nombre], te recordamos tu asignación en Congregación Alameda para la [Semana]:\n📌 Función: [Rol]\n🗓️ Fecha: [Fechas]\n¡Gracias por tu colaboración!"
4. Users without a registered phone number shall display a warning "Sin teléfono registrado" with a quick link to edit/add their phone.
