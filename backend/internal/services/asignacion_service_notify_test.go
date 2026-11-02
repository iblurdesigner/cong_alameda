package services

import (
	"context"
	"strings"
	"testing"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
)

// Tests for task 4.2 of dashboard-notificaciones-asignaciones:
// unit coverage of the notification side-effect of the asignacion flows
// (Create / Update / BulkCreate -> AsignacionService.notifyAsignacion).

// mockNotifCreator implements the notificacionCreator seam (the subset of
// *NotificacionService that notifyAsignacion uses) and records every call.
type mockNotifCreator struct {
	created []*models.Notificacion
}

func (m *mockNotifCreator) CreateConReferencia(_ context.Context, n *models.Notificacion) error {
	m.created = append(m.created, n)
	return nil
}

// notifySemanaRepoNamed returns a SemanaVisita carrying a Nombre so the
// message-building branches of notifyAsignacion can be asserted.
type notifySemanaRepoNamed struct{}

func (m *notifySemanaRepoNamed) GetByID(_ context.Context, id uuid.UUID) (*models.SemanaVisita, error) {
	nombre := "Semana 12"
	return &models.SemanaVisita{ID: id, Nombre: &nombre}, nil
}

// newNotifyService wires an AsignacionService with the given notification
// creator (injected through the notificacionCreator seam) and a tipo repo
// containing a single "ACOMODADOR_SALON" tipo.
func newNotifyService(t *testing.T, creator *mockNotifCreator) (*AsignacionService, *mockAsignRepo, uuid.UUID) {
	t.Helper()
	mockRepo := newMockAsignRepo()
	tipoRepo := newMockTipoAsignRepo()
	tipoID := uuid.New()
	tipoRepo.byID[tipoID] = &models.TipoAsignacion{ID: tipoID, Nombre: "ACOMODADOR_SALON"}
	svc := NewAsignacionService(mockRepo, tipoRepo, &notifySemanaRepoNamed{}, &mockDiaRepo{}, &mockUserRepo{}, nil)
	if creator != nil {
		svc.notifService = creator
	}
	return svc, mockRepo, tipoID
}

func TestAsignacionService_Create_GeneratesAsignacionCreadaNotification(t *testing.T) {
	creator := &mockNotifCreator{}
	svc, _, tipoID := newNotifyService(t, creator)

	userID := uuid.New()
	semanaID := uuid.New()
	err := svc.Create(context.Background(), &models.AsignacionSemanal{
		SemanaID:         semanaID,
		TipoAsignacionID: tipoID,
		UserID:           userID,
		DiaSemana:        0,
	})
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	if len(creator.created) != 1 {
		t.Fatalf("expected exactly 1 notification, got %d", len(creator.created))
	}
	got := creator.created[0]

	if got.Tipo != models.NotifTipoAsignacionCreada {
		t.Errorf("expected tipo %q, got %q", models.NotifTipoAsignacionCreada, got.Tipo)
	}
	if len(got.Destinatarios) != 1 || got.Destinatarios[0] != userID {
		t.Errorf("expected destinatarios [\"%s\"], got %v", userID, got.Destinatarios)
	}
	if got.ReferenciaID == nil || *got.ReferenciaID != semanaID {
		t.Errorf("expected ReferenciaID == semanaID (%s), got %v", semanaID, got.ReferenciaID)
	}
	if got.ReferenciaTipo == nil || *got.ReferenciaTipo != models.RefTipoAsignacion {
		t.Errorf("expected ReferenciaTipo == %q, got %v", models.RefTipoAsignacion, got.ReferenciaTipo)
	}
	if !strings.Contains(got.Mensaje, "ACOMODADOR_SALON") {
		t.Errorf("expected message to contain tipo name, got %q", got.Mensaje)
	}
	if !strings.Contains(got.Mensaje, "Semana 12") {
		t.Errorf("expected message to contain semana name, got %q", got.Mensaje)
	}
}

func TestAsignacionService_Create_GrupoAssignmentDoesNotNotify(t *testing.T) {
	creator := &mockNotifCreator{}
	svc, _, tipoID := newNotifyService(t, creator)

	grupoID := uuid.New()
	err := svc.Create(context.Background(), &models.AsignacionSemanal{
		SemanaID:         uuid.New(),
		TipoAsignacionID: tipoID,
		UserID:           uuid.Nil,
		GrupoID:          &grupoID,
		DiaSemana:        0,
	})
	if err != nil {
		t.Fatalf("Create with grupo failed: %v", err)
	}
	if len(creator.created) != 0 {
		t.Errorf("expected no notifications for grupo assignment, got %d", len(creator.created))
	}
}

func TestAsignacionService_Update_GeneratesAsignacionActualizadaNotification(t *testing.T) {
	creator := &mockNotifCreator{}
	svc, mockRepo, tipoID := newNotifyService(t, creator)

	asignID := uuid.New()
	semanaID := uuid.New()
	mockRepo.byID[asignID] = &models.AsignacionSemanal{
		ID:               asignID,
		SemanaID:         semanaID,
		TipoAsignacionID: tipoID,
		UserID:           uuid.New(),
	}

	newUser := uuid.New()
	err := svc.Update(context.Background(), asignID, newUser, nil, nil)
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}

	if len(creator.created) != 1 {
		t.Fatalf("expected exactly 1 notification, got %d", len(creator.created))
	}
	got := creator.created[0]

	if got.Tipo != models.NotifTipoAsignacionActualizada {
		t.Errorf("expected tipo %q, got %q", models.NotifTipoAsignacionActualizada, got.Tipo)
	}
	if len(got.Destinatarios) != 1 || got.Destinatarios[0] != newUser {
		t.Errorf("expected destinatarios [\"%s\"], got %v", newUser, got.Destinatarios)
	}
	if got.ReferenciaID == nil || *got.ReferenciaID != semanaID {
		t.Errorf("expected ReferenciaID == semanaID (%s), got %v", semanaID, got.ReferenciaID)
	}
	if !strings.Contains(got.Mensaje, "actualizado") {
		t.Errorf("expected update-flavoured message, got %q", got.Mensaje)
	}
}

func TestAsignacionService_BulkCreate_NotifiesPerUserItem(t *testing.T) {
	creator := &mockNotifCreator{}
	svc, _, tipoID := newNotifyService(t, creator)

	items := []*models.AsignacionSemanal{
		{SemanaID: uuid.New(), TipoAsignacionID: tipoID, UserID: uuid.New()},
		{SemanaID: uuid.New(), TipoAsignacionID: tipoID, UserID: uuid.New()},
	}
	if err := svc.BulkCreate(context.Background(), items); err != nil {
		t.Fatalf("BulkCreate failed: %v", err)
	}
	if len(creator.created) != 2 {
		t.Fatalf("expected 2 notifications (one per user item), got %d", len(creator.created))
	}
	if creator.created[0].Destinatarios[0] != items[0].UserID || creator.created[1].Destinatarios[0] != items[1].UserID {
		t.Error("expected each notification addressed to its own item's user")
	}
}

func TestAsignacionService_Create_NilNotifCreatorDoesNotPanic(t *testing.T) {
	svc, _, tipoID := newNotifyService(t, nil)

	err := svc.Create(context.Background(), &models.AsignacionSemanal{
		SemanaID:         uuid.New(),
		TipoAsignacionID: tipoID,
		UserID:           uuid.New(),
	})
	if err != nil {
		t.Fatalf("expected Create to succeed with nil notification creator, got %v", err)
	}
}
