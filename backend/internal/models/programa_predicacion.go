package models

import (
	"time"

	"github.com/google/uuid"
)

// ProgramaPredicacion representa un programa de prédicación por día
type ProgramaPredicacion struct {
	ID         uuid.UUID `json:"id" db:"id"`
	Nombre     string    `json:"nombre" db:"nombre"`
	Fecha      string    `json:"fecha" db:"fecha"`           // Fecha del programa
	DiaSemana  int       `json:"dia_semana" db:"dia_semana"` // 0=Lunes, 6=Domingo
	Conductor  string    `json:"conductor" db:"conductor"`
	HoraInicio string    `json:"hora_inicio" db:"hora_inicio"`
	HoraFin    string    `json:"hora_fin" db:"hora_fin"`
	// Lugar de prédicación
	LugarNombre       string `json:"lugar_nombre" db:"lugar_nombre"`
	LugarDireccion    string `json:"lugar_direccion" db:"lugar_direccion"`
	LugarCiudad       string `json:"lugar_ciudad" db:"lugar_ciudad"`
	LugarProvincia    string `json:"lugar_provincia" db:"lugar_provincia"`
	LugarCodigoPostal string `json:"lugar_codigo_postal" db:"lugar_codigo_postal"`
	LugarPais         string `json:"lugar_pais" db:"lugar_pais"`
	LugarContacto     string `json:"lugar_contacto" db:"lugar_contacto"`
	LugarTelefono     string `json:"lugar_telefono" db:"lugar_telefono"`
	// Grupo asignado (para información)
	GrupoID   *uuid.UUID `json:"grupo_id" db:"grupo_id"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
}

// ProgramaPredicacionTerritorio es la relación muchos a muchos
type ProgramaPredicacionTerritorio struct {
	ID                    uuid.UUID `json:"id" db:"id"`
	ProgramaPredicacionID uuid.UUID `json:"programa_predicacion_id" db:"programa_predicacion_id"`
	TerritorioID          uuid.UUID `json:"territorio_id" db:"territorio_id"`
	Orden                 int       `json:"orden" db:"orden"` // Para ordenar los territorios
	CreatedAt             time.Time `json:"created_at" db:"created_at"`
}

// ProgramaPredicacionDetail incluye las entidades relacionadas
type ProgramaPredicacionDetail struct {
	ProgramaPredicacion
	Grupo       *Grupo        `json:"grupo,omitempty"`
	Territorios []*Territorio `json:"territorios,omitempty"`
}

// Nombres de días para programa de prédicación (Lunes a Domingo)
var ProgramaDiaNombres = []string{
	"Lunes",
	"Martes",
	"Miércoles",
	"Jueves",
	"Viernes",
	"Sábado",
	"Domingo",
}

// DefaultLugaresPredicacion es el lugar por defecto por día de la semana
var DefaultLugaresPredicacion = map[int]map[string]string{
	0: { // Lunes
		"nombre":    "Salón del Reino",
		"direccion": "Av. Principal 123",
		"contacto":  "Brother Juan Pérez",
		"telefono":  "555-1234",
	},
	1: { // Martes
		"nombre":    "Salón del Reino",
		"direccion": "Av. Principal 123",
		"contacto":  "Brother Juan Pérez",
		"telefono":  "555-1234",
	},
	2: { // Miércoles
		"nombre":    "Salón del Reino",
		"direccion": "Av. Principal 123",
		"contacto":  "Brother Juan Pérez",
		"telefono":  "555-1234",
	},
	3: { // Jueves
		"nombre":    "Salón del Reino",
		"direccion": "Av. Principal 123",
		"contacto":  "Brother Juan Pérez",
		"telefono":  "555-1234",
	},
	4: { // Viernes
		"nombre":    "Salón del Reino",
		"direccion": "Av. Principal 123",
		"contacto":  "Brother Juan Pérez",
		"telefono":  "555-1234",
	},
	5: { // Sábado
		"nombre":    "Salón del Reino",
		"direccion": "Av. Principal 123",
		"contacto":  "Brother Juan Pérez",
		"telefono":  "555-1234",
	},
	6: { // Domingo
		"nombre":    "Salón del Reino",
		"direccion": "Av. Principal 123",
		"contacto":  "Brother Juan Pérez",
		"telefono":  "555-1234",
	},
}

func GetProgramaDiaNombre(dia int) string {
	if dia >= 0 && dia <= 6 {
		return ProgramaDiaNombres[dia]
	}
	return "Desconocido"
}
