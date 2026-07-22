-- Migration: 018_nuevos_tipos_asignacion.sql
-- Desglose de micrófonos (Izquierda/Derecha) y acomodadores (Acomodador 1/2)

INSERT INTO tipo_asignacion (nombre, descripcion, icono) VALUES
    ('MICROFONO_IZQ', 'Micrófono Izquierda', '🎤'),
    ('MICROFONO_DER', 'Micrófono Derecha', '🎤'),
    ('ACOMODADOR_1', 'Acomodador 1', '🪑'),
    ('ACOMODADOR_2', 'Acomodador 2', '🪑')
ON CONFLICT (nombre) DO NOTHING;
