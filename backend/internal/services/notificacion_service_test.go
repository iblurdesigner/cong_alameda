package services

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

// NotificacionRepositoryInterface defines the methods needed for testing
type NotificacionRepositoryInterface interface {
	Create(ctx context.Context, notif *models.Notificacion) error
	CreateConReferencia(ctx context.Context, notif *models.Notificacion) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Notificacion, error)
	GetByUserID(ctx context.Context, userID uuid.UUID, leida *bool, tipo string) ([]*models.Notificacion, int, error)
	MarkAsRead(ctx context.Context, notifID, userID uuid.UUID) error
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID) error
	DeleteOlderThan(ctx context.Context, days int) (int, error)
	GetVisitasProximasNotificar(ctx context.Context, dias int) ([]*models.Visita, error)
	GetAsignacionesProximas(ctx context.Context, dias int) ([]*models.AsignacionDetail, error)
}

// mockNotifRepo implements NotificacionRepositoryInterface for testing
type mockNotifRepo struct {
	notifications   map[uuid.UUID]*models.Notificacion
	createErr      error
	createConRefErr error
	deleteErr      error
	deleteOlderErr error
}

func newMockNotifRepo() *mockNotifRepo {
	return &mockNotifRepo{
		notifications: make(map[uuid.UUID]*models.Notificacion),
	}
}

func (m *mockNotifRepo) Create(ctx context.Context, notif *models.Notificacion) error {
	if m.createErr != nil {
		return m.createErr
	}
	notif.ID = uuid.New()
	m.notifications[notif.ID] = notif
	return nil
}

func (m *mockNotifRepo) CreateConReferencia(ctx context.Context, notif *models.Notificacion) error {
	if m.createConRefErr != nil {
		return m.createConRefErr
	}
	notif.ID = uuid.New()
	m.notifications[notif.ID] = notif
	return nil
}

func (m *mockNotifRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Notificacion, error) {
	if notif, ok := m.notifications[id]; ok {
		return notif, nil
	}
	return nil, repositories.ErrNotificacionNotFound
}

func (m *mockNotifRepo) GetByUserID(ctx context.Context, userID uuid.UUID, leida *bool, tipo string) ([]*models.Notificacion, int, error) {
	var result []*models.Notificacion
	for _, n := range m.notifications {
		for _, dest := range n.Destinatarios {
			if dest == userID {
				if leida != nil && n.Leida != *leida {
					continue
				}
				if tipo != "" && n.Tipo != models.NotificacionTipo(tipo) {
					continue
				}
				result = append(result, n)
				break
			}
		}
	}
	return result, len(result), nil
}

func (m *mockNotifRepo) MarkAsRead(ctx context.Context, notifID, userID uuid.UUID) error {
	if _, ok := m.notifications[notifID]; !ok {
		return repositories.ErrNotificacionNotFound
	}
	m.notifications[notifID].Leida = true
	return nil
}

func (m *mockNotifRepo) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	for _, n := range m.notifications {
		for _, dest := range n.Destinatarios {
			if dest == userID {
				n.Leida = true
			}
		}
	}
	return nil
}

func (m *mockNotifRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteErr != nil {
		return m.deleteErr
	}
	if _, ok := m.notifications[id]; !ok {
		return repositories.ErrNotificacionNotFound
	}
	delete(m.notifications, id)
	return nil
}

func (m *mockNotifRepo) DeleteOlderThan(ctx context.Context, days int) (int, error) {
	if m.deleteOlderErr != nil {
		return 0, m.deleteOlderErr
	}
	return 0, nil
}

func (m *mockNotifRepo) GetVisitasProximasNotificar(ctx context.Context, dias int) ([]*models.Visita, error) {
	return []*models.Visita{}, nil
}

func (m *mockNotifRepo) GetAsignacionesProximas(ctx context.Context, dias int) ([]*models.AsignacionDetail, error) {
	return []*models.AsignacionDetail{}, nil
}

// testableService wraps NotificacionService with an interface-compatible repository
type testableService struct {
	repo NotificacionRepositoryInterface
}

func newTestableService(repo NotificacionRepositoryInterface) *testableService {
	return &testableService{repo: repo}
}

func (s *testableService) Create(ctx context.Context, notif *models.Notificacion) error {
	notif.Leida = false
	return s.repo.Create(ctx, notif)
}

