package models

import (
	"time"

	"github.com/google/uuid"
)

type Notificacion struct {
	ID            uuid.UUID        `json:"id" db:"id"`
	Tipo          NotificacionTipo `json:"tipo" db:"tipo"`
	CasaID        *uuid.UUID       `json:"casa_id,omitempty" db:"casa_id"`
	Destinatarios []uuid.UUID      `json:"destinatarios" db:"destinatarios"`
	Mensaje       string           `json:"mensaje" db:"mensaje"`
	Leida         bool             `json:"leida" db:"leida"`
	CreatedAt     time.Time        `json:"created_at" db:"created_at"`
}

type NotificacionTipo string

const (
	NotifTipoCasaRegistrada        NotificacionTipo = "CASA_REGISTRADA"
	NotifTipoVisitaProgramada      NotificacionTipo = "VISITA_PROGRAMADA"
	NotifTipoVisitaCompletada      NotificacionTipo = "VISITA_COMPLETADA"
	NotifTipoPersonaRequiereVisita NotificacionTipo = "PERSONA_REQUIERE_VISITA"
)

func (t NotificacionTipo) IsValid() bool {
	switch t {
	case NotifTipoCasaRegistrada, NotifTipoVisitaProgramada, NotifTipoVisitaCompletada, NotifTipoPersonaRequiereVisita:
		return true
	}
	return false
}

func (t NotificacionTipo) String() string {
	switch t {
	case NotifTipoCasaRegistrada:
		return "Casa Registrada"
	case NotifTipoVisitaProgramada:
		return "Visita Programada"
	case NotifTipoVisitaCompletada:
		return "Visita Completada"
	case NotifTipoPersonaRequiereVisita:
		return "Persona Requiere Visita"
	default:
		return string(t)
	}
}

// NotificacionUser para respuesta con info de usuario
type NotificacionUser struct {
	Notificacion
	LeidaPorUsuario bool `json:"leida_por_usuario"`
}
