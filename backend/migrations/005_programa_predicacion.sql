-- Migration: 005_programa_predicacion.sql
-- Description: Programa de Predicación (preaching program management)

CREATE TABLE programas_predicacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    fecha DATE NOT NULL,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    dia_semana_nombre VARCHAR(20) NOT NULL,
    conductor VARCHAR(200) NOT NULL DEFAULT '',
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    lugar_nombre VARCHAR(200),
    lugar_direccion VARCHAR(300),
    lugar_ciudad VARCHAR(100),
    lugar_provincia VARCHAR(100),
    lugar_codigo_postal VARCHAR(20),
    lugar_pais VARCHAR(100) DEFAULT 'Argentina',
    lugar_ubicacion VARCHAR(500),
    lugar_contacto VARCHAR(200),
    lugar_telefono VARCHAR(50),
    grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_programa_fecha_hora UNIQUE (fecha, hora_inicio)
);

CREATE TABLE programa_predicacion_territorios (
    programa_id UUID NOT NULL REFERENCES programas_predicacion(id) ON DELETE CASCADE,
    territorio_id UUID NOT NULL REFERENCES territorios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (programa_id, territorio_id)
);

CREATE INDEX idx_programas_fecha ON programas_predicacion(fecha DESC);
CREATE INDEX idx_programas_grupo ON programas_predicacion(grupo_id);
CREATE INDEX idx_programa_territorios_programa ON programa_predicacion_territorios(programa_id);

CREATE TRIGGER update_programas_predicacion_updated_at
    BEFORE UPDATE ON programas_predicacion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
