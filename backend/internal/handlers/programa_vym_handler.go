package handlers

import (
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type ProgramaVyMHandler struct {
	service *services.ProgramaVyMService
}

func NewProgramaVyMHandler(service *services.ProgramaVyMService) *ProgramaVyMHandler {
	return &ProgramaVyMHandler{service: service}
}

func (h *ProgramaVyMHandler) GetBySemana(c *fiber.Ctx) error {
	semanaIDStr := c.Params("semana_id")
	semanaID, err := uuid.Parse(semanaIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id_invalido",
		})
	}

	prog, err := h.service.GetBySemanaID(c.Context(), semanaID)
	if err != nil {
		if errors.Is(err, repositories.ErrProgramaVyMNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "no_encontrado",
			})
		}
		log.Printf("ERROR: GetBySemana ProgramaVyM: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "error_interno",
		})
	}

	return c.JSON(fiber.Map{
		"data": prog,
	})
}

func (h *ProgramaVyMHandler) Upsert(c *fiber.Ctx) error {
	semanaIDStr := c.Params("semana_id")
	semanaID, err := uuid.Parse(semanaIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id_invalido",
		})
	}

	var req dto.UpsertProgramaVyMRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "cuerpo_invalido",
		})
	}

	prog, err := h.service.Upsert(c.Context(), semanaID, &req)
	if err != nil {
		log.Printf("ERROR: Upsert ProgramaVyM: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "error_interno",
		})
	}

	return c.JSON(fiber.Map{
		"data": prog,
	})
}

func (h *ProgramaVyMHandler) Delete(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id_invalido",
		})
	}

	if err := h.service.Delete(c.Context(), id); err != nil {
		if errors.Is(err, repositories.ErrProgramaVyMNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "no_encontrado",
			})
		}
		log.Printf("ERROR: Delete ProgramaVyM: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "error_interno",
		})
	}

	return c.JSON(fiber.Map{
		"message": "eliminado",
	})
}
