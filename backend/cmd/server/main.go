package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

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

	// Initialize email service, rate limiter, and notification service
	emailService := services.NewConsoleEmailService(cfg.FrontendURL)
	rateLimiter := services.NewRateLimiter(5 * time.Minute)

	emailConfig := services.EmailConfig{
		SMTPHost:     cfg.SMTPHost,
		SMTPPort:     cfg.SMTPPort,
		SMTPUsername: cfg.SMTPUsername,
		SMTPPassword: cfg.SMTPPassword,
		FromEmail:    cfg.FromEmail,
		FromName:     cfg.FromName,
		Enabled:      cfg.SMTPEnabled,
	}
	services.InitNotificationService(emailConfig)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userService, jwtManager, emailService, rateLimiter)
	casaHandler := handlers.NewCasaHandler(casaService, userService)
	visitaHandler := handlers.NewVisitaHandler(visitaService, casaService, userService)
	notifHandler := handlers.NewNotificacionHandler(notifService, userService, casaService)
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

	// Initialize ProgramaPredicacion repo, service, handler
	programaPredicacionRepo := repositories.NewProgramaPredicacionRepository(db.Pool)
	programaPredicacionService := services.NewProgramaPredicacionService(programaPredicacionRepo, grupoRepo, territorioRepo)
	programaPredicacionHandler := handlers.NewProgramaPredicacionHandler(programaPredicacionService)

	// Initialize ProgramaVisita repo, service, handler
	programaVisitaRepo := repositories.NewProgramaVisitaRepository(db.Pool)
	programaVisitaService := services.NewProgramaVisitaService(programaVisitaRepo, programaPredicacionRepo, grupoRepo, territorioRepo)
	programaVisitaHandler := handlers.NewProgramaVisitaHandler(programaVisitaService)

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
	auth.Post("/recover-request", authHandler.RequestRecovery)
	auth.Post("/recover-password", authHandler.ResetPassword)

	// Protected routes
	protected := api.Group("", authMiddleware.Authenticate())

	// Auth protected routes
	protected.Get("/auth/me", authHandler.GetCurrentUser)

	// Casa routes
	casas := protected.Group("/casas")
	casas.Get("/", casaHandler.List)
	casas.Get("/sectores", casaHandler.GetSectores)
	casas.Get("/:id", casaHandler.GetByID)
	casas.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), casaHandler.Create)
	casas.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), casaHandler.Update)
	casas.Post("/:id/foto", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), casaHandler.UploadFoto)
	casas.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), casaHandler.Delete)

	// Visita routes
	visitas := protected.Group("/visitas")
	visitas.Get("/", visitaHandler.List)
	visitas.Get("/stats", visitaHandler.GetStats)
	visitas.Get("/:id", visitaHandler.GetByID)
	visitas.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), visitaHandler.Create)
	visitas.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), visitaHandler.Update)
	visitas.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), visitaHandler.Delete)

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
	users.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), userHandler.Create)
	users.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), userHandler.Update)
	users.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), userHandler.Delete)

	// ====== FASE 2 ROUTES ======

	// Grupo routes
	grupos := protected.Group("/grupos")
	grupos.Get("/", grupoHandler.List)
	grupos.Get("/:id", grupoHandler.GetByID)
	grupos.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), grupoHandler.Create)
	grupos.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), grupoHandler.Update)
	grupos.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), grupoHandler.Delete)

	// Territorio routes
	territorios := protected.Group("/territorios")
	territorios.Get("/", territorioHandler.List)
	territorios.Post("/upload", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), territorioHandler.Upload)
	territorios.Get("/:id", territorioHandler.GetByID)
	territorios.Get("/:id/descargar", territorioHandler.Download)
	territorios.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), territorioHandler.Delete)

	// Semana routes
	semanas := protected.Group("/semanas")
	semanas.Get("/", semanaHandler.List)
	semanas.Get("/:id", semanaHandler.GetByID)
	semanas.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), semanaHandler.Create)
	semanas.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), semanaHandler.Update)
	semanas.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), semanaHandler.Delete)
	semanas.Get("/:id/dias", semanaHandler.GetDias)

	// Dia routes
	dias := protected.Group("/dias")
	dias.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), semanaHandler.UpdateDia)

	// ====== FASE 3 ROUTES: Asignaciones Internas ======

	// Tipo asignacion routes
	tipos := protected.Group("/tipos-asignacion")
	tipos.Get("/", asignacionHandler.GetTiposAsignacion)

	// Asignacion routes
	asignaciones := protected.Group("/asignaciones")
	asignaciones.Get("/", asignacionHandler.GetByUser)
	asignaciones.Get("/semana/:semanaId", asignacionHandler.GetBySemana)
	asignaciones.Post("/", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), asignacionHandler.Create)
	asignaciones.Post("/bulk", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), asignacionHandler.BulkCreate)
	asignaciones.Put("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), asignacionHandler.Update)
	asignaciones.Delete("/:id", authMiddleware.RequireRole("SUPERINTENDENTE", "SUPER_ADMIN"), asignacionHandler.Delete)

	// ====== PROGRAMA PREDICACION ROUTES ======

	// Programa de Predicación routes
	programas := protected.Group("/programas-predicacion")
	programas.Get("/", programaPredicacionHandler.List)
	programas.Get("/:id", programaPredicacionHandler.GetByID)
	programas.Post("/", authMiddleware.RequireRole("SUPER_ADMIN", "SUPERINTENDENTE"), programaPredicacionHandler.Create)
	programas.Put("/:id", authMiddleware.RequireRole("SUPER_ADMIN", "SUPERINTENDENTE"), programaPredicacionHandler.Update)
	programas.Delete("/:id", authMiddleware.RequireRole("SUPER_ADMIN", "SUPERINTENDENTE"), programaPredicacionHandler.Delete)

	// Programa de Visita routes
	visitasGroup := protected.Group("/programas-visita")
	visitasGroup.Get("/", programaVisitaHandler.List)
	visitasGroup.Get("/by-fecha", programaVisitaHandler.GetByFecha)
	visitasGroup.Post("/", authMiddleware.RequireRole("SUPER_ADMIN", "SUPERINTENDENTE", "OBSERVADOR"), programaVisitaHandler.Create)
	visitasGroup.Put("/:id", authMiddleware.RequireRole("SUPER_ADMIN", "SUPERINTENDENTE", "OBSERVADOR"), programaVisitaHandler.Update)
	visitasGroup.Delete("/:id", authMiddleware.RequireRole("SUPER_ADMIN", "SUPERINTENDENTE"), programaVisitaHandler.Delete)
	visitasGroup.Put("/:id/visited", authMiddleware.RequireRole("SUPER_ADMIN", "SUPERINTENDENTE", "OBSERVADOR"), programaVisitaHandler.SetVisited)

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
