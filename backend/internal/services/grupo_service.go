package services

import (
	"context"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

type GrupoService struct {
	grupoRepo      *repositories.GrupoRepository
	territorioRepo *repositories.TerritorioRepository
}

func NewGrupoService(grupoRepo *repositories.GrupoRepository, territorioRepo *repositories.TerritorioRepository) *GrupoService {
	return &GrupoService{
		grupoRepo:      grupoRepo,
		territorioRepo: territorioRepo,
	}
}

func (s *GrupoService) Create(ctx context.Context, grupo *models.Grupo) error {
	grupo.Activo = true
	return s.grupoRepo.Create(ctx, grupo)
}

func (s *GrupoService) GetByID(ctx context.Context, id uuid.UUID) (*models.Grupo, error) {
	return s.grupoRepo.GetByID(ctx, id)
}

func (s *GrupoService) GetDetail(ctx context.Context, id uuid.UUID) (*models.GrupoDetail, error) {
	grupo, err := s.grupoRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	territorios, _ := s.territorioRepo.GetByGrupoID(ctx, id)

	return &models.GrupoDetail{
		Grupo:       *grupo,
		Territorios: territorios,
	}, nil
}

func (s *GrupoService) List(ctx context.Context, activo *bool) ([]*models.Grupo, error) {
	return s.grupoRepo.List(ctx, activo)
}

func (s *GrupoService) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.Grupo, error) {
	return s.grupoRepo.Update(ctx, id, updates)
}

func (s *GrupoService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.grupoRepo.Delete(ctx, id)
}

type GrupoWithCount struct {
	models.Grupo
	TerritorioCount int `json:"territorio_count"`
}

func (s *GrupoService) ListWithCounts(ctx context.Context) ([]*GrupoWithCount, error) {
	grupos, err := s.grupoRepo.List(ctx, nil)
	if err != nil {
		return nil, err
	}

	result := make([]*GrupoWithCount, 0, len(grupos))
	for _, g := range grupos {
		territorios, _ := s.territorioRepo.GetByGrupoID(ctx, g.ID)
		result = append(result, &GrupoWithCount{
			Grupo:           *g,
			TerritorioCount: len(territorios),
		})
	}
	return result, nil
}