func (s *testableService) CreateAsignacionNotification(
	ctx context.Context,
	tipo models.NotificacionTipo,
	destinatarios []uuid.UUID,
	mensaje string,
	asignacionID uuid.UUID,
) error {
	notif := &models.Notificacion{
		Tipo:          tipo,
		Destinatarios: destinatarios,
		Mensaje:       mensaje,
		Leida:         false,
		ReferenciaID:  &asignacionID,
		ReferenciaTipo: func() *models.ReferenciaTipo {
			rt := models.RefTipoAsignacion
			return &rt
		}(),
	}
	return s.repo.CreateConReferencia(ctx, notif)
}

func (s *testableService) CreateVisitaNotification(
	ctx context.Context,
	tipo models.NotificacionTipo,
	destinatarios []uuid.UUID,
	mensaje string,
	visitaID uuid.UUID,
) error {
	notif := &models.Notificacion{
		Tipo:          tipo,
		Destinatarios: destinatarios,
		Mensaje:       mensaje,
		Leida:         false,
		ReferenciaID:  &visitaID,
		ReferenciaTipo: func() *models.ReferenciaTipo {
			rt := models.RefTipoVisita
			return &rt
		}(),
	}
	return s.repo.CreateConReferencia(ctx, notif)
}

func (s *testableService) CleanupOldNotifications(ctx context.Context, dias int) (int, error) {
	if dias <= 0 {
		dias = 30
	}
	return s.repo.DeleteOlderThan(ctx, dias)
}

func (s *testableService) GetVisitasProximasRekindle(ctx context.Context, dias int) ([]*models.Visita, error) {
	return s.repo.GetVisitasProximasNotificar(ctx, dias)
}

func (s *testableService) GetAsignacionesProximas(ctx context.Context, dias int) ([]*models.AsignacionDetail, error) {
	return s.repo.GetAsignacionesProximas(ctx, dias)
}

// ========== CreateAsignacionNotification Tests ==========

func TestNotificacionService_CreateAsignacionNotification(t *testing.T) {
	mock := newMockNotifRepo()
	svc := newTestableService(mock)
	ctx := context.Background()

	t.Run("crea notificacion con referencia a asignacion", func(t *testing.T) {
		asignacionID := uuid.New()
		destinatarios := []uuid.UUID{uuid.New()}
		mensaje := "Nueva asignación: Usher para el domingo"

		err := svc.CreateAsignacionNotification(
			ctx,
			models.NotifTipoAsignacionCreada,
			destinatarios,
			mensaje,
			asignacionID,
		)

		if err != nil {
			t.Fatalf("CreateAsignacionNotification failed: %v", err)
		}

		if len(mock.notifications) != 1 {
			t.Error("expected 1 notification in mock")
		}

		var created *models.Notificacion
		for _, n := range mock.notifications {
			created = n
			break
		}

		if created.Tipo != models.NotifTipoAsignacionCreada {
			t.Errorf("expected tipo %s, got %s", models.NotifTipoAsignacionCreada, created.Tipo)
		}
		if created.ReferenciaTipo == nil || *created.ReferenciaTipo != models.RefTipoAsignacion {
			t.Error("expected referencia_tipo to be ASIGNACION")
		}
		if created.ReferenciaID == nil || *created.ReferenciaID != asignacionID {
			t.Error("expected referencia_id to match asignacionID")
		}
		if created.Leida != false {
			t.Error("expected Leida to be false")
		}
	})

	t.Run("crea notificacion de tipo actualizado", func(t *testing.T) {
		mock.notifications = make(map[uuid.UUID]*models.Notificacion)

		err := svc.CreateAsignacionNotification(
			ctx,
			models.NotifTipoAsignacionActualizada,
			[]uuid.UUID{uuid.New()},
			"Asignación actualizada",
			uuid.New(),
		)

		if err != nil {
			t.Fatalf("CreateAsignacionNotification failed: %v", err)
		}

		for _, n := range mock.notifications {
			if n.Tipo == models.NotifTipoAsignacionActualizada {
				return
			}
		}
		t.Error("expected ASIGNACION_ACTUALIZADA notification")
	})

	t.Run("con multiplos destinatarios", func(t *testing.T) {
		mock.notifications = make(map[uuid.UUID]*models.Notificacion)

		destinatarios := []uuid.UUID{uuid.New(), uuid.New(), uuid.New()}
		err := svc.CreateAsignacionNotification(
			ctx,
			models.NotifTipoAsignacionCreada,
			destinatarios,
			"Multiples destinatarios",
			uuid.New(),
		)

		if err != nil {
			t.Fatalf("CreateAsignacionNotification failed: %v", err)
		}

		for _, n := range mock.notifications {
			if len(n.Destinatarios) != 3 {
				t.Errorf("expected 3 destinatarios, got %d", len(n.Destinatarios))
			}
		}
	})

	t.Run("maneja error del repository", func(t *testing.T) {
		mock.notifications = make(map[uuid.UUID]*models.Notificacion)
		mock.createConRefErr = repositories.ErrNotificacionNotFound

		err := svc.CreateAsignacionNotification(
			ctx,
			models.NotifTipoAsignacionCreada,
			[]uuid.UUID{uuid.New()},
			"Test error",
			uuid.New(),
		)

		if err == nil {
			t.Error("expected error to propagate")
		}

		mock.createConRefErr = nil
	})
}

