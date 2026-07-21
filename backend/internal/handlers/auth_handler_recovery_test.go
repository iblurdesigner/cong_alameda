package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	jwtv5 "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/services"
	"cong-alameda-backend/pkg/jwt"
)

// --- Mocks ---

type mockEmailService struct {
	sentTo map[string]string // email -> token
}

func newMockEmailService() *mockEmailService {
	return &mockEmailService{sentTo: make(map[string]string)}
}

func (m *mockEmailService) SendPasswordReset(email string, token string) error {
	m.sentTo[email] = token
	return nil
}

type mockUserService struct {
	users   map[string]*models.User // email -> user
	updated map[uuid.UUID]string     // userID -> new password
}

func newMockUserService() *mockUserService {
	return &mockUserService{
		users:   make(map[string]*models.User),
		updated: make(map[uuid.UUID]string),
	}
}

func (m *mockUserService) GetByEmail(_ context.Context, email string) (*models.User, error) {
	user, ok := m.users[email]
	if !ok {
		return nil, errUserNotFound
	}
	return user, nil
}

func (m *mockUserService) GetByID(_ context.Context, id uuid.UUID) (*models.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, errUserNotFound
}

func (m *mockUserService) Update(_ context.Context, id uuid.UUID, updates map[string]interface{}) (*models.User, error) {
	if pwd, ok := updates["password"].(string); ok {
		m.updated[id] = pwd
	}
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, errUserNotFound
}

func (m *mockUserService) Login(_ context.Context, email, password string) (*services.LoginResult, error) {
	return nil, nil // Not used in recovery tests
}

var errUserNotFound = fiber.NewError(fiber.StatusNotFound, "usuario no encontrado")

// --- Test Setup ---

type recoveryTestHarness struct {
	app          *fiber.App
	authHandler  *AuthHandler
	mockEmail    *mockEmailService
	mockUserSvc  *mockUserService
	jwtMgr       *jwt.JWTManager
}

func newRecoveryTestHarness() *recoveryTestHarness {
	app := fiber.New()

	mockEmail := newMockEmailService()
	mockUserSvc := newMockUserService()
	jwtMgr := jwt.NewJWTManager("test-secret-for-recovery-tests", 24)
	rateLimiter := services.NewRateLimiter(100 * time.Millisecond)

	handler := NewAuthHandler(mockUserSvc, jwtMgr, mockEmail, rateLimiter)

	auth := app.Group("/api/auth")
	auth.Post("/recover-request", handler.RequestRecovery)
	auth.Post("/recover-password", handler.ResetPassword)

	return &recoveryTestHarness{
		app:         app,
		authHandler: handler,
		mockEmail:   mockEmail,
		mockUserSvc: mockUserSvc,
		jwtMgr:      jwtMgr,
	}
}

