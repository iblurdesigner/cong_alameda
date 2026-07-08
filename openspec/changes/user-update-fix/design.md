# SDD Design: User Update Persistence Fix

## Backend Changes
### 1. DTO (`backend/internal/dto/responses.go`)
Modify `UpdateUserRequest` to include the `Email` field.
```go
type UpdateUserRequest struct {
    Nombre                 *string `json:"nombre,omitempty"`
    Telefono               *string `json:"telefono,omitempty"`
    TelefonoValidado       *bool   `json:"telefono_validado,omitempty"`
    Email                  *string `json:"email,omitempty"` // Added
    NotificacionesEmail    *bool   `json:"notificaciones_email,omitempty"`
    NotificacionesWhatsapp *bool   `json:"notificaciones_whatsapp,omitempty"`
    Activo                 *bool   `json:"activo,omitempty"`
    Rol                    *string `json:"rol,omitempty"`
}
```

### 2. Handler (`backend/internal/handlers/user_handler.go`)
Update the `Update` method to process the `Email` field.
```go
if req.Email != nil {
    updates["email"] = *req.Email
}
```

### 3. Repository (`backend/internal/repositories/user_repo.go`)
Update the `Update` method's `RETURNING` clause and `Scan` call to include all fields.
```go
query += " RETURNING id, nombre, telefono, telefono_validado, email, password, rol, activo, notificaciones_email, notificaciones_whatsapp, created_at, updated_at"
// ...
err := r.db.QueryRow(ctx, query, args...).Scan(
    &user.ID,
    &user.Nombre,
    &user.Telefono,
    &user.TelefonoValidado,
    &user.Email,
    &user.Password,
    &user.Rol,
    &user.Activo,
    &user.NotificacionesEmail,
    &user.NotificacionesWhatsapp,
    &user.CreatedAt,
    &user.UpdatedAt,
)
```

## Frontend Changes
### 1. Service (`frontend/src/app/core/services/user.service.ts`)
Add `email` to the `UpdateUserRequest` interface.

### 2. Component (`frontend/src/app/features/admin/usuarios/usuarios-list.component.ts`)
Update `saveUser()` to include the email in the payload.
```typescript
const update: UpdateUserRequest = {
  nombre: form.nombre,
  email: form.email, // Added
  telefono: form.telefono || undefined,
  telefono_validado: form.telefono_validado
};
```
