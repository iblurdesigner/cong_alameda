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
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/middleware"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/services"
	"cong-alameda-backend/pkg/jwt"
)

// --- Mock Service ---

type mockProgramaPredicacionService struct {
	createFunc func(ctx context.Context, req *dto.CreateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error)
	getByIDFunc func(ctx context.Context, id uuid.UUID) (*models.ProgramaPredicacionResponse, error)
	listFunc    func(ctx context.Context) ([]*models.ProgramaPredicacionResponse, error)
	updateFunc  func(ctx context.Context, id uuid.UUID, req *dto.UpdateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error)
	deleteFunc  func(ctx context.Context, id uuid.UUID) error
}

func newMockProgramaPredicacionService() *mockProgramaPredicacionService {
	return &mockProgramaPredicacionService{
		createFunc: func(_ context.Context, req *dto.CreateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error) {
			fecha, _ := time.Parse("2006-01-02", req.Fecha)
			now := models.ProgramaPredicacion{
				ID:         uuid.New(),
				Nombre:     req.Nombre,
				Fecha:      fecha,
				HoraInicio: req.HoraInicio,
			}
			return &now, nil
		},
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*models.ProgramaPredicacionResponse, error) {
			return nil, services.ErrProgramaNotFound
		},
		listFunc: func(_ context.Context) ([]*models.ProgramaPredicacionResponse, error) {
			return []*models.ProgramaPredicacionResponse{}, nil
		},
		updateFunc: func(_ context.Context, id uuid.UUID, req *dto.UpdateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error) {
			return nil, services.ErrProgramaNotFound
		},
		deleteFunc: func(_ context.Context, id uuid.UUID) error {
			return nil
		},
	}
}

func (m *mockProgramaPredicacionService) Create(ctx context.Context, req *dto.CreateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error) {
	return m.createFunc(ctx, req)
}

func (m *mockProgramaPredicacionService) GetByID(ctx context.Context, id uuid.UUID) (*models.ProgramaPredicacionResponse, error) {
	return m.getByIDFunc(ctx, id)
}

func (m *mockProgramaPredicacionService) List(ctx context.Context) ([]*models.ProgramaPredicacionResponse, error) {
	return m.listFunc(ctx)
}

func (m *mockProgramaPredicacionService) Update(ctx context.Context, id uuid.UUID, req *dto.UpdateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error) {
	return m.updateFunc(ctx, id, req)
}

func (m *mockProgramaPredicacionService) Delete(ctx context.Context, id uuid.UUID) error {
	return m.deleteFunc(ctx, id)
}

// Compile-time check that the mock satisfies the service interface.
var _ programaPredicacionService = (*mockProgramaPredicacionService)(nil)

// --- Test Harness ---

type programaTestHarness struct {
	app         *fiber.App
	handler     *ProgramaPredicacionHandler
	mockService *mockProgramaPredicacionService
}

func newProgramaTestHarness() *programaTestHarness {
	app := fiber.New()
	mockSvc := newMockProgramaPredicacionService()
	handler := NewProgramaPredicacionHandler(mockSvc)

	programas := app.Group("/api/programas-predicacion")
	programas.Get("/", handler.List)
	programas.Get("/:id", handler.GetByID)
	programas.Post("/", handler.Create)
	programas.Put("/:id", handler.Update)
	programas.Delete("/:id", handler.Delete)

	return &programaTestHarness{
		app:         app,
		handler:     handler,
		mockService: mockSvc,
	}
}

