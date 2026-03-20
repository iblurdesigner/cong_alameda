-- Migration: 004_asignaciones_internas.sql
-- Phase 3: Asignaciones semanales internas

-- Tabla de tipos de asignación
CREATE TABLE IF NOT EXISTS tipo_asignacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar tipos de asignación
INSERT INTO tipo_asignacion (nombre, descripcion, icono) VALUES
    ('ACOMODADOR_SALON', 'Acomodador del salón de reuniones', '🪑'),
    ('PARQUEADERO', 'Encargado del parqueadero', '🚗'),
    ('MICROFONO', 'Encargado de microfonía', '🎤'),
    ('PLATAFORMA', 'Encargado de plataforma/presentación', '📺')
ON CONFLICT (nombre) DO NOTHING;

-- Tabla de asignaciones semanales
CREATE TABLE IF NOT EXISTS asignacion_semanal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semana_id UUID REFERENCES semanas_visita(id) ON DELETE CASCADE,
    tipo_asignacion_id UUID REFERENCES tipo_asignacion(id),
    user_id UUID REFERENCES users(id),
    dia_semana INT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(semana_id, tipo_asignacion_id, dia_semana)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_asignacion_semanal_semana ON asignacion_semanal(semana_id);
CREATE INDEX IF NOT EXISTS idx_asignacion_semanal_user ON asignacion_semanal(user_id);
CREATE INDEX IF NOT EXISTS idx_asignacion_semanal_dia ON asignacion_semanal(dia_semana);

-- Tabla de configuración de notificación WhatsApp
CREATE TABLE IF NOT EXISTS config_notificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT true,
    dias_antes INT DEFAULT 1,
    hora_envio TIME DEFAULT '08:00:00',
    mensaje_template TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración de WhatsApp
INSERT INTO config_notificacion (tipo, enabled, mensaje_template) VALUES
    ('WHATSAPP_ASIGNACIONES', true, '📋 *Asignaciones para esta semana*\n\nHola {{nombre}}, estas son tus asignaciones:\n\n{{asignaciones}}\n\n¡Gracias por tu servicio!')
ON CONFLICT (tipo) DO NOTHING;
