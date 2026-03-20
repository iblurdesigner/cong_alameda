package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type NotificacionHandler struct {
	notificacionService *services.NotificacionService
}

func NewNotificacionHandler(notificacionService *services.NotificacionService) *NotificacionHandler {
	return &NotificacionHandler{
		notificacionService: notificacionService,
	}
}

// List returns notifications for the current user
// GET /api/notificaciones
func (h *NotificacionHandler) List(c *fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: "unauthorized",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: "invalid_user_id",
		})
	}

	filter := dto.NotificacionFilter{
		Leida: c.Query("leida"),
		Tipo:  c.Query("tipo"),
	}

	var leidaPtr *bool
	if filter.Leida != "" {
		leida := filter.Leida == "true"
		leidaPtr = &leida
	}

	notificaciones, unreadCount, err := h.notificacionService.GetByUserID(c.Context(), userID, leidaPtr, filter.Tipo)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener notificaciones",
		})
	}

	// Convert to response DTOs
	data := make([]dto.NotificacionResponse, 0, len(notificaciones))
	for _, n := range notificaciones {
		data = append(data, h.notifToResponse(n))
	}

	return c.JSON(dto.NotificacionListResponse{
		Data:        data,
		UnreadCount: unreadCount,
	})
}

func (h *NotificacionHandler) notifToResponse(n *models.Notificacion) dto.NotificacionResponse {
	return dto.NotificacionResponse{
		ID:        n.ID,
		Tipo:      string(n.Tipo),
		CasaID:    n.CasaID,
		Mensaje:   n.Mensaje,
		Leida:     n.Leida,
		CreatedAt: n.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

// MarkAsRead marks a notification as read
// PUT /api/notificaciones/:id/read
func (h *NotificacionHandler) MarkAsRead(c *fiber.Ctx) error {
	idStr := c.Params("id")
	notifID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de notificación inválido",
		})
	}

	userIDStr, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: "unauthorized",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: "invalid_user_id",
		})
	}

	if err := h.notificacionService.MarkAsRead(c.Context(), notifID, userID); err != nil {
		if errors.Is(err, repositories.ErrNotificacionNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Notificación no encontrada",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al marcar como leída",
		})
	}

	return c.JSON(dto.SuccessResponse{
		Message: "Notificación marcada como leída",
	})
}

// MarkAllAsRead marks all notifications as read
// PUT /api/notificaciones/read-all
func (h *NotificacionHandler) MarkAllAsRead(c *fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: "unauthorized",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: "invalid_user_id",
		})
	}

	if err := h.notificacionService.MarkAllAsRead(c.Context(), userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al marcar todas como leídas",
		})
	}

	return c.JSON(dto.SuccessResponse{
		Message: "Todas las notificaciones marcadas como leídas",
	})
}
