package models

import (
	"time"

	"github.com/google/uuid"
)

type Casa struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	CallePrincipal  string     `json:"calle_principal" db:"calle_principal"`
	Numeracion      string     `json:"numeracion" db:"numeracion"`
	CalleSecundaria *string    `json:"calle_secundaria,omitempty" db:"calle_secundaria"`
	Sector          string     `json:"sector" db:"sector"`
	Referencia      *string    `json:"referencia,omitempty" db:"referencia"`
	MotivoNoVolver  string     `json:"motivo_no_volver" db:"motivo_no_volver"`
	FechaRegistro   time.Time  `json:"fecha_registro" db:"fecha_registro"`
	PersonaRegistra string     `json:"persona_registra" db:"persona_registra"`
	Estado          CasaEstado `json:"estado" db:"estado"`
	Latitud        *float64   `json:"latitud,omitempty" db:"latitud"`
	Longitud       *float64   `json:"longitud,omitempty" db:"longitud"`
	FotoURL       *string    `json:"foto_url,omitempty" db:"foto_url"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

type CasaEstado string

const (
	CasaEstadoNoVisitar      CasaEstado = "NO_VISITAR"
	CasaEstadoEnEsperaVisita CasaEstado = "EN_ESPERA_VISITA"
	CasaEstadoRecontactada   CasaEstado = "RECONTACTADA"
	CasaEstadoActiva         CasaEstado = "ACTIVA"
)

func (e CasaEstado) IsValid() bool {
	switch e {
	case CasaEstadoNoVisitar, CasaEstadoEnEsperaVisita, CasaEstadoRecontactada, CasaEstadoActiva:
		return true
	}
	return false
}

func (e CasaEstado) String() string {
	switch e {
	case CasaEstadoNoVisitar:
		return "No Visitar"
	case CasaEstadoEnEsperaVisita:
		return "En Espera de Visita"
	case CasaEstadoRecontactada:
		return "Recontactada"
	case CasaEstadoActiva:
		return "Activa"
	default:
		return string(e)
	}
}

// CasaDetail incluye las visitas asociadas para el detalle completo
type CasaDetail struct {
	Casa
	Visitas []Visita `json:"visitas"`
}
