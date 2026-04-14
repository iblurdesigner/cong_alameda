package dto

import "github.com/google/uuid"

// ProgramaVisitaRequest representa el request para crear/actualizar un programa de visita
type ProgramaVisitaRequest struct {
	ProgramaPredicacionID *uuid.UUID `json:"programa_predicacion_id"`
	Fecha                 string     `json:"fecha"`
	DiaSemana             int        `json:"dia_semana"`
	Conductor             string     `json:"conductor"`
	Hora                  string     `json:"hora"`
	LugarNombre           string     `json:"lugar_nombre"`
	LugarDireccion        string     `json:"lugar_direccion"`
	LugarContacto         string     `json:"lugar_contacto"`
	LugarTelefono         string     `json:"lugar_telefono"`
	GrupoID               *uuid.UUID `json:"grupo_id"`
	Observaciones         string     `json:"observaciones"`
	Visited               bool       `json:"visited"`
	TerritorioIDs         []string   `json:"territorio_ids"`
}

// ProgramaVisitaResponse representa la respuesta de un programa de visita
// Reutiliza GrupoSimple y TerritorioSimple de programa_predicacion_dto.go
type ProgramaVisitaResponse struct {
	ID                    string              `json:"id"`
	ProgramaPredicacionID *string             `json:"programa_predicacion_id,omitempty"`
	Fecha                 string              `json:"fecha"`
	DiaSemana             int                 `json:"dia_semana"`
	DiaSemanaNombre       string              `json:"dia_semana_nombre"`
	Conductor             string              `json:"conductor"`
	Hora                  string              `json:"hora"`
	LugarNombre           string              `json:"lugar_nombre"`
	LugarDireccion        string              `json:"lugar_direccion"`
	LugarContacto         string              `json:"lugar_contacto"`
	LugarTelefono         string              `json:"lugar_telefono"`
	Grupo                 *GrupoSimple        `json:"grupo,omitempty"`
	Territorios           []*TerritorioSimple `json:"territorios,omitempty"`
	Observaciones         string              `json:"observaciones"`
	Visited               bool                `json:"visited"`
	CreatedAt             string              `json:"created_at"`
	UpdatedAt             string              `json:"updated_at"`
}
