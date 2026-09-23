package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/dto"
	"cong-alameda-backend/internal/models"
)

type programaVyMRepo interface {
	Upsert(ctx context.Context, p *models.ProgramaVyM) (*models.ProgramaVyM, error)
	GetBySemanaID(ctx context.Context, semanaID uuid.UUID) (*models.ProgramaVyM, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type ProgramaVyMService struct {
	repo programaVyMRepo
}

func NewProgramaVyMService(repo programaVyMRepo) *ProgramaVyMService {
	return &ProgramaVyMService{repo: repo}
}

func (s *ProgramaVyMService) Upsert(ctx context.Context, semanaID uuid.UUID, req *dto.UpsertProgramaVyMRequest) (*dto.ProgramaVyMResponse, error) {
	if semanaID == uuid.Nil {
		return nil, fmt.Errorf("semana_id no puede ser nulo")
	}

	nombreCong := req.NombreCongregacion
	if nombreCong == "" {
		nombreCong = "ALAMEDA"
	}

	// Default empty JSON arrays if nil or empty
	auditorio := req.SeamosMaestrosAuditorio
	if len(auditorio) == 0 {
		auditorio = json.RawMessage(`[]`)
	}
	auxiliar := req.SeamosMaestrosAuxiliar
	if len(auxiliar) == 0 {
		auxiliar = json.RawMessage(`[]`)
	}
	vida := req.VidaCristianaPartes
	if len(vida) == 0 {
		vida = json.RawMessage(`[]`)
	}

	p := &models.ProgramaVyM{
		SemanaID:                semanaID,
		NombreCongregacion:      nombreCong,
		LecturaSemanal:          req.LecturaSemanal,
		Presidente:              req.Presidente,
		ConsejeroAuxiliar:       req.ConsejeroAuxiliar,
		CancionInicio:           req.CancionInicio,
		HoraCancionInicio:       req.HoraCancionInicio,
		OracionInicio:           req.OracionInicio,
		HoraOracionInicio:       req.HoraOracionInicio,
		TesorosTitulo:           req.TesorosTitulo,
		TesorosTiempo:           req.TesorosTiempo,
		TesorosDiscursante:      req.TesorosDiscursante,
		PerlasTiempo:            req.PerlasTiempo,
		PerlasDiscursante:       req.PerlasDiscursante,
		LecturaTiempo:           req.LecturaTiempo,
		LecturaEstudiante:       req.LecturaEstudiante,
		CancionMedio:            req.CancionMedio,
		CancionMedioTiempo:      req.CancionMedioTiempo,
		EstudioConductor:        req.EstudioConductor,
		EstudioLector:           req.EstudioLector,
		EstudioTiempo:           req.EstudioTiempo,
		ConclusionTiempo:        req.ConclusionTiempo,
		CancionFin:              req.CancionFin,
		CancionFinTiempo:        req.CancionFinTiempo,
		OracionFin:              req.OracionFin,
		SeamosMaestrosAuditorio: auditorio,
		SeamosMaestrosAuxiliar:  auxiliar,
		VidaCristianaPartes:     vida,
	}

	saved, err := s.repo.Upsert(ctx, p)
	if err != nil {
		return nil, err
	}

	return s.toResponse(saved), nil
}

func (s *ProgramaVyMService) GetBySemanaID(ctx context.Context, semanaID uuid.UUID) (*dto.ProgramaVyMResponse, error) {
	p, err := s.repo.GetBySemanaID(ctx, semanaID)
	if err != nil {
		return nil, err
	}
	return s.toResponse(p), nil
}

func (s *ProgramaVyMService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *ProgramaVyMService) toResponse(p *models.ProgramaVyM) *dto.ProgramaVyMResponse {
	return &dto.ProgramaVyMResponse{
		ID:                      p.ID,
		SemanaID:                p.SemanaID,
		NombreCongregacion:      p.NombreCongregacion,
		LecturaSemanal:          p.LecturaSemanal,
		Presidente:              p.Presidente,
		ConsejeroAuxiliar:       p.ConsejeroAuxiliar,
		CancionInicio:           p.CancionInicio,
		HoraCancionInicio:       p.HoraCancionInicio,
		OracionInicio:           p.OracionInicio,
		HoraOracionInicio:       p.HoraOracionInicio,
		TesorosTitulo:           p.TesorosTitulo,
		TesorosTiempo:           p.TesorosTiempo,
		TesorosDiscursante:      p.TesorosDiscursante,
		PerlasTiempo:            p.PerlasTiempo,
		PerlasDiscursante:       p.PerlasDiscursante,
		LecturaTiempo:           p.LecturaTiempo,
		LecturaEstudiante:       p.LecturaEstudiante,
		CancionMedio:            p.CancionMedio,
		CancionMedioTiempo:      p.CancionMedioTiempo,
		EstudioConductor:        p.EstudioConductor,
		EstudioLector:           p.EstudioLector,
		EstudioTiempo:           p.EstudioTiempo,
		ConclusionTiempo:        p.ConclusionTiempo,
		CancionFin:              p.CancionFin,
		CancionFinTiempo:        p.CancionFinTiempo,
		OracionFin:              p.OracionFin,
		SeamosMaestrosAuditorio: p.SeamosMaestrosAuditorio,
		SeamosMaestrosAuxiliar:  p.SeamosMaestrosAuxiliar,
		VidaCristianaPartes:     p.VidaCristianaPartes,
		CreatedAt:               p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:               p.UpdatedAt.Format(time.RFC3339),
	}
}
