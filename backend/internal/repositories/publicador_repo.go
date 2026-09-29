package repositories

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"cong-alameda-backend/internal/models"
)

var (
	ErrPublicadorNotFound = errors.New("publicador no encontrado")
)

type PublicadorRepository struct {
	db *pgxpool.Pool
}

func NewPublicadorRepository(db *pgxpool.Pool) *PublicadorRepository {
	return &PublicadorRepository{db: db}
}

func (r *PublicadorRepository) Create(ctx context.Context, p *models.Publicador) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	now := time.Now()
	p.CreatedAt = now
	p.UpdatedAt = now

	query := `
		INSERT INTO publicadores (
			id, nombres, apellidos, celular, telefono, email, domicilio, grupo_id,
			contacto_emergencia_nombre, contacto_emergencia_telefono, contacto_emergencia_parentesco,
			observaciones, activo, user_id, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11,
			$12, $13, $14, $15, $16
		)
		RETURNING created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		p.ID,
		p.Nombres,
		p.Apellidos,
		p.Celular,
		p.Telefono,
		p.Email,
		p.Domicilio,
		p.GrupoID,
		p.ContactoEmergenciaNombre,
		p.ContactoEmergenciaTelefono,
		p.ContactoEmergenciaParentesco,
		p.Observaciones,
		p.Activo,
		p.UserID,
		p.CreatedAt,
		p.UpdatedAt,
	).Scan(&p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		return fmt.Errorf("error creating publicador: %w", err)
	}

	return nil
}

func (r *PublicadorRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Publicador, error) {
	query := `
		SELECT 
			p.id, p.nombres, p.apellidos, p.celular, p.telefono, p.email, p.domicilio, p.grupo_id,
			p.contacto_emergencia_nombre, p.contacto_emergencia_telefono, p.contacto_emergencia_parentesco,
			p.observaciones, p.activo, p.user_id, p.created_at, p.updated_at,
			g.numero AS grupo_numero, g.nombre AS grupo_nombre
		FROM publicadores p
		LEFT JOIN grupos g ON g.id = p.grupo_id
		WHERE p.id = $1
	`

	p := &models.Publicador{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID,
		&p.Nombres,
		&p.Apellidos,
		&p.Celular,
		&p.Telefono,
		&p.Email,
		&p.Domicilio,
		&p.GrupoID,
		&p.ContactoEmergenciaNombre,
		&p.ContactoEmergenciaTelefono,
		&p.ContactoEmergenciaParentesco,
		&p.Observaciones,
		&p.Activo,
		&p.UserID,
		&p.CreatedAt,
		&p.UpdatedAt,
		&p.GrupoNumero,
		&p.GrupoNombre,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPublicadorNotFound
		}
		return nil, fmt.Errorf("error getting publicador by id: %w", err)
	}

	return p, nil
}

func (r *PublicadorRepository) List(ctx context.Context, search string, grupoID *uuid.UUID, activoOnly bool) ([]*models.Publicador, error) {
	var conditions []string
	var args []interface{}
	argNum := 1

	if activoOnly {
		conditions = append(conditions, fmt.Sprintf("p.activo = $%d", argNum))
		args = append(args, true)
		argNum++
	}

	if grupoID != nil {
		conditions = append(conditions, fmt.Sprintf("p.grupo_id = $%d", argNum))
		args = append(args, *grupoID)
		argNum++
	}

	if strings.TrimSpace(search) != "" {
		likeTerm := "%" + strings.TrimSpace(search) + "%"
		conditions = append(conditions, fmt.Sprintf("(p.nombres ILIKE $%d OR p.apellidos ILIKE $%d OR p.celular ILIKE $%d OR p.telefono ILIKE $%d OR p.email ILIKE $%d OR p.contacto_emergencia_nombre ILIKE $%d)", argNum, argNum, argNum, argNum, argNum, argNum))
		args = append(args, likeTerm)
		argNum++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	query := fmt.Sprintf(`
		SELECT 
			p.id, p.nombres, p.apellidos, p.celular, p.telefono, p.email, p.domicilio, p.grupo_id,
			p.contacto_emergencia_nombre, p.contacto_emergencia_telefono, p.contacto_emergencia_parentesco,
			p.observaciones, p.activo, p.user_id, p.created_at, p.updated_at,
			g.numero AS grupo_numero, g.nombre AS grupo_nombre
		FROM publicadores p
		LEFT JOIN grupos g ON g.id = p.grupo_id
		%s
		ORDER BY p.apellidos ASC, p.nombres ASC
	`, whereClause)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error listing publicadores: %w", err)
	}
	defer rows.Close()

	var publicadores []*models.Publicador
	for rows.Next() {
		p := &models.Publicador{}
		err := rows.Scan(
			&p.ID,
			&p.Nombres,
			&p.Apellidos,
			&p.Celular,
			&p.Telefono,
			&p.Email,
			&p.Domicilio,
			&p.GrupoID,
			&p.ContactoEmergenciaNombre,
			&p.ContactoEmergenciaTelefono,
			&p.ContactoEmergenciaParentesco,
			&p.Observaciones,
			&p.Activo,
			&p.UserID,
			&p.CreatedAt,
			&p.UpdatedAt,
			&p.GrupoNumero,
			&p.GrupoNombre,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning publicador: %w", err)
		}
		publicadores = append(publicadores, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating publicadores rows: %w", err)
	}

	return publicadores, nil
}

func (r *PublicadorRepository) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.Publicador, error) {
	if len(updates) == 0 {
		return r.GetByID(ctx, id)
	}

	updates["updated_at"] = time.Now()

	var setClauses []string
	var args []interface{}
	argNum := 1

	for key, value := range updates {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", key, argNum))
		args = append(args, value)
		argNum++
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE publicadores
		SET %s
		WHERE id = $%d
	`, strings.Join(setClauses, ", "), argNum)

	cmdTag, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error updating publicador: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return nil, ErrPublicadorNotFound
	}

	return r.GetByID(ctx, id)
}

func (r *PublicadorRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM publicadores WHERE id = $1`
	cmdTag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("error deleting publicador: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return ErrPublicadorNotFound
	}

	return nil
}
