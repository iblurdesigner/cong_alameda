package handlers

import (
	"context"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/services"
)

// programaPredicacionService defines the interface for program operations used by the handler.
// The concrete *services.ProgramaPredicacionService satisfies this interface.
type programaPredicacionService interface {
	Create(ctx context.Context, req *dto.CreateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.ProgramaPredicacionResponse, error)
	List(ctx context.Context) ([]*models.ProgramaPredicacionResponse, error)
	Update(ctx context.Context, id uuid.UUID, req *dto.UpdateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

// ProgramaPredicacionHandler handles HTTP requests for preaching program management.
type ProgramaPredicacionHandler struct {
	service programaPredicacionService
}

// NewProgramaPredicacionHandler creates a new ProgramaPredicacionHandler.
func NewProgramaPredicacionHandler(svc programaPredicacionService) *ProgramaPredicacionHandler {
	return &ProgramaPredicacionHandler{service: svc}
}

// List returns all preaching programs.
// GET /api/programas-predicacion
func (h *ProgramaPredicacionHandler) List(c *fiber.Ctx) error {
	programas, err := h.service.List(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener los programas",
		})
	}
	return c.JSON(fiber.Map{"data": programas})
}

// GetByID returns a single preaching program by ID.
// GET /api/programas-predicacion/:id
func (h *ProgramaPredicacionHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de programa inválido",
		})
	}

	programa, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, services.ErrProgramaNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Programa de predicación no encontrado",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener el programa",
		})
	}

	return c.JSON(fiber.Map{"data": programa})
}

// Create creates a new preaching program.
// POST /api/programas-predicacion
func (h *ProgramaPredicacionHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateProgramaPredicacionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos inválidos",
		})
	}

	result, err := h.service.Create(c.Context(), &req)
	if err != nil {
		if errors.Is(err, services.ErrDuplicatePrograma) {
			return c.Status(fiber.StatusConflict).JSON(dto.ErrorResponse{
				Error:   "duplicate",
				Message: "Ya existe un programa en esta fecha y hora",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al crear el programa",
		})
	}

	resp := dto.ToProgramaPredicacionResponse(result)
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": resp})
}

// Update modifies an existing preaching program.
// PUT /api/programas-predicacion/:id
func (h *ProgramaPredicacionHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de programa inválido",
		})
	}

	var req dto.UpdateProgramaPredicacionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos inválidos",
		})
	}

	result, err := h.service.Update(c.Context(), id, &req)
	if err != nil {
		if errors.Is(err, services.ErrProgramaNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Programa de predicación no encontrado",
			})
		}
		if errors.Is(err, services.ErrDuplicatePrograma) {
			return c.Status(fiber.StatusConflict).JSON(dto.ErrorResponse{
				Error:   "duplicate",
				Message: "Ya existe un programa en esta fecha y hora",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al actualizar el programa",
		})
	}

	resp := dto.ToProgramaPredicacionResponse(result)
	return c.JSON(fiber.Map{"data": resp})
}

// Delete removes a preaching program.
// DELETE /api/programas-predicacion/:id
func (h *ProgramaPredicacionHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de programa inválido",
		})
	}

	if err := h.service.Delete(c.Context(), id); err != nil {
		if errors.Is(err, services.ErrProgramaNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Programa de predicación no encontrado",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al eliminar el programa",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
