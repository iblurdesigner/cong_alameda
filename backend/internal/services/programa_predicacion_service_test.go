package services

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

// --- Mocks ---

type mockProgramaPredicacionRepository struct {
	programas   map[uuid.UUID]*models.ProgramaPredicacion
	territorios map[uuid.UUID][]uuid.UUID
}

func newMockProgramaPredicacionRepository() *mockProgramaPredicacionRepository {
	return &mockProgramaPredicacionRepository{
		programas:   make(map[uuid.UUID]*models.ProgramaPredicacion),
		territorios: make(map[uuid.UUID][]uuid.UUID),
	}
}

func (m *mockProgramaPredicacionRepository) Create(_ context.Context, p *models.ProgramaPredicacion) error {
	m.programas[p.ID] = p
	return nil
}

func (m *mockProgramaPredicacionRepository) GetByID(_ context.Context, id uuid.UUID) (*models.ProgramaPredicacion, error) {
	p, ok := m.programas[id]
	if !ok {
		return nil, repositories.ErrProgramaPredicacionNotFound
	}
	return p, nil
}

func (m *mockProgramaPredicacionRepository) GetAll(_ context.Context) ([]*models.ProgramaPredicacion, error) {
	result := make([]*models.ProgramaPredicacion, 0, len(m.programas))
	for _, p := range m.programas {
		result = append(result, p)
	}
	return result, nil
}

func (m *mockProgramaPredicacionRepository) Update(_ context.Context, id uuid.UUID, updates map[string]interface{}) (*models.ProgramaPredicacion, error) {
	p, ok := m.programas[id]
	if !ok {
		return nil, repositories.ErrProgramaPredicacionNotFound
	}
	for k, v := range updates {
		switch k {
		case "nombre":
			p.Nombre = v.(string)
		case "conductor":
			p.Conductor = v.(string)
		}
	}
	p.UpdatedAt = time.Now()
	return p, nil
}

func (m *mockProgramaPredicacionRepository) Delete(_ context.Context, id uuid.UUID) error {
	delete(m.programas, id)
	delete(m.territorios, id)
	return nil
}

func (m *mockProgramaPredicacionRepository) GetTerritorios(_ context.Context, _ uuid.UUID) ([]*models.Territorio, error) {
	return []*models.Territorio{}, nil
}

func (m *mockProgramaPredicacionRepository) SetTerritorios(_ context.Context, programaID uuid.UUID, territorioIDs []uuid.UUID) error {
	ids := make([]uuid.UUID, len(territorioIDs))
	copy(ids, territorioIDs)
	m.territorios[programaID] = ids
	return nil
}

type mockGrupoRepository struct{}

func (m *mockGrupoRepository) GetByID(_ context.Context, _ uuid.UUID) (*models.Grupo, error) {
	return nil, repositories.ErrGrupoNotFound
}

type mockTerritorioRepository struct{}

// --- Tests ---

