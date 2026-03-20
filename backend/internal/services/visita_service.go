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
	ErrVisitaNotFound   = errors.New("visita no encontrada")
	ErrInvalidVisitante = errors.New("visitante inválido")
	ErrCasaNoVisitar    = errors.New("la casa no está en estado NO_VISITAR")
)

type VisitaService struct {
	visitaRepo      *repositories.VisitaRepository
	casaRepo        *repositories.CasaRepository
	userRepo        *repositories.UserRepository
	notificacionSvc *NotificacionService
}

func NewVisitaService(
	visitaRepo *repositories.VisitaRepository,
	casaRepo *repositories.CasaRepository,
	userRepo *repositories.UserRepository,
	notificacionSvc *NotificacionService,
) *VisitaService {
	return &VisitaService{
		visitaRepo:      visitaRepo,
		casaRepo:        casaRepo,
		userRepo:        userRepo,
		notificacionSvc: notificacionSvc,
	}
}

func (s *VisitaService) Create(ctx context.Context, visita *models.Visita) (*models.Visita, error) {
	// Verify casa exists and is in correct state
	casa, err := s.casaRepo.GetByID(ctx, visita.CasaID)
	if err != nil {
		return nil, ErrCasaNotFound
	}

	// Verify both visitantes exist and are active
	v1, err := s.userRepo.GetByID(ctx, visita.Visitante1ID)
	if err != nil || !v1.Activo {
		return nil, ErrInvalidVisitante
	}
	v2, err := s.userRepo.GetByID(ctx, visita.Visitante2ID)
	if err != nil || !v2.Activo {
		return nil, ErrInvalidVisitante
	}

	// Set defaults
	visita.Estado = models.VisitaEstadoProgramada

	if err := s.visitaRepo.Create(ctx, visita); err != nil {
		return nil, err
	}

	// Update casa estado
	if err := s.casaRepo.UpdateEstado(ctx, casa.ID, models.CasaEstadoEnEsperaVisita); err != nil {
		return nil, err
	}

	// Notify visitantes
	if s.notificacionSvc != nil {
		_ = s.notificacionSvc.Create(ctx, &models.Notificacion{
			Tipo:          models.NotifTipoVisitaProgramada,
			CasaID:        &visita.CasaID,
			Mensaje:       "Se te ha asignado una visita para el " + visita.FechaProgramada.Format("02/01/2006") + ". Dirección: " + casa.CallePrincipal + " " + casa.Numeracion,
			Destinatarios: []uuid.UUID{visita.Visitante1ID, visita.Visitante2ID},
		})
	}

	return visita, nil
}

func (s *VisitaService) GetByID(ctx context.Context, id uuid.UUID) (*models.Visita, error) {
	return s.visitaRepo.GetByID(ctx, id)
}

func (s *VisitaService) GetDetail(ctx context.Context, id uuid.UUID) (*models.VisitaDetail, error) {
	visita, err := s.visitaRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	casa, _ := s.casaRepo.GetByID(ctx, visita.CasaID)
	v1, _ := s.userRepo.GetByID(ctx, visita.Visitante1ID)
	v2, _ := s.userRepo.GetByID(ctx, visita.Visitante2ID)

	return &models.VisitaDetail{
		Visita:     *visita,
		Casa:       casa,
		Visitante1: v1,
		Visitante2: v2,
	}, nil
}

func (s *VisitaService) List(ctx context.Context, casaID *uuid.UUID, estado string, page, limit int) ([]*models.Visita, int, error) {
	return s.visitaRepo.List(ctx, casaID, estado, page, limit)
}

func (s *VisitaService) GetByCasaID(ctx context.Context, casaID uuid.UUID) ([]*models.Visita, error) {
	return s.visitaRepo.GetByCasaID(ctx, casaID)
}

func (s *VisitaService) Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.Visita, error) {
	visita, err := s.visitaRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrVisitaNotFound
	}

	updated, err := s.visitaRepo.Update(ctx, id, updates)
	if err != nil {
		return nil, err
	}

	// Handle special logic when visita is completed
	if estado, ok := updates["estado"].(string); ok && estado == string(models.VisitaEstadoRealizada) {
		if deseaRecibir, ok := updates["desea_seguir_recibiendo"].(bool); ok && deseaRecibir {
			// Update casa to RECONTACTADA and notify ancianos
			_ = s.casaRepo.UpdateEstado(ctx, visita.CasaID, models.CasaEstadoRecontactada)

			if s.notificacionSvc != nil {
				casa, _ := s.casaRepo.GetByID(ctx, visita.CasaID)
				ancianos, _ := s.userRepo.List(ctx, ptrRol(models.RolAnciano), ptrBool(true))
				var ancianoIDs []uuid.UUID
				for _, a := range ancianos {
					ancianoIDs = append(ancianoIDs, a.ID)
				}
				if casa != nil {
					_ = s.notificacionSvc.Create(ctx, &models.Notificacion{
						Tipo:          models.NotifTipoPersonaRequiereVisita,
						CasaID:        &visita.CasaID,
						Mensaje:       "La persona en " + casa.CallePrincipal + " " + casa.Numeracion + " desea recibir visitas nuevamente.",
						Destinatarios: ancianoIDs,
					})
				}
			}
		}
	}

	return updated, nil
}

func (s *VisitaService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.visitaRepo.Delete(ctx, id)
}

func (s *VisitaService) GetVisitasPorVisitante(ctx context.Context, visitanteID uuid.UUID) ([]*models.Visita, error) {
	return s.visitaRepo.GetVisitasPorVisitante(ctx, visitanteID)
}

func (s *VisitaService) GetStats(ctx context.Context) (*VisitaStats, error) {
	// Get basic stats
	_, totalCasas, err := s.casaRepo.List(ctx, "", "", "", 1, 1)
	if err != nil {
		return nil, err
	}

	// Count by estado
	noVisitar, _, _ := s.casaRepo.List(ctx, "", string(models.CasaEstadoNoVisitar), "", 1, 1)
	enEspera, _, _ := s.casaRepo.List(ctx, "", string(models.CasaEstadoEnEsperaVisita), "", 1, 1)
	recontactadas, _, _ := s.casaRepo.List(ctx, "", string(models.CasaEstadoRecontactada), "", 1, 1)
	activas, _, _ := s.casaRepo.List(ctx, "", string(models.CasaEstadoActiva), "", 1, 1)

	// Get visitas del mes
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, -1)

	visitasDelMes, _, _ := s.visitaRepo.List(ctx, nil, string(models.VisitaEstadoProgramada), 1, 100)
	var visitasProgramadas int
	for _, v := range visitasDelMes {
		if v.FechaProgramada.After(startOfMonth) && v.FechaProgramada.Before(endOfMonth) {
			visitasProgramadas++
		}
	}

	return &VisitaStats{
		TotalCasas:         totalCasas,
		CasasNoVisitar:     len(noVisitar),
		CasasEnEspera:      len(enEspera),
		CasasRecontactadas: len(recontactadas),
		CasasActivas:       len(activas),
		VisitasMes:         visitasProgramadas,
	}, nil
}

type VisitaStats struct {
	TotalCasas         int `json:"total_casas"`
	CasasNoVisitar     int `json:"casas_no_visitar"`
	CasasEnEspera      int `json:"casas_en_espera"`
	CasasRecontactadas int `json:"casas_recontactadas"`
	CasasActivas       int `json:"casas_activas"`
	VisitasMes         int `json:"visitas_mes"`
}
