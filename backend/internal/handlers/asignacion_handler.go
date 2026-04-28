package handlers

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type AsignacionHandler struct {
	asignacionService    *services.AsignacionService
	userService          *services.UserService
	notificacionService  *services.NotificacionService
}

func NewAsignacionHandler(asignacionService *services.AsignacionService, userService *services.UserService, notificacionService *services.NotificacionService) *AsignacionHandler {
	return &AsignacionHandler{
		asignacionService:    asignacionService,
		userService:          userService,
		notificacionService:  notificacionService,
	}
}

// GetTiposAsignacion returns all assignment types
func (h *AsignacionHandler) GetTiposAsignacion(c *fiber.Ctx) error {
	tipos, err := h.asignacionService.GetTiposAsignacion(c.Context())
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}
	return c.JSON(fiber.Map{"data": tipos})
}

// GetBySemana returns all assignments for a week
func (h *AsignacionHandler) GetBySemana(c *fiber.Ctx) error {
	semanaID, err := uuid.Parse(c.Params("semanaId"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_semana_id"})
	}

	detail, err := h.asignacionService.GetSemanaConAsignaciones(c.Context(), semanaID)
	if err != nil {
		log.Printf("[ERROR] GetSemanaConAsignaciones failed: %v", err)
		if err == repositories.ErrSemanaNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(detail)
}

// GetByUser returns assignments for the current user
func (h *AsignacionHandler) GetByUser(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(uuid.UUID)
	if !ok {
		return c.Status(401).JSON(dto.ErrorResponse{Error: "unauthorized"})
	}

	asignaciones, err := h.asignacionService.GetByUser(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(fiber.Map{"data": asignaciones})
}

// Create creates a new assignment
func (h *AsignacionHandler) Create(c *fiber.Ctx) error {
	var req struct {
		SemanaID         string  `json:"semana_id"`
		TipoAsignacionID string  `json:"tipo_asignacion_id"`
		UserID           *string `json:"user_id,omitempty"`
		GrupoID          *string `json:"grupo_id,omitempty"`
		DiaSemana        int     `json:"dia_semana"`
		Observaciones    *string `json:"observaciones,omitempty"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "bad_request"})
	}

	semanaID, err := uuid.Parse(req.SemanaID)
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_semana_id"})
	}

	tipoID, err := uuid.Parse(req.TipoAsignacionID)
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_tipo_asignacion_id"})
	}

	var userUUID *uuid.UUID
	var grupoUUID *uuid.UUID

	if req.UserID != nil && *req.UserID != "" {
		u, err := uuid.Parse(*req.UserID)
		if err != nil {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_user_id"})
		}
		userUUID = &u
	}

	if req.GrupoID != nil && *req.GrupoID != "" {
		g, err := uuid.Parse(*req.GrupoID)
		if err != nil {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_grupo_id"})
		}
		grupoUUID = &g
	}

	if err := h.asignacionService.Create(c.Context(), &models.AsignacionSemanal{
		SemanaID:         semanaID,
		TipoAsignacionID: tipoID,
		UserID:           userUUID,
		GrupoID:          grupoUUID,
		DiaSemana:        req.DiaSemana,
		Observaciones:    req.Observaciones,
	}); err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: err.Error()})
	}

	// Send notification email (async) - only if user is assigned
	if userUUID != nil {
		go func() {
			// Get user info
			user, err := h.userService.GetByID(c.Context(), *userUUID)
			if err != nil || user == nil {
				log.Printf("[NOTIFICATION] Could not get user for assignment notification: %v", err)
				return
			}

			// Get tipo asignacion name
			tipo, err := h.asignacionService.GetTipoAsignacionByID(c.Context(), tipoID)
			if err != nil {
				log.Printf("[NOTIFICATION] Could not get tipo asignacion: %v", err)
				return
			}

			// Get week info
			semana, err := h.asignacionService.GetSemanaByID(c.Context(), semanaID)
			if err != nil {
				log.Printf("[NOTIFICATION] Could not get semana: %v", err)
				return
			}

			// Format date
			fecha := semana.FechaInicio.Format("02/01/2006")
			if req.DiaSemana > 0 && req.DiaSemana <= 7 {
				fecha += " - Día " + string(rune('0'+req.DiaSemana))
			}

			obs := ""
			if req.Observaciones != nil {
				obs = *req.Observaciones
			}

			if err := services.GetNotificationService().SendNewAssignmentNotification(user, tipo.Nombre, fecha, obs); err != nil {
				log.Printf("[NOTIFICATION] Failed to send assignment notification: %v", err)
			}

			// Create in-app notification for assignment
			mensaje := fmt.Sprintf("Nueva asignación: %s para la semana del %s", tipo.Nombre, semana.FechaInicio.Format("02/01/2006"))
			if err := h.notificacionService.CreateAsignacionNotification(
				c.Context(),
				models.NotifTipoAsignacionCreada,
				[]uuid.UUID{*userUUID},
				mensaje,
				semanaID, // Use semanaID as reference since we don't have the full asignacion ID yet
			); err != nil {
				log.Printf("[NOTIFICATION] Failed to create in-app notification: %v", err)
			}
		}()
	}

	return c.Status(201).JSON(fiber.Map{"message": "Asignación creada"})
}

// BulkCreate creates multiple assignments at once
func (h *AsignacionHandler) BulkCreate(c *fiber.Ctx) error {
	var req struct {
		SemanaID     string `json:"semana_id"`
		Asignaciones []struct {
			TipoAsignacionID string  `json:"tipo_asignacion_id"`
			UserID           *string `json:"user_id,omitempty"`
			GrupoID          *string `json:"grupo_id,omitempty"`
			DiaSemana        int     `json:"dia_semana"`
			Observaciones    *string `json:"observaciones,omitempty"`
		} `json:"asignaciones"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "bad_request"})
	}

	semanaID, err := uuid.Parse(req.SemanaID)
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_semana_id"})
	}

	// Clear existing assignments for the week
	if err := h.asignacionService.ClearSemana(c.Context(), semanaID); err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	// Create new assignments
	for _, a := range req.Asignaciones {
		tipoID, err := uuid.Parse(a.TipoAsignacionID)
		if err != nil {
			log.Printf("[BULK] Invalid tipo_asignacion_id: %s, error: %v", a.TipoAsignacionID, err)
			return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_tipo_asignacion_id: " + err.Error()})
		}

		var userUUID *uuid.UUID
		var grupoUUID *uuid.UUID

		if a.UserID != nil && *a.UserID != "" {
			u, err := uuid.Parse(*a.UserID)
			if err != nil {
				log.Printf("[BULK] Invalid user_id: %s, error: %v", *a.UserID, err)
				return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_user_id: " + err.Error()})
			}
			userUUID = &u
		}

		if a.GrupoID != nil && *a.GrupoID != "" {
			g, err := uuid.Parse(*a.GrupoID)
			if err != nil {
				log.Printf("[BULK] Invalid grupo_id: %s, error: %v", *a.GrupoID, err)
				return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_grupo_id: " + err.Error()})
			}
			grupoUUID = &g
		}

		log.Printf("[BULK] Creating: tipoID=%s, userID=%v, grupoID=%v", tipoID, userUUID, grupoUUID)

		if err := h.asignacionService.Create(c.Context(), &models.AsignacionSemanal{
			SemanaID:         semanaID,
			TipoAsignacionID: tipoID,
			UserID:           userUUID,
			GrupoID:          grupoUUID,
			DiaSemana:        a.DiaSemana,
			Observaciones:    a.Observaciones,
		}); err != nil {
			log.Printf("[BULK] Error creating: %v", err)
			return c.Status(500).JSON(dto.ErrorResponse{Error: err.Error()})
		}
	}

	return c.JSON(fiber.Map{"message": "Asignaciones creadas"})
}

