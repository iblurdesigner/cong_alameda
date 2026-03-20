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
}

func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://app:password@localhost:5432/cong_alameda?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-super-secret-key-change-in-production"),
		JWTExpiry:   getEnvInt("JWT_EXPIRY_HOURS", 24),
		Port:        getEnv("PORT", "8080"),
		Env:         getEnv("ENV", "development"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:4200"),
	}
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
