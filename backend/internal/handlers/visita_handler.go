package handlers

import (
	"errors"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type VisitaHandler struct {
	visitaService *services.VisitaService
	casaService   *services.CasaService
	userService   *services.UserService
}

func NewVisitaHandler(visitaService *services.VisitaService, casaService *services.CasaService, userService *services.UserService) *VisitaHandler {
	return &VisitaHandler{
		visitaService: visitaService,
		casaService:   casaService,
		userService:   userService,
	}
}

// List returns all visitas with filters
// GET /api/visitas
func (h *VisitaHandler) List(c *fiber.Ctx) error {
	filter := dto.VisitaFilter{
		Estado: c.Query("estado"),
		Page:   c.QueryInt("page", 1),
		Limit:  c.QueryInt("limit", 20),
	}

	var casaID *uuid.UUID
	if casaIDStr := c.Query("casa_id"); casaIDStr != "" {
		id, err := uuid.Parse(casaIDStr)
		if err == nil {
			casaID = &id
		}
	}

	visitas, total, err := h.visitaService.List(c.Context(), casaID, filter.Estado, filter.Page, filter.Limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener las visitas",
		})
	}

	// Convert to response DTOs
	data := make([]dto.VisitaResponse, 0, len(visitas))
	for _, v := range visitas {
		resp := h.visitaToResponse(v)
		// Fetch casa info
		if casa, err := h.casaService.GetByID(c.Context(), v.CasaID); err == nil && casa != nil {
			resp.Casa = &dto.CasaInfo{
				CallePrincipal:  casa.CallePrincipal,
				Numeracion:      casa.Numeracion,
				CalleSecundaria: casa.CalleSecundaria,
				Sector:          casa.Sector,
				Referencia:      casa.Referencia,
			}
		}
		// Fetch visitor names
		if v.Visitante1ID != uuid.Nil {
			if user, err := h.userService.GetByID(c.Context(), v.Visitante1ID); err == nil && user != nil {
				resp.Visitante1Nombre = &user.Nombre
			}
		}
		if v.Visitante2ID != uuid.Nil {
			if user, err := h.userService.GetByID(c.Context(), v.Visitante2ID); err == nil && user != nil {
				resp.Visitante2Nombre = &user.Nombre
			}
		}
		data = append(data, resp)
	}

	return c.JSON(dto.VisitaListResponse{
		Data:  data,
		Total: total,
	})
}

func (h *VisitaHandler) visitaToResponse(v *models.Visita) dto.VisitaResponse {
	resp := dto.VisitaResponse{
		ID:              v.ID,
		CasaID:          v.CasaID,
		FechaProgramada: v.FechaProgramada.Format("2006-01-02"),
		Visitante1ID:    v.Visitante1ID,
		Visitante2ID:    v.Visitante2ID,
		Observaciones:   v.Observaciones,
		Estado:          string(v.Estado),
		CreatedAt:       v.CreatedAt.Format("2006-01-02T15:04:05Z"),
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

// GetByID returns a single visita with detail
// GET /api/visitas/:id
func (h *VisitaHandler) GetByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de visita inválido",
		})
	}

	detail, err := h.visitaService.GetDetail(c.Context(), id)
	if err != nil {
		if errors.Is(err, repositories.ErrVisitaNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Visita no encontrada",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener la visita",
		})
	}

	// Convert detail
	resp := dto.VisitaDetailResponse{
		VisitaResponse: h.visitaToResponse(&detail.Visita),
	}
	if detail.Casa != nil {
		casaResp := dto.ToCasaResponse(detail.Casa)
		resp.Casa = &casaResp
	}
	if detail.Visitante1 != nil {
		userResp := dto.ToUserResponse(detail.Visitante1)
		resp.Visitante1 = &userResp
	}
	if detail.Visitante2 != nil {
		userResp := dto.ToUserResponse(detail.Visitante2)
		resp.Visitante2 = &userResp
	}

	return c.JSON(resp)
}

