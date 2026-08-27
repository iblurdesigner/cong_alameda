-- Migration: 001_initial_schema.sql
-- Description: Initial schema for Congregación Alameda

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types (safe creation)
DO $$ BEGIN
    CREATE TYPE rol AS ENUM ('SUPERINTENDENTE', 'ANCIANO', 'VISITANTE', 'SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE casa_estado AS ENUM ('NO_VISITAR', 'EN_ESPERA_VISITA', 'RECONTACTADA', 'ACTIVA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE visita_estado AS ENUM ('PROGRAMADA', 'REALIZADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notificacion_tipo AS ENUM ('CASA_REGISTRADA', 'VISITA_PROGRAMADA', 'VISITA_COMPLETADA', 'PERSONA_REQUIERE_VISITA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol rol NOT NULL DEFAULT 'VISITANTE',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Casas table
CREATE TABLE IF NOT EXISTS casas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calle_principal VARCHAR(200) NOT NULL,
    numeracion VARCHAR(20) NOT NULL,
    calle_secundaria VARCHAR(200),
    sector VARCHAR(100) NOT NULL,
    referencia TEXT,
    motivo_no_volver TEXT NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    persona_registra VARCHAR(100) NOT NULL,
    estado casa_estado NOT NULL DEFAULT 'NO_VISITAR',
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    foto_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Visitas table
CREATE TABLE IF NOT EXISTS visitas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    casa_id UUID NOT NULL REFERENCES casas(id) ON DELETE CASCADE,
    fecha_programada DATE NOT NULL,
    fecha_realizada DATE,
    visitante_1_id UUID NOT NULL REFERENCES users(id),
    visitante_2_id UUID NOT NULL REFERENCES users(id),
    observaciones TEXT,
    desea_seguir_recibiendo BOOLEAN,
    estado visita_estado NOT NULL DEFAULT 'PROGRAMADA',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Notificaciones table
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo notificacion_tipo NOT NULL,
    casa_id UUID REFERENCES casas(id) ON DELETE SET NULL,
    destinatarios UUID[] NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Notifications per user (junction table for read status)
CREATE TABLE IF NOT EXISTS notificacion_usuario (
    notificacion_id UUID NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leida BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (notificacion_id, usuario_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_casas_sector ON casas(sector);
CREATE INDEX IF NOT EXISTS idx_casas_estado ON casas(estado);
CREATE INDEX IF NOT EXISTS idx_visitas_casa_id ON visitas(casa_id);
CREATE INDEX IF NOT EXISTS idx_visitas_fecha ON visitas(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_visitas_estado ON visitas(estado);
CREATE INDEX IF NOT EXISTS idx_visitas_visitante1 ON visitas(visitante_1_id);
CREATE INDEX IF NOT EXISTS idx_visitas_visitante2 ON visitas(visitante_2_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_casas_updated_at ON casas;
CREATE TRIGGER update_casas_updated_at
    BEFORE UPDATE ON casas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visitas_updated_at ON visitas;
CREATE TRIGGER update_visitas_updated_at
    BEFORE UPDATE ON visitas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
