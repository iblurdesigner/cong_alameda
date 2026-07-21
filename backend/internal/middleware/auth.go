package middleware

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"cong-alameda-backend/pkg/jwt"
)

type AuthMiddleware struct {
	jwtManager *jwt.JWTManager
}

func NewAuthMiddleware(jwtManager *jwt.JWTManager) *AuthMiddleware {
	return &AuthMiddleware{jwtManager: jwtManager}
}

func (m *AuthMiddleware) Authenticate() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Token requerido",
			})
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Formato de token inválido",
			})
		}

		tokenString := parts[1]
		claims, err := m.jwtManager.ValidateToken(tokenString)
		if err != nil {
			if err == jwt.ErrExpiredToken {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "Token expirado",
				})
			}
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Token inválido",
			})
		}

		// Store claims in context (convert UUID to string)
		c.Locals("user_id", claims.UserID.String())
		c.Locals("user_email", claims.Email)
		c.Locals("user_rol", claims.Rol)

		return c.Next()
	}
}

// RequireRole checks if user has the required role
func (m *AuthMiddleware) RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRol := c.Locals("user_rol").(string)

		for _, role := range roles {
			if userRol == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "No tienes permiso para acceder a este recurso",
		})
	}
}

// CORSMiddleware handles CORS
func CORSMiddleware(allowedOrigins string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("Access-Control-Allow-Origin", allowedOrigins)
		c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Set("Access-Control-Allow-Credentials", "true")

		if c.Method() == "OPTIONS" {
			return c.SendStatus(fiber.StatusNoContent)
		}

		return c.Next()
	}
}

// RequestLogger logs request information
func RequestLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Process request
		err := c.Next()

		// Log after request
		duration := time.Since(start)
		c.Locals("latency", duration)

		// In production, use proper logging
		if c.Response().StatusCode() >= 400 {
			// Log error requests
		}

		return err
	}
}
