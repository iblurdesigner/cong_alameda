package dto

import (
	"time"

	"cong-alameda-backend/internal/models"
	"github.com/google/uuid"
)

// CreateProgramaPredicacionRequest represents the payload to create a preaching program.
type CreateProgramaPredicacionRequest struct {
	Nombre           string     `json:"nombre"`
	Fecha            string     `json:"fecha"`
	DiaSemana        int        `json:"dia_semana"`
	DiaSemanaNombre  string     `json:"dia_semana_nombre"`
	Conductor        string     `json:"conductor"`
	HoraInicio       string     `json:"hora_inicio"`
	HoraFin          *string    `json:"hora_fin,omitempty"`
	LugarNombre      *string    `json:"lugar_nombre,omitempty"`
	LugarDireccion   *string    `json:"lugar_direccion,omitempty"`
	LugarCiudad      *string    `json:"lugar_ciudad,omitempty"`
	LugarProvincia   *string    `json:"lugar_provincia,omitempty"`
	LugarCodigoPostal *string   `json:"lugar_codigo_postal,omitempty"`
	LugarPais        *string    `json:"lugar_pais,omitempty"`
	LugarUbicacion   *string    `json:"lugar_ubicacion,omitempty"`
	LugarContacto    *string    `json:"lugar_contacto,omitempty"`
	LugarTelefono    *string    `json:"lugar_telefono,omitempty"`
	GrupoID          *uuid.UUID `json:"grupo_id,omitempty"`
	Territorios      []uuid.UUID `json:"territorios,omitempty"`
}

// UpdateProgramaPredicacionRequest represents the payload to update a preaching program.
// All fields are pointers to distinguish between "not provided" and "empty/zero".
type UpdateProgramaPredicacionRequest struct {
	Nombre           *string    `json:"nombre,omitempty"`
	Fecha            *string    `json:"fecha,omitempty"`
	DiaSemana        *int       `json:"dia_semana,omitempty"`
	DiaSemanaNombre  *string    `json:"dia_semana_nombre,omitempty"`
	Conductor        *string    `json:"conductor,omitempty"`
	HoraInicio       *string    `json:"hora_inicio,omitempty"`
	HoraFin          *string    `json:"hora_fin,omitempty"`
	LugarNombre      *string    `json:"lugar_nombre,omitempty"`
	LugarDireccion   *string    `json:"lugar_direccion,omitempty"`
	LugarCiudad      *string    `json:"lugar_ciudad,omitempty"`
	LugarProvincia   *string    `json:"lugar_provincia,omitempty"`
	LugarCodigoPostal *string   `json:"lugar_codigo_postal,omitempty"`
	LugarPais        *string    `json:"lugar_pais,omitempty"`
	LugarUbicacion   *string    `json:"lugar_ubicacion,omitempty"`
	LugarContacto    *string    `json:"lugar_contacto,omitempty"`
	LugarTelefono    *string    `json:"lugar_telefono,omitempty"`
	GrupoID          *uuid.UUID `json:"grupo_id,omitempty"`
	Territorios      []uuid.UUID `json:"territorios,omitempty"`
}

// ProgramaPredicacionListResponse wraps an array of programs in a data envelope.
type ProgramaPredicacionListResponse struct {
	Data []models.ProgramaPredicacionResponse `json:"data"`
}

// ToProgramaPredicacionResponse converts a model to an API response.
func ToProgramaPredicacionResponse(p *models.ProgramaPredicacion) models.ProgramaPredicacionResponse {
	return models.ProgramaPredicacionResponse{
		ID:               p.ID,
		Nombre:           p.Nombre,
		Fecha:            p.Fecha.Format("2006-01-02"),
		DiaSemana:        p.DiaSemana,
		DiaSemanaNombre:  p.DiaSemanaNombre,
		Conductor:        p.Conductor,
		HoraInicio:       p.HoraInicio,
		HoraFin:          p.HoraFin,
		LugarNombre:      p.LugarNombre,
		LugarDireccion:   p.LugarDireccion,
		LugarCiudad:      p.LugarCiudad,
		LugarProvincia:   p.LugarProvincia,
		LugarCodigoPostal: p.LugarCodigoPostal,
		LugarPais:        p.LugarPais,
		LugarUbicacion:   p.LugarUbicacion,
		LugarContacto:    p.LugarContacto,
		LugarTelefono:    p.LugarTelefono,
		GrupoID:          p.GrupoID,
		CreatedAt:        p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:        p.UpdatedAt.Format(time.RFC3339),
	}
}

// ToProgramaPredicacionListResponse converts a slice of models to a list response.
func ToProgramaPredicacionListResponse(programas []*models.ProgramaPredicacion) ProgramaPredicacionListResponse {
	data := make([]models.ProgramaPredicacionResponse, len(programas))
	for i, p := range programas {
		data[i] = ToProgramaPredicacionResponse(p)
	}
	return ProgramaPredicacionListResponse{Data: data}
}
