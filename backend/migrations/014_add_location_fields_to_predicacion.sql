-- Migration: 014_add_location_fields_to_predicacion.sql
-- Description: Agregar campos de ubicación adicionales para mejor geocoding

ALTER TABLE programas_predicacion 
ADD COLUMN IF NOT EXISTS lugar_ciudad VARCHAR(100),
ADD COLUMN IF NOT EXISTS lugar_provincia VARCHAR(100),
ADD COLUMN IF NOT EXISTS lugar_codigo_postal VARCHAR(20),
ADD COLUMN IF NOT EXISTS lugar_pais VARCHAR(100) DEFAULT 'Argentina';