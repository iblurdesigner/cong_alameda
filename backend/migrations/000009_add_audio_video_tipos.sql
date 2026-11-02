-- Insert AUDIO and VIDEO assignment types if they do not exist
INSERT INTO tipo_asignacion (id, nombre, descripcion, icono, created_at)
VALUES 
    (gen_random_uuid(), 'AUDIO', 'Audio', 'volume_up', NOW()),
    (gen_random_uuid(), 'VIDEO', 'Video', 'videocam', NOW())
ON CONFLICT (nombre) DO NOTHING;

