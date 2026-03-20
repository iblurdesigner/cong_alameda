package models

import (
	"time"

	"github.com/google/uuid"
)

type Visita struct {
	ID                    uuid.UUID    `json:"id" db:"id"`
	CasaID                uuid.UUID    `json:"casa_id" db:"casa_id"`
	FechaProgramada       time.Time    `json:"fecha_programada" db:"fecha_programada"`
	FechaRealizada        *time.Time   `json:"fecha_realizada,omitempty" db:"fecha_realizada"`
	Visitante1ID          uuid.UUID    `json:"visitante_1_id" db:"visitante_1_id"`
	Visitante2ID          uuid.UUID    `json:"visitante_2_id" db:"visitante_2_id"`
	Observaciones         *string      `json:"observaciones,omitempty" db:"observaciones"`
	DeseaSeguirRecibiendo *bool        `json:"desea_seguir_recibiendo,omitempty" db:"desea_seguir_recibiendo"`
	Estado                VisitaEstado `json:"estado" db:"estado"`
	CreatedAt             time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time    `json:"updated_at" db:"updated_at"`
}

type VisitaEstado string

const (
	VisitaEstadoProgramada VisitaEstado = "PROGRAMADA"
	VisitaEstadoRealizada  VisitaEstado = "REALIZADA"
	VisitaEstadoCancelada  VisitaEstado = "CANCELADA"
)

func (e VisitaEstado) IsValid() bool {
	switch e {
	case VisitaEstadoProgramada, VisitaEstadoRealizada, VisitaEstadoCancelada:
		return true
	}
	return false
}

func (e VisitaEstado) String() string {
	switch e {
	case VisitaEstadoProgramada:
		return "Programada"
	case VisitaEstadoRealizada:
		return "Realizada"
	case VisitaEstadoCancelada:
		return "Cancelada"
	default:
		return string(e)
	}
}

// VisitaDetail incluye información de la casa y los visitantes
type VisitaDetail struct {
	Visita
	Casa       *Casa `json:"casa,omitempty"`
	Visitante1 *User `json:"visitante_1,omitempty"`
	Visitante2 *User `json:"visitante_2,omitempty"`
}
