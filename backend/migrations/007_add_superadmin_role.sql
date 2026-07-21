-- Migration: 007_add_superadmin_role.sql
-- Description: Add SUPER_ADMIN role and create initial admin user

-- Add SUPER_ADMIN to the rol enum
ALTER TYPE rol ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- Add telefono_validado field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefono_validado BOOLEAN NOT NULL DEFAULT false;

-- Add notification preferences fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS notificaciones_email BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notificaciones_whatsapp BOOLEAN NOT NULL DEFAULT false;

-- Insert David as SUPER_ADMIN (password will be set to 'admin123' - should be changed on first login)
-- Using bcrypt hash for 'admin123'
-- This hash corresponds to the plaintext password 'admin123'
INSERT INTO users (id, nombre, telefono, email, password, rol, activo, telefono_validado, notificaciones_email, notificaciones_whatsapp)
VALUES (
    uuid_generate_v4(),
    'David Flores',
    '+593983502111',
    'davidisaac.floresmedrano@gmail.com',
    '$2a$10$nNi9WaI502zAH/D771GsGu5A..IPgbxB34.7DoVssdUIBdlDr0LEm',
    'SUPER_ADMIN',
    true,
    true,
    true,
    false
) ON CONFLICT (email) DO UPDATE SET
    rol = 'SUPER_ADMIN',
    activo = true,
    telefono = '+593983502111',
    telefono_validado = true;
