package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"cong-alameda-backend/internal/models"
)

var ErrPublicadorVyMNotFound = fmt.Errorf("publicador VyM no encontrado")

const cooldownDays = 42 // 6 semanas

// SyncHistorialItem is an internal struct used by SyncHistorial.
type SyncHistorialItem struct {
	PublicadorVyMID uuid.UUID
	Rol             string // "estudiante" | "ayudante"
	Sala            string // "auditorio" | "auxiliar"
}

type PublicadorVyMRepository struct {
	db *pgxpool.Pool
}

func NewPublicadorVyMRepository(db *pgxpool.Pool) *PublicadorVyMRepository {
	return &PublicadorVyMRepository{db: db}
}

// List returns all publicadores_vym joined with publicadores, ordered by apellidos.
func (r *PublicadorVyMRepository) List(ctx context.Context) ([]*models.PublicadorVyM, error) {
	query := `
		SELECT
			pv.id,
			pv.publicador_id,
			pv.activo,
			pv.notas,
			pv.created_at,
			pv.updated_at,
			p.nombres,
			p.apellidos,
			p.celular
		FROM publicadores_vym pv
		JOIN publicadores p ON p.id = pv.publicador_id
		ORDER BY p.apellidos, p.nombres
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list publicadores_vym: %w", err)
	}
	defer rows.Close()

	var result []*models.PublicadorVyM
	for rows.Next() {
		pv := &models.PublicadorVyM{}
		if err := rows.Scan(
			&pv.ID,
			&pv.PublicadorID,
			&pv.Activo,
			&pv.Notas,
			&pv.CreatedAt,
			&pv.UpdatedAt,
			&pv.Nombres,
			&pv.Apellidos,
			&pv.Celular,
		); err != nil {
			return nil, fmt.Errorf("failed to scan publicador_vym row: %w", err)
		}
		result = append(result, pv)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating publicadores_vym rows: %w", err)
	}

	return result, nil
}

// Add adds a publicador to the VyM list (upsert by publicador_id).
func (r *PublicadorVyMRepository) Add(ctx context.Context, publicadorID uuid.UUID, notas string) (*models.PublicadorVyM, error) {
	query := `
		INSERT INTO publicadores_vym (publicador_id, notas)
		VALUES ($1, NULLIF($2, ''))
		ON CONFLICT (publicador_id) DO UPDATE
			SET notas = EXCLUDED.notas,
			    activo = true,
			    updated_at = CURRENT_TIMESTAMP
		RETURNING id, publicador_id, activo, notas, created_at, updated_at
	`

	pv := &models.PublicadorVyM{}
	err := r.db.QueryRow(ctx, query, publicadorID, notas).Scan(
		&pv.ID,
		&pv.PublicadorID,
		&pv.Activo,
		&pv.Notas,
		&pv.CreatedAt,
		&pv.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to add publicador_vym: %w", err)
	}

	// Fetch join fields
	if err := r.db.QueryRow(ctx,
		`SELECT nombres, apellidos, celular FROM publicadores WHERE id = $1`,
		pv.PublicadorID,
	).Scan(&pv.Nombres, &pv.Apellidos, &pv.Celular); err != nil {
		return nil, fmt.Errorf("failed to fetch publicador join data: %w", err)
	}

	return pv, nil
}

// Update updates the activo/notas fields of a publicador_vym record.
func (r *PublicadorVyMRepository) Update(ctx context.Context, id uuid.UUID, activo bool, notas string) (*models.PublicadorVyM, error) {
	query := `
		UPDATE publicadores_vym
		SET activo = $1, notas = NULLIF($2, ''), updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
		RETURNING id, publicador_id, activo, notas, created_at, updated_at
	`

	pv := &models.PublicadorVyM{}
	err := r.db.QueryRow(ctx, query, activo, notas, id).Scan(
		&pv.ID,
		&pv.PublicadorID,
		&pv.Activo,
		&pv.Notas,
		&pv.CreatedAt,
		&pv.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrPublicadorVyMNotFound
		}
		return nil, fmt.Errorf("failed to update publicador_vym: %w", err)
	}

	// Fetch join fields
	if err := r.db.QueryRow(ctx,
		`SELECT nombres, apellidos, celular FROM publicadores WHERE id = $1`,
		pv.PublicadorID,
	).Scan(&pv.Nombres, &pv.Apellidos, &pv.Celular); err != nil {
		return nil, fmt.Errorf("failed to fetch publicador join data: %w", err)
	}

	return pv, nil
}

// Delete removes a publicador_vym record by ID.
func (r *PublicadorVyMRepository) Delete(ctx context.Context, id uuid.UUID) error {
	cmdTag, err := r.db.Exec(ctx, `DELETE FROM publicadores_vym WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete publicador_vym: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return ErrPublicadorVyMNotFound
	}
	return nil
}

