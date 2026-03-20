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
