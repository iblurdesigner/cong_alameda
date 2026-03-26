package dto

import (
	"cong-alameda-backend/internal/models"
	"github.com/google/uuid"
)

// ========== Auth DTOs ==========

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string        `json:"token"`
	User  *UserResponse `json:"user"`
}

// ========== User DTOs ==========

type UserResponse struct {
	ID                     uuid.UUID `json:"id"`
	Nombre                 string    `json:"nombre"`
	Telefono               *string   `json:"telefono,omitempty"`
	TelefonoValidado       bool      `json:"telefono_validado"`
	Email                  string    `json:"email"`
	Rol                    string    `json:"rol"`
	Activo                 bool      `json:"activo"`
	NotificacionesEmail    bool      `json:"notificaciones_email"`
	NotificacionesWhatsapp bool      `json:"notificaciones_whatsapp"`
}

type CreateUserRequest struct {
	Nombre   string  `json:"nombre"`
	Telefono *string `json:"telefono,omitempty"`
	Email    string  `json:"email"`
	Password string  `json:"password"`
	Rol      string  `json:"rol"`
}

type UpdateUserRequest struct {
	Nombre                 *string `json:"nombre,omitempty"`
	Telefono               *string `json:"telefono,omitempty"`
	TelefonoValidado       *bool   `json:"telefono_validado,omitempty"`
	NotificacionesEmail    *bool   `json:"notificaciones_email,omitempty"`
	NotificacionesWhatsapp *bool   `json:"notificaciones_whatsapp,omitempty"`
	Activo                 *bool   `json:"activo,omitempty"`
	Rol                    *string `json:"rol,omitempty"`
}

type UpdateProfileRequest struct {
	Nombre                 *string `json:"nombre,omitempty"`
	Telefono               *string `json:"telefono,omitempty"`
	NotificacionesEmail    *bool   `json:"notificaciones_email,omitempty"`
	NotificacionesWhatsapp *bool   `json:"notificaciones_whatsapp,omitempty"`
}

// ========== Casa DTOs ==========

type CreateCasaRequest struct {
	CallePrincipal  string  `json:"calle_principal"`
	Numeracion      string  `json:"numeracion"`
	CalleSecundaria *string `json:"calle_secundaria,omitempty"`
	Sector          string  `json:"sector"`
	Referencia      *string `json:"referencia,omitempty"`
	MotivoNoVolver  *string `json:"motivo_no_volver,omitempty"`
	PersonaRegistra string  `json:"persona_registra"`
}

type UpdateCasaRequest struct {
	CallePrincipal  *string `json:"calle_principal,omitempty"`
	Numeracion      *string `json:"numeracion,omitempty"`
	CalleSecundaria *string `json:"calle_secundaria,omitempty"`
	Sector          *string `json:"sector,omitempty"`
	Referencia      *string `json:"referencia,omitempty"`
	MotivoNoVolver  *string `json:"motivo_no_volver,omitempty"`
	Estado          *string `json:"estado,omitempty"`
}

type CasaResponse struct {
	ID              uuid.UUID `json:"id"`
	CallePrincipal  string    `json:"calle_principal"`
	Numeracion      string    `json:"numeracion"`
	CalleSecundaria *string   `json:"calle_secundaria,omitempty"`
	Sector          string    `json:"sector"`
	Referencia      *string   `json:"referencia,omitempty"`
	MotivoNoVolver  string    `json:"motivo_no_volver"`
	FechaRegistro   string    `json:"fecha_registro"`
	PersonaRegistra string    `json:"persona_registra"`
	Estado          string    `json:"estado"`
}

type CasaListResponse struct {
	Data  []CasaResponse `json:"data"`
	Total int            `json:"total"`
	Page  int            `json:"page"`
}

type CasaFilter struct {
	Sector string `query:"sector"`
	Estado string `query:"estado"`
	Search string `query:"search"`
	Page   int    `query:"page"`
	Limit  int    `query:"limit"`
}

type CasaDetailResponse struct {
	CasaResponse
	Visitas []VisitaResponse `json:"visitas"`
}

// ========== Visita DTOs ==========

type CreateVisitaRequest struct {
	CasaID          uuid.UUID `json:"casa_id"`
	FechaProgramada string    `json:"fecha_programada"`
	Visitante1ID    uuid.UUID `json:"visitante_1_id"`
	Visitante2ID    uuid.UUID `json:"visitante_2_id"`
}

type UpdateVisitaRequest struct {
	FechaRealizada        *string    `json:"fecha_realizada,omitempty"`
	Observaciones         *string    `json:"observaciones,omitempty"`
	DeseaSeguirRecibiendo *bool      `json:"desea_seguir_recibiendo,omitempty"`
	Estado                *string    `json:"estado,omitempty"`
	Visitante1ID          *uuid.UUID `json:"visitante_1_id,omitempty"`
	Visitante2ID          *uuid.UUID `json:"visitante_2_id,omitempty"`
}

