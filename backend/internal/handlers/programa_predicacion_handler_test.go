package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/middleware"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
	"cong-alameda-backend/pkg/jwt"
)

// --- Mock Repos (implement the unexported repo interfaces used by ProgramaPredicacionService) ---

type mockProgramaRepo struct {
	createFunc         func(ctx context.Context, p *models.ProgramaPredicacion) error
	getByIDFunc        func(ctx context.Context, id uuid.UUID) (*models.ProgramaPredicacion, error)
	getAllFunc         func(ctx context.Context) ([]*models.ProgramaPredicacion, error)
	updateFunc         func(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.ProgramaPredicacion, error)
	deleteFunc         func(ctx context.Context, id uuid.UUID) error
	getTerritoriosFunc func(ctx context.Context, programaID uuid.UUID) ([]*models.Territorio, error)
	setTerritoriosFunc func(ctx context.Context, programaID uuid.UUID, territorioIDs []uuid.UUID) error
}

func newMockProgramaRepo() *mockProgramaRepo {
	return &mockProgramaRepo{
		createFunc: func(_ context.Context, _ *models.ProgramaPredicacion) error { return nil },
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*models.ProgramaPredicacion, error) {
			return nil, repositories.ErrProgramaPredicacionNotFound
		},
		getAllFunc: func(_ context.Context) ([]*models.ProgramaPredicacion, error) {
			return nil, nil
		},
		updateFunc: func(_ context.Context, _ uuid.UUID, _ map[string]interface{}) (*models.ProgramaPredicacion, error) {
			return nil, repositories.ErrProgramaPredicacionNotFound
		},
		deleteFunc: func(_ context.Context, _ uuid.UUID) error { return nil },
		getTerritoriosFunc: func(_ context.Context, _ uuid.UUID) ([]*models.Territorio, error) {
			return nil, nil
		},
		setTerritoriosFunc: func(_ context.Context, _ uuid.UUID, _ []uuid.UUID) error { return nil },
	}
}

func (m *mockProgramaRepo) Create(ctx context.Context, p *models.ProgramaPredicacion) error {
	if m.createFunc != nil {
		return m.createFunc(ctx, p)
	}
	return nil
}

func (m *mockProgramaRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.ProgramaPredicacion, error) {
	if m.getByIDFunc != nil {
		return m.getByIDFunc(ctx, id)
	}
	return nil, repositories.ErrProgramaPredicacionNotFound
}

func (m *mockProgramaRepo) GetAll(ctx context.Context) ([]*models.ProgramaPredicacion, error) {
	if m.getAllFunc != nil {
		return m.getAllFunc(ctx)
	}
	return nil, nil
}

func (m *mockProgramaRepo) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.ProgramaPredicacion, error) {
	if m.updateFunc != nil {
		return m.updateFunc(ctx, id, updates)
	}
	return nil, repositories.ErrProgramaPredicacionNotFound
}

func (m *mockProgramaRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, id)
	}
	return nil
}

func (m *mockProgramaRepo) GetTerritorios(ctx context.Context, programaID uuid.UUID) ([]*models.Territorio, error) {
	if m.getTerritoriosFunc != nil {
		return m.getTerritoriosFunc(ctx, programaID)
	}
	return nil, nil
}

func (m *mockProgramaRepo) SetTerritorios(ctx context.Context, programaID uuid.UUID, territorioIDs []uuid.UUID) error {
	if m.setTerritoriosFunc != nil {
		return m.setTerritoriosFunc(ctx, programaID, territorioIDs)
	}
	return nil
}

type mockGrupoRepo struct{}

func (m *mockGrupoRepo) GetByID(_ context.Context, _ uuid.UUID) (*models.Grupo, error) {
	return nil, nil
}

// --- Test Harness ---

type programaTestHarness struct {
	app     *fiber.App
	handler *ProgramaPredicacionHandler
	repo    *mockProgramaRepo
}

