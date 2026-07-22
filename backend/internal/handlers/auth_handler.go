package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/services"
	"cong-alameda-backend/pkg/jwt"
)

// userService defines the interface for user operations used by AuthHandler.
// The concrete *services.UserService satisfies this interface.
type userService interface {
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.User, error)
	Login(ctx context.Context, email, password string) (*services.LoginResult, error)
}

type AuthHandler struct {
	userService  userService
	jwtMgr       *jwt.JWTManager
	emailService services.EmailService
	rateLimiter  *services.RateLimiter
}

func NewAuthHandler(userService userService, jwtMgr *jwt.JWTManager,
	emailService services.EmailService, rateLimiter *services.RateLimiter) *AuthHandler {
	return &AuthHandler{
		userService:  userService,
		jwtMgr:       jwtMgr,
		emailService: emailService,
		rateLimiter:  rateLimiter,
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

// RequestRecovery initiates a password recovery flow
// POST /api/auth/recover-request
func (h *AuthHandler) RequestRecovery(c *fiber.Ctx) error {
	var req dto.RecoverRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos de solicitud inválidos",
		})
	}

	if req.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "Email es requerido",
		})
	}

	// Rate limiting check
	if !h.rateLimiter.Allow(req.Email) {
		return c.Status(fiber.StatusTooManyRequests).JSON(dto.ErrorResponse{
			Error:   "rate_limit",
			Message: "Demasiadas solicitudes. Intente nuevamente en 5 minutos.",
		})
	}

	// Attempt to find user — silently ignore errors to prevent email enumeration
	user, err := h.userService.GetByEmail(c.Context(), req.Email)
	if err == nil && user.Activo {
		token, tokenErr := h.jwtMgr.GenerateResetToken(user.ID, user.Email)
		if tokenErr == nil {
			_ = h.emailService.SendPasswordReset(req.Email, token)
		}
	}

	return c.Status(fiber.StatusOK).JSON(dto.RecoverResponse{
		Message: "Si el email está registrado, recibirás instrucciones",
	})
}

// ResetPassword resets a user's password using a valid recovery token
// POST /api/auth/recover-password
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req dto.ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos de solicitud inválidos",
		})
	}

	// Validate password length
	if len(req.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "weak_password",
			Message: "La contraseña debe tener al menos 6 caracteres",
		})
	}

	// Validate reset token
	claims, err := h.jwtMgr.ValidateResetToken(req.Token)
	if err != nil {
		switch err {
		case jwt.ErrExpiredToken:
			return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
				Error:   "token_expired",
				Message: "El token de recuperación ha expirado",
			})
		default:
			return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
				Error:   "invalid_token",
				Message: "El token de recuperación es inválido",
			})
		}
	}

	// Update password (service hashes internally)
	_, err = h.userService.Update(c.Context(), claims.UserID, map[string]interface{}{
		"password": req.Password,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error interno del servidor",
		})
	}

	return c.Status(fiber.StatusOK).JSON(dto.RecoverResponse{
		Message: "Contraseña actualizada exitosamente",
	})
}
