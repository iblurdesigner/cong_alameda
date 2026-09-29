package services

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

type mockPublicadorRepo struct {
	items map[uuid.UUID]*models.Publicador
}

func newMockPublicadorRepo() *mockPublicadorRepo {
	return &mockPublicadorRepo{
		items: make(map[uuid.UUID]*models.Publicador),
	}
}

func (m *mockPublicadorRepo) Create(ctx context.Context, p *models.Publicador) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	now := time.Now()
	p.CreatedAt = now
	p.UpdatedAt = now
	m.items[p.ID] = p
	return nil
}

func (m *mockPublicadorRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Publicador, error) {
	p, exists := m.items[id]
	if !exists {
		return nil, repositories.ErrPublicadorNotFound
	}
	return p, nil
}

func (m *mockPublicadorRepo) List(ctx context.Context, search string, grupoID *uuid.UUID, activoOnly bool) ([]*models.Publicador, error) {
	var list []*models.Publicador
	for _, p := range m.items {
		if activoOnly && !p.Activo {
			continue
		}
		if grupoID != nil && (p.GrupoID == nil || *p.GrupoID != *grupoID) {
			continue
		}
		list = append(list, p)
	}
	return list, nil
}

func (m *mockPublicadorRepo) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.Publicador, error) {
	p, exists := m.items[id]
	if !exists {
		return nil, repositories.ErrPublicadorNotFound
	}

	if nombres, ok := updates["nombres"].(string); ok {
		p.Nombres = nombres
	}
	if apellidos, ok := updates["apellidos"].(string); ok {
		p.Apellidos = apellidos
	}
	if cel, ok := updates["celular"].(*string); ok {
		p.Celular = cel
	}
	if grupoID, ok := updates["grupo_id"].(*uuid.UUID); ok {
		p.GrupoID = grupoID
	}
	p.UpdatedAt = time.Now()
	return p, nil
}

func (m *mockPublicadorRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if _, exists := m.items[id]; !exists {
		return repositories.ErrPublicadorNotFound
	}
	delete(m.items, id)
	return nil
}

func TestPublicadorService_CRUD(t *testing.T) {
	repo := newMockPublicadorRepo()
	service := NewPublicadorService(repo)
	ctx := context.Background()

	// 1. Create validation failure
	_, err := service.Create(ctx, &dto.CreatePublicadorRequest{
		Nombres:   "   ",
		Apellidos: "   ",
	})
	if err == nil {
		t.Fatalf("expected error creating publisher with empty names, got nil")
	}

	// 2. Create success
	celular := "0991234567"
	grupoID := uuid.New()
	created, err := service.Create(ctx, &dto.CreatePublicadorRequest{
		Nombres:   "Juan",
		Apellidos: "Pérez",
		Celular:   &celular,
		GrupoID:   &grupoID,
	})
	if err != nil {
		t.Fatalf("unexpected error creating publisher: %v", err)
	}
	if created.Nombres != "Juan" || created.Apellidos != "Pérez" || created.Nombre != "Juan Pérez" || created.Celular == nil || *created.Celular != celular {
		t.Errorf("created publisher data mismatch")
	}

	// 3. GetByID
	fetched, err := service.GetByID(ctx, created.ID)
	if err != nil {
		t.Fatalf("unexpected error getting publisher: %v", err)
	}
	if fetched.ID != created.ID {
		t.Errorf("fetched ID mismatch")
	}

	// 4. List
	list, err := service.List(ctx, "", nil, true)
	if err != nil {
		t.Fatalf("unexpected error listing: %v", err)
	}
	if len(list) != 1 {
		t.Errorf("expected 1 publisher, got %d", len(list))
	}

	// 5. Update
	nuevosNombres := "Juan Carlos"
	updated, err := service.Update(ctx, created.ID, &dto.UpdatePublicadorRequest{
		Nombres: &nuevosNombres,
	})
	if err != nil {
		t.Fatalf("unexpected error updating publisher: %v", err)
	}
	if updated.Nombres != nuevosNombres {
		t.Errorf("expected updated name %s, got %s", nuevosNombres, updated.Nombres)
	}

	// 6. Delete
	err = service.Delete(ctx, created.ID)
	if err != nil {
		t.Fatalf("unexpected error deleting publisher: %v", err)
	}

	// 7. Get after delete should fail
	_, err = service.GetByID(ctx, created.ID)
	if err == nil {
		t.Fatalf("expected error getting deleted publisher, got nil")
	}
}
