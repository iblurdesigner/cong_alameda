# Technical Design: Directorio de Publicadores

## Architecture & Data Model

### 1. Database Schema (`022_publicadores.sql`)
```sql
CREATE TABLE IF NOT EXISTS publicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombres VARCHAR(150) NOT NULL DEFAULT '',
    apellidos VARCHAR(150) NOT NULL DEFAULT '',
    celular VARCHAR(50),
    telefono VARCHAR(50),
    email VARCHAR(255),
    domicilio TEXT,
    grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL,
    contacto_emergencia_nombre VARCHAR(255),
    contacto_emergencia_telefono VARCHAR(50),
    contacto_emergencia_parentesco VARCHAR(100),
    observaciones TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_publicadores_apellidos ON publicadores(apellidos);
CREATE INDEX IF NOT EXISTS idx_publicadores_nombres ON publicadores(nombres);
CREATE INDEX IF NOT EXISTS idx_publicadores_celular ON publicadores(celular);
CREATE INDEX IF NOT EXISTS idx_publicadores_grupo_id ON publicadores(grupo_id);
CREATE INDEX IF NOT EXISTS idx_publicadores_activo ON publicadores(activo);
```

### 2. Backend Architecture (Go / Fiber)
- **Model** (`backend/internal/models/publicador.go`):
  - Struct `Publicador` con tags `json` y `db`.
  - Validación básica (nombre obligatorio).
- **Repository** (`backend/internal/repositories/publicador_repo.go`):
  - `Create(ctx, p *Publicador) error`
  - `GetByID(ctx, id uuid.UUID) (*Publicador, error)`
  - `List(ctx, query string, activoOnly bool) ([]Publicador, error)`
  - `Update(ctx, p *Publicador) error`
  - `Delete(ctx, id uuid.UUID) error` (baja lógica o física segura)
- **Service** (`backend/internal/services/publicador_service.go`):
  - Inyección de dependencias, lógica de negocio y sanitización de datos.
- **Handler** (`backend/internal/handlers/publicador_handler.go`):
  - `GET /api/v1/publicadores`
  - `GET /api/v1/publicadores/:id`
  - `POST /api/v1/publicadores`
  - `PUT /api/v1/publicadores/:id`
  - `DELETE /api/v1/publicadores/:id`
- **Routing** (`backend/cmd/server/main.go`):
  - Registro de rutas bajo `/api/v1/publicadores` protegido con middleware JWT.

### 3. Frontend Architecture (Angular 21)
- **Core Service** (`frontend/src/app/core/services/publicador.service.ts`):
  - Signals reactivos (`publicadores = signal<Publicador[]>([])`, `loading = signal<boolean>(false)`).
  - Métodos HTTP REST para interactuar con la API.
- **Feature Component** (`frontend/src/app/features/admin/publicadores/publicadores.component.ts`):
  - Container/Presentational pattern.
  - Signal-based search filtering (`searchTerm`, `filterActivo`).
  - Formulario reactivo o template-driven para altas y modificaciones.
  - Modal accesible para creación y edición.
  - Diseño responsivo con soporte total para tema claro y tema oscuro (`[data-theme="dark"]`).
- **Routing** (`frontend/src/app/app.routes.ts`):
  - Ruta `admin/publicadores` con lazy loading y guard `authGuard` / `roleGuard`.
