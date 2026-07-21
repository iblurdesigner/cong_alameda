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

var ErrVisitaNotFound = errors.New("visita no encontrada")

type VisitaRepository struct {
	db *pgxpool.Pool
}

func NewVisitaRepository(db *pgxpool.Pool) *VisitaRepository {
	return &VisitaRepository{db: db}
}

func (r *VisitaRepository) Create(ctx context.Context, visita *models.Visita) error {
	query := `
		INSERT INTO visitas (id, casa_id, fecha_programada, visitante_1_id, visitante_2_id, estado)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at
	`

	visita.ID = uuid.New()
	// Convert enum to plain string to avoid String() method being called by driver
	estadoStr := string(visita.Estado)

	// Convert uuid.Nil to nil pointer for nullable foreign keys
	var v1, v2 *uuid.UUID
	if visita.Visitante1ID != uuid.Nil {
		v1 = &visita.Visitante1ID
	}
	if visita.Visitante2ID != uuid.Nil {
		v2 = &visita.Visitante2ID
	}

	err := r.db.QueryRow(ctx, query,
		visita.ID,
		visita.CasaID,
		visita.FechaProgramada,
		v1,
		v2,
		estadoStr,
	).Scan(&visita.CreatedAt, &visita.UpdatedAt)

	if err != nil {
		return fmt.Errorf("error creating visita: %w", err)
	}

	return nil
}

func (r *VisitaRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Visita, error) {
	query := `
		SELECT id, casa_id, fecha_programada, fecha_realizada, visitante_1_id, visitante_2_id,
		       observaciones, desea_seguir_recibiendo, estado, created_at, updated_at
		FROM visitas
		WHERE id = $1
	`

	visita := &models.Visita{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&visita.ID,
		&visita.CasaID,
		&visita.FechaProgramada,
		&visita.FechaRealizada,
		&visita.Visitante1ID,
		&visita.Visitante2ID,
		&visita.Observaciones,
		&visita.DeseaSeguirRecibiendo,
		&visita.Estado,
		&visita.CreatedAt,
		&visita.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrVisitaNotFound
		}
		return nil, fmt.Errorf("error getting visita: %w", err)
	}

	return visita, nil
}

func (r *VisitaRepository) List(ctx context.Context, casaID *uuid.UUID, estado string, page, limit int) ([]*models.Visita, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	baseQuery := "FROM visitas WHERE 1=1"
	args := []interface{}{}
	argNum := 1

	if casaID != nil {
		baseQuery += fmt.Sprintf(" AND casa_id = $%d", argNum)
		args = append(args, *casaID)
		argNum++
	}

	if estado != "" {
		baseQuery += fmt.Sprintf(" AND estado = $%d", argNum)
		args = append(args, estado)
		argNum++
	}

	// Count total
	countQuery := "SELECT COUNT(*) " + baseQuery
	var total int
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("error counting visitas: %w", err)
	}

	// Get paginated results
	selectQuery := fmt.Sprintf(`
		SELECT id, casa_id, fecha_programada, fecha_realizada, visitante_1_id, visitante_2_id,
		       observaciones, desea_seguir_recibiendo, estado, created_at, updated_at
		%s
		ORDER BY fecha_programada DESC
		LIMIT $%d OFFSET $%d
	`, baseQuery, argNum, argNum+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("error listing visitas: %w", err)
	}
	defer rows.Close()

	var visitas []*models.Visita
	for rows.Next() {
		visita := &models.Visita{}
		err := rows.Scan(
			&visita.ID,
			&visita.CasaID,
			&visita.FechaProgramada,
			&visita.FechaRealizada,
			&visita.Visitante1ID,
			&visita.Visitante2ID,
			&visita.Observaciones,
			&visita.DeseaSeguirRecibiendo,
			&visita.Estado,
			&visita.CreatedAt,
			&visita.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("error scanning visita: %w", err)
		}
		visitas = append(visitas, visita)
	}

	return visitas, total, nil
}

func (r *VisitaRepository) GetByCasaID(ctx context.Context, casaID uuid.UUID) ([]*models.Visita, error) {
	query := `
		SELECT id, casa_id, fecha_programada, fecha_realizada, visitante_1_id, visitante_2_id,
		       observaciones, desea_seguir_recibiendo, estado, created_at, updated_at
		FROM visitas
		WHERE casa_id = $1
		ORDER BY fecha_programada DESC
	`

	rows, err := r.db.Query(ctx, query, casaID)
	if err != nil {
		return nil, fmt.Errorf("error getting visitas by casa: %w", err)
	}
	defer rows.Close()

	var visitas []*models.Visita
	for rows.Next() {
		visita := &models.Visita{}
		err := rows.Scan(
			&visita.ID,
			&visita.CasaID,
			&visita.FechaProgramada,
			&visita.FechaRealizada,
			&visita.Visitante1ID,
			&visita.Visitante2ID,
			&visita.Observaciones,
			&visita.DeseaSeguirRecibiendo,
			&visita.Estado,
			&visita.CreatedAt,
			&visita.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning visita: %w", err)
		}
		visitas = append(visitas, visita)
	}

	return visitas, nil
}

func (r *VisitaRepository) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.Visita, error) {
	// Build dynamic update
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

	query := fmt.Sprintf(`
		UPDATE visitas 
		SET %s
		WHERE id = $%d
		RETURNING id, casa_id, fecha_programada, fecha_realizada, visitante_1_id, visitante_2_id,
		          observaciones, desea_seguir_recibiendo, estado, created_at, updated_at
	`, setClauses, argNum)
	args = append(args, id)

	visita := &models.Visita{}
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&visita.ID,
		&visita.CasaID,
		&visita.FechaProgramada,
		&visita.FechaRealizada,
		&visita.Visitante1ID,
		&visita.Visitante2ID,
		&visita.Observaciones,
		&visita.DeseaSeguirRecibiendo,
		&visita.Estado,
		&visita.CreatedAt,
		&visita.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrVisitaNotFound
		}
		return nil, fmt.Errorf("error updating visita: %w", err)
	}

	return visita, nil
}

func (r *VisitaRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := "DELETE FROM visitas WHERE id = $1"
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("error deleting visita: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrVisitaNotFound
	}

	return nil
}

func (r *VisitaRepository) GetVisitasPorVisitante(ctx context.Context, visitanteID uuid.UUID) ([]*models.Visita, error) {
	query := `
		SELECT id, casa_id, fecha_programada, fecha_realizada, visitante_1_id, visitante_2_id,
		       observaciones, desea_seguir_recibiendo, estado, created_at, updated_at
		FROM visitas
		WHERE visitante_1_id = $1 OR visitante_2_id = $1
		ORDER BY fecha_programada DESC
	`

	rows, err := r.db.Query(ctx, query, visitanteID)
	if err != nil {
		return nil, fmt.Errorf("error getting visitas by visitante: %w", err)
	}
	defer rows.Close()

	var visitas []*models.Visita
	for rows.Next() {
		visita := &models.Visita{}
		err := rows.Scan(
			&visita.ID,
			&visita.CasaID,
			&visita.FechaProgramada,
			&visita.FechaRealizada,
			&visita.Visitante1ID,
			&visita.Visitante2ID,
			&visita.Observaciones,
			&visita.DeseaSeguirRecibiendo,
			&visita.Estado,
			&visita.CreatedAt,
			&visita.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning visita: %w", err)
		}
		visitas = append(visitas, visita)
	}

	return visitas, nil
}
