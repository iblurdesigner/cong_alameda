package models

import (
	"time"

	"github.com/google/uuid"
)

type Grupo struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Nombre      string    `json:"nombre" db:"nombre"`
	Numero      int       `json:"numero" db:"numero"`
	Descripcion *string   `json:"descripcion,omitempty" db:"descripcion"`
	Activo      bool      `json:"activo" db:"activo"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// GrupoDetail incluye los territorios asociados
type GrupoDetail struct {
	Grupo
	Territorios []*Territorio `json:"territorios,omitempty"`
}