func TestProgramaPredicacionService_Create_Success(t *testing.T) {
	repo := newMockProgramaPredicacionRepository()
	svc := NewProgramaPredicacionService(repo, &mockGrupoRepository{}, &mockTerritorioRepository{})

	nombre := "Predicación Matutina"
	fecha := "2026-07-21"
	diaSemana := 2
	conductor := "Hermano Pérez"
	horaInicio := "09:00"
	horaFin := "11:00"
	lugarNombre := "Salón del Reino"
	lugarDireccion := "Av. Siempre Viva 742"
	lugarCiudad := "Springfield"
	lugarProvincia := "Buenos Aires"
	lugarCodigoPostal := "1234"
	lugarPais := "Argentina"
	lugarContacto := "Bro. Simpson"
	lugarTelefono := "555-0102"
	grupoID := uuid.New()

	p, err := svc.Create(
		context.Background(),
		nombre, fecha, diaSemana,
		conductor, horaInicio, horaFin,
		lugarNombre, lugarDireccion, lugarCiudad, lugarProvincia, lugarCodigoPostal, lugarPais, lugarContacto, lugarTelefono,
		&grupoID,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p == nil {
		t.Fatal("expected non-nil program")
	}
	if p.Nombre != nombre {
		t.Errorf("expected nombre %q, got %q", nombre, p.Nombre)
	}
	if p.Fecha != fecha {
		t.Errorf("expected fecha %q, got %q", fecha, p.Fecha)
	}
	if p.DiaSemana != diaSemana {
		t.Errorf("expected diaSemana %d, got %d", diaSemana, p.DiaSemana)
	}
	if p.Conductor != conductor {
		t.Errorf("expected conductor %q, got %q", conductor, p.Conductor)
	}
	if p.HoraInicio != horaInicio {
		t.Errorf("expected horaInicio %q, got %q", horaInicio, p.HoraInicio)
	}
	if p.HoraFin != horaFin {
		t.Errorf("expected horaFin %q, got %q", horaFin, p.HoraFin)
	}
	if p.LugarNombre != lugarNombre {
		t.Errorf("expected lugarNombre %q, got %q", lugarNombre, p.LugarNombre)
	}
	if p.LugarDireccion != lugarDireccion {
		t.Errorf("expected lugarDireccion %q, got %q", lugarDireccion, p.LugarDireccion)
	}
	if p.LugarCiudad != lugarCiudad {
		t.Errorf("expected lugarCiudad %q, got %q", lugarCiudad, p.LugarCiudad)
	}
	if p.LugarProvincia != lugarProvincia {
		t.Errorf("expected lugarProvincia %q, got %q", lugarProvincia, p.LugarProvincia)
	}
	if p.LugarCodigoPostal != lugarCodigoPostal {
		t.Errorf("expected lugarCodigoPostal %q, got %q", lugarCodigoPostal, p.LugarCodigoPostal)
	}
	if p.LugarPais != lugarPais {
		t.Errorf("expected lugarPais %q, got %q", lugarPais, p.LugarPais)
	}
	if p.LugarContacto != lugarContacto {
		t.Errorf("expected lugarContacto %q, got %q", lugarContacto, p.LugarContacto)
	}
	if p.LugarTelefono != lugarTelefono {
		t.Errorf("expected lugarTelefono %q, got %q", lugarTelefono, p.LugarTelefono)
	}
	if p.GrupoID == nil || *p.GrupoID != grupoID {
		t.Errorf("expected grupoID %v, got %v", grupoID, p.GrupoID)
	}
}

func TestProgramaPredicacionService_Create_DefaultsEmptyFields(t *testing.T) {
	repo := newMockProgramaPredicacionRepository()
	svc := NewProgramaPredicacionService(repo, &mockGrupoRepository{}, &mockTerritorioRepository{})

	p, err := svc.Create(
		context.Background(),
		"Test", "2026-07-21", 0,
		"Conductor", "", "",
		"", "", "", "", "", "", "", "",
		nil,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p.HoraInicio != "09:00" {
		t.Errorf("expected default horaInicio 09:00, got %q", p.HoraInicio)
	}
	if p.HoraFin != "11:00" {
		t.Errorf("expected default horaFin 11:00, got %q", p.HoraFin)
	}
	if p.LugarNombre == "" {
		t.Error("expected default lugarNombre, got empty string")
	}
	if p.LugarPais != "Argentina" {
		t.Errorf("expected default lugarPais 'Argentina', got %q", p.LugarPais)
	}
}

func TestProgramaPredicacionService_GetByID_NotFound(t *testing.T) {
	repo := newMockProgramaPredicacionRepository()
	svc := NewProgramaPredicacionService(repo, &mockGrupoRepository{}, &mockTerritorioRepository{})

	_, err := svc.GetByID(context.Background(), uuid.New())
	if err == nil {
		t.Fatal("expected error for non-existent program, got nil")
	}
	if !errors.Is(err, repositories.ErrProgramaPredicacionNotFound) {
		t.Errorf("expected ErrProgramaPredicacionNotFound, got %v", err)
	}
}

func TestProgramaPredicacionService_SetTerritorios_DelegatesToRepo(t *testing.T) {
	repo := newMockProgramaPredicacionRepository()
	svc := NewProgramaPredicacionService(repo, &mockGrupoRepository{}, &mockTerritorioRepository{})

	programaID := uuid.New()
	territorioID1 := uuid.New()
	territorioID2 := uuid.New()

	err := svc.SetTerritorios(context.Background(), programaID, []string{territorioID1.String(), territorioID2.String()})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	stored, ok := repo.territorios[programaID]
	if !ok {
		t.Fatal("expected territorios to be stored in mock repo")
	}
	if len(stored) != 2 {
		t.Fatalf("expected 2 stored territorios, got %d", len(stored))
	}
	if stored[0] != territorioID1 {
		t.Errorf("expected territorioID %v at index 0, got %v", territorioID1, stored[0])
	}
	if stored[1] != territorioID2 {
		t.Errorf("expected territorioID %v at index 1, got %v", territorioID2, stored[1])
	}
}

func TestProgramaPredicacionService_Update_DelegatesToRepo(t *testing.T) {
	repo := newMockProgramaPredicacionRepository()
	svc := NewProgramaPredicacionService(repo, &mockGrupoRepository{}, &mockTerritorioRepository{})

	programa := &models.ProgramaPredicacion{
		ID:        uuid.New(),
		Nombre:    "Original",
		Fecha:     "2026-07-21",
		DiaSemana: 2,
		Conductor: "Hermano Original",
	}
	repo.programas[programa.ID] = programa

	updates := map[string]interface{}{
		"nombre":    "Updated Program",
		"conductor": "Hermano Actualizado",
	}

	detail, err := svc.Update(context.Background(), programa.ID, updates)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if detail == nil {
		t.Fatal("expected non-nil detail")
	}
	if detail.Nombre != "Updated Program" {
		t.Errorf("expected nombre %q, got %q", "Updated Program", detail.Nombre)
	}
	if detail.Conductor != "Hermano Actualizado" {
		t.Errorf("expected conductor %q, got %q", "Hermano Actualizado", detail.Conductor)
	}
}
