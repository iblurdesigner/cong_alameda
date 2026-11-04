package models

import (
	"time"

	"github.com/google/uuid"
)

type PublicadorVyM struct {
	ID           uuid.UUID `json:"id"`
	PublicadorID uuid.UUID `json:"publicador_id"`
	Activo       bool      `json:"activo"`
	Notas        *string   `json:"notas,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	// Join fields from publicadores
	Nombres   string  `json:"nombres"`
	Apellidos string  `json:"apellidos"`
	Celular   *string `json:"celular,omitempty"`
}

func (p *PublicadorVyM) NombreCompleto() string {
	if p.Apellidos == "" {
		return p.Nombres
	}
	if p.Nombres == "" {
		return p.Apellidos
	}
	return p.Nombres + " " + p.Apellidos
}

type HistorialSeamosMaestros struct {
	ID              uuid.UUID `json:"id"`
	PublicadorVyMID uuid.UUID `json:"publicador_vym_id"`
	SemanaID        uuid.UUID `json:"semana_id"`
	FechaSemana     time.Time `json:"fecha_semana"`
	Rol             string    `json:"rol"`  // "estudiante" | "ayudante"
	Sala            string    `json:"sala"` // "auditorio" | "auxiliar"
	CreatedAt       time.Time `json:"created_at"`
}

// DisponibilidadVyM representa el estado de disponibilidad de un publicador para Seamos Mejores Maestros
type DisponibilidadVyM struct {
	PublicadorVyMID  uuid.UUID  `json:"publicador_vym_id"`
	PublicadorID     uuid.UUID  `json:"publicador_id"`
	Nombres          string     `json:"nombres"`
	Apellidos        string     `json:"apellidos"`
	Celular          *string    `json:"celular,omitempty"`
	Activo           bool       `json:"activo"`
	UltimaAsignacion *time.Time `json:"ultima_asignacion,omitempty"` // fecha_semana de la última vez como estudiante
	SemanasCooldown  int        `json:"semanas_cooldown"`            // semanas transcurridas desde la última asignación
	Disponible       bool       `json:"disponible"`                  // true si han pasado >= 6 semanas
	FechaDisponible  *time.Time `json:"fecha_disponible,omitempty"`  // cuándo estará disponible si no lo está
}
