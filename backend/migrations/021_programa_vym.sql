-- Migration: 021_programa_vym.sql
-- Description: Tabla para gestionar el programa semanal de Vida y Ministerio ("Seamos Mejores Maestros")

CREATE TABLE IF NOT EXISTS programa_vym (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semana_id UUID NOT NULL REFERENCES semanas_visita(id) ON DELETE CASCADE,
    nombre_congregacion VARCHAR(150) NOT NULL DEFAULT 'ALAMEDA',
    lectura_semanal VARCHAR(255) DEFAULT '',
    presidente VARCHAR(150) DEFAULT '',
    consejero_auxiliar VARCHAR(150) DEFAULT '',
    cancion_inicio VARCHAR(50) DEFAULT '',
    hora_cancion_inicio VARCHAR(10) DEFAULT '',
    oracion_inicio VARCHAR(150) DEFAULT '',
    hora_oracion_inicio VARCHAR(10) DEFAULT '',
    tesoros_titulo VARCHAR(255) DEFAULT '',
    tesoros_tiempo VARCHAR(20) DEFAULT '',
    tesoros_discursante VARCHAR(150) DEFAULT '',
    perlas_tiempo VARCHAR(20) DEFAULT '',
    perlas_discursante VARCHAR(150) DEFAULT '',
    lectura_tiempo VARCHAR(20) DEFAULT '',
    lectura_estudiante VARCHAR(150) DEFAULT '',
    cancion_medio VARCHAR(50) DEFAULT '',
    cancion_medio_tiempo VARCHAR(10) DEFAULT '',
    estudio_conductor VARCHAR(150) DEFAULT '',
    estudio_lector VARCHAR(150) DEFAULT '',
    estudio_tiempo VARCHAR(20) DEFAULT '',
    conclusion_tiempo VARCHAR(20) DEFAULT '',
    cancion_fin VARCHAR(50) DEFAULT '',
    cancion_fin_tiempo VARCHAR(10) DEFAULT '',
    oracion_fin VARCHAR(150) DEFAULT '',
    seamos_maestros_auditorio JSONB NOT NULL DEFAULT '[]'::jsonb,
    seamos_maestros_auxiliar JSONB NOT NULL DEFAULT '[]'::jsonb,
    vida_cristiana_partes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_programa_vym_semana UNIQUE (semana_id)
);

CREATE INDEX IF NOT EXISTS idx_programa_vym_semana ON programa_vym(semana_id);
