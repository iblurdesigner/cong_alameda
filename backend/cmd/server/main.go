package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"

	"cong-alameda-backend/internal/config"
	"cong-alameda-backend/internal/database"
	"cong-alameda-backend/internal/handlers"
	"cong-alameda-backend/internal/middleware"
	"cong-alameda-backend/internal/repositories"
	"cong-alameda-backend/internal/services"
	"cong-alameda-backend/pkg/jwt"
)

func main() {
	// Load .env file if exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Connected to database successfully")

	// Initialize JWT manager
	jwtManager := jwt.NewJWTManager(cfg.JWTSecret, cfg.JWTExpiry)

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db.Pool)
	casaRepo := repositories.NewCasaRepository(db.Pool)
	visitaRepo := repositories.NewVisitaRepository(db.Pool)
	notifRepo := repositories.NewNotificacionRepository(db.Pool)

	// Initialize services
	notifService := services.NewNotificacionService(notifRepo)
	casaService := services.NewCasaService(casaRepo, visitaRepo, userRepo, notifService)
	visitaService := services.NewVisitaService(visitaRepo, casaRepo, userRepo, notifService)
	userService := services.NewUserService(userRepo, jwtManager)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userService)
	casaHandler := handlers.NewCasaHandler(casaService)
	visitaHandler := handlers.NewVisitaHandler(visitaService, casaService)
	notifHandler := handlers.NewNotificacionHandler(notifService)
	userHandler := handlers.NewUserHandler(userService)

	// ====== FASE 2: Grupos, Territorios, Semanas ======
	// Initialize Fase 2 repositories
	grupoRepo := repositories.NewGrupoRepository(db.Pool)
	territorioRepo := repositories.NewTerritorioRepository(db.Pool)
	semanaRepo := repositories.NewSemanaRepository(db.Pool)
	diaRepo := repositories.NewDiaSemanaRepository(db.Pool)

	// Initialize Fase 2 services
	grupoService := services.NewGrupoService(grupoRepo, territorioRepo)
	territorioService := services.NewTerritorioService(territorioRepo, grupoRepo)
	semanaService := services.NewSemanaService(semanaRepo, diaRepo)

	// Initialize Fase 2 handlers
	grupoHandler := handlers.NewGrupoHandler(grupoService)
	territorioHandler := handlers.NewTerritorioHandler(territorioService)
	semanaHandler := handlers.NewSemanaHandler(semanaService)

	// ====== FASE 3: Asignaciones Internas ======
	// Initialize Fase 3 repositories
	tipoAsignRepo := repositories.NewTipoAsignacionRepository(db.Pool)
	asignacionRepo := repositories.NewAsignacionRepository(db.Pool)

	// Initialize Fase 3 services
	asignacionService := services.NewAsignacionService(asignacionRepo, tipoAsignRepo, semanaRepo, diaRepo, userRepo)

	// Initialize Fase 3 handlers
	asignacionHandler := handlers.NewAsignacionHandler(asignacionService)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error":   "internal_error",
				"message": err.Error(),
			})
		},
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${method} ${path} - ${latency}\n",
	}))
	app.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "cong-alameda-backend",
		})
	})

	// API routes
	api := app.Group("/api")

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)

	// Protected routes
	protected := api.Group("", authMiddleware.Authenticate())

	// Auth protected routes
	protected.Get("/auth/me", authHandler.GetCurrentUser)

	// Casa routes
	casas := protected.Group("/casas")
	casas.Get("/", casaHandler.List)
	casas.Get("/sectores", casaHandler.GetSectores)
	casas.Get("/:id", casaHandler.GetByID)
	casas.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE"), casaHandler.Create)
	casas.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), casaHandler.Update)
	casas.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), casaHandler.Delete)

	// Visita routes
	visitas := protected.Group("/visitas")
	visitas.Get("/", visitaHandler.List)
	visitas.Get("/stats", visitaHandler.GetStats)
	visitas.Get("/:id", visitaHandler.GetByID)
	visitas.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE"), visitaHandler.Create)
	visitas.Put("/:id", visitaHandler.Update)
	visitas.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), visitaHandler.Delete)

	// Notificacion routes
	notificaciones := protected.Group("/notificaciones")
	notificaciones.Get("/", notifHandler.List)
	notificaciones.Put("/:id/read", notifHandler.MarkAsRead)
	notificaciones.Put("/read-all", notifHandler.MarkAllAsRead)

	// User routes
	users := protected.Group("/users")
	users.Get("/", userHandler.List)
	users.Get("/visitantes", userHandler.GetVisitantes)
	users.Get("/:id", userHandler.GetByID)
	users.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE"), userHandler.Create)
	users.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), userHandler.Update)
	users.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), userHandler.Delete)

	// ====== FASE 2 ROUTES ======

	// Grupo routes
	grupos := protected.Group("/grupos")
	grupos.Get("/", grupoHandler.List)
	grupos.Get("/:id", grupoHandler.GetByID)
	grupos.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE"), grupoHandler.Create)
	grupos.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), grupoHandler.Update)
	grupos.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), grupoHandler.Delete)

	// Territorio routes
	territorios := protected.Group("/territorios")
	territorios.Get("/", territorioHandler.List)
	territorios.Post("/upload", authMiddleware.RequireRole("SUPERINTENDENTE"), territorioHandler.Upload)
	territorios.Get("/:id", territorioHandler.GetByID)
	territorios.Get("/:id/descargar", territorioHandler.Download)
	territorios.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), territorioHandler.Delete)

	// Semana routes
	semanas := protected.Group("/semanas")
	semanas.Get("/", semanaHandler.List)
	semanas.Get("/:id", semanaHandler.GetByID)
	semanas.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE"), semanaHandler.Create)
	semanas.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), semanaHandler.Update)
	semanas.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), semanaHandler.Delete)
	semanas.Get("/:id/dias", semanaHandler.GetDias)

	// Dia routes
	dias := protected.Group("/dias")
	dias.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), semanaHandler.UpdateDia)

	// ====== FASE 3 ROUTES: Asignaciones Internas ======

	// Tipo asignacion routes
	tipos := protected.Group("/tipos-asignacion")
	tipos.Get("/", asignacionHandler.GetTiposAsignacion)

	// Asignacion routes
	asignaciones := protected.Group("/asignaciones")
	asignaciones.Get("/", asignacionHandler.GetByUser)
	asignaciones.Get("/semana/:semanaId", asignacionHandler.GetBySemana)
	asignaciones.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE"), asignacionHandler.Create)
	asignaciones.Post("/bulk", authMiddleware.RequireRole("SUPERINTENDENTE"), asignacionHandler.BulkCreate)
	asignaciones.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), asignacionHandler.Update)
	asignaciones.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE"), asignacionHandler.Delete)

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("Gracefully shutting down...")
		_ = app.Shutdown()
	}()

	// Start server
	addr := ":" + cfg.Port
	log.Printf("Starting server on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
