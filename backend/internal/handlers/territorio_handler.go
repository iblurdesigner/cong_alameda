package handlers

import (
	"fmt"
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
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		fmt.Printf("[DOWNLOAD] Invalid ID format: %s, error: %v\n", idStr, err)
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	fmt.Printf("[DOWNLOAD] Looking for territorio ID: %s\n", id)

	territorio, err := h.territorioService.GetByID(c.Context(), id)
	if err != nil {
		if err == repositories.ErrTerritorioNotFound {
			fmt.Printf("[DOWNLOAD] Territorio not found in DB: %s\n", id)
			return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		fmt.Printf("[DOWNLOAD] Error getting territorio: %v\n", err)
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	fmt.Printf("[DOWNLOAD] Found territorio: %s, archivo_pdf: %s\n", territorio.Nombre, territorio.ArchivoPDF)

	// Check if file exists
	if _, err := os.Stat(territorio.ArchivoPDF); os.IsNotExist(err) {
		fmt.Printf("[DOWNLOAD] Archivo no encontrado en disco: %s\n", territorio.ArchivoPDF)
		return c.Status(404).JSON(dto.ErrorResponse{Error: "Archivo no encontrado en el servidor"})
	}

	fmt.Printf("[DOWNLOAD] Archivo encontrado, proceder a descargar: %s\n", territorio.ArchivoPDF)
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

// Preview returns the PDF file to be displayed in the browser
func (h *TerritorioHandler) Preview(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	territorio, err := h.territorioService.GetByID(c.Context(), id)
	if err != nil {
		if err == repositories.ErrTerritorioNotFound {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{Error: "not_found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	// Debug: print current working directory
	if cwd, err := os.Getwd(); err == nil {
		fmt.Printf("[PREVIEW] Current working dir: %s\n", cwd)
	}

	// Debug: list all possible locations
	locations := []string{
		territorio.ArchivoPDF,
		"./uploads/territorios",
		"/app/uploads/territorios",
		"./" + territorio.ArchivoPDF,
	}

	for _, loc := range locations {
		if info, err := os.Stat(loc); err == nil {
			fmt.Printf("[PREVIEW] Found at %s (isDir: %v, size: %d)\n", loc, info.IsDir(), info.Size())
		}
	}

	// Search for any PDF files
	if matches, err := filepath.Glob("/app/uploads/territorios/**/*.pdf"); err == nil && len(matches) > 0 {
		fmt.Printf("[PREVIEW] Found PDF files: %v\n", matches)
	} else if err != nil {
		fmt.Printf("[PREVIEW] Glob error: %v\n", err)
	}

	// Check if file exists
	if _, err := os.Stat(territorio.ArchivoPDF); os.IsNotExist(err) {
		// Try to find it with different paths
		filename := filepath.Base(territorio.ArchivoPDF)

		// Search for the file by name in various directories
		searchPaths := []string{
			"/app/uploads",
			"./uploads",
			".",
		}

		for _, searchDir := range searchPaths {
			if matches, err := filepath.Glob(searchDir + "/**/*" + filename); err == nil && len(matches) > 0 {
				for _, match := range matches {
					fmt.Printf("[PREVIEW] Found file by pattern at: %s\n", match)
					c.Set("Content-Type", "application/pdf")
					return c.SendFile(match)
				}
			}
		}

		fmt.Printf("[PREVIEW] Archivo no encontrado: %s\n", territorio.ArchivoPDF)
		return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{Error: "Archivo no encontrado en el servidor"})
	}

	// Set proper headers for PDF display
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", "inline; filename=\""+territorio.NombreOriginal+"\"")
	c.Set("Content-Length", fmt.Sprintf("%d", func() int64 {
		info, _ := os.Stat(territorio.ArchivoPDF)
		return info.Size()
	}()))
	c.Set("Cache-Control", "public, max-age=3600")

	return c.SendFile(territorio.ArchivoPDF)
}