func (h *programaTestHarness) doRequest(method, url, body string) (*http.Response, error) {
	req := httptest.NewRequest(method, url, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return h.app.Test(req, 1000)
}

// --- Tests ---

// 3.1 Write failing handler test: POST creates program, returns 201 + { data }
func TestProgramaHandler_Create_Returns201(t *testing.T) {
	h := newProgramaTestHarness()
	validID := uuid.New()
	h.mockService.createFunc = func(_ context.Context, req *dto.CreateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error) {
		fecha, _ := time.Parse("2006-01-02", req.Fecha)
		return &models.ProgramaPredicacion{
			ID:         validID,
			Nombre:     req.Nombre,
			Fecha:      fecha,
			HoraInicio: req.HoraInicio,
		}, nil
	}

	body := `{"nombre":"Programa Test","fecha":"2026-07-15","hora_inicio":"10:00","conductor":"John"}`
	resp, err := h.doRequest("POST", "/api/programas-predicacion", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusCreated {
		t.Errorf("expected 201, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	data, ok := result["data"]
	if !ok {
		t.Fatal("expected response to have 'data' key")
	}

	dataMap, ok := data.(map[string]interface{})
	if !ok {
		t.Fatal("expected data to be an object")
	}

	if dataMap["nombre"] != "Programa Test" {
		t.Errorf("expected nombre 'Programa Test', got '%v'", dataMap["nombre"])
	}
}

// 3.2 Write failing handler test: POST duplicate returns 409
func TestProgramaHandler_Create_DuplicateReturns409(t *testing.T) {
	h := newProgramaTestHarness()
	h.mockService.createFunc = func(_ context.Context, req *dto.CreateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error) {
		return nil, services.ErrDuplicatePrograma
	}

	body := `{"nombre":"Dup","fecha":"2026-07-15","hora_inicio":"10:00","conductor":"John"}`
	resp, err := h.doRequest("POST", "/api/programas-predicacion", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusConflict {
		t.Errorf("expected 409, got %d", resp.StatusCode)
	}

	var errResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}

	if errResp["error"] != "duplicate" {
		t.Errorf("expected error 'duplicate', got '%v'", errResp["error"])
	}
}

// 3.3 Write failing handler test: PUT missing ID returns 404
func TestProgramaHandler_Update_NotFoundReturns404(t *testing.T) {
	h := newProgramaTestHarness()

	body := `{"nombre":"Updated"}`
	resp, err := h.doRequest("PUT", "/api/programas-predicacion/"+uuid.New().String(), body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusNotFound {
		t.Errorf("expected 404, got %d", resp.StatusCode)
	}
}

// 3.4 Write failing handler test: DELETE returns 204
func TestProgramaHandler_Delete_Returns204(t *testing.T) {
	h := newProgramaTestHarness()
	h.mockService.deleteFunc = func(_ context.Context, id uuid.UUID) error {
		return nil
	}

	resp, err := h.doRequest("DELETE", "/api/programas-predicacion/"+uuid.New().String(), "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusNoContent {
		t.Errorf("expected 204, got %d", resp.StatusCode)
	}
}

// 3.5 Write failing handler test: invalid UUID in param returns 400
func TestProgramaHandler_InvalidUUID_Returns400(t *testing.T) {
	h := newProgramaTestHarness()

	tests := []struct {
		name   string
		method string
		url    string
		body   string
	}{
		{"GET invalid ID", "GET", "/api/programas-predicacion/not-a-uuid", ""},
		{"PUT invalid ID", "PUT", "/api/programas-predicacion/not-a-uuid", `{"nombre":"test"}`},
		{"DELETE invalid ID", "DELETE", "/api/programas-predicacion/not-a-uuid", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := h.doRequest(tt.method, tt.url, tt.body)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if resp.StatusCode != fiber.StatusBadRequest {
				t.Errorf("expected 400, got %d", resp.StatusCode)
			}

			var errResp map[string]interface{}
			if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
				t.Fatalf("failed to decode error response: %v", err)
			}

			if errResp["error"] != "invalid_id" {
				t.Errorf("expected error 'invalid_id', got '%v'", errResp["error"])
			}
		})
	}
}

// 4.1 Write handler test: unauthenticated request returns 401
func TestProgramaHandler_Unauthenticated_Returns401(t *testing.T) {
	app := fiber.New()
	mockSvc := newMockProgramaPredicacionService()
	handler := NewProgramaPredicacionHandler(mockSvc)

	jwtMgr := jwt.NewJWTManager("test-secret", 1)
	authMw := middleware.NewAuthMiddleware(jwtMgr)

	programas := app.Group("/api/programas-predicacion", authMw.Authenticate())
	programas.Get("/", handler.List)

	req := httptest.NewRequest("GET", "/api/programas-predicacion", nil)
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req, 1000)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}

	var errResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}

	if errResp["error"] != "Token requerido" {
		t.Errorf("expected error 'Token requerido', got '%v'", errResp["error"])
	}
}

// 4.2 Write handler test: List response wraps in { "data": [...] }
func TestProgramaHandler_List_ReturnsDataWrapper(t *testing.T) {
	h := newProgramaTestHarness()
	h.mockService.listFunc = func(_ context.Context) ([]*models.ProgramaPredicacionResponse, error) {
		return []*models.ProgramaPredicacionResponse{
			{ID: uuid.New(), Nombre: "Programa 1", Fecha: "2026-07-15"},
			{ID: uuid.New(), Nombre: "Programa 2", Fecha: "2026-07-16"},
		}, nil
	}

	resp, err := h.doRequest("GET", "/api/programas-predicacion", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	data, ok := result["data"]
	if !ok {
		t.Fatal("expected response to have 'data' key")
	}

	items, ok := data.([]interface{})
	if !ok {
		t.Fatal("expected data to be an array")
	}

	if len(items) != 2 {
		t.Errorf("expected 2 items, got %d", len(items))
	}
}

// 4.3 Write handler test: Update with empty territorios clears join table
func TestProgramaHandler_Update_EmptyTerritoriosClearsJoinTable(t *testing.T) {
	h := newProgramaTestHarness()
	var capturedReq *dto.UpdateProgramaPredicacionRequest
	h.mockService.updateFunc = func(_ context.Context, id uuid.UUID, req *dto.UpdateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error) {
		capturedReq = req
		return &models.ProgramaPredicacion{
			ID:     id,
			Nombre: *req.Nombre,
		}, nil
	}

	body := `{"nombre":"Updated","territorios":[]}`
	resp, err := h.doRequest("PUT", "/api/programas-predicacion/"+uuid.New().String(), body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	if capturedReq == nil {
		t.Fatal("expected service.Update to be called")
	}

	if capturedReq.Territorios == nil {
		t.Fatal("expected Territorios to be non-nil (empty slice)")
	}

	if len(capturedReq.Territorios) != 0 {
		t.Errorf("expected empty Territorios, got %d items", len(capturedReq.Territorios))
	}
}

// 4.4 Write handler test: GET /:id for non-existent ID returns 404
func TestProgramaHandler_GetByID_NotFound_Returns404(t *testing.T) {
	h := newProgramaTestHarness()
	// Default mock already returns ErrProgramaNotFound for any ID

	resp, err := h.doRequest("GET", "/api/programas-predicacion/"+uuid.New().String(), "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusNotFound {
		t.Errorf("expected 404, got %d", resp.StatusCode)
	}

	var errResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}

	if errResp["error"] != "not_found" {
		t.Errorf("expected error 'not_found', got '%v'", errResp["error"])
	}
}