// Create programs a new visita
// POST /api/visitas
func (h *VisitaHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateVisitaRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos inválidos",
		})
	}

	// Validation
	if req.CasaID == uuid.Nil || req.Visitante1ID == uuid.Nil || req.Visitante2ID == uuid.Nil || req.FechaProgramada == "" {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "Campos requeridos: casa_id, visitante_1_id, visitante_2_id, fecha_programada",
		})
	}

	fechaProg, err := time.Parse("2006-01-02", req.FechaProgramada)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "Formato de fecha inválido. Use YYYY-MM-DD",
		})
	}

	visita := &models.Visita{
		CasaID:          req.CasaID,
		FechaProgramada: fechaProg,
		Visitante1ID:    req.Visitante1ID,
		Visitante2ID:    req.Visitante2ID,
	}

	result, err := h.visitaService.Create(c.Context(), visita)
	if err != nil {
		switch err {
		case services.ErrCasaNotFound:
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Casa no encontrada",
			})
		case services.ErrInvalidVisitante:
			return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
				Error:   "invalid_visitante",
				Message: "Uno o más visitantes no son válidos",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
				Error:   "internal_error",
				Message: "Error al crear la visita",
			})
		}
	}

	// Send notification emails (async)
	go func() {
		// Get casa info
		casa, err := h.casaService.GetByID(c.Context(), result.CasaID)
		if err != nil {
			log.Printf("[NOTIFICATION] Could not get casa for visit notification: %v", err)
			return
		}

		// Build address from casa fields
		direccion := casa.CallePrincipal + " " + casa.Numeracion
		if casa.CalleSecundaria != nil && *casa.CalleSecundaria != "" {
			direccion += " y " + *casa.CalleSecundaria
		}
		direccion += ", " + casa.Sector

		// Send to both visitors
		visitorIDs := []uuid.UUID{result.Visitante1ID, result.Visitante2ID}
		fecha := result.FechaProgramada.Format("02/01/2006")

		for _, vid := range visitorIDs {
			user, err := h.userService.GetByID(c.Context(), vid)
			if err != nil || user == nil {
				log.Printf("[NOTIFICATION] Could not get visitor %s: %v", vid, err)
				continue
			}

			obs := ""
			if result.Observaciones != nil {
				obs = *result.Observaciones
			}

			if err := services.GetNotificationService().SendVisitScheduledNotification(user, direccion, fecha, obs); err != nil {
				log.Printf("[NOTIFICATION] Failed to send visit notification to %s: %v", user.Email, err)
			}
		}
	}()

	return c.Status(fiber.StatusCreated).JSON(h.visitaToResponse(result))
}

// Update modifies an existing visita (records result)
// PUT /api/visitas/:id
func (h *VisitaHandler) Update(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de visita inválido",
		})
	}

	var req dto.UpdateVisitaRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos inválidos",
		})
	}

	updates := make(map[string]interface{})
	if req.FechaRealizada != nil {
		fecha, err := time.Parse("2006-01-02", *req.FechaRealizada)
		if err == nil {
			updates["fecha_realizada"] = fecha
		}
	}
	if req.Observaciones != nil {
		updates["observaciones"] = *req.Observaciones
	}
	if req.DeseaSeguirRecibiendo != nil {
		updates["desea_seguir_recibiendo"] = *req.DeseaSeguirRecibiendo
	}
	if req.Estado != nil {
		updates["estado"] = *req.Estado
	}
	if req.Visitante1ID != nil {
		updates["visitante_1_id"] = *req.Visitante1ID
	}
	if req.Visitante2ID != nil {
		updates["visitante_2_id"] = *req.Visitante2ID
	}

	result, err := h.visitaService.Update(c.Context(), id, updates)
	if err != nil {
		if errors.Is(err, services.ErrVisitaNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Visita no encontrada",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al actualizar la visita",
		})
	}

	// Build response with casa info and visitor names
	resp := h.visitaToResponse(result)

	// Fetch casa info
	if casa, err := h.casaService.GetByID(c.Context(), result.CasaID); err == nil && casa != nil {
		resp.Casa = &dto.CasaInfo{
			CallePrincipal:  casa.CallePrincipal,
			Numeracion:      casa.Numeracion,
			CalleSecundaria: casa.CalleSecundaria,
			Sector:          casa.Sector,
			Referencia:      casa.Referencia,
		}
	}

	// Fetch visitor names
	if result.Visitante1ID != uuid.Nil {
		if user, err := h.userService.GetByID(c.Context(), result.Visitante1ID); err == nil && user != nil {
			resp.Visitante1Nombre = &user.Nombre
		}
	}
	if result.Visitante2ID != uuid.Nil {
		if user, err := h.userService.GetByID(c.Context(), result.Visitante2ID); err == nil && user != nil {
			resp.Visitante2Nombre = &user.Nombre
		}
	}

	return c.JSON(resp)
}

// Delete removes a visita
// DELETE /api/visitas/:id
func (h *VisitaHandler) Delete(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de visita inválido",
		})
	}

	if err := h.visitaService.Delete(c.Context(), id); err != nil {
		if errors.Is(err, repositories.ErrVisitaNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Visita no encontrada",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al eliminar la visita",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// GetStats returns dashboard statistics
// GET /api/visitas/stats
func (h *VisitaHandler) GetStats(c *fiber.Ctx) error {
	stats, err := h.visitaService.GetStats(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener estadísticas",
		})
	}

	return c.JSON(stats)
}
