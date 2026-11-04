package dto

import "github.com/google/uuid"

type AddPublicadorVyMRequest struct {
	PublicadorID uuid.UUID `json:"publicador_id"`
	Notas        string    `json:"notas"`
}

type UpdatePublicadorVyMRequest struct {
	Activo bool   `json:"activo"`
	Notas  string `json:"notas"`
}

type PublicadorVyMResponse struct {
	ID           uuid.UUID `json:"id"`
	PublicadorID uuid.UUID `json:"publicador_id"`
	Nombres      string    `json:"nombres"`
	Apellidos    string    `json:"apellidos"`
	Celular      *string   `json:"celular,omitempty"`
	Activo       bool      `json:"activo"`
	Notas        *string   `json:"notas,omitempty"`
	CreatedAt    string    `json:"created_at"`
	UpdatedAt    string    `json:"updated_at"`
}

type DisponibilidadVyMResponse struct {
	PublicadorVyMID  string  `json:"publicador_vym_id"`
	PublicadorID     string  `json:"publicador_id"`
	Nombres          string  `json:"nombres"`
	Apellidos        string  `json:"apellidos"`
	Celular          *string `json:"celular,omitempty"`
	Activo           bool    `json:"activo"`
	UltimaAsignacion *string `json:"ultima_asignacion,omitempty"` // ISO date
	SemanasCooldown  int     `json:"semanas_cooldown"`
	Disponible       bool    `json:"disponible"`
	FechaDisponible  *string `json:"fecha_disponible,omitempty"` // ISO date
}

// SyncHistorialRequest se usa al guardar un programa VyM para registrar las asignaciones
type SyncHistorialRequest struct {
	SemanaID    string                 `json:"semana_id"`
	FechaSemana string                 `json:"fecha_semana"` // ISO date YYYY-MM-DD
	Auditorio   []HistorialItemRequest `json:"auditorio"`
	Auxiliar    []HistorialItemRequest `json:"auxiliar"`
}

type HistorialItemRequest struct {
	PublicadorVyMID string `json:"publicador_vym_id"`
	Rol             string `json:"rol"` // "estudiante" | "ayudante"
}
