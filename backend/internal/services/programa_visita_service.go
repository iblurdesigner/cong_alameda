package services

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

type ProgramaVisitaService struct {
	repo                    *repositories.ProgramaVisitaRepository
	programaPredicacionRepo *repositories.ProgramaPredicacionRepository
	grupoRepo               *repositories.GrupoRepository
	territorioRepo          *repositories.TerritorioRepository
}

func NewProgramaVisitaService(
	repo *repositories.ProgramaVisitaRepository,
	programaPredicacionRepo *repositories.ProgramaPredicacionRepository,
	grupoRepo *repositories.GrupoRepository,
	territorioRepo *repositories.TerritorioRepository,
) *ProgramaVisitaService {
	return &ProgramaVisitaService{
		repo:                    repo,
		programaPredicacionRepo: programaPredicacionRepo,
		grupoRepo:               grupoRepo,
		territorioRepo:          territorioRepo,
	}
}

func (s *ProgramaVisitaService) Create(ctx context.Context, programaPredicacionID *uuid.UUID, fecha string, diaSemana int, conductor, hora, lugarNombre, lugarDireccion, lugarContacto, lugarTelefono string, grupoID *uuid.UUID, observaciones string, createdBy *uuid.UUID) (*models.ProgramaVisita, error) {
	p := &models.ProgramaVisita{
		ID:                    uuid.New(),
		ProgramaPredicacionID: programaPredicacionID,
		Fecha:                 fecha,
		DiaSemana:             diaSemana,
		Conductor:             conductor,
		Hora:                  hora,
		LugarNombre:           lugarNombre,
		LugarDireccion:        lugarDireccion,
		LugarContacto:         lugarContacto,
		LugarTelefono:         lugarTelefono,
		GrupoID:               grupoID,
		Observaciones:         observaciones,
		Visited:               false,
		CreatedBy:             createdBy,
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}

	return p, nil
}

func (s *ProgramaVisitaService) GetAll(ctx context.Context) ([]*models.ProgramaVisitaDetail, error) {
	log.Printf("=== ProgramaVisitaService.GetAll called ===")
	programas, err := s.repo.GetAll(ctx)
	if err != nil {
		log.Printf("ERROR: repo.GetAll failed: %v", err)
		return nil, err
	}

	var result []*models.ProgramaVisitaDetail
	for _, p := range programas {
		detail := &models.ProgramaVisitaDetail{ProgramaVisita: *p}

		// Load related entities
		if p.ProgramaPredicacionID != nil {
			progPred, err := s.programaPredicacionRepo.GetByID(ctx, *p.ProgramaPredicacionID)
			if err == nil {
				detail.ProgramaPredicacion = progPred
			}
		}

		if p.GrupoID != nil {
			grupo, err := s.grupoRepo.GetByID(ctx, *p.GrupoID)
			if err == nil {
				detail.Grupo = grupo
			}
		}

		territorios, err := s.repo.GetTerritorios(ctx, p.ID)
		if err == nil {
			detail.Territorios = territorios
		}

		result = append(result, detail)
	}

	return result, nil
}

func (s *ProgramaVisitaService) GetByID(ctx context.Context, id uuid.UUID) (*models.ProgramaVisitaDetail, error) {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	detail := &models.ProgramaVisitaDetail{ProgramaVisita: *p}

	if p.ProgramaPredicacionID != nil {
		progPred, err := s.programaPredicacionRepo.GetByID(ctx, *p.ProgramaPredicacionID)
		if err == nil {
			detail.ProgramaPredicacion = progPred
		}
	}

	if p.GrupoID != nil {
		grupo, err := s.grupoRepo.GetByID(ctx, *p.GrupoID)
		if err == nil {
			detail.Grupo = grupo
		}
	}

	territorios, err := s.repo.GetTerritorios(ctx, p.ID)
	if err == nil {
		detail.Territorios = territorios
	}

	return detail, nil
}

func (s *ProgramaVisitaService) GetByFecha(ctx context.Context, fecha string) ([]*models.ProgramaVisitaDetail, error) {
	programas, err := s.repo.GetByFecha(ctx, fecha)
	if err != nil {
		return nil, err
	}

	var result []*models.ProgramaVisitaDetail
	for _, p := range programas {
		detail := &models.ProgramaVisitaDetail{ProgramaVisita: *p}

		if p.ProgramaPredicacionID != nil {
			progPred, err := s.programaPredicacionRepo.GetByID(ctx, *p.ProgramaPredicacionID)
			if err == nil {
				detail.ProgramaPredicacion = progPred
			}
		}

		if p.GrupoID != nil {
			grupo, err := s.grupoRepo.GetByID(ctx, *p.GrupoID)
			if err == nil {
				detail.Grupo = grupo
			}
		}

		territorios, err := s.repo.GetTerritorios(ctx, p.ID)
		if err == nil {
			detail.Territorios = territorios
		}

		result = append(result, detail)
	}

	return result, nil
}

func (s *ProgramaVisitaService) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.ProgramaVisitaDetail, error) {
	log.Printf("=== SERVICE Update called ===")
	log.Printf("ID: %s", id.String())
	log.Printf("Updates: %+v", updates)

	// Handle territorios separately
	if territorios, ok := updates["territorio_ids"]; ok {
		if ids, ok := territorios.([]string); ok {
			var uuids []uuid.UUID
			for _, idStr := range ids {
				if parsed, err := uuid.Parse(idStr); err == nil {
					uuids = append(uuids, parsed)
				}
			}
			if err := s.repo.SetTerritorios(ctx, id, uuids); err != nil {
				log.Printf("ERROR: SetTerritorios failed: %v", err)
				return nil, err
			}
		}
		delete(updates, "territorio_ids")
	}

	_, err := s.repo.Update(ctx, id, updates)
	if err != nil {
		log.Printf("ERROR: repo.Update failed: %v", err)
		return nil, err
	}

	log.Printf("DEBUG: Update succeeded, now fetching updated record")

	result, err := s.GetByID(ctx, id)
	if err != nil {
		log.Printf("ERROR: GetByID after update failed: %v", err)
		return nil, err
	}

	log.Printf("DEBUG: GetByID succeeded, returning result")
	return result, nil
}

func (s *ProgramaVisitaService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *ProgramaVisitaService) SetVisited(ctx context.Context, id uuid.UUID, visited bool) error {
	updates := map[string]interface{}{
		"visited": visited,
	}
	_, err := s.repo.Update(ctx, id, updates)
	return err
}
