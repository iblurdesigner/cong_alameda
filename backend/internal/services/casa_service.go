package services

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

var (
	ErrCasaNotFound  = errors.New("casa no encontrada")
	ErrDuplicateCasa = errors.New("ya existe una casa con esta dirección")
)

type CasaService struct {
	casaRepo        *repositories.CasaRepository
	visitaRepo      *repositories.VisitaRepository
	userRepo        *repositories.UserRepository
	notificacionSvc *NotificacionService
}

func NewCasaService(
	casaRepo *repositories.CasaRepository,
	visitaRepo *repositories.VisitaRepository,
	userRepo *repositories.UserRepository,
	notificacionSvc *NotificacionService,
) *CasaService {
	return &CasaService{
		casaRepo:        casaRepo,
		visitaRepo:      visitaRepo,
		userRepo:        userRepo,
		notificacionSvc: notificacionSvc,
	}
}

func (s *CasaService) Create(ctx context.Context, casa *models.Casa) (*models.Casa, error) {
	// Set defaults
	casa.FechaRegistro = time.Now()
	casa.Estado = models.CasaEstadoNoVisitar

	// Check for duplicates
	isDup, err := s.casaRepo.CheckDuplicateAddress(ctx, casa.CallePrincipal, casa.Numeracion)
	if err != nil {
		return nil, err
	}
	if isDup {
		return nil, ErrDuplicateCasa
	}

	if err := s.casaRepo.Create(ctx, casa); err != nil {
		return nil, err
	}

	// Notify ancianos when a new casa is registered
	if s.notificacionSvc != nil {
		ancianos, err := s.userRepo.List(ctx, ptrRol(models.RolAnciano), ptrBool(true))
		if err == nil {
			var ancianoIDs []uuid.UUID
			for _, a := range ancianos {
				ancianoIDs = append(ancianoIDs, a.ID)
			}
			_ = s.notificacionSvc.Create(ctx, &models.Notificacion{
				Tipo:          models.NotifTipoCasaRegistrada,
				CasaID:        &casa.ID,
				Mensaje:       "Nueva casa registrada: " + casa.CallePrincipal + " " + casa.Numeracion + " - " + casa.Sector,
				Destinatarios: ancianoIDs,
			})
		}
	}

	return casa, nil
}

func (s *CasaService) GetByID(ctx context.Context, id uuid.UUID) (*models.Casa, error) {
	return s.casaRepo.GetByID(ctx, id)
}

func (s *CasaService) GetDetail(ctx context.Context, id uuid.UUID) (*models.CasaDetail, error) {
	casa, err := s.casaRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	visitas, err := s.visitaRepo.GetByCasaID(ctx, id)
	if err != nil {
		return nil, err
	}

	visitasList := make([]models.Visita, 0, len(visitas))
	for _, v := range visitas {
		visitasList = append(visitasList, *v)
	}

	return &models.CasaDetail{
		Casa:    *casa,
		Visitas: visitasList,
	}, nil
}

func (s *CasaService) List(ctx context.Context, sector, estado, search string, page, limit int) ([]*models.Casa, int, error) {
	return s.casaRepo.List(ctx, sector, estado, search, page, limit)
}

func (s *CasaService) Update(ctx context.Context, id uuid.UUID, casa *models.Casa) (*models.Casa, error) {
	existing, err := s.casaRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrCasaNotFound
	}

	// Update fields
	existing.CallePrincipal = casa.CallePrincipal
	existing.Numeracion = casa.Numeracion
	existing.CalleSecundaria = casa.CalleSecundaria
	existing.Sector = casa.Sector
	existing.Referencia = casa.Referencia
	existing.MotivoNoVolver = casa.MotivoNoVolver
	if casa.Estado != "" {
		existing.Estado = casa.Estado
	}

	return s.casaRepo.Update(ctx, id, existing)
}

func (s *CasaService) UpdateEstado(ctx context.Context, id uuid.UUID, estado models.CasaEstado) error {
	return s.casaRepo.UpdateEstado(ctx, id, estado)
}

func (s *CasaService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.casaRepo.Delete(ctx, id)
}

func (s *CasaService) GetSectores(ctx context.Context) ([]string, error) {
	return s.casaRepo.GetSectores(ctx)
}

// Helper functions
func ptrRol(r models.Rol) *models.Rol {
	return &r
}

func ptrBool(b bool) *bool {
	return &b
}
