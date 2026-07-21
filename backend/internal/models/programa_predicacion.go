package models

import (
	"time"

	"github.com/google/uuid"
)

// ProgramaPredicacion represents a preaching program entry.
type ProgramaPredicacion struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	Nombre           string     `json:"nombre" db:"nombre"`
	Fecha            time.Time  `json:"fecha" db:"fecha"`
	DiaSemana        int        `json:"dia_semana" db:"dia_semana"`
	DiaSemanaNombre  string     `json:"dia_semana_nombre" db:"dia_semana_nombre"`
	Conductor        string     `json:"conductor" db:"conductor"`
	HoraInicio       string     `json:"hora_inicio" db:"hora_inicio"`
	HoraFin          *string    `json:"hora_fin,omitempty" db:"hora_fin"`
	LugarNombre      *string    `json:"lugar_nombre,omitempty" db:"lugar_nombre"`
	LugarDireccion   *string    `json:"lugar_direccion,omitempty" db:"lugar_direccion"`
	LugarCiudad      *string    `json:"lugar_ciudad,omitempty" db:"lugar_ciudad"`
	LugarProvincia   *string    `json:"lugar_provincia,omitempty" db:"lugar_provincia"`
	LugarCodigoPostal *string   `json:"lugar_codigo_postal,omitempty" db:"lugar_codigo_postal"`
	LugarPais        *string    `json:"lugar_pais,omitempty" db:"lugar_pais"`
	LugarUbicacion   *string    `json:"lugar_ubicacion,omitempty" db:"lugar_ubicacion"`
	LugarContacto    *string    `json:"lugar_contacto,omitempty" db:"lugar_contacto"`
	LugarTelefono    *string    `json:"lugar_telefono,omitempty" db:"lugar_telefono"`
	GrupoID          *uuid.UUID `json:"grupo_id,omitempty" db:"grupo_id"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}

// GrupoSimple is a lightweight representation of a grupo for nested responses.
type GrupoSimple struct {
	ID     uuid.UUID `json:"id"`
	Nombre string    `json:"nombre"`
	Numero int       `json:"numero"`
}

// TerritorioSimple is a lightweight representation of a territorio for nested responses.
type TerritorioSimple struct {
	ID     uuid.UUID `json:"id"`
	Nombre string    `json:"nombre"`
}

// ProgramaPredicacionResponse is the API response shape for a preaching program.
type ProgramaPredicacionResponse struct {
	ID               uuid.UUID          `json:"id"`
	Nombre           string             `json:"nombre"`
	Fecha            string             `json:"fecha"`
	DiaSemana        int                `json:"dia_semana"`
	DiaSemanaNombre  string             `json:"dia_semana_nombre"`
	Conductor        string             `json:"conductor"`
	HoraInicio       string             `json:"hora_inicio"`
	HoraFin          *string            `json:"hora_fin,omitempty"`
	LugarNombre      *string            `json:"lugar_nombre,omitempty"`
	LugarDireccion   *string            `json:"lugar_direccion,omitempty"`
	LugarCiudad      *string            `json:"lugar_ciudad,omitempty"`
	LugarProvincia   *string            `json:"lugar_provincia,omitempty"`
	LugarCodigoPostal *string           `json:"lugar_codigo_postal,omitempty"`
	LugarPais        *string            `json:"lugar_pais,omitempty"`
	LugarUbicacion   *string            `json:"lugar_ubicacion,omitempty"`
	LugarContacto    *string            `json:"lugar_contacto,omitempty"`
	LugarTelefono    *string            `json:"lugar_telefono,omitempty"`
	GrupoID          *uuid.UUID         `json:"grupo_id,omitempty"`
	Grupo            *GrupoSimple       `json:"grupo,omitempty"`
	Territorios      []TerritorioSimple `json:"territorios,omitempty"`
	CreatedAt        string             `json:"created_at"`
	UpdatedAt        string             `json:"updated_at"`
}
