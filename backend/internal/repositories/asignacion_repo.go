package repositories

import (
	"context"
	"errors"
	"time"

	"cong-alameda-backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrAsignacionNotFound = errors.New("asignacion no encontrada")
)

// AsignacionRepository handles asignacion_semanal database operations
type AsignacionRepository struct {
	db *pgxpool.Pool
}

func NewAsignacionRepository(db *pgxpool.Pool) *AsignacionRepository {
	return &AsignacionRepository{db: db}
}

func (r *AsignacionRepository) Create(ctx context.Context, asignacion *models.AsignacionSemanal) error {
	query := `
		INSERT INTO asignacion_semanal (id, semana_id, tipo_asignacion_id, user_id, dia_semana, observaciones)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	if asignacion.ID == uuid.Nil {
		asignacion.ID = uuid.New()
	}

	_, err := r.db.Exec(ctx, query,
		asignacion.ID,
		asignacion.SemanaID,
		asignacion.TipoAsignacionID,
		asignacion.UserID,
		asignacion.DiaSemana,
		asignacion.Observaciones,
	)
	return err
}

func (r *AsignacionRepository) GetBySemana(ctx context.Context, semanaID uuid.UUID) ([]*models.AsignacionDetail, error) {
	query := `
		SELECT 
			a.id, a.semana_id, a.tipo_asignacion_id, a.user_id, a.dia_semana, 
			a.observaciones, a.created_at, a.updated_at,
			t.id, t.nombre, t.descripcion, t.icono,
			u.id, u.nombre, u.email, u.rol
		FROM asignacion_semanal a
		JOIN tipo_asignacion t ON t.id = a.tipo_asignacion_id
		JOIN users u ON u.id = a.user_id
		WHERE a.semana_id = $1
		ORDER BY a.dia_semana, t.nombre
	`

	rows, err := r.db.Query(ctx, query, semanaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var asignaciones []*models.AsignacionDetail
	for rows.Next() {
		a := &models.AsignacionDetail{}
		t := &models.TipoAsignacion{}
		u := &models.User{}

		err := rows.Scan(
			&a.ID, &a.SemanaID, &a.TipoAsignacionID, &a.UserID, &a.DiaSemana,
			&a.Observaciones, &a.CreatedAt, &a.UpdatedAt,
			&t.ID, &t.Nombre, &t.Descripcion, &t.Icono,
			&u.ID, &u.Nombre, &u.Email, &u.Rol,
		)
		if err != nil {
			return nil, err
		}

		a.TipoAsignacion = t
		a.User = u
		asignaciones = append(asignaciones, a)
	}
	return asignaciones, nil
}

func (r *AsignacionRepository) GetBySemanaAndDia(ctx context.Context, semanaID uuid.UUID, diaSemana int) ([]*models.AsignacionDetail, error) {
	query := `
		SELECT 
			a.id, a.semana_id, a.tipo_asignacion_id, a.user_id, a.dia_semana, 
			a.observaciones, a.created_at, a.updated_at,
			t.id, t.nombre, t.descripcion, t.icono,
			u.id, u.nombre, u.email, u.rol
		FROM asignacion_semanal a
		JOIN tipo_asignacion t ON t.id = a.tipo_asignacion_id
		JOIN users u ON u.id = a.user_id
		WHERE a.semana_id = $1 AND a.dia_semana = $2
		ORDER BY t.nombre
	`

	rows, err := r.db.Query(ctx, query, semanaID, diaSemana)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var asignaciones []*models.AsignacionDetail
	for rows.Next() {
		a := &models.AsignacionDetail{}
		t := &models.TipoAsignacion{}
		u := &models.User{}

		err := rows.Scan(
			&a.ID, &a.SemanaID, &a.TipoAsignacionID, &a.UserID, &a.DiaSemana,
			&a.Observaciones, &a.CreatedAt, &a.UpdatedAt,
			&t.ID, &t.Nombre, &t.Descripcion, &t.Icono,
			&u.ID, &u.Nombre, &u.Email, &u.Rol,
		)
		if err != nil {
			return nil, err
		}

		a.TipoAsignacion = t
		a.User = u
		asignaciones = append(asignaciones, a)
	}
	return asignaciones, nil
}

func (r *AsignacionRepository) GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.AsignacionDetail, error) {
	query := `
		SELECT 
			a.id, a.semana_id, a.tipo_asignacion_id, a.user_id, a.dia_semana, 
			a.observaciones, a.created_at, a.updated_at,
			t.id, t.nombre, t.descripcion, t.icono,
			s.id, s.fecha_inicio, s.fecha_fin, s.nombre
		FROM asignacion_semanal a
		JOIN tipo_asignacion t ON t.id = a.tipo_asignacion_id
		JOIN semanas_visita s ON s.id = a.semana_id
		WHERE a.user_id = $1
		AND s.fecha_inicio <= CURRENT_DATE
		AND s.fecha_fin >= CURRENT_DATE
		ORDER BY s.fecha_inicio, a.dia_semana
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var asignaciones []*models.AsignacionDetail
	for rows.Next() {
		a := &models.AsignacionDetail{}
		t := &models.TipoAsignacion{}
		s := &models.SemanaVisita{}

		err := rows.Scan(
			&a.ID, &a.SemanaID, &a.TipoAsignacionID, &a.UserID, &a.DiaSemana,
			&a.Observaciones, &a.CreatedAt, &a.UpdatedAt,
			&t.ID, &t.Nombre, &t.Descripcion, &t.Icono,
			&s.ID, &s.FechaInicio, &s.FechaFin, &s.Nombre,
		)
		if err != nil {
			return nil, err
		}

		a.TipoAsignacion = t
		a.Semana = s
		asignaciones = append(asignaciones, a)
	}
	return asignaciones, nil
}

func (r *AsignacionRepository) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, observaciones *string) error {
	query := `
		UPDATE asignacion_semanal 
		SET user_id = $1, observaciones = $2, updated_at = $3
		WHERE id = $4
	`

	_, err := r.db.Exec(ctx, query, userID, observaciones, time.Now(), id)
	return err
}

func (r *AsignacionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM asignacion_semanal WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *AsignacionRepository) DeleteBySemana(ctx context.Context, semanaID uuid.UUID) error {
	query := `DELETE FROM asignacion_semanal WHERE semana_id = $1`
	_, err := r.db.Exec(ctx, query, semanaID)
	return err
}
