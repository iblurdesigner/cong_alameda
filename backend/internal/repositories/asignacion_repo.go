package repositories

import (
	"context"
	"errors"
	"time"

	"cong-alameda-backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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
		INSERT INTO asignacion_semanal (id, semana_id, tipo_asignacion_id, user_id, grupo_id, dia_semana, observaciones)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	if asignacion.ID == uuid.Nil {
		asignacion.ID = uuid.New()
	}

	_, err := r.db.Exec(ctx, query,
		asignacion.ID,
		asignacion.SemanaID,
		asignacion.TipoAsignacionID,
		asignacion.UserID,
		asignacion.GrupoID,
		asignacion.DiaSemana,
		asignacion.Observaciones,
	)
	return err
}

func (r *AsignacionRepository) GetBySemana(ctx context.Context, semanaID uuid.UUID) ([]*models.AsignacionDetail, error) {
	query := `
		SELECT 
			a.id, a.semana_id, a.tipo_asignacion_id, a.user_id, a.grupo_id, a.dia_semana, 
			a.observaciones, a.created_at, a.updated_at,
			t.id, t.nombre, t.descripcion, t.icono,
			u.id, u.nombre, u.email, u.rol,
			g.id, g.nombre, g.numero
		FROM asignacion_semanal a
		JOIN tipo_asignacion t ON t.id = a.tipo_asignacion_id
		LEFT JOIN users u ON u.id = a.user_id
		LEFT JOIN grupos g ON g.id = a.grupo_id
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
		var (
			tempUserID *uuid.UUID
			uID        *uuid.UUID
			uNombre    *string
			uEmail     *string
			uRol       *string
			gID        *uuid.UUID
			gNombre    *string
			gNumero    *int
		)

		err := rows.Scan(
			&a.ID, &a.SemanaID, &a.TipoAsignacionID, &tempUserID, &a.GrupoID, &a.DiaSemana,
			&a.Observaciones, &a.CreatedAt, &a.UpdatedAt,
			&t.ID, &t.Nombre, &t.Descripcion, &t.Icono,
			&uID, &uNombre, &uEmail, &uRol,
			&gID, &gNombre, &gNumero,
		)
		if err != nil {
			return nil, err
		}

		if tempUserID != nil {
			a.UserID = *tempUserID
		}

		a.TipoAsignacion = t
		if uID != nil {
			a.User = &models.User{
				ID:     *uID,
				Nombre: *uNombre,
				Email:  *uEmail,
				Rol:    models.Rol(*uRol),
			}
		}
		if gID != nil {
			a.Grupo = &models.Grupo{
				ID:     *gID,
				Nombre: *gNombre,
				Numero: *gNumero,
			}
		}
		asignaciones = append(asignaciones, a)
	}
	return asignaciones, nil
}

func (r *AsignacionRepository) GetBySemanaAndDia(ctx context.Context, semanaID uuid.UUID, diaSemana int) ([]*models.AsignacionDetail, error) {
	query := `
		SELECT 
			a.id, a.semana_id, a.tipo_asignacion_id, a.user_id, a.grupo_id, a.dia_semana, 
			a.observaciones, a.created_at, a.updated_at,
			t.id, t.nombre, t.descripcion, t.icono,
			u.id, u.nombre, u.email, u.rol,
			g.id, g.nombre, g.numero
		FROM asignacion_semanal a
		JOIN tipo_asignacion t ON t.id = a.tipo_asignacion_id
		LEFT JOIN users u ON u.id = a.user_id
		LEFT JOIN grupos g ON g.id = a.grupo_id
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
		var (
			tempUserID *uuid.UUID
			uID        *uuid.UUID
			uNombre    *string
			uEmail     *string
			uRol       *string
			gID        *uuid.UUID
			gNombre    *string
			gNumero    *int
		)

		err := rows.Scan(
			&a.ID, &a.SemanaID, &a.TipoAsignacionID, &tempUserID, &a.GrupoID, &a.DiaSemana,
			&a.Observaciones, &a.CreatedAt, &a.UpdatedAt,
			&t.ID, &t.Nombre, &t.Descripcion, &t.Icono,
			&uID, &uNombre, &uEmail, &uRol,
			&gID, &gNombre, &gNumero,
		)
		if err != nil {
			return nil, err
		}

		if tempUserID != nil {
			a.UserID = *tempUserID
		}

		a.TipoAsignacion = t
		if uID != nil {
			a.User = &models.User{
				ID:     *uID,
				Nombre: *uNombre,
				Email:  *uEmail,
				Rol:    models.Rol(*uRol),
			}
		}
		if gID != nil {
			a.Grupo = &models.Grupo{
				ID:     *gID,
				Nombre: *gNombre,
				Numero: *gNumero,
			}
		}
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

func (r *AsignacionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.AsignacionSemanal, error) {
	query := `
		SELECT id, semana_id, tipo_asignacion_id, user_id, grupo_id, dia_semana, observaciones, created_at, updated_at
		FROM asignacion_semanal
		WHERE id = $1
	`

	a := &models.AsignacionSemanal{}
	var tempUserID uuid.UUID
	err := r.db.QueryRow(ctx, query, id).Scan(
		&a.ID, &a.SemanaID, &a.TipoAsignacionID, &tempUserID, &a.GrupoID, &a.DiaSemana,
		&a.Observaciones, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAsignacionNotFound
		}
		return nil, err
	}
	a.UserID = tempUserID
	return a, nil
}

func (r *AsignacionRepository) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, grupoID *uuid.UUID, observaciones *string) error {
	query := `
		UPDATE asignacion_semanal 
		SET user_id = $1, grupo_id = $2, observaciones = $3, updated_at = $4
		WHERE id = $5
	`

	_, err := r.db.Exec(ctx, query, userID, grupoID, observaciones, time.Now(), id)
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
