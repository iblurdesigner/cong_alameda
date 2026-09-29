package dto

import (
	"time"

	"github.com/google/uuid"
)

type CreatePublicadorRequest struct {
	Nombres                      string     `json:"nombres"`
	Apellidos                    string     `json:"apellidos"`
	Nombre                       string     `json:"nombre,omitempty"` // Opcional para retrocompatibilidad
	Celular                      *string    `json:"celular,omitempty"`
	Telefono                     *string    `json:"telefono,omitempty"`
	Email                        *string    `json:"email,omitempty"`
	Domicilio                    *string    `json:"domicilio,omitempty"`
	GrupoID                      *uuid.UUID `json:"grupo_id,omitempty"`
	ContactoEmergenciaNombre     *string    `json:"contacto_emergencia_nombre,omitempty"`
	ContactoEmergenciaTelefono   *string    `json:"contacto_emergencia_telefono,omitempty"`
	ContactoEmergenciaParentesco *string    `json:"contacto_emergencia_parentesco,omitempty"`
	Observaciones                *string    `json:"observaciones,omitempty"`
	Activo                       *bool      `json:"activo,omitempty"`
	UserID                       *uuid.UUID `json:"user_id,omitempty"`
}

type UpdatePublicadorRequest struct {
	Nombres                      *string    `json:"nombres,omitempty"`
	Apellidos                    *string    `json:"apellidos,omitempty"`
	Nombre                       *string    `json:"nombre,omitempty"`
	Celular                      *string    `json:"celular,omitempty"`
	Telefono                     *string    `json:"telefono,omitempty"`
	Email                        *string    `json:"email,omitempty"`
	Domicilio                    *string    `json:"domicilio,omitempty"`
	GrupoID                      *uuid.UUID `json:"grupo_id,omitempty"`
	ContactoEmergenciaNombre     *string    `json:"contacto_emergencia_nombre,omitempty"`
	ContactoEmergenciaTelefono   *string    `json:"contacto_emergencia_telefono,omitempty"`
	ContactoEmergenciaParentesco *string    `json:"contacto_emergencia_parentesco,omitempty"`
	Observaciones                *string    `json:"observaciones,omitempty"`
	Activo                       *bool      `json:"activo,omitempty"`
	UserID                       *uuid.UUID `json:"user_id,omitempty"`
}

type PublicadorResponse struct {
	ID                           uuid.UUID  `json:"id"`
	Nombres                      string     `json:"nombres"`
	Apellidos                    string     `json:"apellidos"`
	Nombre                       string     `json:"nombre"` // Nombre completo (ej: "David Alameda")
	Celular                      *string    `json:"celular,omitempty"`
	Telefono                     *string    `json:"telefono,omitempty"`
	Email                        *string    `json:"email,omitempty"`
	Domicilio                    *string    `json:"domicilio,omitempty"`
	GrupoID                      *uuid.UUID `json:"grupo_id,omitempty"`
	GrupoNumero                  *int       `json:"grupo_numero,omitempty"`
	GrupoNombre                  *string    `json:"grupo_nombre,omitempty"`
	ContactoEmergenciaNombre     *string    `json:"contacto_emergencia_nombre,omitempty"`
	ContactoEmergenciaTelefono   *string    `json:"contacto_emergencia_telefono,omitempty"`
	ContactoEmergenciaParentesco *string    `json:"contacto_emergencia_parentesco,omitempty"`
	Observaciones                *string    `json:"observaciones,omitempty"`
	Activo                       bool       `json:"activo"`
	UserID                       *uuid.UUID `json:"user_id,omitempty"`
	CreatedAt                    time.Time  `json:"created_at"`
	UpdatedAt                    time.Time  `json:"updated_at"`
}
