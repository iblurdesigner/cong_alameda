package repositories

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"cong-alameda-backend/internal/models"
)

var ErrCasaNotFound = errors.New("casa no encontrada")

type CasaRepository struct {
	db *pgxpool.Pool
}

func NewCasaRepository(db *pgxpool.Pool) *CasaRepository {
	return &CasaRepository{db: db}
}

func (r *CasaRepository) Create(ctx context.Context, casa *models.Casa) error {
	query := `
		INSERT INTO casas (id, calle_principal, numeracion, calle_secundaria, sector, referencia, motivo_no_volver, fecha_registro, persona_registra, estado)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING created_at, updated_at
	`

	casa.ID = uuid.New()
	// Convert enum to plain string to avoid String() method being called by driver
	estadoStr := string(casa.Estado)
	err := r.db.QueryRow(ctx, query,
		casa.ID,
		casa.CallePrincipal,
		casa.Numeracion,
		casa.CalleSecundaria,
		casa.Sector,
		casa.Referencia,
		casa.MotivoNoVolver,
		casa.FechaRegistro,
		casa.PersonaRegistra,
		estadoStr,
	).Scan(&casa.CreatedAt, &casa.UpdatedAt)

	if err != nil {
		return fmt.Errorf("error creating casa: %w", err)
	}

	return nil
}

func (r *CasaRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Casa, error) {
	query := `
		SELECT id, calle_principal, numeracion, calle_secundaria, sector, referencia, 
		       motivo_no_volver, fecha_registro, persona_registra, estado, created_at, updated_at
		FROM casas
		WHERE id = $1
	`

	casa := &models.Casa{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&casa.ID,
		&casa.CallePrincipal,
		&casa.Numeracion,
		&casa.CalleSecundaria,
		&casa.Sector,
		&casa.Referencia,
		&casa.MotivoNoVolver,
		&casa.FechaRegistro,
		&casa.PersonaRegistra,
		&casa.Estado,
		&casa.CreatedAt,
		&casa.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrCasaNotFound
		}
		return nil, fmt.Errorf("error getting casa: %w", err)
	}

	return casa, nil
}

func (r *CasaRepository) List(ctx context.Context, sector, estado, search string, page, limit int) ([]*models.Casa, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	// Build query with filters
	baseQuery := "FROM casas WHERE 1=1"
	args := []interface{}{}
	argNum := 1

	if sector != "" {
		baseQuery += fmt.Sprintf(" AND sector = $%d", argNum)
		args = append(args, sector)
		argNum++
	}

	if estado != "" {
		baseQuery += fmt.Sprintf(" AND estado = $%d", argNum)
		args = append(args, estado)
		argNum++
	}

	if search != "" {
		baseQuery += fmt.Sprintf(" AND (calle_principal ILIKE $%d OR numeracion ILIKE $%d OR sector ILIKE $%d)", argNum, argNum+1, argNum+2)
		searchPattern := "%" + search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern)
		argNum += 3
	}

	// Count total
	countQuery := "SELECT COUNT(*) " + baseQuery
	var total int
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("error counting casas: %w", err)
	}

	// Get paginated results
	selectQuery := fmt.Sprintf(`
		SELECT id, calle_principal, numeracion, calle_secundaria, sector, referencia, 
		       motivo_no_volver, fecha_registro, persona_registra, estado, created_at, updated_at
		%s
		ORDER BY fecha_registro DESC
		LIMIT $%d OFFSET $%d
	`, baseQuery, argNum, argNum+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("error listing casas: %w", err)
	}
	defer rows.Close()

	var casas []*models.Casa
	for rows.Next() {
		casa := &models.Casa{}
		err := rows.Scan(
			&casa.ID,
			&casa.CallePrincipal,
			&casa.Numeracion,
			&casa.CalleSecundaria,
			&casa.Sector,
			&casa.Referencia,
			&casa.MotivoNoVolver,
			&casa.FechaRegistro,
			&casa.PersonaRegistra,
			&casa.Estado,
			&casa.CreatedAt,
			&casa.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("error scanning casa: %w", err)
		}
		casas = append(casas, casa)
	}

	return casas, total, nil
}

func (r *CasaRepository) Update(ctx context.Context, id uuid.UUID, casa *models.Casa) (*models.Casa, error) {
	// Convert enum to plain string to avoid String() method being called by driver
	estadoStr := string(casa.Estado)

	query := `
		UPDATE casas 
		SET calle_principal = $1, numeracion = $2, calle_secundaria = $3, sector = $4, 
		    referencia = $5, motivo_no_volver = $6, estado = $7
		WHERE id = $8
		RETURNING created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		casa.CallePrincipal,
		casa.Numeracion,
		casa.CalleSecundaria,
		casa.Sector,
		casa.Referencia,
		casa.MotivoNoVolver,
		estadoStr,
		id,
	).Scan(&casa.CreatedAt, &casa.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrCasaNotFound
		}
		return nil, fmt.Errorf("error updating casa: %w", err)
	}

	casa.ID = id
	return casa, nil
}

func (r *CasaRepository) UpdateEstado(ctx context.Context, id uuid.UUID, estado models.CasaEstado) error {
	query := `UPDATE casas SET estado = $1 WHERE id = $2`
	result, err := r.db.Exec(ctx, query, estado, id)
	if err != nil {
		return fmt.Errorf("error updating casa estado: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrCasaNotFound
	}

	return nil
}

func (r *CasaRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := "DELETE FROM casas WHERE id = $1"
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("error deleting casa: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrCasaNotFound
	}

	return nil
}

func (r *CasaRepository) GetSectores(ctx context.Context) ([]string, error) {
	query := "SELECT DISTINCT sector FROM casas ORDER BY sector ASC"
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error getting sectores: %w", err)
	}
	defer rows.Close()

	var sectores []string
	for rows.Next() {
		var sector string
		if err := rows.Scan(&sector); err != nil {
			return nil, fmt.Errorf("error scanning sector: %w", err)
		}
		sectores = append(sectores, sector)
	}

	return sectores, nil
}

// CheckDuplicateAddress checks if a similar address already exists
func (r *CasaRepository) CheckDuplicateAddress(ctx context.Context, callePrincipal, numeracion string) (bool, error) {
	query := `
		SELECT COUNT(*) FROM casas 
		WHERE LOWER(calle_principal) = LOWER($1) AND numeracion = $2
	`
	var count int
	err := r.db.QueryRow(ctx, query, callePrincipal, numeracion).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("error checking duplicate: %w", err)
	}

	return count > 0, nil
}

// Helper to build dynamic update
func BuildUpdateQuery(table string, idColumn string, id interface{}, updates map[string]interface{}) (string, []interface{}, error) {
	if len(updates) == 0 {
		return "", nil, errors.New("no updates provided")
	}

	var setClauses []string
	var args []interface{}
	argNum := 1

	for col, val := range updates {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", col, argNum))
		args = append(args, val)
		argNum++
	}

	args = append(args, id)
	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE %s = $%d",
		table,
		strings.Join(setClauses, ", "),
		idColumn,
		argNum,
	)

	return query, args, nil
}
