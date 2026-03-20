package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/services"
)

type AuthHandler struct {
	userService *services.UserService
}

func NewAuthHandler(userService *services.UserService) *AuthHandler {
	return &AuthHandler{
		userService: userService,
	}
}

// Login handles user authentication
// POST /api/auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos de solicitud inválidos",
		})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "Email y contraseña son requeridos",
		})
	}

	result, err := h.userService.Login(c.Context(), req.Email, req.Password)
	if err != nil {
		switch err {
		case services.ErrInvalidCredentials:
			return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
				Error:   "invalid_credentials",
				Message: "Credenciales inválidas",
			})
		case services.ErrUserInactive:
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error:   "user_inactive",
				Message: "Usuario inactivo",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
				Error:   "internal_error",
				Message: "Error interno del servidor",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(dto.LoginResponse{
		Token: result.Token,
		User: &dto.UserResponse{
			ID:       result.User.ID,
			Nombre:   result.User.Nombre,
			Telefono: result.User.Telefono,
			Email:    result.User.Email,
			Rol:      string(result.User.Rol),
			Activo:   result.User.Activo,
		},
	})
}

// GetCurrentUser returns the current authenticated user
// GET /api/auth/me
func (h *AuthHandler) GetCurrentUser(c *fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: "unauthorized",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
			Error: "invalid_user_id",
		})
	}

	user, err := h.userService.GetByID(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(dto.ErrorResponse{
			Error: "user_not_found",
		})
	}

	return c.JSON(dto.ToUserResponse(user))
}
