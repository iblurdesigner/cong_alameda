package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Nombre    string    `json:"nombre" db:"nombre"`
	Telefono  *string   `json:"telefono,omitempty" db:"telefono"`
	Email     string    `json:"email" db:"email"`
	Password  string    `json:"-" db:"password"`
	Rol       Rol       `json:"rol" db:"rol"`
	Activo    bool      `json:"activo" db:"activo"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type Rol string

const (
	RolSuperintendente Rol = "SUPERINTENDENTE"
	RolAnciano         Rol = "ANCIANO"
	RolVisitante       Rol = "VISITANTE"
)

func (r Rol) IsValid() bool {
	switch r {
	case RolSuperintendente, RolAnciano, RolVisitante:
		return true
	}
	return false
}

func (r Rol) CanCreateCasa() bool {
	return r == RolSuperintendente
}

func (r Rol) CanUpdateCasa() bool {
	return r == RolSuperintendente
}

func (r Rol) CanDeleteCasa() bool {
	return r == RolSuperintendente
}

func (r Rol) CanCreateVisita() bool {
	return r == RolSuperintendente
}

func (r Rol) CanUpdateVisita() bool {
	return r == RolSuperintendente || r == RolVisitante
}

func (r Rol) CanViewAllCasas() bool {
	return r == RolSuperintendente || r == RolAnciano
}

func (r Rol) CanViewAllVisitas() bool {
	return r == RolSuperintendente || r == RolAnciano
}

func (r Rol) CanViewOwnVisitas() bool {
	return r == RolVisitante
}

func (r Rol) CanReceiveNotifications() bool {
	return r == RolSuperintendente || r == RolAnciano
}
