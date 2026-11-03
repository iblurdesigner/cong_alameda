-- Migration to insert or reset default SUPER_ADMIN user
-- Email: davidisaac.floresmedrano@gmail.com
-- Password: admin7Blur
-- Verified bcrypt hash for "admin7Blur":
-- $2a$10$K/tFg5CrW4S7t8dfmbOiX.yLc1KSsaHGL3GXZZxhNpTMIS9g7WCBe

INSERT INTO users (
    id,
    nombre,
    telefono,
    telefono_validado,
    email,
    password,
    rol,
    activo,
    notificaciones_email,
    notificaciones_whatsapp,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    'David Flores',
    '0999999999',
    true,
    'davidisaac.floresmedrano@gmail.com',
    '$2a$10$K/tFg5CrW4S7t8dfmbOiX.yLc1KSsaHGL3GXZZxhNpTMIS9g7WCBe',
    'SUPER_ADMIN',
    true,
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = '$2a$10$K/tFg5CrW4S7t8dfmbOiX.yLc1KSsaHGL3GXZZxhNpTMIS9g7WCBe',
    rol = 'SUPER_ADMIN',
    activo = true,
    updated_at = NOW();
