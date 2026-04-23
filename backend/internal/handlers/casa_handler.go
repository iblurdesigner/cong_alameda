package handlers

import (
	"errors"
	"fmt"
	"os"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type CasaHandler struct {
	casaService *services.CasaService
	userService *services.UserService
}

func NewCasaHandler(casaService *services.CasaService, userService *services.UserService) *CasaHandler {
	return &CasaHandler{
		casaService: casaService,
		userService: userService,
	}
}

// List returns all casas with pagination and filters
// GET /api/casas
func (h *CasaHandler) List(c *fiber.Ctx) error {
	filtro := dto.CasaFilter{
		Sector: c.Query("sector"),
		Estado: c.Query("estado"),
		Search: c.Query("search"),
		Page:   c.QueryInt("page", 1),
		Limit:  c.QueryInt("limit", 20),
	}

	casas, total, err := h.casaService.List(c.Context(), filtro.Sector, filtro.Estado, filtro.Search, filtro.Page, filtro.Limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener las casas",
		})
	}

	// Convert to response DTOs
	data := make([]dto.CasaResponse, 0, len(casas))
	for _, casa := range casas {
		data = append(data, dto.ToCasaResponse(casa))
	}

	return c.JSON(dto.CasaListResponse{
		Data:  data,
		Total: total,
		Page:  filtro.Page,
	})
}

// GetByID returns a single casa with detail
// GET /api/casas/:id
func (h *CasaHandler) GetByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de casa inválido",
		})
	}

	detail, err := h.casaService.GetDetail(c.Context(), id)
	if err != nil {
		if errors.Is(err, repositories.ErrCasaNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Casa no encontrada",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener la casa",
		})
	}

	// Convert visitas with visitor names
	visitas := make([]dto.VisitaResponse, 0, len(detail.Visitas))
	for _, v := range detail.Visitas {
		resp := h.visitaToResponse(&v)

		// Fetch visitor 1 name
		if v.Visitante1ID != uuid.Nil {
			if user, err := h.userService.GetByID(c.Context(), v.Visitante1ID); err == nil && user != nil {
				resp.Visitante1Nombre = &user.Nombre
			}
		}
		// Fetch visitor 2 name
		if v.Visitante2ID != uuid.Nil {
			if user, err := h.userService.GetByID(c.Context(), v.Visitante2ID); err == nil && user != nil {
				resp.Visitante2Nombre = &user.Nombre
			}
		}

		visitas = append(visitas, resp)
	}

	return c.JSON(dto.CasaDetailResponse{
		CasaResponse: dto.ToCasaResponse(&detail.Casa),
		Visitas:      visitas,
	})
}

func (h *CasaHandler) visitaToResponse(v *models.Visita) dto.VisitaResponse {
	resp := dto.VisitaResponse{
		ID:              v.ID,
		CasaID:          v.CasaID,
		FechaProgramada: v.FechaProgramada.Format("2006-01-02"),
		Visitante1ID:    v.Visitante1ID,
		Visitante2ID:    v.Visitante2ID,
		Observaciones:   v.Observaciones,
		Estado:          string(v.Estado),
	}
	if v.FechaRealizada != nil {
		fechaStr := v.FechaRealizada.Format("2006-01-02")
		resp.FechaRealizada = &fechaStr
	}
	if v.DeseaSeguirRecibiendo != nil {
		resp.DeseaSeguirRecibiendo = v.DeseaSeguirRecibiendo
	}
	return resp
}

