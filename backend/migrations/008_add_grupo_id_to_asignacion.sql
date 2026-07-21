-- Migration: 008_add_grupo_id_to_asignacion.sql
-- Add grupo_id column to asignacion_semanal table

-- Add grupo_id column if it doesn't exist
ALTER TABLE asignacion_semanal ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos(id);

-- Add index for grupo_id
CREATE INDEX IF NOT EXISTS idx_asignacion_semanal_grupo ON asignacion_semanal(grupo_id);

-- Add check constraint if table exists and constraint doesn't exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'asignacion_semanal'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'asignacion_semanal' 
        AND constraint_name = 'chk_user_or_grupo'
    ) THEN
        ALTER TABLE asignacion_semanal ADD CONSTRAINT chk_user_or_grupo CHECK (
            (user_id IS NOT NULL AND grupo_id IS NULL) OR
            (user_id IS NULL AND grupo_id IS NOT NULL)
        );
    END IF;
END $$;

-- Insert ASEO_SALON tipo if not exists
INSERT INTO tipo_asignacion (nombre, descripcion, icono) VALUES
    ('ASEO_SALON', 'Grupo encargado del aseo del salón', '🧹')
ON CONFLICT (nombre) DO NOTHING;