type CasaInfo struct {
	CallePrincipal  string  `json:"calle_principal"`
	Numeracion      string  `json:"numeracion"`
	CalleSecundaria *string `json:"calle_secundaria,omitempty"`
	Sector          string  `json:"sector"`
	Referencia      *string `json:"referencia,omitempty"`
}

type VisitaResponse struct {
	ID                    uuid.UUID `json:"id"`
	CasaID                uuid.UUID `json:"casa_id"`
	Casa                  *CasaInfo `json:"casa,omitempty"`
	FechaProgramada       string    `json:"fecha_programada"`
	FechaRealizada        *string   `json:"fecha_realizada,omitempty"`
	Visitante1ID          uuid.UUID `json:"visitante_1_id"`
	Visitante2ID          uuid.UUID `json:"visitante_2_id"`
	Visitante1Nombre      *string   `json:"visitante_1_nombre,omitempty"`
	Visitante2Nombre      *string   `json:"visitante_2_nombre,omitempty"`
	Observaciones         *string   `json:"observaciones,omitempty"`
	DeseaSeguirRecibiendo *bool     `json:"desea_seguir_recibiendo,omitempty"`
	Estado                string    `json:"estado"`
	CreatedAt             string    `json:"created_at"`
}

type VisitaDetailResponse struct {
	VisitaResponse
	Casa       *CasaResponse `json:"casa,omitempty"`
	Visitante1 *UserResponse `json:"visitante_1,omitempty"`
	Visitante2 *UserResponse `json:"visitante_2,omitempty"`
}

type VisitaListResponse struct {
	Data  []VisitaResponse `json:"data"`
	Total int              `json:"total"`
}

type VisitaFilter struct {
	CasaID    uuid.UUID `query:"casa_id"`
	FechaFrom string    `query:"fecha_from"`
	FechaTo   string    `query:"fecha_to"`
	Estado    string    `query:"estado"`
	Page      int       `query:"page"`
	Limit     int       `query:"limit"`
}

// ========== Notificacion DTOs ==========

type NotificacionResponse struct {
	ID        uuid.UUID  `json:"id"`
	Tipo      string     `json:"tipo"`
	CasaID    *uuid.UUID `json:"casa_id,omitempty"`
	Mensaje   string     `json:"mensaje"`
	Leida     bool       `json:"leida"`
	CreatedAt string     `json:"created_at"`
}

type NotificacionListResponse struct {
	Data        []NotificacionResponse `json:"data"`
	UnreadCount int                    `json:"unread_count"`
}

type NotificacionFilter struct {
	Leida string `query:"leida"`
	Tipo  string `query:"tipo"`
}

type UpdateNotificacionReadRequest struct {
	Leida bool `json:"leida"`
}

// ========== Common Response DTOs ==========

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type PaginatedResponse struct {
	Data  interface{} `json:"data"`
	Total int         `json:"total"`
	Page  int         `json:"page"`
}

// Helper functions
func ToCasaResponse(c *models.Casa) CasaResponse {
	return CasaResponse{
		ID:              c.ID,
		CallePrincipal:  c.CallePrincipal,
		Numeracion:      c.Numeracion,
		CalleSecundaria: c.CalleSecundaria,
		Sector:          c.Sector,
		Referencia:      c.Referencia,
		MotivoNoVolver:  c.MotivoNoVolver,
		FechaRegistro:   c.FechaRegistro.Format("2006-01-02T15:04:05Z07:00"),
		PersonaRegistra: c.PersonaRegistra,
		Estado:          string(c.Estado),
	}
}

func ToUserResponse(u *models.User) UserResponse {
	return UserResponse{
		ID:                     u.ID,
		Nombre:                 u.Nombre,
		Telefono:               u.Telefono,
		TelefonoValidado:       u.TelefonoValidado,
		Email:                  u.Email,
		Rol:                    string(u.Rol),
		Activo:                 u.Activo,
		NotificacionesEmail:    u.NotificacionesEmail,
		NotificacionesWhatsapp: u.NotificacionesWhatsapp,
	}
}

// ========== Asignacion DTOs ==========

type AsignacionRequest struct {
	SemanaID         uuid.UUID  `json:"semana_id"`
	TipoAsignacionID uuid.UUID  `json:"tipo_asignacion_id"`
	UserID           *uuid.UUID `json:"user_id,omitempty"`
	GrupoID          *uuid.UUID `json:"grupo_id,omitempty"`
	DiaSemana        int        `json:"dia_semana"`
	Observaciones    *string    `json:"observaciones,omitempty"`
}

func AsignacionToModel(req *AsignacionRequest) models.AsignacionSemanal {
	return models.AsignacionSemanal{
		ID:               uuid.New(),
		SemanaID:         req.SemanaID,
		TipoAsignacionID: req.TipoAsignacionID,
		UserID:           req.UserID,
		GrupoID:          req.GrupoID,
		DiaSemana:        req.DiaSemana,
		Observaciones:    req.Observaciones,
	}
}