// Create registers a new casa
// POST /api/casas
func (h *CasaHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateCasaRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos inválidos",
		})
	}

	// Validation
	if req.CallePrincipal == "" || req.Numeracion == "" || req.Sector == "" {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "Campos requeridos: calle_principal, numeracion, sector",
		})
	}

	casa := &models.Casa{
		CallePrincipal:  req.CallePrincipal,
		Numeracion:      req.Numeracion,
		CalleSecundaria: req.CalleSecundaria,
		Sector:          req.Sector,
		Referencia:      req.Referencia,
		Latitud:        req.Latitud,
		Longitud:       req.Longitud,
		FotoURL:        req.FotoURL,
	}
	if req.MotivoNoVolver != nil {
		casa.MotivoNoVolver = *req.MotivoNoVolver
	}

	// Get current user from auth middleware
	if userEmail, ok := c.Locals("user_email").(string); ok && userEmail != "" {
		casa.PersonaRegistra = userEmail
	} else if req.PersonaRegistra != "" {
		casa.PersonaRegistra = req.PersonaRegistra
	}

	// Fallback if still empty
	if casa.PersonaRegistra == "" {
		casa.PersonaRegistra = "Sistema"
	}

	result, err := h.casaService.Create(c.Context(), casa)
	if err != nil {
		if errors.Is(err, services.ErrDuplicateCasa) {
			return c.Status(fiber.StatusConflict).JSON(dto.ErrorResponse{
				Error:   "duplicate",
				Message: "Ya existe una casa con esta dirección",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al crear la casa",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(dto.ToCasaResponse(result))
}

// Update modifies an existing casa
// PUT /api/casas/:id
func (h *CasaHandler) Update(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de casa inválido",
		})
	}

	var req dto.UpdateCasaRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos inválidos",
		})
	}

	casa := &models.Casa{}
	if req.CallePrincipal != nil {
		casa.CallePrincipal = *req.CallePrincipal
	}
	if req.Numeracion != nil {
		casa.Numeracion = *req.Numeracion
	}
	if req.CalleSecundaria != nil {
		casa.CalleSecundaria = req.CalleSecundaria
	}
	if req.Sector != nil {
		casa.Sector = *req.Sector
	}
	if req.Referencia != nil {
		casa.Referencia = req.Referencia
	}
	if req.MotivoNoVolver != nil {
		casa.MotivoNoVolver = *req.MotivoNoVolver
	}
	if req.Estado != nil {
		casa.Estado = models.CasaEstado(*req.Estado)
	}
	if req.Latitud != nil {
		casa.Latitud = req.Latitud
	}
	if req.Longitud != nil {
		casa.Longitud = req.Longitud
	}
	if req.FotoURL != nil {
		casa.FotoURL = req.FotoURL
	}

	result, err := h.casaService.Update(c.Context(), id, casa)
	if err != nil {
		if errors.Is(err, services.ErrCasaNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Casa no encontrada",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al actualizar la casa",
		})
	}

	return c.JSON(dto.ToCasaResponse(result))
}

// Delete removes a casa
// DELETE /api/casas/:id
func (h *CasaHandler) Delete(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de casa inválido",
		})
	}

	if err := h.casaService.Delete(c.Context(), id); err != nil {
		if errors.Is(err, repositories.ErrCasaNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Casa no encontrada",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al eliminar la casa",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// GetSectores returns list of unique sectores
// GET /api/casas/sectores
func (h *CasaHandler) GetSectores(c *fiber.Ctx) error {
	sectores, err := h.casaService.GetSectores(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener sectores",
		})
	}

	return c.JSON(fiber.Map{
		"data": sectores,
	})
}

// Helper to convert page/limit
func parseInt(s string, defaultVal int) int {
	if s == "" {
		return defaultVal
	}
	val, err := strconv.Atoi(s)
	if err != nil {
		return defaultVal
	}
	return val
}

// UploadFoto handles photo upload for a casa
// POST /api/casas/:id/foto
func (h *CasaHandler) UploadFoto(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de casa inválido",
		})
	}

	file, err := c.FormFile("foto")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "no_file",
			Message: "No se proporcionó archivo",
		})
	}

	// Validate file type
	ext := ""
	switch file.Header.Get("Content-Type") {
	case "image/jpeg", "image/jpg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/webp":
		ext = ".webp"
	default:
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_type",
			Message: "Solo se permiten imágenes JPEG, PNG o WebP",
		})
	}

	// Create upload directory
	uploadDir := "./uploads/casas"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   " mkdir_error",
			Message: "Error al crear directorio",
		})
	}

	// Generate filename
	filename := fmt.Sprintf("%s%s", id.String(), ext)
	filepath := fmt.Sprintf("%s/%s", uploadDir, filename)

	// Save file
	if err := c.SaveFile(file, filepath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "save_error",
			Message: "Error al guardar archivo",
		})
	}

	// Update casa with foto_url
	fotoURL := fmt.Sprintf("/uploads/casas/%s", filename)
	casa, err := h.casaService.UpdateFotoURL(c.Context(), id, fotoURL)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "update_error",
			Message: "Error al actualizar la casa",
		})
	}

	return c.JSON(dto.ToCasaResponse(casa))
}
