-- Migration: 022_publicadores.sql
-- Description: Tabla para el directorio de publicadores de la Congregación Alameda

CREATE TABLE IF NOT EXISTS publicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombres VARCHAR(150) NOT NULL DEFAULT '',
    apellidos VARCHAR(150) NOT NULL DEFAULT '',
    celular VARCHAR(50),
    telefono VARCHAR(50),
    email VARCHAR(255),
    domicilio TEXT,
    grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL,
    contacto_emergencia_nombre VARCHAR(255),
    contacto_emergencia_telefono VARCHAR(50),
    contacto_emergencia_parentesco VARCHAR(100),
    observaciones TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migración segura si la tabla ya fue inicializada con 'nombre'
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='publicadores' AND column_name='nombre'
    ) THEN
        ALTER TABLE publicadores ADD COLUMN IF NOT EXISTS nombres VARCHAR(150) DEFAULT '';
        ALTER TABLE publicadores ADD COLUMN IF NOT EXISTS apellidos VARCHAR(150) DEFAULT '';
        UPDATE publicadores SET nombres = nombre WHERE (nombres IS NULL OR nombres = '') AND nombre IS NOT NULL;
        ALTER TABLE publicadores DROP COLUMN IF EXISTS nombre;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_publicadores_apellidos ON publicadores(apellidos);
CREATE INDEX IF NOT EXISTS idx_publicadores_nombres ON publicadores(nombres);
CREATE INDEX IF NOT EXISTS idx_publicadores_celular ON publicadores(celular);
CREATE INDEX IF NOT EXISTS idx_publicadores_grupo_id ON publicadores(grupo_id);
CREATE INDEX IF NOT EXISTS idx_publicadores_activo ON publicadores(activo);
