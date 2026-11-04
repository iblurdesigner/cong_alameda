package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

type PublicadorVyMService struct {
	repo *repositories.PublicadorVyMRepository
}

func NewPublicadorVyMService(repo *repositories.PublicadorVyMRepository) *PublicadorVyMService {
	return &PublicadorVyMService{repo: repo}
}

func (s *PublicadorVyMService) List(ctx context.Context) ([]*dto.PublicadorVyMResponse, error) {
	items, err := s.repo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("error listing publicadores_vym: %w", err)
	}

	result := make([]*dto.PublicadorVyMResponse, 0, len(items))
	for _, item := range items {
		result = append(result, toPublicadorVyMResponse(item))
	}
	return result, nil
}

func (s *PublicadorVyMService) Add(ctx context.Context, req *dto.AddPublicadorVyMRequest) (*dto.PublicadorVyMResponse, error) {
	if req.PublicadorID == uuid.Nil {
		return nil, fmt.Errorf("publicador_id es obligatorio")
	}

	item, err := s.repo.Add(ctx, req.PublicadorID, req.Notas)
	if err != nil {
		return nil, fmt.Errorf("error adding publicador_vym: %w", err)
	}

	return toPublicadorVyMResponse(item), nil
}

func (s *PublicadorVyMService) Update(ctx context.Context, id uuid.UUID, req *dto.UpdatePublicadorVyMRequest) (*dto.PublicadorVyMResponse, error) {
	if id == uuid.Nil {
		return nil, fmt.Errorf("id inválido")
	}

	item, err := s.repo.Update(ctx, id, req.Activo, req.Notas)
	if err != nil {
		return nil, fmt.Errorf("error updating publicador_vym: %w", err)
	}

	return toPublicadorVyMResponse(item), nil
}

func (s *PublicadorVyMService) Delete(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return fmt.Errorf("id inválido")
	}
	return s.repo.Delete(ctx, id)
}

func (s *PublicadorVyMService) GetDisponibilidad(ctx context.Context, fechaReferencia time.Time) ([]*dto.DisponibilidadVyMResponse, error) {
	items, err := s.repo.GetDisponibilidad(ctx, fechaReferencia)
	if err != nil {
		return nil, fmt.Errorf("error getting disponibilidad: %w", err)
	}

	result := make([]*dto.DisponibilidadVyMResponse, 0, len(items))
	for _, item := range items {
		result = append(result, toDisponibilidadVyMResponse(item))
	}
	return result, nil
}

func (s *PublicadorVyMService) SyncHistorial(ctx context.Context, req *dto.SyncHistorialRequest) error {
	semanaID, err := uuid.Parse(req.SemanaID)
	if err != nil {
		return fmt.Errorf("semana_id inválido: %w", err)
	}

	fechaSemana, err := time.Parse("2006-01-02", req.FechaSemana)
	if err != nil {
		return fmt.Errorf("fecha_semana inválida: %w", err)
	}

	var items []repositories.SyncHistorialItem

	for _, a := range req.Auditorio {
		pvmID, err := uuid.Parse(a.PublicadorVyMID)
		if err != nil {
			continue // skip invalid UUIDs
		}
		items = append(items, repositories.SyncHistorialItem{
			PublicadorVyMID: pvmID,
			Rol:             a.Rol,
			Sala:            "auditorio",
		})
	}

	for _, a := range req.Auxiliar {
		pvmID, err := uuid.Parse(a.PublicadorVyMID)
		if err != nil {
			continue // skip invalid UUIDs
		}
		items = append(items, repositories.SyncHistorialItem{
			PublicadorVyMID: pvmID,
			Rol:             a.Rol,
			Sala:            "auxiliar",
		})
	}

	return s.repo.SyncHistorial(ctx, semanaID, fechaSemana, items)
}

// --- mappers ---

func toPublicadorVyMResponse(p *models.PublicadorVyM) *dto.PublicadorVyMResponse {
	return &dto.PublicadorVyMResponse{
		ID:           p.ID,
		PublicadorID: p.PublicadorID,
		Nombres:      p.Nombres,
		Apellidos:    p.Apellidos,
		Celular:      p.Celular,
		Activo:       p.Activo,
		Notas:        p.Notas,
		CreatedAt:    p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    p.UpdatedAt.Format(time.RFC3339),
	}
}

func toDisponibilidadVyMResponse(d *models.DisponibilidadVyM) *dto.DisponibilidadVyMResponse {
	resp := &dto.DisponibilidadVyMResponse{
		PublicadorVyMID: d.PublicadorVyMID.String(),
		PublicadorID:    d.PublicadorID.String(),
		Nombres:         d.Nombres,
		Apellidos:       d.Apellidos,
		Celular:         d.Celular,
		Activo:          d.Activo,
		SemanasCooldown: d.SemanasCooldown,
		Disponible:      d.Disponible,
	}

	if d.UltimaAsignacion != nil {
		s := d.UltimaAsignacion.Format("2006-01-02")
		resp.UltimaAsignacion = &s
	}

	if !d.Disponible && d.UltimaAsignacion != nil {
		fechaDisp := d.UltimaAsignacion.AddDate(0, 0, 42)
		s := fechaDisp.Format("2006-01-02")
		resp.FechaDisponible = &s
	}

	return resp
}
