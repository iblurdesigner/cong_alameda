package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Publicador representa a un miembro de la congregación Alameda en el directorio
type Publicador struct {
	ID                           uuid.UUID  `json:"id" db:"id"`
	Nombres                      string     `json:"nombres" db:"nombres"`
	Apellidos                    string     `json:"apellidos" db:"apellidos"`
	Celular                      *string    `json:"celular,omitempty" db:"celular"`
	Telefono                     *string    `json:"telefono,omitempty" db:"telefono"`
	Email                        *string    `json:"email,omitempty" db:"email"`
	Domicilio                    *string    `json:"domicilio,omitempty" db:"domicilio"`
	GrupoID                      *uuid.UUID `json:"grupo_id,omitempty" db:"grupo_id"`
	ContactoEmergenciaNombre     *string    `json:"contacto_emergencia_nombre,omitempty" db:"contacto_emergencia_nombre"`
	ContactoEmergenciaTelefono   *string    `json:"contacto_emergencia_telefono,omitempty" db:"contacto_emergencia_telefono"`
	ContactoEmergenciaParentesco *string    `json:"contacto_emergencia_parentesco,omitempty" db:"contacto_emergencia_parentesco"`
	Observaciones                *string    `json:"observaciones,omitempty" db:"observaciones"`
	Activo                       bool       `json:"activo" db:"activo"`
	UserID                       *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	CreatedAt                    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt                    time.Time  `json:"updated_at" db:"updated_at"`

	// Campos adicionales para joins con la tabla grupos
	GrupoNumero                  *int       `json:"grupo_numero,omitempty" db:"grupo_numero"`
	GrupoNombre                  *string    `json:"grupo_nombre,omitempty" db:"grupo_nombre"`
}

// NombreCompleto devuelve el nombre compuesto del publicador
func (p *Publicador) NombreCompleto() string {
	if p.Apellidos == "" {
		return p.Nombres
	}
	if p.Nombres == "" {
		return p.Apellidos
	}
	return p.Nombres + " " + p.Apellidos
}

// Validate comprueba las reglas básicas de negocio de un publicador
func (p *Publicador) Validate() error {
	if p.Nombres == "" {
		return errors.New("los nombres del publicador son obligatorios")
	}
	if p.Apellidos == "" {
		return errors.New("los apellidos del publicador son obligatorios")
	}
	return nil
}
