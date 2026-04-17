package handlers

import (
	"log"
	"strconv"
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
		log.Printf("ERROR: List ProgramaPredicacion: %v", err)
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	var response []dto.ProgramaPredicacionResponse
	for _, p := range programas {
		resp := dto.ProgramaPredicacionResponse{
			ID:                p.ID.String(),
			Nombre:            p.Nombre,
			Fecha:             p.Fecha,
			DiaSemana:         p.DiaSemana,
			DiaSemanaNombre:   models.GetProgramaDiaNombre(p.DiaSemana),
			Conductor:         p.Conductor,
			HoraInicio:        p.HoraInicio,
			HoraFin:           p.HoraFin,
			LugarNombre:       p.LugarNombre,
			LugarDireccion:    p.LugarDireccion,
			LugarCiudad:       p.LugarCiudad,
			LugarProvincia:    p.LugarProvincia,
			LugarCodigoPostal: p.LugarCodigoPostal,
			LugarPais:         p.LugarPais,
			LugarUbicacion:    p.LugarUbicacion, // ← SIEMPRE incluir
			LugarContacto:     p.LugarContacto,
			LugarTelefono:     p.LugarTelefono,
			CreatedAt:         p.CreatedAt.String(),
			UpdatedAt:         p.UpdatedAt.String(),
		}
		// Incluir Grupo si existe
		if p.Grupo != nil {
			resp.Grupo = &dto.GrupoSimple{
				ID:     p.Grupo.ID.String(),
				Numero: p.Grupo.Numero,
				Nombre: p.Grupo.Nombre,
			}
		}
		// Incluir Territorios si existen
		for _, t := range p.Territorios {
			resp.Territorios = append(resp.Territorios, &dto.TerritorioSimple{
				ID:      t.ID.String(),
				Nombre:  t.Nombre,
				GrupoID: t.GrupoID.String(),
			})
		}
		log.Printf("[List] prog=%s ubicacion='%s' grupo=%v territorios=%d",
			p.ID, p.LugarUbicacion, p.Grupo != nil, len(p.Territorios))
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
	log.Printf("=== Create ProgramaPredicacion called ===")

	var req dto.ProgramaPredicacionRequest
	if err := c.BodyParser(&req); err != nil {
		log.Printf("ERROR: BodyParser failed: %v", err)
		return c.Status(400).JSON(dto.ErrorResponse{Error: "invalid_request"})
	}

	// Convert dia_semana from any (string from frontend) to int
	var diaSemana int
	switch v := req.DiaSemana.(type) {
	case float64:
		diaSemana = int(v)
	case int:
		diaSemana = v
	case string:
		diaSemanaInt, err := strconv.Atoi(v)
		if err != nil {
			diaSemana = 0
		} else {
			diaSemana = diaSemanaInt
		}
	default:
		diaSemana = 0
	}
	req.DiaSemana = diaSemana

	log.Printf("DEBUG: Create ProgramaPredicacion - req: %+v", req)
	log.Printf("DEBUG: Nombre='%s', Fecha='%s', DiaSemana=%d", req.Nombre, req.Fecha, diaSemana)
	log.Printf("DEBUG: Conductor='%s', HoraInicio='%s', HoraFin='%s'", req.Conductor, req.HoraInicio, req.HoraFin)

	// Validate dia_semana (0-6 for Lunes-Domingo) - this is required
	// If not provided or invalid, default to 0 (Lunes)
	if diaSemana < 0 || diaSemana > 6 {
		log.Printf("DEBUG: dia_semana invalid (%d), defaulting to 0", diaSemana)
		diaSemana = 0 // Default to Monday
		req.DiaSemana = diaSemana
	}

	// Validate fecha - required field
	if req.Fecha == "" {
		req.Fecha = time.Now().Format("2006-01-02")
		log.Printf("DEBUG: fecha empty, defaulting to %s", req.Fecha)
	}

	// If nombre not provided, generate default
	if req.Nombre == "" {
		req.Nombre = "Día " + models.GetProgramaDiaNombre(diaSemana)
	}

	programa, err := h.service.Create(c.Context(), req.Nombre, req.Fecha, diaSemana, req.Conductor, req.HoraInicio, req.HoraFin, req.LugarNombre, req.LugarDireccion, req.LugarCiudad, req.LugarProvincia, req.LugarCodigoPostal, req.LugarPais, req.LugarContacto, req.LugarTelefono, req.GrupoID)
	if err != nil {
		log.Printf("ERROR: service.Create failed: %v", err)
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

	// Convert dia_semana from any (string from frontend) to int
	var diaSemana int
	switch v := req.DiaSemana.(type) {
	case float64:
		diaSemana = int(v)
	case int:
		diaSemana = v
	case string:
		diaSemanaInt, err := strconv.Atoi(v)
		if err != nil {
			diaSemana = -1 // Invalid
		} else {
			diaSemana = diaSemanaInt
		}
	default:
		diaSemana = -1 // Not provided
	}
	req.DiaSemana = diaSemana

	// Build updates map
	updates := make(map[string]interface{})

	// Handle name, fecha, and dia_semana (only if provided and valid)
	if req.Nombre != "" {
		updates["nombre"] = req.Nombre
	}
	if req.Fecha != "" {
		updates["fecha"] = req.Fecha
	}
	if diaSemana >= 0 && diaSemana <= 6 {
		updates["dia_semana"] = diaSemana
	}
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
	if req.LugarCiudad != "" {
		updates["lugar_ciudad"] = req.LugarCiudad
	}
	if req.LugarProvincia != "" {
		updates["lugar_provincia"] = req.LugarProvincia
	}
	if req.LugarCodigoPostal != "" {
		updates["lugar_codigo_postal"] = req.LugarCodigoPostal
	}
	if req.LugarPais != "" {
		updates["lugar_pais"] = req.LugarPais
	}
	// lugar_ubicacion: siempre actualizar (puede quedar vacío para limpiar)
	updates["lugar_ubicacion"] = req.LugarUbicacion
	if req.LugarContacto != "" {
		updates["lugar_contacto"] = req.LugarContacto
	}
	if req.LugarTelefono != "" {
		updates["lugar_telefono"] = req.LugarTelefono
	}
	// grupo_id: siempre incluir — nil = quitar grupo
	updates["grupo_id"] = req.GrupoID
	// territorio_ids: siempre incluir — array vacío = limpiar territorios
	updates["territorio_ids"] = req.TerritorioIDs
	log.Printf("[Update] id=%s grupo_id=%v territorios=%v ubicacion='%s'",
		id, req.GrupoID, req.TerritorioIDs, req.LugarUbicacion)

	programa, err := h.service.Update(c.Context(), id, updates)
	if err != nil {
		return c.Status(500).JSON(dto.ErrorResponse{Error: "internal_error"})
	}

	resp := dto.ProgramaPredicacionResponse{
		ID:                programa.ID.String(),
		Nombre:            programa.Nombre,
		Fecha:             programa.Fecha,
		DiaSemana:         programa.DiaSemana,
		DiaSemanaNombre:   models.GetProgramaDiaNombre(programa.DiaSemana),
		Conductor:         programa.Conductor,
		HoraInicio:        programa.HoraInicio,
		HoraFin:           programa.HoraFin,
		LugarNombre:       programa.LugarNombre,
		LugarDireccion:    programa.LugarDireccion,
		LugarCiudad:       programa.LugarCiudad,
		LugarProvincia:    programa.LugarProvincia,
		LugarCodigoPostal: programa.LugarCodigoPostal,
		LugarPais:         programa.LugarPais,
		LugarUbicacion:    programa.LugarUbicacion,
		LugarContacto:     programa.LugarContacto,
		LugarTelefono:     programa.LugarTelefono,
		CreatedAt:         programa.CreatedAt.String(),
		UpdatedAt:         programa.UpdatedAt.String(),
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
