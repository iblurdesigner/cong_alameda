package middleware

import (
	"net/http"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/pkg/jwt"
)

// newTestApp builds a Fiber app with Authenticate + RequireRole wired,
// mirroring how main.go protects privileged routes.
func newTestApp(t *testing.T, jwtManager *jwt.JWTManager, roles ...string) *fiber.App {
	t.Helper()
	app := fiber.New()
	mw := NewAuthMiddleware(jwtManager)

	app.Use(mw.Authenticate())
	app.Use(mw.RequireRole(roles...))
	app.Get("/", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"ok": true})
	})
	return app
}

func makeToken(t *testing.T, mgr *jwt.JWTManager, rol string) string {
	t.Helper()
	tok, err := mgr.GenerateToken(uuid.New(), "test@example.com", rol)
	if err != nil {
		t.Fatalf("generar token: %v", err)
	}
	return tok
}

func TestRequireRole_AcceptsSuperAdmin_WhenMultiRoleConfigured(t *testing.T) {
	mgr := jwt.NewJWTManager("test-secret", 1)
	app := newTestApp(t, mgr, "SUPERINTENDENTE", "SUPER_ADMIN")

	token := makeToken(t, mgr, "SUPER_ADMIN")

	req := newTestRequest(token)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("SUPER_ADMIN deberia ser aceptado, got status %d", resp.StatusCode)
	}
}

func TestRequireRole_AcceptsSuperintendente_Unchanged(t *testing.T) {
	mgr := jwt.NewJWTManager("test-secret", 1)
	app := newTestApp(t, mgr, "SUPERINTENDENTE", "SUPER_ADMIN")

	token := makeToken(t, mgr, "SUPERINTENDENTE")

	req := newTestRequest(token)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("SUPERINTENDENTE deberia seguir aceptado, got status %d", resp.StatusCode)
	}
}

func TestRequireRole_RejectsLesserRole_With403(t *testing.T) {
	mgr := jwt.NewJWTManager("test-secret", 1)
	app := newTestApp(t, mgr, "SUPERINTENDENTE", "SUPER_ADMIN")

	token := makeToken(t, mgr, "ADMIN")

	req := newTestRequest(token)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("rol menor deberia ser rechazado con 403, got status %d", resp.StatusCode)
	}
}

func TestRequireRole_RejectsMissingToken_With401(t *testing.T) {
	mgr := jwt.NewJWTManager("test-secret", 1)
	app := newTestApp(t, mgr, "SUPERINTENDENTE", "SUPER_ADMIN")

	req := newTestRequest("")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("sin token deberia ser 401, got status %d", resp.StatusCode)
	}
}

// newTestRequest builds a Fiber test request with an optional Bearer token.
func newTestRequest(token string) *http.Request {
	var header string
	if token != "" {
		header = "Bearer " + token
	}
	req, err := http.NewRequest(fiber.MethodGet, "/", nil)
	if err != nil {
		panic(err)
	}
	if header != "" {
		req.Header.Set("Authorization", header)
	}
	return req
}
