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

var ErrGrupoNotFound = errors.New("grupo no encontrado")

type GrupoRepository struct {
	db *pgxpool.Pool
}

func NewGrupoRepository(db *pgxpool.Pool) *GrupoRepository {
	return &GrupoRepository{db: db}
}

func (r *GrupoRepository) Create(ctx context.Context, grupo *models.Grupo) error {
	query := `
		INSERT INTO grupos (id, nombre, numero, descripcion, direccion, contacto, conductor, horario, activo)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at, updated_at
	`
	grupo.ID = uuid.New()
	return r.db.QueryRow(ctx, query,
		grupo.ID, grupo.Nombre, grupo.Numero, grupo.Descripcion, grupo.Direccion, grupo.Contacto, grupo.Conductor, grupo.Horario, grupo.Activo,
	).Scan(&grupo.CreatedAt, &grupo.UpdatedAt)
}

func (r *GrupoRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Grupo, error) {
	query := `SELECT id, nombre, numero, descripcion, direccion, contacto, conductor, horario, activo, created_at, updated_at FROM grupos WHERE id = $1`
	g := &models.Grupo{}
	err := r.db.QueryRow(ctx, query, id).Scan(&g.ID, &g.Nombre, &g.Numero, &g.Descripcion, &g.Direccion, &g.Contacto, &g.Conductor, &g.Horario, &g.Activo, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrGrupoNotFound
		}
		return nil, err
	}
	return g, nil
}

func (r *GrupoRepository) List(ctx context.Context, activo *bool) ([]*models.Grupo, error) {
	query := `SELECT id, nombre, numero, descripcion, direccion, contacto, conductor, horario, activo, created_at, updated_at FROM grupos WHERE 1=1`
	args := []interface{}{}
	if activo != nil {
		query += ` AND activo = $1`
		args = append(args, *activo)
	}
	query += ` ORDER BY numero ASC`
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var grupos []*models.Grupo
	for rows.Next() {
		g := &models.Grupo{}
		rows.Scan(&g.ID, &g.Nombre, &g.Numero, &g.Descripcion, &g.Direccion, &g.Contacto, &g.Conductor, &g.Horario, &g.Activo, &g.CreatedAt, &g.UpdatedAt)
		grupos = append(grupos, g)
	}
	return grupos, nil
}

func (r *GrupoRepository) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.Grupo, error) {
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
	query := fmt.Sprintf(`UPDATE grupos SET %s WHERE id = $%d RETURNING id, nombre, numero, descripcion, direccion, contacto, conductor, horario, activo, created_at, updated_at`, setClauses, argNum)
	args = append(args, id)
	g := &models.Grupo{}
	err := r.db.QueryRow(ctx, query, args...).Scan(&g.ID, &g.Nombre, &g.Numero, &g.Descripcion, &g.Direccion, &g.Contacto, &g.Conductor, &g.Horario, &g.Activo, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrGrupoNotFound
		}
		return nil, err
	}
	return g, nil
}

func (r *GrupoRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `UPDATE grupos SET activo = false WHERE id = $1`, id)
	return err
}
