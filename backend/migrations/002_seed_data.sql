-- Seed data: Initial users for testing
-- Password for all users is: "password123" (bcrypt hash)
-- In production, change these immediately!

-- Hash of "password123" using bcrypt (DefaultCost)
-- $2a$10$S1lkwcxhyMGycLrOwn6UaeFckm5hXB/tHapW31w7A0V2VZooVwBO6

INSERT INTO users (id, nombre, telefono, email, password, rol, activo)
VALUES 
    ('a1111111-1111-1111-1111-111111111111', 'Juan Superintendente', '+1234567890', 'superintendente@iglesia.org', '$2a$10$S1lkwcxhyMGycLrOwn6UaeFckm5hXB/tHapW31w7A0V2VZooVwBO6', 'SUPERINTENDENTE', true),
    ('a2222222-2222-2222-2222-222222222222', 'Pedro Anciano', '+1234567891', 'anciano1@iglesia.org', '$2a$10$S1lkwcxhyMGycLrOwn6UaeFckm5hXB/tHapW31w7A0V2VZooVwBO6', 'ANCIANO', true),
    ('a3333333-3333-3333-3333-333333333333', 'María Anciana', '+1234567892', 'anciana1@iglesia.org', '$2a$10$S1lkwcxhyMGycLrOwn6UaeFckm5hXB/tHapW31w7A0V2VZooVwBO6', 'ANCIANO', true),
    ('a4444444-4444-4444-4444-444444444444', 'Carlos Visitante', '+1234567893', 'visitante1@iglesia.org', '$2a$10$S1lkwcxhyMGycLrOwn6UaeFckm5hXB/tHapW31w7A0V2VZooVwBO6', 'VISITANTE', true),
    ('a5555555-5555-5555-5555-555555555555', 'Ana Visitante', '+1234567894', 'visitante2@iglesia.org', '$2a$10$S1lkwcxhyMGycLrOwn6UaeFckm5hXB/tHapW31w7A0V2VZooVwBO6', 'VISITANTE', true);

-- Seed data: Sample houses for testing
INSERT INTO casas (id, calle_principal, numeracion, calle_secundaria, sector, referencia, motivo_no_volver, persona_registra, estado)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 'Av. Principal', '123', 'Entre Calle 1 y 2', 'Centro', 'Casa azul con rejas', 'No desea recibir visitas de predicadores', 'Juan Superintendente', 'NO_VISITAR'),
    ('b2222222-2222-2222-2222-222222222222', 'Calle Secundaria', '456', 'Av. Las Flores', 'Norte', 'Portón verde, jardín con flores', 'Solicitó no ser contactada', 'Pedro Anciano', 'EN_ESPERA_VISITA'),
    ('b3333333-3333-3333-3333-333333333333', 'Av. Libertador', '789', 'Edificio Los Alpes', 'Sur', 'Apto 301, tercer piso', 'Mudanza temporal', 'María Anciana', 'RECONTACTADA');

-- Seed data: Sample visita for testing
INSERT INTO visitas (id, casa_id, fecha_programada, visitante_1_id, visitante_2_id, estado)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', '2026-01-15', 'a4444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', 'PROGRAMADA')
ON CONFLICT DO NOTHING;

-- Seed data: Sample semanas de servicio
INSERT INTO semanas_visita (id, fecha_inicio, fecha_fin, nombre)
VALUES
    ('e1111111-1111-1111-1111-111111111111', '2026-07-20', '2026-07-26', 'Semana del 20 al 26 de Julio 2026'),
    ('e2222222-2222-2222-2222-222222222222', '2026-07-27', '2026-08-02', 'Semana del 27 de Julio al 2 de Agosto 2026')
ON CONFLICT DO NOTHING;
