-- Migration: 009_allow_multiple_assignments_per_type.sql
-- Allow multiple people/groups per assignment type per day

-- Drop the unique constraint that limits to one assignment per type per day
ALTER TABLE asignacion_semanal DROP CONSTRAINT IF EXISTS asignacion_semanal_semana_id_tipo_asignacion_id_dia_semana_key;

-- Add a simple unique constraint on just the primary key (id) which is always unique
-- This allows multiple assignments for the same type/day
