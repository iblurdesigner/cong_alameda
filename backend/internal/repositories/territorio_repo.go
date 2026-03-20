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

var ErrTerritorioNotFound = errors.New("territorio no encontrado")

type TerritorioRepository struct {
	db *pgxpool.Pool
}

func NewTerritorioRepository(db *pgxpool.Pool) *TerritorioRepository {
	return &TerritorioRepository{db: db}
}

func (r *TerritorioRepository) Create(ctx context.Context, t *models.Territorio) error {
	query := `
		INSERT INTO territorios (id, grupo_id, nombre, archivo_pdf, nombre_original, tamano, subido_por)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING fecha_subida, created_at, updated_at
	`
	t.ID = uuid.New()
	return r.db.QueryRow(ctx, query,
		t.ID, t.GrupoID, t.Nombre, t.ArchivoPDF, t.NombreOriginal, t.Tamano, t.SubidoPor,
	).Scan(&t.FechaSubida, &t.CreatedAt, &t.UpdatedAt)
}

func (r *TerritorioRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Territorio, error) {
	query := `SELECT id, grupo_id, nombre, archivo_pdf, nombre_original, tamano, fecha_subida, subido_por, created_at, updated_at FROM territorios WHERE id = $1`
	t := &models.Territorio{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&t.ID, &t.GrupoID, &t.Nombre, &t.ArchivoPDF, &t.NombreOriginal, &t.Tamano, &t.FechaSubida, &t.SubidoPor, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrTerritorioNotFound
		}
		return nil, err
	}
	return t, nil
}

func (r *TerritorioRepository) ListByGrupo(ctx context.Context, grupoID *uuid.UUID) ([]*models.Territorio, error) {
	query := `SELECT id, grupo_id, nombre, archivo_pdf, nombre_original, tamano, fecha_subida, subido_por, created_at, updated_at FROM territorios WHERE 1=1`
	args := []interface{}{}
	if grupoID != nil {
		query += fmt.Sprintf(` AND grupo_id = $1`)
		args = append(args, *grupoID)
	}
	query += ` ORDER BY fecha_subida DESC`
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var territorios []*models.Territorio
	for rows.Next() {
		t := &models.Territorio{}
		rows.Scan(&t.ID, &t.GrupoID, &t.Nombre, &t.ArchivoPDF, &t.NombreOriginal, &t.Tamano, &t.FechaSubida, &t.SubidoPor, &t.CreatedAt, &t.UpdatedAt)
		territorios = append(territorios, t)
	}
	return territorios, nil
}

func (r *TerritorioRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.db.Exec(ctx, `DELETE FROM territorios WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrTerritorioNotFound
	}
	return nil
}

func (r *TerritorioRepository) GetByGrupoID(ctx context.Context, grupoID uuid.UUID) ([]*models.Territorio, error) {
	return r.ListByGrupo(ctx, &grupoID)
}
