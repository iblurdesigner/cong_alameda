package handlers

import (
	"errors"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type NotificacionHandler struct {
	notificacionService *services.NotificacionService
	userService         *services.UserService
	casaService         *services.CasaService
}

func NewNotificacionHandler(notificacionService *services.NotificacionService, userService *services.UserService, casaService *services.CasaService) *NotificacionHandler {
	return &NotificacionHandler{
		notificacionService: notificacionService,
		userService:        userService,
		casaService:        casaService,
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

// CleanupOldNotifications deletes notifications older than specified days
// DELETE /api/notificaciones/cleanup?dias=30
func (h *NotificacionHandler) CleanupOldNotifications(c *fiber.Ctx) error {
	dias := c.QueryInt("dias", 30)

	if dias <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "El parámetro 'dias' debe ser mayor a 0",
		})
	}

	count, err := h.notificacionService.CleanupOldNotifications(c.Context(), dias)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al limpiar notificaciones antiguas",
		})
	}

	return c.JSON(dto.SuccessResponse{
		Message: fmt.Sprintf("Se eliminaron %d notificaciones antiguas", count),
		Data: fiber.Map{
			"deleted_count": count,
			"older_than_days": dias,
		},
	})
}

// RekindleVisitas creates reminder notifications for visits scheduled 20 days from now
// POST /api/notificaciones/rekindle/visitas
func (h *NotificacionHandler) RekindleVisitas(c *fiber.Ctx) error {
	dias := c.QueryInt("dias", 20)

	if dias <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "El parámetro 'dias' debe ser mayor a 0",
		})
	}

	// Get visits scheduled for 'dias' days from now
	visitas, err := h.notificacionService.GetVisitasProximasRekindle(c.Context(), dias)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener visitas para rekindle",
		})
	}

	createdCount := 0
	for _, visita := range visitas {
		// Get casa info for address
		casa, err := h.casaService.GetByID(c.Context(), visita.CasaID)
		if err != nil {
			log.Printf("[REKINDLE] Could not get casa %s: %v", visita.CasaID, err)
			continue
		}

		// Build address
		direccion := casa.CallePrincipal + " " + casa.Numeracion
		if casa.CalleSecundaria != nil && *casa.CalleSecundaria != "" {
			direccion += " y " + *casa.CalleSecundaria
		}
		direccion += ", " + casa.Sector

		// Notify both visitors
		destinatarios := []uuid.UUID{visita.Visitante1ID, visita.Visitante2ID}
		mensaje := fmt.Sprintf("Recordatorio: tienes una visita programada para el %s en %s",
			visita.FechaProgramada.Format("02/01/2006"), direccion)

		if err := h.notificacionService.CreateVisitaNotification(
			c.Context(),
			models.NotifTipoVisitaProgramada,
			destinatarios,
			mensaje,
			visita.ID,
		); err != nil {
			log.Printf("[REKINDLE] Failed to create notification for visita %s: %v", visita.ID, err)
			continue
		}

		createdCount++
	}

	return c.JSON(dto.SuccessResponse{
		Message: fmt.Sprintf("Se crearon %d notificaciones de recordatorio", createdCount),
		Data: fiber.Map{
			"created_notifications": createdCount,
			"visitas_processed":     len(visitas),
			"days_before":          dias,
		},
	})
}