// Update updates an assignment
func (h *AsignacionHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	var req struct {
		UserID        *string `json:"user_id,omitempty"`
		GrupoID       *string `json:"grupo_id,omitempty"`
		Observaciones *string `json:"observaciones,omitempty"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "bad_request"})
	}

	var userUUID *uuid.UUID
	var grupoUUID *uuid.UUID

	if req.UserID != nil && *req.UserID != "" {
		u, err := uuid.Parse(*req.UserID)
		if err != nil {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_user_id"})
		}
		userUUID = &u
	}

	if req.GrupoID != nil && *req.GrupoID != "" {
		g, err := uuid.Parse(*req.GrupoID)
		if err != nil {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_grupo_id"})
		}
		grupoUUID = &g
	}

	if err := h.asignacionService.Update(c.Context(), id, userUUID, grupoUUID, req.Observaciones); err != nil {
		if err == repositories.ErrAsignacionNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	// Send in-app notification for assignment update
	if userUUID != nil {
		go func() {
			// Get user info
			user, err := h.userService.GetByID(c.Context(), *userUUID)
			if err != nil || user == nil {
				log.Printf("[NOTIFICATION] Could not get user for assignment update notification: %v", err)
				return
			}

			// Get tipo asignacion name
			tipos, err := h.asignacionService.GetTiposAsignacion(c.Context())
			if err != nil {
				log.Printf("[NOTIFICATION] Could not get tipos asignacion: %v", err)
				return
			}

			// Find the tipo for this assignment (we need to get it from the assignment detail)
			// For now, use a generic message
			mensaje := fmt.Sprintf("Tu asignación ha sido actualizada")
			if err := h.notificacionService.CreateAsignacionNotification(
				c.Context(),
				models.NotifTipoAsignacionActualizada,
				[]uuid.UUID{*userUUID},
				mensaje,
				id,
			); err != nil {
				log.Printf("[NOTIFICATION] Failed to create update notification: %v", err)
			}
			_ = tipos // silence unused warning
		}()
	}

	return c.JSON(fiber.Map{"message": "Asignación actualizada"})
}

// Delete removes an assignment
func (h *AsignacionHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	if err := h.asignacionService.Delete(c.Context(), id); err != nil {
		if err == repositories.ErrAsignacionNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.SendStatus(204)
}
