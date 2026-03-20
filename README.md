# App Congregación Alameda

Sistema de gestión para el Cuerpo de Ancianos de la Congregación Alameda.

## 📋 Descripción General

App web para administrar las actividades del superintendente de servicio, incluyendo registro de casas con motivo "no visitar", visitas anuales de verificación, grupos de predicación con territorios PDF, y asignaciones internas.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                               │
│                    Angular 17+ (SPA)                            │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│   │Dashboard│ │ Casas  │ │ Visitas│ │ Grupos  │ │Semanas  │ │
│   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ │
│        └────────────┴────────────┴───────────┴────────────┘     │
│                       Angular Services + Signals                │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS (REST API)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
│                      Go Fiber v2                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Handlers Layer                          │ │
│  │  Auth | Casa | Visita | Grupo | Territorio | Semana | Notif │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Services Layer                         │ │
│  │  Auth | Casa | Visita | Grupo | Territorio | Semana     │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   Repositories Layer                        │ │
│  │  User | Casa | Visita | Grupo | Territorio | Semana       │ │
│  └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                 │
│                       PostgreSQL 15                             │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│   │  users  │ │  casas  │ │ visitas │ │ grupos  │ │territ. │ │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
cong_alameda/
│
├── docker-compose.yml           # Orquestación completa (DB + API + Frontend)
├── README.md                   # Este archivo
│
├── backend/                    # API REST (Go + Fiber)
│   ├── cmd/
│   │   └── server/
│   │       └── main.go        # Entry point, routing, middleware
│   │
│   ├── internal/
│   │   ├── config/           # Configuración de entorno
│   │   ├── database/         # Conexión PostgreSQL
│   │   ├── dto/             # DTOs request/response
│   │   ├── handlers/        # HTTP handlers
│   │   │   ├── auth_handler.go
│   │   │   ├── casa_handler.go
│   │   │   ├── visita_handler.go
│   │   │   ├── grupo_handler.go
│   │   │   ├── territorio_handler.go
│   │   │   ├── semana_handler.go
│   │   │   ├── notificacion_handler.go
│   │   │   └── user_handler.go
│   │   ├── middleware/      # JWT auth, CORS, logging
│   │   ├── models/          # Entidades de dominio
│   │   │   ├── user.go
│   │   │   ├── casa.go
│   │   │   ├── visita.go
│   │   │   ├── grupo.go
│   │   │   ├── territorio.go
│   │   │   ├── semana_visita.go
│   │   │   ├── dia_semana.go
│   │   │   └── notificacion.go
│   │   ├── repositories/    # Acceso a datos
│   │   │   ├── user_repo.go
│   │   │   ├── casa_repo.go
│   │   │   ├── visita_repo.go
│   │   │   ├── grupo_repo.go
│   │   │   ├── territorio_repo.go
│   │   │   ├── semana_repo.go
│   │   │   ├── dia_semana_repo.go
│   │   │   └── notificacion_repo.go
│   │   └── services/        # Lógica de negocio
│   │       ├── user_service.go
│   │       ├── casa_service.go
│   │       ├── visita_service.go
│   │       ├── grupo_service.go
│   │       ├── territorio_service.go
│   │       ├── semana_service.go
│   │       └── notificacion_service.go
│   │
│   ├── migrations/          # Schema de base de datos
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_seed_data.sql
│   │   └── 003_grupos_territorios.sql
│   │
│   ├── pkg/
│   │   └── jwt/             # Utilidades JWT
│   │       └── jwt.go
│   │
│   ├── uploads/             # Archivos PDF subidos
│   │   └── territorios/
│   │
│   ├── Dockerfile
│   ├── go.mod
│   └── .env.example
│
└── frontend/                 # SPA (Angular 17+)
    ├── src/
    │   ├── app/
    │   │   ├── core/       # Servicios singleton, guards
    │   │   │   ├── services/
    │   │   │   │   ├── auth.service.ts
    │   │   │   │   ├── casa.service.ts
    │   │   │   │   ├── visita.service.ts
    │   │   │   │   ├── notification.service.ts
    │   │   │   │   ├── grupo.service.ts
    │   │   │   │   ├── territorio.service.ts
    │   │   │   │   └── semana.service.ts
    │   │   │   ├── guards/
    │   │   │   │   └── auth.guard.ts
    │   │   │   └── interceptors/
    │   │   │       └── auth.interceptor.ts
    │   │   │
    │   │   ├── shared/     # Componentes compartidos
    │   │   │   ├── components/
    │   │   │   │   ├── navbar/
    │   │   │   │   └── notification-badge/
    │   │   │   └── pipes/
    │   │   │
    │   │   └── features/   # Módulos de funcionalidad
    │   │       ├── auth/login/
    │   │       ├── dashboard/
    │   │       ├── casas/ (list, detail, form)
    │   │       ├── visitas/
    │   │       ├── grupos/
    │   │       ├── territorios/
    │   │       ├── semanas/
    │   │       └── notifications/
    │   │
    │   ├── environments/
    │   ├── styles.scss
    │   └── index.html
    │
    ├── Dockerfile (nginx)
    ├── nginx.conf
    ├── angular.json
    ├── package.json
    └── tsconfig.json
