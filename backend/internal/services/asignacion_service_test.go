package services

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

// --- Mock Repos for AsignacionService tests ---
// Separate structs per interface to avoid method-name collisions.

type mockAsignRepo struct {
	created []*models.AsignacionSemanal
	byID    map[uuid.UUID]*models.AsignacionSemanal
}

func newMockAsignRepo() *mockAsignRepo {
	return &mockAsignRepo{byID: make(map[uuid.UUID]*models.AsignacionSemanal)}
}

func (m *mockAsignRepo) Create(_ context.Context, a *models.AsignacionSemanal) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	m.created = append(m.created, a)
	m.byID[a.ID] = a
	return nil
}

func (m *mockAsignRepo) GetByID(_ context.Context, id uuid.UUID) (*models.AsignacionSemanal, error) {
	a, ok := m.byID[id]
	if !ok {
		return nil, repositories.ErrAsignacionNotFound
	}
	return a, nil
}

func (m *mockAsignRepo) GetBySemana(_ context.Context, _ uuid.UUID) ([]*models.AsignacionDetail, error) {
	return nil, nil
}

func (m *mockAsignRepo) GetBySemanaAndDia(_ context.Context, _ uuid.UUID, _ int) ([]*models.AsignacionDetail, error) {
	return nil, nil
}

func (m *mockAsignRepo) GetByUser(_ context.Context, _ uuid.UUID) ([]*models.AsignacionDetail, error) {
	return nil, nil
}

func (m *mockAsignRepo) Update(_ context.Context, id uuid.UUID, userID uuid.UUID, grupoID *uuid.UUID, _ *string) error {
	if a, ok := m.byID[id]; ok {
		a.UserID = userID
		a.GrupoID = grupoID
	}
	return nil
}

func (m *mockAsignRepo) Delete(_ context.Context, _ uuid.UUID) error { return nil }

func (m *mockAsignRepo) DeleteBySemana(_ context.Context, _ uuid.UUID) error { return nil }

type mockTipoAsignRepo struct {
	byID map[uuid.UUID]*models.TipoAsignacion
}

func newMockTipoAsignRepo() *mockTipoAsignRepo {
	return &mockTipoAsignRepo{byID: make(map[uuid.UUID]*models.TipoAsignacion)}
}

func (m *mockTipoAsignRepo) GetAll(_ context.Context) ([]*models.TipoAsignacion, error) {
	return nil, nil
}

func (m *mockTipoAsignRepo) GetByID(_ context.Context, id uuid.UUID) (*models.TipoAsignacion, error) {
	t, ok := m.byID[id]
	if !ok {
		return nil, errors.New("tipo not found")
	}
	return t, nil
}

func (m *mockTipoAsignRepo) GetByNombre(_ context.Context, _ string) (*models.TipoAsignacion, error) {
	return nil, nil
}

type mockUserRepo struct{}

func (m *mockUserRepo) GetByID(_ context.Context, _ uuid.UUID) (*models.User, error) {
	return &models.User{}, nil
}

type mockSemanaRepo struct{}

func (m *mockSemanaRepo) GetByID(_ context.Context, _ uuid.UUID) (*models.SemanaVisita, error) {
	return &models.SemanaVisita{}, nil
}

type mockDiaRepo struct{}

func (m *mockDiaRepo) GetBySemanaID(_ context.Context, _ uuid.UUID) ([]*models.DiaSemana, error) {
	return nil, nil
}

const aseoSalonTipoID = "b10c74a7-ba4c-4a71-b639-1248aa404eb4"

// --- RED: ASEO_SALON enforcement in service ---

func aseoSalonUUID() uuid.UUID {
	return uuid.MustParse(aseoSalonTipoID)
}

func TestAsignacionService_Create_AseoSalonWithUserRejected(t *testing.T) {
	mockRepo := newMockAsignRepo()
	tipoRepo := newMockTipoAsignRepo()
	tipoRepo.byID[aseoSalonUUID()] = &models.TipoAsignacion{ID: aseoSalonUUID(), Nombre: "ASEO_SALON"}

	svc := NewAsignacionService(mockRepo, tipoRepo, &mockSemanaRepo{}, &mockDiaRepo{}, &mockUserRepo{})

	grupoNil := (*uuid.UUID)(nil)
	err := svc.Create(context.Background(), &models.AsignacionSemanal{
		SemanaID:         uuid.New(),
		TipoAsignacionID: aseoSalonUUID(),
		UserID:           uuid.New(),
		GrupoID:          grupoNil,
		DiaSemana:        0,
	})

	if err == nil {
		t.Fatal("expected error creating ASEO_SALON with user_id and no grupo, got nil")
	}
	if !errors.Is(err, ErrAseoSalonRequiresGrupo) {
		t.Errorf("expected ErrAseoSalonRequiresGrupo, got %v", err)
	}
	if len(mockRepo.created) != 0 {
		t.Errorf("expected no asignacion created, got %d", len(mockRepo.created))
	}
}

