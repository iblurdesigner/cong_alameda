package handlers

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
)

// fakeNotifLister implements notificacionServiceAPI for handler tests.
type fakeNotifLister struct {
	notifs []*models.Notificacion
	unread int
}

func (f *fakeNotifLister) GetByUserID(_ context.Context, _ uuid.UUID, _ *bool, _ string) ([]*models.Notificacion, int, error) {
	return f.notifs, f.unread, nil
}
func (f *fakeNotifLister) MarkAsRead(context.Context, uuid.UUID, uuid.UUID) error    { return nil }
func (f *fakeNotifLister) MarkAllAsRead(context.Context, uuid.UUID) error            { return nil }
func (f *fakeNotifLister) CleanupOldNotifications(context.Context, int) (int, error) { return 0, nil }
func (f *fakeNotifLister) GetVisitasProximasRekindle(context.Context, int) ([]*models.Visita, error) {
	return nil, nil
}
func (f *fakeNotifLister) CreateVisitaNotification(context.Context, models.NotificacionTipo, []uuid.UUID, string, uuid.UUID) error {
	return nil
}

// TestNotificacionHandler_List_ReturnsMixedTiposForGrouping verifies task 4.3:
// GET /api/notificaciones returns every notification carrying its `tipo` so the
// dashboard can group by type, plus the unread count. Runs the real Fiber
// handler end-to-end through app.Test() with an injected fake service.
func TestNotificacionHandler_List_ReturnsMixedTiposForGrouping(t *testing.T) {
	userID := uuid.New()
	now := time.Now()
	notifs := []*models.Notificacion{
		{ID: uuid.New(), Tipo: models.NotifTipoCasaRegistrada, Mensaje: "Casa registrada 1", CreatedAt: now},
		{ID: uuid.New(), Tipo: models.NotifTipoCasaRegistrada, Mensaje: "Casa registrada 2", CreatedAt: now},
		{ID: uuid.New(), Tipo: models.NotifTipoVisitaProgramada, Mensaje: "Visita programada", CreatedAt: now},
		{ID: uuid.New(), Tipo: models.NotifTipoAsignacionCreada, Mensaje: "Asignación creada", CreatedAt: now},
	}

	h := &NotificacionHandler{
		notificacionService: &fakeNotifLister{notifs: notifs, unread: 3},
	}

	app := fiber.New()
	app.Get("/api/notificaciones", func(c *fiber.Ctx) error {
		// Stand-in for the JWT middleware: inject the authenticated user.
		c.Locals("user_id", userID.String())
		return h.List(c)
	})

	resp, err := app.Test(httptest.NewRequest("GET", "/api/notificaciones", nil))
	if err != nil {
		t.Fatalf("app.Test failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var body dto.NotificacionListResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(body.Data) != 4 {
		t.Fatalf("expected 4 notifications, got %d", len(body.Data))
	}
	if body.UnreadCount != 3 {
		t.Errorf("expected unread_count 3, got %d", body.UnreadCount)
	}

	// The dashboard groups client-side by `tipo`: every item must carry one.
	groups := map[string]int{}
	for _, item := range body.Data {
		if item.Tipo == "" {
			t.Error("notification item missing tipo field, dashboard cannot group it")
		}
		groups[item.Tipo]++
	}
	if groups[string(models.NotifTipoCasaRegistrada)] != 2 {
		t.Errorf("expected 2 CASA_REGISTRADA, got %d", groups[string(models.NotifTipoCasaRegistrada)])
	}
	if groups[string(models.NotifTipoVisitaProgramada)] != 1 {
		t.Errorf("expected 1 VISITA_PROGRAMADA, got %d", groups[string(models.NotifTipoVisitaProgramada)])
	}
	if groups[string(models.NotifTipoAsignacionCreada)] != 1 {
		t.Errorf("expected 1 ASIGNACION_CREADA, got %d", groups[string(models.NotifTipoAsignacionCreada)])
	}
}
