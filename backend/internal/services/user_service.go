package services

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/pkg/jwt"
)

var (
	ErrInvalidCredentials = errors.New("credenciales inválidas")
	ErrUserInactive       = errors.New("usuario inactivo")
)

type UserService struct {
	userRepo *repositories.UserRepository
	jwtMgr   *jwt.JWTManager
}

func NewUserService(userRepo *repositories.UserRepository, jwtMgr *jwt.JWTManager) *UserService {
	return &UserService{
		userRepo: userRepo,
		jwtMgr:   jwtMgr,
	}
}

type LoginResult struct {
	Token string
	User  *models.User
}

func (s *UserService) Login(ctx context.Context, email, password string) (*LoginResult, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !user.Activo {
		return nil, ErrUserInactive
	}

	if !repositories.CheckPassword(password, user.Password) {
		return nil, ErrInvalidCredentials
	}

	token, err := s.jwtMgr.GenerateToken(user.ID, user.Email, string(user.Rol))
	if err != nil {
		return nil, err
	}

	return &LoginResult{
		Token: token,
		User:  user,
	}, nil
}

func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	return s.userRepo.GetByID(ctx, id)
}

func (s *UserService) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	return s.userRepo.GetByEmail(ctx, email)
}

func (s *UserService) List(ctx context.Context, rol *models.Rol, activo *bool) ([]*models.User, error) {
	return s.userRepo.List(ctx, rol, activo)
}

func (s *UserService) GetVisitantes(ctx context.Context) ([]*models.User, error) {
	return s.userRepo.GetVisitantes(ctx)
}

func (s *UserService) Create(ctx context.Context, user *models.User) error {
	hashedPassword, err := repositories.HashPassword(user.Password)
	if err != nil {
		return err
	}
	user.Password = hashedPassword
	user.Rol = models.RolVisitante // Default rol
	user.Activo = true

	return s.userRepo.Create(ctx, user)
}

func (s *UserService) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.User, error) {
	// If password is being updated, hash it
	if pwd, ok := updates["password"].(string); ok && pwd != "" {
		hashedPassword, err := repositories.HashPassword(pwd)
		if err != nil {
			return nil, err
		}
		updates["password"] = hashedPassword
	}

	return s.userRepo.Update(ctx, id, updates)
}

func (s *UserService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.userRepo.Delete(ctx, id)
}

func (s *UserService) GetByEmailForRecovery(ctx context.Context, email string) (*models.User, error) {
	return s.userRepo.GetByEmail(ctx, email)
}

func (s *UserService) UpdatePassword(ctx context.Context, email, password string) error {
	hashedPassword, err := repositories.HashPassword(password)
	if err != nil {
		return err
	}
	return s.userRepo.UpdateByEmail(ctx, email, map[string]interface{}{
		"password": hashedPassword,
	})
}

func (s *UserService) ValidateToken(tokenString string) (*jwt.Claims, error) {
	return s.jwtMgr.ValidateToken(tokenString)
}
