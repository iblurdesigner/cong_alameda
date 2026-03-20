package services

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"

	"cong-alameda-backend/internal/models"
	"cong-alameda-backend/internal/repositories"
)

const (
	MaxFileSize = 10 * 1024 * 1024 // 10MB
	UploadDir   = "./uploads/territorios"
)

type TerritorioService struct {
	territorioRepo *repositories.TerritorioRepository
	grupoRepo      *repositories.GrupoRepository
}

func NewTerritorioService(territorioRepo *repositories.TerritorioRepository, grupoRepo *repositories.GrupoRepository) *TerritorioService {
	return &TerritorioService{
		territorioRepo: territorioRepo,
		grupoRepo:      grupoRepo,
	}
}

func (s *TerritorioService) Upload(ctx context.Context, grupoID uuid.UUID, filename string, fileReader io.Reader, size int64, subidoPor string) (*models.Territorio, error) {
	// Validate file size
	if size > MaxFileSize {
		return nil, fmt.Errorf("el archivo excede el tamaño máximo de 10MB")
	}

	// Verify grupo exists
	_, err := s.grupoRepo.GetByID(ctx, grupoID)
	if err != nil {
		return nil, fmt.Errorf("grupo no encontrado")
	}

	// Create upload directory if not exists
	grupoDir := filepath.Join(UploadDir, grupoID.String())
	if err := os.MkdirAll(grupoDir, 0755); err != nil {
		return nil, fmt.Errorf("error al crear directorio: %w", err)
	}

	// Generate unique filename
	territorioID := uuid.New()
	ext := filepath.Ext(filename)
	savedFilename := territorioID.String() + ext
	filePath := filepath.Join(grupoDir, savedFilename)

	// Save file
	file, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("error al guardar archivo: %w", err)
	}
	defer file.Close()

	if _, err := io.Copy(file, fileReader); err != nil {
		os.Remove(filePath)
		return nil, fmt.Errorf("error al escribir archivo: %w", err)
	}

	// Create database record
	territorio := &models.Territorio{
		GrupoID:        grupoID,
		Nombre:         filename,
		ArchivoPDF:     filePath,
		NombreOriginal: filename,
		Tamano:         size,
		SubidoPor:      subidoPor,
	}

	if err := s.territorioRepo.Create(ctx, territorio); err != nil {
		os.Remove(filePath)
		return nil, err
	}

	return territorio, nil
}

func (s *TerritorioService) GetByID(ctx context.Context, id uuid.UUID) (*models.Territorio, error) {
	return s.territorioRepo.GetByID(ctx, id)
}

func (s *TerritorioService) ListByGrupo(ctx context.Context, grupoID *uuid.UUID) ([]*models.Territorio, error) {
	return s.territorioRepo.ListByGrupo(ctx, grupoID)
}

func (s *TerritorioService) Delete(ctx context.Context, id uuid.UUID) error {
	territorio, err := s.territorioRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Delete file from disk
	os.Remove(territorio.ArchivoPDF)

	// Delete from database
	return s.territorioRepo.Delete(ctx, id)
}

func (s *TerritorioService) GetFilePath(territorio *models.Territorio) string {
	return territorio.ArchivoPDF
}
