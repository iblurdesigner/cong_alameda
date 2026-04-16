package repositories

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"cong-alameda-backend/internal/models"
)

var ErrProgramaVisitaNotFound = fmt.Errorf("programa de visita no encontrado")

type ProgramaVisitaRepository struct {
	db *pgxpool.Pool
}

func NewProgramaVisitaRepository(db *pgxpool.Pool) *ProgramaVisitaRepository {
	return &ProgramaVisitaRepository{db: db}
}

func (r *ProgramaVisitaRepository) Create(ctx context.Context, p *models.ProgramaVisita) error {
	query := `
		INSERT INTO programas_visita (
			id, programa_predicacion_id, fecha, dia_semana, conductor, hora,
			lugar_nombre, lugar_direccion, lugar_ciudad, lugar_provincia, lugar_codigo_postal, lugar_pais, lugar_ubicacion,
			lugar_contacto, lugar_telefono,
			grupo_id, observaciones, visited, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
	`
	_, err := r.db.Exec(ctx, query,
		p.ID, p.ProgramaPredicacionID, p.Fecha, p.DiaSemana, p.Conductor, p.Hora,
		p.LugarNombre, p.LugarDireccion, p.LugarCiudad, p.LugarProvincia, p.LugarCodigoPostal, p.LugarPais, p.LugarUbicacion,
		p.LugarContacto, p.LugarTelefono,
		p.GrupoID, p.Observaciones, p.Visited, p.CreatedBy, p.CreatedAt, p.UpdatedAt,
	)
	return err
}

func (r *ProgramaVisitaRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ProgramaVisita, error) {
	// Cast fecha to text to avoid pgx scan issues with date type
	// Use COALESCE to handle NULLs
	query := `
		SELECT id, programa_predicacion_id, fecha::text, dia_semana, conductor, hora,
			COALESCE(lugar_nombre, ''), COALESCE(lugar_direccion, ''), COALESCE(lugar_ciudad, ''), COALESCE(lugar_provincia, ''), COALESCE(lugar_codigo_postal, ''), COALESCE(lugar_pais, ''), COALESCE(lugar_ubicacion, ''),
			COALESCE(lugar_contacto, ''), COALESCE(lugar_telefono, ''),
			grupo_id, observaciones, visited, created_by, created_at, updated_at
		FROM programas_visita
		WHERE id = $1
	`
	p := &models.ProgramaVisita{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.ProgramaPredicacionID, &p.Fecha, &p.DiaSemana, &p.Conductor, &p.Hora,
		&p.LugarNombre, &p.LugarDireccion, &p.LugarCiudad, &p.LugarProvincia, &p.LugarCodigoPostal, &p.LugarPais, &p.LugarUbicacion,
		&p.LugarContacto, &p.LugarTelefono,
		&p.GrupoID, &p.Observaciones, &p.Visited, &p.CreatedBy, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, ErrProgramaVisitaNotFound
	}
	return p, nil
}

