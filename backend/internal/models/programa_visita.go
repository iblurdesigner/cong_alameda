package models

import (
	"time"

	"github.com/google/uuid"
)

// ProgramaVisita representa un programa de visita personalizado (copia de dia predicacion)
type ProgramaVisita struct {
	ID                    uuid.UUID  `json:"id" db:"id"`
	ProgramaPredicacionID *uuid.UUID `json:"programa_predicacion_id" db:"programa_predicacion_id"`
	Fecha                 string     `json:"fecha" db:"fecha"`
	DiaSemana             int        `json:"dia_semana" db:"dia_semana"`
	Conductor             string     `json:"conductor" db:"conductor"`
	Hora                  string     `json:"hora" db:"hora"`
	LugarNombre           string     `json:"lugar_nombre" db:"lugar_nombre"`
	LugarDireccion        string     `json:"lugar_direccion" db:"lugar_direccion"`
	LugarCiudad           string     `json:"lugar_ciudad" db:"lugar_ciudad"`
	LugarProvincia        string     `json:"lugar_provincia" db:"lugar_provincia"`
	LugarCodigoPostal     string     `json:"lugar_codigo_postal" db:"lugar_codigo_postal"`
	LugarPais             string     `json:"lugar_pais" db:"lugar_pais"`
	LugarContacto         string     `json:"lugar_contacto" db:"lugar_contacto"`
	LugarTelefono         string     `json:"lugar_telefono" db:"lugar_telefono"`
	GrupoID               *uuid.UUID `json:"grupo_id" db:"grupo_id"`
	Observaciones         string     `json:"observaciones" db:"observaciones"`
	Visited               bool       `json:"visited" db:"visited"`
	CreatedBy             *uuid.UUID `json:"created_by" db:"created_by"`
	CreatedAt             time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at" db:"updated_at"`
}

// ProgramaVisitaDetail incluye las entidades relacionadas
type ProgramaVisitaDetail struct {
	ProgramaVisita
	ProgramaPredicacion *ProgramaPredicacion `json:"programa_predicacion,omitempty"`
	Grupo               *Grupo               `json:"grupo,omitempty"`
	Territorios         []*Territorio        `json:"territorios,omitempty"`
}

// Nombres de días para programa de visita (Lunes a Domingo)
var ProgramaVisitaDiaNombres = []string{
	"Lunes",
	"Martes",
	"Miércoles",
	"Jueves",
	"Viernes",
	"Sábado",
	"Domingo",
}

func GetProgramaVisitaDiaNombre(dia int) string {
	if dia >= 0 && dia <= 6 {
		return ProgramaVisitaDiaNombres[dia]
	}
	return "Desconocido"
}
