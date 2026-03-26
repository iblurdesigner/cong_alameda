package models

import (
	"time"

	"github.com/google/uuid"
)

// TipoAsignacion represents the type of assignment (usher, parking, microphone, platform)
type TipoAsignacion struct {
	ID          uuid.UUID `json:"id"`
	Nombre      string    `json:"nombre"`
	Descripcion *string   `json:"descripcion,omitempty"`
	Icono       *string   `json:"icono,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// AsignacionSemanal represents a weekly internal assignment
type AsignacionSemanal struct {
	ID               uuid.UUID  `json:"id"`
	SemanaID         uuid.UUID  `json:"semana_id"`
	TipoAsignacionID uuid.UUID  `json:"tipo_asignacion_id"`
	UserID           *uuid.UUID `json:"user_id,omitempty"`
	GrupoID          *uuid.UUID `json:"grupo_id,omitempty"`
	DiaSemana        int        `json:"dia_semana"`
	Observaciones    *string    `json:"observaciones,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// AsignacionDetail includes related data
type AsignacionDetail struct {
	AsignacionSemanal
	TipoAsignacion *TipoAsignacion `json:"tipo_asignacion,omitempty"`
	User           *User           `json:"user,omitempty"`
	Grupo          *Grupo          `json:"grupo,omitempty"`
	Semana         *SemanaVisita   `json:"semana,omitempty"`
}

// SemanaConAsignaciones includes all assignments for a week
type SemanaConAsignaciones struct {
	SemanaVisita
	Asignaciones []*AsignacionDetail `json:"asignaciones"`
	Dias         []*DiaSemana        `json:"dias"`
}

// ConfigNotificacion represents WhatsApp notification configuration
type ConfigNotificacion struct {
	ID              uuid.UUID `json:"id"`
	Tipo            string    `json:"tipo"`
	Enabled         bool      `json:"enabled"`
	DiasAntes       int       `json:"dias_antes"`
	HoraEnvio       string    `json:"hora_envio"`
	MensajeTemplate *string   `json:"mensaje_template,omitempty"`
	UpdatedAt       time.Time `json:"updated_at"`
}
