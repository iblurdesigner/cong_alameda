package services

import (
	"context"
	"errors"
	"log"

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
	grupoRepo      *repositories.GrupoRepository
}

func NewAsignacionService(
	asignacionRepo *repositories.AsignacionRepository,
	tipoAsignRepo *repositories.TipoAsignacionRepository,
	semanaRepo *repositories.SemanaRepository,
	diaRepo *repositories.DiaSemanaRepository,
	userRepo *repositories.UserRepository,
	grupoRepo *repositories.GrupoRepository,
) *AsignacionService {
	return &AsignacionService{
		asignacionRepo: asignacionRepo,
		tipoAsignRepo:  tipoAsignRepo,
		semanaRepo:     semanaRepo,
		diaRepo:        diaRepo,
		userRepo:       userRepo,
		grupoRepo:      grupoRepo,
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
		log.Printf("[ERROR] GetByID(semana) failed: %v", err)
		return nil, err
	}

	// Get dias
	dias, err := s.diaRepo.GetBySemanaID(ctx, semanaID)
	if err != nil {
		log.Printf("[ERROR] GetBySemanaID(dia) failed: %v", err)
		return nil, err
	}

	// Get asignaciones
	asignaciones, err := s.asignacionRepo.GetBySemana(ctx, semanaID)
	if err != nil {
		log.Printf("[ERROR] GetBySemana(asignacion) failed: %v", err)
		return nil, err
	}

	return &models.SemanaConAsignaciones{
		SemanaVisita: *semana,
		Asignaciones: asignaciones,
		Dias:         dias,
	}, nil
}

func (s *AsignacionService) Create(ctx context.Context, asignacion *models.AsignacionSemanal) error {
	// Validate either user OR grupo is provided
	if asignacion.UserID != nil {
		_, err := s.userRepo.GetByID(ctx, *asignacion.UserID)
		if err != nil {
			return err
		}
	} else if asignacion.GrupoID != nil {
		_, err := s.grupoRepo.GetByID(ctx, *asignacion.GrupoID)
		if err != nil {
			return err
		}
	} else {
		return errors.New("debe especificar user_id o grupo_id")
	}

	// Validate tipo exists
	_, err := s.tipoAsignRepo.GetByID(ctx, asignacion.TipoAsignacionID)
	if err != nil {
		return err
	}

	return s.asignacionRepo.Create(ctx, asignacion)
}

func (s *AsignacionService) Update(ctx context.Context, id uuid.UUID, userID *uuid.UUID, grupoID *uuid.UUID, observaciones *string) error {
	// Validate either user OR grupo is provided
	if userID != nil {
		_, err := s.userRepo.GetByID(ctx, *userID)
		if err != nil {
			return err
		}
	} else if grupoID != nil {
		_, err := s.grupoRepo.GetByID(ctx, *grupoID)
		if err != nil {
			return err
		}
	}

	return s.asignacionRepo.Update(ctx, id, userID, grupoID, observaciones)
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

func (s *AsignacionService) GetTipoAsignacionByID(ctx context.Context, id uuid.UUID) (*models.TipoAsignacion, error) {
	return s.tipoAsignRepo.GetByID(ctx, id)
}

func (s *AsignacionService) GetSemanaByID(ctx context.Context, id uuid.UUID) (*models.SemanaVisita, error) {
	return s.semanaRepo.GetByID(ctx, id)
}
