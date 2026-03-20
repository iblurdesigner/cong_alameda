package handlers

import (
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type TerritorioHandler struct {
	territorioService *services.TerritorioService
}

func NewTerritorioHandler(territorioService *services.TerritorioService) *TerritorioHandler {
	return &TerritorioHandler{territorioService: territorioService}
}

func (h *TerritorioHandler) List(c *fiber.Ctx) error {
	var grupoID *uuid.UUID
	if gid := c.Query("grupo_id"); gid != "" {
		id, err := uuid.Parse(gid)
		if err == nil {
			grupoID = &id
		}
	}

	territorios, err := h.territorioService.ListByGrupo(c.Context(), grupoID)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(fiber.Map{"data": territorios})
}

func (h *TerritorioHandler) Upload(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "No se proporcionó archivo"})
	}

	if filepath.Ext(file.Filename) != ".pdf" {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "Solo se permiten archivos PDF"})
	}

	grupoIDStr := c.FormValue("grupo_id")
	grupoID, err := uuid.Parse(grupoIDStr)
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "grupo_id inválido"})
	}

	nombre := c.FormValue("nombre", file.Filename)
	subidoPor := c.FormValue("subido_por", "Usuario")

	// Open the file
	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "Error al leer archivo"})
	}
	defer f.Close()

	territorio, err := h.territorioService.Upload(c.Context(), grupoID, nombre, f, file.Size, subidoPor)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: err.Error()})
	}

	return c.Status(201).JSON(territorio)
}

func (h *TerritorioHandler) Download(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	territorio, err := h.territorioService.GetByID(c.Context(), id)
	if err != nil {
		if err == repositories.ErrTerritorioNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	// Check if file exists
	if _, err := os.Stat(territorio.ArchivoPDF); os.IsNotExist(err) {
		return c.Status(404).JSON(dto.ErrorResponse{Error: "Archivo no encontrado"})
	}

	return c.Download(territorio.ArchivoPDF, territorio.NombreOriginal)
}

func (h *TerritorioHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	if err := h.territorioService.Delete(c.Context(), id); err != nil {
		if err == repositories.ErrTerritorioNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.SendStatus(204)
}

func (h *TerritorioHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	territorio, err := h.territorioService.GetByID(c.Context(), id)
	if err != nil {
		if err == repositories.ErrTerritorioNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(territorio)
}

func (h *TerritorioHandler) Preview(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	territorio, err := h.territorioService.GetByID(c.Context(), id)
	if err != nil {
		if err == repositories.ErrTerritorioNotFound {
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(fiber.Map{
		"nombre": territorio.NombreOriginal,
		"tamano": territorio.Tamano,
	})
}
