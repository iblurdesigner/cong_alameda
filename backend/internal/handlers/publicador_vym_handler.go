package handlers

import (
	"errors"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type PublicadorVyMHandler struct {
	service      *services.PublicadorVyMService
	semanaRepo   *repositories.SemanaRepository
}

func NewPublicadorVyMHandler(service *services.PublicadorVyMService, semanaRepo *repositories.SemanaRepository) *PublicadorVyMHandler {
	return &PublicadorVyMHandler{service: service, semanaRepo: semanaRepo}
}

// GET /api/publicadores-vym
func (h *PublicadorVyMHandler) List(c *fiber.Ctx) error {
	items, err := h.service.List(c.Context())
	if err != nil {
		log.Printf("ERROR: List PublicadorVyM: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{Error: "error_interno"})
	}
	return c.JSON(fiber.Map{"data": items})
}

// POST /api/publicadores-vym
func (h *PublicadorVyMHandler) Add(c *fiber.Ctx) error {
	var req dto.AddPublicadorVyMRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{Error: "cuerpo_invalido", Message: err.Error()})
	}

	item, err := h.service.Add(c.Context(), &req)
	if err != nil {
		log.Printf("ERROR: Add PublicadorVyM: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{Error: "error_interno", Message: err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": item})
}

// PUT /api/publicadores-vym/:id
func (h *PublicadorVyMHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{Error: "id_invalido"})
	}

	var req dto.UpdatePublicadorVyMRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{Error: "cuerpo_invalido", Message: err.Error()})
	}

	item, err := h.service.Update(c.Context(), id, &req)
	if err != nil {
		if errors.Is(err, repositories.ErrPublicadorVyMNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{Error: "no_encontrado"})
		}
		log.Printf("ERROR: Update PublicadorVyM: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{Error: "error_interno"})
	}
	return c.JSON(fiber.Map{"data": item})
}

// DELETE /api/publicadores-vym/:id
func (h *PublicadorVyMHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{Error: "id_invalido"})
	}

	if err := h.service.Delete(c.Context(), id); err != nil {
		if errors.Is(err, repositories.ErrPublicadorVyMNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{Error: "no_encontrado"})
		}
		log.Printf("ERROR: Delete PublicadorVyM: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{Error: "error_interno"})
	}
	return c.JSON(fiber.Map{"message": "eliminado"})
}

// GET /api/publicadores-vym/disponibilidad?semana_id=UUID
func (h *PublicadorVyMHandler) GetDisponibilidad(c *fiber.Ctx) error {
	var fechaReferencia time.Time

	semanaIDStr := c.Query("semana_id")
	if semanaIDStr != "" {
		semanaID, err := uuid.Parse(semanaIDStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{Error: "semana_id_invalido"})
		}
		semana, err := h.semanaRepo.GetByID(c.Context(), semanaID)
		if err != nil {
			if errors.Is(err, repositories.ErrSemanaNotFound) {
				return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{Error: "semana_no_encontrada"})
			}
			log.Printf("ERROR: GetDisponibilidad fetch semana: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{Error: "error_interno"})
		}
		fechaReferencia = semana.FechaInicio
	}

	items, err := h.service.GetDisponibilidad(c.Context(), fechaReferencia)
	if err != nil {
		log.Printf("ERROR: GetDisponibilidad PublicadorVyM: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{Error: "error_interno"})
	}
	return c.JSON(fiber.Map{"data": items})
}

// POST /api/publicadores-vym/historial
func (h *PublicadorVyMHandler) SyncHistorial(c *fiber.Ctx) error {
	var req dto.SyncHistorialRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{Error: "cuerpo_invalido", Message: err.Error()})
	}

	if err := h.service.SyncHistorial(c.Context(), &req); err != nil {
		log.Printf("ERROR: SyncHistorial PublicadorVyM: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{Error: "error_interno", Message: err.Error()})
	}
	return c.JSON(fiber.Map{"message": "historial_sincronizado"})
}
