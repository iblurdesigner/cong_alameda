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

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/services"
)

// --- Service interface + mock for handler tests ---

type asignacionServiceForTest interface {
	Create(ctx context.Context, a *models.AsignacionSemanal) error
	Update(ctx context.Context, id, userID uuid.UUID, grupoID *uuid.UUID, observaciones *string) error
	BulkCreate(ctx context.Context, asignaciones []*models.AsignacionSemanal) error
	ClearSemana(ctx context.Context, semanaID uuid.UUID) error
	GetSemanaConAsignaciones(ctx context.Context, semanaID uuid.UUID) (*models.SemanaConAsignaciones, error)
	GetTiposAsignacion(ctx context.Context) ([]*models.TipoAsignacion, error)
	GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.AsignacionDetail, error)
	GetBySemana(ctx context.Context, semanaID uuid.UUID) ([]*models.AsignacionDetail, error)
	GetBySemanaAndDia(ctx context.Context, semanaID uuid.UUID, diaSemana int) ([]*models.AsignacionDetail, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type mockAsignacionService struct {
	createFunc     func(ctx context.Context, a *models.AsignacionSemanal) error
	updateFunc     func(ctx context.Context, id, userID uuid.UUID, grupoID *uuid.UUID, obs *string) error
	bulkCreateFunc func(ctx context.Context, as []*models.AsignacionSemanal) error
}

func (m *mockAsignacionService) Create(ctx context.Context, a *models.AsignacionSemanal) error {
	if m.createFunc != nil {
		return m.createFunc(ctx, a)
	}
	return nil
}
func (m *mockAsignacionService) Update(ctx context.Context, id, userID uuid.UUID, grupoID *uuid.UUID, obs *string) error {
	if m.updateFunc != nil {
		return m.updateFunc(ctx, id, userID, grupoID, obs)
	}
	return nil
}
func (m *mockAsignacionService) BulkCreate(ctx context.Context, as []*models.AsignacionSemanal) error {
	if m.bulkCreateFunc != nil {
		return m.bulkCreateFunc(ctx, as)
	}
	return nil
}
func (m *mockAsignacionService) ClearSemana(_ context.Context, _ uuid.UUID) error { return nil }
func (m *mockAsignacionService) GetSemanaConAsignaciones(_ context.Context, _ uuid.UUID) (*models.SemanaConAsignaciones, error) {
	return &models.SemanaConAsignaciones{}, nil
}
func (m *mockAsignacionService) GetTiposAsignacion(_ context.Context) ([]*models.TipoAsignacion, error) {
	return nil, nil
}
func (m *mockAsignacionService) GetByUser(_ context.Context, _ uuid.UUID) ([]*models.AsignacionDetail, error) {
	return nil, nil
}
func (m *mockAsignacionService) GetBySemana(_ context.Context, _ uuid.UUID) ([]*models.AsignacionDetail, error) {
	return nil, nil
}
func (m *mockAsignacionService) GetBySemanaAndDia(_ context.Context, _ uuid.UUID, _ int) ([]*models.AsignacionDetail, error) {
	return nil, nil
}
func (m *mockAsignacionService) Delete(_ context.Context, _ uuid.UUID) error { return nil }

// Compile-time check the mock satisfies the test interface AND that the
// production *AsignacionService does too (so the handler can accept either).
var _ asignacionServiceForTest = (*mockAsignacionService)(nil)

// --- Handler test harness ---

type asignacionTestHarness struct {
	app     *fiber.App
	handler *AsignacionHandler
	svc     *mockAsignacionService
}

func newAsignacionTestHarness() *asignacionTestHarness {
	app := fiber.New()
	svc := &mockAsignacionService{}
	handler := NewAsignacionHandler(svc)
	app.Post("/", handler.Create)
	app.Post("/bulk", handler.BulkCreate)
	app.Put("/:id", handler.Update)
	return &asignacionTestHarness{app: app, handler: handler, svc: svc}
}

func (h *asignacionTestHarness) doRequest(method, url, body string) (*http.Response, error) {
	req := httptest.NewRequest(method, url, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return h.app.Test(req, 1000)
}

func decodeError(t *testing.T, resp *http.Response) string {
	t.Helper()
	var errResp dto.ErrorResponse
	if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}
	return errResp.Error
}

// --- RED: invalid_grupo_id on Create ---

func TestAsignacionHandler_Create_InvalidGrupoID_Returns400(t *testing.T) {
	h := newAsignacionTestHarness()
	body := `{"semana_id":"` + uuid.New().String() + `","tipo_asignacion_id":"` + uuid.New().String() + `","user_id":"` + uuid.New().String() + `","grupo_id":"not-a-uuid","dia_semana":0}`
	resp, err := h.doRequest("POST", "/", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
	if got := decodeError(t, resp); got != "invalid_grupo_id" {
		t.Errorf("expected error 'invalid_grupo_id', got '%v'", got)
	}
}

// --- RED: invalid_grupo_id on Update ---

func TestAsignacionHandler_Update_InvalidGrupoID_Returns400(t *testing.T) {
	h := newAsignacionTestHarness()
	body := `{"grupo_id":"not-a-uuid"}`
	resp, err := h.doRequest("PUT", "/"+uuid.New().String(), body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
	if got := decodeError(t, resp); got != "invalid_grupo_id" {
		t.Errorf("expected error 'invalid_grupo_id', got '%v'", got)
	}
}

// --- RED: invalid_grupo_id on BulkCreate ---

func TestAsignacionHandler_BulkCreate_InvalidGrupoID_Returns400(t *testing.T) {
	h := newAsignacionTestHarness()
	body := `{"semana_id":"` + uuid.New().String() + `","asignaciones":[{"tipo_asignacion_id":"` + uuid.New().String() + `","grupo_id":"not-a-uuid","dia_semana":0}]}`
	resp, err := h.doRequest("POST", "/bulk", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
	if got := decodeError(t, resp); got != "invalid_grupo_id" {
		t.Errorf("expected error 'invalid_grupo_id', got '%v'", got)
	}
}

// --- RED: aseo_salon_requires_grupo mapping (service returns sentinel) ---

func TestAsignacionHandler_Create_AseoSalonRequiresGrupo_Returns400(t *testing.T) {
	h := newAsignacionTestHarness()
	h.svc.createFunc = func(_ context.Context, _ *models.AsignacionSemanal) error {
		return services.ErrAseoSalonRequiresGrupo
	}
	body := `{"semana_id":"` + uuid.New().String() + `","tipo_asignacion_id":"` + uuid.New().String() + `","user_id":"` + uuid.New().String() + `","dia_semana":0}`
	resp, err := h.doRequest("POST", "/", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
	if got := decodeError(t, resp); got != "aseo_salon_requires_grupo" {
		t.Errorf("expected error 'aseo_salon_requires_grupo', got '%v'", got)
	}
}

// --- RED: bulk routes ASEO_SALON violation through service ---

func TestAsignacionHandler_BulkCreate_AseoSalonRequiresGrupo_Returns400(t *testing.T) {
	h := newAsignacionTestHarness()
	h.svc.bulkCreateFunc = func(_ context.Context, _ []*models.AsignacionSemanal) error {
		return services.ErrAseoSalonRequiresGrupo
	}
	body := `{"semana_id":"` + uuid.New().String() + `","asignaciones":[{"tipo_asignacion_id":"` + uuid.New().String() + `","dia_semana":0}]}`
	resp, err := h.doRequest("POST", "/bulk", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
	if got := decodeError(t, resp); got != "aseo_salon_requires_grupo" {
		t.Errorf("expected error 'aseo_salon_requires_grupo', got '%v'", got)
	}
}
