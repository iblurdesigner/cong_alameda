package models

import (
	"time"

	"github.com/google/uuid"
)

type Notificacion struct {
	ID              uuid.UUID        `json:"id" db:"id"`
	Tipo            NotificacionTipo `json:"tipo" db:"tipo"`
	CasaID          *uuid.UUID       `json:"casa_id,omitempty" db:"casa_id"`
	Destinatarios   []uuid.UUID      `json:"destinatarios" db:"destinatarios"`
	Mensaje         string           `json:"mensaje" db:"mensaje"`
	Leida           bool              `json:"leida" db:"leida"`
	ReferenciaID    *uuid.UUID       `json:"referencia_id,omitempty" db:"referencia_id"`
	ReferenciaTipo  *ReferenciaTipo  `json:"referencia_tipo,omitempty" db:"referencia_tipo"`
	CreatedAt       time.Time         `json:"created_at" db:"created_at"`
}

// NotificacionTipo enum
// Tipos de notificaciones del sistema:
// - CASA_REGISTRADA: Notificación cuando se registra una nueva casa
// - VISITA_PROGRAMADA: Recordatorio de visita programada
// - VISITA_COMPLETADA: Notificación de visita completada
// - PERSONA_REQUIERE_VISITA: Notificación cuando una persona requiere visita
// - ASIGNACION_CREADA: Notificación cuando se crea una asignación
// - ASIGNACION_ACTUALIZADA: Notificación cuando se actualiza una asignación
// - ASIGNACION_COMPLETADA: Notificación cuando se completa una asignación
type NotificacionTipo string

// ReferenciaTipo enum for linking notifications to other entities
type ReferenciaTipo string

const (
	RefTipoAsignacion ReferenciaTipo = "ASIGNACION"
	RefTipoVisita      ReferenciaTipo = "VISITA"
)

func (r ReferenciaTipo) IsValid() bool {
	return r == RefTipoAsignacion || r == RefTipoVisita
}

const (
	NotifTipoCasaRegistrada        NotificacionTipo = "CASA_REGISTRADA"
	NotifTipoVisitaProgramada      NotificacionTipo = "VISITA_PROGRAMADA"
	NotifTipoVisitaCompletada     NotificacionTipo = "VISITA_COMPLETADA"
	NotifTipoPersonaRequiereVisita NotificacionTipo = "PERSONA_REQUIERE_VISITA"
	NotifTipoAsignacionCreada     NotificacionTipo = "ASIGNACION_CREADA"
	NotifTipoAsignacionActualizada NotificacionTipo = "ASIGNACION_ACTUALIZADA"
	NotifTipoAsignacionCompletada  NotificacionTipo = "ASIGNACION_COMPLETADA"
)

func (t NotificacionTipo) IsValid() bool {
	switch t {
	case NotifTipoCasaRegistrada, NotifTipoVisitaProgramada, NotifTipoVisitaCompletada, NotifTipoPersonaRequiereVisita, NotifTipoAsignacionCreada, NotifTipoAsignacionActualizada, NotifTipoAsignacionCompletada:
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
	case NotifTipoAsignacionCreada:
		return "Asignación Creada"
	case NotifTipoAsignacionActualizada:
		return "Asignación Actualizada"
	case NotifTipoAsignacionCompletada:
		return "Asignación Completada"
	default:
		return string(t)
	}
}

// NotificacionUser para respuesta con info de usuario
type NotificacionUser struct {
	Notificacion
	LeidaPorUsuario bool `json:"leida_por_usuario"`
}
