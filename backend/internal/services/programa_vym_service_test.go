package services

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

type mockProgramaVyMRepo struct {
	items map[uuid.UUID]*models.ProgramaVyM // keyed by semana_id
}

func newMockProgramaVyMRepo() *mockProgramaVyMRepo {
	return &mockProgramaVyMRepo{
		items: make(map[uuid.UUID]*models.ProgramaVyM),
	}
}

func (m *mockProgramaVyMRepo) Upsert(ctx context.Context, p *models.ProgramaVyM) (*models.ProgramaVyM, error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	now := time.Now()
	p.UpdatedAt = now
	if p.CreatedAt.IsZero() {
		p.CreatedAt = now
	}
	m.items[p.SemanaID] = p
	return p, nil
}

func (m *mockProgramaVyMRepo) GetBySemanaID(ctx context.Context, semanaID uuid.UUID) (*models.ProgramaVyM, error) {
	p, exists := m.items[semanaID]
	if !exists {
		return nil, repositories.ErrProgramaVyMNotFound
	}
	return p, nil
}

func (m *mockProgramaVyMRepo) Delete(ctx context.Context, id uuid.UUID) error {
	for k, v := range m.items {
		if v.ID == id {
			delete(m.items, k)
			return nil
		}
	}
	return repositories.ErrProgramaVyMNotFound
}

func TestProgramaVyMService_UpsertAndGet(t *testing.T) {
	repo := newMockProgramaVyMRepo()
	service := NewProgramaVyMService(repo)

	semanaID := uuid.New()
	req := &dto.UpsertProgramaVyMRequest{
		NombreCongregacion:      "ALAMEDA",
		LecturaSemanal:          "Salmo 1-5",
		Presidente:              "Hermano Presidente",
		ConsejeroAuxiliar:       "Hermano Consejero",
		CancionInicio:           "12",
		HoraCancionInicio:       "19:00",
		OracionInicio:           "Hermano Oracion",
		HoraOracionInicio:       "19:04",
		TesorosTitulo:           "Tesoros del Rey",
		TesorosTiempo:           "10 mins.",
		TesorosDiscursante:      "Hermano Tesoro",
		SeamosMaestrosAuditorio: json.RawMessage(`[{"type":"Lectura","title":"Lectura","time":"4 mins.","student":"Estudiante 1","startTime":"19:30"}]`),
		SeamosMaestrosAuxiliar:  json.RawMessage(`[]`),
		VidaCristianaPartes:     json.RawMessage(`[{"title":"Necesidades","time":"15 mins.","speaker":"Hermano Vida","startTime":"19:50"}]`),
	}

	ctx := context.Background()
	res, err := service.Upsert(ctx, semanaID, req)
	if err != nil {
		t.Fatalf("unexpected error on Upsert: %v", err)
	}

	if res.SemanaID != semanaID {
		t.Errorf("expected semana_id %v, got %v", semanaID, res.SemanaID)
	}
	if res.Presidente != "Hermano Presidente" {
		t.Errorf("expected presidente 'Hermano Presidente', got %v", res.Presidente)
	}

	// Fetch via GetBySemanaID
	fetched, err := service.GetBySemanaID(ctx, semanaID)
	if err != nil {
		t.Fatalf("unexpected error on GetBySemanaID: %v", err)
	}
	if fetched.ID != res.ID {
		t.Errorf("expected ID %v, got %v", res.ID, fetched.ID)
	}
}

func TestProgramaVyMService_NotFound(t *testing.T) {
	repo := newMockProgramaVyMRepo()
	service := NewProgramaVyMService(repo)

	ctx := context.Background()
	_, err := service.GetBySemanaID(ctx, uuid.New())
	if err == nil {
		t.Errorf("expected error when not found, got nil")
	}
}
