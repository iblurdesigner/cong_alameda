package models

import (
	"time"

	"github.com/google/uuid"
)

type SemanaVisita struct {
	ID          uuid.UUID `json:"id" db:"id"`
	FechaInicio time.Time `json:"fecha_inicio" db:"fecha_inicio"`
	FechaFin    time.Time `json:"fecha_fin" db:"fecha_fin"`
	Nombre      *string   `json:"nombre,omitempty" db:"nombre"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// SemanaDetail incluye los días de la semana
type SemanaDetail struct {
	SemanaVisita
	Dias []*DiaSemana `json:"dias,omitempty"`
}
