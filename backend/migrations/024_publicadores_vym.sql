-- Tabla de enlace: publicadores que participan en Seamos Mejores Maestros
CREATE TABLE IF NOT EXISTS publicadores_vym (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publicador_id UUID NOT NULL REFERENCES publicadores(id) ON DELETE CASCADE,
    activo BOOLEAN NOT NULL DEFAULT true,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_publicador_vym UNIQUE (publicador_id)
);
CREATE INDEX IF NOT EXISTS idx_publicadores_vym_publicador ON publicadores_vym(publicador_id);
CREATE INDEX IF NOT EXISTS idx_publicadores_vym_activo ON publicadores_vym(activo);

-- Tabla de historial normalizado de asignaciones en Seamos Mejores Maestros
CREATE TABLE IF NOT EXISTS historial_seamos_maestros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publicador_vym_id UUID NOT NULL REFERENCES publicadores_vym(id) ON DELETE CASCADE,
    semana_id UUID NOT NULL REFERENCES semanas_visita(id) ON DELETE CASCADE,
    fecha_semana DATE NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('estudiante', 'ayudante')),
    sala VARCHAR(20) NOT NULL CHECK (sala IN ('auditorio', 'auxiliar')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_historial_semana_publicador_rol_sala UNIQUE (publicador_vym_id, semana_id, rol, sala)
);
CREATE INDEX IF NOT EXISTS idx_historial_sm_publicador ON historial_seamos_maestros(publicador_vym_id);
CREATE INDEX IF NOT EXISTS idx_historial_sm_semana ON historial_seamos_maestros(semana_id);
CREATE INDEX IF NOT EXISTS idx_historial_sm_fecha ON historial_seamos_maestros(fecha_semana DESC);
