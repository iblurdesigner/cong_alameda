package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
)

type PublicadorRepo interface {
	Create(ctx context.Context, p *models.Publicador) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Publicador, error)
	List(ctx context.Context, search string, grupoID *uuid.UUID, activoOnly bool) ([]*models.Publicador, error)
	Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.Publicador, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type PublicadorService struct {
	repo PublicadorRepo
}

func NewPublicadorService(repo PublicadorRepo) *PublicadorService {
	return &PublicadorService{repo: repo}
}

func (s *PublicadorService) Create(ctx context.Context, req *dto.CreatePublicadorRequest) (*dto.PublicadorResponse, error) {
	nombres := strings.TrimSpace(req.Nombres)
	apellidos := strings.TrimSpace(req.Apellidos)

	// Soporte de compatibilidad si se envió solo 'Nombre'
	if nombres == "" && req.Nombre != "" {
		parts := strings.SplitN(strings.TrimSpace(req.Nombre), " ", 2)
		nombres = parts[0]
		if len(parts) > 1 {
			apellidos = parts[1]
		}
	}

	if nombres == "" {
		return nil, fmt.Errorf("los nombres del publicador son obligatorios")
	}
	if apellidos == "" {
		return nil, fmt.Errorf("los apellidos del publicador son obligatorios")
	}

	activo := true
	if req.Activo != nil {
		activo = *req.Activo
	}

	p := &models.Publicador{
		ID:                           uuid.New(),
		Nombres:                      nombres,
		Apellidos:                    apellidos,
		Celular:                      req.Celular,
		Telefono:                     req.Telefono,
		Email:                        req.Email,
		Domicilio:                    req.Domicilio,
		GrupoID:                      req.GrupoID,
		ContactoEmergenciaNombre:     req.ContactoEmergenciaNombre,
		ContactoEmergenciaTelefono:   req.ContactoEmergenciaTelefono,
		ContactoEmergenciaParentesco: req.ContactoEmergenciaParentesco,
		Observaciones:                req.Observaciones,
		Activo:                       activo,
		UserID:                       req.UserID,
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, fmt.Errorf("error creating publicador: %w", err)
	}

	return toPublicadorResponse(p), nil
}

func (s *PublicadorService) GetByID(ctx context.Context, id uuid.UUID) (*dto.PublicadorResponse, error) {
	if id == uuid.Nil {
		return nil, fmt.Errorf("id de publicador inválido")
	}

	p, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return toPublicadorResponse(p), nil
}

func (s *PublicadorService) List(ctx context.Context, search string, grupoID *uuid.UUID, activoOnly bool) ([]*dto.PublicadorResponse, error) {
	publicadores, err := s.repo.List(ctx, search, grupoID, activoOnly)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.PublicadorResponse, 0, len(publicadores))
	for _, p := range publicadores {
		responses = append(responses, toPublicadorResponse(p))
	}

	return responses, nil
}

func (s *PublicadorService) Update(ctx context.Context, id uuid.UUID, req *dto.UpdatePublicadorRequest) (*dto.PublicadorResponse, error) {
	if id == uuid.Nil {
		return nil, fmt.Errorf("id de publicador inválido")
	}

	updates := make(map[string]interface{})

	if req.Nombres != nil {
		n := strings.TrimSpace(*req.Nombres)
		if n == "" {
			return nil, fmt.Errorf("los nombres no pueden estar vacíos")
		}
		updates["nombres"] = n
	}
	if req.Apellidos != nil {
		a := strings.TrimSpace(*req.Apellidos)
		if a == "" {
			return nil, fmt.Errorf("los apellidos no pueden estar vacíos")
		}
		updates["apellidos"] = a
	}
	if req.Celular != nil {
		updates["celular"] = req.Celular
	}
	if req.Telefono != nil {
		updates["telefono"] = req.Telefono
	}
	if req.Email != nil {
		updates["email"] = req.Email
	}
	if req.Domicilio != nil {
		updates["domicilio"] = req.Domicilio
	}
	if req.GrupoID != nil {
		updates["grupo_id"] = req.GrupoID
	}
	if req.ContactoEmergenciaNombre != nil {
		updates["contacto_emergencia_nombre"] = req.ContactoEmergenciaNombre
	}
	if req.ContactoEmergenciaTelefono != nil {
		updates["contacto_emergencia_telefono"] = req.ContactoEmergenciaTelefono
	}
	if req.ContactoEmergenciaParentesco != nil {
		updates["contacto_emergencia_parentesco"] = req.ContactoEmergenciaParentesco
	}
	if req.Observaciones != nil {
		updates["observaciones"] = req.Observaciones
	}
	if req.Activo != nil {
		updates["activo"] = *req.Activo
	}
	if req.UserID != nil {
		updates["user_id"] = req.UserID
	}

	updated, err := s.repo.Update(ctx, id, updates)
	if err != nil {
		return nil, err
	}

	return toPublicadorResponse(updated), nil
}

func (s *PublicadorService) Delete(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return fmt.Errorf("id de publicador inválido")
	}

	return s.repo.Delete(ctx, id)
}

func toPublicadorResponse(p *models.Publicador) *dto.PublicadorResponse {
	return &dto.PublicadorResponse{
		ID:                           p.ID,
		Nombres:                      p.Nombres,
		Apellidos:                    p.Apellidos,
		Nombre:                       p.NombreCompleto(),
		Celular:                      p.Celular,
		Telefono:                     p.Telefono,
		Email:                        p.Email,
		Domicilio:                    p.Domicilio,
		GrupoID:                      p.GrupoID,
		GrupoNumero:                  p.GrupoNumero,
		GrupoNombre:                  p.GrupoNombre,
		ContactoEmergenciaNombre:     p.ContactoEmergenciaNombre,
		ContactoEmergenciaTelefono:   p.ContactoEmergenciaTelefono,
		ContactoEmergenciaParentesco: p.ContactoEmergenciaParentesco,
		Observaciones:                p.Observaciones,
		Activo:                       p.Activo,
		UserID:                       p.UserID,
		CreatedAt:                    p.CreatedAt,
		UpdatedAt:                    p.UpdatedAt,
	}
}
