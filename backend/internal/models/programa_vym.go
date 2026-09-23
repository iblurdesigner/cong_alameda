package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// MinistryItem representa una asignación dentro de "Seamos Mejores Maestros"
type MinistryItem struct {
	Type      string `json:"type"`      // ej: "Asignación", "Lectura", "Primera conversación"
	Title     string `json:"title"`     // ej: "Primera conversación"
	Time      string `json:"time"`      // ej: "3 mins."
	Student   string `json:"student"`   // ej: "Hermano A / Hermano B"
	StartTime string `json:"startTime"` // ej: "19:30"
}

// ChristianLifeItem representa una parte dentro de "Nuestra Vida Cristiana"
type ChristianLifeItem struct {
	Title     string `json:"title"`     // ej: "Necesidades locales"
	Time      string `json:"time"`      // ej: "15 mins."
	Speaker   string `json:"speaker"`   // ej: "Hermano C"
	StartTime string `json:"startTime"` // ej: "19:54"
}

// ProgramaVyM representa el programa semanal completo de Vida y Ministerio
type ProgramaVyM struct {
	ID                      uuid.UUID       `json:"id"`
	SemanaID                uuid.UUID       `json:"semana_id"`
	NombreCongregacion      string          `json:"nombre_congregacion"`
	LecturaSemanal          string          `json:"lectura_semanal"`
	Presidente              string          `json:"presidente"`
	ConsejeroAuxiliar       string          `json:"consejero_auxiliar"`
	CancionInicio           string          `json:"cancion_inicio"`
	HoraCancionInicio       string          `json:"hora_cancion_inicio"`
	OracionInicio           string          `json:"oracion_inicio"`
	HoraOracionInicio       string          `json:"hora_oracion_inicio"`
	TesorosTitulo           string          `json:"tesoros_titulo"`
	TesorosTiempo           string          `json:"tesoros_tiempo"`
	TesorosDiscursante      string          `json:"tesoros_discursante"`
	PerlasTiempo            string          `json:"perlas_tiempo"`
	PerlasDiscursante       string          `json:"perlas_discursante"`
	LecturaTiempo           string          `json:"lectura_tiempo"`
	LecturaEstudiante       string          `json:"lectura_estudiante"`
	CancionMedio            string          `json:"cancion_medio"`
	CancionMedioTiempo      string          `json:"cancion_medio_tiempo"`
	EstudioConductor        string          `json:"estudio_conductor"`
	EstudioLector           string          `json:"estudio_lector"`
	EstudioTiempo           string          `json:"estudio_tiempo"`
	ConclusionTiempo        string          `json:"conclusion_tiempo"`
	CancionFin              string          `json:"cancion_fin"`
	CancionFinTiempo        string          `json:"cancion_fin_tiempo"`
	OracionFin              string          `json:"oracion_fin"`
	SeamosMaestrosAuditorio json.RawMessage `json:"seamos_maestros_auditorio"`
	SeamosMaestrosAuxiliar  json.RawMessage `json:"seamos_maestros_auxiliar"`
	VidaCristianaPartes     json.RawMessage `json:"vida_cristiana_partes"`
	CreatedAt               time.Time       `json:"created_at"`
	UpdatedAt               time.Time       `json:"updated_at"`
}
