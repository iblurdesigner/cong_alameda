package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL string
	JWTSecret   string
	JWTExpiry   int // hours
	Port        string
	Env         string
	FrontendURL string
	UploadDir   string
	// Email configuration
	SMTPEnabled  bool
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://app:password@localhost:5432/cong_alameda?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-super-secret-key-change-in-production"),
		JWTExpiry:   getEnvInt("JWT_EXPIRY_HOURS", 24),
		Port:        getEnv("PORT", "8080"),
		Env:         getEnv("ENV", "development"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:4200"),
		UploadDir:   getEnv("UPLOADS_DIR", "./uploads"),
		// Email configuration
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", "noreply@congalameda.org"),
		FromName:     getEnv("FROM_NAME", "Congregación Alameda"),
		SMTPEnabled:  getEnvBool("SMTP_ENABLED", false),
	}
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		return value == "true" || value == "1" || value == "yes"
	}
	return defaultValue
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
