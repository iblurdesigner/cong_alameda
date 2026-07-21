-- Migration: 010_add_presidente_atalaya_types.sql
-- Add new assignment types: Presidente and Lector Atalaya

-- Insert new assignment types
INSERT INTO tipo_asignacion (nombre, descripcion, icono) VALUES
    ('PRESIDENTE', 'Encargado de presidir las reuniones', '🎯'),
    ('LECTOR_ATALAYA', 'Lector de la Atalaya', '📖')
ON CONFLICT (nombre) DO NOTHING;
