package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// List returns all users
// GET /api/users
func (h *UserHandler) List(c *fiber.Ctx) error {
	users, err := h.userService.List(c.Context(), nil, nil)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener usuarios",
		})
	}

	// Convert to response DTOs
	data := make([]dto.UserResponse, 0, len(users))
	for _, u := range users {
		data = append(data, dto.ToUserResponse(u))
	}

	return c.JSON(fiber.Map{
		"data": data,
	})
}

// GetVisitantes returns only visitors (for visita assignment)
// GET /api/users/visitantes
func (h *UserHandler) GetVisitantes(c *fiber.Ctx) error {
	users, err := h.userService.GetVisitantes(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener visitantes",
		})
	}

	// Convert to response DTOs
	data := make([]dto.UserResponse, 0, len(users))
	for _, u := range users {
		data = append(data, dto.ToUserResponse(u))
	}

	return c.JSON(fiber.Map{
		"data": data,
	})
}

// GetByID returns a single user
// GET /api/users/:id
func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de usuario inválido",
		})
	}

	user, err := h.userService.GetByID(c.Context(), id)
	if err != nil {
		if err == repositories.ErrUserNotFound {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Usuario no encontrado",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al obtener usuario",
		})
	}

	return c.JSON(dto.ToUserResponse(user))
}

// Create registers a new user
// POST /api/users
func (h *UserHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos inválidos",
		})
	}

	// Validation
	if req.Nombre == "" || req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "Campos requeridos: nombre, email, password",
		})
	}

	rol := models.RolVisitante
	if req.Rol != "" {
		rol = models.Rol(req.Rol)
		if !rol.IsValid() {
			return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
				Error:   "validation_error",
				Message: "Rol inválido. Valores: SUPERINTENDENTE, ANCIANO, VISITANTE",
			})
		}
	}

	user := &models.User{
		Nombre:   req.Nombre,
		Telefono: req.Telefono,
		Email:    req.Email,
		Password: req.Password,
		Rol:      rol,
		Activo:   true,
	}

	if err := h.userService.Create(c.Context(), user); err != nil {
		if err == repositories.ErrUserEmailExists {
			return c.Status(fiber.StatusConflict).JSON(dto.ErrorResponse{
				Error:   "duplicate_email",
				Message: "El email ya está registrado",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al crear usuario",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(dto.ToUserResponse(user))
}

// Update modifies an existing user
// PUT /api/users/:id
func (h *UserHandler) Update(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de usuario inválido",
		})
	}

	var req dto.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos inválidos",
		})
	}

	updates := make(map[string]interface{})
	if req.Nombre != nil {
		updates["nombre"] = *req.Nombre
	}
	if req.Telefono != nil {
		updates["telefono"] = *req.Telefono
	}
	if req.TelefonoValidado != nil {
		updates["telefono_validado"] = *req.TelefonoValidado
	}
	if req.NotificacionesEmail != nil {
		updates["notificaciones_email"] = *req.NotificacionesEmail
	}
	if req.NotificacionesWhatsapp != nil {
		updates["notificaciones_whatsapp"] = *req.NotificacionesWhatsapp
	}
	if req.Activo != nil {
		updates["activo"] = *req.Activo
	}
	if req.Rol != nil {
		rol := models.Rol(*req.Rol)
		if !rol.IsValid() {
			return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
				Error:   "validation_error",
				Message: "Rol inválido. Valores: SUPER_ADMIN, SUPERINTENDENTE, ANCIANO, VISITANTE",
			})
		}
		updates["rol"] = rol
	}

	user, err := h.userService.Update(c.Context(), id, updates)
	if err != nil {
		if err == repositories.ErrUserNotFound {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Usuario no encontrado",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al actualizar usuario",
		})
	}

	return c.JSON(dto.ToUserResponse(user))
}

// Delete removes a user
// DELETE /api/users/:id
func (h *UserHandler) Delete(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_id",
			Message: "ID de usuario inválido",
		})
	}

	if err := h.userService.Delete(c.Context(), id); err != nil {
		if err == repositories.ErrUserNotFound {
			return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
				Error:   "not_found",
				Message: "Usuario no encontrado",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al eliminar usuario",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
