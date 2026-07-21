-- Migration: 014_programa_visita.sql
-- Description: Crear tabla para programas de visita personalizados (copia de dia predicacion)

-- Tabla principal programas_visita
CREATE TABLE IF NOT EXISTS programas_visita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programa_predicacion_id UUID,
    fecha DATE NOT NULL,
    dia_semana INT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    conductor VARCHAR(100),
    hora VARCHAR(5),
    lugar_nombre VARCHAR(200),
    lugar_direccion TEXT,
    lugar_contacto VARCHAR(100),
    lugar_telefono VARCHAR(20),
    grupo_id UUID,
    observaciones TEXT,
    visited BOOLEAN DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de relación territorios para programas_visita
CREATE TABLE IF NOT EXISTS programa_visita_territorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programa_visita_id UUID NOT NULL,
    territorio_id UUID NOT NULL,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(programa_visita_id, territorio_id)
);

-- Index para buscar por fecha
CREATE INDEX IF NOT EXISTS idx_programas_visita_fecha ON programas_visita(fecha DESC);

-- Index para buscar por programa_predicacion_id
CREATE INDEX IF NOT EXISTS idx_programas_visita_programa ON programas_visita(programa_predicacion_id);

-- Index para dia de la semana
CREATE INDEX IF NOT EXISTS idx_programas_visita_dia_semana ON programas_visita(dia_semana);

-- Index para búsquedas de territorios
CREATE INDEX IF NOT EXISTS idx_prog_visita_territorios_visita ON programa_visita_territorios(programa_visita_id);
CREATE INDEX IF NOT EXISTS idx_prog_visita_territorios_territorio ON programa_visita_territorios(territorio_id);