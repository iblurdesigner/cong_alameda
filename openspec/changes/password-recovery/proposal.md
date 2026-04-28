# Proposal: Password Recovery

## Intent

Agregar funcionalidad de recuperación de contraseña por correo electrónico para usuarios que olvidan su clave de acceso. El sistema enviará un link temporal válido por 15 minutos que permite establecer una nueva contraseña.

## Scope

### In Scope
- Endpoint backend para solicitar recuperación (POST /api/auth/recover-request)
- Endpoint backend para validate token y cambiar password (POST /api/auth/recover-password)
- Frontend: link "Olvidé mi contraseña" en login
- Frontend: página de recovery con form nueva contraseña
- Envío de email con link de recuperación usando SMTP existente

### Out of Scope
- Notificaciones por SMS (solo email)
- Historial de tokens usados (no se persisted)
- Invalidación manual de tokens antes de expiry
- Autenticación multifactor

## Capabilities

### New Capabilities
- `password-recovery`: Sistema completo de recuperación de contraseña por email, incluyendo solicitud de recovery, validación de token JWT temporal, y cambio de contraseña

### Modified Capabilities
- `user-auth`: Se modifica el flujo de autenticación para incluir opción de recovery

## Approach

1. Backend genera JWT temporal con claim especial "password_reset" y expiry 15min
2. Envía email con link: `/{app-base}/recovery?token={jwt}`
3. Frontend parsea token del URL, muestra form nueva contraseña
4. Backend valida JWT con claim correcto y actualiza password hasheado

Usar JWT existente (`pkg/jwt`) conClaims personalizados. Reutilizar `NotificationService` existente.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/internal/handlers/auth_handler.go` | Modified | Agregar endpoints recover-request y recover-password |
| `backend/internal/services/user_service.go` | Modified | Agregar método GenerateResetToken, UpdatePassword |
| `backend/internal/dto/responses.go` | Modified | Agregar DTOs para requests y responses de recovery |
| `frontend/src/app/features/auth/login/login.component.ts` | Modified | Agregar link "Olvidé mi contraseña" |
| `frontend/src/app/features/auth/recovery/` | New | pagina de recovery component |
| `frontend/src/app/core/services/auth.service.ts` | Modified | Agregar métodos para recovery |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SMTP no disponible | Low | Logging detallado, fallback message |
| Rate limiting abuso | Medium | Agregar simple rate limit (1 request/email/5min) en handler |
| Token en URL visible | Low | Usar HTTPS en producción, breve expiry |

## Rollback Plan

- Revertir cambios en auth_handler.go
- Eliminar nuevos endpoints
- Frontend: remover link y ruta de recovery
- No requiere migración de DB (sin cambios persistentes)

## Dependencies

- SMTP configurado en `notification_service.go` (ya existe)
- JWT package en `pkg/jwt` (ya existe)

## Success Criteria

- [ ] Usuario puede solicitar recovery ingresando solo email
- [ ] Email con link llega al inbox del usuario
- [ ] Link es válido por 15 minutos
- [ ] Nueva contraseña se guarda hasheada correctamente
- [ ] Usuario puede hacer login con nueva contraseña
- [ ] Rate limiting previene spam de emails