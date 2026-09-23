package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
)

type mockVyMRepoForHandler struct {
	item *models.ProgramaVyM
}

func (m *mockVyMRepoForHandler) Upsert(ctx context.Context, p *models.ProgramaVyM) (*models.ProgramaVyM, error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	m.item = p
	return p, nil
}

func (m *mockVyMRepoForHandler) GetBySemanaID(ctx context.Context, semanaID uuid.UUID) (*models.ProgramaVyM, error) {
	if m.item != nil && m.item.SemanaID == semanaID {
		return m.item, nil
	}
	return nil, repositories.ErrProgramaVyMNotFound
}

func (m *mockVyMRepoForHandler) Delete(ctx context.Context, id uuid.UUID) error {
	if m.item != nil && m.item.ID == id {
		m.item = nil
		return nil
	}
	return repositories.ErrProgramaVyMNotFound
}

func setupVyMApp(repo *mockVyMRepoForHandler) *fiber.App {
	app := fiber.New()
	svc := services.NewProgramaVyMService(repo)
	h := NewProgramaVyMHandler(svc)

	app.Get("/api/v1/programa-vym/semana/:semana_id", h.GetBySemana)
	app.Post("/api/v1/programa-vym/semana/:semana_id", h.Upsert)
	app.Delete("/api/v1/programa-vym/:id", h.Delete)
	return app
}

func TestProgramaVyMHandler_GetAndUpsert(t *testing.T) {
	semanaID := uuid.New()
	repo := &mockVyMRepoForHandler{}
	app := setupVyMApp(repo)

	// 1. Get before insert -> 404
	req := httptest.NewRequest("GET", "/api/v1/programa-vym/semana/"+semanaID.String(), nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusNotFound {
		t.Errorf("expected 404, got %d", resp.StatusCode)
	}

	// 2. Upsert -> 200
	payload := dto.UpsertProgramaVyMRequest{
		NombreCongregacion: "ALAMEDA",
		LecturaSemanal:     "Salmo 1-5",
		Presidente:         "Hermano Presidente",
	}
	body, _ := json.Marshal(payload)
	postReq := httptest.NewRequest("POST", "/api/v1/programa-vym/semana/"+semanaID.String(), bytes.NewReader(body))
	postReq.Header.Set("Content-Type", "application/json")
	postResp, err := app.Test(postReq)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if postResp.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200, got %d", postResp.StatusCode)
	}

	// 3. Get after insert -> 200
	getReq2 := httptest.NewRequest("GET", "/api/v1/programa-vym/semana/"+semanaID.String(), nil)
	getResp2, err := app.Test(getReq2)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if getResp2.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200, got %d", getResp2.StatusCode)
	}
}