func (h *recoveryTestHarness) postJSON(url, body string) (*http.Response, error) {
	req := httptest.NewRequest("POST", url, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return h.app.Test(req, 1000) // 1s timeout
}

func TestRequestRecovery_ValidEmail(t *testing.T) {
	h := newRecoveryTestHarness()

	userID := uuid.New()
	h.mockUserSvc.users["active@example.com"] = &models.User{
		ID:     userID,
		Email:  "active@example.com",
		Nombre: "Test User",
		Rol:    models.RolVisitante,
		Activo: true,
	}

	resp, err := h.postJSON("/api/auth/recover-request", `{"email":"active@example.com"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// Verify token was sent
	if _, sent := h.mockEmail.sentTo["active@example.com"]; !sent {
		t.Error("expected email to be sent to active user")
	}

	// Verify response body
	var body dto.RecoverResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if body.Message == "" {
		t.Error("expected non-empty message")
	}
}

func TestRequestRecovery_EmailNotFound(t *testing.T) {
	h := newRecoveryTestHarness()

	resp, err := h.postJSON("/api/auth/recover-request", `{"email":"unknown@example.com"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Must return 200 even for non-existent email (enumeration prevention)
	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200 for non-existent email, got %d", resp.StatusCode)
	}

	// Verify no token was sent
	if len(h.mockEmail.sentTo) > 0 {
		t.Error("expected no email to be sent for unknown user")
	}
}

func TestRequestRecovery_RateLimited(t *testing.T) {
	h := newRecoveryTestHarness()

	// First request — should succeed
	resp1, err := h.postJSON("/api/auth/recover-request", `{"email":"ratelimit@example.com"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp1.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200 on first request, got %d", resp1.StatusCode)
	}

	// Second request — should be rate limited
	resp2, err := h.postJSON("/api/auth/recover-request", `{"email":"ratelimit@example.com"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp2.StatusCode != fiber.StatusTooManyRequests {
		t.Errorf("expected 429, got %d", resp2.StatusCode)
	}

	// Different email should work
	resp3, err := h.postJSON("/api/auth/recover-request", `{"email":"other@example.com"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp3.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200 for different email, got %d", resp3.StatusCode)
	}
}

func TestResetPassword_ValidToken(t *testing.T) {
	h := newRecoveryTestHarness()

	userID := uuid.New()
	h.mockUserSvc.users["reset@example.com"] = &models.User{
		ID:     userID,
		Email:  "reset@example.com",
		Nombre: "Reset User",
		Rol:    models.RolVisitante,
		Activo: true,
	}

	// Generate a valid token
	token, err := h.jwtMgr.GenerateResetToken(userID, "reset@example.com")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	body := `{"token":"` + token + `","password":"newpassword123"}`
	resp, err := h.postJSON("/api/auth/recover-password", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// Verify password was updated
	if _, updated := h.mockUserSvc.updated[userID]; !updated {
		t.Error("expected password to be updated")
	}
}

func TestResetPassword_InvalidToken(t *testing.T) {
	h := newRecoveryTestHarness()

	resp, err := h.postJSON("/api/auth/recover-password", `{"token":"invalid-token","password":"newpassword123"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}

	var errResp dto.ErrorResponse
	if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}
	if errResp.Error != "invalid_token" {
		t.Errorf("expected error 'invalid_token', got '%s'", errResp.Error)
	}
}

func TestResetPassword_WeakPassword(t *testing.T) {
	h := newRecoveryTestHarness()

	userID := uuid.New()
	h.mockUserSvc.users["weak@example.com"] = &models.User{
		ID:     userID,
		Email:  "weak@example.com",
		Nombre: "Weak User",
		Rol:    models.RolVisitante,
		Activo: true,
	}

	token, err := h.jwtMgr.GenerateResetToken(userID, "weak@example.com")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	// Password too short (only 3 chars)
	body := `{"token":"` + token + `","password":"abc"}`
	resp, err := h.postJSON("/api/auth/recover-password", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}

	var errResp dto.ErrorResponse
	if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}
	if errResp.Error != "weak_password" {
		t.Errorf("expected error 'weak_password', got '%s'", errResp.Error)
	}
}

func TestRequestRecovery_EmptyEmail(t *testing.T) {
	h := newRecoveryTestHarness()

	resp, err := h.postJSON("/api/auth/recover-request", `{"email":""}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400 for empty email, got %d", resp.StatusCode)
	}
}

func TestResetPassword_ExpiredToken(t *testing.T) {
	app := fiber.New()

	mockEmail := newMockEmailService()
	mockUserSvc := newMockUserService()
	jwtMgr := jwt.NewJWTManager("test-secret-for-expiry", 24)

	rateLimiter := services.NewRateLimiter(100 * time.Millisecond)
	handler := NewAuthHandler(mockUserSvc, jwtMgr, mockEmail, rateLimiter)

	auth := app.Group("/api/auth")
	auth.Post("/recover-password", handler.ResetPassword)

	userID := uuid.New()
	mockUserSvc.users["expired@example.com"] = &models.User{
		ID:     userID,
		Email:  "expired@example.com",
		Nombre: "Expired User",
		Rol:    models.RolVisitante,
		Activo: true,
	}

	// Manually build an already-expired reset token
	expiredClaims := &jwt.ResetClaims{
		UserID:  userID,
		Email:   "expired@example.com",
		Purpose: "password_reset",
		RegisteredClaims: jwtv5.RegisteredClaims{
			ExpiresAt: jwtv5.NewNumericDate(time.Now().Add(-1 * time.Hour)), // 1 hour ago
			IssuedAt:  jwtv5.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			NotBefore: jwtv5.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			Issuer:    "cong-alameda-backend",
		},
	}

	// Need the jwt token to sign — use the JWTManager's secret
	// We create the token manually at the JWT level
	jwtToken := jwtv5.NewWithClaims(jwtv5.SigningMethodHS256, expiredClaims)
	token, err := jwtToken.SignedString([]byte("test-secret-for-expiry"))
	if err != nil {
		t.Fatalf("failed to sign expired token: %v", err)
	}

	body := `{"token":"` + token + `","password":"newpassword123"}`
	req := httptest.NewRequest("POST", "/api/auth/recover-password", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, 1000)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}

	// Verify the error is specifically about token expiry
	var errResp dto.ErrorResponse
	if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}
	if errResp.Error != "token_expired" {
		t.Errorf("expected error 'token_expired', got '%s'", errResp.Error)
	}
}