func newProgramaTestHarness() *programaTestHarness {
	app := fiber.New()
	repo := newMockProgramaRepo()
	svc := services.NewProgramaPredicacionService(repo, &mockGrupoRepo{}, nil)
	handler := NewProgramaPredicacionHandler(svc)

	programas := app.Group("/api/programas-predicacion")
	programas.Get("/", handler.List)
	programas.Get("/:id", handler.GetByID)
	programas.Post("/", handler.Create)
	programas.Put("/:id", handler.Update)
	programas.Delete("/:id", handler.Delete)

	return &programaTestHarness{
		app:     app,
		handler: handler,
		repo:    repo,
	}
}

func (h *programaTestHarness) doRequest(method, url, body string) (*http.Response, error) {
	req := httptest.NewRequest(method, url, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return h.app.Test(req, 1000)
}

// --- Tests ---

// 3.1 POST creates program, returns 201 + { nombre }
func TestProgramaHandler_Create_Returns201(t *testing.T) {
	h := newProgramaTestHarness()

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

	if result["nombre"] != "Programa Test" {
		t.Errorf("expected nombre 'Programa Test', got '%v'", result["nombre"])
	}
}

// 3.3 PUT with error from service returns 500
func TestProgramaHandler_Update_ServiceErrorReturns500(t *testing.T) {
	h := newProgramaTestHarness()

	body := `{"nombre":"Updated"}`
	resp, err := h.doRequest("PUT", "/api/programas-predicacion/"+uuid.New().String(), body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusInternalServerError {
		t.Errorf("expected 500, got %d", resp.StatusCode)
	}
}

// 3.4 DELETE returns 204
func TestProgramaHandler_Delete_Returns204(t *testing.T) {
	h := newProgramaTestHarness()
	h.repo.deleteFunc = func(_ context.Context, id uuid.UUID) error {
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

// 3.5 invalid UUID in param returns 400
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

// 4.1 unauthenticated request returns 401
func TestProgramaHandler_Unauthenticated_Returns401(t *testing.T) {
	app := fiber.New()
	repo := newMockProgramaRepo()
	svc := services.NewProgramaPredicacionService(repo, &mockGrupoRepo{}, nil)
	handler := NewProgramaPredicacionHandler(svc)

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

// 4.2 List response wraps in { "data": [...] }
func TestProgramaHandler_List_ReturnsDataWrapper(t *testing.T) {
	h := newProgramaTestHarness()
	h.repo.getAllFunc = func(_ context.Context) ([]*models.ProgramaPredicacion, error) {
		return []*models.ProgramaPredicacion{
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

// 4.3 Update with empty territorio_ids clears the join table (SetTerritorios called with empty)
func TestProgramaHandler_Update_EmptyTerritoriosClearsJoinTable(t *testing.T) {
	h := newProgramaTestHarness()
	var setCalled bool
	h.repo.updateFunc = func(_ context.Context, _ uuid.UUID, _ map[string]interface{}) (*models.ProgramaPredicacion, error) {
		return nil, nil
	}
	h.repo.setTerritoriosFunc = func(_ context.Context, _ uuid.UUID, ids []uuid.UUID) error {
		setCalled = true
		if len(ids) != 0 {
			t.Errorf("expected empty territorio ids, got %d", len(ids))
		}
		return nil
	}
	h.repo.getByIDFunc = func(_ context.Context, id uuid.UUID) (*models.ProgramaPredicacion, error) {
		return &models.ProgramaPredicacion{ID: id, Nombre: "Updated"}, nil
	}

	body := `{"nombre":"Updated","territorio_ids":[]}`
	resp, err := h.doRequest("PUT", "/api/programas-predicacion/"+uuid.New().String(), body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	if !setCalled {
		t.Fatal("expected service SetTerritorios to be called")
	}
}

// 4.4 GET /:id for non-existent ID returns 404
func TestProgramaHandler_GetByID_NotFound_Returns404(t *testing.T) {
	h := newProgramaTestHarness()
	// Default mock already returns ErrProgramaPredicacionNotFound for any ID

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
