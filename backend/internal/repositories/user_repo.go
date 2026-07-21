package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"cong-alameda-backend/internal/models"
)

var (
	ErrUserNotFound    = errors.New("usuario no encontrado")
	ErrUserEmailExists = errors.New("email ya registrado")
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (id, nombre, telefono, email, password, rol, activo)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at, updated_at
	`

	user.ID = uuid.New()
	err := r.db.QueryRow(ctx, query,
		user.ID,
		user.Nombre,
		user.Telefono,
		user.Email,
		user.Password,
		user.Rol,
		user.Activo,
	).Scan(&user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if isUniqueViolation(err) {
			return ErrUserEmailExists
		}
		return fmt.Errorf("error creating user: %w", err)
	}

	return nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, nombre, telefono, telefono_validado, email, password, rol, activo,
		       notificaciones_email, notificaciones_whatsapp, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	user := &models.User{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Nombre,
		&user.Telefono,
		&user.TelefonoValidado,
		&user.Email,
		&user.Password,
		&user.Rol,
		&user.Activo,
		&user.NotificacionesEmail,
		&user.NotificacionesWhatsapp,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("error getting user: %w", err)
	}

	return user, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, nombre, telefono, telefono_validado, email, password, rol, activo,
		       notificaciones_email, notificaciones_whatsapp, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	user := &models.User{}
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Nombre,
		&user.Telefono,
		&user.TelefonoValidado,
		&user.Email,
		&user.Password,
		&user.Rol,
		&user.Activo,
		&user.NotificacionesEmail,
		&user.NotificacionesWhatsapp,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("error getting user by email: %w", err)
	}

	return user, nil
}

func (r *UserRepository) List(ctx context.Context, rol *models.Rol, activo *bool) ([]*models.User, error) {
	query := `
		SELECT id, nombre, telefono, telefono_validado, email, password, rol, activo,
		       notificaciones_email, notificaciones_whatsapp, created_at, updated_at
		FROM users
		WHERE 1=1
	`
	args := []interface{}{}
	argNum := 1

	if rol != nil {
		query += fmt.Sprintf(" AND rol = $%d", argNum)
		args = append(args, *rol)
		argNum++
	}

	if activo != nil {
		query += fmt.Sprintf(" AND activo = $%d", argNum)
		args = append(args, *activo)
		argNum++
	}

	query += " ORDER BY nombre ASC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error listing users: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Nombre,
			&user.Telefono,
			&user.TelefonoValidado,
			&user.Email,
			&user.Password,
			&user.Rol,
			&user.Activo,
			&user.NotificacionesEmail,
			&user.NotificacionesWhatsapp,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning user: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}

func (r *UserRepository) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.User, error) {
	// Build dynamic update query
	query := "UPDATE users SET "
	args := []interface{}{}
	argNum := 1
	updatesSQL := ""

	for key, value := range updates {
		if updatesSQL != "" {
			updatesSQL += ", "
		}
		updatesSQL += fmt.Sprintf("%s = $%d", key, argNum)
		args = append(args, value)
		argNum++
	}

	query += updatesSQL + fmt.Sprintf(" WHERE id = $%d", argNum)
	args = append(args, id)
	query += " RETURNING id, nombre, telefono, telefono_validado, email, password, rol, activo, notificaciones_email, notificaciones_whatsapp, created_at, updated_at"

	user := &models.User{}
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&user.ID,
		&user.Nombre,
		&user.Telefono,
		&user.TelefonoValidado,
		&user.Email,
		&user.Password,
		&user.Rol,
		&user.Activo,
		&user.NotificacionesEmail,
		&user.NotificacionesWhatsapp,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("error updating user: %w", err)
	}

	return user, nil
}

func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := "DELETE FROM users WHERE id = $1"
	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("error deleting user: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *UserRepository) GetVisitantes(ctx context.Context) ([]*models.User, error) {
	query := `
		SELECT id, nombre, telefono, telefono_validado, email, password, rol, activo,
		       notificaciones_email, notificaciones_whatsapp, created_at, updated_at
		FROM users
		WHERE rol = 'VISITANTE' AND activo = true
		ORDER BY nombre ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error listing visitantes: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Nombre,
			&user.Telefono,
			&user.TelefonoValidado,
			&user.Email,
			&user.Password,
			&user.Rol,
			&user.Activo,
			&user.NotificacionesEmail,
			&user.NotificacionesWhatsapp,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning visitante: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func isUniqueViolation(err error) bool {
	return err != nil && (contains(err.Error(), "duplicate key") || contains(err.Error(), "unique constraint"))
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