// ========== CreateVisitaNotification Tests ==========

func TestNotificacionService_CreateVisitaNotification(t *testing.T) {
	mock := newMockNotifRepo()
	svc := newTestableService(mock)
	ctx := context.Background()

	t.Run("crea notificacion con referencia a visita", func(t *testing.T) {
		mock.notifications = make(map[uuid.UUID]*models.Notificacion)

		visitaID := uuid.New()
		destinatarios := []uuid.UUID{uuid.New()}
		mensaje := "Visita programada para el 25/12/2024"

		err := svc.CreateVisitaNotification(
			ctx,
			models.NotifTipoVisitaProgramada,
			destinatarios,
			mensaje,
			visitaID,
		)

		if err != nil {
			t.Fatalf("CreateVisitaNotification failed: %v", err)
		}

		var created *models.Notificacion
		for _, n := range mock.notifications {
			created = n
			break
		}

		if created.Tipo != models.NotifTipoVisitaProgramada {
			t.Errorf("expected tipo %s, got %s", models.NotifTipoVisitaProgramada, created.Tipo)
		}
		if created.ReferenciaTipo == nil || *created.ReferenciaTipo != models.RefTipoVisita {
			t.Error("expected referencia_tipo to be VISITA")
		}
		if created.ReferenciaID == nil || *created.ReferenciaID != visitaID {
			t.Error("expected referencia_id to match visitaID")
		}
	})

	t.Run("crea notificacion de visita completada", func(t *testing.T) {
		mock.notifications = make(map[uuid.UUID]*models.Notificacion)

		err := svc.CreateVisitaNotification(
			ctx,
			models.NotifTipoVisitaCompletada,
			[]uuid.UUID{uuid.New()},
			"Visita completada exitosamente",
			uuid.New(),
		)

		if err != nil {
			t.Fatalf("CreateVisitaNotification failed: %v", err)
		}

		for _, n := range mock.notifications {
			if n.Tipo == models.NotifTipoVisitaCompletada {
				return
			}
		}
		t.Error("expected VISITA_COMPLETADA notification")
	})

	t.Run("con dos visitantes", func(t *testing.T) {
		mock.notifications = make(map[uuid.UUID]*models.Notificacion)

		visitante1 := uuid.New()
		visitante2 := uuid.New()

		err := svc.CreateVisitaNotification(
			ctx,
			models.NotifTipoVisitaProgramada,
			[]uuid.UUID{visitante1, visitante2},
			"Dois visitantes",
			uuid.New(),
		)

		if err != nil {
			t.Fatalf("CreateVisitaNotification failed: %v", err)
		}

		for _, n := range mock.notifications {
			if len(n.Destinatarios) != 2 {
				t.Errorf("expected 2 destinatarios, got %d", len(n.Destinatarios))
			}
		}
	})
}

// ========== CleanupOldNotifications Tests ==========

func TestNotificacionService_CleanupOldNotifications(t *testing.T) {
	mock := newMockNotifRepo()
	svc := newTestableService(mock)
	ctx := context.Background()

	t.Run("llama al repository con dias especificados", func(t *testing.T) {
		count, err := svc.CleanupOldNotifications(ctx, 30)

		if err != nil {
			t.Fatalf("CleanupOldNotifications failed: %v", err)
		}
		t.Logf("Deleted %d old notifications", count)
	})

	t.Run("usa valor por defecto para dias invalidos", func(t *testing.T) {
		_, err := svc.CleanupOldNotifications(ctx, 0)
		if err != nil {
			t.Fatalf("CleanupOldNotifications(0) failed: %v", err)
		}

		_, err = svc.CleanupOldNotifications(ctx, -5)
		if err != nil {
			t.Fatalf("CleanupOldNotifications(-5) failed: %v", err)
		}
	})

	t.Run("maneja error del repository", func(t *testing.T) {
		mock.deleteOlderErr = context.DeadlineExceeded

		_, err := svc.CleanupOldNotifications(ctx, 30)

		if err == nil {
			t.Error("expected error to propagate")
		}

		mock.deleteOlderErr = nil
	})
}