```

---

## 📊 Modelo de Datos

### Fase 1: Superintendente Servicio

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  users   │     │  casas   │     │  visitas  │
├──────────┤     ├──────────┤     ├──────────┤
│ id (PK)  │     │ id (PK)  │     │ id (PK)  │
│ nombre   │     │ direccion│     │ casa_id   │──┐
│ email    │     │ sector   │◀────│ fecha_prog│  │
│ password │     │ motivo   │     │ visitante1│  │
│ rol      │     │ estado   │     │ visitante2│  │
│ activo   │     │ fecha_reg│     │ observac. │  │
└──────────┘     └──────────┘     └──────────┘  │
      │                │               │        │
      └────────────────┴───────────────┘        │
                        │                     │
                  ┌─────────────┐              │
                  │notificaciones│             │
                  ├─────────────┤              │
                  │ id (PK)     │              │
                  │ tipo        │◀─────────────┘
                  │ casa_id    │   (FK nullable)
                  │ destinatari│
                  │ mensaje     │
                  │ leida      │
                  └─────────────┘
```

### Fase 2: Grupos y Territorios

```
┌──────────┐     ┌─────────────┐     ┌──────────┐
│  grupos  │ 1:N │ territorios │     │semanas_vis│
├──────────┤◀────│├─────────────┤     ├──────────┤
│ id (PK)  │     │ id (PK)     │     │ id (PK)  │
│ nombre   │     │ grupo_id (FK)│     │ fecha_ini│
│ numero   │     │ nombre       │     │ fecha_fin│
│ descrip. │     │ archivo_pdf  │     │ nombre   │
│ activo   │     │ nombre_orig  │     └────┬─────┘
└──────────┘     └─────────────┘          │ 1:N
                                          │
                                    ┌─────┴─────┐
                                    │ dias_semana│
                                    ├────────────┤
                                    │ id (PK)   │
                                    │ semana_id │
                                    │ dia_semana│ (0-6)
                                    │ territorio_m│
                                    │ territorio_t│
                                    │ grupo_asig │
                                    └────────────┘
```

---

## 🔌 API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login con email/password |
| GET | `/api/auth/me` | Usuario actual (JWT) |

### Casas (Fase 1)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/casas` | Listar casas (filtros: sector, estado, search) |
| POST | `/api/casas` | Crear casa (SUPERINTENDENTE) |
| GET | `/api/casas/:id` | Detalle casa |
| PUT | `/api/casas/:id` | Actualizar casa (SUPERINTENDENTE) |
| DELETE | `/api/casas/:id` | Eliminar casa (SUPERINTENDENTE) |
| GET | `/api/casas/sectores` | Lista de sectores únicos |

