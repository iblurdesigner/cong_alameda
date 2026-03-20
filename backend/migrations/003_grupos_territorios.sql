-- Migration: 003_grupos_territorios.sql
-- Description: Grupos de predicación, territorios PDF y semanas de visita

-- Grupos de predicación
CREATE TABLE grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    numero INTEGER NOT NULL UNIQUE CHECK (numero >= 1 AND numero <= 5),
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Territorios (archivos PDF por grupo)
CREATE TABLE territorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    archivo_pdf VARCHAR(500) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    tamano INTEGER NOT NULL,
    fecha_subida TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    subido_por VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Semanas de visita
CREATE TABLE semanas_visita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    nombre VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT check_fecha_inicio_es_lunes CHECK (EXTRACT(DOW FROM fecha_inicio) = 1),
    CONSTRAINT check_fecha_fin_es_domingo CHECK (EXTRACT(DOW FROM fecha_fin) = 0),
    CONSTRAINT check_semana_correcta CHECK (fecha_fin = fecha_inicio + INTERVAL '6 days')
);

-- Días de la semana
CREATE TABLE dias_semana (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semana_id UUID NOT NULL REFERENCES semanas_visita(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    territorio_manana_id UUID REFERENCES territorios(id) ON DELETE SET NULL,
    territorio_tarde_id UUID REFERENCES territorios(id) ON DELETE SET NULL,
    grupo_asignado_id UUID REFERENCES grupos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(semana_id, dia_semana)
);

-- Índices
CREATE INDEX idx_territorios_grupo ON territorios(grupo_id);
CREATE INDEX idx_dias_semana_semana ON dias_semana(semana_id);
CREATE INDEX idx_dias_semana_grupo ON dias_semana(grupo_asignado_id);
CREATE INDEX idx_semanas_fecha ON semanas_visita(fecha_inicio DESC);

-- Trigger para updated_at
CREATE TRIGGER update_grupos_updated_at
    BEFORE UPDATE ON grupos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_territorios_updated_at
    BEFORE UPDATE ON territorios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_semanas_updated_at
    BEFORE UPDATE ON semanas_visita
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dias_updated_at
    BEFORE UPDATE ON dias_semana
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: 5 grupos de predicación
INSERT INTO grupos (id, nombre, numero, descripcion, activo)
VALUES
    ('d1111111-1111-1111-1111-111111111111', 'Grupo de Predicación 1', 1, 'Territorio norte de la congregación', true),
    ('d2222222-2222-2222-2222-222222222222', 'Grupo de Predicación 2', 2, 'Territorio centro', true),
    ('d3333333-3333-3333-3333-333333333333', 'Grupo de Predicación 3', 3, 'Territorio sur', true),
    ('d4444444-4444-4444-4444-444444444444', 'Grupo de Predicación 4', 4, 'Territorio este', true),
    ('d5555555-5555-5555-5555-555555555555', 'Grupo de Predicación 5', 5, 'Territorio oeste', true);
