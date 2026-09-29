-- Migration: 023_add_hospitalidad_tipo_asignacion.sql
-- Agregar tipo de asignación: Hospitalidad (asignado a grupo de predicación)

INSERT INTO tipo_asignacion (nombre, descripcion, icono) VALUES
    ('HOSPITALIDAD', 'Hospitalidad y refrigerio', '☕')
ON CONFLICT (nombre) DO NOTHING;
