-- Migration: 020_deduplicate_and_unique_semanas.sql
-- Description: Clean up duplicate semanas_visita and enforce UNIQUE on fecha_inicio

DO $$
DECLARE
    rec RECORD;
    canonical_id UUID;
BEGIN
    FOR rec IN 
        SELECT fecha_inicio
        FROM semanas_visita
        GROUP BY fecha_inicio
        HAVING COUNT(*) > 1
    LOOP
        -- Pick the canonical record (the one with the most asignaciones, or oldest)
        SELECT id INTO canonical_id
        FROM semanas_visita s
        WHERE s.fecha_inicio = rec.fecha_inicio
        ORDER BY (SELECT COUNT(*) FROM asignacion_semanal a WHERE a.semana_id = s.id) DESC, s.created_at ASC
        LIMIT 1;

        -- Reassign asignaciones that don't collide
        UPDATE asignacion_semanal a
        SET semana_id = canonical_id
        WHERE a.semana_id IN (
            SELECT id FROM semanas_visita WHERE fecha_inicio = rec.fecha_inicio AND id != canonical_id
        )
        AND NOT EXISTS (
            SELECT 1 FROM asignacion_semanal a2
            WHERE a2.semana_id = canonical_id
              AND a2.tipo_asignacion_id = a.tipo_asignacion_id
              AND a2.dia_semana = a.dia_semana
        );

        -- Delete remaining colliding asignaciones from duplicate weeks
        DELETE FROM asignacion_semanal
        WHERE semana_id IN (
            SELECT id FROM semanas_visita WHERE fecha_inicio = rec.fecha_inicio AND id != canonical_id
        );

        -- Delete duplicate dias_semana
        DELETE FROM dias_semana
        WHERE semana_id IN (
            SELECT id FROM semanas_visita WHERE fecha_inicio = rec.fecha_inicio AND id != canonical_id
        );

        -- Delete duplicate semanas_visita rows
        DELETE FROM semanas_visita
        WHERE fecha_inicio = rec.fecha_inicio AND id != canonical_id;
    END LOOP;
END $$;

-- Enforce UNIQUE constraint on fecha_inicio
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_semanas_visita_fecha_inicio'
    ) THEN
        ALTER TABLE semanas_visita ADD CONSTRAINT uq_semanas_visita_fecha_inicio UNIQUE (fecha_inicio);
    END IF;
END $$;