func (r *ProgramaVisitaRepository) GetAll(ctx context.Context) ([]*models.ProgramaVisita, error) {
	log.Printf("=== ProgramaVisitaRepo.GetAll called ===")
	// Cast fecha to text to avoid pgx scan issues with date type
	// Use COALESCE to handle NULLs
	query := `
		SELECT id, programa_predicacion_id, fecha::text, dia_semana, conductor, hora,
			COALESCE(lugar_nombre, ''), COALESCE(lugar_direccion, ''), COALESCE(lugar_ciudad, ''), COALESCE(lugar_provincia, ''), COALESCE(lugar_codigo_postal, ''), COALESCE(lugar_pais, ''),
			COALESCE(lugar_contacto, ''), COALESCE(lugar_telefono, ''),
			grupo_id, observaciones, visited, created_by, created_at, updated_at
		FROM programas_visita
		ORDER BY fecha DESC, dia_semana ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		log.Printf("ERROR: Query failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var programas []*models.ProgramaVisita
	for rows.Next() {
		p := &models.ProgramaVisita{}
		err := rows.Scan(
			&p.ID, &p.ProgramaPredicacionID, &p.Fecha, &p.DiaSemana, &p.Conductor, &p.Hora,
			&p.LugarNombre, &p.LugarDireccion, &p.LugarCiudad, &p.LugarProvincia, &p.LugarCodigoPostal, &p.LugarPais,
			&p.LugarContacto, &p.LugarTelefono,
			&p.GrupoID, &p.Observaciones, &p.Visited, &p.CreatedBy, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			log.Printf("ERROR: Scan failed: %v", err)
			return nil, err
		}
		programas = append(programas, p)
	}
	log.Printf("=== Repo GetAll returned %d programas ===", len(programas))
	return programas, nil
}

func (r *ProgramaVisitaRepository) GetByFecha(ctx context.Context, fecha string) ([]*models.ProgramaVisita, error) {
	// Cast fecha to text to avoid pgx scan issues with date type
	// Use COALESCE to handle NULLs
	query := `
		SELECT id, programa_predicacion_id, fecha::text, dia_semana, conductor, hora,
			COALESCE(lugar_nombre, ''), COALESCE(lugar_direccion, ''), COALESCE(lugar_ciudad, ''), COALESCE(lugar_provincia, ''), COALESCE(lugar_codigo_postal, ''), COALESCE(lugar_pais, ''), COALESCE(lugar_ubicacion, ''),
			COALESCE(lugar_contacto, ''), COALESCE(lugar_telefono, ''),
			grupo_id, observaciones, visited, created_by, created_at, updated_at
		FROM programas_visita
		WHERE fecha = $1
		ORDER BY dia_semana ASC
	`
	rows, err := r.db.Query(ctx, query, fecha)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var programas []*models.ProgramaVisita
	for rows.Next() {
		p := &models.ProgramaVisita{}
		err := rows.Scan(
			&p.ID, &p.ProgramaPredicacionID, &p.Fecha, &p.DiaSemana, &p.Conductor, &p.Hora,
			&p.LugarNombre, &p.LugarDireccion, &p.LugarCiudad, &p.LugarProvincia, &p.LugarCodigoPostal, &p.LugarPais, &p.LugarUbicacion,
			&p.LugarContacto, &p.LugarTelefono,
			&p.GrupoID, &p.Observaciones, &p.Visited, &p.CreatedBy, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		programas = append(programas, p)
	}
	return programas, nil
}

func (r *ProgramaVisitaRepository) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.ProgramaVisita, error) {
	log.Printf("=== REPO Update called ===")
	log.Printf("Updates: %+v", updates)

	if len(updates) == 0 {
		log.Printf("WARNING: No fields to update, returning current record")
		return r.GetByID(ctx, id)
	}

	query := "UPDATE programas_visita SET "
	var args []interface{}
	argNum := 1

	for key, value := range updates {
		query += fmt.Sprintf("%s = $%d, ", key, argNum)
		args = append(args, value)
		argNum++
	}
	// Use the current argNum for the id parameter (e.g., $5)
	query += fmt.Sprintf("updated_at = NOW() WHERE id = $%d", argNum)
	args = append(args, id)

	log.Printf("DEBUG: Query: %s", query)
	log.Printf("DEBUG: Args: %+v", args)

	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		log.Printf("ERROR: Exec failed: %v", err)
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *ProgramaVisitaRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM programas_visita WHERE id = $1", id)
	return err
}

// SetTerritorios replaces all territorios for a programa de visita
func (r *ProgramaVisitaRepository) SetTerritorios(ctx context.Context, ProgramaID uuid.UUID, territorioIDs []uuid.UUID) error {
	// Delete existing
	_, err := r.db.Exec(ctx, "DELETE FROM programa_visita_territorios WHERE programa_visita_id = $1", ProgramaID)
	if err != nil {
		return err
	}

	// Insert new
	for i, tid := range territorioIDs {
		_, err := r.db.Exec(ctx, `
			INSERT INTO programa_visita_territorios (programa_visita_id, territorio_id, orden)
			VALUES ($1, $2, $3)
		`, ProgramaID, tid, i)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetTerritorios returns all territorios for a programa de visita
func (r *ProgramaVisitaRepository) GetTerritorios(ctx context.Context, programaID uuid.UUID) ([]*models.Territorio, error) {
	query := `
		SELECT t.id, t.grupo_id, t.nombre, t.archivo_pdf, t.nombre_original, t.tamano, t.subido_por, t.created_at, t.updated_at
		FROM territorios t
		JOIN programa_visita_territorios pvt ON t.id = pvt.territorio_id
		WHERE pvt.programa_visita_id = $1
		ORDER BY pvt.orden ASC
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
