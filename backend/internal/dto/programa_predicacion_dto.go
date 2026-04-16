package dto

import "github.com/google/uuid"

// ProgramaPredicacionRequest represents the request to create/update a programa de prédicación
type ProgramaPredicacionRequest struct {
	Nombre            string     `json:"nombre"`
	Fecha             string     `json:"fecha"`
	DiaSemana         any        `json:"dia_semana"` // Can be int or string from frontend
	Conductor         string     `json:"conductor"`
	HoraInicio        string     `json:"hora_inicio"`
	HoraFin           string     `json:"hora_fin"`
	LugarNombre       string     `json:"lugar_nombre"`
	LugarDireccion    string     `json:"lugar_direccion"`
	LugarCiudad       string     `json:"lugar_ciudad"`
	LugarProvincia    string     `json:"lugar_provincia"`
	LugarCodigoPostal string     `json:"lugar_codigo_postal"`
	LugarPais         string     `json:"lugar_pais"`
	LugarContacto     string     `json:"lugar_contacto"`
	LugarTelefono     string     `json:"lugar_telefono"`
	GrupoID           *uuid.UUID `json:"grupo_id"`
	TerritorioIDs     []string   `json:"territorio_ids"` // Multiple territories
}

// GrupoSimple represents a simple grupo response
type GrupoSimple struct {
	ID     string `json:"id"`
	Numero int    `json:"numero"`
	Nombre string `json:"nombre"`
}

// TerritorioSimple represents a simple territorio response
type TerritorioSimple struct {
	ID      string `json:"id"`
	Nombre  string `json:"nombre"`
	GrupoID string `json:"grupo_id"`
}

// ProgramaPredicacionResponse represents the response for a programa de prédicación
type ProgramaPredicacionResponse struct {
	ID                string              `json:"id"`
	Nombre            string              `json:"nombre"`
	Fecha             string              `json:"fecha"`
	DiaSemana         int                 `json:"dia_semana"`
	DiaSemanaNombre   string              `json:"dia_semana_nombre"`
	Conductor         string              `json:"conductor"`
	HoraInicio        string              `json:"hora_inicio"`
	HoraFin           string              `json:"hora_fin"`
	LugarNombre       string              `json:"lugar_nombre"`
	LugarDireccion    string              `json:"lugar_direccion"`
	LugarCiudad       string              `json:"lugar_ciudad"`
	LugarProvincia    string              `json:"lugar_provincia"`
	LugarCodigoPostal string              `json:"lugar_codigo_postal"`
	LugarPais         string              `json:"lugar_pais"`
	LugarContacto     string              `json:"lugar_contacto"`
	LugarTelefono     string              `json:"lugar_telefono"`
	Grupo             *GrupoSimple        `json:"grupo,omitempty"`
	Territorios       []*TerritorioSimple `json:"territorios,omitempty"`
	CreatedAt         string              `json:"created_at"`
	UpdatedAt         string              `json:"updated_at"`
}
