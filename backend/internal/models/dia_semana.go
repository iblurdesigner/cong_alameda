package models

import (
	"time"

	"github.com/google/uuid"
)

type DiaSemana struct {
	ID                 uuid.UUID  `json:"id" db:"id"`
	SemanaID           uuid.UUID  `json:"semana_id" db:"semana_id"`
	DiaSemana          int        `json:"dia_semana" db:"dia_semana"` // 0=Lunes, 6=Domingo
	TerritorioMananaID *uuid.UUID `json:"territorio_manana_id,omitempty" db:"territorio_manana_id"`
	TerritorioTardeID  *uuid.UUID `json:"territorio_tarde_id,omitempty" db:"territorio_tarde_id"`
	GrupoAsignadoID    *uuid.UUID `json:"grupo_asignado_id,omitempty" db:"grupo_asignado_id"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
}

// DiaSemanaDetail incluye las entidades relacionadas
type DiaSemanaDetail struct {
	DiaSemana
	TerritorioManana *Territorio `json:"territorio_manana,omitempty"`
	TerritorioTarde  *Territorio `json:"territorio_tarde,omitempty"`
	GrupoAsignado    *Grupo      `json:"grupo_asignado,omitempty"`
}

// Nombres de días
var DiaSemanaNombres = []string{
	"Lunes",
	"Martes",
	"Miércoles",
	"Jueves",
	"Viernes",
	"Sábado",
	"Domingo",
}

func GetDiaSemanaNombre(dia int) string {
	if dia >= 0 && dia <= 6 {
		return DiaSemanaNombres[dia]
	}
	return "Desconocido"
}
