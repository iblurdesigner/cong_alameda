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

var ErrDiaNotFound = errors.New("dia no encontrado")

type DiaSemanaRepository struct {
	db *pgxpool.Pool
}

func NewDiaSemanaRepository(db *pgxpool.Pool) *DiaSemanaRepository {
	return &DiaSemanaRepository{db: db}
}

func (r *DiaSemanaRepository) GetBySemanaID(ctx context.Context, semanaID uuid.UUID) ([]*models.DiaSemana, error) {
	query := `SELECT id, semana_id, dia_semana, territorio_manana_id, territorio_tarde_id, grupo_asignado_id, created_at, updated_at FROM dias_semana WHERE semana_id = $1 ORDER BY dia_semana ASC`
	rows, err := r.db.Query(ctx, query, semanaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dias []*models.DiaSemana
	for rows.Next() {
		d := &models.DiaSemana{}
		rows.Scan(&d.ID, &d.SemanaID, &d.DiaSemana, &d.TerritorioMananaID, &d.TerritorioTardeID, &d.GrupoAsignadoID, &d.CreatedAt, &d.UpdatedAt)
		dias = append(dias, d)
	}
	return dias, nil
}

func (r *DiaSemanaRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.DiaSemana, error) {
	query := `SELECT id, semana_id, dia_semana, territorio_manana_id, territorio_tarde_id, grupo_asignado_id, created_at, updated_at FROM dias_semana WHERE id = $1`
	d := &models.DiaSemana{}
	err := r.db.QueryRow(ctx, query, id).Scan(&d.ID, &d.SemanaID, &d.DiaSemana, &d.TerritorioMananaID, &d.TerritorioTardeID, &d.GrupoAsignadoID, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDiaNotFound
		}
		return nil, err
	}
	return d, nil
}

func (r *DiaSemanaRepository) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.DiaSemana, error) {
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
	query := fmt.Sprintf(`UPDATE dias_semana SET %s WHERE id = $%d RETURNING id, semana_id, dia_semana, territorio_manana_id, territorio_tarde_id, grupo_asignado_id, created_at, updated_at`, setClauses, argNum)
	args = append(args, id)
	d := &models.DiaSemana{}
	err := r.db.QueryRow(ctx, query, args...).Scan(&d.ID, &d.SemanaID, &d.DiaSemana, &d.TerritorioMananaID, &d.TerritorioTardeID, &d.GrupoAsignadoID, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDiaNotFound
		}
		return nil, err
	}
	return d, nil
}
