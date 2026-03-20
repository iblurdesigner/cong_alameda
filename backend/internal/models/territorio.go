package models

import (
	"time"

	"github.com/google/uuid"
)

type Territorio struct {
	ID             uuid.UUID `json:"id" db:"id"`
	GrupoID        uuid.UUID `json:"grupo_id" db:"grupo_id"`
	Nombre         string    `json:"nombre" db:"nombre"`
	ArchivoPDF     string    `json:"archivo_pdf" db:"archivo_pdf"`
	NombreOriginal string    `json:"nombre_original" db:"nombre_original"`
	Tamano         int64     `json:"tamano" db:"tamano"`
	FechaSubida    time.Time `json:"fecha_subida" db:"fecha_subida"`
	SubidoPor      string    `json:"subido_por" db:"subido_por"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// TerritorioDetail incluye info del grupo
type TerritorioDetail struct {
	Territorio
	Grupo *Grupo `json:"grupo,omitempty"`
}
