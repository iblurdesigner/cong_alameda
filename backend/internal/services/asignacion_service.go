package services

import (
	"context"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"github.com/google/uuid"
)

type AsignacionService struct {
	asignacionRepo *repositories.AsignacionRepository
	tipoAsignRepo  *repositories.TipoAsignacionRepository
	semanaRepo     *repositories.SemanaRepository
	diaRepo        *repositories.DiaSemanaRepository
	userRepo       *repositories.UserRepository
}

func NewAsignacionService(
	asignacionRepo *repositories.AsignacionRepository,
	tipoAsignRepo *repositories.TipoAsignacionRepository,
	semanaRepo *repositories.SemanaRepository,
	diaRepo *repositories.DiaSemanaRepository,
	userRepo *repositories.UserRepository,
) *AsignacionService {
	return &AsignacionService{
		asignacionRepo: asignacionRepo,
		tipoAsignRepo:  tipoAsignRepo,
		semanaRepo:     semanaRepo,
		diaRepo:        diaRepo,
		userRepo:       userRepo,
	}
}

func (s *AsignacionService) GetTiposAsignacion(ctx context.Context) ([]*models.TipoAsignacion, error) {
	return s.tipoAsignRepo.GetAll(ctx)
}

func (s *AsignacionService) GetBySemana(ctx context.Context, semanaID uuid.UUID) ([]*models.AsignacionDetail, error) {
	return s.asignacionRepo.GetBySemana(ctx, semanaID)
}

func (s *AsignacionService) GetBySemanaAndDia(ctx context.Context, semanaID uuid.UUID, diaSemana int) ([]*models.AsignacionDetail, error) {
	return s.asignacionRepo.GetBySemanaAndDia(ctx, semanaID, diaSemana)
}

func (s *AsignacionService) GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.AsignacionDetail, error) {
	return s.asignacionRepo.GetByUser(ctx, userID)
}

func (s *AsignacionService) GetSemanaConAsignaciones(ctx context.Context, semanaID uuid.UUID) (*models.SemanaConAsignaciones, error) {
	// Get semana
	semana, err := s.semanaRepo.GetByID(ctx, semanaID)
	if err != nil {
		return nil, err
	}

	// Get dias
	dias, err := s.diaRepo.GetBySemanaID(ctx, semanaID)
	if err != nil {
		return nil, err
	}

	// Get asignaciones
	asignaciones, err := s.asignacionRepo.GetBySemana(ctx, semanaID)
	if err != nil {
		return nil, err
	}

	return &models.SemanaConAsignaciones{
		SemanaVisita: *semana,
		Asignaciones: asignaciones,
		Dias:         dias,
	}, nil
}

func (s *AsignacionService) Create(ctx context.Context, asignacion *models.AsignacionSemanal) error {
	// Validate user exists
	_, err := s.userRepo.GetByID(ctx, asignacion.UserID)
	if err != nil {
		return err
	}

	// Validate tipo exists
	_, err = s.tipoAsignRepo.GetByID(ctx, asignacion.TipoAsignacionID)
	if err != nil {
		return err
	}

	return s.asignacionRepo.Create(ctx, asignacion)
}

func (s *AsignacionService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, observaciones *string) error {
	// Validate user exists
	_, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	return s.asignacionRepo.Update(ctx, id, userID, observaciones)
}

func (s *AsignacionService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.asignacionRepo.Delete(ctx, id)
}

func (s *AsignacionService) BulkCreate(ctx context.Context, asignaciones []*models.AsignacionSemanal) error {
	for _, a := range asignaciones {
		if err := s.asignacionRepo.Create(ctx, a); err != nil {
			return err
		}
	}
	return nil
}

func (s *AsignacionService) ClearSemana(ctx context.Context, semanaID uuid.UUID) error {
	return s.asignacionRepo.DeleteBySemana(ctx, semanaID)
}
