package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type SemanaHandler struct {
	semanaService *services.SemanaService
}

func NewSemanaHandler(semanaService *services.SemanaService) *SemanaHandler {
	return &SemanaHandler{semanaService: semanaService}
}

func (h *SemanaHandler) List(c *fiber.Ctx) error {
	includeArchived := c.Query("include_archived", "false") == "true"
	semanas, err := h.semanaService.List(c.Context(), includeArchived)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}
	return c.JSON(fiber.Map{"data": semanas})
}

func (h *SemanaHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	detail, err := h.semanaService.GetDetail(c.Context(), id)
	if err != nil {
		if err == repositories.ErrSemanaNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(detail)
}

func (h *SemanaHandler) Create(c *fiber.Ctx) error {
	var req struct {
		FechaInicio string `json:"fecha_inicio"` // YYYY-MM-DD
		Nombre      string `json:"nombre"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "bad_request"})
	}

	fecha, err := parseDate(req.FechaInicio)
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "Fecha inválida. Use formato YYYY-MM-DD"})
	}

	semana, err := h.semanaService.Create(c.Context(), fecha, req.Nombre)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: err.Error()})
	}

	return c.Status(201).JSON(semana)
}

func (h *SemanaHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	var req struct {
		Nombre string `json:"nombre"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "bad_request"})
	}

	semana, err := h.semanaService.Update(c.Context(), id, req.Nombre)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(semana)
}

func (h *SemanaHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	if err := h.semanaService.Delete(c.Context(), id); err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.SendStatus(204)
}

func (h *SemanaHandler) GetDias(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	dias, err := h.semanaService.GetDiasBySemana(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(fiber.Map{"data": dias})
}

func (h *SemanaHandler) UpdateDia(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	var req struct {
		TerritorioMananaID *uuid.UUID `json:"territorio_manana_id"`
		TerritorioTardeID  *uuid.UUID `json:"territorio_tarde_id"`
		GrupoAsignadoID    *uuid.UUID `json:"grupo_asignado_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "bad_request"})
	}

	dia, err := h.semanaService.UpdateDia(c.Context(), id, req.TerritorioMananaID, req.TerritorioTardeID, req.GrupoAsignadoID)
	if err != nil {
		if err == repositories.ErrDiaNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(dia)
}

func (h *SemanaHandler) Archive(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	var req struct {
		Archivado bool `json:"archivado"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "bad_request"})
	}

	err = h.semanaService.Archive(c.Context(), id, req.Archivado)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(fiber.Map{"message": "Semana archivada"})
}

func parseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}
