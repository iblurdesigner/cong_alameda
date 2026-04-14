package repositories

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"cong-alameda-backend/internal/models"
)

var ErrProgramaPredicacionNotFound = fmt.Errorf("programa de prédicación no encontrado")

type ProgramaPredicacionRepository struct {
	db *pgxpool.Pool
}

func NewProgramaPredicacionRepository(db *pgxpool.Pool) *ProgramaPredicacionRepository {
	return &ProgramaPredicacionRepository{db: db}
}

func (r *ProgramaPredicacionRepository) Create(ctx context.Context, p *models.ProgramaPredicacion) error {
	log.Printf("=== REPO Create called ===")
	log.Printf("Nombre='%s', Fecha='%s', DiaSemana=%d", p.Nombre, p.Fecha, p.DiaSemana)
	log.Printf("Conductor='%s', HoraInicio='%s', HoraFin='%s'", p.Conductor, p.HoraInicio, p.HoraFin)
	log.Printf("LugarNombre='%s', GrupoID=%v", p.LugarNombre, p.GrupoID)

	query := `
		INSERT INTO programas_predicacion (
			id, nombre, fecha, dia_semana, conductor, hora_inicio, hora_fin,
			lugar_nombre, lugar_direccion, lugar_contacto, lugar_telefono,
			grupo_id, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`
	_, err := r.db.Exec(ctx, query,
		p.ID, p.Nombre, p.Fecha, p.DiaSemana, p.Conductor, p.HoraInicio, p.HoraFin,
		p.LugarNombre, p.LugarDireccion, p.LugarContacto, p.LugarTelefono,
		p.GrupoID, p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		log.Printf("ERROR: Repo Create failed: %v", err)
	}
	return err
}

func (r *ProgramaPredicacionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ProgramaPredicacion, error) {
	// Cast fecha to text to avoid pgx scan issues with date type
	query := `
		SELECT id, nombre, fecha::text, dia_semana, conductor, hora_inicio, hora_fin,
			lugar_nombre, lugar_direccion, lugar_contacto, lugar_telefono,
			grupo_id, created_at, updated_at
		FROM programas_predicacion
		WHERE id = $1
	`
	p := &models.ProgramaPredicacion{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.Nombre, &p.Fecha, &p.DiaSemana, &p.Conductor, &p.HoraInicio, &p.HoraFin,
		&p.LugarNombre, &p.LugarDireccion, &p.LugarContacto, &p.LugarTelefono,
		&p.GrupoID, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, ErrProgramaPredicacionNotFound
	}
	return p, nil
}

func (r *ProgramaPredicacionRepository) GetAll(ctx context.Context) ([]*models.ProgramaPredicacion, error) {
	// Cast fecha to text to avoid pgx scan issues with date type
	query := `
		SELECT id, nombre, fecha::text, dia_semana, conductor, hora_inicio, hora_fin,
			lugar_nombre, lugar_direccion, lugar_contacto, lugar_telefono,
			grupo_id, created_at, updated_at
		FROM programas_predicacion
		ORDER BY fecha DESC, dia_semana ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var programas []*models.ProgramaPredicacion
	for rows.Next() {
		p := &models.ProgramaPredicacion{}
		err := rows.Scan(
			&p.ID, &p.Nombre, &p.Fecha, &p.DiaSemana, &p.Conductor, &p.HoraInicio, &p.HoraFin,
			&p.LugarNombre, &p.LugarDireccion, &p.LugarContacto, &p.LugarTelefono,
			&p.GrupoID, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		programas = append(programas, p)
	}
	return programas, nil
}

func (r *ProgramaPredicacionRepository) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.ProgramaPredicacion, error) {
	// Build dynamic update query
	query := "UPDATE programas_predicacion SET "
	var args []interface{}
	argNum := 1

	for key, value := range updates {
		query += fmt.Sprintf("%s = $%d, ", key, argNum)
		args = append(args, value)
		argNum++
	}
	query += "updated_at = NOW() WHERE id = $%d"
	args = append(args, id)

	_, err := r.db.Exec(ctx, fmt.Sprintf(query, argNum), args...)
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *ProgramaPredicacionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM programas_predicacion WHERE id = $1", id)
	return err
}

// GetTerritorios returns all territorios associated with a programa
func (r *ProgramaPredicacionRepository) GetTerritorios(ctx context.Context, programaID uuid.UUID) ([]*models.Territorio, error) {
	query := `
		SELECT t.id, t.grupo_id, t.nombre, t.archivo_pdf, t.nombre_original, t.tamano, t.subido_por, t.created_at, t.updated_at
		FROM territorios t
		JOIN programa_predicacion_territorios pt ON t.id = pt.territorio_id
		WHERE pt.programa_predicacion_id = $1
		ORDER BY pt.orden ASC
	`
	rows, err := r.db.Query(ctx, query, programaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var territorios []*models.Territorio
	for rows.Next() {
		t := &models.Territorio{}
		err := rows.Scan(
			&t.ID, &t.GrupoID, &t.Nombre, &t.ArchivoPDF, &t.NombreOriginal,
			&t.Tamano, &t.SubidoPor, &t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		territorios = append(territorios, t)
	}
	return territorios, nil
}

// SetTerritorios replaces all territorios for a programa
func (r *ProgramaPredicacionRepository) SetTerritorios(ctx context.Context, programaID uuid.UUID, territorioIDs []uuid.UUID) error {
	// Delete existing
	_, err := r.db.Exec(ctx, "DELETE FROM programa_predicacion_territorios WHERE programa_predicacion_id = $1", programaID)
	if err != nil {
		return err
	}

	// Insert new
	for i, tid := range territorioIDs {
		_, err := r.db.Exec(ctx, `
			INSERT INTO programa_predicacion_territorios (programa_predicacion_id, territorio_id, orden)
			VALUES ($1, $2, $3)
		`, programaID, tid, i)
		if err != nil {
			return err
		}
	}

	return nil
}

// AddTerritorio adds a territorio to a programa
func (r *ProgramaPredicacionRepository) AddTerritorio(ctx context.Context, programaID, territorioID uuid.UUID, orden int) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO programa_predicacion_territorios (programa_predicacion_id, territorio_id, orden)
		VALUES ($1, $2, $3)
		ON CONFLICT (programa_predicacion_id, territorio_id) DO UPDATE SET orden = $3
	`, programaID, territorioID, orden)
	return err
}

// RemoveTerritorio removes a territorio from a programa
func (r *ProgramaPredicacionRepository) RemoveTerritorio(ctx context.Context, programaID, territorioID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM programa_predicacion_territorios 
		WHERE programa_predicacion_id = $1 AND territorio_id = $2
	`, programaID, territorioID)
	return err
}
