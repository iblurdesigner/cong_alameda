# Password Recovery Specification

## Purpose

Este specification define el sistema de recuperación de contraseña por correo electrónico. Permite a usuarios que olvidan su contraseña restablecer el acceso mediante un enlace temporal enviado por email.

## Requirements

### Requirement: Solicitar Recuperación de Contraseña

El sistema DEBE permitir a un usuario solicitar un enlace de recuperación de contraseña ingresando únicamente su dirección de correo electrónico.

#### Scenario: Solicitud válida

- GIVEN un usuario con email registrado "usuario@test.com"
- WHEN solicita recuperación en `/api/auth/recover-request` con `{"email": "usuario@test.com"}`
- THEN recibe respuesta HTTP 200 con `{"message": "Se envió un enlace de recuperación a tu correo"}`
- AND se envía email con link de recovery a "usuario@test.com"

#### Scenario: Email no registrado

- GIVEN ningún usuario con email "inexistente@test.com"
- WHEN solicita recuperación con `{"email": "inexistente@test.com"}`
- THEN respuesta HTTP 200 (mismo comportamiento que caso válido para prevenir enumeration)
- AND NO se envía email

#### Scenario: Rate limiting

- GIVEN un usuario solicitó recovery para "test@test.com" en los últimos 5 minutos
- WHEN intenta solicitar nuevamente
- THEN recibe HTTP 429 con error "rate_limit_exceeded"

### Requirement: Validar Token de Recuperación

El sistema DEBE validar tokens de recuperación JWT y verificar que no haya expirado.

#### Scenario: Token válido

- GIVEN un JWT válido con claim "password_reset" y expiry 15 minutos
- WHEN endpoint `/api/auth/recover-password` valida el token
- THEN permite cambio de contraseña

#### Scenario: Token expirado

- GIVEN un JWT válido pero con expiry hace más de 15 minutos
- WHEN valida el token
- THEN recibe HTTP 400 con error "token_expired"

#### Scenario: Token inválido

- GIVEN un JWT con formato inválido o sin claim "password_reset"
- WHEN valida el token
- THEN recibe HTTP 400 con error "invalid_token"

### Requirement: Cambiar Contraseña

El sistema DEBE permitir cambiar la contraseña usando token válido.

#### Scenario: Cambio exitoso

- GIVEN un token JWT válido "password_reset" y nueva contraseña "NuevaPass123"
- WHEN envía POST `/api/auth/recover-password` con `{"token": "...", "password": "NuevaPass123"}`
- THEN respuesta HTTP 200 con `{"message": "Contraseña actualizada"}`
- AND la nueva contraseña permite hacer login

#### Scenario: Contraseña débil

- GIVEN token válido y contraseña "123" (menos de 6 caracteres)
- WHEN intenta cambiar contraseña
- THEN HTTP 400 con error "password_too_short"

### Requirement: Email de Recuperación

El sistema DEBE enviar un email con enlace de recuperación que contenga el token JWT.

#### Scenario: Contenido del email

- GIVEN el sistema envía email de recuperación
- WHEN el usuario recibe el email
- THEN contiene subject "Recuperación de Contraseña - Congregación Alameda"
- AND contiene link con formato `{baseUrl}/recovery?token={jwt}`

## ADDED Requirements

### Requirement: Rate Limiting por Email

El sistema DEBE implementar rate limiting para prevenir abuso del endpoint de recuperación.

- GIVEN cualquier solicitud a `/api/auth/recover-request`
- WHEN el mismo email se solicita más de 1 vez en 5 minutos
- THEN responder con HTTP 429 "rate_limit_exceeded"
- AND NO reenviar email

### Requirement: Formato de Token JWT

El token de recuperación DEBE ser un JWT con características específicas.

- GIVEN el sistema genera un token de recuperación
- WHEN crea el JWT
- THEN incluir claim "type": "password_reset"
- AND incluir claim "email": email del usuario
- AND setear expiration a 15 minutos desde generación

### Requirement: Frontend - Link de Recuperación

La página de login DEBE mostrar un enlace para recuperar contraseña.

- GIVEN el usuario está en la página de login
- WHEN visualiza el formulario
- THEN ve enlace/link "Olvidé mi contraseña"
- AND al hacer click navega a `/recovery`

### Requirement: Frontend - Página de Recovery

La página de recovery DEBE permitir al usuario establecer una nueva contraseña.

- GIVEN el usuario accede a `/recovery?token={jwt}`
- WHEN la página carga
- THEN valida que el token sea válido mostrar el formulario
- AND muestra campos "Nueva Contraseña" y "Confirmar Contraseña"
- AND incluye botón "Cambiar Contraseña"

#### Scenario: Token inválido en frontend

- GIVEN el usuario accede a `/recovery?token=invalid`
- WHEN la página intenta usar el token
- THEN muestra error "Token inválido o expirado"
- AND no muestra formulario de contraseña