// GetDisponibilidad calculates availability for all active VyM publishers.
// A publisher is available if their last assignment as "estudiante" was >= 6 weeks (42 days) ago
// relative to fechaReferencia. If fechaReferencia is zero, NOW() is used.
func (r *PublicadorVyMRepository) GetDisponibilidad(ctx context.Context, fechaReferencia time.Time) ([]*models.DisponibilidadVyM, error) {
	if fechaReferencia.IsZero() {
		fechaReferencia = time.Now()
	}

	query := `
		SELECT
			pv.id,
			pv.publicador_id,
			p.nombres,
			p.apellidos,
			p.celular,
			pv.activo,
			h.fecha_semana AS ultima_asignacion
		FROM publicadores_vym pv
		JOIN publicadores p ON p.id = pv.publicador_id
		LEFT JOIN LATERAL (
			SELECT fecha_semana
			FROM historial_seamos_maestros
			WHERE publicador_vym_id = pv.id AND rol = 'estudiante'
			ORDER BY fecha_semana DESC
			LIMIT 1
		) h ON true
		WHERE pv.activo = true
		ORDER BY p.apellidos, p.nombres
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query disponibilidad: %w", err)
	}
	defer rows.Close()

	var result []*models.DisponibilidadVyM
	for rows.Next() {
		d := &models.DisponibilidadVyM{}
		if err := rows.Scan(
			&d.PublicadorVyMID,
			&d.PublicadorID,
			&d.Nombres,
			&d.Apellidos,
			&d.Celular,
			&d.Activo,
			&d.UltimaAsignacion,
		); err != nil {
			return nil, fmt.Errorf("failed to scan disponibilidad row: %w", err)
		}

		if d.UltimaAsignacion != nil {
			diff := fechaReferencia.Sub(*d.UltimaAsignacion)
			diasTranscurridos := int(diff.Hours() / 24)
			d.SemanasCooldown = diasTranscurridos / 7
			d.Disponible = diasTranscurridos >= cooldownDays
			if !d.Disponible {
				fechaDisp := d.UltimaAsignacion.AddDate(0, 0, cooldownDays)
				d.FechaDisponible = &fechaDisp
			}
		} else {
			// Never assigned — always available
			d.SemanasCooldown = 0
			d.Disponible = true
		}

		result = append(result, d)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating disponibilidad rows: %w", err)
	}

	return result, nil
}

// SyncHistorial records the assignments for a saved VyM program.
// It does an UPSERT into historial_seamos_maestros for each item with a valid publicador_vym_id.
func (r *PublicadorVyMRepository) SyncHistorial(ctx context.Context, semanaID uuid.UUID, fechaSemana time.Time, items []SyncHistorialItem) error {
	query := `
		INSERT INTO historial_seamos_maestros (publicador_vym_id, semana_id, fecha_semana, rol, sala)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (publicador_vym_id, semana_id, rol, sala) DO UPDATE
			SET fecha_semana = EXCLUDED.fecha_semana
	`

	for _, item := range items {
		if item.PublicadorVyMID == uuid.Nil {
			continue
		}
		if _, err := r.db.Exec(ctx, query,
			item.PublicadorVyMID,
			semanaID,
			fechaSemana,
			item.Rol,
			item.Sala,
		); err != nil {
			return fmt.Errorf("failed to sync historial for publicador_vym_id %s: %w", item.PublicadorVyMID, err)
		}
	}

	return nil
}
