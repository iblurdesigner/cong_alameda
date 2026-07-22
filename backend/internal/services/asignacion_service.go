package services

import (
	"context"

	"errors"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
	"github.com/google/uuid"
)

// ErrAseoSalonRequiresGrupo is returned when an ASEO_SALON assignment is
// created/updated with a person (user_id) instead of a group (grupo_id), or
// without any grupo_id at all. The handler maps it to HTTP 400.
var ErrAseoSalonRequiresGrupo = errors.New("aseo_salon requires grupo_id and forbids user_id")

// aseoSalonNombre is the canonical nombre for the "Aseo del Salón" assignment type.
const aseoSalonNombre = "ASEO_SALON"

// asignacionRepo is the subset of the repository the service depends on. Using
// an interface keeps the service unit-testable with in-memory mocks and matches
// the existing test convention in this repo.
type asignacionRepo interface {
	Create(ctx context.Context, a *models.AsignacionSemanal) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.AsignacionSemanal, error)
	GetBySemana(ctx context.Context, semanaID uuid.UUID) ([]*models.AsignacionDetail, error)
	GetBySemanaAndDia(ctx context.Context, semanaID uuid.UUID, diaSemana int) ([]*models.AsignacionDetail, error)
	GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.AsignacionDetail, error)
	Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, grupoID *uuid.UUID, observaciones *string) error
	Delete(ctx context.Context, id uuid.UUID) error
	DeleteBySemana(ctx context.Context, semanaID uuid.UUID) error
}

type tipoAsignRepo interface {
	GetAll(ctx context.Context) ([]*models.TipoAsignacion, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.TipoAsignacion, error)
	GetByNombre(ctx context.Context, nombre string) (*models.TipoAsignacion, error)
}

type userRepo interface {
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
}

type semanaRepo interface {
	GetByID(ctx context.Context, id uuid.UUID) (*models.SemanaVisita, error)
}

type diaRepo interface {
	GetBySemanaID(ctx context.Context, semanaID uuid.UUID) ([]*models.DiaSemana, error)
}

type AsignacionService struct {
	asignacionRepo asignacionRepo
	tipoAsignRepo  tipoAsignRepo
	semanaRepo     semanaRepo
	diaRepo        diaRepo
	userRepo       userRepo
}

func NewAsignacionService(
	asignacionRepo asignacionRepo,
	tipoAsignRepo tipoAsignRepo,
	semanaRepo semanaRepo,
	diaRepo diaRepo,
	userRepo userRepo,
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

// enforceAseoSalonPolicy validates the ASEO_SALON business rule: assignments of
// this type MUST be group-only (GrupoID != nil) and MUST NOT carry a person
// (UserID must be the zero value). Other types keep their current behavior.
func (s *AsignacionService) enforceAseoSalonPolicy(ctx context.Context, tipoID uuid.UUID, userID uuid.UUID, grupoID *uuid.UUID) error {
	tipo, err := s.tipoAsignRepo.GetByID(ctx, tipoID)
	if err != nil {
		return err
	}

	if tipo.Nombre == aseoSalonNombre {
		if grupoID == nil {
			return ErrAseoSalonRequiresGrupo
		}
		if userID != uuid.Nil {
			return ErrAseoSalonRequiresGrupo
		}
	}

	return nil
}

func (s *AsignacionService) Create(ctx context.Context, asignacion *models.AsignacionSemanal) error {
	// Enforce ASEO_SALON group-only rule before any other validation.
	if err := s.enforceAseoSalonPolicy(ctx, asignacion.TipoAsignacionID, asignacion.UserID, asignacion.GrupoID); err != nil {
		return err
	}

	// Validate user exists only when no grupo_id is set
	if asignacion.GrupoID == nil {
		_, err := s.userRepo.GetByID(ctx, asignacion.UserID)
		if err != nil {
			return err
		}
	}

	// Validate tipo exists
	_, err := s.tipoAsignRepo.GetByID(ctx, asignacion.TipoAsignacionID)
	if err != nil {
		return err
	}

	return s.asignacionRepo.Create(ctx, asignacion)
}

func (s *AsignacionService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, grupoID *uuid.UUID, observaciones *string) error {
	// Resolve the tipo from the existing assignment to enforce ASEO_SALON.
	existing, err := s.asignacionRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrAsignacionNotFound) {
			return repositories.ErrAsignacionNotFound
		}
		return err
	}

	if err := s.enforceAseoSalonPolicy(ctx, existing.TipoAsignacionID, userID, grupoID); err != nil {
		return err
	}

	// Validate user exists only when no grupo_id is set
	if grupoID == nil {
		_, err := s.userRepo.GetByID(ctx, userID)
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
		// Enforce ASEO_SALON group-only rule for each bulk item.
		if err := s.enforceAseoSalonPolicy(ctx, a.TipoAsignacionID, a.UserID, a.GrupoID); err != nil {
			return err
		}
		if a.GrupoID == nil {
			if _, err := s.userRepo.GetByID(ctx, a.UserID); err != nil {
				return err
			}
		}
		if err := s.asignacionRepo.Create(ctx, a); err != nil {
			return err
		}
	}
	return nil
}

func (s *AsignacionService) ClearSemana(ctx context.Context, semanaID uuid.UUID) error {
	return s.asignacionRepo.DeleteBySemana(ctx, semanaID)
}
