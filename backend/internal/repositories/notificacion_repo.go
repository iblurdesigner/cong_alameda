package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"cong-alameda-backend/internal/models"
)

var ErrNotificacionNotFound = errors.New("notificacion no encontrada")

type NotificacionRepository struct {
	db *pgxpool.Pool
}

func NewNotificacionRepository(db *pgxpool.Pool) *NotificacionRepository {
	return &NotificacionRepository{db: db}
}

func (r *NotificacionRepository) Create(ctx context.Context, notif *models.Notificacion) error {
	query := `
		INSERT INTO notificaciones (id, tipo, casa_id, destinatarios, mensaje, leida)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at
	`

	notif.ID = uuid.New()
	err := r.db.QueryRow(ctx, query,
		notif.ID,
		notif.Tipo,
		notif.CasaID,
		notif.Destinatarios,
		notif.Mensaje,
		notif.Leida,
	).Scan(&notif.CreatedAt)

	if err != nil {
		return fmt.Errorf("error creating notificacion: %w", err)
	}

	// Create entries in notificacion_usuario for each destinatario
	for _, userID := range notif.Destinatarios {
		_, err := r.db.Exec(ctx, `
			INSERT INTO notificacion_usuario (notificacion_id, usuario_id, leida)
			VALUES ($1, $2, false)
		`, notif.ID, userID)
		if err != nil {
			return fmt.Errorf("error creating notificacion_usuario entry: %w", err)
		}
	}

	return nil
}

func (r *NotificacionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Notificacion, error) {
	query := `
		SELECT id, tipo, casa_id, destinatarios, mensaje, leida, created_at
		FROM notificaciones
		WHERE id = $1
	`

	notif := &models.Notificacion{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&notif.ID,
		&notif.Tipo,
		&notif.CasaID,
		&notif.Destinatarios,
		&notif.Mensaje,
		&notif.Leida,
		&notif.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotificacionNotFound
		}
		return nil, fmt.Errorf("error getting notificacion: %w", err)
	}

	return notif, nil
}

func (r *NotificacionRepository) GetByUserID(ctx context.Context, userID uuid.UUID, leida *bool, tipo string) ([]*models.Notificacion, int, error) {
	// Get notifications for user via notificacion_usuario
	baseQuery := `
		SELECT n.id, n.tipo, n.casa_id, n.destinatarios, n.mensaje, nu.leida, n.created_at
		FROM notificaciones n
		JOIN notificacion_usuario nu ON n.id = nu.notificacion_id
		WHERE nu.usuario_id = $1
	`
	args := []interface{}{userID}
	argNum := 2

	if leida != nil {
		baseQuery += fmt.Sprintf(" AND nu.leida = $%d", argNum)
		args = append(args, *leida)
		argNum++
	}

	if tipo != "" {
		baseQuery += fmt.Sprintf(" AND n.tipo = $%d", argNum)
		args = append(args, tipo)
		argNum++
	}

	// Count unread for user
	countQuery := `
		SELECT COUNT(*) FROM notificaciones n
		JOIN notificacion_usuario nu ON n.id = nu.notificacion_id
		WHERE nu.usuario_id = $1 AND nu.leida = false
	`
	var unreadCount int
	err := r.db.QueryRow(ctx, countQuery, userID).Scan(&unreadCount)
	if err != nil {
		return nil, 0, fmt.Errorf("error counting unread: %w", err)
	}

	baseQuery += " ORDER BY n.created_at DESC"

	rows, err := r.db.Query(ctx, baseQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("error listing notificaciones: %w", err)
	}
	defer rows.Close()

	var notificaciones []*models.Notificacion
	for rows.Next() {
		notif := &models.Notificacion{}
		err := rows.Scan(
			&notif.ID,
			&notif.Tipo,
			&notif.CasaID,
			&notif.Destinatarios,
			&notif.Mensaje,
			&notif.Leida,
			&notif.CreatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("error scanning notificacion: %w", err)
		}
		notificaciones = append(notificaciones, notif)
	}

	return notificaciones, unreadCount, nil
}

func (r *NotificacionRepository) MarkAsRead(ctx context.Context, notificacionID, userID uuid.UUID) error {
	query := `
		UPDATE notificacion_usuario
		SET leida = true
		WHERE notificacion_id = $1 AND usuario_id = $2
	`
	result, err := r.db.Exec(ctx, query, notificacionID, userID)
	if err != nil {
		return fmt.Errorf("error marking notificacion as read: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrNotificacionNotFound
	}

	return nil
}

func (r *NotificacionRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	query := `
		UPDATE notificacion_usuario
		SET leida = true
		WHERE usuario_id = $1 AND leida = false
	`
	_, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("error marking all notificaciones as read: %w", err)
	}

	return nil
}

func (r *NotificacionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := "DELETE FROM notificaciones WHERE id = $1"
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("error deleting notificacion: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrNotificacionNotFound
	}

	return nil
}
