# Technical Design: Centro de Notificaciones y Volantes S-89

## 1. Modelo de Datos (`EstudianteS89Item`)

```typescript
export interface EstudianteS89Item {
  id: string;
  numero: number;
  titulo: string;
  tiempo: string;
  sala: 'Auditorio Principal' | 'Sala Auxiliar';
  estudiante: string;
  ayudante?: string;
  telefono: string;
  telefonoManual?: string;
  mensajeRaw: string;
}
```

## 2. Lógica de Extracción y Formateo
1. **Extracción unificada de asignaciones:**
   - Asignación 3: *Lectura de la Biblia* (del programa activo `p1()` o `current()`).
   - Asignaciones 4+: *Seamos Mejores Maestros* (Auditorio Principal y Sala Auxiliar).
2. **Asociación de Teléfono:**
   - Búsqueda insensible a mayúsculas/tildes en la lista reactiva de usuarios de la congregación (`users()`).
   - Normalización de números ecuatorianos e internacionales: si inicia con `0`, anteponer código `593`.
3. **Formato del Mensaje:**
   ```text
   📋 *ASIGNACIÓN: VIDA Y MINISTERIO CRISTIANOS*
   🏛️ *Congregación:* {congregacion}
   🗓️ *Semana:* {semanaNombre} ({fechas})
   👤 *Estudiante:* {estudiante}
   👥 *Ayudante:* {ayudante}
   📍 *Sala:* {sala}
   📖 *Intervención:* Núm. {numero} — {titulo} ({tiempo})

   ¡Muchos éxitos en tu preparación! 🙏
   ```

## 3. Componentes de UI
- **Botón en Encabezado**: Botón con estilo WhatsApp y badge de contador de estudiantes de la semana.
- **Modal `showS89Modal`**:
  - Filtro rápido por sala: `[ Todos ] [ Auditorio Principal ] [ Sala Auxiliar ]`.
  - Tarjetas individuales de estudiantes con indicador visual de teléfono (verde si tiene teléfono registrado, ámbar si requiere ingreso manual).
  - Botón de envío directo a WhatsApp (`api.whatsapp.com/send`).
  - Botón para copiar mensaje al portapapeles.
  - Previsualización del volante oficial S-89 (tarjeta imprimible individual).
