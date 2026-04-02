package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"cong-alameda-backend/internal/models"
)

var ErrSemanaNotFound = errors.New("semana no encontrada")

type SemanaRepository struct {
	db *pgxpool.Pool
}

func NewSemanaRepository(db *pgxpool.Pool) *SemanaRepository {
	return &SemanaRepository{db: db}
}

func (r *SemanaRepository) Create(ctx context.Context, s *models.SemanaVisita) error {
	query := `INSERT INTO semanas_visita (id, fecha_inicio, fecha_fin, nombre) VALUES ($1, $2, $3, $4) RETURNING created_at, updated_at`
	s.ID = uuid.New()
	return r.db.QueryRow(ctx, query, s.ID, s.FechaInicio, s.FechaFin, s.Nombre).Scan(&s.CreatedAt, &s.UpdatedAt)
}

func (r *SemanaRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SemanaVisita, error) {
	query := `SELECT id, fecha_inicio, fecha_fin, nombre, archivado, created_at, updated_at FROM semanas_visita WHERE id = $1`
	s := &models.SemanaVisita{}
	err := r.db.QueryRow(ctx, query, id).Scan(&s.ID, &s.FechaInicio, &s.FechaFin, &s.Nombre, &s.Archivado, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSemanaNotFound
		}
		return nil, err
	}
	return s, nil
}

func (r *SemanaRepository) List(ctx context.Context, includeArchived bool) ([]*models.SemanaVisita, error) {
	query := `SELECT id, fecha_inicio, fecha_fin, nombre, archivado, created_at, updated_at FROM semanas_visita`
	if !includeArchived {
		query += ` WHERE archivado = false`
	}
	query += ` ORDER BY fecha_inicio DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var semanas []*models.SemanaVisita
	for rows.Next() {
		s := &models.SemanaVisita{}
		rows.Scan(&s.ID, &s.FechaInicio, &s.FechaFin, &s.Nombre, &s.Archivado, &s.CreatedAt, &s.UpdatedAt)
		semanas = append(semanas, s)
	}
	return semanas, nil
}

func (r *SemanaRepository) Archive(ctx context.Context, id uuid.UUID, archived bool) error {
	query := `UPDATE semanas_visita SET archivado = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, archived, id)
	return err
}

func (r *SemanaRepository) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.SemanaVisita, error) {
	setClauses := ""
	args := []interface{}{}
	argNum := 1
	for col, val := range updates {
		if setClauses != "" {
			setClauses += ", "
		}
		setClauses += fmt.Sprintf("%s = $%d", col, argNum)
		args = append(args, val)
		argNum++
	}
	query := fmt.Sprintf(`UPDATE semanas_visita SET %s WHERE id = $%d RETURNING id, fecha_inicio, fecha_fin, nombre, archivado, created_at, updated_at`, setClauses, argNum)
	args = append(args, id)
	s := &models.SemanaVisita{}
	err := r.db.QueryRow(ctx, query, args...).Scan(&s.ID, &s.FechaInicio, &s.FechaFin, &s.Nombre, &s.Archivado, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSemanaNotFound
		}
		return nil, err
	}
	return s, nil
}

func (r *SemanaRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.db.Exec(ctx, `DELETE FROM semanas_visita WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrSemanaNotFound
	}
	return nil
}

func (r *SemanaRepository) CreateDiasSemana(ctx context.Context, semanaID uuid.UUID, fechaInicio time.Time) error {
	for dia := 0; dia <= 6; dia++ {
		query := `INSERT INTO dias_semana (id, semana_id, dia_semana) VALUES ($1, $2, $3)`
		_, err := r.db.Exec(ctx, query, uuid.New(), semanaID, dia)
		if err != nil {
			return err
		}
	}
	return nil
}
