package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

type SemanaService struct {
	semanaRepo *repositories.SemanaRepository
	diaRepo    *repositories.DiaSemanaRepository
}

func NewSemanaService(semanaRepo *repositories.SemanaRepository, diaRepo *repositories.DiaSemanaRepository) *SemanaService {
	return &SemanaService{
		semanaRepo: semanaRepo,
		diaRepo:    diaRepo,
	}
}

func (s *SemanaService) Create(ctx context.Context, fechaInicio time.Time, nombre string) (*models.SemanaVisita, error) {
	// Validate it's a Monday
	if fechaInicio.Weekday() != time.Monday {
		return nil, fmt.Errorf("la fecha de inicio debe ser un lunes")
	}

	fechaFin := fechaInicio.AddDate(0, 0, 6)

	semana := &models.SemanaVisita{
		FechaInicio: fechaInicio,
		FechaFin:    fechaFin,
		Nombre:      &nombre,
	}

	if err := s.semanaRepo.Create(ctx, semana); err != nil {
		return nil, err
	}

	// Create 7 days for this week
	if err := s.semanaRepo.CreateDiasSemana(ctx, semana.ID, fechaInicio); err != nil {
		return nil, err
	}

	return semana, nil
}

func (s *SemanaService) GetByID(ctx context.Context, id uuid.UUID) (*models.SemanaVisita, error) {
	return s.semanaRepo.GetByID(ctx, id)
}

func (s *SemanaService) GetDetail(ctx context.Context, id uuid.UUID) (*models.SemanaDetail, error) {
	semana, err := s.semanaRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	dias, err := s.diaRepo.GetBySemanaID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &models.SemanaDetail{
		SemanaVisita: *semana,
		Dias:         dias,
	}, nil
}

func (s *SemanaService) List(ctx context.Context, includeArchived bool) ([]*models.SemanaVisita, error) {
	return s.semanaRepo.List(ctx, includeArchived)
}

func (s *SemanaService) Archive(ctx context.Context, id uuid.UUID, archived bool) error {
	return s.semanaRepo.Archive(ctx, id, archived)
}

func (s *SemanaService) Update(ctx context.Context, id uuid.UUID, nombre string) (*models.SemanaVisita, error) {
	updates := map[string]interface{}{}
	if nombre != "" {
		updates["nombre"] = nombre
	}
	return s.semanaRepo.Update(ctx, id, updates)
}

func (s *SemanaService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.semanaRepo.Delete(ctx, id)
}

func (s *SemanaService) UpdateDia(ctx context.Context, diaID uuid.UUID, territorioMananaID, territorioTardeID, grupoAsignadoID *uuid.UUID) (*models.DiaSemana, error) {
	updates := make(map[string]interface{})

	if territorioMananaID != nil {
		updates["territorio_manana_id"] = *territorioMananaID
	}
	if territorioTardeID != nil {
		updates["territorio_tarde_id"] = *territorioTardeID
	}
	if grupoAsignadoID != nil {
		updates["grupo_asignado_id"] = *grupoAsignadoID
	}

	return s.diaRepo.Update(ctx, diaID, updates)
}

func (s *SemanaService) GetDiasBySemana(ctx context.Context, semanaID uuid.UUID) ([]*models.DiaSemana, error) {
	return s.diaRepo.GetBySemanaID(ctx, semanaID)
}