### Visitas (Fase 1)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/visitas` | Listar visitas |
| POST | `/api/visitas` | Crear visita (SUPERINTENDENTE) |
| GET | `/api/visitas/:id` | Detalle visita |
| PUT | `/api/visitas/:id` | Actualizar (resultado) |
| DELETE | `/api/visitas/:id` | Eliminar visita |
| GET | `/api/visitas/stats` | Dashboard stats |

### Grupos (Fase 2)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/grupos` | Listar grupos con conteo de territorios |
| POST | `/api/grupos` | Crear grupo (SUPERINTENDENTE) |
| GET | `/api/grupos/:id` | Detalle con territorios |
| PUT | `/api/grupos/:id` | Actualizar grupo |
| DELETE | `/api/grupos/:id` | Eliminar (soft delete) |

### Territorios (Fase 2)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/territorios` | Listar territorios (filtro: grupo_id) |
| POST | `/api/territorios/upload` | Subir PDF (multipart) |
| GET | `/api/territorios/:id` | Detalle territorio |
| GET | `/api/territorios/:id/descargar` | Descargar PDF |
| DELETE | `/api/territorios/:id` | Eliminar territorio |

### Semanas (Fase 2)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/semanas` | Listar semanas |
| POST | `/api/semanas` | Crear semana (genera 7 días) |
| GET | `/api/semanas/:id` | Detalle con días |
| PUT | `/api/semanas/:id` | Actualizar semana |
| DELETE | `/api/semanas/:id` | Eliminar semana |
| GET | `/api/semanas/:id/dias` | Lista de días |
| PUT | `/api/dias/:id` | Actualizar día (asignar territorios) |

### Notificaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notificaciones` | Lista notificaciones usuario |
| PUT | `/api/notificaciones/:id/read` | Marcar como leída |
| PUT | `/api/notificaciones/read-all` | Marcar todas como leídas |

### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar usuarios |
| GET | `/api/users/visitantes` | Solo visitantes (para asignar) |
| GET | `/api/users/:id` | Detalle usuario |
| POST | `/api/users` | Crear usuario (SUPERINTENDENTE) |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

---

## 🔐 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **SUPERINTENDENTE** | CRUD completo: casas, visitas, grupos, territorios, semanas, usuarios |
| **ANCIANO** | Ver casas, visitas, grupos. Recibir notificaciones |
| **VISITANTE** | Ver sus visitas asignadas. Actualizar resultado de sus visitas |

---

## 🚀 Instalación y Uso

### Opción 1: Docker Compose (Recomendado)

```bash
# Clonar o navegar al directorio del proyecto
cd E:\AI_apps\cong_alameda

# Iniciar todos los servicios
docker-compose up -d

# La aplicación estará disponible en:
# - Frontend: http://localhost:4200
# - Backend API: http://localhost:8080
```

### Opción 2: Desarrollo Local

**Backend (Go):**
```bash
cd backend

# Instalar dependencias
go mod tidy

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# Ejecutar migraciones en PostgreSQL manualmente
# Luego ejecutar:
go run ./cmd/server

# El API estará en http://localhost:8080
```

