package services

import (
	"context"
	"errors"
	"time"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"github.com/google/uuid"
)

var (
	ErrProgramaNotFound  = errors.New("programa de predicación no encontrado")
	ErrDuplicatePrograma = errors.New("ya existe un programa en esta fecha y hora")
)

// programaPredicacionRepo defines the interface for programa predicacion repository operations.
// The concrete *repositories.ProgramaPredicacionRepository satisfies this interface.
type programaPredicacionRepo interface {
	Create(ctx context.Context, programa *models.ProgramaPredicacion) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.ProgramaPredicacion, error)
	List(ctx context.Context) ([]*models.ProgramaPredicacion, error)
	Update(ctx context.Context, id uuid.UUID, programa *models.ProgramaPredicacion) error
	Delete(ctx context.Context, id uuid.UUID) error
	SyncTerritorios(ctx context.Context, programaID uuid.UUID, territorioIDs []uuid.UUID) error
	GetTerritoriosByProgramaID(ctx context.Context, programaID uuid.UUID) ([]uuid.UUID, error)
	ExistsByFechaHora(ctx context.Context, fecha string, horaInicio string, excludeID *uuid.UUID) (bool, error)
}

// ProgramaPredicacionService implements business logic for preaching program management.
type ProgramaPredicacionService struct {
	repo programaPredicacionRepo
}

// NewProgramaPredicacionService creates a new ProgramaPredicacionService.
func NewProgramaPredicacionService(repo programaPredicacionRepo) *ProgramaPredicacionService {
	return &ProgramaPredicacionService{repo: repo}
}

// Create creates a new preaching program after checking for duplicate fecha+hora_inicio.
func (s *ProgramaPredicacionService) Create(ctx context.Context, req *dto.CreateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error) {
	exists, err := s.repo.ExistsByFechaHora(ctx, req.Fecha, req.HoraInicio, nil)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDuplicatePrograma
	}

	fecha, err := time.Parse("2006-01-02", req.Fecha)
	if err != nil {
		return nil, errors.New("formato de fecha inválido: use YYYY-MM-DD")
	}

	programa := &models.ProgramaPredicacion{
		Nombre:           req.Nombre,
		Fecha:            fecha,
		DiaSemana:        req.DiaSemana,
		DiaSemanaNombre:  req.DiaSemanaNombre,
		Conductor:        req.Conductor,
		HoraInicio:       req.HoraInicio,
		HoraFin:          req.HoraFin,
		LugarNombre:      req.LugarNombre,
		LugarDireccion:   req.LugarDireccion,
		LugarCiudad:      req.LugarCiudad,
		LugarProvincia:   req.LugarProvincia,
		LugarCodigoPostal: req.LugarCodigoPostal,
		LugarPais:        req.LugarPais,
		LugarUbicacion:   req.LugarUbicacion,
		LugarContacto:    req.LugarContacto,
		LugarTelefono:    req.LugarTelefono,
		GrupoID:          req.GrupoID,
	}

	if err := s.repo.Create(ctx, programa); err != nil {
		return nil, err
	}

	if len(req.Territorios) > 0 {
		if err := s.repo.SyncTerritorios(ctx, programa.ID, req.Territorios); err != nil {
			return nil, err
		}
	}

	return programa, nil
}

// GetByID returns a single program with its territorio assignments.
func (s *ProgramaPredicacionService) GetByID(ctx context.Context, id uuid.UUID) (*models.ProgramaPredicacionResponse, error) {
	programa, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrProgramaNotFound
	}

	resp := dto.ToProgramaPredicacionResponse(programa)

	territorioIDs, err := s.repo.GetTerritoriosByProgramaID(ctx, id)
	if err != nil {
		return nil, err
	}
	for _, tid := range territorioIDs {
		resp.Territorios = append(resp.Territorios, models.TerritorioSimple{ID: tid})
	}

	return &resp, nil
}

// List returns all programs with their territorio assignments.
func (s *ProgramaPredicacionService) List(ctx context.Context) ([]*models.ProgramaPredicacionResponse, error) {
	programas, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}

	responses := make([]*models.ProgramaPredicacionResponse, len(programas))
	for i, p := range programas {
		resp := dto.ToProgramaPredicacionResponse(p)

		territorioIDs, err := s.repo.GetTerritoriosByProgramaID(ctx, p.ID)
		if err != nil {
			return nil, err
		}
		for _, tid := range territorioIDs {
			resp.Territorios = append(resp.Territorios, models.TerritorioSimple{ID: tid})
		}

		responses[i] = &resp
	}

	return responses, nil
}

// Update updates an existing program after checking for duplicates.
func (s *ProgramaPredicacionService) Update(ctx context.Context, id uuid.UUID, req *dto.UpdateProgramaPredicacionRequest) (*models.ProgramaPredicacion, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrProgramaNotFound
	}

	// Check duplicate fecha+hora_inicio only if both are provided
	if req.Fecha != nil && req.HoraInicio != nil {
		exists, err := s.repo.ExistsByFechaHora(ctx, *req.Fecha, *req.HoraInicio, &id)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, ErrDuplicatePrograma
		}
	}

	// Apply partial updates
	if req.Nombre != nil {
		existing.Nombre = *req.Nombre
	}
	if req.Fecha != nil {
		f, err := time.Parse("2006-01-02", *req.Fecha)
		if err == nil {
			existing.Fecha = f
		}
	}
	if req.DiaSemana != nil {
		existing.DiaSemana = *req.DiaSemana
	}
	if req.DiaSemanaNombre != nil {
		existing.DiaSemanaNombre = *req.DiaSemanaNombre
	}
	if req.Conductor != nil {
		existing.Conductor = *req.Conductor
	}
	if req.HoraInicio != nil {
		existing.HoraInicio = *req.HoraInicio
	}
	if req.HoraFin != nil {
		existing.HoraFin = req.HoraFin
	}
	if req.LugarNombre != nil {
		existing.LugarNombre = req.LugarNombre
	}
	if req.LugarDireccion != nil {
		existing.LugarDireccion = req.LugarDireccion
	}
	if req.LugarCiudad != nil {
		existing.LugarCiudad = req.LugarCiudad
	}
	if req.LugarProvincia != nil {
		existing.LugarProvincia = req.LugarProvincia
	}
	if req.LugarCodigoPostal != nil {
		existing.LugarCodigoPostal = req.LugarCodigoPostal
	}
	if req.LugarPais != nil {
		existing.LugarPais = req.LugarPais
	}
	if req.LugarUbicacion != nil {
		existing.LugarUbicacion = req.LugarUbicacion
	}
	if req.LugarContacto != nil {
		existing.LugarContacto = req.LugarContacto
	}
	if req.LugarTelefono != nil {
		existing.LugarTelefono = req.LugarTelefono
	}
	if req.GrupoID != nil {
		existing.GrupoID = req.GrupoID
	}

	if err := s.repo.Update(ctx, id, existing); err != nil {
		return nil, err
	}

	// Sync territorios if the field was provided (even if empty — to clear them)
	if req.Territorios != nil {
		if err := s.repo.SyncTerritorios(ctx, id, req.Territorios); err != nil {
			return nil, err
		}
	}

	return existing, nil
}

// Delete removes a program. Returns ErrProgramaNotFound if the ID does not exist.
func (s *ProgramaPredicacionService) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return ErrProgramaNotFound
	}
	return s.repo.Delete(ctx, id)
}
