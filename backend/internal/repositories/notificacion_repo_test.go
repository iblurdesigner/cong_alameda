package repositories

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"cong-alameda-backend/internal/models"
)

const testDBURL = "postgres://postgres:postgres@localhost:5432/cong_alameda_test"

func setupTestRepo(t *testing.T) *NotificacionRepository {
	t.Helper()

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, testDBURL)
	if err != nil {
		t.Skip("DATABASE_URL not set or database unavailable - skipping integration test")
	}
	t.Cleanup(func() { pool.Close() })

	return NewNotificacionRepository(pool)
}

// ========== CreateConReferencia Tests ==========

func TestNotificacionRepository_CreateConReferencia(t *testing.T) {
	repo := setupTestRepo(t)
	ctx := context.Background()

	t.Run("crea notificacion con referencia de tipo asignacion", func(t *testing.T) {
		asignacionID := uuid.New()
		refTipo := models.RefTipoAsignacion
		notif := &models.Notificacion{
			Tipo:           models.NotifTipoAsignacionCreada,
			Destinatarios:  []uuid.UUID{uuid.New()},
			Mensaje:        "Test asignacion notification",
			Leida:          false,
			ReferenciaID:   &asignacionID,
			ReferenciaTipo: &refTipo,
		}

		err := repo.CreateConReferencia(ctx, notif)
		if err != nil {
			t.Fatalf("CreateConReferencia failed: %v", err)
		}
		if notif.ID == uuid.Nil {
			t.Error("expected notificacion ID to be set")
		}
		if notif.CreatedAt.IsZero() {
			t.Error("expected CreatedAt to be set")
		}

		saved, err := repo.GetByID(ctx, notif.ID)
		if err != nil {
			t.Fatalf("GetByID failed: %v", err)
		}
		if saved.Tipo != notif.Tipo {
			t.Errorf("expected tipo %s, got %s", notif.Tipo, saved.Tipo)
		}
		if saved.ReferenciaID == nil || *saved.ReferenciaID != asignacionID {
			t.Error("expected referencia_id to match")
		}

		repo.Delete(ctx, notif.ID)
	})

	t.Run("crea notificacion con referencia de tipo visita", func(t *testing.T) {
		visitaID := uuid.New()
		refTipo := models.RefTipoVisita
		notif := &models.Notificacion{
			Tipo:           models.NotifTipoVisitaProgramada,
			Destinatarios:  []uuid.UUID{uuid.New()},
			Mensaje:        "Test visita notification",
			Leida:          false,
			ReferenciaID:   &visitaID,
			ReferenciaTipo: &refTipo,
		}

		err := repo.CreateConReferencia(ctx, notif)
		if err != nil {
			t.Fatalf("CreateConReferencia failed: %v", err)
		}

		repo.Delete(ctx, notif.ID)
	})

	t.Run("crea notificacion con multiplos destinatarios", func(t *testing.T) {
		refTipo := models.RefTipoAsignacion
		destinatarios := []uuid.UUID{uuid.New(), uuid.New(), uuid.New()}
		notif := &models.Notificacion{
			Tipo:           models.NotifTipoAsignacionCreada,
			Destinatarios:  destinatarios,
			Mensaje:        "Multiple recipients test",
			Leida:          false,
			ReferenciaTipo: &refTipo,
		}

		err := repo.CreateConReferencia(ctx, notif)
		if err != nil {
			t.Fatalf("CreateConReferencia failed: %v", err)
		}

		repo.Delete(ctx, notif.ID)
	})

	t.Run("crea notificacion sin referencia (campos nulos)", func(t *testing.T) {
		notif := &models.Notificacion{
			Tipo:           models.NotifTipoCasaRegistrada,
			Destinatarios:  []uuid.UUID{uuid.New()},
			Mensaje:        "No reference test",
			Leida:          false,
			ReferenciaID:   nil,
			ReferenciaTipo: nil,
		}

		err := repo.CreateConReferencia(ctx, notif)
		if err != nil {
			t.Fatalf("CreateConReferencia failed for nil reference: %v", err)
		}

		repo.Delete(ctx, notif.ID)
	})
}

// ========== DeleteOlderThan Tests ==========

