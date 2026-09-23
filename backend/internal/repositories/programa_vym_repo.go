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

var ErrProgramaVyMNotFound = fmt.Errorf("programa de vida y ministerio no encontrado")

type ProgramaVyMRepository struct {
	db *pgxpool.Pool
}

func NewProgramaVyMRepository(db *pgxpool.Pool) *ProgramaVyMRepository {
	return &ProgramaVyMRepository{db: db}
}

func (r *ProgramaVyMRepository) Upsert(ctx context.Context, p *models.ProgramaVyM) (*models.ProgramaVyM, error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	now := time.Now()
	p.UpdatedAt = now
	if p.CreatedAt.IsZero() {
		p.CreatedAt = now
	}

	query := `
		INSERT INTO programa_vym (
			id, semana_id, nombre_congregacion, lectura_semanal,
			presidente, consejero_auxiliar,
			cancion_inicio, hora_cancion_inicio, oracion_inicio, hora_oracion_inicio,
			tesoros_titulo, tesoros_tiempo, tesoros_discursante,
			perlas_tiempo, perlas_discursante,
			lectura_tiempo, lectura_estudiante,
			cancion_medio, cancion_medio_tiempo,
			estudio_conductor, estudio_lector, estudio_tiempo, conclusion_tiempo,
			cancion_fin, cancion_fin_tiempo, oracion_fin,
			seamos_maestros_auditorio, seamos_maestros_auxiliar, vida_cristiana_partes,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4,
			$5, $6,
			$7, $8, $9, $10,
			$11, $12, $13,
			$14, $15,
			$16, $17,
			$18, $19,
			$20, $21, $22, $23,
			$24, $25, $26,
			$27, $28, $29,
			$30, $31
		)
		ON CONFLICT (semana_id) DO UPDATE SET
			nombre_congregacion = EXCLUDED.nombre_congregacion,
			lectura_semanal = EXCLUDED.lectura_semanal,
			presidente = EXCLUDED.presidente,
			consejero_auxiliar = EXCLUDED.consejero_auxiliar,
			cancion_inicio = EXCLUDED.cancion_inicio,
			hora_cancion_inicio = EXCLUDED.hora_cancion_inicio,
			oracion_inicio = EXCLUDED.oracion_inicio,
			hora_oracion_inicio = EXCLUDED.hora_oracion_inicio,
			tesoros_titulo = EXCLUDED.tesoros_titulo,
			tesoros_tiempo = EXCLUDED.tesoros_tiempo,
			tesoros_discursante = EXCLUDED.tesoros_discursante,
			perlas_tiempo = EXCLUDED.perlas_tiempo,
			perlas_discursante = EXCLUDED.perlas_discursante,
			lectura_tiempo = EXCLUDED.lectura_tiempo,
			lectura_estudiante = EXCLUDED.lectura_estudiante,
			cancion_medio = EXCLUDED.cancion_medio,
			cancion_medio_tiempo = EXCLUDED.cancion_medio_tiempo,
			estudio_conductor = EXCLUDED.estudio_conductor,
			estudio_lector = EXCLUDED.estudio_lector,
			estudio_tiempo = EXCLUDED.estudio_tiempo,
			conclusion_tiempo = EXCLUDED.conclusion_tiempo,
			cancion_fin = EXCLUDED.cancion_fin,
			cancion_fin_tiempo = EXCLUDED.cancion_fin_tiempo,
			oracion_fin = EXCLUDED.oracion_fin,
			seamos_maestros_auditorio = EXCLUDED.seamos_maestros_auditorio,
			seamos_maestros_auxiliar = EXCLUDED.seamos_maestros_auxiliar,
			vida_cristiana_partes = EXCLUDED.vida_cristiana_partes,
			updated_at = EXCLUDED.updated_at
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		p.ID, p.SemanaID, p.NombreCongregacion, p.LecturaSemanal,
		p.Presidente, p.ConsejeroAuxiliar,
		p.CancionInicio, p.HoraCancionInicio, p.OracionInicio, p.HoraOracionInicio,
		p.TesorosTitulo, p.TesorosTiempo, p.TesorosDiscursante,
		p.PerlasTiempo, p.PerlasDiscursante,
		p.LecturaTiempo, p.LecturaEstudiante,
		p.CancionMedio, p.CancionMedioTiempo,
		p.EstudioConductor, p.EstudioLector, p.EstudioTiempo, p.ConclusionTiempo,
		p.CancionFin, p.CancionFinTiempo, p.OracionFin,
		p.SeamosMaestrosAuditorio, p.SeamosMaestrosAuxiliar, p.VidaCristianaPartes,
		p.CreatedAt, p.UpdatedAt,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to upsert programa_vym: %w", err)
	}

	return p, nil
}

func (r *ProgramaVyMRepository) GetBySemanaID(ctx context.Context, semanaID uuid.UUID) (*models.ProgramaVyM, error) {
	query := `
		SELECT
			id, semana_id, nombre_congregacion, lectura_semanal,
			presidente, consejero_auxiliar,
			cancion_inicio, hora_cancion_inicio, oracion_inicio, hora_oracion_inicio,
			tesoros_titulo, tesoros_tiempo, tesoros_discursante,
			perlas_tiempo, perlas_discursante,
			lectura_tiempo, lectura_estudiante,
			cancion_medio, cancion_medio_tiempo,
			estudio_conductor, estudio_lector, estudio_tiempo, conclusion_tiempo,
			cancion_fin, cancion_fin_tiempo, oracion_fin,
			seamos_maestros_auditorio, seamos_maestros_auxiliar, vida_cristiana_partes,
			created_at, updated_at
		FROM programa_vym
		WHERE semana_id = $1
	`
	p := &models.ProgramaVyM{}
	err := r.db.QueryRow(ctx, query, semanaID).Scan(
		&p.ID, &p.SemanaID, &p.NombreCongregacion, &p.LecturaSemanal,
		&p.Presidente, &p.ConsejeroAuxiliar,
		&p.CancionInicio, &p.HoraCancionInicio, &p.OracionInicio, &p.HoraOracionInicio,
		&p.TesorosTitulo, &p.TesorosTiempo, &p.TesorosDiscursante,
		&p.PerlasTiempo, &p.PerlasDiscursante,
		&p.LecturaTiempo, &p.LecturaEstudiante,
		&p.CancionMedio, &p.CancionMedioTiempo,
		&p.EstudioConductor, &p.EstudioLector, &p.EstudioTiempo, &p.ConclusionTiempo,
		&p.CancionFin, &p.CancionFinTiempo, &p.OracionFin,
		&p.SeamosMaestrosAuditorio, &p.SeamosMaestrosAuxiliar, &p.VidaCristianaPartes,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrProgramaVyMNotFound
		}
		return nil, fmt.Errorf("failed to get programa_vym by semana_id: %w", err)
	}

	return p, nil
}

func (r *ProgramaVyMRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM programa_vym WHERE id = $1`
	cmdTag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete programa_vym: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return ErrProgramaVyMNotFound
	}
	return nil
}
