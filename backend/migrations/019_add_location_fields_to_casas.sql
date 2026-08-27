-- Migration: 019_add_location_fields_to_casas.sql
-- Description: Agregar campos latitud, longitud y foto_url a la tabla casas

ALTER TABLE casas 
    ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);
