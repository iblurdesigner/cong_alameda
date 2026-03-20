package repositories

import (
	"context"
	"errors"

	"cong-alameda-backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrTipoAsignacionNotFound = errors.New("tipo de asignacion no encontrado")
)

// TipoAsignacionRepository handles tipo_asignacion database operations
type TipoAsignacionRepository struct {
	db *pgxpool.Pool
}

func NewTipoAsignacionRepository(db *pgxpool.Pool) *TipoAsignacionRepository {
	return &TipoAsignacionRepository{db: db}
}

func (r *TipoAsignacionRepository) GetAll(ctx context.Context) ([]*models.TipoAsignacion, error) {
	query := `SELECT id, nombre, descripcion, icono, created_at FROM tipo_asignacion ORDER BY nombre`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tipos []*models.TipoAsignacion
	for rows.Next() {
		t := &models.TipoAsignacion{}
		err := rows.Scan(&t.ID, &t.Nombre, &t.Descripcion, &t.Icono, &t.CreatedAt)
		if err != nil {
			return nil, err
		}
		tipos = append(tipos, t)
	}
	return tipos, nil
}

func (r *TipoAsignacionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TipoAsignacion, error) {
	query := `SELECT id, nombre, descripcion, icono, created_at FROM tipo_asignacion WHERE id = $1`

	t := &models.TipoAsignacion{}
	err := r.db.QueryRow(ctx, query, id).Scan(&t.ID, &t.Nombre, &t.Descripcion, &t.Icono, &t.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrTipoAsignacionNotFound
		}
		return nil, err
	}
	return t, nil
}

func (r *TipoAsignacionRepository) GetByNombre(ctx context.Context, nombre string) (*models.TipoAsignacion, error) {
	query := `SELECT id, nombre, descripcion, icono, created_at FROM tipo_asignacion WHERE nombre = $1`

	t := &models.TipoAsignacion{}
	err := r.db.QueryRow(ctx, query, nombre).Scan(&t.ID, &t.Nombre, &t.Descripcion, &t.Icono, &t.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrTipoAsignacionNotFound
		}
		return nil, err
	}
	return t, nil
}
