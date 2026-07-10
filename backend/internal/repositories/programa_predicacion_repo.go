package repositories

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"cong-alameda-backend/internal/models"
)

var ErrProgramaPredicacionNotFound = errors.New("programa de predicación no encontrado")

// ProgramaPredicacionRepository handles database operations for programas_predicacion.
type ProgramaPredicacionRepository struct {
	db *pgxpool.Pool
}

// NewProgramaPredicacionRepository creates a new ProgramaPredicacionRepository.
func NewProgramaPredicacionRepository(db *pgxpool.Pool) *ProgramaPredicacionRepository {
	return &ProgramaPredicacionRepository{db: db}
}

// Create inserts a new preaching program into the database.
func (r *ProgramaPredicacionRepository) Create(ctx context.Context, programa *models.ProgramaPredicacion) error {
	query := `
		INSERT INTO programas_predicacion (
			id, nombre, fecha, dia_semana, dia_semana_nombre, conductor,
			hora_inicio, hora_fin,
			lugar_nombre, lugar_direccion, lugar_ciudad, lugar_provincia,
			lugar_codigo_postal, lugar_pais, lugar_ubicacion,
			lugar_contacto, lugar_telefono, grupo_id
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8,
			$9, $10, $11, $12,
			$13, $14, $15,
			$16, $17, $18
		) RETURNING created_at, updated_at
	`
	programa.ID = uuid.New()
	return r.db.QueryRow(ctx, query,
		programa.ID,
		programa.Nombre,
		programa.Fecha,
		programa.DiaSemana,
		programa.DiaSemanaNombre,
		programa.Conductor,
		programa.HoraInicio,
		programa.HoraFin,
		programa.LugarNombre,
		programa.LugarDireccion,
		programa.LugarCiudad,
		programa.LugarProvincia,
		programa.LugarCodigoPostal,
		programa.LugarPais,
		programa.LugarUbicacion,
		programa.LugarContacto,
		programa.LugarTelefono,
		programa.GrupoID,
	).Scan(&programa.CreatedAt, &programa.UpdatedAt)
}

// GetByID retrieves a preaching program by its ID.
func (r *ProgramaPredicacionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ProgramaPredicacion, error) {
	query := `
		SELECT id, nombre, fecha, dia_semana, dia_semana_nombre, conductor,
		       hora_inicio, hora_fin,
		       lugar_nombre, lugar_direccion, lugar_ciudad, lugar_provincia,
		       lugar_codigo_postal, lugar_pais, lugar_ubicacion,
		       lugar_contacto, lugar_telefono, grupo_id,
		       created_at, updated_at
		FROM programas_predicacion
		WHERE id = $1
	`
	p := &models.ProgramaPredicacion{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.Nombre, &p.Fecha, &p.DiaSemana, &p.DiaSemanaNombre, &p.Conductor,
		&p.HoraInicio, &p.HoraFin,
		&p.LugarNombre, &p.LugarDireccion, &p.LugarCiudad, &p.LugarProvincia,
		&p.LugarCodigoPostal, &p.LugarPais, &p.LugarUbicacion,
		&p.LugarContacto, &p.LugarTelefono, &p.GrupoID,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProgramaPredicacionNotFound
		}
		return nil, err
	}
	return p, nil
}

