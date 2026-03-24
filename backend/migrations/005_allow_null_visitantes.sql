-- Allow NULL values for visitantes in visitas table
-- This enables automatic visit scheduling without assigned visitors

ALTER TABLE visitas 
ALTER COLUMN visitante_1_id DROP NOT NULL,
ALTER COLUMN visitante_2_id DROP NOT NULL;