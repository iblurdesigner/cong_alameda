package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type mockPublicadorRepoForHandler struct {
	items map[uuid.UUID]*models.Publicador
}

func newMockPublicadorRepoForHandler() *mockPublicadorRepoForHandler {
	return &mockPublicadorRepoForHandler{
		items: make(map[uuid.UUID]*models.Publicador),
	}
}

func (m *mockPublicadorRepoForHandler) Create(ctx context.Context, p *models.Publicador) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	m.items[p.ID] = p
	return nil
}

func (m *mockPublicadorRepoForHandler) GetByID(ctx context.Context, id uuid.UUID) (*models.Publicador, error) {
	p, ok := m.items[id]
	if !ok {
		return nil, repositories.ErrPublicadorNotFound
	}
	return p, nil
}

func (m *mockPublicadorRepoForHandler) List(ctx context.Context, search string, grupoID *uuid.UUID, activoOnly bool) ([]*models.Publicador, error) {
	var res []*models.Publicador
	for _, p := range m.items {
		res = append(res, p)
	}
	return res, nil
}

func (m *mockPublicadorRepoForHandler) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.Publicador, error) {
	p, ok := m.items[id]
	if !ok {
		return nil, repositories.ErrPublicadorNotFound
	}
	if n, ok := updates["nombres"].(string); ok {
		p.Nombres = n
	}
	if a, ok := updates["apellidos"].(string); ok {
		p.Apellidos = a
	}
	return p, nil
}

func (m *mockPublicadorRepoForHandler) Delete(ctx context.Context, id uuid.UUID) error {
	if _, ok := m.items[id]; !ok {
		return repositories.ErrPublicadorNotFound
	}
	delete(m.items, id)
	return nil
}

func setupPublicadorApp(repo *mockPublicadorRepoForHandler) *fiber.App {
	app := fiber.New()
	svc := services.NewPublicadorService(repo)
	h := NewPublicadorHandler(svc)

	app.Get("/api/publicadores", h.List)
	app.Get("/api/publicadores/:id", h.GetByID)
	app.Post("/api/publicadores", h.Create)
	app.Put("/api/publicadores/:id", h.Update)
	app.Delete("/api/publicadores/:id", h.Delete)

	return app
}

func TestPublicadorHandler_Endpoints(t *testing.T) {
	repo := newMockPublicadorRepoForHandler()
	app := setupPublicadorApp(repo)

	// 1. Create Publicador
	createReq := dto.CreatePublicadorRequest{
		Nombres:   "Carlos",
		Apellidos: "Santana",
	}
	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest(http.MethodPost, "/api/publicadores", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("error testing POST /api/publicadores: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", resp.StatusCode)
	}

	var createResp struct {
		Data dto.PublicadorResponse `json:"data"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&createResp)
	pubID := createResp.Data.ID

	// 2. List Publicadores
	req = httptest.NewRequest(http.MethodGet, "/api/publicadores", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("error testing GET /api/publicadores: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	// 3. GetByID
	req = httptest.NewRequest(http.MethodGet, "/api/publicadores/"+pubID.String(), nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("error testing GET /api/publicadores/:id: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	// 4. Update
	nuevoNombre := "Carlos Santana Jr."
	updateReq := dto.UpdatePublicadorRequest{
		Nombre: &nuevoNombre,
	}
	body, _ = json.Marshal(updateReq)
	req = httptest.NewRequest(http.MethodPut, "/api/publicadores/"+pubID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("error testing PUT /api/publicadores/:id: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	// 5. Delete
	req = httptest.NewRequest(http.MethodDelete, "/api/publicadores/"+pubID.String(), nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("error testing DELETE /api/publicadores/:id: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}
}
