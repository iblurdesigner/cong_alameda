package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/services"
)

type ProgramaPredicacionHandler struct {
	service *services.ProgramaPredicacionService
}

func NewProgramaPredicacionHandler(service *services.ProgramaPredicacionService) *ProgramaPredicacionHandler {
	return &ProgramaPredicacionHandler{service: service}
}

func (h *ProgramaPredicacionHandler) List(c *fiber.Ctx) error {
	programas, err := h.service.GetAll(c.Context())
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	// Convert to response format (simplified - no relations for now)
	var response []dto.ProgramaPredicacionResponse
	for _, p := range programas {
		resp := dto.ProgramaPredicacionResponse{
			ID:              p.ID.String(),
			Nombre:          p.Nombre,
			Fecha:           p.Fecha,
			DiaSemana:       p.DiaSemana,
			DiaSemanaNombre: models.GetProgramaDiaNombre(p.DiaSemana),
			Conductor:       p.Conductor,
			HoraInicio:      p.HoraInicio,
			HoraFin:         p.HoraFin,
			LugarNombre:     p.LugarNombre,
			LugarDireccion:  p.LugarDireccion,
			LugarContacto:   p.LugarContacto,
			LugarTelefono:   p.LugarTelefono,
			CreatedAt:       p.CreatedAt.String(),
			UpdatedAt:       p.UpdatedAt.String(),
		}
		response = append(response, resp)
	}

	return c.JSON(fiber.Map{"data": response})
}

func (h *ProgramaPredicacionHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	programa, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(404).JSON(dto.ErrorResponse{Error: "not_found"})
	}

	resp := dto.ProgramaPredicacionResponse{
		ID:              programa.ID.String(),
		Nombre:          programa.Nombre,
		Fecha:           programa.Fecha,
		DiaSemana:       programa.DiaSemana,
		DiaSemanaNombre: models.GetProgramaDiaNombre(programa.DiaSemana),
		Conductor:       programa.Conductor,
		HoraInicio:      programa.HoraInicio,
		HoraFin:         programa.HoraFin,
		LugarNombre:     programa.LugarNombre,
		LugarDireccion:  programa.LugarDireccion,
		LugarContacto:   programa.LugarContacto,
		LugarTelefono:   programa.LugarTelefono,
		CreatedAt:       programa.CreatedAt.String(),
		UpdatedAt:       programa.UpdatedAt.String(),
	}

	if programa.Grupo != nil {
		resp.Grupo = &dto.GrupoSimple{
			ID:     programa.Grupo.ID.String(),
			Numero: programa.Grupo.Numero,
			Nombre: programa.Grupo.Nombre,
		}
	}

	if programa.Territorios != nil && len(programa.Territorios) > 0 {
		for _, t := range programa.Territorios {
			resp.Territorios = append(resp.Territorios, &dto.TerritorioSimple{
				ID:      t.ID.String(),
				Nombre:  t.Nombre,
				GrupoID: t.GrupoID.String(),
			})
		}
	}

	return c.JSON(resp)
}

func (h *ProgramaPredicacionHandler) Create(c *fiber.Ctx) error {
	var req dto.ProgramaPredicacionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_request"})
	}

	// Validate dia_semana (0-6 for Lunes-Domingo) - this is required
	if req.DiaSemana < 0 || req.DiaSemana > 6 {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "dia_semana debe ser entre 0 (Lunes) y 6 (Domingo)"})
	}

	// If nombre/fecha not provided, generate default
	if req.Nombre == "" {
		req.Nombre = "Día " + models.GetProgramaDiaNombre(req.DiaSemana)
	}
	if req.Fecha == "" {
		req.Fecha = time.Now().Format("2006-01-02")
	}

	programa, err := h.service.Create(c.Context(), req.Nombre, req.Fecha, req.DiaSemana, req.Conductor, req.HoraInicio, req.HoraFin, req.LugarNombre, req.LugarDireccion, req.LugarContacto, req.LugarTelefono, req.GrupoID)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	// Handle territorios if provided
	if len(req.TerritorioIDs) > 0 {
		if err := h.service.SetTerritorios(c.Context(), programa.ID, req.TerritorioIDs); err != nil {
			// Log but don't fail
		}
	}

	return c.Status(201).JSON(programa)
}

func (h *ProgramaPredicacionHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	var req dto.ProgramaPredicacionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_request"})
	}

	// Build updates map
	updates := make(map[string]interface{})

	if req.Conductor != "" {
		updates["conductor"] = req.Conductor
	}
	if req.HoraInicio != "" {
		updates["hora_inicio"] = req.HoraInicio
	}
	if req.HoraFin != "" {
		updates["hora_fin"] = req.HoraFin
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
	if len(req.TerritorioIDs) > 0 {
		updates["territorio_ids"] = req.TerritorioIDs
	}

	programa, err := h.service.Update(c.Context(), id, updates)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	resp := dto.ProgramaPredicacionResponse{
		ID:              programa.ID.String(),
		Nombre:          programa.Nombre,
		Fecha:           programa.Fecha,
		DiaSemana:       programa.DiaSemana,
		DiaSemanaNombre: models.GetProgramaDiaNombre(programa.DiaSemana),
		Conductor:       programa.Conductor,
		HoraInicio:      programa.HoraInicio,
		HoraFin:         programa.HoraFin,
		LugarNombre:     programa.LugarNombre,
		LugarDireccion:  programa.LugarDireccion,
		LugarContacto:   programa.LugarContacto,
		LugarTelefono:   programa.LugarTelefono,
		CreatedAt:       programa.CreatedAt.String(),
		UpdatedAt:       programa.UpdatedAt.String(),
	}

	if programa.Grupo != nil {
		resp.Grupo = &dto.GrupoSimple{
			ID:     programa.Grupo.ID.String(),
			Numero: programa.Grupo.Numero,
			Nombre: programa.Grupo.Nombre,
		}
	}

	if programa.Territorios != nil && len(programa.Territorios) > 0 {
		for _, t := range programa.Territorios {
			resp.Territorios = append(resp.Territorios, &dto.TerritorioSimple{
				ID:      t.ID.String(),
				Nombre:  t.Nombre,
				GrupoID: t.GrupoID.String(),
			})
		}
	}

	return c.JSON(resp)
}

func (h *ProgramaPredicacionHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_id"})
	}

	if err := h.service.Delete(c.Context(), id); err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	return c.SendStatus(204)
}
