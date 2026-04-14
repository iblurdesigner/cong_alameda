package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/services"
)

type ProgramaVisitaHandler struct {
	service *services.ProgramaVisitaService
}

func NewProgramaVisitaHandler(service *services.ProgramaVisitaService) *ProgramaVisitaHandler {
	return &ProgramaVisitaHandler{service: service}
}

func (h *ProgramaVisitaHandler) List(c *fiber.Ctx) error {
	programas, err := h.service.GetAll(c.Context())
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	var response []dto.ProgramaVisitaResponse
	for _, p := range programas {
		resp := h.toResponse(p)
		response = append(response, resp)
	}

	return c.JSON(fiber.Map{"data": response})
}

func (h *ProgramaVisitaHandler) GetByFecha(c *fiber.Ctx) error {
	fecha := c.Query("fecha")
	if fecha == "" {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "fecha es requerida"})
	}

	programas, err := h.service.GetByFecha(c.Context(), fecha)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	var response []dto.ProgramaVisitaResponse
	for _, p := range programas {
		resp := h.toResponse(p)
		response = append(response, resp)
	}

	return c.JSON(fiber.Map{"data": response})
}

func (h *ProgramaVisitaHandler) Create(c *fiber.Ctx) error {
	var req dto.ProgramaVisitaRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_request"})
	}

	if req.Fecha == "" {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "fecha es requerida"})
	}

	if req.DiaSemana < 0 || req.DiaSemana > 6 {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "dia_semana debe ser entre 0 y 6"})
	}

	programa, err := h.service.Create(
		c.Context(),
		req.ProgramaPredicacionID,
		req.Fecha,
		req.DiaSemana,
		req.Conductor,
		req.Hora,
		req.LugarNombre,
		req.LugarDireccion,
		req.LugarContacto,
		req.LugarTelefono,
		req.GrupoID,
		req.Observaciones,
		nil, // createdBy - puede agregarse del token
	)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.Status(201).JSON(programa)
}

func (h *ProgramaVisitaHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	var req dto.ProgramaVisitaRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_request"})
	}

	updates := make(map[string]interface{})

	if req.Conductor != "" {
		updates["conductor"] = req.Conductor
	}
	if req.Hora != "" {
		updates["hora"] = req.Hora
	}
	if req.LugarNombre != "" {
		updates["lugar_nombre"] = req.LugarNombre
	}
	if req.LugarDireccion != "" {
		updates["lugar_direccion"] = req.LugarDireccion
	}
	if req.LugarContacto != "" {
		updates["lugar_contacto"] = req.LugarContacto
	}
	if req.LugarTelefono != "" {
		updates["lugar_telefono"] = req.LugarTelefono
	}
	if req.GrupoID != nil {
		updates["grupo_id"] = req.GrupoID
	}
	if req.Observaciones != "" {
		updates["observaciones"] = req.Observaciones
	}
	if req.TerritorioIDs != nil && len(req.TerritorioIDs) > 0 {
		updates["territorio_ids"] = req.TerritorioIDs
	}

	programa, err := h.service.Update(c.Context(), id, updates)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	resp := h.toResponse(programa)
	return c.JSON(resp)
}

func (h *ProgramaVisitaHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	if err := h.service.Delete(c.Context(), id); err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.SendStatus(204)
}

func (h *ProgramaVisitaHandler) SetVisited(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	visited := c.Query("visited", "false") == "true"

	if err := h.service.SetVisited(c.Context(), id, visited); err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.JSON(fiber.Map{"success": true})
}

func (h *ProgramaVisitaHandler) toResponse(p *models.ProgramaVisitaDetail) dto.ProgramaVisitaResponse {
	resp := dto.ProgramaVisitaResponse{
		ID:              p.ID.String(),
		Fecha:           p.Fecha,
		DiaSemana:       p.DiaSemana,
		DiaSemanaNombre: models.GetProgramaVisitaDiaNombre(p.DiaSemana),
		Conductor:       p.Conductor,
		Hora:            p.Hora,
		LugarNombre:     p.LugarNombre,
		LugarDireccion:  p.LugarDireccion,
		LugarContacto:   p.LugarContacto,
		LugarTelefono:   p.LugarTelefono,
		Observaciones:   p.Observaciones,
		Visited:         p.Visited,
		CreatedAt:       p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       p.UpdatedAt.Format(time.RFC3339),
	}

	if p.ProgramaPredicacionID != nil {
		id := p.ProgramaPredicacionID.String()
		resp.ProgramaPredicacionID = &id
	}

	if p.Grupo != nil {
		resp.Grupo = &dto.GrupoSimple{
			ID:     p.Grupo.ID.String(),
			Numero: p.Grupo.Numero,
			Nombre: p.Grupo.Nombre,
		}
	}

	if p.Territorios != nil {
		for _, t := range p.Territorios {
			resp.Territorios = append(resp.Territorios, &dto.TerritorioSimple{
				ID:      t.ID.String(),
				Nombre:  t.Nombre,
				GrupoID: t.GrupoID.String(),
			})
		}
	}

	return resp
}