// List retrieves all preaching programs ordered by fecha DESC.
func (r *ProgramaPredicacionRepository) List(ctx context.Context) ([]*models.ProgramaPredicacion, error) {
	query := `
		SELECT id, nombre, fecha, dia_semana, dia_semana_nombre, conductor,
		       hora_inicio, hora_fin,
		       lugar_nombre, lugar_direccion, lugar_ciudad, lugar_provincia,
		       lugar_codigo_postal, lugar_pais, lugar_ubicacion,
		       lugar_contacto, lugar_telefono, grupo_id,
		       created_at, updated_at
		FROM programas_predicacion
		ORDER BY fecha DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var programas []*models.ProgramaPredicacion
	for rows.Next() {
		p := &models.ProgramaPredicacion{}
		if err := rows.Scan(
			&p.ID, &p.Nombre, &p.Fecha, &p.DiaSemana, &p.DiaSemanaNombre, &p.Conductor,
			&p.HoraInicio, &p.HoraFin,
			&p.LugarNombre, &p.LugarDireccion, &p.LugarCiudad, &p.LugarProvincia,
			&p.LugarCodigoPostal, &p.LugarPais, &p.LugarUbicacion,
			&p.LugarContacto, &p.LugarTelefono, &p.GrupoID,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		programas = append(programas, p)
	}
	return programas, nil
}

// Update updates an existing preaching program and returns the updated row.
func (r *ProgramaPredicacionRepository) Update(ctx context.Context, id uuid.UUID, programa *models.ProgramaPredicacion) error {
	query := `
		UPDATE programas_predicacion
		SET nombre = $2, fecha = $3, dia_semana = $4, dia_semana_nombre = $5,
		    conductor = $6, hora_inicio = $7, hora_fin = $8,
		    lugar_nombre = $9, lugar_direccion = $10, lugar_ciudad = $11,
		    lugar_provincia = $12, lugar_codigo_postal = $13, lugar_pais = $14,
		    lugar_ubicacion = $15, lugar_contacto = $16, lugar_telefono = $17,
		    grupo_id = $18
		WHERE id = $1
		RETURNING created_at, updated_at
	`
	return r.db.QueryRow(ctx, query,
		id,
		programa.Nombre,
		programa.Fecha,
		programa.DiaSemana,
		programa.DiaSemanaNombre,
		programa.Conductor,
		programa.HoraInicio,
		programa.HoraFin,
		programa.LugarNombre,
		programa.LugarDireccion,
		programa.LugarCiudad,
		programa.LugarProvincia,
		programa.LugarCodigoPostal,
		programa.LugarPais,
		programa.LugarUbicacion,
		programa.LugarContacto,
		programa.LugarTelefono,
		programa.GrupoID,
	).Scan(&programa.CreatedAt, &programa.UpdatedAt)
}

// Delete removes a preaching program by ID. Join-table rows cascade-delete.
func (r *ProgramaPredicacionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM programas_predicacion WHERE id = $1`, id)
	return err
}

// SyncTerritorios atomically replaces the territorio assignments for a program.
// It deletes all existing rows and inserts the new ones in a transaction.
func (r *ProgramaPredicacionRepository) SyncTerritorios(ctx context.Context, programaID uuid.UUID, territorioIDs []uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM programa_predicacion_territorios WHERE programa_predicacion_id = $1`, programaID); err != nil {
		return err
	}

	for _, tid := range territorioIDs {
		if _, err := tx.Exec(ctx,
			`INSERT INTO programa_predicacion_territorios (programa_predicacion_id, territorio_id) VALUES ($1, $2)`,
			programaID, tid,
		); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// GetTerritoriosByProgramaID returns the territorio IDs assigned to a program.
func (r *ProgramaPredicacionRepository) GetTerritoriosByProgramaID(ctx context.Context, programaID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := r.db.Query(ctx,
		`SELECT territorio_id FROM programa_predicacion_territorios WHERE programa_predicacion_id = $1 ORDER BY created_at`,
		programaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

// ExistsByFechaHora checks whether a program exists with the given fecha and hora_inicio.
// excludeID, if non-nil, excludes that program ID from the check (used for updates).
func (r *ProgramaPredicacionRepository) ExistsByFechaHora(ctx context.Context, fecha string, horaInicio string, excludeID *uuid.UUID) (bool, error) {
	var exists bool
	var err error

	if excludeID != nil {
		err = r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM programas_predicacion WHERE fecha = $1 AND hora_inicio = $2 AND id != $3)`,
			fecha, horaInicio, *excludeID,
		).Scan(&exists)
	} else {
		err = r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM programas_predicacion WHERE fecha = $1 AND hora_inicio = $2)`,
			fecha, horaInicio,
		).Scan(&exists)
	}

	return exists, err
}
