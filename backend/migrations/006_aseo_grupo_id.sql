-- Migration: 006_aseo_grupo_id.sql
-- Description: Add grupo_id to asignacion_semanal for ASEO_SALON group-only assignments

-- Add grupo_id column to asignacion_semanal
ALTER TABLE asignacion_semanal
    ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL;

-- Index for grupo_id lookups
CREATE INDEX IF NOT EXISTS idx_asignacion_semanal_grupo ON asignacion_semanal(grupo_id);