func TestAsignacionService_Create_AseoSalonWithGrupoSucceeds(t *testing.T) {
	mockRepo := newMockAsignRepo()
	tipoRepo := newMockTipoAsignRepo()
	tipoRepo.byID[aseoSalonUUID()] = &models.TipoAsignacion{ID: aseoSalonUUID(), Nombre: "ASEO_SALON"}

	svc := NewAsignacionService(mockRepo, tipoRepo, &mockSemanaRepo{}, &mockDiaRepo{}, &mockUserRepo{})

	grupoID := uuid.New()
	err := svc.Create(context.Background(), &models.AsignacionSemanal{
		SemanaID:         uuid.New(),
		TipoAsignacionID: aseoSalonUUID(),
		UserID:           uuid.Nil,
		GrupoID:          &grupoID,
		DiaSemana:        0,
	})

	if err != nil {
		t.Fatalf("expected success creating ASEO_SALON with grupo, got %v", err)
	}
	if len(mockRepo.created) != 1 {
		t.Fatalf("expected 1 asignacion created, got %d", len(mockRepo.created))
	}
	if mockRepo.created[0].GrupoID == nil || *mockRepo.created[0].GrupoID != grupoID {
		t.Errorf("expected persisted grupo_id to match, got %v", mockRepo.created[0].GrupoID)
	}
}

func TestAsignacionService_Create_NonAseoWithUserSucceeds(t *testing.T) {
	mockRepo := newMockAsignRepo()
	tipoRepo := newMockTipoAsignRepo()
	otherID := uuid.New()
	tipoRepo.byID[otherID] = &models.TipoAsignacion{ID: otherID, Nombre: "ACOMODADOR_SALON"}

	svc := NewAsignacionService(mockRepo, tipoRepo, &mockSemanaRepo{}, &mockDiaRepo{}, &mockUserRepo{})

	err := svc.Create(context.Background(), &models.AsignacionSemanal{
		SemanaID:         uuid.New(),
		TipoAsignacionID: otherID,
		UserID:           uuid.New(),
		GrupoID:          nil,
		DiaSemana:        0,
	})

	if err != nil {
		t.Fatalf("expected success creating non-ASEO_SALON with user_id, got %v", err)
	}
	if len(mockRepo.created) != 1 {
		t.Fatalf("expected 1 asignacion created, got %d", len(mockRepo.created))
	}
}

func TestAsignacionService_Update_AseoSalonWithUserRejected(t *testing.T) {
	mockRepo := newMockAsignRepo()
	tipoRepo := newMockTipoAsignRepo()
	tipoRepo.byID[aseoSalonUUID()] = &models.TipoAsignacion{ID: aseoSalonUUID(), Nombre: "ASEO_SALON"}

	// Seed the existing assignment so GetByID resolves its ASEO_SALON tipo.
	existingID := uuid.New()
	mockRepo.byID[existingID] = &models.AsignacionSemanal{
		ID:               existingID,
		TipoAsignacionID: aseoSalonUUID(),
	}

	svc := NewAsignacionService(mockRepo, tipoRepo, &mockSemanaRepo{}, &mockDiaRepo{}, &mockUserRepo{})

	err := svc.Update(context.Background(), existingID, uuid.New(), nil, nil)
	if err == nil {
		t.Fatal("expected error updating ASEO_SALON with user_id and no grupo, got nil")
	}
	if !errors.Is(err, ErrAseoSalonRequiresGrupo) {
		t.Errorf("expected ErrAseoSalonRequiresGrupo, got %v", err)
	}
}

func TestAsignacionService_BulkCreate_AseoSalonWithUserRejected(t *testing.T) {
	mockRepo := newMockAsignRepo()
	tipoRepo := newMockTipoAsignRepo()
	tipoRepo.byID[aseoSalonUUID()] = &models.TipoAsignacion{ID: aseoSalonUUID(), Nombre: "ASEO_SALON"}

	svc := NewAsignacionService(mockRepo, tipoRepo, &mockSemanaRepo{}, &mockDiaRepo{}, &mockUserRepo{})

	err := svc.BulkCreate(context.Background(), []*models.AsignacionSemanal{
		{
			SemanaID:         uuid.New(),
			TipoAsignacionID: aseoSalonUUID(),
			UserID:           uuid.New(),
			GrupoID:          nil,
			DiaSemana:        0,
		},
	})
	if err == nil {
		t.Fatal("expected error bulk creating ASEO_SALON with user_id, got nil")
	}
	if !errors.Is(err, ErrAseoSalonRequiresGrupo) {
		t.Errorf("expected ErrAseoSalonRequiresGrupo, got %v", err)
	}
}
