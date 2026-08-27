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
    ('a5555555-5555-5555-5555-555555555555', 'Ana Visitante', '+1234567894', 'visitante2@iglesia.org', '$2a$10$S1lkwcxhyMGycLrOwn6UaeFckm5hXB/tHapW31w7A0V2VZooVwBO6', 'VISITANTE', true)
ON CONFLICT DO NOTHING;

-- Seed data: Sample houses for testing
INSERT INTO casas (id, calle_principal, numeracion, calle_secundaria, sector, referencia, motivo_no_volver, persona_registra, estado)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 'Av. Principal', '123', 'Entre Calle 1 y 2', 'Centro', 'Casa azul con rejas', 'No desea recibir visitas de predicadores', 'Juan Superintendente', 'NO_VISITAR'),
    ('b2222222-2222-2222-2222-222222222222', 'Calle Secundaria', '456', 'Av. Las Flores', 'Norte', 'Portón verde, jardín con flores', 'Solicitó no ser contactada', 'Pedro Anciano', 'EN_ESPERA_VISITA'),
    ('b3333333-3333-3333-3333-333333333333', 'Av. Libertador', '789', 'Edificio Los Alpes', 'Sur', 'Apto 301, tercer piso', 'Mudanza temporal', 'María Anciana', 'RECONTACTADA')
ON CONFLICT DO NOTHING;

-- Seed data: Sample visita for testing
INSERT INTO visitas (id, casa_id, fecha_programada, visitante_1_id, visitante_2_id, estado)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', '2026-01-15', 'a4444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', 'PROGRAMADA')
ON CONFLICT DO NOTHING;

-- Seed data: Sample semanas de servicio (Año 2026 completo)
INSERT INTO semanas_visita (fecha_inicio, fecha_fin, nombre)
VALUES
    ('2026-07-20', '2026-07-26', 'Semana del 20 al 26 de Julio 2026'),
    ('2026-07-27', '2026-08-02', 'Semana del 27 de Julio al 2 de Agosto 2026'),
    ('2026-08-03', '2026-08-09', 'Semana del 3 al 9 de Agosto 2026'),
    ('2026-08-10', '2026-08-16', 'Semana del 10 al 16 de Agosto 2026'),
    ('2026-08-17', '2026-08-23', 'Semana del 17 al 23 de Agosto 2026'),
    ('2026-08-24', '2026-08-30', 'Semana del 24 al 30 de Agosto 2026'),
    ('2026-08-31', '2026-09-06', 'Semana del 31 de Agosto al 6 de Septiembre 2026'),
    ('2026-09-07', '2026-09-13', 'Semana del 7 al 13 de Septiembre 2026'),
    ('2026-09-14', '2026-09-20', 'Semana del 14 al 20 de Septiembre 2026'),
    ('2026-09-21', '2026-09-27', 'Semana del 21 al 27 de Septiembre 2026'),
    ('2026-09-28', '2026-10-04', 'Semana del 28 de Septiembre al 4 de Octubre 2026'),
    ('2026-10-05', '2026-10-11', 'Semana del 5 al 11 de Octubre 2026'),
    ('2026-10-12', '2026-10-18', 'Semana del 12 al 18 de Octubre 2026'),
    ('2026-10-19', '2026-10-25', 'Semana del 19 al 25 de Octubre 2026'),
    ('2026-10-26', '2026-11-01', 'Semana del 26 de Octubre al 1 de Noviembre 2026'),
    ('2026-11-02', '2026-11-08', 'Semana del 2 al 8 de Noviembre 2026'),
    ('2026-11-09', '2026-11-15', 'Semana del 9 al 15 de Noviembre 2026'),
    ('2026-11-16', '2026-11-22', 'Semana del 16 al 22 de Noviembre 2026'),
    ('2026-11-23', '2026-11-29', 'Semana del 23 al 29 de Noviembre 2026'),
    ('2026-11-30', '2026-12-06', 'Semana del 30 de Noviembre al 6 de Diciembre 2026'),
    ('2026-12-07', '2026-12-13', 'Semana del 7 al 13 de Diciembre 2026'),
    ('2026-12-14', '2026-12-20', 'Semana del 14 al 20 de Diciembre 2026'),
    ('2026-12-21', '2026-12-27', 'Semana del 21 al 27 de Diciembre 2026'),
    ('2026-12-28', '2027-01-03', 'Semana del 28 de Diciembre 2026 al 3 de Enero 2027')
ON CONFLICT DO NOTHING;
