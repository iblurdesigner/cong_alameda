-- Add lugar_ubicacion column for exact Google Maps URL or coordinates
-- This allows precise location even when address text is not accurate

-- For programa_predicacion
ALTER TABLE programas_predicacion 
ADD COLUMN IF NOT EXISTS lugar_ubicacion TEXT DEFAULT '';

-- For programa_visita
ALTER TABLE programas_visita 
ADD COLUMN IF NOT EXISTS lugar_ubicacion TEXT DEFAULT '';