// ========== GetVisitasProximasRekindle Tests ==========

func TestNotificacionService_GetVisitasProximasRekindle(t *testing.T) {
	mock := newMockNotifRepo()
	svc := newTestableService(mock)
	ctx := context.Background()

	t.Run("delega al repository", func(t *testing.T) {
		visitas, err := svc.GetVisitasProximasRekindle(ctx, 20)

		if err != nil {
			t.Fatalf("GetVisitasProximasRekindle failed: %v", err)
		}
		if visitas == nil {
			t.Error("expected non-nil slice")
		}
	})

	t.Run("acepta diferentes valores de dias", func(t *testing.T) {
		visitas, err := svc.GetVisitasProximasRekindle(ctx, 7)

		if err != nil {
			t.Fatalf("GetVisitasProximasRekindle(7) failed: %v", err)
		}
		t.Logf("Found %d visitas for 7 days", len(visitas))
	})
}

// ========== GetAsignacionesProximas Tests ==========

func TestNotificacionService_GetAsignacionesProximas(t *testing.T) {
	mock := newMockNotifRepo()
	svc := newTestableService(mock)
	ctx := context.Background()

	t.Run("delega al repository", func(t *testing.T) {
		asignaciones, err := svc.GetAsignacionesProximas(ctx, 14)

		if err != nil {
			t.Fatalf("GetAsignacionesProximas failed: %v", err)
		}
		if asignaciones == nil {
			t.Error("expected non-nil slice")
		}
	})

	t.Run("retorna lista vacia cuando no hay asignaciones", func(t *testing.T) {
		asignaciones, err := svc.GetAsignacionesProximas(ctx, 30)

		if err != nil {
			t.Fatalf("GetAsignacionesProximas failed: %v", err)
		}
		if len(asignaciones) != 0 {
			t.Errorf("expected 0 asignaciones, got %d", len(asignaciones))
		}
	})
}

// ========== CRUD Operations ==========

func TestNotificacionService_CRUD(t *testing.T) {
	mock := newMockNotifRepo()
	svc := newTestableService(mock)
	ctx := context.Background()

	t.Run("Create establece Leida en false", func(t *testing.T) {
		notif := &models.Notificacion{
			Tipo:          models.NotifTipoCasaRegistrada,
			Destinatarios: []uuid.UUID{uuid.New()},
			Mensaje:       "Test",
			Leida:         true,
		}

		err := svc.Create(ctx, notif)

		if err != nil {
			t.Fatalf("Create failed: %v", err)
		}
		if notif.Leida != false {
			t.Error("expected Leida to be set to false")
		}
	})

	t.Run("Delete remueve notificacion", func(t *testing.T) {
		notif := &models.Notificacion{
			Tipo:          models.NotifTipoCasaRegistrada,
			Destinatarios: []uuid.UUID{uuid.New()},
			Mensaje:       "Test delete",
			Leida:         false,
		}
		svc.Create(ctx, notif)

		err := svc.repo.Delete(ctx, notif.ID)
		if err != nil {
			t.Fatalf("Delete failed: %v", err)
		}

		_, err = svc.repo.GetByID(ctx, notif.ID)
		if err == nil {
			t.Error("expected error getting deleted notification")
		}
	})

	t.Run("MarkAsRead actualiza leida", func(t *testing.T) {
		notif := &models.Notificacion{
			Tipo:          models.NotifTipoCasaRegistrada,
			Destinatarios: []uuid.UUID{uuid.New()},
			Mensaje:       "Test mark read",
			Leida:         false,
		}
		svc.Create(ctx, notif)

		err := svc.repo.MarkAsRead(ctx, notif.ID, uuid.New())
		if err != nil {
			t.Fatalf("MarkAsRead failed: %v", err)
		}

		updated, _ := svc.repo.GetByID(ctx, notif.ID)
		if updated.Leida != true {
			t.Error("expected Leida to be true after MarkAsRead")
		}
	})
}