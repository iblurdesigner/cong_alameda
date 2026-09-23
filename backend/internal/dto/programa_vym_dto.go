package dto

import (
	"encoding/json"

	"github.com/google/uuid"
)

// UpsertProgramaVyMRequest representa la solicitud de creación o actualización de un programa
type UpsertProgramaVyMRequest struct {
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
}

// ProgramaVyMResponse representa la respuesta JSON del programa de Vida y Ministerio
type ProgramaVyMResponse struct {
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
	CreatedAt               string          `json:"created_at"`
	UpdatedAt               string          `json:"updated_at"`
}
