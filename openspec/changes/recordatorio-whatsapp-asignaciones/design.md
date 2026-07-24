# Design: Integración de Recordatorios por WhatsApp en Asignaciones

## Estrategia de Envió WhatsApp
Utilización del protocolo oficial `https://wa.me/{phone}?text={mensaje}`:

### Formato del Mensaje:
```text
Hola *{Nombre}*, te recordamos tu asignación para la *{Semana}* en Congregación Alameda:

📌 *Función:* {Rol}
🗓️ *Período:* {Fechas}

¡Gracias por tu apoyo y servicio! 🙏
```

### Componentes de UI
1. **Botón en Tarjeta Semanal**: `<button class="btn-whatsapp"> <span class="icon">chat</span> Recordatorios WhatsApp </button>`.
2. **Modal `showWhatsAppModal`**: Lista de asignados con estado del teléfono, vista previa del mensaje y botón de envío individual / secuencial.