**Frontend (Angular):**
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Abrir http://localhost:4200
```

---

## 🔑 Credenciales de Prueba

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Juan Superintendente | superintendente@iglesia.org | password123 | SUPERINTENDENTE |
| Pedro Anciano | anciano1@iglesia.org | password123 | ANCIANO |
| Carlos Visitante | visitante1@iglesia.org | password123 | VISITANTE |

> ⚠️ Cambiar contraseñas en producción!

---

## 📱 Funcionalidades por Fase

### Fase 1: Superintendente Servicio ✅
- [x] Registro de casas con motivo "no visitar"
- [x] Programación de visitas anuales
- [x] Asignación de 2 visitantes por casa
- [x] Registro de observaciones post-visita
- [x] Notificaciones in-app
- [x] Dashboard con estadísticas
- [x] Filtros por sector y estado

### Fase 2: Visita Superintendente 🔄 (En desarrollo)
- [x] Sección Grupos (5 grupos de predicación)
- [ ] Subir archivos PDF de territorios
- [ ] Descargar territorios por día
- [ ] Sección "Semana Visita"
- [ ] Programación semanal con territorios por día

### Fase 3: Asignaciones Internas 📋 (Pendiente)
- [ ] Cronograma de asignaciones semanales
- [ ] Roles: acomodadores salón, parqueadero, micrófono, plataforma
- [ ] Notificaciones WhatsApp cada lunes

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Frontend | Angular | 17+ |
| Backend | Go | 1.21+ |
| Framework API | Fiber | v2.52 |
| Base de Datos | PostgreSQL | 15 |
| ORM | pgx/v5 | - |
| Auth | JWT | v5 |
| Frontend Server | nginx | alpine |
| Container | Docker Compose | 3.8 |

---

## 📐 Decisiones de Diseño

### Arquitectura
- **Clean Architecture** con separación en handlers → services → repositories
- **JWT stateless** para autenticación (mejor para SPAs)
- **Angular Signals** para estado local (más simple que NgRx para este caso)

### Base de Datos
- **PostgreSQL** para relaciones complejas y escalabilidad
- **Soft delete** para grupos (mantiene integridad referencial)
- **UUIDs** como primary keys

### Archivos
- **Almacenamiento local** para PDFs (uploads/)
- **Max 10MB** por archivo
- **Solo PDF** permitido

---

## 🔧 Configuración de Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgres://app:password123@localhost:5432/cong_alameda?sslmode=disable

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY_HOURS=24

# Server
PORT=8080
ENV=development

# CORS
FRONTEND_URL=http://localhost:4200
```

### Docker Compose

```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/cong_alameda
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: "http://localhost:4200"
```

---

## 📝 Flujos de Negocio

### Registro de Casa "No Visitar"

```
1. Superintendente completa formulario
   ├── Calle principal, numeración
   ├── Calle secundaria (opcional)
   ├── Sector
   ├── Referencia (opcional)
   └── Motivo "no visitar" (requerido)

2. Sistema guarda casa
   └── Estado inicial: "NO_VISITAR"

3. Sistema notifica a Ancianos (in-app)
```

### Visita Anual de Verificación

```
1. Superintendente programa visita
   ├── Selecciona casa
   ├── Asigna fecha
   └── Asigna 2 visitantes

2. Sistema actualiza estado: "EN_ESPERA_VISITA"

3. Visitantes reciben notificación

4. Visitantes van a la casa
   ├── Registran observaciones
   └── Marcan resultado:
       ├── SI quiere visitas → Estado: RECONTACTADA
       └── NO quiere visitas → Mantener NO_VISITAR
```

### Subir Territorio PDF

```
1. Superintendente selecciona grupo
2. Sube archivo PDF (max 10MB)
3. Sistema guarda:
   ├── Metadata en PostgreSQL
   └── Archivo en ./uploads/territorios/{grupo_id}/
```

---

## 🎯 Roadmap

```
Fase 1 ✅  Superintendente Servicio
         ├── Registro casas
         ├── Visitas anuales
         └── Notificaciones in-app

Fase 2 🔄  Visita Superintendente
         ├── Grupos (5 grupos)
         ├── Territorios PDF
         ├── Semanas de visita
         └── Descarga por día

Fase 3 📋  Asignaciones Internas
         ├── Acomodadores
         ├── Microfono, plataforma
         └── WhatsApp
```

---

## 📄 Licencia

Este proyecto es privado para uso de la Congregación Alameda.

---

## 👤 Autor

Desarrollado con ❤️ para el Cuerpo de Ancianos.

---

*Última actualización: Marzo 2026*
