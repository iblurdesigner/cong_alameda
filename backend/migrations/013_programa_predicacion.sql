-- Migration: 013_programa_predicacion.sql
-- Description: Crear tabla para programa de prédicación (días Lunes-Domingo)

CREATE TABLE IF NOT EXISTS programas_predicacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    fecha DATE NOT NULL,
    dia_semana INT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Lunes, 6=Domingo
    conductor VARCHAR(100),
    hora_inicio VARCHAR(5) DEFAULT '09:00',
    hora_fin VARCHAR(5) DEFAULT '11:00',
    lugar_nombre VARCHAR(200),
    lugar_direccion TEXT,
    lugar_contacto VARCHAR(100),
    lugar_telefono VARCHAR(20),
    grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de relación muchos a muchos para territorios
CREATE TABLE IF NOT EXISTS programa_predicacion_territorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programa_predicacion_id UUID NOT NULL REFERENCES programas_predicacion(id) ON DELETE CASCADE,
    territorio_id UUID NOT NULL REFERENCES territorios(id) ON DELETE CASCADE,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(programa_predicacion_id, territorio_id)
);

-- Index para buscar por fecha
CREATE INDEX IF NOT EXISTS idx_programas_predicacion_fecha ON programas_predicacion(fecha DESC);

-- Index para buscar por día de la semana
CREATE INDEX IF NOT EXISTS idx_programas_predicacion_dia_semana ON programas_predicacion(dia_semana);

-- Index para búsquedas de territorios
CREATE INDEX IF NOT EXISTS idx_prog_pred_territorios_programa ON programa_predicacion_territorios(programa_predicacion_id);
CREATE INDEX IF NOT EXISTS idx_prog_pred_territorios_territorio ON programa_predicacion_territorios(territorio_id);