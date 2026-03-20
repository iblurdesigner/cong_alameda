package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type GrupoHandler struct {
	grupoService *services.GrupoService
}

func NewGrupoHandler(grupoService *services.GrupoService) *GrupoHandler {
	return &GrupoHandler{grupoService: grupoService}
}

func (h *GrupoHandler) List(c *fiber.Ctx) error {
	grupos, err := h.grupoService.ListWithCounts(c.Context())
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}
	return c.JSON(fiber.Map{"data": grupos})
}

func (h *GrupoHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	detail, err := h.grupoService.GetDetail(c.Context(), id)
	if err != nil {
		if err == repositories.ErrGrupoNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(detail)
}

func (h *GrupoHandler) Create(c *fiber.Ctx) error {
	var req struct {
		Nombre      string  `json:"nombre"`
		Numero      int     `json:"numero"`
		Descripcion *string `json:"descripcion"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "bad_request"})
	}

	grupo := &models.Grupo{
		Nombre:      req.Nombre,
		Numero:      req.Numero,
		Descripcion: req.Descripcion,
	}

	if err := h.grupoService.Create(c.Context(), grupo); err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.Status(201).JSON(grupo)
}

func (h *GrupoHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	var req struct {
		Nombre      *string `json:"nombre"`
		Descripcion *string `json:"descripcion"`
		Activo      *bool   `json:"activo"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "bad_request"})
	}

	updates := make(map[string]interface{})
	if req.Nombre != nil {
		updates["nombre"] = *req.Nombre
	}
	if req.Descripcion != nil {
		updates["descripcion"] = *req.Descripcion
	}
	if req.Activo != nil {
		updates["activo"] = *req.Activo
	}

	g, err := h.grupoService.Update(c.Context(), id, updates)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(g)
}

func (h *GrupoHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	if err := h.grupoService.Delete(c.Context(), id); err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.SendStatus(204)
}
