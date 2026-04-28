package handlers

import (
	"errors"
	"log"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/services"
	"cong-alameda-backend/pkg/jwt"
)

type AuthHandler struct {
	userService *services.UserService
	jwtMgr      *jwt.JWTManager
	// Rate limiting: email -> last request timestamp
	rateLimit    map[string]time.Time
	rateLimitMu  sync.RWMutex
}

func NewAuthHandler(userService *services.UserService, jwtMgr *jwt.JWTManager) *AuthHandler {
	return &AuthHandler{
		userService: userService,
		jwtMgr:      jwtMgr,
		rateLimit:   make(map[string]time.Time),
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

	userResp := dto.ToUserResponse(result.User)
	return c.Status(fiber.StatusOK).JSON(dto.LoginResponse{
		Token: result.Token,
		User:  &userResp,
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

// UpdateCurrentUserProfile allows the authenticated user to update their own profile
// PUT /api/auth/profile
func (h *AuthHandler) UpdateCurrentUserProfile(c *fiber.Ctx) error {
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

	var req dto.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos inválidos",
		})
	}

	// Build update map
	updates := make(map[string]interface{})
	if req.Nombre != nil {
		updates["nombre"] = *req.Nombre
	}
	if req.Telefono != nil {
		updates["telefono"] = *req.Telefono
	}
	if req.NotificacionesEmail != nil {
		updates["notificaciones_email"] = *req.NotificacionesEmail
	}
	if req.NotificacionesWhatsapp != nil {
		updates["notificaciones_whatsapp"] = *req.NotificacionesWhatsapp
	}

	if len(updates) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "No hay datos para actualizar",
		})
	}

	user, err := h.userService.Update(c.Context(), userID, updates)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al actualizar perfil",
		})
	}

	return c.JSON(dto.ToUserResponse(user))
}

// RecoverRequest handles password reset request
// POST /api/auth/recover-request
func (h *AuthHandler) RecoverRequest(c *fiber.Ctx) error {
	var req dto.RecoverRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Email requerido",
		})
	}

	if req.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "Email requerido",
		})
	}

	// Rate limiting: 1 request per email per 5 minutes
	h.rateLimitMu.Lock()
	lastReq, exists := h.rateLimit[req.Email]
	if exists && time.Since(lastReq) < 5*time.Minute {
		h.rateLimitMu.Unlock()
		return c.Status(fiber.StatusTooManyRequests).JSON(dto.ErrorResponse{
			Error:   "rate_limit_exceeded",
			Message: "Demasiadas solicitudes. Intenta de nuevo en 5 minutos.",
		})
	}
	h.rateLimit[req.Email] = time.Now()
	h.rateLimitMu.Unlock()

	// Check if user exists (but always return success to prevent enumeration)
	user, err := h.userService.GetByEmailForRecovery(c.Context(), req.Email)
	if err != nil {
		// User not found - still return success to prevent email enumeration
		log.Printf("[RECOVERY] User not found for email: %s", req.Email)
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Si el email existe en nuestro sistema, recibirás un enlace de recuperación.",
		})
	}

	// Generate reset token
	token, err := h.jwtMgr.GenerateResetToken(user.Email)
	if err != nil {
		log.Printf("[RECOVERY] Failed to generate token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error interno del servidor",
		})
	}

	// Send email
	resetLink := "http://localhost:4200/recovery?token=" + token
	notifService := services.GetNotificationService()
	if err := notifService.SendPasswordResetNotification(user.Email, resetLink); err != nil {
		log.Printf("[RECOVERY] Failed to send email: %v", err)
		// Don't fail the request - token was generated successfully
	}

	log.Printf("[RECOVERY] Reset email sent to: %s", user.Email)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Si el email existe en nuestro sistema, recibirás un enlace de recuperación.",
	})
}

// RecoverPassword handles password change with reset token
// POST /api/auth/recover-password
func (h *AuthHandler) RecoverPassword(c *fiber.Ctx) error {
	var req dto.RecoverPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "bad_request",
			Message: "Datos inválidos",
		})
	}

	if req.Token == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "validation_error",
			Message: "Token y contraseña son requeridos",
		})
	}

	if len(req.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "password_too_short",
			Message: "La contraseña debe tener al menos 6 caracteres",
		})
	}

	// Validate reset token
	claims, err := h.jwtMgr.ValidateResetToken(req.Token)
	if err != nil {
		if errors.Is(err, jwt.ErrExpiredToken) {
			return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
				Error:   "token_expired",
				Message: "El enlace ha expirado. Solicita uno nuevo.",
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(dto.ErrorResponse{
			Error:   "invalid_token",
			Message: "Token inválido",
		})
	}

	// Update password
	if err := h.userService.UpdatePassword(c.Context(), claims.Email, req.Password); err != nil {
		log.Printf("[RECOVERY] Failed to update password: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(dto.ErrorResponse{
			Error:   "internal_error",
			Message: "Error al actualizar la contraseña",
		})
	}

	log.Printf("[RECOVERY] Password updated for: %s", claims.Email)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Contraseña actualizada correctamente",
	})
}
