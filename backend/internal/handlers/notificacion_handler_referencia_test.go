package handlers

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
)

// TestNotificacionHandler_NotifToResponse_IncludesReferencia verifies that
// notifToResponse (the mapping used by GET /api/notificaciones -> List) propagates
// the new referencia_id / referencia_tipo fields from the domain model into the
// NotificacionResponse DTO. This is the exact JSON shape an app.Test() GET would
// serialize, so it proves Req 1's handler/responses.go mapping without needing a DB.
//
// NOTE: NotificacionHandler.notificacionService is a concrete *services.NotificacionService
// (no interface) whose GetByUserID delegates to *repositories.NotificacionRepository (no
// interface, requires a live Postgres). That makes a true mock-injected app.Test() GET
// impossible under the no-DB / no-production-edit constraints. notifToResponse is a pure
// mapping function, so we exercise it directly (white-box) to assert the DTO contract.
func TestNotificacionHandler_NotifToResponse_IncludesReferencia(t *testing.T) {
	h := &NotificacionHandler{}

	semanaID := uuid.New()
	refTipo := models.RefTipoAsignacion

	notif := &models.Notificacion{
		ID:             uuid.New(),
		Tipo:           models.NotifTipoAsignacionCreada,
		Mensaje:        "Se te ha asignado la función 'ACOMODADOR_SALON' para la semana 'Semana 12'.",
		Leida:          false,
		ReferenciaID:   &semanaID,
		ReferenciaTipo: &refTipo,
		CreatedAt:      time.Now(),
	}

	resp := h.notifToResponse(notif)

	if resp.ReferenciaID == nil {
		t.Fatal("expected referencia_id to be mapped into NotificacionResponse, got nil")
	}
	if *resp.ReferenciaID != semanaID {
		t.Errorf("expected referencia_id %s, got %s", semanaID, *resp.ReferenciaID)
	}

	if resp.ReferenciaTipo == nil {
		t.Fatal("expected referencia_tipo to be mapped into NotificacionResponse, got nil")
	}
	if *resp.ReferenciaTipo != string(models.RefTipoAsignacion) {
		t.Errorf("expected referencia_tipo %q, got %q", string(models.RefTipoAsignacion), *resp.ReferenciaTipo)
	}

	// Sanity: the rest of the DTO is still populated.
	if resp.ID != notif.ID {
		t.Errorf("expected id to match, got %s want %s", resp.ID, notif.ID)
	}
	if resp.Tipo != string(models.NotifTipoAsignacionCreada) {
		t.Errorf("expected tipo to be serialized, got %q", resp.Tipo)
	}
}

// compile-time reminder that NotificacionResponse carries the new fields.
var _ = dto.NotificacionResponse{}
