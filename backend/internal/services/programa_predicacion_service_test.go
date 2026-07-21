package services

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
)

// --- Mock Repo ---

type mockProgramaRepo struct {
	mu          sync.Mutex
	programas   map[uuid.UUID]*models.ProgramaPredicacion
	territorios map[uuid.UUID][]uuid.UUID // programaID -> territorioIDs
}

func newMockProgramaRepo() *mockProgramaRepo {
	return &mockProgramaRepo{
		programas:   make(map[uuid.UUID]*models.ProgramaPredicacion),
		territorios: make(map[uuid.UUID][]uuid.UUID),
	}
}

func (m *mockProgramaRepo) Create(_ context.Context, p *models.ProgramaPredicacion) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	p.ID = uuid.New()
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	m.programas[p.ID] = p
	return nil
}

func (m *mockProgramaRepo) GetByID(_ context.Context, id uuid.UUID) (*models.ProgramaPredicacion, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.programas[id]
	if !ok {
		return nil, ErrProgramaNotFound
	}
	return p, nil
}

func (m *mockProgramaRepo) List(_ context.Context) ([]*models.ProgramaPredicacion, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	result := make([]*models.ProgramaPredicacion, 0, len(m.programas))
	for _, p := range m.programas {
		result = append(result, p)
	}
	return result, nil
}

func (m *mockProgramaRepo) Update(_ context.Context, id uuid.UUID, p *models.ProgramaPredicacion) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.programas[id]; !ok {
		return ErrProgramaNotFound
	}
	p.UpdatedAt = time.Now()
	m.programas[id] = p
	return nil
}

func (m *mockProgramaRepo) Delete(_ context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.programas, id)
	delete(m.territorios, id)
	return nil
}

func (m *mockProgramaRepo) SyncTerritorios(_ context.Context, programaID uuid.UUID, territorioIDs []uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	ids := make([]uuid.UUID, len(territorioIDs))
	copy(ids, territorioIDs)
	m.territorios[programaID] = ids
	return nil
}

func (m *mockProgramaRepo) GetTerritoriosByProgramaID(_ context.Context, programaID uuid.UUID) ([]uuid.UUID, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	ids := m.territorios[programaID]
	result := make([]uuid.UUID, len(ids))
	copy(result, ids)
	return result, nil
}

func (m *mockProgramaRepo) ExistsByFechaHora(_ context.Context, fecha, horaInicio string, excludeID *uuid.UUID) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, p := range m.programas {
		if p.Fecha.Format("2006-01-02") == fecha && p.HoraInicio == horaInicio {
			if excludeID != nil && p.ID == *excludeID {
				continue
			}
			return true, nil
		}
	}
	return false, nil
}

// --- Tests ---

// 2.1 Write failing test: service duplicate fecha+hora_inicio returns 409 with mock repo
func TestProgramaPredicacionService_Create_DuplicateReturnsError(t *testing.T) {
	mock := newMockProgramaRepo()
	svc := NewProgramaPredicacionService(mock)

	// Seed a program with this fecha+hora_inicio
	seedReq := &dto.CreateProgramaPredicacionRequest{
		Nombre:     "Existing Program",
		Fecha:      "2026-07-15",
		HoraInicio: "10:00",
	}
	_, err := svc.Create(context.Background(), seedReq)
	if err != nil {
		t.Fatalf("failed to seed program: %v", err)
	}

	// Try creating another with the same fecha+hora_inicio
	dupReq := &dto.CreateProgramaPredicacionRequest{
		Nombre:     "Duplicate Program",
		Fecha:      "2026-07-15",
		HoraInicio: "10:00",
	}
	_, err = svc.Create(context.Background(), dupReq)
	if err == nil {
		t.Fatal("expected error for duplicate program, got nil")
	}
	if !errors.Is(err, ErrDuplicatePrograma) {
		t.Errorf("expected ErrDuplicatePrograma, got %v", err)
	}
}

// 2.2 Write failing test: service GetByID returns error when missing
func TestProgramaPredicacionService_GetByID_NotFound(t *testing.T) {
	mock := newMockProgramaRepo()
	svc := NewProgramaPredicacionService(mock)

	_, err := svc.GetByID(context.Background(), uuid.New())
	if err == nil {
		t.Fatal("expected error for non-existent program, got nil")
	}
	if !errors.Is(err, ErrProgramaNotFound) {
		t.Errorf("expected ErrProgramaNotFound, got %v", err)
	}
}

// 2.3 Write failing test: service SyncTerritorios replaces join-table rows atomically
func TestProgramaPredicacionService_SyncTerritorios_ReplacesRows(t *testing.T) {
	mock := newMockProgramaRepo()
	svc := NewProgramaPredicacionService(mock)

	// Step 1: Create a program with 2 territorios
	t1 := uuid.New()
	t2 := uuid.New()
	createReq := &dto.CreateProgramaPredicacionRequest{
		Nombre:      "Territorio Test",
		Fecha:       "2026-08-01",
		HoraInicio:  "09:00",
		Territorios: []uuid.UUID{t1, t2},
	}

	created, err := svc.Create(context.Background(), createReq)
	if err != nil {
		t.Fatalf("unexpected error on create: %v", err)
	}

	// Verify after create: 2 territorios stored
	stored, err := mock.GetTerritoriosByProgramaID(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("unexpected error getting territorios: %v", err)
	}
	if len(stored) != 2 {
		t.Errorf("expected 2 stored territories after create, got %d", len(stored))
	}

	// Step 2: Update with 1 different territorio (should replace, not append)
	t3 := uuid.New()
	updateReq := &dto.UpdateProgramaPredicacionRequest{
		Territorios: []uuid.UUID{t3},
	}

	_, err = svc.Update(context.Background(), created.ID, updateReq)
	if err != nil {
		t.Fatalf("unexpected error on update: %v", err)
	}

	// Verify after update: exactly 1 territorio (the new one)
	stored, err = mock.GetTerritoriosByProgramaID(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("unexpected error getting territorios: %v", err)
	}
	if len(stored) != 1 {
		t.Errorf("expected 1 stored territory after update, got %d", len(stored))
	}
	if stored[0] != t3 {
		t.Errorf("expected stored territory %v, got %v", t3, stored[0])
	}
}
