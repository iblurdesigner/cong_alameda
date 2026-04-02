-- Migration: 012_add_grupo_datos_contacto.sql
-- Description: Agregar campos de direccion, contacto, conductor y horario a grupos

ALTER TABLE grupos 
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS contacto TEXT,
ADD COLUMN IF NOT EXISTS conductor TEXT,
ADD COLUMN IF NOT EXISTS horario TEXT;
