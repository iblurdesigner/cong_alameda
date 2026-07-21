-- Migration: 011_add_archivado_to_semanas.sql
-- Add archivado field to semanas_visita table

-- Add archivado column
ALTER TABLE semanas_visita ADD COLUMN IF NOT EXISTS archivado BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_semanas_archivado ON semanas_visita(archivado);
CREATE INDEX IF NOT EXISTS idx_semanas_fecha_inicio ON semanas_visita(fecha_inicio);