func TestNotificacionRepository_DeleteOlderThan(t *testing.T) {
	repo := setupTestRepo(t)
	ctx := context.Background()

	t.Run("retorna conteo de notificaciones eliminadas", func(t *testing.T) {
		count, err := repo.DeleteOlderThan(ctx, 30)

		if err != nil {
			t.Fatalf("DeleteOlderThan failed: %v", err)
		}
		t.Logf("Deleted %d old notifications", count)
	})

	t.Run("acepta diferentes valores de dias", func(t *testing.T) {
		notif := &models.Notificacion{
			Tipo:          models.NotifTipoCasaRegistrada,
			Destinatarios: []uuid.UUID{uuid.New()},
			Mensaje:       "For deletion test",
			Leida:         false,
		}
		repo.Create(ctx, notif)

		count, err := repo.DeleteOlderThan(ctx, 0)
		if err != nil {
			t.Fatalf("DeleteOlderThan(0) failed: %v", err)
		}
		t.Logf("Deleted %d notifications with 0 days threshold", count)

		repo.Delete(ctx, notif.ID)
	})

	t.Run("maneja valores negativos de dias", func(t *testing.T) {
		count, err := repo.DeleteOlderThan(ctx, -5)

		if err != nil {
			t.Logf("Expected error for negative days: %v", err)
		} else {
			t.Logf("Deleted %d with negative threshold", count)
		}
	})
}

// ========== GetVisitasProximasNotificar Tests ==========

func TestNotificacionRepository_GetVisitasProximasNotificar(t *testing.T) {
	repo := setupTestRepo(t)
	ctx := context.Background()

	t.Run("retorna lista (vacia si no hay visitas)", func(t *testing.T) {
		visitas, err := repo.GetVisitasProximasNotificar(ctx, 30)

		if err != nil {
			t.Fatalf("GetVisitasProximasNotificar failed: %v", err)
		}
		if visitas == nil {
			t.Error("expected non-nil slice")
		}
		t.Logf("Found %d visitas for 30 days from now", len(visitas))
	})

	t.Run("acepta diferentes valores de dias", func(t *testing.T) {
		visitas, err := repo.GetVisitasProximasNotificar(ctx, 7)

		if err != nil {
			t.Fatalf("GetVisitasProximasNotificar(7) failed: %v", err)
		}
		t.Logf("Found %d visitas for 7 days from now", len(visitas))
	})
}

// ========== GetAsignacionesProximas Tests ==========

func TestNotificacionRepository_GetAsignacionesProximas(t *testing.T) {
	repo := setupTestRepo(t)
	ctx := context.Background()

	t.Run("retorna lista (vacia si no hay asignaciones)", func(t *testing.T) {
		asignaciones, err := repo.GetAsignacionesProximas(ctx, 7)

		if err != nil {
			t.Fatalf("GetAsignacionesProximas failed: %v", err)
		}
		if asignaciones == nil {
			t.Error("expected non-nil slice")
		}
		t.Logf("Found %d asignaciones for week starting in 7 days", len(asignaciones))
	})

	t.Run("incluye informacion de tipo de asignacion cuando hay datos", func(t *testing.T) {
		asignaciones, err := repo.GetAsignacionesProximas(ctx, 14)

		if err != nil {
			t.Fatalf("GetAsignacionesProximas failed: %v", err)
		}
		for _, a := range asignaciones {
			if a.TipoAsignacion == nil {
				t.Error("expected TipoAsignacion to be loaded")
			}
		}
	})
}

// ========== Edge Cases ==========

func TestNotificacionRepository_NotFound(t *testing.T) {
	repo := setupTestRepo(t)
	ctx := context.Background()

	t.Run("GetByID retorna error para ID inexistente", func(t *testing.T) {
		nonExistentID := uuid.New()
		_, err := repo.GetByID(ctx, nonExistentID)

		if err == nil {
			t.Error("expected error for non-existent ID")
		}
		if err != ErrNotificacionNotFound {
			t.Errorf("expected ErrNotificacionNotFound, got %v", err)
		}
	})

	t.Run("Delete retorna error para ID inexistente", func(t *testing.T) {
		nonExistentID := uuid.New()
		err := repo.Delete(ctx, nonExistentID)

		if err == nil {
			t.Error("expected error for non-existent ID")
		}
		if err != ErrNotificacionNotFound {
			t.Errorf("expected ErrNotificacionNotFound, got %v", err)
		}
	})

	t.Run("MarkAsRead retorna error para notificacion inexistente", func(t *testing.T) {
		err := repo.MarkAsRead(ctx, uuid.New(), uuid.New())

		if err == nil {
			t.Error("expected error for non-existent notificacion")
		}
		if err != ErrNotificacionNotFound {
			t.Errorf("expected ErrNotificacionNotFound, got %v", err)
		}
	})
}