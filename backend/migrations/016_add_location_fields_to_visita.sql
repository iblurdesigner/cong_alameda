-- Migration: 016_add_location_fields_to_visita.sql
-- Description: Agregar campos de ubicación a tabla programas_visita

ALTER TABLE programas_visita 
    ADD COLUMN IF NOT EXISTS lugar_ciudad VARCHAR(100),
    ADD COLUMN IF NOT EXISTS lugar_provincia VARCHAR(100),
    ADD COLUMN IF NOT EXISTS lugar_codigo_postal VARCHAR(20),
    ADD COLUMN IF NOT EXISTS lugar_pais VARCHAR(100),
    ADD COLUMN IF NOT EXISTS lugar_ubicacion TEXT;

-- Index para búsquedas por ciudad/provincia
CREATE INDEX IF NOT EXISTS idx_programas_visita_ciudad ON programas_visita(lugar_ciudad);
CREATE INDEX IF NOT EXISTS idx_programas_visita_provincia ON programas_visita(lugar_provincia);