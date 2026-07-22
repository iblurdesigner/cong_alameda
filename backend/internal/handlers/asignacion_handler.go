package handlers

import (
	"context"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

// asignacionService is the subset of the service the handler depends on. Using
// an interface keeps the handler unit-testable with a mock and avoids coupling
// to the concrete *services.AsignacionService.
type asignacionService interface {
	Create(ctx context.Context, a *models.AsignacionSemanal) error
	Update(ctx context.Context, id, userID uuid.UUID, grupoID *uuid.UUID, observaciones *string) error
	BulkCreate(ctx context.Context, asignaciones []*models.AsignacionSemanal) error
	ClearSemana(ctx context.Context, semanaID uuid.UUID) error
	GetSemanaConAsignaciones(ctx context.Context, semanaID uuid.UUID) (*models.SemanaConAsignaciones, error)
	GetTiposAsignacion(ctx context.Context) ([]*models.TipoAsignacion, error)
	GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.AsignacionDetail, error)
	GetBySemana(ctx context.Context, semanaID uuid.UUID) ([]*models.AsignacionDetail, error)
	GetBySemanaAndDia(ctx context.Context, semanaID uuid.UUID, diaSemana int) ([]*models.AsignacionDetail, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type AsignacionHandler struct {
	asignacionService asignacionService
}

func NewAsignacionHandler(asignacionService asignacionService) *AsignacionHandler {
	return &AsignacionHandler{asignacionService: asignacionService}
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
		UserID           string  `json:"user_id"`
		GrupoID          string  `json:"grupo_id"`
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

	userID := uuid.Nil
	if req.UserID != "" {
		parsed, err := uuid.Parse(req.UserID)
		if err != nil {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_user_id"})
		}
		userID = parsed
	}

	var grupoID *uuid.UUID
	if req.GrupoID != "" {
		parsed, err := uuid.Parse(req.GrupoID)
		if err != nil {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_grupo_id"})
		}
		grupoID = &parsed
	}

	if err := h.asignacionService.Create(c.Context(), &models.AsignacionSemanal{
		SemanaID:         semanaID,
		TipoAsignacionID: tipoID,
		UserID:           userID,
		GrupoID:          grupoID,
		DiaSemana:        req.DiaSemana,
		Observaciones:    req.Observaciones,
	}); err != nil {
		if errors.Is(err, services.ErrAseoSalonRequiresGrupo) {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "aseo_salon_requires_grupo"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{"message": "Asignación creada"})
}

// BulkCreate creates multiple assignments at once
func (h *AsignacionHandler) BulkCreate(c *fiber.Ctx) error {
	var req struct {
		SemanaID     string `json:"semana_id"`
		Asignaciones []struct {
			TipoAsignacionID string  `json:"tipo_asignacion_id"`
			UserID           string  `json:"user_id"`
			GrupoID          string  `json:"grupo_id"`
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

	// Create new assignments — parse every UUID strictly and route through
	// the service so ASEO_SALON group-only enforcement applies per item.
	asignaciones := make([]*models.AsignacionSemanal, 0, len(req.Asignaciones))
	for _, a := range req.Asignaciones {
		tipoID, err := uuid.Parse(a.TipoAsignacionID)
		if err != nil {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_tipo_asignacion_id"})
		}
		userID := uuid.Nil
		if a.UserID != "" {
			parsed, err := uuid.Parse(a.UserID)
			if err != nil {
				return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_user_id"})
			}
			userID = parsed
		}
		var grupoID *uuid.UUID
		if a.GrupoID != "" {
			parsed, err := uuid.Parse(a.GrupoID)
			if err != nil {
				return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_grupo_id"})
			}
			grupoID = &parsed
		}

		asignaciones = append(asignaciones, &models.AsignacionSemanal{
			SemanaID:         semanaID,
			TipoAsignacionID: tipoID,
			UserID:           userID,
			GrupoID:          grupoID,
			DiaSemana:        a.DiaSemana,
			Observaciones:    a.Observaciones,
		})
	}

	if err := h.asignacionService.BulkCreate(c.Context(), asignaciones); err != nil {
		if errors.Is(err, services.ErrAseoSalonRequiresGrupo) {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "aseo_salon_requires_grupo"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: err.Error()})
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
		UserID        string  `json:"user_id"`
		GrupoID       string  `json:"grupo_id"`
		Observaciones *string `json:"observaciones,omitempty"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "bad_request"})
	}

	userID := uuid.Nil
	if req.UserID != "" {
		parsed, err := uuid.Parse(req.UserID)
		if err != nil {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_user_id"})
		}
		userID = parsed
	}

	var grupoID *uuid.UUID
	if req.GrupoID != "" {
		parsed, err := uuid.Parse(req.GrupoID)
		if err != nil {
			return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_grupo_id"})
		}
		grupoID = &parsed
	}

	if err := h.asignacionService.Update(c.Context(), id, userID, grupoID, req.Observaciones); err != nil {
		if err == repositories.ErrAsignacionNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
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
