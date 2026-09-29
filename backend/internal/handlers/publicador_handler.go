package handlers

import (
	"errors"
	"log"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type PublicadorHandler struct {
	service *services.PublicadorService
}

func NewPublicadorHandler(service *services.PublicadorService) *PublicadorHandler {
	return &PublicadorHandler{service: service}
}

// List devuelve todos los publicadores con filtros opcionales de búsqueda, grupo y estado
// GET /api/publicadores?search=&grupo_id=&activo=
func (h *PublicadorHandler) List(c *fiber.Ctx) error {
	search := c.Query("search")
	grupoIDStr := c.Query("grupo_id")
	activoStr := c.Query("activo")

	var grupoID *uuid.UUID
	if grupoIDStr != "" {
		parsed, err := uuid.Parse(grupoIDStr)
		if err == nil {
			grupoID = &parsed
		}
	}

	activoOnly := false
	if activoStr != "" {
		if val, err := strconv.ParseBool(activoStr); err == nil {
			activoOnly = val
		}
	}

	list, err := h.service.List(c.Context(), search, grupoID, activoOnly)
	if err != nil {
		log.Printf("ERROR: List publicadores: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al listar publicadores",
		})
	}

	return c.JSON(fiber.Map{
		"data": list,
	})
}

// GetByID busca un publicador por su identificador UUID
// GET /api/publicadores/:id
func (h *PublicadorHandler) GetByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "ID de publicador inválido",
		})
	}

	pub, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, repositories.ErrPublicadorNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Publicador no encontrado",
			})
		}
		log.Printf("ERROR: GetByID publicador: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener publicador",
		})
	}

	return c.JSON(fiber.Map{
		"data": pub,
	})
}

// Create registra un nuevo publicador en el directorio
// POST /api/publicadores
func (h *PublicadorHandler) Create(c *fiber.Ctx) error {
	var req dto.CreatePublicadorRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Cuerpo de solicitud inválido",
		})
	}

	pub, err := h.service.Create(c.Context(), &req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data": pub,
	})
}

// Update modifica los datos de un publicador existente
// PUT /api/publicadores/:id
func (h *PublicadorHandler) Update(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "ID de publicador inválido",
		})
	}

	var req dto.UpdatePublicadorRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Cuerpo de solicitud inválido",
		})
	}

	pub, err := h.service.Update(c.Context(), id, &req)
	if err != nil {
		if errors.Is(err, repositories.ErrPublicadorNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Publicador no encontrado",
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": pub,
	})
}

// Delete elimina un publicador del directorio
// DELETE /api/publicadores/:id
func (h *PublicadorHandler) Delete(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "ID de publicador inválido",
		})
	}

	if err := h.service.Delete(c.Context(), id); err != nil {
		if errors.Is(err, repositories.ErrPublicadorNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Publicador no encontrado",
			})
		}
		log.Printf("ERROR: Delete publicador: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al eliminar publicador",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Publicador eliminado exitosamente",
	})
}
