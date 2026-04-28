package services

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

var ErrNotificacionNotFound = errors.New("notificación no encontrada")

type NotificacionService struct {
	notifRepo *repositories.NotificacionRepository
}

func NewNotificacionService(notifRepo *repositories.NotificacionRepository) *NotificacionService {
	return &NotificacionService{
		notifRepo: notifRepo,
	}
}

func (s *NotificacionService) Create(ctx context.Context, notif *models.Notificacion) error {
	notif.Leida = false
	return s.notifRepo.Create(ctx, notif)
}

func (s *NotificacionService) GetByID(ctx context.Context, id uuid.UUID) (*models.Notificacion, error) {
	return s.notifRepo.GetByID(ctx, id)
}

func (s *NotificacionService) GetByUserID(ctx context.Context, userID uuid.UUID, leida *bool, tipo string) ([]*models.Notificacion, int, error) {
	return s.notifRepo.GetByUserID(ctx, userID, leida, tipo)
}

func (s *NotificacionService) MarkAsRead(ctx context.Context, notificacionID, userID uuid.UUID) error {
	return s.notifRepo.MarkAsRead(ctx, notificacionID, userID)
}

func (s *NotificacionService) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.notifRepo.MarkAllAsRead(ctx, userID)
}

func (s *NotificacionService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.notifRepo.Delete(ctx, id)
}

// CreateAsignacionNotification creates a notification linked to an assignment
func (s *NotificacionService) CreateAsignacionNotification(ctx context.Context, tipo models.NotificacionTipo, destinatarios []uuid.UUID, mensaje string, asignacionID uuid.UUID) error {
	notif := &models.Notificacion{
		Tipo:          tipo,
		Destinatarios: destinatarios,
		Mensaje:       mensaje,
		Leida:         false,
		ReferenciaID:  &asignacionID,
		ReferenciaTipo: func() *models.ReferenciaTipo {
			rt := models.RefTipoAsignacion
			return &rt
		}(),
	}

	return s.notifRepo.CreateConReferencia(ctx, notif)
}

// CreateVisitaNotification creates a notification linked to a visit
func (s *NotificacionService) CreateVisitaNotification(ctx context.Context, tipo models.NotificacionTipo, destinatarios []uuid.UUID, mensaje string, visitaID uuid.UUID) error {
	notif := &models.Notificacion{
		Tipo:          tipo,
		Destinatarios: destinatarios,
		Mensaje:       mensaje,
		Leida:         false,
		ReferenciaID:  &visitaID,
		ReferenciaTipo: func() *models.ReferenciaTipo {
			rt := models.RefTipoVisita
			return &rt
		}(),
	}

	return s.notifRepo.CreateConReferencia(ctx, notif)
}

// CleanupOldNotifications deletes notifications older than specified days
// Returns the count of deleted notifications
func (s *NotificacionService) CleanupOldNotifications(ctx context.Context, dias int) (int, error) {
	if dias <= 0 {
		dias = 30 // default 30 days
	}
	return s.notifRepo.DeleteOlderThan(ctx, dias)
}

// GetVisitasProximasRekindle returns visits scheduled in 'dias' days for reminder notifications
func (s *NotificacionService) GetVisitasProximasRekindle(ctx context.Context, dias int) ([]*models.Visita, error) {
	return s.notifRepo.GetVisitasProximasNotificar(ctx, dias)
}

// GetAsignacionesProximas returns assignments from the week starting in 'dias' days
func (s *NotificacionService) GetAsignacionesProximas(ctx context.Context, dias int) ([]*models.AsignacionDetail, error) {
	return s.notifRepo.GetAsignacionesProximas(ctx, dias)
}

// GetSingleton returns a singleton instance for handlers that need it
func (s *NotificacionService) GetSingleton() *NotificacionService {
	return s
}

var globalNotificacionService *NotificacionService

// InitGlobalNotificacionService initializes the global singleton
func InitGlobalNotificacionService(svc *NotificacionService) {
	globalNotificacionService = svc
}

// GetGlobalNotificacionService returns the global singleton
func GetGlobalNotificacionService() *NotificacionService {
	return globalNotificacionService
}
