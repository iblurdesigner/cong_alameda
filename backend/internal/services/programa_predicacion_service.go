package services

import (
	"context"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

type ProgramaPredicacionService struct {
	repo           *repositories.ProgramaPredicacionRepository
	grupoRepo      *repositories.GrupoRepository
	territorioRepo *repositories.TerritorioRepository
}

func NewProgramaPredicacionService(
	repo *repositories.ProgramaPredicacionRepository,
	grupoRepo *repositories.GrupoRepository,
	territorioRepo *repositories.TerritorioRepository,
) *ProgramaPredicacionService {
	return &ProgramaPredicacionService{
		repo:           repo,
		grupoRepo:      grupoRepo,
		territorioRepo: territorioRepo,
	}
}

func (s *ProgramaPredicacionService) Create(
	ctx context.Context,
	nombre, fecha string,
	diaSemana int,
	conductor, horaInicio, horaFin string,
	lugarNombre, lugarDireccion, lugarContacto, lugarTelefono string,
	grupoID *uuid.UUID,
) (*models.ProgramaPredicacion, error) {
	// Get default lugar for this day if not provided
	defaultLugar := models.DefaultLugaresPredicacion[diaSemana]
	if lugarNombre == "" {
		lugarNombre = defaultLugar["nombre"]
	}
	if lugarDireccion == "" {
		lugarDireccion = defaultLugar["direccion"]
	}
	if lugarContacto == "" {
		lugarContacto = defaultLugar["contacto"]
	}
	if lugarTelefono == "" {
		lugarTelefono = defaultLugar["telefono"]
	}
	if horaInicio == "" {
		horaInicio = "09:00"
	}
	if horaFin == "" {
		horaFin = "11:00"
	}

	p := &models.ProgramaPredicacion{
		ID:             uuid.New(),
		Nombre:         nombre,
		Fecha:          fecha,
		DiaSemana:      diaSemana,
		Conductor:      conductor,
		HoraInicio:     horaInicio,
		HoraFin:        horaFin,
		LugarNombre:    lugarNombre,
		LugarDireccion: lugarDireccion,
		LugarContacto:  lugarContacto,
		LugarTelefono:  lugarTelefono,
		GrupoID:        grupoID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}

	return p, nil
}

func (s *ProgramaPredicacionService) GetAll(ctx context.Context) ([]*models.ProgramaPredicacionDetail, error) {
	programas, err := s.repo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	// Enrich with related entities
	var result []*models.ProgramaPredicacionDetail
	for _, p := range programas {
		detail := &models.ProgramaPredicacionDetail{ProgramaPredicacion: *p}

		// Load grupo if exists
		if p.GrupoID != nil {
			grupo, err := s.grupoRepo.GetByID(ctx, *p.GrupoID)
			if err == nil {
				detail.Grupo = grupo
			}
		}

		// Load territorios
		territorios, err := s.repo.GetTerritorios(ctx, p.ID)
		if err == nil {
			detail.Territorios = territorios
		}

		result = append(result, detail)
	}

	return result, nil
}

func (s *ProgramaPredicacionService) GetByID(ctx context.Context, id uuid.UUID) (*models.ProgramaPredicacionDetail, error) {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	detail := &models.ProgramaPredicacionDetail{ProgramaPredicacion: *p}

	// Load grupo if exists
	if p.GrupoID != nil {
		grupo, err := s.grupoRepo.GetByID(ctx, *p.GrupoID)
		if err == nil {
			detail.Grupo = grupo
		}
	}

	// Load territorios
	territorios, err := s.repo.GetTerritorios(ctx, p.ID)
	if err == nil {
		detail.Territorios = territorios
	}

	return detail, nil
}

func (s *ProgramaPredicacionService) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.ProgramaPredicacionDetail, error) {
	// Handle territorios update separately
	if territorios, ok := updates["territorio_ids"]; ok {
		if ids, ok := territorios.([]string); ok {
			// Convert string IDs to UUID
			var uuids []uuid.UUID
			for _, idStr := range ids {
				if parsed, err := uuid.Parse(idStr); err == nil {
					uuids = append(uuids, parsed)
				}
			}
			if err := s.repo.SetTerritorios(ctx, id, uuids); err != nil {
				return nil, err
			}
		}
		// Remove from updates to avoid trying to set it in the main table
		delete(updates, "territorio_ids")
	}

	_, err := s.repo.Update(ctx, id, updates)
	if err != nil {
		return nil, err
	}

	return s.GetByID(ctx, id)
}

func (s *ProgramaPredicacionService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *ProgramaPredicacionService) SetTerritorios(ctx context.Context, programaID uuid.UUID, territorioIDs []string) error {
	// Convert string IDs to UUID
	var uuids []uuid.UUID
	for _, idStr := range territorioIDs {
		if parsed, err := uuid.Parse(idStr); err == nil {
			uuids = append(uuids, parsed)
		}
	}
	return s.repo.SetTerritorios(ctx, programaID, uuids)
}
