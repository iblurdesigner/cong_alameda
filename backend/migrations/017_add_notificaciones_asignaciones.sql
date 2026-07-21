-- Migration: 017_add_notificaciones_asignaciones.sql
-- Add reference fields and new notification types for assignments

-- Add new tipos to the existing enum (PostgreSQL requires renaming approach)
ALTER TYPE notificacion_tipo ADD VALUE IF NOT EXISTS 'ASIGNACION_CREADA';
ALTER TYPE notificacion_tipo ADD VALUE IF NOT EXISTS 'ASIGNACION_ACTUALIZADA';
ALTER TYPE notificacion_tipo ADD VALUE IF NOT EXISTS 'ASIGNACION_COMPLETADA';

-- Create new enum for reference types
DO $$ BEGIN
    CREATE TYPE referencia_tipo AS ENUM ('ASIGNACION', 'VISITA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add reference fields to notificaciones table
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS referencia_id UUID;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS referencia_tipo referencia_tipo;

-- Add index for efficient filtering by reference
CREATE INDEX IF NOT EXISTS idx_notificaciones_referencia ON notificaciones(referencia_tipo, referencia_id) WHERE referencia_tipo IS NOT NULL;